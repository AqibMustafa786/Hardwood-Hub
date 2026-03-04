const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../service-account.json');

try {
    initializeApp({
        credential: cert(serviceAccount)
    });
} catch (error) {
    if (!/already exists/.test(error.message)) {
        console.error('Firebase initialization error', error.stack);
    }
}

const db = getFirestore();

async function fixKnowledgebase() {
    console.log("Starting knowledgebase update...");
    const kbRef = db.collection('knowledgebase');
    const snapshot = await kbRef.get();

    // Delete all existing documents
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log("Deleted old knowledgebase documents.");

    // Add new documents
    await kbRef.add({
        topic: "sanding",
        description: "Sanding sequence goes here",
        number: "01",
        image: "",
        file: "",
        link: ""
    });

    await kbRef.add({
        topic: "Installation",
        description: "Installation process goes here",
        number: "02",
        image: "",
        file: "",
        link: ""
    });

    console.log("Added new knowledgebase documents.");
}

fixKnowledgebase().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
