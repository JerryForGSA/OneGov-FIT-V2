/**
 * B16 - Access Logging System
 * 
 * Logs user access to different views and profile generation
 * Maintains both Access Log and Profile Log in the same spreadsheet
 */

/**
 * Access Log spreadsheet configuration
 */
const ACCESS_LOG_CONFIG = {
  spreadsheetId: '1sE1N0nnqFh_EWN4konURXLP2bEj0rqF3JIyOnpPmWJU',
  accessSheetName: 'Access Log',
  profileSheetName: 'Profile Log',
};

/**
 * Log user access to different views
 * Returns a status object so the client knows to wait.
 * 
 * @param {string} view - View accessed: 'OEM', 'Agency', 'Vendor', 'Report Generator', or 'Reports'
 * @return {Object} Result object {success: boolean, message: string}
 */
function logUserAccess(view) {
  try {
    // Open the Access Log spreadsheet
    const ss = SpreadsheetApp.openById(ACCESS_LOG_CONFIG.spreadsheetId);
    const sheet = ss.getSheetByName(ACCESS_LOG_CONFIG.accessSheetName);
    
    if (!sheet) {
      throw new Error(`Sheet '${ACCESS_LOG_CONFIG.accessSheetName}' not found`);
    }
    
    // Generate timestamp and formatted date
    const timestamp = new Date();
    const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
    const day = timestamp.getDate().toString().padStart(2, '0');
    const year = timestamp.getFullYear().toString().slice(-2);
    const dateString = `${month}/${day}/${year}`;
    
    // Generate key: view_MM/DD/YY
    const key = `${view}_${dateString}`;
    
    // Get current user email (Handle cases where email is masked/unavailable)
    const userEmail = Session.getActiveUser().getEmail() || 'Anonymous/External';
    
    // Prepare row data: [Key, View, Accessed By, Timestamp]
    const rowData = [
      key,              
      view,             
      userEmail,        
      timestamp         
    ];
    
    // Append the new row
    sheet.appendRow(rowData);
    console.log(`✅ User access logged: ${key} by ${userEmail}`);
    
    return { success: true, message: `Successfully logged access to ${view}` };
    
  } catch (error) {
    console.error('❌ Error logging user access:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Log entity card click/access
 * 
 * @param {string} entityName - Name of the entity being accessed
 * @param {string} entityType - Type of entity: 'OEM', 'Agency', or 'Vendor'
 * @return {Object} Result object
 */
function logEntityAccess(entityName, entityType) {
  try {
    const ss = SpreadsheetApp.openById(ACCESS_LOG_CONFIG.spreadsheetId);
    const sheet = ss.getSheetByName(ACCESS_LOG_CONFIG.accessSheetName);
    
    if (!sheet) {
      throw new Error(`Sheet '${ACCESS_LOG_CONFIG.accessSheetName}' not found`);
    }
    
    const userEmail = Session.getActiveUser().getEmail() || 'Anonymous/External';
    const timestamp = new Date();
    
    // Generate formatted date for key (MM/DD/YY format like view logging)
    const month = (timestamp.getMonth() + 1).toString().padStart(2, '0');
    const day = timestamp.getDate().toString().padStart(2, '0');
    const year = timestamp.getFullYear().toString().slice(-2);
    const dateString = `${month}/${day}/${year}`;
    
    // Create key with entityName_MM/DD/YY format
    const key = `${entityName}_${dateString}`;
    
    // Prepare row data: [Key, View, Accessed By, Timestamp]
    const rowData = [
      key,              // A: Key (EntityName_MM/DD/YY)
      entityType,       // B: View (Entity Type)
      userEmail,        // C: Accessed By
      timestamp         // D: Timestamp
    ];
    
    sheet.appendRow(rowData);
    console.log(`✅ Entity access logged: ${key} (${entityType})`);
    
    return { success: true, message: `Entity access logged: ${entityName}` };
    
  } catch (error) {
    console.error('❌ Error logging entity access:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Log profile generation
 * 
 * @param {string} profileType - Type of profile
 * @param {string} view - Entity view: 'OEM', 'Vendor', or 'Agency'  
 * @param {string} profileLink - Google Doc URL
 * @param {string} entityName - Name of entity for key generation
 * @param {string} letterhead - Letterhead type (GSA or ITVMO)
 */
function logProfileGeneration(profileType, view, profileLink, entityName, letterhead) {
  try {
    const ss = SpreadsheetApp.openById(ACCESS_LOG_CONFIG.spreadsheetId);
    const sheet = ss.getSheetByName(ACCESS_LOG_CONFIG.profileSheetName);
    
    if (!sheet) {
      throw new Error(`Sheet '${ACCESS_LOG_CONFIG.profileSheetName}' not found`);
    }
    
    const timestamp = new Date();
    const timestampString = timestamp.toISOString();
    const key = `${profileType}_${letterhead}_${timestampString}`;
    const userEmail = Session.getActiveUser().getEmail() || 'Anonymous/External';
    
    const rowData = [
      key,              // A: Key
      view,             // B: View
      profileType,      // C: Profile Type
      letterhead,       // D: Letterhead
      profileLink,      // E: Profile Link
      userEmail,        // F: Generated By
      timestamp         // G: Timestamp
    ];
    
    sheet.appendRow(rowData);
    console.log(`✅ Profile generation logged: ${key}`);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error logging profile generation:', error);
    return { success: false, message: error.toString() };
  }
}

/* =========================================================================
   HELPER FUNCTIONS FOR FRONT-END BUTTONS
   These are wrappers that call the main logUserAccess function
   ========================================================================= */

function logOEMAccess() {
  return logUserAccess('OEM');
}

function logAgencyAccess() {
  return logUserAccess('Agency');
}

function logVendorAccess() {
  return logUserAccess('Vendor');
}

function logReportGeneratorAccess() {
  return logUserAccess('Report Generator');
}

function logReportsAccess() {
  return logUserAccess('Reports');
}

/**
 * Log general app access (Dashboard load)
 */
function logAppAccess() {
  return logUserAccess('Dashboard');
}

/* =========================================================================
   TEST FUNCTIONS FOR DEBUGGING
   ========================================================================= */

/**
 * Direct test function that can be run from Apps Script editor
 */
function testAccessLogging() {
  try {
    console.log('🧪 Testing access logging...');
    
    const ss = SpreadsheetApp.openById(ACCESS_LOG_CONFIG.spreadsheetId);
    const sheet = ss.getSheetByName(ACCESS_LOG_CONFIG.accessSheetName);
    
    if (!sheet) {
      console.error('❌ Sheet not found: ' + ACCESS_LOG_CONFIG.accessSheetName);
      return false;
    }
    
    const timestamp = new Date();
    const userEmail = Session.getActiveUser().getEmail() || 'Test User';
    const key = `DirectTest_${timestamp.getTime()}`;
    
    const rowData = [key, 'DirectTest', userEmail, timestamp];
    sheet.appendRow(rowData);
    
    console.log('✅ Test row written successfully');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

/**
 * Test entity access logging (called from frontend)
 */
function testEntityAccess() {
  try {
    const result = logEntityAccess('Test Entity', 'OEM');
    return `SUCCESS: Entity access logged - ${JSON.stringify(result)}`;
  } catch (error) {
    return `ERROR: ${error.toString()}`;
  }
}

/**
 * Simple connection test that doesn't access any spreadsheets
 */
function simpleConnectionTest() {
  return `Connection works! Time: ${new Date().toLocaleString()}`;
}

/**
 * Test function to be called from client
 */
function testLogFromClient() {
  try {
    const ss = SpreadsheetApp.openById(ACCESS_LOG_CONFIG.spreadsheetId);
    const sheet = ss.getSheetByName(ACCESS_LOG_CONFIG.accessSheetName);
    
    if (!sheet) {
      return { success: false, message: 'Sheet not found' };
    }
    
    const userEmail = Session.getActiveUser().getEmail() || 'Anonymous';
    const timestamp = new Date();
    const key = `WebTest_${timestamp.getTime()}`;
    
    const rowData = [key, 'WebTest', userEmail, timestamp];
    sheet.appendRow(rowData);
    
    return { success: true, message: `Successfully logged: ${key} by ${userEmail}` };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
