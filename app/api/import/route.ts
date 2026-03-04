import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let serviceAccount = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var", e);
    }
} else {
    try {
        const saPath = path.join(process.cwd(), 'service-account.json');
        if (fs.existsSync(saPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
        }
    } catch (e) { }
}

if (!getApps().length && serviceAccount) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}


const parseCSV = (filePath: string): any[] => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const cleanContent = fileContent.charCodeAt(0) === 0xFEFF ? fileContent.slice(1) : fileContent;

    const lines = cleanContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    const parseLine = (line: string): string[] => {
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

    let headers = parseLine(lines[0]);

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        const obj: any = {};
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = values[j] !== undefined ? values[j] : '';
        }
        data.push(obj);
    }
    return data;
};

const mapRole = (position: string) => {
    if (position === 'Super Admin') return 'superAdmin';
    if (position === 'Supervisor') return 'supervisor';
    return 'crewMember';
};

export async function GET() {
    try {
        console.log('🚀 Starting Data Migration via API Route...');

        const db = getFirestore();
        const auth = getAuth();

        const dataPath = path.join(process.cwd(), 'data');
        const categoriesData = parseCSV(path.join(dataPath, 'Employees - Categories.csv'));
        const subCategoriesData = parseCSV(path.join(dataPath, 'Employees - Sub Categories.csv'));
        const skillsData = parseCSV(path.join(dataPath, 'Employees - Skills.csv'));
        const employeesData = parseCSV(path.join(dataPath, 'Employees - Employees.csv'));
        const performanceData = parseCSV(path.join(dataPath, 'Employees - Performance.csv'));

        console.log(`Parsed: ${categoriesData.length} Categories, ${subCategoriesData.length} SubCategories, ${skillsData.length} Skills, ${employeesData.length} Employees, ${performanceData.length} Performances`);

        // Clean
        console.log('🧹 Cleaning existing categories, subCategories, skills...');
        const collectionsToClean = ['categories', 'subCategories', 'skills', 'performances'];
        for (const collName of collectionsToClean) {
            const snapshot = await db.collection(collName).get();
            let deleteBatch = db.batch();
            let dCount = 0;
            for (const doc of snapshot.docs) {
                deleteBatch.delete(doc.ref);
                dCount++;
                if (dCount >= 400) {
                    await deleteBatch.commit();
                    deleteBatch = db.batch();
                    dCount = 0;
                }
            }
            if (dCount > 0) {
                await deleteBatch.commit();
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

        // Insert Categories
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

        // Insert Sub Categories
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

        // Insert Skills
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

        // Helper maps for ID translation when inserting performances
        const employeeEmailToUser = new Map();
        const categoryIdToName = new Map();
        const skillIdToName = new Map();

        for (const cat of categoriesData) {
            categoryIdToName.set(cat['Record Id'], cat['Category']);
        }
        for (const skill of skillsData) {
            skillIdToName.set(skill['Record Id'], skill['Skill']);
        }

        // Employees
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

            employeeEmailToUser.set(emp['Email'].toLowerCase().trim(), {
                uid: authUser.uid,
                name: emp['Employee']
            });
        }

        // Insert Performances
        console.log('Seeding historical performance evaluation data...');
        for (let i = 0; i < performanceData.length; i++) {
            const perf = performanceData[i];
            const empEmail = perf['Employee']?.toLowerCase().trim();
            const supEmail = perf['Reviewing Supervisor']?.toLowerCase().trim();

            if (!empEmail || !perf['Record Id']) continue;

            const uData = employeeEmailToUser.get(empEmail);
            const supData = employeeEmailToUser.get(supEmail);

            let levelLabel = "Needs Improvement";
            let score = 1;
            let color = "#EF4444";

            if (perf['Current Skill Level'] === '3M3l8sTH') {
                levelLabel = 'Mastered';
                score = 5;
                color = 'var(--primary-hover)';
            } else if (perf['Current Skill Level'] === 'UDevHJrD') {
                levelLabel = 'Proficient';
                score = 3;
                color = '#3B82F6';
            }

            const ref = db.collection('performances').doc(perf['Record Id']);
            batch.set(ref, {
                employeeId: uData?.uid || 'unknown',
                employeeName: uData?.name || empEmail,
                skillId: perf['Skill'],
                skillName: skillIdToName.get(perf['Skill']) || 'Unknown Skill',
                level: levelLabel,
                score: score,
                color: color,
                evaluatorId: supData?.uid || 'unknown',
                evaluatorName: supData?.name || supEmail,
                evaluatedAt: new Date(perf['Date Reviewed'] || Date.now()).toISOString(),
                notes: `Migrated from Record ID: ${perf['Record Id']}`,
                timesReviewed: parseInt(perf['Times Reviewed']) || 1
            });
            batchCount++;
            if (batchCount >= 400) await commitBatch();
        }

        await commitBatch();

        return NextResponse.json({ success: true, message: "Migration Complete!" });
    } catch (err: any) {
        console.error('❌ Migration failed:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
