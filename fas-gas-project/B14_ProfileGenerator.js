/**
 * ============================================================================
 * B14_ProfileGenerator.gs - Entity Profile Document Generator
 * ============================================================================
 * 
 * OneGov FIT Market - Entity Profile Generation System
 * Version: 2.0.0
 * Last Updated: 2025-12-07
 * 
 * PURPOSE:
 * Generates Entity Profile documents from Entity Detail views using
 * Google Doc templates with placeholder replacement.
 * 
 * SUPPORTED PROFILE TYPES:
 * - Entity Profile (1-Page Profile)
 * 
 * DATA SOURCES (JSON Columns):
 * - Column D: Obligations (fiscal year totals)
 * - Column H: Contract Vehicle (top contract vehicles)
 * - Column I: Funding Department (top departments)
 * - Column O: AI Product (top products by fiscal year)
 * - Column R: Reseller (for OEM/Agency view)
 * - Column U: FAS OEM (for Vendor/Agency view)
 * - Column X: OneGov Tier (tier by fiscal year)
 * - Column AC: USAi Profile (company overview, website, etc.)
 * - Column AD: Website (fallback)
 * 
 * DYNAMIC SECTIONS BY ENTITY TYPE:
 * ┌─────────────┬─────────────────────────┬─────────────────────────┐
 * │ Entity Type │ Section 1               │ Section 3               │
 * ├─────────────┼─────────────────────────┼─────────────────────────┤
 * │ OEM         │ Top 5 Departments (I)   │ Top 5 Resellers (R)     │
 * │ Vendor      │ Top 5 Departments (I)   │ Top 5 OEMs (U)          │
 * │ Agency      │ Top 5 OEMs (U)          │ Top 5 Resellers (R)     │
 * └─────────────┴─────────────────────────┴─────────────────────────┘
 * 
 * Section 2 (Contract Vehicles) is the same for all entity types.
 * 
 * ============================================================================
 */

// ============================================================================
// GLOBAL CONFIGURATION
// ============================================================================

/**
 * REPORT FISCAL YEAR - Change this to update all reports globally
 * This controls which fiscal year data is pulled from all JSON columns
 * 
 * HOW FISCAL YEAR WORKS:
 * 1. Set REPORT_FISCAL_YEAR to desired year (e.g., '2024', '2025')
 * 2. All JSON data extraction uses this year as the key
 * 3. Previous year is auto-calculated for YoY comparisons
 * 4. All titles display FY + 2 digits (e.g., "FY24")
 * 
 * TO CHANGE FISCAL YEAR FOR ALL REPORTS:
 * Simply update this value to '2025', '2026', etc.
 * Everything else updates automatically.
 */
const REPORT_FISCAL_YEAR = '2024';

/**
 * Get the 2-digit fiscal year (e.g., '2024' → '24')
 */
function getFY2Digit() {
  return REPORT_FISCAL_YEAR.slice(-2);
}

/**
 * Get the previous fiscal year for comparison
 */
function getPreviousFiscalYear() {
  return String(parseInt(REPORT_FISCAL_YEAR) - 1);
}

/**
 * Google Drive folder ID for generated profiles
 * Replace with your actual folder ID
 */
const PROFILES_FOLDER_ID = 'YOUR_FOLDER_ID_HERE'; // ← Paste your folder ID here

/**
 * Template IDs for Executive Profile
 * These are the actual Google Doc templates with professional formatting
 */
const PROFILE_TEMPLATES = {
  'Entity Profile': {
    'GSA': '1wErVRGUmnkOZsXLix101hryYidL2SnP8BxYPH7YLEes',
    'ITVMO': '1cT69_fCZ4H70sf3oP5ypgMobLMcOLVIIDxDOEiT8cGs'
  }
};

/**
 * Profile type configuration and status
 */
const PROFILE_TYPES = {
  'Entity Profile': {
    status: 'active',  // 'active', 'development', 'disabled'
    description: 'One-page company overview with key metrics, top departments, vehicles, and partners',
    icon: '📋'
  }
};

/**
 * Drive folder configuration for saving all entity profiles
 * 
 * Folder Structure:
 * ITVMo Data drive (0AHISZmEn6b3DUk9PVA)
 * └── App Files (1Tdq2m_efTNdHFqy6p3EcjybAbPqqbEO6)
 *     └── OneGov FIT Market App (1eIED4N_cguCuN_8Bw_zFIRQv_LPdjCwj)
 *         └── Generated Documents (1lLUupgvLvzJngyzLw7GLx5sPX9gpSW4E)
 *             └── The Profiles (1yS0pIjNhQn395k7HWc1fjxomKYDPjBA3)
 *                 └── Entity Profiles (1NjZnvn5GDnHKvsN3TBwMJmhvT1LbNA0O)
 *                     └── Entity Profiles (1rPkNYa2jCHUytg4tMUElndv6RhAniWPZ) [All profiles saved here]
 */
const ENTITY_PROFILES_FOLDER = '19u-Ht0ac6BwWvOuQfgERHkjk6VwqJPih';

/**
 * Shared drive structure configuration
 */
const SHARED_DRIVE_CONFIG = {
  mainDriveId: '0AHISZmEn6b3DUk9PVA',
  entityProfilesParent: '1NjZnvn5GDnHKvsN3TBwMJmhvT1LbNA0O'
};

/**
 * Profile Log spreadsheet configuration
 */
const PROFILE_LOG_CONFIG = {
  spreadsheetId: '1sE1N0nnqFh_EWN4konURXLP2bEj0rqF3JIyOnpPmWJU',
  sheetName: 'Profile Log',
  columns: {
    KEY: 'A',           // Profile Type + Letterhead + timestamp
    VIEW: 'B',          // OEM, Vendor, or Agency  
    PROFILE_TYPE: 'C',  // Entity Profile
    LETTERHEAD: 'D',    // GSA or ITVMO
    PROFILE_LINK: 'E',  // Google Doc URL
    GENERATED_BY: 'F',  // User email
    TIMESTAMP: 'G'      // Generation timestamp
  }
};

/**
 * Tier definitions for display
 */
const TIER_DEFINITIONS = {
  'Tier 1': '> $500M',
  'Tier 2': '$200M - $500M',
  'Tier 3': '$50M - $200M',
  'Tier 4': '$10M - $50M',
  'Below Tier 4': '< $10M'
};


// ============================================================================
// MAIN GENERATION FUNCTIONS
// ============================================================================

/**
 * Get available profile types and their status
 * Called by frontend to populate dropdown
 * 
 * @returns {Object} Profile types with status information
 */
function getAvailableProfileTypes() {
  const result = {};
  
  for (const [profileType, config] of Object.entries(PROFILE_TYPES)) {
    const templates = PROFILE_TEMPLATES[profileType];
    const hasGsaTemplate = templates?.GSA && !templates.GSA.startsWith('TEMPLATE_ID_');
    const hasItvmoTemplate = templates?.ITVMO && !templates.ITVMO.startsWith('TEMPLATE_ID_');
    
    result[profileType] = {
      status: config.status,
      description: config.description,
      icon: config.icon,
      hasGsaTemplate: hasGsaTemplate,
      hasItvmoTemplate: hasItvmoTemplate,
      templatesConfigured: hasGsaTemplate || hasItvmoTemplate
    };
  }
  
  return result;
}


// Removed generateEntityProfile - replaced with generateEntityProfileDirect

/**
 * Test function to trigger Google Docs authorization
 * Call this function manually in Apps Script to force permission prompt
 */
function testDocumentPermissions() {
  try {
    // This will trigger the authorization prompt for Google Docs
    console.log('Testing DocumentApp permissions...');
    
    // Try to access a public template (one of our profile templates)
    const templateId = PROFILE_TEMPLATES['Entity Profile']['GSA'];
    if (templateId) {
      const doc = DocumentApp.openById(templateId);
      console.log('✅ DocumentApp permissions working! Template name:', doc.getName());
      return { success: true, message: 'DocumentApp permissions are working!' };
    } else {
      console.log('❌ Template ID not found');
      return { success: false, message: 'Template ID not configured' };
    }
  } catch (error) {
    console.error('❌ DocumentApp permission error:', error);
    return { success: false, error: error.toString() };
  }
}


