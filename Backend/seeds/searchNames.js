import fs from 'fs';

// Load GeoJSON
const geoJsonPath = './seeds/data/PAK_adm3.json';
const geoJsonContent = fs.readFileSync(geoJsonPath, 'utf8');
const geoJsonData = JSON.parse(geoJsonContent);

console.log('🔍 Searching for Gujranwala and Karachi variants...\n');

// Search for Gujranwala
console.log('Districts containing "gujran":');
geoJsonData.features.forEach(feature => {
    const name = feature.properties.NAME_3;
    if (name.toLowerCase().includes('gujran')) {
        console.log(`  - ${name}`);
    }
});

console.log('\nDistricts containing "karachi":');
geoJsonData.features.forEach(feature => {
    const name = feature.properties.NAME_3;
    if (name.toLowerCase().includes('karachi')) {
        console.log(`  - ${name}`);
    }
});

console.log('\n\nAll unique district names (sorted):');
console.log('─'.repeat(50));
const allNames = geoJsonData.features
    .map(f => f.properties.NAME_3)
    .sort();
allNames.forEach((name, i) => {
    console.log(`${(i + 1).toString().padStart(3)}. ${name}`);
});
