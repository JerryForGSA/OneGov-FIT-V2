// ============================================================================
// REPORT GENERATOR - B13_ReportGenerator_v3.gs (BOUND SCRIPT)
// ============================================================================
// This script processes report requests from the Reports sheet and generates
// JSON outputs for various report types. Charts are rendered by the web app.
//
// VERSION: 3.1.0 - Updated column structure with Description column
// 
// REPORTS SHEET COLUMNS (A-M):
//   A: Report Type
//   B: Report Description (NEW)
//   C: Report Data Link
//   D: Report JSON
//   E: Report Image 1 (populated by web app on export)
//   F: Report Image 2 (populated by web app on export)
//   G: Report Drive URL (populated by web app on export)
//   H: Report Creator
//   I: Report Timestamp
//   J: Level 1 Reviewer
//   K: Level 1 Review Timestamp
//   L: Level 2 Reviewer
//   M: Level 2 Review Timestamp
//
// SUPPORTED REPORT TYPES:
//   - "Discount Offers" - Generates JSON of discount pricing by OEM
//   - "OneGov Monthly Savings" - Generates savings analysis JSON
// ============================================================================

// ============================================================================
// CONFIGURATION
// ============================================================================

const REPORT_CONFIG = {
  // Drive folder for chart images (used by web app)
  CHART_IMAGES_FOLDER_ID: '1z05YYe_jVHXxk7EllR-MiBio19Zbo2zo',
  
  // Drive folder for final exported reports (used by web app)
  FINAL_REPORTS_FOLDER_ID: '1lLUupgvLvzJngyzLw7GLx5sPX9gpSW4E',
  
  // Reports sheet name
  REPORTS_SHEET_NAME: 'Reports',
  
  // Column indices (0-based for array access) - UPDATED for new structure
  COLUMNS: {
    REPORT_TYPE: 0,           // A
    DESCRIPTION: 1,           // B (NEW)
    DATA_LINK: 2,             // C
    JSON: 3,                  // D
    IMAGE_1: 4,               // E
    IMAGE_2: 5,               // F
    DRIVE_URL: 6,             // G
    CREATOR: 7,               // H
    TIMESTAMP: 8,             // I
    LEVEL1_REVIEWER: 9,       // J
    LEVEL1_TIMESTAMP: 10,     // K
    LEVEL2_REVIEWER: 11,      // L
    LEVEL2_TIMESTAMP: 12      // M
  },
  
  // Supported report types
  REPORT_TYPES: {
    DISCOUNT_OFFERS: 'Discount Offers',
    MONTHLY_ONEGOV_SAVINGS: 'OneGov Monthly Savings'
  }
};

// ============================================================================
// MENU CREATION FOR REPORT GENERATOR
// ============================================================================

/**
 * Adds Report Generator menu items to the main menu
 */
function addReportGeneratorMenu(mainMenu) {
  const ui = SpreadsheetApp.getUi();
  
  const reportMenu = ui.createMenu('Report Generator')
    .addItem('📊 Generate Discount Offers Reports', 'generateDiscountOffersReports')
    .addItem('💰 Generate OneGov Monthly Savings Report', 'generateMonthlyOneGovSavingsReport')
    .addSeparator()
    .addItem('➕ Create Reports Sheet', 'createReportsSheet')
    .addSeparator()
    .addItem('🧪 Test Data Source Connection', 'testDataSourceConnection');
  
  mainMenu.addSubMenu(reportMenu);
}

// ============================================================================
// DISCOUNT OFFERS REPORT
// ============================================================================

/**
 * Main function to generate Discount Offers reports
 */
