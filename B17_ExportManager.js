/**
 * @fileoverview Export Manager for OneGov FIT Report Builder
 * @module B17_ExportManager
 * @version 1.0.0
 * @description Main orchestration for exporting charts/tables to Google Docs, Slides, and Sheets.
 *              Handles template cloning, receives chart images from frontend, routes to specific exporters.
 * @author OneGov FIT Market Development Team
 * @created 2024-12-23
 */

// ============================================================================
// SECTION 1: CONFIGURATION
// ============================================================================

/**
 * Export Configuration - Template IDs and Settings
 * Templates are stored in the same Drive folder as Entity Profile templates
 */
const EXPORT_CONFIG = {
  templates: {
    slides: {
      GSA: '11VRtDnCU-9YUZwoSEMwPH-d12pLB8qcfH_KRux7upH8',
      ITVMO: '1zKWEFczvLWuJmGKSk5-d8130hgwrTscyQ_4eNRZTkl8' // Correct ITVMO template URL provided by user
    },
    docs: {
      GSA: '1Mv1hqr4TmOCwUR9Tb4SVR-vM2R2h689qnIztuoltQIo',
      ITVMO: '1mnD4ui4yP5fBhJWJvymPLrNg5Ewd7iVHms1yC2Zpbks'
    },
    sheets: {
      GSA: '1NKV1V0mCsTNjrVzjsn8qoNn7LG2RtSyYTalOTRL7bf8',
      ITVMO: '1NKV1V0mCsTNjrVzjsn8qoNn7LG2RtSyYTalOTRL7bf8' // Same template for both
    }
  },
  
  // Output folder - same as Entity Profiles
  outputFolderId: '1A_fhTfEHgqFEiwCs3Lp3rl6LjPBqrcjB', // Update if different
  
  // Chart image settings
  chartImageWidth: 800,
  chartImageHeight: 500
};

// ============================================================================
// SECTION 2: MAIN EXPORT FUNCTIONS (Called from Frontend)
// ============================================================================

/**
 * Main export function - routes to appropriate exporter
 * Called from frontend via google.script.run
 * 
 * @param {Object} exportData - Export manifest from frontend
 * @param {string} exportData.exportType - 'slides' | 'docs' | 'sheets'
 * @param {string} exportData.letterhead - 'GSA' | 'ITVMO'
 * @param {string} exportData.layoutDensity - 'single' | 'double' (not used for sheets)
 * @param {Array} exportData.items - Array of items to export
 * @param {string} exportData.reportTitle - Optional title for the export
 * @returns {Object} Result with success status and file URL
 */
