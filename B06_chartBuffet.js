/**
 * @fileoverview Chart Buffet System for OneGov FIT Market Report Builder
 * @module B06_chartBuffet  
 * @version 3.0.0 - Universal FY Support & Master Styles
 * @description Comprehensive chart generation system with intelligent type selection
 *              based on data characteristics, entity type, and user preferences.
 *              NOW INCLUDES: Top N selection, "All Other" aggregation, percentage calculations,
 *              professional styling, enhanced tooltips, comprehensive labeling, 
 *              COLUMN-SPECIFIC BREAKDOWNS, FISCAL YEAR TREND ANALYSIS,
 *              IMPROVED LEGEND POSITIONING, FISCAL YEAR RANGE INDICATORS,
 *              UNIVERSAL FISCAL YEAR EXTRACTION, and MASTER STYLE CONFIGURATION
 * @author OneGov FIT Market Development Team
 * @updated 2024-12-14 - Added universal fiscal year extraction and master style system
 * @original_lines 4148 -> now ~5000 with new sections
 */

// SECTION 1: MASTER COLOR CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════════════

/**
 * Master Color Configuration System
 * Comprehensive centralized color management for all charts with priority-based assignment
 */
const CHART_COLORS = {
  // Entity palettes - 15 distinct colors for Top 15
  entityPalette: [
    '#144673', '#f47920', '#3a6ea5', '#22c55e', '#ef4444',
    '#fbbf24', '#a855f7', '#ec4899', '#14b8a6', '#6366f1',
    '#84cc16', '#06b6d4', '#8b5cf6', '#f59e0b', '#78716c'
  ],

  // Fixed category colors (ALWAYS same color)
  categories: {
    // Small Business (Column E)
    'SMALL BUSINESS': '#f47920',
    'OTHER THAN SMALL BUSINESS': '#144673',
    'Not Specified': '#e5e7eb',
    
    // SUM Tiers (Column F & X)
    'BIC': '#22c55e',
    'TIER 0': '#06b6d4',
    'TIER 1': '#144673',
    'TIER 2': '#f47920',
    'TIER 3': '#ef4444',
    'TIER 4': '#a855f7',
    'TIER 5': '#6b7280',
    
    // Sum Types (Column G)
    'Governmentwide': '#144673',
    'Governmentwide Management': '#144673',
    'Agency Managed': '#3a6ea5',
    'Open Market': '#f47920',
    
    // Quarters (Column M, N)
    'Q1': '#dbeafe',
    'Q2': '#bfdbfe',
    'Q3': '#93c5fd',
    'Q4': '#60a5fa',
    
    // Discount ranges (Column J)
    '0-10%': '#fecaca',
    '10-20%': '#fed7aa',
    '20-30%': '#fef3c7',
    '30-40%': '#bbf7d0',
    '40-50%': '#86efac',
    '50%+': '#22c55e',
    
    // OneGov/CFO Act filters
    'OneGov': '#22c55e',
    'Non-OneGov': '#ef4444',
    'CFO Act': '#144673',
    'Non-CFO Act': '#6b7280'
  },
  
  // Department colors (Column I)
  departments: {
    'DEFENSE': '#1e3a8a',
    'VA': '#dc2626',
    'HHS': '#059669',
    'STATE': '#7c3aed',
    'TREASURY': '#15803d',
    'DHS': '#1e40af',
    'ENERGY': '#fbbf24',
    'GSA': '#144673'
  },
  
  // Contract vehicles (Column H)
  contractVehicles: {
    'GSA Schedules': '#144673',
    'SEWP': '#3a6ea5',
    'CIO-SP3': '#22c55e',
    'FirstSource': '#f47920',
    'STARS': '#8b5cf6'
  },
  
  // Fiscal year colors
  fiscalYears: {
    '2022': '#cbd5e1',
    '2023': '#94a3b8',
    '2024': '#475569',
    '2025': '#1e293b',
    '2026': '#0f172a'  // Even darker blue-black
  },
  
  // Dynamic category colors (for items without fixed colors)
  dynamicPalette: [
    '#144673', '#3a6ea5', '#5b8fc7', '#7ba5d9', '#9bbceb'  // Blue gradient
  ]
};

/**
 * Enhanced color selection with column-specific logic
 * @param {Object} context - Color context
 * @returns {string} Hex color code
 */
function getChartColor(context) {
  const { type, index, label, columnId, year, isEntity } = context;
  
  // Fiscal year colors
  if (year) return getFiscalYearColor(year);
  
  // Column-specific colors
  switch(columnId) {
    case 'smallBusiness':
    case 'sumTier':
    case 'sumType':
      return CHART_COLORS.categories[label] || '#e5e7eb';
    
    case 'department':
    case 'fundingDepartment':
      return CHART_COLORS.departments[label] || 
             getDynamicColor(label, index, label);
    
    case 'contractVehicle':
      return CHART_COLORS.contractVehicles[label] || 
             getDynamicColor(label, index, label);
    
    case 'reseller':
    case 'manufacturer':
    case 'oem':
      return VENDOR_COLORS.get(label, index);
    
    default:
      // Check all predefined categories first
      if (label && CHART_COLORS.categories[label]) {
        return CHART_COLORS.categories[label];
      }
      if (label && CHART_COLORS.departments[label]) {
        return CHART_COLORS.departments[label];
      }
      if (label && CHART_COLORS.contractVehicles[label]) {
        return CHART_COLORS.contractVehicles[label];
      }
      if (label && CHART_COLORS.fiscalYears[label]) {
        return CHART_COLORS.fiscalYears[label];
      }
      
      // Entity colors for Top N charts
      if (isEntity) {
        return CHART_COLORS.entityPalette[index % CHART_COLORS.entityPalette.length];
      }
      
      // Default fallback
      return CHART_COLORS.entityPalette[index % 15];
  }
}

/**
 * Get column-specific color rules
 * @param {string} columnId - Column identifier
 * @returns {Array} Array of colors for the column
 */
function getColumnColorRules(columnId) {
  const rules = {
    smallBusiness: ['#f47920', '#144673', '#e5e7eb'],  // Orange, Navy, Gray
    sumTier: ['#22c55e', '#06b6d4', '#144673', '#f47920', '#ef4444', '#a855f7', '#6b7280'],  // BIC first, then tiers
    sumType: ['#144673', '#3a6ea5', '#f47920'],  // Gov, Agency, Open
    obligations: CHART_COLORS.entityPalette,  // Use full entity palette
    contractVehicle: Object.values(CHART_COLORS.contractVehicles),  // Contract vehicle colors
    fundingDepartment: Object.values(CHART_COLORS.departments),  // Department colors
    fiscalYear: Object.values(CHART_COLORS.fiscalYears),  // Fiscal year colors
    quarters: ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa'],  // Q1-Q4 colors
    discountRanges: ['#fecaca', '#fed7aa', '#fef3c7', '#bbf7d0', '#86efac', '#22c55e']  // Discount ranges
  };
  return rules[columnId] || CHART_COLORS.entityPalette;
}

/**
 * Get dynamic color with string hash consistency
 * @param {string} label - Label to generate color for
 * @param {number} index - Fallback index
 * @param {string} seedString - String for consistent hash
 * @returns {string} Hex color code
 */
