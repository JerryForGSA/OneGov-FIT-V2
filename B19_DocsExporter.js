/**
 * @fileoverview Docs Exporter for OneGov FIT Report Builder
 * @module B19_DocsExporter
 * @version 1.0.0
 * @description Handles exporting charts and tables to Google Docs.
 *              Clones template, inserts chart images and native tables.
 * @author OneGov FIT Market Development Team
 * @created 2024-12-23
 */

// ============================================================================
// SECTION 1: MAIN DOCS EXPORT FUNCTION
// ============================================================================

/**
 * Export items to Google Docs
 * Called from B15_ExportManager.exportReportBuilder()
 * 
 * @param {Object} exportData - Export manifest
 * @param {string} exportData.letterhead - 'GSA' | 'ITVMO'
 * @param {string} exportData.layoutDensity - 'single' | 'double'
 * @param {Array} exportData.items - Array of chart/table items
 * @param {string} exportData.reportTitle - Optional title
 * @returns {Object} Result with success status and file URL
 */
function exportToDocs(exportData) {
  try {
    const { letterhead, layoutDensity, items, reportTitle } = exportData;
    
    console.log('📄 DOCS EXPORT: Starting', {
      letterhead,
      layoutDensity,
      itemCount: items.length
    });
    
    // Step 1: Clone the template
    const templateId = EXPORT_CONFIG.templates.docs[letterhead];
    const filename = generateExportFilename('docs', letterhead, reportTitle);
    const cloned = cloneTemplate(templateId, filename, 'docs');
    
    // Step 2: Open the cloned document
    const doc = DocumentApp.openById(cloned.id);
    const body = doc.getBody();
    
    console.log('📄 DOCS: Template cloned, processing items');
    
    // Step 3: Find insertion point (end of document or after header)
    // We'll append content to the end of the body
    
    // Step 4: Process items
    const isDouble = layoutDensity === 'double';
    
    if (isDouble) {
      processDocsItemsDouble(body, items);
    } else {
      processDocsItemsSingle(body, items);
    }
    
    // Save and close
    doc.saveAndClose();
    
    console.log('📄 DOCS EXPORT: Complete', cloned.url);
    
    return {
      success: true,
      fileId: cloned.id,
      fileUrl: cloned.url,
      fileName: filename,
      message: `Successfully exported ${items.length} items to Google Docs`
    };
    
  } catch (error) {
    console.error('📄 DOCS EXPORT ERROR:', error);
    return { success: false, error: error.toString() };
  }
}

// ============================================================================
// SECTION 2: SINGLE ITEM PROCESSING
// ============================================================================

/**
 * Process items with one item per section (with page breaks)
 * 
 * @param {DocumentApp.Body} body - The document body
 * @param {Array} items - Array of items to add
 */
function processDocsItemsSingle(body, items) {
  items.forEach((item, index) => {
    console.log(`📄 DOCS: Processing item ${index + 1}/${items.length}: ${item.title}`);
    
    // Add page break before each item (except first)
    if (index > 0) {
      body.appendPageBreak();
    }
    
    // Add title
    addDocTitle(body, item.title || `Item ${index + 1}`);
    
    // Add content based on type
    if (item.type === 'chart' && item.imageBase64) {
      // Insert chart as image
      insertDocChartImage(body, item.imageBase64);
    } else if (item.type === 'table' || item.tableData) {
      // Insert as native table
      insertDocTable(body, item);
    } else if (item.chartData) {
      // Has chart data but no image - create a data table
      const tableData = formatTableData(item);
      insertDocTableFromData(body, tableData);
    }
    
    // Add caption if present
    if (item.caption || item.subtitle) {
      addDocCaption(body, item.caption || item.subtitle);
    }
    
    // Add some spacing
    body.appendParagraph('');
  });
}

// ============================================================================
// SECTION 3: DOUBLE ITEM PROCESSING (Two-Column Layout)
// ============================================================================

