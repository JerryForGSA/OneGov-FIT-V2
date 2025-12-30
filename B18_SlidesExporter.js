/**
 * @fileoverview Slides Exporter for OneGov FIT Report Builder
 * @module B18_SlidesExporter
 * @version 1.0.0
 * @description Handles exporting charts and tables to Google Slides.
 *              Clones template, inserts chart images and native tables.
 * @author OneGov FIT Market Development Team
 * @created 2024-12-23
 */

// ============================================================================
// SECTION 1: MAIN SLIDES EXPORT FUNCTION
// ============================================================================

/**
 * Export items to Google Slides
 * Called from B15_ExportManager.exportReportBuilder()
 * 
 * @param {Object} exportData - Export manifest
 * @param {string} exportData.letterhead - 'GSA' | 'ITVMO'
 * @param {string} exportData.layoutDensity - 'single' | 'double'
 * @param {Array} exportData.items - Array of chart/table items
 * @param {string} exportData.reportTitle - Optional title
 * @returns {Object} Result with success status and file URL
 */
function exportToSlides(exportData) {
  try {
    const { letterhead, layoutDensity, items, reportTitle } = exportData;
    
    console.log('📊 SLIDES EXPORT: Starting', {
      letterhead,
      layoutDensity,
      itemCount: items.length
    });
    
    // Step 1: Clone the template
    const templateId = EXPORT_CONFIG.templates.slides[letterhead];
    const filename = generateExportFilename('slides', letterhead, reportTitle);
    const cloned = cloneTemplate(templateId, filename, 'slides');
    
    // Step 2: Open the cloned presentation
    const presentation = SlidesApp.openById(cloned.id);
    const slides = presentation.getSlides();
    
    // Check available layouts
    const layouts = presentation.getLayouts();
    console.log(`📊 SLIDES: Template has ${slides.length} slides and ${layouts.length} layouts`);
    console.log(`📊 SLIDES: Available layouts:`, layouts.map((layout, i) => `${i}: ${layout.getObjectId()}`));
    
    // Step 3: Determine layout strategy
    const isDouble = layoutDensity === 'double';
    
    // Step 4: Process items and create slides
    if (isDouble) {
      // Pair items together (2 per slide)
      processItemsDouble(presentation, items);
    } else {
      // One item per slide
      processItemsSingle(presentation, items);
    }
    
    // Step 5: Clean up - remove any template placeholder slides if needed
    // (Skip first slide if it's a title/template slide the user wants to keep)
    
    // Save changes
    presentation.saveAndClose();
    
    console.log('📊 SLIDES EXPORT: Complete', cloned.url);
    
    return {
      success: true,
      fileId: cloned.id,
      fileUrl: cloned.url,
      fileName: filename,
      message: `Successfully exported ${items.length} items to Google Slides`
    };
    
  } catch (error) {
    console.error('📊 SLIDES EXPORT ERROR:', error);
    return { success: false, error: error.toString() };
  }
}

// ============================================================================
// SECTION 2: SINGLE ITEM PER SLIDE PROCESSING
// ============================================================================

/**
 * Process items with one item per slide
 * 
 * @param {SlidesApp.Presentation} presentation - The presentation to add slides to
 * @param {Array} items - Array of items to add
 */
function processItemsSingle(presentation, items) {
  items.forEach((item, index) => {
    console.log(`📊 SLIDES: Processing item ${index + 1}/${items.length}: ${item.title}`);
    
    // Create a new slide using the first available layout from the template
    const layouts = presentation.getLayouts();
    if (layouts.length === 0) {
      throw new Error('No layouts available in template');
    }
    const slide = presentation.appendSlide(layouts[0]);
    
    // Add title at top
    addSlideTitle(slide, item.title || `Item ${index + 1}`);
    
    // Add content based on type
    if (item.type === 'chart' && item.imageBase64) {
      // Insert chart as image
      insertChartImage(slide, item.imageBase64, 'single');
    } else if (item.type === 'table' || item.tableData) {
      // Insert as native table
      insertSlideTable(slide, item, 'single');
    } else if (item.chartData) {
      // Has chart data but no image - create a data table instead
      const tableData = formatTableData(item);
      insertSlideTableFromData(slide, tableData, 'single');
    }
    
    // Add caption/subtitle if present
    if (item.caption || item.subtitle) {
      addSlideCaption(slide, item.caption || item.subtitle);
    }
  });
}

