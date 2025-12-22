import fs from 'fs';

// Load GeoJSON
const geoJsonPath = './seeds/data/PAK_adm3.json';
const geoJsonContent = fs.readFileSync(geoJsonPath, 'utf8');
const geoJsonData = JSON.parse(geoJsonContent);

console.log(`📍 Total GeoJSON features: ${geoJsonData.features.length}\n`);

// Show first 10 district names from GeoJSON
console.log('First 10 district names from GeoJSON:');
console.log('─'.repeat(50));
geoJsonData.features.slice(0, 10).forEach((feature, index) => {
    console.log(`${index + 1}. ${feature.properties.NAME_3}`);
});

console.log('\n\nSample district names from our seeder:');
console.log('─'.repeat(50));
const sampleNames = [
    'Hafizabad',
    'Gujranwala',
    'Sialkot',
    'Sheikhupura',
    'Lahore',
    'Faisalabad',
    'Multan',
    'Karachi'
];

sampleNames.forEach(name => {
    const found = geoJsonData.features.find(f =>
        f.properties.NAME_3.toLowerCase() === name.toLowerCase()
    );
    console.log(`${name}: ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (found) {
        console.log(`  → Coordinates: ${found.geometry.coordinates[0]?.length || 0} points`);
    }
});
