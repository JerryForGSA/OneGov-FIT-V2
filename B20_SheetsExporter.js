/**
 * @fileoverview Sheets Exporter for OneGov FIT Report Builder
 * @module B20_SheetsExporter
 * @version 1.0.0
 * @description Handles exporting charts and tables to Google Sheets.
 *              Clones template, creates a tab for each item with chart image and data.
 * @author OneGov FIT Market Development Team
 * @created 2024-12-23
 */

// ============================================================================
// SECTION 1: MAIN SHEETS EXPORT FUNCTION
// ============================================================================

/**
 * Export items to Google Sheets
 * Called from B15_ExportManager.exportReportBuilder()
 * 
 * Each item gets its own tab with:
 * - Chart image at top (if chart)
 * - Data table below
 * 
 * @param {Object} exportData - Export manifest
 * @param {string} exportData.letterhead - 'GSA' | 'ITVMO'
 * @param {Array} exportData.items - Array of chart/table items
 * @param {string} exportData.reportTitle - Optional title
 * @returns {Object} Result with success status and file URL
 */
function exportToSheets(exportData) {
  try {
    const { letterhead, items, reportTitle } = exportData;
    
    console.log('📋 SHEETS EXPORT: Starting', {
      letterhead,
      itemCount: items.length
    });
    
    // Step 1: Clone the template
    const templateId = EXPORT_CONFIG.templates.sheets[letterhead];
    const filename = generateExportFilename('sheets', letterhead, reportTitle);
    const cloned = cloneTemplate(templateId, filename, 'sheets');
    
    // Step 2: Open the cloned spreadsheet
    const spreadsheet = SpreadsheetApp.openById(cloned.id);
    
    console.log('📋 SHEETS: Template cloned, processing items');
    
    // Step 3: Create a summary/cover sheet
    createCoverSheet(spreadsheet, items, reportTitle);
    
    // Step 4: Process each item - create a tab for each
    items.forEach((item, index) => {
      console.log(`📋 SHEETS: Processing item ${index + 1}/${items.length}: ${item.title}`);
      createItemSheet(spreadsheet, item, index + 1);
    });
    
    // Step 5: Clean up - delete the default "Sheet1" if it exists
    deleteDefaultSheet(spreadsheet);
    
    // Step 6: Set the cover sheet as active
    const coverSheet = spreadsheet.getSheetByName('Summary');
    if (coverSheet) {
      spreadsheet.setActiveSheet(coverSheet);
    }
    
    console.log('📋 SHEETS EXPORT: Complete', cloned.url);
    
    return {
      success: true,
      fileId: cloned.id,
      fileUrl: cloned.url,
      fileName: filename,
      message: `Successfully exported ${items.length} items to Google Sheets`
    };
    
  } catch (error) {
    console.error('📋 SHEETS EXPORT ERROR:', error);
    return { success: false, error: error.toString() };
  }
}

// ============================================================================
// SECTION 2: COVER/SUMMARY SHEET
// ============================================================================

/**
 * Create a summary/cover sheet with table of contents
 * 
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The spreadsheet
 * @param {Array} items - Array of items being exported
 * @param {string} reportTitle - Report title
 */
