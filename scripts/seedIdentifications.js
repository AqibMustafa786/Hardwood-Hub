const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ credential: cert(require('../service-account.json')) });
const db = getFirestore();

async function seed() {
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

    const subCats = await db.collection('subCategories').get();
    const subCatMap = {};
    subCats.forEach(doc => subCatMap[doc.data().name] = doc.id);
    let count = 0;

    for (const [subCat, skillList] of Object.entries(identificationSkillsRaw)) {
        for (const skillName of skillList) {
            if (subCatMap[subCat]) {
                await db.collection('identifications').add({ name: skillName, subCategoryId: subCatMap[subCat] });
                count++;
            }
        }
    }
    console.log('Seeded ' + count + ' identifications');
}
seed();
