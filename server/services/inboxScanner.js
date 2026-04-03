const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Known spam/newsletter patterns
const SPAM_SENDER_PATTERNS = [
  /noreply/i, /no-reply/i, /donotreply/i, /mailer/i, /newsletter/i,
  /notifications?@/i, /updates?@/i, /alerts?@/i, /promotions?@/i,
  /offers?@/i, /deals?@/i, /sales?@/i, /marketing@/i, /info@/i,
  /support@/i, /hello@/i, /team@/i, /contact@/i, /news@/i,
];

const PROMO_KEYWORDS = [
  'unsubscribe', 'opt-out', 'optout', 'manage preferences', 'manage your subscriptions',
  'you are receiving this', 'click here to unsubscribe', 'email preferences',
  'remove yourself', 'stop receiving', 'list-unsubscribe',
];

const SPAM_SUBJECT_PATTERNS = [
  /\b(sale|off|discount|deal|offer|promo|free|win|won|prize|claim|urgent|limited|expire|expire[sd]?)\b/i,
  /\b(congratulations|you('ve| have) been selected|exclusive|special offer|don't miss)\b/i,
  /\b(crypto|bitcoin|investment|trading|forex|earn \$|make money|passive income)\b/i,
  /\b(verify (your|account)|confirm (your|account)|unusual (activity|sign))\b/i,
  /[\$\€\£]\d+|\d+[\$\€\£]/,
  /\b\d+%\s*(off|discount)\b/i,
];

const NSFW_SUBJECT_PATTERNS = [
  /\b(18\+|nsfw|xxx|porn|hookup|dating|singles?|lonely|mature|cam|cams|webcam|nudes?|naked|milf|sugar daddy|sugar baby|explicit|fuck|bitch|slut|whore)\b/i,
  /\b(meet (local|tonight)|hot girls|casual sex|no strings attached|discreet)\b/i,
  /\b(viagra|cialis|erection|enlargement|penis|pill[s]?)\b/i,
];

// Get IMAP host config based on email domain
const getImapConfig = (email, password) => {
  const domain = email.split('@')[1]?.toLowerCase();

  const configs = {
    'gmail.com': { host: 'imap.gmail.com', port: 993, tls: true },
    'googlemail.com': { host: 'imap.gmail.com', port: 993, tls: true },
    'outlook.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'hotmail.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'live.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'msn.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'yahoo.com': { host: 'imap.mail.yahoo.com', port: 993, tls: true },
    'ymail.com': { host: 'imap.mail.yahoo.com', port: 993, tls: true },
    'icloud.com': { host: 'imap.mail.me.com', port: 993, tls: true },
    'me.com': { host: 'imap.mail.me.com', port: 993, tls: true },
    'aol.com': { host: 'imap.aol.com', port: 993, tls: true },
    'protonmail.com': { host: 'imap.protonmail.com', port: 993, tls: true },
    'proton.me': { host: 'imap.protonmail.com', port: 993, tls: true },
  };

  const base = configs[domain] || { host: `imap.${domain}`, port: 993, tls: true };

  return {
    ...base,
    user: email,
    password,
    authTimeout: 10000,
    connTimeout: 15000,
    tlsOptions: { rejectUnauthorized: false },
  };
};

// Connect to IMAP and stream messages
const connectAndScan = (email, password, folderName = 'INBOX') => {
  return new Promise((resolve, reject) => {
    const config = getImapConfig(email, password);
    const imap = new Imap(config);

    const emails = [];
    let totalMessages = 0;

    imap.once('ready', () => {
      imap.openBox(folderName, true, (err, box) => {
        if (err) {
          imap.end();
          return reject(new Error(`Cannot open ${folderName}: ${err.message}`));
        }

        totalMessages = box.messages.total;

        if (totalMessages === 0) {
          imap.end();
          return resolve({ emails: [], totalMessages: 0 });
        }

        // Fetch the most recent 300 emails (headers only for speed)
        const fetchCount = Math.min(totalMessages, 300);
        const start = Math.max(1, totalMessages - fetchCount + 1);
        const range = `${start}:${totalMessages}`;

        const fetch = imap.seq.fetch(range, {
          bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE LIST-UNSUBSCRIBE X-MAILER REPLY-TO)',
          struct: false,
        });

        fetch.on('message', (msg, seqno) => {
          const emailData = { seqno, uid: null };

          msg.on('body', (stream) => {
            let buffer = '';
            stream.on('data', (chunk) => { buffer += chunk.toString('utf8'); });
            stream.once('end', () => {
              const headers = Imap.parseHeader(buffer);
              emailData.from = headers.from?.[0] || '';
              emailData.subject = headers.subject?.[0] || '(No subject)';
              emailData.date = headers.date?.[0] || '';
              emailData.listUnsubscribe = headers['list-unsubscribe']?.[0] || null;
              emailData.xMailer = headers['x-mailer']?.[0] || null;
              emailData.replyTo = headers['reply-to']?.[0] || null;
            });
          });

          msg.once('attributes', (attrs) => {
            emailData.uid = attrs.uid;
            emailData.flags = attrs.flags || [];
          });

          msg.once('end', () => {
            emails.push(emailData);
          });
        });

        fetch.once('error', (err) => {
          console.error('Fetch error:', err);
        });

        fetch.once('end', () => {
          imap.end();
        });
      });
    });

    imap.once('end', () => {
      resolve({ emails, totalMessages });
    });

    imap.once('error', (err) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });

    imap.connect();
  });
};

