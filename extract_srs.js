import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

let dataBuffer = fs.readFileSync('d:/Coding/FYP/CropConnect/CropConnect-Ehtasham Ahmed-SRS.pdf');

pdf(dataBuffer).then(function (data) {
    fs.writeFileSync('d:/Coding/FYP/CropConnect/SRS_TEXT.txt', data.text);
    console.log('Text extracted successfully to SRS_TEXT.txt');
}).catch(err => {
    console.error('Error extracting PDF:', err);
});
