// ============================================================================
// R03_OneGovSavingsJSON_Structure.js
// ============================================================================
// REFERENCE DOCUMENT: OneGov Monthly Savings Report JSON Structure
// Version: 4.1 - SPLIT JSON (Column D = Main, Column L = Transactions)
// 
// This file documents the complete JSON structure produced by:
//   - processOneGovSavingsData() 
//   - buildOneGovSavingsJSON()
// in Reports.gs (bound script)
//
// USE: Claude Code can read this to understand available data for:
//   - Template placeholder replacement ({{ }})
//   - Chart generation
//   - Table rendering
//   - Document generation
//
// STORAGE:
//   - Column D: Main JSON (aggregations, charts, tables, config) ~15-25K chars
//   - Column L: Transactions JSON (transaction array only) ~30-60K chars
//   - Web app functions merge both columns automatically
// ============================================================================

// ============================================================================
// REPORTS SHEET COLUMNS (A-L)
// ============================================================================
/*
COLUMN | NAME                      | CONTENTS
-------|---------------------------|------------------------------------------
A      | Report Type               | "OneGov Monthly Savings" or "Discount Offers"
B      | Report Description        | User-entered description
C      | Report Data Link          | URL to source data (Sheet/CSV/XLSX)
D      | Report JSON               | MAIN JSON (no transactions) - see structure below
E      | Report Drive URL          | Final exported document URL
F      | Report Creator            | Email of generator
G      | Report Timestamp          | When JSON was generated
H      | Level 1 Reviewer          | Email of L1 reviewer
I      | Level 1 Review Timestamp  | When L1 review completed
J      | Level 2 Reviewer          | Email of L2 reviewer
K      | Level 2 Review Timestamp  | When L2 review completed
L      | Transactions JSON         | TRANSACTIONS ONLY - split for cell size limit
*/

// ============================================================================
// RAW DATA COLUMNS (22 columns from source spreadsheet)
// ============================================================================
/*
COLUMN NAME                      | USED IN                           | NOTES
---------------------------------|-----------------------------------|------------------
OEM                              | byOEM, transactions               | Required
Vendor                           | byVendor, transactions            | Required
Contract #                       | byContract, transactions          | Or "Contract"
Funding Dept                     | byFundingDept, transactions       | Or "Funding Department", default "Gov Wide"
Reporting Period                 | byMonth, transactions             | Or "Order Date"
Order Date                       | transactions                      | Fallback for Reporting Period
Manufacturer Part Number         | transactions                      | Or "Part Number"
Description of Deliverable       | transactions                      | Or "Description", truncated to 80 chars
Description of Deliverable (BIC) | (captured but not exposed)        | BIC-specific description
QTY Sold                         | summary.totalQuantity, byOEM      | Or "Quantity", default 1
$ Saved                          | ALL savings calculations          | Or "$_Saved" or "Savings" - REQUIRED
Total CPL Price                  | summary.totalCPL, byOEM.cpl       | Commercial Price List total
CPL Price                        | transactions.cplUnit              | Per-unit CPL
OneGov Price                     | transactions.oneGovPrice          | OneGov negotiated price
Total Price Paid                 | summary.totalPaid, byOEM.paid     | Actual price paid total
Price Paid Per Unit              | transactions.paidUnit             | Per-unit paid
OneGov Discount Rate             | transactions.oneGovDiscountRate   | Stated discount rate
Actual Discount Rate             | transactions.actualDiscountRate   | Calculated actual rate
Cost Savings Validated           | FILTER - only "Y"/"Yes" included  | REQUIRED for row inclusion
Data Source                      | byDataSource, transactions        | "TDR", "BIC", etc.
Also in BIC                      | byBICStatus, transactions         | "Y"/"N" - In BIC catalog?
Previously Reported Savings      | byReportingStatus, transactions   | "Y"/"N" - Reported before?
*/

// ============================================================================
// COLUMN D: MAIN JSON STRUCTURE (without transactions)
// ============================================================================

