/**
 * ============================================================================
 * B15_TDR_SavingsReport_v2.gs - TDR Savings Report Document Generator
 * ============================================================================
 * 
 * OneGov FIT Market - TDR Savings Report Generation System
 * Version: 2.0.0 - Added dynamic OEM gauges section
 * Last Updated: 2025-12-08
 * 
 * PURPOSE:
 * Generates TDR Savings Report documents from JSON data using
 * Google Doc templates with placeholder replacement. Includes
 * dynamic per-OEM gauge charts with commentary.
 * 
 * NEW IN V2.0:
 * - Overall program gauge chart
 * - Dynamic per-OEM gauge charts (expands based on OEM count)
 * - Template-based commentary for each OEM
 * - {{OEM_GAUGES_SECTION}} placeholder expansion
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
  // Template ID for TDR Savings Report
  TEMPLATE_ID: '1LJdxUOS-5773UE6mLUCHMnRRJXEtKKh6yaa59GG2xag',
  
  // Folder for generated reports
  REPORTS_FOLDER_ID: '1fa9rMOzg_eh3kroB6b-qj2g4T0ymUmKI',
  
  // Admin email for notifications
  ADMIN_EMAIL: 'gerald.mavis@gsa.gov',
  
  // Reports sheet configuration
  REPORTS_SHEET_NAME: 'Reports',
  
  // Column indices (0-based for array access) - 11 COLUMN STRUCTURE
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
 */
function checkReportAccess(report, userEmail) {
  const reviewStatus = getReviewStatus(report);
  const adminEmail = TDR_REPORT_CONFIG.ADMIN_EMAIL.toLowerCase();
  const currentUser = (userEmail || '').toLowerCase();
  const level1Reviewer = (report.level1Reviewer || '').toLowerCase();
  const level2Reviewer = (report.level2Reviewer || '').toLowerCase();
  
  if (reviewStatus.isFullyApproved) {
    return {
      canAccess: true,
      canReview: false,
      canEdit: false,
      reason: 'Report is fully approved'
    };
  }
  
  const isAdmin = currentUser === adminEmail;
  const isLevel1Reviewer = currentUser === level1Reviewer;
  const isLevel2Reviewer = currentUser === level2Reviewer;
  
  if (isAdmin || isLevel1Reviewer || isLevel2Reviewer) {
    return {
      canAccess: true,
      canReview: true,
      canEdit: true,
      isAdmin: isAdmin,
      isLevel1Reviewer: isLevel1Reviewer,
      isLevel2Reviewer: isLevel2Reviewer,
      needsLevel1Review: !reviewStatus.hasLevel1Review && isLevel1Reviewer,
      needsLevel2Review: reviewStatus.hasLevel1Review && !reviewStatus.hasLevel2Review && isLevel2Reviewer,
      reason: 'User is authorized reviewer'
    };
  }
  
  return {
    canAccess: false,
    canReview: false,
    canEdit: false,
    reason: 'Report is under review. Once approved, it will be available.'
  };
}

/**
 * Get report access for current user
 */
function getReportAccessForUser(rowNum) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
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
 */
