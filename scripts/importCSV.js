const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

console.log('--- Script Started ---');

const serviceAccount = require('../service-account.json');

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

console.log('--- Firebase Initialized ---');

// Simple CSV parser for small files
const parseCSV = (filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    // Remove BOM if present
    const cleanContent = fileContent.charCodeAt(0) === 0xFEFF ? fileContent.slice(1) : fileContent;

    const lines = cleanContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    let headers = lines[0].split(',').map(h => h.trim());
    // Sometimes CSVs quote headers or values, basic handling:
    const parseLine = (line) => {
        const result = [];
        let curStr = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(curStr.trim());
                curStr = '';
            } else {
                curStr += char;
            }
        }
        result.push(curStr.trim());
        return result;
    };

    headers = parseLine(lines[0]);

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = values[j] !== undefined ? values[j] : '';
        }
        data.push(obj);
    }
    return data;
};

const mapRole = (position) => {
    if (position === 'Super Admin') return 'superAdmin';
    if (position === 'Supervisor') return 'supervisor';
    return 'crewMember';
};

const migrateData = async () => {
    try {
        console.log('🚀 Starting Data Migration from CSV...');

        console.log('📄 Reading CSV files...');
        const categoriesData = parseCSV('./data/Employees - Categories.csv');
        const subCategoriesData = parseCSV('./data/Employees - Sub Categories.csv');
        const skillsData = parseCSV('./data/Employees - Skills.csv');
        const employeesData = parseCSV('./data/Employees - Employees.csv');
        const identificationsData = parseCSV('./data/Employees - Identification.csv');

        console.log(`Parsed: ${categoriesData.length} Categories, ${subCategoriesData.length} SubCategories, ${skillsData.length} Skills, ${employeesData.length} Employees, ${identificationsData.length} Identifications`);

        // 2. Clean Collections
        console.log('🧹 Cleaning existing categories, subCategories, skills...');
        const collectionsToClean = ['categories', 'subCategories', 'skills', 'identifications'];
        for (const collName of collectionsToClean) {
            const snapshot = await db.collection(collName).get();
            for (const doc of snapshot.docs) {
                await doc.ref.delete();
            }
        }

        let batch = db.batch();
        let batchCount = 0;

        const commitBatch = async () => {
            if (batchCount > 0) {
                await batch.commit();
                batch = db.batch();
                batchCount = 0;
            }
        };

        // 3. Insert Categories
        console.log(`📦 Inserting ${categoriesData.length} Categories...`);
        for (let i = 0; i < categoriesData.length; i++) {
            const cat = categoriesData[i];
            const id = cat['Record Id'];
            if (!id) continue;
            const ref = db.collection('categories').doc(id);
            batch.set(ref, {
                name: cat['Category'],
                iconURL: cat['Icon'] || '',
                priority: i + 1
            });
            batchCount++;
            if (batchCount >= 400) await commitBatch();
        }

        // 4. Insert Sub Categories
        console.log(`📦 Inserting ${subCategoriesData.length} Sub Categories...`);
        for (let i = 0; i < subCategoriesData.length; i++) {
            const scat = subCategoriesData[i];
            const id = scat['Record Id'];
            if (!id) continue;
            const ref = db.collection('subCategories').doc(id);
            batch.set(ref, {
                categoryId: scat['Category'],
                name: scat['Sub Category'],
                priority: parseInt(scat['Priority']) || 99
            });
            batchCount++;
            if (batchCount >= 400) await commitBatch();
        }

        // 5. Insert Skills
        console.log(`📦 Inserting ${skillsData.length} Skills...`);
        for (let i = 0; i < skillsData.length; i++) {
            const skill = skillsData[i];
            const id = skill['Record Id'];
            if (!id) continue;
            const ref = db.collection('skills').doc(id);
            batch.set(ref, {
                categoryId: skill['Category'],
                subCategoryId: skill['Sub Category'],
                name: skill['Skill'],
                isRequired: skill['isRequired'] === 'TRUE'
            });
            batchCount++;
            if (batchCount >= 400) await commitBatch();
        }

        await commitBatch();

        // 5.5 Insert Identifications
        console.log(`📦 Inserting ${identificationsData.length} Identifications...`);
        for (let i = 0; i < identificationsData.length; i++) {
            const item = identificationsData[i];
            const id = item['Record Id'];
            if (!id) continue;
            const ref = db.collection('identifications').doc(id);
            batch.set(ref, {
                name: item['Identification'],
                subCategoryId: item['Sub Category'] || ''
            });
            batchCount++;
            if (batchCount >= 400) await commitBatch();
        }

        await commitBatch();

        // 6. Insert/Update Employees
        console.log(`👥 Migrating/Updating ${employeesData.length} Employees...`);
        const DEFAULT_PASSWORD = 'password123';

        const existingUsers = await db.collection('users').get();
        for (const doc of existingUsers.docs) {
            await doc.ref.delete();
        }

        for (const emp of employeesData) {
            if (!emp['Email']) continue;

            let authUser;
            try {
                authUser = await auth.getUserByEmail(emp['Email']);
                await auth.updateUser(authUser.uid, {
                    password: DEFAULT_PASSWORD,
                    displayName: emp['Employee']
                });
            } catch (authErr) {
                authUser = await auth.createUser({
                    email: emp['Email'],
                    password: DEFAULT_PASSWORD,
                    displayName: emp['Employee']
                });
            }

            const role = mapRole(emp['Position']);
            const permissions = {
                dashboard: true,
                employees: role !== 'crewMember',
                skills: role === 'superAdmin',
                categories: role === 'superAdmin',
                performance: role !== 'crewMember',
                progress: true,
                knowledgebase: true,
                settings: role === 'superAdmin',
                identifications: role === 'superAdmin',
                isAdmin: role === 'superAdmin'
            };

            await db.collection('users').doc(authUser.uid).set({
                name: emp['Employee'],
                email: emp['Email'],
                position: emp['Position'],
                role: role,
                photoURL: emp['Profile Image'] || '',
                rawCSVData: emp,
                permissions: permissions,
                status: 'Active',
                createdAt: new Date().toISOString()
            });
            console.log(`✅ Appended user: ${emp['Email']}`);
        }

        console.log('✅✅✅ Migration Complete!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
};

migrateData();
