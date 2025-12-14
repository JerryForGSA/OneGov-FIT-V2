/**
 * @fileoverview Chart Buffet System for OneGov FIT Market Report Builder - VERSION 343
 * @module B06_chartBuffet  
 * @version 2.2.0 - Dynamic Fiscal Year Options and Enhanced Debugging
 * @description Comprehensive chart generation system with intelligent type selection
 *              based on data characteristics, entity type, and user preferences.
 *              NOW INCLUDES: Top N selection, "All Other" aggregation, percentage calculations,
 *              professional styling, enhanced tooltips, comprehensive labeling, 
 *              COLUMN-SPECIFIC BREAKDOWNS, FISCAL YEAR TREND ANALYSIS,
 *              IMPROVED LEGEND POSITIONING, and FISCAL YEAR RANGE INDICATORS
 * @author OneGov FIT Market Development Team
 * @updated 2024-12-14 - Added fiscal year range (FY2022-2025) to all chart titles
 */

/**
 * Get fiscal year range text based on filter
 * @param {string} fiscalYearFilter - The fiscal year filter value
 * @returns {string} Formatted fiscal year range text
 */
function getFiscalYearRangeText(fiscalYearFilter) {
  if (!fiscalYearFilter || fiscalYearFilter === 'all') {
    return 'FY2022-2025';
  }
  
  switch (fiscalYearFilter) {
    case '2025': return 'FY2025 Only';
    case '2024': return 'FY2024 Only';
    case '2023': return 'FY2023 Only';
    case '2022': return 'FY2022 Only';
    case '2024-2025': return 'FY2024-2025';
    case '2023-2025': return 'FY2023-2025';
    default: return 'FY2022-2025';
  }
}

/**
 * Get shared legend configuration for all charts
 * Provides consistent legend styling, positioning, and interactivity
 * @param {string} chartType - Type of chart (pie, bar, line, etc.)
 * @param {boolean} hasMultipleDatasets - Whether chart has multiple datasets
 * @returns {Object} Legend configuration object
 */
function getSharedLegendConfig(chartType, hasMultipleDatasets = false) {
  // Determine if legend should be displayed
  const shouldDisplay = hasMultipleDatasets || 
                       chartType === 'pie' || 
                       chartType === 'doughnut' ||
                       chartType === 'funnel';
  
  // Base legend configuration
  const legendConfig = {
    display: shouldDisplay,
    position: 'right', // Move to right side for better vertical space
    align: 'center',
    labels: {
      usePointStyle: true,
      padding: 12, // Increased padding for better readability
      boxWidth: 20, // Slightly larger legend boxes
      boxHeight: 12,
      font: {
        size: 13, // Increased font size
        weight: '500',
        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      },
      color: '#333333', // High contrast text color
      generateLabels: function(chart) {
        // Custom label generation to handle text wrapping
        const original = Chart.defaults.plugins.legend.labels.generateLabels;
        const labels = original.call(this, chart);
        
        // Add custom properties for better interaction
        labels.forEach((label, index) => {
          // Truncate very long labels but keep full text in tooltip
          if (label.text && label.text.length > 30) {
            label.fullText = label.text;
            label.text = label.text.substring(0, 27) + '...';
          }
        });
        
        return labels;
      }
    },
    onHover: function(event, legendItem, legend) {
      // Add hover effect to legend items
      legend.chart.canvas.style.cursor = 'pointer';
      
      // Emphasize hovered dataset
      const index = legendItem.datasetIndex !== undefined ? 
                   legendItem.datasetIndex : legendItem.index;
      const chart = legend.chart;
      
      if (chart.data.datasets.length > 1) {
        // For multi-dataset charts
        chart.data.datasets.forEach((dataset, i) => {
          dataset.borderWidth = i === index ? 3 : 1;
          dataset.opacity = i === index ? 1 : 0.5;
        });
      } else {
        // For single dataset charts (pie, doughnut)
        const dataset = chart.data.datasets[0];
        if (dataset.hoverBackgroundColor) {
          dataset.hoverBorderWidth = 3;
        }
      }
      
      chart.update('none'); // Update without animation for smooth interaction
    },
    onLeave: function(event, legendItem, legend) {
      // Reset cursor and emphasis
      legend.chart.canvas.style.cursor = 'default';
      const chart = legend.chart;
      
      // Reset all datasets to normal state
      chart.data.datasets.forEach((dataset) => {
        dataset.borderWidth = dataset.originalBorderWidth || 1;
        dataset.opacity = 1;
      });
      
      chart.update('none');
    },
    onClick: function(event, legendItem, legend) {
      // Enhanced click to toggle - default Chart.js behavior
      const index = legendItem.datasetIndex !== undefined ? 
                   legendItem.datasetIndex : legendItem.index;
      const chart = legend.chart;
      
      if (chart.data.datasets.length > 1) {
        // Toggle dataset visibility
        const dataset = chart.data.datasets[index];
        dataset.hidden = !dataset.hidden;
      } else {
        // For pie/doughnut, toggle segment visibility
        const meta = chart.getDatasetMeta(0);
        meta.data[index].hidden = !meta.data[index].hidden;
      }
      
      chart.update();
    }
  };
  
  // Special positioning for certain chart types
  if (chartType === 'horizontalBar' || chartType === 'funnel') {
    legendConfig.position = 'bottom'; // Keep bottom for horizontal layouts
    legendConfig.align = 'start';
  }
  
  return legendConfig;
}

/**
 * Get shared layout configuration to maximize chart area
 * @returns {Object} Layout configuration object
 */
function getSharedLayoutConfig() {
  return {
    padding: {
      top: 5,    // Minimal top padding since legend moved to side
      right: 10,  // Small right padding
      bottom: 10, // Small bottom padding
      left: 10    // Small left padding
    }
  };
}

/**
 * Get available fiscal years from entity data
 * @param {Array} entities - Array of entities
 * @param {string} columnId - Column identifier
 * @returns {Array} Array of available fiscal years, newest first
 */