const MainJSON_ColumnD = {
  
  // ===========================================================================
  // METADATA
  // ===========================================================================
  reportType: 'OneGov Monthly Savings',        // {{REPORT_TYPE}}
  reportVersion: '4.1',                        // {{REPORT_VERSION}}
  generatedAt: '2025-01-15T10:30:00.000Z',     // {{GENERATED_AT}} - ISO timestamp
  generatedBy: 'user@agency.gov',              // {{GENERATED_BY}} - Email of generator
  reportingPeriod: 'Jan 2025 - Jun 2025',      // {{REPORTING_PERIOD}} - Date range string
  
  // Flag indicating transactions are stored separately
  transactionsInColumnL: true,                 // Always true in v4.1+

  // ===========================================================================
  // ALL ENTITIES - Complete lists for template use
  // ===========================================================================
  /*
  Use these for listing all participants in the report.
  Placeholders use dot notation: {{ALL_ENTITIES.VENDORS.FORMATTED}}
  */
  allEntities: {
    
    // --- VENDORS ---
    vendors: {
      list: ['Vendor A', 'Vendor B', 'Vendor C'],           // {{ALL_ENTITIES.VENDORS.LIST}} - Array
      formatted: 'Vendor A, Vendor B, and Vendor C',        // {{ALL_ENTITIES.VENDORS.FORMATTED}} - Natural language
      count: 3                                               // {{ALL_ENTITIES.VENDORS.COUNT}}
    },
    
    // --- OEMs ---
    oems: {
      list: ['Dell', 'HP', 'Lenovo'],                       // {{ALL_ENTITIES.OEMS.LIST}}
      formatted: 'Dell, HP, and Lenovo',                    // {{ALL_ENTITIES.OEMS.FORMATTED}}
      count: 3                                               // {{ALL_ENTITIES.OEMS.COUNT}}
    },
    
    // --- CONTRACTS ---
    contracts: {
      list: ['47QTCA-XX-0001', '47QTCA-XX-0002'],           // {{ALL_ENTITIES.CONTRACTS.LIST}}
      formatted: '47QTCA-XX-0001, 47QTCA-XX-0002',          // {{ALL_ENTITIES.CONTRACTS.FORMATTED}} - Comma joined
      count: 2                                               // {{ALL_ENTITIES.CONTRACTS.COUNT}}
    },
    
    // --- FUNDING DEPARTMENTS ---
    fundingDepts: {
      list: ['DOD', 'VA', 'DHS'],                           // {{ALL_ENTITIES.FUNDINGDEPTS.LIST}}
      formatted: 'DOD, VA, and DHS',                        // {{ALL_ENTITIES.FUNDINGDEPTS.FORMATTED}}
      count: 3                                               // {{ALL_ENTITIES.FUNDINGDEPTS.COUNT}}
    },
    
    // --- DATA SOURCES ---
    dataSources: {
      list: ['TDR', 'BIC'],                                 // {{ALL_ENTITIES.DATASOURCES.LIST}}
      formatted: 'TDR and BIC',                             // {{ALL_ENTITIES.DATASOURCES.FORMATTED}}
      count: 2                                               // {{ALL_ENTITIES.DATASOURCES.COUNT}}
    },
    
    // --- NEW OEMs THIS MONTH ---
    /*
    OEMs that appear in the last reporting period but not in any previous periods.
    Useful for highlighting new program participants.
    */
    newOEMsThisMonth: {
      list: ['NewOEM'],                                     // {{ALL_ENTITIES.NEWOEMS.LIST}}
      formatted: 'NewOEM',                                  // {{ALL_ENTITIES.NEWOEMS.FORMATTED}}
      count: 1,                                              // {{ALL_ENTITIES.NEWOEMS.COUNT}}
      period: 'Jun 2025'                                    // {{ALL_ENTITIES.NEWOEMS.PERIOD}} - Which month
    },
    
    // --- CURRENT MONTH SNAPSHOT ---
    /*
    Statistics for just the most recent reporting period.
    Useful for "This month..." statements.
    */
    currentMonth: {
      period: 'Jun 2025',                                   // {{CURRENT_MONTH.PERIOD}}
      transactionCount: 150,                                // {{CURRENT_MONTH.TRANSACTION_COUNT}}
      savings: 500000,                                      // {{CURRENT_MONTH.SAVINGS}} - Raw number
      savingsFormatted: '$500.0K',                          // {{CURRENT_MONTH.SAVINGS_FORMATTED}}
      newSavings: 400000,                                   // {{CURRENT_MONTH.NEW_SAVINGS}}
      newSavingsFormatted: '$400.0K',                       // {{CURRENT_MONTH.NEW_SAVINGS_FORMATTED}}
      previouslyReported: 100000,                           // {{CURRENT_MONTH.PREVIOUSLY_REPORTED}}
      previouslyReportedFormatted: '$100.0K',               // {{CURRENT_MONTH.PREVIOUSLY_REPORTED_FORMATTED}}
      oems: {
        list: ['Dell', 'HP'],                               // {{CURRENT_MONTH.OEMS.LIST}}
        formatted: 'Dell and HP',                           // {{CURRENT_MONTH.OEMS.FORMATTED}}
        count: 2                                             // {{CURRENT_MONTH.OEMS.COUNT}}
      },
      vendors: {
        list: ['Vendor A'],                                 // {{CURRENT_MONTH.VENDORS.LIST}}
        formatted: 'Vendor A',                              // {{CURRENT_MONTH.VENDORS.FORMATTED}}
        count: 1                                             // {{CURRENT_MONTH.VENDORS.COUNT}}
      },
      fundingDepts: {
        list: ['DOD', 'VA'],                                // {{CURRENT_MONTH.FUNDINGDEPTS.LIST}}
        formatted: 'DOD and VA',                            // {{CURRENT_MONTH.FUNDINGDEPTS.FORMATTED}}
        count: 2                                             // {{CURRENT_MONTH.FUNDINGDEPTS.COUNT}}
      }
    }
  },

  // ===========================================================================
  // COMMENTARY - User/AI populated text fields
  // ===========================================================================
  /*
  15 numbered slots for free-form commentary.
  Can be edited in web app before document generation.
  Use: {{COMMENTARY_1}}, {{COMMENTARY_2}}, etc.
  */
  commentary: {
    "1": "",    // {{COMMENTARY_1}} - Executive summary intro
    "2": "",    // {{COMMENTARY_2}} - Key highlights
    "3": "",    // {{COMMENTARY_3}} - OEM analysis
    "4": "",    // {{COMMENTARY_4}} - Vendor analysis
    "5": "",    // {{COMMENTARY_5}} - Monthly trends
    "6": "",    // {{COMMENTARY_6}} - Funding dept analysis
    "7": "",    // {{COMMENTARY_7}} - New participants
    "8": "",    // {{COMMENTARY_8}} - Recommendations
    "9": "",    // {{COMMENTARY_9}} - Methodology notes
    "10": "",   // {{COMMENTARY_10}} - Data quality notes
    "11": "",   // {{COMMENTARY_11}} - Chart 1 caption
    "12": "",   // {{COMMENTARY_12}} - Chart 2 caption
    "13": "",   // {{COMMENTARY_13}} - Chart 3 caption
    "14": "",   // {{COMMENTARY_14}} - Appendix notes
    "15": ""    // {{COMMENTARY_15}} - Additional
  },

  // ===========================================================================
  // CONFIG - Drive folder IDs
  // ===========================================================================
  config: {
    chartImagesFolderId: '1z05YYe...',                      // For saving chart images
    finalReportsFolderId: '1lLUupg...'                      // For saving final documents
  },

  // ===========================================================================
  // EXECUTIVE SUMMARY
  // ===========================================================================
  /*
  Top-level statistics for the entire report period.
  All financial values have both raw and formatted versions.
  */
  executiveSummary: {
    data: {
      // --- TOTALS ---
      totalSavings: 2500000,                                // {{EXEC.TOTAL_SAVINGS}} - Raw number
      totalSavingsFormatted: '$2.5M',                       // {{EXEC.TOTAL_SAVINGS_FORMATTED}}
      totalTransactions: 1500,                              // {{EXEC.TOTAL_TRANSACTIONS}}
      totalQuantity: 5000,                                  // {{EXEC.TOTAL_QUANTITY}} - Units purchased
      totalCPL: 10000000,                                   // {{EXEC.TOTAL_CPL}}
      totalCPLFormatted: '$10.0M',                          // {{EXEC.TOTAL_CPL_FORMATTED}}
      totalPaid: 7500000,                                   // {{EXEC.TOTAL_PAID}}
      totalPaidFormatted: '$7.5M',                          // {{EXEC.TOTAL_PAID_FORMATTED}}
      overallDiscountRate: '25.00%',                        // {{EXEC.DISCOUNT_RATE}} - Includes %
      
      // --- ENTITY COUNTS ---
      oemCount: 5,                                          // {{EXEC.OEM_COUNT}}
      vendorCount: 3,                                       // {{EXEC.VENDOR_COUNT}}
      contractCount: 8,                                     // {{EXEC.CONTRACT_COUNT}}
      fundingDeptCount: 12,                                 // {{EXEC.FUNDING_DEPT_COUNT}}
      dataSourceCount: 2,                                   // {{EXEC.DATA_SOURCE_COUNT}}
      
      // --- TOP PERFORMERS ---
      topOEM: 'Dell',                                       // {{EXEC.TOP_OEM}}
      topOEMSavings: '$1.2M',                               // {{EXEC.TOP_OEM_SAVINGS}}
      topOEMPercent: '48.00',                               // {{EXEC.TOP_OEM_PERCENT}} - No % symbol
      
      topVendor: 'Vendor A',                                // {{EXEC.TOP_VENDOR}}
      topVendorSavings: '$1.5M',                            // {{EXEC.TOP_VENDOR_SAVINGS}}
      topVendorPercent: '60.00',                            // {{EXEC.TOP_VENDOR_PERCENT}}
      
      topFundingDept: 'DOD',                                // {{EXEC.TOP_FUNDING_DEPT}}
      topFundingDeptSavings: '$800.0K',                     // {{EXEC.TOP_FUNDING_DEPT_SAVINGS}}
      topFundingDeptPercent: '32.00',                       // {{EXEC.TOP_FUNDING_DEPT_PERCENT}}
      
      topContract: '47QTCA-XX-0001',                        // {{EXEC.TOP_CONTRACT}}
      topContractSavings: '$900.0K',                        // {{EXEC.TOP_CONTRACT_SAVINGS}}
      topContractVendor: 'Vendor A',                        // {{EXEC.TOP_CONTRACT_VENDOR}}
      
      // --- NEW VS PREVIOUSLY REPORTED ---
      newSavings: 2000000,                                  // {{EXEC.NEW_SAVINGS}}
      newSavingsFormatted: '$2.0M',                         // {{EXEC.NEW_SAVINGS_FORMATTED}}
      newSavingsPercent: '80.00',                           // {{EXEC.NEW_SAVINGS_PERCENT}}
      previouslyReportedSavings: 500000,                    // {{EXEC.PREV_REPORTED_SAVINGS}}
      previouslyReportedSavingsFormatted: '$500.0K',        // {{EXEC.PREV_REPORTED_SAVINGS_FORMATTED}}
      previouslyReportedPercent: '20.00'                    // {{EXEC.PREV_REPORTED_PERCENT}}
    }
  },

  // ===========================================================================
  // FINANCIAL OVERVIEW - Sorted arrays for charts/tables
  // ===========================================================================
  financialOverview: {
    data: {
      
      // --- SAVINGS BY OEM (sorted by savings descending) ---
      savingsByOEM: [
        {
          name: 'Dell',                                     // OEM name
          savings: 1200000,                                 // Raw savings
          savingsFormatted: '$1.2M',                        // Formatted savings
          transactions: 500,                                // Transaction count
          quantity: 2000,                                   // Units purchased
          cpl: 4000000,                                     // Total CPL
          cplFormatted: '$4.0M',
          paid: 2800000,                                    // Total paid
          paidFormatted: '$2.8M',
          discountRate: '30.00',                            // Calculated discount rate
          discountRateFormatted: '30.00%',
          percentOfTotal: '48.00',                          // % of total savings
          // --- NEW VS PREVIOUSLY REPORTED ---
          newSavings: 1000000,
          newSavingsFormatted: '$1.0M',
          previouslyReported: 200000,
          previouslyReportedFormatted: '$200.0K',
          // --- RELATIONSHIPS ---
          vendors: ['Vendor A', 'Vendor B'],                // Which vendors sell this OEM
          vendorCount: 2,
          contracts: ['47QTCA-XX-0001'],                    // Which contracts
          contractCount: 1,
          fundingDepts: ['DOD', 'VA'],                      // Which depts bought
          fundingDeptCount: 2
        }
        // ... more OEMs
      ],
      
      // --- SAVINGS BY MONTH (sorted chronologically) ---
      savingsByMonth: [
        {
          period: 'Jan 2025',                               // Month label
          savings: 400000,
          savingsFormatted: '$400.0K',
          transactions: 250,
          quantity: 800,
          cpl: 1500000,
          cplFormatted: '$1.5M',
          paid: 1100000,
          paidFormatted: '$1.1M',
          percentOfTotal: '16.00',
          // --- NEW VS PREVIOUSLY REPORTED ---
          newSavings: 350000,
          newSavingsFormatted: '$350.0K',
          previouslyReported: 50000,
          previouslyReportedFormatted: '$50.0K',
          // --- RELATIONSHIPS ---
          oems: ['Dell', 'HP'],                             // OEMs active this month
          oemCount: 2,
          vendors: ['Vendor A'],
          vendorCount: 1
        }
        // ... more months
      ],
      
      // --- SAVINGS BY VENDOR (sorted by savings descending) ---
      savingsByVendor: [
        {
          name: 'Vendor A',
          savings: 1500000,
          savingsFormatted: '$1.5M',
          transactions: 800,
          quantity: 3000,
          cpl: 6000000,
          cplFormatted: '$6.0M',
          paid: 4500000,
          paidFormatted: '$4.5M',
          discountRate: '25.00',
          discountRateFormatted: '25.00%',
          percentOfTotal: '60.00',
          // --- RELATIONSHIPS ---
          oems: ['Dell', 'HP', 'Lenovo'],                   // OEMs this vendor sells
          oemCount: 3,
          contracts: ['47QTCA-XX-0001', '47QTCA-XX-0002'],
          contractCount: 2,
          fundingDepts: ['DOD', 'VA', 'DHS'],
          fundingDeptCount: 3
        }
        // ... more vendors
      ],
      
      // --- SAVINGS BY CONTRACT (sorted by savings descending) ---
      savingsByContract: [
        {
          contract: '47QTCA-XX-0001',                       // Contract number
          vendor: 'Vendor A',                               // Primary vendor
          savings: 900000,
          savingsFormatted: '$900.0K',
          transactions: 400,
          cpl: 3500000,
          cplFormatted: '$3.5M',
          paid: 2600000,
          paidFormatted: '$2.6M',
          discountRate: '25.71',
          discountRateFormatted: '25.71%',
          percentOfTotal: '36.00',
          // --- RELATIONSHIPS ---
          oems: ['Dell', 'HP'],
          oemCount: 2,
          fundingDepts: ['DOD'],
          fundingDeptCount: 1
        }
        // ... more contracts
      ]
    }
  },

  // ===========================================================================
  // FUNDING DEPARTMENT ANALYSIS
  // ===========================================================================
  fundingDeptAnalysis: {
    data: {
      savingsByFundingDept: [
        {
          name: 'DOD',                                      // Department name
          savings: 800000,
          savingsFormatted: '$800.0K',
          transactions: 350,
          quantity: 1200,
          cpl: 3000000,
          cplFormatted: '$3.0M',
          paid: 2200000,
          paidFormatted: '$2.2M',
          discountRate: '26.67',
          discountRateFormatted: '26.67%',
          percentOfTotal: '32.00',
          // --- RELATIONSHIPS ---
          oems: ['Dell', 'HP'],
          oemCount: 2,
          vendors: ['Vendor A'],
          vendorCount: 1,
          contracts: ['47QTCA-XX-0001'],
          contractCount: 1
        }
        // ... more departments
      ],
      totalDepartments: 12,                                 // {{FUNDING.TOTAL_DEPARTMENTS}}
      topDepartment: { /* same structure as above */ }      // Reference to #1
    }
  },

  // ===========================================================================
  // DATA SOURCE ANALYSIS
  // ===========================================================================
  /*
  Breaks down savings by where the data came from (TDR, BIC, etc.)
  and by reporting status (new vs previously reported).
  */
  dataSourceAnalysis: {
    data: {
      
      // --- BY DATA SOURCE ---
      byDataSource: [
        {
          source: 'TDR',                                    // Data source name
          savings: 2000000,
          savingsFormatted: '$2.0M',
          transactions: 1200,
          cpl: 8000000,
          cplFormatted: '$8.0M',
          paid: 6000000,
          paidFormatted: '$6.0M',
          percentOfTotal: '80.00'
        }
        // ... more sources
      ],
      
      // --- BY BIC STATUS ---
      /*
      "In BIC" = Also listed in BIC catalog
      "TDR Only" = Only in TDR, not in BIC
      */
      byBICStatus: [
        {
          status: 'TDR Only',                               // "In BIC" or "TDR Only"
          savings: 1800000,
          savingsFormatted: '$1.8M',
          transactions: 1000,
          percentOfTotal: '72.00'
        },
        {
          status: 'In BIC',
          savings: 700000,
          savingsFormatted: '$700.0K',
          transactions: 500,
          percentOfTotal: '28.00'
        }
      ],
      
      // --- BY REPORTING STATUS ---
      /*
      "New This Period" = First time reported
      "Previously Reported" = Reported in earlier period
      */
      byReportingStatus: [
        {
          status: 'New This Period',
          savings: 2000000,
          savingsFormatted: '$2.0M',
          transactions: 1300,
          percentOfTotal: '80.00'
        },
        {
          status: 'Previously Reported',
          savings: 500000,
          savingsFormatted: '$500.0K',
          transactions: 200,
          percentOfTotal: '20.00'
        }
      ]
    }
  },

  // ===========================================================================
  // RELATIONSHIPS
  // ===========================================================================
  /*
  Cross-reference mappings between entities.
  Useful for answering "which vendors sell Dell?" type questions.
  */
  relationships: {
    // OEM -> Vendors that sell it
    vendorsByOEM: {
      'Dell': ['Vendor A', 'Vendor B'],
      'HP': ['Vendor A', 'Vendor C'],
      'Lenovo': ['Vendor B']
    },
    // Vendor -> OEMs they sell
    oemsByVendor: {
      'Vendor A': ['Dell', 'HP'],
      'Vendor B': ['Dell', 'Lenovo'],
      'Vendor C': ['HP']
    }
  },

  // ===========================================================================
  // CHART DATA - Pre-formatted for Chart.js
  // ===========================================================================
  chartData: {
    
    // --- STACKED BAR: OEM x Month ---
    stackedOEM: {
      labels: ['Dell', 'HP', 'Lenovo'],                     // X-axis (OEM names)
      months: ['Jan 2025', 'Feb 2025', 'Mar 2025'],         // Legend entries
      datasets: [
        {
          label: 'Jan 2025',
          data: [200000, 150000, 50000]                     // Savings per OEM for Jan
        },
        {
          label: 'Feb 2025',
          data: [250000, 180000, 70000]                     // Savings per OEM for Feb
        }
        // ... more months
      ],
      oemTotals: [1200000, 800000, 500000]                  // Total per OEM (for sorting)
    },
    
    // --- LINE/BAR: Monthly Totals ---
    monthlyTotals: {
      labels: ['Jan 2025', 'Feb 2025', 'Mar 2025'],
      data: [400000, 500000, 600000],                       // Savings per month
      percentages: ['16.00', '20.00', '24.00']              // % of total per month
    },
    
    // --- BAR: Vendor Totals ---
    vendorTotals: {
      labels: ['Vendor A', 'Vendor B', 'Vendor C'],
      data: [1500000, 700000, 300000],
      percentages: ['60.00', '28.00', '12.00']
    },
    
    // --- BAR: Funding Dept Totals ---
    fundingDeptTotals: {
      labels: ['DOD', 'VA', 'DHS'],
      data: [800000, 600000, 400000],
      percentages: ['32.00', '24.00', '16.00']
    },
    
    // --- PIE: Data Source Totals ---
    dataSourceTotals: {
      labels: ['TDR', 'BIC'],
      data: [2000000, 500000],
      percentages: ['80.00', '20.00']
    },
    
    // --- PIE: Reporting Status ---
    reportingStatusTotals: {
      labels: ['New This Period', 'Previously Reported'],
      data: [2000000, 500000],
      percentages: ['80.00', '20.00']
    }
  },

  // ===========================================================================
  // TRANSACTION DETAILS - COUNTS ONLY (actual data in Column L)
  // ===========================================================================
  /*
  NOTE: In v4.1, actual transactions array is stored in Column L.
  This section only contains counts/metadata.
  Web app functions (getReportsForWebApp, getReportByRow) automatically
  merge Column L transactions into this section when reading.
  */
  transactionDetails: {
    data: {
      transactionCount: 1500,                               // {{TRANS.COUNT}}
      totalRows: 2000,                                      // {{TRANS.TOTAL_ROWS}} - Raw data rows
      validatedRows: 1500,                                  // {{TRANS.VALIDATED_ROWS}}
      excludedRows: 500                                     // {{TRANS.EXCLUDED_ROWS}}
      // transactions: []  <-- NOT in Column D, loaded from Column L
    }
  },

  // ===========================================================================
  // VENDOR ANALYSIS - Same as financialOverview (legacy structure)
  // ===========================================================================
  vendorAnalysis: {
    data: {
      byVendor: [ /* same as financialOverview.savingsByVendor */ ],
      byContract: [ /* same as financialOverview.savingsByContract */ ]
    }
  },

  // ===========================================================================
  // METHODOLOGY
  // ===========================================================================
  methodology: {
    data: {
      dataSource: 'TDR/BIC transactional data',             // {{METHOD.DATA_SOURCE}}
      validationCriteria: 'Cost Savings Validated = Y',     // {{METHOD.VALIDATION}}
      excludedTransactions: 500,                            // {{METHOD.EXCLUDED_COUNT}}
      calculationMethod: 'Savings = Total CPL Price - Total Price Paid' // {{METHOD.CALCULATION}}
    }
  },

  // ===========================================================================
  // ADDENDUM - Reserved for additional data
  // ===========================================================================
  addendum: {
    data: {}
  },

  // ===========================================================================
  // TABLES - Pre-formatted for display
  // ===========================================================================
  /*
  Each table has:
    - title: Display name
    - headers: Column headers array
    - rows: 2D array of cell values (already formatted)
  */
  tables: {
    
    oemSummary: {
      title: 'Savings by OEM',
      headers: ['OEM', 'Savings', '% of Total', 'Transactions', 'Discount Rate', 'Vendors'],
      rows: [
        ['Dell', '$1.2M', '48.00%', 500, '30.00%', 2],
        ['HP', '$800.0K', '32.00%', 400, '25.00%', 2]
        // ...
      ]
    },
    
    monthSummary: {
      title: 'Savings by Month',
      headers: ['Period', 'Savings', '% of Total', 'Transactions', 'New Savings', 'Prev Reported'],
      rows: [
        ['Jan 2025', '$400.0K', '16.00%', 250, '$350.0K', '$50.0K'],
        ['Feb 2025', '$500.0K', '20.00%', 300, '$450.0K', '$50.0K']
        // ...
      ]
    },
    
    vendorSummary: {
      title: 'Savings by Vendor',
      headers: ['Vendor', 'Savings', '% of Total', 'Transactions', 'Discount Rate', 'OEMs'],
      rows: [
        ['Vendor A', '$1.5M', '60.00%', 800, '25.00%', 3],
        ['Vendor B', '$700.0K', '28.00%', 400, '22.00%', 2]
        // ...
      ]
    },
    
    contractSummary: {
      title: 'Savings by Contract',
      headers: ['Contract', 'Vendor', 'Savings', '% of Total', 'Transactions', 'OEMs'],
      rows: [
        ['47QTCA-XX-0001', 'Vendor A', '$900.0K', '36.00%', 400, 2],
        ['47QTCA-XX-0002', 'Vendor A', '$600.0K', '24.00%', 300, 1]
        // ...
      ]
    },
    
    fundingDeptSummary: {
      title: 'Savings by Funding Department',
      headers: ['Funding Dept', 'Savings', '% of Total', 'Transactions', 'Discount Rate', 'OEMs'],
      rows: [
        ['DOD', '$800.0K', '32.00%', 350, '26.67%', 2],
        ['VA', '$600.0K', '24.00%', 280, '24.00%', 3]
        // ...
      ]
    },
    
    dataSourceSummary: {
      title: 'Savings by Data Source',
      headers: ['Source', 'Savings', '% of Total', 'Transactions'],
      rows: [
        ['TDR', '$2.0M', '80.00%', 1200],
        ['BIC', '$500.0K', '20.00%', 300]
        // ...
      ]
    },
    
    reportingStatusSummary: {
      title: 'New vs Previously Reported',
      headers: ['Status', 'Savings', '% of Total', 'Transactions'],
      rows: [
        ['New This Period', '$2.0M', '80.00%', 1300],
        ['Previously Reported', '$500.0K', '20.00%', 200]
      ]
    }
  }
};