/**
 * Process items with two items per page using a two-column table
 * 
 * @param {DocumentApp.Body} body - The document body
 * @param {Array} items - Array of items to add
 */
function processDocsItemsDouble(body, items) {
  // Process items in pairs
  for (let i = 0; i < items.length; i += 2) {
    const leftItem = items[i];
    const rightItem = items[i + 1]; // May be undefined
    
    console.log(`📄 DOCS: Processing pair ${Math.floor(i/2) + 1}: ${leftItem.title}${rightItem ? ' + ' + rightItem.title : ' (single)'}`);
    
    // Add page break before each pair (except first)
    if (i > 0) {
      body.appendPageBreak();
    }
    
    if (rightItem) {
      // Create a 2-column table for side-by-side layout
      insertDocTwoColumnLayout(body, leftItem, rightItem);
    } else {
      // Single item on this page - use full width
      addDocTitle(body, leftItem.title || `Item ${i + 1}`);
      
      if (leftItem.type === 'chart' && leftItem.imageBase64) {
        insertDocChartImage(body, leftItem.imageBase64);
      } else if (leftItem.type === 'table' || leftItem.tableData) {
        insertDocTable(body, leftItem);
      } else if (leftItem.chartData) {
        const tableData = formatTableData(leftItem);
        insertDocTableFromData(body, tableData);
      }
      
      if (leftItem.caption || leftItem.subtitle) {
        addDocCaption(body, leftItem.caption || leftItem.subtitle);
      }
    }
  }
}

/**
 * Insert a two-column layout table for side-by-side items
 * 
 * @param {DocumentApp.Body} body - The document body
 * @param {Object} leftItem - Left column item
 * @param {Object} rightItem - Right column item
 */
function insertDocTwoColumnLayout(body, leftItem, rightItem) {
  // Create a 1-row, 2-column table with no borders
  const layoutTable = body.appendTable([['', '']]);
  layoutTable.setBorderWidth(0);
  
  // Get the cells
  const leftCell = layoutTable.getCell(0, 0);
  const rightCell = layoutTable.getCell(0, 1);
  
  // Set column widths (roughly equal)
  layoutTable.setColumnWidth(0, 280);
  layoutTable.setColumnWidth(1, 280);
  
  // Clear default content
  leftCell.clear();
  rightCell.clear();
  
  // Populate left cell
  populateDocCell(leftCell, leftItem);
  
  // Populate right cell
  populateDocCell(rightCell, rightItem);
  
  // Add spacing after
  body.appendParagraph('');
}

/**
 * Populate a table cell with an item's content
 * 
 * @param {DocumentApp.TableCell} cell - The cell to populate
 * @param {Object} item - The item to add
 */
function populateDocCell(cell, item) {
  // Add title
  const titlePara = cell.appendParagraph(item.title || 'Untitled');
  titlePara.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  titlePara.getChild(0).asText().setForegroundColor('#144673');
  titlePara.getChild(0).asText().setBold(true);
  titlePara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  
  // Add content
  if (item.type === 'chart' && item.imageBase64) {
    insertDocChartImageInCell(cell, item.imageBase64);
  } else if (item.type === 'table' || item.tableData) {
    insertDocTableInCell(cell, item);
  } else if (item.chartData) {
    const tableData = formatTableData(item);
    insertDocTableDataInCell(cell, tableData);
  }
  
  // Add caption if present
  if (item.caption || item.subtitle) {
    const captionPara = cell.appendParagraph(item.caption || item.subtitle);
    captionPara.setItalic(true);
    captionPara.getChild(0).asText().setFontSize(9);
    captionPara.getChild(0).asText().setForegroundColor('#666666');
    captionPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  }
}

// ============================================================================
// SECTION 4: CHART IMAGE INSERTION
// ============================================================================

/**
 * Insert a chart image into the document body
 * 
 * @param {DocumentApp.Body} body - The document body
 * @param {string} base64Data - Base64 encoded PNG image
 */
