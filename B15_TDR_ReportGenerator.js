/**
 * ============================================================================
 * B15_TDRReportGenerator.gs - TDR Savings Report Document Generator
 * ============================================================================
 * 
 * OneGov FIT Market - TDR Savings Report Generation System
 * Version: 1.1.0
 * Last Updated: 2025-12-07
 * 
 * PURPOSE:
 * Generates TDR Savings Report documents from JSON data using
 * Google Doc templates with placeholder replacement. Includes
 * two-level review workflow with email notifications.
 * 
 * FEATURES:
 * - Document generation from template
 * - Two-level review/approval workflow
 * - Reviewer edit access to documents
 * - Email notifications for approvals/rejections
 * - Access control based on review status
 * - PDF export and email delivery
 * 
 * ============================================================================
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * TDR Report Configuration
 */
const TDR_REPORT_CONFIG = {
  // Spreadsheet ID for Reports sheet
  SPREADSHEET_ID: '18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE',
  
  // Template ID for TDR Savings Report (extracted from your URL)
  TEMPLATE_ID: '1LJdxUOS-5773UE6mLUCHMnRRJXEtKKh6yaa59GG2xag',
  
  // Folder for generated reports
  REPORTS_FOLDER_ID: '1fa9rMOzg_eh3kroB6b-qj2g4T0ymUmKI',
  
  // Admin email for notifications
  ADMIN_EMAIL: 'gerald.mavis@gsa.gov',
  
  // Reports sheet configuration
  REPORTS_SHEET_NAME: 'Reports',
  
  // Column indices (0-based for array access)
  COLUMNS: {
    REPORT_TYPE: 0,           // A
    DESCRIPTION: 1,           // B
    DATA_LINK: 2,             // C
    JSON: 3,                  // D
    DRIVE_URL: 4,             // E - Report URL
    CREATOR: 5,               // F
    TIMESTAMP: 6,             // G
    LEVEL1_REVIEWER: 7,       // H
    LEVEL1_TIMESTAMP: 8,      // I
    LEVEL2_REVIEWER: 9,       // J
    LEVEL2_TIMESTAMP: 10      // K
  }
};

// ============================================================================
// REVIEW STATUS FUNCTIONS
// ============================================================================

/**
 * Get the review status for a report
 * @param {Object} report - Report object from getReportsForWebApp
 * @returns {Object} Review status details
 */
function getReviewStatus(report) {
  const hasLevel1Review = report.level1Reviewer && report.level1Timestamp;
  const hasLevel2Review = report.level2Reviewer && report.level2Timestamp;
  const isFullyApproved = hasLevel1Review && hasLevel2Review;
  
  return {
    isUnderReview: !isFullyApproved,
    isFullyApproved: isFullyApproved,
    hasLevel1Review: hasLevel1Review,
    hasLevel2Review: hasLevel2Review,
    level1Reviewer: report.level1Reviewer || null,
    level1Timestamp: report.level1Timestamp || null,
    level2Reviewer: report.level2Reviewer || null,
    level2Timestamp: report.level2Timestamp || null,
    statusText: isFullyApproved ? 'Approved' : 'Under Review'
  };
}

/**
 * Check if user can access a report based on review status
 * @param {Object} report - Report object
 * @param {string} userEmail - Current user's email
 * @returns {Object} Access status
 */
function checkReportAccess(report, userEmail) {
  const reviewStatus = getReviewStatus(report);
  const adminEmail = TDR_REPORT_CONFIG.ADMIN_EMAIL.toLowerCase();
  const currentUser = (userEmail || '').toLowerCase();
  const level1Reviewer = (report.level1Reviewer || '').toLowerCase();
  const level2Reviewer = (report.level2Reviewer || '').toLowerCase();
  
  // Fully approved - everyone can access but not edit
  if (reviewStatus.isFullyApproved) {
    return {
      canAccess: true,
      canReview: false,
      canEdit: false,
      reason: 'Report is fully approved'
    };
  }
  
  // Under review - check if user is admin or a reviewer
  const isAdmin = currentUser === adminEmail;
  const isLevel1Reviewer = currentUser === level1Reviewer;
  const isLevel2Reviewer = currentUser === level2Reviewer;
  
  if (isAdmin || isLevel1Reviewer || isLevel2Reviewer) {
    return {
      canAccess: true,
      canReview: true,
      canEdit: true,  // Reviewers can edit the document
      isAdmin: isAdmin,
      isLevel1Reviewer: isLevel1Reviewer,
      isLevel2Reviewer: isLevel2Reviewer,
      needsLevel1Review: !reviewStatus.hasLevel1Review && isLevel1Reviewer,
      needsLevel2Review: reviewStatus.hasLevel1Review && !reviewStatus.hasLevel2Review && isLevel2Reviewer,
      reason: 'User is authorized reviewer'
    };
  }
  
  // User cannot access
  return {
    canAccess: false,
    canReview: false,
    canEdit: false,
    reason: 'Report is under review. Once approved, it will be available.'
  };
}

/**
 * Get report access for current user (called from frontend)
 * @param {number} rowNum - Row number of the report
 * @returns {Object} Access details
 */
function getReportAccessForUser(rowNum) {
  try {
    const ss = SpreadsheetApp.openById(TDR_REPORT_CONFIG.SPREADSHEET_ID);
    const reportsSheet = ss.getSheetByName(TDR_REPORT_CONFIG.REPORTS_SHEET_NAME);
    
    if (!reportsSheet) {
      return { error: 'Reports sheet not found' };
    }
    
    const row = reportsSheet.getRange(rowNum, 1, 1, 11).getValues()[0];
    const userEmail = Session.getActiveUser().getEmail();
    
    const report = {
      level1Reviewer: row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER],
      level1Timestamp: row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP],
      level2Reviewer: row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER],
      level2Timestamp: row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_TIMESTAMP],
      driveUrl: row[TDR_REPORT_CONFIG.COLUMNS.DRIVE_URL]
    };
    
    const access = checkReportAccess(report, userEmail);
    access.currentUser = userEmail;
    access.reviewStatus = getReviewStatus(report);
    access.driveUrl = report.driveUrl;
    
    return access;
    
  } catch (error) {
    console.error('Error checking report access:', error);
    return { error: error.toString(), canAccess: false };
  }
}

// ============================================================================
// REVIEW APPROVAL/REJECTION FUNCTIONS
// ============================================================================

/**
 * Approve a report at Level 1 or Level 2
 * @param {number} rowNum - Row number of the report
 * @param {number} level - Review level (1 or 2)
 * @returns {Object} Result
 */
