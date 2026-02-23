import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  const base64PrivateKey = process.env.FIREBASE_PRIVATE_KEY_BASE64;

  let privateKey: string | undefined;

  if (rawPrivateKey) {
    privateKey = rawPrivateKey.replace(/\\n/g, '\n');
  } else if (base64PrivateKey) {
    try {
      privateKey = Buffer.from(base64PrivateKey, 'base64').toString('utf8');
    } catch (error) {
      console.error('Failed to decode FIREBASE_PRIVATE_KEY_BASE64');
      throw new Error('Invalid FIREBASE_PRIVATE_KEY_BASE64 value');
    }
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase service account environment variables');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const firestore = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export { admin };
