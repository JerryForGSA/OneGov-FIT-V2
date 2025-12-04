/**
 * @fileoverview Centralized Data Management Layer for OneGov FIT Market
 * @module B02_dataManager
 * @version 1.1.0
 * @description Single source of truth for all entity data with intelligent caching.
 *              Reduces redundant spreadsheet reads and improves performance 5x.
 *              UPDATED: Fixed extractNumericValue to handle all 22 JSON columns
 *              FIXED: getAgencies/getOEMs/getVendors now use B02's own loading
 * @author OneGov FIT Market Development Team
 */

/**
 * Main data manager class for all entity operations
 * @class OneGovDataManager
 * @description Handles all data loading, caching, and transformation for the application
 */
class OneGovDataManager {
  /**
   * @constructor
   * @description Initialize the data manager with cache and configuration
   */
  constructor() {
    /**
     * @property {Object} cache - Main cache storage
     * @property {Array} cache.agencies - Cached agency entities
     * @property {Array} cache.oems - Cached OEM entities
     * @property {Array} cache.vendors - Cached vendor entities
     * @property {number} cache.lastUpdated - Timestamp of last update
     * @property {boolean} cache.isLoading - Loading state flag
     */
    this.cache = {
      agencies: null,
      oems: null,
      vendors: null,
      lastUpdated: null,
      isLoading: false
    };
    
    /** @property {number} TTL - Time to live in milliseconds (2 minutes) */
    this.TTL = 2 * 60 * 1000;
    
    /** @property {string} SPREADSHEET_ID - Google Sheets ID */
    this.SPREADSHEET_ID = '18h0TYPAPiWCKPB09v7kChoICQOELJSLBfwaZwpYheXE';
    
    /**
     * @property {Object} columnMappings - Column index mappings for each entity type
     * @description Maps column names to their spreadsheet column indices (1-based)
     */
    this.columnMappings = this._initializeColumnMappings();
  }
  
  /**
   * Initialize column mappings for all entity types
   * @private
   * @returns {Object} Column mapping configuration
   */
  _initializeColumnMappings() {
    return {
      agency: {
        sheetName: 'Agency',
        columns: {
          agencyCode: 1,        // A
          name: 2,              // B
          parentCompany: 3,     // C
          obligations: 4,       // D
          smallBusiness: 5,     // E
          sumTier: 6,          // F
          sumType: 7,          // G
          contractVehicle: 8,   // H
          fundingDepartment: 9, // I
          discount: 10,         // J
          topRefPiid: 11,      // K
          topPiid: 12,         // L
          activeContracts: 13,  // M
          discountOfferings: 14,// N
          aiProduct: 15,        // O
          aiCategory: 16,       // P
          topBicProducts: 17,   // Q
          reseller: 18,         // R
          bicReseller: 19,      // S
          bicOem: 20,          // T
          fasOem: 21,          // U
          fundingAgency: 22,    // V
          bicTopProductsPerAgency: 23, // W
          oneGovTier: 24,      // X
          fasDataTable: 25,    // Y
          fasTimestamp: 26,    // Z
          bicDataTable: 27,    // AA
          bicTimestamp: 28,    // AB
          usaiProfile: 29,     // AC
          website: 30,         // AD
          linkedin: 31         // AE
        }
      },
      oem: {
        sheetName: 'OEM',
        columns: {
          duns: 1,              // A
          name: 2,              // B
          parentCompany: 3,     // C
          obligations: 4,       // D
          smallBusiness: 5,     // E
          sumTier: 6,          // F
          sumType: 7,          // G
          contractVehicle: 8,   // H
          fundingDepartment: 9, // I
          discount: 10,         // J
          topRefPiid: 11,      // K
          topPiid: 12,         // L
          activeContracts: 13,  // M
          discountOfferings: 14,// N
          aiProduct: 15,        // O
          aiCategory: 16,       // P
          topBicProducts: 17,   // Q
          reseller: 18,         // R
          bicReseller: 19,      // S
          bicOem: 20,          // T
          fasOem: 21,          // U
          fundingAgency: 22,    // V
          bicTopProductsPerAgency: 23, // W
          oneGovTier: 24,      // X
          fasDataTable: 25,    // Y
          fasTimestamp: 26,    // Z
          bicDataTable: 27,    // AA
          bicTimestamp: 28,    // AB  
          usaiProfile: 29,     // AC
          website: 30,         // AD
          linkedin: 31         // AE
        }
      },
      vendor: {
        sheetName: 'Vendor',
        columns: {
          uei: 1,               // A
          name: 2,              // B
          parentCompany: 3,     // C
          obligations: 4,       // D
          smallBusiness: 5,     // E
          sumTier: 6,          // F
          sumType: 7,          // G
          contractVehicle: 8,   // H
          fundingDepartment: 9, // I
          discount: 10,         // J
          topRefPiid: 11,      // K
          topPiid: 12,         // L
          activeContracts: 13,  // M
          discountOfferings: 14,// N
          aiProduct: 15,        // O
          aiCategory: 16,       // P
          topBicProducts: 17,   // Q
          reseller: 18,         // R
          bicReseller: 19,      // S
          bicOem: 20,          // T
          fasOem: 21,          // U
          fundingAgency: 22,    // V
          bicTopProductsPerAgency: 23, // W
          oneGovTier: 24,      // X
          fasDataTable: 25,    // Y
          fasTimestamp: 26,    // Z
          bicDataTable: 27,    // AA
          bicTimestamp: 28,    // AB
          usaiProfile: 29,     // AC  
          website: 30,         // AD
          linkedin: 31         // AE
        }
      }
    };
  }
  