function approveReport(rowNum, level) {
  try {
    const ss = SpreadsheetApp.openById(TDR_REPORT_CONFIG.SPREADSHEET_ID);
    const reportsSheet = ss.getSheetByName(TDR_REPORT_CONFIG.REPORTS_SHEET_NAME);
    const userEmail = Session.getActiveUser().getEmail();
    const timestamp = new Date();
    
    // Get current report data
    const row = reportsSheet.getRange(rowNum, 1, 1, 11).getValues()[0];
    
    // Verify user is authorized
    const expectedReviewer = level === 1 
      ? row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER]
      : row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER];
    
    // Allow admin to approve any level
    const isAdmin = userEmail.toLowerCase() === TDR_REPORT_CONFIG.ADMIN_EMAIL.toLowerCase();
    
    if (!isAdmin && userEmail.toLowerCase() !== expectedReviewer.toLowerCase()) {
      return { 
        success: false, 
        error: `You are not authorized to perform Level ${level} review` 
      };
    }
    
    // For Level 2, ensure Level 1 is already approved
    if (level === 2 && !row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP]) {
      return {
        success: false,
        error: 'Level 1 review must be completed before Level 2'
      };
    }
    
    // Update the timestamp column
    const timestampColumn = level === 1 
      ? TDR_REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP + 1  // K
      : TDR_REPORT_CONFIG.COLUMNS.LEVEL2_TIMESTAMP + 1; // M
    
    reportsSheet.getRange(rowNum, timestampColumn).setValue(timestamp);
    SpreadsheetApp.flush();
    
    // Check if report is now fully approved
    const updatedRow = reportsSheet.getRange(rowNum, 1, 1, 11).getValues()[0];
    const isFullyApproved = updatedRow[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP] && 
                            updatedRow[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_TIMESTAMP];
    
    // Build report details for notification
    const reportDetails = buildReportDetailsForEmail(row, rowNum);
    
    if (isFullyApproved) {
      // Send notification that report is fully approved
      sendApprovalNotification(row, reportDetails, 'fully_approved');
      
      // Update document permissions - make it view-only for everyone
      updateDocumentPermissionsOnApproval(row[TDR_REPORT_CONFIG.COLUMNS.DRIVE_URL]);
    } else if (level === 1) {
      // Notify Level 2 reviewer that it's their turn
      sendApprovalNotification(row, reportDetails, 'level1_complete');
    }
    
    return {
      success: true,
      level: level,
      isFullyApproved: isFullyApproved,
      message: isFullyApproved 
        ? 'Report fully approved and now available to all users'
        : `Level ${level} review completed`
    };
    
  } catch (error) {
    console.error('Error approving report:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Update document permissions when fully approved
 * Changes from editor access to view-only
 */
function updateDocumentPermissionsOnApproval(docUrl) {
  try {
    if (!docUrl) return;
    
    const docIdMatch = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!docIdMatch) return;
    
    const docId = docIdMatch[1];
    const file = DriveApp.getFileById(docId);
    
    // Set to view-only for anyone with link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    console.log('Document permissions updated to view-only after approval');
  } catch (error) {
    console.error('Error updating document permissions:', error);
  }
}

/**
 * Reject a report
 * @param {number} rowNum - Row number of the report
 * @param {string} reason - Rejection reason (optional)
 * @returns {Object} Result
 */
function rejectReport(rowNum, reason) {
  try {
    const ss = SpreadsheetApp.openById(TDR_REPORT_CONFIG.SPREADSHEET_ID);
    const reportsSheet = ss.getSheetByName(TDR_REPORT_CONFIG.REPORTS_SHEET_NAME);
    const userEmail = Session.getActiveUser().getEmail();
    
    // Get current report data
    const row = reportsSheet.getRange(rowNum, 1, 1, 11).getValues()[0];
    
    // Verify user is a reviewer or admin
    const level1Reviewer = (row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER] || '').toLowerCase();
    const level2Reviewer = (row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER] || '').toLowerCase();
    const currentUser = userEmail.toLowerCase();
    const isAdmin = currentUser === TDR_REPORT_CONFIG.ADMIN_EMAIL.toLowerCase();
    
    if (!isAdmin && currentUser !== level1Reviewer && currentUser !== level2Reviewer) {
      return { 
        success: false, 
        error: 'You are not authorized to reject this report' 
      };
    }
    
    // Clear the timestamps to reset review status
    reportsSheet.getRange(rowNum, TDR_REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP + 1).setValue('');
    reportsSheet.getRange(rowNum, TDR_REPORT_CONFIG.COLUMNS.LEVEL2_TIMESTAMP + 1).setValue('');
    
    // Also clear the Drive URL so it will regenerate
    reportsSheet.getRange(rowNum, TDR_REPORT_CONFIG.COLUMNS.DRIVE_URL + 1).setValue('');
    
    SpreadsheetApp.flush();
    
    // Build report details and send rejection notification
    const reportDetails = buildReportDetailsForEmail(row, rowNum);
    sendRejectionNotification(row, reportDetails, userEmail, reason);
    
    return {
      success: true,
      message: 'Report rejected and returned for revision. Notifications sent.'
    };
    
  } catch (error) {
    console.error('Error rejecting report:', error);
    return { success: false, error: error.toString() };
  }
}

// ============================================================================
// EMAIL NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Build report details for email notifications
 */
function buildReportDetailsForEmail(row, rowNum) {
  let reportData = {};
  try {
    const jsonStr = row[TDR_REPORT_CONFIG.COLUMNS.JSON];
    if (jsonStr) {
      reportData = JSON.parse(jsonStr);
    }
  } catch (e) {
    console.log('Could not parse report JSON for email');
  }
  
  return {
    rowNum: rowNum,
    reportType: row[TDR_REPORT_CONFIG.COLUMNS.REPORT_TYPE] || 'Unknown',
    description: row[TDR_REPORT_CONFIG.COLUMNS.DESCRIPTION] || 'No description',
    reportingPeriod: reportData.reportingPeriod || 'Unknown period',
    totalSavings: reportData.executiveSummary?.data?.totalSavingsFormatted || 'N/A',
    totalTransactions: reportData.executiveSummary?.data?.totalTransactions || 'N/A',
    topOEM: reportData.executiveSummary?.data?.topOEM || 'N/A',
    creator: row[TDR_REPORT_CONFIG.COLUMNS.CREATOR] || 'Unknown',
    driveUrl: row[TDR_REPORT_CONFIG.COLUMNS.DRIVE_URL] || ''
  };
}

/**
 * Send approval notification emails
 */