// ============================================================================
// SECTION 3: DOUBLE ITEM PER SLIDE PROCESSING
// ============================================================================

/**
 * Process items with two items per slide
 * 
 * @param {SlidesApp.Presentation} presentation - The presentation to add slides to
 * @param {Array} items - Array of items to add
 */
function processItemsDouble(presentation, items) {
  // Process items in pairs
  for (let i = 0; i < items.length; i += 2) {
    const leftItem = items[i];
    const rightItem = items[i + 1]; // May be undefined for odd count
    
    console.log(`📊 SLIDES: Processing pair ${Math.floor(i/2) + 1}: ${leftItem.title}${rightItem ? ' + ' + rightItem.title : ' (single)'}`);
    
    // Create a new slide using the first available layout from the template
    const layouts = presentation.getLayouts();
    if (layouts.length === 0) {
      throw new Error('No layouts available in template');
    }
    const slide = presentation.appendSlide(layouts[0]);
    
    // Add left item
    addItemToSlide(slide, leftItem, 'left');
    
    // Add right item if exists
    if (rightItem) {
      addItemToSlide(slide, rightItem, 'right');
    }
  }
}

/**
 * Add a single item to a specific position on a slide
 * 
 * @param {SlidesApp.Slide} slide - The slide to add to
 * @param {Object} item - The item to add
 * @param {string} position - 'left' | 'right' | 'full'
 */
function addItemToSlide(slide, item, position) {
  // Calculate position based on left/right
  const slideWidth = 720; // points (10 inches at 72 dpi)
  const slideHeight = 540; // points (7.5 inches at 72 dpi)
  const margin = 20;
  const titleHeight = 40;
  
  let x, y, width, height;
  
  if (position === 'left') {
    x = margin;
    y = margin;
    width = (slideWidth / 2) - (margin * 1.5);
    height = slideHeight - (margin * 2);
  } else if (position === 'right') {
    x = (slideWidth / 2) + (margin / 2);
    y = margin;
    width = (slideWidth / 2) - (margin * 1.5);
    height = slideHeight - (margin * 2);
  } else {
    x = margin;
    y = margin;
    width = slideWidth - (margin * 2);
    height = slideHeight - (margin * 2);
  }
  
  // Add title
  const titleBox = slide.insertTextBox(item.title || 'Untitled', x, y, width, titleHeight);
  titleBox.getText().getTextStyle()
    .setFontSize(14)
    .setBold(true)
    .setForegroundColor('#144673');
  
  // Adjust content area
  const contentY = y + titleHeight + 10;
  const contentHeight = height - titleHeight - 20;
  
  // Add content
  if (item.type === 'chart' && item.imageBase64) {
    insertChartImageAtPosition(slide, item.imageBase64, x, contentY, width, contentHeight);
  } else if (item.type === 'table' || item.tableData) {
    insertSlideTableAtPosition(slide, item, x, contentY, width, contentHeight);
  } else if (item.chartData) {
    const tableData = formatTableData(item);
    insertSlideTableDataAtPosition(slide, tableData, x, contentY, width, contentHeight);
  }
}

// ============================================================================
// SECTION 4: CHART IMAGE INSERTION
// ============================================================================

/**
 * Insert a chart image onto a slide (single layout - centered)
 * 
 * @param {SlidesApp.Slide} slide - The slide to add to
 * @param {string} base64Data - Base64 encoded PNG image
 * @param {string} layout - 'single' or 'double'
 */
function insertChartImage(slide, base64Data, layout) {
  const slideWidth = 720;
  const slideHeight = 540;
  const margin = 40;
  const titleSpace = 60;
  const captionSpace = 40;
  
  // Calculate dimensions for centered chart
  const maxWidth = slideWidth - (margin * 2);
  const maxHeight = slideHeight - titleSpace - captionSpace - (margin * 2);
  
  // Maintain aspect ratio (assuming 800x500 source)
  const aspectRatio = 800 / 500;
  let width = maxWidth;
  let height = width / aspectRatio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  // Center horizontally
  const x = (slideWidth - width) / 2;
  const y = titleSpace + margin;
  
  insertChartImageAtPosition(slide, base64Data, x, y, width, height);
}

