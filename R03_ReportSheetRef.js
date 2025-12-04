/**
 * R03_ReportsSheetReference.gs
 * ============================================================================
 * REFERENCE DOCUMENT - Reports Sheet Backend Structure
 * ============================================================================
 * 
 * This file documents the structure of the Reports sheet and all JSON formats
 * used for report storage and retrieval.
 * 
 * SPREADSHEET: 18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE
 * SHEET NAME: Reports
 * 
 * VERSION: 1.0
 * LAST UPDATED: 2025-12-02
 * ============================================================================
 */

// ============================================================================
// SECTION 1: REPORTS SHEET COLUMN STRUCTURE
// ============================================================================

const REPORTS_SHEET_COLUMNS = {
  A: {
    index: 0,
    name: 'Report Type',
    description: 'Category/type of report',
    dataType: 'String',
    required: true,
    examples: ['Discount Offers', 'OneGov Monthly Savings', 'Quarterly Summary']
  },
  B: {
    index: 1,
    name: 'Report Data Link',
    description: 'URL to source data spreadsheet or file',
    dataType: 'URL String',
    required: false,
    examples: ['https://docs.google.com/spreadsheets/d/...']
  },
  C: {
    index: 2,
    name: 'Report JSON',
    description: 'Full report data in JSON format (structure varies by report type)',
    dataType: 'JSON String',
    required: true,
    maxSize: 'Up to 50,000 characters',
    notes: 'Must be valid parseable JSON'
  },
  D: {
    index: 3,
    name: 'Report Drive URL',
    description: 'URL to final exported report document in Drive',
    dataType: 'URL String',
    required: false,
    examples: ['https://drive.google.com/file/d/.../view']
  },
  E: {
    index: 4,
    name: 'Report Creator',
    description: 'Email of user who generated the report',
    dataType: 'Email String',
    required: true,
    examples: ['gerald.mavis@gsa.gov']
  },
  F: {
    index: 5,
    name: 'Report Timestamp',
    description: 'Date/time when report was generated',
    dataType: 'Date String or Date Object',
    required: true,
    formats: ['MM/DD/YYYY', 'YYYY-MM-DDTHH:mm:ss.sssZ', 'Date object']
  },
  G: {
    index: 6,
    name: 'Level 1 Reviewer',
    description: 'Email of Level 1 reviewer',
    dataType: 'Email String',
    required: false,
    examples: ['reviewer1@gsa.gov']
  },
  H: {
    index: 7,
    name: 'Level 1 Review Timestamp',
    description: 'Date/time when Level 1 review was completed',
    dataType: 'Date String or Date Object',
    required: false,
    formats: ['MM/DD/YYYY', 'YYYY-MM-DDTHH:mm:ss.sssZ', 'Date object']
  },
  I: {
    index: 8,
    name: 'Level 2 Reviewer',
    description: 'Email of Level 2 reviewer',
    dataType: 'Email String',
    required: false,
    examples: ['reviewer2@gsa.gov']
  },
  J: {
    index: 9,
    name: 'Level 2 Review Timestamp',
    description: 'Date/time when Level 2 review was completed',
    dataType: 'Date String or Date Object',
    required: false,
    formats: ['MM/DD/YYYY', 'YYYY-MM-DDTHH:mm:ss.sssZ', 'Date object']
  }
};

// ============================================================================
// SECTION 2: REPORT TYPE - "Discount Offers"
// ============================================================================

/**
 * Discount Offers JSON Structure
 * 
 * Top-level keys are OEM names, each containing product offerings.
 * Used for tracking negotiated discount pricing on GSA Advantage.
 */
const DISCOUNT_OFFERS_JSON_SCHEMA = {
  description: 'OEM-keyed object containing product discount information',
  structure: {
    '[OEM_NAME]': {
      type: 'Object',
      description: 'Container for all products from this OEM',
      keys: 'Product SIN or Part Number',
      value: {
        description: {
          type: 'String',
          description: 'Product name and details'
        },
        commercial_price: {
          type: 'Number or Empty String',
          description: 'Standard commercial/list price'
        },
        discount_price: {
          type: 'Number or Empty String',
          description: 'Negotiated OneGov discount price (if available)'
        },
        advantage_link: {
          type: 'URL String',
          description: 'Link to GSA Advantage product page'
        },
        sin: {
          type: 'String',
          description: 'Schedule Item Number or Part Number'
        }
      }
    }
  },
  example: {
    "Google": {
      "GWS-ENTPL-AC-1": {
        "description": "Enterprise Advanced for Government-Promo",
        "commercial_price": 770.18,
        "discount_price": "",
        "advantage_link": "https://www.gsaadvantage.gov/advantage/ws/catalog/product_detail?gsin=11000121757071",
        "sin": "GWS-ENTPL-AC-1"
      }
    },
    "Oracle": {
      "A90611": {
        "description": "Oracle Database Enterprise Edition - Processor Perpetual",
        "commercial_price": 47500,
        "discount_price": "",
        "advantage_link": "https://www.gsaadvantage.gov/advantage/ws/catalog/product_detail?gsin=11000012824744",
        "sin": "A90611"
      }
    }
  },
  oems_supported: [
    'Google', 'Oracle', 'Adobe', 'Elastic', 'Salesforce', 
    'Box', 'DocuSign', 'Microsoft', 'OpenAI'
  ]
};

