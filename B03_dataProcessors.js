// ============================================================================
// DATA PROCESSORS - B03_dataProcessors_v4.gs (BOUND SCRIPT)
// ============================================================================
// Processes raw OneGov savings data into aggregated structures for reporting.
// This file should be in a SEPARATE bound script file from B13.
//
// VERSION: 4.0.0 - Full column capture, expanded aggregations
//
// RAW DATA COLUMNS SUPPORTED:
//   - Also in BIC
//   - Cost Savings Validated
//   - Previously Reported Savings
//   - Data Source
//   - Contract #
//   - OEM
//   - Vendor
//   - Funding Dept
//   - Order Date
//   - Reporting Period
//   - Manufacturer Part Number
//   - Description of Deliverable
//   - Description of Deliverable (BIC)
//   - QTY Sold
//   - CPL Price (unit)
//   - Total CPL Price
//   - OneGov Price
//   - Price Paid Per Unit
//   - Total Price Paid
//   - OneGov Discount Rate
//   - Actual Discount Rate
//   - $ Saved
// ============================================================================

/**
 * Process raw OneGov savings data into aggregated structure
 * v4.0 - Full column capture, expanded aggregations, cell-size optimized
 * 
 * @param {Array<Object>} rawData - Array of row objects from data source
 * @returns {Object} Aggregated data structure for JSON building
 */