function createCoverSheet(spreadsheet, items, reportTitle) {
  // Insert summary sheet at the beginning
  const sheet = spreadsheet.insertSheet('Summary', 0);
  
  // Set column widths
  sheet.setColumnWidth(1, 50);   // Column A - #
  sheet.setColumnWidth(2, 300);  // Column B - Title
  sheet.setColumnWidth(3, 100);  // Column C - Type
  sheet.setColumnWidth(4, 150);  // Column D - Link
  
  // Title row
  const titleRange = sheet.getRange('A1:D1');
  titleRange.merge();
  titleRange.setValue(reportTitle || 'Report Builder Export');
  titleRange.setFontSize(18);
  titleRange.setFontWeight('bold');
  titleRange.setFontColor('#144673');
  titleRange.setHorizontalAlignment('center');
  sheet.setRowHeight(1, 40);
  
  // Subtitle row
  const subtitleRange = sheet.getRange('A2:D2');
  subtitleRange.merge();
  subtitleRange.setValue(`Generated: ${new Date().toLocaleDateString()} | ${items.length} items`);
  subtitleRange.setFontSize(10);
  subtitleRange.setFontColor('#666666');
  subtitleRange.setHorizontalAlignment('center');
  
  // Spacer row
  sheet.setRowHeight(3, 20);
  
  // Table of contents header
  const tocHeaderRange = sheet.getRange('A4:D4');
  tocHeaderRange.setValues([['#', 'Item Title', 'Type', 'Go to Tab']]);
  tocHeaderRange.setFontWeight('bold');
  tocHeaderRange.setBackground('#144673');
  tocHeaderRange.setFontColor('#ffffff');
  tocHeaderRange.setHorizontalAlignment('center');
  
  // Add each item to TOC
  items.forEach((item, index) => {
    const rowNum = 5 + index;
    const tabName = generateTabName(item.title, index + 1);
    
    const row = sheet.getRange(rowNum, 1, 1, 4);
    row.setValues([[
      index + 1,
      item.title || `Item ${index + 1}`,
      item.type === 'chart' ? '📊 Chart' : '📋 Table',
      tabName
    ]]);
    
    // Alternating row colors
    if (index % 2 === 0) {
      row.setBackground('#f8f9fa');
    }
    
    // Make the tab name a hyperlink
    const linkCell = sheet.getRange(rowNum, 4);
    const formula = `=HYPERLINK("#gid=${getSheetIdByName(spreadsheet, tabName) || '0'}", "${tabName}")`;
    // Since we can't get gid before sheet exists, we'll update links after
    linkCell.setValue(tabName);
    linkCell.setFontColor('#3a6ea5');
    linkCell.setFontStyle('italic');
  });
  
  // Add border around TOC
  const tocRange = sheet.getRange(4, 1, items.length + 1, 4);
  tocRange.setBorder(true, true, true, true, true, true, '#cccccc', SpreadsheetApp.BorderStyle.SOLID);
  
  // Freeze header row
  sheet.setFrozenRows(4);
  
  console.log('📋 SHEETS: Created cover sheet');
}

/**
 * Update TOC hyperlinks after all sheets are created
 * 
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The spreadsheet
 * @param {Array} items - Array of items
 */
function updateTocLinks(spreadsheet, items) {
  const summarySheet = spreadsheet.getSheetByName('Summary');
  if (!summarySheet) return;
  
  items.forEach((item, index) => {
    const rowNum = 5 + index;
    const tabName = generateTabName(item.title, index + 1);
    const targetSheet = spreadsheet.getSheetByName(tabName);
    
    if (targetSheet) {
      const gid = targetSheet.getSheetId();
      const linkCell = summarySheet.getRange(rowNum, 4);
      linkCell.setFormula(`=HYPERLINK("#gid=${gid}", "${tabName}")`);
    }
  });
}

// ============================================================================
// SECTION 3: ITEM SHEET CREATION
// ============================================================================

/**
 * Create a sheet for a single item
 * 
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The spreadsheet
 * @param {Object} item - The item to add
 * @param {number} itemNumber - Item number (1-based)
 */