// ============================================================================
// SECTION 3: REPORT TYPE - "OneGov Monthly Savings"
// ============================================================================

/**
 * OneGov Monthly Savings JSON Structure
 * 
 * Comprehensive report format for monthly savings analysis.
 * Generated by the bound script's report generator.
 */
const ONEGOV_MONTHLY_SAVINGS_JSON_SCHEMA = {
  description: 'Full monthly savings report with executive summary, charts, and tables',
  version: '2.1',
  
  structure: {
    // -------------------------------------------------------------------------
    // METADATA
    // -------------------------------------------------------------------------
    reportType: {
      type: 'String',
      value: 'OneGov Monthly Savings',
      description: 'Report type identifier'
    },
    reportVersion: {
      type: 'String',
      example: '2.1',
      description: 'Schema version for this report format'
    },
    generatedAt: {
      type: 'ISO 8601 String',
      example: '2025-12-02T18:29:11.499Z',
      description: 'Timestamp when report was generated'
    },
    generatedBy: {
      type: 'Email String',
      example: 'gerald.mavis@gsa.gov',
      description: 'User who generated the report'
    },
    reportingPeriod: {
      type: 'String',
      example: 'Jun 2025 - Sep 2025',
      description: 'Date range covered by this report'
    },

    // -------------------------------------------------------------------------
    // EXECUTIVE SUMMARY
    // -------------------------------------------------------------------------
    executiveSummary: {
      type: 'Object',
      description: 'High-level KPIs and summary statistics',
      structure: {
        data: {
          totalSavings: { type: 'Number', description: 'Total savings in dollars' },
          totalSavingsFormatted: { type: 'String', example: '$11.0M' },
          totalTransactions: { type: 'Number', description: 'Count of validated transactions' },
          totalCPL: { type: 'Number', description: 'Total Commercial Price List value' },
          totalCPLFormatted: { type: 'String', example: '$18.6M' },
          totalPaid: { type: 'Number', description: 'Total amount actually paid' },
          totalPaidFormatted: { type: 'String', example: '$7.5M' },
          overallDiscountRate: { type: 'String', example: '59.36%' },
          oemCount: { type: 'Number', description: 'Number of unique OEMs' },
          vendorCount: { type: 'Number', description: 'Number of unique vendors' },
          topOEM: { type: 'String', description: 'OEM with highest savings' },
          topOEMSavings: { type: 'String', example: '$10.1M' },
          topOEMPercent: { type: 'String', example: '91.95' }
        },
        commentary: { type: 'String', description: 'User-editable narrative text' }
      }
    },

    // -------------------------------------------------------------------------
    // FINANCIAL OVERVIEW
    // -------------------------------------------------------------------------
    financialOverview: {
      type: 'Object',
      description: 'Detailed breakdown by OEM and month',
      structure: {
        data: {
          savingsByOEM: {
            type: 'Array',
            description: 'Savings breakdown by OEM',
            itemStructure: {
              name: { type: 'String', description: 'OEM name' },
              savings: { type: 'Number', description: 'Raw savings value' },
              savingsFormatted: { type: 'String', example: '$10.1M' },
              transactions: { type: 'Number', description: 'Transaction count' },
              cpl: { type: 'Number', description: 'Commercial Price List total' },
              paid: { type: 'Number', description: 'Amount paid' },
              percentOfTotal: { type: 'String', example: '91.95' }
            }
          },
          savingsByMonth: {
            type: 'Array',
            description: 'Savings breakdown by reporting period',
            itemStructure: {
              period: { type: 'String', example: 'Jun 2025' },
              savings: { type: 'Number' },
              savingsFormatted: { type: 'String' },
              transactions: { type: 'Number' },
              cpl: { type: 'Number' },
              paid: { type: 'Number' },
              percentOfTotal: { type: 'String' }
            }
          }
        },
        commentary: { type: 'String' }
      }
    },

    // -------------------------------------------------------------------------
    // TRANSACTION DETAILS
    // -------------------------------------------------------------------------
    transactionDetails: {
      type: 'Object',
      description: 'Individual transaction records',
      structure: {
        data: {
          transactions: {
            type: 'Array',
            description: 'List of validated transactions',
            itemStructure: {
              oem: { type: 'String', description: 'Manufacturer/OEM name' },
              vendor: { type: 'String', description: 'Reseller/vendor name' },
              contract: { type: 'String', description: 'Contract number' },
              partNumber: { type: 'String', description: 'Product SIN/part number' },
              description: { type: 'String', description: 'Product description (truncated)' },
              quantity: { type: 'Number', description: 'Units purchased' },
              cplPrice: { type: 'Number', description: 'Commercial Price List total' },
              pricePaid: { type: 'Number', description: 'Actual amount paid' },
              savings: { type: 'Number', description: 'CPL - Paid' },
              discountRate: { type: 'String', example: '88.92%' },
              fundingDept: { type: 'String', description: 'Funding department' },
              reportingPeriod: { type: 'String', example: 'Jun 2025' }
            }
          },
          totalRows: { type: 'Number', description: 'Total rows in source data' },
          validatedRows: { type: 'Number', description: 'Rows with Cost Savings Validated = Y' },
          excludedRows: { type: 'Number', description: 'Rows excluded from report' }
        },
        commentary: { type: 'String' }
      }
    },

    // -------------------------------------------------------------------------
    // VENDOR ANALYSIS
    // -------------------------------------------------------------------------
    vendorAnalysis: {
      type: 'Object',
      description: 'Breakdown by vendor and contract',
      structure: {
        data: {
          byVendor: {
            type: 'Array',
            itemStructure: {
              name: { type: 'String' },
              savings: { type: 'Number' },
              savingsFormatted: { type: 'String' },
              transactions: { type: 'Number' },
              percentOfTotal: { type: 'String' }
            }
          },
          byContract: {
            type: 'Array',
            itemStructure: {
              contract: { type: 'String' },
              vendor: { type: 'String' },
              savings: { type: 'Number' },
              savingsFormatted: { type: 'String' },
              transactions: { type: 'Number' }
            }
          }
        },
        commentary: { type: 'String' }
      }
    },

    // -------------------------------------------------------------------------
    // METHODOLOGY
    // -------------------------------------------------------------------------
    methodology: {
      type: 'Object',
      description: 'Data sources and calculation methods',
      structure: {
        data: {
          dataSource: { type: 'String', example: 'TDR/BIC transactional data' },
          validationCriteria: { type: 'String', example: 'Cost Savings Validated = Y' },
          excludedTransactions: { type: 'Number' },
          calculationMethod: { type: 'String', example: 'Savings = Total CPL Price - Total Price Paid' }
        },
        commentary: { type: 'String' }
      }
    },

    // -------------------------------------------------------------------------
    // ADDENDUM
    // -------------------------------------------------------------------------
    addendum: {
      type: 'Object',
      description: 'Additional notes and context',
      structure: {
        data: { type: 'Object', description: 'Flexible structure for additional data' },
        commentary: { type: 'String' }
      }
    },

    // -------------------------------------------------------------------------
    // CHARTS
    // -------------------------------------------------------------------------
    charts: {
      type: 'Object',
      description: 'Chart configurations and data for visualization',
      structure: {
        savingsByOEM: {
          title: { type: 'String', example: 'Savings by OEM (by Month)' },
          type: { type: 'String', example: 'stackedBar' },
          driveUrl: { type: 'String', description: 'URL to exported chart image' },
          imageId: { type: 'String', description: 'Drive file ID of chart image' },
          tableData: {
            type: 'Array',
            description: 'Data for chart and companion table',
            itemStructure: {
              label: { type: 'String', description: 'OEM name' },
              value: { type: 'Number', description: 'Raw savings value' },
              valueFormatted: { type: 'String', example: '$10.1M' },
              percent: { type: 'String', example: '91.95%' },
              transactions: { type: 'Number' }
            }
          }
        },
        savingsByMonth: {
          title: { type: 'String', example: 'Savings by Month' },
          type: { type: 'String', example: 'bar' },
          driveUrl: { type: 'String' },
          imageId: { type: 'String' },
          tableData: {
            type: 'Array',
            itemStructure: {
              label: { type: 'String', example: 'Jun 2025' },
              value: { type: 'Number' },
              valueFormatted: { type: 'String' },
              percent: { type: 'String' },
              transactions: { type: 'Number' }
            }
          }
        }
      }
    },

    // -------------------------------------------------------------------------
    // TABLES
    // -------------------------------------------------------------------------
    tables: {
      type: 'Object',
      description: 'Pre-formatted table data for display',
      structure: {
        oemSummary: {
          title: { type: 'String', example: 'Savings by OEM Summary' },
          headers: { type: 'Array of Strings', example: ['OEM', 'Savings', '% of Total', 'Transactions', 'CPL', 'Paid'] },
          rows: { type: '2D Array', description: 'Each row is an array of cell values' }
        },
        monthSummary: {
          title: { type: 'String', example: 'Savings by Month Summary' },
          headers: { type: 'Array of Strings', example: ['Period', 'Savings', '% of Total', 'Transactions'] },
          rows: { type: '2D Array' }
        }
      }
    }
  }
};