function generateDiscountOffersReports() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
  
  if (!reportsSheet) {
    ui.alert('Error: Reports sheet not found. Please click "Create Reports Sheet" first.');
    return;
  }
  
  try {
    const lastRow = reportsSheet.getLastRow();
    if (lastRow < 2) {
      ui.alert('No data found in Reports sheet.');
      return;
    }
    
    const dataRange = reportsSheet.getRange(2, 1, lastRow - 1, 13);
    const data = dataRange.getValues();
    
    let processedCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;
      
      const reportType = row[REPORT_CONFIG.COLUMNS.REPORT_TYPE];
      const reportDataLink = row[REPORT_CONFIG.COLUMNS.DATA_LINK];
      const reportTimestamp = row[REPORT_CONFIG.COLUMNS.TIMESTAMP];
      
      if (reportType === REPORT_CONFIG.REPORT_TYPES.DISCOUNT_OFFERS && 
          reportDataLink && 
          !reportTimestamp) {
        
        try {
          Logger.log(`Processing Discount Offers row ${rowNum}: ${reportDataLink}`);
          
          const jsonResult = processDiscountOffersReport(reportDataLink);
          const userEmail = Session.getActiveUser().getEmail();
          const timestamp = new Date();
          
          // Column D (4) = JSON, Column H (8) = Creator, Column I (9) = Timestamp
          reportsSheet.getRange(rowNum, REPORT_CONFIG.COLUMNS.JSON + 1).setValue(jsonResult);
          reportsSheet.getRange(rowNum, REPORT_CONFIG.COLUMNS.CREATOR + 1).setValue(userEmail);
          reportsSheet.getRange(rowNum, REPORT_CONFIG.COLUMNS.TIMESTAMP + 1).setValue(timestamp);
          
          processedCount++;
          Logger.log(`✅ Row ${rowNum} processed successfully`);
          
        } catch (error) {
          errors.push(`Row ${rowNum}: ${error.toString()}`);
          Logger.log(`❌ Error processing row ${rowNum}: ${error.toString()}`);
        }
      } else {
        skippedCount++;
      }
    }
    
    let message = `Discount Offers Report Generation Complete!\n\n`;
    message += `Reports processed: ${processedCount}\n`;
    message += `Rows skipped: ${skippedCount}\n`;
    
    if (errors.length > 0) {
      message += `\nErrors encountered:\n${errors.join('\n')}`;
    }
    
    if (processedCount === 0 && errors.length === 0) {
      message = 'No pending Discount Offers reports found.\n\n';
      message += 'To generate a report, ensure:\n';
      message += '• Column A = "Discount Offers"\n';
      message += '• Column C = Valid data source link\n';
      message += '• Column I (Timestamp) is empty';
    }
    
    ui.alert(message);
    
  } catch (error) {
    ui.alert('Error: ' + error.toString());
    Logger.log('Error in generateDiscountOffersReports: ' + error.toString());
  }
}

/**
 * Processes a single Discount Offers report
 */
function processDiscountOffersReport(fileLink) {
  try {
    const parsedData = readDataSource(fileLink);
    const discountOffersJSON = buildDiscountOffersJSON(parsedData);
    return JSON.stringify(discountOffersJSON, null, 2);
  } catch (error) {
    throw new Error(`Failed to process Discount Offers report: ${error.toString()}`);
  }
}

/**
 * Builds the Discount Offers JSON structure
 */
function buildDiscountOffersJSON(data) {
  const result = {};
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    const oem = row['OEM'] || row['oem'] || '';
    const partNumber = row['manufacturer_part_number'] || 
                       row['Manufacturer Part Number'] || 
                       row['Part Number'] || 
                       row['SIN'] || '';
    const description = row['Description'] || 
                        row['description'] || 
                        row['Description of Deliverable'] || '';
    const commercialPrice = row['COMMERCIAL PRICE LIST (CPL)'] || 
                            row['Commercial Price'] || 
                            row['CPL'] || 
                            row['CPL Price'] || '';
    const discountPrice = row['DISCOUNT PRICE'] || 
                          row['Discount Price'] || 
                          row['OneGov Price'] || '';
    const advantageLink = row['Advantage Link'] || 
                          row['advantage_link'] || 
                          row['Link'] || '';
    
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
  
  return result;
}

// ============================================================================
// MONTHLY ONEGOV SAVINGS REPORT
// ============================================================================

/**
 * Main function to generate OneGov Monthly Savings Reports
 * Generates JSON only - charts are rendered by the web app
 */
function generateMonthlyOneGovSavingsReport() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
  
  if (!reportsSheet) {
    ui.alert('Error: Reports sheet not found. Please click "Create Reports Sheet" first.');
    return;
  }
  
  try {
    const lastRow = reportsSheet.getLastRow();
    if (lastRow < 2) {
      ui.alert('No data found in Reports sheet. Add a row with Report Type and Data Link.');
      return;
    }
    
    const dataRange = reportsSheet.getRange(2, 1, lastRow - 1, 13);
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
      
      if (reportType === REPORT_CONFIG.REPORT_TYPES.MONTHLY_ONEGOV_SAVINGS && 
          dataLink && 
          !existingTimestamp) {
        
        try {
          Logger.log(`Processing OneGov Monthly Savings row ${rowNum}: ${dataLink}`);
          
          // Process and generate JSON only (no charts)
          const jsonResult = processMonthlyOneGovSavingsReport(dataLink);
          const userEmail = Session.getActiveUser().getEmail();
          const timestamp = new Date();
          
          // Update JSON (D), Creator (H), Timestamp (I)
          // Columns E, F, G will be populated by web app on export
          reportsSheet.getRange(rowNum, REPORT_CONFIG.COLUMNS.JSON + 1).setValue(jsonResult);
          reportsSheet.getRange(rowNum, REPORT_CONFIG.COLUMNS.CREATOR + 1).setValue(userEmail);
          reportsSheet.getRange(rowNum, REPORT_CONFIG.COLUMNS.TIMESTAMP + 1).setValue(timestamp);
          
          SpreadsheetApp.flush();
          
          processedCount++;
          Logger.log(`✅ Row ${rowNum} processed successfully`);
          
        } catch (error) {
          errors.push(`Row ${rowNum}: ${error.toString()}`);
          Logger.log(`❌ Error processing row ${rowNum}: ${error.toString()}`);
          Logger.log(`Stack: ${error.stack}`);
        }
      } else {
        skippedCount++;
      }
    }
    
    let message = `OneGov Monthly Savings Report Generation Complete!\n\n`;
    message += `Reports processed: ${processedCount}\n`;
    message += `Rows skipped: ${skippedCount}\n`;
    
    if (processedCount > 0) {
      message += `\n📊 Open the web app to view charts and export reports.`;
    }
    
    if (errors.length > 0) {
      message += `\nErrors encountered:\n${errors.join('\n')}`;
    }
    
    if (processedCount === 0 && errors.length === 0) {
      message = 'No pending OneGov Monthly Savings reports found.\n\n';
      message += 'To generate a report, ensure:\n';
      message += '• Column A = "OneGov Monthly Savings"\n';
      message += '• Column C = Valid data source link\n';
      message += '• Column I (Timestamp) is empty';
    }
    
    ui.alert(message);
    
  } catch (error) {
    ui.alert('Error: ' + error.toString());
    Logger.log('Error in generateMonthlyOneGovSavingsReport: ' + error.toString());
  }
}

/**
 * Process a single OneGov Monthly Savings report - JSON only
 */
function processMonthlyOneGovSavingsReport(dataLink) {
  Logger.log(`Reading data from ${dataLink}`);
  const rawData = readDataSource(dataLink);
  Logger.log(`Read ${rawData.length} rows from data source`);
  
  Logger.log(`Processing data...`);
  const processedData = processOneGovSavingsData(rawData);
  Logger.log(`Processed: ${processedData.summary.transactionCount} transactions, $${processedData.summary.totalSavings} total savings`);
  
  Logger.log(`Building JSON structure...`);
  const reportJSON = buildOneGovSavingsJSON(processedData);
  
  return JSON.stringify(reportJSON, null, 2);
}

/**
 * Process raw OneGov savings data into aggregated structure
 */
function processOneGovSavingsData(rawData) {
  // Filter to only validated savings rows
  const validRows = rawData.filter(row => {
    const validated = row['Cost Savings Validated'];
    return validated === 'Y' || validated === 'Yes' || validated === true;
  });
  
  Logger.log(`Found ${validRows.length} validated rows out of ${rawData.length} total`);
  
  // Initialize aggregation structures
  const byOEM = {};
  const byMonth = {};
  const byOEMbyMonth = {};
  const byVendor = {};
  const byContract = {};
  const transactions = [];
  
  let totalSavings = 0;
  let totalCPL = 0;
  let totalPaid = 0;
  let transactionCount = 0;
  
  for (const row of validRows) {
    const saved = parseNumericValue(row['$ Saved'] || row['$_Saved'] || row['Savings'] || 0);
    const cpl = parseNumericValue(row['Total CPL Price'] || row['CPL Price'] || 0);
    const paid = parseNumericValue(row['Total Price Paid'] || row['Price Paid'] || 0);
    const qty = parseNumericValue(row['QTY Sold'] || row['Quantity'] || 1);
    
    if (saved === 0) continue;
    
    const oem = row['OEM'] || 'Unknown';
    const vendor = row['Vendor'] || 'Unknown';
    const contract = row['Contract #'] || row['Contract'] || 'Unknown';
    const reportingPeriod = row['Reporting Period'] || row['Order Date'] || 'Unknown';
    const partNumber = row['Manufacturer Part Number'] || row['Part Number'] || 'Unknown';
    const description = row['Description of Deliverable'] || row['Description'] || '';
    const discountRate = row['Actual Discount Rate'] || row['OneGov Discount Rate'] || '';
    const fundingDept = row['Funding Dept'] || row['Funding Department'] || 'Gov Wide';
    
    const monthKey = normalizeMonth(reportingPeriod);
    
    // Aggregate by OEM
    if (!byOEM[oem]) {
      byOEM[oem] = { savings: 0, transactions: 0, cpl: 0, paid: 0 };
    }
    byOEM[oem].savings += saved;
    byOEM[oem].transactions += 1;
    byOEM[oem].cpl += cpl;
    byOEM[oem].paid += paid;
    
    // Aggregate by Month
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { savings: 0, transactions: 0, cpl: 0, paid: 0 };
    }
    byMonth[monthKey].savings += saved;
    byMonth[monthKey].transactions += 1;
    byMonth[monthKey].cpl += cpl;
    byMonth[monthKey].paid += paid;
    
    // Cross-tabulation OEM x Month
    if (!byOEMbyMonth[oem]) {
      byOEMbyMonth[oem] = {};
    }
    if (!byOEMbyMonth[oem][monthKey]) {
      byOEMbyMonth[oem][monthKey] = 0;
    }
    byOEMbyMonth[oem][monthKey] += saved;
    
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
      description: description.length > 100 ? description.substring(0, 100) + '...' : description,
      quantity: qty,
      cplPrice: cpl,
      pricePaid: paid,
      savings: saved,
      discountRate: discountRate,
      fundingDept: fundingDept,
      reportingPeriod: monthKey
    });
    
    totalSavings += saved;
    totalCPL += cpl;
    totalPaid += paid;
    transactionCount += 1;
  }
  
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
    byOEMbyMonth: byOEMbyMonth,
    byVendor: byVendor,
    byContract: byContract,
    transactions: transactions,
    rawRowCount: rawData.length,
    validRowCount: validRows.length
  };
}

/**
 * Build the complete JSON structure for OneGov Monthly Savings Report
 * FIXED: Proper array structure for savingsByOEM
 */
function buildOneGovSavingsJSON(processedData) {
  const now = new Date();
  
  // Sort OEMs by savings descending and build proper array
  const oemsSorted = Object.entries(processedData.byOEM)
    .sort((a, b) => b[1].savings - a[1].savings)
    .map(([name, data]) => ({
      name: name,
      savings: data.savings,
      savingsFormatted: formatCurrencyCompact(data.savings),
      transactions: data.transactions,
      cpl: data.cpl,
      paid: data.paid,
      percentOfTotal: processedData.summary.totalSavings > 0 
        ? (data.savings / processedData.summary.totalSavings * 100).toFixed(2)
        : "0.00"
    }));
  
  // Sort months chronologically
  const monthOrder = { 'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6, 
                       'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12 };
  
  const monthsSorted = Object.entries(processedData.byMonth)
    .sort((a, b) => {
      const partsA = a[0].split(' ');
      const partsB = b[0].split(' ');
      const monthA = partsA[0];
      const yearA = partsA[1] || '2025';
      const monthB = partsB[0];
      const yearB = partsB[1] || '2025';
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return (monthOrder[monthA] || 0) - (monthOrder[monthB] || 0);
    })
    .map(([name, data]) => ({
      period: name,
      savings: data.savings,
      savingsFormatted: formatCurrencyCompact(data.savings),
      transactions: data.transactions,
      cpl: data.cpl,
      paid: data.paid,
      percentOfTotal: processedData.summary.totalSavings > 0 
        ? (data.savings / processedData.summary.totalSavings * 100).toFixed(2)
        : "0.00"
    }));
  
  // Get all months for stacked chart
  const allMonths = monthsSorted.map(m => m.period);
  
  // Determine reporting period range
  const periods = monthsSorted.map(m => m.period);
  const reportingPeriod = periods.length > 1 
    ? `${periods[0]} - ${periods[periods.length - 1]}`
    : periods[0] || 'Unknown';
  
  // Build the JSON structure - ensuring arrays are properly formed
  const reportJSON = {
    reportType: 'OneGov Monthly Savings',
    reportVersion: '3.1',
    generatedAt: now.toISOString(),
    generatedBy: Session.getActiveUser().getEmail(),
    reportingPeriod: reportingPeriod,
    
    // Configuration for web app
    config: {
      chartImagesFolderId: REPORT_CONFIG.CHART_IMAGES_FOLDER_ID,
      finalReportsFolderId: REPORT_CONFIG.FINAL_REPORTS_FOLDER_ID
    },
    
    executiveSummary: {
      data: {
        totalSavings: processedData.summary.totalSavings,
        totalSavingsFormatted: formatCurrencyCompact(processedData.summary.totalSavings),
        totalTransactions: processedData.summary.transactionCount,
        totalCPL: processedData.summary.totalCPL,
        totalCPLFormatted: formatCurrencyCompact(processedData.summary.totalCPL),
        totalPaid: processedData.summary.totalPaid,
        totalPaidFormatted: formatCurrencyCompact(processedData.summary.totalPaid),
        overallDiscountRate: processedData.summary.overallDiscountRate + '%',
        oemCount: processedData.summary.oemCount,
        vendorCount: processedData.summary.vendorCount,
        topOEM: oemsSorted[0]?.name || 'N/A',
        topOEMSavings: oemsSorted[0]?.savingsFormatted || '$0',
        topOEMPercent: oemsSorted[0]?.percentOfTotal || '0'
      },
      commentary: ''
    },
    
    financialOverview: {
      data: {
        // FIXED: These are now clean arrays, not corrupted
        savingsByOEM: oemsSorted,
        savingsByMonth: monthsSorted
      },
      commentary: ''
    },
    
    // Chart data ready for Chart.js
    chartData: {
      // For stacked bar chart
      stackedOEM: {
        labels: oemsSorted.map(o => o.name),
        months: allMonths,
        datasets: allMonths.map((month, idx) => ({
          label: month,
          data: oemsSorted.map(oem => processedData.byOEMbyMonth[oem.name]?.[month] || 0)
        })),
        oemTotals: oemsSorted.map(o => o.savings)
      },
      // For month bar chart
      monthlyTotals: {
        labels: monthsSorted.map(m => m.period),
        data: monthsSorted.map(m => m.savings),
        percentages: monthsSorted.map(m => m.percentOfTotal)
      }
    },
    
    transactionDetails: {
      data: {
        transactions: processedData.transactions,
        totalRows: processedData.rawRowCount,
        validatedRows: processedData.validRowCount,
        excludedRows: processedData.rawRowCount - processedData.validRowCount
      },
      commentary: ''
    },
    
    vendorAnalysis: {
      data: {
        byVendor: Object.entries(processedData.byVendor)
          .sort((a, b) => b[1].savings - a[1].savings)
          .map(([name, data]) => ({
            name: name,
            savings: data.savings,
            savingsFormatted: formatCurrencyCompact(data.savings),
            transactions: data.transactions,
            percentOfTotal: processedData.summary.totalSavings > 0 
              ? (data.savings / processedData.summary.totalSavings * 100).toFixed(2)
              : "0.00"
          })),
        byContract: Object.entries(processedData.byContract)
          .sort((a, b) => b[1].savings - a[1].savings)
          .map(([contract, data]) => ({
            contract: contract,
            vendor: data.vendor,
            savings: data.savings,
            savingsFormatted: formatCurrencyCompact(data.savings),
            transactions: data.transactions
          }))
      },
      commentary: ''
    },
    
    methodology: {
      data: {
        dataSource: 'TDR/BIC transactional data',
        validationCriteria: 'Cost Savings Validated = Y',
        excludedTransactions: processedData.rawRowCount - processedData.validRowCount,
        calculationMethod: 'Savings = Total CPL Price - Total Price Paid'
      },
      commentary: ''
    },
    
    addendum: {
      data: {},
      commentary: ''
    },
    
    // Table data for display
    tables: {
      oemSummary: {
        title: 'Savings by OEM',
        headers: ['OEM', 'Savings', '% of Total', 'Transactions', 'CPL', 'Paid'],
        rows: oemsSorted.map(oem => [
          oem.name,
          oem.savingsFormatted,
          oem.percentOfTotal + '%',
          oem.transactions,
          formatCurrencyCompact(oem.cpl),
          formatCurrencyCompact(oem.paid)
        ])
      },
      monthSummary: {
        title: 'Savings by Month',
        headers: ['Period', 'Savings', '% of Total', 'Transactions'],
        rows: monthsSorted.map(month => [
          month.period,
          month.savingsFormatted,
          month.percentOfTotal + '%',
          month.transactions
        ])
      }
    }
  };
  
  return reportJSON;
}

/**
 * Format currency in compact form ($1.2M, $500K, etc.)
 */
function formatCurrencyCompact(value) {
  if (value === null || value === undefined || isNaN(value)) return '$0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1000000000) {
    return sign + '$' + (absValue / 1000000000).toFixed(1) + 'B';
  } else if (absValue >= 1000000) {
    return sign + '$' + (absValue / 1000000).toFixed(1) + 'M';
  } else if (absValue >= 1000) {
    return sign + '$' + (absValue / 1000).toFixed(1) + 'K';
  } else {
    return sign + '$' + absValue.toFixed(0);
  }
}

// ============================================================================
// DATA READING FUNCTIONS
// ============================================================================

/**
 * Read data from various sources (CSV, XLSX, Google Sheet)
 */
function readDataSource(link) {
  const isSheet = link.includes('spreadsheets') || link.includes('docs.google.com/spreadsheets');
  const isXlsx = link.toLowerCase().includes('.xlsx');
  
  if (isSheet) {
    return readGoogleSheet(link);
  } else if (isXlsx) {
    return readXlsxFile(link);
  } else {
    return readCsvFile(link);
  }
}

/**
 * Read data from a Google Sheet
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
 */
function readCsvFile(link) {
  const fileId = extractFileId(link);
  const file = DriveApp.getFileById(fileId);
  const csvData = file.getBlob().getDataAsString();
  
  return parseCsvData(csvData);
}

/**
 * Read data from an XLSX file in Drive
 */
function readXlsxFile(link) {
  const fileId = extractFileId(link);
  
  const tempFile = Drive.Files.copy(
    { title: 'TempConversion_' + new Date().getTime(), mimeType: MimeType.GOOGLE_SHEETS },
    fileId
  );
  
  try {
    const spreadsheet = SpreadsheetApp.openById(tempFile.id);
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
    try {
      DriveApp.getFileById(tempFile.id).setTrashed(true);
    } catch (e) {
      Logger.log('Could not trash temp file: ' + e.toString());
    }
  }
}

/**
 * Parse CSV data into array of objects
 */
