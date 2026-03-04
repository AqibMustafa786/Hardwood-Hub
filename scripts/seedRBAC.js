const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../service-account.json');

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

const seedRBAC = async () => {
    console.log('🚀 Initializing Enterprise RBAC Roles...');

    const roles = [
        {
            id: 'superAdmin',
            name: 'Super Admin',
            description: 'Full system access (God Mode)',
            permissions: ['*.*.*']
        },
        {
            id: 'admin',
            name: 'Administrator',
            description: 'Can manage most system assets but limited on settings.',
            permissions: [
                'dashboard.view',
                'employees.*',
                'categories.*',
                'skills.*',
                'tasks.*',
                'performance.*',
                'progress.*',
                'knowledgebase.*'
            ]
        },
        {
            id: 'supervisor',
            name: 'Supervisor',
            description: 'Can manage tasks and view employee performance.',
            permissions: [
                'dashboard.view',
                'tasks.*',
                'employees.view',
                'performance.view',
                'progress.view',
                'knowledgebase.view'
            ]
        },
        {
            id: 'crewMember',
            name: 'Crew Member',
            description: 'Standard employee access.',
            permissions: [
                'dashboard.view',
                'tasks.view',
                'tasks.comment',
                'progress.view',
                'knowledgebase.view',
                'profile.view',
                'profile.update'
            ]
        }
    ];

    console.log('📦 Seeding Roles...');
    for (const role of roles) {
        await db.collection('roles').doc(role.id).set(role);
        console.log(`✅ Role initialized: ${role.name}`);
    }

    // Update existing Super Admins
    const superAdmins = [
        "aqib2k1@gmail.com",
        "admin@aivisualpro.com",
        "michael@annarborhardwoods.com"
    ];

    console.log('🛡️ Updating Super Admin Users...');
    const usersSnap = await db.collection('users').get();
    for (const doc of usersSnap.docs) {
        const userData = doc.data();
        if (superAdmins.includes(userData.email)) {
            await doc.ref.update({
                roleIds: ['superAdmin'],
                role: 'superAdmin'
            });
            console.log(`✨ Updated ${userData.email} with Super Admin role.`);
        } else {
            // Default others to crewMember for safety during migration
            await doc.ref.update({
                roleIds: [userData.role || 'crewMember']
            });
        }
    }

    console.log('\n✨ RBAC Initialized Successfully!');
};

seedRBAC().catch(err => {
    console.error('❌ Error Seeding RBAC:', err);
    process.exit(1);
});
