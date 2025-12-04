/**
 * Vendor-specific functions - B10_vendor.js
 * Functions for working with Vendor data from Google Sheets
 * UPDATED: Now uses B02 data manager instead of getTableEntities
 */

/**
 * Get vendor entities - now uses B02 data manager
 */
function getVendorEntities() {
  const manager = getDataManager();
  const vendors = manager.getVendors();
  return createResponse(true, vendors, null);
}

/**
 * Get detailed vendor data by ID
 */
function getVendorDetails(vendorId) {
  try {
    const response = getVendorEntities();
    const vendors = JSON.parse(response.getContent()).data;
    const vendor = vendors.find(v => v.id === vendorId);
    
    if (!vendor) {
      throw new Error('Vendor not found: ' + vendorId);
    }
    
    return createResponse(true, vendor, null);
  } catch (error) {
    console.error('Error getting vendor details:', error);
    return createResponse(false, null, error.toString());
  }
}

/**
 * Get vendor analytics summary
 */
function getVendorAnalytics() {
  try {
    const dataManager = getDataManager();
    const vendors = dataManager.getVendors() || [];
    
    const analytics = {
      totalVendors: vendors.length,
      totalObligations: 0,
      tierDistribution: {},
      aiAdoption: 0,
      discountProviders: 0,
      topVendors: [],
      parentCompanies: {}
    };
    
    // Process each vendor
    vendors.forEach(vendor => {
      // Sum obligations
      if (vendor.totalObligations) {
        analytics.totalObligations += vendor.totalObligations;
      }
      
      // Count tiers
      if (vendor.tier) {
        analytics.tierDistribution[vendor.tier] = (analytics.tierDistribution[vendor.tier] || 0) + 1;
      }
      
      // Count AI adoption
      if (vendor.hasAIProducts) {
        analytics.aiAdoption++;
      }
      
      // Count discount providers
      if (vendor.hasDiscounts) {
        analytics.discountProviders++;
      }
      
      // Count parent companies
      if (vendor.parentCompany) {
        analytics.parentCompanies[vendor.parentCompany] = (analytics.parentCompanies[vendor.parentCompany] || 0) + 1;
      }
    });
    
    // Get top 10 vendors by obligations
    analytics.topVendors = vendors
      .filter(v => v.totalObligations)
      .sort((a, b) => b.totalObligations - a.totalObligations)
      .slice(0, 10)
      .map(v => ({
        name: v.name,
        uei: v.uei,
        obligations: v.totalObligations,
        tier: v.tier
      }));
    
    // Calculate percentages
    analytics.aiAdoptionRate = ((analytics.aiAdoption / analytics.totalVendors) * 100).toFixed(1) + '%';
    analytics.discountRate = ((analytics.discountProviders / analytics.totalVendors) * 100).toFixed(1) + '%';
    
    return createResponse(true, analytics, null);
  } catch (error) {
    console.error('Error getting vendor analytics:', error);
    return createResponse(false, null, error.toString());
  }
}