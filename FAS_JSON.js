/**
 * FAS_JSON.gs - Process CSV data to create JSON summaries for FAS dataset
 * Main function: Reads CSV URLs from column O, processes data to sum dollars_obligated
 * by fiscal year for the most frequent AI_OEM value, outputs JSON to column B
 */

/**
 * Main function to process all CSV files in column O
 */
function processObligations() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('OEM');
  if (!sheet) {
    throw new Error('OEM sheet not found');
  }
  
  const startRow = 2; // Assuming row 1 has headers
  const oemColumn = 1; // Column A (1st column) - OEM names
  const csvColumn = 15; // Column O (15th column)
  const jsonColumn = 2; // Column B (2nd column)
  
  // Get all values from columns A and O
  const lastRow = sheet.getLastRow();
  const oemNames = sheet.getRange(startRow, oemColumn, lastRow - startRow + 1, 1).getValues();
  const csvUrls = sheet.getRange(startRow, csvColumn, lastRow - startRow + 1, 1).getValues();
  
  // Process each CSV URL
  for (let i = 0; i < csvUrls.length; i++) {
    const csvUrl = csvUrls[i][0];
    const oemName = oemNames[i][0];
    
    if (csvUrl && csvUrl.toString().trim() !== '') {
      try {
        Logger.log(`Processing row ${startRow + i}: OEM=${oemName}, CSV=${csvUrl}`);
        const jsonResult = processCSVFile(csvUrl.toString().trim(), oemName);
        
        // Write JSON result to column B
        sheet.getRange(startRow + i, jsonColumn).setValue(JSON.stringify(jsonResult, null, 2));
        
        // Add a small delay to avoid quota limits
        Utilities.sleep(100);
      } catch (error) {
        Logger.log(`Error processing row ${startRow + i}: ${error.toString()}`);
        sheet.getRange(startRow + i, jsonColumn).setValue(JSON.stringify({
          error: error.toString(),
          row: startRow + i,
          oem: oemName
        }));
      }
    }
  }
  
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('Obligations processing complete!');
}

/**
 * Process a single CSV file and return JSON summary
 * @param {string} csvUrl - URL or file ID of the CSV file
 * @param {string} oemName - OEM name from column A
 * @returns {Object} JSON object with fiscal year summaries
 */
function processCSVFile(csvUrl, oemName) {
  let csvData;
  
  // Handle different types of CSV references (URL, Drive file ID, etc.)
  if (csvUrl.includes('drive.google.com') || csvUrl.includes('/d/')) {
    // Extract file ID from Google Drive URL
    const fileId = extractFileId(csvUrl);
    csvData = getCSVFromDrive(fileId);
  } else if (csvUrl.startsWith('http')) {
    // Fetch from external URL
    csvData = UrlFetchApp.fetch(csvUrl).getContentText();
  } else {
    // Assume it's a file ID
    csvData = getCSVFromDrive(csvUrl);
  }
  
  // Parse CSV data
  const parsedData = parseCSV(csvData);
  
  // Calculate sum of ALL dollars_obligated by fiscal year (no filtering by OEM)
  const fiscalYearSums = calculateFiscalYearSums(parsedData, null);
  
  return {
    source_file: csvUrl,
    attributed_to: oemName || "Unknown",
    fiscal_year_obligations: fiscalYearSums,
    total_obligated: Object.values(fiscalYearSums).reduce((a, b) => a + b, 0),
    processed_date: new Date().toISOString()
  };
}

/**
 * Extract Google Drive file ID from various URL formats
 */
function extractFileId(url) {
  const patterns = [
    /\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  throw new Error('Could not extract file ID from URL: ' + url);
}

/**
 * Get CSV content from Google Drive
 */
function getCSVFromDrive(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return file.getBlob().getDataAsString();
  } catch (error) {
    throw new Error(`Could not access file ${fileId}: ${error.toString()}`);
  }
}

/**
 * Parse CSV string into array of objects
 */