function createItemSheet(spreadsheet, item, itemNumber) {
  const tabName = generateTabName(item.title, itemNumber);
  const sheet = spreadsheet.insertSheet(tabName);
  
  // Set column widths
  sheet.setColumnWidth(1, 200);  // Column A
  sheet.setColumnWidth(2, 150);  // Column B
  sheet.setColumnWidth(3, 150);  // Column C
  sheet.setColumnWidth(4, 150);  // Column D
  sheet.setColumnWidth(5, 150);  // Column E
  
  let currentRow = 1;
  
  // Title
  const titleRange = sheet.getRange('A1:E1');
  titleRange.merge();
  titleRange.setValue(item.title || `Item ${itemNumber}`);
  titleRange.setFontSize(16);
  titleRange.setFontWeight('bold');
  titleRange.setFontColor('#144673');
  sheet.setRowHeight(1, 35);
  
  currentRow = 2;
  
  // Subtitle/caption if present
  if (item.subtitle || item.caption) {
    const subtitleRange = sheet.getRange('A2:E2');
    subtitleRange.merge();
    subtitleRange.setValue(item.subtitle || item.caption);
    subtitleRange.setFontSize(10);
    subtitleRange.setFontColor('#666666');
    subtitleRange.setFontStyle('italic');
    currentRow = 3;
  }
  
  // Spacer row
  currentRow++;
  
  // If chart with image, insert it
  if (item.type === 'chart' && item.imageBase64) {
    currentRow = insertSheetChartImage(sheet, item.imageBase64, currentRow);
    currentRow += 2; // Add spacing after image
  }
  
  // Add "Data" header
  const dataHeaderRange = sheet.getRange(currentRow, 1, 1, 5);
  dataHeaderRange.merge();
  dataHeaderRange.setValue('📊 Data');
  dataHeaderRange.setFontSize(12);
  dataHeaderRange.setFontWeight('bold');
  dataHeaderRange.setFontColor('#144673');
  dataHeaderRange.setBackground('#f0f4f8');
  currentRow++;
  
  // Add table data
  currentRow = insertSheetTableData(sheet, item, currentRow);
  
  // Freeze title row
  sheet.setFrozenRows(1);
  
  console.log(`📋 SHEETS: Created sheet "${tabName}"`);
}

/**
 * Generate a valid sheet tab name
 * 
 * @param {string} title - Item title
 * @param {number} index - Item number
 * @returns {string} Valid tab name (max 100 chars, no invalid chars)
 */
function generateTabName(title, index) {
  // Clean the title
  let name = title || `Item ${index}`;
  
  // Remove invalid characters for sheet names
  name = name.replace(/[\/\\?*\[\]:]/g, '-');
  
  // Prepend number for ordering
  name = `${index}. ${name}`;
  
  // Truncate if too long (max 100 chars for sheet names)
  if (name.length > 50) {
    name = name.substring(0, 47) + '...';
  }
  
  return name;
}

// ============================================================================
// SECTION 4: CHART IMAGE INSERTION
// ============================================================================

/**
 * Insert a chart image into a sheet
 * 
 * @param {SpreadsheetApp.Sheet} sheet - The sheet
 * @param {string} base64Data - Base64 encoded PNG image
 * @param {number} startRow - Row to start inserting at
 * @returns {number} Next available row after image
 */
function insertSheetChartImage(sheet, base64Data, startRow) {
  try {
    // Convert base64 to blob
    const blob = base64ToBlob(base64Data, 'chart.png');
    
    // Insert image
    // Note: insertImage positions are in pixels from top-left of cell
    const image = sheet.insertImage(blob, 1, startRow, 10, 10);
    
    // Set image size
    const maxWidth = 600;
    const maxHeight = 400;
    
    // Scale image if needed
    const width = image.getWidth();
    const height = image.getHeight();
    
    if (width > maxWidth || height > maxHeight) {
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio);
      
      image.setWidth(width * ratio);
      image.setHeight(height * ratio);
    }
    
    // Calculate how many rows the image spans (roughly 20 pixels per row)
    const imageHeight = image.getHeight();
    const rowsNeeded = Math.ceil(imageHeight / 20) + 2;
    
    console.log(`📋 SHEETS: Inserted chart image, spans ~${rowsNeeded} rows`);
    
    return startRow + rowsNeeded;
    
  } catch (error) {
    console.error('📋 SHEETS: Error inserting chart image:', error);
    
    // Add error message in cell
    sheet.getRange(startRow, 1).setValue('⚠️ Chart image could not be inserted: ' + error.message);
    sheet.getRange(startRow, 1).setFontColor('#ef4444');
    
    return startRow + 2;
  }
}

// ============================================================================
// SECTION 5: TABLE DATA INSERTION
// ============================================================================

/**
 * Insert table data into a sheet
 * 
 * @param {SpreadsheetApp.Sheet} sheet - The sheet
 * @param {Object} item - The item with table data
 * @param {number} startRow - Row to start inserting at
 * @returns {number} Next available row after table
 */
