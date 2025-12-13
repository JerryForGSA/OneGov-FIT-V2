/**
 * @fileoverview Chart Buffet System for OneGov FIT Market Report Builder - VERSION 290
 * @module B16_chartBuffet  
 * @version 1.5.0 - Mixed Chart Generation: Entity + Column Breakdown Charts
 * @description Comprehensive chart generation system with intelligent type selection
 *              based on data characteristics, entity type, and user preferences.
 *              NOW INCLUDES: Top N selection, "All Other" aggregation, percentage calculations,
 *              professional styling, enhanced tooltips, comprehensive labeling, AND 
 *              COLUMN-SPECIFIC BREAKDOWNS (like KPI carousel)
 * @author OneGov FIT Market Development Team
 * @updated 2024-12-12 - Added mixed chart generation with column breakdowns
 */

/**
 * Abbreviate long agency names for better chart readability
 * @param {string} agencyName - Full agency name
 * @returns {string} Abbreviated agency name
 */
function abbreviateAgencyName(agencyName) {
  if (!agencyName || typeof agencyName !== 'string') return agencyName;
  
  const abbreviations = {
    'VETERANS AFFAIRS, DEPARTMENT OF': 'VA',
    'DEFENSE INFORMATION SYSTEMS AGENCY (DISA)': 'DISA',
    'CENTERS FOR MEDICARE AND MEDICAID SERVICES': 'CMS',
    'DEPT OF THE NAVY': 'Navy',
    'DEPT OF THE ARMY': 'Army',
    'DEPT OF THE AIR FORCE': 'Air Force',
    'STATE, DEPARTMENT OF': 'State Dept',
    'INTERNAL REVENUE SERVICE': 'IRS',
    'DEFENSE INFORMATION SYSTEMS AGENCY': 'DISA',
    'HOMELAND SECURITY, DEPARTMENT OF': 'DHS',
    'TREASURY, DEPARTMENT OF THE': 'Treasury',
    'HEALTH AND HUMAN SERVICES, DEPARTMENT OF': 'HHS',
    'TRANSPORTATION, DEPARTMENT OF': 'DOT',
    'EDUCATION, DEPARTMENT OF': 'Education',
    'AGRICULTURE, DEPARTMENT OF': 'USDA',
    'JUSTICE, DEPARTMENT OF': 'DOJ',
    'ENERGY, DEPARTMENT OF': 'DOE',
    'COMMERCE, DEPARTMENT OF': 'Commerce',
    'LABOR, DEPARTMENT OF': 'Labor',
    'HOUSING AND URBAN DEVELOPMENT, DEPARTMENT OF': 'HUD',
    'ENVIRONMENTAL PROTECTION AGENCY': 'EPA',
    'NATIONAL AERONAUTICS AND SPACE ADMINISTRATION': 'NASA',
    'SOCIAL SECURITY ADMINISTRATION': 'SSA',
    'U.S. CUSTOMS AND BORDER PROTECTION': 'CBP',
    'CUSTOMS AND BORDER PROTECTION': 'CBP',
    'IMMIGRATION AND CUSTOMS ENFORCEMENT': 'ICE',
    'FEDERAL BUREAU OF INVESTIGATION': 'FBI',
    'CENTRAL INTELLIGENCE AGENCY': 'CIA'
  };
  
  // First try exact match
  const upperName = agencyName.toUpperCase();
  if (abbreviations[upperName]) {
    return abbreviations[upperName];
  }
  
  // Then try partial matches for common patterns
  for (const [fullName, abbrev] of Object.entries(abbreviations)) {
    if (upperName.includes(fullName)) {
      return abbrev;
    }
  }
  
  // If no match found, return original name (truncate if very long)
  return agencyName.length > 25 ? agencyName.substring(0, 22) + '...' : agencyName;
}

/**
 * Format currency values in billions/millions for better readability
 * @param {number} value - Currency value
 * @returns {string} Formatted currency string
 */
function formatCurrencyShort(value) {
  if (!value || isNaN(value)) return '$0';
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1000000000) {
    return '$' + (value / 1000000000).toFixed(1) + 'B';
  } else if (absValue >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  } else if (absValue >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'K';
  } else {
    return '$' + value.toFixed(0);
  }
}

/**
 * Calculate percentage with proper formatting
 * @param {number} value - Individual value
 * @param {number} total - Total value
 * @returns {string} Formatted percentage string
 */
function formatPercentage(value, total) {
  if (!value || !total || total === 0) return '0.0%';
  const percentage = (value / total) * 100;
  return percentage.toFixed(1) + '%';
}

/**
 * Calculate percentage with proper formatting
 * @param {number} value - Individual value
 * @param {number} total - Total value
 * @returns {string} Formatted percentage string
 */
function formatPercentage(value, total) {
  if (!value || !total || total === 0) return '0.0%';
  const percentage = (value / total) * 100;
  return percentage.toFixed(1) + '%';
}

/**
 * Create enhanced chart labels with value and percentage
 * @param {string} name - Entity name
 * @param {number} value - Entity value
 * @param {number} total - Total value for percentage calculation
 * @param {boolean} isOthers - Whether this is the "Others" category
 * @returns {string} Enhanced label with percentage
 */
function createEnhancedLabel(name, value, total, isOthers = false) {
  const percentage = formatPercentage(value, total);
  const formattedValue = formatCurrencyShort(value);
  
  if (isOthers) {
    return `All Other (${formattedValue}, ${percentage})`;
  }
  
  return `${name} (${formattedValue}, ${percentage})`;
}

/**
 * Chart type selection logic based on entity count and data type (LEGACY - kept for fallback)
 * @param {number} entityCount - Number of entities to display
 * @param {string} dataType - Type of data (obligations, piid, etc.)
 * @returns {Array<string>} Recommended chart types
 * @deprecated Use getChartTypesByContext() instead for 3-dimensional selection
 */
function getRecommendedChartTypes(entityCount, dataType) {
  // Special cases for PIID data
  if (dataType === 'topRefPiid' || dataType === 'topPiid') {
    return ['funnel', 'horizontalBar', 'verticalBar'];
  }
  
  // Entity count based recommendations - REMOVED LINE CHARTS for entity-based data
  if (entityCount <= 5) {
    return ['verticalBar', 'horizontalBar', 'pie', 'doughnut'];
  } else if (entityCount <= 10) {
    return ['horizontalBar', 'stackedBar', 'pie'];
  } else if (entityCount <= 15) {
    return ['horizontalBar', 'funnel'];
  } else {
    return ['horizontalBar', 'funnel'];
  }
}

/**
 * Three-dimensional chart selection based on entity type, column, and count
 * @param {string} entityType - Type of entity (agency, oem, vendor)
 * @param {string} columnId - Column identifier from the 22 available columns
 * @param {number} entityCount - Number of entities to display (5, 10, or 15)
 * @returns {Array<string>} Array of chart type strings to generate
 * 
 * HOW TO MODIFY THIS FUNCTION:
 * 1. Find the column section (e.g., CHART_CONFIG.obligations)
 * 2. Find the entity type (e.g., agency, oem, vendor)
 * 3. Find the entity count (5, 10, or 15)
 * 4. Change the array of chart types
 * 
 * Available chart types: 'verticalBar', 'horizontalBar', 'pie', 'doughnut', 
 *                        'line', 'funnel', 'stackedBar', 'area'
 */
