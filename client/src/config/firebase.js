import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import env from './env';

const firebaseConfig = env.firebase;

let auth = null;

// Only initialize if a valid API key is configured
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('Firebase Client SDK initialized.');
  } catch (error) {
    console.error('Firebase Client SDK initialization failed:', error);
  }
}

export { auth };