function parseCSV(csvString) {
  const lines = csvString.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) {
    throw new Error('CSV file appears to be empty or invalid');
  }
  
  // Parse headers (assuming first line contains headers)
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Find required column indices
  const dollarObligatedIndex = headers.findIndex(h => 
    h.toLowerCase().includes('dollars_obligated') || 
    h.toLowerCase().includes('obligated')
  );
  const fiscalYearIndex = headers.findIndex(h => 
    h.toLowerCase().includes('fiscal') || 
    h.toLowerCase().includes('fy') ||
    h.toLowerCase().includes('year')
  );
  const aiOemIndex = headers.findIndex(h => 
    h.toLowerCase().includes('ai_oem') || 
    h.toLowerCase().includes('oem') ||
    h.toLowerCase().includes('vendor')
  );
  
  if (dollarObligatedIndex === -1 || fiscalYearIndex === -1 || aiOemIndex === -1) {
    throw new Error(`Required columns not found. Headers found: ${headers.join(', ')}`);
  }
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length) {
      data.push({
        dollars_obligated: parseFloat(values[dollarObligatedIndex]) || 0,
        fiscal_year: values[fiscalYearIndex],
        ai_oem: values[aiOemIndex]
      });
    }
  }
  
  return data;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Find the most frequent AI_OEM value in the data
 */
function findMostFrequentOEM(data) {
  const oemCounts = {};
  
  for (const row of data) {
    const oem = row.ai_oem;
    if (oem && oem !== '') {
      oemCounts[oem] = (oemCounts[oem] || 0) + 1;
    }
  }
  
  let mostFrequent = null;
  let maxCount = 0;
  
  for (const [oem, count] of Object.entries(oemCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequent = oem;
    }
  }
  
  return mostFrequent;
}

/**
 * Calculate sum of dollars_obligated by fiscal year
 * If targetOEM is null, sum ALL records regardless of OEM
 */
function calculateFiscalYearSums(data, targetOEM) {
  const fiscalYearSums = {};
  
  for (const row of data) {
    // If targetOEM is specified, only include rows with that OEM
    // If targetOEM is null, include all rows
    if (targetOEM && row.ai_oem !== targetOEM) {
      continue;
    }
    
    const fy = row.fiscal_year;
    const amount = row.dollars_obligated;
    
    if (fy && !isNaN(amount)) {
      fiscalYearSums[fy] = (fiscalYearSums[fy] || 0) + amount;
    }
  }
  
  return fiscalYearSums;
}

/**
 * Menu function to add custom menu to spreadsheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Process Obligations')
    .addItem('Process All Obligations', 'processObligations')
    .addItem('Process Selected Row', 'processSelectedRow')
    .addItem('Clear JSON Column', 'clearJSONColumn')
    .addSeparator()
    .addItem('View Logs', 'showLogs')
    .addToUi();
}

/**
 * Process only the selected row
 */
function processSelectedRow() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const activeRange = sheet.getActiveRange();
  const row = activeRange.getRow();
  
  if (sheet.getName() !== 'OEM') {
    SpreadsheetApp.getUi().alert('Please select a row in the OEM sheet');
    return;
  }
  
  const oemName = sheet.getRange(row, 1).getValue(); // Column A
  const csvUrl = sheet.getRange(row, 15).getValue(); // Column O
  
  if (!csvUrl) {
    SpreadsheetApp.getUi().alert('No CSV URL found in column O for this row');
    return;
  }
  
  try {
    const jsonResult = processCSVFile(csvUrl.toString().trim(), oemName);
    sheet.getRange(row, 2).setValue(JSON.stringify(jsonResult, null, 2)); // Column B
    SpreadsheetApp.getUi().alert('Processing complete for row ' + row);
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}

/**
 * Clear all JSON data from column B
 */
function clearJSONColumn() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('OEM');
  const lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.getRange(2, 2, lastRow - 1, 1).clearContent();
    SpreadsheetApp.getUi().alert('JSON column cleared');
  }
}

/**
 * Show logs in a dialog
 */
function showLogs() {
  const logs = Logger.getLog();
  const html = HtmlService.createHtmlOutput('<pre>' + logs + '</pre>')
    .setWidth(600)
    .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, 'Processing Logs');
}