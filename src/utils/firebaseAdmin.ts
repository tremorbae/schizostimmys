import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const base64PrivateKey = process.env.FIREBASE_PRIVATE_KEY_BASE64;

  let privateKey: string | undefined;

  if (rawPrivateKey) {
    privateKey = rawPrivateKey.replace(/\\n/g, '\n').replace(/-----BEGIN PRIVATE KEY-----\s*/, '-----BEGIN PRIVATE KEY-----\n').replace(/\s*-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');
  } else if (base64PrivateKey) {
    try {
      privateKey = Buffer.from(base64PrivateKey, 'base64').toString('utf8');
      privateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----\s*/, '-----BEGIN PRIVATE KEY-----\n').replace(/\s*-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');
    } catch (error) {
      throw new Error('Invalid FIREBASE_PRIVATE_KEY_BASE64 value');
    }
  }

  // Validate private key format
  if (privateKey && !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Invalid private key format - must include PEM headers');
  }

  if (!projectId || !clientEmail || !privateKey) {
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error: any) {
      // Don't throw during build, just log the error
      if (process.env.NODE_ENV === 'development') {
        // Silently handle in development to avoid noise
      }
    }
  }
}

function getFirestore() {
  if (!admin.apps.length) {
    throw new Error('Firebase is not initialized - check environment variables');
  }
  return admin.firestore();
}

export const firestore = admin.apps.length ? admin.firestore() : (null as any);
export const FieldValue = admin.firestore.FieldValue;
export { admin, getFirestore };
