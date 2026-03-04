const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
    const users = await db.collection("users").get();
    let quote = null;
    let bobby = null;

    users.forEach(doc => {
        const u = doc.data();
        if (u.name && u.name.includes("Quote")) quote = u;
        if (u.name && u.name.includes("Bobby")) bobby = u;
    });

    console.log("Quote:", quote);
    console.log("Bobby:", bobby);
}
run();