// Categorize a single email
const categorizeEmail = (email) => {
  const from = email.from || '';
  const subject = email.subject || '';
  const hasUnsubscribe = !!email.listUnsubscribe || 
    PROMO_KEYWORDS.some(kw => subject.toLowerCase().includes(kw));

  let categories = [];
  let spamScore = 0;

  // Check for newsletter/promo List-Unsubscribe header (most reliable)
  if (email.listUnsubscribe) {
    categories.push('newsletter');
    spamScore += 3;
  }

  // Check sender pattern
  if (SPAM_SENDER_PATTERNS.some(p => p.test(from))) {
    categories.push('automated');
    spamScore += 2;
  }

  // Check subject for explicit/adult Content
  if (NSFW_SUBJECT_PATTERNS.some(p => p.test(subject))) {
    categories.push('explicit');
    spamScore += 5; // Extra high penalty for 18+ content
  }

  // Check subject for spam keywords
  if (SPAM_SUBJECT_PATTERNS.some(p => p.test(subject))) {
    categories.push('promotional');
    spamScore += 2;
  }

  // Check for promo body keywords in subject
  if (PROMO_KEYWORDS.some(kw => subject.toLowerCase().includes(kw))) {
    categories.push('newsletter');
    spamScore += 1;
  }

  // Bulk mailers
  if (email.xMailer) {
    categories.push('bulk');
    spamScore += 1;
  }

  // Deduplicate categories
  categories = [...new Set(categories)];

  return {
    ...email,
    categories,
    spamScore,
    hasUnsubscribe,
    isJunk: spamScore >= 2,
  };
};

// Main scan function
const scanInbox = async (email, password) => {
  console.log(`📬 Scanning inbox for: ${email}`);

  const { emails: rawEmails, totalMessages } = await connectAndScan(email, password);

  const categorized = rawEmails.map(categorizeEmail);

  // Group by sender for "bulk sender" detection
  const senderMap = {};
  for (const e of categorized) {
    const senderKey = extractSenderEmail(e.from);
    if (!senderMap[senderKey]) senderMap[senderKey] = [];
    senderMap[senderKey].push(e);
  }

  // Mark bulk senders (5+ emails from same address = bulk)
  for (const [sender, msgs] of Object.entries(senderMap)) {
    if (msgs.length >= 5) {
      msgs.forEach(m => {
        if (!m.categories.includes('bulk_sender')) m.categories.push('bulk_sender');
        m.spamScore += 1;
        m.isJunk = m.spamScore >= 2;
      });
    }
  }

  const junk = categorized.filter(e => e.isJunk);
  const newsletters = categorized.filter(e => e.categories.includes('newsletter'));
  const promotional = categorized.filter(e => e.categories.includes('promotional'));
  const automated = categorized.filter(e => e.categories.includes('automated'));
  const explicit = categorized.filter(e => e.categories.includes('explicit'));
  const bulkSenders = Object.entries(senderMap)
    .filter(([, msgs]) => msgs.length >= 5)
    .map(([sender, msgs]) => ({
      sender,
      count: msgs.length,
      latestSubject: msgs[msgs.length - 1]?.subject,
      latestDate: msgs[msgs.length - 1]?.date,
      uids: msgs.map(m => m.uid).filter(Boolean),
      hasUnsubscribe: msgs.some(m => m.hasUnsubscribe),
      unsubscribeLink: msgs.find(m => m.listUnsubscribe)?.listUnsubscribe || null,
    }))
    .sort((a, b) => b.count - a.count);

  console.log(`✅ Scan complete: ${junk.length} junk emails found in ${categorized.length} scanned`);

  return {
    totalScanned: categorized.length,
    totalInbox: totalMessages,
    junkCount: junk.length,
    newsletterCount: newsletters.length,
    promotionalCount: promotional.length,
    automatedCount: automated.length,
    explicitCount: explicit.length,
    bulkSenders: bulkSenders.slice(0, 50),
    junkEmails: junk.slice(0, 100).map(e => ({
      uid: e.uid,
      seqno: e.seqno,
      from: e.from,
      subject: e.subject,
      date: e.date,
      categories: e.categories,
      spamScore: e.spamScore,
      hasUnsubscribe: e.hasUnsubscribe,
      unsubscribeLink: e.listUnsubscribe || null,
    })),
  };
};