/**
 * Insert a chart image at a specific position
 * 
 * @param {SlidesApp.Slide} slide - The slide
 * @param {string} base64Data - Base64 encoded image
 * @param {number} x - X position in points
 * @param {number} y - Y position in points
 * @param {number} width - Width in points
 * @param {number} height - Height in points
 */
function insertChartImageAtPosition(slide, base64Data, x, y, width, height) {
  try {
    // Convert base64 to blob
    const blob = base64ToBlob(base64Data, 'chart.png');
    
    // Insert image
    const image = slide.insertImage(blob, x, y, width, height);
    
    console.log(`📊 SLIDES: Inserted chart image at (${x}, ${y}) size ${width}x${height}`);
    
    return image;
  } catch (error) {
    console.error('📊 SLIDES: Error inserting chart image:', error);
    
    // Insert placeholder text if image fails
    const placeholder = slide.insertTextBox(
      '⚠️ Chart image could not be inserted',
      x, y, width, height
    );
    placeholder.getText().getTextStyle().setForegroundColor('#ef4444');
    
    return placeholder;
  }
}

// ============================================================================
// SECTION 5: TABLE INSERTION
// ============================================================================

/**
 * Insert a table onto a slide (single layout)
 * 
 * @param {SlidesApp.Slide} slide - The slide
 * @param {Object} item - The table item
 * @param {string} layout - 'single' or 'double'
 */
function insertSlideTable(slide, item, layout) {
  const slideWidth = 720;
  const slideHeight = 540;
  const margin = 40;
  const titleSpace = 60;
  
  const x = margin;
  const y = titleSpace + 20;
  const width = slideWidth - (margin * 2);
  const height = slideHeight - titleSpace - margin - 40;
  
  insertSlideTableAtPosition(slide, item, x, y, width, height);
}

/**
 * Insert a table at a specific position
 * 
 * @param {SlidesApp.Slide} slide - The slide
 * @param {Object} item - The table item
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Available width
 * @param {number} height - Available height
 */
function insertSlideTableAtPosition(slide, item, x, y, width, height) {
  const tableData = formatTableData(item);
  insertSlideTableDataAtPosition(slide, tableData, x, y, width, height);
}

/**
 * Insert formatted table data at a specific position
 * 
 * @param {SlidesApp.Slide} slide - The slide
 * @param {Object} tableData - Formatted table data {headers, rows}
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Available width
 * @param {number} height - Available height
 */
function insertSlideTableDataAtPosition(slide, tableData, x, y, width, height) {
  const { headers, rows } = tableData;
  
  if (!headers || headers.length === 0) {
    console.warn('📊 SLIDES: No table headers found');
    return;
  }
  
  // Limit rows to fit on slide (max ~15 rows typically)
  const maxRows = Math.min(rows.length, 15);
  const displayRows = rows.slice(0, maxRows);
  
  const numRows = displayRows.length + 1; // +1 for header
  const numCols = headers.length;
  
  try {
    // Create table
    const table = slide.insertTable(numRows, numCols, x, y, width, Math.min(height, numRows * 25));
    
    // Style header row
    for (let col = 0; col < numCols; col++) {
      const cell = table.getCell(0, col);
      cell.getText().setText(String(headers[col] || ''));
      cell.getText().getTextStyle()
        .setFontSize(10)
        .setBold(true)
        .setForegroundColor('#ffffff');
      cell.getFill().setSolidFill('#144673');
    }
    
    // Populate data rows
    for (let row = 0; row < displayRows.length; row++) {
      const rowData = displayRows[row];
      const isEvenRow = row % 2 === 0;
      
      for (let col = 0; col < numCols; col++) {
        const cell = table.getCell(row + 1, col);
        const value = rowData[col];
        
        // Format value
        let displayValue = value;
        if (typeof value === 'number') {
          if (value >= 1000) {
            displayValue = formatCurrencyForExport(value);
          } else if (value < 1 && value > 0) {
            displayValue = formatPercentageForExport(value);
          } else {
            displayValue = value.toLocaleString();
          }
        }
        
        cell.getText().setText(String(displayValue || ''));
        cell.getText().getTextStyle()
          .setFontSize(9)
          .setForegroundColor('#333333');
        
        // Alternating row colors
        if (isEvenRow) {
          cell.getFill().setSolidFill('#f8f9fa');
        } else {
          cell.getFill().setSolidFill('#ffffff');
        }
      }
    }
    
    // Add note if rows were truncated
    if (rows.length > maxRows) {
      const noteY = y + (numRows * 25) + 10;
      const note = slide.insertTextBox(
        `Showing ${maxRows} of ${rows.length} rows`,
        x, noteY, width, 20
      );
      note.getText().getTextStyle()
        .setFontSize(8)
        .setItalic(true)
        .setForegroundColor('#666666');
    }
    
    console.log(`📊 SLIDES: Inserted table with ${numRows} rows x ${numCols} cols`);
    
  } catch (error) {
    console.error('📊 SLIDES: Error inserting table:', error);
    
    // Insert error message
    const errorBox = slide.insertTextBox(
      `⚠️ Table could not be inserted: ${error.message}`,
      x, y, width, 40
    );
    errorBox.getText().getTextStyle().setForegroundColor('#ef4444');
  }
}

