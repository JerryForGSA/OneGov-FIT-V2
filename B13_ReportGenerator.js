/**
 * ============================================================================
 * REPORT GENERATOR - B14_ReportGenerator.gs
 * ============================================================================
 * Generates JSON reports from data sources (CSV, XLSX, Google Sheets)
 * Creates funnel charts and saves to Drive
 * 
 * VERSION: 1.0.0
 * 
 * REPORTS SHEET COLUMNS (A-L):
 *   A: Report Type
 *   B: Report Data Link
 *   C: Report JSON
 *   D: Report Image 1
 *   E: Report Image 2
 *   F: Report Drive URL
 *   G: Report Creator
 *   H: Report Timestamp
 *   I: Level 1 Reviewer
 *   J: Level 1 Review Timestamp
 *   K: Level 2 Reviewer
 *   L: Level 2 Review Timestamp
 * ============================================================================
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const REPORT_CONFIG = {
  // Drive folder for chart images
  CHART_IMAGES_FOLDER_ID: '1z05YYe_jVHXxk7EllR-MiBio19Zbo2zo',
  
  // Drive folder for final exported reports
  FINAL_REPORTS_FOLDER_ID: '1lLUupgvLvzJngyzLw7GLx5sPX9gpSW4E',
  
  // Reports sheet name
  REPORTS_SHEET_NAME: 'Reports',
  
  // Column indices (0-based for arrays, 1-based for getRange)
  COLUMNS: {
    REPORT_TYPE: 0,           // A
    DATA_LINK: 1,             // B
    JSON: 2,                  // C
    IMAGE_1: 3,               // D
    IMAGE_2: 4,               // E
    DRIVE_URL: 5,             // F
    CREATOR: 6,               // G
    TIMESTAMP: 7,             // H
    LEVEL1_REVIEWER: 8,       // I
    LEVEL1_TIMESTAMP: 9,      // J
    LEVEL2_REVIEWER: 10,      // K
    LEVEL2_TIMESTAMP: 11      // L
  },
  
  // Report types
  REPORT_TYPES: {
    DISCOUNT_OFFERS: 'Discount Offers',
    MONTHLY_ONEGOV_SAVINGS: 'Monthly OneGov Savings'
  }
};

// ============================================================================
// MENU CREATION
// ============================================================================

/**
 * Creates the Report Generator menu
 * Call this from your main onOpen() function
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Report Generator')
    .addItem('Generate Monthly OneGov Savings Report', 'generateMonthlyOneGovSavingsReport')
    .addItem('Generate Discount Offers Report', 'generateDiscountOffersReports')
    .addSeparator()
    .addItem('Create Reports Sheet (if missing)', 'createReportsSheet')
    .addItem('Test Data Source Connection', 'testDataSourceConnection')
    .addToUi();
}

/**
 * Alternative: Add to existing menu system
 * Use this if you already have an onOpen function
 */
function addReportGeneratorMenuItems(existingMenu) {
  return existingMenu
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('📊 Report Generator')
      .addItem('Generate Monthly OneGov Savings Report', 'generateMonthlyOneGovSavingsReport')
      .addItem('Generate Discount Offers Report', 'generateDiscountOffersReports')
      .addSeparator()
      .addItem('Create Reports Sheet (if missing)', 'createReportsSheet'));
}

// ============================================================================
// MAIN REPORT GENERATION FUNCTIONS
// ============================================================================

/**
 * Main function to generate Monthly OneGov Savings Reports
 * Processes all pending report requests in the Reports sheet
 */
function generateMonthlyOneGovSavingsReport() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
  
  if (!reportsSheet) {
    ui.alert('Error: Reports sheet not found. Click "Create Reports Sheet" first.');
    return;
  }
  
  try {
    const lastRow = reportsSheet.getLastRow();
    if (lastRow < 2) {
      ui.alert('No data found in Reports sheet. Add a row with Report Type and Data Link.');
      return;
    }
    
    // Get all data from Reports sheet (columns A through L)
    const dataRange = reportsSheet.getRange(2, 1, lastRow - 1, 12);
    const data = dataRange.getValues();
    
    let processedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Actual row number in sheet
      
      const reportType = row[REPORT_CONFIG.COLUMNS.REPORT_TYPE];
      const dataLink = row[REPORT_CONFIG.COLUMNS.DATA_LINK];
      const existingTimestamp = row[REPORT_CONFIG.COLUMNS.TIMESTAMP];
      
      // Check if this row should be processed
      if (reportType === REPORT_CONFIG.REPORT_TYPES.MONTHLY_ONEGOV_SAVINGS && 
          dataLink && 
          !existingTimestamp) {
        
        try {
          Logger.log(`Processing row ${rowNum}: ${dataLink}`);
          
          // Process this report
          const result = processMonthlyOneGovSavingsReport(dataLink, rowNum);
          
          // Update the row with results
          const userEmail = Session.getActiveUser().getEmail();
          const timestamp = new Date();
          
          // Column C: Report JSON
          reportsSheet.getRange(rowNum, 3).setValue(result.json);
          // Column D: Report Drive URL (will be set after export)
          reportsSheet.getRange(rowNum, 4).setValue('');
          // Column E: Report Creator
          reportsSheet.getRange(rowNum, 5).setValue(userEmail);
          // Column F: Report Timestamp
          reportsSheet.getRange(rowNum, 6).setValue(timestamp);
          
          processedCount++;
          Logger.log(` Row ${rowNum} processed successfully`);
          
        } catch (error) {
          errors.push(`Row ${rowNum}: ${error.toString()}`);
          Logger.log(` Error processing row ${rowNum}: ${error.toString()}`);
        }
      } else {
        skippedCount++;
      }
    }
    
    // Show summary
    let message = `Report Generation Complete!\n\n`;
    message += `Reports processed: ${processedCount}\n`;
    message += `Rows skipped: ${skippedCount}\n`;
    
    if (errors.length > 0) {
      message += `\nErrors encountered:\n${errors.join('\n')}`;
    }
    
    if (processedCount === 0 && errors.length === 0) {
      message = 'No pending Monthly OneGov Savings reports found.\n\n';
      message += 'To generate a report, ensure:\n';
      message += '• Column A = "Monthly OneGov Savings"\n';
      message += '• Column B = Valid data source link (CSV, XLSX, or Sheet)\n';
      message += '• Column H (Timestamp) is empty';
    }
    
    ui.alert(message);
    
  } catch (error) {
    ui.alert('Error: ' + error.toString());
    Logger.log('Error in generateMonthlyOneGovSavingsReport: ' + error.toString());
  }
}

/**
 * Process a single Monthly OneGov Savings report
 * @param {string} dataLink - URL to the data source
 * @param {number} rowNum - Row number for naming files
 * @returns {Object} Result with json, image1Url, image2Url
 */
function processMonthlyOneGovSavingsReport(dataLink, rowNum) {
  // Step 1: Read the data
  const rawData = readDataSource(dataLink);
  Logger.log(`Read ${rawData.length} rows from data source`);
  
  // Step 2: Process and aggregate the data
  const processedData = processOneGovSavingsData(rawData);
  Logger.log(`Processed data: ${JSON.stringify(processedData.summary)}`);
  
  // Step 3: Build the JSON report structure
  const reportJSON = buildOneGovSavingsJSON(processedData);
  
  // Step 4: Create funnel charts and save to Drive
  const chartUrls = createOneGovSavingsCharts(processedData, rowNum);
  
  // Step 5: Add chart URLs to the JSON
  reportJSON.charts.savingsByOEM.driveUrl = chartUrls.chart1Url;
  reportJSON.charts.savingsByOEM.imageId = chartUrls.chart1Id;
  reportJSON.charts.savingsByMonth.driveUrl = chartUrls.chart2Url;
  reportJSON.charts.savingsByMonth.imageId = chartUrls.chart2Id;
  
  return {
    json: JSON.stringify(reportJSON, null, 2),
    image1Url: chartUrls.chart1Url,
    image2Url: chartUrls.chart2Url
  };
}

// ============================================================================
// DATA READING FUNCTIONS
// ============================================================================

/**
 * Read data from various sources (CSV, XLSX, Google Sheet)
 * @param {string} link - Drive link, Sheet URL, or file ID
 * @returns {Array<Object>} Array of row objects with headers as keys
 */
function readDataSource(link) {
  // Determine source type
  const isSheet = link.includes('spreadsheets') || link.includes('docs.google.com/spreadsheets');
  const isXlsx = link.toLowerCase().includes('.xlsx');
  
  if (isSheet) {
    return readGoogleSheet(link);
  } else if (isXlsx) {
    return readXlsxFile(link);
  } else {
    // Assume CSV
    return readCsvFile(link);
  }
}

/**
 * Read data from a Google Sheet
 * @param {string} sheetLink - Google Sheet URL or ID
 * @returns {Array<Object>} Array of row objects
 */
function readGoogleSheet(sheetLink) {
  const spreadsheetId = extractFileId(sheetLink);
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getActiveSheet();
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  if (values.length < 2) {
    throw new Error('Sheet has no data rows');
  }
  
  const headers = values[0].map(h => String(h).trim());
  const result = [];
  
  for (let i = 1; i < values.length; i++) {
    // Skip empty rows
    if (values[i].every(cell => cell === '' || cell === null || cell === undefined)) {
      continue;
    }
    
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    result.push(row);
  }
  
  return result;
}

/**
 * Read data from a CSV file in Drive
 * @param {string} link - Drive link or file ID
 * @returns {Array<Object>} Array of row objects
 */
function readCsvFile(link) {
  const fileId = extractFileId(link);
  const file = DriveApp.getFileById(fileId);
  const csvData = file.getBlob().getDataAsString();
  
  return parseCsvData(csvData);
}

/**
 * Read data from an XLSX file in Drive
 * @param {string} link - Drive link or file ID
 * @returns {Array<Object>} Array of row objects
 */
function readXlsxFile(link) {
  const fileId = extractFileId(link);
  const file = DriveApp.getFileById(fileId);
  
  // Convert XLSX to Google Sheet temporarily
  const tempSheet = Drive.Files.copy(
    { title: 'TempConversion_' + new Date().getTime(), mimeType: MimeType.GOOGLE_SHEETS },
    fileId
  );
  
  try {
    const spreadsheet = SpreadsheetApp.openById(tempSheet.id);
    const sheet = spreadsheet.getActiveSheet();
    const values = sheet.getDataRange().getValues();
    
    const headers = values[0].map(h => String(h).trim());
    const result = [];
    
    for (let i = 1; i < values.length; i++) {
      if (values[i].every(cell => cell === '' || cell === null)) continue;
      
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[i][j];
      }
      result.push(row);
    }
    
    return result;
    
  } finally {
    // Clean up temp file
    DriveApp.getFileById(tempSheet.id).setTrashed(true);
  }
}

/**
 * Parse CSV data into array of objects
 * @param {string} csvData - Raw CSV string
 * @returns {Array<Object>} Array of row objects
 */
function parseCsvData(csvData) {
  const lines = csvData.split(/\r?\n/);
  const result = [];
  
  if (lines.length < 2) {
    throw new Error('CSV has no data rows');
  }
  
  const headers = parseCsvLine(lines[0]);
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const values = parseCsvLine(lines[i]);
    const row = {};
    
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    
    result.push(row);
  }
  
  return result;
}

/**
 * Parse a single CSV line handling quoted fields
 * @param {string} line - CSV line
 * @returns {Array<string>} Array of values
 */
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
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
 * Extract file ID from various URL formats
 * @param {string} link - URL or file ID
 * @returns {string} File ID
 */
function extractFileId(link) {
  if (!link) throw new Error('No link provided');
  
  // Already a file ID (no slashes or colons)
  if (!/[\/:]/.test(link)) {
    return link.trim();
  }
  
  let fileId = link;
  
  // Google Sheets: https://docs.google.com/spreadsheets/d/FILE_ID/edit
  if (link.includes('docs.google.com/spreadsheets/d/')) {
    fileId = link.split('docs.google.com/spreadsheets/d/')[1].split(/[\/\?#]/)[0];
  }
  // Drive file: https://drive.google.com/file/d/FILE_ID/view
  else if (link.includes('drive.google.com/file/d/')) {
    fileId = link.split('drive.google.com/file/d/')[1].split(/[\/\?#]/)[0];
  }
  // Drive open: https://drive.google.com/open?id=FILE_ID
  else if (link.includes('id=')) {
    fileId = link.split('id=')[1].split(/[&\?#]/)[0];
  }
  
  return fileId.trim();
}

// ============================================================================
// DATA PROCESSING FUNCTIONS
// ============================================================================

/**
 * Process raw OneGov savings data into aggregated structure
 * @param {Array<Object>} rawData - Raw data from source
 * @returns {Object} Processed data with aggregations
 */
function processOneGovSavingsData(rawData) {
  // Filter to only validated savings rows
  const validRows = rawData.filter(row => {
    const validated = row['Cost Savings Validated'];
    return validated === 'Y' || validated === 'Yes' || validated === true;
  });
  
  // Initialize aggregation structures
  const byOEM = {};
  const byMonth = {};
  const byVendor = {};
  const byContract = {};
  const transactions = [];
  
  let totalSavings = 0;
  let totalCPL = 0;
  let totalPaid = 0;
  let transactionCount = 0;
  
  for (const row of validRows) {
    // Parse numeric values (handle currency strings)
    const saved = parseNumericValue(row['$ Saved'] || row['$_Saved'] || row['Savings'] || 0);
    const cpl = parseNumericValue(row['Total CPL Price'] || row['CPL Price'] || 0);
    const paid = parseNumericValue(row['Total Price Paid'] || row['Price Paid'] || 0);
    const qty = parseNumericValue(row['QTY Sold'] || row['Quantity'] || 1);
    
    // Skip rows with no savings
    if (saved === 0) continue;
    
    const oem = row['OEM'] || 'Unknown';
    const vendor = row['Vendor'] || 'Unknown';
    const contract = row['Contract #'] || row['Contract'] || 'Unknown';
    const reportingPeriod = row['Reporting Period'] || row['Order Date'] || 'Unknown';
    const partNumber = row['Manufacturer Part Number'] || row['Part Number'] || 'Unknown';
    const description = row['Description of Deliverable'] || row['Description'] || '';
    const discountRate = row['Actual Discount Rate'] || row['OneGov Discount Rate'] || '';
    const fundingDept = row['Funding Dept'] || row['Funding Department'] || 'Gov Wide';
    
    // Aggregate by OEM
    if (!byOEM[oem]) {
      byOEM[oem] = { savings: 0, transactions: 0, cpl: 0, paid: 0 };
    }
    byOEM[oem].savings += saved;
    byOEM[oem].transactions += 1;
    byOEM[oem].cpl += cpl;
    byOEM[oem].paid += paid;
    
    // Aggregate by Month/Period
    const monthKey = normalizeMonth(reportingPeriod);
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { savings: 0, transactions: 0, cpl: 0, paid: 0 };
    }
    byMonth[monthKey].savings += saved;
    byMonth[monthKey].transactions += 1;
    byMonth[monthKey].cpl += cpl;
    byMonth[monthKey].paid += paid;
    
    // Aggregate by Vendor
    if (!byVendor[vendor]) {
      byVendor[vendor] = { savings: 0, transactions: 0 };
    }
    byVendor[vendor].savings += saved;
    byVendor[vendor].transactions += 1;
    
    // Aggregate by Contract
    if (!byContract[contract]) {
      byContract[contract] = { savings: 0, transactions: 0, vendor: vendor };
    }
    byContract[contract].savings += saved;
    byContract[contract].transactions += 1;
    
    // Track individual transactions
    transactions.push({
      oem: oem,
      vendor: vendor,
      contract: contract,
      partNumber: partNumber,
      description: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
      quantity: qty,
      cplPrice: cpl,
      pricePaid: paid,
      savings: saved,
      discountRate: discountRate,
      fundingDept: fundingDept,
      reportingPeriod: monthKey
    });
    
    // Update totals
    totalSavings += saved;
    totalCPL += cpl;
    totalPaid += paid;
    transactionCount += 1;
  }
  
  // Calculate overall discount rate
  const overallDiscountRate = totalCPL > 0 ? ((totalCPL - totalPaid) / totalCPL * 100).toFixed(2) : 0;
  
  return {
    summary: {
      totalSavings: totalSavings,
      totalCPL: totalCPL,
      totalPaid: totalPaid,
      transactionCount: transactionCount,
      overallDiscountRate: overallDiscountRate,
      oemCount: Object.keys(byOEM).length,
      vendorCount: Object.keys(byVendor).length
    },
    byOEM: byOEM,
    byMonth: byMonth,
    byVendor: byVendor,
    byContract: byContract,
    transactions: transactions,
    rawRowCount: rawData.length,
    validRowCount: validRows.length
  };
}

/**
 * Parse numeric value from string (handles currency formatting)
 * @param {any} value - Value to parse
 * @returns {number} Parsed number
 */
function parseNumericValue(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = String(value)
    .replace(/[$,\s]/g, '')
    .replace(/[()]/g, '-')
    .trim();
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalize month/period to consistent format
 * @param {any} value - Date or period string
 * @returns {string} Normalized month key (e.g., "2025-06" or "Jun 2025")
 */
function normalizeMonth(value) {
  if (!value) return 'Unknown';
  
  const str = String(value).trim();
  
  // Handle "25-Jun", "25-Sep" format
  const dashMatch = str.match(/(\d{2})-([A-Za-z]{3})/);
  if (dashMatch) {
    const year = '20' + dashMatch[1];
    const month = dashMatch[2];
    return `${month} ${year}`;
  }
  
  // Handle date objects
  if (value instanceof Date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[value.getMonth()]} ${value.getFullYear()}`;
  }
  
  // Handle "6/1/2025" format
  const slashMatch = str.match(/(\d{1,2})\/\d{1,2}\/(\d{4})/);
  if (slashMatch) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNum = parseInt(slashMatch[1]) - 1;
    return `${months[monthNum]} ${slashMatch[2]}`;
  }
  
  return str;
}

// ============================================================================
// JSON REPORT BUILDING
// ============================================================================

/**
 * Build the complete JSON structure for Monthly OneGov Savings Report
 * @param {Object} processedData - Processed data from processOneGovSavingsData
 * @returns {Object} Complete report JSON
 */
function buildOneGovSavingsJSON(processedData) {
  const now = new Date();
  
  // Sort OEMs by savings descending
  const oemsSorted = Object.entries(processedData.byOEM)
    .sort((a, b) => b[1].savings - a[1].savings)
    .map(([name, data]) => ({
      name: name,
      savings: data.savings,
      transactions: data.transactions,
      cpl: data.cpl,
      paid: data.paid,
      percentOfTotal: (data.savings / processedData.summary.totalSavings * 100).toFixed(2)
    }));
  
  // Sort months chronologically
  const monthOrder = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 
                       'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };
  const monthsSorted = Object.entries(processedData.byMonth)
    .sort((a, b) => {
      const [monthA, yearA] = a[0].split(' ');
      const [monthB, yearB] = b[0].split(' ');
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return (monthOrder[monthA] || 0) - (monthOrder[monthB] || 0);
    })
    .map(([name, data]) => ({
      period: name,
      savings: data.savings,
      transactions: data.transactions,
      cpl: data.cpl,
      paid: data.paid,
      percentOfTotal: (data.savings / processedData.summary.totalSavings * 100).toFixed(2)
    }));
  
  // Determine reporting period range
  const periods = monthsSorted.map(m => m.period);
  const reportingPeriod = periods.length > 1 
    ? `${periods[0]} - ${periods[periods.length - 1]}`
    : periods[0] || 'Unknown';
  
  return {
    reportType: 'Monthly OneGov Savings',
    reportVersion: '1.0',
    generatedAt: now.toISOString(),
    generatedBy: Session.getActiveUser().getEmail(),
    reportingPeriod: reportingPeriod,
    
    executiveSummary: {
      data: {
        totalSavings: processedData.summary.totalSavings,
        totalSavingsFormatted: formatCurrency(processedData.summary.totalSavings),
        totalTransactions: processedData.summary.transactionCount,
        totalCPL: processedData.summary.totalCPL,
        totalCPLFormatted: formatCurrency(processedData.summary.totalCPL),
        totalPaid: processedData.summary.totalPaid,
        totalPaidFormatted: formatCurrency(processedData.summary.totalPaid),
        overallDiscountRate: processedData.summary.overallDiscountRate + '%',
        oemCount: processedData.summary.oemCount,
        vendorCount: processedData.summary.vendorCount,
        topOEM: oemsSorted[0]?.name || 'N/A',
        topOEMSavings: formatCurrency(oemsSorted[0]?.savings || 0)
      },
      commentary: ''  // Placeholder for human/AI commentary
    },
    
    financialOverview: {
      data: {
        savingsByOEM: oemsSorted,
        savingsByMonth: monthsSorted
      },
      commentary: ''  // Placeholder for human/AI commentary
    },
    
    transactionDetails: {
      data: {
        transactions: processedData.transactions,
        totalRows: processedData.rawRowCount,
        validatedRows: processedData.validRowCount
      },
      commentary: ''  // Placeholder for human/AI commentary
    },
    
    vendorAnalysis: {
      data: {
        byVendor: Object.entries(processedData.byVendor)
          .sort((a, b) => b[1].savings - a[1].savings)
          .map(([name, data]) => ({
            name: name,
            savings: data.savings,
            savingsFormatted: formatCurrency(data.savings),
            transactions: data.transactions,
            percentOfTotal: (data.savings / processedData.summary.totalSavings * 100).toFixed(2)
          })),
        byContract: Object.entries(processedData.byContract)
          .sort((a, b) => b[1].savings - a[1].savings)
          .map(([contract, data]) => ({
            contract: contract,
            vendor: data.vendor,
            savings: data.savings,
            savingsFormatted: formatCurrency(data.savings),
            transactions: data.transactions
          }))
      },
      commentary: ''  // Placeholder for human/AI commentary
    },
    
    methodology: {
      data: {
        dataSource: 'TDR/BIC transactional data',
        validationCriteria: 'Cost Savings Validated = Y',
        excludedTransactions: processedData.rawRowCount - processedData.validRowCount,
        calculationMethod: 'Savings = Total CPL Price - Total Price Paid'
      },
      commentary: ''  // Placeholder for human/AI commentary
    },
    
    addendum: {
      data: {},
      commentary: ''  // Placeholder for human/AI commentary
    },
    
    charts: {
      savingsByOEM: {
        title: 'Savings by OEM',
        type: 'funnel',
        driveUrl: '',  // Will be populated after chart creation
        imageId: '',
        tableData: oemsSorted.map(oem => ({
          label: oem.name,
          value: oem.savings,
          valueFormatted: formatCurrency(oem.savings),
          percent: oem.percentOfTotal + '%',
          transactions: oem.transactions
        }))
      },
      savingsByMonth: {
        title: 'Savings by Month',
        type: 'funnel',
        driveUrl: '',  // Will be populated after chart creation
        imageId: '',
        tableData: monthsSorted.map(month => ({
          label: month.period,
          value: month.savings,
          valueFormatted: formatCurrency(month.savings),
          percent: month.percentOfTotal + '%',
          transactions: month.transactions
        }))
      }
    },
    
    tables: {
      oemSummary: {
        title: 'Savings by OEM Summary',
        headers: ['OEM', 'Savings', '% of Total', 'Transactions', 'CPL', 'Paid'],
        rows: oemsSorted.map(oem => [
          oem.name,
          formatCurrency(oem.savings),
          oem.percentOfTotal + '%',
          oem.transactions,
          formatCurrency(oem.cpl),
          formatCurrency(oem.paid)
        ])
      },
      monthSummary: {
        title: 'Savings by Month Summary',
        headers: ['Period', 'Savings', '% of Total', 'Transactions'],
        rows: monthsSorted.map(month => [
          month.period,
          formatCurrency(month.savings),
          month.percentOfTotal + '%',
          month.transactions
        ])
      }
    }
  };
}

/**
 * Format number as currency
 * @param {number} value - Number to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '$0.00';
  
  return '$' + value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ============================================================================
// CHART CREATION FUNCTIONS
// ============================================================================

/**
 * Create funnel-style charts and save to Drive
 * @param {Object} processedData - Processed report data
 * @param {number} rowNum - Row number for file naming
 * @returns {Object} Object with chart URLs and IDs
 */
function createOneGovSavingsCharts(processedData, rowNum) {
  const timestamp = Utilities.formatDate(new Date(), 'GMT', 'yyyyMMdd_HHmmss');
  
  // Create Chart 1: Savings by OEM (Funnel)
  const chart1Result = createFunnelChart(
    processedData.byOEM,
    'Savings by OEM',
    `OneGov_OEM_Funnel_Row${rowNum}_${timestamp}`
  );
  
  // Create Chart 2: Savings by Month (Funnel)
  const chart2Result = createFunnelChart(
    processedData.byMonth,
    'Savings by Month',
    `OneGov_Month_Funnel_Row${rowNum}_${timestamp}`
  );
  
  return {
    chart1Url: chart1Result.url,
    chart1Id: chart1Result.id,
    chart2Url: chart2Result.url,
    chart2Id: chart2Result.id
  };
}

/**
 * Create a funnel-style chart using a temporary sheet
 * Google Sheets doesn't have native funnel charts, so we create a horizontal bar chart
 * sorted from largest to smallest to simulate a funnel effect
 * 
 * @param {Object} data - Object with keys as labels and values containing {savings: number}
 * @param {string} title - Chart title
 * @param {string} fileName - Name for the saved image file
 * @returns {Object} Object with url and id of saved image
 */
function createFunnelChart(data, title, fileName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create temporary sheet for chart data
  const tempSheetName = 'TempChart_' + new Date().getTime();
  const tempSheet = ss.insertSheet(tempSheetName);
  
  try {
    // Prepare data sorted by savings descending (for funnel effect)
    const sortedData = Object.entries(data)
      .sort((a, b) => b[1].savings - a[1].savings);
    
    // Calculate total for percentages
    const total = sortedData.reduce((sum, [_, d]) => sum + d.savings, 0);
    
    // Set up data in temporary sheet
    // Column A: Labels, Column B: Values, Column C: Formatted values for display
    tempSheet.getRange(1, 1, 1, 3).setValues([['Category', 'Savings', 'Display']]);
    
    const chartData = sortedData.map(([label, d]) => {
      const percent = total > 0 ? (d.savings / total * 100).toFixed(1) : 0;
      return [
        label,
        d.savings,
        `${formatCurrencyShort(d.savings)} (${percent}%)`
      ];
    });
    
    if (chartData.length > 0) {
      tempSheet.getRange(2, 1, chartData.length, 3).setValues(chartData);
    }
    
    // Create horizontal bar chart (funnel-style)
    const chartBuilder = tempSheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(tempSheet.getRange(1, 1, chartData.length + 1, 2))
      .setPosition(1, 5, 0, 0)
      .setOption('title', title)
      .setOption('legend', { position: 'none' })
      .setOption('hAxis', {
        title: 'Savings ($)',
        format: 'short',
        minValue: 0
      })
      .setOption('vAxis', {
        title: ''
      })
      .setOption('colors', ['#144673'])
      .setOption('bar', { groupWidth: '80%' })
      .setOption('width', 800)
      .setOption('height', 400 + (chartData.length * 30)); // Dynamic height based on data
    
    const chart = chartBuilder.build();
    tempSheet.insertChart(chart);
    
    // Get chart as image blob
    const charts = tempSheet.getCharts();
    if (charts.length === 0) {
      throw new Error('Failed to create chart');
    }
    
    const chartBlob = charts[0].getBlob().setName(fileName + '.png');
    
    // Save to Drive folder
    const folder = DriveApp.getFolderById(REPORT_CONFIG.CHART_IMAGES_FOLDER_ID);
    const file = folder.createFile(chartBlob);
    
    // Set file sharing to anyone with link can view
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileUrl = file.getUrl();
    const fileId = file.getId();
    
    Logger.log(` Chart saved: ${fileName} -> ${fileUrl}`);
    
    return {
      url: fileUrl,
      id: fileId
    };
    
  } finally {
    // Clean up: delete temporary sheet
    ss.deleteSheet(tempSheet);
  }
}

/**
 * Format currency in short form (K, M, B)
 * @param {number} value - Value to format
 * @returns {string} Formatted string
 */
function formatCurrencyShort(value) {
  if (!value || isNaN(value)) return '$0';
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1000000000) {
    return '$' + (value / 1000000000).toFixed(1) + 'B';
  } else if (absValue >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  } else if (absValue >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'K';
  } else {
    return '$' + value.toFixed(0);
  }
}

// ============================================================================
// DISCOUNT OFFERS REPORT (Updated for new columns)
// ============================================================================

/**
 * Generate Discount Offers reports
 * Updated to use new column structure
 */
function generateDiscountOffersReports() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
  
  if (!reportsSheet) {
    ui.alert('Error: Reports sheet not found. Click "Create Reports Sheet" first.');
    return;
  }
  
  try {
    const lastRow = reportsSheet.getLastRow();
    if (lastRow < 2) {
      ui.alert('No data found in Reports sheet.');
      return;
    }
    
    const dataRange = reportsSheet.getRange(2, 1, lastRow - 1, 12);
    const data = dataRange.getValues();
    
    let processedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;
      
      const reportType = row[REPORT_CONFIG.COLUMNS.REPORT_TYPE];
      const dataLink = row[REPORT_CONFIG.COLUMNS.DATA_LINK];
      const existingTimestamp = row[REPORT_CONFIG.COLUMNS.TIMESTAMP];
      
      if (reportType === REPORT_CONFIG.REPORT_TYPES.DISCOUNT_OFFERS && 
          dataLink && 
          !existingTimestamp) {
        
        try {
          Logger.log(`Processing Discount Offers row ${rowNum}: ${dataLink}`);
          
          const jsonResult = processDiscountOffersReport(dataLink);
          const userEmail = Session.getActiveUser().getEmail();
          const timestamp = new Date();
          
          // Update columns C (JSON), E (Creator), F (Timestamp)
          reportsSheet.getRange(rowNum, 3).setValue(jsonResult);
          reportsSheet.getRange(rowNum, 5).setValue(userEmail);
          reportsSheet.getRange(rowNum, 6).setValue(timestamp);
          
          processedCount++;
          
        } catch (error) {
          errors.push(`Row ${rowNum}: ${error.toString()}`);
          Logger.log(`Error processing row ${rowNum}: ${error.toString()}`);
        }
      } else {
        skippedCount++;
      }
    }
    
    let message = `Discount Offers Report Generation Complete!\n\n`;
    message += `Reports processed: ${processedCount}\n`;
    message += `Rows skipped: ${skippedCount}\n`;
    
    if (errors.length > 0) {
      message += `\nErrors:\n${errors.join('\n')}`;
    }
    
    if (processedCount === 0 && errors.length === 0) {
      message = 'No pending Discount Offers reports found.\n\n';
      message += 'Ensure:\n• Column A = "Discount Offers"\n• Column B = Data link\n• Column H is empty';
    }
    
    ui.alert(message);
    
  } catch (error) {
    ui.alert('Error: ' + error.toString());
    Logger.log('Error in generateDiscountOffersReports: ' + error.toString());
  }
}

/**
 * Process a single Discount Offers report
 * @param {string} fileLink - URL to data source
 * @returns {string} JSON string
 */
function processDiscountOffersReport(fileLink) {
  const data = readDataSource(fileLink);
  const result = {};
  
  for (const row of data) {
    const oem = row['OEM'] || row['oem'] || '';
    const partNumber = row['manufacturer_part_number'] || row['Manufacturer Part Number'] || row['Part Number'] || '';
    const description = row['Description'] || row['description'] || row['Description of Deliverable'] || '';
    const commercialPrice = row['COMMERCIAL PRICE LIST (CPL)'] || row['Commercial Price'] || row['CPL Price'] || '';
    const discountPrice = row['DISCOUNT PRICE'] || row['Discount Price'] || row['OneGov Price'] || '';
    const advantageLink = row['Advantage Link'] || row['advantage_link'] || '';
    
    if (!oem || !partNumber) continue;
    
    if (!result[oem]) {
      result[oem] = {};
    }
    
    result[oem][partNumber] = {
      description: description,
      commercial_price: commercialPrice,
      discount_price: discountPrice,
      advantage_link: advantageLink,
      sin: partNumber
    };
  }
  
  return JSON.stringify(result, null, 2);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create the Reports sheet with proper headers if it doesn't exist
 */
function createReportsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
  
  if (!reportsSheet) {
    reportsSheet = ss.insertSheet(REPORT_CONFIG.REPORTS_SHEET_NAME);
    
    const headers = [
      'Report Type',           // A
      'Report Data Link',      // B
      'Report JSON',           // C
      'Report Drive URL',      // D
      'Report Creator',        // E
      'Report Timestamp',      // F
      'Level 1 Reviewer',      // G
      'Level 1 Review Timestamp', // H
      'Level 2 Reviewer',      // I
      'Level 2 Review Timestamp'  // J
    ];
    
    reportsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    reportsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    reportsSheet.getRange(1, 1, 1, headers.length).setBackground('#144673');
    reportsSheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
    reportsSheet.setFrozenRows(1);
    
    // Set column widths
    reportsSheet.setColumnWidth(1, 180);  // Report Type
    reportsSheet.setColumnWidth(2, 350);  // Report Data Link
    reportsSheet.setColumnWidth(3, 150);  // Report JSON (will be long, but truncated display)
    reportsSheet.setColumnWidth(4, 250);  // Report Image 1
    reportsSheet.setColumnWidth(5, 250);  // Report Image 2
    reportsSheet.setColumnWidth(6, 250);  // Report Drive URL
    reportsSheet.setColumnWidth(7, 180);  // Report Creator
    reportsSheet.setColumnWidth(8, 150);  // Report Timestamp
    reportsSheet.setColumnWidth(9, 180);  // Level 1 Reviewer
    reportsSheet.setColumnWidth(10, 150); // Level 1 Review Timestamp
    reportsSheet.setColumnWidth(11, 180); // Level 2 Reviewer
    reportsSheet.setColumnWidth(12, 150); // Level 2 Review Timestamp
    
    // Add data validation for Report Type column
    const reportTypes = [
      REPORT_CONFIG.REPORT_TYPES.MONTHLY_ONEGOV_SAVINGS,
      REPORT_CONFIG.REPORT_TYPES.DISCOUNT_OFFERS
    ];
    const validation = SpreadsheetApp.newDataValidation()
      .requireValueInList(reportTypes, true)
      .setAllowInvalid(false)
      .build();
    reportsSheet.getRange(2, 1, 100, 1).setDataValidation(validation);
    
    SpreadsheetApp.getUi().alert('Reports sheet created successfully!');
  } else {
    SpreadsheetApp.getUi().alert('Reports sheet already exists.');
  }
}

/**
 * Test data source connection
 */
function testDataSourceConnection() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Test Data Source',
    'Enter a Google Drive file link or Sheet URL to test:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const link = response.getResponseText();
    
    try {
      const data = readDataSource(link);
      
      const message = ` Connection successful!\n\n` +
        `Rows read: ${data.length}\n` +
        `Columns: ${Object.keys(data[0] || {}).length}\n\n` +
        `First row columns:\n${Object.keys(data[0] || {}).slice(0, 10).join('\n')}` +
        (Object.keys(data[0] || {}).length > 10 ? '\n...' : '');
      
      ui.alert(message);
      Logger.log('Test data sample:', JSON.stringify(data.slice(0, 2), null, 2));
      
    } catch (error) {
      ui.alert(' Connection failed:\n\n' + error.toString());
      Logger.log('Test error:', error.toString());
    }
  }
}

/**
 * Get report data for web app
 * Called by the frontend to retrieve report data
 * @param {number} rowNum - Row number in Reports sheet (optional, gets all if not specified)
 * @returns {Object} Report data
 */
function getReportData(rowNum) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
  
  if (!reportsSheet) {
    return { error: 'Reports sheet not found' };
  }
  
  if (rowNum) {
    // Get specific row
    const row = reportsSheet.getRange(rowNum, 1, 1, 12).getValues()[0];
    return parseReportRow(row, rowNum);
  } else {
    // Get all reports
    const lastRow = reportsSheet.getLastRow();
    if (lastRow < 2) {
      return { reports: [] };
    }
    
    const data = reportsSheet.getRange(2, 1, lastRow - 1, 12).getValues();
    const reports = data.map((row, index) => parseReportRow(row, index + 2));
    
    return { reports: reports };
  }
}

/**
 * Parse a report row into structured object
 * @param {Array} row - Row data array
 * @param {number} rowNum - Row number
 * @returns {Object} Parsed report object
 */
function parseReportRow(row, rowNum) {
  const reportType = row[REPORT_CONFIG.COLUMNS.REPORT_TYPE];
  const jsonStr = row[REPORT_CONFIG.COLUMNS.JSON];
  const driveUrl = row[REPORT_CONFIG.COLUMNS.DRIVE_URL];
  
  let parsedJson = null;
  if (jsonStr) {
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch (e) {
      Logger.log(`Failed to parse JSON for row ${rowNum}:`, e);
    }
  }
  
  return {
    rowNum: rowNum,
    reportType: reportType,
    dataLink: row[REPORT_CONFIG.COLUMNS.DATA_LINK],
    json: parsedJson,
    image1: row[REPORT_CONFIG.COLUMNS.IMAGE_1],
    image2: row[REPORT_CONFIG.COLUMNS.IMAGE_2],
    driveUrl: driveUrl,
    creator: row[REPORT_CONFIG.COLUMNS.CREATOR],
    timestamp: row[REPORT_CONFIG.COLUMNS.TIMESTAMP],
    level1Reviewer: row[REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER],
    level1Timestamp: row[REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP],
    level2Reviewer: row[REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER],
    level2Timestamp: row[REPORT_CONFIG.COLUMNS.LEVEL2_TIMESTAMP],
    // Flag to indicate if this can be rendered
    canRender: !!(parsedJson || driveUrl),
    renderSource: parsedJson ? 'json' : (driveUrl ? 'driveUrl' : 'none')
  };
}

/**
 * Save exported report to Drive and update Reports sheet
 * Called after web app exports a report
 * @param {number} rowNum - Row number to update
 * @param {Blob} reportBlob - Report file blob
 * @param {string} fileName - Name for the file
 * @returns {Object} Result with driveUrl
 */
function saveExportedReport(rowNum, reportBlob, fileName) {
  try {
    const folder = DriveApp.getFolderById(REPORT_CONFIG.FINAL_REPORTS_FOLDER_ID);
    const file = folder.createFile(reportBlob).setName(fileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const driveUrl = file.getUrl();
    
    // Update Reports sheet Column F
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
    reportsSheet.getRange(rowNum, 4).setValue(driveUrl);
    
    return { success: true, driveUrl: driveUrl };
    
  } catch (error) {
    Logger.log('Error saving exported report:', error);
    return { success: false, error: error.toString() };
  }
}

function testReportsAccess() {
  const result = getReportsForWebApp();
  console.log('Result:', JSON.stringify(result, null, 2));
  return result;
}