function sendApprovalNotification(row, details, type) {
  try {
    const adminEmail = TDR_REPORT_CONFIG.ADMIN_EMAIL;
    const level1Reviewer = row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER];
    const level2Reviewer = row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER];
    
    const recipients = [adminEmail, level1Reviewer, level2Reviewer]
      .filter(email => email && email.trim())
      .filter((email, index, self) => self.indexOf(email) === index)
      .join(',');
    
    let subject, body;
    
    if (type === 'fully_approved') {
      subject = `✅ Report Approved: ${details.reportType} - ${details.reportingPeriod}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0a2240 0%, #144673 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">✅ Report Fully Approved</h2>
          </div>
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>A OneGov Savings Report has been fully approved and is now available to all users.</p>
            
            <h3 style="color: #144673; border-bottom: 2px solid #f47920; padding-bottom: 8px;">Report Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;"><strong>Report Type:</strong></td><td>${details.reportType}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Period:</strong></td><td>${details.reportingPeriod}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Total Savings:</strong></td><td style="color: #22c55e; font-weight: bold;">${details.totalSavings}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Transactions:</strong></td><td>${details.totalTransactions}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Top OEM:</strong></td><td>${details.topOEM}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Created By:</strong></td><td>${details.creator}</td></tr>
            </table>
            
            ${details.driveUrl ? `<p style="margin-top: 20px;"><a href="${details.driveUrl}" style="background: #f47920; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Report Document</a></p>` : ''}
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; font-size: 12px;">This is an automated notification from OneGov FIT Market.</p>
          </div>
        </div>
      `;
    } else if (type === 'level1_complete') {
      subject = `🔔 Level 2 Review Required: ${details.reportType} - ${details.reportingPeriod}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0a2240 0%, #144673 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🔔 Level 2 Review Required</h2>
          </div>
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Level 1 review has been completed. <strong>${level2Reviewer}</strong>, please complete Level 2 review.</p>
            
            <h3 style="color: #144673; border-bottom: 2px solid #f47920; padding-bottom: 8px;">Report Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;"><strong>Report Type:</strong></td><td>${details.reportType}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Period:</strong></td><td>${details.reportingPeriod}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Total Savings:</strong></td><td style="color: #22c55e; font-weight: bold;">${details.totalSavings}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Level 1 Reviewer:</strong></td><td>${level1Reviewer} ✅</td></tr>
            </table>
            
            ${details.driveUrl ? `<p style="margin-top: 20px;"><a href="${details.driveUrl}" style="background: #f47920; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Open Document for Review</a></p>` : ''}
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; font-size: 12px;">This is an automated notification from OneGov FIT Market.</p>
          </div>
        </div>
      `;
    }
    
    if (recipients && subject && body) {
      MailApp.sendEmail({ to: recipients, subject: subject, htmlBody: body });
      console.log(`Approval notification sent to: ${recipients}`);
    }
    
  } catch (error) {
    console.error('Error sending approval notification:', error);
  }
}

/**
 * Send rejection notification emails
 */
function sendRejectionNotification(row, details, rejectedBy, reason) {
  try {
    const adminEmail = TDR_REPORT_CONFIG.ADMIN_EMAIL;
    const level1Reviewer = row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER];
    const level2Reviewer = row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER];
    
    const recipients = [adminEmail, level1Reviewer, level2Reviewer]
      .filter(email => email && email.trim())
      .filter((email, index, self) => self.indexOf(email) === index)
      .join(',');
    
    const subject = `❌ Report Rejected: ${details.reportType} - ${details.reportingPeriod}`;
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">❌ Report Rejected</h2>
        </div>
        <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>A OneGov Savings Report has been rejected and needs to be regenerated.</p>
          
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0;">
            <strong>Rejected By:</strong> ${rejectedBy}<br>
            ${reason ? `<strong>Reason:</strong> ${reason}` : ''}
          </div>
          
          <h3 style="color: #144673; border-bottom: 2px solid #f47920; padding-bottom: 8px;">Report Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666;"><strong>Report Type:</strong></td><td>${details.reportType}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>Period:</strong></td><td>${details.reportingPeriod}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>Total Savings:</strong></td><td>${details.totalSavings}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;"><strong>Created By:</strong></td><td>${details.creator}</td></tr>
          </table>
          
          <p style="margin-top: 20px; color: #666;">Please regenerate the report and resubmit for review.</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; font-size: 12px;">This is an automated notification from OneGov FIT Market.</p>
        </div>
      </div>
    `;
    
    if (recipients) {
      MailApp.sendEmail({ to: recipients, subject: subject, htmlBody: body });
      console.log(`Rejection notification sent to: ${recipients}`);
    }
    
  } catch (error) {
    console.error('Error sending rejection notification:', error);
  }
}

// ============================================================================
// DOCUMENT GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate TDR Report Document from JSON data
 */
