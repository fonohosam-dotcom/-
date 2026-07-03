const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

// Add firebase-admin import at the top
code = code.replace(/import express from "express";/, 'import express from "express";\nimport admin from "firebase-admin";');

// Overwrite startServer to initialize Firebase and fetch state
code = code.replace(/async function startServer\(\) \{/, `
let db = null;

async function startServer() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp();
      db = admin.firestore();
      console.log("Firebase Admin Initialized connected to Firestore");
    } catch (e) {
      console.error("Firebase Auth failed", e);
    }
  }

  if (db) {
    try {
      const doc = await db.collection("system").doc("state").get();
      if (doc.exists) {
        const data = doc.data();
        state = { ...state, ...data };
        console.log("State synchronized from Firestore");
      }
    } catch(e) {
      console.error("Failed to read from Firestore, using local state", e);
    }
  }
`);

// Overwrite saveState to sync to Firebase
code = code.replace(/function saveState\(\) \{[\s\S]*?fs\.writeFileSync\(STATE_FILE, JSON\.stringify\(state, null, 2\), "utf-8"\);[\s\S]*?\}/, `function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
    if (db) {
       // Fire and forget upload to avoid blocking HTTP response
       db.collection("system").doc("state").set(state).catch(e => console.error("Firestore sync error", e));
    }
  } catch (e) {
    console.error("Failed to persist state file", e);
  }
}`);

fs.writeFileSync('server.ts', code, 'utf-8');