function insertSheetTableData(sheet, item, startRow) {
  const tableData = formatTableData(item);
  const { headers, rows } = tableData;
  
  if (!headers || headers.length === 0) {
    sheet.getRange(startRow, 1).setValue('No data available');
    return startRow + 2;
  }
  
  const numCols = headers.length;
  const numRows = rows.length;
  
  // Insert headers
  const headerRange = sheet.getRange(startRow, 1, 1, numCols);
  headerRange.setValues([headers.map(h => String(h || ''))]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#144673');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');
  
  // Insert data rows
  if (numRows > 0) {
    const dataRange = sheet.getRange(startRow + 1, 1, numRows, numCols);
    
    // Format data for sheets
    const formattedRows = rows.map(row => {
      return row.map(cell => {
        if (cell === null || cell === undefined) return '';
        return cell; // Keep raw values for Sheets (it handles formatting)
      });
    });
    
    dataRange.setValues(formattedRows);
    
    // Apply alternating row colors
    for (let i = 0; i < numRows; i++) {
      const rowRange = sheet.getRange(startRow + 1 + i, 1, 1, numCols);
      if (i % 2 === 0) {
        rowRange.setBackground('#f8f9fa');
      }
    }
    
    // Apply number formatting to numeric columns
    applyNumberFormatting(sheet, startRow + 1, numRows, numCols, rows);
    
    // Add border around table
    const fullTableRange = sheet.getRange(startRow, 1, numRows + 1, numCols);
    fullTableRange.setBorder(
      true, true, true, true, true, true,
      '#cccccc',
      SpreadsheetApp.BorderStyle.SOLID
    );
  }
  
  console.log(`📋 SHEETS: Inserted table with ${numRows} rows x ${numCols} cols`);
  
  return startRow + numRows + 3;
}

/**
 * Apply number formatting to numeric columns
 * 
 * @param {SpreadsheetApp.Sheet} sheet - The sheet
 * @param {number} dataStartRow - First data row
 * @param {number} numRows - Number of data rows
 * @param {number} numCols - Number of columns
 * @param {Array} rows - Raw data rows
 */
function applyNumberFormatting(sheet, dataStartRow, numRows, numCols, rows) {
  if (numRows === 0) return;
  
  // Check first row to determine column types
  const firstRow = rows[0];
  
  for (let col = 0; col < numCols; col++) {
    const sampleValue = firstRow[col];
    
    if (typeof sampleValue === 'number') {
      const colRange = sheet.getRange(dataStartRow, col + 1, numRows, 1);
      
      // Determine format based on value magnitude
      if (sampleValue >= 1000) {
        // Currency format
        colRange.setNumberFormat('$#,##0');
      } else if (sampleValue < 1 && sampleValue > 0) {
        // Percentage format
        colRange.setNumberFormat('0.0%');
      } else {
        // General number format
        colRange.setNumberFormat('#,##0');
      }
    }
  }
}

// ============================================================================
// SECTION 6: UTILITY FUNCTIONS
// ============================================================================

/**
 * Delete the default "Sheet1" if it exists
 * 
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The spreadsheet
 */
function deleteDefaultSheet(spreadsheet) {
  const defaultNames = ['Sheet1', 'Sheet 1', 'Hoja1', 'Hoja 1'];
  
  defaultNames.forEach(name => {
    try {
      const sheet = spreadsheet.getSheetByName(name);
      if (sheet) {
        spreadsheet.deleteSheet(sheet);
        console.log(`📋 SHEETS: Deleted default sheet "${name}"`);
      }
    } catch (e) {
      // Ignore - can't delete if it's the only sheet
    }
  });
}

/**
 * Get a sheet's ID by name
 * 
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet - The spreadsheet
 * @param {string} sheetName - Name of the sheet
 * @returns {number|null} Sheet ID or null if not found
 */
function getSheetIdByName(spreadsheet, sheetName) {
  try {
    const sheet = spreadsheet.getSheetByName(sheetName);
    return sheet ? sheet.getSheetId() : null;
  } catch (e) {
    return null;
  }
}

// ============================================================================
// SECTION 7: TEST FUNCTIONS
// ============================================================================

/**
 * Test sheets export with sample data
 */
function testSheetsExport() {
  const testData = {
    exportType: 'sheets',
    letterhead: 'GSA',
    reportTitle: 'Test Sheets Export',
    items: [
      {
        id: 'test_table_1',
        type: 'table',
        title: 'Top 10 Vendors by Spend',
        caption: 'Source: FY2024 Procurement Data',
        tableData: {
          headers: ['Rank', 'Vendor', 'Total Spend', 'Contracts', '% of Total'],
          rows: [
            [1, 'ABC Corporation', 2500000, 15, 0.25],
            [2, 'XYZ Inc', 1800000, 12, 0.18],
            [3, 'Tech Solutions', 1500000, 8, 0.15],
            [4, 'Global Services', 1200000, 10, 0.12],
            [5, 'Prime Contractors', 1000000, 6, 0.10],
            [6, 'DataTech Corp', 800000, 5, 0.08],
            [7, 'InfoSys Partners', 600000, 4, 0.06],
            [8, 'Cloud Nine Inc', 400000, 3, 0.04],
            [9, 'SecureNet LLC', 200000, 2, 0.02],
            [10, 'Digital First', 100000, 1, 0.01]
          ]
        }
      },
      {
        id: 'test_chart_1',
        type: 'chart',
        title: 'Spending by Category',
        subtitle: 'Fiscal Year 2024',
        imageBase64: null, // Would be populated from frontend
        chartData: {
          labels: ['IT Services', 'Hardware', 'Software', 'Consulting', 'Facilities'],
          datasets: [{
            label: 'FY2024 Spend',
            data: [5500000, 2800000, 3200000, 1600000, 900000]
          }]
        }
      },
      {
        id: 'test_table_2',
        type: 'table',
        title: 'Year-over-Year Comparison',
        tableData: {
          headers: ['Category', 'FY2022', 'FY2023', 'FY2024', 'YoY Change'],
          rows: [
            ['IT Services', 4500000, 5000000, 5500000, 0.10],
            ['Hardware', 3500000, 3000000, 2800000, -0.07],
            ['Software', 2000000, 2500000, 3200000, 0.28],
            ['Consulting', 1400000, 1500000, 1600000, 0.07],
            ['Facilities', 1000000, 900000, 900000, 0.00]
          ]
        }
      }
    ]
  };
  
  console.log('🧪 Testing Sheets Export...');
  const result = exportToSheets(testData);
  console.log('🧪 Result:', result);
  
  if (result.success) {
    console.log('✅ Test passed! View file at:', result.fileUrl);
  } else {
    console.log('❌ Test failed:', result.error);
  }
  
  return result;
}

/**
 * Test sheets export with many items
 */
function testSheetsExportManyItems() {
  const items = [];
  
  // Generate 10 test items
  for (let i = 1; i <= 10; i++) {
    items.push({
      id: `table_${i}`,
      type: 'table',
      title: `Data Set ${i} - Sample Analysis`,
      tableData: {
        headers: ['Category', 'Value A', 'Value B', 'Difference'],
        rows: [
          ['Item 1', Math.random() * 1000000, Math.random() * 1000000, Math.random() * 0.5],
          ['Item 2', Math.random() * 1000000, Math.random() * 1000000, Math.random() * 0.5],
          ['Item 3', Math.random() * 1000000, Math.random() * 1000000, Math.random() * 0.5],
          ['Item 4', Math.random() * 1000000, Math.random() * 1000000, Math.random() * 0.5],
          ['Item 5', Math.random() * 1000000, Math.random() * 1000000, Math.random() * 0.5]
        ]
      }
    });
  }
  
  const testData = {
    exportType: 'sheets',
    letterhead: 'ITVMO',
    reportTitle: 'Bulk Export Test - 10 Items',
    items: items
  };
  
  console.log('🧪 Testing Sheets Export with 10 items...');
  const result = exportToSheets(testData);
  console.log('🧪 Result:', result);
  return result;
}