function processOneGovSavingsData(rawData) {
  // Filter to only validated savings rows
  const validRows = rawData.filter(row => {
    const validated = row['Cost Savings Validated'];
    return validated === 'Y' || validated === 'Yes' || validated === true;
  });
  
  Logger.log(`Found ${validRows.length} validated rows out of ${rawData.length} total`);
  
  // ========================================
  // Initialize aggregation structures
  // ========================================
  const byOEM = {};
  const byMonth = {};
  const byOEMbyMonth = {};
  const byVendor = {};
  const byContract = {};
  const byFundingDept = {};
  const byDataSource = {};        // NEW: Aggregate by Data Source (TDR, BIC, etc.)
  const byBICStatus = {};         // NEW: Aggregate by "Also in BIC" status
  const byReportingStatus = {};   // NEW: Aggregate by Previously Reported status
  const oemsByMonth = {};         // Track which OEMs appear in each month
  const vendorsByOEM = {};        // NEW: Track which vendors sell each OEM
  const oemsByVendor = {};        // NEW: Track which OEMs each vendor sells
  const transactions = [];
  
  // Totals
  let totalSavings = 0;
  let totalCPL = 0;
  let totalPaid = 0;
  let totalQuantity = 0;
  let transactionCount = 0;
  
  // Track new vs previously reported
  let newSavings = 0;
  let previouslyReportedSavings = 0;
  
  // ========================================
  // Process each row
  // ========================================
  for (const row of validRows) {
    // Core financial values
    const saved = parseNumericValue(row['$ Saved'] || row['$_Saved'] || row['Savings'] || 0);
    const cplTotal = parseNumericValue(row['Total CPL Price'] || row['CPL Price'] || 0);
    const paidTotal = parseNumericValue(row['Total Price Paid'] || row['Price Paid'] || 0);
    const qty = parseNumericValue(row['QTY Sold'] || row['Quantity'] || 1);
    
    // Unit prices (NEW)
    const cplUnit = parseNumericValue(row['CPL Price'] || 0);
    const oneGovPrice = parseNumericValue(row['OneGov Price'] || 0);
    const paidUnit = parseNumericValue(row['Price Paid Per Unit'] || 0);
    
    // Skip rows with no savings
    if (saved === 0) continue;
    
    // Entity identifiers
    const oem = cleanString(row['OEM'] || 'Unknown');
    const vendor = cleanString(row['Vendor'] || 'Unknown');
    const contract = cleanString(row['Contract #'] || row['Contract'] || 'Unknown');
    const fundingDept = cleanString(row['Funding Dept'] || row['Funding Department'] || 'Gov Wide');
    
    // Time fields
    const reportingPeriod = row['Reporting Period'] || row['Order Date'] || 'Unknown';
    const orderDate = row['Order Date'] || '';
    const monthKey = normalizeMonth(reportingPeriod);
    
    // Product details
    const partNumber = cleanString(row['Manufacturer Part Number'] || row['Part Number'] || 'Unknown');
    const description = cleanString(row['Description of Deliverable'] || row['Description'] || '');
    const descriptionBIC = cleanString(row['Description of Deliverable (BIC)'] || '');
    
    // Discount rates
    const oneGovDiscountRate = cleanString(row['OneGov Discount Rate'] || '');
    const actualDiscountRate = cleanString(row['Actual Discount Rate'] || '');
    
    // Status flags (NEW)
    const dataSource = cleanString(row['Data Source'] || 'Unknown');
    const alsoInBIC = cleanString(row['Also in BIC'] || 'N');
    const previouslyReported = cleanString(row['Previously Reported Savings'] || 'N');
    
    // ========================================
    // Track new vs previously reported savings
    // ========================================
    if (previouslyReported === 'Y' || previouslyReported === 'Yes') {
      previouslyReportedSavings += saved;
    } else {
      newSavings += saved;
    }
    
    // ========================================
    // Aggregate by OEM
    // ========================================
    if (!byOEM[oem]) {
      byOEM[oem] = { 
        savings: 0, 
        transactions: 0, 
        cpl: 0, 
        paid: 0, 
        quantity: 0,
        newSavings: 0,
        previouslyReported: 0,
        contracts: new Set(),
        vendors: new Set(),
        fundingDepts: new Set()
      };
    }
    byOEM[oem].savings += saved;
    byOEM[oem].transactions += 1;
    byOEM[oem].cpl += cplTotal;
    byOEM[oem].paid += paidTotal;
    byOEM[oem].quantity += qty;
    byOEM[oem].contracts.add(contract);
    byOEM[oem].vendors.add(vendor);
    byOEM[oem].fundingDepts.add(fundingDept);
    if (previouslyReported === 'Y' || previouslyReported === 'Yes') {
      byOEM[oem].previouslyReported += saved;
    } else {
      byOEM[oem].newSavings += saved;
    }
    
    // ========================================
    // Aggregate by Month
    // ========================================
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { 
        savings: 0, 
        transactions: 0, 
        cpl: 0, 
        paid: 0,
        quantity: 0,
        newSavings: 0,
        previouslyReported: 0,
        oems: new Set(),
        vendors: new Set()
      };
    }
    byMonth[monthKey].savings += saved;
    byMonth[monthKey].transactions += 1;
    byMonth[monthKey].cpl += cplTotal;
    byMonth[monthKey].paid += paidTotal;
    byMonth[monthKey].quantity += qty;
    byMonth[monthKey].oems.add(oem);
    byMonth[monthKey].vendors.add(vendor);
    if (previouslyReported === 'Y' || previouslyReported === 'Yes') {
      byMonth[monthKey].previouslyReported += saved;
    } else {
      byMonth[monthKey].newSavings += saved;
    }
    
    // Track OEMs by month (for detecting new OEMs)
    if (!oemsByMonth[monthKey]) {
      oemsByMonth[monthKey] = new Set();
    }
    oemsByMonth[monthKey].add(oem);
    
    // ========================================
    // Cross-tabulation OEM x Month
    // ========================================
    if (!byOEMbyMonth[oem]) {
      byOEMbyMonth[oem] = {};
    }
    if (!byOEMbyMonth[oem][monthKey]) {
      byOEMbyMonth[oem][monthKey] = 0;
    }
    byOEMbyMonth[oem][monthKey] += saved;
    
    // ========================================
    // Aggregate by Vendor
    // ========================================
    if (!byVendor[vendor]) {
      byVendor[vendor] = { 
        savings: 0, 
        transactions: 0, 
        cpl: 0, 
        paid: 0,
        quantity: 0,
        contracts: new Set(),
        oems: new Set(),
        fundingDepts: new Set()
      };
    }
    byVendor[vendor].savings += saved;
    byVendor[vendor].transactions += 1;
    byVendor[vendor].cpl += cplTotal;
    byVendor[vendor].paid += paidTotal;
    byVendor[vendor].quantity += qty;
    byVendor[vendor].contracts.add(contract);
    byVendor[vendor].oems.add(oem);
    byVendor[vendor].fundingDepts.add(fundingDept);
    
    // ========================================
    // Aggregate by Contract
    // ========================================
    if (!byContract[contract]) {
      byContract[contract] = { 
        savings: 0, 
        transactions: 0, 
        cpl: 0,
        paid: 0,
        vendor: vendor,
        oems: new Set(),
        fundingDepts: new Set()
      };
    }
    byContract[contract].savings += saved;
    byContract[contract].transactions += 1;
    byContract[contract].cpl += cplTotal;
    byContract[contract].paid += paidTotal;
    byContract[contract].oems.add(oem);
    byContract[contract].fundingDepts.add(fundingDept);
    
    // ========================================
    // Aggregate by Funding Department
    // ========================================
    if (!byFundingDept[fundingDept]) {
      byFundingDept[fundingDept] = { 
        savings: 0, 
        transactions: 0, 
        cpl: 0, 
        paid: 0,
        quantity: 0,
        oems: new Set(),
        vendors: new Set(),
        contracts: new Set()
      };
    }
    byFundingDept[fundingDept].savings += saved;
    byFundingDept[fundingDept].transactions += 1;
    byFundingDept[fundingDept].cpl += cplTotal;
    byFundingDept[fundingDept].paid += paidTotal;
    byFundingDept[fundingDept].quantity += qty;
    byFundingDept[fundingDept].oems.add(oem);
    byFundingDept[fundingDept].vendors.add(vendor);
    byFundingDept[fundingDept].contracts.add(contract);
    
    // ========================================
    // NEW: Aggregate by Data Source
    // ========================================
    if (!byDataSource[dataSource]) {
      byDataSource[dataSource] = { 
        savings: 0, 
        transactions: 0, 
        cpl: 0, 
        paid: 0
      };
    }
    byDataSource[dataSource].savings += saved;
    byDataSource[dataSource].transactions += 1;
    byDataSource[dataSource].cpl += cplTotal;
    byDataSource[dataSource].paid += paidTotal;
    
    // ========================================
    // NEW: Aggregate by BIC Status
    // ========================================
    const bicKey = (alsoInBIC === 'Y' || alsoInBIC === 'Yes') ? 'In BIC' : 'TDR Only';
    if (!byBICStatus[bicKey]) {
      byBICStatus[bicKey] = { savings: 0, transactions: 0, cpl: 0, paid: 0 };
    }
    byBICStatus[bicKey].savings += saved;
    byBICStatus[bicKey].transactions += 1;
    byBICStatus[bicKey].cpl += cplTotal;
    byBICStatus[bicKey].paid += paidTotal;
    
    // ========================================
    // NEW: Aggregate by Reporting Status
    // ========================================
    const reportKey = (previouslyReported === 'Y' || previouslyReported === 'Yes') ? 'Previously Reported' : 'New This Period';
    if (!byReportingStatus[reportKey]) {
      byReportingStatus[reportKey] = { savings: 0, transactions: 0, cpl: 0, paid: 0 };
    }
    byReportingStatus[reportKey].savings += saved;
    byReportingStatus[reportKey].transactions += 1;
    byReportingStatus[reportKey].cpl += cplTotal;
    byReportingStatus[reportKey].paid += paidTotal;
    
    // ========================================
    // Track vendor-OEM relationships
    // ========================================
    if (!vendorsByOEM[oem]) {
      vendorsByOEM[oem] = new Set();
    }
    vendorsByOEM[oem].add(vendor);
    
    if (!oemsByVendor[vendor]) {
      oemsByVendor[vendor] = new Set();
    }
    oemsByVendor[vendor].add(oem);
    
    // ========================================
    // Track individual transactions (LEAN for cell size)
    // ========================================
    transactions.push({
      oem: oem,
      vendor: vendor,
      contract: contract,
      partNumber: partNumber,
      // Truncate description to save space
      description: description.length > 80 ? description.substring(0, 80) + '...' : description,
      quantity: qty,
      cplTotal: cplTotal,
      cplUnit: cplUnit,
      oneGovPrice: oneGovPrice,
      paidTotal: paidTotal,
      paidUnit: paidUnit,
      savings: saved,
      oneGovDiscountRate: oneGovDiscountRate,
      actualDiscountRate: actualDiscountRate,
      fundingDept: fundingDept,
      dataSource: dataSource,
      alsoInBIC: alsoInBIC,
      previouslyReported: previouslyReported,
      reportingPeriod: monthKey,
      orderDate: orderDate ? normalizeMonth(orderDate) : monthKey
    });
    
    // Update totals
    totalSavings += saved;
    totalCPL += cplTotal;
    totalPaid += paidTotal;
    totalQuantity += qty;
    transactionCount += 1;
  }
  
  // ========================================
  // Calculate derived metrics
  // ========================================
  const overallDiscountRate = totalCPL > 0 ? ((totalCPL - totalPaid) / totalCPL * 100).toFixed(2) : 0;
  const avgSavingsPerTransaction = transactionCount > 0 ? (totalSavings / transactionCount).toFixed(2) : 0;
  const avgDiscountPerUnit = totalQuantity > 0 ? (totalSavings / totalQuantity).toFixed(2) : 0;
  
  // ========================================
  // Convert Sets to Arrays for JSON serialization
  // ========================================
  const convertSetsToArrays = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = { ...value };
      for (const [field, fieldValue] of Object.entries(value)) {
        if (fieldValue instanceof Set) {
          result[key][field] = Array.from(fieldValue);
          result[key][field + 'Count'] = fieldValue.size;
        }
      }
    }
    return result;
  };
  
  // Convert oemsByMonth Sets to Arrays
  const oemsByMonthArrays = {};
  for (const [month, oemSet] of Object.entries(oemsByMonth)) {
    oemsByMonthArrays[month] = Array.from(oemSet);
  }
  
  // Convert vendor/OEM relationship Sets
  const vendorsByOEMArrays = {};
  for (const [oem, vendors] of Object.entries(vendorsByOEM)) {
    vendorsByOEMArrays[oem] = Array.from(vendors);
  }
  
  const oemsByVendorArrays = {};
  for (const [vendor, oems] of Object.entries(oemsByVendor)) {
    oemsByVendorArrays[vendor] = Array.from(oems);
  }
  
  // ========================================
  // Return comprehensive structure
  // ========================================
  return {
    summary: {
      totalSavings: totalSavings,
      totalCPL: totalCPL,
      totalPaid: totalPaid,
      totalQuantity: totalQuantity,
      transactionCount: transactionCount,
      overallDiscountRate: overallDiscountRate,
      avgSavingsPerTransaction: parseFloat(avgSavingsPerTransaction),
      avgDiscountPerUnit: parseFloat(avgDiscountPerUnit),
      // Counts
      oemCount: Object.keys(byOEM).length,
      vendorCount: Object.keys(byVendor).length,
      contractCount: Object.keys(byContract).length,
      fundingDeptCount: Object.keys(byFundingDept).length,
      monthCount: Object.keys(byMonth).length,
      dataSourceCount: Object.keys(byDataSource).length,
      // New vs Previously Reported
      newSavings: newSavings,
      previouslyReportedSavings: previouslyReportedSavings,
      newSavingsPercent: totalSavings > 0 ? (newSavings / totalSavings * 100).toFixed(2) : 0,
      previouslyReportedPercent: totalSavings > 0 ? (previouslyReportedSavings / totalSavings * 100).toFixed(2) : 0
    },
    byOEM: convertSetsToArrays(byOEM),
    byMonth: convertSetsToArrays(byMonth),
    byOEMbyMonth: byOEMbyMonth,
    byVendor: convertSetsToArrays(byVendor),
    byContract: convertSetsToArrays(byContract),
    byFundingDept: convertSetsToArrays(byFundingDept),
    byDataSource: byDataSource,
    byBICStatus: byBICStatus,
    byReportingStatus: byReportingStatus,
    oemsByMonth: oemsByMonthArrays,
    vendorsByOEM: vendorsByOEMArrays,
    oemsByVendor: oemsByVendorArrays,
    transactions: transactions,
    rawRowCount: rawData.length,
    validRowCount: validRows.length
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse a numeric value from various formats
 * Handles currency strings, percentages, and plain numbers
 */
function parseNumericValue(value) {
  if (value === null || value === undefined || value === '') return 0;
  
  if (typeof value === 'number') return value;
  
  // Remove currency symbols, commas, spaces, and percentage signs
  const str = String(value).replace(/[$,\s%]/g, '').trim();
  
  if (str === '' || str === '-') return 0;
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalize month format to "Mon YYYY" (e.g., "Jun 2025" or "25-Jun" -> "Jun 2025")
 */
function normalizeMonth(dateValue) {
  if (!dateValue) return 'Unknown';
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return monthNames[dateValue.getMonth()] + ' ' + dateValue.getFullYear();
  }
  
  const str = String(dateValue).trim();
  
  // Handle "Mon YYYY" format (already normalized)
  if (/^[A-Za-z]{3}\s+\d{4}$/.test(str)) {
    return str;
  }
  
  // Handle "YY-Mon" format (e.g., "25-Jun")
  const yyMonMatch = str.match(/^(\d{2})-([A-Za-z]{3})$/);
  if (yyMonMatch) {
    const year = parseInt(yyMonMatch[1]) + 2000; // Assumes 20xx
    const month = yyMonMatch[2];
    return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase() + ' ' + year;
  }
  
  // Handle "Mon-YY" format (e.g., "Jun-25")
  const monYYMatch = str.match(/^([A-Za-z]{3})-(\d{2})$/);
  if (monYYMatch) {
    const month = monYYMatch[1];
    const year = parseInt(monYYMatch[2]) + 2000;
    return month.charAt(0).toUpperCase() + month.slice(1).toLowerCase() + ' ' + year;
  }
  
  // Try parsing as a date
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return monthNames[date.getMonth()] + ' ' + date.getFullYear();
  }
  
  // Return as-is if can't parse
  return str;
}

