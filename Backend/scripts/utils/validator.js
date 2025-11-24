export const validateYear = (year) => {
  const yearRegex = /^\d{4}-\d{2}$/;
  if (!yearRegex.test(year)) {
    return {
      valid: false,
      error: `Invalid year format: ${year}. Expected YYYY-YY (e.g., 2024-25)`,
    };
  }
  return { valid: true };
};
const provinceMapping = {
  Punjab: "PB",
  Sindh: "SD",
  KPK: "KP",
  "Khyber Pakhtunkhwa": "KP",
  Balochistan: "BL",
  National: "Pakistan",
  Pakistan: "Pakistan",
};
export const validateNumber = (value, fieldName, min = 0) => {
  const num = parseFloat(value);

  if (isNaN(num)) {
    return {
      valid: false,
      error: `${fieldName} must be a number, got: ${value}`,
    };
  }

  if (num < min) {
    return {
      valid: false,
      error: `${fieldName} must be >= ${min}, got: ${num}`,
    };
  }

  return { valid: true, value: num };
};
export const validateProvinceCode = (code) => {
  const validCodes = ["PB", "SD", "KP", "BL", "Pakistan"];

  if (!validCodes.includes(code)) {
    return {
      valid: false,
      error: `Invalid province code: ${code}. Must be one of: ${validCodes.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
};

/**
 * Validate crop code
 */
export const validateCropCode = (code) => {
  const validCodes = ["RICE", "COTTON", "WHEAT", "Rice", "Cotton", "Wheat"];

  if (!validCodes.includes(code)) {
    return {
      valid: false,
      error: `Invalid crop code: ${code}. Must be one of: RICE, COTTON, WHEAT`,
    };
  }

  return { valid: true, value: code.toUpperCase() };
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName) => {
  if (value === null || value === undefined || value === "") {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
};

export const validateProductionRow = (row, rowNumber) => {
  const errors = [];
  const validatedData = {};

  // Validate Year
  const year = row.Year || row.year;
  if (!year || !year.match(/^\d{4}-\d{2}$/)) {
    errors.push(
      `Row ${rowNumber}: Invalid year format. Expected YYYY-YY (e.g., 2018-19)`
    );
  } else {
    validatedData.year = year;
  }

  // Validate and map Province
  const provinceInput = (row.Province || row.province || "").trim();

  if (!provinceInput) {
    errors.push(`Row ${rowNumber}: Province is required`);
  } else {
    // Check if it's a valid province name or code
    const provinceCode = provinceMapping[provinceInput] || provinceInput;

    // Validate the resulting code
    const validCodes = ["PB", "SD", "KP", "BL", "Pakistan"];
    if (validCodes.includes(provinceCode)) {
      validatedData.province = provinceCode;
      validatedData.provinceName = provinceInput;
    } else {
      errors.push(
        `Row ${rowNumber}: Invalid province: "${provinceInput}". Must be one of: Punjab, Sindh, KPK, Balochistan, National, or province codes: PB, SD, KP, BL, Pakistan`
      );
    }
  }

  // District (optional)
  const district = row.District || row.district;
  validatedData.district = district?.trim() || null;

  // Validate Area (hectares)
  const area = parseFloat(
    row["Area Cultivated (Hectares)"] ||
      row["area_cultivated_(hectares)"] ||
      row.Area ||
      row["Area (hectares)"] ||
      row.area
  );
  if (isNaN(area) || area < 0) {
    errors.push(`Row ${rowNumber}: Invalid or missing Area (hectares)`);
  } else {
    validatedData.area = area;
  }

  // Validate Production (tonnes)
  const production = parseFloat(
    row["Production (Tonnes)"] ||
      row["production_(tonnes)"] ||
      row.Production ||
      row["Production (tonnes)"] ||
      row.production
  );
  if (isNaN(production) || production < 0) {
    errors.push(`Row ${rowNumber}: Invalid or missing Production (tonnes)`);
  } else {
    validatedData.production = production;
  }

  // Validate Yield (tonnes/hectare)
  const yieldValue = parseFloat(
    row["Yield (Tonnes/Hectare)"] ||
      row["yield_(tonnes/hectare)"] ||
      row.Yield ||
      row["Yield (tonnes/ha)"] ||
      row.yield
  );
  if (isNaN(yieldValue) || yieldValue < 0) {
    errors.push(`Row ${rowNumber}: Invalid or missing Yield (tonnes/ha)`);
  } else {
    validatedData.yield = yieldValue;
  }

  // Optional: Crop Type
  validatedData.cropType = row["Crop Type"] || row.crop_type || "Rice";

  // Optional: Data Source
  validatedData.dataSource =
    row["Data Source"] || row["data_source"] || row.source || "CSV Import";

  return {
    valid: errors.length === 0,
    data: validatedData,
    errors,
  };
};
export const getProvinceCode = (provinceName) => {
  return provinceMapping[provinceName] || provinceName;
};

// Helper function to validate province
export const isValidProvince = (province) => {
  const validCodes = ["PB", "SD", "KP", "BL", "Pakistan"];
  const provinceCode = provinceMapping[province] || province;
  return validCodes.includes(provinceCode);
};
