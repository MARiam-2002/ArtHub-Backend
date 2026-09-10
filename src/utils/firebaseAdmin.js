import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const missingVars = requiredEnvVars.filter(
  varName => !process.env[varName] || !String(process.env[varName]).trim()
);
let firebaseReady = false;

/**
 * Normalize Firebase private keys pasted into Vercel env vars.
 * Handles quoted values, literal \n, and missing PEM headers.
 */
const normalizePrivateKey = raw => {
  if (!raw) return raw;
  let key = String(raw).trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  // Turn escaped newlines into real newlines
  key = key.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');

  // If the key body was pasted without headers, wrap it
  if (!key.includes('BEGIN') && key.includes('MII')) {
    const body = key.replace(/\s+/g, '\n');
    key = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
  }

  return key;
};

if (missingVars.length > 0) {
  console.error(
    '⚠️ Missing Firebase environment variables (Firebase auth disabled):',
    missingVars
  );
} else if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });

    firebaseReady = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`📱 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    console.error('⚠️ Continuing without Firebase Admin (JWT auth still available)');
  }
} else {
  firebaseReady = true;
}

export const isFirebaseReady = () => firebaseReady || admin.apps.length > 0;

export default admin;