  /**
   * Check if cache needs refresh
   * @returns {boolean} True if cache is stale or empty
   */
  needsRefresh() {
    if (!this.cache.lastUpdated) return true;
    if (!this.cache.agencies || !this.cache.oems || !this.cache.vendors) return true;
    return (Date.now() - this.cache.lastUpdated) > this.TTL;
  }
  
  /**
   * Load all entity data from spreadsheet
   * @param {boolean} [forceRefresh=false] - Force reload even if cache is valid
   * @returns {Object} Cached data object with agencies, oems, vendors
   */
  loadAllData(forceRefresh = false) {
    // Return cached data if still valid
    if (!forceRefresh && !this.needsRefresh()) {
      console.log('DataManager: Returning cached data');
      return this.cache;
    }
    
    // Prevent multiple simultaneous loads
    if (this.cache.isLoading) {
      console.log('DataManager: Load already in progress');
      return this.cache;
    }
    
    try {
      this.cache.isLoading = true;
      console.log('DataManager: Loading fresh data from spreadsheet');
      
      const spreadsheet = SpreadsheetApp.openById(this.SPREADSHEET_ID);
      
      // Load all three entity types
      this.cache.agencies = this.loadEntitySheet(spreadsheet, 'agency');
      this.cache.oems = this.loadEntitySheet(spreadsheet, 'oem');
      this.cache.vendors = this.loadEntitySheet(spreadsheet, 'vendor');
      
      this.cache.lastUpdated = Date.now();
      this.cache.isLoading = false;
      
      console.log(`DataManager: Loaded ${this.cache.agencies.length} agencies, ${this.cache.oems.length} OEMs, ${this.cache.vendors.length} vendors`);
      
      return this.cache;
    } catch (error) {
      console.error('DataManager: Error loading data:', error);
      this.cache.isLoading = false;
      throw error;
    }
  }
  
