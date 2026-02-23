// This script was used to bulk-import Phase 2 codes into Firestore.
// It can be deleted now that the codes are imported.
// To re-run, restore the original file and ensure .env.local is set.
// 
// Original content:
// import { admin, firestore } from '../src/lib/firebaseAdmin';
// import codesJson from '../private/phase2-codes.json';
// 
// async function main() {
//   const batch = firestore.batch();
//   const collection = firestore.collection('phase2Codes');
// 
//   codesJson.codes.forEach((code: string) => {
//     const docRef = collection.doc(code.toUpperCase());
//     batch.set(docRef, {
//       used: false,
//       usedAt: null,
//       usedBySubmission: null,
//     });
//   });
// 
//   await batch.commit();
//   console.log(`Imported ${codesJson.codes.length} codes`);
//   await admin.app().delete();
// }
// 
// main().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });
