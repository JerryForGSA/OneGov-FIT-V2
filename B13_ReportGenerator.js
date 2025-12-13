// ============================================================================
// REPORT GENERATOR - B13_ReportGenerator_v7_FORMAT_FIX.gs (BOUND SCRIPT)  
// ============================================================================
// This script processes report requests from the Reports sheet and generates
// JSON outputs for various report types. Charts are rendered by the web app.
//
// VERSION: 5.0.0 - Added funding department analysis, gauge data
// 
// NOTE: processOneGovSavingsData() is in a SEPARATE bound script file.
//       This file only contains JSON building and sheet management functions.
//
// REPORTS SHEET COLUMNS (A-K) - 11 COLUMNS:
//   A: Report Type
//   B: Report Description
//   C: Report Data Link
//   D: Report JSON
//   E: Report Drive URL
//   F: Report Creator
//   G: Report Timestamp
//   H: Level 1 Reviewer
//   I: Level 1 Review Timestamp
//   J: Level 2 Reviewer
//   K: Level 2 Review Timestamp
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
  
  // Column indices (0-based for array access) - 12 COLUMN STRUCTURE  
  COLUMNS: {
    REPORT_TYPE: 0,           // A
    DESCRIPTION: 1,           // B
    DATA_LINK: 2,             // C
    JSON: 3,                  // D - Main JSON (aggregations, charts, tables, config)
    DRIVE_URL: 4,             // E
    CREATOR: 5,               // F
    TIMESTAMP: 6,             // G
    LEVEL1_REVIEWER: 7,       // H
    LEVEL1_TIMESTAMP: 8,      // I
    LEVEL2_REVIEWER: 9,       // J
    LEVEL2_TIMESTAMP: 10,     // K
    TRANSACTIONS_JSON: 11     // L - Transactions JSON (transaction array only)
  },
  
  // Supported report types
  REPORT_TYPES: {
    DISCOUNT_OFFERS: 'Discount Offers',
    MONTHLY_ONEGOV_SAVINGS: 'OneGov Monthly Savings'
  },
  
  // Google Doc Template IDs for report types
  TEMPLATES: {
    'OneGov Monthly Savings': '1LJdxUOS-5773UE6mLUCHMnRRJXEtKKh6yaa59GG2xag',
    'Discount Offers': '1xK9i_QJ2rYM3nH8VXzPmDj7hFX98M5rQ3YnW4K9fYNg'  // Add your template ID here
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
    
    const dataRange = reportsSheet.getRange(2, 1, lastRow - 1, 11);
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
      message += '• Column G (Timestamp) is empty';
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
    
    const dataRange = reportsSheet.getRange(2, 1, lastRow - 1, 11);
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
          
          // Update JSON (D), Creator (F), Timestamp (G)
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
      message += '• Column G (Timestamp) is empty';
    }
    
    ui.alert(message);
    
  } catch (error) {
    ui.alert('Error: ' + error.toString());
    Logger.log('Error in generateMonthlyOneGovSavingsReport: ' + error.toString());
  }
}

/**
 * Process a single OneGov Monthly Savings report - JSON only
 * NOTE: processOneGovSavingsData() is defined in a separate bound script file
 */
function processMonthlyOneGovSavingsReport(dataLink) {
  Logger.log(`Reading data from ${dataLink}`);
  const rawData = readDataSource(dataLink);
  Logger.log(`Read ${rawData.length} rows from data source`);
  
  Logger.log(`Processing data...`);
  // processOneGovSavingsData is defined in separate bound script
  const processedData = processOneGovSavingsData(rawData);
  Logger.log(`Processed: ${processedData.summary.transactionCount} transactions, $${processedData.summary.totalSavings} total savings`);
  
  Logger.log(`Building JSON structure...`);
  const reportJSON = buildOneGovSavingsJSON(processedData);
  
  return JSON.stringify(reportJSON, null, 2);
}

/**
 * Build the complete JSON structure for OneGov Monthly Savings Report
 * VERSION 5.0: Added funding department analysis and gauge data
 * 
 * @param {Object} processedData - Output from processOneGovSavingsData()
 * @returns {Object} Complete JSON structure for report
 */
function buildOneGovSavingsJSON(processedData) {
  const now = new Date();
  
  // Sort OEMs by savings descending and build proper array
  const oemsSorted = Object.entries(processedData.byOEM)
    .sort((a, b) => b[1].savings - a[1].savings)
    .map(([name, data]) => {
      const discountRate = data.cpl > 0 ? ((data.cpl - data.paid) / data.cpl * 100).toFixed(2) : 0;
      return {
        name: name,
        savings: data.savings,
        savingsFormatted: formatCurrencyCompact(data.savings),
        transactions: data.transactions,
        cpl: data.cpl,
        cplFormatted: formatCurrencyCompact(data.cpl),
        paid: data.paid,
        paidFormatted: formatCurrencyCompact(data.paid),
        discountRate: discountRate,
        percentOfTotal: processedData.summary.totalSavings > 0 
          ? (data.savings / processedData.summary.totalSavings * 100).toFixed(2)
          : "0.00"
      };
    });
  
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
  
  // Sort Funding Departments by savings descending
  const fundingDeptsSorted = Object.entries(processedData.byFundingDept || {})
    .sort((a, b) => b[1].savings - a[1].savings)
    .map(([name, data]) => {
      const discountRate = data.cpl > 0 ? ((data.cpl - data.paid) / data.cpl * 100).toFixed(2) : 0;
      return {
        name: name,
        savings: data.savings,
        savingsFormatted: formatCurrencyCompact(data.savings),
        transactions: data.transactions,
        cpl: data.cpl,
        cplFormatted: formatCurrencyCompact(data.cpl),
        paid: data.paid,
        paidFormatted: formatCurrencyCompact(data.paid),
        discountRate: discountRate,
        percentOfTotal: processedData.summary.totalSavings > 0 
          ? (data.savings / processedData.summary.totalSavings * 100).toFixed(2)
          : "0.00"
      };
    });
  
  // Get all months for stacked chart
  const allMonths = monthsSorted.map(m => m.period);
  
  // Determine reporting period range
  const periods = monthsSorted.map(m => m.period);
  const reportingPeriod = periods.length > 1 
    ? `${periods[0]} - ${periods[periods.length - 1]}`
    : periods[0] || 'Unknown';
  
  // ========================================
  // Build Gauge Chart Data
  // ========================================
  
  // Overall Program Gauge
  const overallRealizationPercent = processedData.summary.totalCPL > 0 
    ? (processedData.summary.totalSavings / processedData.summary.totalCPL * 100).toFixed(2)
    : 0;
  
  const overallGauge = {
    label: 'Program Savings Realization',
    realized: processedData.summary.totalSavings,
    realizedFormatted: formatCurrencyCompact(processedData.summary.totalSavings),
    potential: processedData.summary.totalCPL,
    potentialFormatted: formatCurrencyCompact(processedData.summary.totalCPL),
    paid: processedData.summary.totalPaid,
    paidFormatted: formatCurrencyCompact(processedData.summary.totalPaid),
    percentage: parseFloat(overallRealizationPercent),
    percentageFormatted: overallRealizationPercent + '%',
    discountRate: processedData.summary.overallDiscountRate,
    discountRateFormatted: processedData.summary.overallDiscountRate + '%',
    commentary: ''
  };
  
  // Per-OEM Gauges
  const oemGauges = oemsSorted.map((oem, index) => {
    const realizationPercent = oem.cpl > 0 
      ? (oem.savings / oem.cpl * 100).toFixed(2)
      : 0;
    
    return {
      index: index + 1,
      name: oem.name,
      realized: oem.savings,
      realizedFormatted: oem.savingsFormatted,
      potential: oem.cpl,
      potentialFormatted: oem.cplFormatted,
      paid: oem.paid,
      paidFormatted: oem.paidFormatted,
      percentage: parseFloat(realizationPercent),
      percentageFormatted: realizationPercent + '%',
      transactions: oem.transactions,
      percentOfTotal: parseFloat(oem.percentOfTotal),
      percentOfTotalFormatted: oem.percentOfTotal + '%',
      discountRate: parseFloat(oem.discountRate),
      discountRateFormatted: oem.discountRate + '%',
      commentary: ''
    };
  });
  
  // ========================================
  // Build Entity Lists for Placeholders
  // ========================================
  
  // Track OEMs by month for "new this month" detection
  // Use oemsByMonth from processedData if available
  const oemsByMonth = processedData.oemsByMonth || {};
  
  // Get last month and check for new OEMs
  const lastPeriod = allMonths[allMonths.length - 1];
  const previousPeriods = allMonths.slice(0, -1);
  
  // Convert Set to Array if needed
  const oemsInLastPeriod = oemsByMonth[lastPeriod] 
    ? (oemsByMonth[lastPeriod] instanceof Set ? Array.from(oemsByMonth[lastPeriod]) : oemsByMonth[lastPeriod])
    : [];
  
  const oemsInPreviousPeriods = new Set();
  previousPeriods.forEach(p => {
    const oems = oemsByMonth[p];
    if (oems) {
      const oemArray = oems instanceof Set ? Array.from(oems) : oems;
      oemArray.forEach(o => oemsInPreviousPeriods.add(o));
    }
  });
  
  const newOEMs = oemsInLastPeriod.filter(oem => !oemsInPreviousPeriods.has(oem));
  
  // Current month data
  const currentMonthData = processedData.byMonth[lastPeriod] || { savings: 0, transactions: 0 };
  const currentMonthOEMs = oemsInLastPeriod;
  const currentMonthVendors = [...new Set(
    processedData.transactions
      .filter(t => t.reportingPeriod === lastPeriod)
      .map(t => t.vendor)
  )];
  
  // Build the JSON structure
  const reportJSON = {
    reportType: 'OneGov Monthly Savings',
    reportVersion: '5.0',
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
        fundingDeptCount: processedData.summary.fundingDeptCount || fundingDeptsSorted.length,
        topOEM: oemsSorted[0]?.name || 'N/A',
        topOEMSavings: oemsSorted[0]?.savingsFormatted || '$0',
        topOEMPercent: oemsSorted[0]?.percentOfTotal || '0',
        topFundingDept: fundingDeptsSorted[0]?.name || 'N/A',
        topFundingDeptSavings: fundingDeptsSorted[0]?.savingsFormatted || '$0',
        topFundingDeptPercent: fundingDeptsSorted[0]?.percentOfTotal || '0'
      },
      commentary: ''
    },
    
    financialOverview: {
      data: {
        savingsByOEM: oemsSorted,
        savingsByMonth: monthsSorted
      },
      commentary: ''
    },
    
    // ========================================
    // NEW: Funding Department Analysis
    // ========================================
    fundingDeptAnalysis: {
      data: {
        savingsByFundingDept: fundingDeptsSorted,
        totalDepartments: fundingDeptsSorted.length,
        topDepartment: fundingDeptsSorted[0] || null
      },
      commentary: ''
    },
    
    // ========================================
    // Gauge Chart Data Section
    // ========================================
    gaugeData: {
      overall: overallGauge,
      byOEM: oemGauges,
      oemCount: oemGauges.length
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
      },
      // For funding dept bar chart
      fundingDeptTotals: {
        labels: fundingDeptsSorted.map(f => f.name),
        data: fundingDeptsSorted.map(f => f.savings),
        percentages: fundingDeptsSorted.map(f => f.percentOfTotal)
      },
      // For gauge charts
      overallGauge: overallGauge,
      oemGauges: oemGauges
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
    
    // ========================================
    // All Entities Section (for placeholders)
    // ========================================
    allEntities: {
      oems: {
        list: oemsSorted.map(o => o.name),
        formatted: formatListWithAnd(oemsSorted.map(o => o.name)),
        count: oemsSorted.length
      },
      vendors: {
        list: Object.keys(processedData.byVendor).sort((a, b) => 
          processedData.byVendor[b].savings - processedData.byVendor[a].savings
        ),
        formatted: formatListWithAnd(Object.keys(processedData.byVendor).sort((a, b) => 
          processedData.byVendor[b].savings - processedData.byVendor[a].savings
        )),
        count: Object.keys(processedData.byVendor).length
      },
      contracts: {
        list: Object.keys(processedData.byContract),
        formatted: Object.keys(processedData.byContract).join(', '),
        count: Object.keys(processedData.byContract).length
      },
      fundingDepts: {
        list: fundingDeptsSorted.map(f => f.name),
        formatted: formatListWithAnd(fundingDeptsSorted.map(f => f.name)),
        count: fundingDeptsSorted.length
      },
      newOEMsThisMonth: {
        list: newOEMs,
        formatted: newOEMs.length > 0 ? formatListWithAnd(newOEMs) : 'None',
        count: newOEMs.length,
        period: lastPeriod
      },
      currentMonth: {
        period: lastPeriod,
        savings: currentMonthData.savings,
        savingsFormatted: formatCurrencyCompact(currentMonthData.savings),
        transactionCount: currentMonthData.transactions,
        oems: {
          list: currentMonthOEMs,
          formatted: formatListWithAnd(currentMonthOEMs),
          count: currentMonthOEMs.length
        },
        vendors: {
          list: currentMonthVendors,
          formatted: formatListWithAnd(currentMonthVendors),
          count: currentMonthVendors.length
        }
      }
    },
    
    // ========================================
    // Relationships Section (for B03 v4.0 compatibility)
    // ========================================
    relationships: {
      vendorsByOEM: processedData.vendorsByOEM || {},
      oemsByVendor: processedData.oemsByVendor || {}
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
          oem.cplFormatted,
          oem.paidFormatted
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
      },
      fundingDeptSummary: {
        title: 'Savings by Funding Department',
        headers: ['Department', 'Savings', '% of Total', 'Transactions', 'Discount Rate'],
        rows: fundingDeptsSorted.map(dept => [
          dept.name,
          dept.savingsFormatted,
          dept.percentOfTotal + '%',
          dept.transactions,
          dept.discountRate + '%'
        ])
      }
    }
  };
  
  return reportJSON;
}

/**
 * Format a list with "and" before the last item (Oxford comma)
 */
function formatListWithAnd(items) {
  if (!items || items.length === 0) return 'None';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
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
    DriveApp.getFileById(tempFile.id).setTrashed(true);
  }
}

/**
 * Parse CSV data into array of objects
 */
function parseCsvData(csvString) {
  const lines = csvString.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV has no data rows');
  }
  
  const headers = parseCSVLine(lines[0]);
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.every(v => !v)) continue;
    
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    result.push(row);
  }
  
  return result;
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
      if (inQuotes && line[i + 1] === '"') {
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
 * Extract file ID from Google Drive URL
 */
function extractFileId(link) {
  let fileId = '';
  
  if (link.includes('/d/')) {
    const match = link.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) fileId = match[1];
  } else if (link.includes('id=')) {
    const match = link.match(/id=([a-zA-Z0-9-_]+)/);
    if (match) fileId = match[1];
  } else if (link.includes('/spreadsheets/d/')) {
    const match = link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) fileId = match[1];
  } else {
    fileId = link;
  }
  
  if (!fileId) {
    throw new Error('Could not extract file ID from link: ' + link);
  }
  
  return fileId;
}

/**
 * Normalize month format to "Mon YYYY"
 */
function normalizeMonth(dateValue) {
  if (!dateValue) return 'Unknown';
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (dateValue instanceof Date) {
    return monthNames[dateValue.getMonth()] + ' ' + dateValue.getFullYear();
  }
  
  const str = String(dateValue).trim();
  
  if (/^[A-Za-z]{3}\s+\d{4}$/.test(str)) {
    return str;
  }
  
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return monthNames[date.getMonth()] + ' ' + date.getFullYear();
  }
  
  return str;
}

/**
 * Parse a numeric value from various formats
 */
function parseNumericValue(value) {
  if (value === null || value === undefined || value === '') return 0;
  
  if (typeof value === 'number') return value;
  
  const str = String(value).replace(/[$,\s]/g, '').trim();
  
  if (str === '' || str === '-') return 0;
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// ============================================================================
// SHEET MANAGEMENT
// ============================================================================

/**
 * Create Reports sheet if it doesn't exist - 11 COLUMN STRUCTURE
 */
function createReportsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
  
  if (!reportsSheet) {
    reportsSheet = ss.insertSheet(REPORT_CONFIG.REPORTS_SHEET_NAME);
    
    const headers = [
      'Report Type',           // A
      'Description',           // B
      'Data Link',             // C
      'JSON',                  // D
      'Drive URL',             // E
      'Creator',               // F
      'Timestamp',             // G
      'Level 1 Reviewer',      // H
      'Level 1 Timestamp',     // I
      'Level 2 Reviewer',      // J
      'Level 2 Timestamp'      // K
    ];
    
    reportsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    reportsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    reportsSheet.getRange(1, 1, 1, headers.length).setBackground('#144673');
    reportsSheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
    reportsSheet.setFrozenRows(1);
    
    reportsSheet.setColumnWidth(1, 180);
    reportsSheet.setColumnWidth(2, 250);
    reportsSheet.setColumnWidth(3, 350);
    reportsSheet.setColumnWidth(4, 100);
    reportsSheet.setColumnWidth(5, 250);
    reportsSheet.setColumnWidth(6, 180);
    reportsSheet.setColumnWidth(7, 150);
    reportsSheet.setColumnWidth(8, 180);
    reportsSheet.setColumnWidth(9, 150);
    reportsSheet.setColumnWidth(10, 180);
    reportsSheet.setColumnWidth(11, 150);
    
    const reportTypes = [
      REPORT_CONFIG.REPORT_TYPES.DISCOUNT_OFFERS,
      REPORT_CONFIG.REPORT_TYPES.MONTHLY_ONEGOV_SAVINGS
    ];
    const validation = SpreadsheetApp.newDataValidation()
      .requireValueInList(reportTypes, true)
      .setAllowInvalid(false)
      .build();
    reportsSheet.getRange(2, 1, 100, 1).setDataValidation(validation);
    
    SpreadsheetApp.getUi().alert('✅ Reports sheet created successfully with 11-column structure!');
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
// DOCUMENT GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate a report document from JSON data using Google Doc templates
 * Similar to Entity Profile generation but for reports
 * 
 * @param {number} rowNum - Row number in Reports sheet
 * @returns {Object} Result with success status and document URL
 */
function generateReportDocument(rowNum) {
  try {
    console.log(`📄 Generating Report Document for row ${rowNum}`);
    
    // Use the same spreadsheet ID pattern as getSimpleReports
    const ss = SpreadsheetApp.openById('18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE');
    const reportsSheet = ss.getSheetByName('Reports');
    
    if (!reportsSheet) {
      throw new Error('Reports sheet not found');
    }
    
    // Get report data from the row (now reading up to column L)
    const row = reportsSheet.getRange(rowNum, 1, 1, 12).getValues()[0];
    const reportType = row[0]; // Column A
    const mainJsonStr = row[3];    // Column D - Main JSON (aggregations, charts, tables, config)
    const transactionsJsonStr = row[11]; // Column L - Transactions JSON (transaction array only)
    const existingUrl = row[4]; // Column E
    
    // Check if document already exists
    if (existingUrl && existingUrl.trim() !== '') {
      console.log('📄 Document already exists:', existingUrl);
      return {
        success: true,
        documentUrl: existingUrl,
        message: 'Document already exists'
      };
    }
    
    // Check if we have JSON data
    if (!mainJsonStr || mainJsonStr.trim() === '') {
      throw new Error('No main JSON data available for report generation');
    }
    
    // Parse both JSON data sources
    let reportData;
    let transactionsData = [];
    
    try {
      reportData = JSON.parse(mainJsonStr);
    } catch (e) {
      throw new Error('Failed to parse main JSON data: ' + e.toString());
    }
    
    if (transactionsJsonStr && transactionsJsonStr.trim() !== '') {
      try {
        transactionsData = JSON.parse(transactionsJsonStr);
        // Add transactions to reportData structure
        if (!reportData.transactionDetails) {
          reportData.transactionDetails = { data: {} };
        }
        reportData.transactionDetails.data.transactions = transactionsData;
      } catch (e) {
        console.log('Warning: Failed to parse transactions JSON: ' + e.toString());
        // Continue without transactions data
      }
    }
    
    // Check if we have a template for this report type
    const templateId = REPORT_CONFIG.TEMPLATES[reportType];
    if (!templateId) {
      throw new Error(`No template configured for report type: ${reportType}`);
    }
    
    // Generate the document based on report type
    let documentUrl;
    if (reportType === 'OneGov Monthly Savings') {
      documentUrl = generateOneGovSavingsDocument(templateId, reportData, rowNum);
    } else if (reportType === 'Discount Offers') {
      documentUrl = generateDiscountOffersDocument(templateId, reportData, rowNum);
    } else {
      throw new Error(`Unsupported report type: ${reportType}`);
    }
    
    // Save the document URL to column E (column 5, which is index 4 + 1)
    reportsSheet.getRange(rowNum, 5).setValue(documentUrl);
    console.log(`✅ Document URL saved to column E: ${documentUrl}`);
    
    return {
      success: true,
      documentUrl: documentUrl,
      message: 'Document generated successfully'
    };
    
  } catch (error) {
    console.error('❌ Error generating report document:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Generate OneGov Monthly Savings document from template
 */
function generateOneGovSavingsDocument(templateId, reportData, rowNum) {
  try {
    // Create a copy of the template
    const template = DriveApp.getFileById(templateId);
    const fileName = `OneGov Monthly Savings Report - ${reportData.reportingPeriod || new Date().toLocaleDateString()}`;
    const docCopy = template.makeCopy(fileName);
    
    // Move to reports folder if configured
    if (REPORT_CONFIG.FINAL_REPORTS_FOLDER_ID) {
      const folder = DriveApp.getFolderById(REPORT_CONFIG.FINAL_REPORTS_FOLDER_ID);
      docCopy.moveTo(folder);
    }
    
    // Open the document for editing
    const doc = DocumentApp.openById(docCopy.getId());
    const body = doc.getBody();
    
    // Build placeholders from report data
    const placeholders = buildPlaceholdersFromReportData(reportData);
    
    // Log placeholder count and first few placeholders
    console.log(`📝 Replacing ${Object.keys(placeholders).length} placeholders in document`);
    console.log('🔍 First 10 placeholders:', Object.keys(placeholders).slice(0, 10));
    console.log('📄 Document text preview:', body.getText().substring(0, 500));
    console.log('🔍 Checking for template markers in document...');
    const docText = body.getText();
    console.log('OEM_TEMPLATE_START found:', docText.includes('{{OEM_TEMPLATE_START}}'));
    console.log('VENDOR_TEMPLATE_START found:', docText.includes('{{VENDOR_TEMPLATE_START}}'));
    console.log('FUNDINGDEPT_TEMPLATE_START found:', docText.includes('{{FUNDINGDEPT_TEMPLATE_START}}'));
    
    // Replace all placeholders
    let replacementCount = 0;
    for (const [key, value] of Object.entries(placeholders)) {
      const searchPattern = `\\{\\{${key}\\}\\}`;  // Escape the curly braces for regex
      const replaceValue = String(value || 'N/A');
      
      try {
        // Use replaceText with the escaped pattern
        body.replaceText(searchPattern, replaceValue);
        replacementCount++;
        console.log(`✅ Replaced {{${key}}} with "${replaceValue}"`);
      } catch (e) {
        console.log(`⚠️ Could not replace {{${key}}}: ${e.toString()}`);
      }
    }
    
    console.log(`📊 Total replacements made: ${replacementCount}`);
    
    // Generate and insert charts if we have chart data
    if (reportData.chartData || reportData.oemAnalysis) {
      console.log('📊 Generating charts from JSON data...');
      generateAndInsertChartsFromJSON(docCopy.getId(), reportData);
    }
    
    // Save and close the document
    doc.saveAndClose();
    
    // Get the document ID and create proper URL
    const docId = docCopy.getId();
    
    // Set document permissions to anyone with link can view
    try {
      DriveApp.getFileById(docId).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      console.log('✅ Document permissions set to: Anyone with link can view');
    } catch (e) {
      console.log('⚠️ Could not set document permissions:', e.toString());
      // Try alternative: just make it viewable by domain
      try {
        DriveApp.getFileById(docId).setShareableByEditors(true);
      } catch (e2) {
        console.log('⚠️ Could not set shareable by editors:', e2.toString());
      }
    }
    
    // Create the proper Google Docs URL
    const documentUrl = `https://docs.google.com/document/d/${docId}/edit`;
    console.log(`✅ OneGov Savings document created: ${documentUrl}`);
    
    return documentUrl;
    
  } catch (error) {
    console.error('Error generating OneGov Savings document:', error);
    throw error;
  }
}

/**
 * Generate Discount Offers document from template
 */
function generateDiscountOffersDocument(templateId, reportData, rowNum) {
  try {
    // Create a copy of the template
    const template = DriveApp.getFileById(templateId);
    const fileName = `Discount Offers Report - ${new Date().toLocaleDateString()}`;
    const docCopy = template.makeCopy(fileName);
    
    // Move to reports folder if configured
    if (REPORT_CONFIG.FINAL_REPORTS_FOLDER_ID) {
      const folder = DriveApp.getFolderById(REPORT_CONFIG.FINAL_REPORTS_FOLDER_ID);
      docCopy.moveTo(folder);
    }
    
    // Open the document for editing
    const doc = DocumentApp.openById(docCopy.getId());
    const body = doc.getBody();
    
    // Helper function to convert abbreviated month to full format and extract end period
    function expandMonthPeriod(reportingPeriod) {
      if (!reportingPeriod) return '';
      
      // If it's a range like "June 2025 - Sep 2025", extract the end period
      if (reportingPeriod.includes(' - ')) {
        const parts = reportingPeriod.split(' - ');
        reportingPeriod = parts[parts.length - 1].trim(); // Get the last part (end period)
      }
      
      const monthMap = {
        'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
        'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
        'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
      };
      
      // Expand abbreviated months  
      for (const [abbrev, full] of Object.entries(monthMap)) {
        if (reportingPeriod.includes(abbrev)) {
          return reportingPeriod.replace(abbrev, full);
        }
      }
      
      // If already full or unknown format, return as-is
      return reportingPeriod;
    }

    // Helper function to format period as "June through September 2025"
    function formatPeriodThrough(reportingPeriod) {
      if (!reportingPeriod) return '';
      
      // If it's a range like "June 2025 - Sep 2025", format as "June through September 2025"
      if (reportingPeriod.includes(' - ')) {
        const parts = reportingPeriod.split(' - ');
        let startPart = parts[0].trim();
        let endPart = parts[parts.length - 1].trim();
        
        const monthMap = {
          'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
          'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
          'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
        };
        
        // Expand abbreviated months in both parts
        for (const [abbrev, full] of Object.entries(monthMap)) {
          startPart = startPart.replace(abbrev, full);
          endPart = endPart.replace(abbrev, full);
        }
        
        // Extract month and year from each part
        const startTokens = startPart.split(' ');
        const endTokens = endPart.split(' ');
        
        const startMonth = startTokens[0];
        const startYear = startTokens[1];
        const endMonth = endTokens[0]; 
        const endYear = endTokens[1] || startYear;
        
        // Format as "StartMonth through EndMonth Year"
        return `${startMonth} through ${endMonth} ${endYear}`;
      }
      
      // If single period, just expand abbreviations
      return expandMonthPeriod(reportingPeriod);
    }

    // Build placeholders for discount offers
    const placeholders = {
      REPORT_DATE: new Date().toLocaleDateString(),
      'CURRENT_MONTH.PERIOD_FULL': expandMonthPeriod(reportData.reportingPeriod || ''),
      'REPORTING_PERIOD_THROUGH': formatPeriodThrough(reportData.reportingPeriod || ''),
      TOTAL_OEMS: reportData.summary?.totalOEMs || '0',
      TOTAL_DISCOUNTS: reportData.summary?.totalDiscounts || '0',
      AVG_DISCOUNT: reportData.summary?.averageDiscount || '0%'
    };
    
    // Add OEM-specific data if available
    if (reportData.oems && Array.isArray(reportData.oems)) {
      reportData.oems.forEach((oem, index) => {
        if (index < 10) { // Limit to top 10 OEMs
          placeholders[`OEM_${index + 1}_NAME`] = oem.name || '';
          placeholders[`OEM_${index + 1}_DISCOUNT`] = oem.discount || '';
          placeholders[`OEM_${index + 1}_PRODUCTS`] = oem.productCount || '0';
        }
      });
    }
    
    // Replace all placeholders
    for (const [key, value] of Object.entries(placeholders)) {
      const searchText = `{{${key}}}`;
      body.replaceText(searchText, value || 'N/A');
    }
    
    // Save and close the document
    doc.saveAndClose();
    
    // Get the document ID and create proper URL
    const docId = docCopy.getId();
    
    // Set document permissions to anyone with link can view
    try {
      DriveApp.getFileById(docId).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      console.log('✅ Document permissions set to: Anyone with link can view');
    } catch (e) {
      console.log('⚠️ Could not set document permissions:', e.toString());
      // Try alternative: just make it viewable by domain
      try {
        DriveApp.getFileById(docId).setShareableByEditors(true);
      } catch (e2) {
        console.log('⚠️ Could not set shareable by editors:', e2.toString());
      }
    }
    
    // Create the proper Google Docs URL
    const documentUrl = `https://docs.google.com/document/d/${docId}/edit`;
    console.log(`✅ Discount Offers document created: ${documentUrl}`);
    
    return documentUrl;
    
  } catch (error) {
    console.error('Error generating Discount Offers document:', error);
    throw error;
  }
}

/**
 * Build placeholders from report JSON data
 * Maps JSON fields to template placeholders
 * ENHANCED: Now supports B03 v4.0 data structure with byDataSource, byBICStatus, vendorsByOEM
 */
/**
 * Compute vendor-OEM relationships from transactions
 */
function computeRelationshipsFromTransactions(transactions) {
  const vendorsByOEM = {};
  const oemsByVendor = {};
  
  transactions.forEach(transaction => {
    const oem = transaction.oem;
    const vendor = transaction.vendor;
    
    if (!vendorsByOEM[oem]) {
      vendorsByOEM[oem] = new Set();
    }
    vendorsByOEM[oem].add(vendor);
    
    if (!oemsByVendor[vendor]) {
      oemsByVendor[vendor] = new Set();
    }
    oemsByVendor[vendor].add(oem);
  });
  
  // Convert Sets to Arrays
  const vendorsByOEMArrays = {};
  Object.entries(vendorsByOEM).forEach(([oem, vendors]) => {
    vendorsByOEMArrays[oem] = Array.from(vendors);
  });
  
  const oemsByVendorArrays = {};
  Object.entries(oemsByVendor).forEach(([vendor, oems]) => {
    oemsByVendorArrays[vendor] = Array.from(oems);
  });
  
  return {
    vendorsByOEM: vendorsByOEMArrays,
    oemsByVendor: oemsByVendorArrays
  };
}

function buildPlaceholdersFromReportData(reportData) {
  const placeholders = {};
  
  console.log('📝 Building placeholders from report data structure:', Object.keys(reportData));
  
  // Use relationships from main JSON (Column D) - they're already computed
  let relationships = reportData.relationships || {};
  
  // Only compute from transactions as fallback for legacy data
  if (!relationships.vendorsByOEM && reportData.transactionDetails?.data?.transactions) {
    console.log('🔗 Fallback: Computing relationships from transactions for legacy data');
    relationships = computeRelationshipsFromTransactions(reportData.transactionDetails.data.transactions);
  }
  
  // Helper function to expand abbreviated months and extract end period from ranges
  function expandMonthPeriod(reportingPeriod) {
    if (!reportingPeriod) return '';
    
    // If it's a range like "June 2025 - Sep 2025", extract the end period
    if (reportingPeriod.includes(' - ')) {
      const parts = reportingPeriod.split(' - ');
      reportingPeriod = parts[parts.length - 1].trim(); // Get the last part (end period)
    }
    
    const monthMap = {
      'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
      'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
      'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
    };
    
    // Expand abbreviated months
    for (const [abbrev, full] of Object.entries(monthMap)) {
      if (reportingPeriod.includes(abbrev)) {
        return reportingPeriod.replace(abbrev, full);
      }
    }
    
    return reportingPeriod;
  }

  // Helper function to format period as "June through September 2025"
  function formatPeriodThrough(reportingPeriod) {
    if (!reportingPeriod) return '';
    
    // If it's a range like "June 2025 - Sep 2025", format as "June through September 2025"
    if (reportingPeriod.includes(' - ')) {
      const parts = reportingPeriod.split(' - ');
      let startPart = parts[0].trim();
      let endPart = parts[parts.length - 1].trim();
      
      const monthMap = {
        'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
        'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
        'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
      };
      
      // Expand abbreviated months in both parts
      for (const [abbrev, full] of Object.entries(monthMap)) {
        startPart = startPart.replace(abbrev, full);
        endPart = endPart.replace(abbrev, full);
      }
      
      // Extract month and year from each part
      const startTokens = startPart.split(' ');
      const endTokens = endPart.split(' ');
      
      const startMonth = startTokens[0];
      const startYear = startTokens[1];
      const endMonth = endTokens[0]; 
      const endYear = endTokens[1] || startYear;
      
      // Format as "StartMonth through EndMonth Year"
      return `${startMonth} through ${endMonth} ${endYear}`;
    }
    
    // If single period, just expand abbreviations
    return expandMonthPeriod(reportingPeriod);
  }

  // Basic report information
  placeholders['REPORT_DATE'] = new Date().toLocaleDateString();
  placeholders['REPORTING_PERIOD'] = reportData.reportingPeriod || '';
  placeholders['REPORTING_MONTH'] = reportData.reportingPeriod || '';
  placeholders['CURRENT_MONTH.PERIOD_FULL'] = expandMonthPeriod(reportData.reportingPeriod || '');
  placeholders['REPORTING_PERIOD_THROUGH'] = formatPeriodThrough(reportData.reportingPeriod || '');
  
  // Executive Summary data (nested in .data object)
  const execSummary = reportData.executiveSummary?.data || {};
  placeholders['TOTAL_SAVINGS'] = execSummary.totalSavingsFormatted || '';
  placeholders['EXEC.TOTAL_SAVINGS_FORMATTED'] = execSummary.totalSavingsFormatted || '';
  placeholders['DISCOUNT_RATE'] = execSummary.overallDiscountRate || '';
  placeholders['OEM_COUNT'] = execSummary.oemCount || '0';
  placeholders['VENDOR_COUNT'] = execSummary.vendorCount || '0';
  placeholders['CONTRACT_COUNT'] = reportData.allEntities?.contracts?.count || '2';
  
  // Enhanced B03 v4.0 Summary placeholders
  if (reportData.summary) {
    placeholders['TOTAL_QUANTITY'] = reportData.summary.totalQuantity || '0';
    placeholders['NEW_SAVINGS'] = formatCurrencyCompact(reportData.summary.newSavings || 0);
    placeholders['PREVIOUSLY_REPORTED_SAVINGS'] = formatCurrencyCompact(reportData.summary.previouslyReportedSavings || 0);
    placeholders['DATA_SOURCE_COUNT'] = reportData.summary.dataSourceCount || '0';
  }
  
  // Data Source Analysis (TDR vs BIC)
  if (reportData.byDataSource) {
    const tdrData = reportData.byDataSource['TDR'] || {};
    const bicData = reportData.byDataSource['BIC'] || {};
    
    placeholders['TDR_SAVINGS'] = formatCurrencyCompact(tdrData.savings || 0);
    placeholders['TDR_QUANTITY'] = tdrData.quantity || '0';
    placeholders['BIC_SAVINGS'] = formatCurrencyCompact(bicData.savings || 0);
    placeholders['BIC_QUANTITY'] = bicData.quantity || '0';
    
    const totalSavings = (tdrData.savings || 0) + (bicData.savings || 0);
    if (totalSavings > 0) {
      placeholders['TDR_PERCENT'] = ((tdrData.savings || 0) / totalSavings * 100).toFixed(1) + '%';
      placeholders['BIC_PERCENT'] = ((bicData.savings || 0) / totalSavings * 100).toFixed(1) + '%';
    }
  }
  
  // BIC Status Analysis (In BIC vs TDR Only)
  if (reportData.byBICStatus) {
    const inBIC = reportData.byBICStatus['In BIC'] || {};
    const tdrOnly = reportData.byBICStatus['TDR Only'] || {};
    
    placeholders['IN_BIC_SAVINGS'] = formatCurrencyCompact(inBIC.savings || 0);
    placeholders['IN_BIC_QUANTITY'] = inBIC.quantity || '0';
    placeholders['TDR_ONLY_SAVINGS'] = formatCurrencyCompact(tdrOnly.savings || 0);
    placeholders['TDR_ONLY_QUANTITY'] = tdrOnly.quantity || '0';
  }
  
  // Reporting Status Analysis (New vs Previously Reported)
  if (reportData.byReportingStatus) {
    const newData = reportData.byReportingStatus['New'] || {};
    const previousData = reportData.byReportingStatus['Previously Reported'] || {};
    
    placeholders['NEW_REPORT_SAVINGS'] = formatCurrencyCompact(newData.savings || 0);
    placeholders['NEW_REPORT_QUANTITY'] = newData.quantity || '0';
    placeholders['PREVIOUS_REPORT_SAVINGS'] = formatCurrencyCompact(previousData.savings || 0);
    placeholders['PREVIOUS_REPORT_QUANTITY'] = previousData.quantity || '0';
  }
  
  // Transaction details
  const transactionData = reportData.transactionDetails?.data || {};
  placeholders['TOTAL_TRANSACTIONS'] = transactionData.validatedRows || transactionData.transactions?.length || '0';
  
  // Current month data
  const currentMonth = reportData.allEntities?.currentMonth || {};
  placeholders['CURRENT_MONTH_TRANSACTIONS'] = currentMonth.transactionCount || '0';
  
  // Top OEM information from executive summary
  placeholders['TOP_OEM'] = execSummary.topOEM || '';
  placeholders['TOP_OEM_SAVINGS'] = execSummary.topOEMSavings || '';
  
  // Top Funding Department
  placeholders['TOP_FUNDING_DEPT'] = execSummary.topFundingDept || '';
  placeholders['TOP_FUNDING_DEPT_SAVINGS'] = execSummary.topFundingDeptSavings || '';
  
  // Financial Overview - OEM Analysis using savingsByOEM array
  if (reportData.financialOverview?.data?.savingsByOEM) {
    const oems = reportData.financialOverview.data.savingsByOEM;
    oems.slice(0, 10).forEach((oem, index) => {
      const num = index + 1;
      placeholders[`OEM_${num}_NAME`] = oem.name || '';
      placeholders[`OEM_${num}_SAVINGS`] = oem.savingsFormatted || '';
      placeholders[`OEM_${num}_PERCENT`] = oem.percentOfTotal || '';
      placeholders[`OEM_${num}_TRANSACTIONS`] = oem.transactions || '0';
    });
  }
  
  // Vendor Analysis - using vendorAnalysis data
  if (reportData.vendorAnalysis?.data?.byVendor) {
    const vendors = reportData.vendorAnalysis.data.byVendor;
    vendors.slice(0, 10).forEach((vendor, index) => {
      const num = index + 1;
      placeholders[`VENDOR_${num}_NAME`] = vendor.name || '';
      placeholders[`VENDOR_${num}_SAVINGS`] = vendor.savingsFormatted || '';
      placeholders[`VENDOR_${num}_TRANSACTIONS`] = vendor.transactions || '0';
    });
  }
  
  // Monthly Analysis - using savingsByMonth array
  if (reportData.financialOverview?.data?.savingsByMonth) {
    const months = reportData.financialOverview.data.savingsByMonth;
    months.slice(0, 6).forEach((month, index) => {
      const num = index + 1;
      placeholders[`MONTH_${num}_NAME`] = month.period || '';
      placeholders[`MONTH_${num}_SAVINGS`] = month.savingsFormatted || '';
      placeholders[`MONTH_${num}_PERCENT`] = month.percentOfTotal || '';
    });
  }
  
  // Monthly data - Last 6 months
  if (reportData.chartData && reportData.chartData.monthlyTotals) {
    const months = reportData.chartData.monthlyTotals;
    if (months.labels && months.data) {
      months.labels.slice(-6).forEach((month, index) => {
        const num = index + 1;
        placeholders[`MONTH_${num}_NAME`] = month || '';
        placeholders[`MONTH_${num}_SAVINGS`] = formatCurrencyCompact(months.data[months.labels.length - 6 + index]) || '';
      });
    }
  }
  
  // Enhanced Vendor-OEM Relationship Mappings (B03 v4.0)
  if (relationships?.vendorsByOEM) {
    // Add vendor counts per OEM for top OEMs
    Object.entries(relationships.vendorsByOEM).slice(0, 5).forEach(([oem, vendors], index) => {
      const oemNum = index + 1;
      placeholders[`OEM_${oemNum}_VENDOR_COUNT`] = vendors.length || '0';
      placeholders[`OEM_${oemNum}_VENDOR_LIST`] = Array.isArray(vendors) 
        ? vendors.slice(0, 3).join(', ') + (vendors.length > 3 ? `, and ${vendors.length - 3} others` : '') 
        : '';
    });
  }
  
  if (relationships?.oemsByVendor) {
    // Add OEM counts per vendor for top vendors
    Object.entries(relationships.oemsByVendor).slice(0, 5).forEach(([vendor, oems], index) => {
      const vendorNum = index + 1;
      placeholders[`VENDOR_${vendorNum}_OEM_COUNT`] = oems.length || '0';
      placeholders[`VENDOR_${vendorNum}_OEM_LIST`] = Array.isArray(oems) 
        ? oems.slice(0, 3).join(', ') + (oems.length > 3 ? `, and ${oems.length - 3} others` : '') 
        : '';
    });
  }
  
  // All entities section (for narrative placeholders)
  const allEntities = reportData.allEntities || {};
  if (allEntities.oems) {
    placeholders['ALL_OEMS'] = allEntities.oems.formatted || '';
    placeholders['EXEC_SUMMARY_OEM_LIST'] = allEntities.oems.formatted || '';
  }
  if (allEntities.vendors) {
    placeholders['ALL_VENDORS'] = allEntities.vendors.formatted || '';
  }
  if (allEntities.contracts) {
    placeholders['ALL_CONTRACTS'] = allEntities.contracts.formatted || '';
  }
  if (allEntities.fundingDepts) {
    placeholders['ALL_FUNDING_DEPTS'] = allEntities.fundingDepts.formatted || '';
  }
  
  // New OEMs this month
  if (allEntities.newOEMsThisMonth) {
    placeholders['NEW_OEMS_MONTH'] = allEntities.newOEMsThisMonth.period || reportData.reportingPeriod || 'This month';
    placeholders['NEW_OEMS_THIS_MONTH'] = allEntities.newOEMsThisMonth.formatted || 'N/A';
  } else {
    placeholders['NEW_OEMS_MONTH'] = reportData.reportingPeriod || 'This month';
    placeholders['NEW_OEMS_THIS_MONTH'] = 'N/A';
  }
  
  // Commentary placeholders for TDR reports (commentary object with numeric keys)
  const commentary = reportData.commentary || {};
  for (let i = 1; i <= 15; i++) {
    placeholders[`COMMENTARY_${i}`] = commentary[i.toString()] || '';
  }
  
  // Log all placeholders for debugging
  console.log('📋 All placeholders:', Object.keys(placeholders).join(', '));
  console.log('📊 Sample values:', {
    TOTAL_SAVINGS: placeholders.TOTAL_SAVINGS,
    TOTAL_TRANSACTIONS: placeholders.TOTAL_TRANSACTIONS,
    REPORTING_MONTH: placeholders.REPORTING_MONTH,
    OEM_COUNT: placeholders.OEM_COUNT
  });
  
  return placeholders;
}

/**
 * Generate and insert charts from JSON data into document
 * Creates temporary spreadsheet, generates charts, inserts as images
 * ENHANCED: Now supports dynamic OEM table generation with individual gauge charts
 */
function generateAndInsertChartsFromJSON(docId, reportData) {
  try {
    console.log('📊 Starting chart generation from JSON...');
    
    // Create a temporary spreadsheet for chart generation
    const tempSS = SpreadsheetApp.create('Temp_Chart_Generation_' + new Date().getTime());
    const tempSSId = tempSS.getId();
    
    try {
      const doc = DocumentApp.openById(docId);
      const body = doc.getBody();
      
      // First: Process dynamic template patterns using proper placeholders
      console.log('📊 Generating dynamic OEM tables with placeholders...');
      generateDynamicOEMTables(doc, body, tempSS, reportData);
      
      console.log('📊 Generating dynamic Vendor tables with placeholders...');
      generateDynamicVendorTables(doc, body, tempSS, reportData);
      
      console.log('📊 Generating dynamic Funding Department tables with placeholders...');
      generateDynamicFundingDeptTables(doc, body, tempSS, reportData);
      
      // Generate Overall Gauge Chart
      if (reportData.chartData && reportData.chartData.overallGauge) {
        const gaugeBlob = createGaugeChartFromJSON(tempSS, reportData.chartData.overallGauge, 'Overall Performance');
        if (gaugeBlob) {
          replaceChartPlaceholder(body, '{{OVERALL_GAUGE_CHART}}', gaugeBlob);
        }
      }
      
      // Generate OEM Radar Chart (shows all OEMs performance)
      if (reportData.financialOverview?.data?.savingsByOEM) {
        console.log('🎯 Generating OEM radar chart...');
        const radarBlob = createOEMRadarChart(tempSS, reportData.financialOverview.data.savingsByOEM);
        if (radarBlob) {
          replaceChartPlaceholder(body, '{{OEM_RADAR_CHART}}', radarBlob);
        }
        
          // Note: Individual OEM charts are now generated as part of dynamic template processing above
        console.log('✅ OEM charts already generated in dynamic template sections');
      }
      
      // Generate Annual Stacked Chart
      if (reportData.chartData && reportData.chartData.stackedOEM) {
        const stackedBlob = createStackedChartFromJSON(tempSS, reportData.chartData.stackedOEM);
        if (stackedBlob) {
          replaceChartPlaceholder(body, '{{ANNUAL_STACKED_CHART}}', stackedBlob);
        }
      }
      
      // Generate Funnel Chart
      if (reportData.chartData && reportData.chartData.monthlyTotals) {
        const funnelBlob = createFunnelChartFromJSON(tempSS, reportData.chartData.monthlyTotals);
        if (funnelBlob) {
          replaceChartPlaceholder(body, '{{FUNNEL_CHART}}', funnelBlob);
        }
      }
      
      console.log('✅ All charts and dynamic tables inserted successfully');
      
    } finally {
      // Clean up temporary spreadsheet
      DriveApp.getFileById(tempSSId).setTrashed(true);
      console.log('🗑️ Temporary spreadsheet deleted');
    }
    
  } catch (error) {
    console.error('❌ Error generating charts:', error);
    // Continue without charts if there's an error
  }
}

/**
 * Create gauge chart from JSON data
 */
function createGaugeChartFromJSON(spreadsheet, gaugeData, title) {
  try {
    const sheet = spreadsheet.insertSheet('GaugeData');
    
    // Set up data for gauge chart
    sheet.getRange('A1:B3').setValues([
      ['Label', 'Value'],
      ['Score', gaugeData.score || 0],
      ['Max', 100]
    ]);
    
    // Create gauge chart
    const chart = sheet.newChart()
      .setChartType(Charts.ChartType.GAUGE)
      .addRange(sheet.getRange('A1:B3'))
      .setOption('title', title)
      .setOption('width', 400)
      .setOption('height', 300)
      .setOption('max', 100)
      .setOption('greenFrom', 70)
      .setOption('greenTo', 100)
      .setOption('yellowFrom', 40)
      .setOption('yellowTo', 70)
      .setOption('redFrom', 0)
      .setOption('redTo', 40)
      .setPosition(5, 5, 0, 0)
      .build();
    
    sheet.insertChart(chart);
    return chart.getBlob().setName('gauge_chart.png');
    
  } catch (error) {
    console.error('Error creating gauge chart:', error);
    return null;
  }
}

/**
 * Create stacked chart from JSON data
 */
function createStackedChartFromJSON(spreadsheet, stackedData) {
  try {
    const sheet = spreadsheet.insertSheet('StackedData');
    
    // Prepare data for stacked chart - convert values to millions
    const headers = ['Month', ...stackedData.labels.slice(0, 5)]; // Top 5 OEMs
    const rows = [];
    
    stackedData.months.forEach((month, idx) => {
      const row = [month];
      stackedData.labels.slice(0, 5).forEach((oem, oemIdx) => {
        // Convert to millions for better chart readability
        const value = stackedData.datasets[idx]?.data[oemIdx] || 0;
        row.push(value / 1000000); // Convert to millions
      });
      rows.push(row);
    });
    
    // Set data in sheet
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    // Create stacked column chart
    const chart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(sheet.getRange(1, 1, rows.length + 1, headers.length))
      .setOption('title', 'Monthly Savings by OEM')
      .setOption('width', 600)
      .setOption('height', 400)
      .setOption('isStacked', true)
      .setOption('legend', {position: 'right'})
      .setOption('vAxis', {
        title: 'Savings (Millions $)',
        format: '$#,##0.0M',
        minValue: 0
      })
      .setOption('hAxis', {
        title: 'Month'
      })
      .setPosition(5, 5, 0, 0)
      .build();
    
    sheet.insertChart(chart);
    return chart.getBlob().setName('stacked_chart.png');
    
  } catch (error) {
    console.error('Error creating stacked chart:', error);
    return null;
  }
}

/**
 * Create funnel chart from JSON data (using column chart as funnel)
 */
function createFunnelChartFromJSON(spreadsheet, monthlyData) {
  try {
    const sheet = spreadsheet.insertSheet('FunnelData');
    
    // Prepare data for funnel (monthly progression) - convert to millions
    const data = [
      ['Month', 'Savings (Millions $)']
    ];
    
    if (monthlyData.labels && monthlyData.data) {
      monthlyData.labels.forEach((label, idx) => {
        // Convert to millions for better chart readability
        const value = monthlyData.data[idx] || 0;
        data.push([label, value / 1000000]);
      });
    }
    
    // Set data in sheet
    sheet.getRange(1, 1, data.length, 2).setValues(data);
    
    // Create column chart styled as funnel
    const chart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(sheet.getRange(1, 1, data.length, 2))
      .setOption('title', 'Monthly Savings Progression')
      .setOption('width', 600)
      .setOption('height', 400)
      .setOption('colors', ['#f47920'])
      .setOption('legend', 'none')
      .setOption('vAxis', {
        title: 'Savings (Millions $)',
        format: '$#,##0.0M',
        minValue: 0
      })
      .setOption('hAxis', {
        title: 'Month',
        textStyle: {fontSize: 10}
      })
      .setPosition(5, 5, 0, 0)
      .build();
    
    sheet.insertChart(chart);
    return chart.getBlob().setName('funnel_chart.png');
    
  } catch (error) {
    console.error('Error creating funnel chart:', error);
    return null;
  }
}

/**
 * Generate dynamic OEM tables using Option B Repeating Template Pattern
 * Detects template pattern in document and replicates for each OEM
 */
function generateDynamicOEMTables(doc, body, tempSS, reportData) {
  try {
    console.log('🔍 Looking for OEM template pattern...');
    
    // Use relationships from main JSON (Column D) - they're already computed
    const relationships = reportData.relationships || { vendorsByOEM: {}, oemsByVendor: {} };
    
    // Debug: Check document content
    const docText = body.getText();
    console.log('📄 Document length:', docText.length);
    console.log('🔍 Looking for OEM_TEMPLATE_START...');
    const hasStartMarker = docText.includes('{{OEM_TEMPLATE_START}}');
    const hasEndMarker = docText.includes('{{OEM_TEMPLATE_END}}');
    console.log('Start marker found:', hasStartMarker);
    console.log('End marker found:', hasEndMarker);
    
    // Look for the template pattern markers
    const templateStart = body.findText('{{OEM_TEMPLATE_START}}');
    const templateEnd = body.findText('{{OEM_TEMPLATE_END}}');
    
    console.log('Template start result:', !!templateStart);
    console.log('Template end result:', !!templateEnd);
    
    if (!templateStart || !templateEnd) {
      console.log('⚠️ OEM template pattern markers not found in document');
      console.log('💡 Make sure your document contains {{OEM_TEMPLATE_START}} and {{OEM_TEMPLATE_END}} markers');
      return;
    }
    
    console.log('✅ Found OEM template pattern, processing...');
    
    // Get the template content between markers
    const startElement = templateStart.getElement();
    const endElement = templateEnd.getElement();
    
    // Extract all content between start and end markers
    const startParagraph = startElement.getParent().asParagraph();
    const endParagraph = endElement.getParent().asParagraph();
    
    // Get the index of these paragraphs in the body
    const startIndex = body.getChildIndex(startParagraph);
    const endIndex = body.getChildIndex(endParagraph);
    
    console.log(`📝 Template spans from paragraph ${startIndex} to ${endIndex}`);
    
    // Extract all text between the markers
    let templateText = '';
    for (let i = startIndex; i <= endIndex; i++) {
      const element = body.getChild(i);
      if (element.getType() === DocumentApp.ElementType.PARAGRAPH) {
        templateText += element.asParagraph().getText() + '\n';
      }
    }
    
    console.log('📝 Template text found:', templateText.substring(0, 300) + '...');
    console.log('📝 Full template text:');
    console.log(templateText);
    console.log('📝 Template text length:', templateText.length);
    
    if (!templateText || templateText.trim().length === 0) {
      console.log('❌ Template text is empty! Check template markers.');
      return;
    }
    
    // Get OEM data from enhanced B03 v4.0 structure
    const oemData = reportData.financialOverview?.data?.savingsByOEM || [];
    const gaugeData = reportData.gaugeData?.byOEM || [];
    
    console.log(`📊 Processing ${oemData.length} OEMs for dynamic table generation`);
    console.log(`📊 OEM data structure check:`, {
      hasFinancialOverview: !!reportData.financialOverview,
      hasData: !!reportData.financialOverview?.data,
      hasSavingsByOEM: !!reportData.financialOverview?.data?.savingsByOEM,
      oemDataLength: oemData.length,
      firstOEMName: oemData[0]?.name || 'No OEMs found',
      availableKeys: Object.keys(reportData.financialOverview?.data || {})
    });
    
    // If no OEMs found in the expected path, check alternative paths
    if (oemData.length === 0) {
      console.log('🔍 No OEMs found, checking alternative data paths...');
      console.log('📊 Available reportData keys:', Object.keys(reportData));
      if (reportData.financialOverview) {
        console.log('📊 financialOverview keys:', Object.keys(reportData.financialOverview));
        if (reportData.financialOverview.data) {
          console.log('📊 financialOverview.data keys:', Object.keys(reportData.financialOverview.data));
        }
      }
    }
    
    // Generate content for each OEM
    const generatedContent = [];
    
    oemData.forEach((oem, index) => {
      console.log(`🔄 Processing OEM ${index + 1}: ${oem.name}`);
      
      // Get corresponding gauge data for this OEM
      const oemGauge = gaugeData.find(g => g.name === oem.name) || {
        realized: parseFloat(oem.savings) || 0,  // Ensure numeric value
        potential: parseFloat(oem.cpl) || 0,     // Ensure numeric value
        percentage: ((parseFloat(oem.savings) / parseFloat(oem.cpl)) * 100).toFixed(2) || 0
      };
      
      // Create individual gauge chart for this OEM
      const oemGaugeBlob = createOEMGaugeChart(tempSS, oemGauge, oem.name);
      
      // Get vendor information for this OEM
      const oemVendors = relationships?.vendorsByOEM?.[oem.name] || [];
      const vendorCount = oemVendors.length || 0;
      const vendorList = oemVendors.slice(0, 3).join(', ') + (oemVendors.length > 3 ? ` and ${oemVendors.length - 3} others` : '');
      
      console.log(`📊 ${oem.name} data: savings=${oem.savings}, cpl=${oem.cpl}, vendors=${vendorCount}`);
      console.log(`📝 Template text before replacement (first 100 chars):`, templateText.substring(0, 100));
      
      // Replace OEM-specific placeholders in template
      let oemContent = templateText
        .replace(/\{\{OEM_NAME\}\}/g, oem.name || 'Unknown OEM')
        .replace(/\{\{OEM_SAVINGS\}\}/g, oem.savingsFormatted || formatCurrencyCompact(oem.savings || 0))
        .replace(/\{\{OEM_CPL\}\}/g, oem.cplFormatted || formatCurrencyCompact(oem.cpl || 0))
        .replace(/\{\{OEM_PAID\}\}/g, oem.paidFormatted || formatCurrencyCompact(oem.paid || 0))
        .replace(/\{\{OEM_PERCENT_TOTAL\}\}/g, (oem.percentOfTotal || '0') + '%')
        .replace(/\{\{OEM_TRANSACTIONS\}\}/g, (oem.transactions || '0').toString())
        .replace(/\{\{OEM_DISCOUNT_RATE\}\}/g, (oem.discountRate || '0') + '%')
        .replace(/\{\{OEM_REALIZATION_PERCENT\}\}/g, oemGauge.percentage + '%')
        .replace(/\{\{OEM_RANK\}\}/g, (index + 1).toString())
        .replace(/\{\{OEM_COUNT\}\}/g, oemData.length.toString())
        .replace(/\{\{OEM_VENDOR_COUNT\}\}/g, vendorCount.toString())
        .replace(/\{\{OEM_VENDOR_LIST\}\}/g, vendorList || 'No vendors found')
        .replace(/\{\{OEM_GAUGE_CHART\}\}/g, '[OEM Progress Chart]'); // Placeholder for chart insertion
      
      console.log(`📝 After replacement for ${oem.name} (first 200 chars):`, oemContent.substring(0, 200));
      console.log(`📝 Contains OEM_NAME?: ${oemContent.includes('{{OEM_NAME}}')}`);
      console.log(`📝 Contains actual name?: ${oemContent.includes(oem.name)}`);
      console.log(`📝 Contains [OEM Progress Chart]?: ${oemContent.includes('[OEM Progress Chart]')}`);
      console.log(`📊 Gauge blob created?: ${!!oemGaugeBlob}`);
      
      // Calculate label data for progress bar
      function formatSmartCurrency(val) {
        if (!val || val === 0) return '$0';
        if (val >= 1000000) return '$' + (val/1000000).toFixed(1) + 'M';
        if (val >= 1000) return '$' + (val/1000).toFixed(1) + 'K';
        return '$' + val.toFixed(0);
      }
      
      const realizedFormatted = formatSmartCurrency(oem.savings || 0);
      const cplFormatted = formatSmartCurrency(oem.cpl || 0);
      const discountRate = (oem.cpl && oem.cpl > 0) 
        ? ((oem.savings / oem.cpl) * 100).toFixed(0)
        : 0;
      
      generatedContent.push({
        text: oemContent,
        gaugeBlob: oemGaugeBlob,
        oemName: oem.name,
        oemSavings: oem.savingsFormatted || formatCurrencyCompact(oem.savings || 0),
        oemCPL: oem.cplFormatted || formatCurrencyCompact(oem.cpl || 0),
        oemPaid: oem.paidFormatted || formatCurrencyCompact(oem.paid || 0),
        oemPercentTotal: (oem.percentOfTotal || '0') + '%',
        oemTransactions: (oem.transactions || '0').toString(),
        oemDiscountRate: (oem.discountRate || '0') + '%',
        oemRealizationPercent: oemGauge.percentage + '%',
        oemRank: (index + 1).toString(),
        oemCount: oemData.length.toString(),
        oemVendorCount: vendorCount.toString(),
        oemVendorList: vendorList || 'No vendors found',
        progressLabel: `${realizedFormatted} (${discountRate}%) of ${cplFormatted}`
      });
    });
    
    // Use template replacement to create sections for ALL OEMs (restore original working approach)
    replaceTemplateWithGeneratedOEMContent(body, templateStart, templateEnd, generatedContent);
    
    console.log(`✅ Generated ${generatedContent.length} dynamic OEM sections`);
    
  } catch (error) {
    console.error('❌ Error generating dynamic OEM tables:', error);
  }
}

/**
 * Create fancy horizontal progress bar chart for specific OEM
 * Shows Total CPL vs Savings in a horizontal bar format with discount percentage
 */
function createOEMGaugeChart(spreadsheet, oemGauge, oemName) {
  try {
    console.log(`📊 Creating progress chart for ${oemName}...`);
    console.log(`Data: realized=${oemGauge.realized}, potential=${oemGauge.potential}`);
    
    // Smart currency formatting function
    function formatSmartCurrency(val) {
      if (!val || val === 0) return '$0';
      if (val >= 1000000) return '$' + (val/1000000).toFixed(1) + 'M';
      if (val >= 1000) return '$' + (val/1000).toFixed(1) + 'K';
      return '$' + val.toFixed(0);
    }
    
    // Use raw values for chart data, but format for display
    const cplValue = oemGauge.potential || 0;
    const realizedValue = oemGauge.realized || 0;
    const discountRate = cplValue > 0 
      ? ((realizedValue / cplValue) * 100).toFixed(1)
      : 0;
    
    const cplFormatted = formatSmartCurrency(cplValue);
    const realizedFormatted = formatSmartCurrency(realizedValue);
    
    console.log(`💰 CPL: ${cplFormatted}, Realized: ${realizedFormatted}, Rate: ${discountRate}%`);
    
    // Create fancy horizontal progress bar using stacked bar chart
    // Set up data for horizontal progress bar using raw values
    const realizedForChart = realizedValue / 1000;  // Convert to thousands for chart scale
    const remainingForChart = Math.max(0, (cplValue - realizedValue) / 1000);
    
    console.log(`📊 Raw values: CPL=${cplValue}, Realized=${realizedValue}`);
    console.log(`📊 Chart data: Realized=${realizedForChart}K, Remaining=${remainingForChart}K`);
    
    // Validate data isn't causing issues
    if (isNaN(realizedForChart) || isNaN(remainingForChart)) {
      console.error('❌ Invalid chart data: NaN values detected');
      return null;
    }
    
    if (realizedForChart < 0 || remainingForChart < 0) {
      console.error('❌ Invalid chart data: negative values detected');
      return null;
    }
    
    // Create professional progress bar chart
    console.log(`📊 Creating progress bar for ${oemName}...`);
    
    let dataTable;
    let chart;
    
    try {
      // Create DataTable
      dataTable = Charts.newDataTable()
        .addColumn(Charts.ColumnType.STRING, 'OEM')
        .addColumn(Charts.ColumnType.NUMBER, 'Realized')
        .addColumn(Charts.ColumnType.NUMBER, 'Remaining')
        .addRow([oemName, realizedForChart, remainingForChart])
        .build();
      
      // Create clean progress bar without labels (labels will be added separately)
      chart = Charts.newBarChart()
        .setDataTable(dataTable)
        .setDimensions(280, 30)  // Clean bar dimensions
        .setStacked()
        .setOption('legend', { position: 'none' })  // Remove legend
        .setOption('hAxis', { 
          textPosition: 'none', 
          gridlines: { count: 0 },
          baselineColor: 'transparent'
        })
        .setOption('vAxis', { 
          textPosition: 'none', 
          gridlines: { count: 0 },
          baselineColor: 'transparent'
        })
        .setOption('chartArea', {
          left: 0, 
          top: 0, 
          width: '100%', 
          height: '100%'
        })
        .setOption('backgroundColor', 'transparent')
        .setOption('colors', ['#1a1a1a', '#e5e7eb'])  // Black for realized, light gray for remaining
        .setOption('bar', { groupWidth: '95%' })  // Thick bar
        .build();
      
    } catch (buildError) {
      console.error('❌ Charts Service creation failed:', buildError.toString());
      return null;
    }
    
    if (!chart) {
      console.error('❌ Chart creation failed');
      return null;
    }
    
    // Convert to image blob
    try {
      const chartBlob = chart.getAs('image/png');
      chartBlob.setName(`${oemName}_progress.png`);
      console.log(`✅ Created progress bar for ${oemName}: ${discountRate}% (${realizedFormatted} of ${cplFormatted})`);
      return chartBlob;
    } catch (error) {
      console.error('❌ Error converting chart to image:', error.toString());
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Error creating progress chart for ${oemName}:`, error);
    console.error(`❌ Error details:`, error.stack);
    return null;
  }
}

/**
 * Create OEM Radar Chart showing performance across multiple OEMs
 * Shows CPL potential vs realized savings for top OEMs
 */
function createOEMRadarChart(spreadsheet, oemData) {
  try {
    const timestamp = new Date().getTime();
    const sheet = spreadsheet.insertSheet('OEMRadar_' + timestamp);
    
    // Take top 6 OEMs for radar chart (better visual balance)
    const topOEMs = oemData.slice(0, 6);
    
    // Prepare data for radar chart - use discount rate as percentage
    const headers = ['OEM', 'Discount Rate %', 'Market Share %', 'Transaction Volume Score'];
    const data = [headers];
    
    // Calculate market share and transaction volume scores for better radar visualization
    const totalSavings = oemData.reduce((sum, oem) => sum + (oem.savings || 0), 0);
    const maxTransactions = Math.max(...oemData.map(oem => oem.transactions || 0));
    
    topOEMs.forEach(oem => {
      const discountRate = oem.discountRate || 0;
      const marketShare = totalSavings > 0 ? (oem.savings || 0) / totalSavings * 100 : 0;
      const transactionScore = maxTransactions > 0 ? (oem.transactions || 0) / maxTransactions * 100 : 0;
      
      data.push([
        oem.name || 'Unknown OEM',
        parseFloat(discountRate),
        parseFloat(marketShare.toFixed(1)),
        parseFloat(transactionScore.toFixed(1))
      ]);
    });
    
    // Set data in sheet
    sheet.getRange(1, 1, data.length, headers.length).setValues(data);
    
    // Create radar chart (using scatter plot as approximation since GAS doesn't have true radar)
    // We'll create a circular scatter plot that resembles a radar chart
    const chart = sheet.newChart()
      .setChartType(Charts.ChartType.SCATTER)
      .addRange(sheet.getRange(1, 1, data.length, headers.length))
      .setOption('title', 'OEM Performance Radar')
      .setOption('titleTextStyle', { fontSize: 16, bold: true, color: '#0a2240' })
      .setOption('width', 500)
      .setOption('height', 500)
      .setOption('backgroundColor', 'white')
      .setOption('legend', { 
        position: 'right',
        textStyle: { fontSize: 10 }
      })
      .setOption('hAxis', {
        title: 'Market Share %',
        titleTextStyle: { fontSize: 12, color: '#666' },
        minValue: 0,
        gridlines: { color: '#f0f0f0' }
      })
      .setOption('vAxis', {
        title: 'Discount Rate %',
        titleTextStyle: { fontSize: 12, color: '#666' },
        minValue: 0,
        gridlines: { color: '#f0f0f0' }
      })
      .setOption('pointSize', 8)
      .setOption('colors', ['#f47920', '#144673', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4'])
      .setPosition(5, 5, 0, 0)
      .build();
    
    sheet.insertChart(chart);
    
    console.log(`🎯 Created radar chart for ${topOEMs.length} OEMs`);
    return chart.getBlob().setName('oem_radar.png');
    
  } catch (error) {
    console.error('Error creating radar chart:', error);
    return null;
  }
}

/**
 * Replace template section with generated OEM content
 */
function replaceTemplateWithGeneratedOEMContent(body, templateStart, templateEnd, generatedContent) {
  try {
    console.log(`🔄 Starting OEM template replacement with ${generatedContent.length} sections`);
    
    // Find the paragraphs that contain the template markers
    const startParagraph = templateStart.getElement().getParent().asParagraph();
    const endParagraph = templateEnd.getElement().getParent().asParagraph();
    
    // Get the index of these paragraphs in the body
    const startIndex = body.getChildIndex(startParagraph);
    const endIndex = body.getChildIndex(endParagraph);
    
    // Remove the original template section (from start to end, inclusive)
    for (let i = endIndex; i >= startIndex; i--) {
      body.removeChild(body.getChild(i));
    }
    
    // Insert generated content for each OEM
    let insertIndex = startIndex;
    
    generatedContent.forEach((oemSection, index) => {
      // Add OEM header - just name with 12pt bold formatting (SAME AS VENDOR)
      const header = body.insertParagraph(insertIndex++, oemSection.oemName)
        .setHeading(DocumentApp.ParagraphHeading.NORMAL);
      header.editAsText().setFontSize(12).setBold(true);
      
      // Add OEM content with proper line breaks
      const lines = oemSection.text.split('\n');
      lines.forEach(line => {
        if (line.trim() !== '') {
          // Skip template markers (SAME AS VENDOR)
          if (!line.includes('{{OEM_TEMPLATE_START}}') && !line.includes('{{OEM_TEMPLATE_END}}')) {
            // Check if this line is the chart placeholder
            if (line.includes('[OEM Progress Chart]')) {
              if (oemSection.gaugeBlob) {
                // Insert the actual chart instead of the placeholder text
                try {
                  console.log(`📊 Inserting chart for ${oemSection.oemName}`);
                  
                  const chartParagraph = body.insertParagraph(insertIndex++, '');
                  const inlineImage = chartParagraph.appendInlineImage(oemSection.gaugeBlob);
                  inlineImage.setWidth(280);  // Match chart width
                  inlineImage.setHeight(30);  // Match chart height  
                  chartParagraph.setAlignment(DocumentApp.HorizontalAlignment.LEFT);  // Left align
                  
                  // Add progress bar label immediately after
                  const labelParagraph = body.insertParagraph(insertIndex++, oemSection.progressLabel);
                  labelParagraph.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
                  labelParagraph.editAsText().setFontSize(10).setForegroundColor('#666666');
                  
                  console.log(`✅ Successfully inserted chart and label for ${oemSection.oemName}`);
                } catch (chartError) {
                  console.error(`❌ Failed to insert chart for ${oemSection.oemName}:`, chartError);
                  body.insertParagraph(insertIndex++, `[Chart Error for ${oemSection.oemName}]`)
                    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
                }
              } else {
                console.log(`⚠️ No gauge blob available for ${oemSection.oemName}`);
                body.insertParagraph(insertIndex++, `[No chart generated for ${oemSection.oemName}]`)
                  .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
              }
            } else {
              // Insert regular text line (not a chart placeholder) - PRESERVE FORMATTING
              const newParagraph = body.insertParagraph(insertIndex++, line.trim());
              // Apply formatting to preserve template style
              newParagraph.editAsText()
                .setFontFamily('Arial')
                .setFontSize(11)
                .setForegroundColor('#333333');
                
              // Check if this line contains savings/CPL/etc data and make labels bold
              if (line.includes('Savings:') || line.includes('CPL Potential:') || 
                  line.includes('Transactions:') || line.includes('Discount Rate:') || 
                  line.includes('Rank:')) {
                // Find the label part (before the colon) and make it bold
                const text = newParagraph.editAsText();
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                  text.setBold(0, colonIndex, true);
                }
              }
            }
          }
        }
      });
      
      // Add spacing after each OEM section
      body.insertParagraph(insertIndex++, '');
    });
    
    console.log(`✅ Successfully replaced template with ${generatedContent.length} OEM sections`);
    
  } catch (error) {
    console.error('❌ Error replacing template content:', error);
  }
}

/**
 * Replace chart placeholder with actual chart image
 */
function replaceChartPlaceholder(body, placeholder, chartBlob) {
  try {
    console.log(`🔍 Looking for placeholder: ${placeholder}`);
    
    if (!chartBlob) {
      console.error(`❌ No chart blob provided for ${placeholder}`);
      return;
    }
    
    const searchPattern = placeholder.replace(/[{}]/g, '\\$&'); // Escape braces
    const searchResult = body.findText(searchPattern);
    
    if (searchResult) {
      console.log(`✅ Found ${placeholder} in document`);
      const element = searchResult.getElement();
      const parent = element.getParent();
      
      try {
        // Insert the chart image
        const inlineImage = parent.asParagraph().insertInlineImage(0, chartBlob);
        inlineImage.setWidth(400);
        inlineImage.setHeight(300);
        
        // Remove the placeholder text
        element.asText().deleteText(searchResult.getStartOffset(), searchResult.getEndOffsetInclusive());
        
        console.log(`✅ Successfully replaced ${placeholder} with chart image`);
      } catch (insertError) {
        console.error(`❌ Error inserting chart for ${placeholder}:`, insertError);
        // Leave placeholder text as fallback
        try {
          element.asText().replaceText(searchPattern, `[Chart Error: ${placeholder}]`);
        } catch (fallbackError) {
          console.error(`❌ Even fallback replacement failed:`, fallbackError);
        }
      }
    } else {
      console.log(`⚠️ Placeholder ${placeholder} not found in document`);
    }
  } catch (error) {
    console.error(`❌ Error replacing ${placeholder}:`, error);
  }
}

/**
 * Format currency in compact form
 */
function formatCurrencyCompact(value) {
  if (!value || isNaN(value)) return '$0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1000000) {
    return sign + '$' + (absValue / 1000000).toFixed(1) + 'M';
  } else if (absValue >= 1000) {
    return sign + '$' + (absValue / 1000).toFixed(1) + 'K';
  } else {
    return sign + '$' + absValue.toFixed(0);
  }
}

// ============================================================================
// WEB APP INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Get all reports for web app - 11 COLUMN STRUCTURE
 */
function getReportsForWebApp() {
  const ss = SpreadsheetApp.openById('18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE');
  const reportsSheet = ss.getSheetByName('Reports');
  
  if (!reportsSheet) {
    return { error: 'Reports sheet not found', reports: [] };
  }
  
  const lastRow = reportsSheet.getLastRow();
  if (lastRow < 2) {
    return { reports: [] };
  }
  
  const data = reportsSheet.getRange(2, 1, lastRow - 1, 12).getValues();
  const reports = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;
    
    let parsedJson = null;
    const mainJsonStr = row[REPORT_CONFIG.COLUMNS.JSON];
    const transactionsJsonStr = row[REPORT_CONFIG.COLUMNS.TRANSACTIONS_JSON];
    
    if (mainJsonStr) {
      try {
        parsedJson = JSON.parse(mainJsonStr);
        // Add transactions if available
        if (transactionsJsonStr) {
          try {
            const transactionsData = JSON.parse(transactionsJsonStr);
            if (!parsedJson.transactionDetails) {
              parsedJson.transactionDetails = { data: {} };
            }
            parsedJson.transactionDetails.data.transactions = transactionsData;
          } catch (e) {
            Logger.log(`Failed to parse transactions JSON for row ${rowNum}: ${e}`);
          }
        }
      } catch (e) {
        Logger.log(`Failed to parse main JSON for row ${rowNum}: ${e}`);
      }
    }
    
    reports.push({
      rowNum: rowNum,
      reportType: row[REPORT_CONFIG.COLUMNS.REPORT_TYPE],
      description: row[REPORT_CONFIG.COLUMNS.DESCRIPTION],
      dataLink: row[REPORT_CONFIG.COLUMNS.DATA_LINK],
      json: parsedJson,
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
 * Get a specific report by row number
 */
function getReportByRow(rowNum) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
  
  if (!reportsSheet) {
    return { error: 'Reports sheet not found' };
  }
  
  const row = reportsSheet.getRange(rowNum, 1, 1, 12).getValues()[0];
  
  let parsedJson = null;
  const mainJsonStr = row[REPORT_CONFIG.COLUMNS.JSON];
  const transactionsJsonStr = row[REPORT_CONFIG.COLUMNS.TRANSACTIONS_JSON];
  
  if (mainJsonStr) {
    try {
      parsedJson = JSON.parse(mainJsonStr);
      // Add transactions if available
      if (transactionsJsonStr) {
        try {
          const transactionsData = JSON.parse(transactionsJsonStr);
          if (!parsedJson.transactionDetails) {
            parsedJson.transactionDetails = { data: {} };
          }
          parsedJson.transactionDetails.data.transactions = transactionsData;
        } catch (e) {
          Logger.log(`Failed to parse transactions JSON for row ${rowNum}: ${e}`);
        }
      }
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
    driveUrl: row[REPORT_CONFIG.COLUMNS.DRIVE_URL],
    creator: row[REPORT_CONFIG.COLUMNS.CREATOR],
    timestamp: row[REPORT_CONFIG.COLUMNS.TIMESTAMP]
  };
}

/**
 * Update report after export
 */
function updateReportAfterExport(rowNum, driveUrl) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
    
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
 * Update report JSON (for saving commentary)
 */
function updateReportJson(rowNum, updatedJson) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const reportsSheet = ss.getSheetByName(REPORT_CONFIG.REPORTS_SHEET_NAME);
    
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

// ============================================================================
// VENDOR TEMPLATE GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate dynamic vendor tables with template replacement
 */
function generateDynamicVendorTables(doc, body, tempSS, reportData) {
  try {
    console.log('🔍 Looking for Vendor template pattern...');
    
    // Debug: Check document content
    const docText = body.getText();
    console.log('📄 Document length:', docText.length);
    console.log('🔍 Looking for VENDOR_TEMPLATE_START...');
    const hasStartMarker = docText.includes('{{VENDOR_TEMPLATE_START}}');
    const hasEndMarker = docText.includes('{{VENDOR_TEMPLATE_END}}');
    console.log('Start marker found:', hasStartMarker);
    console.log('End marker found:', hasEndMarker);
    
    // Look for the template pattern markers
    const templateStart = body.findText('{{VENDOR_TEMPLATE_START}}');
    const templateEnd = body.findText('{{VENDOR_TEMPLATE_END}}');
    
    console.log('Template start result:', !!templateStart);
    console.log('Template end result:', !!templateEnd);
    
    if (!templateStart || !templateEnd) {
      console.log('⚠️ Vendor template pattern markers not found in document');
      console.log('💡 Make sure your document contains {{VENDOR_TEMPLATE_START}} and {{VENDOR_TEMPLATE_END}} markers');
      return;
    }
    
    console.log('✅ Found Vendor template pattern, processing...');
    
    // Get the template content between markers
    const startElement = templateStart.getElement();
    const endElement = templateEnd.getElement();
    
    // Extract all content between start and end markers
    const startParagraph = startElement.getParent().asParagraph();
    const endParagraph = endElement.getParent().asParagraph();
    
    // Get the index of these paragraphs in the body
    const startIndex = body.getChildIndex(startParagraph);
    const endIndex = body.getChildIndex(endParagraph);
    
    console.log(`📝 Template spans from paragraph ${startIndex} to ${endIndex}`);
    
    // Extract all text between the markers
    let templateText = '';
    for (let i = startIndex; i <= endIndex; i++) {
      const element = body.getChild(i);
      if (element.getType() === DocumentApp.ElementType.PARAGRAPH) {
        templateText += element.asParagraph().getText() + '\n';
      }
    }
    
    console.log('📝 Template text found:', templateText.substring(0, 300) + '...');
    console.log('📝 Full template text:');
    console.log(templateText);
    console.log('📝 Template text length:', templateText.length);
    
    if (!templateText || templateText.trim().length === 0) {
      console.log('❌ Template text is empty! Check template markers.');
      return;
    }
    
    // Get Vendor data from enhanced B03 v4.0 structure
    const vendorData = reportData.financialOverview?.data?.savingsByVendor || [];
    
    console.log(`📊 Processing ${vendorData.length} Vendors for dynamic table generation`);
    
    // Process ALL vendors like OEM system - template duplication approach
    const generatedContent = [];
    
    vendorData.forEach((vendor, index) => {
      console.log(`🔄 Processing Vendor ${index + 1}: ${vendor.name}`);
      
      // Get relationships data for vendor-OEM mapping
      const relationships = reportData.relationships || { vendorsByOEM: {}, oemsByVendor: {} };
      const vendorOEMs = relationships?.oemsByVendor?.[vendor.name] || [];
      const oemCount = vendorOEMs.length || 0;
      const oemList = vendorOEMs.slice(0, 3).join(', ') + (vendorOEMs.length > 3 ? ` and ${vendorOEMs.length - 3} others` : '');
      
      // Create individual gauge chart for this Vendor
      const vendorGaugeBlob = createVendorGaugeChart(tempSS, vendor);
      
      console.log(`📊 Processing single vendor for direct replacement: ${vendor.name}`);
      
      // Calculate progress label
      function formatSmartCurrency(val) {
        if (!val || val === 0) return '$0';
        if (val >= 1000000) return '$' + (val/1000000).toFixed(1) + 'M';
        if (val >= 1000) return '$' + (val/1000).toFixed(1) + 'K';
        return '$' + val.toFixed(0);
      }
      
      const realizedFormatted = formatSmartCurrency(vendor.savings || 0);
      const cplFormatted = formatSmartCurrency(vendor.cpl || 0);
      const discountRate = (vendor.cpl && vendor.cpl > 0) 
        ? ((vendor.savings / vendor.cpl) * 100).toFixed(0)
        : 0;

      // Replace placeholders in template text (but preserve formatting during insertion)
      let vendorContent = templateText
        .replace(/\{\{VENDOR_NAME\}\}/g, vendor.name || 'Unknown Vendor')
        .replace(/\{\{VENDOR_SAVINGS\}\}/g, vendor.savingsFormatted || formatCurrencyCompact(vendor.savings || 0))
        .replace(/\{\{VENDOR_CPL\}\}/g, vendor.cplFormatted || formatCurrencyCompact(vendor.cpl || 0))
        .replace(/\{\{VENDOR_TRANSACTIONS\}\}/g, (vendor.transactions || '0').toString())
        .replace(/\{\{VENDOR_PERCENT_TOTAL\}\}/g, (vendor.percentOfTotal || '0') + '%')
        .replace(/\{\{VENDOR_PERCENT\}\}/g, (vendor.percentOfTotal || '0'))
        .replace(/\{\{VENDOR_DISCOUNT_RATE\}\}/g, vendor.discountRateFormatted || (vendor.discountRate || '0') + '%')
        .replace(/\{\{VENDOR_OEM_COUNT\}\}/g, oemCount.toString())
        .replace(/\{\{VENDOR_OEM_LIST\}\}/g, oemList || 'No OEMs found')
        .replace(/\{\{VENDOR_RANK\}\}/g, (index + 1).toString())
        .replace(/\{\{VENDOR_COUNT\}\}/g, vendorData.length.toString())
        .replace(/\{\{VENDOR_GAUGE_CHART\}\}/g, '[Vendor Progress Chart]');

      generatedContent.push({
        text: vendorContent,
        gaugeBlob: vendorGaugeBlob,
        vendorName: vendor.name,
        progressLabel: `${realizedFormatted} (${discountRate}%) of ${cplFormatted}`
      });
    });
    
    // Use template replacement to create sections for ALL vendors
    replaceTemplateWithGeneratedVendorContent(body, templateStart, templateEnd, generatedContent);
    
    console.log(`✅ Generated ${generatedContent.length} dynamic Vendor sections`);
    
  } catch (error) {
    console.error('❌ Error generating dynamic Vendor tables:', error);
  }
}

/**
 * Create fancy horizontal progress bar chart for specific Vendor
 */
function createVendorGaugeChart(tempSS, vendorData) {
  try {
    console.log(`📊 Creating gauge chart for vendor: ${vendorData.name}`);
    
    if (!vendorData.savings) {
      console.log(`⚠️ No savings data for ${vendorData.name}, skipping chart`);
      return null;
    }
    
    const realized = parseFloat(vendorData.savings) || 0;
    const potential = parseFloat(vendorData.cpl) || realized; // Use realized as fallback if no CPL
    
    console.log(`📊 Chart data - Realized: ${realized}, Potential: ${potential}`);
    
    if (potential === 0) {
      console.log(`⚠️ Zero potential value for ${vendorData.name}, skipping chart`);
      return null;
    }
    
    const percentage = Math.min((realized / potential) * 100, 100);
    const remaining = Math.max(potential - realized, 0);
    
    console.log(`📊 Percentage: ${percentage.toFixed(2)}%, Remaining: ${remaining}`);
    
    const dataTable = Charts.newDataTable()
      .addColumn(Charts.ColumnType.STRING, 'Category')
      .addColumn(Charts.ColumnType.NUMBER, 'Realized')
      .addColumn(Charts.ColumnType.NUMBER, 'Remaining')
      .addRow(['Savings', realized, remaining])
      .build();
    
    const chart = Charts.newBarChart()
      .setDataTable(dataTable)
      .setDimensions(280, 30)
      .setStacked()
      .setOption('legend', { position: 'none' })
      .setOption('hAxis', { 
        textPosition: 'none',
        gridlines: { color: 'transparent' }
      })
      .setOption('vAxis', { 
        textPosition: 'none',
        gridlines: { color: 'transparent' }
      })
      .setOption('colors', ['#1a1a1a', '#e5e7eb'])
      .setOption('chartArea', { 
        left: 0, 
        top: 0, 
        width: '100%', 
        height: '100%' 
      })
      .setOption('backgroundColor', 'transparent')
      .build();
    
    console.log(`✅ Chart created successfully for ${vendorData.name}`);
    console.log(`📊 Chart object type:`, typeof chart);
    console.log(`📊 Chart methods available:`, Object.getOwnPropertyNames(chart).slice(0, 10));
    
    const chartBlob = chart.getAs('image/png');
    console.log(`📊 Chart blob created:`, !!chartBlob);
    console.log(`📊 Blob size:`, chartBlob ? chartBlob.getBytes().length : 'N/A');
    
    return chartBlob;
    
  } catch (error) {
    console.error(`❌ Error creating vendor gauge chart for ${vendorData.name}:`, error);
    return null;
  }
}

/**
 * Replace template with generated vendor content - COPIED FROM OEM LOGIC
 */
function replaceTemplateWithGeneratedVendorContent(body, templateStart, templateEnd, generatedContent) {
  try {
    console.log(`🔄 Starting vendor template replacement with ${generatedContent.length} sections`);
    
    // Find the paragraphs that contain the template markers
    const startParagraph = templateStart.getElement().getParent().asParagraph();
    const endParagraph = templateEnd.getElement().getParent().asParagraph();
    
    // Get the index of these paragraphs in the body
    const startIndex = body.getChildIndex(startParagraph);
    const endIndex = body.getChildIndex(endParagraph);
    
    // Remove the original template section (from start to end, inclusive)
    for (let i = endIndex; i >= startIndex; i--) {
      body.removeChild(body.getChild(i));
    }
    
    // Insert generated content for each Vendor
    let insertIndex = startIndex;
    
    generatedContent.forEach((vendorSection, index) => {
      // Add Vendor header - just name with 12pt bold formatting (SAME AS OEM)
      const header = body.insertParagraph(insertIndex++, vendorSection.vendorName)
        .setHeading(DocumentApp.ParagraphHeading.NORMAL);
      header.editAsText().setFontSize(12).setBold(true);
      
      // Add Vendor content with proper line breaks
      const lines = vendorSection.text.split('\n');
      lines.forEach(line => {
        if (line.trim() !== '') {
          // Skip template markers (SAME AS OEM)
          if (!line.includes('{{VENDOR_TEMPLATE_START}}') && !line.includes('{{VENDOR_TEMPLATE_END}}')) {
            // Check if this line is the chart placeholder
            if (line.includes('[Vendor Progress Chart]')) {
              if (vendorSection.gaugeBlob) {
                // Insert the actual chart instead of the placeholder text
                try {
                  console.log(`📊 Inserting chart for ${vendorSection.vendorName}`);
                  
                  const chartParagraph = body.insertParagraph(insertIndex++, '');
                  const inlineImage = chartParagraph.appendInlineImage(vendorSection.gaugeBlob);
                  inlineImage.setWidth(280);  // Match chart width
                  inlineImage.setHeight(30);  // Match chart height  
                  chartParagraph.setAlignment(DocumentApp.HorizontalAlignment.LEFT);  // Left align
                  
                  // Add progress bar label immediately after
                  const labelParagraph = body.insertParagraph(insertIndex++, vendorSection.progressLabel);
                  labelParagraph.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
                  labelParagraph.editAsText().setFontSize(10).setForegroundColor('#666666');
                  
                  console.log(`✅ Successfully inserted chart and label for ${vendorSection.vendorName}`);
                } catch (chartError) {
                  console.error(`❌ Failed to insert chart for ${vendorSection.vendorName}:`, chartError);
                  body.insertParagraph(insertIndex++, `[Chart Error for ${vendorSection.vendorName}]`)
                    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
                }
              } else {
                console.log(`⚠️ No gauge blob available for ${vendorSection.vendorName}`);
                body.insertParagraph(insertIndex++, `[No chart generated for ${vendorSection.vendorName}]`)
                  .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
              }
            } else {
              // Insert regular text line (not a chart placeholder) - PRESERVES FORMATTING
              body.insertParagraph(insertIndex++, line.trim());
            }
          }
        }
      });
      
      // Add spacing after each vendor section  
      body.insertParagraph(insertIndex++, '');
    });
    
    console.log(`✅ Successfully replaced template with ${generatedContent.length} Vendor sections`);
    
  } catch (error) {
    console.error('❌ Error replacing vendor template content:', error);
  }
}

// ============================================================================
// FUNDING DEPARTMENT TEMPLATE GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate dynamic funding department tables with template replacement
 */
function generateDynamicFundingDeptTables(doc, body, tempSS, reportData) {
  // Initialize generatedContent at function scope to avoid reference errors
  let generatedContent = [];
  
  try {
    console.log('🔍 Looking for Funding Department template pattern...');
    
    // Debug: Check document content
    const docText = body.getText();
    console.log('📄 Document length:', docText.length);
    console.log('🔍 Looking for FUNDINGDEPT_TEMPLATE_START...');
    const hasStartMarker = docText.includes('{{FUNDINGDEPT_TEMPLATE_START}}');
    const hasEndMarker = docText.includes('{{FUNDINGDEPT_TEMPLATE_END}}');
    console.log('Start marker found:', hasStartMarker);
    console.log('End marker found:', hasEndMarker);
    
    // Look for the template pattern markers
    const templateStart = body.findText('{{FUNDINGDEPT_TEMPLATE_START}}');
    const templateEnd = body.findText('{{FUNDINGDEPT_TEMPLATE_END}}');
    
    console.log('Template start result:', !!templateStart);
    console.log('Template end result:', !!templateEnd);
    
    if (!templateStart || !templateEnd) {
      console.log('⚠️ Funding Department template pattern markers not found in document');
      console.log('💡 Make sure your document contains {{FUNDINGDEPT_TEMPLATE_START}} and {{FUNDINGDEPT_TEMPLATE_END}} markers');
      return;
    }
    
    console.log('✅ Found Funding Department template pattern, processing...');
    
    // Get the template content between markers
    const startElement = templateStart.getElement();
    const endElement = templateEnd.getElement();
    
    // Extract all content between start and end markers
    const startParagraph = startElement.getParent().asParagraph();
    const endParagraph = endElement.getParent().asParagraph();
    
    // Get the index of these paragraphs in the body
    const startIndex = body.getChildIndex(startParagraph);
    const endIndex = body.getChildIndex(endParagraph);
    
    console.log(`📝 Template spans from paragraph ${startIndex} to ${endIndex}`);
    
    // Extract all text between the markers
    let templateText = '';
    for (let i = startIndex; i <= endIndex; i++) {
      const element = body.getChild(i);
      if (element.getType() === DocumentApp.ElementType.PARAGRAPH) {
        templateText += element.asParagraph().getText() + '\n';
      }
    }
    
    console.log('📝 Template text found:', templateText.substring(0, 300) + '...');
    console.log('📝 Full template text:');
    console.log(templateText);
    console.log('📝 Template text length:', templateText.length);
    
    if (!templateText || templateText.trim().length === 0) {
      console.log('❌ Template text is empty! Check template markers.');
      return;
    }
    
    // Get Funding Department data from enhanced B03 v4.0 structure
    const fundingDeptData = reportData.fundingDeptAnalysis?.data?.savingsByFundingDept || [];
    
    console.log(`📊 Processing ${fundingDeptData.length} Funding Departments for dynamic table generation`);
    
    // Reset generatedContent array for this processing
    generatedContent = [];
    
    fundingDeptData.forEach((fundingDept, index) => {
      console.log(`🔄 Processing Funding Department ${index + 1}: ${fundingDept.name}`);
      
      // Create individual gauge chart for this Funding Department
      const fundingDeptGaugeBlob = createFundingDeptGaugeChart(tempSS, fundingDept);
      
      console.log(`📊 Processing single funding dept for direct replacement: ${fundingDept.name}`);
      
      // Get relationships for this funding department
      const fundingDeptOEMs = fundingDept.oems || [];
      const oemCount = fundingDeptOEMs.length || 0;
      const oemList = fundingDeptOEMs.slice(0, 3).join(', ') + (fundingDeptOEMs.length > 3 ? ` and ${fundingDeptOEMs.length - 3} others` : '');
      
      const fundingDeptVendors = fundingDept.vendors || [];
      const vendorCount = fundingDeptVendors.length || 0;
      const vendorList = fundingDeptVendors.slice(0, 3).join(', ') + (fundingDeptVendors.length > 3 ? ` and ${fundingDeptVendors.length - 3} others` : '');
      
      // Replace placeholders in template text (but preserve formatting during insertion)
      let fundingDeptContent = templateText
        .replace(/\{\{FUNDINGDEPT_NAME\}\}/g, fundingDept.name || 'Unknown Department')
        .replace(/\{\{FUNDINGDEPT_SAVINGS\}\}/g, fundingDept.savingsFormatted || formatCurrencyCompact(fundingDept.savings || 0))
        .replace(/\{\{FUNDINGDEPT_CPL\}\}/g, fundingDept.cplFormatted || formatCurrencyCompact(fundingDept.cpl || 0))
        .replace(/\{\{FUNDINGDEPT_TRANSACTIONS\}\}/g, (fundingDept.transactions || '0').toString())
        .replace(/\{\{FUNDINGDEPT_PERCENT_TOTAL\}\}/g, (fundingDept.percentOfTotal || '0') + '%')
        .replace(/\{\{FUNDINGDEPT_PERCENT\}\}/g, (fundingDept.percentOfTotal || '0'))
        .replace(/\{\{FUNDINGDEPT_DISCOUNT_RATE\}\}/g, fundingDept.discountRateFormatted || (fundingDept.discountRate || '0') + '%')
        .replace(/\{\{FUNDINGDEPT_OEM_COUNT\}\}/g, oemCount.toString())
        .replace(/\{\{FUNDINGDEPT_OEM_LIST\}\}/g, oemList || 'No OEMs found')
        .replace(/\{\{FUNDINGDEPT_VENDOR_COUNT\}\}/g, vendorCount.toString())
        .replace(/\{\{FUNDINGDEPT_VENDOR_LIST\}\}/g, vendorList || 'No vendors found')
        .replace(/\{\{FUNDINGDEPT_RANK\}\}/g, (index + 1).toString())
        .replace(/\{\{FUNDINGDEPT_COUNT\}\}/g, fundingDeptData.length.toString())
        .replace(/\{\{FUNDINGDEPT_GAUGE_CHART\}\}/g, '[Funding Dept Progress Chart]');

      function formatSmartCurrency(val) {
        if (!val || val === 0) return '$0';
        if (val >= 1000000) return '$' + (val/1000000).toFixed(1) + 'M';
        if (val >= 1000) return '$' + (val/1000).toFixed(1) + 'K';
        return '$' + val.toFixed(0);
      }
      
      const realizedFormatted = formatSmartCurrency(fundingDept.savings || 0);

      generatedContent.push({
        text: fundingDeptContent,
        gaugeBlob: fundingDeptGaugeBlob,
        fundingDeptName: fundingDept.name,
        progressLabel: `${realizedFormatted} realized savings`
      });
    });
    
    // Use template replacement to create sections for ALL funding departments
    replaceTemplateWithGeneratedFundingDeptContent(body, templateStart, templateEnd, generatedContent);
    
    console.log(`✅ Generated ${generatedContent.length} dynamic Funding Department sections`);
    
  } catch (error) {
    console.error('❌ Error generating dynamic Funding Department tables:', error);
    console.error('❌ Error stack trace:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ generatedContent defined?:', typeof generatedContent !== 'undefined');
    console.error('❌ generatedContent length:', generatedContent?.length || 'undefined');
  }
}

/**
 * Create fancy horizontal progress bar chart for specific Funding Department
 */
function createFundingDeptGaugeChart(tempSS, fundingDeptData) {
  try {
    console.log(`📊 Creating gauge chart for funding department: ${fundingDeptData.name}`);
    
    if (!fundingDeptData.savings) {
      console.log(`⚠️ No savings data for ${fundingDeptData.name}, skipping chart`);
      return null;
    }
    
    const realized = parseFloat(fundingDeptData.savings) || 0;
    
    console.log(`📊 Chart data - Realized: ${realized}`);
    
    // For funding departments, we'll create a simple progress indicator showing their share
    // Since we don't have CPL data, we'll create a relative chart based on their percentage
    const percentage = parseFloat(fundingDeptData.percentOfTotal) || 0;
    const remaining = Math.max(100 - percentage, 0);
    
    console.log(`📊 Percentage: ${percentage}%, Remaining: ${remaining}%`);
    
    const dataTable = Charts.newDataTable()
      .addColumn(Charts.ColumnType.STRING, 'Category')
      .addColumn(Charts.ColumnType.NUMBER, 'Department Share')
      .addColumn(Charts.ColumnType.NUMBER, 'Other Depts')
      .addRow(['Savings', percentage, remaining])
      .build();
    
    const chart = Charts.newBarChart()
      .setDataTable(dataTable)
      .setDimensions(280, 30)
      .setStacked()
      .setOption('legend', { position: 'none' })
      .setOption('hAxis', { 
        textPosition: 'none',
        gridlines: { color: 'transparent' }
      })
      .setOption('vAxis', { 
        textPosition: 'none',
        gridlines: { color: 'transparent' }
      })
      .setOption('colors', ['#1a1a1a', '#e5e7eb'])  // Black for realized, gray for remaining
      .setOption('chartArea', { 
        left: 0, 
        top: 0, 
        width: '100%', 
        height: '100%' 
      })
      .setOption('backgroundColor', 'transparent')
      .build();
    
    console.log(`✅ Chart created successfully for ${fundingDeptData.name}`);
    console.log(`📊 Chart object type:`, typeof chart);
    console.log(`📊 Chart methods available:`, Object.getOwnPropertyNames(chart).slice(0, 10));
    
    const chartBlob = chart.getAs('image/png');
    console.log(`📊 Chart blob created:`, !!chartBlob);
    console.log(`📊 Blob size:`, chartBlob ? chartBlob.getBytes().length : 'N/A');
    
    return chartBlob;
    
  } catch (error) {
    console.error(`❌ Error creating funding dept gauge chart for ${fundingDeptData.name}:`, error);
    return null;
  }
}


/**
 * Replace template with generated funding department content 
 */
function replaceTemplateWithGeneratedFundingDeptContent(body, templateStart, templateEnd, generatedContent) {
  try {
    console.log(`🔄 Starting funding dept template replacement with ${generatedContent.length} sections`);
    
    // Find the paragraphs that contain the template markers
    const startParagraph = templateStart.getElement().getParent().asParagraph();
    const endParagraph = templateEnd.getElement().getParent().asParagraph();
    
    // Get the index of these paragraphs in the body
    const startIndex = body.getChildIndex(startParagraph);
    const endIndex = body.getChildIndex(endParagraph);
    
    // Remove the original template section (from start to end, inclusive)
    for (let i = endIndex; i >= startIndex; i--) {
      body.removeChild(body.getChild(i));
    }
    
    // Insert generated content for each Funding Department
    let insertIndex = startIndex;
    
    generatedContent.forEach((fundingDeptSection, index) => {
      // Add Funding Department header - just name with 12pt bold formatting (SAME AS OEM)
      const header = body.insertParagraph(insertIndex++, fundingDeptSection.fundingDeptName)
        .setHeading(DocumentApp.ParagraphHeading.NORMAL);
      header.editAsText().setFontSize(12).setBold(true);
      
      // Add Funding Department content with proper line breaks
      const lines = fundingDeptSection.text.split('\n');
      lines.forEach(line => {
        if (line.trim() !== '') {
          // Skip template markers (SAME AS OEM)
          if (!line.includes('{{FUNDINGDEPT_TEMPLATE_START}}') && !line.includes('{{FUNDINGDEPT_TEMPLATE_END}}')) {
            // Check if this line is the chart placeholder
            if (line.includes('[Funding Dept Progress Chart]')) {
              if (fundingDeptSection.gaugeBlob) {
                // Insert the actual chart instead of the placeholder text
                try {
                  console.log(`📊 Inserting chart for ${fundingDeptSection.fundingDeptName}`);
                  
                  const chartParagraph = body.insertParagraph(insertIndex++, '');
                  const inlineImage = chartParagraph.appendInlineImage(fundingDeptSection.gaugeBlob);
                  inlineImage.setWidth(280);  // Match chart width
                  inlineImage.setHeight(30);  // Match chart height  
                  chartParagraph.setAlignment(DocumentApp.HorizontalAlignment.LEFT);  // Left align
                  
                  // Add progress bar label immediately after
                  const labelParagraph = body.insertParagraph(insertIndex++, fundingDeptSection.progressLabel);
                  labelParagraph.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
                  labelParagraph.editAsText().setFontSize(10).setForegroundColor('#666666');
                  
                  console.log(`✅ Successfully inserted chart and label for ${fundingDeptSection.fundingDeptName}`);
                } catch (chartError) {
                  console.error(`❌ Failed to insert chart for ${fundingDeptSection.fundingDeptName}:`, chartError);
                  body.insertParagraph(insertIndex++, `[Chart Error for ${fundingDeptSection.fundingDeptName}]`)
                    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
                }
              } else {
                console.log(`⚠️ No gauge blob available for ${fundingDeptSection.fundingDeptName}`);
                body.insertParagraph(insertIndex++, `[No chart generated for ${fundingDeptSection.fundingDeptName}]`)
                  .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
              }
            } else {
              // Insert regular text line (not a chart placeholder) - PRESERVES FORMATTING
              body.insertParagraph(insertIndex++, line.trim());
            }
          }
        }
      });
      
      // Add spacing after each funding department section
      body.insertParagraph(insertIndex++, '');
    });
    
    console.log(`✅ Successfully replaced template with ${generatedContent.length} Funding Department sections`);
    
  } catch (error) {
    console.error('❌ Error replacing funding dept template content:', error);
  }
}