// Helper for chunking UIDs to avoid socket overloads
const chunkArray = (arr, size) => arr.length ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)] : [];

// Delete emails by UID
const deleteEmailsByUid = async (email, password, uids) => {
  return new Promise((resolve, reject) => {
    const config = getImapConfig(email, password);
    const imap = new Imap(config);

    imap.once('ready', () => {
      imap.openBox('INBOX', false, async (err) => {
        if (err) { imap.end(); return reject(err); }

        try {
          const chunks = chunkArray(uids, 100);
          for (const chunk of chunks) {
            await new Promise((res, rej) => {
              imap.uid.addFlags(chunk, '\\Deleted', (err) => {
                if (err) rej(err); else res();
              });
            });
          }
          // Expunge once all chunks are flagged
          imap.expunge((err) => {
            if (err) { imap.end(); return reject(err); }
            imap.end();
          });
        } catch (e) {
          imap.end();
          reject(e);
        }
      });
    });

    imap.once('end', () => resolve({ deleted: uids.length }));
    imap.once('error', (err) => reject(new Error(`Delete failed: ${err.message}`)));
    imap.connect();
  });
};

// Move emails to Trash
const moveEmailsToTrash = async (email, password, uids) => {
  return new Promise((resolve, reject) => {
    const config = getImapConfig(email, password);
    const imap = new Imap(config);

    imap.once('ready', () => {
      // First find the Trash folder name
      imap.getBoxes((err, boxes) => {
        if (err) { imap.end(); return reject(err); }

        const trashFolder = findTrashFolder(boxes);

        imap.openBox('INBOX', false, async (err) => {
          if (err) { imap.end(); return reject(err); }

          try {
            const chunks = chunkArray(uids, 100);
            for (const chunk of chunks) {
              await new Promise((res, rej) => {
                if (trashFolder) {
                  imap.uid.move(chunk, trashFolder, (moveErr) => {
                    if (moveErr) {
                      // Fallback: just mark deleted
                      imap.uid.addFlags(chunk, '\\Deleted', (delErr) => delErr ? rej(delErr) : res());
                    } else {
                      res();
                    }
                  });
                } else {
                  imap.uid.addFlags(chunk, '\\Deleted', (delErr) => delErr ? rej(delErr) : res());
                }
              });
            }

            // Expunge once at end for any deletions
            imap.expunge((err) => {
              imap.end();
            });
          } catch (e) {
            imap.end();
            reject(e);
          }
        });
      });
    });

    imap.once('end', () => resolve({ moved: uids.length }));
    imap.once('error', (err) => reject(new Error(`Move failed: ${err.message}`)));
    imap.connect();
  });
};

// Test connection only
const testConnection = async (email, password) => {
  return new Promise((resolve, reject) => {
    const config = getImapConfig(email, password);
    const imap = new Imap(config);
    let connected = false;

    imap.once('ready', () => {
      connected = true;
      imap.end();
    });

    imap.once('end', () => {
      if (connected) resolve({ success: true });
    });

    imap.once('error', (err) => {
      reject(new Error(err.message));
    });

    imap.connect();
  });
};

// Helper: extract plain email from "Name <email@x.com>" format
const extractSenderEmail = (from) => {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : from.toLowerCase().trim();
};

// Helper: find trash folder in box list
const findTrashFolder = (boxes, prefix = '') => {
  for (const [name, box] of Object.entries(boxes || {})) {
    const fullName = prefix ? `${prefix}${name}` : name;
    const attribs = box.attribs || [];
    if (attribs.includes('\\Trash') || /trash|deleted/i.test(name)) {
      return fullName;
    }
    if (box.children) {
      const found = findTrashFolder(box.children, fullName + (box.delimiter || '/'));
      if (found) return found;
    }
  }
  return null;
};

module.exports = { scanInbox, deleteEmailsByUid, moveEmailsToTrash, testConnection };