function getDynamicColor(label, index, seedString) {
  // Check all predefined categories first
  const allCategories = {
    ...CHART_COLORS.categories,
    ...CHART_COLORS.departments,
    ...CHART_COLORS.contractVehicles
  };
  
  if (allCategories[label]) return allCategories[label];
  
  // Generate consistent color based on string hash
  if (seedString) {
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 50%)`;
  }
  
  // Fallback to palette
  return CHART_COLORS.entityPalette[index % 15];
}

/**
 * Vendor color cache for consistency across charts
 */
const VENDOR_COLORS = {
  // Cache colors for vendors/products to keep consistency
  _cache: {},
  
  get(name, index) {
    if (!this._cache[name]) {
      this._cache[name] = CHART_COLORS.entityPalette[
        Object.keys(this._cache).length % 15
      ];
    }
    return this._cache[name];
  }
};

/**
 * Get fiscal year color with gradient for unknown years
 * @param {string} year - Fiscal year
 * @returns {string} Color code
 */
function getFiscalYearColor(year) {
  if (CHART_COLORS.fiscalYears[year]) {
    return CHART_COLORS.fiscalYears[year];
  }
  // Generate gradient for unknown years
  const baseYear = 2022;
  const yearNum = parseInt(year);
  const offset = yearNum - baseYear;
  const lightness = Math.max(20, 70 - (offset * 10));
  return `hsl(214, 40%, ${lightness}%)`;
}

// SECTION 2: MASTER CHART STYLE SYSTEM
// Central configuration for all chart styles with expanded options support
// ══════════════════════════════════════════════════════════════════════════════════════

/**
 * Master chart styles configuration
 * Defines base styles and expanded styles for all chart types
 */
const MASTER_CHART_STYLES = {
  // Base styles (clean, minimal for default view)
  base: {
    global: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,  // Hidden by default for clean view
          position: 'bottom',
          labels: {
            padding: 8,
            font: {
              size: 11,
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 12 },
          bodyFont: { size: 11 },
          padding: 8,
          cornerRadius: 4
        },
        datalabels: {
          display: false  // Hidden by default
        }
      },
      scales: {
        x: {
          ticks: {
            font: { size: 10 },
            autoSkip: true,
            maxRotation: 45
          },
          grid: {
            display: false
          }
        },
        y: {
          ticks: {
            font: { size: 10 },
            callback: function(value) {
              if (value >= 5000000000) return '$' + (value / 1000000000).toFixed(1) + 'B';
              return '$' + (value / 1000000).toFixed(1) + 'M';
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    },
    
    bar: {
      borderRadius: 2,
      borderWidth: 0,
      backgroundColor: '#144673'
    },
    
    horizontalBar: {
      indexAxis: 'y',
      borderRadius: 2,
      borderWidth: 0,
      backgroundColor: '#144673'
    },
    
    pie: {
      borderWidth: 1,
      borderColor: '#ffffff',
      hoverBorderWidth: 2
    },
    
    line: {
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: false
    }
  },
  
  // Expanded styles (detailed, with all annotations for export)
  expanded: {
    global: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,  // Always show in expanded view
          position: 'bottom',
          labels: {
            padding: 12,
            font: {
              size: 14,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            usePointStyle: true,
            boxWidth: 20
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 6,
          displayColors: true
        },
        datalabels: {
          display: true,  // Show data labels in expanded view
          anchor: 'center',  // Changed from 'end' for better visibility in stacked charts
          align: 'center',   // Changed from 'end' for centered placement
          color: 'white',    // Changed to white for visibility on colored segments
          font: {
            size: 11,
            weight: 'bold'
          },
          formatter: function(value, context) {
            if (value < 1000000) return ''; // Hide small segments
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            const formatted = value >= 5000000000 ? '$' + (value/1000000000).toFixed(1) + 'B' : '$' + (value/1000000).toFixed(1) + 'M';
            return formatted + ' (' + percentage + '%)';
          }
        },
        title: {
          display: true,
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: { bottom: 15 }
        }
      },
      scales: {
        x: {
          ticks: {
            font: { size: 13, weight: 'bold' },
            autoSkip: false,
            maxRotation: 45
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          title: {
            display: true,
            font: { size: 14, weight: 'bold' }
          }
        },
        y: {
          ticks: {
            font: { size: 13, weight: 'bold' },
            callback: function(value) {
              if (value >= 5000000000) return '$' + (value / 1000000000).toFixed(1) + 'B';
              return '$' + (value / 1000000).toFixed(1) + 'M';
            }
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          title: {
            display: true,
            font: { size: 14, weight: 'bold' }
          }
        }
      }
    },
    
    bar: {
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#0a2240',
      backgroundColor: '#144673',
      hoverBackgroundColor: '#1e5a99'
    },
    
    horizontalBar: {
      indexAxis: 'y',
      borderRadius: 4,
      borderWidth: 2,
      borderColor: '#0a2240',
      backgroundColor: '#144673',
      hoverBackgroundColor: '#1e5a99'
    },
    
    pie: {
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverBorderWidth: 4,
      hoverBorderColor: '#000000'
    },
    
    line: {
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 5,
      pointHoverRadius: 8,
      fill: true,
      backgroundColor: 'rgba(20, 70, 115, 0.1)'
    }
  }
};

/**
 * Column-specific chart style overrides
 * Allows customization per column type
 */
const COLUMN_CHART_OVERRIDES = {
  obligations: {
    expanded: {
      plugins: {
        datalabels: {
          formatter: function(value, context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            const formatted = value >= 5000000000 ? '$' + (value / 1000000000).toFixed(1) + 'B' :
                            '$' + (value / 1000000).toFixed(1) + 'M';
            return formatted + '\n(' + percentage + '%)';
          }
        }
      }
    }
  },
  
  smallBusiness: {
    base: {
      plugins: {
        legend: {
          display: true  // Always show legend for categorical data
        }
      }
    }
  },
  
  contractVehicle: {
    base: {
      scales: {
        x: {
          ticks: {
            autoSkip: false,  // Show all contract vehicles
            maxRotation: 60
          }
        }
      }
    }
  },
  
  topRefPiid: {
    expanded: {
      plugins: {
        datalabels: {
          display: false  // Too cluttered for PIID data
        }
      }
    }
  }
};

/**
 * Get merged chart style based on context
 * @param {string} chartType - Type of chart (bar, pie, line, etc.)
 * @param {string} columnId - Column identifier
 * @param {boolean} isExpanded - Whether to use expanded style
 * @returns {Object} Merged chart configuration
 */
function getMergedChartStyle(chartType, columnId, isExpanded = false) {
  const styleSet = isExpanded ? MASTER_CHART_STYLES.expanded : MASTER_CHART_STYLES.base;
  
  // Start with global styles
  let mergedStyle = deepMerge({}, styleSet.global);
  
  // Add chart type specific styles
  const chartTypeStyle = styleSet[chartType] || styleSet.bar;
  mergedStyle = deepMerge(mergedStyle, { chartTypeSpecific: chartTypeStyle });
  
  // Add column-specific overrides if they exist
  if (COLUMN_CHART_OVERRIDES[columnId]) {
    const override = isExpanded ? 
      COLUMN_CHART_OVERRIDES[columnId].expanded : 
      COLUMN_CHART_OVERRIDES[columnId].base;
    
    if (override) {
      mergedStyle = deepMerge(mergedStyle, override);
    }
  }
  
  return mergedStyle;
}

/**
 * Deep merge utility for combining style objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * Check if value is an object
 * @param {any} item - Item to check
 * @returns {boolean} True if object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Get available chart types based on configuration
 * @param {string} entityType - Type of entity
 * @param {string} columnId - Column identifier
 * @param {number} entityCount - Number of entities
 * @returns {Array} Available chart types
 */
function getAvailableChartTypes(entityType, columnId, entityCount) {
  // This would check CHART_TYPE_AVAILABILITY configuration
  // and return available types based on context
  return getChartTypesByContext(entityType, columnId, entityCount);
}

// ══════════════════════════════════════════════════════════════════════════════════════
// SECTION 2: UNIVERSAL FISCAL YEAR EXTRACTION SYSTEM
// Pattern-based fiscal year data extraction that works across all column types
// ══════════════════════════════════════════════════════════════════════════════════════

/**
 * Universal fiscal year data extraction
 * Searches for fiscal year patterns in any data structure
 * @param {Object} data - Data object to search
 * @param {Object} options - Extraction options
 * @returns {Object} Fiscal year data map { year: value }
 */
function extractUniversalFiscalYearData(data, options = {}) {
  const {
    depthLimit = 5,
    aggregateMethod = 'sum',
    yearPattern = /^(19|20)\d{2}$/,
    fiscalYearKeys = ['fiscal_year', 'fiscal_years', 'fy', 'year', 'yearly'],
    currentDepth = 0
  } = options;
  
  const fiscalData = {};
  
  // Prevent infinite recursion
  if (currentDepth >= depthLimit) return fiscalData;
  
  // Handle null or undefined
  if (!data) return fiscalData;
  
  // Handle arrays
  if (Array.isArray(data)) {
    data.forEach(item => {
      const extracted = extractUniversalFiscalYearData(item, {
        ...options,
        currentDepth: currentDepth + 1
      });
      
      Object.entries(extracted).forEach(([year, value]) => {
        if (aggregateMethod === 'sum') {
          fiscalData[year] = (fiscalData[year] || 0) + value;
        } else if (aggregateMethod === 'max') {
          fiscalData[year] = Math.max(fiscalData[year] || 0, value);
        }
      });
    });
    return fiscalData;
  }
  
  // Handle objects
  if (typeof data === 'object') {
    // First, check for direct fiscal year patterns
    const directYears = extractFiscalYearsByPattern(data, yearPattern);
    Object.assign(fiscalData, directYears);
    
    // Then check for known fiscal year keys
    fiscalYearKeys.forEach(key => {
      if (data[key] && typeof data[key] === 'object') {
        const extracted = extractFiscalYearsByPattern(data[key], yearPattern);
        Object.entries(extracted).forEach(([year, value]) => {
          if (aggregateMethod === 'sum') {
            fiscalData[year] = (fiscalData[year] || 0) + value;
          } else if (aggregateMethod === 'max') {
            fiscalData[year] = Math.max(fiscalData[year] || 0, value);
          }
        });
      }
    });
    
    // Recursively search nested structures
    Object.keys(data).forEach(key => {
      // Skip if already processed as fiscal year key
      if (!fiscalYearKeys.includes(key) && typeof data[key] === 'object') {
        const extracted = extractUniversalFiscalYearData(data[key], {
          ...options,
          currentDepth: currentDepth + 1
        });
        
        Object.entries(extracted).forEach(([year, value]) => {
          if (aggregateMethod === 'sum') {
            fiscalData[year] = (fiscalData[year] || 0) + value;
          } else if (aggregateMethod === 'max') {
            fiscalData[year] = Math.max(fiscalData[year] || 0, value);
          }
        });
      }
    });
  }
  
  return fiscalData;
}

/**
 * Extract fiscal years by pattern matching
 * @param {Object} data - Data object to search
 * @param {RegExp} pattern - Year pattern to match
 * @returns {Object} Fiscal year data map
 */
function extractFiscalYearsByPattern(data, pattern) {
  const fiscalData = {};
  
  if (!data || typeof data !== 'object') return fiscalData;
  
  Object.keys(data).forEach(key => {
    // Check if key matches year pattern
    if (pattern.test(key)) {
      const value = parseFloat(data[key]) || 0;
      if (value > 0) {
        fiscalData[key] = value;
      }
    }
    
    // Also check for prefixed years like 'fy2023', 'FY_2023', etc.
    const yearMatch = key.match(/(\d{4})/);
    if (yearMatch && pattern.test(yearMatch[1])) {
      const value = parseFloat(data[key]) || 0;
      if (value > 0) {
        fiscalData[yearMatch[1]] = (fiscalData[yearMatch[1]] || 0) + value;
      }
    }
  });
  
  return fiscalData;
}

/**
 * Generate universal horizontal stacked bar chart with fiscal year data
 * Works with any column that has fiscal year breakdown
 * @param {Array} entities - Entity data
 * @param {string} columnId - Column identifier
 * @param {string} entityType - Entity type
 * @param {number} maxEntities - Maximum entities to show
 * @returns {Object} Chart configuration
 */
function generateUniversalHorizontalStackedBar(entities, columnId, entityType, maxEntities = 5) {
  const fiscalYearMap = {};
  const allYears = new Set();
  
  // Extract fiscal year data for each entity
  entities.slice(0, maxEntities).forEach(entity => {
    const entityName = entityType === 'agency' ? abbreviateAgencyName(entity.name) : entity.name;
    
    // Try multiple extraction methods
    let fiscalData = {};
    
    // Method 1: Direct fiscal_year_obligations
    if (entity.fiscal_year_obligations) {
      fiscalData = entity.fiscal_year_obligations;
    }
    // Method 2: Column-specific data with universal extraction
    else if (entity[columnId]) {
      let columnData = entity[columnId];
      
      // Parse if string
      if (typeof columnData === 'string') {
        try {
          columnData = JSON.parse(columnData);
        } catch(e) {
          console.log('Failed to parse column data');
        }
      }
      
      // Use universal extraction
      fiscalData = extractUniversalFiscalYearData(columnData);
    }
    
    // Store fiscal data if found
    if (Object.keys(fiscalData).length > 0) {
      fiscalYearMap[entityName] = fiscalData;
      Object.keys(fiscalData).forEach(year => allYears.add(year));
    }
  });
  
  // Sort years
  const sortedYears = Array.from(allYears).sort();
  
  if (sortedYears.length === 0) {
    console.log('No fiscal year data found using universal extraction');
    return null;
  }
  
  // Create datasets
  const datasets = sortedYears.map((year, idx) => {
    const colors = generateColorGradient(sortedYears.length);
    
    return {
      label: `FY ${year}`,
      data: Object.keys(fiscalYearMap).map(entityName => 
        fiscalYearMap[entityName][year] || 0
      ),
      backgroundColor: colors[idx],
      borderColor: '#ffffff',
      borderWidth: 1
    };
  });
  
  return {
    id: `${entityType}_${columnId}_universalStackedBar`,
    title: `${getColumnDisplayName(columnId)} - Universal Fiscal Year Breakdown`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: Object.keys(fiscalYearMap),
      datasets: datasets
    },
    chartOptions: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        },
        tooltip: {
          mode: 'index',
          intersect: false
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
    }
  };
}

/**
 * Check if a column has fiscal year data
 * @param {Array} entities - Entity data
 * @param {string} columnId - Column identifier
 * @returns {boolean} True if fiscal year data exists
 */
function columnHasFiscalYearData(entities, columnId) {
  for (let entity of entities.slice(0, 5)) { // Check first 5 entities
    if (entity[columnId]) {
      let data = entity[columnId];
      
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch(e) {
          continue;
        }
      }
      
      const fiscalData = extractUniversalFiscalYearData(data);
      if (Object.keys(fiscalData).length > 0) {
        return true;
      }
    }
  }
  
  return false;
}

// ══════════════════════════════════════════════════════════════════════════════════════
// SECTION 3: ORIGINAL HELPER FUNCTIONS AND UTILITIES
// Core utility functions for chart generation
// ══════════════════════════════════════════════════════════════════════════════════════

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
                       chartType === 'stackedBar' ||
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

// [CONTINUE WITH ALL THE REMAINING FUNCTIONS FROM THE ORIGINAL FILE]
// This includes all the functions from line 164 onwards in the original file
// I'll include just the key function signatures here to keep this manageable:

// Get available fiscal years from entity data
function getAvailableFiscalYears(entities, columnId) {
  // [Implementation from original file lines 164-331]
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

// [INCLUDE ALL THE REST OF THE ORIGINAL FILE FROM LINE 333 ONWARDS]
// This includes:
// - abbreviateAgencyName()
// - formatCurrencyShort()
// - formatCurrency()
// - formatPercentage()
// - createEnhancedLabel()
// - getRecommendedChartTypes()
// - getChartTypesByContext() [This is the big configuration matrix]
// - extractColumnData()
// - generateColumnBreakdownCharts()
// - All the chart generator functions
// - generateChartBuffet() main function
// - generateColumnReportsBuffet() entry point
// - Test functions at the end

// I'll continue with the most critical remaining functions:

/**
 * Abbreviate long agency names for better chart readability
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
  
  const upperName = agencyName.toUpperCase();
  if (abbreviations[upperName]) {
    return abbreviations[upperName];
  }
  
  for (const [fullName, abbrev] of Object.entries(abbreviations)) {
    if (upperName.includes(fullName)) {
      return abbrev;
    }
  }
  
  return agencyName.length > 25 ? agencyName.substring(0, 22) + '...' : agencyName;
}

/**
 * Format currency values in billions/millions for better readability
 */
function formatCurrencyShort(value) {
  if (!value || isNaN(value)) return '$0';
  
  const absValue = Math.abs(value);
  
  // Only show billions when >= $5B, otherwise always show millions
  if (absValue >= 5000000000) {
    return '$' + (value / 1000000000).toFixed(1) + 'B';
  } else {
    // Always show in millions - never write out full values
    return '$' + (value / 1000000).toFixed(1) + 'M';
  }
}

/**
 * Format currency values - now uses abbreviations everywhere
 */
function formatCurrency(value) {
  return formatCurrencyShort(value);
}

/**
 * Calculate percentage with proper formatting
 */
function formatPercentage(value, total) {
  if (!value || !total || total === 0) return '0.0%';
  const percentage = (value / total) * 100;
  return percentage.toFixed(1) + '%';
}

/**
 * Format currency for table display with proper abbreviations
 */
function formatTableCurrency(value) {
  if (!value || value === 0) return '$0';
  const num = parseFloat(value);
  if (num >= 5000000000) return '$' + (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return '$' + (num / 1000).toFixed(0) + 'K';
  return '$' + num.toFixed(0);
}

/**
 * Get appropriate label for monetary values based on column type
 * @param {string} columnId - Column identifier
 * @returns {string} "Sales" for BIC columns, "Obligations" for others
 */
function getMonetaryLabel(columnId) {
  const bicColumns = ['bicReseller', 'bicOem', 'bicTopProductsPerAgency', 'topBicProducts'];
  return bicColumns.includes(columnId) ? 'Sales' : 'Obligations';
}

/**
 * Create enhanced chart labels with value and percentage
 */
function createEnhancedLabel(name, value, total, isOthers = false) {
  const percentage = formatPercentage(value, total);
  const formattedValue = formatCurrencyShort(value);
  
  if (isOthers) {
    return `All Other (${formattedValue}, ${percentage})`;
  }
  
  return `${name} (${formattedValue}, ${percentage})`;
}


// [CONTINUE WITH ALL THE REMAINING FUNCTIONS FROM THE ORIGINAL FILE]
// Due to length constraints, I'll provide the file structure but you should copy
// all the remaining functions from your original B06_chartBuffet.gs file

// Note: The complete file would include all the functions from your original file
// This is just a template showing how to integrate the new sections with the existing code
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
 * Get shared legend configuration for charts
 * UPDATED: Legend is hidden by default - frontend shows via popup button
 */
function getSharedLegendConfig(chartType, hasMultipleDatasets = false) {
  // Legend is now HIDDEN by default - shown via popup button in frontend
  // This gives charts maximum space
  return {
    display: false,  // Hide built-in legend - frontend shows via popup
    position: 'right',
    align: 'center',
    labels: {
      usePointStyle: true,
      padding: 12,
      boxWidth: 20,
      boxHeight: 12,
      font: {
        size: 13,
        weight: '500',
        family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      },
      color: '#333333'
    }
  };
}

/**
 * Generate legend data for popup display
 * Returns array of { label, value, percentage, color } objects
 */
function generateLegendData(chartData, chartType) {
  if (!chartData || !chartData.datasets) return [];
  
  const legendItems = [];
  
  if (chartType === 'pie' || chartType === 'doughnut') {
    // For pie/doughnut, labels are in chartData.labels and values in datasets[0].data
    const dataset = chartData.datasets[0];
    const total = dataset.data.reduce((sum, val) => sum + val, 0);
    
    chartData.labels.forEach((label, idx) => {
      const value = dataset.data[idx];
      legendItems.push({
        label: label,
        value: value,
        formattedValue: formatCurrencyShort(value),
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0',
        color: dataset.backgroundColor[idx] || CHART_COLORS.entityPalette[idx % 15]
      });
    });
  } else {
    // For bar/line charts, each dataset is a legend item
    chartData.datasets.forEach((dataset, idx) => {
      const total = dataset.data.reduce((sum, val) => sum + val, 0);
      legendItems.push({
        label: dataset.label,
        value: total,
        formattedValue: formatCurrencyShort(total),
        percentage: null,
        color: dataset.backgroundColor || dataset.borderColor || CHART_COLORS.entityPalette[idx % 15]
      });
    });
  }
  
  return legendItems;
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
  
  // Only show billions when >= $5B, otherwise always show millions
  if (absValue >= 5000000000) {
    return '$' + (value / 1000000000).toFixed(1) + 'B';
  } else {
    // Always show in millions - never write out full values
    return '$' + (value / 1000000).toFixed(1) + 'M';
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
        console.warn(`❌ Unknown column ID: ${columnId}. No data extraction performed.`);
        break;
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

  // Add entity-focused stacked chart as first chart if conditions are met
  if (topN && topN > 0 && entityType !== 'summary') {
    const entityStackedChart = generateEntityStackedChart(entities, columnId, entityType, topN);
    if (entityStackedChart) {
      cards.push(entityStackedChart);
      console.log(`📊 Added entity-focused stacked chart for ${columnId}`);
    }
  }

  // Special handling for Small Business and other entity-focused columns
  const entityFocusedColumns = ['sumTier', 'sumType', 'smallBusiness', 'contractVehicle'];
  if (entityFocusedColumns.includes(columnId)) {
    // Entity-focused view is now primary (already added above)
    console.log(`📊 Using entity-focused priority for breakdown column: ${columnId}`);
  }

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
        chart = generateBreakdownStackedBarChart(entities, columnId, entityType, topN);
        break;
      case 'fiscalTrend':
        chart = generateBreakdownFiscalTrend(entities, columnId, entityType, {});
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

/**
 * Generate entity-specific breakdown charts
 * Shows Top N entities by column value
 */
function generateEntityBreakdownCharts(entities, entityType, columnId, topN = 10) {
  if (!entities || entities.length === 0 || !topN || topN <= 0) {
    return [];
  }

  const columnDisplayName = getColumnDisplayName(columnId);
  const charts = [];
  
  // Filter entities that have data for this column
  const entitiesWithData = entities.filter(entity => {
    const value = entity.value || entity[columnId];
    return value && parseFloat(value) > 0;
  }).slice(0, topN);

  if (entitiesWithData.length === 0) {
    return [];
  }

  // Generate Top N Entities Bar Chart
  charts.push({
    id: `${columnId}-entity-breakdown-bar`,
    title: `Top ${topN} ${entityType === 'agency' ? 'Agencies' : entityType === 'oem' ? 'OEMs' : 'Vendors'} - ${columnDisplayName}`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: entitiesWithData.map(e => entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name),
      datasets: [{
        label: columnDisplayName,
        data: entitiesWithData.map(e => e.value || e[columnId] || 0),
        backgroundColor: entitiesWithData.map((e, idx) => getChartColor({
          columnId: columnId,
          label: e.name,
          index: idx,
          isEntity: true
        })),
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    chartOptions: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed.x / total) * 100).toFixed(1);
              return `${context.dataset.label}: ${formatCurrencyShort(context.parsed.x)} (${percentage}%)`;
            }
          }
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
        }
      }
    },
    tableData: {
      headers: ['Rank', entityType === 'agency' ? 'Agency' : entityType === 'oem' ? 'OEM' : 'Vendor', columnDisplayName, 'Percentage'],
      rows: entitiesWithData.map((entity, idx) => {
        const total = entitiesWithData.reduce((sum, e) => sum + (e.value || e[columnId] || 0), 0);
        const percentage = total > 0 ? ((entity.value || entity[columnId] || 0) / total * 100).toFixed(1) + '%' : '0.0%';
        return [
          idx + 1,
          entity.name,
          formatCurrency(entity.value || entity[columnId] || 0),
          percentage
        ];
      })
    }
  });

  return charts;
}

/**
 * Generate Entity-Focused Stacked Bar Chart
 * Shows breakdown of categories for top entities in a single chart
 */
function generateEntityStackedChart(entities, columnId, entityType, topN) {
  console.log(`📊 generateEntityStackedChart: ${entityType} / ${columnId} with ${entities.length} entities, topN: ${topN}`);
  
  if (!entities || entities.length === 0) {
    return null;
  }
  
  const topEntities = topN ? entities.slice(0, topN) : entities;
  
  // Extract categories from the first entity
  const categories = extractCategories(topEntities[0], columnId);
  
  if (!categories || categories.length === 0) {
    console.log(`No categories found for ${columnId}`);
    return null;
  }
  
  console.log(`Found ${categories.length} categories:`, categories.map(c => c.name));
  
  // Create datasets for each category
  const datasets = categories.map((cat, idx) => ({
    label: cat.name,
    data: topEntities.map(entity => getColumnCategoryValue(entity, columnId, cat.name)),
    backgroundColor: getChartColor({
      label: cat.name,
      index: idx,
      isEntity: false,
      columnId: columnId
    }),
    borderWidth: 1
  }));
  
  return {
    id: `${entityType}_${columnId}_entity_stacked`,
    title: `Top ${topEntities.length} ${entityType} - ${getColumnDisplayName(columnId)} Breakdown`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: topEntities.map(e => {
        const name = e.name || e.entityName || 'Unknown';
        return entityType === 'Agencies' ? abbreviateAgencyName(name) : 
               name.length > 20 ? name.substring(0, 20) + '...' : name;
      }),
      datasets: datasets
    },
    chartOptions: {
      responsive: true,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('bar', true),
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.chart.data.datasets.reduce((sum, dataset) => 
                sum + (dataset.data[context.dataIndex] || 0), 0
              );
              const percentage = total > 0 ? ((context.parsed.y / total) * 100).toFixed(1) : '0.0';
              return `${context.dataset.label}: ${formatCurrencyShort(context.parsed.y)} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: { 
          stacked: true,
          ticks: {
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: { 
          stacked: true,
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
      headers: ['Entity'].concat(categories.map(c => c.name)),
      rows: topEntities.map(entity => {
        const entityName = entity.name || entity.entityName || 'Unknown';
        const row = [entityType === 'Agencies' ? abbreviateAgencyName(entityName) : entityName];
        categories.forEach(cat => {
          const value = getColumnCategoryValue(entity, columnId, cat.name);
          row.push(formatCurrency(value));
        });
        return row;
      })
    }
  };
}

/**
 * Extract categories from entity column data
 */
function extractCategories(entity, columnId) {
  console.log(`Extracting categories for ${columnId} from entity:`, entity?.name);
  
  if (!entity || !columnId) {
    return [];
  }
  
  const categories = [];
  const columnData = entity[columnId];
  
  if (!columnData) {
    console.log(`No data found for column ${columnId}`);
    return [];
  }
  
  try {
    let parsed = columnData;
    
    // Parse if string
    if (typeof columnData === 'string') {
      parsed = JSON.parse(columnData);
    }
    
    // Handle different JSON structures
    let dataToProcess = null;
    
    // Check various possible structures
    if (parsed.business_size_summaries) {
      dataToProcess = parsed.business_size_summaries;
    } else if (parsed.tier_summaries) {
      dataToProcess = parsed.tier_summaries;
    } else if (parsed.sum_type_summaries) {
      dataToProcess = parsed.sum_type_summaries;
    } else if (parsed.top_contract_summaries) {
      dataToProcess = parsed.top_contract_summaries;
    } else if (parsed.breakdown) {
      dataToProcess = parsed.breakdown;
    } else if (parsed.categories) {
      dataToProcess = parsed.categories;
    } else {
      // Use the parsed object directly
      dataToProcess = parsed;
    }
    
    if (dataToProcess && typeof dataToProcess === 'object') {
      Object.entries(dataToProcess).forEach(([key, value]) => {
        // Skip metadata fields
        if (!['total', 'fiscal_years', 'summary', 'processed_date', 'source_file'].includes(key)) {
          const categoryValue = typeof value === 'object' ? (value.total || value.value || 0) : (value || 0);
          if (categoryValue > 0) {
            categories.push({ 
              name: key, 
              value: categoryValue 
            });
          }
        }
      });
    }
    
    console.log(`Extracted ${categories.length} categories:`, categories.map(c => `${c.name}: ${c.value}`));
    
  } catch (error) {
    console.error(`Error extracting categories for ${columnId}:`, error);
  }
  
  return categories.sort((a, b) => b.value - a.value); // Sort by value descending
}

/**
 * Get category value from entity column data
 */
function getColumnCategoryValue(entity, columnId, categoryName) {
  if (!entity || !columnId || !categoryName) {
    return 0;
  }
  
  const columnData = entity[columnId];
  if (!columnData) {
    return 0;
  }
  
  try {
    let parsed = columnData;
    
    // Parse if string
    if (typeof columnData === 'string') {
      parsed = JSON.parse(columnData);
    }
    
    // Check various possible structures
    let dataSource = null;
    
    if (parsed.business_size_summaries) {
      dataSource = parsed.business_size_summaries;
    } else if (parsed.tier_summaries) {
      dataSource = parsed.tier_summaries;
    } else if (parsed.sum_type_summaries) {
      dataSource = parsed.sum_type_summaries;
    } else if (parsed.top_contract_summaries) {
      dataSource = parsed.top_contract_summaries;
    } else if (parsed.breakdown) {
      dataSource = parsed.breakdown;
    } else if (parsed.categories) {
      dataSource = parsed.categories;
    } else {
      dataSource = parsed;
    }
    
    if (dataSource && dataSource[categoryName]) {
      const value = dataSource[categoryName];
      return typeof value === 'object' ? (value.total || value.value || 0) : (value || 0);
    }
    
  } catch (error) {
    console.error(`Error getting category value for ${columnId}/${categoryName}:`, error);
  }
  
  return 0;
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
  console.log(`🔍 DEBUG generateColumnReportsBuffet: topN=${topN}, effectiveTopN=${effectiveTopN}, columnId=${columnId}, entityType=${entityType}, fiscalYearFilter=${fiscalYearFilter}`);
  
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
    console.error(`❌ No data extracted for column ${columnId}. This indicates missing/corrupted data in entity JSON fields.`);
    console.error(`❌ Entities have the following fields:`, entities[0] ? Object.keys(entities[0]).filter(k => k.includes(columnId.substring(0, 6))) : 'No entities');
    
    // No fallback logic - return empty results when data extraction fails
    chartEntities = [];
  } else {
    // Use extracted column data (this shows resellers when user clicks resellers!)
    chartEntities = columnDataItems;
  }

  // Early exit if no chart entities found
  if (chartEntities.length === 0) {
    console.error(`❌ No chart entities available for ${columnId}. Returning empty chart array.`);
    return [];
  }

  // Calculate overall total from chart entities  
  const overallTotal = chartEntities.reduce((sum, e) => sum + (e.value || 0), 0);
  
  // Get top N entities and calculate "All Other" if enabled
  console.log(`🔧 FUNNEL DEBUG: chartEntities.length=${chartEntities.length}, effectiveTopN=${effectiveTopN}`);
  
  // Fix: Handle "All" case where effectiveTopN is undefined
  const topEntities = effectiveTopN ? chartEntities.slice(0, effectiveTopN) : chartEntities;
  console.log(`🔧 FUNNEL DEBUG: topEntities.length after slice=${topEntities.length}`);
  const topTotal = topEntities.reduce((sum, e) => sum + (e.value || 0), 0);
  const othersValue = overallTotal - topTotal;
  
  // Create entities with "All Other" category based on user preference
  const entitiesWithOthers = [...topEntities];
  if (showAllOther && othersValue > 0 && effectiveTopN && chartEntities.length > effectiveTopN) {
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
  
  // 1.5. ADD ENTITY-SPECIFIC BREAKDOWN CHARTS
  const entityBreakdownCharts = generateEntityBreakdownCharts(entitiesWithOthers, entityType, columnId, effectiveTopN);
  if (entityBreakdownCharts.length > 0) {
    cards.push(...entityBreakdownCharts);
  }
  
  // 1.6. CHECK FOR FISCAL YEAR TRENDS
  const hasFiscalData = columnHasFiscalYearData(entities, columnId);
  if (hasFiscalData) {
    const fiscalTrendChart = generateBreakdownFiscalTrend(entities, columnId, entityType, {});
    if (fiscalTrendChart) {
      cards.push(fiscalTrendChart);
    }
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
          console.log(`📊 CALLING generateStackedBarChart with ${chartEntities.length} entities, topN: ${Math.min(effectiveTopN, 5)}`);
          card = generateStackedBarChart(chartEntities, entityType, columnId, Math.min(effectiveTopN, 5), fiscalYearFilter);
          if (!card) {
            console.error('⚠️ generateStackedBarChart returned null - Year over Year chart will be missing');
            console.error('  This usually means no fiscal year data was found in entities');
          }
          break;
        case 'area':
          card = generateAreaChart(chartEntities, entityType, columnId, fiscalYearFilter);
          break;
      }
      
      if (card) cards.push(card);
    });
  }
  
  // 3. ADD TREND OVER TIME
  const trendCard = generateTrendOverTime(entityType, columnId, selectedEntities, effectiveTopN);
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
      labels: data.map(item => {
        const formatted = formatTableCurrency(item.value);
        const percentage = ((item.value / totalValue) * 100).toFixed(1);
        return `${item.name} (${formatted} - ${percentage}%)`;
      }),
      datasets: [{
        data: data.map(item => item.value),
        backgroundColor: data.map((item, idx) => getChartColor({
          label: item.name,
          index: idx,
          isEntity: false,
          columnId: columnId
        })),
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
      headers: ['Category', `Total ${getMonetaryLabel(columnId)}`, 'Percentage'],
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
        backgroundColor: displayData.map((item, idx) => getChartColor({
          columnId: columnId,
          label: item.name,
          index: idx
        })),
        borderColor: '#ffffff',
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
      headers: ['Rank', 'Category', getMonetaryLabel(columnId), 'Percentage'],
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
  const displayData = topN ? data.slice(0, topN) : data;
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
        backgroundColor: displayData.map((item, idx) => getChartColor({
          columnId: columnId,
          label: item.name,
          index: idx
        })),
        borderColor: '#ffffff',
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
      headers: ['Category', `Total ${getMonetaryLabel(columnId)}`, 'Percentage'],
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
        backgroundColor: data.map((item, idx) => getChartColor({
          label: item.name,
          index: idx,
          isEntity: false,
          columnId: columnId
        })),
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
      headers: ['Category', `Total ${getMonetaryLabel(columnId)}`, 'Percentage'],
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
      displayValue: `${formatCurrencyShort(item.value)} (${percentage.toFixed(1)}%)`,
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
      headers: ['Category', `Total ${getMonetaryLabel(columnId)}`, 'Percentage'],
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
      headers: ['Category', `Total ${getMonetaryLabel(columnId)}`, 'Percentage'],
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
      headers: ['Category', `Total ${getMonetaryLabel(columnId)}`, 'Percentage'],
      rows: data.map(item => {
        const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0';
        return [item.name, formatCurrency(item.value), `${percentage}%`];
      })
    }
  };
}

