/**
 * Backend Summary Functions - B02_summary.js
 * Summary view data processing for OneGov FIT Market
 */

/**
 * Get summary dashboard data
 */
function getSummaryData() {
  try {
    const SPREADSHEET_ID = '1DwUIL4oJwxwYbTXjo7GvqRtUkcMd6MTZDG_gZqqYL04';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Calculate summary metrics across all sheets
    const metrics = {
      totalAgencies: 0,
      totalOEMs: 0,
      totalVendors: 0,
      totalObligations: 0,
      topOEMs: [],
      topAgencies: [],
      recentActivity: []
    };
    
    // Process OEM sheet
    try {
      const oemSheet = spreadsheet.getSheetByName('OEM');
      if (oemSheet) {
        const oemRange = oemSheet.getDataRange();
        const oemValues = oemRange.getValues();
        
        for (let i = 1; i < oemValues.length; i++) {
          const row = oemValues[i];
          const name = row[0]; // Column A - OEM name
          
          if (!name || name.trim() === '') continue;
          
          metrics.totalOEMs++;
          
          // Parse obligations JSON (Column B)
          const obligationsJson = parseJSONColumn(row[1]);
          if (obligationsJson) {
            const obligationsSum = sumJsonValues(obligationsJson);
            metrics.totalObligations += obligationsSum;
            
            // Add to top OEMs list
            metrics.topOEMs.push({
              name: name,
              obligations: obligationsSum
            });
          }
        }
        
        // Sort top OEMs by obligations
        metrics.topOEMs.sort((a, b) => b.obligations - a.obligations);
        metrics.topOEMs = metrics.topOEMs.slice(0, 5);
      }
    } catch (error) {
      console.warn('Error processing OEM sheet:', error);
    }
    
    // Process Vendor sheet
    try {
      const vendorSheet = spreadsheet.getSheetByName('Vendor');
      if (vendorSheet) {
        const vendorRange = vendorSheet.getDataRange();
        const vendorValues = vendorRange.getValues();
        
        for (let i = 1; i < vendorValues.length; i++) {
          const row = vendorValues[i];
          const name = row[1]; // Column B - Vendor name
          
          if (!name || name.trim() === '') continue;
          
          metrics.totalVendors++;
          
          // Parse obligations JSON (Column D)
          const obligationsJson = parseJSONColumn(row[3]);
          if (obligationsJson) {
            const obligationsSum = sumJsonValues(obligationsJson);
            metrics.totalObligations += obligationsSum;
          }
        }
      }
    } catch (error) {
      console.warn('Error processing Vendor sheet:', error);
    }
    
    // Process Agency sheet
    try {
      const agencySheet = spreadsheet.getSheetByName('Agency');
      if (agencySheet) {
        const agencyRange = agencySheet.getDataRange();
        const agencyValues = agencyRange.getValues();
        
        for (let i = 1; i < agencyValues.length; i++) {
          const row = agencyValues[i];
          const name = row[1]; // Column B - Agency name
          
          if (!name || name.trim() === '') continue;
          
          metrics.totalAgencies++;
          
          // Parse obligations JSON (Column D)
          const obligationsJson = parseJSONColumn(row[3]);
          if (obligationsJson) {
            const obligationsSum = sumJsonValues(obligationsJson);
            metrics.totalObligations += obligationsSum;
            
            // Add to top agencies list
            metrics.topAgencies.push({
              name: name,
              obligations: obligationsSum
            });
          }
        }
        
        // Sort top agencies by obligations
        metrics.topAgencies.sort((a, b) => b.obligations - a.obligations);
        metrics.topAgencies = metrics.topAgencies.slice(0, 5);
      }
    } catch (error) {
      console.warn('Error processing Agency sheet:', error);
    }
    
    return createResponse(true, metrics, null);
  } catch (error) {
    console.error('Error getting summary data:', error);
    return createResponse(false, null, error.toString());
  }
}