function generateTDRReportDocument(rowNum) {
  try {
    console.log(`📄 Generating TDR Report Document for row ${rowNum}`);
    
    const ss = SpreadsheetApp.openById(TDR_REPORT_CONFIG.SPREADSHEET_ID);
    const reportsSheet = ss.getSheetByName(TDR_REPORT_CONFIG.REPORTS_SHEET_NAME);
    
    if (!reportsSheet) {
      return { success: false, error: 'Reports sheet not found' };
    }
    
    // Get report data
    const row = reportsSheet.getRange(rowNum, 1, 1, 11).getValues()[0];
    
    // Check if document already exists
    const existingUrl = row[TDR_REPORT_CONFIG.COLUMNS.DRIVE_URL];
    if (existingUrl && existingUrl.trim()) {
      console.log(`Document already exists: ${existingUrl}`);
      return {
        success: true,
        docUrl: existingUrl,
        alreadyExists: true,
        message: 'Document already exists'
      };
    }
    
    // Parse JSON data
    let reportData = {};
    const jsonStr = row[TDR_REPORT_CONFIG.COLUMNS.JSON];
    if (jsonStr) {
      try {
        reportData = JSON.parse(jsonStr);
      } catch (e) {
        return { success: false, error: 'Failed to parse report JSON' };
      }
    } else {
      return { success: false, error: 'No JSON data found for report' };
    }
    
    // Get reviewer emails for edit access
    const level1Reviewer = row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER];
    const level2Reviewer = row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER];
    const reviewers = [level1Reviewer, level2Reviewer, TDR_REPORT_CONFIG.ADMIN_EMAIL]
      .filter(email => email && email.trim());
    
    // Build placeholders from JSON
    const placeholders = buildTDRPlaceholders(reportData);
    
    // Create document from template WITH CHARTS
    const result = createTDRDocumentWithCharts(
      placeholders, 
      reportData.reportingPeriod || 'Report', 
      reviewers,
      reportData  // Pass full report data for chart generation
    );
    
    if (result.success) {
      // Update the Drive URL in the sheet (Column G)
      reportsSheet.getRange(rowNum, TDR_REPORT_CONFIG.COLUMNS.DRIVE_URL + 1).setValue(result.docUrl);
      SpreadsheetApp.flush();
      
      console.log(`✅ Document created and URL saved: ${result.docUrl}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error generating TDR report document:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Build placeholders from JSON data
 */
function buildTDRPlaceholders(data) {
  const exec = data.executiveSummary?.data || {};
  const financial = data.financialOverview?.data || {};
  const methodology = data.methodology?.data || {};
  const vendor = data.vendorAnalysis?.data || {};
  const transactions = data.transactionDetails?.data || {};
  const allEntities = data.allEntities || {};
  
  // Parse reporting period to extract end month
  const reportingPeriod = data.reportingPeriod || 'Unknown Period';
  const periodParts = reportingPeriod.split(' - ');
  const periodStart = periodParts[0].trim();
  const periodEnd = periodParts.length > 1 ? periodParts[1].trim() : periodParts[0].trim();
  
  // Expand short month to full month name
  const monthMap = {
    'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
    'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
    'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
  };
  
  let periodEndFull = periodEnd;
  let periodStartFull = periodStart;
  for (const [short, full] of Object.entries(monthMap)) {
    if (periodEnd.startsWith(short)) {
      periodEndFull = periodEnd.replace(short, full);
    }
    if (periodStart.startsWith(short)) {
      periodStartFull = periodStart.replace(short, full);
    }
  }
  
  // Expand the "new OEMs this month" period to full month name
  let newOEMsPeriodFull = allEntities.newOEMsThisMonth?.period || periodEnd;
  for (const [short, full] of Object.entries(monthMap)) {
    if (newOEMsPeriodFull.startsWith(short)) {
      newOEMsPeriodFull = newOEMsPeriodFull.replace(short, full);
      break;
    }
  }
  
  // Get OEM list (with transactions in this report) - fallback to building from financial data
  const oemList = allEntities.oems?.formatted || 
    (financial.savingsByOEM || []).map(o => o.name).join(', ').replace(/, ([^,]*)$/, ', and $1');
  
  // Get OEM names only (for listing)
  const oemNames = allEntities.oems?.list || (financial.savingsByOEM || []).map(o => o.name);
  const oemCount = oemNames.length;
  
  // Get vendor list - use allEntities if available, otherwise build from vendorAnalysis
  const vendorsByTotal = vendor.byVendor || [];
  const vendorNames = allEntities.vendors?.list || vendorsByTotal.map(v => v.name);
  const vendorList = allEntities.vendors?.formatted || 
    vendorNames.join(', ').replace(/, ([^,]*)$/, ', and $1');
  
  // Get contract list
  const contractsByTotal = vendor.byContract || [];
  const contractList = allEntities.contracts?.formatted || 
    contractsByTotal.map(c => c.contract).join(', ');
  
  // New OEMs this month
  const newOEMsList = allEntities.newOEMsThisMonth?.list || [];
  const newOEMsFormatted = allEntities.newOEMsThisMonth?.formatted || 'None';
  const newOEMsCount = allEntities.newOEMsThisMonth?.count || 0;
  
  // Current month data (from allEntities)
  const currentMonth = allEntities.currentMonth || {};
  const currentMonthPeriod = currentMonth.period || periodEnd;
  const currentMonthTransactionCount = currentMonth.transactionCount || 0;
  const currentMonthSavings = currentMonth.savingsFormatted || '$0';
  const currentMonthOEMsFromEntities = currentMonth.oems?.formatted || 'N/A';
  const currentMonthVendorsFromEntities = currentMonth.vendors?.formatted || 'N/A';
  
  const topVendor = vendorsByTotal[0] || {};
  const secondaryVendor = vendorsByTotal[1] || {};
  const topContract = contractsByTotal[0] || {};
  const monthsByTotal = financial.savingsByMonth || [];
  const topMonth = monthsByTotal[0] || {};
  
  // Top vendor products
  const topVendorProducts = (transactions.transactions || [])
    .filter(t => t.vendor === topVendor.name)
    .map(t => t.oem)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ')
    .replace(/, ([^,]*)$/, ', and $1');
  
  // Primary driver
  const transactionsByOEM = {};
  (transactions.transactions || []).forEach(t => {
    if (!transactionsByOEM[t.oem]) {
      transactionsByOEM[t.oem] = { savings: 0, fundingDept: '' };
    }
    transactionsByOEM[t.oem].savings += t.savings;
    if (t.fundingDept && t.fundingDept !== 'Gov Wide') {
      transactionsByOEM[t.oem].fundingDept = t.fundingDept;
    }
  });
  
  const primaryDriver = Object.entries(transactionsByOEM)
    .sort((a, b) => b[1].savings - a[1].savings)[0];
  
  return {
    // Header / Date placeholders
    REPORT_TITLE: 'TDR for the OneGov Strategy Discounts',
    REPORT_DATE: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    REPORTING_PERIOD: reportingPeriod,                    // "Jun 2025 - Sep 2025"
    REPORTING_PERIOD_START: periodStart,                  // "Jun 2025"
    REPORTING_PERIOD_END: periodEnd,                      // "Sep 2025"
    REPORTING_MONTH: periodEndFull,                       // "September 2025"
    REPORTING_MONTH_START: periodStartFull,               // "June 2025"
    GENERATED_BY: data.generatedBy || Session.getActiveUser().getEmail(),
    
    // Executive Summary
    EXEC_SUMMARY_TOTAL_SAVINGS: exec.totalSavingsFormatted || '$0',
    EXEC_SUMMARY_OEM_LIST: oemList || 'N/A',
    
    // ========================================
    // ALL VENDORS (from source data)
    // ========================================
    ALL_VENDORS: vendorList || 'N/A',                     // "Carahsoft Technology Corp, Amazon Web Services, Affigent LLC, ..., and EC America"
    ALL_VENDORS_COUNT: vendorNames.length,
    
    // ========================================
    // ALL OEMs (from source data)
    // ========================================
    ALL_OEMS: oemList || 'N/A',                           // "Elastic, Salesforce, Box, Microsoft, Google, OpenAI, Palo Alto, Tenable, and xAI"
    ALL_OEMS_COUNT: oemCount,
    
    // ========================================
    // ALL CONTRACTS
    // ========================================
    ALL_CONTRACTS: contractList || 'N/A',                 // "47QSWA18D008F, 47QTCA19D00LP, ..."
    ALL_CONTRACTS_COUNT: contractsByTotal.length,
    
    // ========================================
    // NEW OEMs THIS MONTH (first appearance in last reporting period)
    // ========================================
    NEW_OEMS_THIS_MONTH: newOEMsFormatted || 'None',      // "Palo Alto, Tenable, and AIQ Phase LLC dba xAI"
    NEW_OEMS_THIS_MONTH_COUNT: newOEMsCount,
    NEW_OEMS_MONTH: newOEMsPeriodFull,                    // "September 2025"
    
    // Legacy aliases (for compatibility)
    VENDOR_LIST: vendorList || 'N/A',
    VENDOR_COUNT: vendorNames.length,
    OEM_LIST: oemList || 'N/A',
    OEM_COUNT: oemCount,
    CONTRACT_LIST: contractList || 'N/A',
    
    // ========================================
    // CURRENT MONTH STATS (from last period in reporting range)
    // ========================================
    CURRENT_MONTH: currentMonthPeriod,                    // "Sep 2025"
    CURRENT_MONTH_NAME: periodEndFull,                    // "September 2025"
    CURRENT_MONTH_TRANSACTIONS: currentMonthTransactionCount,  // Transaction count for current month
    CURRENT_MONTH_SAVINGS: currentMonthSavings,           // Savings for current month
    CURRENT_MONTH_OEMS: currentMonthOEMsFromEntities,     // OEMs with transactions in current month
    CURRENT_MONTH_VENDORS: currentMonthVendorsFromEntities,    // Vendors with transactions in current month
    CURRENT_MONTH_OEM_COUNT: currentMonth.oems?.count || 0,
    CURRENT_MONTH_VENDOR_COUNT: currentMonth.vendors?.count || 0,
    
    // Counts
    CONTRACT_COUNT: allEntities.contracts?.count || contractsByTotal.length || 0,
    TOTAL_TRANSACTIONS: exec.totalTransactions || 0,
    
    // Top month stats
    MAJORITY_SAVINGS_PERCENT: topMonth.percentOfTotal ? topMonth.percentOfTotal + '%' : 'N/A',
    MAJORITY_SAVINGS_MONTH: topMonth.period || 'Unknown',
    MAJORITY_SAVINGS_AMOUNT: topMonth.savingsFormatted || '$0',
    MAJORITY_SAVINGS_CONTRACT: topContract.contract || 'Unknown',
    
    // Vendor breakdown
    TOP_VENDOR_NAME: topVendor.name || 'Unknown',
    TOP_VENDOR_SAVINGS: topVendor.savingsFormatted || '$0',
    TOP_VENDOR_PRODUCTS: topVendorProducts || 'Various products',
    TOP_VENDOR_CONTRACT: topContract.contract || 'Unknown',
    SECONDARY_VENDOR_NAME: secondaryVendor.name || 'N/A',
    SECONDARY_VENDOR_SAVINGS: secondaryVendor.savingsFormatted || '$0',
    
    // Primary driver
    PRIMARY_DRIVER_DEPT: primaryDriver ? (primaryDriver[1].fundingDept || 'Gov Wide') : 'Unknown',
    PRIMARY_DRIVER_OEM: primaryDriver ? primaryDriver[0] : 'Unknown',
    PRIMARY_DRIVER_SAVINGS: primaryDriver ? formatCurrencyForReport(primaryDriver[1].savings) : '$0',
    
    // Methodology
    DATA_SOURCE: methodology.dataSource || 'TDR/BIC transactional data',
    VALIDATION_CRITERIA: methodology.validationCriteria || 'Cost Savings Validated = Y',
    EXCLUDED_TRANSACTIONS: methodology.excludedTransactions || 0,
    CALCULATION_METHOD: methodology.calculationMethod || 'Savings = Total CPL Price - Total Price Paid',
    
    // ========================================
    // COMMENTARY SECTIONS (user-entered or AI-generated)
    // ========================================
    EXEC_COMMENTARY: data.executiveSummary?.commentary || '',
    FINANCIAL_COMMENTARY: data.financialOverview?.commentary || '',
    METHODOLOGY_COMMENTARY: data.methodology?.commentary || '',
    TRANSACTION_COMMENTARY: data.transactionDetails?.commentary || '',
    VENDOR_COMMENTARY: data.vendorAnalysis?.commentary || '',
    ADDENDUM_COMMENTARY: data.addendum?.commentary || '',
    
    // ========================================
    // NUMBERED COMMENTARY PLACEHOLDERS (COMMENTARY_1 through COMMENTARY_15)
    // ========================================
    ...(function() {
      const commentary = data.commentary || {};
      const commentaryPlaceholders = {};
      for (let i = 1; i <= 15; i++) {
        commentaryPlaceholders[`COMMENTARY_${i}`] = commentary[String(i)] || '';
      }
      return commentaryPlaceholders;
    })(),
    
    // Summary stats
    OVERALL_DISCOUNT_RATE: exec.overallDiscountRate || '0%',
    TOP_OEM: exec.topOEM || 'Unknown',
    TOP_OEM_SAVINGS: exec.topOEMSavings || '$0',
    TOP_OEM_PERCENT: exec.topOEMPercent || '0'
  };
}

function formatCurrencyForReport(value) {
  if (value === null || value === undefined || isNaN(value)) return '$0';
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (absValue >= 1000000000) return sign + '$' + (absValue / 1000000000).toFixed(1) + 'B';
  if (absValue >= 1000000) return sign + '$' + (absValue / 1000000).toFixed(1) + 'M';
  if (absValue >= 1000) return sign + '$' + (absValue / 1000).toFixed(1) + 'K';
  return sign + '$' + absValue.toFixed(0);
}

/**
 * Create TDR document from template with reviewer edit access
 */
function createTDRDocument(placeholders, periodName, reviewerEmails) {
  try {
    console.log('📋 Creating TDR document from template');
    
    const templateId = TDR_REPORT_CONFIG.TEMPLATE_ID;
    const folderId = TDR_REPORT_CONFIG.REPORTS_FOLDER_ID;
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const safePeriod = (periodName || 'Report').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const fileName = `TDR_OneGov_Savings_${safePeriod}_${timestamp}`;
    
    const templateFile = DriveApp.getFileById(templateId);
    const targetFolder = DriveApp.getFolderById(folderId);
    const newDoc = templateFile.makeCopy(fileName, targetFolder);
    
    const doc = DocumentApp.openById(newDoc.getId());
    const body = doc.getBody();
    
    console.log(`🔄 Replacing ${Object.keys(placeholders).length} placeholders`);
    for (const [key, value] of Object.entries(placeholders)) {
      const placeholder = `{{${key}}}`;
      const replacementValue = String(value || 'N/A');
      body.replaceText(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), replacementValue);
    }
    
    doc.saveAndClose();
    
    // Set sharing - view for anyone with link
    newDoc.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Add edit access for reviewers
    if (reviewerEmails && reviewerEmails.length > 0) {
      console.log(`🔐 Granting edit access to reviewers: ${reviewerEmails.join(', ')}`);
      reviewerEmails.forEach(email => {
        if (email && email.trim()) {
          try {
            newDoc.addEditor(email.trim());
            console.log(`  ✅ Added editor: ${email}`);
          } catch (e) {
            console.log(`  ⚠️ Could not add editor ${email}: ${e.message}`);
          }
        }
      });
    }
    
    const docUrl = `https://docs.google.com/document/d/${newDoc.getId()}/edit`;
    console.log(`✅ Document created: ${fileName}`);
    
    return { success: true, docId: newDoc.getId(), docUrl: docUrl, fileName: fileName };
    
  } catch (error) {
    console.error('Error creating TDR document:', error);
    return { success: false, error: error.toString() };
  }
}

