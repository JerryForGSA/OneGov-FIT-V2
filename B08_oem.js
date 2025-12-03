/**
 * OEM-specific functions - B08_oem.js
 * Functions for working with OEM data from Google Sheets
 * NOTE: getTableEntities function moved to B05_simpleCompatible.js for shared access
 */

/**
 * Get OEM entities (wrapper for getTableEntities)
 */
function getOEMEntities() {
  return getTableEntities('OEM');
}

/**
 * Get Agency entities (wrapper for getTableEntities)
 */
function getAgencyEntities() {
  return getTableEntities('Agency');
}

/**
 * Get Vendor entities (wrapper for getTableEntities)
 */
function getVendorEntities() {
  return getTableEntities('Vendor');
}

/**
 * Get detailed OEM data by ID
 */
function getOEMDetails(oemId) {
  try {
    const response = getOEMEntities();
    const oems = JSON.parse(response.getContent()).data;
    const oem = oems.find(o => o.id === oemId);
    
    if (!oem) {
      throw new Error('OEM not found: ' + oemId);
    }
    
    return createResponse(true, oem, null);
  } catch (error) {
    console.error('Error getting OEM details:', error);
    return createResponse(false, null, error.toString());
  }
}

/**
 * Get detailed Agency data by ID
 */
function getAgencyDetails(agencyId) {
  try {
    const response = getAgencyEntities();
    const agencies = JSON.parse(response.getContent()).data;
    const agency = agencies.find(a => a.id === agencyId);
    
    if (!agency) {
      throw new Error('Agency not found: ' + agencyId);
    }
    
    return createResponse(true, agency, null);
  } catch (error) {
    console.error('Error getting agency details:', error);
    return createResponse(false, null, error.toString());
  }
}

/**
 * Get detailed Vendor data by ID
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
 * Get OEM analytics summary
 */
function getOEMAnalytics() {
  try {
    const response = getOEMEntities();
    const oems = JSON.parse(response.getContent()).data;
    
    const analytics = {
      totalOEMs: oems.length,
      totalObligations: 0,
      tierDistribution: {},
      aiAdoption: 0,
      discountProviders: 0,
      topOEMs: []
    };
    
    // Process each OEM
    oems.forEach(oem => {
      // Sum obligations
      if (oem.totalObligations) {
        analytics.totalObligations += oem.totalObligations;
      }
      
      // Count tiers
      if (oem.tier) {
        analytics.tierDistribution[oem.tier] = (analytics.tierDistribution[oem.tier] || 0) + 1;
      }
      
      // Count AI adoption
      if (oem.hasAIProducts) {
        analytics.aiAdoption++;
      }
      
      // Count discount providers
      if (oem.hasDiscounts) {
        analytics.discountProviders++;
      }
    });
    
    // Get top 10 OEMs by obligations
    analytics.topOEMs = oems
      .filter(o => o.totalObligations)
      .sort((a, b) => b.totalObligations - a.totalObligations)
      .slice(0, 10)
      .map(o => ({
        name: o.name,
        obligations: o.totalObligations,
        tier: o.tier
      }));
    
    // Calculate percentages
    analytics.aiAdoptionRate = ((analytics.aiAdoption / analytics.totalOEMs) * 100).toFixed(1) + '%';
    analytics.discountRate = ((analytics.discountProviders / analytics.totalOEMs) * 100).toFixed(1) + '%';
    
    return createResponse(true, analytics, null);
  } catch (error) {
    console.error('Error getting OEM analytics:', error);
    return createResponse(false, null, error.toString());
  }
}