function insertDocChartImage(body, base64Data) {
  try {
    // Convert base64 to blob
    const blob = base64ToBlob(base64Data, 'chart.png');
    
    // Insert image
    const image = body.appendImage(blob);
    
    // Set image size (max width ~500 points for letter size with margins)
    const maxWidth = 500;
    const width = image.getWidth();
    const height = image.getHeight();
    
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      image.setWidth(maxWidth);
      image.setHeight(height * ratio);
    }
    
    // Center the image
    const parent = image.getParent();
    if (parent.getType() === DocumentApp.ElementType.PARAGRAPH) {
      parent.asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    }
    
    console.log('📄 DOCS: Inserted chart image');
    
  } catch (error) {
    console.error('📄 DOCS: Error inserting chart image:', error);
    
    // Add error message
    const errorPara = body.appendParagraph('⚠️ Chart image could not be inserted: ' + error.message);
    errorPara.getChild(0).asText().setForegroundColor('#ef4444');
  }
}

/**
 * Insert a chart image into a table cell
 * 
 * @param {DocumentApp.TableCell} cell - The cell
 * @param {string} base64Data - Base64 encoded PNG image
 */
function insertDocChartImageInCell(cell, base64Data) {
  try {
    const blob = base64ToBlob(base64Data, 'chart.png');
    
    // Append paragraph first, then add image to it
    const para = cell.appendParagraph('');
    const image = para.appendInlineImage(blob);
    
    // Resize for cell (smaller for 2-column layout)
    const maxWidth = 250;
    const width = image.getWidth();
    const height = image.getHeight();
    
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      image.setWidth(maxWidth);
      image.setHeight(height * ratio);
    }
    
    para.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
  } catch (error) {
    console.error('📄 DOCS: Error inserting chart in cell:', error);
    cell.appendParagraph('⚠️ Chart could not be inserted');
  }
}

// ============================================================================
// SECTION 5: TABLE INSERTION
// ============================================================================

/**
 * Insert a table into the document body
 * 
 * @param {DocumentApp.Body} body - The document body
 * @param {Object} item - The table item
 */
function insertDocTable(body, item) {
  console.log('📄 DOCS: insertDocTable called with item:', {
    type: item.type,
    hasTableData: !!item.tableData,
    hasData: !!item.data,
    hasChartData: !!item.chartData,
    title: item.title
  });
  
  const tableData = formatTableData(item);
  
  console.log('📄 DOCS: formatTableData returned:', {
    hasHeaders: !!tableData.headers,
    headersLength: tableData.headers ? tableData.headers.length : 0,
    hasRows: !!tableData.rows,
    rowsLength: tableData.rows ? tableData.rows.length : 0,
    headers: tableData.headers,
    firstRow: tableData.rows ? tableData.rows[0] : null
  });
  
  insertDocTableFromData(body, tableData);
}

/**
 * Insert formatted table data into the document body
 * 
 * @param {DocumentApp.Body} body - The document body
 * @param {Object} tableData - Formatted table data {headers, rows, title}
 */