/**
 * Clean and trim string values
 */
function cleanString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
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

/**
 * Format an array as a natural language list with "and"
 * Examples: ["A"] -> "A", ["A","B"] -> "A and B", ["A","B","C"] -> "A, B, and C"
 */
function formatListWithAnd(items) {
  if (!items || items.length === 0) return 'None';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(' and ');
  return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
}

// ============================================================================
// TEST FUNCTION
// ============================================================================

/**
 * Test the data processor with sample data
 */
function testProcessOneGovSavingsData() {
  // Sample test data matching your column structure
  const testData = [
    {
      'Also in BIC': 'Y',
      'Cost Savings Validated': 'Y',
      'Previously Reported Savings': 'Y',
      'Data Source': 'TDR/BIC',
      'Contract #': '47QSWA18D008F',
      'OEM': 'Elastic',
      'Vendor': 'Carahsoft Technology Corp',
      'Funding Dept': 'DHS',
      'Order Date': '7/30/2025',
      'Reporting Period': '25-Jun',
      'Manufacturer Part Number': 'SBF-ENT-ADV',
      'Description of Deliverable': 'Federal Enterprise Resource Unit - 64 GB',
      'QTY Sold': 1299,
      'CPL Price': '$13,400.00',
      'Total CPL Price': '$17,406,600.00',
      'OneGov Price': '$9,715.00',
      'Price Paid Per Unit': '$5,608.73',
      'Total Price Paid': '$7,285,740.27',
      'OneGov Discount Rate': '27.5% - 60.0%',
      'Actual Discount Rate': '58.14%',
      '$ Saved': '$10,120,859.73'
    },
    {
      'Also in BIC': 'Y',
      'Cost Savings Validated': 'Y',
      'Previously Reported Savings': 'N',
      'Data Source': 'TDR/BIC',
      'Contract #': '47QSWA18D008F',
      'OEM': 'Salesforce',
      'Vendor': 'Carahsoft Technology Corp',
      'Funding Dept': 'Gov Wide',
      'Order Date': '9/1/2025',
      'Reporting Period': '25-Sep',
      'Manufacturer Part Number': '200007692-Fed',
      'Description of Deliverable': 'Slack Enterprise Grid',
      'QTY Sold': 1500,
      'CPL Price': '$379.16',
      'Total CPL Price': '$568,740.00',
      'OneGov Price': '$42.00',
      'Price Paid Per Unit': '$42.00',
      'Total Price Paid': '$63,000.00',
      'OneGov Discount Rate': '88.92%',
      'Actual Discount Rate': '88.92%',
      '$ Saved': '$505,740.00'
    }
  ];
  
  const result = processOneGovSavingsData(testData);
  
  Logger.log('=== TEST RESULTS ===');
  Logger.log('Summary:');
  Logger.log(JSON.stringify(result.summary, null, 2));
  Logger.log('\nbyOEM:');
  Logger.log(JSON.stringify(result.byOEM, null, 2));
  Logger.log('\nbyFundingDept:');
  Logger.log(JSON.stringify(result.byFundingDept, null, 2));
  Logger.log('\nbyReportingStatus:');
  Logger.log(JSON.stringify(result.byReportingStatus, null, 2));
  Logger.log('\nTransaction count: ' + result.transactions.length);
  
  // Test JSON size
  const jsonString = JSON.stringify(result);
  Logger.log('\nJSON size: ' + jsonString.length + ' characters');
  Logger.log('Fits in cell (50K limit): ' + (jsonString.length < 50000 ? 'YES' : 'NO'));
  
  return result;
}