function getAvailableFiscalYears(entities, columnId) {
  console.log('🔍 getAvailableFiscalYears called');
  console.log('  Entity count:', entities.length);
  console.log('  Column ID:', columnId);
  console.log('  First entity sample:', entities[0]);
  
  const years = new Set();
  
  entities.forEach((entity, index) => {
    console.log(`  Entity ${index}: ${entity.name}`);
    let fyData = entity.fiscal_year_obligations || {};
    console.log(`    Direct fiscal_year_obligations:`, Object.keys(fyData));
    
    // If obligations column, check nested structure
    if (Object.keys(fyData).length === 0 && entity.obligations) {
      fyData = entity.obligations.fiscal_year_obligations || {};
      console.log(`    Nested fiscal_year_obligations:`, Object.keys(fyData));
    }
    
    // For obligations column specifically, also check direct properties
    if (Object.keys(fyData).length === 0 && columnId === 'obligations') {
      // Look for any property that might contain fiscal year data
      const possibleKeys = Object.keys(entity).filter(key => 
        key.includes('fiscal') || key.includes('year') || key.match(/20\d{2}/)
      );
      console.log(`    Possible fiscal year keys for obligations:`, possibleKeys);
      
      // Also check if there are year-based properties directly
      const directYearKeys = Object.keys(entity).filter(key => key.match(/^20\d{2}$/));
      if (directYearKeys.length > 0) {
        console.log(`    Direct year properties:`, directYearKeys);
        directYearKeys.forEach(yearKey => years.add(yearKey));
      }
    }
    
    // Check column-specific fiscal year data
    if (Object.keys(fyData).length === 0 && columnId) {
      const columnData = entity[columnId];
      if (columnData) {
        let jsonData = columnData;
        
        // Parse if needed
        if (typeof jsonData === 'string') {
          try {
            jsonData = JSON.parse(jsonData);
          } catch(e) {
            return; // Skip this entity if JSON is invalid
          }
        }
        
        // Extract fiscal year data based on column structure
        switch(columnId) {
          case 'contractVehicle':
            if (jsonData.top_contract_summaries) {
              Object.values(jsonData.top_contract_summaries).forEach(vehicleData => {
                if (vehicleData.fiscal_years) {
                  Object.keys(vehicleData.fiscal_years).forEach(year => years.add(year));
                }
              });
            }
            break;
            
          case 'sumType':
            if (jsonData.sum_type_summaries) {
              Object.values(jsonData.sum_type_summaries).forEach(typeData => {
                if (typeData.fiscal_years) {
                  Object.keys(typeData.fiscal_years).forEach(year => years.add(year));
                }
              });
            }
            break;
            
          case 'sumTier':
            if (jsonData.tier_summaries) {
              Object.values(jsonData.tier_summaries).forEach(tierData => {
                if (tierData.fiscal_years) {
                  Object.keys(tierData.fiscal_years).forEach(year => years.add(year));
                }
              });
            }
            break;
            
          case 'smallBusiness':
            if (jsonData.business_size_summaries) {
              Object.values(jsonData.business_size_summaries).forEach(sizeData => {
                if (sizeData.fiscal_years) {
                  Object.keys(sizeData.fiscal_years).forEach(year => years.add(year));
                }
              });
            }
            break;
            
          case 'reseller':
            if (jsonData.top_15_reseller_summaries) {
              Object.values(jsonData.top_15_reseller_summaries).forEach(resellerData => {
                if (resellerData.fiscal_years) {
                  Object.keys(resellerData.fiscal_years).forEach(year => years.add(year));
                }
              });
            }
            break;
            
          case 'fundingDepartment':
            if (jsonData.top_10_department_summaries) {
              Object.values(jsonData.top_10_department_summaries).forEach(deptData => {
                if (deptData.fiscal_years) {
                  Object.keys(deptData.fiscal_years).forEach(year => years.add(year));
                }
              });
            }
            break;
            
          case 'fundingAgency':
            if (jsonData.top_10_agency_summaries) {
              Object.values(jsonData.top_10_agency_summaries).forEach(agencyData => {
                if (agencyData.fiscal_years) {
                  Object.keys(agencyData.fiscal_years).forEach(year => years.add(year));
                }
              });
            }
            break;
        }
      }
    }
    
    // Add years from the direct fiscal year data
    if (typeof fyData === 'object') {
      Object.keys(fyData).forEach(year => years.add(year));
    }
  });
  
  console.log('  Years found:', Array.from(years));
  return Array.from(years).sort().reverse(); // Return newest first
}

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
 * Format full currency values
 * @param {number} value - Currency value
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  if (!value || isNaN(value)) return '$0';
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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
 * @param {number} entityCount - Number of entities to display (5, 10, 15, 20, or all)
 * @returns {Array<string>} Array of chart type strings to generate
 * 
 * HOW TO MODIFY THIS FUNCTION:
 * 1. Find the column section (e.g., CHART_CONFIG.obligations)
 * 2. Find the entity type (e.g., agency, oem, vendor)
 * 3. Find the entity count (5, 10, 15, 20, or all)
 * 4. Change the array of chart types
 * 
 * Available chart types: 'verticalBar', 'horizontalBar', 'pie', 'doughnut', 
 *                        'line', 'funnel', 'stackedBar', 'area', 
 *                        'fiscalTrend', 'fiscalArea', 'fiscalBar'
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
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SMALL BUSINESS - Set-aside and small business metrics
    // ─────────────────────────────────────────────────────────────────────────
    smallBusiness: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SUM TIER - Tiered classification data
    // ─────────────────────────────────────────────────────────────────────────
    sumTier: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // SUM TYPE - Type classification
    // ─────────────────────────────────────────────────────────────────────────
    sumType: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // CONTRACT VEHICLE - Vehicle distribution
    // ─────────────────────────────────────────────────────────────────────────
    contractVehicle: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // FUNDING DEPARTMENT - Department-level funding
    // ─────────────────────────────────────────────────────────────────────────
    fundingDepartment: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // FUNDING AGENCY - Agency-level funding (different from fundingDepartment)
    // ─────────────────────────────────────────────────────────────────────────
    fundingAgency: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // DISCOUNT - Discount metrics
    // ─────────────────────────────────────────────────────────────────────────
    discount: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // TOP REFERENCED PIID - Contract reference rankings
    // ─────────────────────────────────────────────────────────────────────────
    topRefPiid: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // TOP PIID - Primary contract rankings
    // ─────────────────────────────────────────────────────────────────────────
    topPiid: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // ACTIVE CONTRACTS - Contract count metrics
    // ─────────────────────────────────────────────────────────────────────────
    activeContracts: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // DISCOUNT OFFERINGS - Discount program participation
    // ─────────────────────────────────────────────────────────────────────────
    discountOfferings: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // AI PRODUCT - Artificial Intelligence products
    // ─────────────────────────────────────────────────────────────────────────
    aiProduct: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // AI CATEGORY - AI categorization metrics
    // ─────────────────────────────────────────────────────────────────────────
    aiCategory: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // TOP BIC PRODUCTS - Best-in-Class product rankings
    // ─────────────────────────────────────────────────────────────────────────
    topBicProducts: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // RESELLER - Reseller distribution
    // ─────────────────────────────────────────────────────────────────────────
    reseller: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // BIC RESELLER - Best-in-Class reseller metrics
    // ─────────────────────────────────────────────────────────────────────────
    bicReseller: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // BIC OEM - Best-in-Class OEM metrics
    // ─────────────────────────────────────────────────────────────────────────
    bicOem: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // FAS OEM - Federal Acquisition Service OEM metrics
    // ─────────────────────────────────────────────────────────────────────────
    fasOem: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // BIC TOP PRODUCTS PER AGENCY - Agency-specific BIC products
    // ─────────────────────────────────────────────────────────────────────────
    bicTopProductsPerAgency: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    },
    
    // ─────────────────────────────────────────────────────────────────────────
    // ONEGOV TIER - OneGov tiering system
    // ─────────────────────────────────────────────────────────────────────────
    oneGovTier: {
      agency: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      oem: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      },
      vendor: {
        5:  ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        10: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        15: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        20: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar'],
        all: ['verticalBar', 'horizontalBar', 'pie', 'doughnut', 'line', 'funnel', 'stackedBar', 'area', 'fiscalTrend', 'fiscalArea', 'fiscalBar']
      }
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOOKUP LOGIC WITH FALLBACKS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Handle 'all' as a special case - treat it as a large number
  let normalizedCount;
  if (entityCount === 'all') {
    normalizedCount = 'all';
  } else if (entityCount <= 5) {
    normalizedCount = 5;
  } else if (entityCount <= 10) {
    normalizedCount = 10;
  } else if (entityCount <= 15) {
    normalizedCount = 15;
  } else if (entityCount <= 20) {
    normalizedCount = 20;
  } else {
    normalizedCount = 'all';
  }
  
  // Try exact match first
  if (CHART_CONFIG[columnId] && 
      CHART_CONFIG[columnId][entityType] && 
      CHART_CONFIG[columnId][entityType][normalizedCount]) {
    return CHART_CONFIG[columnId][entityType][normalizedCount];
  }
  
  // Fallback 1: Try 'all' if the normalized count wasn't found
  if (CHART_CONFIG[columnId] && 
      CHART_CONFIG[columnId][entityType] && 
      CHART_CONFIG[columnId][entityType]['all']) {
    return CHART_CONFIG[columnId][entityType]['all'];
  }
  
  // Fallback 2: Try default entity type for this column
  if (CHART_CONFIG[columnId] && CHART_CONFIG[columnId]['agency']) {
    return CHART_CONFIG[columnId]['agency'][normalizedCount] || 
           CHART_CONFIG[columnId]['agency']['all'] ||
           CHART_CONFIG[columnId]['agency'][10] || 
           ['horizontalBar', 'pie'];
  }
  
  // Fallback 3: Use legacy function for completely unknown columns
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
        if (summaries) {
          Object.entries(summaries).forEach(([name, data]) => {
            const value = data.total || 0;
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
  // If topN is null, show all data
  const sortedData = topN ? extractedData.slice(0, topN) : extractedData;

  if (sortedData.length === 0) {
    return [];
  }

  const cards = [];

  // Get configured chart types from CHART_CONFIG - FIXED PARAMETER ORDER
  const configuredChartTypes = getChartTypesByContext(entityType, columnId, topN);
  console.log(`🎨 Breakdown Charts: Using ${configuredChartTypes.length} configured chart types for ${columnId}:`, configuredChartTypes);

  // Generate each configured chart type
  configuredChartTypes.forEach(chartType => {
    let chart = null;
    
    switch(chartType) {
      case 'horizontalBar':
        chart = generateBreakdownHorizontalBarChart(sortedData, columnId, entityType, topN);
        break;
      case 'verticalBar':
        chart = generateBreakdownVerticalBarChart(sortedData, columnId, entityType, topN);
        break;
      case 'pie':
        chart = generateBreakdownPieChart(sortedData, columnId, entityType);
        break;
      case 'doughnut':
        chart = generateBreakdownDoughnutChart(sortedData, columnId, entityType);
        break;
      case 'funnel':
        chart = generateBreakdownFunnelChart(sortedData, columnId, entityType);
        break;
      case 'line':
        chart = generateBreakdownLineChart(sortedData, columnId, entityType);
        break;
      case 'area':
        chart = generateBreakdownAreaChart(sortedData, columnId, entityType);
        break;
      case 'stackedBar':
        chart = generateBreakdownStackedBarChart(sortedData, columnId, entityType);
        break;
      case 'fiscalTrend':
        chart = generateBreakdownFiscalTrend(entities, columnId, entityType, options);
        break;
      case 'fiscalArea':
        chart = generateBreakdownFiscalArea(entities, columnId, entityType);
        break;
      case 'fiscalBar':
        chart = generateBreakdownFiscalBar(entities, columnId, entityType, topN);
        break;
      default:
        console.warn(`Unknown chart type: ${chartType}`);
    }
    
    if (chart) {
      cards.push(chart);
    }
  });

  return cards;
}

// [CONTINUATION IN NEXT MESSAGE DUE TO LENGTH - FILE IS TOO LARGE]
/**
 * PART 2 OF B06_CHARTBUFFET - CONTINUATION
 * This file contains all the chart generator functions
 * Append this to Part 1 after the generateColumnBreakdownCharts function
 */

/**
 * Generate complete chart buffet for a column
 * @param {string} entityType - Type of entity (agency, oem, vendor)
 * @param {string} columnId - Column identifier
 * @param {Array} entities - Pre-processed entity data from DataManager
 * @param {Object} options - Chart generation options
 * @returns {Array} Array of chart cards
 */
function generateChartBuffet(entityType, columnId, entities, options = {}) {
  console.log(`🎨 Chart Buffet generateChartBuffet: Received columnId "${columnId}" for ${entityType} with ${entities?.length || 0} entities`);
  
  const { 
    topN = 10, 
    selectedEntities = [], 
    forceChartTypes = null,
    showAllOther = true,
    percentageMode = 'total',
    fiscalYearFilter = 'all'
  } = options;
  
  // Handle "All" option - if topN is null, don't limit results
  const effectiveTopN = topN === null ? undefined : topN;
  
  // If no entities, return empty array immediately
  if (!entities || entities.length === 0) {
    console.error(`No entities provided to generateChartBuffet for ${entityType}/${columnId}`);
    return [];
  }

  // Extract actual column data instead of using entity data
  console.log(`Chart generation: Starting extraction for ${entities.length} ${entityType} entities, column: ${columnId}`);
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
  const breakdownCharts = generateColumnBreakdownCharts(entities, entityType, columnId, effectiveTopN);

  // If breakdown charts exist, add them first (Primary View)
  if (breakdownCharts.length > 0) {
    cards.push(...breakdownCharts);
  }
  
  // 2. GENERATE ENTITY CHARTS (Standard Top N Agencies/OEMs)
  // Skip these for breakdown-heavy columns to avoid confusion
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

  // Only generate entity rankings if it's NOT a breakdown column
  if (!isBreakdownColumn || breakdownCharts.length === 0) {
    
    // Determine recommended chart types - NOW USES 3-DIMENSIONAL SELECTION
    const chartTypes = forceChartTypes || getChartTypesByContext(entityType, columnId, effectiveTopN);
    
    // Generate each recommended chart type
    chartTypes.forEach(chartType => {
      let card = null;
      
      switch(chartType) {
        case 'verticalBar':
          card = generateVerticalBarChart(entitiesWithOthers, entityType, columnId, effectiveTopN, percentageBase, percentageMode, showAllOther, overallTotal, fiscalYearFilter);
          break;
        case 'horizontalBar':
          card = generateHorizontalBarChart(entitiesWithOthers, entityType, columnId, effectiveTopN, percentageBase, percentageMode, showAllOther, overallTotal, fiscalYearFilter);
          break;
        case 'line':
          card = generateLineChart(entitiesWithOthers, entityType, columnId, percentageBase, percentageMode, fiscalYearFilter);
          break;
        case 'funnel':
          card = generateFunnelChart(entitiesWithOthers, entityType, columnId, effectiveTopN, percentageBase, percentageMode, showAllOther, fiscalYearFilter);
          break;
        case 'pie':
          card = generatePieChart(entitiesWithOthers, entityType, columnId, effectiveTopN, percentageBase, percentageMode, showAllOther, overallTotal, fiscalYearFilter);
          break;
        case 'doughnut':
          card = generateDoughnutChart(entitiesWithOthers, entityType, columnId, effectiveTopN, percentageBase, percentageMode, showAllOther, overallTotal, fiscalYearFilter);
          break;
        case 'stackedBar':
          // Year over Year chart limited to max 5 entities
          card = generateStackedBarChart(chartEntities, entityType, columnId, Math.min(effectiveTopN, 5), fiscalYearFilter);
          break;
        case 'area':
          card = generateAreaChart(chartEntities, entityType, columnId, fiscalYearFilter);
          break;
      }
      
      if (card) cards.push(card);
    });
  }
  
  // 3. ADD TREND OVER TIME
  const trendCard = generateTrendOverTime(entityType, columnId, selectedEntities);
  if (trendCard) cards.push(trendCard);
  
  return cards;
}

/**
 * Generate breakdown pie chart showing category distribution
 */
function generateBreakdownPieChart(data, columnId, entityType) {
  console.log(`🥧 generateBreakdownPieChart for ${columnId}: Received ${data.length} items`);
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
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('pie', false),
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
  console.log(`📊 generateBreakdownHorizontalBarChart for ${columnId}: Received ${data.length} items`);
  const displayData = topN ? data.slice(0, topN) : data;
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
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('horizontalBar', false)
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
 * Generate breakdown vertical bar chart
 */
function generateBreakdownVerticalBarChart(data, columnId, entityType, topN) {
  console.log(`📊 generateBreakdownVerticalBarChart for ${columnId}: Received ${data.length} items`);
  const displayData = data.slice(0, topN);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  return {
    id: `${entityType}_${columnId}_breakdown_verticalBar`,
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
      indexAxis: 'x',
      responsive: true,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('verticalBar', false),
        tooltip: {
          callbacks: {
            label: function(context) {
              const percentage = totalValue > 0 ? ((context.parsed.y / totalValue) * 100).toFixed(1) : '0.0';
              return `${formatCurrencyShort(context.parsed.y)} (${percentage}%)`;
            }
          }
        }
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
      headers: ['Category', 'Total Value', 'Percentage'],
      rows: displayData.map(item => {
        const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0';
        return [item.name, formatCurrency(item.value), `${percentage}%`];
      })
    }
  };
}

/**
 * Generate breakdown doughnut chart
 */
function generateBreakdownDoughnutChart(data, columnId, entityType) {
  console.log(`🍩 generateBreakdownDoughnutChart for ${columnId}: Received ${data.length} items`);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  return {
    id: `${entityType}_${columnId}_breakdown_doughnut`,
    title: `${getColumnDisplayName(columnId)} - Category Breakdown`,
    cardType: 'chart',
    chartType: 'doughnut',
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
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('pie', false),
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
        return [item.name, formatCurrency(item.value), `${percentage}%`];
      })
    }
  };
}