function exportReportBuilder(exportData) {
  try {
    console.log('🚀 EXPORT: exportReportBuilder function called!');
    console.log('📤 EXPORT: Starting export', {
      type: exportData.exportType,
      letterhead: exportData.letterhead,
      itemCount: exportData.items?.length || 0
    });
    console.log('📤 EXPORT: Full exportData:', exportData);
    
    // Validate inputs
    if (!exportData.items || exportData.items.length === 0) {
      return { success: false, error: 'No items selected for export' };
    }
    
    if (!exportData.exportType) {
      return { success: false, error: 'Export type not specified' };
    }
    
    if (!exportData.letterhead || !['GSA', 'ITVMO'].includes(exportData.letterhead)) {
      return { success: false, error: 'Invalid letterhead. Must be GSA or ITVMO' };
    }
    
    // Route to appropriate exporter
    let result;
    switch (exportData.exportType.toLowerCase()) {
      case 'slides':
        result = exportToSlides(exportData);
        break;
      case 'docs':
        result = exportToDocs(exportData);
        break;
      case 'sheets':
        result = exportToSheets(exportData);
        break;
      default:
        return { success: false, error: `Unknown export type: ${exportData.exportType}` };
    }
    
    console.log('📤 EXPORT: Complete', result);
    return result;
    
  } catch (error) {
    console.error('📤 EXPORT ERROR:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Get available export options for the modal
 * @returns {Object} Configuration for export modal
 */
function getExportOptions() {
  return {
    exportTypes: [
      { id: 'slides', name: 'Google Slides', icon: '📊' },
      { id: 'docs', name: 'Google Docs', icon: '📄' },
      { id: 'sheets', name: 'Google Sheets', icon: '📋' }
    ],
    letterheads: [
      { id: 'GSA', name: 'GSA Letterhead' },
      { id: 'ITVMO', name: 'ITVMO Letterhead' }
    ],
    layoutOptions: [
      { id: 'single', name: '1 item per page' },
      { id: 'double', name: '2 items per page' }
    ]
  };
}

// ============================================================================
// SECTION 3: TEMPLATE MANAGEMENT
// ============================================================================

/**
 * Clone a template file and move to output folder
 * Supports both regular Drive and Shared Drives
 * 
 * @param {string} templateId - Google Drive file ID of template
 * @param {string} newName - Name for the cloned file
 * @param {string} fileType - 'slides' | 'docs' | 'sheets'
 * @returns {Object} The cloned file info {file, id, url}
 */
function cloneTemplate(templateId, newName, fileType) {
  try {
    console.log(`📋 TEMPLATE: Attempting to clone template ID: ${templateId}`);
    console.log(`📋 TEMPLATE: New file name: ${newName}`);
    console.log(`📋 TEMPLATE: File type: ${fileType}`);
    
    // First verify template exists
    let templateFile;
    try {
      templateFile = DriveApp.getFileById(templateId);
      console.log(`📋 TEMPLATE: Template file found: "${templateFile.getName()}"`);
    } catch (e) {
      throw new Error(`Template file not found: ${templateId}`);
    }
    
    // Try using Drive API v3 for Shared Drive support
    let copyId;
    try {
      const copy = Drive.Files.copy(
        { name: newName },
        templateId,
        { supportsAllDrives: true }
      );
      copyId = copy.id;
      console.log(`📋 TEMPLATE: Successfully copied via Drive API: ${copyId}`);
    } catch (driveApiError) {
      console.log(`📋 TEMPLATE: Drive API failed, trying DriveApp.makeCopy...`);
      
      // Fallback to regular DriveApp
      try {
        const copy = templateFile.makeCopy(newName);
        copyId = copy.getId();
        console.log(`📋 TEMPLATE: Successfully copied via DriveApp: ${copyId}`);
      } catch (makeCopyError) {
        throw new Error(`Cannot copy template: ${makeCopyError.message}`);
      }
    }
    
    // Try to move to output folder
    try {
      const outputFolder = DriveApp.getFolderById(EXPORT_CONFIG.outputFolderId);
      const newFile = DriveApp.getFileById(copyId);
      newFile.moveTo(outputFolder);
      console.log(`📋 TEMPLATE: Moved to output folder`);
    } catch (moveError) {
      console.warn(`📋 TEMPLATE: Could not move to output folder (file remains in place): ${moveError.message}`);
    }
    
    // Build URL based on file type
    let url;
    switch (fileType) {
      case 'slides':
        url = `https://docs.google.com/presentation/d/${copyId}/edit`;
        break;
      case 'sheets':
        url = `https://docs.google.com/spreadsheets/d/${copyId}/edit`;
        break;
      case 'docs':
      default:
        url = `https://docs.google.com/document/d/${copyId}/edit`;
        break;
    }
    
    console.log(`📋 TEMPLATE: Clone complete: ${url}`);
    
    return {
      file: DriveApp.getFileById(copyId),
      id: copyId,
      url: url
    };
    
  } catch (error) {
    console.error(`📋 TEMPLATE ERROR: ${error.message}`);
    throw new Error(`Failed to clone template: ${error.message}`);
  }
}

/**
 * Generate a filename for the export
 * 
 * @param {string} exportType - slides/docs/sheets
 * @param {string} letterhead - GSA/ITVMO
 * @param {string} reportTitle - Optional custom title
 * @returns {string} Generated filename
 */
function generateExportFilename(exportType, letterhead, reportTitle) {
  const date = new Date();
  const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  
  const title = reportTitle || 'Report Builder Export';
  const typeLabel = {
    slides: 'Slides',
    docs: 'Doc',
    sheets: 'Sheet'
  }[exportType] || 'Export';
  
  return `${title} - ${letterhead} ${typeLabel} - ${dateStr}`;
}

// ============================================================================
// SECTION 4: IMAGE HANDLING
// ============================================================================

/**
 * Convert base64 image data to a Blob
 * 
 * @param {string} base64Data - Base64 encoded image (may include data URI prefix)
 * @param {string} filename - Name for the blob
 * @returns {Blob} Image blob
 */
function base64ToBlob(base64Data, filename) {
  // Remove data URI prefix if present
  let cleanBase64 = base64Data;
  if (base64Data.includes(',')) {
    cleanBase64 = base64Data.split(',')[1];
  }
  
  // Decode and create blob
  const decoded = Utilities.base64Decode(cleanBase64);
  const blob = Utilities.newBlob(decoded, 'image/png', filename || 'chart.png');
  
  return blob;
}

/**
 * Save an image blob to Drive (for debugging or reference)
 * 
 * @param {Blob} imageBlob - Image blob to save
 * @param {string} filename - Filename
 * @returns {Object} Saved file info
 */
function saveImageToDrive(imageBlob, filename) {
  try {
    const folder = DriveApp.getFolderById(EXPORT_CONFIG.outputFolderId);
    const file = folder.createFile(imageBlob);
    file.setName(filename);
    
    return {
      success: true,
      id: file.getId(),
      url: file.getUrl()
    };
  } catch (error) {
    console.error('Image save error:', error);
    return { success: false, error: error.toString() };
  }
}

// ============================================================================
// SECTION 5: TABLE DATA FORMATTING
// ============================================================================

/**
 * Format table data for export
 * Ensures consistent structure regardless of source
 * 
 * @param {Object} tableCard - Table card from Report Builder
 * @returns {Object} Formatted table data with headers and rows
 */
function formatTableData(tableCard) {
  // If already has tableData structure, use it
  if (tableCard.tableData) {
    return {
      headers: tableCard.tableData.headers || [],
      rows: tableCard.tableData.rows || [],
      title: tableCard.title || 'Table'
    };
  }
  
  // If has raw data array (first row is headers)
  if (tableCard.data && Array.isArray(tableCard.data)) {
    return {
      headers: tableCard.data[0] || [],
      rows: tableCard.data.slice(1) || [],
      title: tableCard.title || 'Table'
    };
  }
  
  // If has chartData with labels/datasets (convert chart data to table)
  if (tableCard.chartData) {
    const labels = tableCard.chartData.labels || [];
    const datasets = tableCard.chartData.datasets || [];
    
    // Build headers: first column is labels, then dataset labels
    const headers = ['Category', ...datasets.map(ds => ds.label || 'Value')];
    
    // Build rows
    const rows = labels.map((label, i) => {
      return [label, ...datasets.map(ds => ds.data[i] || 0)];
    });
    
    return {
      headers,
      rows,
      title: tableCard.title || 'Chart Data'
    };
  }
  
  console.warn('Unknown table format:', tableCard);
  return { headers: [], rows: [], title: 'Unknown' };
}

// ============================================================================
// SECTION 6: UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency value for display
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency string
 */
function formatCurrencyForExport(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  const num = Number(value);
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return '$' + (num / 1e3).toFixed(1) + 'K';
  return '$' + num.toFixed(0);
}

/**
 * Format percentage for display
 * @param {number} value - Numeric value (0-100 or 0-1)
 * @returns {string} Formatted percentage string
 */
function formatPercentageForExport(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  // If value is between 0 and 1, multiply by 100
  const pct = value <= 1 && value >= 0 ? value * 100 : value;
  return pct.toFixed(1) + '%';
}

/**
 * Test function to verify export configuration
 */
function testExportConfig() {
  console.log('🧪 Testing Export Configuration...');
  
  // Test template access
  const templateTypes = ['slides', 'docs', 'sheets'];
  const letterheads = ['GSA', 'ITVMO'];
  
  for (const type of templateTypes) {
    for (const lh of letterheads) {
      const templateId = EXPORT_CONFIG.templates[type][lh];
      try {
        console.log(`🔍 Testing ${type}/${lh}: ${templateId}`);
        const file = DriveApp.getFileById(templateId);
        console.log(`✅ ${type}/${lh}: "${file.getName()}" accessible`);
        
        // Check sharing settings
        const sharing = file.getSharingAccess();
        const permission = file.getSharingPermission();
        console.log(`📋 ${type}/${lh}: Sharing - ${sharing}, Permission - ${permission}`);
        
        // Try to actually clone it to test full permissions
        const testName = `TEST_${type}_${lh}_${Date.now()}`;
        const cloned = cloneTemplate(templateId, testName, type);
        console.log(`✅ ${type}/${lh}: Template clone successful - ${cloned.url}`);
        
        // Clean up test file
        try {
          DriveApp.getFileById(cloned.id).setTrashed(true);
          console.log(`🗑️ ${type}/${lh}: Test file cleaned up`);
        } catch (cleanupError) {
          console.log(`⚠️ ${type}/${lh}: Could not clean up test file: ${cleanupError.message}`);
        }
        
      } catch (e) {
        console.log(`❌ ${type}/${lh}: Template ID ${templateId} - ${e.message}`);
        
        // Provide specific guidance based on error
        if (e.message.includes('No item with the given ID could be found')) {
          console.log(`🚨 ${type}/${lh}: SOLUTION: Template file doesn't exist or wrong ID`);
          console.log(`📋 ${type}/${lh}: Check template URL: https://docs.google.com/document/d/${templateId} (for docs)`);
          console.log(`📋 ${type}/${lh}: Check template URL: https://docs.google.com/presentation/d/${templateId} (for slides)`);
        } else if (e.message.includes('permission') || e.message.includes('access')) {
          console.log(`🚨 ${type}/${lh}: SOLUTION: Share template with script owner or make public`);
        }
      }
    }
  }
  
  // Test output folder
  try {
    const folder = DriveApp.getFolderById(EXPORT_CONFIG.outputFolderId);
    console.log(`✅ Output folder: "${folder.getName()}" accessible`);
  } catch (e) {
    console.log(`❌ Output folder: ${e.message}`);
  }
  
  console.log('🧪 Export Configuration Test Complete');
}

/**
 * Quick template verification - just check if they exist
 */
function verifyTemplateAccess() {
  console.log('🔍 Quick Template Verification...');
  
  const templates = {
    'GSA Docs': '1Mv1hqr4TmOCwUR9Tb4SVR-vM2R2h689qnIztuoltQIo',
    'ITVMO Docs': '1mnD4ui4yP5fBhJWJvymPLrNg5Ewd7iVHms1yC2Zpbks', 
    'GSA Slides': '11VRtDnCU-9YUZwoSEMwPH-d12pLB8qcfH_KRux7upH8',
    'ITVMO Slides': '1zKWEFczvLWuJmGKSk5-d8130hgwrTscyQ_4eNRZTkl8',
    'GSA Sheets': '1NKV1V0mCsTNjrVzjsn8qoNn7LG2RtSyYTalOTRL7bf8',
    'ITVMO Sheets': '1NKV1V0mCsTNjrVzjsn8qoNn7LG2RtSyYTalOTRL7bf8'
  };
  
  for (const [name, id] of Object.entries(templates)) {
    try {
      const file = DriveApp.getFileById(id);
      console.log(`✅ ${name}: "${file.getName()}" - ACCESSIBLE`);
    } catch (e) {
      console.log(`❌ ${name}: ${id} - ${e.message}`);
      console.log(`🔗 Check URL: https://drive.google.com/file/d/${id}/view`);
    }
  }
}

/**
 * Simple test to verify exportReportBuilder function exists
 */
function testExportFunction() {
  console.log('🧪 Testing if exportReportBuilder function exists...');
  console.log('🧪 exportReportBuilder type:', typeof exportReportBuilder);
  
  if (typeof exportReportBuilder === 'function') {
    console.log('✅ exportReportBuilder function is accessible!');
    return true;
  } else {
    console.log('❌ exportReportBuilder function is not accessible!');
    return false;
  }
}

/**
 * Quick template ID check - specific for Slides permission error
 */
function checkSlidesTemplates() {
  console.log('🧪 Checking Slides template access specifically...');
  
  const slidesTemplates = {
    GSA: '11VRtDnCU-9YUZwoSEMwPH-d12pLB8qcfH_KRux7upH8',
    ITVMO: '1zKWEFczvLWuJmGKSk5-d8130hgwrTscyQ_4eNRZTkl8' // Correct ITVMO template
  };
  
  // First test OAuth permissions
  try {
    console.log('🔑 Testing OAuth permissions for SlidesApp...');
    const testPresentation = SlidesApp.create('OAuth Test - Will Delete');
    console.log('✅ SlidesApp.create permission granted');
    DriveApp.getFileById(testPresentation.getId()).setTrashed(true);
    console.log('🗑️ Test presentation cleaned up');
  } catch (oauthError) {
    console.log(`❌ OAuth Error: ${oauthError.message}`);
    console.log('🚨 The script needs to be re-authorized with Slides permissions!');
    console.log('📋 To fix: Go to Extensions > Apps Script > Run any function > Grant permissions');
    return;
  }
  
  for (const [letterhead, templateId] of Object.entries(slidesTemplates)) {
    try {
      console.log(`🔍 Testing ${letterhead} Slides template: ${templateId}`);
      const file = DriveApp.getFileById(templateId);
      console.log(`✅ ${letterhead}: "${file.getName()}" - accessible`);
      
      // Try to clone it
      const testClone = cloneTemplate(templateId, `TEST_SLIDES_${letterhead}_${Date.now()}`, 'slides');
      console.log(`✅ ${letterhead}: Clone successful - ${testClone.url}`);
      
      // Clean up
      try {
        DriveApp.getFileById(testClone.id).setTrashed(true);
        console.log(`🗑️ ${letterhead}: Test file cleaned up`);
      } catch (cleanupError) {
        console.log(`⚠️ ${letterhead}: Could not clean up: ${cleanupError.message}`);
      }
      
    } catch (error) {
      console.log(`❌ ${letterhead} Slides template ERROR: ${error.message}`);
      
      // Try to get more info about the error
      if (error.message.includes('No item with the given ID could be found')) {
        console.log(`🚨 ${letterhead}: Template ID does not exist or is not shared properly`);
      } else if (error.message.includes('permission')) {
        console.log(`🚨 ${letterhead}: Permission error - template may need to be shared with 'Anyone with the link can view'`);
      }
    }
  }
}

/**
 * Test template cloning specifically
 */
function testTemplateCloning() {
  console.log('🧪 Testing Template Cloning Process...');
  
  // Test cloning each template type
  const tests = [
    { type: 'docs', letterhead: 'GSA', id: EXPORT_CONFIG.templates.docs.GSA },
    { type: 'slides', letterhead: 'ITVMO', id: EXPORT_CONFIG.templates.slides.ITVMO }
  ];
  
  for (const test of tests) {
    console.log(`\n🔍 Testing ${test.type}/${test.letterhead}...`);
    try {
      const result = cloneTemplate(test.id, `TEST_CLONE_${test.type}_${test.letterhead}_${Date.now()}`, test.type);
      console.log(`✅ Clone successful: ${result.url}`);
      
      // Clean up
      try {
        DriveApp.getFileById(result.id).setTrashed(true);
        console.log(`🗑️ Test file cleaned up`);
      } catch (cleanupError) {
        console.warn(`⚠️ Could not clean up: ${cleanupError.message}`);
      }
      
    } catch (error) {
      console.error(`❌ Clone failed: ${error.message}`);
    }
  }
}

/**
 * Test export with sample data
 */
function testExportWithSampleData() {
  const sampleExport = {
    exportType: 'sheets',
    letterhead: 'GSA',
    layoutDensity: 'single',
    reportTitle: 'Test Export',
    items: [
      {
        id: 'test_chart_1',
        type: 'chart',
        title: 'Test Chart',
        imageBase64: null, // Would be populated from frontend
        chartData: {
          labels: ['Category A', 'Category B', 'Category C'],
          datasets: [{
            label: 'Values',
            data: [100, 200, 150]
          }]
        }
      },
      {
        id: 'test_table_1',
        type: 'table',
        title: 'Test Table',
        tableData: {
          headers: ['Name', 'Amount', 'Percentage'],
          rows: [
            ['Item 1', '$1,000', '25%'],
            ['Item 2', '$2,000', '50%'],
            ['Item 3', '$1,000', '25%']
          ]
        }
      }
    ]
  };
  
  console.log('🧪 Testing export with sample data...');
  const result = exportReportBuilder(sampleExport);
  console.log('🧪 Result:', result);
  return result;
}