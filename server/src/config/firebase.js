const admin = require('firebase-admin');

const initFirebase = () => {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!serviceAccountKey) {
    console.warn('WARNING: FIREBASE_SERVICE_ACCOUNT_KEY is not defined in .env. Real Firebase Auth will fail; please use mock- tokens for local development.');
    return;
  }

  try {
    let credentialData;
    if (serviceAccountKey.trim().startsWith('{')) {
      credentialData = JSON.parse(serviceAccountKey);
    } else {
      // Treat as path or base64
      try {
        const fs = require('fs');
        if (fs.existsSync(serviceAccountKey)) {
          credentialData = JSON.parse(fs.readFileSync(serviceAccountKey, 'utf8'));
        } else {
          // Try base64 decoding
          const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf8');
          credentialData = JSON.parse(decoded);
        }
      } catch (e) {
        throw new Error('Could not read or parse Firebase service account key: ' + e.message);
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(credentialData),
      projectId: projectId || credentialData.project_id
    });
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error.message);
  }
};

module.exports = initFirebase;
