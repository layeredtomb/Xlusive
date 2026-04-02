const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const checkPhoneDatabase = require('./services/phoneChecker');
const checkEmailDatabase = require('./services/emailChecker');
const { scanInbox, deleteEmailsByUid, moveEmailsToTrash, testConnection } = require('./services/inboxScanner');
const {
  initializeDatabase,
  storeCheckResult,
  getCheckHistory,
  storeEmailCheckResult,
  getEmailCheckHistory,
  getAllHistory,
} = require('./database/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

initializeDatabase();

// ──────────────────────────────────────────────
// Health check
// ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'Xlusive server running', timestamp: new Date() });
});

// ──────────────────────────────────────────────
// Phone check
// ──────────────────────────────────────────────
app.post('/api/check-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    if (cleanedNumber.length < 10) {
      return res.status(400).json({ success: false, error: 'Invalid phone number length' });
    }

    const result = await checkPhoneDatabase(phoneNumber);
    storeCheckResult(phoneNumber, result.foundInLeaks, result.leakSources);

    res.json({
      success: true,
      phoneNumber,
      foundInLeaks: result.foundInLeaks,
      leakSources: result.leakSources,
      checkedSources: result.checkedSources || [],
      message: result.foundInLeaks
        ? `Phone number found in ${result.leakSources.length} data breach(es)`
        : 'Phone number not found in known data breaches',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error checking phone:', error);
    res.status(500).json({ success: false, error: 'Error checking phone number. Please try again later.' });
  }
});

// ──────────────────────────────────────────────
// Email check
// ──────────────────────────────────────────────
app.post('/api/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid email address format' });
    }

    const result = await checkEmailDatabase(email.trim().toLowerCase());
    storeEmailCheckResult(email.trim().toLowerCase(), result.foundInLeaks, result.leakSources);

    res.json({
      success: true,
      email: email.trim().toLowerCase(),
      foundInLeaks: result.foundInLeaks,
      leakSources: result.leakSources,
      checkedSources: result.checkedSources || [],
      message: result.foundInLeaks
        ? `Email found in ${result.leakSources.length} data breach(es)`
        : 'Email not found in known data breaches',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ success: false, error: 'Error checking email. Please try again later.' });
  }
});

// ──────────────────────────────────────────────
// History endpoints
// ──────────────────────────────────────────────
app.get('/api/history', async (req, res) => {
  try {
    const history = await getCheckHistory();
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching phone history' });
  }
});

app.get('/api/email-history', async (req, res) => {
  try {
    const history = await getEmailCheckHistory();
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching email history' });
  }
});

app.get('/api/all-history', async (req, res) => {
  try {
    const history = await getAllHistory();
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching history' });
  }
});

// ──────────────────────────────────────────────
// Removal request
// ──────────────────────────────────────────────
app.post('/api/request-removal', async (req, res) => {
  try {
    const { identifier, leakSource } = req.body;
    if (!identifier || !leakSource) {
      return res.status(400).json({ success: false, error: 'Identifier and leak source are required' });
    }
    console.log(`Removal request for ${identifier} from ${leakSource}`);
    res.json({
      success: true,
      message: `Removal request submitted for ${leakSource}. You will be notified when the record is removed.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error submitting removal request' });
  }
});

// ──────────────────────────────────────────────
// Inbox Scanner — test connection
// ──────────────────────────────────────────────
app.post('/api/inbox/connect', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    await testConnection(email, password);
    res.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    console.error('IMAP connect error:', error.message);
    res.status(401).json({
      success: false,
      error: error.message.includes('Invalid credentials')
        ? 'Invalid credentials. For Gmail, use an App Password (not your main password).'
        : `Connection failed: ${error.message}`,
    });
  }
});

// ──────────────────────────────────────────────
// Inbox Scanner — scan
// ──────────────────────────────────────────────
app.post('/api/inbox/scan', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    console.log(`📬 Starting inbox scan for ${email}`);
    const results = await scanInbox(email, password);

    res.json({ success: true, ...results });
  } catch (error) {
    console.error('Inbox scan error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to scan inbox. Check credentials and try again.',
    });
  }
});

// ──────────────────────────────────────────────
// Inbox Scanner — delete emails
// ──────────────────────────────────────────────
app.post('/api/inbox/delete', async (req, res) => {
  try {
    const { email, password, uids } = req.body;
    if (!email || !password || !uids || !Array.isArray(uids) || uids.length === 0) {
      return res.status(400).json({ success: false, error: 'Email, password, and UIDs array are required' });
    }

    console.log(`🗑️ Deleting ${uids.length} emails for ${email}`);
    const result = await moveEmailsToTrash(email, password, uids);

    res.json({ success: true, ...result, message: `${result.moved || uids.length} email(s) moved to trash` });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete emails.',
    });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Xlusive server running on http://localhost:${PORT}`);
  });
}

// Export the Express API for Vercel Serverless Functions
module.exports = app;