function insertDocTableFromData(body, tableData) {
  const { headers, rows } = tableData;
  
  if (!headers || headers.length === 0) {
    console.warn('📄 DOCS: No table headers found');
    body.appendParagraph('⚠️ No table data available');
    return;
  }
  
  // Limit rows
  const maxRows = 50;
  const displayRows = rows.slice(0, maxRows);
  
  try {
    // Build table data array (headers + rows)
    const tableArray = [headers.map(h => String(h || ''))];
    
    displayRows.forEach(row => {
      const formattedRow = row.map(cell => {
        if (cell === null || cell === undefined) return '';
        if (typeof cell === 'number') {
          if (cell >= 1000) return formatCurrencyForExport(cell);
          if (cell < 1 && cell > 0) return formatPercentageForExport(cell);
          return cell.toLocaleString();
        }
        return String(cell);
      });
      tableArray.push(formattedRow);
    });
    
    // Create table
    const table = body.appendTable(tableArray);
    
    // Style header row
    const headerRow = table.getRow(0);
    for (let i = 0; i < headerRow.getNumCells(); i++) {
      const cell = headerRow.getCell(i);
      cell.setBackgroundColor('#144673');
      cell.getChild(0).asText().setForegroundColor('#ffffff');
      cell.getChild(0).asText().setBold(true);
      cell.getChild(0).asText().setFontSize(10);
    }
    
    // Style data rows with alternating colors
    for (let r = 1; r < table.getNumRows(); r++) {
      const row = table.getRow(r);
      const bgColor = r % 2 === 0 ? '#ffffff' : '#f8f9fa';
      
      for (let c = 0; c < row.getNumCells(); c++) {
        const cell = row.getCell(c);
        cell.setBackgroundColor(bgColor);
        cell.getChild(0).asText().setFontSize(9);
      }
    }
    
    // Add truncation note if needed
    if (rows.length > maxRows) {
      const notePara = body.appendParagraph(`Showing ${maxRows} of ${rows.length} rows`);
      notePara.setItalic(true);
      notePara.getChild(0).asText().setFontSize(8);
      notePara.getChild(0).asText().setForegroundColor('#666666');
    }
    
    console.log(`📄 DOCS: Inserted table with ${tableArray.length} rows`);
    
  } catch (error) {
    console.error('📄 DOCS: Error inserting table:', error);
    body.appendParagraph('⚠️ Table could not be inserted: ' + error.message);
  }
}

/**
 * Insert a table into a table cell
 * 
 * @param {DocumentApp.TableCell} cell - The cell
 * @param {Object} item - The table item
 */
function insertDocTableInCell(cell, item) {
  const tableData = formatTableData(item);
  insertDocTableDataInCell(cell, tableData);
}

/**
 * Insert formatted table data into a table cell
 * Note: Google Docs doesn't support nested tables well, so we use a formatted list
 * 
 * @param {DocumentApp.TableCell} cell - The cell
 * @param {Object} tableData - Formatted table data
 */
function insertDocTableDataInCell(cell, tableData) {
  const { headers, rows } = tableData;
  
  if (!headers || headers.length === 0) {
    cell.appendParagraph('No data available');
    return;
  }
  
  // For nested tables in cells, we'll create a simple formatted list
  // since Google Docs handles nested tables poorly
  
  // Limit to top 10 for readability in side-by-side view
  const displayRows = rows.slice(0, 10);
  
  // Add header as bold text
  const headerText = headers.join(' | ');
  const headerPara = cell.appendParagraph(headerText);
  headerPara.getChild(0).asText().setBold(true);
  headerPara.getChild(0).asText().setFontSize(8);
  headerPara.getChild(0).asText().setForegroundColor('#144673');
  
  // Add separator
  cell.appendParagraph('─'.repeat(30)).getChild(0).asText().setFontSize(6);
  
  // Add rows
  displayRows.forEach(row => {
    const rowText = row.map(cell => {
      if (cell === null || cell === undefined) return '-';
      if (typeof cell === 'number') {
        if (cell >= 1000) return formatCurrencyForExport(cell);
        return cell.toLocaleString();
      }
      return String(cell);
    }).join(' | ');
    
    const rowPara = cell.appendParagraph(rowText);
    rowPara.getChild(0).asText().setFontSize(8);
  });
  
  // Truncation note
  if (rows.length > 10) {
    const note = cell.appendParagraph(`+${rows.length - 10} more rows`);
    note.setItalic(true);
    note.getChild(0).asText().setFontSize(7);
    note.getChild(0).asText().setForegroundColor('#666666');
  }
}

// ============================================================================
// SECTION 6: TEXT ELEMENTS
// ============================================================================

/**
 * Add a title heading to the document
 * 
 * @param {DocumentApp.Body} body - The document body
 * @param {string} title - Title text
 */