// ============================================================================
// PDF EXPORT AND EMAIL FUNCTIONS
// ============================================================================

function exportTDRReportAsPDF(rowNum) {
  try {
    const docResult = generateTDRReportDocument(rowNum);
    if (!docResult.success) return docResult;
    
    const docIdMatch = docResult.docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!docIdMatch) return { success: false, error: 'Could not extract document ID' };
    
    const doc = DriveApp.getFileById(docIdMatch[1]);
    const pdfBlob = doc.getAs('application/pdf');
    
    const folder = DriveApp.getFolderById(TDR_REPORT_CONFIG.REPORTS_FOLDER_ID);
    const pdfName = doc.getName().replace(/\.[^/.]+$/, '') + '.pdf';
    const pdfFile = folder.createFile(pdfBlob.setName(pdfName));
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { success: true, pdfUrl: pdfFile.getUrl(), pdfId: pdfFile.getId(), fileName: pdfName };
    
  } catch (error) {
    console.error('Error exporting TDR report as PDF:', error);
    return { success: false, error: error.toString() };
  }
}

function emailTDRReport(rowNum, recipient) {
  try {
    const docResult = generateTDRReportDocument(rowNum);
    if (!docResult.success) return docResult;
    
    const docIdMatch = docResult.docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!docIdMatch) return { success: false, error: 'Could not extract document ID' };
    
    const doc = DriveApp.getFileById(docIdMatch[1]);
    const pdfBlob = doc.getAs('application/pdf');
    pdfBlob.setName(doc.getName() + '.pdf');
    
    const ss = SpreadsheetApp.openById(TDR_REPORT_CONFIG.SPREADSHEET_ID);
    const reportsSheet = ss.getSheetByName(TDR_REPORT_CONFIG.REPORTS_SHEET_NAME);
    const row = reportsSheet.getRange(rowNum, 1, 1, 11).getValues()[0];
    const reportDetails = buildReportDetailsForEmail(row, rowNum);
    
    const emailRecipient = recipient || Session.getActiveUser().getEmail();
    
    MailApp.sendEmail({
      to: emailRecipient,
      subject: `OneGov Savings Report: ${reportDetails.reportingPeriod}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0a2240 0%, #144673 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">📊 OneGov Savings Report</h2>
          </div>
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <p>Please find attached the OneGov Savings Report for <strong>${reportDetails.reportingPeriod}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;"><strong>Total Savings:</strong></td><td style="color: #22c55e; font-weight: bold;">${reportDetails.totalSavings}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Transactions:</strong></td><td>${reportDetails.totalTransactions}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;"><strong>Top OEM:</strong></td><td>${reportDetails.topOEM}</td></tr>
            </table>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; font-size: 12px;">Generated by OneGov FIT Market</p>
          </div>
        </div>
      `,
      attachments: [pdfBlob]
    });
    
    return { success: true, message: `Report emailed to ${emailRecipient}` };
    
  } catch (error) {
    console.error('Error emailing TDR report:', error);
    return { success: false, error: error.toString() };
  }
}