/**
 * Create a Google Doc from template with placeholder replacement
 * 
 * @param {string} templateId - Google Doc template ID
 * @param {Object} placeholders - Placeholder data
 * @param {string} entityName - Entity name for file naming
 * @param {string} letterhead - GSA or ITVMO
 * @returns {Object} Result with docId and fileName
 */
function createDocumentFromTemplate(templateId, placeholders, entityName, letterhead) {
  try {
    console.log(`📋 Creating document from template ${templateId}`);
    
    // Open the template document
    const templateDoc = DocumentApp.openById(templateId);
    
    // Create a copy of the template
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `${entityName} - Entity Profile (${letterhead}) - ${timestamp}`;
    const templateFile = DriveApp.getFileById(templateId);
    
    // Use the single Entity Profiles folder for all documents
    const folderId = ENTITY_PROFILES_FOLDER;
    
    try {
      // Try direct copy to target folder first
      const targetFolder = DriveApp.getFolderById(folderId);
      console.log(`📁 Target folder: ${targetFolder.getName()} (${folderId})`);
      
      newDoc = templateFile.makeCopy(fileName, targetFolder);
      console.log(`✅ Document created directly in Entity Profiles folder: ${targetFolder.getName()}`);
    } catch (directCopyError) {
      console.warn(`⚠️ Direct copy failed, trying alternative method: ${directCopyError}`);
      
      try {
        // Fallback: Create copy then move
        newDoc = templateFile.makeCopy(fileName);
        console.log(`📄 Document copy created in root, attempting to move...`);
        
        const targetFolder = DriveApp.getFolderById(folderId);
        
        // Remove from current parent and add to target
        const parentFolders = newDoc.getParents();
        while (parentFolders.hasNext()) {
          const parent = parentFolders.next();
          parent.removeFile(newDoc);
        }
        
        targetFolder.addFile(newDoc);
        console.log(`📁 Document moved to Entity Profiles folder: ${targetFolder.getName()}`);
      } catch (moveError) {
        console.error(`❌ Could not move to Entity Profiles folder: ${moveError}`);
        // Document will remain in root Drive, but that's better than failing completely
        if (!newDoc) {
          newDoc = templateFile.makeCopy(fileName);
          console.log(`📄 Fallback: Document created in root Drive`);
        }
      }
    }
    
    // Open the new document for editing
    const doc = DocumentApp.openById(newDoc.getId());
    const body = doc.getBody();
    
    // Replace all placeholders in the document
    console.log(`🔄 Replacing ${Object.keys(placeholders).length} placeholders`);
    for (const [key, value] of Object.entries(placeholders)) {
      const placeholder = `{{${key}}}`;
      const replacementValue = String(value || 'N/A');
      body.replaceText(placeholder, replacementValue);
    }
    
    // Save the document
    doc.saveAndClose();
    
    const docUrl = `https://docs.google.com/document/d/${newDoc.getId()}/edit`;
    
    // Log the profile generation
    logProfileGeneration('Entity Profile', 'All', docUrl, entityName, letterhead);
    
    console.log(`✅ Document created successfully: ${fileName}`);
    return {
      success: true,
      docId: newDoc.getId(),
      fileName: fileName,
      docUrl: docUrl
    };
    
  } catch (error) {
    console.error('Error creating document from template:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Log profile generation to the tracking spreadsheet
 * 
 * @param {string} profileType - Type of profile (Entity Profile)
 * @param {string} view - Entity type (OEM, Vendor, Agency)
 * @param {string} profileLink - Google Doc URL
 * @param {string} entityName - Name of entity for key generation
 */
function logProfileGeneration(profileType, view, profileLink, entityName, letterhead) {
  try {
    console.log(`📊 Logging profile generation to spreadsheet`);
    
    // Open the Profile Log spreadsheet
    const ss = SpreadsheetApp.openById(PROFILE_LOG_CONFIG.spreadsheetId);
    const sheet = ss.getSheetByName(PROFILE_LOG_CONFIG.sheetName);
    
    if (!sheet) {
      throw new Error(`Sheet '${PROFILE_LOG_CONFIG.sheetName}' not found in spreadsheet`);
    }
    
    // Generate timestamp and key
    const timestamp = new Date();
    const timestampString = timestamp.toISOString();
    const key = `${profileType}_${letterhead}_${timestampString}`;
    
    // Get current user email
    const userEmail = Session.getActiveUser().getEmail();
    
    // Prepare row data according to new column structure
    const rowData = [
      key,              // A: Key (Profile Type + Letterhead + timestamp)
      view,             // B: View (OEM, Vendor, Agency)
      profileType,      // C: Profile Type
      letterhead,       // D: Letterhead (GSA or ITVMO)
      profileLink,      // E: Profile Link
      userEmail,        // F: Generated By
      timestamp         // G: Generation Timestamp
    ];
    
    // Append the new row
    sheet.appendRow(rowData);
    
    console.log(`✅ Profile generation logged: ${key} for ${entityName} by ${userEmail}`);
    
  } catch (error) {
    console.error('Error logging profile generation:', error);
    // Don't fail the profile generation if logging fails
  }
}

/**
 * Determine entity type (OEM, Vendor, Agency) from entity data
 * 
 * @param {Object} entityData - Entity data object
 * @returns {string} Entity type: 'OEM', 'Vendor', or 'Agency'
 */
function determineEntityType(entityData) {
  try {
    // Check if entity has Entity_Type field
    if (entityData.Entity_Type) {
      const entityType = entityData.Entity_Type.toUpperCase();
      if (['OEM', 'VENDOR', 'AGENCY'].includes(entityType)) {
        return entityType.charAt(0) + entityType.slice(1).toLowerCase(); // OEM, Vendor, Agency
      }
    }
    
    // Fallback: Try to determine from data structure
    // OEMs typically have vendor/reseller data
    // Vendors typically have OEM data
    // Agencies typically have both
    
    const hasResellerData = entityData.reseller_data && Object.keys(entityData.reseller_data).length > 0;
    const hasOemData = entityData.oem_data && Object.keys(entityData.oem_data).length > 0;
    
    if (hasResellerData && !hasOemData) {
      return 'OEM'; // OEMs have reseller data but not OEM data
    } else if (hasOemData && !hasResellerData) {
      return 'Vendor'; // Vendors have OEM data but not reseller data
    } else if (hasOemData && hasResellerData) {
      return 'Agency'; // Agencies can have both
    }
    
    // Final fallback - default to Agency
    console.log(`Warning: Could not determine entity type for ${entityData.name}, defaulting to Agency`);
    return 'Agency';
    
  } catch (error) {
    console.error('Error determining entity type:', error);
    return 'Agency'; // Safe default
  }
}

/**
 * Export Entity Profile as Google Doc
 * Creates an actual document from template (only when requested)
 */
function exportProfileAsDoc(entityData, letterhead) {
  try {
    console.log(`📄 EXPORT PROFILE AS DOC v2025-12-07: Creating Google Doc for ${entityData.name} with ${letterhead} letterhead`);
    
    // Get template ID
    const templateId = PROFILE_TEMPLATES['Entity Profile'][letterhead];
    if (!templateId) {
      throw new Error(`Template not found for ${letterhead} letterhead`);
    }
    
    // Build placeholder data
    const placeholders = buildPlaceholderData(entityData);
    
    // Create document from template (all saved to same folder now)
    const result = createDocumentFromTemplate(templateId, placeholders, entityData.name, letterhead);
    
    if (result.success) {
      console.log(`✅ Document created: ${result.fileName}`);
      return {
        success: true,
        docId: result.docId,
        docUrl: result.docUrl,
        fileName: result.fileName
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error creating document:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Export Executive Profile as PDF
 * Creates document then converts to PDF
 */
function exportProfileAsPDF(entityData, letterhead) {
  try {
    console.log(`📑 Creating PDF for ${entityData.name} with ${letterhead} letterhead`);
    
    // First create the document
    const docResult = exportProfileAsDoc(entityData, letterhead);
    
    if (!docResult.success) {
      return docResult;
    }
    
    // Convert to PDF
    const doc = DriveApp.getFileById(docResult.docId);
    const pdfBlob = doc.getAs('application/pdf');
    
    // Save PDF with proper name
    const pdfName = `${entityData.name}_Executive_Profile_${letterhead}_FY${getFY2Digit()}.pdf`;
    pdfBlob.setName(pdfName);
    
    // Get or create output folder
    let folder;
    try {
      folder = DriveApp.getFolderById(PROFILES_FOLDER_ID);
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }
    
    const pdfFile = folder.createFile(pdfBlob);
    
    // Delete the temporary doc (keep only PDF)
    DriveApp.getFileById(docResult.docId).setTrashed(true);
    
    console.log(`✅ PDF created: ${pdfName}`);
    
    return {
      success: true,
      pdfId: pdfFile.getId(),
      pdfUrl: pdfFile.getUrl(),
      pdfDownloadUrl: `https://drive.google.com/uc?export=download&id=${pdfFile.getId()}`,
      fileName: pdfName
    };
    
  } catch (error) {
    console.error('Error creating PDF:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Email Executive Profile
 * Creates document and emails as attachment or link
 */
function emailProfile(entityData, letterhead, recipient, format = 'pdf') {
  try {
    console.log(`📧 Emailing ${format.toUpperCase()} to ${recipient}`);
    
    let attachment, subject, body;
    
    if (format === 'pdf') {
      // Create and attach PDF
      const pdfResult = exportProfileAsPDF(entityData, letterhead);
      if (!pdfResult.success) {
        return pdfResult;
      }
      
      const pdfFile = DriveApp.getFileById(pdfResult.pdfId);
      attachment = pdfFile.getAs('application/pdf');
      subject = `Executive Profile - ${entityData.name} (PDF)`;
      body = `Please find attached the Executive Profile for ${entityData.name}.`;
      
    } else {
      // Create and share Google Doc
      const docResult = exportProfileAsDoc(entityData, letterhead);
      if (!docResult.success) {
        return docResult;
      }
      
      // Share the document
      const doc = DriveApp.getFileById(docResult.docId);
      doc.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      subject = `Executive Profile - ${entityData.name} (Google Doc)`;
      body = `Please find the Executive Profile for ${entityData.name} at the following link:\n\n${docResult.docUrl}`;
    }
    
    // Send email
    const emailOptions = {
      to: recipient,
      subject: subject,
      body: body,
      htmlBody: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #0a2240;">Executive Profile - ${entityData.name}</h2>
          <p>${body}</p>
          <hr style="margin-top: 30px;">
          <p style="color: #666; font-size: 12px;">
            Generated from OneGov FIT Market<br>
            ${letterhead} | FY${getFY2Digit()}
          </p>
        </div>
      `
    };
    
    if (attachment) {
      emailOptions.attachments = [attachment];
    }
    
    MailApp.sendEmail(emailOptions);
    
    console.log(`✅ Email sent to ${recipient}`);
    return { success: true, message: `Profile sent to ${recipient}` };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Create document from template with placeholder replacement
 * 
 * @param {string} templateId - Google Doc template ID
 * @param {Object} placeholders - All placeholder values
 * @param {Object} entityData - Entity data for hyperlinks
 * @param {string} letterhead - Letterhead type for filename
 * @returns {Object} Result with document URL
 */
function generateDocumentFromTemplate(templateId, placeholders, entityData, letterhead) {
  try {
    // Get template file
    const templateFile = DriveApp.getFileById(templateId);
    
    // Get or create output folder
    let folder;
    try {
      folder = DriveApp.getFolderById(PROFILES_FOLDER_ID);
    } catch (e) {
      // Folder not found, use root
      folder = DriveApp.getRootFolder();
      console.warn('Profiles folder not found, using root folder');
    }
    
    // Generate filename
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
    const fileName = `${placeholders.COMPANY_NAME}_Executive_Profile_${letterhead}_FY${getFY2Digit()}_${timestamp}`;
    
    // Make a copy of the template
    const newFile = templateFile.makeCopy(fileName, folder);
    const doc = DocumentApp.openById(newFile.getId());
    const body = doc.getBody();
    
    // Replace all placeholders
    for (const [key, value] of Object.entries(placeholders)) {
      body.replaceText(`\\{\\{${key}\\}\\}`, String(value || 'N/A'));
    }
    
    // Apply hyperlink to company name
    applyCompanyNameHyperlink(body, placeholders.COMPANY_NAME, placeholders.COMPANY_WEBSITE);
    
    // Save and close
    doc.saveAndClose();
    
    console.log(`✅ Document generated: ${fileName}`);
    
    return {
      success: true,
      docId: newFile.getId(),
      docUrl: newFile.getUrl(),
      fileName: fileName
    };
    
  } catch (error) {
    console.error('Error generating document from template:', error);
    return { success: false, error: error.toString() };
  }
}


/**
 * Convert Google Doc to PDF
 * 
 * @param {string} docId - Google Doc ID
 * @param {string} entityName - Entity name for filename
 * @param {string} letterhead - Letterhead type
 * @returns {Object} Result with PDF URL
 */
function convertDocToPDF(docId, entityName, letterhead) {
  try {
    // Get the document
    const doc = DriveApp.getFileById(docId);
    
    // Get or create output folder
    let folder;
    try {
      folder = DriveApp.getFolderById(PROFILES_FOLDER_ID);
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }
    
    // Generate PDF filename
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
    const fileName = `${entityName}_Executive_Profile_${letterhead}_FY${getFY2Digit()}_${timestamp}.pdf`;
    
    // Convert to PDF
    const pdfBlob = doc.getAs('application/pdf');
    pdfBlob.setName(fileName);
    
    // Save PDF
    const pdfFile = folder.createFile(pdfBlob);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    console.log(`✅ PDF generated: ${fileName}`);
    
    return {
      success: true,
      fileId: pdfFile.getId(),
      url: pdfFile.getUrl(),
      downloadUrl: `https://drive.google.com/uc?export=download&id=${pdfFile.getId()}`,
      fileName: fileName
    };
    
  } catch (error) {
    console.error('Error converting to PDF:', error);
    return { success: false, error: error.toString() };
  }
}


/**
 * Apply hyperlink to company name in document
 * 
 * @param {GoogleAppsScript.Document.Body} body - Document body
 * @param {string} companyName - Company name to find
 * @param {string} websiteUrl - URL to apply as hyperlink
 */
function applyCompanyNameHyperlink(body, companyName, websiteUrl) {
  if (!websiteUrl || websiteUrl === 'N/A' || !companyName) return;
  
  try {
    // Ensure URL has protocol
    let url = websiteUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Find and apply hyperlink to first occurrence of company name
    const searchResult = body.findText(companyName);
    if (searchResult) {
      const element = searchResult.getElement();
      const startOffset = searchResult.getStartOffset();
      const endOffset = searchResult.getEndOffsetInclusive();
      
      // Apply hyperlink
      const text = element.asText();
      text.setLinkUrl(startOffset, endOffset, url);
      
      console.log(`🔗 Applied hyperlink to "${companyName}": ${url}`);
    }
  } catch (error) {
    console.warn('Could not apply hyperlink to company name:', error);
  }
}


// ============================================================================
// PLACEHOLDER DATA BUILDING
// ============================================================================

/**
 * Build all placeholder data from entity
 * 
 * PLACEHOLDER REFERENCE:
 * ┌──────────────────────────────┬────────────────────────────────────────┐
 * │ Placeholder                  │ Source                                 │
 * ├──────────────────────────────┼────────────────────────────────────────┤
 * │ {{REPORT_DATE}}              │ Generated (current date)               │
 * │ {{FY}}                       │ REPORT_FISCAL_YEAR (2 digits)          │
 * │ {{FISCAL_YEAR}}              │ REPORT_FISCAL_YEAR (4 digits)          │
 * │ {{COMPANY_NAME}}             │ entityData.name                        │
 * │ {{COMPANY_WEBSITE}}          │ Column AC or AD                        │
 * │ {{COMPANY_OVERVIEW}}         │ Column AC (usaiProfile.overview)       │
 * │ {{ONEGOV_TIER}}              │ Column X                               │
 * │ {{ONEGOV_TIER_RANGE}}        │ Column X + TIER_DEFINITIONS            │
 * │ {{ONEGOV_TIER_FULL}}         │ Column X (combined)                    │
 * │ {{TOP_PRODUCT_1-5}}          │ Column O                               │
 * │ {{FY_OBLIGATIONS}}           │ Column D (current FY)                  │
 * │ {{FY_OBLIGATIONS_FULL}}      │ Column D (with YoY comparison)         │
 * │ {{SECTION_1_TITLE}}          │ Dynamic based on entity type           │
 * │ {{SECTION_1_ITEM_1-5_NAME}}  │ Column I or U                          │
 * │ {{SECTION_1_ITEM_1-5_VALUE}} │ Column I or U                          │
 * │ {{VEHICLE_1-5_NAME}}         │ Column H                               │
 * │ {{VEHICLE_1-5_VALUE}}        │ Column H                               │
 * │ {{SECTION_3_TITLE}}          │ Dynamic based on entity type           │
 * │ {{SECTION_3_ITEM_1-5_NAME}}  │ Column R or U                          │
 * │ {{SECTION_3_ITEM_1-5_VALUE}} │ Column R or U                          │
 * └──────────────────────────────┴────────────────────────────────────────┘
 * 
 * @param {Object} entityData - Full entity data
 * @returns {Object} All placeholder key-value pairs
 */
function buildPlaceholderData(entityData) {
  const placeholders = {};
  const FY = REPORT_FISCAL_YEAR;
  const FY2 = getFY2Digit();
  const prevFY = getPreviousFiscalYear();
  const prevFY2 = prevFY.slice(-2);
  
  // -------------------------------------------------------------------------
  // Basic Info & Fiscal Year
  // -------------------------------------------------------------------------
  placeholders.FISCAL_YEAR = FY;
  placeholders.FY = FY2;
  placeholders.REPORT_DATE = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMMM d, yyyy');
  placeholders['CURRENT_MONTH.PERIOD_FULL'] = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMMM yyyy');
  
  // -------------------------------------------------------------------------
  // I. Company Name & Website (Column AC + AD)
  // -------------------------------------------------------------------------
  placeholders.COMPANY_NAME = entityData.name || 'Unknown Entity';
  
  // Website priority: usaiProfile.website → entity.website → N/A
  const usaiProfile = entityData.usaiProfile || {};
  placeholders.COMPANY_WEBSITE = usaiProfile.website || entityData.website || 'N/A';
  
  // -------------------------------------------------------------------------
  // II. OneGov Tier - FY Based (Column X)
  // -------------------------------------------------------------------------
  const tierData = extractTierData(entityData.oneGovTier, FY);
  placeholders.ONEGOV_TIER = tierData.tier;
  placeholders.ONEGOV_TIER_RANGE = tierData.range;
  placeholders.ONEGOV_TIER_FULL = tierData.full;
  
  // -------------------------------------------------------------------------
  // III. Company Overview (Column AC)
  // -------------------------------------------------------------------------
  placeholders.COMPANY_OVERVIEW = usaiProfile.overview || 
    `${placeholders.COMPANY_NAME} is a technology provider active in the federal procurement marketplace.`;
  
  // -------------------------------------------------------------------------
  // IV. Top Products (Column O - AI Product)
  // -------------------------------------------------------------------------
  const topProducts = extractTopProducts(entityData.aiProduct, FY, 5);
  placeholders.TOP_PRODUCT_1 = topProducts[0] || 'N/A';
  placeholders.TOP_PRODUCT_2 = topProducts[1] || 'N/A';
  placeholders.TOP_PRODUCT_3 = topProducts[2] || 'N/A';
  placeholders.TOP_PRODUCT_4 = topProducts[3] || 'N/A';
  placeholders.TOP_PRODUCT_5 = topProducts[4] || 'N/A';
  placeholders.TOP_PRODUCTS_LIST = topProducts.length > 0 ? topProducts.join(', ') : 'N/A';
  
  // -------------------------------------------------------------------------
  // V. FY Obligations (Column D)
  // -------------------------------------------------------------------------
  const obligationsData = extractObligationsData(entityData.obligations, FY, prevFY);
  placeholders.FY_OBLIGATIONS = obligationsData.currentFormatted;
  placeholders.FY_PREV_OBLIGATIONS = obligationsData.prevFormatted;
  placeholders.FY_CHANGE_DIRECTION = obligationsData.changeDirection;
  placeholders.FY_OBLIGATIONS_FULL = obligationsData.fullText;
  
  // -------------------------------------------------------------------------
  // Determine Entity Type
  // -------------------------------------------------------------------------
  const entityType = (entityData.type || entityData.entityType || '').toLowerCase();
  
  // -------------------------------------------------------------------------
  // VI. Section 1 - Dynamic (Departments for OEM/Vendor, OEMs for Agency)
  // -------------------------------------------------------------------------
  const section1Data = extractSection1Data(entityData, entityType, FY, FY2);
  placeholders.SECTION_1_TITLE = section1Data.title;
  for (let i = 0; i < 5; i++) {
    const item = section1Data.items[i] || { name: 'N/A', value: 'N/A' };
    placeholders[`SECTION_1_ITEM_${i + 1}_NAME`] = item.name;
    placeholders[`SECTION_1_ITEM_${i + 1}_VALUE`] = item.value;
  }
  
  // -------------------------------------------------------------------------
  // VII. Top 5 Contract Vehicles (Column H) - Static for ALL entity types
  // -------------------------------------------------------------------------
  const topVehicles = extractTopItems(entityData.contractVehicle, 'top_contract_summaries', FY, 5);
  for (let i = 0; i < 5; i++) {
    const vehicle = topVehicles[i] || { name: 'N/A', value: 'N/A' };
    placeholders[`VEHICLE_${i + 1}_NAME`] = vehicle.name;
    placeholders[`VEHICLE_${i + 1}_VALUE`] = vehicle.value;
  }
  
  // -------------------------------------------------------------------------
  // VIII. Section 3 - Dynamic (Resellers for OEM/Agency, OEMs for Vendor)
  // -------------------------------------------------------------------------
  const section3Data = extractSection3Data(entityData, entityType, FY, FY2);
  placeholders.SECTION_3_TITLE = section3Data.title;
  for (let i = 0; i < 5; i++) {
    const item = section3Data.items[i] || { name: 'N/A', value: 'N/A' };
    placeholders[`SECTION_3_ITEM_${i + 1}_NAME`] = item.name;
    placeholders[`SECTION_3_ITEM_${i + 1}_VALUE`] = item.value;
  }
  
  return placeholders;
}


// ============================================================================
// DATA EXTRACTION HELPERS
// ============================================================================

/**
 * Extract tier data for specific fiscal year
 * 
 * @param {Object} oneGovTierData - Column X JSON data
 * @param {string} fiscalYear - Fiscal year to extract
 * @returns {Object} { tier, range, full }
 */
function extractTierData(oneGovTierData, fiscalYear) {
  const defaultResult = { tier: 'N/A', range: 'N/A', full: 'N/A' };
  
  if (!oneGovTierData) return defaultResult;
  
  try {
    // Get tier for specific fiscal year
    const fyTiers = oneGovTierData.fiscal_year_tiers;
    const fyData = fyTiers?.[fiscalYear];
    
    if (!fyData) {
      // Fallback to overall_tier if FY not found
      const overallTier = oneGovTierData.overall_tier || 'N/A';
      const range = TIER_DEFINITIONS[overallTier] || oneGovTierData.tier_definitions?.[overallTier] || 'N/A';
      return {
        tier: overallTier,
        range: range,
        full: `${overallTier} (${range})`
      };
    }
    
    const tier = fyData.tier || 'N/A';
    const range = TIER_DEFINITIONS[tier] || oneGovTierData.tier_definitions?.[tier] || 'N/A';
    
    return {
      tier: tier,
      range: range,
      full: `${tier} (${range})`
    };
  } catch (error) {
    console.warn('Error extracting tier data:', error);
    return defaultResult;
  }
}


/**
 * Extract top products from AI Product column for specific FY
 * 
 * @param {Object} aiProductData - Column O JSON data
 * @param {string} fiscalYear - Fiscal year to extract
 * @param {number} count - Number of products to return
 * @returns {Array} Array of product names
 */
function extractTopProducts(aiProductData, fiscalYear, count) {
  if (!aiProductData) return [];
  
  try {
    const fyData = aiProductData.fiscal_year_summaries?.[fiscalYear];
    if (!fyData || !fyData.top_10_products) return [];
    
    // Get product names, clean them up
    return fyData.top_10_products
      .slice(0, count)
      .map(p => {
        // Clean up long product names
        let name = p.product || p.product_name || 'Unknown';
        // Truncate if too long (over 50 chars)
        if (name.length > 50) {
          name = name.substring(0, 47) + '...';
        }
        return name;
      });
  } catch (error) {
    console.warn('Error extracting top products:', error);
    return [];
  }
}


/**
 * Extract obligations data for FY comparison
 * Format: "$23.2M, up from $19.8M in FY23"
 * 
 * @param {Object} obligationsData - Column D JSON data
 * @param {string} fiscalYear - Current fiscal year
 * @param {string} prevFiscalYear - Previous fiscal year for comparison
 * @returns {Object} { currentFormatted, prevFormatted, changeDirection, fullText }
 */
function extractObligationsData(obligationsData, fiscalYear, prevFiscalYear) {
  const defaultResult = {
    currentFormatted: 'N/A',
    prevFormatted: 'N/A',
    changeDirection: '',
    fullText: 'N/A'
  };
  
  if (!obligationsData) return defaultResult;
  
  try {
    const fyObligations = obligationsData.fiscal_year_obligations;
    if (!fyObligations) return defaultResult;
    
    const currentValue = fyObligations[fiscalYear] || 0;
    const prevValue = fyObligations[prevFiscalYear] || 0;
    
    const currentFormatted = formatCurrencyShort(currentValue);
    const prevFormatted = formatCurrencyShort(prevValue);
    const prevFY2 = prevFiscalYear.slice(-2);
    
    let changeDirection = '';
    let fullText = currentFormatted;
    
    if (currentValue > 0 && prevValue > 0) {
      if (currentValue > prevValue) {
        changeDirection = 'up';
        fullText = `${currentFormatted}, up from ${prevFormatted} in FY${prevFY2}`;
      } else if (currentValue < prevValue) {
        changeDirection = 'down';
        fullText = `${currentFormatted}, down from ${prevFormatted} in FY${prevFY2}`;
      } else {
        changeDirection = 'unchanged';
        fullText = `${currentFormatted}, unchanged from FY${prevFY2}`;
      }
    } else if (currentValue > 0 && prevValue === 0) {
      changeDirection = 'new';
      fullText = `${currentFormatted} (new in FY${fiscalYear.slice(-2)})`;
    }
    
    return {
      currentFormatted,
      prevFormatted,
      changeDirection,
      fullText
    };
  } catch (error) {
    console.warn('Error extracting obligations data:', error);
    return defaultResult;
  }
}


/**
 * Extract top items from object map columns (Dept, Vehicle, Reseller)
 * Sorts by fiscal year value
 * 
 * @param {Object} columnData - JSON data from column
 * @param {string} itemsPath - Path to items (e.g., 'top_10_department_summaries')
 * @param {string} fiscalYear - Fiscal year to sort by
 * @param {number} count - Number of items to return
 * @returns {Array} Array of { name, value }
 */
function extractTopItems(columnData, itemsPath, fiscalYear, count) {
  if (!columnData) return [];
  
  try {
    const items = columnData[itemsPath];
    if (!items || typeof items !== 'object') return [];
    
    // Build items array with FY values
    const itemsArray = [];
    
    for (const [name, data] of Object.entries(items)) {
      const fyValue = data.fiscal_years?.[fiscalYear] || 0;
      itemsArray.push({
        name: name,
        rawValue: fyValue,
        data: data
      });
    }
    
    // Sort by FY value descending
    itemsArray.sort((a, b) => b.rawValue - a.rawValue);
    
    // Take top N and format
    return itemsArray.slice(0, count).map(item => {
      return {
        name: item.name,
        value: formatCurrencyShort(item.rawValue)
      };
    });
  } catch (error) {
    console.warn('Error extracting top items:', error);
    return [];
  }
}


/**
 * Extract Section 1 data based on entity type
 * - OEM/Vendor: Top 5 Departments (Column I)
 * - Agency: Top 5 OEMs (Column U)
 * 
 * @param {Object} entityData - Full entity data
 * @param {string} entityType - 'oems', 'vendors', or 'agencies'
 * @param {string} fiscalYear - Fiscal year (4 digit)
 * @param {string} fy2 - Fiscal year (2 digit)
 * @returns {Object} { title, items: [{ name, value }] }
 */
function extractSection1Data(entityData, entityType, fiscalYear, fy2) {
  const result = {
    title: `FY${fy2} Top 5 Departments:`,
    items: []
  };
  
  try {
    if (entityType.includes('agenc')) {
      // Agency view: Show Top OEMs from Column U
      result.title = `FY${fy2} Top 5 OEMs:`;
      result.items = extractFasOemItems(entityData.fasOem, fiscalYear, 5);
    } else {
      // OEM or Vendor view: Show Top Departments from Column I
      result.title = `FY${fy2} Top 5 Departments:`;
      result.items = extractTopItems(entityData.fundingDepartment, 'top_10_department_summaries', fiscalYear, 5);
    }
  } catch (error) {
    console.warn('Error extracting Section 1 data:', error);
  }
  
  return result;
}


/**
 * Extract Section 3 data based on entity type
 * - OEM/Agency: Top 5 Resellers (Column R)
 * - Vendor: Top 5 OEMs (Column U)
 * 
 * @param {Object} entityData - Full entity data
 * @param {string} entityType - 'oems', 'vendors', or 'agencies'
 * @param {string} fiscalYear - Fiscal year (4 digit)
 * @param {string} fy2 - Fiscal year (2 digit)
 * @returns {Object} { title, items: [{ name, value }] }
 */
function extractSection3Data(entityData, entityType, fiscalYear, fy2) {
  const result = {
    title: `FY${fy2} Top 5 Resellers:`,
    items: []
  };
  
  try {
    if (entityType.includes('vendor')) {
      // Vendor view: Show Top OEMs from Column U
      result.title = `FY${fy2} Top 5 OEMs:`;
      result.items = extractFasOemItems(entityData.fasOem, fiscalYear, 5);
    } else {
      // OEM or Agency view: Show Top Resellers from Column R
      result.title = `FY${fy2} Top 5 Resellers:`;
      result.items = extractTopItems(entityData.reseller, 'top_15_reseller_summaries', fiscalYear, 5);
    }
  } catch (error) {
    console.warn('Error extracting Section 3 data:', error);
  }
  
  return result;
}


/**
 * Extract FAS OEM items - special handling for Column U
 * 
 * @param {Object} fasOemData - Column U JSON data
 * @param {string} fiscalYear - Fiscal year to extract
 * @param {number} count - Number of items to return
 * @returns {Array} Array of { name, value }
 */
function extractFasOemItems(fasOemData, fiscalYear, count) {
  if (!fasOemData) return [];
  
  try {
    const items = fasOemData.top_10_oem_summaries;
    if (!items || typeof items !== 'object') return [];
    
    // Build items array with FY values
    const itemsArray = [];
    
    for (const [name, data] of Object.entries(items)) {
      const fyValue = data.fiscal_years?.[fiscalYear] || 0;
      itemsArray.push({
        name: name,
        rawValue: fyValue,
        data: data
      });
    }
    
    // Sort by FY value descending
    itemsArray.sort((a, b) => b.rawValue - a.rawValue);
    
    // Take top N and format
    return itemsArray.slice(0, count).map(item => {
      return {
        name: item.name,
        value: formatCurrencyShort(item.rawValue)
      };
    });
  } catch (error) {
    console.warn('Error extracting FAS OEM items:', error);
    return [];
  }
}


// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format currency value to short format (e.g., $68.6M)
 * NO SPACE between number and letter (M, K, B)
 * 
 * @param {number} value - Dollar amount
 * @returns {string} Formatted string
 */
function formatCurrencyShort(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
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
// HTML PREVIEW GENERATION
// ============================================================================

/**
 * Minimal test function
 */
function testSimple() {
  console.log('Simple test called');
  return 'Hello from backend!';
}

/**
 * Test function to verify communication
 */
function testProfileGeneration() {
  console.log('Test function called');
  return {
    success: true,
    message: 'Test successful',
    html: '<h1>Test Profile</h1><p>If you see this, communication is working!</p>'
  };
}

/**
 * Test with minimal HTML
 */
function testMinimalHTML() {
  console.log('Minimal HTML test called');
  try {
    return {
      success: true,
      html: '<html><body><h1>Works!</h1></body></html>'
    };
  } catch (error) {
    console.error('Error in testMinimalHTML:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Render Google Doc template as HTML without creating a document
 * This reads the template and returns formatted HTML for preview
 */
function renderTemplateAsHTML(templateId, placeholders, letterhead) {
  try {
    console.log(`🔗 Rendering HTML preview using F06_Document_Generator.html template`);
    
    // Use the F06_Document_Generator.html file as the base template for preview
    return generateFullHTMLDocument(placeholders, 'Entity Profile', letterhead, placeholders.entityData);
    
  } catch (error) {
    console.error('Error rendering template:', error);
    // Fallback to simple HTML if template reading fails
    return generateSimpleHTML(placeholders, letterhead);
  }
}

/**
 * Convert Google Doc to HTML with formatting
 */
function convertDocToHTML(doc, content, placeholders) {
  const body = doc.getBody();
  let html = '<!DOCTYPE html><html><head>';
  html += '<meta charset="utf-8">';
  html += '<style>';
  html += 'body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }';
  html += 'h1 { color: #0a2240; font-size: 24pt; }';
  html += 'h2 { color: #0a2240; font-size: 18pt; margin-top: 20px; }';
  html += 'table { width: 100%; border-collapse: collapse; margin: 10px 0; }';
  html += 'th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }';
  html += 'th { background-color: #f2f2f2; font-weight: bold; }';
  html += '.header { border-bottom: 3px solid #0a2240; margin-bottom: 20px; padding-bottom: 10px; }';
  html += '</style></head><body>';
  
  // Process each element in the document
  const numChildren = body.getNumChildren();
  for (let i = 0; i < numChildren; i++) {
    const child = body.getChild(i);
    const type = child.getType();
    
    if (type === DocumentApp.ElementType.PARAGRAPH) {
      const para = child.asParagraph();
      const text = para.getText();
      
      // Replace placeholders in this paragraph
      let processedText = text;
      for (const [key, value] of Object.entries(placeholders)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedText = processedText.replace(regex, String(value || 'N/A'));
      }
      
      // Apply heading styles
      const heading = para.getHeading();
      if (heading === DocumentApp.ParagraphHeading.HEADING1) {
        html += `<h1>${processedText}</h1>`;
      } else if (heading === DocumentApp.ParagraphHeading.HEADING2) {
        html += `<h2>${processedText}</h2>`;
      } else if (processedText.trim()) {
        html += `<p>${processedText}</p>`;
      }
      
    } else if (type === DocumentApp.ElementType.TABLE) {
      html += processTableElement(child.asTable(), placeholders);
    }
  }
  
  html += '</body></html>';
  return html;
}

/**
 * Process table elements from Google Doc
 */
function processTableElement(table, placeholders) {
  let html = '<table>';
  const numRows = table.getNumRows();
  
  for (let i = 0; i < numRows; i++) {
    const row = table.getRow(i);
    html += '<tr>';
    
    const numCells = row.getNumCells();
    for (let j = 0; j < numCells; j++) {
      const cell = row.getCell(j);
      let cellText = cell.getText();
      
      // Replace placeholders in cell
      for (const [key, value] of Object.entries(placeholders)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        cellText = cellText.replace(regex, String(value || 'N/A'));
      }
      
      const tag = i === 0 ? 'th' : 'td';
      html += `<${tag}>${cellText}</${tag}>`;
    }
    
    html += '</tr>';
  }
  
  html += '</table>';
  return html;
}

/**
 * Generate simple HTML fallback
 */
function generateSimpleHTML(placeholders, letterhead) {
  const color = letterhead === 'ITVMO' ? '#1a472a' : '#0a2240';
  const org = letterhead === 'ITVMO' ? 'IT Vendor Management Office' : 'General Services Administration';
  
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 3px solid ${color}; margin-bottom: 20px; padding-bottom: 10px; }
    h1 { color: ${color}; }
    .section { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${org}</h1>
    <h2>Executive Profile - ${placeholders.COMPANY_NAME}</h2>
  </div>
  <div class="section">
    <h3>FY${placeholders.FY} Obligations</h3>
    <p>${placeholders.FY_OBLIGATIONS_FULL}</p>
  </div>
  <div class="section">
    <h3>Company Overview</h3>
    <p>${placeholders.COMPANY_OVERVIEW}</p>
  </div>
</body>
</html>`;
}

/**
 * Generate entity profile preview without creating a document
 * Reads the actual Google Doc template and renders it with data
 */
function generateEntityProfileDirect(entityData, letterhead) {
  console.log(`⚠️ OLD HTML FUNCTION CALLED - This should not happen! Redirecting to document creation.`);
  
  // Redirect to the proper document creation function
  return exportProfileAsDoc(entityData, letterhead);
}

/**
 * Generate full HTML document with all placeholders replaced
 * This creates a complete standalone HTML page
 * 
 * @param {Object} placeholders - All placeholder values
 * @param {string} profileType - Type of profile  
 * @param {string} letterhead - 'GSA' or 'ITVMO'
 * @param {Object} entityData - Full entity data
 * @returns {string} Complete HTML document
 */
function generateFullHTMLDocument(placeholders, profileType, letterhead, entityData) {
  try {
    // Read the F06_Document_Generator.html template and replace placeholders
    let html = HtmlService.createHtmlOutputFromFile('F06_Document_Generator').getContent();
    
    // Replace all placeholders
    for (const [key, value] of Object.entries(placeholders)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value || 'N/A'));
    }
    
    // Add department placeholders (DEPT_1_NAME, etc.) from SECTION_1 data
    for (let i = 1; i <= 5; i++) {
      html = html.replace(new RegExp(`{{DEPT_${i}_NAME}}`, 'g'), placeholders[`SECTION_1_ITEM_${i}_NAME`] || 'N/A');
      html = html.replace(new RegExp(`{{DEPT_${i}_VALUE}}`, 'g'), placeholders[`SECTION_1_ITEM_${i}_VALUE`] || 'N/A');
      html = html.replace(new RegExp(`{{DEPT_${i}_PCT}}`, 'g'), calculatePercentage(placeholders[`SECTION_1_ITEM_${i}_VALUE`], placeholders.FY_OBLIGATIONS));
    }
    
    // Add vehicle percentages
    for (let i = 1; i <= 5; i++) {
      html = html.replace(new RegExp(`{{VEHICLE_${i}_PCT}}`, 'g'), calculatePercentage(placeholders[`VEHICLE_${i}_VALUE`], placeholders.FY_OBLIGATIONS));
    }
    
    // Add partner placeholders from SECTION_3 data
    html = html.replace(/{{PARTNER_SECTION_TITLE}}/g, placeholders.SECTION_3_TITLE || 'Partners');
    for (let i = 1; i <= 5; i++) {
      html = html.replace(new RegExp(`{{PARTNER_${i}_NAME}}`, 'g'), placeholders[`SECTION_3_ITEM_${i}_NAME`] || 'N/A');
      html = html.replace(new RegExp(`{{PARTNER_${i}_VALUE}}`, 'g'), placeholders[`SECTION_3_ITEM_${i}_VALUE`] || 'N/A');
      html = html.replace(new RegExp(`{{PARTNER_${i}_PCT}}`, 'g'), calculatePercentage(placeholders[`SECTION_3_ITEM_${i}_VALUE`], placeholders.FY_OBLIGATIONS));
    }
    
    // Update letterhead branding if ITVMO
    if (letterhead === 'ITVMO') {
      html = html.replace(/#0a2240/g, '#1a472a'); // Change blue to green
      html = html.replace(/GSA/g, 'ITVMO');
      html = html.replace(/General Services Administration/g, 'IT Vendor Management Office');
    }
    
    return html;
  } catch (error) {
    console.error('Error reading F06 template, using fallback:', error);
    // Fallback to embedded template
    return `<!DOCTYPE html>
<html>
<head>
    <base target="_top">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Executive Profile - ${placeholders.COMPANY_NAME || 'Company'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: white; color: #333; line-height: 1.4; font-size: 11pt; }
        .profile-container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; }
        .profile-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 3px solid ${letterhead === 'ITVMO' ? '#1a472a' : '#0a2240'}; margin-bottom: 20px; }
        .header-title { font-size: 18pt; font-weight: 700; color: ${letterhead === 'ITVMO' ? '#1a472a' : '#0a2240'}; }
        .company-name { font-size: 24pt; font-weight: 700; color: ${letterhead === 'ITVMO' ? '#1a472a' : '#0a2240'}; text-align: center; margin: 20px 0; }
        .section { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .section-title { font-size: 12pt; font-weight: 700; color: ${letterhead === 'ITVMO' ? '#1a472a' : '#0a2240'}; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #e9ecef; font-weight: 600; }
    </style>
</head>
<body>
    <div class="profile-container">
        <div class="profile-header">
            <div class="header-title">${letterhead} - Executive Profile</div>
            <div>FY ${placeholders.FY || '24'}</div>
        </div>
        
        <div class="company-name">${placeholders.COMPANY_NAME || 'Company Name'}</div>
        
        <div class="section">
            <div class="section-title">Company Overview</div>
            <div>${placeholders.COMPANY_OVERVIEW || 'Company overview not available.'}</div>
        </div>
        
        <div class="section">
            <div class="section-title">FY${placeholders.FY || '24'} Obligations</div>
            <div style="font-size: 20pt; font-weight: bold; color: #f47920;">${placeholders.FY_OBLIGATIONS || 'N/A'}</div>
            <div>${placeholders.FY_OBLIGATIONS_FULL || ''}</div>
        </div>
        
        <div class="section">
            <div class="section-title">Top Products</div>
            <div>${[1,2,3,4,5].map(i => placeholders[`TOP_PRODUCT_${i}`] || '').filter(p => p && p !== 'N/A').join(', ') || 'No products available'}</div>
        </div>
        
        <div class="section">
            <div class="section-title">${placeholders.SECTION_1_TITLE || 'Top 5 Items'}</div>
            <table>
                <thead><tr><th>Name</th><th>Value</th></tr></thead>
                <tbody>
                    ${[1,2,3,4,5].map(i => `
                        <tr>
                            <td>${placeholders[`SECTION_1_ITEM_${i}_NAME`] || 'N/A'}</td>
                            <td>${placeholders[`SECTION_1_ITEM_${i}_VALUE`] || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <div class="section-title">Top 5 Contract Vehicles</div>
            <table>
                <thead><tr><th>Vehicle</th><th>Value</th></tr></thead>
                <tbody>
                    ${[1,2,3,4,5].map(i => `
                        <tr>
                            <td>${placeholders[`VEHICLE_${i}_NAME`] || 'N/A'}</td>
                            <td>${placeholders[`VEHICLE_${i}_VALUE`] || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <div class="section-title">${placeholders.SECTION_3_TITLE || 'Partners'}</div>
            <table>
                <thead><tr><th>Name</th><th>Value</th></tr></thead>
                <tbody>
                    ${[1,2,3,4,5].map(i => `
                        <tr>
                            <td>${placeholders[`SECTION_3_ITEM_${i}_NAME`] || 'N/A'}</td>
                            <td>${placeholders[`SECTION_3_ITEM_${i}_VALUE`] || 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
  }
}

/**
 * Calculate percentage for display
 */
function calculatePercentage(value, total) {
  if (!value || !total || value === 'N/A' || total === 'N/A') return 'N/A';
  
  // Extract numeric value from formatted strings like "$23.2M"
  const parseValue = (str) => {
    if (typeof str === 'number') return str;
    const match = str.match(/\$([\d.]+)([BMK])?/);
    if (!match) return 0;
    let num = parseFloat(match[1]);
    if (match[2] === 'B') num *= 1000000000;
    else if (match[2] === 'M') num *= 1000000;
    else if (match[2] === 'K') num *= 1000;
    return num;
  };
  
  const numValue = parseValue(value);
  const numTotal = parseValue(total);
  
  if (numTotal === 0) return 'N/A';
  
  const pct = (numValue / numTotal) * 100;
  return pct.toFixed(1) + '%';
}

/**
 * Generate HTML preview from placeholders
 * Used for in-app preview before generating final document
 * 
 * @param {Object} placeholders - All placeholder values
 * @param {string} profileType - Type of profile
 * @param {string} letterhead - 'GSA' or 'ITVMO'
 * @returns {string} HTML string for preview
 */
function generateHTMLPreview(placeholders, profileType, letterhead) {
  const themeColor = letterhead === 'ITVMO' ? '#1a472a' : '#0a2240';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: ${themeColor}; color: white; padding: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header .date { font-size: 14px; opacity: 0.8; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; color: ${themeColor}; margin-bottom: 10px; }
        .company-name { font-size: 20px; font-weight: bold; }
        .company-name a { color: ${themeColor}; }
        .tier { background: #f5f5f5; padding: 10px; border-radius: 4px; display: inline-block; }
        .overview { line-height: 1.6; color: #333; }
        .obligations { font-size: 18px; font-weight: bold; color: ${themeColor}; }
        ul { margin: 0; padding-left: 20px; }
        li { margin-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${letterhead} - Executive Profile</h1>
        <div class="date">${placeholders.REPORT_DATE}</div>
      </div>
      
      <div class="section">
        <div class="section-title">I. Company Name</div>
        <div class="company-name">
          <a href="${placeholders.COMPANY_WEBSITE}" target="_blank">${placeholders.COMPANY_NAME}</a>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">II. OneGov Tier</div>
        <div class="tier">${placeholders.ONEGOV_TIER_FULL}</div>
      </div>
      
      <div class="section">
        <div class="section-title">III. GSA AI Synopsis on offerings</div>
        <div class="overview">${placeholders.COMPANY_OVERVIEW}</div>
      </div>
      
      <div class="section">
        <div class="section-title">IV. Top Products</div>
        <div>${placeholders.TOP_PRODUCT_1}, ${placeholders.TOP_PRODUCT_2}, ${placeholders.TOP_PRODUCT_3}</div>
      </div>
      
      <div class="section">
        <div class="section-title">V. FY${placeholders.FY} USG Obligations</div>
        <div class="obligations">${placeholders.FY_OBLIGATIONS_FULL}</div>
      </div>
      
      <div class="section">
        <div class="section-title">VI. ${placeholders.SECTION_1_TITLE}</div>
        <ul>
          <li>${placeholders.SECTION_1_ITEM_1_NAME} (${placeholders.SECTION_1_ITEM_1_VALUE})</li>
          <li>${placeholders.SECTION_1_ITEM_2_NAME} (${placeholders.SECTION_1_ITEM_2_VALUE})</li>
          <li>${placeholders.SECTION_1_ITEM_3_NAME} (${placeholders.SECTION_1_ITEM_3_VALUE})</li>
          <li>${placeholders.SECTION_1_ITEM_4_NAME} (${placeholders.SECTION_1_ITEM_4_VALUE})</li>
          <li>${placeholders.SECTION_1_ITEM_5_NAME} (${placeholders.SECTION_1_ITEM_5_VALUE})</li>
        </ul>
      </div>
      
      <div class="section">
        <div class="section-title">VII. FY${placeholders.FY} Top 5 Contract Vehicles:</div>
        <ul>
          <li>${placeholders.VEHICLE_1_NAME} (${placeholders.VEHICLE_1_VALUE})</li>
          <li>${placeholders.VEHICLE_2_NAME} (${placeholders.VEHICLE_2_VALUE})</li>
          <li>${placeholders.VEHICLE_3_NAME} (${placeholders.VEHICLE_3_VALUE})</li>
          <li>${placeholders.VEHICLE_4_NAME} (${placeholders.VEHICLE_4_VALUE})</li>
          <li>${placeholders.VEHICLE_5_NAME} (${placeholders.VEHICLE_5_VALUE})</li>
        </ul>
      </div>
      
      <div class="section">
        <div class="section-title">VIII. ${placeholders.SECTION_3_TITLE}</div>
        <ul>
          <li>${placeholders.SECTION_3_ITEM_1_NAME} (${placeholders.SECTION_3_ITEM_1_VALUE})</li>
          <li>${placeholders.SECTION_3_ITEM_2_NAME} (${placeholders.SECTION_3_ITEM_2_VALUE})</li>
          <li>${placeholders.SECTION_3_ITEM_3_NAME} (${placeholders.SECTION_3_ITEM_3_VALUE})</li>
          <li>${placeholders.SECTION_3_ITEM_4_NAME} (${placeholders.SECTION_3_ITEM_4_VALUE})</li>
          <li>${placeholders.SECTION_3_ITEM_5_NAME} (${placeholders.SECTION_3_ITEM_5_VALUE})</li>
        </ul>
      </div>
    </body>
    </html>
  `;
  
  return html;
}


// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

/**
 * Email profile report as PDF attachment
 * 
 * @param {string} recipient - Email address
 * @param {string} docId - Google Doc ID to convert and send
 * @param {Object} placeholders - Placeholder data for email content
 * @returns {Object} Result
 */
function emailProfileReport(recipient, docId, placeholders) {
  try {
    // Auto-detect user email if recipient is null/empty
    const emailRecipient = recipient || Session.getActiveUser().getEmail();
    
    // Get the document and convert to PDF
    const doc = DriveApp.getFileById(docId);
    const pdfBlob = doc.getAs('application/pdf');
    pdfBlob.setName(`${placeholders.COMPANY_NAME}_Executive_Profile.pdf`);
    
    // Send email
    MailApp.sendEmail({
      to: emailRecipient,
      subject: `OneGov FIT Market - Executive Profile: ${placeholders.COMPANY_NAME}`,
      body: `Please find attached the Executive Profile Report for ${placeholders.COMPANY_NAME}.`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #0a2240;">OneGov FIT Market - Executive Profile</h2>
          <p>Please find attached the Executive Profile Report for <strong>${placeholders.COMPANY_NAME}</strong>.</p>
          <p><strong>Report Date:</strong> ${placeholders.REPORT_DATE}</p>
          <p><strong>Fiscal Year:</strong> FY${placeholders.FY}</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This email contains federal procurement data.<br>
            © ${new Date().getFullYear()} General Services Administration
          </p>
        </div>
      `,
      attachments: [pdfBlob]
    });
    
    console.log(`✅ Profile emailed to: ${emailRecipient}`);
    return { success: true };
    
  } catch (error) {
    console.error('Error emailing profile:', error);
    return { success: false, error: error.toString() };
  }
}


// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test profile generation with sample data
 * Run this from Apps Script editor to verify setup
 */
function testProfileGeneration() {
  console.log('=== Profile Generation Test ===');
  console.log(`Report Fiscal Year: ${REPORT_FISCAL_YEAR}`);
  console.log(`FY 2-digit: ${getFY2Digit()}`);
  console.log(`Previous FY: ${getPreviousFiscalYear()}`);
  
  // Sample entity data for testing
  const sampleEntity = {
    name: 'Test Company Inc.',
    type: 'OEMs',
    website: 'https://example.com',
    usaiProfile: {
      oem_name: 'Test Company Inc.',
      overview: 'This is a test company overview providing AI and cloud solutions to federal agencies.',
      website: 'https://example.com'
    },
    oneGovTier: {
      overall_tier: 'Tier 2',
      fiscal_year_tiers: {
        '2024': { tier: 'Tier 2', amount: 250000000 },
        '2023': { tier: 'Tier 3', amount: 100000000 }
      }
    },
    obligations: {
      fiscal_year_obligations: {
        '2024': 23200000,
        '2023': 19800000
      }
    },
    fundingDepartment: {
      top_10_department_summaries: {
        'Department of Defense': { fiscal_years: { '2024': 9900000 }, total: 50000000 },
        'Social Security Administration': { fiscal_years: { '2024': 4100000 }, total: 15000000 },
        'Department of Justice': { fiscal_years: { '2024': 2300000 }, total: 10000000 },
        'Department of Agriculture': { fiscal_years: { '2024': 1300000 }, total: 5000000 },
        'Department of Labor': { fiscal_years: { '2024': 445000 }, total: 2000000 }
      }
    },
    contractVehicle: {
      top_contract_summaries: {
        'NASA SEWP': { fiscal_years: { '2024': 35600000 }, total: 60000000 },
        'NITAAC CIO SP3': { fiscal_years: { '2024': 8500000 }, total: 15000000 },
        'GSA MAS': { fiscal_years: { '2024': 5200000 }, total: 12000000 },
        '8(a) STARS III': { fiscal_years: { '2024': 3100000 }, total: 8000000 },
        'OASIS+': { fiscal_years: { '2024': 2400000 }, total: 5000000 }
      }
    },
    reseller: {
      top_15_reseller_summaries: {
        'DH TECHNOLOGIES, LLC': { fiscal_years: { '2024': 12000000 }, total: 25000000 },
        'NEW TECH SOLUTIONS': { fiscal_years: { '2024': 8200000 }, total: 18000000 },
        'CARAHSOFT TECHNOLOGY': { fiscal_years: { '2024': 6500000 }, total: 15000000 },
        'IMMIX GROUP': { fiscal_years: { '2024': 4300000 }, total: 10000000 },
        'GOVPLACE': { fiscal_years: { '2024': 2100000 }, total: 5000000 }
      }
    },
    aiProduct: {
      fiscal_year_summaries: {
        '2024': {
          top_10_products: [
            { product: 'Azure OpenAI Service' },
            { product: 'GitHub Copilot' },
            { product: 'Power Platform AI Builder' },
            { product: 'Microsoft 365 Copilot' },
            { product: 'Dynamics 365 AI' }
          ]
        }
      }
    }
  };
  
  // Test placeholder building
  const placeholders = buildPlaceholderData(sampleEntity);
  console.log('\n--- Placeholders ---');
  console.log('COMPANY_NAME:', placeholders.COMPANY_NAME);
  console.log('FY_OBLIGATIONS_FULL:', placeholders.FY_OBLIGATIONS_FULL);
  console.log('SECTION_1_TITLE:', placeholders.SECTION_1_TITLE);
  console.log('SECTION_3_TITLE:', placeholders.SECTION_3_TITLE);
  console.log('TOP_PRODUCT_1:', placeholders.TOP_PRODUCT_1);
  
  // Test preview generation
  const result = generateEntityProfileDirect(sampleEntity, 'GSA');
  console.log('\n--- Preview Result ---');
  console.log('Success:', result.success);
  console.log('Preview:', result.preview);
  
  console.log('\n=== Test Complete ===');
}


/**
 * Test template configuration
 */
function testTemplateConfig() {
  console.log('=== Template Configuration Test ===');
  
  const profileTypes = getAvailableProfileTypes();
  console.log('Available Profile Types:', JSON.stringify(profileTypes, null, 2));
  
  for (const [type, templates] of Object.entries(PROFILE_TEMPLATES)) {
    console.log(`\n${type}:`);
    console.log(`  GSA Template: ${templates.GSA}`);
    console.log(`  ITVMO Template: ${templates.ITVMO}`);
    console.log(`  GSA Configured: ${!templates.GSA.startsWith('TEMPLATE_ID_')}`);
    console.log(`  ITVMO Configured: ${!templates.ITVMO.startsWith('TEMPLATE_ID_')}`);
  }
  
  console.log('\n=== Test Complete ===');
}


/**
 * Test with different entity types to verify dynamic sections
 */
function testEntityTypes() {
  console.log('=== Entity Type Section Test ===');
  const FY = REPORT_FISCAL_YEAR;
  const FY2 = getFY2Digit();
  
  const testData = {
    fundingDepartment: { top_10_department_summaries: { 'Test Dept': { fiscal_years: { '2024': 1000000 } } } },
    fasOem: { top_10_oem_summaries: { 'Test OEM': { fiscal_years: { '2024': 2000000 } } } },
    reseller: { top_15_reseller_summaries: { 'Test Reseller': { fiscal_years: { '2024': 3000000 } } } }
  };
  
  // Test OEM
  const oemSection1 = extractSection1Data(testData, 'oems', FY, FY2);
  const oemSection3 = extractSection3Data(testData, 'oems', FY, FY2);
  console.log('\nOEM View:');
  console.log('  Section 1:', oemSection1.title);
  console.log('  Section 3:', oemSection3.title);
  
  // Test Vendor
  const vendorSection1 = extractSection1Data(testData, 'vendors', FY, FY2);
  const vendorSection3 = extractSection3Data(testData, 'vendors', FY, FY2);
  console.log('\nVendor View:');
  console.log('  Section 1:', vendorSection1.title);
  console.log('  Section 3:', vendorSection3.title);
  
  // Test Agency
  const agencySection1 = extractSection1Data(testData, 'agencies', FY, FY2);
  const agencySection3 = extractSection3Data(testData, 'agencies', FY, FY2);
  console.log('\nAgency View:');
  console.log('  Section 1:', agencySection1.title);
  console.log('  Section 3:', agencySection3.title);
  
  console.log('\n=== Test Complete ===');
}