/**
 * Generate stacked bar chart showing category breakdown per entity
 * ENHANCED: Tooltips now show full category breakdown with values and percentages
 */
function generateBreakdownStackedBarChart(entities, columnId, entityType, topN = 5) {
  console.log(`📊 generateBreakdownStackedBarChart for ${columnId}: Received ${entities.length} entities, topN: ${topN}`);
  
  // Limit entities to topN (handle null/undefined for "All")
  const limitedEntities = topN ? entities.slice(0, topN) : entities;
  
  // For each entity, extract breakdown categories and their values
  const entityBreakdowns = [];
  const allCategories = new Set();
  
  limitedEntities.forEach(entity => {
    const entityName = entityType === 'agency' ? abbreviateAgencyName(entity.name) : entity.name;
    const breakdown = {};
    
    // Extract breakdown data based on column type
    const columnData = entity[columnId];
    if (columnData) {
      let jsonData = columnData;
      
      // Parse if needed
      if (typeof jsonData === 'string') {
        try {
          jsonData = JSON.parse(jsonData);
        } catch(e) {
          console.log(`Failed to parse JSON for ${entity.name}`);
          return;
        }
      }
      
      // Extract categories based on column structure
      switch(columnId) {
        case 'contractVehicle':
          if (jsonData.top_contract_summaries) {
            Object.entries(jsonData.top_contract_summaries).forEach(([name, data]) => {
              breakdown[name] = data.total || 0;
              allCategories.add(name);
            });
          }
          break;
          
        case 'sumType':
          if (jsonData.sum_type_summaries) {
            Object.entries(jsonData.sum_type_summaries).forEach(([name, data]) => {
              breakdown[name] = data.total || 0;
              allCategories.add(name);
            });
          }
          break;
          
        case 'sumTier':
          if (jsonData.tier_summaries) {
            Object.entries(jsonData.tier_summaries).forEach(([name, data]) => {
              breakdown[name] = data.total || 0;
              allCategories.add(name);
            });
          }
          break;
          
        case 'smallBusiness':
          if (jsonData.business_size_summaries) {
            Object.entries(jsonData.business_size_summaries).forEach(([name, data]) => {
              breakdown[name] = data.total || 0;
              allCategories.add(name);
            });
          }
          break;
          
        case 'reseller':
          if (jsonData.top_15_reseller_summaries) {
            Object.entries(jsonData.top_15_reseller_summaries).forEach(([name, data]) => {
              breakdown[name] = data.total || 0;
              allCategories.add(name);
            });
          }
          break;
          
        case 'fundingDepartment':
          if (jsonData.top_10_department_summaries) {
            Object.entries(jsonData.top_10_department_summaries).forEach(([name, data]) => {
              breakdown[name] = data.total || 0;
              allCategories.add(name);
            });
          }
          break;
          
        case 'fundingAgency':
          if (jsonData.top_10_agency_summaries) {
            Object.entries(jsonData.top_10_agency_summaries).forEach(([name, data]) => {
              breakdown[name] = data.total || 0;
              allCategories.add(name);
            });
          }
          break;
      }
    }
    
    if (Object.keys(breakdown).length > 0) {
      entityBreakdowns.push({ entityName, breakdown });
    }
  });
  
  if (entityBreakdowns.length === 0) {
    console.log('❌ No breakdown data found for any entities');
    console.log('  Checked entities:', limitedEntities.map(e => e.name));
    console.log('  Column ID:', columnId);
    console.log('  First entity sample:', limitedEntities[0] ? Object.keys(limitedEntities[0]).filter(k => k.includes('contract') || k.includes('sum') || k.includes('small') || k.includes('reseller') || k.includes('funding')) : 'No entities');
    return null;
  }
  
  // Convert to sorted array and limit categories
  const sortedCategories = Array.from(allCategories);
  const entityNames = entityBreakdowns.map(eb => eb.entityName);
  
  // Create datasets - one per category
  const datasets = sortedCategories.map((category, idx) => ({
    label: category,
    data: entityBreakdowns.map(eb => eb.breakdown[category] || 0),
    backgroundColor: getChartColor({
      label: category,
      index: idx,
      isEntity: false,
      columnId: columnId
    }),
    borderColor: '#ffffff',
    borderWidth: 1
  }));
  
  // Pre-calculate entity totals and category breakdowns for tooltips
  const entityTotals = {};
  const entityCategoryBreakdowns = {};
  
  entityBreakdowns.forEach(eb => {
    const total = sortedCategories.reduce((sum, cat) => sum + (eb.breakdown[cat] || 0), 0);
    entityTotals[eb.entityName] = total;
    
    // Sort categories by value for this entity
    const sortedBreakdown = sortedCategories
      .map(cat => ({
        name: cat,
        value: eb.breakdown[cat] || 0,
        percentage: total > 0 ? ((eb.breakdown[cat] || 0) / total * 100) : 0
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories per entity
    
    entityCategoryBreakdowns[eb.entityName] = sortedBreakdown;
  });
  
  // Calculate totals for table
  const tableRows = entityBreakdowns.map(eb => {
    const total = sortedCategories.reduce((sum, cat) => sum + (eb.breakdown[cat] || 0), 0);
    const row = [eb.entityName];
    sortedCategories.forEach(cat => {
      row.push(formatCurrency(eb.breakdown[cat] || 0));
    });
    row.push(formatCurrency(total));
    return row;
  });
  
  // Get entity type label for tooltip
  const entityLabel = entityType === 'agency' ? 'Agency' : 
                     entityType === 'oem' ? 'OEM' : 'Vendor';
  
  return {
    id: `${entityType}_${columnId}_breakdown_stackedBar`,
    title: `${getColumnDisplayName(columnId)} - Stacked View (Top ${topN})`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: entityNames,
      datasets: datasets
    },
    chartOptions: {
      indexAxis: 'y',
      responsive: true,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('stackedBar', true),
        tooltip: {
          callbacks: {
            title: function(context) {
              const entityName = context[0].label;
              const total = entityTotals[entityName] || 0;
              return `${entityName}: ${formatCurrencyShort(total)}`;
            },
            label: function(context) {
              // Return empty - we'll use afterBody for detailed breakdown
              return '';
            },
            afterBody: function(context) {
              const entityName = context[0].label;
              const breakdown = entityCategoryBreakdowns[entityName] || [];
              
              if (breakdown.length === 0) return [];
              
              const lines = [`───────────────`, `Top 5 Categories:`];
              breakdown.forEach((item, i) => {
                const valueStr = formatCurrencyShort(item.value);
                const pctStr = item.percentage.toFixed(1);
                lines.push(`${i + 1}. ${item.name}: ${valueStr} (${pctStr}%)`);
              });
              
              return lines;
            }
          },
          displayColors: false,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8
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
    // Store breakdown data for export
    breakdownByEntity: entityCategoryBreakdowns,
    tableData: {
      headers: ['Entity', ...sortedCategories, 'Total'],
      rows: tableRows
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
 * ENHANCED: Tooltips now show top 5 entity breakdown with values and percentages
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
      return shouldInclude;
    });
    
    console.log(`  After filter: ${originalCount} → ${entities.length} entities`);
  }
  
  // Store entity-level fiscal year data for tooltip breakdown
  const entityFiscalData = {}; // { entityName: { year: value } }
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
    
    const entityName = entityType === 'agency' ? abbreviateAgencyName(entity.name) : entity.name;
    if (!entityFiscalData[entityName]) {
      entityFiscalData[entityName] = {};
    }
    
    // Extract fiscal year data based on column structure
    let entityYearData = {};
    
    switch(columnId) {
      case 'obligations':
        // For obligations, use the fiscal_year_obligations from entity root
        if (entity.fiscal_year_obligations) {
          entityYearData = entity.fiscal_year_obligations;
        } else if (jsonData.fiscal_year_obligations) {
          entityYearData = jsonData.fiscal_year_obligations;
        }
        break;
        
      case 'contractVehicle':
        if (jsonData.top_contract_summaries) {
          Object.values(jsonData.top_contract_summaries).forEach(vehicleData => {
            if (vehicleData.fiscal_years) {
              Object.entries(vehicleData.fiscal_years).forEach(([year, value]) => {
                entityYearData[year] = (entityYearData[year] || 0) + value;
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
                entityYearData[year] = (entityYearData[year] || 0) + value;
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
                entityYearData[year] = (entityYearData[year] || 0) + value;
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
                entityYearData[year] = (entityYearData[year] || 0) + value;
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
                entityYearData[year] = (entityYearData[year] || 0) + value;
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
                entityYearData[year] = (entityYearData[year] || 0) + value;
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
                entityYearData[year] = (entityYearData[year] || 0) + value;
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
                entityYearData[year] = (entityYearData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'bicOem':
        if (jsonData.yearly_totals) {
          entityYearData = jsonData.yearly_totals;
        }
        break;
        
      case 'topBicProducts':
        if (jsonData.top_25_products && Array.isArray(jsonData.top_25_products)) {
          jsonData.top_25_products.forEach(product => {
            if (product.fiscal_years) {
              Object.entries(product.fiscal_years).forEach(([year, value]) => {
                entityYearData[year] = (entityYearData[year] || 0) + value;
              });
            }
          });
        }
        break;
        
      case 'aiProduct':
      case 'productObligations':
        if (jsonData.fiscal_year_summaries) {
          Object.entries(jsonData.fiscal_year_summaries).forEach(([year, yearData]) => {
            entityYearData[year] = yearData.total_obligations || 0;
          });
        }
        break;
        
      case 'aiCategory':
      case 'aiCategories':
      case 'categoryObligations':
        if (jsonData.fiscal_year_summaries) {
          Object.entries(jsonData.fiscal_year_summaries).forEach(([year, yearData]) => {
            entityYearData[year] = yearData.total_obligations || 0;
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
            entityYearData[year] = parseFloat(value) || 0;
          });
        }
    }
    
    // Store entity-level data and aggregate totals
    Object.entries(entityYearData).forEach(([year, value]) => {
      entityFiscalData[entityName][year] = value;
      fiscalData[year] = (fiscalData[year] || 0) + value;
    });
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
  
  // Pre-calculate top 5 entities for each year (for tooltips)
  const topEntitiesByYear = {};
  years.forEach(year => {
    const yearTotal = fiscalData[year];
    const entitiesForYear = Object.entries(entityFiscalData)
      .map(([name, yearData]) => ({
        name,
        value: yearData[year] || 0,
        percentage: yearTotal > 0 ? ((yearData[year] || 0) / yearTotal * 100) : 0
      }))
      .filter(e => e.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    topEntitiesByYear[year] = entitiesForYear;
  });
  
  // Get entity type label for tooltip
  const entityLabel = entityType === 'agency' ? 'Agencies' : 
                     entityType === 'oem' ? 'OEMs' : 'Vendors';
  
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
            title: function(context) {
              const idx = context[0].dataIndex;
              const year = years[idx];
              const value = formatCurrencyShort(context[0].parsed.y);
              const growth = growthRates[idx];
              const growthText = growth !== null ? ` (${growth > 0 ? '+' : ''}${growth.toFixed(1)}% YoY)` : '';
              return `FY${year}: ${value}${growthText}`;
            },
            label: function(context) {
              // Return empty - we'll use afterBody for detailed breakdown
              return '';
            },
            afterBody: function(context) {
              const idx = context[0].dataIndex;
              const year = years[idx];
              const topEntities = topEntitiesByYear[year] || [];
              
              if (topEntities.length === 0) return [];
              
              const lines = [`───────────────`, `Top 5 ${entityLabel}:`];
              topEntities.forEach((entity, i) => {
                const valueStr = formatCurrencyShort(entity.value);
                const pctStr = entity.percentage.toFixed(1);
                lines.push(`${i + 1}. ${entity.name}: ${valueStr} (${pctStr}%)`);
              });
              
              return lines;
            }
          },
          displayColors: false,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8
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
    // Store breakdown data for export/table
    breakdownByYear: topEntitiesByYear,
    tableData: {
      headers: ['Fiscal Year', `Total ${getMonetaryLabel(columnId)}`, 'YoY Change', 'YoY Growth %', 'Top Entity'],
      rows: years.map((year, index) => {
        const value = values[index];
        const change = index > 0 ? values[index] - values[index - 1] : 0;
        const growth = growthRates[index];
        const topEntity = topEntitiesByYear[year]?.[0];
        const topEntityText = topEntity ? `${topEntity.name} (${topEntity.percentage.toFixed(1)}%)` : 'N/A';
        return [
          `FY${year}`,
          formatCurrency(value),
          index > 0 ? formatCurrency(change) : 'N/A',
          growth !== null ? `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%` : 'N/A',
          topEntityText
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
        backgroundColor: years.map(year => getChartColor({
          year: year.toString(),
          columnId: columnId
        })),
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
      headers: ['Fiscal Year', `Total ${getMonetaryLabel(columnId)}`, 'YoY Change', 'YoY Growth %'],
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
        backgroundColor: entities.map((e, idx) => e.isOthers ? '#94a3b8' : getChartColor({
          columnId: columnId,
          label: e.name,
          index: idx,
          isEntity: true
        })),
        borderColor: '#ffffff',
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
          text: `Top ${actualTopN}${entities.some(e => e.isOthers) ? ' + All Other' : ''}`
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
            text: `${getMonetaryLabel(columnId)} ($)`
          }
        }
      }
    },
    tableData: {
      headers: ['Rank', 'Entity', getMonetaryLabel(columnId), 'Percentage'],
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
        backgroundColor: entities.map((e, idx) => e.isOthers ? '#94a3b8' : getChartColor({
          columnId: columnId,
          label: e.name,
          index: idx,
          isEntity: true
        })),
        borderColor: '#ffffff',
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
          text: `Top ${actualTopN}${entities.some(e => e.isOthers) ? ' + All Other' : ''}`
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
            text: `${getMonetaryLabel(columnId)} ($)`
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
      headers: ['Rank', 'Entity', getMonetaryLabel(columnId), 'Percentage'],
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
  
  // For obligations column, try to extract fiscal year breakdown for stacking
  if (columnId === 'obligations') {
    const fiscalYearData = {};
    const allYears = new Set();
    
    entities.forEach(entity => { // Use all entities passed to function
      const entityName = entityType === 'agency' ? abbreviateAgencyName(entity.name) : entity.name;
      let fyBreakdown = null;
      
      // Try to get fiscal year breakdown
      if (entity.fiscal_year_obligations) {
        fyBreakdown = entity.fiscal_year_obligations;
      } else if (entity.obligations?.fiscal_year_obligations) {
        fyBreakdown = entity.obligations.fiscal_year_obligations;
      }
      
      if (fyBreakdown && typeof fyBreakdown === 'object') {
        Object.entries(fyBreakdown).forEach(([year, value]) => {
          if (!fiscalYearData[year]) fiscalYearData[year] = {};
          fiscalYearData[year][entityName] = parseFloat(value) || 0;
          allYears.add(year);
        });
      } else {
        // If no breakdown, put total in a generic category
        const year = 'Total';
        if (!fiscalYearData[year]) fiscalYearData[year] = {};
        fiscalYearData[year][entityName] = entity.value || 0;
        allYears.add(year);
      }
    });
    
    const years = Array.from(allYears).sort();
    const entityNames = entities.map(e => entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name);
    
    // Create datasets - one per fiscal year
    const datasets = years.map((year, idx) => ({
      label: year === 'Total' ? 'Total Obligations' : `FY ${year}`,
      data: entityNames.map(name => fiscalYearData[year]?.[name] || 0),
      backgroundColor: generateColorGradient(years.length)[idx],
      borderColor: '#ffffff',
      borderWidth: 1
    }));
    
    return {
      id: `${entityType}_${columnId}_hstackedbar`,
      title: `${getColumnDisplayName(columnId)} - Horizontal Stacked View${fiscalYearText}`,
      cardType: 'chart',
      chartType: 'bar',
      chartData: {
        labels: entityNames,
        datasets: datasets
      },
      chartOptions: {
        indexAxis: 'y',
        responsive: true,
        layout: getSharedLayoutConfig(),
        plugins: {
          legend: getSharedLegendConfig('stackedBar', true)
        },
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
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
        headers: ['Entity', ...years, 'Total'],
        rows: entityNames.map(name => {
          const row = [name];
          years.forEach(year => {
            row.push(formatCurrency(fiscalYearData[year]?.[name] || 0));
          });
          const total = years.reduce((sum, year) => sum + (fiscalYearData[year]?.[name] || 0), 0);
          row.push(formatCurrency(total));
          return row;
        })
      }
    };
  }
  
  // Fallback for non-obligations columns - regular horizontal bar
  return {
    id: `${entityType}_${columnId}_hbar`,
    title: `${getColumnDisplayName(columnId)} - Horizontal View${fiscalYearText}`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: entities.map(e => entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name),
      datasets: [{
        label: getColumnDisplayName(columnId),
        data: entities.map(e => e.value),
        backgroundColor: entities.map((e, idx) => getChartColor({
          columnId: columnId,
          label: e.name,
          index: idx,
          isEntity: true
        })),
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    chartOptions: {
      indexAxis: 'y',
      responsive: true,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('horizontalBar', true)
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
  console.log(`🔻 generateFunnelChart called with fiscalYearFilter: ${fiscalYearFilter}, entities: ${entities.length}, topN: ${topN}, columnId: ${columnId}`);
  console.log(`🔻 DEBUG: entities passed to funnel:`, entities.map(e => e.name).slice(0, 10));
  const topEntities = topN ? entities.slice(0, topN) : entities;
  console.log(`🔻 DEBUG: topEntities count after slice: ${topEntities.length}`);
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
  
  // Use enhanced color gradient for pie slices
  const colors = generateColorGradient(entities.length);
  
  return {
    id: `${entityType}_${columnId}_pie`,
    title: `${getColumnDisplayName(columnId)} - Top ${actualTopN}${entities.some(e => e.isOthers) ? ' + All Other' : ''} (${formatCurrencyShort(totalDisplayed)} total)`,
    cardType: 'chart',
    chartType: 'pie',
    chartData: {
      labels: entities.map(e => {
        const name = e.isOthers ? 'All Other' : (entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name);
        const formatted = formatTableCurrency(e.value);
        const percentage = ((e.value / overallTotal) * 100).toFixed(1);
        return `${name} (${formatted} - ${percentage}%)`;
      }),
      datasets: [{
        data: entities.map(e => e.value),
        backgroundColor: entities.map((e, index) => {
          if (e.isOthers) return '#94a3b8';
          return getChartColor({
            columnId: columnId,
            label: e.name,
            index: index,
            isEntity: true
          });
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
          position: 'bottom',
          labels: {
            generateLabels: function(chart) {
              const data = chart.data;
              const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percent = ((value / total) * 100).toFixed(1);
                const formatted = formatTableCurrency(value);
                return {
                  text: `${entities[i].name} (${formatted} - ${percent}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  fontColor: '#333333',
                  fontStyle: 'normal'
                };
              });
            }
          }
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
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percent = ((value / total) * 100).toFixed(1);
              const formatted = formatTableCurrency(value);
              return `${context.label}: ${formatted} (${percent}%)`;
            }
          }
        }
      }
    },
    tableData: {
      headers: ['Rank', 'Entity', getMonetaryLabel(columnId), 'Percentage'],
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
 * Generate stacked bar chart showing year-over-year comparison
 * ENHANCED: Tooltips now show top 5 entity breakdown with values and percentages per year
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
    
    let fiscalYearBreakdown = {};
    
    // First try standard obligations locations
    if (entity.fiscal_year_obligations) {
      fiscalYearBreakdown = entity.fiscal_year_obligations;
      console.log('  Found fiscal_year_obligations:', fiscalYearBreakdown);
    } else if (entity.obligations?.fiscal_year_obligations) {
      fiscalYearBreakdown = entity.obligations.fiscal_year_obligations;
      console.log('  Found nested obligations.fiscal_year_obligations:', fiscalYearBreakdown);
    }
    
    // If no fiscal year data found, try column-specific extraction
    if (Object.keys(fiscalYearBreakdown).length === 0 && columnId) {
      const columnData = entity[columnId];
      if (columnData) {
        let jsonData = columnData;
        
        // Parse if needed
        if (typeof jsonData === 'string') {
          try {
            jsonData = JSON.parse(jsonData);
          } catch(e) {
            console.log('  Failed to parse JSON for', entity.name);
            return;
          }
        }
        
        // Extract fiscal year data based on column structure
        switch(columnId) {
          case 'obligations':
            if (jsonData.fiscal_year_obligations) {
              fiscalYearBreakdown = jsonData.fiscal_year_obligations;
            } else if (jsonData.total_obligated && entity.fiscal_year_obligations) {
              fiscalYearBreakdown = entity.fiscal_year_obligations;
            }
            break;
            
          case 'contractVehicle':
            if (jsonData.top_contract_summaries) {
              Object.values(jsonData.top_contract_summaries).forEach(vehicleData => {
                if (vehicleData.fiscal_years) {
                  Object.entries(vehicleData.fiscal_years).forEach(([year, value]) => {
                    fiscalYearBreakdown[year] = (fiscalYearBreakdown[year] || 0) + (parseFloat(value) || 0);
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
                    fiscalYearBreakdown[year] = (fiscalYearBreakdown[year] || 0) + (parseFloat(value) || 0);
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
                    fiscalYearBreakdown[year] = (fiscalYearBreakdown[year] || 0) + (parseFloat(value) || 0);
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
                    fiscalYearBreakdown[year] = (fiscalYearBreakdown[year] || 0) + (parseFloat(value) || 0);
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
                    fiscalYearBreakdown[year] = (fiscalYearBreakdown[year] || 0) + (parseFloat(value) || 0);
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
                    fiscalYearBreakdown[year] = (fiscalYearBreakdown[year] || 0) + (parseFloat(value) || 0);
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
                    fiscalYearBreakdown[year] = (fiscalYearBreakdown[year] || 0) + (parseFloat(value) || 0);
                  });
                }
              });
            }
            break;
        }
        
        console.log(`  Extracted fiscal year data for ${columnId}:`, fiscalYearBreakdown);
      }
    }
    
    if (Object.keys(fiscalYearBreakdown).length === 0) {
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
  
  // Pre-calculate year totals and entity breakdowns for tooltips
  const yearTotals = {};
  const topEntitiesByYear = {};
  
  years.forEach(year => {
    const yearTotal = Object.values(fiscalYearData[year] || {}).reduce((sum, val) => sum + val, 0);
    yearTotals[year] = yearTotal;
    
    // Get top 5 entities for this year
    const entitiesForYear = Object.entries(fiscalYearData[year] || {})
      .map(([name, value]) => {
        const displayName = entityType === 'agency' ? abbreviateAgencyName(name) : name;
        return {
          name: displayName,
          value: value,
          percentage: yearTotal > 0 ? (value / yearTotal * 100) : 0
        };
      })
      .filter(e => e.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    
    topEntitiesByYear[year] = entitiesForYear;
  });
  
  // Create table data
  const tableRows = [];
  entityNames.forEach(entityName => {
    const entityRow = [entityName];
    years.forEach(year => {
      const entity = topEntitiesWithNames.find(e => 
        (entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name) === entityName
      );
      const value = fiscalYearData[year]?.[entity?.name] || 0;
      entityRow.push(formatCurrency(value));
    });
    const total = years.reduce((sum, year) => {
      const entity = topEntitiesWithNames.find(e => 
        (entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name) === entityName
      );
      return sum + (fiscalYearData[year]?.[entity?.name] || 0);
    }, 0);
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
  
  // Create datasets
  const datasets = entityNames.map((name, index) => ({
    label: name,
    data: years.map(year => {
      const entity = topEntitiesWithNames.find(e => 
        (entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name) === name
      );
      return fiscalYearData[year]?.[entity?.name] || 0;
    }),
    backgroundColor: getChartColor({
      columnId: columnId,
      label: name,
      index: index,
      isEntity: true
    })
  }));
  
  console.log('📊 Year over Year Chart Data:');
  console.log('  Years:', years);
  console.log('  Datasets:', datasets);
  console.log('  Sample dataset data:', datasets[0]?.data);
  
  // Get entity type label for tooltip
  const entityLabel = entityType === 'agency' ? 'Agencies' : 
                     entityType === 'oem' ? 'OEMs' : 'Vendors';
  
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
          callbacks: {
            title: function(context) {
              const year = context[0].label;
              const total = yearTotals[year] || 0;
              return `FY${year}: ${formatCurrencyShort(total)}`;
            },
            label: function(context) {
              // Return empty - we'll use afterBody for detailed breakdown
              return '';
            },
            afterBody: function(context) {
              const year = context[0].label;
              const topEntities = topEntitiesByYear[year] || [];
              
              if (topEntities.length === 0) return [];
              
              const lines = [`───────────────`, `Top 5 ${entityLabel}:`];
              topEntities.forEach((entity, i) => {
                const valueStr = formatCurrencyShort(entity.value);
                const pctStr = entity.percentage.toFixed(1);
                lines.push(`${i + 1}. ${entity.name}: ${valueStr} (${pctStr}%)`);
              });
              
              return lines;
            }
          },
          displayColors: false,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          beginAtZero: true,
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
    // Store breakdown data for export
    breakdownByYear: topEntitiesByYear,
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
  const fiscalYearText = getFiscalYearRangeText(fiscalYearFilter);
  return {
    id: `${entityType}_${columnId}_area`,
    title: `${getColumnDisplayName(columnId)} - Area Chart${fiscalYearText}`,
    cardType: 'chart',
    chartType: 'line',
    chartData: {
      labels: entities.map(e => entityType === 'agency' ? abbreviateAgencyName(e.name) : e.name),
      datasets: [{
        label: getColumnDisplayName(columnId),
        data: entities.map(e => e.value),
        borderColor: '#144673', // Navy blue
        backgroundColor: '#144673', // Navy blue fill
        tension: 0.3,
        fill: true
      }]
    },
    chartOptions: {
      responsive: true,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('area', true)
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
 * Generate trend over time chart - MULTI-ENTITY VERSION
 * Shows fiscal years on X-axis with one colored line per entity (top N)
 * FIXED: Now properly respects topN filter
 */
function generateTrendOverTime(entityType, columnId, selectedEntities = [], topN = 10) {
  console.log(`📊 generateTrendOverTime: entityType=${entityType}, columnId=${columnId}, topN=${topN}`);
  
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
  
  // Calculate total obligations per entity (for sorting to get top N)
  const entityTotals = [];
  for (const [entityName, fyData] of Object.entries(entityData)) {
    const total = Object.values(fyData).reduce((sum, val) => sum + val, 0);
    entityTotals.push({ name: entityName, total: total, fyData: fyData });
  }
  
  // Sort by total and limit to topN
  entityTotals.sort((a, b) => b.total - a.total);
  
  // Apply topN limit - if null or undefined, use all; otherwise slice to topN
  const effectiveTopN = topN === null || topN === undefined ? entityTotals.length : topN;
  const topEntities = entityTotals.slice(0, effectiveTopN);
  
  console.log(`📊 generateTrendOverTime: Found ${entityTotals.length} entities with FY data, limiting to ${topEntities.length}`);
  
  if (topEntities.length === 0) return null;
  
  // Pre-calculate year totals and entity breakdowns for enhanced tooltips
  const yearTotals = {};
  const topEntitiesByYear = {};
  
  sortedFYs.forEach(fy => {
    let yearTotal = 0;
    const entitiesForYear = [];
    
    topEntities.forEach(entity => {
      const value = entity.fyData[fy] || 0;
      yearTotal += value;
      if (value > 0) {
        entitiesForYear.push({
          name: entityType === 'agency' ? abbreviateAgencyName(entity.name) : entity.name,
          value: value
        });
      }
    });
    
    yearTotals[fy] = yearTotal;
    
    // Sort and add percentages
    entitiesForYear.sort((a, b) => b.value - a.value);
    topEntitiesByYear[fy] = entitiesForYear.slice(0, 5).map(e => ({
      ...e,
      percentage: yearTotal > 0 ? (e.value / yearTotal * 100) : 0
    }));
  });
  
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
    const displayName = entityType === 'agency' ? abbreviateAgencyName(entity.name) : entity.name;
    const data = sortedFYs.map(fy => entity.fyData[fy] || 0);
    
    return {
      label: displayName,
      data: data,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length],
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    };
  });
  
  // Build table data showing each entity's trend
  const tableHeaders = ['Entity', ...sortedFYs.map(fy => `FY${fy}`), 'Total'];
  const tableRows = topEntities.map(entity => {
    const displayName = entityType === 'agency' ? abbreviateAgencyName(entity.name) : entity.name;
    const row = [displayName];
    
    // Add value for each fiscal year
    sortedFYs.forEach(fy => {
      const value = entity.fyData[fy] || 0;
      row.push(formatCurrency(value));
    });
    
    // Add total
    row.push(formatCurrency(entity.total));
    
    return row;
  });
  
  // Get entity type label for tooltip
  const entityLabel = entityType === 'agency' ? 'Agencies' : 
                     entityType === 'oem' ? 'OEMs' : 'Vendors';
  
  return {
    id: `${entityType}_${columnId}_vstackedbar`,
    title: `${getColumnDisplayName(columnId)} - Vertical Stacked View (FY ${sortedFYs[0]} - FY ${sortedFYs[sortedFYs.length - 1]})`,
    cardType: 'chart',
    chartType: 'bar',
    chartData: {
      labels: sortedFYs.map(fy => `FY${fy}`),
      datasets: datasets
    },
    chartOptions: {
      responsive: true,
      maintainAspectRatio: false,
      layout: getSharedLayoutConfig(),
      plugins: {
        legend: getSharedLegendConfig('stackedBar', true),
        legendExtra: {
          labels: {
            font: {
              size: 11
            }
          }
        },
        title: {
          display: true,
          text: `Top ${topEntities.length} ${entityLabel} - Fiscal Year Trends`
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              const fy = sortedFYs[context[0].dataIndex];
              const total = yearTotals[fy] || 0;
              return `FY${fy}: ${formatCurrencyShort(total)}`;
            },
            label: function(context) {
              // Return empty - we'll use afterBody for detailed breakdown
              return '';
            },
            afterBody: function(context) {
              const fy = sortedFYs[context[0].dataIndex];
              const breakdown = topEntitiesByYear[fy] || [];
              
              if (breakdown.length === 0) return [];
              
              const lines = [`───────────────`, `Top 5 ${entityLabel}:`];
              breakdown.forEach((entity, i) => {
                const valueStr = formatCurrencyShort(entity.value);
                const pctStr = entity.percentage.toFixed(1);
                lines.push(`${i + 1}. ${entity.name}: ${valueStr} (${pctStr}%)`);
              });
              
              return lines;
            }
          },
          displayColors: false,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
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
    // Store breakdown data for export
    breakdownByYear: topEntitiesByYear,
    tableData: {
      headers: tableHeaders,
      rows: tableRows
    }
  };
}

/**
 * Helper function to generate color gradient using new master system
 * @param {number} count - Number of colors needed
 * @returns {Array} Array of color hex codes
 */
function generateColorGradient(count) {
  // Use the new master color system
  return CHART_COLORS.entityPalette.slice(0, Math.min(count, CHART_COLORS.entityPalette.length));
}


/**
 * Legacy getCategoryColor function - now uses new master system
 * @param {string} category - Category name
 * @param {number} index - Index for fallback colors
 * @param {number} totalCount - Total count (unused but kept for compatibility)
 * @returns {string} Hex color code
 */
function getCategoryColor(category, index, totalCount) {
  // Use the new master color system
  return getChartColor({
    label: category,
    index: index,
    isEntity: false,
    columnId: 'legacy' // Legacy calls don't have columnId
  });
}

/**
 * Generate mixed view charts combining different perspectives
 */
function generateMixedViewCharts(entities, columnId, entityType, topN) {
  const charts = [];
  
  if (!entities || entities.length === 0) return charts;
  
  // 1. Overall distribution (existing breakdown)
  const breakdownCharts = generateColumnBreakdownCharts(entities, entityType, columnId, topN);
  if (breakdownCharts.length > 0) {
    charts.push(...breakdownCharts);
  }
  
  // 2. Entity-specific breakdown (new)
  const entityCharts = generateEntityBreakdownCharts(topN ? entities.slice(0, topN) : entities, entityType, columnId, topN);
  if (entityCharts.length > 0) {
    charts.push(...entityCharts);
  }
  
  // 3. Entity detail tables (new - like carousel tables)
  const maxForTables = topN ? Math.min(topN, 5) : 5;
  const entityDetailTables = generateEntityDetailTables(entities.slice(0, maxForTables), entityType, columnId, maxForTables);
  if (entityDetailTables.length > 0) {
    charts.push(...entityDetailTables);
  }
  
  // 4. Fiscal year comparison if available (new)
  const hasFiscalData = columnHasFiscalYearData(entities, columnId);
  if (hasFiscalData) {
    const fiscalChart = generateBreakdownFiscalTrend(entities, columnId, entityType, {});
    if (fiscalChart) {
      charts.push(fiscalChart);
    }
    
    // Add stacked fiscal comparison if useful
    const stackedFiscalChart = generateUniversalHorizontalStackedBar(entities, columnId, entityType, Math.min(topN || 5, 5));
    if (stackedFiscalChart) {
      charts.push(stackedFiscalChart);
    }
  }
  
  return charts;
}

/**
 * Check if an entity has fiscal year data for a column
 */
function entityHasFiscalYearData(entity, columnId) {
  if (entity.fiscal_year_obligations) return true;
  if (entity.obligations?.fiscal_year_obligations) return true;
  
  const columnData = entity[columnId];
  if (!columnData) return false;
  
  let jsonData = columnData;
  if (typeof jsonData === 'string') {
    try {
      jsonData = JSON.parse(jsonData);
    } catch(e) {
      return false;
    }
  }
  
  // Check for fiscal year patterns in the data
  const dataStr = JSON.stringify(jsonData).toLowerCase();
  return dataStr.includes('fiscal_year') || dataStr.includes('fy20') || dataStr.includes('20');
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
 * Generate detailed entity table cards similar to carousel tables
 * Shows comprehensive entity details with breakdown tables
 */
function generateEntityDetailTables(entities, entityType, columnId, topN = 10) {
  console.log(`📊 generateEntityDetailTables: ${entityType} / ${columnId} with ${entities.length} entities, topN: ${topN}`);
  
  if (!entities || entities.length === 0) {
    return [];
  }
  
  const cards = [];
  const topEntities = topN ? entities.slice(0, topN) : entities;
  
  topEntities.forEach((entity, index) => {
    const entityName = entity.name || entity.entityName;
    const entityValue = entity.value || entity.totalObligations || 0;
    
    if (!entityName || entityValue <= 0) return;
    
    // Create detailed table for this entity
    const tableCards = generateEntityDetailTable(entity, entityType, columnId, index);
    cards.push(...tableCards);
  });
  
  return cards;
}

/**
 * Generate detailed table for a single entity
 */
function generateEntityDetailTable(entity, entityType, columnId, index) {
  const entityName = entity.name || entity.entityName;
  const entityValue = entity.value || entity.totalObligations || 0;
  
  // Create comprehensive table structure based on entity type
  const tableRows = [];
  const tableHeaders = ['Category', 'Value', 'Percentage'];
  
  // Tier/Type breakdown
  if (entity.sumTier?.tier_summaries || entity.oneGovTier?.tier_breakdown) {
    const tierData = entity.sumTier?.tier_summaries || entity.oneGovTier?.tier_breakdown || {};
    Object.entries(tierData)
      .map(([tier, data]) => ({
        name: tier.replace('Tier ', 'TIER '),
        value: typeof data === 'object' ? (data.total || data.value || 0) : (data || 0)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .forEach(item => {
        const percentage = entityValue > 0 ? (item.value / entityValue * 100).toFixed(1) : '0.0';
        tableRows.push([
          `🎯 ${item.name}`,
          formatCurrency(item.value),
          `${percentage}%`
        ]);
      });
  }
  
  // Contract Vehicles
  if (entity.contractVehicle && typeof entity.contractVehicle === 'object') {
    let contractData = {};
    if (entity.contractVehicle.top_contract_summaries) {
      Object.entries(entity.contractVehicle.top_contract_summaries).forEach(([vehicle, data]) => {
        contractData[vehicle] = data.total || data.obligations || 0;
      });
    } else {
      Object.entries(entity.contractVehicle).forEach(([vehicle, data]) => {
        if (vehicle !== 'summary' && vehicle !== 'processed_date' && vehicle !== 'source_file') {
          contractData[vehicle] = typeof data === 'object' ? data.total || 0 : data || 0;
        }
      });
    }
    
    Object.entries(contractData)
      .filter(([vehicle, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([vehicle, amount]) => {
        const percentage = entityValue > 0 ? (amount / entityValue * 100).toFixed(1) : '0.0';
        tableRows.push([
          `📋 ${vehicle}`,
          formatCurrency(amount),
          `${percentage}%`
        ]);
      });
  }
  
  // Entity relationships based on entity type
  if (entityType === 'Agencies') {
    // Show OEMs
    if (entity.fasOem?.top_15_oem_summaries) {
      Object.entries(entity.fasOem.top_15_oem_summaries)
        .slice(0, 5)
        .forEach(([oemName, data]) => {
          const amount = typeof data === 'object' ? (data.total || data.amount || 0) : data || 0;
          if (amount > 0) {
            const percentage = entityValue > 0 ? (amount / entityValue * 100).toFixed(1) : '0.0';
            tableRows.push([
              `🏭 ${oemName}`,
              formatCurrency(amount),
              `${percentage}%`
            ]);
          }
        });
    }
    
    // Show Vendors  
    if (entity.resellers?.top_15_reseller_summaries) {
      Object.entries(entity.resellers.top_15_reseller_summaries)
        .slice(0, 5)
        .forEach(([vendorName, data]) => {
          const amount = typeof data === 'object' ? (data.total || data.amount || 0) : data || 0;
          if (amount > 0) {
            const percentage = entityValue > 0 ? (amount / entityValue * 100).toFixed(1) : '0.0';
            tableRows.push([
              `🏪 ${vendorName}`,
              formatCurrency(amount),
              `${percentage}%`
            ]);
          }
        });
    }
    
  } else if (entityType === 'OEMs') {
    // Show Agencies
    if (entity.fundingAgency?.top_10_agency_summaries) {
      Object.entries(entity.fundingAgency.top_10_agency_summaries)
        .slice(0, 5)
        .forEach(([agencyName, data]) => {
          const amount = typeof data === 'object' ? (data.total || 0) : data || 0;
          if (amount > 0) {
            const abbrev = abbreviateAgencyName(agencyName);
            const percentage = entityValue > 0 ? (amount / entityValue * 100).toFixed(1) : '0.0';
            tableRows.push([
              `🏛️ ${abbrev}`,
              formatCurrency(amount),
              `${percentage}%`
            ]);
          }
        });
    }
    
    // Show Vendors
    if (entity.resellers?.top_15_reseller_summaries) {
      Object.entries(entity.resellers.top_15_reseller_summaries)
        .slice(0, 5)
        .forEach(([vendorName, data]) => {
          const amount = typeof data === 'object' ? (data.total || data.amount || 0) : data || 0;
          if (amount > 0) {
            const percentage = entityValue > 0 ? (amount / entityValue * 100).toFixed(1) : '0.0';
            tableRows.push([
              `🏪 ${vendorName}`,
              formatCurrency(amount),
              `${percentage}%`
            ]);
          }
        });
    }
    
  } else if (entityType === 'Vendors') {
    // Show Agencies
    if (entity.fundingAgency?.top_10_agency_summaries) {
      Object.entries(entity.fundingAgency.top_10_agency_summaries)
        .slice(0, 5)
        .forEach(([agencyName, data]) => {
          const amount = typeof data === 'object' ? (data.total || 0) : data || 0;
          if (amount > 0) {
            const abbrev = abbreviateAgencyName(agencyName);
            const percentage = entityValue > 0 ? (amount / entityValue * 100).toFixed(1) : '0.0';
            tableRows.push([
              `🏛️ ${abbrev}`,
              formatCurrency(amount),
              `${percentage}%`
            ]);
          }
        });
    }
    
    // Show OEMs
    if (entity.fasOem?.top_15_oem_summaries) {
      Object.entries(entity.fasOem.top_15_oem_summaries)
        .slice(0, 5)
        .forEach(([oemName, data]) => {
          const amount = typeof data === 'object' ? (data.total || data.amount || 0) : data || 0;
          if (amount > 0) {
            const percentage = entityValue > 0 ? (amount / entityValue * 100).toFixed(1) : '0.0';
            tableRows.push([
              `🏭 ${oemName}`,
              formatCurrency(amount),
              `${percentage}%`
            ]);
          }
        });
    }
  }
  
  // Fiscal Year breakdown
  if (entity.obligations && typeof entity.obligations === 'object') {
    const obligations = typeof entity.obligations === 'string' ? 
                      JSON.parse(entity.obligations) : entity.obligations;
    if (obligations.fiscal_year_obligations) {
      Object.entries(obligations.fiscal_year_obligations)
        .sort((a, b) => b[0].localeCompare(a[0])) // Sort by year descending
        .slice(0, 5)
        .forEach(([year, amount]) => {
          const percentage = entityValue > 0 ? (amount / entityValue * 100).toFixed(1) : '0.0';
          tableRows.push([
            `📅 FY ${year}`,
            formatCurrency(amount),
            `${percentage}%`
          ]);
        });
    }
  }
  
  // AI Products
  if (entity.aiProduct && typeof entity.aiProduct === 'object') {
    let aiProductData = {};
    if (entity.aiProduct.fiscal_year_summaries) {
      Object.values(entity.aiProduct.fiscal_year_summaries).forEach(yearData => {
        if (yearData.product_summaries) {
          Object.entries(yearData.product_summaries).forEach(([productName, data]) => {
            const value = data.total_obligations || data.total || 0;
            aiProductData[productName] = (aiProductData[productName] || 0) + value;
          });
        }
      });
    }
    
    Object.entries(aiProductData)
      .filter(([product, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([product, amount]) => {
        const percentage = entityValue > 0 ? (amount / entityValue * 100).toFixed(1) : '0.0';
        tableRows.push([
          `🤖 ${product}`,
          formatCurrency(amount),
          `${percentage}%`
        ]);
      });
  }
  
  // Small Business breakdown
  if (entity.smallBusiness?.business_size_summaries) {
    Object.entries(entity.smallBusiness.business_size_summaries).forEach(([type, data]) => {
      const amount = data.total || 0;
      if (amount > 0) {
        const cleanType = type === 'SMALL BUSINESS' ? 'Small Business' : 
                         type === 'LARGE BUSINESS' ? 'Large Business' :
                         type === 'OTHER THAN SMALL BUSINESS' ? 'Large Business' : type;
        const percentage = entityValue > 0 ? (amount / entityValue * 100).toFixed(1) : '0.0';
        tableRows.push([
          `🏢 ${cleanType}`,
          formatCurrency(amount),
          `${percentage}%`
        ]);
      }
    });
  }
  
  // If no rows, return empty
  if (tableRows.length === 0) {
    return [];
  }
  
  // Create the table card
  const abbreviatedName = entityType === 'Agencies' ? abbreviateAgencyName(entityName) : entityName;
  const maxNameLength = 25;
  const displayName = abbreviatedName.length > maxNameLength ? 
    abbreviatedName.substring(0, maxNameLength) + '...' : abbreviatedName;
  
  return [{
    id: `${entityType}_${columnId}_entityDetail_${index}`,
    title: `📊 ${displayName} - Detailed Breakdown`,
    subtitle: `Total: ${formatCurrency(entityValue)} • ${tableRows.length} Categories`,
    cardType: 'table',
    tableData: {
      headers: tableHeaders,
      rows: tableRows.slice(0, 15) // Limit to 15 rows for readability
    },
    metadata: {
      entityName: entityName,
      entityValue: entityValue,
      entityIndex: index,
      columnId: columnId,
      entityType: entityType
    }
  }];
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