// ============================================================================
// SECTION 4: BACKEND FUNCTIONS REFERENCE
// ============================================================================

/**
 * Backend functions in B01_main.gs for Reports functionality
 */
const REPORTS_BACKEND_FUNCTIONS = {
  
  getReportsForWebApp: {
    description: 'Retrieves all reports from the Reports sheet for the web app',
    location: 'B01_main.gs (end of file)',
    parameters: 'None',
    returns: {
      type: 'Object',
      structure: {
        reports: {
          type: 'Array',
          itemStructure: {
            rowNum: 'Number - Row number in sheet (2-based)',
            reportType: 'String - Column A value',
            dataLink: 'String - Column B value',
            json: 'Object|null - Parsed Column C JSON',
            driveUrl: 'String - Column D value',
            creator: 'String - Column E value',
            timestamp: 'String|Date - Column F value',
            level1Reviewer: 'String - Column G value',
            level1Timestamp: 'String|Date - Column H value',
            level2Reviewer: 'String - Column I value',
            level2Timestamp: 'String|Date - Column J value',
            hasJson: 'Boolean - Whether JSON was successfully parsed',
            canView: 'Boolean - Whether report can be viewed (has JSON or driveUrl)'
          }
        },
        error: 'String|undefined - Error message if failed'
      }
    },
    calledBy: ['F05_ExactReactWithJSON.html (ReportsView)', 'F06_OneGovSavingsReport.html']
  },

  getReportByRow: {
    description: 'Retrieves a single report by row number',
    location: 'B01_main.gs (end of file)',
    parameters: {
      rowNum: 'Number - Row number in the Reports sheet (2-based, since row 1 is header)'
    },
    returns: {
      type: 'Object',
      structure: {
        rowNum: 'Number',
        reportType: 'String',
        dataLink: 'String',
        json: 'Object|null - Full parsed JSON',
        driveUrl: 'String',
        creator: 'String',
        timestamp: 'String|Date',
        level1Reviewer: 'String',
        level1Timestamp: 'String|Date',
        level2Reviewer: 'String',
        level2Timestamp: 'String|Date',
        error: 'String|undefined'
      }
    },
    calledBy: ['F06_OneGovSavingsReport.html (loadReport)']
  },

  updateReportJson: {
    description: 'Updates the JSON in Column C (for saving commentary edits)',
    location: 'B01_main.gs (end of file)',
    parameters: {
      rowNum: 'Number - Row number to update',
      updatedJson: 'Object - Full JSON object to save'
    },
    returns: {
      success: 'Boolean',
      error: 'String|undefined'
    },
    calledBy: ['F06_OneGovSavingsReport.html (saveCommentary)']
  },

  updateReportAfterExport: {
    description: 'Updates Drive URL after export',
    location: 'B01_main.gs (end of file)',
    parameters: {
      rowNum: 'Number',
      driveUrl: 'String|null - URL for Column D'
    },
    returns: {
      success: 'Boolean',
      error: 'String|undefined'
    },
    calledBy: ['F06_OneGovSavingsReport.html (exportReport)']
  },

  saveFileToDrive: {
    description: 'Saves a base64-encoded file to a Drive folder',
    location: 'B01_main.gs (end of file)',
    parameters: {
      folderId: 'String - Drive folder ID',
      base64Data: 'String - Base64-encoded file content',
      fileName: 'String - Name for the saved file',
      mimeType: 'String - MIME type (e.g., "image/png")'
    },
    returns: {
      success: 'Boolean',
      url: 'String - Public view URL of saved file',
      id: 'String - Drive file ID',
      error: 'String|undefined'
    },
    calledBy: ['F06_OneGovSavingsReport.html (exportReport)']
  },

  testWebAppDeployment: {
    description: 'Simple test function to verify deployment is working',
    location: 'B01_main.gs (end of file)',
    parameters: 'None',
    returns: {
      status: 'String - "ok"',
      timestamp: 'String - ISO timestamp'
    },
    calledBy: ['Debug/testing purposes']
  }
};