function getChartTypesByContext(entityType, columnId, entityCount) {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CHART CONFIGURATION MATRIX
  // Structure: CHART_CONFIG[columnId][entityType][entityCount] = [chartTypes]
  // ═══════════════════════════════════════════════════════════════════════════
  
  const CHART_CONFIG = {
    
    // ─────────────────────────────────────────────────────────────────────────
    // OBLIGATIONS - Primary financial metric
    // ─────────────────────────────────────────────────────────────────────────
    obligations: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel', 'stackedBar']
      },
      oem: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SMALL BUSINESS - Set-aside and small business metrics
    // ─────────────────────────────────────────────────────────────────────────
    smallBusiness: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SUM TIER - Tiered classification data
    // ─────────────────────────────────────────────────────────────────────────
    sumTier: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SUM TYPE - Type classification
    // ─────────────────────────────────────────────────────────────────────────
    sumType: {
      agency: {
        5:  ['verticalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // CONTRACT VEHICLE - Vehicle distribution
    // ─────────────────────────────────────────────────────────────────────────
    contractVehicle: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // FUNDING DEPARTMENT - Department-level funding
    // ─────────────────────────────────────────────────────────────────────────
    fundingDepartment: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // FUNDING AGENCY - Agency-level funding (different from fundingDepartment)
    // ─────────────────────────────────────────────────────────────────────────
    fundingAgency: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // DISCOUNT - Discount metrics
    // ─────────────────────────────────────────────────────────────────────────
    discount: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // TOP REFERENCED PIID - Contract reference rankings (SPECIAL: Always funnel-first)
    // ─────────────────────────────────────────────────────────────────────────
    topRefPiid: {
      agency: {
        5:  ['funnel', 'horizontalBar', 'verticalBar'],
        10: ['funnel', 'horizontalBar'],
        15: ['funnel', 'horizontalBar']
      },
      oem: {
        5:  ['funnel', 'horizontalBar'],
        10: ['funnel', 'horizontalBar'],
        15: ['funnel', 'horizontalBar']
      },
      vendor: {
        5:  ['funnel', 'horizontalBar'],
        10: ['funnel', 'horizontalBar'],
        15: ['funnel', 'horizontalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // TOP PIID - Primary contract rankings (SPECIAL: Always funnel-first)
    // ─────────────────────────────────────────────────────────────────────────
    topPiid: {
      agency: {
        5:  ['funnel', 'horizontalBar', 'verticalBar'],
        10: ['funnel', 'horizontalBar'],
        15: ['funnel', 'horizontalBar']
      },
      oem: {
        5:  ['funnel', 'horizontalBar'],
        10: ['funnel', 'horizontalBar'],
        15: ['funnel', 'horizontalBar']
      },
      vendor: {
        5:  ['funnel', 'horizontalBar'],
        10: ['funnel', 'horizontalBar'],
        15: ['funnel', 'horizontalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // ACTIVE CONTRACTS - Contract count metrics
    // ─────────────────────────────────────────────────────────────────────────
    activeContracts: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // DISCOUNT OFFERINGS - Discount program participation
    // ─────────────────────────────────────────────────────────────────────────
    discountOfferings: {
      agency: {
        5:  ['verticalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // AI PRODUCT - Artificial Intelligence products
    // ─────────────────────────────────────────────────────────────────────────
    aiProduct: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie', 'stackedBar'],
        10: ['horizontalBar', 'stackedBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // AI CATEGORY - AI categorization metrics
    // ─────────────────────────────────────────────────────────────────────────
    aiCategory: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // TOP BIC PRODUCTS - Best-in-Class product rankings
    // ─────────────────────────────────────────────────────────────────────────
    topBicProducts: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // RESELLER - Reseller distribution
    // ─────────────────────────────────────────────────────────────────────────
    reseller: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // BIC RESELLER - Best-in-Class reseller metrics
    // ─────────────────────────────────────────────────────────────────────────
    bicReseller: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // BIC OEM - Best-in-Class OEM metrics
    // ─────────────────────────────────────────────────────────────────────────
    bicOem: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // FAS OEM - Federal Acquisition Service OEM metrics
    // ─────────────────────────────────────────────────────────────────────────
    fasOem: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie', 'stackedBar'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // BIC TOP PRODUCTS PER AGENCY - Agency-specific BIC products
    // ─────────────────────────────────────────────────────────────────────────
    bicTopProductsPerAgency: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // ONEGOV TIER - OneGov tiering system
    // ─────────────────────────────────────────────────────────────────────────
    oneGovTier: {
      agency: {
        5:  ['verticalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar']
      },
      vendor: {
        5:  ['horizontalBar', 'pie'],
        10: ['horizontalBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // ADDITIONAL COLUMNS FOR COMPLETE 22-COLUMN SUPPORT
    // ─────────────────────────────────────────────────────────────────────────
    
    // COLUMN D - OBLIGATIONS (Pattern A: Simple Totals)
    totalObligations: {
      agency: {
        5:  ['line', 'verticalBar', 'area'],
        10: ['line', 'stackedBar', 'area'],
        15: ['line', 'horizontalBar', 'area']
      },
      oem: {
        5:  ['line', 'verticalBar', 'area'],
        10: ['line', 'stackedBar', 'area'],
        15: ['line', 'horizontalBar', 'area']
      },
      vendor: {
        5:  ['line', 'verticalBar', 'area'],
        10: ['line', 'stackedBar', 'area'],
        15: ['line', 'horizontalBar', 'area']
      }
    },
    
    // COLUMN X - ONEGOV TIER (Pattern A: Simple Totals) - Enhanced
    oneGovTierEnhanced: {
      agency: {
        5:  ['doughnut', 'verticalBar', 'pie'],
        10: ['horizontalBar', 'doughnut'],
        15: ['horizontalBar', 'stackedBar']
      },
      oem: {
        5:  ['doughnut', 'pie', 'verticalBar'],
        10: ['horizontalBar', 'doughnut'],
        15: ['horizontalBar']
      },
      vendor: {
        5:  ['doughnut', 'pie', 'verticalBar'],
        10: ['horizontalBar', 'doughnut'],
        15: ['horizontalBar', 'stackedBar']
      }
    },
    
    // COLUMN H - CONTRACT VEHICLE (Pattern B: Object Map)
    contractVehicle: {
      agency: {
        5:  ['pie', 'verticalBar', 'doughnut'],
        10: ['horizontalBar', 'pie', 'stackedBar'],
        15: ['horizontalBar', 'funnel', 'stackedBar']
      },
      oem: {
        5:  ['horizontalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'stackedBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'pie', 'doughnut'],
        10: ['horizontalBar', 'stackedBar', 'pie'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // COLUMN K - TOP REF_PIID (Pattern C: Array)
    topRefPiid: {
      agency: {
        5:  ['funnel', 'verticalBar', 'horizontalBar'],
        10: ['funnel', 'horizontalBar', 'stackedBar'],
        15: ['funnel', 'horizontalBar']
      },
      oem: {
        5:  ['funnel', 'horizontalBar', 'verticalBar'],
        10: ['funnel', 'horizontalBar'],
        15: ['funnel', 'horizontalBar']
      },
      vendor: {
        5:  ['funnel', 'horizontalBar', 'verticalBar'],
        10: ['funnel', 'horizontalBar'],
        15: ['funnel', 'horizontalBar']
      }
    },
    
    // COLUMN L - TOP PIID (Pattern C: Array)
    topPiid: {
      agency: {
        5:  ['funnel', 'verticalBar', 'horizontalBar'],
        10: ['funnel', 'horizontalBar', 'stackedBar'],
        15: ['funnel', 'horizontalBar']
      },
      oem: {
        5:  ['funnel', 'horizontalBar', 'verticalBar'],
        10: ['funnel', 'horizontalBar'],
        15: ['funnel', 'horizontalBar']
      },
      vendor: {
        5:  ['funnel', 'horizontalBar', 'verticalBar'],
        10: ['funnel', 'horizontalBar'],
        15: ['funnel', 'horizontalBar']
      }
    },
    
    // COLUMN M - ACTIVE CONTRACTS (Pattern D: Fiscal Year Nested)
    activeContracts: {
      agency: {
        5:  ['stackedBar', 'line', 'area'],
        10: ['stackedBar', 'line', 'horizontalBar'],
        15: ['stackedBar', 'line', 'horizontalBar']
      },
      oem: {
        5:  ['stackedBar', 'line', 'area'],
        10: ['stackedBar', 'line', 'horizontalBar'],
        15: ['stackedBar', 'line', 'horizontalBar']
      },
      vendor: {
        5:  ['stackedBar', 'line', 'area'],
        10: ['stackedBar', 'line', 'horizontalBar'],
        15: ['stackedBar', 'line', 'horizontalBar']
      }
    },
    
    // COLUMN N - EXPIRING ONEGOV DISCOUNTED PRODUCTS (Pattern E: Entity Nested)
    expiringOneGovProducts: {
      agency: {
        5:  ['stackedBar', 'pie', 'horizontalBar'],
        10: ['stackedBar', 'horizontalBar', 'funnel'],
        15: ['stackedBar', 'horizontalBar']
      },
      oem: {
        5:  ['horizontalBar', 'stackedBar', 'pie'],
        10: ['horizontalBar', 'stackedBar'],
        15: ['horizontalBar', 'stackedBar']
      },
      vendor: {
        5:  ['horizontalBar', 'stackedBar', 'pie'],
        10: ['horizontalBar', 'stackedBar'],
        15: ['horizontalBar', 'stackedBar']
      }
    },
    
    // COLUMN Q - TOP BIC PRODUCTS (Pattern C: Array) - Enhanced
    topBicProductsEnhanced: {
      agency: {
        5:  ['horizontalBar', 'funnel', 'verticalBar'],
        10: ['horizontalBar', 'funnel', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      oem: {
        5:  ['horizontalBar', 'funnel', 'pie'],
        10: ['horizontalBar', 'funnel', 'stackedBar'],
        15: ['horizontalBar', 'funnel']
      },
      vendor: {
        5:  ['horizontalBar', 'funnel', 'pie'],
        10: ['horizontalBar', 'funnel'],
        15: ['horizontalBar', 'funnel']
      }
    },
    
    // COLUMN W - BIC TOP PRODUCTS PER AGENCY (Pattern E: Entity Nested) - Enhanced
    bicTopProductsPerAgencyEnhanced: {
      agency: {
        5:  ['stackedBar', 'horizontalBar', 'pie'],
        10: ['stackedBar', 'horizontalBar', 'funnel'],
        15: ['stackedBar', 'horizontalBar']
      },
      oem: {
        5:  ['horizontalBar', 'stackedBar'],
        10: ['horizontalBar', 'stackedBar'],
        15: ['horizontalBar']
      },
      vendor: {
        5:  ['horizontalBar', 'stackedBar'],
        10: ['horizontalBar', 'stackedBar'],
        15: ['horizontalBar']
      }
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOOKUP LOGIC WITH FALLBACKS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Normalize entity count to nearest tier (5, 10, or 15)
  let normalizedCount;
  if (entityCount <= 5) {
    normalizedCount = 5;
  } else if (entityCount <= 10) {
    normalizedCount = 10;
  } else {
    normalizedCount = 15;
  }
  
  // Try exact match first
  if (CHART_CONFIG[columnId] && 
      CHART_CONFIG[columnId][entityType] && 
      CHART_CONFIG[columnId][entityType][normalizedCount]) {
    return CHART_CONFIG[columnId][entityType][normalizedCount];
  }
  
  // Fallback 1: Try default entity type for this column
  if (CHART_CONFIG[columnId] && CHART_CONFIG[columnId]['agency']) {
    return CHART_CONFIG[columnId]['agency'][normalizedCount] || 
           CHART_CONFIG[columnId]['agency'][10] || 
           ['horizontalBar', 'pie'];
  }
  
  // Fallback 2: Use legacy function for completely unknown columns
  return getRecommendedChartTypes(entityCount, columnId);
}

/**
 * Extract column-specific data for chart generation
 * @param {Array} entities - Entity data from DataManager
 * @param {string} columnId - Column identifier to extract data from
 * @returns {Array} Array of column-specific data items with name and value
 */
function extractColumnData(entities, columnId) {
  const columnData = new Map();

  entities.forEach((entity) => {
    let jsonData = entity[columnId];

    // For debugging missing column data
    if (columnId === 'sumTier' || columnId === 'topBicProducts') {
      console.log(`extractColumnData DEBUG [${columnId}] for ${entity.name}:`, {
        hasColumn: Object.prototype.hasOwnProperty.call(entity, columnId),
        type: typeof jsonData,
        preview: typeof jsonData === 'string'
          ? jsonData.slice(0, 100)
          : jsonData && typeof jsonData === 'object'
          ? Object.keys(jsonData).slice(0, 5)
          : jsonData
      });
    }

    // For some columns, we can still extract data even if jsonData is undefined
    if (!jsonData && columnId !== 'obligations') return;

    // PARSE JSON STRING IF NEEDED (CSV / API initially stores as string)
    if (typeof jsonData === 'string') {
      try {
        jsonData = JSON.parse(jsonData);
      } catch (e) {
        console.warn(`Invalid JSON for ${columnId}:`, jsonData.slice(0, 120));
        return;
      }
    }

    switch (columnId) {
      case 'obligations': {
        let obligationsValue = 0;

        if (jsonData && typeof jsonData === 'object') {
          obligationsValue = jsonData.total_obligated || 0;
        } else if (entity.obligations && typeof entity.obligations === 'object') {
          obligationsValue = entity.obligations.total_obligated || 0;
        } else if (typeof entity.value === 'number') {
          obligationsValue = entity.value;
        }

        if (obligationsValue > 0) {
          columnData.set(entity.name, obligationsValue);
        }
        break;
      }

      case 'reseller': {
        const summaries = jsonData.top_15_reseller_summaries;
        if (summaries) {
          Object.entries(summaries).forEach(([name, data]) => {
            const value = data.total || 0;
            if (!value) return;
            columnData.set(name, (columnData.get(name) || 0) + value);
          });
        }
        break;
      }

      case 'bicReseller': {
        const items = jsonData.top_15_resellers;
        if (Array.isArray(items)) {
          items.forEach((item) => {
            const name = item.vendor_name;
            const value = item.total_sales || 0;
            if (!name || !value) return;
            columnData.set(name, (columnData.get(name) || 0) + value);
          });
        }
        break;
      }

      case 'bicOem': {
        const items = jsonData.top_15_manufacturers;
        if (Array.isArray(items)) {
          items.forEach((item) => {
            const name = item.manufacturer_name;
            const value = item.total_sales || 0;
            if (!name || !value) return;
            columnData.set(name, (columnData.get(name) || 0) + value);
          });
        }
        break;
      }

      case 'fasOem': {
        const summaries = jsonData.top_10_oem_summaries;
        if (summaries) {
          Object.entries(summaries).forEach(([name, data]) => {
            const value = data.total_obligations || data.total || 0;
            if (!value) return;
            columnData.set(name, (columnData.get(name) || 0) + value);
          });
        }
        break;
      }

      case 'fundingDepartment': {
        const summaries = jsonData.top_10_department_summaries;
        if (summaries) {
          Object.entries(summaries).forEach(([name, data]) => {
            const value = data.total || 0;
            if (!value) return;
            columnData.set(name, (columnData.get(name) || 0) + value);
          });
        }
        break;
      }

      case 'fundingAgency': {
        const summaries = jsonData.top_10_agency_summaries;
        if (summaries) {
          Object.entries(summaries).forEach(([name, data]) => {
            const value = data.total || 0;
            if (!value) return;
            columnData.set(name, (columnData.get(name) || 0) + value);
          });
        }
        break;
      }

      case 'contractVehicle': {
        const summaries = jsonData.top_contract_summaries;
        if (summaries) {
          Object.entries(summaries).forEach(([name, data]) => {
            const value = data.total || 0;
            if (!value) return;
            columnData.set(name, (columnData.get(name) || 0) + value);
          });
        }
        break;
      }

      case 'topBicProducts': {
        const items = jsonData.top_25_products;
        if (Array.isArray(items)) {
          items.forEach((item) => {
            const name = item.product_name;
            const value = item.total_price || 0;
            if (!name || !value) return;
            columnData.set(name, (columnData.get(name) || 0) + value);
          });
        }
        break;
      }

      case 'smallBusiness': {
        const summaries = jsonData.business_size_summaries;
        if (summaries) {
          Object.entries(summaries).forEach(([name, data]) => {
            const value = data.total || 0;
            if (!value) return;
            columnData.set(name, (columnData.get(name) || 0) + value);
          });
        }
        break;
      }

      case 'sumTier': {
        const summaries = jsonData.tier_summaries;
        console.log('sumTier tier_summaries:', summaries);
        if (summaries) {
          Object.entries(summaries).forEach(([name, data]) => {
            const value = data.total || 0;
            console.log(`  Tier ${name}: ${value}`);
            if (!value) return;
            columnData.set(name, (columnData.get(name) || 0) + value);
          });
        }
        break;
      }

      case 'sumType': {
        const summaries = jsonData.sum_type_summaries;
        if (summaries) {
          Object.entries(summaries).forEach(([name, data]) => {
            const value = data.total || 0;
            if (!value) return;
            columnData.set(name, (columnData.get(name) || 0) + value);
          });
        }
        break;
      }

      case 'aiProduct':
      case 'productObligations': {
        const fySummaries = jsonData.fiscal_year_summaries;
        if (fySummaries) {
          Object.values(fySummaries).forEach((yearData) => {
            const items = yearData.top_10_products || [];
            items.forEach((item) => {
              const name = item.product;
              const value = item.obligations || 0;
              if (!name || !value) return;
              columnData.set(name, (columnData.get(name) || 0) + value);
            });
          });
        }
        break;
      }

      case 'aiCategory':
      case 'aiCategories':
      case 'categoryObligations': {
        const fySummaries = jsonData.fiscal_year_summaries;
        if (fySummaries) {
          Object.values(fySummaries).forEach((yearData) => {
            const items = yearData.top_10_categories || [];
            items.forEach((item) => {
              const name = item.category;
              const value = item.obligations || 0;
              if (!name || !value) return;
              columnData.set(name, (columnData.get(name) || 0) + value);
            });
          });
        }
        break;
      }

      default: {
        const defaultValue =
          (jsonData && (jsonData.total_obligated || jsonData.total_obligations || jsonData.summary?.grand_total_obligations)) ||
          entity.value ||
          0;
        if (defaultValue > 0) {
          columnData.set(entity.name, (columnData.get(entity.name) || 0) + defaultValue);
        }
      }
    }
  });

  const result = Array.from(columnData.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  console.log(`🔍 extractColumnData RESULT for ${columnId} (length: ${result.length}):`, result.slice(0, 10).map(item => `${item.name}: ${item.value}`));
  
  // Special debugging for categoryObligations
  if (columnId === 'categoryObligations') {
    console.log(`🔍 SPECIAL DEBUG categoryObligations entities:`, entities.length);
    console.log(`🔍 SPECIAL DEBUG first entity structure:`, {
      name: entities[0]?.name,
      hasColumn: Object.prototype.hasOwnProperty.call(entities[0] || {}, columnId),
      columnValue: entities[0]?.[columnId],
      keys: Object.keys(entities[0] || {})
    });
  }
  
  return result;
}





/**
 * Generate column-specific breakdown charts (KPI-style charts)
 * Shows the actual content of columns (e.g., Tiers, Products, Contract Vehicles)
 * instead of entity-based aggregations
 * @param {Array} entities - Entity data from DataManager
 * @param {string} entityType - Type of entity (agency, oem, vendor)
 * @param {string} columnId - Column identifier
 * @param {number} topN - Number of top items to show
 * @returns {Array} Array of breakdown chart cards
 */
function generateColumnBreakdownCharts(entities, entityType, columnId, topN = 10) {
  // Only generate breakdown charts for specific columns that have categorical data
  const breakdownColumns = [
    'sumTier',
    'sumType',
    'aiProduct',
    'aiCategory',
    'aiCategories',
    'topBicProducts',
    'contractVehicle',
    'reseller',
    'smallBusiness',
    'productObligations',
    'categoryObligations'
  ];

  if (!breakdownColumns.includes(columnId)) {
    return []; // No breakdown charts for this column type
  }

  // Use extractColumnData to get the already-extracted breakdown data
  const extractedData = extractColumnData(entities, columnId);
  
  if (!extractedData || extractedData.length === 0) {
    return []; // No data to create breakdown charts
  }
  
  // Data is already sorted from extractColumnData
  const sortedData = extractedData.slice(0, topN);

  if (sortedData.length === 0) {
    return [];
  }

  const cards = [];

  // Horizontal bar breakdown
  const bar = generateBreakdownHorizontalBarChart(sortedData, columnId, entityType, topN);
  if (bar) cards.push(bar);

  // Pie breakdown
  const pie = generateBreakdownPieChart(sortedData, columnId, entityType);
  if (pie) cards.push(pie);

  // Fiscal-year trend (if available)
  const fyTrend = generateBreakdownFiscalTrend(entities, columnId, entityType);
  if (fyTrend) cards.push(fyTrend);

  return cards;
}

/**
 * Generate complete chart buffet for a column
 * @param {string} entityType - Type of entity (agency, oem, vendor)
 * @param {string} columnId - Column identifier
 * @param {Array} entities - Pre-processed entity data from DataManager
 * @param {Object} options - Chart generation options
 * @returns {Array} Array of chart cards
 */
  function generateChartBuffet(entityType, columnId, entities, options = {}) {
    // LOGGING POINT 3: Log columnId received by Chart Buffet
    console.log(`🎨 Chart Buffet generateChartBuffet: Received columnId "${columnId}" for ${entityType} with ${entities?.length || 0} entities`);
    
    const { 
      topN = 10, 
      selectedEntities = [], 
      forceChartTypes = null,
      showAllOther = true,
      percentageMode = 'total'
    } = options;
    
    // If no entities, return empty array immediately
    if (!entities || entities.length === 0) {
      console.error(`No entities provided to generateChartBuffet for ${entityType}/${columnId}`);
      return [];
    }
    
    // DEBUG: Check what properties entities actually have
    if (columnId === 'sumTier' || columnId === 'topBicProducts') {
      console.log('BUFFET DEBUG first entity for', columnId, {
        name: entities[0].name,
        keys: Object.keys(entities[0]),
        hasSumTier: 'sumTier' in entities[0],
        hasTopBicProducts: 'topBicProducts' in entities[0],
        sumTierValue: entities[0].sumTier,
        topBicProductsValue: entities[0].topBicProducts
      });
    }
    

  // Extract actual column data instead of using entity data
  console.log(`Chart generation: Starting extraction for ${entities.length} ${entityType} entities, column: ${columnId}`);
  if (entities.length > 0) {
    console.log(`First entity structure:`, {
      name: entities[0].name,
      hasObligations: !!entities[0].obligations,
      obligationsKeys: entities[0].obligations ? Object.keys(entities[0].obligations).slice(0, 5) : 'NONE',
      totalObligated: entities[0].obligations?.total_obligated,
      value: entities[0].value
    });
  }
  const columnDataItems = extractColumnData(entities, columnId);
  console.log(`Chart generation: Extracted ${columnDataItems.length} data items`);
  
  let chartEntities;
  if (columnDataItems.length === 0) {
    // Fallback - check entity properties for direct values
    chartEntities = [];
    entities.forEach((entity) => {
      const fallbackValue = entity.value || entity.obligations?.total_obligated || 0;
      if (fallbackValue > 0) {
        chartEntities.push({ name: entity.name, value: fallbackValue });
      }
    });
  } else {
    // Use extracted column data (this shows resellers when user clicks resellers!)
    chartEntities = columnDataItems;
  }

  // Use topN directly
  const effectiveTopN = topN || 10;
  
  // Calculate overall total from chart entities  
  const overallTotal = chartEntities.reduce((sum, e) => sum + (e.value || 0), 0);
  
  // Get top N entities and calculate "All Other" if enabled
  const topEntities = chartEntities.slice(0, effectiveTopN);
  const topTotal = topEntities.reduce((sum, e) => sum + (e.value || 0), 0);
  const othersValue = overallTotal - topTotal;
  
  // Create entities with "All Other" category based on user preference
  const entitiesWithOthers = [...topEntities];
  if (showAllOther && othersValue > 0 && chartEntities.length > effectiveTopN) {
    entitiesWithOthers.push({
      name: 'All Other',
      value: othersValue,
      isOthers: true
    });
  }
  
  // Determine percentage calculation base (total vs topN)
  const percentageBase = percentageMode === 'topN' ? 
    (showAllOther ? topTotal + othersValue : topTotal) : 
    overallTotal;
  
  const cards = [];

  // 1. GENERATE BREAKDOWN CHARTS FIRST
  // These show the actual content categories (e.g. Tiers, Products) instead of Entities
  // Pass effectiveTopN to avoid ReferenceError
  const breakdownCharts = generateColumnBreakdownCharts(entities, entityType, columnId, effectiveTopN);

  // If breakdown charts exist, add them first (Primary View)
  if (breakdownCharts.length > 0) {
    cards.push(...breakdownCharts);
  }
  
  // 2. GENERATE ENTITY CHARTS (Standard Top N Agencies/OEMs)
  // Skip these for breakdown-heavy columns to avoid confusion, 
  // or if breakdown charts were successfully generated.
  const isBreakdownColumn = [
    'sumTier', 
    'aiProduct', 
    'aiCategory',
    'aiCategories', 
    'topBicProducts', 
    'productObligations', 
    'categoryObligations',
    'contractVehicle'
  ].includes(columnId);

  // Only generate entity rankings if it's NOT a breakdown column, 
  // or if for some reason no breakdown charts were created (fallback)
  if (!isBreakdownColumn || breakdownCharts.length === 0) {
    
    // Determine recommended chart types - NOW USES 3-DIMENSIONAL SELECTION
    const chartTypes = forceChartTypes || getChartTypesByContext(entityType, columnId, effectiveTopN);
    
    // Generate each recommended chart type
    chartTypes.forEach(chartType => {
      let card = null;
      
      switch(chartType) {
        case 'verticalBar':
          card = generateVerticalBarChart(entitiesWithOthers, entityType, columnId, effectiveTopN, percentageBase, percentageMode, showAllOther, overallTotal);
          break;
        case 'horizontalBar':
          card = generateHorizontalBarChart(entitiesWithOthers, entityType, columnId, effectiveTopN, percentageBase, percentageMode, showAllOther, overallTotal);
          break;
        case 'line':
          card = generateLineChart(entitiesWithOthers, entityType, columnId, percentageBase, percentageMode);
          break;
        case 'funnel':
          card = generateFunnelChart(entitiesWithOthers, entityType, columnId, effectiveTopN, percentageBase, percentageMode, showAllOther);
          break;
        case 'pie':
          card = generatePieChart(entitiesWithOthers, entityType, columnId, effectiveTopN, percentageBase, percentageMode, showAllOther, overallTotal);
          break;
        case 'doughnut':
          card = generateDoughnutChart(entitiesWithOthers, entityType, columnId, effectiveTopN, percentageBase, percentageMode, showAllOther, overallTotal);
          break;
        case 'stackedBar':
          // Year over Year chart limited to max 5 entities (even if user selects Top 15)
          card = generateStackedBarChart(chartEntities, entityType, columnId, Math.min(effectiveTopN, 5));
          break;
        case 'area':
          card = generateAreaChart(chartEntities, entityType, columnId);
          break;
      }
      
      if (card) cards.push(card);
    });
  }
  
  // 3. ADD TREND OVER TIME
  // Add trend over time if fiscal year data exists
  const trendCard = generateTrendOverTime(entityType, columnId, selectedEntities);
  if (trendCard) cards.push(trendCard);
  
  return cards;
}

/**
 * Aggregate column data across all entities to show category/type breakdowns
 */
function aggregateColumnData(entities, columnId) {
  const aggregated = {};

  entities.forEach(entity => {
    let jsonData = entity[columnId];
    if (!jsonData) return;

    // PARSE JSON STRING IF NEEDED
    if (typeof jsonData === 'string') {
      try {
        jsonData = JSON.parse(jsonData);
      } catch(e) {
        console.warn(`aggregateColumnData: Invalid JSON for ${columnId}`);
        return;
      }
    }

    switch(columnId) {
      case 'sumType':
        if (jsonData.sum_type_summaries) {
          Object.entries(jsonData.sum_type_summaries).forEach(([type, data]) => {
            aggregated[type] = (aggregated[type] || 0) + (data.total || 0);
          });
        }
        break;

      case 'sumTier':
        if (jsonData.tier_summaries) {
          Object.entries(jsonData.tier_summaries).forEach(([tier, data]) => {
            aggregated[tier] = (aggregated[tier] || 0) + (data.total || 0);
          });
        }
        break;

      case 'smallBusiness':
        if (jsonData.business_size_summaries) {
          Object.entries(jsonData.business_size_summaries).forEach(([size, data]) => {
            aggregated[size] = (aggregated[size] || 0) + (data.total || 0);
          });
        }
        break;

      case 'contractVehicle':
        if (jsonData.top_contract_summaries) {
          Object.entries(jsonData.top_contract_summaries).forEach(([vehicle, data]) => {
            aggregated[vehicle] = (aggregated[vehicle] || 0) + (data.total || 0);
          });
        }
        break;

      case 'reseller':
        if (jsonData.top_15_reseller_summaries) {
          Object.entries(jsonData.top_15_reseller_summaries).forEach(([reseller, data]) => {
            aggregated[reseller] = (aggregated[reseller] || 0) + (data.total || 0);
          });
        }
        break;

      case 'bicReseller':
        if (jsonData.top_15_resellers && Array.isArray(jsonData.top_15_resellers)) {
          jsonData.top_15_resellers.forEach(item => {
            const name = item.vendor_name;
            const value = item.total_sales || 0;
            if (name) aggregated[name] = (aggregated[name] || 0) + value;
          });
        }
        break;

      case 'topBicProducts':
        if (jsonData.top_25_products && Array.isArray(jsonData.top_25_products)) {
          jsonData.top_25_products.forEach(item => {
            const name = item.product_name;
            const value = item.total_price || 0;
            if (name) aggregated[name] = (aggregated[name] || 0) + value;
          });
        }
        break;

      case 'fasOem':
        if (jsonData.top_10_oem_summaries) {
          Object.entries(jsonData.top_10_oem_summaries).forEach(([oem, data]) => {
            aggregated[oem] = (aggregated[oem] || 0) + (data.total_obligations || data.total || 0);
          });
        }
        break;

      case 'bicOem':
        if (jsonData.top_15_manufacturers && Array.isArray(jsonData.top_15_manufacturers)) {
          jsonData.top_15_manufacturers.forEach(item => {
            const name = item.manufacturer_name;
            const value = item.total_sales || 0;
            if (name) aggregated[name] = (aggregated[name] || 0) + value;
          });
        }
        break;

      case 'fundingDepartment':
        if (jsonData.top_10_department_summaries) {
          Object.entries(jsonData.top_10_department_summaries).forEach(([dept, data]) => {
            aggregated[dept] = (aggregated[dept] || 0) + (data.total || 0);
          });
        }
        break;

      case 'fundingAgency':
        if (jsonData.top_10_agency_summaries) {
          Object.entries(jsonData.top_10_agency_summaries).forEach(([agency, data]) => {
            aggregated[agency] = (aggregated[agency] || 0) + (data.total || 0);
          });
        }
        break;

      case 'aiProduct':
      case 'productObligations':
        if (jsonData.fiscal_year_summaries) {
          Object.values(jsonData.fiscal_year_summaries).forEach(yearData => {
            const items = yearData.top_10_products || [];
            items.forEach(item => {
              const name = item.product;
              const value = item.obligations || 0;
              if (name && value) {
                aggregated[name] = (aggregated[name] || 0) + value;
              }
            });
          });
        }
        break;

      case 'aiCategory':
      case 'aiCategories':
      case 'categoryObligations':
        if (jsonData.fiscal_year_summaries) {
          Object.values(jsonData.fiscal_year_summaries).forEach(yearData => {
            const items = yearData.top_10_categories || [];
            items.forEach(item => {
              const name = item.category;
              const value = item.obligations || 0;
              if (name && value) {
                aggregated[name] = (aggregated[name] || 0) + value;
              }
            });
          });
        }
        break;
    }
  });

  console.log(`aggregateColumnData RESULT for ${columnId}:`, aggregated);
  return aggregated;
}


/**
 * Generate breakdown pie chart showing category distribution
 */
function generateBreakdownPieChart(data, columnId, entityType) {
  console.log(`🥧 generateBreakdownPieChart for ${columnId}: Received ${data.length} items`);
  console.log(`🥧 First 5 items:`, data.slice(0, 5).map(item => `${item.name}: ${item.value}`));
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  return {
    id: `${entityType}_${columnId}_breakdown_pie`,
    title: `${getColumnDisplayName(columnId)} - Category Breakdown`,
    cardType: 'chart',
    chartType: 'pie',
    chartData: {
      labels: data.map(item => item.name),
      datasets: [{
        data: data.map(item => item.value),
        backgroundColor: generateColorGradient(data.length),
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    chartOptions: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const percentage = totalValue > 0 ? ((context.parsed / totalValue) * 100).toFixed(1) : '0.0';
              return `${context.label}: ${formatCurrencyShort(context.parsed)} (${percentage}%)`;
            }
          }
        }
      }
    },
    tableData: {
      headers: ['Category', 'Total Value', 'Percentage'],
      rows: data.map(item => {
        const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0';
        return [
          item.name,
          formatCurrency(item.value),
          `${percentage}%`
        ];
      })
    },
    summary: {
      totalDisplayed: formatCurrencyShort(totalValue),
      categoriesShown: data.length,
      topCategory: data.length > 0 ? data[0].name : 'N/A',
      topCategoryValue: data.length > 0 ? formatCurrencyShort(data[0].value) : 'N/A'
    }
  };
}

/**
 * Generate breakdown horizontal bar chart
 */
function generateBreakdownHorizontalBarChart(data, columnId, entityType, topN) {
  console.log(`📊 generateBreakdownHorizontalBarChart for ${columnId}: Received ${data.length} items, showing top ${topN}`);
  console.log(`📊 First 5 items:`, data.slice(0, 5).map(item => `${item.name}: ${item.value}`));
  const displayData = data.slice(0, topN);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  return {
    id: `${entityType}_${columnId}_breakdown_horizontalBar`,
    title: `${getColumnDisplayName(columnId)} - Top ${Math.min(topN, data.length)} Categories`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: displayData.map(item => item.name),
      datasets: [{
        label: getColumnDisplayName(columnId),
        data: displayData.map(item => item.value),
        backgroundColor: '#144673',
        borderColor: '#0a2240',
        borderWidth: 1
      }]
    },
    chartOptions: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrencyShort(value);
            }
          }
        }
      }
    },
    tableData: {
      headers: ['Rank', 'Category', 'Value', 'Percentage'],
      rows: displayData.map((item, index) => {
        const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0';
        return [
          `#${index + 1}`,
          item.name,
          formatCurrency(item.value),
          `${percentage}%`
        ];
      })
    },
    summary: {
      totalDisplayed: formatCurrencyShort(displayData.reduce((sum, item) => sum + item.value, 0)),
      percentageOfTotal: totalValue > 0 ? formatPercentage(displayData.reduce((sum, item) => sum + item.value, 0), totalValue) : '0.0%',
      topPerformer: displayData.length > 0 ? displayData[0].name : 'N/A',
      topPerformerValue: displayData.length > 0 ? formatCurrencyShort(displayData[0].value) : 'N/A'
    }
  };
}

/**
 * Generate fiscal year trend for column breakdown
 */
function generateBreakdownFiscalTrend(entities, columnId, entityType) {
  const fiscalData = {};
  
  // Aggregate fiscal year data for this column
  entities.forEach(entity => {
    const jsonData = entity[columnId];
    if (!jsonData) return;
    
    // Extract fiscal year data based on column structure
    let yearlyData = null;
    
    if (jsonData.fiscal_year_obligations) {
      yearlyData = jsonData.fiscal_year_obligations;
    } else if (columnId === 'sumType' && jsonData.sum_type_summaries) {
      // Aggregate fiscal years across sum types
      Object.values(jsonData.sum_type_summaries).forEach(typeData => {
        if (typeData.fiscal_years) {
          Object.entries(typeData.fiscal_years).forEach(([year, value]) => {
            fiscalData[year] = (fiscalData[year] || 0) + value;
          });
        }
      });
      return; // Already processed
    } else if (columnId === 'sumTier' && jsonData.tier_summaries) {
      // Aggregate fiscal years across tiers
      Object.values(jsonData.tier_summaries).forEach(tierData => {
        if (tierData.fiscal_years) {
          Object.entries(tierData.fiscal_years).forEach(([year, value]) => {
            fiscalData[year] = (fiscalData[year] || 0) + value;
          });
        }
      });
      return; // Already processed
    }
    
    // Generic fiscal year extraction
    if (yearlyData && typeof yearlyData === 'object') {
      Object.entries(yearlyData).forEach(([year, value]) => {
        fiscalData[year] = (fiscalData[year] || 0) + (parseFloat(value) || 0);
      });
    }
  });
  
  const years = Object.keys(fiscalData).sort();
  if (years.length < 2) return null; // Need at least 2 years for a trend
  
  const values = years.map(year => fiscalData[year]);
  const totalValue = values.reduce((sum, val) => sum + val, 0);
  
  return {
    id: `${entityType}_${columnId}_breakdown_fiscalTrend`,
    title: `${getColumnDisplayName(columnId)} - Historical Trend`,
    cardType: 'chart',
    chartType: 'line',
    chartData: {
      labels: years.map(year => `FY${year}`),
      datasets: [{
        label: getColumnDisplayName(columnId),
        data: values,
        borderColor: '#144673',
        backgroundColor: 'rgba(20, 70, 115, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    chartOptions: {
      responsive: true,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrencyShort(value);
            }
          }
        }
      }
    },
    tableData: {
      headers: ['Fiscal Year', 'Total Value', 'YoY Growth %'],
      rows: years.map((year, index) => {
        const value = values[index];
        const growth = index > 0 ? 
          (((value - values[index - 1]) / values[index - 1]) * 100).toFixed(1) + '%' : 
          'N/A';
        return [
          `FY${year}`,
          formatCurrency(value),
          growth
        ];
      })
    },
    summary: {
      totalValue: formatCurrencyShort(totalValue),
      totalGrowth: values.length > 1 ? 
        (((values[values.length - 1] - values[0]) / values[0]) * 100).toFixed(1) + '%' : 
        'N/A',
      yearsTracked: years.length
    }
  };
}

/**
 * Generate vertical bar chart (for ≤5 entities)
 */
function generateVerticalBarChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther, overallTotal) {
  // entities already includes "Others" if applicable
  const actualTopN = entities.filter(e => !e.isOthers).length;
  const titleSuffix = `Top ${actualTopN}${entities.some(e => e.isOthers) ? ' + All Other' : ''}`;
  const totalDisplayed = entities.reduce((sum, e) => sum + (e.value || 0), 0);
  const percentageModeLabel = percentageMode === 'topN' ? '% of displayed' : '% of total';
  
  return {
    id: `${entityType}_${columnId}_verticalBar`,
    title: `${getColumnDisplayName(columnId)} - ${titleSuffix} (${formatCurrencyShort(totalDisplayed)}, ${percentageModeLabel})`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: entities.map(e => {
        const name = e.isOthers ? 'All Other' : (entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name);
        return name.length > 15 ? name.substring(0, 12) + '...' : name;
      }),
      datasets: [{
        label: `${getColumnDisplayName(columnId)} (with percentages)`,
        data: entities.map(e => e.value),
        backgroundColor: entities.map(e => e.isOthers ? '#94a3b8' : '#144673'),
        borderColor: entities.map(e => e.isOthers ? '#64748b' : '#0a2240'),
        borderWidth: 1
      }]
    },
    chartOptions: {
      indexAxis: 'x', // Vertical bars
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `${getColumnDisplayName(columnId)} - Top ${actualTopN}${entities.some(e => e.isOthers) ? ' + All Other' : ''}`
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const entity = entities[context.dataIndex];
              const percentage = formatPercentage(entity.value, percentageBase);
              return `${formatCurrencyShort(entity.value)} (${percentage})`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Value ($)'
          }
        }
      }
    },
    tableData: {
      headers: ['Rank', 'Entity', 'Value', 'Percentage'],
      rows: entities.map((entity, index) => {
        const percentage = formatPercentage(entity.value, percentageBase);
        return [
          entity.isOthers ? 'N/A' : `#${index + 1}`,
          entity.isOthers ? 'All Other Combined' : entity.name,
          formatCurrencyShort(entity.value),
          percentage
        ];
      })
    },
    summary: {
      totalDisplayed: formatCurrencyShort(totalDisplayed),
      percentageOfTotal: formatPercentage(totalDisplayed, overallTotal),
      topPerformer: entities.length > 0 ? entities[0].name : 'N/A',
      topPerformerValue: entities.length > 0 ? formatCurrencyShort(entities[0].value) : 'N/A',
      entitiesShown: entities.length,
      hasAllOther: entities.some(e => e.isOthers)
    }
  };
}

/**
 * Generate horizontal bar chart (better for longer names)
 */
function generateHorizontalBarChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther, overallTotal) {
  // entities already includes "Others" if applicable
  const actualTopN = entities.filter(e => !e.isOthers).length;
  const titleSuffix = `Top ${actualTopN}${entities.some(e => e.isOthers) ? ' + All Other' : ''}`;
  const totalDisplayed = entities.reduce((sum, e) => sum + (e.value || 0), 0);
  
  return {
    id: `${entityType}_${columnId}_horizontalBar`,
    title: `${getColumnDisplayName(columnId)} - ${titleSuffix} (${formatCurrencyShort(totalDisplayed)} total)`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: entities.map(e => {
        const name = e.isOthers ? 'All Other' : (entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name);
        return name.length > 20 ? name.substring(0, 17) + '...' : name;
      }),
      datasets: [{
        label: `${getColumnDisplayName(columnId)} (with percentages)`,
        data: entities.map(e => e.value),
        backgroundColor: entities.map(e => e.isOthers ? '#94a3b8' : '#144673'),
        borderColor: entities.map(e => e.isOthers ? '#64748b' : '#0a2240'),
        borderWidth: 1
      }]
    },
    chartOptions: {
      indexAxis: 'y', // Horizontal bars
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `${getColumnDisplayName(columnId)} - Top ${actualTopN}${entities.some(e => e.isOthers) ? ' + All Other' : ''}`
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const entity = entities[context.dataIndex];
              const percentage = formatPercentage(entity.value, percentageBase);
              return `${formatCurrencyShort(entity.value)} (${percentage})`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Value ($)'
          },
          ticks: {
            callback: function(value) {
              return formatCurrencyShort(value);
            }
          }
        }
      }
    },
    tableData: {
      headers: ['Rank', 'Entity', 'Value', 'Percentage'],
      rows: entities.map((entity, index) => {
        const percentage = formatPercentage(entity.value, percentageBase);
        return [
          entity.isOthers ? 'N/A' : `#${index + 1}`,
          entity.isOthers ? 'All Other Combined' : entity.name,
          formatCurrencyShort(entity.value),
          percentage
        ];
      })
    },
    summary: {
      totalDisplayed: formatCurrencyShort(totalDisplayed),
      percentageOfTotal: formatPercentage(totalDisplayed, overallTotal),
      topPerformer: entities.length > 0 ? entities[0].name : 'N/A',
      topPerformerValue: entities.length > 0 ? formatCurrencyShort(entities[0].value) : 'N/A',
      entitiesShown: entities.length,
      hasAllOther: entities.some(e => e.isOthers),
      chartType: 'Horizontal Bar Chart - Best for longer entity names'
    }
  };
}

/**
 * Generate line chart (for trends and 5-15 entities)
 */
function generateLineChart(entities, entityType, columnId, percentageBase, percentageMode) {
  return {
    id: `${entityType}_${columnId}_line`,
    title: `${getColumnDisplayName(columnId)} - Trend Analysis`,
    cardType: 'chart',
    chartType: 'line',
    chartData: {
      labels: entities.map(e => entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name),
      datasets: [{
        label: getColumnDisplayName(columnId),
        data: entities.map(e => e.value),
        borderColor: '#144673',
        backgroundColor: 'rgba(20, 70, 115, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    chartOptions: {
      responsive: true,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrencyShort(value);
            }
          }
        }
      }
    },
    tableData: {
      headers: ['Position', 'Entity', 'Value'],
      rows: entities.map((entity, index) => [
        `${index + 1}`,
        entity.name,
        formatCurrency(entity.value)
      ])
    }
  };
}

/**
 * Generate funnel chart (for PIID and conversion data)
 */
function generateFunnelChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther) {
  const topEntities = entities.slice(0, topN);
  const titleSuffix = topN >= entities.length ? `All ${entities.length}` : `Top ${topN}`;
  
  // Calculate percentages for funnel
  const maxValue = Math.max(...topEntities.map(e => e.value));
  const funnelData = topEntities.map(e => ({
    ...e,
    percentage: (e.value / maxValue) * 100
  }));
  
  return {
    id: `${entityType}_${columnId}_funnel`,
    title: `${getColumnDisplayName(columnId)} - ${titleSuffix} Funnel`,
    cardType: 'funnel',
    funnelData: funnelData.map((item, index) => ({
      label: entityType === 'agency' ? abbreviateAgencyName(item.name) : item.name,
      value: item.value,
      percentage: item.percentage,
      color: generateColorGradient(topN)[index],
      displayValue: formatCurrency(item.value)
    })),
    summary: {
      topValue: funnelData[0]?.value || 0,
      bottomValue: funnelData[funnelData.length - 1]?.value || 0,
      conversionRate: funnelData.length > 1 ? 
        ((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(1) + '%' : 
        'N/A'
    },
    tableData: {
      headers: ['Stage', 'Entity', 'Value', 'Relative %', 'Drop-off %'],
      rows: funnelData.map((item, index) => {
        const prevValue = index > 0 ? funnelData[index - 1].value : item.value;
        const dropOff = index > 0 ? 
          (((prevValue - item.value) / prevValue) * 100).toFixed(1) + '%' : 
          '0.0%';
        return [
          `${index + 1}`,
          item.name,
          formatCurrency(item.value),
          `${item.percentage.toFixed(1)}%`,
          dropOff
        ];
      })
    }
  };
}

/**
 * Generate enhanced pie chart with percentages and "All Other" support
 */
function generatePieChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther, overallTotal) {
  // entities already includes "Others" if applicable
  const actualTopN = entities.filter(e => !e.isOthers).length;
  const totalDisplayed = entities.reduce((sum, e) => sum + (e.value || 0), 0);
  
  // Generate color gradient for the pie slices
  const colors = [
    '#144673', '#3a6ea5', '#f47920', '#ff6b35', '#22c55e',
    '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#94a3b8'
  ];
  
  return {
    id: `${entityType}_${columnId}_pie`,
    title: `${getColumnDisplayName(columnId)} - Top ${actualTopN}${entities.some(e => e.isOthers) ? ' + All Other' : ''} (${formatCurrencyShort(totalDisplayed)} total)`,
    cardType: 'chart',
    chartType: 'pie',
    chartData: {
      labels: entities.map(e => {
        const name = e.isOthers ? 'All Other' : (entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name);
        const percentage = formatPercentage(e.value, overallTotal);
        return `${name} (${percentage})`;
      }),
      datasets: [{
        data: entities.map(e => e.value),
        backgroundColor: entities.map((e, index) => {
          if (e.isOthers) return '#94a3b8';
          return colors[index % colors.length];
        }),
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    chartOptions: {
      responsive: true,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 8,
            boxWidth: 15
          }
        },
        title: {
          display: true,
          text: `${getColumnDisplayName(columnId)} Distribution`,
          font: { size: 14, weight: 'bold' }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const entity = entities[context.dataIndex];
              const percentage = formatPercentage(entity.value, percentageBase);
              const value = formatCurrencyShort(entity.value);
              return `${entity.isOthers ? 'All Other' : entity.name}: ${value} (${percentage})`;
            }
          }
        }
      }
    },
    tableData: {
      headers: ['Rank', 'Entity', 'Value', 'Percentage'],
      rows: entities.map((entity, index) => {
        const percentage = formatPercentage(entity.value, percentageBase);
        return [
          entity.isOthers ? 'N/A' : `#${index + 1}`,
          entity.isOthers ? 'All Other Combined' : entity.name,
          formatCurrencyShort(entity.value),
          percentage
        ];
      })
    },
    summary: {
      totalDisplayed: formatCurrencyShort(totalDisplayed),
      percentageOfTotal: formatPercentage(totalDisplayed, overallTotal),
      topPerformer: entities.length > 0 ? entities[0].name : 'N/A',
      topPerformerValue: entities.length > 0 ? formatCurrencyShort(entities[0].value) : 'N/A',
      topPerformerPercentage: entities.length > 0 ? formatPercentage(entities[0].value, overallTotal) : 'N/A',
      entitiesShown: entities.length,
      hasAllOther: entities.some(e => e.isOthers),
      chartType: 'Pie Chart - Best for showing proportional relationships'
    }
  };
  
  allEntities.forEach(entity => {
    const jsonData = entity[columnId];
    if (!jsonData) return;
    
    // Extract fiscal year data based on column type
    let fyData = null;
    switch(columnId) {
      case 'reseller':
        // Aggregate from top_15_reseller_summaries
        if (jsonData.top_15_reseller_summaries) {
          Object.values(jsonData.top_15_reseller_summaries).forEach(reseller => {
            if (reseller.fiscal_years) {
              Object.entries(reseller.fiscal_years).forEach(([year, value]) => {
                fiscalYearTotals[year] = (fiscalYearTotals[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'bicOem':
        // Use yearly_totals from BIC OEM structure
        if (jsonData.yearly_totals) {
          Object.entries(jsonData.yearly_totals).forEach(([year, value]) => {
            fiscalYearTotals[year] = (fiscalYearTotals[year] || 0) + value;
          });
        }
        break;
        
      case 'fasOem':
        // Aggregate from top_10_oem_summaries
        if (jsonData.top_10_oem_summaries) {
          Object.values(jsonData.top_10_oem_summaries).forEach(oem => {
            if (oem.fiscal_years) {
              Object.entries(oem.fiscal_years).forEach(([year, value]) => {
                fiscalYearTotals[year] = (fiscalYearTotals[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'fundingAgency':
        // Aggregate from top_10_agency_summaries
        if (jsonData.top_10_agency_summaries) {
          Object.values(jsonData.top_10_agency_summaries).forEach(agency => {
            if (agency.fiscal_years) {
              Object.entries(agency.fiscal_years).forEach(([year, value]) => {
                fiscalYearTotals[year] = (fiscalYearTotals[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      default:
        // Generic fiscal year extraction
        const fyDataGeneric = jsonData.fiscal_year_obligations || 
                       jsonData.fiscal_years || 
                       jsonData.yearly_totals || 
                       jsonData.fiscal_year_breakdown;
        
        if (fyDataGeneric && typeof fyDataGeneric === 'object') {
          Object.entries(fyDataGeneric).forEach(([year, value]) => {
            fiscalYearTotals[year] = (fiscalYearTotals[year] || 0) + (parseFloat(value) || 0);
          });
        }
    }
  });
  
  // Sort years and create chart data
  const years = Object.keys(fiscalYearTotals).sort();
  const values = years.map(year => fiscalYearTotals[year]);
  const totalValue = values.reduce((sum, val) => sum + val, 0);
  
  // If no fiscal year data, fallback to top entities
  if (years.length === 0) {
    const topEntities = entities.slice(0, Math.min(topN, 8));
    const entityTotal = topEntities.reduce((sum, e) => sum + e.value, 0);
    
    return {
      id: `${entityType}_${columnId}_pie`,
      title: `${getColumnDisplayName(columnId)} - Top ${topEntities.length} Distribution`,
      cardType: 'chart',
      chartType: 'pie',
      chartData: {
        labels: topEntities.map(e => entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name),
        datasets: [{
          data: topEntities.map(e => e.value),
          backgroundColor: generateColorGradient(topEntities.length),
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      chartOptions: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      },
      tableData: {
        headers: ['Entity', 'Value', 'Percentage'],
        rows: topEntities.map((entity) => {
          const percentage = entityTotal > 0 ? ((entity.value / entityTotal) * 100).toFixed(1) : '0.0';
          return [
            entity.name,
            formatCurrency(entity.value),
            `${percentage}%`
          ];
        })
      }
    };
  }
  
  return {
    id: `${entityType}_${columnId}_pie`,
    title: `${getColumnDisplayName(columnId)} - Fiscal Year Breakdown`,
    cardType: 'chart',
    chartType: 'pie',
    chartData: {
      labels: years,
      datasets: [{
        data: values,
        backgroundColor: ['#0a2240', '#144673', '#3a6ea5', '#f47920', '#ff6b35'],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    chartOptions: {
      responsive: true,
      plugins: {
        legend: { 
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 10
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const percentage = ((context.parsed / totalValue) * 100).toFixed(1);
              return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
            }
          }
        }
      }
    },
    tableData: {
      headers: ['Fiscal Year', 'Value', 'Percentage', 'Growth'],
      rows: years.map((year, index) => {
        const value = values[index];
        const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
        const growth = index > 0 ? 
          (((value - values[index - 1]) / values[index - 1]) * 100).toFixed(1) + '%' : 
          'N/A';
        return [
          `FY${year}`,
          formatCurrency(value),
          `${percentage}%`,
          growth
        ];
      })
    }
  };
}

/**
 * Generate doughnut chart
 */
function generateDoughnutChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther, overallTotal) {
  const pieChart = generatePieChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther, overallTotal);
  return {
    ...pieChart,
    id: `${entityType}_${columnId}_doughnut`,
    title: pieChart.title ? pieChart.title.replace('Breakdown', 'Doughnut') : `${getColumnDisplayName(columnId)} - Doughnut View`,
    chartType: 'doughnut'
    // tableData already included from pieChart
  };
}

/**
 * Generate stacked bar chart for fiscal year comparisons
 */
function generateStackedBarChart(entities, entityType, columnId, maxEntities = 5) {
  // Get fiscal year data from DataManager
  const dataManager = getDataManager();
  const fiscalYearData = {};
  
  // Aggregate fiscal year data for top entities (max 5 for readability)
  entities.slice(0, maxEntities).forEach(entity => {
    // Try multiple fiscal year property names from JSON columns
    const fiscalYearBreakdown = entity.fiscal_year_breakdown || 
                               entity.fiscal_year_obligations || 
                               entity.fiscal_years ||
                               entity.yearly_totals;
    
    if (fiscalYearBreakdown && typeof fiscalYearBreakdown === 'object') {
      Object.entries(fiscalYearBreakdown).forEach(([year, value]) => {
        if (!fiscalYearData[year]) fiscalYearData[year] = {};
        fiscalYearData[year][entity.name] = parseFloat(value) || 0;
      });
    }
    
    console.log(`📅 Fiscal Year Debug: ${entity.name} has fiscal data:`, !!fiscalYearBreakdown);
  });
  
  const years = Object.keys(fiscalYearData).sort();
  const entityNames = entities.slice(0, maxEntities).map(e => entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name);
  
  // Create table data showing year-over-year by entity
  const tableRows = [];
  entityNames.forEach(entityName => {
    const entityRow = [entityName];
    years.forEach(year => {
      const value = fiscalYearData[year]?.[entityName] || 0;
      entityRow.push(formatCurrency(value));
    });
    // Add total column
    const total = years.reduce((sum, year) => sum + (fiscalYearData[year]?.[entityName] || 0), 0);
    entityRow.push(formatCurrency(total));
    tableRows.push(entityRow);
  });
  
  return {
    id: `${entityType}_${columnId}_stackedBar`,
    title: `${getColumnDisplayName(columnId)} - Year over Year`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: years,
      datasets: entityNames.map((name, index) => ({
        label: name,
        data: years.map(year => fiscalYearData[year]?.[name] || 0),
        backgroundColor: generateColorGradient(entityNames.length)[index]
      }))
    },
    chartOptions: {
      indexAxis: 'y', // Make it horizontal bars
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          mode: 'point',
          intersect: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrencyShort(value);
            }
          }
        },
        y: {
          stacked: false
        }
      }
    },
    tableData: {
      headers: ['Entity', ...years, 'Total'],
      rows: tableRows
    }
  };
}

/**
 * Generate area chart for trends
 */
function generateAreaChart(entities, entityType, columnId) {
  const lineChart = generateLineChart(entities, entityType, columnId);
  return {
    ...lineChart,
    id: `${entityType}_${columnId}_area`,
    title: `${getColumnDisplayName(columnId)} - Area Trend`,
    chartData: {
      ...lineChart.chartData,
      datasets: [{
        ...lineChart.chartData.datasets[0],
        fill: true,
        backgroundColor: 'rgba(20, 70, 115, 0.3)'
      }]
    }
    // tableData already included from lineChart
  };
}

/**
 * Generate trend over time chart
 */
function generateTrendOverTime(entityType, columnId, selectedEntities = []) {
  const dataManager = getDataManager();
  const fiscalYearData = dataManager.getFiscalYearTrends(entityType, columnId, selectedEntities);
  
  if (!fiscalYearData || Object.keys(fiscalYearData).length === 0) {
    return null;
  }
  
  const years = Object.keys(fiscalYearData).sort();
  const values = years.map(year => fiscalYearData[year]);
  
  // Calculate year-over-year growth
  const growthRates = [];
  for (let i = 1; i < values.length; i++) {
    const growth = values[i-1] !== 0 ? ((values[i] - values[i-1]) / values[i-1]) * 100 : 0;
    growthRates.push(growth);
  }
  
  return {
    id: `${entityType}_${columnId}_trend`,
    title: `${getColumnDisplayName(columnId)} - Historical Trend`,
    cardType: 'chart',
    chartType: 'line',
    chartData: {
      labels: years,
      datasets: [
        {
          label: 'Total Value',
          data: values,
          borderColor: '#144673',
          backgroundColor: 'rgba(20, 70, 115, 0.1)',
          yAxisID: 'y',
          tension: 0.3
        },
        {
          label: 'YoY Growth %',
          data: [null, ...growthRates.map(r => r.toFixed(1))],
          borderColor: '#f47920',
          backgroundColor: 'rgba(244, 121, 32, 0.1)',
          yAxisID: 'y1',
          borderDash: [5, 5]
        }
      ]
    },
    chartOptions: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks: {
            callback: function(value) {
              return formatCurrencyShort(value);
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      }
    },
    summary: {
      totalGrowth: values.length > 1 ? 
        (((values[values.length - 1] - values[0]) / values[0]) * 100).toFixed(1) + '%' : 
        'N/A',
      avgAnnualGrowth: growthRates.length > 0 ?
        (growthRates.reduce((a, b) => a + b, 0) / growthRates.length).toFixed(1) + '%' :
        'N/A'
    },
    tableData: {
      headers: ['Year', 'Total Value', 'YoY Growth %', 'YoY Change'],
      rows: years.map((year, index) => [
        year,
        formatCurrency(values[index]),
        index > 0 ? `${growthRates[index - 1].toFixed(1)}%` : 'N/A',
        index > 0 ? formatCurrency(values[index] - values[index - 1]) : 'N/A'
      ])
    }
  };
}

/**
 * Helper function to generate color gradient
 */
function generateColorGradient(count) {
  const baseColors = [
    '#0a2240', // Dark Blue
    '#144673', // Blue
    '#3a6ea5', // Light Blue
    '#f47920', // Orange
    '#ff6b35', // Light Orange
    '#22c55e', // Green
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#06b6d4'  // Cyan
  ];
  
  return baseColors.slice(0, count);
}

/**
 * Get display name for column
 */
function getColumnDisplayName(columnId) {
  const columnNames = {
    obligations: 'Obligations',
    smallBusiness: 'Small Business',
    sumTier: 'SUM Tier',
    sumType: 'SUM Type',
    contractVehicle: 'Contract Vehicle',
    fundingDepartment: 'Funding Department',
    discount: 'Discount',
    topRefPiid: 'Top Referenced PIID',
    topPiid: 'Top PIID',
    activeContracts: 'Active Contracts',
    discountOfferings: 'Discount Offerings',
    aiProduct: 'AI Products',
    aiCategory: 'AI Category',
    topBicProducts: 'Top BIC Products',
    reseller: 'Reseller',
    bicReseller: 'BIC Reseller',
    bicOem: 'BIC OEM',
    fasOem: 'FAS OEM',
    fundingAgency: 'Funding Agency',
    bicTopProductsPerAgency: 'BIC Top Products per Agency',
    oneGovTier: 'OneGov Tier'
  };
  
  return columnNames[columnId] || columnId;
}

/**
 * Main entry point to replace existing generateColumnReports
 */
function generateColumnReportsBuffet(entityType, columnId, topN = 10, selectedEntities = [], deptFilter = 'all', tierFilter = 'all') {
  // RAW ARGUMENTS LOG - Print exactly what was received  
  console.log('🔍 RAW ARGUMENTS generateColumnReportsBuffet:');
  console.log('  entityType:', entityType);
  console.log('  columnId:', columnId);
  console.log('  topN:', topN);
  console.log('  selectedEntities:', selectedEntities);
  console.log('  deptFilter:', deptFilter);
  console.log('  tierFilter:', tierFilter);
  
  console.log('Chart Buffet: Generating visualization suite for', entityType, columnId);
  
  try {
    // Get DataManager instance
    const dataManager = getDataManager();
    
    // Get entities using DataManager
    const options = {
      entityType: entityType,
      columnId: columnId,
      topN: topN,
      selectedEntities: selectedEntities,
      deptFilter: deptFilter,
      tierFilter: tierFilter
    };
    
    // Load entities for report building
    let reportEntities = [];
    
    try {
      // Primary method: Try getEntitiesForView first
      reportEntities = dataManager.getEntitiesForView('reportBuilder', options);
      
      // Fallback method: Direct entity type loading if primary failed
      if (reportEntities.length === 0) {
        if (entityType === 'agency') {
          reportEntities = dataManager.getAgencies();
        } else if (entityType === 'oem') {
          reportEntities = dataManager.getOEMs();
        } else if (entityType === 'vendor') {
          reportEntities = dataManager.getVendors();
        }
      }
    } catch (error) {
      console.error('DataManager entity loading failed:', error);
    }
    
    if (reportEntities.length === 0) {
      console.error('No entities found after all loading attempts');
      return [];
    }
    
    // Apply DOD/Civilian filter if specified
    if (deptFilter && deptFilter !== 'all') {
      const DOD_AGENCIES = ['DEPARTMENT OF DEFENSE', 'DEPARTMENT OF THE ARMY', 'DEPARTMENT OF THE NAVY', 
        'DEPARTMENT OF THE AIR FORCE', 'DEFENSE LOGISTICS AGENCY', 'DEFENSE INFORMATION SYSTEMS AGENCY',
        'DEFENSE HEALTH AGENCY', 'DEFENSE CONTRACT MANAGEMENT AGENCY', 'MISSILE DEFENSE AGENCY',
        'NATIONAL SECURITY AGENCY', 'DEFENSE INTELLIGENCE AGENCY', 'NATIONAL GEOSPATIAL-INTELLIGENCE AGENCY',
        'DEFENSE ADVANCED RESEARCH PROJECTS AGENCY', 'DISA', 'DLA', 'ARMY', 'NAVY', 'AIR FORCE', 'USAF', 'USA', 'USN', 'DOD'];
      
      reportEntities = reportEntities.filter(entity => {
        const name = (entity.name || '').toUpperCase();
        const isDOD = DOD_AGENCIES.some(dod => name.includes(dod));
        return deptFilter === 'dod' ? isDOD : !isDOD;
      });
    }
    
    // Apply OneGov Tier filter if specified (uses oneGovTier.mode_tier field)
    if (tierFilter && tierFilter !== 'all') {
      reportEntities = reportEntities.filter(entity => {
        // Get tier from oneGovTier.mode_tier (same as KPI carousel)
        const entityTier = entity.oneGovTier?.mode_tier || '';
        return entityTier.toUpperCase() === tierFilter.toUpperCase();
      });
    }
    
    // Generate the complete chart buffet
    const cards = generateChartBuffet(entityType, columnId, reportEntities, {
      topN: topN,
      selectedEntities: selectedEntities,
      deptFilter: deptFilter,
      tierFilter: tierFilter
    });
    
    // Add metadata to each card
    cards.forEach(card => {
      card.metadata = {
        generatedBy: 'Chart Buffet v1.3.0',
        entityType: entityType,
        columnId: columnId,
        timestamp: new Date().toISOString()
      };
    });
    
    return cards;
    
  } catch (error) {
    console.error('Chart Buffet Error:', error);
    return [];
  }
}