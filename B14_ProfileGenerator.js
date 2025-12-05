/**
 * ============================================================================
 * B14_ProfileGenerator.gs - Executive Profile Document Generator
 * ============================================================================
 * 
 * OneGov FIT Market - Entity Profile Generation System
 * Version: 1.0.0
 * Last Updated: 2025-12-04
 * 
 * PURPOSE:
 * Generates Executive Profile documents from Entity Detail views using
 * Google Doc templates with placeholder replacement.
 * 
 * SUPPORTED PROFILE TYPES:
 * - Executive Profile (1-Page Profile)
 * 
 * DATA SOURCES (JSON Columns):
 * - Column D: Obligations (fiscal year totals)
 * - Column H: Contract Vehicle (top contract vehicles)
 * - Column I: Funding Department (top departments)
 * - Column O: AI Product (top products by fiscal year)
 * - Column R: Reseller (for OEM view)
 * - Column U: FAS OEM (for Vendor/Agency view)
 * - Column X: OneGov Tier (tier by fiscal year)
 * - Column AC: USAi Profile (company overview, website, etc.)
 * - Column AD: Website (fallback)
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
 * TO CHANGE FISCAL YEAR FOR ALL REPORTS:
 * Simply update this value to '2025', '2026', etc.
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
const PROFILES_FOLDER_ID = 'YOUR_FOLDER_ID_HERE';

/**
 * Template IDs for Executive Profile
 * Replace with your actual Google Doc template IDs
 * 
 * To get template ID: Open Google Doc → copy ID from URL
 * https://docs.google.com/document/d/XXXXXXXXXX/edit
 *                                    ^^^^^^^^^^^ This is the ID
 */
const PROFILE_TEMPLATES = {
  'Executive Profile': {
    'GSA': 'TEMPLATE_ID_EXECUTIVE_GSA',      // Replace with actual template ID
    'ITVMO': 'TEMPLATE_ID_EXECUTIVE_ITVMO'   // Replace with actual template ID
  }
};

/**
 * Profile type configuration and status
 */
