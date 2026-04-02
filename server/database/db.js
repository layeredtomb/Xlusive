const mongoose = require('mongoose');

// Global cache to prevent connection exhaustion in serverless environments
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb) return cachedDb;

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI is missing from environment variables. Database features will be disabled.');
    return null;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000 // timeout after 5 seconds instead of 30
    });
    console.log('✓ Connected to MongoDB');
    cachedDb = db;
    return db;
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    throw err;
  }
};

const initializeDatabase = async () => {
  if (process.env.NODE_ENV !== 'production') {
    await connectToDatabase();
  }
  // in production (Vercel serverless), connections evaluate lazy upon requests.
};

// ──────────────────────────────────────────────
// Schemas & Models
// ──────────────────────────────────────────────
const phoneCheckSchema = new mongoose.Schema({
  phoneNumber: String,
  foundInLeaks: Boolean,
  leakSources: Array,
  type: { type: String, default: 'phone' },
  checkedAt: { type: Date, default: Date.now }
});

const emailCheckSchema = new mongoose.Schema({
  identifier: String, 
  email: String,      // Backwards compatibility alias
  foundInLeaks: Boolean,
  leakSources: Array,
  type: { type: String, default: 'email' },
  checkedAt: { type: Date, default: Date.now }
});

const PhoneCheck = mongoose.models.PhoneCheck || mongoose.model('PhoneCheck', phoneCheckSchema);
const EmailCheck = mongoose.models.EmailCheck || mongoose.model('EmailCheck', emailCheckSchema);

// ──────────────────────────────────────────────
// CRUD Operations
// ──────────────────────────────────────────────

const storeCheckResult = async (phoneNumber, foundInLeaks, leakSources) => {
  const db = await connectToDatabase();
  if (!db) return null;

  try {
    const result = new PhoneCheck({ phoneNumber, foundInLeaks, leakSources });
    await result.save();
    console.log(`✓ Phone check stored for ${phoneNumber}`);
    return result._id;
  } catch (e) {
    console.error('Error storing phone result:', e);
    return null;
  }
};

const getCheckHistory = async () => {
  const db = await connectToDatabase();
  if (!db) return [];
  try {
    const docs = await PhoneCheck.find().sort({ checkedAt: -1 }).limit(50).lean();
    return docs.map(doc => ({ ...doc, id: doc._id.toString() }));
  } catch (e) {
    console.error('Error fetching phone history:', e);
    return [];
  }
};

const storeEmailCheckResult = async (email, foundInLeaks, leakSources) => {
  const db = await connectToDatabase();
  if (!db) return null;
  try {
    const result = new EmailCheck({ email, identifier: email, foundInLeaks, leakSources });
    await result.save();
    console.log(`✓ Email check stored for ${email}`);
    return result._id;
  } catch (e) {
    console.error('Error storing email result:', e);
    return null;
  }
};

const getEmailCheckHistory = async () => {
  const db = await connectToDatabase();
  if (!db) return [];
  try {
    const docs = await EmailCheck.find().sort({ checkedAt: -1 }).limit(50).lean();
    return docs.map(doc => ({ ...doc, id: doc._id.toString() }));
  } catch (e) {
    console.error('Error fetching email history:', e);
    return [];
  }
};

const getAllHistory = async () => {
  const db = await connectToDatabase();
  if (!db) return [];
  try {
    const [phones, emails] = await Promise.all([
      PhoneCheck.find().sort({ checkedAt: -1 }).limit(50).lean(),
      EmailCheck.find().sort({ checkedAt: -1 }).limit(50).lean()
    ]);
    
    // Normalize and combine
    const combined = [
      ...phones.map(p => ({ ...p, id: p._id.toString(), identifier: p.phoneNumber, type: 'phone' })),
      ...emails.map(e => ({ ...e, id: e._id.toString(), identifier: e.email || e.identifier, type: 'email' }))
    ];
    
    return combined.sort((a, b) => b.checkedAt - a.checkedAt).slice(0, 100);
  } catch (e) {
    console.error('Error fetching all history:', e);
    return [];
  }
};

const storeRemovalRequest = async (identifier, leakSource) => {
  // Mock function if needed, keeping signature the same
  return true;
};

const closeDatabase = async () => {
  if (cachedDb) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    cachedDb = null;
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
