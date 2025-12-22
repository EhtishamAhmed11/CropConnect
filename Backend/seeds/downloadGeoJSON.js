import fs from 'fs';
import https from 'https';

const downloadFile = (url, outputPath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${outputPath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
};

const main = async () => {
  try {
    console.log('📥 Downloading Pakistan GeoJSON files...\n');
    
    const downloads = [
      {
        url: 'https://raw.githubusercontent.com/PakData/GISData/master/PAK-GeoJSON/PAK_adm1.json',
        output: './seeds/data/PAK_adm1.json'
      },
      {
        url: 'https://raw.githubusercontent.com/PakData/GISData/master/PAK-GeoJSON/PAK_adm3.json',
        output: './seeds/data/PAK_adm3.json'
      }
    ];

    // Create data directory if it doesn't exist
    if (!fs.existsSync('./seeds/data')) {
      fs.mkdirSync('./seeds/data', { recursive: true });
    }

    // Download all files
    for (const { url, output } of downloads) {
      await downloadFile(url, output);
    }

    console.log('\n✅ All GeoJSON files downloaded successfully!');
  } catch (error) {
    console.error('❌ Error downloading files:', error.message);
    process.exit(1);
  }
};

main();