// ============================================================================
// COLUMN L: TRANSACTIONS JSON STRUCTURE
// ============================================================================
/*
Stored separately in Column L to avoid 50K cell size limit.
Merged automatically by getReportsForWebApp() and getReportByRow().
*/

const TransactionsJSON_ColumnL = {
  reportingPeriod: 'Jan 2025 - Jun 2025',                   // Same as main JSON
  generatedAt: '2025-01-15T10:30:00.000Z',                  // Same as main JSON
  transactionCount: 1500,                                   // Total transactions
  
  transactions: [
    {
      oem: 'Dell',                                          // OEM name
      vendor: 'Vendor A',                                   // Vendor name
      contract: '47QTCA-XX-0001',                           // Contract number
      fundingDept: 'DOD',                                   // Funding department
      partNumber: 'ABC-12345',                              // Manufacturer part number
      description: 'Dell PowerEdge R750 Server...',         // Truncated to 80 chars
      quantity: 10,                                         // Units purchased
      cplUnit: 5000,                                        // Per-unit CPL price
      cplTotal: 50000,                                      // Total CPL (qty * unit)
      oneGovPrice: 3500,                                    // OneGov negotiated unit price
      paidUnit: 3500,                                       // Per-unit price paid
      paidTotal: 35000,                                     // Total price paid
      savings: 15000,                                       // Total savings this transaction
      oneGovDiscountRate: '30%',                            // Stated OneGov discount rate
      actualDiscountRate: '30%',                            // Calculated actual rate
      dataSource: 'TDR',                                    // "TDR", "BIC", etc.
      alsoInBIC: 'N',                                       // "Y" or "N"
      previouslyReported: 'N',                              // "Y" or "N"
      reportingPeriod: 'Jan 2025'                           // Month of transaction
    }
    // ... more transactions (can be 1000+)
  ]
};


