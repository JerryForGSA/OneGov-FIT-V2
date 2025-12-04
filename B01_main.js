/**
 * Backend Main Entry Point - B01_main.js
 * Google Apps Script main functions for OneGov FIT Market
 * VERSION 140: Fix website/LinkedIn buttons in entity detail view
 */

// Import R02 Chart Buffet Specifications
// Note: This will be loaded at runtime when needed

/**
 * Main entry point for Google Apps Script
 * This function will be called by the web app
 */
function doGet(e) {
  try {
    console.log('VERSION 31 - OneGov FIT V2 - Fixed syntax error + B02 Data Manager');
    const action = e.parameter.action;
    const page = e.parameter.page;
    const rowNum = e.parameter.rowNum;
    
    console.log('doGet called with:', { action, page, rowNum, allParams: e.parameter });
    
    // Handle page routing
    if (page === 'reportbuilder') {
      return HtmlService.createHtmlOutputFromFile('F03_ReportBuilder')
        .setTitle('OneGov FIT Market - Report Builder')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    if (page === 'reporttable') {
      return HtmlService.createHtmlOutputFromFile('F04_ReportTable')
        .setTitle('OneGov FIT Market - Report Table')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    if (page === 'savingsreport') {
      return HtmlService.createHtmlOutputFromFile('F06_OneGovSavingsReport')
        .setTitle('OneGov FIT Market - Savings Report')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // If no action or page specified, serve the main HTML page
    if (!action) {
      // Use the exact React version with advanced JSON architecture
      return HtmlService.createHtmlOutputFromFile('F05_ExactReactWithJSON')
        .setTitle('OneGov FIT Market')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // Handle API calls
    const entityType = e.parameter.entityType;
    switch (action) {
      case 'getEntities':
        try {
          const manager = getDataManager();
          const entities = manager.getEntities(entityType);
          return createWebResponse(true, entities, null);
        } catch (error) {
          console.error('Error getting entities:', error);
          return createWebResponse(false, null, error.toString());
        }
      case 'getAnalytics':
        return getAnalytics(e.parameter.entityId);
      case 'exportReport':
        return exportReport(JSON.parse(e.parameter.reportData));
      default:
        return createResponse(false, null, 'Unknown action');
    }
  } catch (error) {
    console.error('Error in doGet:', error);
    return createResponse(false, null, error.toString());
  }
}

/**
 * Include other HTML files (for templates)
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (error) {
    console.error('Include error for', filename, ':', error);
    return `<div class="error">Failed to load ${filename}: ${error.toString()}</div>`;
  }
}

/**
 * Get URL for Report Builder web app
 */
function getReportBuilderUrl() {
  try {
    // Get the current web app URL and modify it to serve the Report Builder
    const webAppUrl = ScriptApp.getService().getUrl();
    return webAppUrl + '?page=reportbuilder';
  } catch (error) {
    console.error('Error getting Report Builder URL:', error);
    return null;
  }
}

/**
 * Get URL for Report Table web app
 */
function getReportTableUrl() {
  try {
    // Get the current web app URL and modify it to serve the Report Table
    const webAppUrl = ScriptApp.getService().getUrl();
    return webAppUrl + '?page=reporttable';
  } catch (error) {
    console.error('Error getting Report Table URL:', error);
    return null;
  }
}

/**
 * Get available columns for dynamic dropdown
 */
function getAvailableColumns(entityType = 'agency') {
  try {
    console.log(` DYNAMIC COLUMNS: Getting available columns for ${entityType}`);
    
    // Use DataManager to get entity data - but never return the instance
    const dataManager = OneGovDataManager.getInstance();
    let entities = [];
    
    switch (entityType.toLowerCase()) {
      case 'agency':
        entities = dataManager.getAgencies();
        break;
      case 'oem':
        entities = dataManager.getOEMs();
        break;
      case 'vendor':
        entities = dataManager.getVendors();
        break;
      default:
        entities = dataManager.getAgencies();
    }
    
    if (!entities || entities.length === 0) {
      console.log('⚠️ DYNAMIC COLUMNS: No entities found');
      return ['obligations'];
    }
    
    // Get first entity to analyze available columns
    const sampleEntity = entities[0];
    console.log(`📊 DYNAMIC COLUMNS: Sample entity structure:`, Object.keys(sampleEntity));
    
    const availableColumns = [];
    
    // Check for ALL numeric columns in the entity data
    Object.keys(sampleEntity).forEach(key => {
      const value = sampleEntity[key];
      
      // Skip system columns only
      if (key === 'name' || key === 'id' || key === 'type') return;
      
      // Skip ONLY these 2 specific excluded columns
      if (key === 'OneGov Discounted Products' || key === 'Expiring OneGov Discounted Products') return;
      
      // Include ALL other numeric columns
      if (typeof value === 'number') {
        availableColumns.push(key);
      } else if (typeof value === 'string') {
        try {
          // Check if it's a JSON column with numeric data
          const jsonData = JSON.parse(value);
          if (jsonData && typeof jsonData === 'object') {
            // If it has fiscal year data or is numeric, include it
            if (jsonData.fiscal_years || 
                jsonData.fiscal_year_breakdown || 
                jsonData.fiscal_year_obligations ||
                jsonData.yearly_totals ||
                jsonData.total ||
                typeof jsonData === 'number') {
              availableColumns.push(key);
            }
          } else if (typeof jsonData === 'number') {
            availableColumns.push(key);
          }
        } catch (e) {
          // Not JSON, check if it's a direct numeric value
          if (!isNaN(parseFloat(value)) && isFinite(value)) {
            availableColumns.push(key);
          }
        }
      }
    });
    
    console.log(` DYNAMIC COLUMNS DEBUG: Entity keys:`, Object.keys(sampleEntity));
    console.log(` DYNAMIC COLUMNS DEBUG: Found columns:`, availableColumns);
    
    // Ensure 'obligations' is included as default
    if (!availableColumns.includes('obligations')) {
      availableColumns.unshift('obligations');
    }
    
    // Convert snake_case to Title Case for display
    const formattedColumns = availableColumns.map(col => ({
      id: col,
      name: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
    
    console.log(` DYNAMIC COLUMNS: Found ${formattedColumns.length} columns:`, formattedColumns);
    
    return ensureSerializable(formattedColumns);
    
  } catch (error) {
    console.error('🚨 DYNAMIC COLUMNS Error:', error);
    // Return default fallback
    return ensureSerializable([
      { id: 'obligations', name: 'Obligations' },
      { id: 'contracts', name: 'Contracts' },
      { id: 'fiscal_year_breakdown', name: 'Fiscal Year Breakdown' }
    ]);
  }
}

/**
 * Simple test function to isolate serialization issues
 */
function testBasicReturn() {
  return "Hello World";
}

/**
 * Find entities that actually have FAS/BIC URLs
 */
function findEntitiesWithTables() {
  try {
    const SPREADSHEET_ID = '18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    const results = [];
    const sheetsToCheck = ['OEM', 'Vendor', 'Agency'];
    
    for (const sheetName of sheetsToCheck) {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) continue;
      
      const values = sheet.getDataRange().getValues();
      console.log(` Checking ${sheetName} sheet with ${values.length} rows`);
      
      // Check first 10 rows for entities with URLs
      for (let i = 1; i < Math.min(11, values.length); i++) {
        const row = values[i];
        const name = row[1]; // Column B
        const fasUrl = row[24]; // Column Y
        const bicUrl = row[26]; // Column AA
        
        if (name && (fasUrl || bicUrl)) {
          results.push({
            sheet: sheetName,
            name: name,
            fasUrl: fasUrl || 'None',
            bicUrl: bicUrl || 'None',
            rowNumber: i + 1
          });
        }
      }
    }
    
    console.log(` Found ${results.length} entities with table URLs`);
    return results;
  } catch (error) {
    console.error('Error finding entities with tables:', error);
    return { error: error.toString() };
  }
}

/**
 * Test function to check FAS/BIC URLs directly for Adobe
 */
function testFasBicUrls() {
  try {
    const SPREADSHEET_ID = '18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('OEM');
    
    if (!sheet) {
      return { error: 'OEM sheet not found' };
    }
    
    const values = sheet.getDataRange().getValues();
    console.log(' Sheet has', values.length, 'rows and', values[0].length, 'columns');
    
    // Find Adobe row
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const name = row[1]; // Column B
      
      if (name && name.toLowerCase().includes('adobe')) {
        console.log(' Found Adobe at row', i + 1);
        console.log(' Adobe name:', name);
        console.log(' Row length:', row.length);
        console.log(' Column Y (index 24):', row[24]);
        console.log(' Column AA (index 26):', row[26]);
        
        return {
          name: name,
          rowLength: row.length,
          fasUrl: row[24], // Column Y 
          bicUrl: row[26]  // Column AA
        };
      }
    }
    
    return { error: 'Adobe not found in OEM sheet' };
  } catch (error) {
    console.error('Error in testFasBicUrls:', error);
    return { error: error.toString() };
  }
}

function testArrayReturn() {
  return [1, 2, 3];
}

function testObjectReturn() {
  return { test: "value", number: 123 };
}

/**
 * Get current user information
 */
function getCurrentUser() {
  try {
    const user = Session.getActiveUser();
    return {
      name: user.getEmail().split('@')[0],
      email: user.getEmail(),
      role: 'Team Member', // Default role
      lastSync: new Date().toLocaleString()
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return {
      name: 'Unknown User',
      email: '',
      role: 'Team Member',
      lastSync: 'N/A'
    };
  }
}

/**
 * Simple test function for debugging
 */
function sayHello() {
  return 'Hello from OneGov FIT Market! Current time: ' + new Date().toLocaleString();
}

/**
 * Test function to verify data access
 */
function getSimpleData() {
  try {
    const SPREADSHEET_ID = '18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const oemSheet = spreadsheet.getSheetByName('OEM');
    
    if (!oemSheet) {
      return { error: 'OEM sheet not found' };
    }
    
    // Get first few rows to test
    const range = oemSheet.getRange(1, 1, 3, 5);
    const values = range.getValues();
    
    return {
      success: true,
      message: 'Data access successful',
      sample: values,
      rowCount: oemSheet.getLastRow(),
      colCount: oemSheet.getLastColumn()
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Test function for Report Builder
 */
function testReportBuilder() {
  try {
    return {
      success: true,
      message: 'Report Builder backend is accessible',
      timestamp: new Date().toISOString(),
      functions: {
        getReportBuilderData: 'available',
        getEnhancedReportBuilderData: 'available',
        getReportBuilderFilters: 'available'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get data for Ready view
 */
function getReadyViewDataOptimizedWrapper() {
  try {
    return {
      extractionLog: [],
      oemFiles: [],
      playbook: []
    };
  } catch (error) {
    console.error('Error getting ready view data:', error);
    return {
      extractionLog: [],
      oemFiles: [],
      playbook: []
    };
  }
}

/**
 * Log visitor activity
 */
function logVisitorActivity(viewName) {
  try {
    // You can add actual logging logic here if needed
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
}

/**
 * Get entities from Google Sheets using proper column structure
 */
/**
 * Get data manager instance
 * @returns {OneGovDataManager} The data manager instance
 */
function getDataManager() {
  if (!global.dataManager) {
    global.dataManager = new OneGovDataManager();
  }
  return global.dataManager;
}

/**
 * Get entities using B02 data manager
 * @param {string} entityType - Type of entity ('oem', 'vendor', 'agency')
 * @returns {Object} Response with entities data
 */
function getEntities(entityType) {
  try {
    const dataManager = getDataManager();
    const entities = dataManager.getEntities(entityType);
    
    console.log(`getEntities(${entityType}): Using B02 data manager - found ${entities.length} entities`);
    return createResponse(true, entities, null);
  } catch (error) {
    console.error('Error getting entities:', error);
    return createResponse(false, null, error.toString());
  }
}

/**
 * Wrapper function for getting OEM entities
 */
function getOEMs() {
  try {
    console.log('getOEMs() called - using B02 data manager');
    return getEntities('oem');
  } catch (error) {
    console.error('Error getting OEMs:', error);
    return createWebResponse(false, null, error.toString());
  }
}

/**
 * Wrapper function for getting Vendor entities
 */
function getVendors() {
  try {
    console.log('getVendors() called - using B02 data manager');
    return getEntities('vendor');
  } catch (error) {
    console.error('Error getting Vendors:', error);
    return createWebResponse(false, null, error.toString());
  }
}

/**
 * Wrapper function for getting Agency entities
 */
function getAgencies() {
  try {
    console.log('getAgencies() called - using B02 data manager');
    return getEntities('agency');
  } catch (error) {
    console.error('Error getting Agencies:', error);
    return createWebResponse(false, null, error.toString());
  }
}

/**
 * Get all entities for the main dashboard
 * This is called by F01_MainDashboard.html
 */
function getAllEntities() {
  try {
    const dataManager = getDataManager();
    dataManager.loadAllData();
    
    // Get raw entities directly from cache
    const agencies = dataManager.cache.agencies || [];
    const oems = dataManager.cache.oems || [];
    const vendors = dataManager.cache.vendors || [];
    
    // Combine all entities
    const allEntities = [...agencies, ...oems, ...vendors];
    
    if (allEntities.length > 0) {
      // Transform using dataManager
      const transformed = dataManager.transformForDashboard(allEntities);
      const serialized = ensureSerializable(transformed);
      return serialized;
    } else {
      return [];
    }
    
  } catch (error) {
    console.error('getAllEntities error:', error);
    return [];
  }
}

// Legacy wrapper functions removed - use getOEMs(), getVendors(), getAgencies() directly

/**
 * Get report table data
 */
function getReportTableData() {
  try {
    const SPREADSHEET_ID = '18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Combine data from all entity types
    const oems = getEntities('oem') || [];
    const vendors = getEntities('vendor') || [];
    const agencies = getEntities('agency') || [];
    
    // Format for report table
    const reportData = [];
    let id = 1;
    
    // Add OEMs
    oems.forEach(entity => {
      reportData.push({
        id: id++,
        name: entity.name || entity.entityName,
        category: 'OEM',
        type: 'Manufacturer',
        total: entity.totalObligations || 0,
        fy24: entity.fy24Obligations || 0,
        fy25: entity.fy25Obligations || 0,
        tier: entity.tier || 'N/A',
        small_business: entity.smallBusiness || 'N/A'
      });
    });
    
    // Add Vendors
    vendors.forEach(entity => {
      reportData.push({
        id: id++,
        name: entity.name || entity.entityName,
        category: 'Vendor',
        type: entity.vendorType || 'Reseller',
        total: entity.totalObligations || 0,
        fy24: entity.fy24Obligations || 0,
        fy25: entity.fy25Obligations || 0,
        tier: entity.tier || 'Tier 2',
        small_business: entity.smallBusiness || 'N/A'
      });
    });
    
    // Add Agencies
    agencies.forEach(entity => {
      reportData.push({
        id: id++,
        name: entity.name || entity.entityName,
        category: 'Agency',
        type: 'Federal Agency',
        total: entity.totalObligations || 0,
        fy24: entity.fy24Obligations || 0,
        fy25: entity.fy25Obligations || 0,
        tier: 'N/A',
        small_business: 'N/A'
      });
    });
    
    return reportData;
  } catch (error) {
    console.error('Error getting report table data:', error);
    return [];
  }
}

/**
 * Export report table data
 */
function exportReportTable(data, format) {
  try {
    if (format === 'sheets') {
      // Create a new spreadsheet
      const spreadsheet = SpreadsheetApp.create('OneGov FIT Report Export - ' + new Date().toISOString());
      const sheet = spreadsheet.getActiveSheet();
      
      // Add headers
      const headers = Object.keys(data[0] || {});
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Add data
      const rows = data.map(row => headers.map(header => row[header] || ''));
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      
      return { success: true, url: spreadsheet.getUrl() };
    } else if (format === 'csv') {
      // Generate CSV content
      const headers = Object.keys(data[0] || {});
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
      ].join('\n');
      
      return { success: true, csv: csv };
    }
    
    return { success: false, error: 'Invalid format' };
  } catch (error) {
    console.error('Error exporting report table:', error);
    throw error;
  }
}

/**
 * Get comprehensive cross-sheet analytics for summary dashboard
 */
function getSummaryDashboardData() {
  try {
    console.log('getSummaryDashboardData: Called for KPI calculations');
    
    // Use efficient B02 data manager
    const dataManager = getDataManager();
    const oems = dataManager.getOEMs() || [];
    const vendors = dataManager.getVendors() || [];
    const agencies = dataManager.getAgencies() || [];
    
    console.log(`getSummaryDashboardData: Loaded ${oems.length} OEMs, ${vendors.length} vendors, ${agencies.length} agencies`);
    
    const dashboard = {
      overview: {
        totalEntities: oems.length + vendors.length + agencies.length,
        totalOEMs: oems.length,
        totalVendors: vendors.length,
        totalAgencies: agencies.length
      },
      obligations: {
        oemTotal: 0,
        vendorTotal: 0,
        agencyTotal: 0,
        grandTotal: 0
      },
      tiers: {
        oem: {},
        vendor: {},
        agency: {}
      },
      aiAdoption: {
        oemCount: 0,
        vendorCount: 0,
        agencyCount: 0,
        oemPercent: 0,
        vendorPercent: 0,
        agencyPercent: 0
      },
      topPerformers: {
        topOEMs: [],
        topVendors: [],
        topAgencies: []
      },
      fiscalYearTrends: {
        2022: { oem: 0, vendor: 0, agency: 0 },
        2023: { oem: 0, vendor: 0, agency: 0 },
        2024: { oem: 0, vendor: 0, agency: 0 },
        2025: { oem: 0, vendor: 0, agency: 0 }
      },
      contracts: {
        oemContracts: 0,
        vendorContracts: 0,
        agencyContracts: 0
      }
    };
    
    // Process OEM data
    oems.forEach(oem => {
      if (oem.totalObligations) {
        dashboard.obligations.oemTotal += oem.totalObligations;
      }
      if (oem.tier) {
        dashboard.tiers.oem[oem.tier] = (dashboard.tiers.oem[oem.tier] || 0) + 1;
      }
      if (oem.hasAIProducts) {
        dashboard.aiAdoption.oemCount++;
      }
      if (oem.contractVehicleCount) {
        dashboard.contracts.oemContracts += oem.contractVehicleCount;
      }
    });
    
    // Process Vendor data
    vendors.forEach(vendor => {
      if (vendor.totalObligations) {
        dashboard.obligations.vendorTotal += vendor.totalObligations;
      }
      if (vendor.tier) {
        dashboard.tiers.vendor[vendor.tier] = (dashboard.tiers.vendor[vendor.tier] || 0) + 1;
      }
      if (vendor.hasAIProducts) {
        dashboard.aiAdoption.vendorCount++;
      }
      if (vendor.contractVehicleCount) {
        dashboard.contracts.vendorContracts += vendor.contractVehicleCount;
      }
    });
    
    // Process Agency data  
    agencies.forEach(agency => {
      if (agency.totalObligations) {
        dashboard.obligations.agencyTotal += agency.totalObligations;
      }
      if (agency.tier) {
        dashboard.tiers.agency[agency.tier] = (dashboard.tiers.agency[agency.tier] || 0) + 1;
      }
      if (agency.hasAIProducts) {
        dashboard.aiAdoption.agencyCount++;
      }
      if (agency.contractVehicleCount) {
        dashboard.contracts.agencyContracts += agency.contractVehicleCount;
      }
    });
    
    // Calculate totals and percentages
    dashboard.obligations.grandTotal = dashboard.obligations.oemTotal + 
                                      dashboard.obligations.vendorTotal + 
                                      dashboard.obligations.agencyTotal;
    
    dashboard.aiAdoption.oemPercent = (dashboard.aiAdoption.oemCount / oems.length * 100).toFixed(1);
    dashboard.aiAdoption.vendorPercent = (dashboard.aiAdoption.vendorCount / vendors.length * 100).toFixed(1);
    dashboard.aiAdoption.agencyPercent = (dashboard.aiAdoption.agencyCount / agencies.length * 100).toFixed(1);
    
    // Get top performers
    dashboard.topPerformers.topOEMs = oems
      .filter(o => o.totalObligations)
      .sort((a, b) => b.totalObligations - a.totalObligations)
      .slice(0, 5)
      .map(o => ({ name: o.name, obligations: o.totalObligations, tier: o.tier }));
      
    dashboard.topPerformers.topVendors = vendors
      .filter(v => v.totalObligations)
      .sort((a, b) => b.totalObligations - a.totalObligations)
      .slice(0, 5)
      .map(v => ({ name: v.name, obligations: v.totalObligations, tier: v.tier }));
      
    dashboard.topPerformers.topAgencies = agencies
      .filter(a => a.totalObligations)
      .sort((a, b) => b.totalObligations - a.totalObligations)
      .slice(0, 5)
      .map(a => ({ name: a.name, obligations: a.totalObligations, tier: a.tier }));
    
    return createResponse(true, dashboard, null);
  } catch (error) {
    console.error('Error getting summary dashboard data:', error);
    return createResponse(false, null, error.toString());
  }
}

/**
 * Legacy analytics function for backward compatibility
 */
function getAnalytics(entityId) {
  return getSummaryDashboardData();
}

/**
 * Sum values from JSON object (for obligations, etc.)
 */
function sumJsonValues(jsonObj) {
  if (!jsonObj || typeof jsonObj !== 'object') return 0;
  
  // Handle different JSON structures based on your documentation
  
  // 1. Obligations JSON - has total_obligated field
  if (jsonObj.total_obligated && typeof jsonObj.total_obligated === 'number') {
    return jsonObj.total_obligated;
  }
  
  // 2. Fiscal year obligations - sum the yearly amounts
  if (jsonObj.fiscal_year_obligations && typeof jsonObj.fiscal_year_obligations === 'object') {
    let sum = 0;
    for (const year in jsonObj.fiscal_year_obligations) {
      const value = jsonObj.fiscal_year_obligations[year];
      if (typeof value === 'number') {
        sum += value;
      }
    }
    return sum;
  }
  
  // 3. Tier JSON - has summary.total_all_obligations
  if (jsonObj.summary && jsonObj.summary.total_all_obligations && typeof jsonObj.summary.total_all_obligations === 'number') {
    return jsonObj.summary.total_all_obligations;
  }
  
  // 4. Contract vehicle structure - sum all contract totals
  // This handles the structure I see in your debug output
  let contractSum = 0;
  let hasContractData = false;
  
  for (const key in jsonObj) {
    const item = jsonObj[key];
    if (item && typeof item === 'object') {
      if (item.total && typeof item.total === 'number') {
        contractSum += item.total;
        hasContractData = true;
      }
      // Also handle fiscal_years structure within contracts
      if (item.fiscal_years && typeof item.fiscal_years === 'object') {
        for (const year in item.fiscal_years) {
          const yearValue = item.fiscal_years[year];
          if (typeof yearValue === 'number') {
            contractSum += yearValue;
            hasContractData = true;
          }
        }
      }
    }
  }
  
  if (hasContractData) {
    return contractSum;
  }
  
  // 5. Direct total field
  if (jsonObj.total && typeof jsonObj.total === 'number') {
    return jsonObj.total;
  }
  
  // 6. Sum all numeric values in top level
  let sum = 0;
  for (const key in jsonObj) {
    const value = jsonObj[key];
    if (typeof value === 'number') {
      sum += value;
    } else if (typeof value === 'string') {
      // Try to parse as number, removing $ and commas
      const numValue = parseFloat(value.replace(/[$,]/g, ''));
      if (!isNaN(numValue)) {
        sum += numValue;
      }
    }
  }
  
  return sum;
}

/**
 * Extract meaningful data from different JSON column types
 */
function extractJsonInsights(jsonObj, columnType) {
  if (!jsonObj || typeof jsonObj !== 'object') return {};
  
  const insights = {};
  
  switch (columnType) {
    case 'tier':
      if (jsonObj.summary) {
        insights.uniqueOEMs = jsonObj.summary.unique_oems;
        insights.tierDistribution = jsonObj.summary.tier_distribution;
        insights.totalObligations = jsonObj.summary.total_all_obligations;
      }
      if (jsonObj.tier_details) {
        insights.tierDetails = jsonObj.tier_details;
      }
      break;
      
    case 'obligations':
      if (jsonObj.fiscal_year_obligations) {
        insights.fiscalYears = Object.keys(jsonObj.fiscal_year_obligations);
        insights.latestYear = Math.max(...insights.fiscalYears.map(y => parseInt(y)));
        insights.totalObligations = jsonObj.total_obligated;
      }
      break;
      
    case 'resellers':
    case 'contractVehicle':
    case 'fundingAgency':
      // For these, count the number of entries and extract top items
      insights.count = Object.keys(jsonObj).length;
      insights.items = Object.keys(jsonObj).slice(0, 5); // Top 5
      break;
  }
  
  return insights;
}

/**
 * Export report to Google Docs/Sheets/Slides
 */
function exportReport(reportData) {
  try {
    const { selectedCards, exportFormat } = reportData;
    
    switch (exportFormat) {
      case 'docs':
        return exportToGoogleDocs(selectedCards);
      case 'sheets':
        return exportToGoogleSheets(selectedCards);
      case 'slides':
        return exportToGoogleSlides(selectedCards);
      default:
        throw new Error(`Unknown export format: ${exportFormat}`);
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    return createResponse(false, null, error.toString());
  }
}

/**
 * Export to Google Docs
 */
function exportToGoogleDocs(cards) {
  try {
    const doc = DocumentApp.create('OneGov FIT Market Report - ' + new Date().toLocaleDateString());
    const body = doc.getBody();
    
    body.appendParagraph('OneGov FIT Market Analytics Report')
      .setHeading(DocumentApp.ParagraphHeading.TITLE);
    
    body.appendParagraph('Generated on: ' + new Date().toLocaleString())
      .setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
    
    cards.forEach((card, index) => {
      body.appendParagraph(`${index + 1}. ${card.title}`)
        .setHeading(DocumentApp.ParagraphHeading.HEADING1);
      
      if (card.selected === 'chart' || card.selected === 'both') {
        body.appendParagraph(`Chart: ${card.chart.title}`);
      }
      
      if (card.selected === 'table' || card.selected === 'both') {
        body.appendParagraph(`Table: ${card.table.title}`);
        // Add table data here
      }
    });
    
    const url = doc.getUrl();
    doc.saveAndClose();
    
    return createResponse(true, { url }, null);
  } catch (error) {
    console.error('Error exporting to Google Docs:', error);
    return createResponse(false, null, error.toString());
  }
}

/**
 * Export to Google Sheets
 */
function exportToGoogleSheets(cards) {
  try {
    // Implementation for Google Sheets export
    const sheet = SpreadsheetApp.create('OneGov FIT Market Report - ' + new Date().toLocaleDateString());
    const url = sheet.getUrl();
    return createResponse(true, { url }, null);
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    return createResponse(false, null, error.toString());
  }
}

/**
 * Export to Google Slides
 */
function exportToGoogleSlides(cards) {
  try {
    // Implementation for Google Slides export
    const presentation = SlidesApp.create('OneGov FIT Market Report - ' + new Date().toLocaleDateString());
    const url = presentation.getUrl();
    return createResponse(true, { url }, null);
  } catch (error) {
    console.error('Error exporting to Google Slides:', error);
    return createResponse(false, null, error.toString());
  }
}

/* ARCHIVED - Duplicate parseJSONColumn function
 * REPLACED BY: B02_dataManager.js parseJSON() method
 */
/* function parseJSONColumn(value) {
  if (!value) return null;
  
  try {
    // Handle both string and object types
    if (typeof value === 'object') {
      return value; // Already parsed
    }
    
    if (typeof value === 'string') {
      // Clean up the JSON string - remove extra whitespace and newlines
      const cleanValue = value.trim();
      if (cleanValue === '' || cleanValue === '{}' || cleanValue === '[]') {
        return null;
      }
      
      return JSON.parse(cleanValue);
    }
    
    return null;
  } catch (error) {
    console.warn('Error parsing JSON column:', error, 'Value:', value);
    return null;
  }
} */

/**
 * Helper function to create standardized web responses
 */
function createWebResponse(success, data, error) {
  const response = {
    success: success,
    data: data,
    error: error,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper function to create standardized responses
 */
function createResponse(success, data, error) {
  const response = {
    success: success,
    data: data,
    error: error,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper function to safely parse column data
 */
function parseColumnData(sheet, row, colIndex) {
  const value = sheet.getRange(row, colIndex).getValue();
  if (!value || value === '') return null;
  try {
    return JSON.parse(value);
  } catch(e) {
    console.error(`Parse error at row ${row}, col ${colIndex}:`, e);
    return null;
  }
}

/**
 * Get column index by name for new sheet structure
 */
function getColumnByName(columnName) {
  const columns = {
    'DUNS': 1, 'OEM': 2, 'Parent': 3, 'Obligations': 4,
    'Small Business': 5, 'SUM Tier': 6, 'Sum Type': 7,
    'Contract Vehicle': 8, 'Funding Department': 9,
    'Discount': 10, 'Top Ref_PIID': 11, 'Top PIID': 12,
    'Active Contracts': 13, 'Discount Offerings': 14,
    'AI Product': 15, 'AI Category': 16, 'Top BIC Products': 17,
    'Reseller': 18, 'BIC Reseller': 19, 'BIC OEM': 20,
    'FAS OEM': 21, 'Funding Agency': 22,
    'BIC Top Products per Agency': 23, 'OneGov Tier': 24,
    'FAS Data Table': 25, 'FAS Table Update Timestamp': 26,
    'BIC Data Table': 27, 'BIC Table Update Timestamp': 28
  };
  return columns[columnName];
}

/**
 * Get top entities data for a specific column (CRITICAL FUNCTION)
 * Used by frontend Chart Buffet for chart generation
 * 
 * @param {string} entityType - Type of entity ('agency', 'oem', 'vendor')
 * @param {string} columnId - Column identifier ('obligations', 'smallBusiness', etc.)
 * @param {number} topN - Number of top entities to return (default: 10)
 * @returns {Array} Array of entities with processed data
 */
function getColumnFirstData(entityType, columnId, topN = 10) {
  console.log(` getColumnFirstData called: entityType=${entityType}, columnId=${columnId}, topN=${topN}`);
  
  try {
    // Get data with safe error handling
    let entities = [];
    try {
      const entitiesResponse = getEntities(entityType);
      if (entitiesResponse && entitiesResponse.success) {
        entities = JSON.parse(entitiesResponse.getContent()).data || [];
      }
    } catch (error) {
      console.error(' Error getting entities:', error);
      return [];
    }
    
    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      console.log(' No valid entities found for type:', entityType);
      return [];
    }
    
    console.log(`📊 Found ${entities.length} ${entityType} entities`);
    
    // Define column mappings
    const columnMap = {
      agency: {
        obligations: 'D',
        smallBusiness: 'E',
        sumTier: 'F',
        contractVehicle: 'H',
        fundingDepartment: 'I'
      },
      oem: {
        obligations: 'D',
        smallBusiness: 'E',
        sumTier: 'F',
        contractVehicle: 'H',
        fundingDepartment: 'I',
        aiProduct: 'O',
        topBicProducts: 'Q'
      },
      vendor: {
        obligations: 'D',
        smallBusiness: 'E',
        sumTier: 'F',
        contractVehicle: 'H',
        fundingDepartment: 'I'
      }
    };
    
    const column = columnMap[entityType]?.[columnId];
    if (!column) {
      console.log(` Column ${columnId} not found for ${entityType}`);
      return [];
    }
    
    // Process entities and extract column data
    const processedEntities = [];
    
    for (const entity of entities) {
      try {
        const columnData = entity[column];
        let value = 0;
        let fiscalYearData = {};
        
        if (columnData) {
          // Parse JSON data
          const parsed = JSON.parse(columnData);
          
          if (columnId === 'obligations' && parsed.total) {
            value = parsed.total;
            fiscalYearData = parsed.fiscal_years || parsed.yearly_totals || {};
          } else if (parsed.total) {
            value = parsed.total;
          }
        }
        
        processedEntities.push({
          name: entity.A || 'Unknown',
          value: value,
          fiscal_year_obligations: fiscalYearData,
          type: entityType,
          tier: entity.C || 'N/A'
        });
        
      } catch (parseError) {
        console.log(`⚠️ Error parsing data for entity ${entity.A}:`, parseError);
        processedEntities.push({
          name: entity.A || 'Unknown',
          value: 0,
          fiscal_year_obligations: {},
          type: entityType,
          tier: entity.C || 'N/A'
        });
      }
    }
    
    // Sort by value (descending) and take top N
    const topEntities = processedEntities
      .filter(entity => entity.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);
    
    // Ensure all returned data is serializable
    const serializedEntities = topEntities.map(entity => ({
      name: String(entity.name || ''),
      value: Number(entity.value || 0),
      fiscal_year_obligations: entity.fiscal_year_obligations || {},
      type: String(entity.type || ''),
      tier: String(entity.tier || '')
    }));
    
    console.log(` Returning ${serializedEntities.length} top ${entityType} entities for ${columnId}`);
    return ensureSerializable(serializedEntities);
    
  } catch (error) {
    console.error('🚨 ERROR in getColumnFirstData:', error);
    return [];
  }
}

/**
 * Wrapper to ensure all returned data is serializable
 * @param {*} data - Data to serialize
 * @returns {*} Serializable data
 */
function ensureSerializable(data) {
  try {
    // Convert to JSON and back to ensure it's serializable
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Serialization error:', error);
    return null;
  }
}

/**
 * Get report builder data with cards for each JSON column
 */
function getReportBuilderData() {
  console.log('REPORT BUILDER: getReportBuilderData called - starting execution');
  try {
    const SPREADSHEET_ID = '18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('REPORT BUILDER: Spreadsheet opened successfully');
    
    // Define JSON columns for each entity type
    const jsonColumns = {
      agency: [
        {id: 'obligations', name: 'Obligations', column: 'D'},
        {id: 'smallBusiness', name: 'Small Business', column: 'E'},
        {id: 'sumTier', name: 'SUM Tier', column: 'F'},
        {id: 'sumType', name: 'Sum Type', column: 'G'},
        {id: 'contractVehicle', name: 'Contract Vehicle', column: 'H'},
        {id: 'fundingDepartment', name: 'Funding Department', column: 'I'},
        {id: 'discount', name: 'Discount', column: 'J'}
      ],
      oem: [
        {id: 'obligations', name: 'Obligations', column: 'D'},
        {id: 'smallBusiness', name: 'Small Business', column: 'E'},
        {id: 'sumTier', name: 'SUM Tier', column: 'F'},
        {id: 'sumType', name: 'Sum Type', column: 'G'},
        {id: 'contractVehicle', name: 'Contract Vehicle', column: 'H'},
        {id: 'fundingDepartment', name: 'Funding Department', column: 'I'},
        {id: 'discount', name: 'Discount', column: 'J'},
        {id: 'discountOfferings', name: 'Discount Offerings', column: 'N'},
        {id: 'aiProduct', name: 'AI Product', column: 'O'},
        {id: 'topBicProducts', name: 'Top BIC Products', column: 'Q'},
        {id: 'reseller', name: 'Reseller', column: 'R'},
        {id: 'fundingAgency', name: 'Funding Agency', column: 'V'}
      ],
      vendor: [
        {id: 'obligations', name: 'Obligations', column: 'D'},
        {id: 'smallBusiness', name: 'Small Business', column: 'E'},
        {id: 'sumTier', name: 'SUM Tier', column: 'F'},
        {id: 'sumType', name: 'Sum Type', column: 'G'},
        {id: 'contractVehicle', name: 'Contract Vehicle', column: 'H'},
        {id: 'fundingDepartment', name: 'Funding Department', column: 'I'},
        {id: 'discount', name: 'Discount', column: 'J'},
        {id: 'discountOfferings', name: 'Discount Offerings', column: 'N'}
      ]
    };
    
    const cards = [];
    
    // Generate cards for each entity type
    for (const [entityType, columns] of Object.entries(jsonColumns)) {
      console.log(`REPORT BUILDER: Processing ${entityType} with ${columns.length} columns`);
      for (const columnInfo of columns) {
        console.log(`REPORT BUILDER: Generating cards for ${entityType} column ${columnInfo.column} (${columnInfo.name})`);
        
        // Generate KPI card
        try {
          const kpiCard = generateKPICard(spreadsheet, entityType, columnInfo);
          if (kpiCard) {
            console.log(`REPORT BUILDER: Successfully generated KPI card for ${entityType} ${columnInfo.column}`);
            cards.push(kpiCard);
          } else {
            console.log(`REPORT BUILDER: KPI card returned null for ${entityType} ${columnInfo.column}`);
          }
        } catch (error) {
          console.error(`REPORT BUILDER: Error generating KPI card for ${entityType} ${columnInfo.column}:`, error);
        }
        
        // Generate trend card
        try {
          const trendCard = generateTrendCard(spreadsheet, entityType, columnInfo);
          if (trendCard) {
            console.log(`REPORT BUILDER: Successfully generated trend card for ${entityType} ${columnInfo.column}`);
            cards.push(trendCard);
          } else {
            console.log(`REPORT BUILDER: Trend card returned null for ${entityType} ${columnInfo.column}`);
          }
        } catch (error) {
          console.error(`REPORT BUILDER: Error generating trend card for ${entityType} ${columnInfo.column}:`, error);
        }
      }
    }
    
    console.log('REPORT BUILDER: Generated', cards.length, 'cards total');
    
    // If no cards generated, create some simple test cards
    if (cards.length === 0) {
      console.log('REPORT BUILDER: No cards generated, creating test cards');
      cards.push({
        id: 'test_obligations',
        title: 'Test - Agency Obligations',
        category: 'agency',
        cardType: 'kpi',
        chartType: 'bar',
        chartData: {
          labels: ['FY24', 'FY25'],
          datasets: [{
            label: 'Obligations ($M)',
            data: [500, 300],
            backgroundColor: ['#144673', '#3a6ea5']
          }]
        },
        tableData: {
          headers: ['Fiscal Year', 'Obligations'],
          rows: [['FY24', '$500M'], ['FY25', '$300M']]
        }
      });
      
      cards.push({
        id: 'test_vendors',
        title: 'Test - Top Vendors',
        category: 'vendor',
        cardType: 'kpi', 
        chartType: 'pie',
        chartData: {
          labels: ['Vendor A', 'Vendor B', 'Others'],
          datasets: [{
            data: [40, 35, 25],
            backgroundColor: ['#144673', '#3a6ea5', '#f47920']
          }]
        },
        tableData: {
          headers: ['Vendor', 'Percentage'],
          rows: [['Vendor A', '40%'], ['Vendor B', '35%'], ['Others', '25%']]
        }
      });
      console.log('REPORT BUILDER: Created', cards.length, 'test cards');
    }
    
    return ensureSerializable(cards);
    
  } catch (error) {
    console.error('REPORT BUILDER ERROR:', error);
    console.error('REPORT BUILDER ERROR STACK:', error.stack);
    // Return a simple fallback card to test if the function is being called
    return [{
      id: 'test_card',
      title: 'Test Card - Backend Working',
      category: 'agency',
      cardType: 'kpi',
      chartType: 'bar',
      chartData: {
        labels: ['Test'],
        datasets: [{
          data: [100],
          backgroundColor: ['#144673']
        }]
      },
      tableData: {
        headers: ['Test'],
        rows: [['Working']]
      }
    }];
  }
}

/**
 * Get entity names for a specific entity type
 */
function getEntityNames(entityType) {
  console.log('BACKEND: getEntityNames called for:', entityType);
  
  try {
    const SPREADSHEET_ID = '18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Convert entity type to proper sheet name
    const entityTypeMap = {
      'agency': 'Agency',
      'oem': 'OEM', 
      'vendor': 'Vendor'
    };
    const sheetName = entityTypeMap[entityType.toLowerCase()] || entityType.charAt(0).toUpperCase() + entityType.slice(1);
    console.log('BACKEND: Sheet name:', sheetName);
    
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      console.log('BACKEND: Sheet not found:', sheetName);
      console.log('BACKEND: Available sheets:', spreadsheet.getSheets().map(s => s.getName()));
      return [];
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    console.log('BACKEND: Total rows:', values.length);
    
    if (values.length > 1) {
      console.log('BACKEND: Header row:', values[0]);
      console.log('BACKEND: Sample row 1:', values[1]);
      console.log('BACKEND: Sample row 2:', values[2] || 'No row 2');
    }
    
    const entityNames = new Set();
    const sampleNames = [];
    
    // Process data starting from row 2 (skip header)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const entityName = row[1]; // Column B is entity name
      
      if (entityName && entityName.trim() !== '') {
        const trimmedName = entityName.trim();
        entityNames.add(trimmedName);
        
        // Collect first 3 for debugging
        if (sampleNames.length < 3) {
          sampleNames.push(trimmedName);
        }
      }
    }
    
    console.log('BACKEND: Sample entity names found:', sampleNames);
    console.log('BACKEND: Total unique entity names found:', entityNames.size);
    
    // Convert to sorted array with value/label format
    const sortedNames = Array.from(entityNames)
      .sort()
      .map(name => ({
        value: name,
        label: name
      }));
      
    console.log(`BACKEND: Final unique count after processing: ${sortedNames.length}`);
    console.log('BACKEND: First 3 sorted names:', sortedNames.slice(0, 3));
    
    return sortedNames;
    
  } catch (error) {
    console.error('BACKEND: Error in getEntityNames:', error);
    return [];
  }
}

/**
 * Generate column-specific reports using Chart Buffet System
 */
function generateColumnReports(entityType, columnId, topN = 10, selectedEntities = []) {
  // Validate column exists for this entity type
  const validColumns = {
    agency: ['obligations', 'smallBusiness', 'sumTier', 'sumType', 'contractVehicle', 'fundingDepartment'],
    oem: ['obligations', 'smallBusiness', 'sumTier', 'aiProduct', 'reseller', 'contractVehicle'],
    vendor: ['obligations', 'smallBusiness', 'sumTier', 'contractVehicle']
  };
  
  if (!validColumns[entityType] || !validColumns[entityType].includes(columnId)) {
    console.error(`Column ${columnId} not available for ${entityType}`);
    return [];
  }
  
  // Use the new Chart Buffet system
  return generateColumnReportsBuffet(entityType, columnId, topN, selectedEntities);
}

/**
 * LEGACY: Generate column-specific reports using DataManager
 * Keeping for backward compatibility
 */
function generateColumnReportsLegacy(entityType, columnId, topN = 10, selectedEntities = []) {
  console.log('🔥 DataManager BACKEND: === generateColumnReports v520 ===');
  console.log('🔥 DataManager BACKEND: Using centralized data layer');
  console.log('🔥 DataManager BACKEND: Params:', {entityType, columnId, topN, selectedEntitiesCount: selectedEntities.length});
  
  try {
    // Get DataManager instance
    const dataManager = getDataManager();
    console.log('DataManager: Instance acquired');
    
    // Define available columns for each entity type
    const availableColumns = {
      agency: [
        {id: 'obligations', name: 'Obligations'},
        {id: 'smallBusiness', name: 'Small Business'},
        {id: 'sumTier', name: 'SUM Tier'},
        {id: 'contractVehicle', name: 'Contract Vehicle'}
      ],
      oem: [
        {id: 'obligations', name: 'Obligations'},
        {id: 'smallBusiness', name: 'Small Business'},
        {id: 'sumTier', name: 'SUM Tier'},
        {id: 'aiProduct', name: 'AI Product'},
        {id: 'reseller', name: 'Reseller'}
      ],
      vendor: [
        {id: 'obligations', name: 'Obligations'},
        {id: 'smallBusiness', name: 'Small Business'},
        {id: 'sumTier', name: 'SUM Tier'},
        {id: 'contractVehicle', name: 'Contract Vehicle'}
      ]
    };

    console.log('DataManager: Available columns for', entityType, ':', availableColumns[entityType]);
    
    const columnInfo = availableColumns[entityType]?.find(col => col.id === columnId);
    if (!columnInfo) {
      console.log(`DataManager ERROR: Column ${columnId} not found for ${entityType}`);
      return [];
    }

    console.log('DataManager: Found column info:', columnInfo);

    // Get entities using DataManager
    const options = {
      entityType: entityType,
      columnId: columnId,
      topN: topN,
      selectedEntities: selectedEntities
    };
    
    // Load entities for report building
    const reportEntities = dataManager.getEntitiesForView('reportBuilder', options);
    console.log(`DataManager: Loaded ${reportEntities.length} entities for report`);
    
    if (reportEntities.length === 0) {
      console.log('DataManager: No entities found, returning empty cards');
      return [];
    }

    // Generate cards for the specific column
    const cards = [];
    
    // Create trend card using DataManager's fiscal year data
    console.log('DataManager: Generating trend card...');
    let trendCard = null;
    try {
      const fiscalYearData = dataManager.getFiscalYearTrends(entityType, columnId, selectedEntities);
      if (Object.keys(fiscalYearData).length > 0) {
        const years = Object.keys(fiscalYearData).sort();
        const values = years.map(year => fiscalYearData[year]);
        
        trendCard = {
          id: `${entityType}_${columnInfo.id}_trend`,
          title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${columnInfo.name} - Fiscal Year Trends`,
          category: entityType,
          cardType: 'trend',
          columnId: columnInfo.id,
          chartType: 'line',
          chartData: {
            labels: years,
            datasets: [{
              label: columnInfo.name,
              data: values,
              borderColor: '#144673',
              backgroundColor: 'rgba(20, 70, 115, 0.1)',
              fill: true
            }]
          },
          tableData: {
            headers: ['Fiscal Year', 'Value'],
            rows: years.map(year => [year, formatCurrency(fiscalYearData[year])])
          },
          summary: {
            totalValue: values.reduce((sum, val) => sum + val, 0),
            avgValue: values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
            periodCount: years.length
          }
        };
        console.log('DataManager: Trend card created successfully');
      }
    } catch (error) {
      console.error('DataManager: Error creating trend card:', error);
    }
    
    if (trendCard) {
      cards.push(trendCard);
    }
    
    // Create KPI card using report entities
    console.log('DataManager: Generating KPI card...');
    const kpiCard = generateKPICardFromEntities(reportEntities, entityType, columnInfo, topN);
    if (kpiCard) {
      cards.push(kpiCard);
      console.log('DataManager: KPI card created successfully');
    }
    
    // Create distribution card from trend data
    console.log('DataManager: Generating distribution card...');
    if (trendCard) {
      const distributionCard = {
        ...trendCard,
        id: `${entityType}_${columnInfo.id}_distribution`,
        title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${columnInfo.name} - Distribution`,
        chartType: 'bar',
        cardType: 'distribution'
      };
      cards.push(distributionCard);
      console.log('DataManager: Distribution card created');
    }
    
    // Create summary card from KPI data
    console.log('DataManager: Generating summary card...');
    if (kpiCard) {
      const summaryCard = {
        ...kpiCard,
        id: `${entityType}_${columnInfo.id}_summary`,
        title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${columnInfo.name} - Summary`,
        cardType: 'summary'
      };
      cards.push(summaryCard);
      console.log('DataManager: Summary card created');
    }

    console.log(`DataManager: Generated ${cards.length} cards for ${entityType} ${columnId}`);
    
    // Add debug info
    const debugInfo = {
      functionCalled: 'generateColumnReports v520 (DataManager)',
      parameters: {entityType, columnId, topN, selectedEntitiesCount: selectedEntities.length},
      cardsGenerated: cards.length,
      entitiesProcessed: reportEntities.length,
      trendCardGenerated: !!trendCard,
      kpiCardGenerated: !!kpiCard,
      timestamp: new Date().toISOString(),
      dataSource: 'DataManager Cache'
    };
    
    // Add debug info to each card
    cards.forEach(card => {
      if (!card.debugInfo) card.debugInfo = {};
      card.debugInfo.generatedBy = 'generateColumnReports v520 (DataManager)';
      card.debugInfo.parameters = debugInfo.parameters;
      card.debugInfo.dataSource = 'Centralized Cache';
    });
    
    console.log('🔥 DataManager FINAL DEBUG INFO:', debugInfo);
    return ensureSerializable(cards);
    
  } catch (error) {
    console.error('DataManager ERROR in generateColumnReports:', error);
    return [];
  }
}

/**
 * Generate KPI card from pre-processed entities (DataManager version)
 */
function generateKPICardFromEntities(entities, entityType, columnInfo, topN = 10) {
  try {
    console.log(`DataManager KPI: Processing ${entities.length} entities for ${columnInfo.name}`);
    
    if (!entities || entities.length === 0) {
      console.log('DataManager KPI: No entities provided');
      return null;
    }
    
    // Extract values and create top entities list
    let totalValue = 0;
    const topEntities = entities
      .map(entity => ({
        name: entity.name,
        value: entity.value || 0
      }))
      .filter(e => e.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);
    
    totalValue = topEntities.reduce((sum, e) => sum + e.value, 0);
    
    console.log(`DataManager KPI: Created top ${topEntities.length} entities, total value: ${totalValue}`);
    
    const cardId = `${entityType}_${columnInfo.id}_kpi`;
    
    return {
      id: cardId,
      title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${columnInfo.name} - Market Overview`,
      category: entityType,
      cardType: 'kpi',
      columnId: columnInfo.id,
      chartType: 'doughnut',
      chartData: {
        labels: topEntities.map(e => e.name),
        datasets: [{
          data: topEntities.map(e => e.value),
          backgroundColor: ['#0a2240', '#144673', '#3a6ea5', '#f47920', '#ff6b35']
        }]
      },
      tableData: {
        headers: ['Entity', 'Value'],
        rows: topEntities.map(e => [e.name, formatCurrency(e.value)])
      },
      summary: {
        totalValue: totalValue,
        entityCount: topEntities.length,
        avgValue: topEntities.length > 0 ? totalValue / topEntities.length : 0,
        topEntity: topEntities[0]?.name || 'N/A'
      },
      metadata: {
        entityType: entityType,
        columnId: columnInfo.id,
        topN: topN,
        dataSource: 'DataManager'
      }
    };
    
  } catch (error) {
    console.error('DataManager KPI Error:', error);
    return null;
  }
}

/**
 * Generate KPI card for a JSON column
 */
function generateKPICard(spreadsheet, entityType, columnInfo, selectedEntities = [], topN = 10) {
  try {
    console.log('REPORT BUILDER: Generating KPI card for', entityType, columnInfo.name);
    
    // Convert entity type to proper sheet name
    const entityTypeMap = {
      'agency': 'Agency',
      'oem': 'OEM', 
      'vendor': 'Vendor'
    };
    const sheetName = entityTypeMap[entityType.toLowerCase()] || entityType.charAt(0).toUpperCase() + entityType.slice(1);
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      console.log('REPORT BUILDER: Sheet not found:', entityType.charAt(0).toUpperCase() + entityType.slice(1));
      return null;
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    const columnIndex = getColumnIndexFromLetter(columnInfo.column);
    
    let totalValue = 0;
    let entityCount = 0;
    let topEntities = [];
    
    // Process data starting from row 2 (skip header)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const entityName = row[1]; // Column B is entity name
      if (!entityName) continue;
      
      // Apply entity filter if specified
      if (selectedEntities.length > 0 && !selectedEntities.includes(entityName)) {
        continue;
      }
      
      entityCount++;
      
      // Parse JSON column data
      const jsonData = parseJSONColumn(row[columnIndex]);
      if (jsonData) {
        const value = extractNumericValue(jsonData);
        totalValue += value;
        
        if (value > 0) {
          topEntities.push({name: entityName, value: value});
        }
      }
    }
    
    // Sort and get top N entities based on user selection
    topEntities.sort((a, b) => b.value - a.value);
    
    // Debug: Log entity count info
    console.log(`KPI CARD DEBUG: Found ${topEntities.length} entities with valid data`);
    console.log(`KPI CARD DEBUG: Requested topN: ${topN}, will slice to: ${topN || 10}`);
    console.log(`KPI CARD DEBUG: Top entities:`, topEntities.slice(0, 15).map(e => ({name: e.name, value: e.value})));
    
    topEntities = topEntities.slice(0, topN || 10);
    
    const cardId = `${entityType}_${columnInfo.id}_kpi`;
    
    return {
      id: cardId,
      title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${columnInfo.name} - Market Overview`,
      category: entityType,
      cardType: 'kpi',
      columnId: columnInfo.id,
      chartType: 'doughnut',
      chartData: {
        labels: topEntities.map(e => e.name),
        datasets: [{
          data: topEntities.map(e => e.value),
          backgroundColor: ['#0a2240', '#144673', '#3a6ea5', '#f47920', '#ff6b35']
        }]
      },
      tableData: {
        headers: ['Rank', 'Entity Name', 'Value', '% of Total'],
        rows: topEntities.map((entity, index) => [
          index + 1,
          entity.name,
          formatCurrency(entity.value),
          ((entity.value / totalValue) * 100).toFixed(1) + '%'
        ])
      },
      kpiMetrics: {
        totalValue: totalValue,
        entityCount: entityCount,
        averageValue: totalValue / entityCount || 0,
        topEntity: topEntities[0]?.name || 'N/A'
      }
    };
    
  } catch (error) {
    console.error(`Error generating KPI card for ${entityType} ${columnInfo.name}:`, error);
    return null;
  }
}

/**
 * Generate trend card for a JSON column
 */
function generateTrendCard(spreadsheet, entityType, columnInfo, selectedEntities = []) {
  console.log('🚨 BACKEND TREND: === FUNCTION START - ENTRY POINT HIT ===');
  console.log('🚨 BACKEND TREND: Function called successfully!');
  console.log('🚨 BACKEND TREND: Called with entityType:', entityType);
  console.log('🚨 BACKEND TREND: Called with columnInfo:', columnInfo);
  console.log('🚨 BACKEND TREND: Called with selectedEntities:', selectedEntities);
  console.log('🚨 BACKEND TREND: spreadsheet object exists:', !!spreadsheet);
  
  try {
    // Convert entity type to proper sheet name
    const entityTypeMap = {
      'agency': 'Agency',
      'oem': 'OEM', 
      'vendor': 'Vendor'
    };
    const sheetName = entityTypeMap[entityType.toLowerCase()] || entityType.charAt(0).toUpperCase() + entityType.slice(1);
    console.log('BACKEND TREND: Attempting to access sheet:', sheetName);
    
    const sheet = spreadsheet.getSheetByName(sheetName);
    console.log('BACKEND TREND: Sheet found?', !!sheet);
    
    if (!sheet) {
      console.log('BACKEND TREND: ERROR - Sheet not found, returning null');
      return null;
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    const columnIndex = getColumnIndexFromLetter(columnInfo.column);
    
    // Aggregate fiscal year data
    const fiscalYearData = {};
    
    console.log('BACKEND TREND: Column ID:', columnInfo.id);
    console.log('BACKEND TREND: Column letter:', columnInfo.column);
    console.log('BACKEND TREND: Column index:', columnIndex);
    console.log('BACKEND TREND: Total rows:', values.length);
    console.log('BACKEND TREND: First 3 rows sample:', values.slice(0, 3));
    console.log('BACKEND: Generating trend card for entities:', selectedEntities.length > 0 ? selectedEntities : 'ALL ENTITIES');
    
    let totalRowsProcessed = 0;
    let filteredRows = 0;
    let jsonParseSuccesses = 0;
    let fiscalYearFoundCount = 0;
    
    // Process data starting from row 2 (skip header)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const entityName = row[1]; // Column B is entity name
      if (!entityName) continue;
      
      totalRowsProcessed++;
      
      // Apply entity filter if specified
      if (selectedEntities.length > 0 && !selectedEntities.includes(entityName)) {
        continue;
      }
      
      filteredRows++;
      
      // Debug the raw column data
      if (filteredRows <= 3) {
        console.log(`BACKEND TREND: Row ${i} entity "${entityName}" raw column data:`, row[columnIndex]);
      }
      
      // Parse JSON column data
      const jsonData = parseJSONColumn(row[columnIndex]);
      
      if (jsonData) {
        jsonParseSuccesses++;
        if (filteredRows <= 3) {
          console.log(`BACKEND TREND: Row ${i} parsed JSON:`, jsonData);
          console.log(`BACKEND TREND: Row ${i} JSON keys:`, Object.keys(jsonData));
          console.log(`BACKEND TREND: Row ${i} has fiscal_year_breakdown?`, !!jsonData.fiscal_year_breakdown);
        }
      }
      if (jsonData && (jsonData.fiscal_year_obligations || jsonData.fiscal_year_breakdown || jsonData.fiscal_years || jsonData.yearly_totals)) {
        const fyData = jsonData.fiscal_year_obligations || jsonData.fiscal_year_breakdown || jsonData.fiscal_years || jsonData.yearly_totals;
        fiscalYearFoundCount++;
        if (fiscalYearFoundCount <= 3) {
          console.log(`BACKEND TREND: Row ${i} fiscal year data:`, fyData);
        }
        for (const [fy, value] of Object.entries(fyData)) {
          if (!fiscalYearData[fy]) fiscalYearData[fy] = 0;
          fiscalYearData[fy] += parseFloat(value) || 0;
        }
      }
    }
    
    // Sort fiscal years and prepare chart data
    const sortedFYs = Object.keys(fiscalYearData).sort();
    const chartLabels = sortedFYs;
    const chartValues = sortedFYs.map(fy => fiscalYearData[fy]);
    
    const cardId = `${entityType}_${columnInfo.id}_trend`;
    
    const result = {
      id: cardId,
      title: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${columnInfo.name} - Fiscal Year Trends`,
      category: entityType,
      cardType: 'trend',
      columnId: columnInfo.id,
      chartType: 'line',
      chartData: {
        labels: chartLabels,
        datasets: [{
          label: columnInfo.name,
          data: chartValues,
          borderColor: '#144673',
          backgroundColor: 'rgba(20, 70, 115, 0.1)',
          tension: 0.4
        }]
      },
      tableData: {
        headers: ['Fiscal Year', 'Total Value', 'YoY Change', '% Change'],
        rows: chartLabels.map((fy, index) => {
          const currentValue = chartValues[index];
          const previousValue = index > 0 ? chartValues[index - 1] : null;
          const change = previousValue ? currentValue - previousValue : null;
          const percentChange = previousValue ? ((change / previousValue) * 100).toFixed(1) + '%' : '--';
          
          return [
            fy,
            formatCurrency(currentValue),
            change ? (change >= 0 ? '+' : '') + formatCurrency(change) : '--',
            percentChange
          ];
        })
      }
    };
    
    console.log(`BACKEND TREND: Rows processed: ${totalRowsProcessed}, Filtered rows: ${filteredRows}`);
    console.log(`BACKEND TREND: JSON parse successes: ${jsonParseSuccesses}, Fiscal year found: ${fiscalYearFoundCount}`);
    console.log('BACKEND TREND: Final fiscalYearData:', fiscalYearData);
    console.log('BACKEND: Final tableData rows:', result.tableData.rows.length);
    console.log('BACKEND: Final chartData labels:', result.chartData.labels);
    console.log('BACKEND: Final chartData values:', result.chartData.datasets[0].data);
    
    return result;
    
  } catch (error) {
    console.error('BACKEND TREND: === ERROR CAUGHT ===');
    console.error(`BACKEND TREND: Error generating trend card for ${entityType} ${columnInfo.name}:`, error);
    console.error('BACKEND TREND: Error stack:', error.stack);
    return null;
  }
}

/**
 * Helper function to get column index from letter (A=0, B=1, etc.)
 */
function getColumnIndexFromLetter(letter) {
  return letter.charCodeAt(0) - 65;
}

/**
 * Helper function to extract numeric value from JSON data
 */
function extractNumericValue(jsonData) {
  if (typeof jsonData === 'number') return jsonData;
  if (jsonData.total_obligated) return parseFloat(jsonData.total_obligated) || 0;
  if (jsonData.total_obligations) return parseFloat(jsonData.total_obligations) || 0;
  if (jsonData.total) return parseFloat(jsonData.total) || 0;
  if (jsonData.sum) return parseFloat(jsonData.sum) || 0;
  
  // Sum fiscal year breakdown if available
  if (jsonData.fiscal_year_breakdown) {
    return Object.values(jsonData.fiscal_year_breakdown)
      .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }
  
  return 0;
}

/**
 * Helper function to format currency
 */
function formatCurrency(value) {
  if (value >= 1000000000) {
    return '$' + (value / 1000000000).toFixed(1) + 'B';
  } else if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'K';
  } else {
    return '$' + value.toFixed(0);
  }
}

/**
 * Get filter options for report builder
 */
function getReportBuilderFilters(entityType = null) {
  try {
    const SPREADSHEET_ID = '18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    const entities = new Set();
    const parents = new Set();
    
    // Process specific entity type or all types
    const entityTypes = entityType ? 
      [entityType.charAt(0).toUpperCase() + entityType.slice(1)] : 
      ['Agency', 'OEM', 'Vendor'];
      
    entityTypes.forEach(sheetName => {
      try {
        const sheet = spreadsheet.getSheetByName(sheetName);
        if (!sheet) return;
        
        const range = sheet.getDataRange();
        const values = range.getValues();
        
        // Process data starting from row 2 (skip header)
        for (let i = 1; i < values.length; i++) {
          const row = values[i];
          const entityName = row[1]; // Column B is entity name
          const parentName = row[2]; // Column C is parent/department
          
          if (entityName && entityName.trim() !== '') {
            entities.add(entityName.trim());
          }
          
          if (parentName && parentName.trim() !== '') {
            parents.add(parentName.trim());
          }
        }
      } catch (error) {
        console.error(`Error processing ${sheetName} sheet for filters:`, error);
      }
    });
    
    return {
      entities: Array.from(entities).sort(),
      parents: Array.from(parents).sort()
    };
    
  } catch (error) {
    console.error('Error in getReportBuilderFilters:', error);
    return {
      entities: [],
      parents: []
    };
  }
}

/**
 * Get filtered report builder data
 */
function getFilteredReportBuilderData(entityFilter, parentFilter) {
  try {
    const allCards = getReportBuilderData();
    
    if (!entityFilter && !parentFilter) {
      return allCards;
    }
    
    const SPREADSHEET_ID = '18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Generate filtered cards for each entity type
    const filteredCards = [];
    
    for (const card of allCards) {
      if (card.category && (entityFilter || parentFilter)) {
        const filteredCard = generateFilteredCard(spreadsheet, card, entityFilter, parentFilter);
        if (filteredCard) {
          filteredCards.push(filteredCard);
        }
      } else {
        filteredCards.push(card);
      }
    }
    
    return filteredCards;
    
  } catch (error) {
    console.error('Error in getFilteredReportBuilderData:', error);
    return getReportBuilderData(); // Fallback to unfiltered data
  }
}

/**
 * Generate filtered card with specific entity/parent data
 */
function generateFilteredCard(spreadsheet, originalCard, entityFilter, parentFilter) {
  try {
    const sheet = spreadsheet.getSheetByName(originalCard.category.charAt(0).toUpperCase() + originalCard.category.slice(1));
    if (!sheet) return originalCard;
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    const columnIndex = getColumnIndexFromLetter(getColumnLetterFromId(originalCard.columnId));
    
    let filteredData = [];
    
    // Process data starting from row 2 (skip header)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const entityName = row[1]; // Column B is entity name
      const parentName = row[2]; // Column C is parent/department
      
      if (!entityName) continue;
      
      // Apply filters
      if (entityFilter && entityName !== entityFilter) continue;
      if (parentFilter && parentName !== parentFilter) continue;
      
      filteredData.push({
        name: entityName,
        parent: parentName,
        jsonData: parseJSONColumn(row[columnIndex])
      });
    }
    
    if (filteredData.length === 0) return null;
    
    // Regenerate card with filtered data
    if (originalCard.cardType === 'kpi') {
      return regenerateKPICardWithData(originalCard, filteredData);
    } else {
      return regenerateTrendCardWithData(originalCard, filteredData);
    }
    
  } catch (error) {
    console.error('Error generating filtered card:', error);
    return originalCard;
  }
}

/**
 * Helper function to get column letter from column ID
 */
function getColumnLetterFromId(columnId) {
  const columnMap = {
    'obligations': 'D',
    'smallBusiness': 'E',
    'sumTier': 'F',
    'sumType': 'G',
    'contractVehicle': 'H',
    'fundingDepartment': 'I',
    'discount': 'J',
    'discountOfferings': 'N',
    'aiProduct': 'O',
    'topBicProducts': 'Q',
    'reseller': 'R',
    'fundingAgency': 'V'
  };
  return columnMap[columnId] || 'D';
}

/**
 * Regenerate KPI card with filtered data
 */
function regenerateKPICardWithData(originalCard, filteredData) {
  let totalValue = 0;
  let topEntities = [];
  
  for (const item of filteredData) {
    if (item.jsonData) {
      const value = extractNumericValue(item.jsonData);
      totalValue += value;
      
      if (value > 0) {
        topEntities.push({name: item.name, value: value});
      }
    }
  }
  
  topEntities.sort((a, b) => b.value - a.value);
  topEntities = topEntities.slice(0, 5);
  
  return {
    ...originalCard,
    chartData: {
      ...originalCard.chartData,
      labels: topEntities.map(e => e.name),
      datasets: [{
        ...originalCard.chartData.datasets[0],
        data: topEntities.map(e => e.value)
      }]
    },
    tableData: {
      ...originalCard.tableData,
      rows: topEntities.map((entity, index) => [
        index + 1,
        entity.name,
        formatCurrency(entity.value),
        ((entity.value / totalValue) * 100).toFixed(1) + '%'
      ])
    },
    kpiMetrics: {
      totalValue: totalValue,
      entityCount: filteredData.length,
      averageValue: totalValue / filteredData.length || 0,
      topEntity: topEntities[0]?.name || 'N/A'
    }
  };
}

/**
 * Regenerate trend card with filtered data
 */
function regenerateTrendCardWithData(originalCard, filteredData) {
  const fiscalYearData = {};
  
  for (const item of filteredData) {
    if (item.jsonData && item.jsonData.fiscal_year_breakdown) {
      for (const [fy, value] of Object.entries(item.jsonData.fiscal_year_breakdown)) {
        if (!fiscalYearData[fy]) fiscalYearData[fy] = 0;
        fiscalYearData[fy] += parseFloat(value) || 0;
      }
    }
  }
  
  const sortedFYs = Object.keys(fiscalYearData).sort();
  const chartValues = sortedFYs.map(fy => fiscalYearData[fy]);
  
  return {
    ...originalCard,
    chartData: {
      ...originalCard.chartData,
      labels: sortedFYs,
      datasets: [{
        ...originalCard.chartData.datasets[0],
        data: chartValues
      }]
    },
    tableData: {
      ...originalCard.tableData,
      rows: sortedFYs.map((fy, index) => {
        const currentValue = chartValues[index];
        const previousValue = index > 0 ? chartValues[index - 1] : null;
        const change = previousValue ? currentValue - previousValue : null;
        const percentChange = previousValue ? ((change / previousValue) * 100).toFixed(1) + '%' : '--';
        
        return [
          fy,
          formatCurrency(currentValue),
          change ? (change >= 0 ? '+' : '') + formatCurrency(change) : '--',
          percentChange
        ];
      })
    }
  };
}

// ============================================================================
// R02 INTEGRATION - ENHANCED REPORT BUILDER FUNCTIONS
// ============================================================================

/**
 * Get R02 Chart Buffet Specifications
 * Returns the specification structure from R02 reference file
 */
function getR02ChartBuffetSpecs() {
  try {
    // For now, return a subset of the most important cards
    // In production, this would parse the full R02 file
    return {
      obligations: {
        columnInfo: {
          column: 'D',
          columnIndex: 3,
          headerName: 'Obligations',
          dataSource: 'FAS'
        },
        cards: [
          {
            cardId: 'D-1',
            cardTitle: 'Obligations Trend by Fiscal Year',
            cardDescription: 'Year-over-year obligation trends',
            chart: {
              type: 'line',
              title: 'Federal Obligations by Fiscal Year',
              dataMapping: {
                source: 'fiscal_year_obligations',
                xAxis: { field: 'keys', label: 'Fiscal Year', format: 'FY{value}' },
                yAxis: { field: 'values', label: 'Obligations ($)', format: 'currency' }
              }
            },
            table: {
              title: 'Obligations by Fiscal Year',
              columns: [
                { header: 'Fiscal Year', field: 'year', format: 'FY{value}' },
                { header: 'Obligations', field: 'amount', format: 'currency' },
                { header: 'YoY Change', field: 'yoyChange', format: 'percentage' }
              ]
            }
          },
          {
            cardId: 'D-2',
            cardTitle: 'Quarterly Obligations Breakdown',
            cardDescription: 'Current year quarterly spending patterns',
            chart: {
              type: 'bar',
              title: 'FY2025 Obligations by Quarter',
              dataMapping: {
                source: 'quarterly_breakdown',
                xAxis: { field: 'quarter', label: 'Quarter' },
                yAxis: { field: 'amount', label: 'Obligations ($)', format: 'currency' }
              }
            }
          }
        ]
      },
      smallBusiness: {
        columnInfo: {
          column: 'E',
          columnIndex: 4,
          headerName: 'Small Business',
          dataSource: 'FAS'
        },
        cards: [
          {
            cardId: 'E-1',
            cardTitle: 'Small Business vs Total Spending',
            cardDescription: 'Small business contracting performance',
            chart: {
              type: 'pie',
              title: 'Small Business Share',
              dataMapping: {
                source: 'small_business_breakdown',
                categories: ['Small Business', 'Other'],
                values: 'totals'
              }
            }
          }
        ]
      },
      sumTier: {
        columnInfo: {
          column: 'F',
          columnIndex: 5,
          headerName: 'SUM Tier',
          dataSource: 'FAS'
        },
        cards: [
          {
            cardId: 'F-1',
            cardTitle: 'Government Tier Distribution',
            cardDescription: 'Distribution across government tiers',
            chart: {
              type: 'bar',
              title: 'Tier Performance',
              dataMapping: {
                source: 'tier_summaries',
                xAxis: { field: 'tier', label: 'Tier' },
                yAxis: { field: 'total', label: 'Amount ($)', format: 'currency' }
              }
            }
          }
        ]
      }
    };
  } catch (error) {
    console.error('Error getting R02 specs:', error);
    return {};
  }
}

/**
 * Enhanced Report Builder Data - Integrates R02 specifications
 */
function getEnhancedReportBuilderData(entityFilter = '', parentFilter = '', columnFilter = '') {
  try {
    console.log('ENHANCED REPORT BUILDER: Getting data with filters', {
      entityFilter, parentFilter, columnFilter
    });
    
    // Use simple DataManager from B05 (replacement for disabled B02)
    console.log('ENHANCED REPORT BUILDER: Using B05 Simple DataManager replacement');
    try {
      const dataManager = getDataManager();
      console.log('ENHANCED REPORT BUILDER: DataManager created successfully');
      
      // For now, still fall back to original data since R02 specs might also have dependencies
      return getReportBuilderData();
      
    } catch (error) {
      console.log('ENHANCED REPORT BUILDER: DataManager error, falling back to original data:', error);
      return getReportBuilderData();
    }
    
    // Commented out until B02 is reactivated:
    // const dataManager = getDataManager();
    // const r02Specs = getR02ChartBuffetSpecs();
    const enhancedCards = [];
    
    // Process each column specification from R02
    console.log(`ENHANCED REPORT BUILDER: Processing R02 specs with ${Object.keys(r02Specs).length} column types`);
    Object.entries(r02Specs).forEach(([columnKey, columnSpec]) => {
      console.log(`ENHANCED REPORT BUILDER: Processing column ${columnKey} (${columnSpec.columnInfo.column}) with ${columnSpec.cards.length} cards`);
      
      // Skip if column filter is set and doesn't match
      if (columnFilter && columnFilter !== columnSpec.columnInfo.column) {
        console.log(`ENHANCED REPORT BUILDER: Skipping column ${columnSpec.columnInfo.column} due to filter ${columnFilter}`);
        return;
      }
      
      // Process each card in this column
      columnSpec.cards.forEach(cardSpec => {
        try {
          console.log(`ENHANCED REPORT BUILDER: Generating card ${cardSpec.cardId} - ${cardSpec.cardTitle}`);
          const card = generateCardFromSpec(cardSpec, columnSpec, dataManager, entityFilter, parentFilter);
          if (card) {
            console.log(`ENHANCED REPORT BUILDER: Successfully generated card ${cardSpec.cardId}`);
            enhancedCards.push(card);
          } else {
            console.log(`ENHANCED REPORT BUILDER: Card generation returned null for ${cardSpec.cardId}`);
          }
        } catch (cardError) {
          console.error(`ENHANCED REPORT BUILDER: Error generating card ${cardSpec.cardId}:`, cardError);
        }
      });
    });
    
    console.log(`ENHANCED REPORT BUILDER: Generated ${enhancedCards.length} cards from R02 specs`);
    
    // If no cards generated from R02 specs, fall back to original function
    if (enhancedCards.length === 0) {
      console.log('ENHANCED REPORT BUILDER: No cards from R02, falling back to original getReportBuilderData()');
      return getReportBuilderData();
    }
    
    return enhancedCards;
    
  } catch (error) {
    console.error('Error in getEnhancedReportBuilderData:', error);
    // Fallback to original function
    console.log('ENHANCED REPORT BUILDER: Error occurred, falling back to original getReportBuilderData()');
    return getReportBuilderData();
  }
}

/**
 * Generate a card from R02 specification
 */
function generateCardFromSpec(cardSpec, columnSpec, dataManager, entityFilter, parentFilter) {
  try {
    // Get sample data - in production this would query actual data
    const sampleData = getSampleDataForCard(cardSpec, columnSpec);
    
    // Apply filters if specified
    let filteredData = sampleData;
    if (entityFilter || parentFilter) {
      filteredData = applyFiltersToCardData(sampleData, entityFilter, parentFilter);
    }
    
    return {
      id: cardSpec.cardId,
      title: cardSpec.cardTitle,
      description: cardSpec.cardDescription,
      category: getCardCategory(columnSpec.columnInfo.column),
      columnId: columnSpec.columnInfo.column,
      chartType: cardSpec.chart.type,
      chartData: transformToChartData(filteredData, cardSpec.chart),
      tableData: transformToTableData(filteredData, cardSpec.table || cardSpec.chart),
      entityFilter: entityFilter,
      parentFilter: parentFilter
    };
    
  } catch (error) {
    console.error(`Error generating card from spec ${cardSpec.cardId}:`, error);
    return null;
  }
}

/**
 * Get sample data for a card (placeholder - would query real data in production)
 */
function getSampleDataForCard(cardSpec, columnSpec) {
  const cardId = cardSpec.cardId;
  
  // Sample data based on card type
  switch (cardId) {
    case 'D-1': // Obligations trend
      return {
        fiscal_year_obligations: {
          '2022': 286000000,
          '2023': 358000000,
          '2024': 598000000,
          '2025': 258000000
        }
      };
    
    case 'D-2': // Quarterly breakdown
      return {
        quarterly_breakdown: [
          { quarter: 'Q1', amount: 64500000 },
          { quarter: 'Q2', amount: 58200000 },
          { quarter: 'Q3', amount: 72100000 },
          { quarter: 'Q4', amount: 63200000 }
        ]
      };
    
    case 'E-1': // Small business
      return {
        small_business_breakdown: {
          'Small Business': 1003000000,
          'Other': 496000000
        }
      };
    
    case 'F-1': // Tier distribution
      return {
        tier_summaries: {
          'BIC': 831000000,
          'Tier 2': 527000000,
          'Tier 1': 75000000,
          'Tier 0': 65000000
        }
      };
    
    default:
      return {};
  }
}

/**
 * Transform data to Chart.js format
 */
function transformToChartData(data, chartSpec) {
  try {
    const mapping = chartSpec.dataMapping;
    const source = data[mapping.source];
    
    if (!source) return null;
    
    if (Array.isArray(source)) {
      // Array data (like quarterly breakdown)
      return {
        labels: source.map(item => item[mapping.xAxis.field]),
        datasets: [{
          label: mapping.yAxis.label,
          data: source.map(item => item[mapping.yAxis.field]),
          backgroundColor: getChartColors(source.length)
        }]
      };
    } else if (typeof source === 'object') {
      // Object data (like fiscal year obligations)
      return {
        labels: Object.keys(source).map(key => 
          mapping.xAxis.format ? mapping.xAxis.format.replace('{value}', key) : key
        ),
        datasets: [{
          label: mapping.yAxis.label,
          data: Object.values(source),
          backgroundColor: getChartColors(Object.keys(source).length),
          borderColor: chartSpec.type === 'line' ? '#144673' : undefined,
          tension: chartSpec.type === 'line' ? 0.4 : undefined
        }]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error transforming chart data:', error);
    return null;
  }
}

/**
 * Transform data to table format
 */
function transformToTableData(data, tableSpec) {
  try {
    if (!tableSpec || !tableSpec.columns) {
      // Fallback: create simple table from data
      return createFallbackTableData(data);
    }
    
    const headers = tableSpec.columns.map(col => col.header);
    const rows = [];
    
    // This is a simplified version - would need more complex logic for real data
    if (data.fiscal_year_obligations) {
      Object.entries(data.fiscal_year_obligations).forEach(([year, amount], index, arr) => {
        const prevAmount = index > 0 ? arr[index - 1][1] : null;
        const change = prevAmount ? ((amount - prevAmount) / prevAmount * 100) : null;
        
        rows.push([
          `FY${year}`,
          formatCurrency(amount),
          change ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` : '--'
        ]);
      });
    }
    
    return { headers, rows };
    
  } catch (error) {
    console.error('Error transforming table data:', error);
    return createFallbackTableData(data);
  }
}

/**
 * Create fallback table data when specs are incomplete
 */
function createFallbackTableData(data) {
  const headers = ['Category', 'Value'];
  const rows = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'number') {
      rows.push([cleanLabel(key), formatCurrency(value)]);
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (typeof subValue === 'number') {
          rows.push([`${cleanLabel(key)} - ${cleanLabel(subKey)}`, formatCurrency(subValue)]);
        }
      });
    }
  });
  
  return { headers, rows };
}

/**
 * Get available columns for filtering
 */
function getAvailableColumnsForFilter() {
  const r02Specs = getR02ChartBuffetSpecs();
  return Object.values(r02Specs).map(spec => ({
    id: spec.columnInfo.column,
    name: spec.columnInfo.headerName,
    description: `Column ${spec.columnInfo.column} - ${spec.columnInfo.headerName}`
  }));
}

/**
 * Get enhanced filter options including columns
 */
function getEnhancedReportBuilderFilters() {
  try {
    console.log('ENHANCED REPORT BUILDER: Getting enhanced filters (B02 disabled, using fallback)');
    const baseFilters = getReportBuilderFilters();
    
    // Simple column list since getAvailableColumnsForFilter requires DataManager
    const basicColumns = [
      {id: 'D', name: 'Obligations'},
      {id: 'E', name: 'Small Business'},
      {id: 'F', name: 'SUM Tier'},
      {id: 'G', name: 'Sum Type'},
      {id: 'H', name: 'Contract Vehicle'},
      {id: 'I', name: 'Funding Department'},
      {id: 'J', name: 'Discount'}
    ];
    
    return {
      ...baseFilters,
      columns: basicColumns
    };
  } catch (error) {
    console.error('Error getting enhanced filters:', error);
    return getReportBuilderFilters();
  }
}

// Helper functions for R02 integration
function getCardCategory(columnLetter) {
  const categoryMap = {
    'D': 'financial',
    'E': 'smallbusiness', 
    'F': 'tier',
    'G': 'type',
    'H': 'vehicle',
    'I': 'department',
    'K': 'contracts',
    'L': 'contracts',
    'M': 'contracts',
    'O': 'ai',
    'P': 'ai',
    'Q': 'products',
    'R': 'vendors',
    'S': 'vendors',
    'T': 'vendors',
    'U': 'vendors',
    'V': 'agencies',
    'W': 'agencies',
    'X': 'tier'
  };
  return categoryMap[columnLetter] || 'other';
}

function applyFiltersToCardData(data, entityFilter, parentFilter) {
  // Simplified filtering - would be more complex in production
  if (entityFilter || parentFilter) {
    // Apply scaling factor based on filter (simplified approach)
    const scaleFactor = Math.random() * 0.3 + 0.7; // 70-100% of original data
    
    const filteredData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        filteredData[key] = {};
        Object.entries(value).forEach(([subKey, subValue]) => {
          filteredData[key][subKey] = typeof subValue === 'number' 
            ? Math.round(subValue * scaleFactor) 
            : subValue;
        });
      } else {
        filteredData[key] = typeof value === 'number' 
          ? Math.round(value * scaleFactor)
          : value;
      }
    });
    
    return filteredData;
  }
  
  return data;
}

function getChartColors(count) {
  const colors = [
    '#0a2240', '#144673', '#3a6ea5', '#f47920', '#ff6b35',
    '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
  ];
  return colors.slice(0, count);
}

function cleanLabel(str) {
  return str.replace(/([A-Z])/g, ' $1')
           .replace(/^./, s => s.toUpperCase())
           .trim();
}

/* ARCHIVED - Duplicate getTableEntities function
 * REPLACED BY: B02_dataManager.js getEntities() method
 * This entire function duplicates B02's loadEntitySheet functionality
 *
function getTableEntities(entityType = 'OEM') {
  try {
    const SPREADSHEET_ID = '18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Map entity types to sheet names
    const sheetNames = {
      'oem': 'OEM',
      'agency': 'Agency', 
      'vendor': 'Vendor'
    };
    
    const sheetName = sheetNames[entityType.toLowerCase()] || entityType;
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error(`${sheetName} sheet not found`);
    }
    
    // Get data range including Y and AA columns (35 columns: A-AI)
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(1, 1, lastRow, 35); // 35 columns: A(1) to AI(35) to include Y and AA
    const values = range.getValues();
    console.log(` VERSION 124 ${sheetName}: Reading ${lastRow} rows x 35 columns (A-AI)`);
    
    const entities = [];
    
    // Process each row (skip header)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      // Column B (index 1) is entity name
      const name = row[1];
      if (!name || name.trim() === '') continue;
      
      const entity = {
        id: `${entityType.toLowerCase()}_${i}`,
        name: name,
        type: entityType.toLowerCase()
      };
      
      // Set entity-specific identifier column
      if (entityType.toLowerCase() === 'agency') {
        entity.agencyCode = row[0]; // Column A
        entity.department = row[2]; // Column C
      } else if (entityType.toLowerCase() === 'vendor') {
        entity.uei = row[0]; // Column A  
        entity.parentCompany = row[2]; // Column C
      } else {
        entity.duns = row[0]; // Column A (OEM)
        entity.parentCompany = row[2]; // Column C
      }
      
      // Parse Obligations (Column D)
      const obligations = parseJSONColumn(row[3]);
      if (obligations) {
        entity.obligations = obligations;
        // Extract total
        if (obligations.summary?.total_obligations) {
          entity.totalObligations = obligations.summary.total_obligations;
        } else if (obligations.total_obligated) {
          entity.totalObligations = obligations.total_obligated;
        } else if (obligations.fiscal_year_breakdown) {
          // Sum up fiscal years
          let total = 0;
          for (const year in obligations.fiscal_year_breakdown) {
            const yearData = obligations.fiscal_year_breakdown[year];
            if (yearData.obligations) total += yearData.obligations;
          }
          entity.totalObligations = total;
        }
      }
      
      // Parse Small Business (Column E)
      const smallBusiness = parseJSONColumn(row[4]);
      if (smallBusiness) {
        entity.smallBusiness = smallBusiness;
        // Extract small business percentage
        if (smallBusiness.business_size_summaries?.['SMALL BUSINESS']) {
          entity.smallBusinessPercentage = smallBusiness.business_size_summaries['SMALL BUSINESS'].percentage_of_total;
        }
      }
      
      // Parse OneGov Tier (Column X)
      const oneGovTier = parseJSONColumn(row[23]);
      if (oneGovTier) {
        entity.oneGovTier = oneGovTier;
        entity.tier = oneGovTier.mode_tier || oneGovTier.overall_tier;
        if (!entity.totalObligations && oneGovTier.total_obligated) {
          entity.totalObligations = oneGovTier.total_obligated;
        }
      }
      
      // Parse Contract Vehicle (Column H)
      const contractVehicle = parseJSONColumn(row[7]);
      if (contractVehicle) {
        entity.contractVehicle = contractVehicle;
        // Count top contracts
        if (contractVehicle.top_contract_summaries) {
          entity.contractVehicleCount = Object.keys(contractVehicle.top_contract_summaries).length;
        }
      }
      
      // Parse AI Product (Column O)
      const aiProduct = parseJSONColumn(row[14]);
      if (aiProduct) {
        entity.aiProduct = aiProduct;
        entity.hasAIProducts = aiProduct.ai_product_status === 'Active AI Products';
        entity.aiProductCount = aiProduct.unique_products || 0;
      }
      
      // Parse Discount (Column J)
      const discount = parseJSONColumn(row[9]);
      if (discount) {
        entity.discount = discount;
        entity.hasDiscounts = discount.discount_status === 'Active Discounts';
      }
      
      // Parse Reseller (Column R)
      const reseller = parseJSONColumn(row[17]);
      if (reseller) {
        entity.reseller = reseller;
        if (reseller.top_15_reseller_summaries) {
          entity.topResellers = Object.keys(reseller.top_15_reseller_summaries).slice(0, 5);
        }
      }
      
      // Add timestamps
      entity.fasTimestamp = row[25]; // Column Z
      entity.bicTimestamp = row[27]; // Column AB
      
      // Add FAS/BIC table URLs - Columns Y (24) and AA (26) - NO FILTERING
      const fasUrl = row[24]; // Column Y 
      const bicUrl = row[26]; // Column AA
      
      console.log(`📊 V47 ${sheetName} "${name}": Y[24]="${fasUrl}", AA[26]="${bicUrl}"`);
      
      // Accept URLs but filter out "None" text values
      const fasClean = fasUrl ? fasUrl.toString().trim() : '';
      const bicClean = bicUrl ? bicUrl.toString().trim() : '';
      
      console.log(` V47 ${sheetName} "${name}" BEFORE filtering: fasClean="${fasClean}", bicClean="${bicClean}"`);
      console.log(` V47 ${sheetName} "${name}" fasClean.toLowerCase()="${fasClean.toLowerCase()}", equals 'none'? ${fasClean.toLowerCase() === 'none'}`);
      
      // Use the EXACT working filtering logic from B05_simpleCompatible.js
      entity.fasTableUrl = fasUrl && fasUrl.trim() && fasUrl.trim().toLowerCase() !== 'none' && fasUrl.trim() !== 'N/A' ? fasUrl.trim() : '';
      entity.bicTableUrl = bicUrl && bicUrl.trim() && bicUrl.trim().toLowerCase() !== 'none' && bicUrl.trim() !== 'N/A' ? bicUrl.trim() : '';
      
      console.log(` V47 ${sheetName} "${name}" AFTER filtering: fasTableUrl="${entity.fasTableUrl}", bicTableUrl="${entity.bicTableUrl}"`);
      
      if (entity.fasTableUrl) {
        console.log(` V47 ${sheetName} FAS: ${entity.fasTableUrl.substring(0, 80)}...`);
      }
      if (entity.bicTableUrl) {
        console.log(` V47 ${sheetName} BIC: ${entity.bicTableUrl.substring(0, 80)}...`);
      }
      
      // Add OneGov indicator (Column AF - index 31)
      const isOneGovValue = row[31]; // Column AF
      if (isOneGovValue && String(isOneGovValue).trim().toLowerCase() === 'yes') {
        entity.isOneGov = true;
      } else {
        entity.isOneGov = false;
      }
      
      entities.push(entity);
    }
    
    console.log(`🔄 V47 getTableEntities(${entityType}): Returning ${entities.length} entities`);
    return createResponse(true, entities, null);
    
  } catch (error) {
    console.error(`V47 Error getting ${entityType} entities:`, error);
    return createResponse(false, null, error.toString());
  }
} */

// ============================================================================
// SAVINGS REPORT VIEWER FUNCTIONS
// Called by F06_OneGovSavingsReport.html
// ============================================================================

/**
 * Test function to run directly in Apps Script editor
 * Run this function and check the execution log
 */
function debugReportsFunction() {
  console.log('=== DEBUGGING REPORTS FUNCTION ===');
  
  try {
    // Test 1: Can we access the spreadsheet?
    const ss = SpreadsheetApp.openById('18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE');
    console.log('✓ Spreadsheet accessed successfully');
    
    // Test 2: Can we find the Reports sheet?
    const reportsSheet = ss.getSheetByName('Reports');
    if (!reportsSheet) {
      console.log('✗ ERROR: Reports sheet not found!');
      return;
    }
    console.log('✓ Reports sheet found');
    
    // Test 3: What's in the sheet?
    const lastRow = reportsSheet.getLastRow();
    const lastCol = reportsSheet.getLastColumn();
    console.log('Sheet dimensions: ' + lastRow + ' rows, ' + lastCol + ' columns');
    
    // Test 4: Get the data
    if (lastRow >= 2) {
      const data = reportsSheet.getRange(2, 1, Math.min(lastRow - 1, 5), 10).getValues();
      console.log('First few rows of data:');
      for (let i = 0; i < data.length; i++) {
        console.log('Row ' + (i+2) + ': Report Type = "' + data[i][0] + '"');
      }
    } else {
      console.log('✗ No data rows found (only header or empty)');
    }
    
    // Test 5: Try running the actual function
    console.log('\n=== Running getReportsForWebApp ===');
    const result = getReportsForWebApp();
    console.log('Function returned:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log('✗ ERROR:', error.toString());
    console.log('Stack:', error.stack);
  }
}

/**
 * Simple test for google.script.run
 */
function testGoogleScriptRun() {
  return { status: "ok", message: "Connection works!" };
}

/**
 * MINIMAL test function - should never return null
 */
function testMinimal() {
  return { status: "testMinimal works" };
}

/**
 * Test spreadsheet access
 */
function testSpreadsheetAccess() {
  try {
    const ss = SpreadsheetApp.openById('18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE');
    return { status: "spreadsheet access works", id: ss.getId() };
  } catch (error) {
    return { status: "spreadsheet access failed", error: error.toString() };
  }
}

/**
 * Get all reports for the web app
 * Updated with bulletproof serialization for google.script.run
 */

/**
 * Enhanced function to get reports with Active/Archived filtering
 * Active reports: Most recent report per report type
 * Archived reports: Older duplicates of the same report type
 */
function getReportsWithArchiveStatus() {
  console.log('🚀 getReportsWithArchiveStatus: Starting function...');
  
  // Return early test to see if basic function works
  if (false) {
    console.log('🚀 Early return test');
    return {
      activeReports: [{ 
        reportType: 'Test Report',
        rowNum: 1,
        canView: true,
        reportData: { totalSavingsFormatted: '$100K' }
      }],
      archivedReports: [],
      success: true,
      message: 'Early return test successful'
    };
  }
  
  try {
    console.log('🚀 getReportsWithArchiveStatus: Opening spreadsheet...');
    const ss = SpreadsheetApp.openById('18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE');
    
    console.log('🚀 getReportsWithArchiveStatus: Getting Reports sheet...');
    const reportsSheet = ss.getSheetByName('Reports');
    
    if (!reportsSheet) {
      return { error: 'Reports sheet not found', activeReports: [], archivedReports: [] };
    }
    
    const lastRow = reportsSheet.getLastRow();
    if (lastRow < 2) {
      return { activeReports: [], archivedReports: [] };
    }
    
    // Get all data including timestamp column (F = column 6)
    console.log('🚀 getReportsWithArchiveStatus: Reading sheet data...');
    const data = reportsSheet.getRange(2, 1, lastRow - 1, 10).getValues();
    const allReports = [];
    
    console.log('🚀 getReportsWithArchiveStatus: Processing', data.length, 'rows...');
    for (let i = 0; i < data.length; i++) {
      try {
        console.log('🚀 Processing row', i + 2);
      const row = data[i];
      
      // Skip empty rows
      if (!row[0] || String(row[0]).trim() === '') {
        continue;
      }
      
      // Parse JSON content safely
      const jsonContent = row[2];
      let hasValidJson = false;
      let reportData = {};
      
      if (jsonContent && String(jsonContent).trim() !== '') {
        try {
          // Try to fix common JSON issues before parsing
          let jsonString = String(jsonContent);
          
          // Try to clean up the JSON string - more aggressive cleaning
          jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
          jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":'); // Add quotes to unquoted keys
          jsonString = jsonString.replace(/\r?\n/g, ' '); // Replace newlines with spaces
          jsonString = jsonString.replace(/\t/g, ' '); // Replace tabs with spaces
          jsonString = jsonString.replace(/\s+/g, ' '); // Collapse multiple spaces
          
          // Debug the problematic area around position 1435
          if (jsonString.length > 1435) {
            const problematicArea = jsonString.substring(1400, 1470);
            console.log(' Problematic area around position 1435:', problematicArea);
          }
          
          let parsed;
          if (typeof jsonContent === 'object' && jsonContent !== null) {
            parsed = jsonContent;
          } else {
            parsed = JSON.parse(jsonString);
          }
          
          hasValidJson = true;
          
          // Extract executive summary data - handle both old and new JSON structures
          const execSummary = parsed.executiveSummary?.data || parsed.executiveSummary || {};
          
          // Log the parsed data for debugging
          console.log(' Successfully parsed report for row ' + (i+2) + ':', {
            reportType: parsed.reportType,
            reportingPeriod: parsed.reportingPeriod,
            totalSavings: execSummary.totalSavingsFormatted
          });
          
          reportData = {
            reportType: String(parsed.reportType || row[0] || ''),
            reportVersion: String(parsed.reportVersion || ''),
            generatedAt: String(parsed.generatedAt || ''),
            generatedBy: String(parsed.generatedBy || row[4] || ''),
            reportingPeriod: String(parsed.reportingPeriod || ''),
            // Executive Summary KPIs - with fallbacks for different structures
            totalSavings: execSummary.totalSavings || 0,
            totalSavingsFormatted: String(execSummary.totalSavingsFormatted || execSummary.totalSavings || 'N/A'),
            totalTransactions: execSummary.totalTransactions || 0,
            totalCPL: execSummary.totalCPL || 0,
            totalCPLFormatted: String(execSummary.totalCPLFormatted || execSummary.totalCPL || 'N/A'),
            totalPaid: execSummary.totalPaid || 0,
            totalPaidFormatted: String(execSummary.totalPaidFormatted || execSummary.totalPaid || 'N/A'),
            overallDiscountRate: String(execSummary.overallDiscountRate || execSummary.discountRate || 'N/A'),
            oemCount: execSummary.oemCount || 0,
            vendorCount: execSummary.vendorCount || 0,
            topOEM: String(execSummary.topOEM || ''),
            topOEMSavings: String(execSummary.topOEMSavings || ''),
            topOEMPercent: String(execSummary.topOEMPercent || '')
          };
        } catch (e) {
          console.error(' Failed to parse JSON for row ' + (i+2) + ':', e.message);
          console.error(' JSON preview:', String(jsonContent).substring(0, 200) + '...');
          hasValidJson = false;
          // Set minimal reportData even if JSON parsing fails
          reportData = {
            reportType: String(row[0] || ''),
            reportingPeriod: 'N/A',
            totalSavingsFormatted: 'N/A',
            overallDiscountRate: 'N/A',
            totalTransactions: 0,
            oemCount: 0,
            vendorCount: 0
          };
        }
      } else {
        // No JSON content, use minimal data
        reportData = {
          reportType: String(row[0] || ''),
          reportingPeriod: 'N/A',
          totalSavingsFormatted: 'N/A',
          overallDiscountRate: 'N/A',
          totalTransactions: 0,
          oemCount: 0,
          vendorCount: 0
        };
      }
      
      // Parse timestamp - handle both Date objects and strings
      let timestampValue = row[5];
      let timestampDate = null;
      
      if (timestampValue) {
        if (timestampValue instanceof Date) {
          timestampDate = timestampValue;
        } else {
          try {
            timestampDate = new Date(String(timestampValue));
          } catch (e) {
            // If date parsing fails, leave as null
          }
        }
      }
      
      const report = {
        rowNum: i + 2,
        reportType: String(row[0] || ''),
        dataLink: String(row[1] || ''),
        hasJson: hasValidJson,
        // Always allow viewing OneGov Monthly Savings reports, even if JSON parsing failed
        canView: hasValidJson || 
                 Boolean(row[3] && String(row[3]).trim() !== '') ||
                 String(row[0] || '').includes('OneGov'),
        driveUrl: String(row[3] || ''),
        creator: String(row[4] || ''),
        timestamp: timestampValue ? String(timestampValue) : '',
        timestampDate: timestampDate,
        level1Reviewer: String(row[6] || ''),
        level1Timestamp: row[7] ? String(row[7]) : '',
        level2Reviewer: String(row[8] || ''),
        level2Timestamp: row[9] ? String(row[9]) : '',
        reportData: reportData
      };
      
      allReports.push(report);
      } catch (rowError) {
        console.error(' Error processing row', i + 2, ':', rowError.message);
        // Continue with next row instead of crashing
        continue;
      }
    }
    
    // Group reports by type and determine active vs archived
    const reportsByType = {};
    
    for (const report of allReports) {
      const type = report.reportType;
      if (!reportsByType[type]) {
        reportsByType[type] = [];
      }
      reportsByType[type].push(report);
    }
    
    const activeReports = [];
    const archivedReports = [];
    
    // For each report type, sort by timestamp and mark the most recent as active
    for (const type in reportsByType) {
      const reports = reportsByType[type];
      
      // Sort by timestamp (most recent first)
      reports.sort((a, b) => {
        if (!a.timestampDate && !b.timestampDate) return 0;
        if (!a.timestampDate) return 1;
        if (!b.timestampDate) return -1;
        return b.timestampDate.getTime() - a.timestampDate.getTime();
      });
      
      // First one is active, rest are archived
      if (reports.length > 0) {
        activeReports.push(reports[0]);
        for (let i = 1; i < reports.length; i++) {
          archivedReports.push(reports[i]);
        }
      }
    }
    
    // Sort active reports by timestamp (most recent first)
    activeReports.sort((a, b) => {
      if (!a.timestampDate && !b.timestampDate) return 0;
      if (!a.timestampDate) return 1;
      if (!b.timestampDate) return -1;
      return b.timestampDate.getTime() - a.timestampDate.getTime();
    });
    
    // Sort archived reports by timestamp (most recent first)
    archivedReports.sort((a, b) => {
      if (!a.timestampDate && !b.timestampDate) return 0;
      if (!a.timestampDate) return 1;
      if (!b.timestampDate) return -1;
      return b.timestampDate.getTime() - a.timestampDate.getTime();
    });
    
    console.log(' getReportsWithArchiveStatus: Returning results - Active:', activeReports.length, 'Archived:', archivedReports.length);
    
    const result = { 
      activeReports: activeReports, 
      archivedReports: archivedReports, 
      success: true 
    };
    
    console.log(' getReportsWithArchiveStatus: Final result object:', result);
    return result;
  } catch (error) {
    console.error(' getReportsWithArchiveStatus: Error occurred:', error);
    const errorResult = { 
      error: String(error), 
      activeReports: [], 
      archivedReports: [], 
      success: false 
    };
    console.log(' getReportsWithArchiveStatus: Returning error result:', errorResult);
    return errorResult;
  }
}

/**
 * Simple function to get basic report metadata without JSON parsing
 */
function getBasicReportsWithoutJson() {
  console.log('📋 getBasicReportsWithoutJson: Starting function...');
  
  try {
    console.log('📋 Opening spreadsheet...');
    const ss = SpreadsheetApp.openById('18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE');
    
    console.log('📋 Getting Reports sheet...');
    const reportsSheet = ss.getSheetByName('Reports');
    
    if (!reportsSheet) {
      return { error: 'Reports sheet not found', activeReports: [], archivedReports: [] };
    }
    
    const lastRow = reportsSheet.getLastRow();
    console.log('📋 Last row:', lastRow);
    
    if (lastRow < 2) {
      return { activeReports: [], archivedReports: [], message: 'No data rows found' };
    }
    
    // Get basic data (skip JSON parsing for now)
    console.log('📋 Reading basic data...');
    const data = reportsSheet.getRange(2, 1, lastRow - 1, 6).getValues();
    console.log('📋 Data rows retrieved:', data.length);
    
    const basicReports = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      console.log('📋 Processing row', i + 2, ':', row[0]);
      
      // Skip empty rows
      if (!row[0] || String(row[0]).trim() === '') {
        console.log('📋 Skipping empty row', i + 2);
        continue;
      }
      
      basicReports.push({
        reportType: String(row[0]).trim(),
        dataLink: String(row[1] || '').trim(),
        hasJson: !!(row[2] && String(row[2]).trim() !== ''),
        driveUrl: String(row[3] || '').trim(),
        creator: String(row[4] || '').trim(),
        timestamp: row[5] || '',
        rowNum: i + 2,
        canView: true,
        reportData: {
          totalSavingsFormatted: 'N/A',
          overallDiscountRate: 'N/A',
          totalTransactions: 0,
          oemCount: 0,
          vendorCount: 0
        }
      });
    }
    
    console.log('📋 Basic reports found:', basicReports.length);
    
    const finalResult = {
      activeReports: basicReports,
      archivedReports: [],
      success: true,
      message: `Found ${basicReports.length} basic reports`
    };
    
    console.log('📋 getBasicReportsWithoutJson: Returning result:', finalResult);
    return finalResult;
    
  } catch (error) {
    console.error(' getBasicReportsWithoutJson: Error occurred:', error);
    console.error(' Error name:', error.name);
    console.error(' Error message:', error.message);
    console.error(' Error stack:', error.stack);
    
    const errorResult = {
      error: `Error: ${error.name}: ${error.message}`,
      activeReports: [],
      archivedReports: [],
      success: false,
      debugInfo: {
        errorName: error.name,
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log(' getBasicReportsWithoutJson: Returning error result:', errorResult);
    return errorResult;
  }
}

/**
 * Test basic spreadsheet access
 */
function testSpreadsheetAccess() {
  console.log(' testSpreadsheetAccess: Starting...');
  
  try {
    console.log(' Opening spreadsheet with ID: 18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE');
    const ss = SpreadsheetApp.openById('18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE');
    console.log(' Spreadsheet opened successfully');
    
    const allSheets = ss.getSheets();
    console.log(' Found sheets:', allSheets.map(s => s.getName()));
    
    const reportsSheet = ss.getSheetByName('Reports');
    if (!reportsSheet) {
      return {
        success: false,
        error: 'Reports sheet not found',
        availableSheets: allSheets.map(s => s.getName())
      };
    }
    
    const lastRow = reportsSheet.getLastRow();
    const lastCol = reportsSheet.getLastColumn();
    console.log(' Reports sheet - Last row:', lastRow, 'Last column:', lastCol);
    
    if (lastRow >= 2) {
      const firstDataRow = reportsSheet.getRange(2, 1, 1, Math.min(6, lastCol)).getValues()[0];
      console.log(' First data row:', firstDataRow);
    }
    
    return {
      success: true,
      message: 'Spreadsheet access successful',
      sheetInfo: {
        totalSheets: allSheets.length,
        availableSheets: allSheets.map(s => s.getName()),
        reportsSheetExists: !!reportsSheet,
        lastRow: lastRow,
        lastColumn: lastCol
      }
    };
    
  } catch (error) {
    console.error(' testSpreadsheetAccess: Error:', error);
    return {
      success: false,
      error: `${error.name}: ${error.message}`,
      errorDetails: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };
  }
}

/**
 * Simple function to get report by row for F06 detailed view
 */
function getSimpleReportByRow(rowNum) {
  if (rowNum == 2) {
    // Return our test report with full JSON structure for F06
    return {
      rowNum: 2,
      reportType: 'OneGov Monthly Savings',
      creator: 'gerald.mavis@gsa.gov',
      timestamp: '12/2/2025',
      json: {
        reportType: 'OneGov Monthly Savings',
        reportVersion: '2.1',
        generatedAt: '2025-12-02T18:29:11.499Z',
        generatedBy: 'gerald.mavis@gsa.gov',
        reportingPeriod: 'Jun 2025 - Sep 2025',
        executiveSummary: {
          data: {
            totalSavings: 11015086.17,
            totalSavingsFormatted: '$11.0M',
            totalTransactions: 13,
            totalCPL: 18556993.98,
            totalCPLFormatted: '$18.6M',
            totalPaid: 7541907.81,
            totalPaidFormatted: '$7.5M',
            overallDiscountRate: '59.36%',
            oemCount: 6,
            vendorCount: 2,
            topOEM: 'Elastic',
            topOEMSavings: '$10.1M',
            topOEMPercent: '91.95'
          }
        }
      }
    };
  }
  
  return { error: 'Report not found', rowNum: rowNum };
}

/**
 * Super simple reports function for testing
 */
function getSimpleReports() {
  
  const testReport = {
    reportType: 'OneGov Monthly Savings',
    rowNum: 2,
    creator: 'gerald.mavis@gsa.gov',
    timestamp: '12/2/2025',
    canView: true,
    reportData: {
      reportingPeriod: 'Jun 2025 - Sep 2025',
      totalSavings: 11015086.17,
      totalSavingsFormatted: '$11.0M',
      overallDiscountRate: '59.36%',
      totalTransactions: 13,
      oemCount: 6,
      vendorCount: 2
    }
  };
  
  const result = {
    activeReports: [testReport],
    archivedReports: [],
    success: true,
    message: 'Simple reports function working'
  };
  
  return result;
}

/**
 * Simple test function to verify the connection
 */
function testReportsFunction() {
  console.log('🧪 testReportsFunction: Called successfully!');
  return {
    message: 'Function call successful',
    timestamp: new Date().toISOString(),
    activeReports: [],
    archivedReports: [],
    success: true
  };
}

/**
 * Get a specific report by row number
 */
function getReportByRow(rowNum) {
  const ss = SpreadsheetApp.openById('18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE');
  const reportsSheet = ss.getSheetByName('Reports');
  
  if (!reportsSheet) {
    return { error: 'Reports sheet not found' };
  }
  
  const row = reportsSheet.getRange(rowNum, 1, 1, 10).getValues()[0];
  
  let parsedJson = null;
  if (row[2]) {
    try {
      parsedJson = JSON.parse(row[2]);
    } catch (e) {
      return { error: 'Failed to parse report JSON' };
    }
  }
  
  return {
    rowNum: rowNum,
    reportType: row[0],
    dataLink: row[1],
    json: parsedJson,
    driveUrl: row[3],
    creator: row[4],
    timestamp: row[5],
    level1Reviewer: row[6],
    level1Timestamp: row[7],
    level2Reviewer: row[8],
    level2Timestamp: row[9]
  };
}

/**
 * Simple test to verify deployment
 */
function testWebAppDeployment() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}

/**
 * Update report JSON (for saving commentary)
 */
function updateReportJson(rowNum, updatedJson) {
  try {
    const ss = SpreadsheetApp.openById('18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE');
    const reportsSheet = ss.getSheetByName('Reports');
    reportsSheet.getRange(rowNum, 3).setValue(JSON.stringify(updatedJson, null, 2));
    SpreadsheetApp.flush();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Update report after export (save image URLs)
 */
function updateReportAfterExport(rowNum, driveUrl) {
  try {
    const ss = SpreadsheetApp.openById('18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE');
    const reportsSheet = ss.getSheetByName('Reports');
    if (driveUrl) reportsSheet.getRange(rowNum, 4).setValue(driveUrl);
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
    return { success: true, url: file.getUrl(), id: file.getId() };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// ============================================================================
// ENTITY REPORT GENERATION FUNCTIONS
// ============================================================================

/**
 * Entity report templates (Google Doc template IDs)
 */
const ENTITY_REPORT_TEMPLATES = {
  "1-Page Profile": {
    "GSA": "TEMPLATE_ID_1_GSA_PROFILE",     // Replace with actual template ID
    "ITVMO": "TEMPLATE_ID_1_ITVMO_PROFILE"   // Replace with actual template ID
  },
  "Product Report": {
    "GSA": "TEMPLATE_ID_2_GSA_PRODUCT",     // Replace with actual template ID  
    "ITVMO": "TEMPLATE_ID_2_ITVMO_PRODUCT"   // Replace with actual template ID
  },
  "Contract Summary": {
    "GSA": "TEMPLATE_ID_3_GSA_CONTRACT",    // Replace with actual template ID
    "ITVMO": "TEMPLATE_ID_3_ITVMO_CONTRACT"  // Replace with actual template ID
  }
};

/**
 * Generate entity report (preview or actual document)
 */
function generateEntityReport(entityData, reportType, letterhead, generateDoc) {
  try {
    console.log(` Generating entity report: ${reportType} with ${letterhead} letterhead`);
    
    if (!generateDoc) {
      // Preview mode - return formatted data without creating document
      return {
        success: true,
        preview: {
          entityName: entityData.name || 'Unknown Entity',
          totalObligations: entityData.totalObligationsFormatted || '$0',
          contractCount: entityData.contractCount || 0,
          tier: entityData.tier || 'N/A',
          entityType: entityData.entityType || 'Unknown',
          reportDate: new Date().toLocaleDateString(),
          letterhead: letterhead
        }
      };
    }
    
    // Document generation mode - create actual Google Doc
    const templateId = ENTITY_REPORT_TEMPLATES[reportType]?.[letterhead];
    
    if (!templateId || templateId.startsWith('TEMPLATE_ID_')) {
      return { 
        success: false, 
        error: `Template not found for ${reportType} with ${letterhead} letterhead. Please create templates first.` 
      };
    }
    
    return { success: true, docId: 'test123' }; // Placeholder for now
    
  } catch (error) {
    console.error('Error generating entity report:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Generate and email entity report
 */
function generateAndEmailEntityReport(entityData, reportType, letterhead, format) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    
    // For now, just return success message
    return { 
      success: true, 
      message: `Report would be emailed to ${userEmail}`,
      format: format
    };
    
  } catch (error) {
    console.error('Error emailing entity report:', error);
    return { success: false, error: error.toString() };
  }
}