const PROFILE_TYPES = {
  'Executive Profile': {
    status: 'active',  // 'active', 'development', 'disabled'
    description: 'One-page company overview with key metrics, top departments, vehicles, and partners',
    icon: '📋'
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


/**
 * Generate entity profile (preview or actual document)
 * 
 * @param {Object} entityData - Full entity data from frontend
 * @param {string} profileType - Type of profile ('Executive Profile')
 * @param {string} letterhead - 'GSA' or 'ITVMO'
 * @param {boolean} generateDoc - false=preview, true=generate document
 * @returns {Object} Result with preview data or document URL
 */
function generateEntityProfile(entityData, profileType, letterhead, generateDoc) {
  try {
    console.log(`📄 Generating ${profileType} for ${entityData.name} with ${letterhead} letterhead`);
    console.log(`📅 Using Fiscal Year: ${REPORT_FISCAL_YEAR}`);
    
    // Build placeholder data from entity JSON
    const placeholders = buildPlaceholderData(entityData);
    
    if (!generateDoc) {
      // Return preview data
      return {
        success: true,
        preview: true,
        placeholders: placeholders,
        html: generateHTMLProfile(placeholders, profileType, letterhead)
      };
    } else {
      // Generate actual document
      const html = generateHTMLProfile(placeholders, profileType, letterhead);
      const result = saveHTMLAsFile(html, entityData.name, profileType, letterhead);
      return result;
    }
    
  } catch (error) {
    console.error('Error generating entity profile:', error);
    return { success: false, error: error.toString() };
  }
}


/**
 * Generate document from template with placeholder replacement
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
      body.replaceText(`{{${key}}}`, String(value || 'N/A'));
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
 * @param {Object} entityData - Full entity data
 * @returns {Object} All placeholder key-value pairs
 */
function buildPlaceholderData(entityData) {
  const placeholders = {};
  const FY = REPORT_FISCAL_YEAR;
  const prevFY = getPreviousFiscalYear();
  
  // -------------------------------------------------------------------------
  // Basic Info & Fiscal Year
  // -------------------------------------------------------------------------
  placeholders.FISCAL_YEAR = FY;
  placeholders.FY = getFY2Digit();
  placeholders.REPORT_DATE = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMMM d, yyyy');
  
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
  // VI. Top 5 Departments (Column I)
  // -------------------------------------------------------------------------
  const topDepts = extractTopItems(entityData.fundingDepartment, 'top_10_department_summaries', FY, 5);
  for (let i = 0; i < 5; i++) {
    const dept = topDepts[i] || { name: 'N/A', value: 'N/A', pct: 'N/A' };
    placeholders[`DEPT_${i + 1}_NAME`] = dept.name;
    placeholders[`DEPT_${i + 1}_VALUE`] = dept.value;
    placeholders[`DEPT_${i + 1}_PCT`] = dept.pct;
  }
  
  // -------------------------------------------------------------------------
  // VII. Top 5 Contract Vehicles (Column H)
  // -------------------------------------------------------------------------
  const topVehicles = extractTopItems(entityData.contractVehicle, 'top_contract_summaries', FY, 5);
  for (let i = 0; i < 5; i++) {
    const vehicle = topVehicles[i] || { name: 'N/A', value: 'N/A', pct: 'N/A' };
    placeholders[`VEHICLE_${i + 1}_NAME`] = vehicle.name;
    placeholders[`VEHICLE_${i + 1}_VALUE`] = vehicle.value;
    placeholders[`VEHICLE_${i + 1}_PCT`] = vehicle.pct;
  }
  
  // -------------------------------------------------------------------------
  // VIII. Top 5 Partners - Conditional by Entity Type (Column R or U)
  // -------------------------------------------------------------------------
  const entityType = (entityData.type || entityData.entityType || '').toLowerCase();
  const partnerData = extractPartnerData(entityData, entityType, FY);
  
  placeholders.PARTNER_SECTION_TITLE = partnerData.sectionTitle;
  for (let i = 0; i < 5; i++) {
    const partner = partnerData.items[i] || { name: 'N/A', value: 'N/A', pct: 'N/A' };
    placeholders[`PARTNER_${i + 1}_NAME`] = partner.name;
    placeholders[`PARTNER_${i + 1}_VALUE`] = partner.value;
    placeholders[`PARTNER_${i + 1}_PCT`] = partner.pct;
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
    
    let changeDirection = '';
    let fullText = currentFormatted;
    
    if (prevValue > 0 && currentValue > 0) {
      if (currentValue > prevValue) {
        changeDirection = 'up';
        fullText = `${currentFormatted}, up from ${prevFormatted} in FY${prevFiscalYear.slice(-2)}`;
      } else if (currentValue < prevValue) {
        changeDirection = 'down';
        fullText = `${currentFormatted}, down from ${prevFormatted} in FY${prevFiscalYear.slice(-2)}`;
      } else {
        changeDirection = 'unchanged';
        fullText = `${currentFormatted}, unchanged from FY${prevFiscalYear.slice(-2)}`;
      }
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
 * Extract top items from object map columns (Dept, Vehicle)
 * Sorts by fiscal year value and calculates FY-specific percentage
 * 
 * @param {Object} columnData - JSON data from column
 * @param {string} itemsPath - Path to items (e.g., 'top_10_department_summaries')
 * @param {string} fiscalYear - Fiscal year to sort by
 * @param {number} count - Number of items to return
 * @returns {Array} Array of { name, value, pct }
 */
function extractTopItems(columnData, itemsPath, fiscalYear, count) {
  if (!columnData) return [];
  
  try {
    const items = columnData[itemsPath];
    if (!items || typeof items !== 'object') return [];
    
    // Calculate total for FY to get percentages
    let fyTotal = 0;
    const itemsArray = [];
    
    for (const [name, data] of Object.entries(items)) {
      const fyValue = data.fiscal_years?.[fiscalYear] || 0;
      fyTotal += fyValue;
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
      const pct = fyTotal > 0 ? Math.round((item.rawValue / fyTotal) * 100) : 0;
      return {
        name: item.name,
        value: formatCurrencyShort(item.rawValue),
        pct: `${pct}%`
      };
    });
  } catch (error) {
    console.warn('Error extracting top items:', error);
    return [];
  }
}


/**
 * Extract partner data based on entity type
 * - OEM view: Uses Column R (Resellers)
 * - Vendor/Agency view: Uses Column U (FAS OEM)
 * 
 * @param {Object} entityData - Full entity data
 * @param {string} entityType - 'oems', 'vendors', or 'agencies'
 * @param {string} fiscalYear - Fiscal year to extract
 * @returns {Object} { sectionTitle, items: [{ name, value, pct }] }
 */
function extractPartnerData(entityData, entityType, fiscalYear) {
  const result = {
    sectionTitle: 'Top 5 Partners',
    items: []
  };
  
  try {
    if (entityType.includes('oem')) {
      // OEM view: Show Top Resellers from Column R
      result.sectionTitle = 'Top 5 Resellers';
      result.items = extractTopItems(entityData.reseller, 'top_15_reseller_summaries', fiscalYear, 5);
    } else {
      // Vendor or Agency view: Show Top OEMs from Column U
      result.sectionTitle = 'Top 5 OEMs';
      result.items = extractFasOemItems(entityData.fasOem, fiscalYear, 5);
    }
  } catch (error) {
    console.warn('Error extracting partner data:', error);
  }
  
  return result;
}


/**
 * Extract FAS OEM items - special handling for Column U
 * NOTE: Column U uses 'total_obligations' instead of 'total'
 * 
 * @param {Object} fasOemData - Column U JSON data
 * @param {string} fiscalYear - Fiscal year to extract
 * @param {number} count - Number of items to return
 * @returns {Array} Array of { name, value, pct }
 */
function extractFasOemItems(fasOemData, fiscalYear, count) {
  if (!fasOemData) return [];
  
  try {
    const items = fasOemData.top_10_oem_summaries;
    if (!items || typeof items !== 'object') return [];
    
    // Calculate total for FY
    let fyTotal = 0;
    const itemsArray = [];
    
    for (const [name, data] of Object.entries(items)) {
      const fyValue = data.fiscal_years?.[fiscalYear] || 0;
      fyTotal += fyValue;
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
      const pct = fyTotal > 0 ? Math.round((item.rawValue / fyTotal) * 100) : 0;
      return {
        name: item.name,
        value: formatCurrencyShort(item.rawValue),
        pct: `${pct}%`
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


/**
 * Format currency value to full format (e.g., $68,600,000)
 * 
 * @param {number} value - Dollar amount
 * @returns {string} Formatted string
 */
function formatCurrencyFull(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}


// ============================================================================
// EMAIL & EXPORT FUNCTIONS
// ============================================================================

/**
 * Generate HTML profile from template
 * 
 * @param {Object} placeholders - All placeholder values
 * @param {string} profileType - Type of profile
 * @param {string} letterhead - 'GSA' or 'ITVMO'
 * @returns {string} HTML string with placeholders replaced
 */
function generateHTMLProfile(placeholders, profileType, letterhead) {
  // Get the HTML template
  let html = HtmlService.createHtmlOutputFromFile('F06_ExecutiveProfile').getContent();
  
  // Replace all placeholders
  for (const [key, value] of Object.entries(placeholders)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, String(value || 'N/A'));
  }
  
  // Update letterhead if ITVMO
  if (letterhead === 'ITVMO') {
    html = html.replace('GSA', 'ITVMO');
    html = html.replace('#0a2240', '#1a472a'); // Change to green theme for ITVMO
  }
  
  return html;
}

/**
 * Save HTML as file in Drive
 * 
 * @param {string} html - HTML content
 * @param {string} entityName - Entity name for filename
 * @param {string} profileType - Profile type
 * @param {string} letterhead - Letterhead type
 * @returns {Object} Result with file URL
 */
function saveHTMLAsFile(html, entityName, profileType, letterhead) {
  try {
    // Create folder if needed
    let folder;
    try {
      folder = DriveApp.getFolderById(PROFILES_FOLDER_ID);
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }
    
    // Generate filename
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
    const fileName = `${entityName}_Executive_Profile_${letterhead}_FY${getFY2Digit()}_${timestamp}.html`;
    
    // Create the HTML file
    const blob = Utilities.newBlob(html, 'text/html', fileName);
    const file = folder.createFile(blob);
    
    // Set sharing permissions
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    console.log(`✅ HTML Profile generated: ${fileName}`);
    
    return {
      success: true,
      fileId: file.getId(),
      url: file.getUrl(),
      viewUrl: `https://drive.google.com/file/d/${file.getId()}/preview`,
      fileName: fileName
    };
  } catch (error) {
    console.error('Error saving HTML file:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Generate PDF from HTML
 * 
 * @param {string} html - HTML content
 * @returns {Object} Result with PDF URL
 */
function generatePDF(html) {
  try {
    // Create temporary HTML file
    const blob = Utilities.newBlob(html, 'text/html', 'temp.html');
    
    // Convert to PDF
    const pdfBlob = blob.getAs('application/pdf');
    
    // Save PDF to Drive
    let folder;
    try {
      folder = DriveApp.getFolderById(PROFILES_FOLDER_ID);
    } catch (e) {
      folder = DriveApp.getRootFolder();
    }
    
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
    const fileName = `Executive_Profile_${timestamp}.pdf`;
    
    const file = folder.createFile(pdfBlob).setName(fileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      success: true,
      url: file.getUrl(),
      downloadUrl: `https://drive.google.com/uc?export=download&id=${file.getId()}`
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Email profile report
 * 
 * @param {string} recipient - Email address
 * @param {string} html - HTML content
 * @returns {Object} Result
 */
function emailProfileReport(recipient, html) {
  try {
    // Generate PDF attachment
    const pdfResult = generatePDF(html);
    if (!pdfResult.success) {
      return { success: false, error: 'Failed to generate PDF' };
    }
    
    // Get the PDF file
    const fileId = pdfResult.url.match(/\/d\/([a-zA-Z0-9-_]+)/)[1];
    const file = DriveApp.getFileById(fileId);
    
    // Send email
    MailApp.sendEmail({
      to: recipient,
      subject: 'OneGov FIT Market - Executive Profile Report',
      body: 'Please find attached the Executive Profile Report generated from OneGov FIT Market.',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #0a2240;">OneGov FIT Market - Executive Profile</h2>
          <p>Please find attached the Executive Profile Report.</p>
          <p style="margin-top: 20px;">
            <a href="${pdfResult.url}" 
               style="background: #f47920; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Report Online
            </a>
          </p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This email contains confidential government procurement data.<br>
            © 2024 General Services Administration
          </p>
        </div>
      `,
      attachments: [file.getBlob()]
    });
    
    console.log(`✅ Profile emailed to: ${recipient}`);
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
      overview: 'This is a test company overview.',
      website: 'https://example.com'
    },
    oneGovTier: {
      overall_tier: 'Tier 2',
      fiscal_year_tiers: {
        '2024': { tier: 'Tier 2', amount: 250000000 },
        '2023': { tier: 'Tier 3', amount: 100000000 }
      },
      tier_definitions: TIER_DEFINITIONS
    },
    obligations: {
      fiscal_year_obligations: {
        '2024': 68600000,
        '2023': 39500000
      }
    },
    fundingDepartment: {
      top_10_department_summaries: {
        'DEPT OF DEFENSE': { fiscal_years: { '2024': 29600000 }, total: 50000000 },
        'EDUCATION, DEPARTMENT OF': { fiscal_years: { '2024': 8500000 }, total: 15000000 }
      }
    },
    contractVehicle: {
      top_contract_summaries: {
        'NASA SEWP': { fiscal_years: { '2024': 35600000 }, total: 60000000 },
        'NITAAC CIO SP3': { fiscal_years: { '2024': 8500000 }, total: 15000000 }
      }
    },
    reseller: {
      top_15_reseller_summaries: {
        'DH TECHNOLOGIES, LLC': { fiscal_years: { '2024': 12000000 }, total: 25000000 },
        'NEW TECH SOLUTIONS': { fiscal_years: { '2024': 8200000 }, total: 18000000 }
      }
    },
    aiProduct: {
      fiscal_year_summaries: {
        '2024': {
          top_10_products: [
            { product: 'Product A' },
            { product: 'Product B' },
            { product: 'Product C' }
          ]
        }
      }
    }
  };
  
  // Test preview generation
  const result = generateEntityProfile(sampleEntity, 'Executive Profile', 'GSA', false);
  console.log('Preview result:', JSON.stringify(result, null, 2));
  
  // Test placeholder building
  const placeholders = buildPlaceholderData(sampleEntity);
  console.log('Placeholders:', JSON.stringify(placeholders, null, 2));
  
  console.log('=== Test Complete ===');
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
