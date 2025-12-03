/**
 * Agency-specific functions - B06_agency.js
 * Functions for working with Agency data from Google Sheets
 * Now using unified getTableEntities function
 */

/**
 * Get agency entities (wrapper for unified getTableEntities)
 */
function getAgencyEntities() {
  return getTableEntities('Agency');
}

/**
 * Get detailed agency data by ID
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
 * Get agency analytics summary
 */
function getAgencyAnalytics() {
  try {
    const response = getAgencyEntities();
    const agencies = JSON.parse(response.getContent()).data;
    
    const analytics = {
      totalAgencies: agencies.length,
      totalObligations: 0,
      tierDistribution: {},
      departmentDistribution: {},
      aiAdoption: 0,
      discountUsers: 0,
      topAgencies: []
    };
    
    // Process each agency
    agencies.forEach(agency => {
      // Sum obligations
      if (agency.totalObligations) {
        analytics.totalObligations += agency.totalObligations;
      }
      
      // Count tiers
      if (agency.tier) {
        analytics.tierDistribution[agency.tier] = (analytics.tierDistribution[agency.tier] || 0) + 1;
      }
      
      // Count departments
      if (agency.department) {
        analytics.departmentDistribution[agency.department] = (analytics.departmentDistribution[agency.department] || 0) + 1;
      }
      
      // Count AI adoption
      if (agency.hasAIProducts) {
        analytics.aiAdoption++;
      }
      
      // Count discount users
      if (agency.hasDiscounts) {
        analytics.discountUsers++;
      }
    });
    
    // Get top 10 agencies by obligations
    analytics.topAgencies = agencies
      .filter(a => a.totalObligations)
      .sort((a, b) => b.totalObligations - a.totalObligations)
      .slice(0, 10)
      .map(a => ({
        name: a.name,
        agencyCode: a.agencyCode,
        department: a.department,
        obligations: a.totalObligations,
        tier: a.tier
      }));
    
    // Calculate percentages
    analytics.aiAdoptionRate = ((analytics.aiAdoption / analytics.totalAgencies) * 100).toFixed(1) + '%';
    analytics.discountUsageRate = ((analytics.discountUsers / analytics.totalAgencies) * 100).toFixed(1) + '%';
    
    return createResponse(true, analytics, null);
  } catch (error) {
    console.error('Error getting agency analytics:', error);
    return createResponse(false, null, error.toString());
  }
}