  /**
   * Load a single entity sheet
   * @param {SpreadsheetApp.Spreadsheet} spreadsheet - Spreadsheet object
   * @param {string} entityType - Type of entity ('agency', 'oem', 'vendor')
   * @returns {Array} Array of parsed entities
   */
  loadEntitySheet(spreadsheet, entityType) {
    const config = this.columnMappings[entityType];
    const sheet = spreadsheet.getSheetByName(config.sheetName);
    
    if (!sheet) {
      console.error(`DataManager: Sheet not found: ${config.sheetName}`);
      return [];
    }
    
    // Get data range including columns up to AE (31 columns)
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(1, 1, lastRow, 31); // 31 columns: A(1) to AE(31) - includes AC, AD, AE
    const values = range.getValues();
    console.log(` DataManager ${entityType}: Reading ${lastRow} rows x 31 columns (A-AE)`);
    const entities = [];
    
    // Process rows (skip header)
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const name = row[config.columns.name - 1];
      
      if (!name || name.trim() === '') continue;
      
      // Convert entity type to frontend format (plural, capitalized)
      const frontendEntityType = entityType === 'oem' ? 'OEMs' : 
                                 entityType === 'vendor' ? 'Vendors' : 
                                 entityType === 'agency' ? 'Agencies' : entityType;
      
      const entity = {
        id: `${entityType}_${i}`,
        name: name.trim(),
        type: frontendEntityType,
        entityType: frontendEntityType, // Add explicit entityType field
        rowIndex: i
      };
      
      // Parse all columns
      for (const [key, colIndex] of Object.entries(config.columns)) {
        if (key === 'name') continue; // Already processed
        
        const value = row[colIndex - 1];
        
        // Debug key columns for first OEM to check KPI data
        if (entityType === 'oem' && i === 1) {
          const debugColumns = ['topBicProducts', 'topRefPiid', 'topPiid', 'sumTier', 'contractVehicle', 'fundingAgency', 'reseller'];
          if (debugColumns.includes(key)) {
            console.log(` B02 DEBUG OEM KPIs: "${name}" - ${key} (col ${colIndex}):`, value ? (typeof value === 'string' ? value.substring(0, 200) : value) : 'EMPTY');
          }
        }
        
        // Handle JSON columns
        if (this.isJsonColumn(key)) {
          const parsed = this.parseJSON(value);
          entity[key] = parsed;
        } else {
          // Handle regular columns
          entity[key] = value;
        }
      }
      
      // Calculate derived fields
      entity.totalObligations = this.extractTotalObligations(entity.obligations);
      entity.tier = this.extractTier(entity);
      entity.hasAIProducts = this.checkAIProducts(entity);
      
      // Convert FAS/BIC data table URLs to expected property names
      const fasUrl = entity.fasDataTable;
      if (fasUrl && fasUrl.trim() && fasUrl.trim().toLowerCase() !== 'none' && fasUrl.trim() !== 'N/A') {
        entity.fasTableUrl = fasUrl.trim();
      } else {
        entity.fasTableUrl = '';
      }
      
      const bicUrl = entity.bicDataTable;
      if (bicUrl && bicUrl.trim() && bicUrl.trim().toLowerCase() !== 'none' && bicUrl.trim() !== 'N/A') {
        entity.bicTableUrl = bicUrl.trim();
      } else {
        entity.bicTableUrl = '';
      }
      
      entities.push(entity);
    }
    