function approveReport(rowNum, level) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const reportsSheet = ss.getSheetByName(TDR_REPORT_CONFIG.REPORTS_SHEET_NAME);
    const userEmail = Session.getActiveUser().getEmail();
    const timestamp = new Date();
    
    const row = reportsSheet.getRange(rowNum, 1, 1, 11).getValues()[0];
    
    const expectedReviewer = level === 1 
      ? row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER]
      : row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER];
    
    const isAdmin = userEmail.toLowerCase() === TDR_REPORT_CONFIG.ADMIN_EMAIL.toLowerCase();
    
    if (!isAdmin && userEmail.toLowerCase() !== expectedReviewer.toLowerCase()) {
      return { 
        success: false, 
        error: `You are not authorized to perform Level ${level} review` 
      };
    }
    
    if (level === 2 && !row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP]) {
      return {
        success: false,
        error: 'Level 1 review must be completed before Level 2'
      };
    }
    
    const timestampColumn = level === 1 
      ? TDR_REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP + 1
      : TDR_REPORT_CONFIG.COLUMNS.LEVEL2_TIMESTAMP + 1;
    
    reportsSheet.getRange(rowNum, timestampColumn).setValue(timestamp);
    SpreadsheetApp.flush();
    
    const updatedRow = reportsSheet.getRange(rowNum, 1, 1, 11).getValues()[0];
    const isFullyApproved = updatedRow[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP] && 
                            updatedRow[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_TIMESTAMP];
    
    const reportDetails = buildReportDetailsForEmail(updatedRow, rowNum);
    sendApprovalNotification(updatedRow, reportDetails, level, isFullyApproved);
    
    return { 
      success: true, 
      level: level,
      isFullyApproved: isFullyApproved,
      message: `Level ${level} approval recorded successfully`
    };
    
  } catch (error) {
    console.error('Error approving report:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Reject a report
 */
function rejectReport(rowNum, reason) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const reportsSheet = ss.getSheetByName(TDR_REPORT_CONFIG.REPORTS_SHEET_NAME);
    const userEmail = Session.getActiveUser().getEmail();
    
    const row = reportsSheet.getRange(rowNum, 1, 1, 11).getValues()[0];
    
    const isAdmin = userEmail.toLowerCase() === TDR_REPORT_CONFIG.ADMIN_EMAIL.toLowerCase();
    const isLevel1Reviewer = userEmail.toLowerCase() === (row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER] || '').toLowerCase();
    const isLevel2Reviewer = userEmail.toLowerCase() === (row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER] || '').toLowerCase();
    
    if (!isAdmin && !isLevel1Reviewer && !isLevel2Reviewer) {
      return { 
        success: false, 
        error: 'You are not authorized to reject this report' 
      };
    }
    
    // Clear timestamps, JSON, and Drive URL
    reportsSheet.getRange(rowNum, TDR_REPORT_CONFIG.COLUMNS.JSON + 1).setValue('');
    reportsSheet.getRange(rowNum, TDR_REPORT_CONFIG.COLUMNS.DRIVE_URL + 1).setValue('');
    reportsSheet.getRange(rowNum, TDR_REPORT_CONFIG.COLUMNS.CREATOR + 1).setValue('');
    reportsSheet.getRange(rowNum, TDR_REPORT_CONFIG.COLUMNS.TIMESTAMP + 1).setValue('');
    reportsSheet.getRange(rowNum, TDR_REPORT_CONFIG.COLUMNS.LEVEL1_TIMESTAMP + 1).setValue('');
    reportsSheet.getRange(rowNum, TDR_REPORT_CONFIG.COLUMNS.LEVEL2_TIMESTAMP + 1).setValue('');
    
    SpreadsheetApp.flush();
    
    const reportDetails = buildReportDetailsForEmail(row, rowNum);
    sendRejectionNotification(row, reportDetails, userEmail, reason);
    
    return { 
      success: true, 
      message: 'Report rejected and reset for regeneration'
    };
    
  } catch (error) {
    console.error('Error rejecting report:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Build report details for email
 */
function buildReportDetailsForEmail(row, rowNum) {
  let parsedJson = {};
  const jsonStr = row[TDR_REPORT_CONFIG.COLUMNS.JSON];
  if (jsonStr) {
    try { parsedJson = JSON.parse(jsonStr); } catch (e) {}
  }
  
  return {
    rowNum: rowNum,
    reportType: row[TDR_REPORT_CONFIG.COLUMNS.REPORT_TYPE] || 'OneGov Monthly Savings',
    reportingPeriod: parsedJson.reportingPeriod || 'Unknown Period',
    totalSavings: parsedJson.executiveSummary?.data?.totalSavingsFormatted || '$0',
    totalTransactions: parsedJson.executiveSummary?.data?.totalTransactions || 0,
    topOEM: parsedJson.executiveSummary?.data?.topOEM || 'N/A',
    creator: row[TDR_REPORT_CONFIG.COLUMNS.CREATOR] || 'Unknown',
    driveUrl: row[TDR_REPORT_CONFIG.COLUMNS.DRIVE_URL] || ''
  };
}

/**
 * Send approval notification emails
 */
function sendApprovalNotification(row, details, level, isFullyApproved) {
  try {
    const adminEmail = TDR_REPORT_CONFIG.ADMIN_EMAIL;
    const level1Reviewer = row[TDR_REPORT_CONFIG.COLUMNS.LEVEL1_REVIEWER];
    const level2Reviewer = row[TDR_REPORT_CONFIG.COLUMNS.LEVEL2_REVIEWER];
    
    let recipients, subject, body, type;
    
    if (isFullyApproved) {
      type = 'fully_approved';
      recipients = [adminEmail, level1Reviewer, level2Reviewer]
        .filter(email => email && email.trim())
        .filter((email, index, self) => self.indexOf(email) === index)
        .join(',');
    } else if (level === 1) {
      type = 'level1_complete';
      recipients = [level2Reviewer, adminEmail]
        .filter(email => email && email.trim())
        .filter((email, index, self) => self.indexOf(email) === index)
        .join(',');
    }
    
    if (type === 'fully_approved') {
      subject = `✅ Report Fully Approved: ${details.reportType} - ${details.reportingPeriod}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">✅ Report Fully Approved</h2>
          </div>
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>The OneGov Savings Report has been fully approved and is now publicly available.</p>
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
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const reportsSheet = ss.getSheetByName(TDR_REPORT_CONFIG.REPORTS_SHEET_NAME);
    
    if (!reportsSheet) {
      return { success: false, error: 'Reports sheet not found' };
    }
    
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
      reportData
    );
    
    if (result.success) {
      // Update the Drive URL in the sheet (Column E)
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
 * VERSION 2.1: Added funding department placeholders
 */
function buildTDRPlaceholders(data) {
  const exec = data.executiveSummary?.data || {};
  const financial = data.financialOverview?.data || {};
  const methodology = data.methodology?.data || {};
  const vendor = data.vendorAnalysis?.data || {};
  const transactions = data.transactionDetails?.data || {};
  const allEntities = data.allEntities || {};
  const gaugeData = data.gaugeData || {};
  const fundingDeptAnalysis = data.fundingDeptAnalysis?.data || {};
  
  // Parse reporting period
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
    if (periodEnd.startsWith(short)) periodEndFull = periodEnd.replace(short, full);
    if (periodStart.startsWith(short)) periodStartFull = periodStart.replace(short, full);
  }
  
  // New OEMs period
  let newOEMsPeriodFull = allEntities.newOEMsThisMonth?.period || periodEnd;
  for (const [short, full] of Object.entries(monthMap)) {
    if (newOEMsPeriodFull.startsWith(short)) {
      newOEMsPeriodFull = newOEMsPeriodFull.replace(short, full);
      break;
    }
  }
  
  // Entity lists
  const oemList = allEntities.oems?.formatted || 
    (financial.savingsByOEM || []).map(o => o.name).join(', ').replace(/, ([^,]*)$/, ', and $1');
  const oemNames = allEntities.oems?.list || (financial.savingsByOEM || []).map(o => o.name);
  const oemCount = oemNames.length;
  
  const vendorsByTotal = vendor.byVendor || [];
  const vendorNames = allEntities.vendors?.list || vendorsByTotal.map(v => v.name);
  const vendorList = allEntities.vendors?.formatted || vendorNames.join(', ').replace(/, ([^,]*)$/, ', and $1');
  
  const contractsByTotal = vendor.byContract || [];
  const contractList = allEntities.contracts?.formatted || contractsByTotal.map(c => c.contract).join(', ');
  
  // Funding departments
  const fundingDeptData = data.fundingDeptAnalysis?.data || {};
  const fundingDeptsByTotal = fundingDeptData.savingsByFundingDept || [];
  const fundingDeptNames = allEntities.fundingDepts?.list || fundingDeptsByTotal.map(f => f.name);
  const fundingDeptList = allEntities.fundingDepts?.formatted || 
    fundingDeptNames.join(', ').replace(/, ([^,]*)$/, ', and $1');
  const topFundingDept = fundingDeptsByTotal[0] || fundingDeptData.topDepartment || {};
  
  // New OEMs
  const newOEMsList = allEntities.newOEMsThisMonth?.list || [];
  const newOEMsFormatted = allEntities.newOEMsThisMonth?.formatted || 'None';
  const newOEMsCount = allEntities.newOEMsThisMonth?.count || 0;
  
  // Current month data
  const currentMonth = allEntities.currentMonth || {};
  const currentMonthPeriod = currentMonth.period || periodEnd;
  const currentMonthTransactionCount = currentMonth.transactionCount || 0;
  const currentMonthSavings = currentMonth.savingsFormatted || '$0';
  const currentMonthOEMs = currentMonth.oems?.formatted || 'N/A';
  const currentMonthVendors = currentMonth.vendors?.formatted || 'N/A';
  
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
  
  // Overall gauge data
  const overallGauge = gaugeData.overall || {};
  
  return {
    // Header / Date placeholders
    REPORT_TITLE: 'TDR for the OneGov Strategy Discounts',
    REPORT_DATE: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    REPORTING_PERIOD: reportingPeriod,
    REPORTING_PERIOD_START: periodStart,
    REPORTING_PERIOD_END: periodEnd,
    REPORTING_MONTH: periodEndFull,
    REPORTING_MONTH_START: periodStartFull,
    GENERATED_BY: data.generatedBy || Session.getActiveUser().getEmail(),
    
    // Executive Summary
    EXEC_SUMMARY_TOTAL_SAVINGS: exec.totalSavingsFormatted || '$0',
    EXEC_SUMMARY_OEM_LIST: oemList || 'N/A',
    
    // All Entities
    ALL_VENDORS: vendorList || 'N/A',
    ALL_VENDORS_COUNT: vendorNames.length,
    ALL_OEMS: oemList || 'N/A',
    ALL_OEMS_COUNT: oemCount,
    ALL_CONTRACTS: contractList || 'N/A',
    ALL_CONTRACTS_COUNT: contractsByTotal.length,
    
    // Funding Departments
    ALL_FUNDING_DEPTS: fundingDeptList || 'N/A',
    ALL_FUNDING_DEPTS_COUNT: fundingDeptNames.length,
    TOP_FUNDING_DEPT: topFundingDept.name || 'Gov Wide',
    TOP_FUNDING_DEPT_SAVINGS: topFundingDept.savingsFormatted || '$0',
    TOP_FUNDING_DEPT_PERCENT: topFundingDept.percentOfTotal ? topFundingDept.percentOfTotal + '%' : 'N/A',
    TOP_FUNDING_DEPT_TRANSACTIONS: topFundingDept.transactions || 0,
    
    // New OEMs
    NEW_OEMS_THIS_MONTH: newOEMsFormatted || 'None',
    NEW_OEMS_THIS_MONTH_COUNT: newOEMsCount,
    NEW_OEMS_MONTH: newOEMsPeriodFull,
    
    // Legacy aliases
    VENDOR_LIST: vendorList || 'N/A',
    VENDOR_COUNT: vendorNames.length,
    OEM_LIST: oemList || 'N/A',
    OEM_COUNT: oemCount,
    CONTRACT_LIST: contractList || 'N/A',
    
    // Current Month
    CURRENT_MONTH: currentMonthPeriod,
    CURRENT_MONTH_NAME: periodEndFull,
    CURRENT_MONTH_TRANSACTIONS: currentMonthTransactionCount,
    CURRENT_MONTH_SAVINGS: currentMonthSavings,
    CURRENT_MONTH_OEMS: currentMonthOEMs,
    CURRENT_MONTH_VENDORS: currentMonthVendors,
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
    
    // Overall Gauge placeholders
    OVERALL_GAUGE_REALIZED: overallGauge.realizedFormatted || '$0',
    OVERALL_GAUGE_POTENTIAL: overallGauge.potentialFormatted || '$0',
    OVERALL_GAUGE_PERCENTAGE: overallGauge.percentageFormatted || '0%',
    OVERALL_GAUGE_DISCOUNT_RATE: overallGauge.discountRateFormatted || '0%',
    OVERALL_GAUGE_COMMENTARY: overallGauge.commentary || '',
    
    // Commentary sections
    EXEC_COMMENTARY: data.executiveSummary?.commentary || '',
    FINANCIAL_COMMENTARY: data.financialOverview?.commentary || '',
    METHODOLOGY_COMMENTARY: data.methodology?.commentary || '',
    TRANSACTION_COMMENTARY: data.transactionDetails?.commentary || '',
    VENDOR_COMMENTARY: data.vendorAnalysis?.commentary || '',
    ADDENDUM_COMMENTARY: data.addendum?.commentary || '',
    
    // Summary stats
    OVERALL_DISCOUNT_RATE: exec.overallDiscountRate || '0%',
    TOP_OEM: exec.topOEM || 'Unknown',
    TOP_OEM_SAVINGS: exec.topOEMSavings || '$0',
    TOP_OEM_PERCENT: exec.topOEMPercent || '0',
    
    // ========================================
    // Funding Department Placeholders
    // ========================================
    ALL_FUNDING_DEPTS: fundingDeptList || 'N/A',
    ALL_FUNDING_DEPTS_COUNT: fundingDeptNames.length || 0,
    TOP_FUNDING_DEPT: exec.topFundingDept || fundingDeptData.topDepartment?.name || 'N/A',
    TOP_FUNDING_DEPT_SAVINGS: exec.topFundingDeptSavings || fundingDeptData.topDepartment?.savingsFormatted || '$0',
    TOP_FUNDING_DEPT_PERCENT: exec.topFundingDeptPercent || fundingDeptData.topDepartment?.percentOfTotal || '0',
    FUNDING_DEPT_COMMENTARY: data.fundingDeptAnalysis?.commentary || ''
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

// ============================================================================
// GET REPORTS WITH REVIEW STATUS
// ============================================================================

function getReportsWithReviewStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
 * V2.0: Now includes overall gauge and per-OEM gauges
 */
function generateAndInsertCharts(docId, reportData) {
  try {
    console.log('📊 Generating charts for TDR report...');
    
    const chartResults = {
      overallGauge: null,
      oemGauges: [],
      annualStacked: null,
      funnel: null
    };
    
    // Create temporary spreadsheet for chart generation
    const tempSS = SpreadsheetApp.create('TDR_Charts_Temp_' + new Date().getTime());
    const tempSSId = tempSS.getId();
    
    try {
      // Generate overall gauge
      chartResults.overallGauge = createOverallGaugeChart(tempSS, reportData);
      
      // Generate per-OEM gauges
      const oemGauges = reportData.gaugeData?.byOEM || reportData.chartData?.oemGauges || [];
      chartResults.oemGauges = createPerOEMGaugeCharts(tempSS, oemGauges);
      
      // Generate stacked and funnel charts
      chartResults.annualStacked = createAnnualStackedChart(tempSS, reportData);
      chartResults.funnel = createFunnelChart(tempSS, reportData);
      
      // Insert static charts into document
      insertChartsIntoDocument(docId, chartResults);
      
      // Expand dynamic OEM gauges section
      expandOEMGaugesSection(docId, chartResults.oemGauges, oemGauges);
      
      console.log('✅ All charts generated and inserted');
      
    } finally {
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
 * Create Overall Program Gauge Chart
 * Shows total savings realization across all OEMs
 */
function createOverallGaugeChart(ss, reportData) {
  try {
    console.log('  📈 Creating Overall Program Gauge Chart...');
    
    const sheet = ss.insertSheet('Overall_Gauge');
    const gaugeData = reportData.gaugeData?.overall || reportData.chartData?.overallGauge || {};
    
    const realized = gaugeData.realized || reportData.executiveSummary?.data?.totalSavings || 0;
    const potential = gaugeData.potential || reportData.executiveSummary?.data?.totalCPL || 0;
    const remaining = Math.max(0, potential - realized);
    
    if (potential === 0) {
      console.log('  ⚠️ No data for overall gauge chart');
      return null;
    }
    
    // Set up data
    sheet.getRange('A1:C1').setValues([['Metric', 'Realized Savings', 'Remaining Potential']]);
    sheet.getRange('A2:C2').setValues([['Program Total', realized, remaining]]);
    
    // Create stacked bar chart
    const chartBuilder = sheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(sheet.getRange('A1:C2'))
      .setPosition(1, 5, 0, 0)
      .setOption('title', 'Overall Program Savings Realization')
      .setOption('titleTextStyle', { fontSize: 16, bold: true, color: '#0a2240' })
      .setOption('isStacked', true)
      .setOption('colors', ['#22c55e', '#e5e7eb'])
      .setOption('legend', { position: 'bottom' })
      .setOption('hAxis', { 
        title: 'Amount ($)',
        format: 'short',
        textStyle: { fontSize: 11 }
      })
      .setOption('chartArea', { left: 150, top: 50, width: '60%', height: '60%' })
      .setOption('width', 600)
      .setOption('height', 200);
    
    const chart = chartBuilder.build();
    sheet.insertChart(chart);
    
    return chart.getBlob().setName('overall_gauge_chart.png');
    
  } catch (error) {
    console.error('Error creating overall gauge chart:', error);
    return null;
  }
}

/**
 * Create Per-OEM Gauge Charts
 * Returns array of chart blobs, one for each OEM
 */
function createPerOEMGaugeCharts(ss, oemGauges) {
  const charts = [];
  
  if (!oemGauges || oemGauges.length === 0) {
    console.log('  ⚠️ No OEM gauge data available');
    return charts;
  }
  
  console.log(`  📊 Creating ${oemGauges.length} per-OEM gauge charts...`);
  
  for (let i = 0; i < oemGauges.length; i++) {
    const oem = oemGauges[i];
    
    try {
      const sheetName = `OEM_Gauge_${i + 1}`;
      const sheet = ss.insertSheet(sheetName);
      
      const realized = oem.realized || 0;
      const potential = oem.potential || 0;
      const remaining = Math.max(0, potential - realized);
      
      if (potential === 0) {
        console.log(`    ⚠️ No data for ${oem.name} gauge`);
        charts.push(null);
        continue;
      }
      
      // Set up data
      sheet.getRange('A1:C1').setValues([['OEM', 'Realized Savings', 'Remaining Potential']]);
      sheet.getRange('A2:C2').setValues([[oem.name, realized, remaining]]);
      
      // Create stacked bar chart
      const chartBuilder = sheet.newChart()
        .setChartType(Charts.ChartType.BAR)
        .addRange(sheet.getRange('A1:C2'))
        .setPosition(1, 5, 0, 0)
        .setOption('title', `${oem.name} - Savings Realization`)
        .setOption('titleTextStyle', { fontSize: 14, bold: true, color: '#0a2240' })
        .setOption('isStacked', true)
        .setOption('colors', ['#22c55e', '#e5e7eb'])
        .setOption('legend', { position: 'none' })
        .setOption('hAxis', { 
          format: 'short',
          textStyle: { fontSize: 10 }
        })
        .setOption('chartArea', { left: 120, top: 40, width: '65%', height: '50%' })
        .setOption('width', 500)
        .setOption('height', 150);
      
      const chart = chartBuilder.build();
      sheet.insertChart(chart);
      
      charts.push({
        blob: chart.getBlob().setName(`oem_gauge_${i + 1}_${oem.name.replace(/\s+/g, '_')}.png`),
        oemName: oem.name,
        data: oem
      });
      
      console.log(`    ✅ Created gauge for ${oem.name}`);
      
    } catch (error) {
      console.error(`Error creating gauge for OEM ${i + 1}:`, error);
      charts.push(null);
    }
  }
  
  return charts;
}

/**
 * Create Annual Stacked Bar Chart
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
    
    const headers = ['OEM'].concat(datasets.map(d => d.label));
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    const rows = oemLabels.map((oem, oemIdx) => {
      const row = [oem];
      datasets.forEach(ds => { row.push(ds.data[oemIdx] || 0); });
      return row;
    });
    
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    
    const colors = ['#144673', '#3a6ea5', '#5a9bd4', '#f47920', '#ff8c42', '#22c55e', '#8b5cf6', '#ef4444'];
    
    const chartBuilder = sheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(sheet.getRange(1, 1, rows.length + 1, headers.length))
      .setPosition(1, headers.length + 2, 0, 0)
      .setOption('title', 'Savings by OEM (Stacked by Period)')
      .setOption('titleTextStyle', { fontSize: 14, bold: true, color: '#0a2240' })
      .setOption('isStacked', true)
      .setOption('colors', colors.slice(0, datasets.length))
      .setOption('legend', { position: 'bottom' })
      .setOption('hAxis', { title: 'Savings ($)', format: 'short', textStyle: { fontSize: 11 } })
      .setOption('vAxis', { textStyle: { fontSize: 11 } })
      .setOption('chartArea', { left: 150, top: 40, width: '55%', height: '65%' })
      .setOption('width', 700)
      .setOption('height', 450);
    
    const chart = chartBuilder.build();
    sheet.insertChart(chart);
    
    return chart.getBlob().setName('annual_stacked_chart.png');
    
  } catch (error) {
    console.error('Error creating annual stacked chart:', error);
    return null;
  }
}

/**
 * Create Funnel Chart
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
    
    sheet.getRange('A1:B4').setValues([
      ['Stage', 'Amount'],
      ['Commercial Price List (CPL)', totalCPL],
      ['Amount Paid', totalPaid],
      ['Total Savings', totalSavings]
    ]);
    
    const chartBuilder = sheet.newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(sheet.getRange('A1:B4'))
      .setPosition(1, 4, 0, 0)
      .setOption('title', 'OneGov Savings Funnel')
      .setOption('titleTextStyle', { fontSize: 14, bold: true, color: '#0a2240' })
      .setOption('colors', ['#144673'])
      .setOption('legend', { position: 'none' })
      .setOption('hAxis', { title: 'Amount ($)', format: 'short', textStyle: { fontSize: 11 } })
      .setOption('vAxis', { textStyle: { fontSize: 12, bold: true } })
      .setOption('chartArea', { left: 200, top: 40, width: '55%', height: '70%' })
      .setOption('width', 600)
      .setOption('height', 350)
      .setOption('bar', { groupWidth: '70%' });
    
    const chart = chartBuilder.build();
    sheet.insertChart(chart);
    
    return chart.getBlob().setName('funnel_chart.png');
    
  } catch (error) {
    console.error('Error creating funnel chart:', error);
    return null;
  }
}

/**
 * Insert static chart images into Google Doc at placeholder locations
 */
function insertChartsIntoDocument(docId, chartBlobs) {
  try {
    console.log('📄 Inserting static charts into document...');
    
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();
    
    // Static chart placeholder mapping
    const chartMappings = [
      { placeholder: '{{CHART_OVERALL_GAUGE}}', blob: chartBlobs.overallGauge, name: 'Overall Gauge' },
      { placeholder: '{{CHART_ANNUAL_STACKED}}', blob: chartBlobs.annualStacked, name: 'Annual Stacked' },
      { placeholder: '{{CHART_FUNNEL}}', blob: chartBlobs.funnel, name: 'Funnel' }
    ];
    
    chartMappings.forEach(mapping => {
      if (mapping.blob) {
        const searchResult = body.findText(mapping.placeholder.replace(/[{}]/g, '\\$&'));
        
        if (searchResult) {
          const element = searchResult.getElement();
          const parent = element.getParent();
          const parentIndex = body.getChildIndex(parent);
          
          element.asText().replaceText(mapping.placeholder.replace(/[{}]/g, '\\$&'), '');
          
          const image = body.insertImage(parentIndex + 1, mapping.blob);
          const width = 500;
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
 * Expand the {{OEM_GAUGES_SECTION}} placeholder with dynamic content
 * This creates a section for each OEM with gauge chart and commentary
 */
function expandOEMGaugesSection(docId, oemCharts, oemGaugeData) {
  try {
    console.log('📄 Expanding OEM Gauges Section...');
    
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();
    
    // Find the {{OEM_GAUGES_SECTION}} placeholder
    const placeholder = '{{OEM_GAUGES_SECTION}}';
    const searchResult = body.findText(placeholder.replace(/[{}]/g, '\\$&'));
    
    if (!searchResult) {
      console.log('  ⚠️ {{OEM_GAUGES_SECTION}} placeholder not found - skipping');
      doc.saveAndClose();
      return;
    }
    
    const element = searchResult.getElement();
    const parent = element.getParent();
    let insertIndex = body.getChildIndex(parent);
    
    // Remove the placeholder text
    element.asText().replaceText(placeholder.replace(/[{}]/g, '\\$&'), '');
    
    // Insert content for each OEM
    if (!oemCharts || oemCharts.length === 0) {
      // No OEMs - insert a placeholder message
      const noDataPara = body.insertParagraph(insertIndex + 1, 'No OEM-specific data available.');
      noDataPara.setItalic(true);
      console.log('  ℹ️ No OEM gauge data to insert');
      doc.saveAndClose();
      return;
    }
    
    console.log(`  📊 Inserting ${oemCharts.length} OEM gauge sections...`);
    
    for (let i = 0; i < oemCharts.length; i++) {
      const chartInfo = oemCharts[i];
      const oemData = oemGaugeData[i] || {};
      
      if (!chartInfo || !chartInfo.blob) {
        console.log(`    ⚠️ Skipping OEM ${i + 1} - no chart data`);
        continue;
      }
      
      insertIndex++;
      
      // Insert OEM header
      const headerPara = body.insertParagraph(insertIndex, chartInfo.oemName);
      headerPara.setHeading(DocumentApp.ParagraphHeading.HEADING3);
      headerPara.setBold(true);
      insertIndex++;
      
      // Insert gauge chart image
      const image = body.insertImage(insertIndex, chartInfo.blob);
      const width = 450;
      const height = image.getHeight() * (width / image.getWidth());
      image.setWidth(width);
      image.setHeight(height);
      insertIndex++;
      
      // Build and insert commentary (template-based)
      const commentary = buildOEMCommentary(oemData);
      const commentPara = body.insertParagraph(insertIndex, commentary);
      commentPara.setLineSpacing(1.15);
      insertIndex++;
      
      // Add spacer paragraph
      body.insertParagraph(insertIndex, '');
      insertIndex++;
      
      console.log(`    ✅ Inserted section for ${chartInfo.oemName}`);
    }
    
    doc.saveAndClose();
    console.log('  ✅ OEM Gauges Section expanded successfully');
    
  } catch (error) {
    console.error('Error expanding OEM gauges section:', error);
  }
}

/**
 * Build template-based commentary for an OEM
 * This generates a standardized commentary paragraph for each OEM
 */
function buildOEMCommentary(oemData) {
  if (!oemData || !oemData.name) {
    return 'No data available for this OEM.';
  }
  
  const name = oemData.name;
  const savings = oemData.realizedFormatted || '$0';
  const percentOfTotal = oemData.percentOfTotalFormatted || '0%';
  const discountRate = oemData.discountRateFormatted || '0%';
  const transactions = oemData.transactions || 0;
  const potential = oemData.potentialFormatted || '$0';
  const realization = oemData.percentageFormatted || '0%';
  
  // Build commentary based on performance
  let commentary = `${name} achieved ${savings} in savings, representing ${percentOfTotal} of total program savings. `;
  
  // Add performance context
  const realizationNum = parseFloat(oemData.percentage || 0);
  if (realizationNum >= 70) {
    commentary += `With a ${realization} savings realization rate and ${discountRate} discount, ${name} demonstrates strong contract utilization. `;
  } else if (realizationNum >= 50) {
    commentary += `The ${realization} realization rate indicates moderate utilization of available discounts. `;
  } else {
    commentary += `There may be opportunities to increase utilization of ${name}'s contracted discounts. `;
  }
  
  // Add transaction context
  if (transactions > 20) {
    commentary += `This was accomplished through ${transactions} transactions, showing consistent program adoption.`;
  } else if (transactions > 5) {
    commentary += `This was accomplished through ${transactions} transactions.`;
  } else {
    commentary += `This represents ${transactions} transaction${transactions === 1 ? '' : 's'} during the reporting period.`;
  }
  
  // If there's user-provided commentary, append it
  if (oemData.commentary && oemData.commentary.trim()) {
    commentary += '\n\n' + oemData.commentary.trim();
  }
  
  return commentary;
}

// ============================================================================
// DOCUMENT CREATION WITH CHARTS
// ============================================================================

/**
 * Create TDR document from template with charts
 */
function createTDRDocumentWithCharts(placeholders, periodName, reviewerEmails, reportData) {
  try {
    console.log('📋 Creating TDR document with charts...');
    
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
    
    // Replace text placeholders (except dynamic sections)
    console.log(`🔄 Replacing ${Object.keys(placeholders).length} placeholders`);
    for (const [key, value] of Object.entries(placeholders)) {
      const placeholder = `{{${key}}}`;
      const replacementValue = String(value || 'N/A');
      body.replaceText(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), replacementValue);
    }
    
    doc.saveAndClose();
    
    // Generate and insert charts (including dynamic OEM gauges section)
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
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
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
// TEST FUNCTIONS
// ============================================================================

function testTDRReportGeneration() {
  console.log('=== TDR Report Generator Test ===');
  const reportsResult = getReportsWithReviewStatus();
  console.log(`Found ${reportsResult.reports?.length || 0} reports`);
  console.log('=== Test Complete ===');
}

function testChartGeneration() {
  console.log('=== Chart Generation Test (V2.0 with OEM Gauges) ===');
  
  // Sample report data with gauge data
  const sampleData = {
    executiveSummary: {
      data: {
        totalSavings: 11015086.17,
        totalCPL: 18556993.98,
        totalPaid: 7541907.81
      }
    },
    gaugeData: {
      overall: {
        realized: 11015086.17,
        realizedFormatted: '$11.0M',
        potential: 18556993.98,
        potentialFormatted: '$18.6M',
        percentage: 59.36,
        percentageFormatted: '59.36%'
      },
      byOEM: [
        { name: 'Elastic', realized: 10128380.13, potential: 17433400, percentage: 58.1, transactions: 15, percentOfTotal: 91.95 },
        { name: 'Salesforce', realized: 820174.40, potential: 932734.40, percentage: 87.9, transactions: 42, percentOfTotal: 7.45 },
        { name: 'Box', realized: 32862, potential: 48640, percentage: 67.6, transactions: 8, percentOfTotal: 0.30 }
      ]
    },
    chartData: {
      stackedOEM: {
        labels: ['Elastic', 'Salesforce', 'Box'],
        datasets: [
          { label: 'Jun 2025', data: [10120859.73, 236012, 0] },
          { label: 'Sep 2025', data: [7520.4, 584162.4, 32862] }
        ]
      }
    }
  };
  
  const tempSS = SpreadsheetApp.create('Chart_Test_V2_' + new Date().getTime());
  
  try {
    const overallGauge = createOverallGaugeChart(tempSS, sampleData);
    console.log('Overall gauge chart:', overallGauge ? 'Created' : 'Failed');
    
    const oemGauges = createPerOEMGaugeCharts(tempSS, sampleData.gaugeData.byOEM);
    console.log(`Per-OEM gauge charts: ${oemGauges.filter(c => c).length} created`);
    
    const stackedBlob = createAnnualStackedChart(tempSS, sampleData);
    console.log('Stacked chart:', stackedBlob ? 'Created' : 'Failed');
    
    const funnelBlob = createFunnelChart(tempSS, sampleData);
    console.log('Funnel chart:', funnelBlob ? 'Created' : 'Failed');
    
  } finally {
    DriveApp.getFileById(tempSS.getId()).setTrashed(true);
  }
  
  console.log('=== Test Complete ===');
}