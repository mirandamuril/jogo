const fs = require('fs');
const path = require('path');
const cards = require('../src/data/cards.json');

// Source images (Artifacts) - Update these filenames based on the list_dir output
const sources = {
    fire: 'fire_element_card_art_1769631418020.png',
    air: 'water_air_element_card_art_1769631432062.png',
    light: 'light_element_card_art_1769631446199.png',
    dark: 'dark_element_card_art_1769631462457.png',
    ether: 'ether_element_card_art_1769631477291.png'
};

const artifactDir = 'C:\\Users\\Murilo Miranda\\.gemini\\antigravity\\brain\\92019f88-1e2d-4ce9-b934-93aee4841e33';
const targetDir = path.join(__dirname, '../public/assets/cards');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

cards.forEach(card => {
    const element = card.element || 'ether';
    const sourceFile = sources[element];

    if (!sourceFile) {
        console.warn(`No source for element ${element}`);
        return;
    }

    const sourcePath = path.join(artifactDir, sourceFile);
    // Extract filename from the path in cards.json (e.g. "/assets/cards/ether_wisp.png" -> "ether_wisp.png")
    const targetFilename = path.basename(card.image);
    const targetPath = path.join(targetDir, targetFilename);

    try {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Created ${targetFilename} from ${sourceFile}`);
    } catch (e) {
        console.error(`Error copying ${sourceFile} to ${targetFilename}:`, e.message);
    }
});