// ============================================================================
// SECTION 5: FRONTEND FILES REFERENCE
// ============================================================================

const REPORTS_FRONTEND_FILES = {
  
  'F05_ExactReactWithJSON.html': {
    description: 'Main web app dashboard with Reports tab',
    reportsComponent: 'ReportsView',
    functionality: [
      'Displays report type cards with counts',
      'Clicking a card opens F06_OneGovSavingsReport.html',
      'Uses getReportsForWebApp() to load report metadata'
    ],
    route: 'Default (no page parameter or page=main)'
  },

  'F06_OneGovSavingsReport.html': {
    description: 'Dedicated report viewer for OneGov Savings Reports',
    functionality: [
      'Two-level dropdown: Report Type → Specific Report',
      'Renders executive summary KPI cards',
      'Renders Chart.js charts (stacked bar for OEM, bar for monthly)',
      'Renders data tables for OEM and month summaries',
      'Editable commentary textareas',
      'Save Commentary button → updateReportJson()',
      'Export Report button → captures charts as PNG, saves to Drive'
    ],
    route: '?page=savingsreport',
    chartLibrary: 'Chart.js (loaded via CDN)',
    styling: 'Inline CSS with OneGov branding (#144673 blue, #f47920 orange)'
  }
};

// ============================================================================
// SECTION 6: DRIVE FOLDER STRUCTURE
// ============================================================================