function parseCsvData(csvData) {
  const lines = csvData.split(/\r?\n/);
  const result = [];
  
  if (lines.length < 2) {
    throw new Error('CSV has no data rows');
  }
  
  const headers = parseCSVLine(lines[0]);
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const values = parseCSVLine(lines[i]);
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
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
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
 */
function extractFileId(link) {
  if (!link) throw new Error('No link provided');
  
  if (!/[\/]/.test(link) && !link.includes('://')) {
    return link.trim();
  }
  
  let fileId = link;
  
  if (link.includes('docs.google.com/spreadsheets/d/')) {
    fileId = link.split('docs.google.com/spreadsheets/d/')[1].split(/[\/\?#]/)[0];
  }
  else if (link.includes('drive.google.com/file/d/')) {
    fileId = link.split('drive.google.com/file/d/')[1].split(/[\/\?#]/)[0];
  }
  else if (link.includes('id=')) {
    fileId = link.split('id=')[1].split(/[&\?#]/)[0];
  }
  
  return fileId.trim();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse numeric value from string
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
 */
function normalizeMonth(value) {
  if (!value) return 'Unknown';
  
  const str = String(value).trim();
  
  const dashMatch = str.match(/(\d{2})-([A-Za-z]{3})/);
  if (dashMatch) {
    const year = '20' + dashMatch[1];
    const month = dashMatch[2];
    return `${month} ${year}`;
  }
  
  if (value instanceof Date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[value.getMonth()]} ${value.getFullYear()}`;
  }
  
  const slashMatch = str.match(/(\d{1,2})\/\d{1,2}\/(\d{4})/);
  if (slashMatch) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNum = parseInt(slashMatch[1]) - 1;
    return `${months[monthNum]} ${slashMatch[2]}`;
  }
  
  return str;
}

/**
 * Creates the Reports sheet with proper headers - UPDATED for new structure
 */
function createReportsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
  
  if (!reportsSheet) {
    reportsSheet = ss.insertSheet(REPORT_CONFIG.REPORTS_SHEET_NAME);
    
    // Updated headers with Description column
    const headers = [
      'Report Type',
      'Report Description',
      'Report Data Link',
      'Report JSON',
      'Report Image 1',
      'Report Image 2',
      'Report Drive URL',
      'Report Creator',
      'Report Timestamp',
      'Level 1 Reviewer',
      'Level 1 Review Timestamp',
      'Level 2 Reviewer',
      'Level 2 Review Timestamp'
    ];
    
    reportsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    reportsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    reportsSheet.getRange(1, 1, 1, headers.length).setBackground('#144673');
    reportsSheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
    reportsSheet.setFrozenRows(1);
    
    // Set column widths
    reportsSheet.setColumnWidth(1, 180);  // A: Report Type
    reportsSheet.setColumnWidth(2, 250);  // B: Description
    reportsSheet.setColumnWidth(3, 350);  // C: Data Link
    reportsSheet.setColumnWidth(4, 100);  // D: JSON
    reportsSheet.setColumnWidth(5, 200);  // E: Image 1
    reportsSheet.setColumnWidth(6, 200);  // F: Image 2
    reportsSheet.setColumnWidth(7, 250);  // G: Drive URL
    reportsSheet.setColumnWidth(8, 180);  // H: Creator
    reportsSheet.setColumnWidth(9, 150);  // I: Timestamp
    reportsSheet.setColumnWidth(10, 180); // J: Level 1 Reviewer
    reportsSheet.setColumnWidth(11, 150); // K: Level 1 Timestamp
    reportsSheet.setColumnWidth(12, 180); // L: Level 2 Reviewer
    reportsSheet.setColumnWidth(13, 150); // M: Level 2 Timestamp
    
    // Add dropdown for Report Type
    const reportTypes = [
      REPORT_CONFIG.REPORT_TYPES.DISCOUNT_OFFERS,
      REPORT_CONFIG.REPORT_TYPES.MONTHLY_ONEGOV_SAVINGS
    ];
    const validation = SpreadsheetApp.newDataValidation()
      .requireValueInList(reportTypes, true)
      .setAllowInvalid(false)
      .build();
    reportsSheet.getRange(2, 1, 100, 1).setDataValidation(validation);
    
    SpreadsheetApp.getUi().alert('✅ Reports sheet created successfully with new column structure!');
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
    'Test Data Source Connection',
    'Enter a Google Drive file link or Sheet URL to test:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const link = response.getResponseText();
    
    try {
      const data = readDataSource(link);
      
      const columns = Object.keys(data[0] || {});
      const message = `✅ Connection successful!\n\n` +
        `Rows read: ${data.length}\n` +
        `Columns: ${columns.length}\n\n` +
        `Column headers:\n${columns.slice(0, 15).join('\n')}` +
        (columns.length > 15 ? '\n...' : '');
      
      ui.alert(message);
      
    } catch (error) {
      ui.alert('❌ Connection failed:\n\n' + error.toString());
    }
  }
}

// ============================================================================
// WEB APP INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Get all reports for web app - UPDATED for new column structure
 */
function getReportsForWebApp() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
  
  if (!reportsSheet) {
    return { error: 'Reports sheet not found', reports: [] };
  }
  
  const lastRow = reportsSheet.getLastRow();
  if (lastRow < 2) {
    return { reports: [] };
  }
  
  const data = reportsSheet.getRange(2, 1, lastRow - 1, 13).getValues();
  const reports = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;
    
    let parsedJson = null;
    const jsonStr = row[REPORT_CONFIG.COLUMNS.JSON];
    if (jsonStr) {
      try {
        parsedJson = JSON.parse(jsonStr);
      } catch (e) {
        Logger.log(`Failed to parse JSON for row ${rowNum}: ${e}`);
      }
    }
    
    reports.push({
      rowNum: rowNum,
      reportType: row[REPORT_CONFIG.COLUMNS.REPORT_TYPE],
      description: row[REPORT_CONFIG.COLUMNS.DESCRIPTION],
      dataLink: row[REPORT_CONFIG.COLUMNS.DATA_LINK],
      json: parsedJson,
      image1: row[REPORT_CONFIG.COLUMNS.IMAGE_1],
      image2: row[REPORT_CONFIG.COLUMNS.IMAGE_2],
      driveUrl: row[REPORT_CONFIG.COLUMNS.DRIVE_URL],
      creator: row[REPORT_CONFIG.COLUMNS.CREATOR],
      timestamp: row[REPORT_CONFIG.COLUMNS.TIMESTAMP],
      level1Reviewer: row[REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER],
      level1Timestamp: row[REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP],
      level2Reviewer: row[REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER],
      level2Timestamp: row[REPORT_CONFIG.COLUMNS.LEVEL2_TIMESTAMP],
      hasJson: !!parsedJson,
      canView: !!parsedJson || !!row[REPORT_CONFIG.COLUMNS.DRIVE_URL]
    });
  }
  
  return { reports: reports };
}

/**
 * Get a specific report by row number - UPDATED for new column structure
 */
function getReportByRow(rowNum) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
  
  if (!reportsSheet) {
    return { error: 'Reports sheet not found' };
  }
  
  const row = reportsSheet.getRange(rowNum, 1, 1, 13).getValues()[0];
  
  let parsedJson = null;
  const jsonStr = row[REPORT_CONFIG.COLUMNS.JSON];
  if (jsonStr) {
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch (e) {
      return { error: 'Failed to parse report JSON: ' + e.toString() };
    }
  }
  
  return {
    rowNum: rowNum,
    reportType: row[REPORT_CONFIG.COLUMNS.REPORT_TYPE],
    description: row[REPORT_CONFIG.COLUMNS.DESCRIPTION],
    dataLink: row[REPORT_CONFIG.COLUMNS.DATA_LINK],
    json: parsedJson,
    image1: row[REPORT_CONFIG.COLUMNS.IMAGE_1],
    image2: row[REPORT_CONFIG.COLUMNS.IMAGE_2],
    driveUrl: row[REPORT_CONFIG.COLUMNS.DRIVE_URL],
    creator: row[REPORT_CONFIG.COLUMNS.CREATOR],
    timestamp: row[REPORT_CONFIG.COLUMNS.TIMESTAMP]
  };
}

/**
 * Update report after export (save image URLs and drive URL) - UPDATED
 */
function updateReportAfterExport(rowNum, image1Url, image2Url, driveUrl) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
    
    // Column E (5) = Image 1, Column F (6) = Image 2, Column G (7) = Drive URL
    if (image1Url) {
      reportsSheet.getRange(rowNum, REPORT_CONFIG.COLUMNS.IMAGE_1 + 1).setValue(image1Url);
    }
    if (image2Url) {
      reportsSheet.getRange(rowNum, REPORT_CONFIG.COLUMNS.IMAGE_2 + 1).setValue(image2Url);
    }
    if (driveUrl) {
      reportsSheet.getRange(rowNum, REPORT_CONFIG.COLUMNS.DRIVE_URL + 1).setValue(driveUrl);
    }
    
    SpreadsheetApp.flush();
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Update report JSON (for saving commentary) - UPDATED
 */
function updateReportJson(rowNum, updatedJson) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
    
    // Column D (4) = JSON
    reportsSheet.getRange(rowNum, REPORT_CONFIG.COLUMNS.JSON + 1).setValue(JSON.stringify(updatedJson, null, 2));
    SpreadsheetApp.flush();
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Save file to Drive folder
 */
function saveFileToDrive(folderId, base64Data, fileName, mimeType) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { 
      success: true, 
      url: file.getUrl(),
      id: file.getId()
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}