function addDocTitle(body, title) {
  const titlePara = body.appendParagraph(title);
  titlePara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  titlePara.getChild(0).asText().setForegroundColor('#144673');
  titlePara.getChild(0).asText().setBold(true);
  titlePara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  titlePara.setSpacingAfter(12);
}

/**
 * Add a caption paragraph to the document
 * 
 * @param {DocumentApp.Body} body - The document body
 * @param {string} caption - Caption text
 */
function addDocCaption(body, caption) {
  const captionPara = body.appendParagraph(caption);
  captionPara.setItalic(true);
  captionPara.getChild(0).asText().setFontSize(9);
  captionPara.getChild(0).asText().setForegroundColor('#666666');
  captionPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  captionPara.setSpacingBefore(8);
}

// ============================================================================
// SECTION 7: TEST FUNCTIONS
// ============================================================================

/**
 * Test docs export with sample data
 */
function testDocsExport() {
  const testData = {
    exportType: 'docs',
    letterhead: 'GSA',
    layoutDensity: 'single',
    reportTitle: 'Test Docs Export',
    items: [
      {
        id: 'test_table_1',
        type: 'table',
        title: 'Top 5 Vendors by Spend',
        caption: 'Source: FY2024 Procurement Data',
        tableData: {
          headers: ['Vendor', 'Total Spend', 'Contracts', '% of Total'],
          rows: [
            ['ABC Corporation', 2500000, 15, '25%'],
            ['XYZ Inc', 1800000, 12, '18%'],
            ['Tech Solutions', 1500000, 8, '15%'],
            ['Global Services', 1200000, 10, '12%'],
            ['Prime Contractors', 1000000, 6, '10%']
          ]
        }
      },
      {
        id: 'test_table_2',
        type: 'table',
        title: 'Spending by Category',
        tableData: {
          headers: ['Category', 'FY2023', 'FY2024', 'Change'],
          rows: [
            ['IT Services', 5000000, 5500000, '+10%'],
            ['Hardware', 3000000, 2800000, '-7%'],
            ['Software', 2500000, 3200000, '+28%'],
            ['Consulting', 1500000, 1600000, '+7%']
          ]
        }
      }
    ]
  };
  
  console.log('🧪 Testing Docs Export...');
  const result = exportToDocs(testData);
  console.log('🧪 Result:', result);
  
  if (result.success) {
    console.log('✅ Test passed! View file at:', result.fileUrl);
  } else {
    console.log('❌ Test failed:', result.error);
  }
  
  return result;
}

/**
 * Test double layout for docs
 */
function testDocsDoubleLayout() {
  const testData = {
    exportType: 'docs',
    letterhead: 'ITVMO',
    layoutDensity: 'double',
    reportTitle: 'Test Double Layout Doc',
    items: [
      {
        id: 'item_1',
        type: 'table',
        title: 'Table 1 - Agencies',
        tableData: {
          headers: ['Agency', 'Spend'],
          rows: [
            ['DOD', 5000000],
            ['VA', 3000000],
            ['HHS', 2500000],
            ['DHS', 2000000],
            ['DOE', 1500000]
          ]
        }
      },
      {
        id: 'item_2',
        type: 'table',
        title: 'Table 2 - Vendors',
        tableData: {
          headers: ['Vendor', 'Amount'],
          rows: [
            ['Vendor A', 1000000],
            ['Vendor B', 800000],
            ['Vendor C', 600000],
            ['Vendor D', 400000]
          ]
        }
      },
      {
        id: 'item_3',
        type: 'table',
        title: 'Table 3 - Solo Item',
        tableData: {
          headers: ['Category', 'Count'],
          rows: [
            ['Type X', 50],
            ['Type Y', 30],
            ['Type Z', 20]
          ]
        }
      }
    ]
  };
  
  console.log('🧪 Testing Docs Double Layout...');
  const result = exportToDocs(testData);
  console.log('🧪 Result:', result);
  return result;
}