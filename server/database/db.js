const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'xlusiveChecker.db');
let db;

const initializeDatabase = () => {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('✓ Database connected');

      // Phone check results
      db.run(`
        CREATE TABLE IF NOT EXISTS check_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phoneNumber TEXT NOT NULL,
          foundInLeaks BOOLEAN NOT NULL,
          leakSources TEXT,
          checkedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Email check results
      db.run(`
        CREATE TABLE IF NOT EXISTS email_check_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          foundInLeaks BOOLEAN NOT NULL,
          leakSources TEXT,
          checkedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS removal_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          identifier TEXT NOT NULL,
          leakSource TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          completedAt DATETIME
        )
      `);
    }
  });
};

// ======= PHONE =======
const storeCheckResult = (phoneNumber, foundInLeaks, leakSources) => {
  return new Promise((resolve, reject) => {
    const leakSourcesJson = JSON.stringify(leakSources);
    db.run(
      `INSERT INTO check_results (phoneNumber, foundInLeaks, leakSources) VALUES (?, ?, ?)`,
      [phoneNumber, foundInLeaks ? 1 : 0, leakSourcesJson],
      function (err) {
        if (err) { console.error('Error storing check result:', err); reject(err); }
        else { console.log(`✓ Phone check stored for ${phoneNumber}`); resolve(this.lastID); }
      }
    );
  });
};

const getCheckHistory = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM check_results ORDER BY checkedAt DESC LIMIT 50`, [], (err, rows) => {
      if (err) { reject(err); }
      else {
        resolve(rows.map((row) => ({
          ...row,
          type: 'phone',
          leakSources: JSON.parse(row.leakSources || '[]'),
        })));
      }
    });
  });
};

// ======= EMAIL =======
const storeEmailCheckResult = (email, foundInLeaks, leakSources) => {
  return new Promise((resolve, reject) => {
    const leakSourcesJson = JSON.stringify(leakSources);
    db.run(
      `INSERT INTO email_check_results (email, foundInLeaks, leakSources) VALUES (?, ?, ?)`,
      [email, foundInLeaks ? 1 : 0, leakSourcesJson],
      function (err) {
        if (err) { console.error('Error storing email result:', err); reject(err); }
        else { console.log(`✓ Email check stored for ${email}`); resolve(this.lastID); }
      }
    );
  });
};

const getEmailCheckHistory = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM email_check_results ORDER BY checkedAt DESC LIMIT 50`, [], (err, rows) => {
      if (err) { reject(err); }
      else {
        resolve(rows.map((row) => ({
          ...row,
          type: 'email',
          identifier: row.email,
          leakSources: JSON.parse(row.leakSources || '[]'),
        })));
      }
    });
  });
};

// Combined history (phone + email, sorted by date)
const getAllHistory = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const [phones, emails] = await Promise.all([getCheckHistory(), getEmailCheckHistory()]);
      const combined = [
        ...phones.map(p => ({ ...p, identifier: p.phoneNumber, type: 'phone' })),
        ...emails,
      ].sort((a, b) => new Date(b.checkedAt) - new Date(a.checkedAt)).slice(0, 100);
      resolve(combined);
    } catch (err) {
      reject(err);
    }
  });
};

const storeRemovalRequest = (identifier, leakSource) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO removal_requests (identifier, leakSource) VALUES (?, ?)`,
      [identifier, leakSource],
      function (err) {
        if (err) { reject(err); }
        else { resolve(this.lastID); }
      }
    );
  });
};

const closeDatabase = () => {
  if (db) {
    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      else console.log('Database connection closed');
    });
  }
};

module.exports = {
  initializeDatabase,
  storeCheckResult,
  getCheckHistory,
  storeEmailCheckResult,
  getEmailCheckHistory,
  getAllHistory,
  storeRemovalRequest,
  closeDatabase,
};