const DRIVE_FOLDERS = {
  chartImages: {
    folderId: '1z05YYe_jVHXxk7EllR-MiBio19Zbo2zo',
    description: 'Stores exported chart images (PNG)',
    sharing: 'ANYONE_WITH_LINK / VIEW'
  },
  finalReports: {
    folderId: '1lLUupgvLvzJngyzLw7GLx5sPX9gpSW4E',
    description: 'Stores final exported report documents',
    sharing: 'ANYONE_WITH_LINK / VIEW'
  }
};

// ============================================================================
// SECTION 7: WEB APP ROUTING
// ============================================================================

const WEB_APP_ROUTES = {
  default: {
    page: null,
    file: 'F05_ExactReactWithJSON',
    title: 'OneGov FIT Market'
  },
  reportbuilder: {
    page: 'reportbuilder',
    file: 'F03_ReportBuilder',
    title: 'OneGov FIT Market - Report Builder'
  },
  reporttable: {
    page: 'reporttable',
    file: 'F04_ReportTable',
    title: 'OneGov FIT Market - Report Table'
  },
  savingsreport: {
    page: 'savingsreport',
    file: 'F06_OneGovSavingsReport',
    title: 'OneGov Savings Report Viewer'
  }
};

// ============================================================================
// SECTION 8: USAGE EXAMPLES
// ============================================================================

/**
 * Example: Loading reports in frontend
 */
function exampleLoadReports() {
  // In React component:
  /*
  google.script.run
    .withSuccessHandler((result) => {
      if (result.reports) {
        const types = [...new Set(result.reports.map(r => r.reportType))];
        // Populate dropdown with types
      }
    })
    .withFailureHandler(console.error)
    .getReportsForWebApp();
  */
}

/**
 * Example: Saving commentary
 */
function exampleSaveCommentary() {
  // In F06_OneGovSavingsReport.html:
  /*
  const updatedJson = { ...currentReport.json };
  updatedJson.executiveSummary.commentary = document.getElementById('execCommentary').value;
  
  google.script.run
    .withSuccessHandler((result) => {
      if (result.success) showToast('Saved!');
    })
    .updateReportJson(currentReport.rowNum, updatedJson);
  */
}

/**
 * Example: Exporting chart to Drive
 */
function exampleExportChart() {
  // In F06_OneGovSavingsReport.html:
  /*
  const canvas = document.getElementById('oemChart');
  const base64 = canvas.toDataURL('image/png').split(',')[1];
  
  google.script.run
    .withSuccessHandler((result) => {
      if (result.success) {
        // Update report with image URL
        updateReportAfterExport(rowNum, result.url, null, null);
      }
    })
    .saveFileToDrive(
      '1z05YYe_jVHXxk7EllR-MiBio19Zbo2zo',
      base64,
      'OEM_Chart_2025-12-02.png',
      'image/png'
    );
  */
}

// ============================================================================
// END OF REFERENCE DOCUMENT
// ============================================================================