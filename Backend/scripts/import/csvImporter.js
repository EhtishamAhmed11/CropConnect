import fs from "fs";
import csv from "csv-parser";
import { validateProductionRow } from "../utils/validator.js";

class CSVImporter {
  constructor(filePath, cropName) {
    this.filePath = filePath;
    this.cropName = cropName;
    this.results = [];
    this.errors = [];
    this.stats = {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      skippedRows: 0,
    };
  }
  async parseCSV() {
    return new Promise((resolve, reject) => {
      console.log(`📖 Reading CSV file: ${this.filePath}`);
      if (!fs.existsSync(this.filePath)) {
        reject(new Error(`File not found: ${this.filePath}`));
        return;
      }

      const stream = fs
        .createReadStream(this.filePath)
        .pipe(csv())
        .on("data", (row) => {
          this.stats.totalRows++;

          // Validate row
          const validation = validateProductionRow(row, this.stats.totalRows);

          if (validation.valid) {
            this.results.push(validation.data);
            this.stats.validRows++;
          } else {
            this.errors.push({
              row: this.stats.totalRows,
              errors: validation.errors,
            });
            this.stats.invalidRows++;
          }
        })
        .on("end", () => {
          console.log(`✅ CSV parsing complete`);
          resolve();
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }
  displayStats() {
    console.log("\n📊 Import Statistics:");
    console.log(`  Total Rows: ${this.stats.totalRows}`);
    console.log(`  Valid Rows: ${this.stats.validRows}`);
    console.log(`  Invalid Rows: ${this.stats.invalidRows}`);
    console.log(
      `  Success Rate: ${(
        (this.stats.validRows / this.stats.totalRows) *
        100
      ).toFixed(2)}%`
    );
  }
  displayErrors(limit = 10) {
    if (this.errors.length === 0) return;

    console.log(
      `\n⚠️  Validation Errors (showing first ${Math.min(
        limit,
        this.errors.length
      )} of ${this.errors.length}):`
    );

    this.errors.slice(0, limit).forEach((error) => {
      console.log(`  Row ${error.row}:`);
      error.errors.forEach((err) => console.log(`    - ${err}`));
    });

    if (this.errors.length > limit) {
      console.log(`  ... and ${this.errors.length - limit} more errors`);
    }
  }
  getResults() {
    return this.results;
  }

  
  getErrors() {
    return this.errors;
  }
}
export default CSVImporter