// ============================================================================
// GET REPORTS WITH REVIEW STATUS
// ============================================================================

function getReportsWithReviewStatus() {
  const ss = SpreadsheetApp.openById(TDR_REPORT_CONFIG.SPREADSHEET_ID);
  const reportsSheet = ss.getSheetByName(TDR_REPORT_CONFIG.REPORTS_SHEET_NAME);
  const userEmail = Session.getActiveUser().getEmail();
  
  if (!reportsSheet) return { error: 'Reports sheet not found', reports: [] };
  
  const lastRow = reportsSheet.getLastRow();
  if (lastRow < 2) return { reports: [] };
  
  const data = reportsSheet.getRange(2, 1, lastRow - 1, 11).getValues();
  const reports = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;
    
    let parsedJson = null;
    const jsonStr = row[TDR_REPORT_CONFIG.COLUMNS.JSON];
    if (jsonStr) {
      try { parsedJson = JSON.parse(jsonStr); } catch (e) {}
    }
    
    const report = {
      rowNum: rowNum,
      reportType: row[TDR_REPORT_CONFIG.COLUMNS.REPORT_TYPE],
      description: row[TDR_REPORT_CONFIG.COLUMNS.DESCRIPTION],
      dataLink: row[TDR_REPORT_CONFIG.COLUMNS.DATA_LINK],
      json: parsedJson,
      driveUrl: row[TDR_REPORT_CONFIG.COLUMNS.DRIVE_URL],
      creator: row[TDR_REPORT_CONFIG.COLUMNS.CREATOR],
      timestamp: row[TDR_REPORT_CONFIG.COLUMNS.TIMESTAMP],
      level1Reviewer: row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER],
      level1Timestamp: row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP],
      level2Reviewer: row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER],
      level2Timestamp: row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_TIMESTAMP],
      hasJson: !!parsedJson,
      canView: !!parsedJson || !!row[TDR_REPORT_CONFIG.COLUMNS.DRIVE_URL]
    };
    
    report.reviewStatus = getReviewStatus(report);
    report.access = checkReportAccess(report, userEmail);
    
    reports.push(report);
  }
  
  return { reports: reports, currentUser: userEmail };
}

// ============================================================================
// CHART GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate all charts for TDR report and insert into document
 * @param {string} docId - Google Doc ID to insert charts into
 * @param {Object} reportData - Parsed JSON report data
 * @returns {Object} Result with chart URLs
 */