// ============================================================================
// MERGED JSON (what web app receives)
// ============================================================================
/*
When getReportsForWebApp() or getReportByRow() is called, it:
1. Reads Column D (main JSON)
2. Reads Column L (transactions JSON)
3. Merges transactions into transactionDetails.data.transactions
4. Returns complete JSON to web app

The web app sees this structure:
*/

const MergedJSON_WebApp = {
  // ... all fields from MainJSON_ColumnD ...
  
  transactionDetails: {
    data: {
      transactionCount: 1500,
      totalRows: 2000,
      validatedRows: 1500,
      excludedRows: 500,
      transactions: [
        // ... merged from Column L ...
      ]
    }
  }
};


// ============================================================================
// PLACEHOLDER REFERENCE - All {{ }} options
// ============================================================================
/*
PLACEHOLDER                                  | SOURCE PATH                                      | TYPE
---------------------------------------------|--------------------------------------------------|--------
{{REPORT_TYPE}}                              | reportType                                       | string
{{REPORT_VERSION}}                           | reportVersion                                    | string
{{GENERATED_AT}}                             | generatedAt                                      | ISO date
{{GENERATED_BY}}                             | generatedBy                                      | email
{{REPORTING_PERIOD}}                         | reportingPeriod                                  | string

--- ALL ENTITIES ---
{{ALL_ENTITIES.VENDORS.LIST}}                | allEntities.vendors.list                         | array
{{ALL_ENTITIES.VENDORS.FORMATTED}}           | allEntities.vendors.formatted                    | string
{{ALL_ENTITIES.VENDORS.COUNT}}               | allEntities.vendors.count                        | number
{{ALL_ENTITIES.OEMS.LIST}}                   | allEntities.oems.list                            | array
{{ALL_ENTITIES.OEMS.FORMATTED}}              | allEntities.oems.formatted                       | string
{{ALL_ENTITIES.OEMS.COUNT}}                  | allEntities.oems.count                           | number
{{ALL_ENTITIES.CONTRACTS.LIST}}              | allEntities.contracts.list                       | array
{{ALL_ENTITIES.CONTRACTS.FORMATTED}}         | allEntities.contracts.formatted                  | string
{{ALL_ENTITIES.CONTRACTS.COUNT}}             | allEntities.contracts.count                      | number
{{ALL_ENTITIES.FUNDINGDEPTS.LIST}}           | allEntities.fundingDepts.list                    | array
{{ALL_ENTITIES.FUNDINGDEPTS.FORMATTED}}      | allEntities.fundingDepts.formatted               | string
{{ALL_ENTITIES.FUNDINGDEPTS.COUNT}}          | allEntities.fundingDepts.count                   | number
{{ALL_ENTITIES.DATASOURCES.LIST}}            | allEntities.dataSources.list                     | array
{{ALL_ENTITIES.DATASOURCES.FORMATTED}}       | allEntities.dataSources.formatted                | string
{{ALL_ENTITIES.DATASOURCES.COUNT}}           | allEntities.dataSources.count                    | number
{{ALL_ENTITIES.NEWOEMS.LIST}}                | allEntities.newOEMsThisMonth.list                | array
{{ALL_ENTITIES.NEWOEMS.FORMATTED}}           | allEntities.newOEMsThisMonth.formatted           | string
{{ALL_ENTITIES.NEWOEMS.COUNT}}               | allEntities.newOEMsThisMonth.count               | number
{{ALL_ENTITIES.NEWOEMS.PERIOD}}              | allEntities.newOEMsThisMonth.period              | string

--- CURRENT MONTH ---
{{CURRENT_MONTH.PERIOD}}                     | allEntities.currentMonth.period                  | string
{{CURRENT_MONTH.TRANSACTION_COUNT}}          | allEntities.currentMonth.transactionCount        | number
{{CURRENT_MONTH.SAVINGS}}                    | allEntities.currentMonth.savings                 | number
{{CURRENT_MONTH.SAVINGS_FORMATTED}}          | allEntities.currentMonth.savingsFormatted        | string
{{CURRENT_MONTH.NEW_SAVINGS}}                | allEntities.currentMonth.newSavings              | number
{{CURRENT_MONTH.NEW_SAVINGS_FORMATTED}}      | allEntities.currentMonth.newSavingsFormatted     | string
{{CURRENT_MONTH.PREVIOUSLY_REPORTED}}        | allEntities.currentMonth.previouslyReported      | number
{{CURRENT_MONTH.PREVIOUSLY_REPORTED_FORMATTED}} | allEntities.currentMonth.previouslyReportedFormatted | string
{{CURRENT_MONTH.OEMS.LIST}}                  | allEntities.currentMonth.oems.list               | array
{{CURRENT_MONTH.OEMS.FORMATTED}}             | allEntities.currentMonth.oems.formatted          | string
{{CURRENT_MONTH.OEMS.COUNT}}                 | allEntities.currentMonth.oems.count              | number
{{CURRENT_MONTH.VENDORS.LIST}}               | allEntities.currentMonth.vendors.list            | array
{{CURRENT_MONTH.VENDORS.FORMATTED}}          | allEntities.currentMonth.vendors.formatted       | string
{{CURRENT_MONTH.VENDORS.COUNT}}              | allEntities.currentMonth.vendors.count           | number
{{CURRENT_MONTH.FUNDINGDEPTS.LIST}}          | allEntities.currentMonth.fundingDepts.list       | array
{{CURRENT_MONTH.FUNDINGDEPTS.FORMATTED}}     | allEntities.currentMonth.fundingDepts.formatted  | string
{{CURRENT_MONTH.FUNDINGDEPTS.COUNT}}         | allEntities.currentMonth.fundingDepts.count      | number

--- COMMENTARY ---
{{COMMENTARY_1}} through {{COMMENTARY_15}}   | commentary["1"] through commentary["15"]         | string

--- EXECUTIVE SUMMARY ---
{{EXEC.TOTAL_SAVINGS}}                       | executiveSummary.data.totalSavings               | number
{{EXEC.TOTAL_SAVINGS_FORMATTED}}             | executiveSummary.data.totalSavingsFormatted      | string
{{EXEC.TOTAL_TRANSACTIONS}}                  | executiveSummary.data.totalTransactions          | number
{{EXEC.TOTAL_QUANTITY}}                      | executiveSummary.data.totalQuantity              | number
{{EXEC.TOTAL_CPL}}                           | executiveSummary.data.totalCPL                   | number
{{EXEC.TOTAL_CPL_FORMATTED}}                 | executiveSummary.data.totalCPLFormatted          | string
{{EXEC.TOTAL_PAID}}                          | executiveSummary.data.totalPaid                  | number
{{EXEC.TOTAL_PAID_FORMATTED}}                | executiveSummary.data.totalPaidFormatted         | string
{{EXEC.DISCOUNT_RATE}}                       | executiveSummary.data.overallDiscountRate        | string (with %)
{{EXEC.OEM_COUNT}}                           | executiveSummary.data.oemCount                   | number
{{EXEC.VENDOR_COUNT}}                        | executiveSummary.data.vendorCount                | number
{{EXEC.CONTRACT_COUNT}}                      | executiveSummary.data.contractCount              | number
{{EXEC.FUNDING_DEPT_COUNT}}                  | executiveSummary.data.fundingDeptCount           | number
{{EXEC.DATA_SOURCE_COUNT}}                   | executiveSummary.data.dataSourceCount            | number
{{EXEC.TOP_OEM}}                             | executiveSummary.data.topOEM                     | string
{{EXEC.TOP_OEM_SAVINGS}}                     | executiveSummary.data.topOEMSavings              | string
{{EXEC.TOP_OEM_PERCENT}}                     | executiveSummary.data.topOEMPercent              | string (no %)
{{EXEC.TOP_VENDOR}}                          | executiveSummary.data.topVendor                  | string
{{EXEC.TOP_VENDOR_SAVINGS}}                  | executiveSummary.data.topVendorSavings           | string
{{EXEC.TOP_VENDOR_PERCENT}}                  | executiveSummary.data.topVendorPercent           | string (no %)
{{EXEC.TOP_FUNDING_DEPT}}                    | executiveSummary.data.topFundingDept             | string
{{EXEC.TOP_FUNDING_DEPT_SAVINGS}}            | executiveSummary.data.topFundingDeptSavings      | string
{{EXEC.TOP_FUNDING_DEPT_PERCENT}}            | executiveSummary.data.topFundingDeptPercent      | string (no %)
{{EXEC.TOP_CONTRACT}}                        | executiveSummary.data.topContract                | string
{{EXEC.TOP_CONTRACT_SAVINGS}}                | executiveSummary.data.topContractSavings         | string
{{EXEC.TOP_CONTRACT_VENDOR}}                 | executiveSummary.data.topContractVendor          | string
{{EXEC.NEW_SAVINGS}}                         | executiveSummary.data.newSavings                 | number
{{EXEC.NEW_SAVINGS_FORMATTED}}               | executiveSummary.data.newSavingsFormatted        | string
{{EXEC.NEW_SAVINGS_PERCENT}}                 | executiveSummary.data.newSavingsPercent          | string (no %)
{{EXEC.PREV_REPORTED_SAVINGS}}               | executiveSummary.data.previouslyReportedSavings  | number
{{EXEC.PREV_REPORTED_SAVINGS_FORMATTED}}     | executiveSummary.data.previouslyReportedSavingsFormatted | string
{{EXEC.PREV_REPORTED_PERCENT}}               | executiveSummary.data.previouslyReportedPercent  | string (no %)

--- TRANSACTION DETAILS ---
{{TRANS.COUNT}}                              | transactionDetails.data.transactionCount         | number
{{TRANS.TOTAL_ROWS}}                         | transactionDetails.data.totalRows                | number
{{TRANS.VALIDATED_ROWS}}                     | transactionDetails.data.validatedRows            | number
{{TRANS.EXCLUDED_ROWS}}                      | transactionDetails.data.excludedRows             | number

--- METHODOLOGY ---
{{METHOD.DATA_SOURCE}}                       | methodology.data.dataSource                      | string
{{METHOD.VALIDATION}}                        | methodology.data.validationCriteria              | string
{{METHOD.EXCLUDED_COUNT}}                    | methodology.data.excludedTransactions            | number
{{METHOD.CALCULATION}}                       | methodology.data.calculationMethod               | string

--- FUNDING DEPARTMENT ---
{{FUNDING.TOTAL_DEPARTMENTS}}                | fundingDeptAnalysis.data.totalDepartments        | number
*/


