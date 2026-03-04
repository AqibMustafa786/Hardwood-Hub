const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('../service-account.json');

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

const seedData = async () => {
    console.log('🚀 Starting Deep Seal Seed to Firestore + Auth...');

    const DEFAULT_PASSWORD = 'password123';

    console.log('🧹 Cleaning existing taxonomic collections...');
    const collectionsToClean = ['categories', 'subCategories', 'dropdowns', 'skills'];
    for (const collName of collectionsToClean) {
        const snapshot = await db.collection(collName).get();
        for (const doc of snapshot.docs) {
            await doc.ref.delete();
        }
    }

    // 1. Categories
    const categories = [
        { name: "Sanding", icon: "Layers", priority: 1 },
        { name: "Installation", icon: "Hammer", priority: 2 },
        { name: "Repairs", icon: "Wrench", priority: 3 },
        { name: "Laser Everything", icon: "Zap", priority: 4 },
        { name: "Equipment", icon: "Tool", priority: 5 },
        { name: "Stairs", icon: "Menu", priority: 6 },
        { name: "Identification", icon: "Search", priority: 7 },
        { name: "Administration", icon: "ClipboardList", priority: 8 }
    ];

    console.log('📦 Seeding Categories...');
    const catMap = {};
    for (const cat of categories) {
        const docRef = await db.collection('categories').add(cat);
        catMap[cat.name] = docRef.id;
    }

    // 2. Sub Categories
    const subCategories = [
        // Sanding
        ...[
            "Belt Sander skills", "Buffer skills", "Cabinet scraper skills", "Edger sanding skills",
            "Floor scrubber skills", "Hand sanding skills", "Orbital Sander skills", "Planetary Sander skills",
            "Power hook up skills", "Roller skills", "Site Cleanliness", "Site Protection", "Stain skills",
            "Standard scraper skills", "Steps skills", "Tack Stick skills", "Toe Kick Edger skills",
            "Treads", "Trim Pad/ Brush skills", "Trim/ Door Removal & Installation skills", "Trowel skills",
            "Vacuum Skills", "Vent Installation skills"
        ].map((name, i) => ({ name, categoryId: catMap["Sanding"], priority: i + 1 })),
        // Installation
        ...[
            "Acclimation and Environmental Readings", "Adhesive application", "Close outs", "Demo",
            "fastening", "General skills", "Herringbone floor installation", "Job site Protection",
            "Layout and starter row", "Leveling", "Moisture barriers", "Site Prep", "Subfloor", "Trim and Transitions"
        ].map((name, i) => ({ name, categoryId: catMap["Installation"], priority: i + 1 })),
        // Repairs
        ...[
            "Board replacement", "Hotmelt filler", "Sanding/ top coat repair", "Wax/ putty repairs"
        ].map((name, i) => ({ name, categoryId: catMap["Repairs"], priority: i + 1 })),
        // Equipment
        ...[
            "15-Gauge Finish Nailer", "18-Gauge Brad Nailer", "23-Gauge Micro Pin Nailer", "4\" Grinder",
            "6-Inch Grinder with Diamond Cup Wheel", "Air Compressor", "Air Sled", "Backpack Vac", "Belt Sander",
            "Dehumidifier", "Dust Collection", "Flooring Cleat Nailer", "Flooring stapler", "Jig Saw",
            "Little giant ladder", "Medusaw \"demo saw\"", "Miter saw", "Oscillating Saw", "Powerdrive",
            "Quick Drive Screw Gun", "Rotex 150", "Router", "Safety and PPE", "Sausage gun", "Standard Edger",
            "Table Saw", "Toe kick edger", "Toe Kick saw", "Track Saw", "Under cut saw"
        ].map((name, i) => ({ name, categoryId: catMap["Equipment"], priority: i + 1 })),
        // Stairs
        ...[
            "Demo/ Prep", "Finishing", "Installation", "Sanding"
        ].map((name, i) => ({ name, categoryId: catMap["Stairs"], priority: i + 1 })),
        // Identification
        ...[
            "Buffer Pads", "Dust Collection", "Finishing tools", "Handtools", "Non Standard tools",
            "Power", "Sanders", "Sandpaper Grit", "Sandpaper type", "Site Protection", "Trim & Vents", "Wood Species"
        ].map((name, i) => ({ name, categoryId: catMap["Identification"], priority: i + 1 })),
        // Administration
        ...[
            "ADP", "Apps", "Company cam", "Google calendar", "Invoices/ work orders"
        ].map((name, i) => ({ name, categoryId: catMap["Administration"], priority: i + 1 }))
    ];

    console.log('📦 Seeding Sub-Categories...');
    const subCatMap = {};
    for (const sub of subCategories) {
        const docRef = await db.collection('subCategories').add(sub);
        subCatMap[sub.name] = docRef.id;
    }

    // 3. Dropdowns
    const dropdowns = [
        { label: "Level 1 (Entry)", score: 1, colorCode: "#EF4444", category: "Skill Level" },
        { label: "Level 2 (Developing)", score: 2, colorCode: "#F59E0B", category: "Skill Level" },
        { label: "Level 3 (Proficient)", score: 3, colorCode: "#3B82F6", category: "Skill Level" },
        { label: "Level 4 (Mastery)", score: 4, colorCode: "#10B981", category: "Skill Level" }
    ];

    console.log('📦 Seeding Dropdowns...');
    for (const d of dropdowns) {
        await db.collection('dropdowns').add(d);
    }

    // 4. Skills
    const identificationSkillsRaw = {
        "Handtools": [
            "Cabinet scraper", "Oil/ filler trowel", "Nail set and sizes", "Dewalt sanding light",
            "Block sander", "Corner protectors", "220 cord"
        ],
        "Power": [
            "220 sub panel", "Edger/ buffer cord 15 amp twist lock", "Booster box", "Standard edger"
        ],
        "Sanders": [
            "Toe kick edger", "Belt sander", "Planetary sander \"power drive\"", "Buffer",
            "Buffer driver/clutch plate", "Orbital sander \"air vantage/ mirka\"", "Rotex sander",
            "Main dust colletion system"
        ],
        "Dust Collection": [
            "Ceno dual motor vac \"r2d2\"", "Back pack vac and wand", "Festool vac", "Dirt dragon"
        ],
        "Non Standard tools": [
            "Karcher dual blade", "Accesory set for dirt dragon", "Bona diamond plates for powerdrive",
            "Air scrubber", "Air sled", "Air mover", "Zepher", "Zip walls"
        ],
        "Sandpaper Grit": [
            "36 grit sandpaper", "60 grit sandpaper", "80 grit sandpaper", "100 grit sandpaper",
            "120 grit sandpaper", "180 grit sandpaper"
        ],
        "Buffer Pads": [
            "Clutch plate", "Red pad", "White pad", "White driver pads", "Marron pad",
            "Sattilite plate", "Diamabrush plate \"concrete\"", "Diamabrush plate \"wood\""
        ],
        "Sandpaper type": [
            "Standard edger disc", "Toe kick edger disc", "Belts", "Planetary sander discs",
            "Diamond plates for planetary sander \"powerdive\"",
            "Steel plates for planetary sander \"powerdrive\"",
            "Roll sand paper for buffer", "Orbital disc"
        ],
        "Finishing tools": [
            "Finish roller cover \"black end\"", "Sealer roller cover \"green end\"", "Finish bucket/bags",
            "T-bar", "Finish pole", "Tack stick", "Cut in pads\" and handel\""
        ],
        "Site Protection": [
            "Painters plastic", "Delicate release tape", "Painters tape", "Pro techt finished floor guard",
            "Capetsaver", "Corner protecters", "Zip wall", "6 mill plastic for making doors and rooms"
        ],
        "Trim & Vents": [
            "Shoe", "Quarter round", "Spline", "3 and a half inch bullnose", "5 inch bullnose",
            "Reducer", "Cove moulding", "T moulding", "Base moulding",
            "4 by 10 inch flush mount vent", "4 by 12 inch flush mount vent", "Egg crate vent"
        ],
        "Wood Species": [
            "Red oak", "White oak", "Maple", "Hickory", "Jatoba", "Walnut", "Ash", "Beach", "Pine"
        ]
    };

    const skills = [
        { name: "Demo Skill", categoryId: catMap["Sanding"], subCategoryId: subCatMap["Belt Sander skills"], isRequired: true }
    ];

    Object.entries(identificationSkillsRaw).forEach(([subCat, skillList]) => {
        skillList.forEach(skillName => {
            if (subCatMap[subCat]) {
                skills.push({
                    name: skillName,
                    categoryId: catMap["Identification"],
                    subCategoryId: subCatMap[subCat],
                    isRequired: true
                });
            }
        });
    });

    console.log('📦 Seeding Skills...');
    for (const s of skills) {
        await db.collection('skills').add(s);
    }

    // 5. Employees + Real Data Migration + Permission Matrix
    const employees = [
        { name: "Aqib", email: "aqib2k1@gmail.com", position: "Super Admin", role: "superAdmin", identification: "HH-001" },
        { name: "Adeel Jabbar", email: "admin@aivisualpro.com", position: "Super Admin", role: "superAdmin", identification: "HH-002" },
        { name: "Michael Cornaire", email: "michael@annarborhardwoods.com", position: "Super Admin", role: "superAdmin", identification: "HH-003" },
        { name: "Jordan Evenson", email: "jordan@annarborhardwoods.com", position: "Supervisor", role: "supervisor", identification: "HH-004" },
        { name: "Jacob Gillhouse", email: "jacob@annarborhardwoods.com", position: "Supervisor", role: "supervisor", identification: "HH-005" },
        { name: "Thomas Russell", email: "tomr@annarborhardwoods.com", position: "Supervisor", role: "supervisor", identification: "HH-006" },
        { name: "Bobby Thornton", email: "bobby@annarborhardwoods.com", position: "Crew member", role: "crewMember", identification: "HH-007" },
        { name: "Christopher Parks", email: "christopher@annarborhardwoods.com", position: "Crew member", role: "crewMember", identification: "HH-008" },
        { name: "Ian Kelly", email: "ian@annarborhardwoods.com", position: "Crew member", role: "crewMember", identification: "HH-009" },
        { name: "Quote", email: "quote@annarborhardwoods.com", position: "Crew member", role: "crewMember", identification: "HH-010" },
        { name: "Marcus Gibson", email: "marcus@annarborhardwoods.com", position: "Crew member", role: "crewMember", identification: "HH-011" },
        { name: "Nicole Cornaire", email: "nicole@annarborhardwoods.com", position: "Finance", role: "crewMember", identification: "HH-012" }
    ];

    console.log('🛡️ Migrating Real Users & Setting up Auth...');

    // Clear existing users collection for a fresh start as requested
    console.log('🧹 Cleaning existing users...');
    const existingUsers = await db.collection('users').get();
    for (const doc of existingUsers.docs) {
        await doc.ref.delete();
    }

    for (const emp of employees) {
        try {
            // Check if user exists in Auth
            let authUser;
            try {
                authUser = await auth.getUserByEmail(emp.email);
                // Update password for existing user to ensure sync
                await auth.updateUser(authUser.uid, {
                    password: DEFAULT_PASSWORD,
                    displayName: emp.name
                });
                console.log(`ℹ️ Updated existing Auth user: ${emp.email}`);
            } catch (authErr) {
                // Create user if not exists
                authUser = await auth.createUser({
                    email: emp.email,
                    password: DEFAULT_PASSWORD,
                    displayName: emp.name
                });
                console.log(`✅ Created new Auth user: ${emp.email}`);
            }

            // Define default permissions based on role
            const permissions = {
                dashboard: true,
                employees: emp.role !== 'crewMember',
                skills: emp.role === 'superAdmin',
                categories: emp.role === 'superAdmin',
                performance: emp.role !== 'crewMember',
                progress: true,
                knowledgebase: true,
                settings: emp.role === 'superAdmin',
                // Special flag for super admins
                isAdmin: emp.role === 'superAdmin'
            };

            // Seed Firestore with the Auth UID and permissions
            await db.collection('users').doc(authUser.uid).set({
                ...emp,
                uid: authUser.uid,
                permissions: permissions,
                status: "Active",
                createdAt: new Date().toISOString()
            });
            console.log(`📦 Seeded Firestore record for: ${emp.name} [${emp.role}]`);
        } catch (err) {
            console.error(`❌ Error seeding ${emp.email}:`, err.message);
        }
    }

    // 6. Knowledgebase
    const kb = [
        { number: 1, topic: "Sanding", description: "Sanding sequence goes here", link: "https://example.com/sanding" },
        { number: 2, topic: "Installation", description: "Installation process goes here", link: "https://example.com/install" }
    ];

    console.log('📦 Seeding Knowledgebase...');
    for (const item of kb) {
        await db.collection('knowledgebase').add(item);
    }

    console.log('\n✨ Deep Seed Completed Successfully!');
    console.log(`🔑 Login Info:`);
    employees.forEach(e => console.log(`   - ${e.email} (password: ${DEFAULT_PASSWORD})`));
};

seedData().catch(err => {
    console.error('❌ Global Error Seeding Data:', err);
    process.exit(1);
});
