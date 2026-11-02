const admin = require('firebase-admin');
const fs = require('fs');
const env = require('./env');
const logger = require('../utils/logger');

const initFirebase = () => {
  const serviceAccountKey = env.firebase.serviceAccountKey;
  const projectId = env.firebase.projectId;

  if (!serviceAccountKey) {
    logger.info('Firebase Admin SDK service account key not provided. Local token authentication active.');
    return;
  }

  try {
    let credentialData;
    if (serviceAccountKey.trim().startsWith('{')) {
      credentialData = JSON.parse(serviceAccountKey);
    } else {
      if (fs.existsSync(serviceAccountKey)) {
        credentialData = JSON.parse(fs.readFileSync(serviceAccountKey, 'utf8'));
      } else {
        const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf8');
        credentialData = JSON.parse(decoded);
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(credentialData),
      projectId: projectId || credentialData.project_id,
    });
    logger.info('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    logger.error(`Firebase Admin initialization failed: ${error.message}`);
  }
};

module.exports = initFirebase;