// ============================================================================
// SECTION 6: SLIDE TEXT ELEMENTS
// ============================================================================

/**
 * Add a title to a slide
 * 
 * @param {SlidesApp.Slide} slide - The slide
 * @param {string} title - Title text
 */
function addSlideTitle(slide, title) {
  const slideWidth = 720;
  const margin = 40;
  
  const titleBox = slide.insertTextBox(title, margin, 20, slideWidth - (margin * 2), 40);
  titleBox.getText().getTextStyle()
    .setFontSize(18)
    .setBold(true)
    .setForegroundColor('#144673');
  
  titleBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

/**
 * Add a caption to a slide
 * 
 * @param {SlidesApp.Slide} slide - The slide
 * @param {string} caption - Caption text
 */
function addSlideCaption(slide, caption) {
  const slideWidth = 720;
  const slideHeight = 540;
  const margin = 40;
  
  const captionBox = slide.insertTextBox(caption, margin, slideHeight - 50, slideWidth - (margin * 2), 30);
  captionBox.getText().getTextStyle()
    .setFontSize(9)
    .setItalic(true)
    .setForegroundColor('#666666');
  
  captionBox.getText().getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
}

// ============================================================================
// SECTION 7: TEST FUNCTIONS
// ============================================================================

/**
 * Test slides export with sample data
 */
function testSlidesExport() {
  const testData = {
    exportType: 'slides',
    letterhead: 'GSA',
    layoutDensity: 'single',
    reportTitle: 'Test Slides Export',
    items: [
      {
        id: 'test_table_1',
        type: 'table',
        title: 'Top 5 Vendors by Spend',
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
  
  console.log('🧪 Testing Slides Export...');
  const result = exportToSlides(testData);
  console.log('🧪 Result:', result);
  
  if (result.success) {
    console.log('✅ Test passed! View file at:', result.fileUrl);
  } else {
    console.log('❌ Test failed:', result.error);
  }
  
  return result;
}

/**
 * Test double layout
 */
function testSlidesDoubleLayout() {
  const testData = {
    exportType: 'slides',
    letterhead: 'ITVMO',
    layoutDensity: 'double',
    reportTitle: 'Test Double Layout',
    items: [
      {
        id: 'item_1',
        type: 'table',
        title: 'Table 1',
        tableData: {
          headers: ['Name', 'Value'],
          rows: [['A', 100], ['B', 200], ['C', 300]]
        }
      },
      {
        id: 'item_2',
        type: 'table',
        title: 'Table 2',
        tableData: {
          headers: ['Category', 'Amount'],
          rows: [['X', 500], ['Y', 400], ['Z', 300]]
        }
      },
      {
        id: 'item_3',
        type: 'table',
        title: 'Table 3 (Odd item)',
        tableData: {
          headers: ['Item', 'Count'],
          rows: [['One', 1], ['Two', 2]]
        }
      }
    ]
  };
  
  console.log('🧪 Testing Slides Double Layout...');
  const result = exportToSlides(testData);
  console.log('🧪 Result:', result);
  return result;
}