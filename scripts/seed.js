#!/usr/bin/env node
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file with Firestore access.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath)
});

const db = admin.firestore();

const seedFile = path.join(__dirname, '..', 'docs', 'SEED_DATA.json');

async function seed() {
  const raw = await readFile(seedFile, 'utf-8');
  const data = JSON.parse(raw);

  const collections = Object.entries(data);
  for (const [collection, docs] of collections) {
    console.log(`Seeding ${collection} (${docs.length} documents)`);
    for (const doc of docs) {
      const { id, ...payload } = doc;
      const ref = db.collection(collection).doc(id);
      await ref.set(payload, { merge: true });
    }
  }
  console.log('Seed complete');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