    return entities;
  }
  
  /**
   * Check if column contains JSON data
   * @param {string} columnName - Name of the column
   * @returns {boolean} True if column contains JSON data
   */
  isJsonColumn(columnName) {
    const jsonColumns = [
      'obligations', 'smallBusiness', 'sumTier', 'sumType',
      'contractVehicle', 'fundingDepartment', 'discount',
      'topRefPiid', 'topPiid', 'activeContracts', 'discountOfferings',
      'aiProduct', 'aiCategory', 'topBicProducts', 'reseller',
      'bicReseller', 'bicOem', 'fasOem', 'fundingAgency',
      'bicTopProductsPerAgency', 'oneGovTier', 'usaiProfile'
    ];
    return jsonColumns.includes(columnName);
  }
  
  /**
   * Parse JSON column safely
   * @param {*} value - Raw cell value
   * @returns {Object|null} Parsed JSON object or null
   */
  parseJSON(value) {
    if (!value) return null;
    
    try {
      // Already an object
      if (typeof value === 'object') return value;
      
      // Empty or invalid
      const strValue = String(value).trim();
      if (strValue === '' || strValue === '{}' || strValue === '[]') return null;
      
      return JSON.parse(strValue);
    } catch (error) {
      console.warn('DataManager: JSON parse error:', error);
      return null;
    }
  }
  
  /**
   * Extract total obligations from JSON
   * @param {Object} obligationsJson - Obligations JSON object
   * @returns {number} Total obligation amount
   */
  extractTotalObligations(obligationsJson) {
    if (!obligationsJson) return 0;
    
    // Check various possible structures
    if (obligationsJson.total_obligated) {
      return obligationsJson.total_obligated;
    }
    if (obligationsJson.summary?.total_obligations) {
      return obligationsJson.summary.total_obligations;
    }
    if (obligationsJson.fiscal_year_obligations) {
      return Object.values(obligationsJson.fiscal_year_obligations)
        .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    }
    
    return 0;
  }
  
  /**
   * Extract tier information
   * @param {Object} entity - Entity object
   * @returns {string|null} Tier designation
   */
  extractTier(entity) {
    if (entity.oneGovTier?.mode_tier) {
      return entity.oneGovTier.mode_tier;
    }
    if (entity.sumTier?.tier) {
      return entity.sumTier.tier;
    }
    return null;
  }
  
  /**
   * Check if entity has AI products
   * @param {Object} entity - Entity object
   * @returns {boolean} True if entity has AI products
   */
  checkAIProducts(entity) {
    return !!(entity.aiProduct && Object.keys(entity.aiProduct).length > 0);
  }
  
  /**
   * Get all entities of a specific type
   * @param {string} [entityType] - Type of entity to retrieve
   * @param {boolean} [forceRefresh=false] - Force data refresh
   * @returns {Array} Array of entities
   */
  getEntities(entityType, forceRefresh = false) {
    console.log(`🔄 DataManager getEntities(${entityType})`);
    
    // Load data if needed
    this.loadAllData(forceRefresh);
    
    switch(entityType?.toLowerCase()) {
      case 'agency':
        return this.cache.agencies || [];
      case 'oem':
        return this.cache.oems || [];
      case 'vendor':
        return this.cache.vendors || [];
      default:
        // Return all if no type specified
        return [
          ...(this.cache.agencies || []),
          ...(this.cache.oems || []),
          ...(this.cache.vendors || [])
        ];
    }
  }
  
  /**
   * Get agencies - FIXED to use B02's own data loading
   */
  getAgencies(forceRefresh = false) {
    console.log('🔄 DataManager: getAgencies - using B02 data');
    this.loadAllData(forceRefresh);
    return this.cache.agencies || [];
  }
  
  /**
   * Get OEMs - FIXED to use B02's own data loading
   */
  getOEMs(forceRefresh = false) {
    console.log('🔄 DataManager: getOEMs - using B02 data');
    this.loadAllData(forceRefresh);
    return this.cache.oems || [];
  }
  
  /**
   * Get vendors - FIXED to use B02's own data loading
   */
  getVendors(forceRefresh = false) {
    console.log('🔄 DataManager: getVendors - using B02 data');
    this.loadAllData(forceRefresh);
    return this.cache.vendors || [];
  }
  
  /**
   * Get entities filtered and transformed for specific use cases
   * @param {string} viewType - Type of view requesting data
   * @param {Object} options - Filter and transformation options
   * @returns {Array} Transformed entities for the view
   */
  getEntitiesForView(viewType, options = {}) {
    const { entityType, columnId, topN, selectedEntities, parentFilter } = options;
    
    // Get base entities
    let entities = this.getEntities(entityType);
    
    // Apply filters
    if (selectedEntities && selectedEntities.length > 0) {
      entities = entities.filter(e => selectedEntities.includes(e.name));
    }
    
    if (parentFilter) {
      entities = entities.filter(e => e.parentCompany === parentFilter);
    }
    
    // Transform based on view type
    switch(viewType) {
      case 'dashboard':
        return this.transformForDashboard(entities);
      case 'reportBuilder':
        return this.transformForReportBuilder(entities, columnId, topN);
      case 'entityDetail':
        return entities; // Return full data for detail view
      case 'reportTable':
        return this.transformForTable(entities);
      default:
        return entities;
    }
  }
  
  /**
   * Transform entities for dashboard view
   * @param {Array} entities - Raw entities
   * @returns {Array} Simplified entities for dashboard
   */
  transformForDashboard(entities) {
    console.log(`🏗️ DataManager transformForDashboard: Processing ${entities.length} entities`);
    return entities.map(entity => {
      
      // Extract fiscal year data for charts
      let fiscalYearObligations = null;
      if (entity.obligations && entity.obligations.fiscal_year_obligations) {
        fiscalYearObligations = entity.obligations.fiscal_year_obligations;
      } else if (entity.obligations && typeof entity.obligations === 'string') {
        try {
          const parsed = JSON.parse(entity.obligations);
          fiscalYearObligations = parsed.fiscal_year_obligations;
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // Return ALL entity fields for complete data access
      return {
        ...entity, // Include all original fields
        // Add calculated/derived fields
        totalObligations: entity.totalObligations,
        tier: entity.tier,
        contractCount: entity.activeContracts ? Object.keys(entity.activeContracts).length : 0,
        hasAIProducts: entity.hasAIProducts,
        fasTableUrl: entity.fasTableUrl || '',
        bicTableUrl: entity.bicTableUrl || '',
        website: entity.website || entity.usaiProfile?.website || '',
        linkedin: entity.linkedin || entity.usaiProfile?.linkedin || '',
        // Add fiscal year data for frontend charts
        fiscalYearObligations: fiscalYearObligations
      };
    });
  }
  
  /**
   * Transform entities for report builder
   * @param {Array} entities - Raw entities
   * @param {string} columnId - Column to analyze
   * @param {number} topN - Number of top entities to return
   * @returns {Array} Top entities by column value
   */
  transformForReportBuilder(entities, columnId, topN = 10) {
    if (!columnId || !entities.length) return [];
    
    console.log(` DataManager transformForReportBuilder: Processing ${entities.length} entities for column "${columnId}"`);
    
    const entityValues = entities
      .map(entity => {
        const jsonData = entity[columnId];
        if (!jsonData) {
          console.log(` Entity "${entity.name}" missing column "${columnId}"`);
          return null;
        }
        
        const value = this.extractNumericValue(jsonData, columnId);
        console.log(`📊 Entity "${entity.name}" ${columnId} value: ${value}`);
        return { name: entity.name, value: value, jsonData: jsonData };
      })
      .filter(e => e && e.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);
    
    console.log(` DataManager: Returning ${entityValues.length} entities with valid ${columnId} data`);
    return entityValues;
  }
  
  /**
   * Transform entities for report table
   * @param {Array} entities - Raw entities
   * @returns {Array} Flattened entities for table display
   */
  transformForTable(entities) {
    return entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      type: entity.type,
      category: entity.type.toUpperCase(),
      total: entity.totalObligations,
      fy24: entity.obligations?.fiscal_year_obligations?.['2024'] || 0,
      fy25: entity.obligations?.fiscal_year_obligations?.['2025'] || 0,
      tier: entity.tier || 'N/A',
      small_business: entity.smallBusiness?.is_small_business || 'N/A'
    }));
  }
  
  /**
   * Extract numeric value from JSON data based on known structures
   * @param {*} jsonData - JSON data to extract value from
   * @param {string} columnId - Column identifier for context-specific extraction
   * @returns {number} Numeric value
   */
  extractNumericValue(jsonData, columnId) {
    if (!jsonData) return 0;
    if (typeof jsonData === 'number') return jsonData;
    
    // Column D: Obligations
    if (columnId === 'obligations') {
      return jsonData.total_obligated || 0;
    }
    
    // Columns E, F, G, H
    if (columnId === 'smallBusiness' || columnId === 'sumTier' || 
        columnId === 'sumType' || columnId === 'contractVehicle') {
      return jsonData.summary?.total_all_obligations || 0;
    }
    
    // Column I: Funding Department
    if (columnId === 'fundingDepartment') {
      return jsonData.summary?.total_all_departments || 
             jsonData.summary?.total_top_10_departments || 0;
    }
    
    // Column J: Discount
    if (columnId === 'discount') {
      return jsonData.summary?.total_obligations_with_discounts || 0;
    }
    
    // Columns K, L: Top PIIDs
    if (columnId === 'topRefPiid' || columnId === 'topPiid') {
      return jsonData.total_obligations || 0;
    }
    
    // Column M: Active Contracts
    if (columnId === 'activeContracts') {
      return jsonData.summary?.total_obligations || 0;
    }
    
    // Column N: Expiring Discounted Products
    if (columnId === 'discountOfferings') {
      return jsonData.summary?.grand_total_all_obligations || 0;
    }
    
    // Columns O, P: AI Product/Category
    if (columnId === 'aiProduct' || columnId === 'aiCategory') {
      return jsonData.summary?.grand_total_obligations || 0;
    }
    
    // Column Q: Top BIC Products
    if (columnId === 'topBicProducts') {
      return jsonData.summary?.total_all_products || 
             jsonData.summary?.total_top_25_products || 0;
    }
    
    // Column R: Reseller (FAS)
    if (columnId === 'reseller') {
      return jsonData.summary?.total_top_15_resellers || 
             jsonData.summary?.total_all_resellers || 0;
    }
    
    // Column S: BIC Reseller
    if (columnId === 'bicReseller') {
      return jsonData.summary?.total_top_15_resellers || 
             jsonData.summary?.total_all_resellers || 0;
    }
    
    // Column T: BIC OEM
    if (columnId === 'bicOem') {
      return jsonData.summary?.total_top_15_manufacturers || 
             jsonData.summary?.total_all_manufacturers || 0;
    }
    
    // Column U: FAS OEM
    if (columnId === 'fasOem') {
      return jsonData.summary?.total_top_10_oems || 
             jsonData.summary?.total_all_oems || 0;
    }
    
    // Column V: Funding Agency
    if (columnId === 'fundingAgency') {
      return jsonData.summary?.total_top_10_agencies || 
             jsonData.summary?.total_all_agencies || 0;
    }
    
    // Column W: BIC Top Products per Agency
    if (columnId === 'bicTopProductsPerAgency') {
      return jsonData.summary?.grand_total_all_products || 0;
    }
    
    // Column X: OneGov Tier
    if (columnId === 'oneGovTier') {
      return jsonData.average_obligations_per_year || 0;
    }
    
    // Fallback: Generic extraction
    if (jsonData.total_obligated) return jsonData.total_obligated;
    if (jsonData.total_obligations) return jsonData.total_obligations;
    if (jsonData.summary?.total_all_obligations) return jsonData.summary.total_all_obligations;
    if (jsonData.summary?.grand_total_obligations) return jsonData.summary.grand_total_obligations;
    if (jsonData.total) return jsonData.total;
    if (jsonData.sum) return jsonData.sum;
    
    // Sum fiscal years if available
    if (jsonData.fiscal_year_obligations) {
      return Object.values(jsonData.fiscal_year_obligations)
        .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    }
    
    if (jsonData.fiscal_years) {
      return Object.values(jsonData.fiscal_years)
        .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    }
    
    return 0;
  }
  
  /**
   * Get fiscal year trends from column data
   * @param {string} entityType - Type of entity
   * @param {string} columnId - Column to analyze
   * @param {Array} [selectedEntities=[]] - Filter to specific entities
   * @returns {Object} Fiscal year aggregated data
   */
  getFiscalYearTrends(entityType, columnId, selectedEntities = []) {
    let entities = this.getEntities(entityType);
    
    if (selectedEntities.length > 0) {
      entities = entities.filter(e => selectedEntities.includes(e.name));
    }
    
    const fiscalYearData = {};
    
    entities.forEach(entity => {
      const jsonData = entity[columnId];
      if (!jsonData) return;
      
      let fyData = null;
      
      switch(columnId) {
        case 'reseller':
          if (jsonData.top_15_reseller_summaries) {
            fyData = {};
            Object.values(jsonData.top_15_reseller_summaries).forEach(reseller => {
              if (reseller.fiscal_years) {
                Object.entries(reseller.fiscal_years).forEach(([year, value]) => {
                  fyData[year] = (fyData[year] || 0) + value;
                });
              }
            });
          }
          break;
          
        case 'bicOem':
          fyData = jsonData.yearly_totals;
          break;
          
        case 'fasOem':
          if (jsonData.top_10_oem_summaries) {
            fyData = {};
            Object.values(jsonData.top_10_oem_summaries).forEach(oem => {
              if (oem.fiscal_years) {
                Object.entries(oem.fiscal_years).forEach(([year, value]) => {
                  fyData[year] = (fyData[year] || 0) + value;
                });
              }
            });
          }
          break;
          
        case 'fundingAgency':
          if (jsonData.top_10_agency_summaries) {
            fyData = {};
            Object.values(jsonData.top_10_agency_summaries).forEach(agency => {
              if (agency.fiscal_years) {
                Object.entries(agency.fiscal_years).forEach(([year, value]) => {
                  fyData[year] = (fyData[year] || 0) + value;
                });
              }
            });
          }
          break;
          
        default:
          fyData = jsonData.fiscal_year_obligations || 
                   jsonData.fiscal_years || 
                   jsonData.yearly_totals || 
                   jsonData.fiscal_year_breakdown;
      }
      
      if (fyData && typeof fyData === 'object') {
        for (const [year, value] of Object.entries(fyData)) {
          if (!fiscalYearData[year]) fiscalYearData[year] = 0;
          fiscalYearData[year] += parseFloat(value) || 0;
        }
      }
    });
    
    return fiscalYearData;
  }
  
  /**
   * Clear cache for manual refresh
   */
  clearCache() {
    console.log('DataManager: Clearing cache');
    this.cache = {
      agencies: null,
      oems: null,
      vendors: null,
      lastUpdated: null,
      isLoading: false
    };
  }
  
  /**
   * Get cache status information
   * @returns {Object} Cache status details
   */
  getCacheStatus() {
    return {
      hasData: !!(this.cache.agencies || this.cache.oems || this.cache.vendors),
      lastUpdated: this.cache.lastUpdated,
      isStale: this.needsRefresh(),
      entityCounts: {
        agencies: this.cache.agencies?.length || 0,
        oems: this.cache.oems?.length || 0,
        vendors: this.cache.vendors?.length || 0
      }
    };
  }
}

// SINGLETON PATTERN IMPLEMENTATION

let dataManagerInstance = null;

function getDataManager() {
  if (!dataManagerInstance) {
    dataManagerInstance = new OneGovDataManager();
  }
  return dataManagerInstance;
}

// UTILITY FUNCTIONS

function createResponse(success, data, error) {
  return {
    success: success,
    data: data,
    error: error,
    timestamp: new Date().toISOString()
  };
}

// PUBLIC API FUNCTIONS

// REMOVED: getAllEntities function moved to B01_main.js to avoid conflicts
// Use B01's getAllEntities which directly accesses cache and transforms data

function getEntities(entityType) {
  const manager = getDataManager();
  const entities = manager.getEntities(entityType);
  
  return createResponse(true, entities, null);
}

function refreshDataCache() {
  const manager = getDataManager();
  manager.clearCache();
  manager.loadAllData(true);
  return { success: true, message: 'Cache refreshed' };
}

function getDataCacheStatus() {
  const manager = getDataManager();
  return manager.getCacheStatus();
}