// ============================================================================
// COLUMN MAPPING QUICK REFERENCE
// ============================================================================
/*
RAW COLUMN                    → JSON FIELD(S)
------------------------------|--------------------------------------------------
OEM                           → byOEM key, transactions.oem
Vendor                        → byVendor key, transactions.vendor
Contract #                    → byContract key, transactions.contract
Funding Dept                  → byFundingDept key, transactions.fundingDept
Reporting Period              → byMonth key, transactions.reportingPeriod
Order Date                    → (fallback for Reporting Period)
Manufacturer Part Number      → transactions.partNumber
Description of Deliverable    → transactions.description (truncated 80 chars)
QTY Sold                      → summary.totalQuantity, byOEM.quantity
$ Saved                       → ALL .savings fields
Total CPL Price               → summary.totalCPL, byOEM.cpl, byVendor.cpl
CPL Price                     → transactions.cplUnit
OneGov Price                  → transactions.oneGovPrice
Total Price Paid              → summary.totalPaid, byOEM.paid, byVendor.paid
Price Paid Per Unit           → transactions.paidUnit
OneGov Discount Rate          → transactions.oneGovDiscountRate
Actual Discount Rate          → transactions.actualDiscountRate
Cost Savings Validated        → FILTER (only Y rows included)
Data Source                   → byDataSource key, transactions.dataSource
Also in BIC                   → byBICStatus, transactions.alsoInBIC
Previously Reported Savings   → byReportingStatus, transactions.previouslyReported, summary.newSavings
*/


// ============================================================================
// STORAGE SIZE ESTIMATES
// ============================================================================
/*
COMPONENT                     | ESTIMATED SIZE    | STORED IN
------------------------------|-------------------|-------------
Main JSON (no transactions)   | 15-25K chars      | Column D
Transactions (1000 records)   | 40-60K chars      | Column L
Transactions (500 records)    | 20-30K chars      | Column L
Transactions (100 records)    | 4-6K chars        | Column L

Google Sheets cell limit: 50,000 characters
Split ensures both columns stay under limit.
*/


// ============================================================================
// MIGRATION HELPER
// ============================================================================
/*
To add Column L to existing Reports sheet:
1. Open Google Sheets
2. Go to Extensions > Apps Script
3. Run function: addTransactionsColumn()

Or manually:
1. Add header "Transactions JSON" to Column L, Row 1
2. Format header to match other columns
*/