/**
 * Generate breakdown funnel chart
 */
function generateBreakdownFunnelChart(data, columnId, entityType) {
  console.log(`🔻 generateBreakdownFunnelChart for ${columnId}: Received ${data.length} items`);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  // Create funnel data with percentages
  const funnelData = data.map((item, idx) => {
    const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    return {
      label: item.name,
      value: item.value,
      displayValue: formatCurrencyShort(item.value),
      percentage: percentage,
      color: generateColorGradient(data.length)[idx]
    };
  });
  
  return {
    id: `${entityType}_${columnId}_breakdown_funnel`,
    title: `${getColumnDisplayName(columnId)} - All ${data.length} Funnel`,
    cardType: 'funnel',
    funnelData: funnelData,
    tableData: {
      headers: ['Category', 'Total Value', 'Percentage'],
      rows: data.map(item => {
        const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0';
        return [item.name, formatCurrency(item.value), `${percentage}%`];
      })
    }
  };
}

/**
 * Generate breakdown line chart
 */
function generateBreakdownLineChart(data, columnId, entityType) {
  console.log(`📈 generateBreakdownLineChart for ${columnId}: Received ${data.length} items`);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  return {
    id: `${entityType}_${columnId}_breakdown_line`,
    title: `${getColumnDisplayName(columnId)} - Trend`,
    cardType: 'chart',
    chartType: 'line',
    chartData: {
      labels: data.map(item => item.name),
      datasets: [{
        label: getColumnDisplayName(columnId),
        data: data.map(item => item.value),
        borderColor: '#144673',
        backgroundColor: 'rgba(20, 70, 115, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    },
    chartOptions: {
      responsive: true,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('line', false),
        tooltip: {
          callbacks: {
            label: function(context) {
              const percentage = totalValue > 0 ? ((context.parsed.y / totalValue) * 100).toFixed(1) : '0.0';
              return `${formatCurrencyShort(context.parsed.y)} (${percentage}%)`;
            }
          }
        }
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
      headers: ['Category', 'Total Value', 'Percentage'],
      rows: data.map(item => {
        const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0';
        return [item.name, formatCurrency(item.value), `${percentage}%`];
      })
    }
  };
}

/**
 * Generate breakdown area chart
 */
function generateBreakdownAreaChart(data, columnId, entityType) {
  console.log(`📊 generateBreakdownAreaChart for ${columnId}: Received ${data.length} items`);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  return {
    id: `${entityType}_${columnId}_breakdown_area`,
    title: `${getColumnDisplayName(columnId)} - Area Trend`,
    cardType: 'chart',
    chartType: 'line',
    chartData: {
      labels: data.map(item => item.name),
      datasets: [{
        label: getColumnDisplayName(columnId),
        data: data.map(item => item.value),
        borderColor: '#144673',
        backgroundColor: 'rgba(20, 70, 115, 0.3)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }]
    },
    chartOptions: {
      responsive: true,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('line', false),
        tooltip: {
          callbacks: {
            label: function(context) {
              const percentage = totalValue > 0 ? ((context.parsed.y / totalValue) * 100).toFixed(1) : '0.0';
              return `${formatCurrencyShort(context.parsed.y)} (${percentage}%)`;
            }
          }
        }
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
      headers: ['Category', 'Total Value', 'Percentage'],
      rows: data.map(item => {
        const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0';
        return [item.name, formatCurrency(item.value), `${percentage}%`];
      })
    }
  };
}

/**
 * Generate breakdown stacked bar chart
 */
function generateBreakdownStackedBarChart(data, columnId, entityType) {
  console.log(`📊 generateBreakdownStackedBarChart for ${columnId}: Received ${data.length} items`);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  
  return {
    id: `${entityType}_${columnId}_breakdown_stackedBar`,
    title: `${getColumnDisplayName(columnId)} - Stacked View`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: ['Total'],
      datasets: data.map((item, idx) => ({
        label: item.name,
        data: [item.value],
        backgroundColor: generateColorGradient(data.length)[idx],
        borderColor: '#ffffff',
        borderWidth: 1
      }))
    },
    chartOptions: {
      indexAxis: 'y',
      responsive: true,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('stackedBar', true),
        tooltip: {
          callbacks: {
            label: function(context) {
              const percentage = totalValue > 0 ? ((context.parsed.x / totalValue) * 100).toFixed(1) : '0.0';
              return `${context.dataset.label}: ${formatCurrencyShort(context.parsed.x)} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            callback: function(value) {
              return formatCurrencyShort(value);
            }
          }
        },
        y: {
          stacked: true
        }
      }
    },
    tableData: {
      headers: ['Category', 'Total Value', 'Percentage'],
      rows: data.map(item => {
        const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0';
        return [item.name, formatCurrency(item.value), `${percentage}%`];
      })
    }
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEW FISCAL YEAR TREND CHART GENERATORS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Generate fiscal year trend line chart - shows total spending over time
 */
function generateBreakdownFiscalTrend(entities, columnId, entityType, options = {}) {
  console.log('🎯 Trend Analysis Chart:');
  console.log('  Entities in:', entities.length);
  console.log('  Options:', options);
  console.log('  DeptFilter:', options?.deptFilter);
  
  // Apply department filter FIRST - right at the start
  if (options && options.deptFilter && options.deptFilter !== 'all') {
    console.log('  Applying DOD/Civilian filter:', options.deptFilter);
    const originalCount = entities.length;
    
    const DOD_AGENCIES = ['DEPARTMENT OF DEFENSE', 'DEPARTMENT OF THE ARMY', 'DEPARTMENT OF THE NAVY', 
      'DEPARTMENT OF THE AIR FORCE', 'DEFENSE LOGISTICS AGENCY', 'DEFENSE INFORMATION SYSTEMS AGENCY',
      'DISA', 'DLA', 'ARMY', 'NAVY', 'AIR FORCE', 'USAF', 'USA', 'USN', 'DOD'];
    
    entities = entities.filter(entity => {
      const name = (entity.name || '').toUpperCase();
      const isDOD = DOD_AGENCIES.some(dod => name.includes(dod));
      const shouldInclude = options.deptFilter === 'dod' ? isDOD : !isDOD;
      console.log(`    ${entity.name}: isDOD=${isDOD}, shouldInclude=${shouldInclude}`);
      return shouldInclude;
    });
    
    console.log(`  After filter: ${originalCount} → ${entities.length} entities`);
  } else {
    console.log('  No department filter applied (filter is "all" or not set)');
  }
  
  const fiscalData = {};
  
  // Aggregate fiscal year data across all entities for this column
  entities.forEach(entity => {
    let jsonData = entity[columnId];
    if (!jsonData) return;
    
    // Parse if needed
    if (typeof jsonData === 'string') {
      try {
        jsonData = JSON.parse(jsonData);
      } catch(e) {
        return;
      }
    }
    
    // Extract fiscal year data based on column structure
    switch(columnId) {
      case 'contractVehicle':
        if (jsonData.top_contract_summaries) {
          Object.values(jsonData.top_contract_summaries).forEach(vehicleData => {
            if (vehicleData.fiscal_years) {
              Object.entries(vehicleData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'sumType':
        if (jsonData.sum_type_summaries) {
          Object.values(jsonData.sum_type_summaries).forEach(typeData => {
            if (typeData.fiscal_years) {
              Object.entries(typeData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'sumTier':
        if (jsonData.tier_summaries) {
          Object.values(jsonData.tier_summaries).forEach(tierData => {
            if (tierData.fiscal_years) {
              Object.entries(tierData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'smallBusiness':
        if (jsonData.business_size_summaries) {
          Object.values(jsonData.business_size_summaries).forEach(sizeData => {
            if (sizeData.fiscal_years) {
              Object.entries(sizeData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'reseller':
        if (jsonData.top_15_reseller_summaries) {
          Object.values(jsonData.top_15_reseller_summaries).forEach(resellerData => {
            if (resellerData.fiscal_years) {
              Object.entries(resellerData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'fundingDepartment':
        if (jsonData.top_10_department_summaries) {
          Object.values(jsonData.top_10_department_summaries).forEach(deptData => {
            if (deptData.fiscal_years) {
              Object.entries(deptData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'fundingAgency':
        if (jsonData.top_10_agency_summaries) {
          Object.values(jsonData.top_10_agency_summaries).forEach(agencyData => {
            if (agencyData.fiscal_years) {
              Object.entries(agencyData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'fasOem':
        if (jsonData.top_10_oem_summaries) {
          Object.values(jsonData.top_10_oem_summaries).forEach(oemData => {
            if (oemData.fiscal_years) {
              Object.entries(oemData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'bicOem':
        if (jsonData.yearly_totals) {
          Object.entries(jsonData.yearly_totals).forEach(([year, value]) => {
            fiscalData[year] = (fiscalData[year] || 0) + value;
          });
        }
        break;
        
      case 'topBicProducts':
        if (jsonData.top_25_products && Array.isArray(jsonData.top_25_products)) {
          jsonData.top_25_products.forEach(product => {
            if (product.fiscal_years) {
              Object.entries(product.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'aiProduct':
      case 'productObligations':
        if (jsonData.fiscal_year_summaries) {
          Object.entries(jsonData.fiscal_year_summaries).forEach(([year, yearData]) => {
            const yearTotal = yearData.total_obligations || 0;
            fiscalData[year] = (fiscalData[year] || 0) + yearTotal;
          });
        }
        break;
        
      case 'aiCategory':
      case 'aiCategories':
      case 'categoryObligations':
        if (jsonData.fiscal_year_summaries) {
          Object.entries(jsonData.fiscal_year_summaries).forEach(([year, yearData]) => {
            const yearTotal = yearData.total_obligations || 0;
            fiscalData[year] = (fiscalData[year] || 0) + yearTotal;
          });
        }
        break;
        
      default:
        // Generic fiscal year extraction
        const yearlyData = jsonData.fiscal_year_obligations || 
                          jsonData.fiscal_years || 
                          jsonData.yearly_totals || 
                          jsonData.fiscal_year_breakdown;
        
        if (yearlyData && typeof yearlyData === 'object') {
          Object.entries(yearlyData).forEach(([year, value]) => {
            fiscalData[year] = (fiscalData[year] || 0) + (parseFloat(value) || 0);
          });
        }
    }
  });
  
  const years = Object.keys(fiscalData).sort();
  if (years.length < 2) return null; // Need at least 2 years for a trend
  
  const values = years.map(year => fiscalData[year]);
  const totalValue = values.reduce((sum, val) => sum + val, 0);
  
  // Calculate year-over-year growth
  const growthRates = values.map((val, idx) => {
    if (idx === 0) return null;
    const prevVal = values[idx - 1];
    return prevVal > 0 ? ((val - prevVal) / prevVal * 100) : 0;
  });
  
  return {
    id: `${entityType}_${columnId}_breakdown_fiscalTrend`,
    title: `${getColumnDisplayName(columnId)} - Historical Trend (${years.length} Years)`,
    cardType: 'chart',
    chartType: 'line',
    chartData: {
      labels: years.map(year => `FY${year}`),
      datasets: [{
        label: 'Total Spending',
        data: values,
        borderColor: '#144673',
        backgroundColor: 'rgba(20, 70, 115, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    chartOptions: {
      responsive: true,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('line', true),
        tooltip: {
          callbacks: {
            label: function(context) {
              const idx = context.dataIndex;
              const value = formatCurrencyShort(context.parsed.y);
              const growth = growthRates[idx];
              const growthText = growth !== null ? ` (${growth > 0 ? '+' : ''}${growth.toFixed(1)}% YoY)` : '';
              return `${value}${growthText}`;
            }
          }
        }
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
      headers: ['Fiscal Year', 'Total Value', 'YoY Change', 'YoY Growth %'],
      rows: years.map((year, index) => {
        const value = values[index];
        const change = index > 0 ? values[index] - values[index - 1] : 0;
        const growth = growthRates[index];
        return [
          `FY${year}`,
          formatCurrency(value),
          index > 0 ? formatCurrency(change) : 'N/A',
          growth !== null ? `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%` : 'N/A'
        ];
      })
    },
    summary: {
      totalValue: formatCurrencyShort(totalValue),
      totalGrowth: values.length > 1 ? 
        `${(((values[values.length - 1] - values[0]) / values[0]) * 100).toFixed(1)}%` : 
        'N/A',
      avgAnnualGrowth: growthRates.filter(g => g !== null).length > 0 ?
        `${(growthRates.filter(g => g !== null).reduce((a, b) => a + b, 0) / growthRates.filter(g => g !== null).length).toFixed(1)}%` :
        'N/A',
      yearsTracked: years.length,
      bestYear: years[values.indexOf(Math.max(...values))],
      bestYearValue: formatCurrencyShort(Math.max(...values))
    }
  };
}

/**
 * Generate fiscal year area chart - shows spending trends with filled area
 */
function generateBreakdownFiscalArea(entities, columnId, entityType) {
  const trendChart = generateBreakdownFiscalTrend(entities, columnId, entityType);
  if (!trendChart) return null;
  
  return {
    ...trendChart,
    id: `${entityType}_${columnId}_breakdown_fiscalArea`,
    title: `${getColumnDisplayName(columnId)} - Spending Trend (Area)`,
    chartData: {
      ...trendChart.chartData,
      datasets: [{
        ...trendChart.chartData.datasets[0],
        backgroundColor: 'rgba(20, 70, 115, 0.3)',
        fill: true
      }]
    }
  };
}

/**
 * Generate fiscal year bar chart - shows year-by-year comparison
 */
function generateBreakdownFiscalBar(entities, columnId, entityType, topN) {
  const fiscalData = {};
  
  // Reuse the same extraction logic as fiscalTrend
  entities.forEach(entity => {
    let jsonData = entity[columnId];
    if (!jsonData) return;
    
    if (typeof jsonData === 'string') {
      try {
        jsonData = JSON.parse(jsonData);
      } catch(e) {
        return;
      }
    }
    
    // Same extraction logic as generateBreakdownFiscalTrend
    switch(columnId) {
      case 'contractVehicle':
        if (jsonData.top_contract_summaries) {
          Object.values(jsonData.top_contract_summaries).forEach(vehicleData => {
            if (vehicleData.fiscal_years) {
              Object.entries(vehicleData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'sumType':
        if (jsonData.sum_type_summaries) {
          Object.values(jsonData.sum_type_summaries).forEach(typeData => {
            if (typeData.fiscal_years) {
              Object.entries(typeData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'sumTier':
        if (jsonData.tier_summaries) {
          Object.values(jsonData.tier_summaries).forEach(tierData => {
            if (tierData.fiscal_years) {
              Object.entries(tierData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'smallBusiness':
        if (jsonData.business_size_summaries) {
          Object.values(jsonData.business_size_summaries).forEach(sizeData => {
            if (sizeData.fiscal_years) {
              Object.entries(sizeData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'reseller':
        if (jsonData.top_15_reseller_summaries) {
          Object.values(jsonData.top_15_reseller_summaries).forEach(resellerData => {
            if (resellerData.fiscal_years) {
              Object.entries(resellerData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'fundingDepartment':
        if (jsonData.top_10_department_summaries) {
          Object.values(jsonData.top_10_department_summaries).forEach(deptData => {
            if (deptData.fiscal_years) {
              Object.entries(deptData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'fundingAgency':
        if (jsonData.top_10_agency_summaries) {
          Object.values(jsonData.top_10_agency_summaries).forEach(agencyData => {
            if (agencyData.fiscal_years) {
              Object.entries(agencyData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'fasOem':
        if (jsonData.top_10_oem_summaries) {
          Object.values(jsonData.top_10_oem_summaries).forEach(oemData => {
            if (oemData.fiscal_years) {
              Object.entries(oemData.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'bicOem':
        if (jsonData.yearly_totals) {
          Object.entries(jsonData.yearly_totals).forEach(([year, value]) => {
            fiscalData[year] = (fiscalData[year] || 0) + value;
          });
        }
        break;
        
      case 'topBicProducts':
        if (jsonData.top_25_products && Array.isArray(jsonData.top_25_products)) {
          jsonData.top_25_products.forEach(product => {
            if (product.fiscal_years) {
              Object.entries(product.fiscal_years).forEach(([year, value]) => {
                fiscalData[year] = (fiscalData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'aiProduct':
      case 'productObligations':
        if (jsonData.fiscal_year_summaries) {
          Object.entries(jsonData.fiscal_year_summaries).forEach(([year, yearData]) => {
            const yearTotal = yearData.total_obligations || 0;
            fiscalData[year] = (fiscalData[year] || 0) + yearTotal;
          });
        }
        break;
        
      case 'aiCategory':
      case 'aiCategories':
      case 'categoryObligations':
        if (jsonData.fiscal_year_summaries) {
          Object.entries(jsonData.fiscal_year_summaries).forEach(([year, yearData]) => {
            const yearTotal = yearData.total_obligations || 0;
            fiscalData[year] = (fiscalData[year] || 0) + yearTotal;
          });
        }
        break;
        
      default:
        const yearlyData = jsonData.fiscal_year_obligations || 
                          jsonData.fiscal_years || 
                          jsonData.yearly_totals || 
                          jsonData.fiscal_year_breakdown;
        
        if (yearlyData && typeof yearlyData === 'object') {
          Object.entries(yearlyData).forEach(([year, value]) => {
            fiscalData[year] = (fiscalData[year] || 0) + (parseFloat(value) || 0);
          });
        }
    }
  });
  
  const years = Object.keys(fiscalData).sort();
  if (years.length < 2) return null;
  
  const values = years.map(year => fiscalData[year]);
  const totalValue = values.reduce((sum, val) => sum + val, 0);
  
  return {
    id: `${entityType}_${columnId}_breakdown_fiscalBar`,
    title: `${getColumnDisplayName(columnId)} - Year-by-Year Comparison`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: years.map(year => `FY${year}`),
      datasets: [{
        label: 'Annual Spending',
        data: values,
        backgroundColor: values.map((val, idx) => {
          // Color bars based on growth (green = growth, red = decline, blue = neutral)
          if (idx === 0) return '#144673';
          const growth = ((val - values[idx - 1]) / values[idx - 1]) * 100;
          if (growth > 5) return '#22c55e'; // Green for growth
          if (growth < -5) return '#ef4444'; // Red for decline
          return '#144673'; // Blue for stable
        }),
        borderColor: '#0a2240',
        borderWidth: 1
      }]
    },
    chartOptions: {
      indexAxis: 'x',
      responsive: true,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('verticalBar', false),
        tooltip: {
          callbacks: {
            label: function(context) {
              const idx = context.dataIndex;
              const value = formatCurrencyShort(context.parsed.y);
              if (idx > 0) {
                const growth = ((values[idx] - values[idx - 1]) / values[idx - 1]) * 100;
                return `${value} (${growth > 0 ? '+' : ''}${growth.toFixed(1)}% from prior year)`;
              }
              return value;
            }
          }
        }
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
      headers: ['Fiscal Year', 'Total Value', 'YoY Change', 'YoY Growth %'],
      rows: years.map((year, index) => {
        const value = values[index];
        const change = index > 0 ? values[index] - values[index - 1] : 0;
        const growth = index > 0 ? ((change / values[index - 1]) * 100).toFixed(1) : 'N/A';
        return [
          `FY${year}`,
          formatCurrency(value),
          index > 0 ? formatCurrency(change) : 'N/A',
          growth !== 'N/A' ? `${growth > 0 ? '+' : ''}${growth}%` : 'N/A'
        ];
      })
    },
    summary: {
      totalValue: formatCurrencyShort(totalValue),
      avgPerYear: formatCurrencyShort(totalValue / years.length),
      highestYear: years[values.indexOf(Math.max(...values))],
      highestValue: formatCurrencyShort(Math.max(...values)),
      lowestYear: years[values.indexOf(Math.min(...values))],
      lowestValue: formatCurrencyShort(Math.min(...values))
    }
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTITY CHART GENERATORS (Standard Top N Charts)
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Generate vertical bar chart (for ≤5 entities)
 */
function generateVerticalBarChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther, overallTotal, fiscalYearFilter = 'all') {
  const actualTopN = entities.filter(e => !e.isOthers).length;
  const titleSuffix = `Top ${actualTopN}${entities.some(e => e.isOthers) ? ' + All Other' : ''}`;
  const totalDisplayed = entities.reduce((sum, e) => sum + (e.value || 0), 0);
  const percentageModeLabel = percentageMode === 'topN' ? '% of displayed' : '% of total';
  
  return {
    id: `${entityType}_${columnId}_verticalBar`,
    title: `${getColumnDisplayName(columnId)} - ${titleSuffix} (${formatCurrencyShort(totalDisplayed)}, ${getFiscalYearRangeText(fiscalYearFilter)})`,
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
      indexAxis: 'x',
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
function generateHorizontalBarChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther, overallTotal, fiscalYearFilter = 'all') {
  const actualTopN = entities.filter(e => !e.isOthers).length;
  const titleSuffix = `Top ${actualTopN}${entities.some(e => e.isOthers) ? ' + All Other' : ''}`;
  const totalDisplayed = entities.reduce((sum, e) => sum + (e.value || 0), 0);
  
  return {
    id: `${entityType}_${columnId}_horizontalBar`,
    title: `${getColumnDisplayName(columnId)} - ${titleSuffix} (${formatCurrencyShort(totalDisplayed)} total, ${getFiscalYearRangeText(fiscalYearFilter)})`,
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
      indexAxis: 'y',
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
function generateLineChart(entities, entityType, columnId, percentageBase, percentageMode, fiscalYearFilter = 'all') {
  console.log(`📈 generateLineChart called with fiscalYearFilter: ${fiscalYearFilter}, entities: ${entities.length}`);
  const fiscalYearText = getFiscalYearRangeText(fiscalYearFilter);
  return {
    id: `${entityType}_${columnId}_line`,
    title: `${getColumnDisplayName(columnId)} - Trend Analysis${fiscalYearText}`,
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
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('line', true)
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
      headers: ['Position', 'Entity', `Value${fiscalYearText ? ` ${fiscalYearText}` : ''}`],
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
function generateFunnelChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther, fiscalYearFilter = 'all') {
  console.log(`🔻 generateFunnelChart called with fiscalYearFilter: ${fiscalYearFilter}, entities: ${entities.length}, topN: ${topN}`);
  const topEntities = topN ? entities.slice(0, topN) : entities;
  const titleSuffix = !topN || topN >= entities.length ? `All ${entities.length}` : `Top ${topN}`;
  const fiscalYearText = getFiscalYearRangeText(fiscalYearFilter);
  
  // Calculate percentages for funnel
  const maxValue = Math.max(...topEntities.map(e => e.value));
  const funnelData = topEntities.map(e => ({
    ...e,
    percentage: (e.value / maxValue) * 100
  }));
  
  return {
    id: `${entityType}_${columnId}_funnel`,
    title: `${getColumnDisplayName(columnId)} - ${titleSuffix} Funnel${fiscalYearText}`,
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
      headers: ['Stage', 'Entity', `Value${fiscalYearText ? ` ${fiscalYearText}` : ''}`, 'Relative %', 'Drop-off %'],
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
function generatePieChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther, overallTotal, fiscalYearFilter = 'all') {
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
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: { 
          display: true,
          position: 'bottom'
        },
        title: {
          display: true,
          text: `${getColumnDisplayName(columnId)} Distribution`,
          font: { size: 14, weight: 'bold' }
        },
        subtitle: {
          display: true,
          text: `Data: ${getFiscalYearRangeText(fiscalYearFilter)}`,
          font: { size: 11 },
          padding: { bottom: 10 }
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
}

/**
 * Generate doughnut chart
 */
function generateDoughnutChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther, overallTotal, fiscalYearFilter = 'all') {
  const pieChart = generatePieChart(entities, entityType, columnId, topN, percentageBase, percentageMode, showAllOther, overallTotal, fiscalYearFilter);
  return {
    ...pieChart,
    id: `${entityType}_${columnId}_doughnut`,
    title: pieChart.title ? pieChart.title.replace('Breakdown', 'Doughnut') : `${getColumnDisplayName(columnId)} - Doughnut View`,
    chartType: 'doughnut',
    chartOptions: {
      ...pieChart.chartOptions,
      plugins: {
        ...pieChart.chartOptions.plugins,
        legend: { 
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 8,
            boxWidth: 15
          }
        }
      }
    }
  };
}

/**
 * Generate stacked bar chart for fiscal year comparisons
 */
function generateStackedBarChart(entities, entityType, columnId, maxEntities = 5, fiscalYearFilter = 'all') {
  console.log('📊 generateStackedBarChart DEBUG');
  console.log('  Entities received:', entities.length);
  console.log('  First entity:', entities[0]);
  console.log('  MaxEntities:', maxEntities);
  console.log(`📊 generateStackedBarChart called with fiscalYearFilter: ${fiscalYearFilter}, entities: ${entities.length}, maxEntities: ${maxEntities}`);
  
  const dataManager = getDataManager();
  const fiscalYearData = {};
  
  // Aggregate fiscal year data for top entities
  entities.slice(0, maxEntities).forEach(entity => {
    console.log('📊 Processing entity:', entity.name);
    console.log('  Looking for fiscal year data...');
    
    let fiscalYearBreakdown = null;
    
    if (entity.fiscal_year_obligations) {
      fiscalYearBreakdown = entity.fiscal_year_obligations;
      console.log('  Found fiscal_year_obligations:', fiscalYearBreakdown);
    } else if (entity.obligations?.fiscal_year_obligations) {
      fiscalYearBreakdown = entity.obligations.fiscal_year_obligations;
      console.log('  Found nested obligations.fiscal_year_obligations:', fiscalYearBreakdown);
    }
    
    if (!fiscalYearBreakdown) {
      console.log('  ⚠️ No fiscal year data found for:', entity.name);
      return;
    }
    
    if (fiscalYearBreakdown && typeof fiscalYearBreakdown === 'object') {
      Object.entries(fiscalYearBreakdown).forEach(([year, value]) => {
        if (!fiscalYearData[year]) fiscalYearData[year] = {};
        fiscalYearData[year][entity.name] = parseFloat(value) || 0;
      });
    }
  });
  
  const years = Object.keys(fiscalYearData).sort();
  const topEntitiesWithNames = entities.slice(0, maxEntities);
  const entityNames = topEntitiesWithNames.map(e => entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name);
  
  // Create table data
  const tableRows = [];
  entityNames.forEach(entityName => {
    const entityRow = [entityName];
    years.forEach(year => {
      const value = fiscalYearData[year]?.[entityName] || 0;
      entityRow.push(formatCurrency(value));
    });
    const total = years.reduce((sum, year) => sum + (fiscalYearData[year]?.[entityName] || 0), 0);
    entityRow.push(formatCurrency(total));
    tableRows.push(entityRow);
  });
  
  const fiscalYearText = getFiscalYearRangeText(fiscalYearFilter);
  
  // Check if we have data to render
  if (years.length === 0 || entityNames.length === 0) {
    console.error('⚠️ No data for Year over Year chart');
    console.error('  Years:', years);
    console.error('  Entity names:', entityNames);
    return null;
  }
  
  // Create datasets for debugging
  const datasets = entityNames.map((name, index) => ({
    label: name,
    data: years.map(year => {
      const entity = topEntitiesWithNames.find(e => 
        (entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name) === name
      );
      return fiscalYearData[year]?.[entity?.name] || 0;
    }),
    backgroundColor: generateColorGradient(entityNames.length)[index]
  }));
  
  console.log('📊 Year over Year Chart Data:');
  console.log('  Years:', years);
  console.log('  Datasets:', datasets);
  console.log('  Sample dataset data:', datasets[0]?.data);
  
  return {
    id: `${entityType}_${columnId}_stackedBar`,
    title: `${getColumnDisplayName(columnId)} - Year over Year${fiscalYearText}`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: years,
      datasets: datasets
    },
    chartOptions: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12 }
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
function generateAreaChart(entities, entityType, columnId, fiscalYearFilter = 'all') {
  console.log(`📊 generateAreaChart called with fiscalYearFilter: ${fiscalYearFilter}, entities: ${entities.length}`);
  const lineChart = generateLineChart(entities, entityType, columnId, undefined, undefined, fiscalYearFilter);
  const fiscalYearText = getFiscalYearRangeText(fiscalYearFilter);
  return {
    ...lineChart,
    id: `${entityType}_${columnId}_area`,
    title: `${getColumnDisplayName(columnId)} - Area Trend${fiscalYearText}`,
    chartData: {
      ...lineChart.chartData,
      datasets: [{
        ...lineChart.chartData.datasets[0],
        fill: true,
        backgroundColor: 'rgba(20, 70, 115, 0.3)'
      }]
    }
  };
}

/**
 * Generate trend over time chart
 */
/**
 * Generate trend over time chart - MULTI-ENTITY VERSION
 * Shows fiscal years on X-axis with one colored line per entity (top 10)
 */
function generateTrendOverTime(entityType, columnId, selectedEntities = []) {
  const dataManager = getDataManager();
  
  // Get all entities
  let allEntities = [];
  try {
    switch (entityType.toLowerCase()) {
      case 'agency':
        allEntities = dataManager.getAgencies();
        break;
      case 'oem':
        allEntities = dataManager.getOEMs();
        break;
      case 'vendor':
        allEntities = dataManager.getVendors();
        break;
    }
  } catch (error) {
    console.error('Error getting entities:', error);
    return null;
  }
  
  if (!allEntities || allEntities.length === 0) return null;
  
  // Store each entity's fiscal year data separately
  const entityData = {}; // { entityName: { fy: value, ... }, ... }
  const allFiscalYears = new Set();
  
  allEntities.forEach(entity => {
    const entityName = entity.name;
    if (!entityName) return;
    
    // Apply entity filter if specified
    if (selectedEntities.length > 0 && !selectedEntities.includes(entityName)) {
      return;
    }
    
    // Get fiscal year data for this column
    const columnData = entity[columnId];
    if (!columnData) return;
    
    let fyData = null;
    
    // Extract fiscal year data based on column structure
    if (columnData.fiscal_year_obligations) {
      fyData = columnData.fiscal_year_obligations;
    } else if (columnData.fiscal_year_breakdown) {
      fyData = columnData.fiscal_year_breakdown;
    } else if (columnData.fiscal_years) {
      fyData = columnData.fiscal_years;
    } else if (columnData.yearly_totals) {
      fyData = columnData.yearly_totals;
    }
    
    if (fyData && typeof fyData === 'object') {
      entityData[entityName] = {};
      
      for (const [fy, value] of Object.entries(fyData)) {
        const numValue = parseFloat(value) || 0;
        entityData[entityName][fy] = numValue;
        allFiscalYears.add(fy);
      }
    }
  });
  
  // Sort fiscal years
  const sortedFYs = Array.from(allFiscalYears).sort();
  
  if (sortedFYs.length === 0) return null;
  
  // Calculate total obligations per entity (for sorting to get top 10)
  const entityTotals = [];
  for (const [entityName, fyData] of Object.entries(entityData)) {
    const total = Object.values(fyData).reduce((sum, val) => sum + val, 0);
    entityTotals.push({ name: entityName, total: total, fyData: fyData });
  }
  
  // Sort by total and take top 10
  entityTotals.sort((a, b) => b.total - a.total);
  const topEntities = entityTotals.slice(0, 10);
  
  if (topEntities.length === 0) return null;
  
  // Define color palette for entities
  const colors = [
    '#144673', // Dark blue
    '#f47920', // Orange
    '#22c55e', // Green
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#6366f1'  // Indigo
  ];
  
  // Create datasets - one per entity
  const datasets = topEntities.map((entity, index) => {
    const data = sortedFYs.map(fy => entity.fyData[fy] || 0);
    
    return {
      label: entity.name,
      data: data,
      borderColor: colors[index % colors.length],
      backgroundColor: 'transparent',
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    };
  });
  
  // Build table data showing each entity's trend
  const tableHeaders = ['Entity', ...sortedFYs.map(fy => `FY${fy}`), 'Total'];
  const tableRows = topEntities.map(entity => {
    const row = [entity.name];
    
    // Add value for each fiscal year
    sortedFYs.forEach(fy => {
      const value = entity.fyData[fy] || 0;
      row.push(formatCurrency(value));
    });
    
    // Add total
    row.push(formatCurrency(entity.total));
    
    return row;
  });
  
  return {
    id: `${entityType}_${columnId}_trend`,
    title: `${getColumnDisplayName(columnId)} - Trend Analysis (FY ${sortedFYs[0]} - FY ${sortedFYs[sortedFYs.length - 1]})`,
    cardType: 'chart',
    chartType: 'line',
    chartData: {
      labels: sortedFYs.map(fy => `FY${fy}`),
      datasets: datasets
    },
    chartOptions: {
      responsive: true,
      maintainAspectRatio: false,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('line', true),
        legendExtra: {
          labels: {
            font: {
              size: 11
            }
          }
        },
        title: {
          display: true,
          text: `Top ${topEntities.length} ${entityType.charAt(0).toUpperCase() + entityType.slice(1)} - Fiscal Year Trends`
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
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
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    },
    tableData: {
      headers: tableHeaders,
      rows: tableRows
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
function generateColumnReportsBuffet(entityType, columnId, topN = 10, selectedEntities = [], deptFilter = 'all', tierFilter = 'all', fiscalYearFilter = 'all') {
  console.log('🔍 RAW ARGUMENTS generateColumnReportsBuffet:');
  console.log('  entityType:', entityType);
  console.log('  columnId:', columnId);
  console.log('  topN:', topN);
  console.log('  selectedEntities:', selectedEntities);
  console.log('  deptFilter:', deptFilter);
  console.log('  tierFilter:', tierFilter);
  console.log('  fiscalYearFilter:', fiscalYearFilter);
  
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
    
    // Apply CFO Act Agency filter if specified
    if (tierFilter && tierFilter !== 'all') {
      reportEntities = reportEntities.filter(entity => {
        if (tierFilter === 'Yes') {
          return entity.cfoActAgency === 'Yes';
        } else if (tierFilter === 'No') {
          return entity.cfoActAgency === 'No' || !entity.cfoActAgency;
        }
        return true;
      });
    }
    
    // *** GET AVAILABLE YEARS BEFORE FILTERING ***
    // This must happen before fiscal year filtering to capture all available years
    const availableYears = getAvailableFiscalYears(reportEntities, columnId);
    console.log('📅 Available years BEFORE filtering:', availableYears);
    
    // Apply Fiscal Year filter if specified
    console.log('🔍 FISCAL YEAR FILTER DEBUG:');
    console.log('  fiscalYearFilter:', fiscalYearFilter);
    console.log('  columnId:', columnId);
    console.log('  Sample entity before filter:', reportEntities[0]);
    console.log('📊 Before FY filter - First entity value:', reportEntities[0]?.value);
    
    if (fiscalYearFilter && fiscalYearFilter !== 'all') {
      console.log('Applying dynamic FY filter:', fiscalYearFilter);
      
      // Parse fiscal year filter dynamically - no hard-coding
      let targetYears = [];
      if (fiscalYearFilter.includes('-')) {
        // Range format like "2023-2025" or "2024-2025"
        const [start, end] = fiscalYearFilter.split('-').map(y => parseInt(y));
        for (let year = start; year <= end; year++) {
          targetYears.push(year.toString());
        }
      } else {
        // Single year
        targetYears = [fiscalYearFilter];
      }
      
      console.log('📅 Target years:', targetYears);
      
      reportEntities = reportEntities.map(entity => {
        const cloned = JSON.parse(JSON.stringify(entity));
        let newTotal = 0;
        
        // Handle direct fiscal_year_obligations (obligations column)
        if (cloned.fiscal_year_obligations) {
          console.log('💰 Processing direct fiscal_year_obligations');
          const filtered = {};
          targetYears.forEach(year => {
            if (cloned.fiscal_year_obligations[year]) {
              filtered[year] = cloned.fiscal_year_obligations[year];
              newTotal += parseFloat(filtered[year] || 0);
            }
          });
          cloned.fiscal_year_obligations = filtered;
          cloned.total_obligated = newTotal;
          cloned.value = newTotal;
        }
        
        // Handle nested obligations structure
        if (cloned.obligations && cloned.obligations.fiscal_year_obligations) {
          console.log('💰 Processing nested obligations.fiscal_year_obligations');
          const filtered = {};
          targetYears.forEach(year => {
            if (cloned.obligations.fiscal_year_obligations[year]) {
              filtered[year] = cloned.obligations.fiscal_year_obligations[year];
              newTotal += parseFloat(filtered[year] || 0);
            }
          });
          cloned.obligations.fiscal_year_obligations = filtered;
          cloned.obligations.total_obligated = newTotal;
          cloned.value = newTotal;
        }
        
        // Handle column-specific JSON data
        const columnData = cloned[columnId];
        if (columnData) {
          let jsonData = columnData;
          
          // Parse if needed
          if (typeof jsonData === 'string') {
            try {
              jsonData = JSON.parse(jsonData);
            } catch(e) {
              console.log('Error parsing JSON for', columnId);
              return cloned;
            }
          }
          
          newTotal = 0; // Reset for column-specific calculations
          
          // Dynamic processing based on JSON structure
          const processNestedSummaries = (summariesKey) => {
            if (jsonData[summariesKey]) {
              Object.keys(jsonData[summariesKey]).forEach(key => {
                const item = jsonData[summariesKey][key];
                if (item.fiscal_years) {
                  const filtered = {};
                  targetYears.forEach(year => {
                    if (item.fiscal_years[year]) {
                      filtered[year] = item.fiscal_years[year];
                    }
                  });
                  item.fiscal_years = filtered;
                  item.total = Object.values(filtered).reduce((s, v) => s + parseFloat(v || 0), 0);
                  newTotal += item.total;
                }
              });
            }
          };
          
          // Process all possible summary structures dynamically
          const summaryKeys = [
            'top_contract_summaries',
            'sum_type_summaries', 
            'tier_summaries',
            'business_size_summaries',
            'top_15_reseller_summaries',
            'top_10_department_summaries',
            'top_10_agency_summaries',
            'discount_categories'
          ];
          
          summaryKeys.forEach(summaryKey => {
            processNestedSummaries(summaryKey);
          });
          
          // Update column data and entity value
          cloned[columnId] = typeof columnData === 'string' ? JSON.stringify(jsonData) : jsonData;
          if (newTotal > 0) {
            cloned.value = newTotal;
          }
        }
        
        return cloned;
      });
      
      reportEntities.sort((a, b) => (b.value || 0) - (a.value || 0));
      console.log('📊 After FY filter - First entity value:', reportEntities[0]?.value);
      console.log('📊 Filtered years included:', targetYears);
    }
    
    // Generate the complete chart buffet
    const cards = generateChartBuffet(entityType, columnId, reportEntities, {
      topN: topN,
      selectedEntities: selectedEntities,
      deptFilter: deptFilter,
      tierFilter: tierFilter,
      fiscalYearFilter: fiscalYearFilter
    });
    
    // Add metadata to each card
    cards.forEach(card => {
      card.metadata = {
        generatedBy: 'Chart Buffet v1.6.0',
        entityType: entityType,
        columnId: columnId,
        timestamp: new Date().toISOString()
      };
    });
    
    console.log('📊 FINAL availableYears (captured before filtering):', availableYears);
    
    // Fallback: Extract years from chart titles if availableYears is still empty
    let finalAvailableYears = availableYears;
    if (!availableYears || availableYears.length === 0) {
      const extractedYears = new Set();
      cards.forEach(card => {
        if (card.title) {
          const yearMatches = card.title.match(/20\d{2}/g);
          if (yearMatches) {
            yearMatches.forEach(year => extractedYears.add(year));
          }
        }
      });
      finalAvailableYears = Array.from(extractedYears).sort().reverse();
      console.log('📊 Fallback years extracted from chart titles:', finalAvailableYears);
    }
    
    return {
      cards: cards,
      availableYears: finalAvailableYears,
      fiscalYearFilter: fiscalYearFilter
    };
    
  } catch (error) {
    console.error('Chart Buffet Error:', error);
    return {
      cards: [],
      availableYears: [],
      fiscalYearFilter: fiscalYearFilter || 'all'
    };
  }
}

/**
 * DEBUG SCRIPT - Add this temporarily to B06_ChartBuffet
 * Place this at the very end of your B06 file
 * Then run testFiscalCharts() from Apps Script
 */

function testFiscalCharts() {
  console.log('🔍 FISCAL YEAR CHART DEBUG TEST');
  
  // Test 1: Check if fiscal chart types are in CHART_CONFIG
  console.log('\n📋 TEST 1: Checking CHART_CONFIG for fiscal chart types');
  const testConfig = getChartTypesByContext('agency', 'contractVehicle', 10);
  console.log('Chart types for contractVehicle:', testConfig);
  const hasFiscal = testConfig.some(type => type.includes('fiscal'));
  console.log('Has fiscal chart types?', hasFiscal);
  
  // Test 2: Get actual entity data
  console.log('\n📋 TEST 2: Checking entity data structure');
  const dataManager = getDataManager();
  const agencies = dataManager.getAgencies();
  
  if (agencies.length > 0) {
    const firstAgency = agencies[0];
    console.log('First agency name:', firstAgency.name);
    console.log('Has contractVehicle?', !!firstAgency.contractVehicle);
    
    // Check the contractVehicle structure
    if (firstAgency.contractVehicle) {
      let cvData = firstAgency.contractVehicle;
      
      // Parse if string
      if (typeof cvData === 'string') {
        try {
          cvData = JSON.parse(cvData);
        } catch(e) {
          console.log('ERROR: Could not parse contractVehicle JSON');
          return;
        }
      }
      
      console.log('contractVehicle keys:', Object.keys(cvData));
      
      // Check for fiscal year data
      if (cvData.top_contract_summaries) {
        const firstVehicle = Object.keys(cvData.top_contract_summaries)[0];
        console.log('First vehicle:', firstVehicle);
        const vehicleData = cvData.top_contract_summaries[firstVehicle];
        console.log('Vehicle data keys:', Object.keys(vehicleData));
        console.log('Has fiscal_years?', !!vehicleData.fiscal_years);
        
        if (vehicleData.fiscal_years) {
          console.log('Fiscal years available:', Object.keys(vehicleData.fiscal_years));
          console.log('Sample fiscal year data:', vehicleData.fiscal_years);
        }
      }
    }
  }
  
  // Test 3: Try to generate fiscal chart directly
  console.log('\n📋 TEST 3: Attempting to generate fiscal trend chart');
  const testEntities = agencies.slice(0, 5); // Top 5 agencies
  const fiscalChart = generateBreakdownFiscalTrend(testEntities, 'contractVehicle', 'agency');
  
  if (fiscalChart) {
    console.log('✅ SUCCESS: Fiscal chart generated!');
    console.log('Chart title:', fiscalChart.title);
    console.log('Chart has data?', !!fiscalChart.chartData);
    console.log('Number of years:', fiscalChart.chartData?.labels?.length || 0);
  } else {
    console.log('❌ FAILED: Fiscal chart returned null');
    console.log('This means either:');
    console.log('  1. Less than 2 years of fiscal data');
    console.log('  2. No fiscal_years found in entity data');
    console.log('  3. Data structure mismatch');
  }
  
  // Test 4: Check if breakdown charts are being generated
  console.log('\n📋 TEST 4: Testing full breakdown chart generation');
  const breakdownCharts = generateColumnBreakdownCharts(testEntities, 'agency', 'contractVehicle', 10);
  console.log('Total breakdown charts generated:', breakdownCharts.length);
  
  const fiscalChartTypes = ['fiscalTrend', 'fiscalArea', 'fiscalBar'];
  const fiscalChartsFound = breakdownCharts.filter(chart => 
    fiscalChartTypes.some(type => chart.id.includes(type))
  );
  
  console.log('Fiscal charts found:', fiscalChartsFound.length);
  if (fiscalChartsFound.length > 0) {
    console.log('✅ Fiscal charts are being generated!');
    fiscalChartsFound.forEach(chart => {
      console.log('  -', chart.title);
    });
  } else {
    console.log('❌ No fiscal charts in breakdown results');
  }
  
  // Test 5: Check all chart IDs
  console.log('\n📋 TEST 5: All generated chart IDs:');
  breakdownCharts.forEach((chart, idx) => {
    console.log(`  ${idx + 1}. ${chart.id}`);
  });
  
  console.log('\n🏁 DEBUG TEST COMPLETE');
  console.log('Check the logs above to diagnose the issue.');
}

/**
 * Quick test for specific column
 */
function testSpecificColumn(columnId) {
  console.log(`🔍 Testing column: ${columnId}`);
  
  const dataManager = getDataManager();
  const agencies = dataManager.getAgencies().slice(0, 3);
  
  console.log(`Using ${agencies.length} agencies`);
  
  // Check if this column has breakdown charts enabled
  const breakdownColumns = [
    'sumTier', 'sumType', 'aiProduct', 'aiCategory', 'aiCategories',
    'topBicProducts', 'contractVehicle', 'reseller', 'smallBusiness',
    'productObligations', 'categoryObligations'
  ];
  
  const isBreakdownColumn = breakdownColumns.includes(columnId);
  console.log(`Is breakdown column? ${isBreakdownColumn}`);
  
  if (!isBreakdownColumn) {
    console.log('❌ This column does not generate breakdown charts');
    console.log('Breakdown charts only work for:', breakdownColumns.join(', '));
    return;
  }
  
  // Try to extract data
  const extractedData = extractColumnData(agencies, columnId);
  console.log(`Extracted data items: ${extractedData.length}`);
  
  if (extractedData.length === 0) {
    console.log('❌ No data extracted for this column');
    return;
  }
  
  // Try to generate charts
  const charts = generateColumnBreakdownCharts(agencies, 'agency', columnId, 10);
  console.log(`Total charts generated: ${charts.length}`);
  
  charts.forEach(chart => {
    console.log(`  - ${chart.id}`);
  });
  
  const hasFiscal = charts.some(c => c.id.includes('fiscal'));
  console.log(`Has fiscal charts? ${hasFiscal}`);
}