function generateAndInsertCharts(docId, reportData) {
  try {
    console.log('📊 Generating charts for TDR report...');
    
    const chartResults = {
      oemGauge: null,
      annualStacked: null,
      funnel: null
    };
    
    // Create temporary spreadsheet for chart generation
    const tempSS = SpreadsheetApp.create('TDR_Charts_Temp_' + new Date().getTime());
    const tempSSId = tempSS.getId();
    
    try {
      // Generate each chart
      chartResults.oemGauge = createOEMGaugeChart(tempSS, reportData);
      chartResults.annualStacked = createAnnualStackedChart(tempSS, reportData);
      chartResults.funnel = createFunnelChart(tempSS, reportData);
      
      // Insert charts into document
      insertChartsIntoDocument(docId, chartResults);
      
      console.log('✅ All charts generated and inserted');
      
    } finally {
      // Clean up - delete temporary spreadsheet
      try {
        DriveApp.getFileById(tempSSId).setTrashed(true);
        console.log('🗑️ Temporary spreadsheet deleted');
      } catch (e) {
        console.log('⚠️ Could not delete temp spreadsheet: ' + e.message);
      }
    }
    
    return { success: true, charts: chartResults };
    
  } catch (error) {
    console.error('Error generating charts:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Create OEM Gauge Chart - Shows realized savings vs CPL for each OEM
 * @param {Spreadsheet} ss - Temporary spreadsheet
 * @param {Object} reportData - Report data
 * @returns {Blob} Chart image blob
 */
function createOEMGaugeChart(ss, reportData) {
  try {
    console.log('  📈 Creating OEM Gauge Chart...');
    
    const sheet = ss.insertSheet('OEM_Gauge');
    const oemData = reportData.financialOverview?.data?.savingsByOEM || [];
    
    if (oemData.length === 0) {
      console.log('  ⚠️ No OEM data for gauge chart');
      return null;
    }
    
    // Set up data: OEM | Savings (Realized) | Remaining (CPL - Savings)
    sheet.getRange('A1:C1').setValues([['OEM', 'Realized Savings', 'Remaining Potential']]);
    
    const rows = oemData.map(oem => {
      const savings = oem.savings || 0;
      const cpl = oem.cpl || savings; // If no CPL, use savings as 100%
      const remaining = Math.max(0, cpl - savings);
      return [oem.name, savings, remaining];
    });
    
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
    
    // Create stacked bar chart (horizontal) to simulate gauge
    const chartBuilder = sheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(sheet.getRange(1, 1, rows.length + 1, 3))
      .setPosition(1, 5, 0, 0)
      .setOption('title', 'OEM Savings Realization')
      .setOption('titleTextStyle', { fontSize: 14, bold: true, color: '#0a2240' })
      .setOption('isStacked', true)
      .setOption('colors', ['#22c55e', '#e5e7eb']) // Green for realized, gray for remaining
      .setOption('legend', { position: 'bottom' })
      .setOption('hAxis', { 
        title: 'Amount ($)',
        format: 'short',
        textStyle: { fontSize: 11 }
      })
      .setOption('vAxis', { 
        textStyle: { fontSize: 11 }
      })
      .setOption('chartArea', { left: 150, top: 40, width: '60%', height: '70%' })
      .setOption('width', 600)
      .setOption('height', 400);
    
    const chart = chartBuilder.build();
    sheet.insertChart(chart);
    
    // Get chart as blob
    const chartBlob = chart.getBlob().setName('oem_gauge_chart.png');
    
    return chartBlob;
    
  } catch (error) {
    console.error('Error creating OEM gauge chart:', error);
    return null;
  }
}

/**
 * Create Annual Stacked Bar Chart - Shows savings by month with year colors
 * @param {Spreadsheet} ss - Temporary spreadsheet
 * @param {Object} reportData - Report data
 * @returns {Blob} Chart image blob
 */
function createAnnualStackedChart(ss, reportData) {
  try {
    console.log('  📊 Creating Annual Stacked Chart...');
    
    const sheet = ss.insertSheet('Annual_Stacked');
    const chartData = reportData.chartData?.stackedOEM || {};
    const oemLabels = chartData.labels || [];
    const datasets = chartData.datasets || [];
    
    if (oemLabels.length === 0 || datasets.length === 0) {
      console.log('  ⚠️ No data for annual stacked chart');
      return null;
    }
    
    // Build header row: OEM | Month1 | Month2 | ...
    const headers = ['OEM'].concat(datasets.map(d => d.label));
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Build data rows
    const rows = oemLabels.map((oem, oemIdx) => {
      const row = [oem];
      datasets.forEach(ds => {
        row.push(ds.data[oemIdx] || 0);
      });
      return row;
    });
    
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    
    // Color palette for months/years
    const colors = ['#144673', '#3a6ea5', '#5a9bd4', '#f47920', '#ff8c42', '#22c55e', '#8b5cf6', '#ef4444'];
    
    // Create stacked bar chart
    const chartBuilder = sheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(sheet.getRange(1, 1, rows.length + 1, headers.length))
      .setPosition(1, headers.length + 2, 0, 0)
      .setOption('title', 'Savings by OEM (Stacked by Period)')
      .setOption('titleTextStyle', { fontSize: 14, bold: true, color: '#0a2240' })
      .setOption('isStacked', true)
      .setOption('colors', colors.slice(0, datasets.length))
      .setOption('legend', { position: 'bottom' })
      .setOption('hAxis', { 
        title: 'Savings ($)',
        format: 'short',
        textStyle: { fontSize: 11 }
      })
      .setOption('vAxis', { 
        textStyle: { fontSize: 11 }
      })
      .setOption('chartArea', { left: 150, top: 40, width: '55%', height: '65%' })
      .setOption('width', 700)
      .setOption('height', 450);
    
    const chart = chartBuilder.build();
    sheet.insertChart(chart);
    
    const chartBlob = chart.getBlob().setName('annual_stacked_chart.png');
    
    return chartBlob;
    
  } catch (error) {
    console.error('Error creating annual stacked chart:', error);
    return null;
  }
}

/**
 * Create Funnel Chart - Shows CPL → Paid → Savings flow
 * Uses a horizontal bar chart styled as a funnel
 * @param {Spreadsheet} ss - Temporary spreadsheet
 * @param {Object} reportData - Report data
 * @returns {Blob} Chart image blob
 */
function createFunnelChart(ss, reportData) {
  try {
    console.log('  📉 Creating Funnel Chart...');
    
    const sheet = ss.insertSheet('Funnel');
    const exec = reportData.executiveSummary?.data || {};
    
    const totalCPL = exec.totalCPL || 0;
    const totalPaid = exec.totalPaid || 0;
    const totalSavings = exec.totalSavings || 0;
    
    if (totalCPL === 0) {
      console.log('  ⚠️ No data for funnel chart');
      return null;
    }
    
    // Funnel data - widest at top, narrowest at bottom
    // We'll create a stacked bar that looks like a funnel
    sheet.getRange('A1:B4').setValues([
      ['Stage', 'Amount'],
      ['Commercial Price List (CPL)', totalCPL],
      ['Amount Paid', totalPaid],
      ['Total Savings', totalSavings]
    ]);
    
    // Create bar chart (will style as funnel)
    const chartBuilder = sheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(sheet.getRange('A1:B4'))
      .setPosition(1, 4, 0, 0)
      .setOption('title', 'OneGov Savings Funnel')
      .setOption('titleTextStyle', { fontSize: 14, bold: true, color: '#0a2240' })
      .setOption('colors', ['#144673'])
      .setOption('legend', { position: 'none' })
      .setOption('hAxis', { 
        title: 'Amount ($)',
        format: 'short',
        textStyle: { fontSize: 11 }
      })
      .setOption('vAxis', { 
        textStyle: { fontSize: 12, bold: true }
      })
      .setOption('chartArea', { left: 200, top: 40, width: '55%', height: '70%' })
      .setOption('width', 600)
      .setOption('height', 350)
      .setOption('bar', { groupWidth: '70%' });
    
    const chart = chartBuilder.build();
    sheet.insertChart(chart);
    
    const chartBlob = chart.getBlob().setName('funnel_chart.png');
    
    return chartBlob;
    
  } catch (error) {
    console.error('Error creating funnel chart:', error);
    return null;
  }
}

/**
 * Insert chart images into Google Doc at placeholder locations
 * @param {string} docId - Document ID
 * @param {Object} chartBlobs - Object containing chart blobs
 */
function insertChartsIntoDocument(docId, chartBlobs) {
  try {
    console.log('📄 Inserting charts into document...');
    
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();
    
    // Chart placeholder mapping
    const chartMappings = [
      { placeholder: '{{CHART_OEM_GAUGE}}', blob: chartBlobs.oemGauge, name: 'OEM Gauge' },
      { placeholder: '{{CHART_ANNUAL_STACKED}}', blob: chartBlobs.annualStacked, name: 'Annual Stacked' },
      { placeholder: '{{CHART_FUNNEL}}', blob: chartBlobs.funnel, name: 'Funnel' }
    ];
    
    chartMappings.forEach(mapping => {
      if (mapping.blob) {
        // Find the placeholder
        const searchResult = body.findText(mapping.placeholder.replace(/[{}]/g, '\\$&'));
        
        if (searchResult) {
          const element = searchResult.getElement();
          const parent = element.getParent();
          const parentIndex = body.getChildIndex(parent);
          
          // Remove the placeholder text
          element.asText().replaceText(mapping.placeholder.replace(/[{}]/g, '\\$&'), '');
          
          // Insert image after the paragraph
          const image = body.insertImage(parentIndex + 1, mapping.blob);
          
          // Set image size (width in points, height auto-scales)
          const width = 500; // points
          const height = image.getHeight() * (width / image.getWidth());
          image.setWidth(width);
          image.setHeight(height);
          
          console.log(`  ✅ Inserted ${mapping.name} chart`);
        } else {
          console.log(`  ⚠️ Placeholder ${mapping.placeholder} not found in document`);
        }
      }
    });
    
    doc.saveAndClose();
    
  } catch (error) {
    console.error('Error inserting charts into document:', error);
  }
}

/**
 * Save chart image to Drive folder
 * @param {Blob} chartBlob - Chart image blob
 * @param {string} fileName - File name
 * @returns {string} File URL
 */
function saveChartToDrive(chartBlob, fileName) {
  try {
    const folder = DriveApp.getFolderById(TDR_REPORT_CONFIG.REPORTS_FOLDER_ID);
    const file = folder.createFile(chartBlob);
    file.setName(fileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (error) {
    console.error('Error saving chart to Drive:', error);
    return null;
  }
}

// ============================================================================
// UPDATED DOCUMENT CREATION WITH CHARTS
// ============================================================================

/**
 * Create TDR document from template with charts
 * Enhanced version that generates and inserts charts
 */
function createTDRDocumentWithCharts(placeholders, periodName, reviewerEmails, reportData) {
  try {
    console.log('📋 Creating TDR document with charts...');
    
    const templateId = TDR_REPORT_CONFIG.TEMPLATE_ID;
    const folderId = TDR_REPORT_CONFIG.REPORTS_FOLDER_ID;
    
    console.log(`🔗 Template ID: ${templateId}`);
    console.log(`📁 Folder ID: ${folderId}`);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const safePeriod = (periodName || 'Report').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const fileName = `TDR_OneGov_Savings_${safePeriod}_${timestamp}`;
    
    console.log(`📄 Attempting to access template file...`);
    const templateFile = DriveApp.getFileById(templateId);
    
    console.log(`📁 Attempting to access target folder...`);
    const targetFolder = DriveApp.getFolderById(folderId);
    
    console.log(`📋 Creating document copy: ${fileName}`);
    const newDoc = templateFile.makeCopy(fileName, targetFolder);
    
    const doc = DocumentApp.openById(newDoc.getId());
    const body = doc.getBody();
    
    // Replace text placeholders
    console.log(`🔄 Replacing ${Object.keys(placeholders).length} placeholders`);
    for (const [key, value] of Object.entries(placeholders)) {
      const placeholder = `{{${key}}}`;
      const replacementValue = String(value || 'N/A');
      body.replaceText(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), replacementValue);
    }
    
    doc.saveAndClose();
    
    // Generate and insert charts
    if (reportData) {
      generateAndInsertCharts(newDoc.getId(), reportData);
    }
    
    // Set sharing permissions
    newDoc.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Add edit access for reviewers
    if (reviewerEmails && reviewerEmails.length > 0) {
      console.log(`🔐 Granting edit access to reviewers`);
      reviewerEmails.forEach(email => {
        if (email && email.trim()) {
          try {
            newDoc.addEditor(email.trim());
          } catch (e) {
            console.log(`  ⚠️ Could not add editor ${email}`);
          }
        }
      });
    }
    
    const docUrl = `https://docs.google.com/document/d/${newDoc.getId()}/edit`;
    console.log(`✅ Document with charts created: ${fileName}`);
    
    return { success: true, docId: newDoc.getId(), docUrl: docUrl, fileName: fileName };
    
  } catch (error) {
    console.error('Error creating TDR document with charts:', error);
    return { success: false, error: error.toString() };
  }
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

function testTDRReportGeneration() {
  console.log('=== TDR Report Generator Test ===');
  const reportsResult = getReportsWithReviewStatus();
  console.log(`Found ${reportsResult.reports?.length || 0} reports`);
  console.log('=== Test Complete ===');
}

/**
 * Test chart generation with sample data
 */
function testChartGeneration() {
  console.log('=== Chart Generation Test ===');
  
  // Sample report data
  const sampleData = {
    executiveSummary: {
      data: {
        totalSavings: 11015086.17,
        totalCPL: 18556993.98,
        totalPaid: 7541907.81
      }
    },
    financialOverview: {
      data: {
        savingsByOEM: [
          { name: 'Elastic', savings: 10128380.13, cpl: 17433400 },
          { name: 'Salesforce', savings: 820174.40, cpl: 932734.40 },
          { name: 'Box', savings: 32862, cpl: 48640 },
          { name: 'Microsoft', savings: 19233.06, cpl: 122199 },
          { name: 'Google', savings: 13674.50, cpl: 19254.50 }
        ]
      }
    },
    chartData: {
      stackedOEM: {
        labels: ['Elastic', 'Salesforce', 'Box', 'Microsoft', 'Google'],
        datasets: [
          { label: 'Jun 2025', data: [10120859.73, 236012, 0, 0, 0] },
          { label: 'Aug 2025', data: [0, 0, 0, 0, 13674.5] },
          { label: 'Sep 2025', data: [7520.4, 584162.4, 32862, 19233.06, 0] }
        ]
      }
    }
  };
  
  // Create temp spreadsheet for testing
  const tempSS = SpreadsheetApp.create('Chart_Test_' + new Date().getTime());
  
  try {
    const gaugeBlob = createOEMGaugeChart(tempSS, sampleData);
    console.log('Gauge chart:', gaugeBlob ? 'Created' : 'Failed');
    
    const stackedBlob = createAnnualStackedChart(tempSS, sampleData);
    console.log('Stacked chart:', stackedBlob ? 'Created' : 'Failed');
    
    const funnelBlob = createFunnelChart(tempSS, sampleData);
    console.log('Funnel chart:', funnelBlob ? 'Created' : 'Failed');
    
  } finally {
    DriveApp.getFileById(tempSS.getId()).setTrashed(true);
  }
  
  console.log('=== Test Complete ===');
}