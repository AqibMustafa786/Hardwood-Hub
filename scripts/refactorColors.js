const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../app');

const replaceInFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace hex colors with CSS variables
    // #E5A54F -> var(--primary)
    // #D4882A -> var(--primary-hover)
    // rgba(229,165,79, -> rgba(var(--primary-rgb),

    let original = content;

    // Replace literal hex codes in tailwind arbitrary classes
    content = content.replace(/#E5A54F/gi, 'var(--primary)');
    content = content.replace(/#D4882A/gi, 'var(--primary-hover)');
    content = content.replace(/229, *165, *79/g, 'var(--primary-rgb)');
    content = content.replace(/212, *136, *42/g, 'var(--primary-hover-rgb)');

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

const walkDir = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceInFile(fullPath);
        }
    }
}

walkDir(directoryPath);
console.log('Refactoring complete.');
