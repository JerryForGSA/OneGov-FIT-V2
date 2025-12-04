// /**
//  * ============================================================================
//  * CHART BUFFET SPECIFICATIONS - PART 1
//  * ============================================================================
//  * 
//  * OneGov FIT Market - Chart & Table Specifications for Card-Based Visualization
//  * 
//  * CARD STRUCTURE:
//  * - Front: Interactive Chart
//  * - Back: Data Table
//  * - Export: Docs, Sheets, Slides
//  * 
//  * COLUMNS COVERED IN PART 1:
//  * - Column D: Obligations
//  * - Column E: Small Business
//  * - Column F: SUM Tier
//  * - Column G: Sum Type
//  * - Column H: Contract Vehicle
//  * - Column I: Funding Department
//  * 
//  * ============================================================================
//  */

// const CHART_BUFFET_SPECS = {

//   // ===========================================================================
//   // COLUMN D (Index 3): Obligations
//   // ===========================================================================
//   // Simple structure: total + fiscal year breakdown
//   // Great for: Time series, trend analysis, YoY comparisons
//   // ===========================================================================
  
//   obligations: {
//     columnInfo: {
//       column: 'D',
//       columnIndex: 3,
//       headerName: 'Obligations',
//       dataSource: 'FAS',
//       primaryValuePath: 'total_obligated',
//       timeSeriesPath: 'fiscal_year_obligations'
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD D-1: Fiscal Year Trend - Line Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'D-1',
//         cardTitle: 'Obligations Trend by Fiscal Year',
//         cardDescription: 'Year-over-year obligation trends',
        
//         chart: {
//           type: 'line',
//           title: 'Federal Obligations by Fiscal Year',
//           subtitle: 'FY2022 - FY2025',
          
//           dataMapping: {
//             source: 'fiscal_year_obligations',
//             xAxis: {
//               field: 'keys',  // "2022", "2023", "2024", "2025"
//               label: 'Fiscal Year',
//               format: 'FY{value}'  // Display as "FY2022"
//             },
//             yAxis: {
//               field: 'values',
//               label: 'Obligations ($)',
//               format: 'currency',  // $1.5B, $500M, etc.
//               scale: 'auto'
//             },
//             series: [
//               {
//                 name: 'Obligations',
//                 color: '#2563eb',  // Blue
//                 showDataPoints: true,
//                 showTrendLine: true
//               }
//             ]
//           },
          
//           options: {
//             showGrid: true,
//             showLegend: false,  // Single series, no legend needed
//             showTooltip: true,
//             tooltipFormat: '{x}: {y:currency}',
//             annotations: [
//               {
//                 type: 'highlight-max',
//                 label: 'Peak Year',
//                 color: '#16a34a'
//               }
//             ]
//           }
//         },
        
//         table: {
//           title: 'Obligations by Fiscal Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year', format: 'FY{value}' },
//             { header: 'Obligations', field: 'amount', format: 'currency' },
//             { header: 'YoY Change', field: 'yoyChange', format: 'percentage', calculated: true },
//             { header: '% of Total', field: 'pctOfTotal', format: 'percentage', calculated: true }
//           ],
//           sortDefault: { field: 'year', direction: 'asc' },
//           showTotals: true,
//           totalsRow: { label: 'Grand Total', fields: ['amount'] }
//         },
        
//         dataExtraction: `
//           const data = json.fiscal_year_obligations;
//           const total = json.total_obligated;
//           const years = Object.keys(data).sort();
          
//           return years.map((year, i) => ({
//             year: year,
//             amount: data[year],
//             yoyChange: i > 0 ? (data[year] - data[years[i-1]]) / data[years[i-1]] : null,
//             pctOfTotal: data[year] / total
//           }));
//         `
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD D-2: Fiscal Year Distribution - Bar Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'D-2',
//         cardTitle: 'Annual Obligations Comparison',
//         cardDescription: 'Side-by-side comparison of annual obligations',
        
//         chart: {
//           type: 'bar',
//           title: 'Annual Obligations Comparison',
//           subtitle: 'Federal obligations by fiscal year',
          
//           dataMapping: {
//             source: 'fiscal_year_obligations',
//             xAxis: {
//               field: 'keys',
//               label: 'Fiscal Year',
//               format: 'FY{value}'
//             },
//             yAxis: {
//               field: 'values',
//               label: 'Obligations ($)',
//               format: 'currency'
//             },
//             series: [
//               {
//                 name: 'Obligations',
//                 colorScale: 'sequential-blue',  // Darker for higher values
//                 showValues: true,
//                 valuePosition: 'top'
//               }
//             ]
//           },
          
//           options: {
//             orientation: 'vertical',
//             barWidth: 0.6,
//             showGrid: true,
//             gridAxis: 'y',
//             cornerRadius: 4
//           }
//         },
        
//         table: {
//           // Same as D-1 table
//           title: 'Obligations by Fiscal Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year', format: 'FY{value}' },
//             { header: 'Obligations', field: 'amount', format: 'currency' },
//             { header: 'YoY Change', field: 'yoyChange', format: 'percentage', calculated: true }
//           ],
//           sortDefault: { field: 'year', direction: 'asc' }
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD D-3: Fiscal Year Share - Pie/Donut Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'D-3',
//         cardTitle: 'Fiscal Year Distribution',
//         cardDescription: 'Proportion of total obligations by year',
        
//         chart: {
//           type: 'donut',
//           title: 'Obligations Distribution by Fiscal Year',
          
//           dataMapping: {
//             source: 'fiscal_year_obligations',
//             labels: {
//               field: 'keys',
//               format: 'FY{value}'
//             },
//             values: {
//               field: 'values',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             innerRadius: 0.5,  // Donut hole size
//             showLabels: true,
//             labelPosition: 'outside',
//             showPercentages: true,
//             showLegend: true,
//             legendPosition: 'right',
//             colorScheme: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'],
//             highlightOnHover: true,
//             centerText: {
//               show: true,
//               line1: 'Total',
//               line2: '{total:currency}'
//             }
//           }
//         },
        
//         table: {
//           title: 'Fiscal Year Breakdown',
//           columns: [
//             { header: 'Fiscal Year', field: 'year', format: 'FY{value}' },
//             { header: 'Obligations', field: 'amount', format: 'currency' },
//             { header: '% of Total', field: 'pctOfTotal', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD D-4: Year-over-Year Growth - Waterfall Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'D-4',
//         cardTitle: 'Year-over-Year Growth',
//         cardDescription: 'Incremental changes between fiscal years',
        
//         chart: {
//           type: 'waterfall',
//           title: 'Obligations Growth: FY2022 to FY2025',
          
//           dataMapping: {
//             source: 'fiscal_year_obligations',
//             categories: {
//               pattern: 'start-changes-end',
//               // Will generate: FY2022 (start), FY23 Change, FY24 Change, FY25 Change, FY2025 (end)
//             },
//             values: {
//               calculateChanges: true
//             }
//           },
          
//           options: {
//             colors: {
//               increase: '#16a34a',  // Green
//               decrease: '#dc2626',  // Red
//               total: '#2563eb'      // Blue
//             },
//             showConnectorLines: true,
//             showValues: true,
//             valueFormat: 'currencyCompact'
//           }
//         },
        
//         table: {
//           title: 'Year-over-Year Changes',
//           columns: [
//             { header: 'Period', field: 'period' },
//             { header: 'Change', field: 'change', format: 'currency' },
//             { header: '% Change', field: 'pctChange', format: 'percentage' },
//             { header: 'Running Total', field: 'runningTotal', format: 'currency' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD D-5: Quarterly Projection - Area Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'D-5',
//         cardTitle: 'Cumulative Obligations',
//         cardDescription: 'Running total visualization',
        
//         chart: {
//           type: 'area',
//           title: 'Cumulative Obligations Over Time',
          
//           dataMapping: {
//             source: 'fiscal_year_obligations',
//             xAxis: {
//               field: 'keys',
//               label: 'Fiscal Year'
//             },
//             yAxis: {
//               field: 'cumulativeValues',  // Calculated
//               label: 'Cumulative Obligations ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             fillOpacity: 0.3,
//             gradient: true,
//             gradientColors: ['#3b82f6', '#1e40af'],
//             showDataPoints: true,
//             smoothCurve: true
//           }
//         },
        
//         table: {
//           title: 'Cumulative Obligations',
//           columns: [
//             { header: 'Through FY', field: 'year' },
//             { header: 'Annual', field: 'annual', format: 'currency' },
//             { header: 'Cumulative', field: 'cumulative', format: 'currency' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN E (Index 4): Small Business
//   // ===========================================================================
//   // Structure: summary + business_size_summaries (object map with 2 categories)
//   // Great for: Comparison charts, split visualizations, trend by category
//   // ===========================================================================
  
//   smallBusiness: {
//     columnInfo: {
//       column: 'E',
//       columnIndex: 4,
//       headerName: 'Small Business',
//       dataSource: 'FAS',
//       primaryValuePath: 'summary.total_all_obligations',
//       categoriesPath: 'business_size_summaries'
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD E-1: Small Business Split - Pie Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'E-1',
//         cardTitle: 'Small Business vs Large Business',
//         cardDescription: 'Distribution of obligations by business size',
        
//         chart: {
//           type: 'pie',
//           title: 'Obligations by Business Size',
          
//           dataMapping: {
//             source: 'business_size_summaries',
//             labels: {
//               field: 'keys',
//               transform: {
//                 'SMALL BUSINESS': 'Small Business',
//                 'OTHER THAN SMALL BUSINESS': 'Large Business'
//               }
//             },
//             values: {
//               field: 'total'  // From each category object
//             }
//           },
          
//           options: {
//             colorScheme: ['#16a34a', '#6b7280'],  // Green for small, gray for large
//             showLabels: true,
//             showPercentages: true,
//             showLegend: true,
//             legendPosition: 'bottom',
//             explodeSlice: 0  // Highlight small business
//           }
//         },
        
//         table: {
//           title: 'Business Size Breakdown',
//           columns: [
//             { header: 'Business Size', field: 'category' },
//             { header: 'Total Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD E-2: Small Business Trend - Grouped Bar Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'E-2',
//         cardTitle: 'Business Size Trend by Year',
//         cardDescription: 'Annual comparison of small vs large business obligations',
        
//         chart: {
//           type: 'bar-grouped',
//           title: 'Small vs Large Business Obligations by Year',
          
//           dataMapping: {
//             source: 'business_size_summaries',
//             xAxis: {
//               field: 'fiscal_years.keys',  // Years from nested object
//               label: 'Fiscal Year',
//               format: 'FY{value}'
//             },
//             series: [
//               {
//                 name: 'Small Business',
//                 dataPath: 'business_size_summaries.SMALL BUSINESS.fiscal_years',
//                 color: '#16a34a'
//               },
//               {
//                 name: 'Large Business',
//                 dataPath: 'business_size_summaries.OTHER THAN SMALL BUSINESS.fiscal_years',
//                 color: '#6b7280'
//               }
//             ],
//             yAxis: {
//               label: 'Obligations ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             groupPadding: 0.2,
//             barPadding: 0.1,
//             showLegend: true,
//             legendPosition: 'top',
//             showValues: false,
//             showGrid: true
//           }
//         },
        
//         table: {
//           title: 'Obligations by Business Size and Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year', format: 'FY{value}' },
//             { header: 'Small Business', field: 'smallBusiness', format: 'currency' },
//             { header: 'Large Business', field: 'largeBusiness', format: 'currency' },
//             { header: 'Small Biz %', field: 'smallPct', format: 'percentage' }
//           ],
//           sortDefault: { field: 'year', direction: 'asc' }
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD E-3: Small Business Trend - Stacked Bar Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'E-3',
//         cardTitle: 'Total Obligations with Business Size Breakdown',
//         cardDescription: 'Stacked view showing composition each year',
        
//         chart: {
//           type: 'bar-stacked',
//           title: 'Obligations Composition by Business Size',
          
//           dataMapping: {
//             source: 'business_size_summaries',
//             xAxis: {
//               field: 'fiscal_years',
//               label: 'Fiscal Year'
//             },
//             series: [
//               {
//                 name: 'Small Business',
//                 dataPath: 'business_size_summaries.SMALL BUSINESS.fiscal_years',
//                 color: '#16a34a',
//                 stackOrder: 1
//               },
//               {
//                 name: 'Large Business',
//                 dataPath: 'business_size_summaries.OTHER THAN SMALL BUSINESS.fiscal_years',
//                 color: '#6b7280',
//                 stackOrder: 2
//               }
//             ],
//             yAxis: {
//               label: 'Total Obligations ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             stackMode: 'normal',  // or 'percent' for 100% stacked
//             showLegend: true,
//             showTotalLabels: true
//           }
//         },
        
//         table: {
//           // Same as E-2
//           title: 'Stacked Obligations Data',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Small Business', field: 'smallBusiness', format: 'currency' },
//             { header: 'Large Business', field: 'largeBusiness', format: 'currency' },
//             { header: 'Total', field: 'total', format: 'currency' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD E-4: Small Business Percentage Trend - Line Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'E-4',
//         cardTitle: 'Small Business Percentage Over Time',
//         cardDescription: 'Track small business share trend',
        
//         chart: {
//           type: 'line',
//           title: 'Small Business Share of Obligations',
//           subtitle: 'Percentage of total obligations going to small businesses',
          
//           dataMapping: {
//             calculated: true,
//             xAxis: {
//               source: 'fiscal_years',
//               label: 'Fiscal Year'
//             },
//             yAxis: {
//               calculated: 'smallBusiness / (smallBusiness + largeBusiness) * 100',
//               label: 'Small Business %',
//               format: 'percentage',
//               domain: [0, 100]
//             }
//           },
          
//           options: {
//             showDataPoints: true,
//             pointRadius: 6,
//             lineColor: '#16a34a',
//             showArea: true,
//             areaOpacity: 0.1,
//             referenceLines: [
//               {
//                 value: 23,  // Federal small business goal
//                 label: 'Federal Goal (23%)',
//                 color: '#dc2626',
//                 style: 'dashed'
//               }
//             ]
//           }
//         },
        
//         table: {
//           title: 'Small Business Percentage by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Small Biz Obligations', field: 'smallBusiness', format: 'currency' },
//             { header: 'Total Obligations', field: 'total', format: 'currency' },
//             { header: 'Small Biz %', field: 'percentage', format: 'percentage' },
//             { header: 'vs Goal', field: 'vsGoal', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD E-5: 100% Stacked Area - Composition Over Time
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'E-5',
//         cardTitle: 'Business Size Composition Over Time',
//         cardDescription: 'Normalized view of business size mix',
        
//         chart: {
//           type: 'area-stacked-100',
//           title: 'Business Size Mix by Fiscal Year',
          
//           dataMapping: {
//             xAxis: {
//               source: 'fiscal_years',
//               label: 'Fiscal Year'
//             },
//             series: [
//               { name: 'Small Business', color: '#16a34a' },
//               { name: 'Large Business', color: '#6b7280' }
//             ]
//           },
          
//           options: {
//             normalize: true,
//             showLegend: true,
//             smoothCurve: false,
//             yAxisFormat: 'percentage'
//           }
//         },
        
//         table: {
//           title: 'Normalized Business Size Data',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Small Business %', field: 'smallPct', format: 'percentage' },
//             { header: 'Large Business %', field: 'largePct', format: 'percentage' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN F (Index 5): SUM Tier
//   // ===========================================================================
//   // Structure: summary + tier_summaries (object map with 4 tiers)
//   // Great for: Category comparisons, hierarchical data, trend by tier
//   // ===========================================================================
  
//   sumTier: {
//     columnInfo: {
//       column: 'F',
//       columnIndex: 5,
//       headerName: 'SUM Tier',
//       dataSource: 'FAS',
//       primaryValuePath: 'summary.total_all_obligations',
//       categoriesPath: 'tier_summaries'
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD F-1: Tier Distribution - Horizontal Bar Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'F-1',
//         cardTitle: 'Obligations by SUM Tier',
//         cardDescription: 'Total obligations across contract tiers',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Obligations by Spend Under Management Tier',
          
//           dataMapping: {
//             source: 'tier_summaries',
//             yAxis: {
//               field: 'keys',
//               label: 'SUM Tier',
//               sortOrder: ['BIC', 'TIER 2', 'TIER 1', 'TIER 0']  // Custom sort
//             },
//             xAxis: {
//               field: 'total',
//               label: 'Obligations ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScheme: {
//               'BIC': '#16a34a',     // Best-in-Class = Green
//               'TIER 2': '#3b82f6',  // Blue
//               'TIER 1': '#f59e0b',  // Amber
//               'TIER 0': '#ef4444'   // Red (worst)
//             },
//             showValues: true,
//             valuePosition: 'end',
//             showPercentage: true
//           }
//         },
        
//         table: {
//           title: 'SUM Tier Breakdown',
//           columns: [
//             { header: 'Tier', field: 'tier' },
//             { header: 'Total Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' },
//             { header: 'Rank', field: 'rank' }
//           ],
//           sortDefault: { field: 'total', direction: 'desc' }
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD F-2: Tier Distribution - Donut Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'F-2',
//         cardTitle: 'Tier Distribution Overview',
//         cardDescription: 'Proportional view of tier obligations',
        
//         chart: {
//           type: 'donut',
//           title: 'Obligations by SUM Tier',
          
//           dataMapping: {
//             source: 'tier_summaries',
//             labels: { field: 'keys' },
//             values: { field: 'total' }
//           },
          
//           options: {
//             innerRadius: 0.6,
//             colorScheme: {
//               'BIC': '#16a34a',
//               'TIER 2': '#3b82f6',
//               'TIER 1': '#f59e0b',
//               'TIER 0': '#ef4444'
//             },
//             showLegend: true,
//             legendPosition: 'right',
//             centerText: {
//               show: true,
//               line1: 'BIC %',
//               line2: '{bicPercentage}'  // Calculated
//             }
//           }
//         },
        
//         table: {
//           // Same as F-1
//           title: 'SUM Tier Breakdown',
//           columns: [
//             { header: 'Tier', field: 'tier' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD F-3: Tier Trend - Stacked Bar Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'F-3',
//         cardTitle: 'Tier Composition by Year',
//         cardDescription: 'How tier mix changes over fiscal years',
        
//         chart: {
//           type: 'bar-stacked',
//           title: 'SUM Tier Composition by Fiscal Year',
          
//           dataMapping: {
//             source: 'tier_summaries',
//             xAxis: {
//               source: 'fiscal_years',
//               label: 'Fiscal Year'
//             },
//             series: [
//               { name: 'BIC', dataPath: 'tier_summaries.BIC.fiscal_years', color: '#16a34a' },
//               { name: 'Tier 2', dataPath: 'tier_summaries.TIER 2.fiscal_years', color: '#3b82f6' },
//               { name: 'Tier 1', dataPath: 'tier_summaries.TIER 1.fiscal_years', color: '#f59e0b' },
//               { name: 'Tier 0', dataPath: 'tier_summaries.TIER 0.fiscal_years', color: '#ef4444' }
//             ]
//           },
          
//           options: {
//             stackMode: 'normal',
//             showLegend: true,
//             legendPosition: 'top'
//           }
//         },
        
//         table: {
//           title: 'Tier Obligations by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'BIC', field: 'bic', format: 'currency' },
//             { header: 'Tier 2', field: 'tier2', format: 'currency' },
//             { header: 'Tier 1', field: 'tier1', format: 'currency' },
//             { header: 'Tier 0', field: 'tier0', format: 'currency' },
//             { header: 'Total', field: 'total', format: 'currency' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD F-4: BIC Percentage Trend - Line Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'F-4',
//         cardTitle: 'Best-in-Class Percentage Trend',
//         cardDescription: 'Track BIC adoption over time',
        
//         chart: {
//           type: 'line',
//           title: 'Best-in-Class (BIC) Share Over Time',
          
//           dataMapping: {
//             calculated: true,
//             xAxis: { source: 'fiscal_years', label: 'Fiscal Year' },
//             yAxis: {
//               calculated: 'bic / total * 100',
//               label: 'BIC Percentage',
//               format: 'percentage'
//             }
//           },
          
//           options: {
//             lineColor: '#16a34a',
//             showDataPoints: true,
//             showArea: true,
//             areaOpacity: 0.15,
//             referenceLines: [
//               {
//                 value: 50,
//                 label: '50% Target',
//                 color: '#6b7280',
//                 style: 'dashed'
//               }
//             ]
//           }
//         },
        
//         table: {
//           title: 'BIC Percentage by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'BIC Obligations', field: 'bic', format: 'currency' },
//             { header: 'Total Obligations', field: 'total', format: 'currency' },
//             { header: 'BIC %', field: 'bicPct', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD F-5: Tier Migration - Sankey Diagram
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'F-5',
//         cardTitle: 'Tier Flow by Fiscal Year',
//         cardDescription: 'Visualize how obligations flow across tiers',
        
//         chart: {
//           type: 'sankey',
//           title: 'Obligation Flow Across SUM Tiers',
          
//           dataMapping: {
//             nodes: [
//               // Left side: Fiscal Years
//               { id: 'FY2022', label: 'FY2022', column: 0 },
//               { id: 'FY2023', label: 'FY2023', column: 0 },
//               { id: 'FY2024', label: 'FY2024', column: 0 },
//               { id: 'FY2025', label: 'FY2025', column: 0 },
//               // Right side: Tiers
//               { id: 'BIC', label: 'BIC', column: 1, color: '#16a34a' },
//               { id: 'TIER2', label: 'Tier 2', column: 1, color: '#3b82f6' },
//               { id: 'TIER1', label: 'Tier 1', column: 1, color: '#f59e0b' },
//               { id: 'TIER0', label: 'Tier 0', column: 1, color: '#ef4444' }
//             ],
//             links+source: 'tier_summaries.[tier].fiscal_years',
//             linkFormat: { from: 'year', to: 'tier', value: 'amount' }
//           },
          
//           options: {
//             nodeWidth: 20,
//             nodePadding: 10,
//             linkOpacity: 0.5,
//             showValues: true
//           }
//         },
        
//         table: {
//           title: 'Tier by Fiscal Year Matrix',
//           pivotTable: true,
//           rows: ['BIC', 'TIER 2', 'TIER 1', 'TIER 0'],
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total'],
//           cellFormat: 'currency'
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD F-6: 100% Stacked Area - Tier Mix Over Time
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'F-6',
//         cardTitle: 'Tier Mix Trend',
//         cardDescription: 'Normalized tier composition over time',
        
//         chart: {
//           type: 'area-stacked-100',
//           title: 'SUM Tier Composition Trend',
          
//           dataMapping: {
//             xAxis: { source: 'fiscal_years' },
//             series: [
//               { name: 'BIC', color: '#16a34a' },
//               { name: 'Tier 2', color: '#3b82f6' },
//               { name: 'Tier 1', color: '#f59e0b' },
//               { name: 'Tier 0', color: '#ef4444' }
//             ]
//           },
          
//           options: {
//             yAxisFormat: 'percentage',
//             showLegend: true,
//             legendPosition: 'bottom'
//           }
//         },
        
//         table: {
//           title: 'Tier Percentages by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'BIC %', field: 'bicPct', format: 'percentage' },
//             { header: 'Tier 2 %', field: 'tier2Pct', format: 'percentage' },
//             { header: 'Tier 1 %', field: 'tier1Pct', format: 'percentage' },
//             { header: 'Tier 0 %', field: 'tier0Pct', format: 'percentage' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN G (Index 6): Sum Type
//   // ===========================================================================
//   // Structure: summary + sum_type_summaries (3 categories)
//   // Great for: Category comparisons, trend analysis
//   // ===========================================================================
  
//   sumType: {
//     columnInfo: {
//       column: 'G',
//       columnIndex: 6,
//       headerName: 'Sum Type',
//       dataSource: 'FAS',
//       primaryValuePath: 'summary.total_all_obligations',
//       categoriesPath: 'sum_type_summaries'
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD G-1: Sum Type Distribution - Pie Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'G-1',
//         cardTitle: 'Contract Management Type Distribution',
//         cardDescription: 'Breakdown by contract management approach',
        
//         chart: {
//           type: 'pie',
//           title: 'Obligations by Contract Management Type',
          
//           dataMapping: {
//             source: 'sum_type_summaries',
//             labels: { field: 'keys' },
//             values: { field: 'total' }
//           },
          
//           options: {
//             colorScheme: {
//               'Governmentwide Management': '#16a34a',
//               'Agency Managed & IDIQ': '#3b82f6',
//               'Open Market': '#f59e0b'
//             },
//             showLabels: true,
//             showPercentages: true,
//             showLegend: true
//           }
//         },
        
//         table: {
//           title: 'Sum Type Breakdown',
//           columns: [
//             { header: 'Management Type', field: 'type' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD G-2: Sum Type Trend - Stacked Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'G-2',
//         cardTitle: 'Management Type by Year',
//         cardDescription: 'Annual breakdown of contract management approaches',
        
//         chart: {
//           type: 'bar-stacked',
//           title: 'Contract Management Type by Fiscal Year',
          
//           dataMapping: {
//             source: 'sum_type_summaries',
//             xAxis: { source: 'fiscal_years', label: 'Fiscal Year' },
//             series: [
//               { name: 'Governmentwide', color: '#16a34a' },
//               { name: 'Agency/IDIQ', color: '#3b82f6' },
//               { name: 'Open Market', color: '#f59e0b' }
//             ]
//           },
          
//           options: {
//             showLegend: true,
//             legendPosition: 'top'
//           }
//         },
        
//         table: {
//           title: 'Management Type by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Governmentwide', field: 'governmentwide', format: 'currency' },
//             { header: 'Agency/IDIQ', field: 'agencyIdiq', format: 'currency' },
//             { header: 'Open Market', field: 'openMarket', format: 'currency' },
//             { header: 'Total', field: 'total', format: 'currency' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD G-3: Governmentwide Percentage - Gauge Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'G-3',
//         cardTitle: 'Governmentwide Managed Percentage',
//         cardDescription: 'Percentage of obligations through governmentwide vehicles',
        
//         chart: {
//           type: 'gauge',
//           title: 'Governmentwide Management Rate',
          
//           dataMapping: {
//             calculated: true,
//             value: 'governmentwide / total * 100'
//           },
          
//           options: {
//             min: 0,
//             max: 100,
//             ranges: [
//               { from: 0, to: 50, color: '#ef4444' },    // Red
//               { from: 50, to: 75, color: '#f59e0b' },   // Amber
//               { from: 75, to: 100, color: '#16a34a' }   // Green
//             ],
//             showValue: true,
//             valueFormat: 'percentage',
//             label: 'of obligations via Governmentwide vehicles'
//           }
//         },
        
//         table: {
//           title: 'Governmentwide Breakdown',
//           columns: [
//             { header: 'Metric', field: 'metric' },
//             { header: 'Value', field: 'value', format: 'currency' },
//             { header: 'Percentage', field: 'percentage', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD G-4: Multi-line Trend - Line Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'G-4',
//         cardTitle: 'Management Type Trends',
//         cardDescription: 'Year-over-year trends for each management type',
        
//         chart: {
//           type: 'line-multi',
//           title: 'Contract Management Type Trends',
          
//           dataMapping: {
//             xAxis: { source: 'fiscal_years', label: 'Fiscal Year' },
//             series: [
//               { name: 'Governmentwide', dataPath: 'sum_type_summaries.Governmentwide Management.fiscal_years', color: '#16a34a' },
//               { name: 'Agency/IDIQ', dataPath: 'sum_type_summaries.Agency Managed & IDIQ.fiscal_years', color: '#3b82f6' },
//               { name: 'Open Market', dataPath: 'sum_type_summaries.Open Market.fiscal_years', color: '#f59e0b' }
//             ]
//           },
          
//           options: {
//             showDataPoints: true,
//             showLegend: true,
//             legendPosition: 'top',
//             yAxisFormat: 'currency'
//           }
//         },
        
//         table: {
//           title: 'Management Type by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Governmentwide', field: 'governmentwide', format: 'currency' },
//             { header: 'Agency/IDIQ', field: 'agencyIdiq', format: 'currency' },
//             { header: 'Open Market', field: 'openMarket', format: 'currency' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN H (Index 7): Contract Vehicle
//   // ===========================================================================
//   // Structure: summary + top_contract_summaries (object map, ~20 vehicles)
//   // Great for: Top N charts, rankings, comparisons
//   // Challenge: Long contract names - need truncation/wrapping strategies
//   // ===========================================================================
  
//   contractVehicle: {
//     columnInfo: {
//       column: 'H',
//       columnIndex: 7,
//       headerName: 'Contract Vehicle',
//       dataSource: 'FAS',
//       primaryValuePath: 'summary.total_all_obligations',
//       categoriesPath: 'top_contract_summaries',
//       nameHandling: {
//         // Strategy for long names
//         maxDisplayLength: 25,
//         truncationStyle: 'ellipsis',  // or 'acronym', 'wrap'
//         tooltipShowFull: true,
//         knownAcronyms: {
//           'NASA SEWP': 'NASA SEWP',
//           'SCHEDULE 70 - INFORMATION TECHNOLOGY': 'Sched 70 IT',
//           'JOINT WARFIGHTING CLOUD CAPABILITY': 'JWCC',
//           'FIRSTSOURCE II': 'FirstSource II',
//           'NITAAC CIO-CS': 'NITAAC CIO-CS',
//           '8(a) STARS III': '8(a) STARS III',
//           'ALLIANT 2': 'Alliant 2'
//         }
//       }
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD H-1: Top 10 Contract Vehicles - Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'H-1',
//         cardTitle: 'Top 10 Contract Vehicles',
//         cardDescription: 'Highest obligation contract vehicles',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 10 Contract Vehicles by Obligations',
          
//           dataMapping: {
//             source: 'top_contract_summaries',
//             limit: 10,
//             sortBy: 'total',
//             sortDirection: 'desc',
//             yAxis: {
//               field: 'keys',
//               label: 'Contract Vehicle',
//               truncate: 25,
//               useAcronyms: true
//             },
//             xAxis: {
//               field: 'total',
//               label: 'Obligations ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-blue',
//             showValues: true,
//             valuePosition: 'end',
//             valueFormat: 'currencyCompact',
//             barHeight: 30,
//             tooltipShowFullName: true
//           }
//         },
        
//         table: {
//           title: 'Top 10 Contract Vehicles',
//           columns: [
//             { header: 'Rank', field: 'rank', width: 50 },
//             { header: 'Contract Vehicle', field: 'name', width: 200 },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ],
//           showRank: true
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD H-2: Top 5 Contract Vehicles - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'H-2',
//         cardTitle: 'Top 5 Contract Vehicle Share',
//         cardDescription: 'Market concentration in top vehicles',
        
//         chart: {
//           type: 'donut',
//           title: 'Top 5 Contract Vehicles',
          
//           dataMapping: {
//             source: 'top_contract_summaries',
//             limit: 5,
//             sortBy: 'total',
//             addOther: true,  // Group remaining into "Other"
//             labels: { field: 'keys', useAcronyms: true },
//             values: { field: 'total' }
//           },
          
//           options: {
//             innerRadius: 0.5,
//             colorScheme: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#e5e7eb'],
//             showLegend: true,
//             legendPosition: 'right',
//             showPercentages: true
//           }
//         },
        
//         table: {
//           title: 'Top 5 Contract Vehicles',
//           columns: [
//             { header: 'Contract Vehicle', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' },
//             { header: 'Cumulative %', field: 'cumulativePct', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD H-3: Top 5 Vehicles Trend - Grouped Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'H-3',
//         cardTitle: 'Top 5 Vehicle Trends by Year',
//         cardDescription: 'Year-over-year comparison of top vehicles',
        
//         chart: {
//           type: 'bar-grouped',
//           title: 'Top 5 Contract Vehicles by Fiscal Year',
          
//           dataMapping: {
//             source: 'top_contract_summaries',
//             limit: 5,
//             xAxis: {
//               source: 'fiscal_years',
//               label: 'Fiscal Year'
//             },
//             series: 'dynamic',  // Generate series from top 5 vehicles
//             seriesNameTruncate: 15
//           },
          
//           options: {
//             showLegend: true,
//             legendPosition: 'bottom',
//             colorScheme: 'categorical-5'
//           }
//         },
        
//         table: {
//           title: 'Top 5 Vehicles by Year',
//           pivotTable: true,
//           rows: 'top5Vehicles',
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total'],
//           cellFormat: 'currency'
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD H-4: Vehicle Concentration - Treemap
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'H-4',
//         cardTitle: 'Contract Vehicle Landscape',
//         cardDescription: 'Visual representation of vehicle sizes',
        
//         chart: {
//           type: 'treemap',
//           title: 'Contract Vehicle Market Share',
          
//           dataMapping: {
//             source: 'top_contract_summaries',
//             limit: 15,
//             id: { field: 'keys', truncate: 20 },
//             value: { field: 'total' },
//             label: { field: 'keys', truncate: 15 }
//           },
          
//           options: {
//             colorScale: 'sequential-blue',
//             colorByValue: true,
//             showLabels: true,
//             labelMinSize: 50,  // Don't show labels on small tiles
//             tooltipShowFull: true,
//             tileStyle: {
//               borderColor: '#ffffff',
//               borderWidth: 2,
//               cornerRadius: 4
//             }
//           }
//         },
        
//         table: {
//           title: 'Contract Vehicle Obligations',
//           columns: [
//             { header: 'Contract Vehicle', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ],
//           maxRows: 15
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD H-5: Vehicle Growth - Slope Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'H-5',
//         cardTitle: 'Vehicle Growth: FY22 to FY25',
//         cardDescription: 'Which vehicles grew or declined?',
        
//         chart: {
//           type: 'slope',
//           title: 'Contract Vehicle Trajectory (FY22 → FY25)',
          
//           dataMapping: {
//             source: 'top_contract_summaries',
//             limit: 8,
//             leftPoint: { year: '2022' },
//             rightPoint: { year: '2025' },
//             label: { field: 'keys', truncate: 15 }
//           },
          
//           options: {
//             highlightGrowth: true,
//             growthColor: '#16a34a',
//             declineColor: '#dc2626',
//             showPercentChange: true
//           }
//         },
        
//         table: {
//           title: 'Vehicle Growth FY22 to FY25',
//           columns: [
//             { header: 'Contract Vehicle', field: 'name' },
//             { header: 'FY2022', field: 'fy2022', format: 'currency' },
//             { header: 'FY2025', field: 'fy2025', format: 'currency' },
//             { header: 'Change', field: 'change', format: 'currency' },
//             { header: '% Change', field: 'pctChange', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD H-6: All Vehicles - Full Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'H-6',
//         cardTitle: 'All Contract Vehicles',
//         cardDescription: 'Complete list of all contract vehicles',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'All Contract Vehicles by Obligations',
          
//           dataMapping: {
//             source: 'top_contract_summaries',
//             limit: 20,  // Show all available
//             sortBy: 'total',
//             sortDirection: 'desc',
//             yAxis: { field: 'keys', truncate: 30 },
//             xAxis: { field: 'total', format: 'currency' }
//           },
          
//           options: {
//             height: 'auto',  // Adjust height based on number of items
//             minBarHeight: 25,
//             colorScale: 'sequential-blue',
//             showValues: true
//           }
//         },
        
//         table: {
//           title: 'All Contract Vehicles',
//           columns: [
//             { header: 'Rank', field: 'rank' },
//             { header: 'Contract Vehicle', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ],
//           pagination: true,
//           pageSize: 10
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN I (Index 8): Funding Department
//   // ===========================================================================
//   // Structure: summary + top_10_department_summaries (object map)
//   // Great for: Top N charts, agency comparisons
//   // Challenge: Long department names
//   // ===========================================================================
  
//   fundingDepartment: {
//     columnInfo: {
//       column: 'I',
//       columnIndex: 8,
//       headerName: 'Funding Department',
//       dataSource: 'FAS',
//       primaryValuePath: 'summary.total_all_departments',
//       categoriesPath: 'top_10_department_summaries',
//       nameHandling: {
//         maxDisplayLength: 20,
//         truncationStyle: 'ellipsis',
//         knownAcronyms: {
//           'DEPT OF DEFENSE': 'DOD',
//           'HOMELAND SECURITY, DEPARTMENT OF': 'DHS',
//           'VETERANS AFFAIRS, DEPARTMENT OF': 'VA',
//           'TREASURY, DEPARTMENT OF THE': 'Treasury',
//           'HEALTH AND HUMAN SERVICES, DEPARTMENT OF': 'HHS',
//           'JUSTICE, DEPARTMENT OF': 'DOJ',
//           'AGRICULTURE, DEPARTMENT OF': 'USDA',
//           'INTERIOR, DEPARTMENT OF THE': 'Interior',
//           'COMMERCE, DEPARTMENT OF': 'Commerce',
//           'TRANSPORTATION, DEPARTMENT OF': 'DOT'
//         }
//       }
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD I-1: Top 10 Departments - Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'I-1',
//         cardTitle: 'Top 10 Funding Departments',
//         cardDescription: 'Departments with highest obligations',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 10 Funding Departments',
          
//           dataMapping: {
//             source: 'top_10_department_summaries',
//             sortBy: 'total',
//             yAxis: {
//               field: 'keys',
//               label: 'Department',
//               useAcronyms: true
//             },
//             xAxis: {
//               field: 'total',
//               label: 'Obligations ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'categorical-10',
//             showValues: true,
//             valueFormat: 'currencyCompact'
//           }
//         },
        
//         table: {
//           title: 'Top 10 Funding Departments',
//           columns: [
//             { header: 'Rank', field: 'rank' },
//             { header: 'Department', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD I-2: Department Share - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'I-2',
//         cardTitle: 'Department Market Share',
//         cardDescription: 'Proportional view of top departments',
        
//         chart: {
//           type: 'donut',
//           title: 'Funding Department Distribution',
          
//           dataMapping: {
//             source: 'top_10_department_summaries',
//             limit: 5,
//             addOther: true,
//             labels: { field: 'keys', useAcronyms: true },
//             values: { field: 'total' }
//           },
          
//           options: {
//             innerRadius: 0.55,
//             showLegend: true,
//             legendPosition: 'right',
//             colorScheme: 'categorical-6'
//           }
//         },
        
//         table: {
//           title: 'Department Distribution',
//           columns: [
//             { header: 'Department', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD I-3: Department Trends - Multi-Line
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'I-3',
//         cardTitle: 'Top 5 Department Trends',
//         cardDescription: 'Year-over-year trends for top departments',
        
//         chart: {
//           type: 'line-multi',
//           title: 'Top 5 Department Trends by Fiscal Year',
          
//           dataMapping: {
//             source: 'top_10_department_summaries',
//             limit: 5,
//             xAxis: { source: 'fiscal_years', label: 'Fiscal Year' },
//             series: 'dynamic',
//             seriesNameUseAcronyms: true
//           },
          
//           options: {
//             showDataPoints: true,
//             showLegend: true,
//             legendPosition: 'bottom',
//             colorScheme: 'categorical-5'
//           }
//         },
        
//         table: {
//           title: 'Top 5 Departments by Year',
//           pivotTable: true,
//           rows: 'top5Departments',
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total'],
//           cellFormat: 'currency'
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD I-4: Department Treemap
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'I-4',
//         cardTitle: 'Department Landscape',
//         cardDescription: 'Visual representation of department sizes',
        
//         chart: {
//           type: 'treemap',
//           title: 'Funding Department Market Share',
          
//           dataMapping: {
//             source: 'top_10_department_summaries',
//             id: { field: 'keys', useAcronyms: true },
//             value: { field: 'total' }
//           },
          
//           options: {
//             colorScale: 'categorical-10',
//             showLabels: true,
//             labelMinSize: 60
//           }
//         },
        
//         table: {
//           title: 'All Departments',
//           columns: [
//             { header: 'Department', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD I-5: Department Stacked Bar by Year
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'I-5',
//         cardTitle: 'Department Mix by Year',
//         cardDescription: 'How department spending changes annually',
        
//         chart: {
//           type: 'bar-stacked',
//           title: 'Top 5 Departments by Fiscal Year',
          
//           dataMapping: {
//             source: 'top_10_department_summaries',
//             limit: 5,
//             xAxis: { source: 'fiscal_years' },
//             series: 'dynamic',
//             addOther: true
//           },
          
//           options: {
//             showLegend: true,
//             legendPosition: 'bottom',
//             colorScheme: 'categorical-6'
//           }
//         },
        
//         table: {
//           title: 'Department Breakdown by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'DOD', field: 'dod', format: 'currency' },
//             { header: 'DHS', field: 'dhs', format: 'currency' },
//             { header: 'VA', field: 'va', format: 'currency' },
//             { header: 'Treasury', field: 'treasury', format: 'currency' },
//             { header: 'HHS', field: 'hhs', format: 'currency' },
//             { header: 'Other', field: 'other', format: 'currency' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD I-6: Top Department Concentration
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'I-6',
//         cardTitle: 'Department Concentration Analysis',
//         cardDescription: 'How concentrated is spending across departments?',
        
//         chart: {
//           type: 'bar-pareto',
//           title: 'Department Concentration (Pareto Analysis)',
          
//           dataMapping: {
//             source: 'top_10_department_summaries',
//             bars: { field: 'total', label: 'Obligations' },
//             line: { calculated: 'cumulativePercentage', label: 'Cumulative %' }
//           },
          
//           options: {
//             barColor: '#3b82f6',
//             lineColor: '#dc2626',
//             show80PercentLine: true,
//             showLegend: true
//           }
//         },
        
//         table: {
//           title: 'Concentration Analysis',
//           columns: [
//             { header: 'Department', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' },
//             { header: 'Cumulative %', field: 'cumulativePct', format: 'percentage' }
//           ]
//         }
//       }
//     ]
//   }
// };

// // ============================================================================
// // END OF PART 1
// // ============================================================================
// // Continue to Part 2 for columns K, L, M, O, P, Q
// // ============================================================================
// // ============================================================================
// // CHART BUFFET SPECIFICATIONS - PART 2
// // ============================================================================
// // 
// // Columns covered:
// // - Column K: Top Ref_PIID (Reference PIIDs - TRICKY: Long alphanumeric IDs)
// // - Column L: Top PIID (Individual PIIDs - TRICKY: Long alphanumeric IDs)
// // - Column M: Active Contracts (Expiring by quarter)
// // - Column O: AI Product (Nested by fiscal year)
// // - Column P: AI Category (Nested by fiscal year)
// // - Column Q: Top BIC Products (Array structure)
// //
// // ============================================================================

// const CHART_BUFFET_SPECS_PART2 = {

//   // ===========================================================================
//   // COLUMN K (Index 10): Top Ref_PIID
//   // ===========================================================================
//   // Structure: Array of top 10 reference PIIDs
//   // CHALLENGE: PIIDs are long alphanumeric codes like "NNG15SD22B"
//   // STRATEGY: 
//   //   - Use abbreviated display in charts
//   //   - Show rank numbers instead of full PIID in some charts
//   //   - Tooltip shows full details
//   //   - Table shows full PIID with copy functionality
//   // ===========================================================================
  
//   topRefPiid: {
//     columnInfo: {
//       column: 'K',
//       columnIndex: 10,
//       headerName: 'Top Ref_PIID',
//       dataSource: 'FAS',
//       primaryValuePath: 'total_obligations',
//       categoriesPath: 'top_10_reference_piids',
//       categoryValueType: 'array',
//       arrayItemKeyField: 'reference_piid',
//       arrayItemValueField: 'dollars_obligated'
//     },
    
//     // Strategy for handling long PIID names
//     nameHandling: {
//       strategy: 'rank-based',  // Use "PIID #1", "PIID #2" in charts
//       alternativeStrategies: ['truncate', 'tooltip-only'],
//       maxDisplayLength: 12,
//       showFullInTooltip: true,
//       showFullInTable: true,
//       legendStrategy: 'abbreviated',  // "NNG15S..." or "#1: NNG15SD22B"
      
//       // For charts where we need labels
//       labelFormats: {
//         abbreviated: '{piid:truncate:10}',
//         ranked: 'Ref #{rank}',
//         hybrid: '#{rank}: {piid:truncate:8}'
//       }
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD K-1: Top 10 Reference PIIDs - Horizontal Bar (Rank-Based Labels)
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'K-1',
//         cardTitle: 'Top 10 Reference PIIDs by Obligations',
//         cardDescription: 'Highest value parent contract IDs',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 10 Reference PIIDs',
//           subtitle: 'Hover for full PIID details',
          
//           dataMapping: {
//             source: 'top_10_reference_piids',
//             sortBy: 'dollars_obligated',
//             sortDirection: 'desc',
//             yAxis: {
//               field: 'reference_piid',
//               label: 'Reference PIID',
//               displayFormat: 'ranked',  // Shows "Ref #1", "Ref #2", etc.
//               // Alternative: displayFormat: 'hybrid' for "#1: NNG15SD..."
//             },
//             xAxis: {
//               field: 'dollars_obligated',
//               label: 'Obligations ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-blue',
//             showValues: true,
//             valueFormat: 'currencyCompact',
//             tooltip: {
//               show: true,
//               template: `
//                 <strong>Reference PIID:</strong> {reference_piid}<br>
//                 <strong>Obligations:</strong> {dollars_obligated:currency}<br>
//                 <strong>% of Total:</strong> {percentage_of_total}<br>
//                 <strong>Agencies Using:</strong> {agencies_using}
//               `
//             },
//             // Add rank badges on bars
//             annotations: {
//               type: 'rank-badge',
//               position: 'start',
//               format: '#{rank}'
//             }
//           }
//         },
        
//         table: {
//           title: 'Top 10 Reference PIIDs',
//           columns: [
//             { header: 'Rank', field: 'rank', width: 50 },
//             { 
//               header: 'Reference PIID', 
//               field: 'reference_piid', 
//               width: 150,
//               copyable: true,  // Allow click-to-copy
//               monospace: true  // Use monospace font for codes
//             },
//             { header: 'Obligations', field: 'dollars_obligated', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' },
//             { header: 'Agencies', field: 'agencies_using', align: 'center' }
//           ],
//           sortDefault: { field: 'dollars_obligated', direction: 'desc' }
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD K-2: Top 5 Ref_PIIDs - Donut with Legend
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'K-2',
//         cardTitle: 'Top 5 Reference PIIDs Share',
//         cardDescription: 'Market concentration in top parent contracts',
        
//         chart: {
//           type: 'donut',
//           title: 'Top 5 Reference PIIDs',
          
//           dataMapping: {
//             source: 'top_10_reference_piids',
//             limit: 5,
//             addOther: true,
//             labels: {
//               field: 'reference_piid',
//               format: 'abbreviated',  // "NNG15SD..."
//               maxLength: 10
//             },
//             values: { field: 'dollars_obligated' }
//           },
          
//           options: {
//             innerRadius: 0.5,
//             showLegend: true,
//             legendPosition: 'right',
//             legendFormat: 'full',  // Show full PIID in legend
//             colorScheme: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#e5e7eb'],
//             // Don't show labels on pie slices (too long), use legend instead
//             showSliceLabels: false,
//             showPercentages: true,
//             percentagePosition: 'tooltip'
//           }
//         },
        
//         table: {
//           title: 'Top 5 Reference PIIDs',
//           columns: [
//             { header: 'Reference PIID', field: 'reference_piid', copyable: true },
//             { header: 'Obligations', field: 'dollars_obligated', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' },
//             { header: 'Cumulative %', field: 'cumulativePct', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD K-3: Top 5 Ref_PIIDs Trend - Multi-Line (with Legend)
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'K-3',
//         cardTitle: 'Top 5 Ref_PIID Trends',
//         cardDescription: 'Year-over-year trends for top parent contracts',
        
//         chart: {
//           type: 'line-multi',
//           title: 'Top 5 Reference PIID Trends by Fiscal Year',
          
//           dataMapping: {
//             source: 'top_10_reference_piids',
//             limit: 5,
//             xAxis: {
//               source: 'fiscal_year_breakdown',
//               field: 'keys',
//               label: 'Fiscal Year',
//               format: 'FY{value}'
//             },
//             series: {
//               dynamic: true,
//               nameField: 'reference_piid',
//               nameFormat: 'abbreviated',  // Legend shows abbreviated PIIDs
//               valueField: 'fiscal_year_breakdown.{year}.obligations'
//             }
//           },
          
//           options: {
//             showDataPoints: true,
//             pointRadius: 4,
//             showLegend: true,
//             legendPosition: 'bottom',
//             legendStyle: 'horizontal',
//             legendItemFormat: '{piid:truncate:12}',
//             colorScheme: 'categorical-5',
//             yAxisFormat: 'currencyCompact',
//             tooltip: {
//               showFullPiid: true,
//               showAllSeries: false
//             }
//           }
//         },
        
//         table: {
//           title: 'Top 5 Ref_PIIDs by Year',
//           pivotTable: true,
//           rowHeader: 'Reference PIID',
//           rows: 'top5RefPiids',
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total'],
//           cellFormat: 'currency',
//           rowCopyable: true
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD K-4: Agencies Using Top PIIDs - Bubble Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'K-4',
//         cardTitle: 'PIID Value vs Agency Adoption',
//         cardDescription: 'Which PIIDs are used by most agencies?',
        
//         chart: {
//           type: 'bubble',
//           title: 'Reference PIID: Value vs Agency Adoption',
          
//           dataMapping: {
//             source: 'top_10_reference_piids',
//             xAxis: {
//               field: 'agencies_using',
//               label: 'Number of Agencies Using',
//               type: 'linear'
//             },
//             yAxis: {
//               field: 'dollars_obligated',
//               label: 'Total Obligations ($)',
//               format: 'currency'
//             },
//             size: {
//               field: 'dollars_obligated',
//               scale: 'sqrt',  // Square root scale for area
//               range: [10, 50]
//             },
//             label: {
//               field: 'reference_piid',
//               format: 'ranked',  // "#1", "#2", etc. inside bubbles
//               showOnHover: true
//             }
//           },
          
//           options: {
//             colorScheme: 'sequential-blue',
//             colorByValue: 'dollars_obligated',
//             showTooltip: true,
//             tooltip: {
//               template: `
//                 <strong>{reference_piid}</strong><br>
//                 Obligations: {dollars_obligated:currency}<br>
//                 Agencies: {agencies_using}
//               `
//             }
//           }
//         },
        
//         table: {
//           title: 'PIID Agency Usage',
//           columns: [
//             { header: 'Reference PIID', field: 'reference_piid', copyable: true },
//             { header: 'Obligations', field: 'dollars_obligated', format: 'currency' },
//             { header: 'Agencies Using', field: 'agencies_using' },
//             { header: '$ per Agency', field: 'perAgency', format: 'currency', calculated: true }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD K-5: Yearly Totals Overview - Simple Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'K-5',
//         cardTitle: 'Reference PIID Yearly Totals',
//         cardDescription: 'Total obligations across all reference PIIDs by year',
        
//         chart: {
//           type: 'bar',
//           title: 'Total Reference PIID Obligations by Year',
          
//           dataMapping: {
//             source: 'yearly_totals',
//             xAxis: {
//               field: 'keys',
//               label: 'Fiscal Year',
//               format: 'FY{value}'
//             },
//             yAxis: {
//               field: 'values',
//               label: 'Obligations ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-blue',
//             showValues: true,
//             valueFormat: 'currencyCompact'
//           }
//         },
        
//         table: {
//           title: 'Yearly Summary',
//           columns: [
//             { header: 'Fiscal Year', field: 'year', format: 'FY{value}' },
//             { header: 'Total Obligations', field: 'total', format: 'currency' },
//             { header: 'YoY Change', field: 'yoyChange', format: 'percentage' },
//             { header: '# Unique PIIDs', field: 'uniqueCount' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD K-6: Top 10 with FY Breakdown - Stacked Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'K-6',
//         cardTitle: 'Top 10 Ref_PIIDs with FY Breakdown',
//         cardDescription: 'Obligations by fiscal year for each PIID',
        
//         chart: {
//           type: 'bar-stacked-horizontal',
//           title: 'Top 10 Reference PIIDs by Fiscal Year',
          
//           dataMapping: {
//             source: 'top_10_reference_piids',
//             yAxis: {
//               field: 'reference_piid',
//               format: 'ranked',  // "Ref #1", "Ref #2"
//               label: 'Reference PIID'
//             },
//             series: [
//               { name: 'FY2022', dataPath: 'fiscal_year_breakdown.2022.obligations', color: '#1e3a5f' },
//               { name: 'FY2023', dataPath: 'fiscal_year_breakdown.2023.obligations', color: '#2563eb' },
//               { name: 'FY2024', dataPath: 'fiscal_year_breakdown.2024.obligations', color: '#60a5fa' },
//               { name: 'FY2025', dataPath: 'fiscal_year_breakdown.2025.obligations', color: '#93c5fd' }
//             ]
//           },
          
//           options: {
//             showLegend: true,
//             legendPosition: 'top',
//             showTotalLabels: true,
//             tooltipShowFullPiid: true
//           }
//         },
        
//         table: {
//           title: 'PIID Fiscal Year Breakdown',
//           columns: [
//             { header: 'Ref PIID', field: 'reference_piid', copyable: true },
//             { header: 'FY2022', field: 'fy2022', format: 'currency' },
//             { header: 'FY2023', field: 'fy2023', format: 'currency' },
//             { header: 'FY2024', field: 'fy2024', format: 'currency' },
//             { header: 'FY2025', field: 'fy2025', format: 'currency' },
//             { header: 'Total', field: 'total', format: 'currency' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN L (Index 11): Top PIID
//   // ===========================================================================
//   // Structure: Array of top 10 individual PIIDs
//   // SAME CHALLENGES as Column K - even longer individual contract IDs
//   // PIIDs like "36C10B22F0207", "70B04C24F00000413"
//   // ===========================================================================
  
//   topPiid: {
//     columnInfo: {
//       column: 'L',
//       columnIndex: 11,
//       headerName: 'Top PIID',
//       dataSource: 'FAS',
//       primaryValuePath: 'total_obligations',
//       categoriesPath: 'top_10_piids',
//       categoryValueType: 'array',
//       arrayItemKeyField: 'piid',
//       arrayItemValueField: 'dollars_obligated'
//     },
    
//     nameHandling: {
//       strategy: 'rank-based',
//       maxDisplayLength: 12,
//       showFullInTooltip: true,
//       showFullInTable: true,
//       labelFormats: {
//         abbreviated: '{piid:truncate:10}',
//         ranked: 'Contract #{rank}',
//         hybrid: '#{rank}: {piid:truncate:8}'
//       }
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD L-1: Top 10 PIIDs - Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'L-1',
//         cardTitle: 'Top 10 Individual Contracts',
//         cardDescription: 'Highest value individual contract IDs',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 10 Contract PIIDs by Obligations',
//           subtitle: 'Individual contract identifiers',
          
//           dataMapping: {
//             source: 'top_10_piids',
//             sortBy: 'dollars_obligated',
//             yAxis: {
//               field: 'piid',
//               displayFormat: 'ranked',  // "Contract #1", "Contract #2"
//               label: 'Contract PIID'
//             },
//             xAxis: {
//               field: 'dollars_obligated',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-green',
//             showValues: true,
//             valueFormat: 'currencyCompact',
//             tooltip: {
//               template: `
//                 <strong>PIID:</strong> {piid}<br>
//                 <strong>Obligations:</strong> {dollars_obligated:currency}<br>
//                 <strong>% of Total:</strong> {percentage_of_total}<br>
//                 <strong>Agencies:</strong> {agencies_using}
//               `
//             }
//           }
//         },
        
//         table: {
//           title: 'Top 10 Contract PIIDs',
//           columns: [
//             { header: 'Rank', field: 'rank' },
//             { header: 'PIID', field: 'piid', copyable: true, monospace: true },
//             { header: 'Obligations', field: 'dollars_obligated', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' },
//             { header: 'Agencies', field: 'agencies_using' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD L-2: Top 5 PIIDs - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'L-2',
//         cardTitle: 'Top 5 Contract Share',
//         cardDescription: 'Concentration in top individual contracts',
        
//         chart: {
//           type: 'donut',
//           title: 'Top 5 Contract PIIDs',
          
//           dataMapping: {
//             source: 'top_10_piids',
//             limit: 5,
//             addOther: true,
//             labels: { field: 'piid', format: 'abbreviated' },
//             values: { field: 'dollars_obligated' }
//           },
          
//           options: {
//             innerRadius: 0.5,
//             showLegend: true,
//             legendPosition: 'right',
//             legendFormat: 'full',
//             showSliceLabels: false,
//             colorScheme: ['#166534', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#e5e7eb']
//           }
//         },
        
//         table: {
//           title: 'Top 5 Contracts',
//           columns: [
//             { header: 'PIID', field: 'piid', copyable: true },
//             { header: 'Obligations', field: 'dollars_obligated', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD L-3: PIID Trends - Multi-Line
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'L-3',
//         cardTitle: 'Top 5 Contract Trends',
//         cardDescription: 'Year-over-year trends for top contracts',
        
//         chart: {
//           type: 'line-multi',
//           title: 'Top 5 Contract PIID Trends',
          
//           dataMapping: {
//             source: 'top_10_piids',
//             limit: 5,
//             xAxis: { source: 'fiscal_year_breakdown', label: 'Fiscal Year' },
//             series: {
//               dynamic: true,
//               nameField: 'piid',
//               nameFormat: 'abbreviated',
//               valueField: 'fiscal_year_breakdown.{year}.obligations'
//             }
//           },
          
//           options: {
//             showDataPoints: true,
//             showLegend: true,
//             legendPosition: 'bottom',
//             colorScheme: 'categorical-5'
//           }
//         },
        
//         table: {
//           title: 'Top 5 PIIDs by Year',
//           pivotTable: true,
//           rows: 'top5Piids',
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total'],
//           cellFormat: 'currency'
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD L-4: Yearly Totals - Bar Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'L-4',
//         cardTitle: 'Total Contract Obligations by Year',
//         cardDescription: 'Annual summary across all tracked PIIDs',
        
//         chart: {
//           type: 'bar',
//           title: 'Total PIID Obligations by Fiscal Year',
          
//           dataMapping: {
//             source: 'yearly_totals',
//             xAxis: { field: 'keys', format: 'FY{value}' },
//             yAxis: { field: 'values', format: 'currency' }
//           },
          
//           options: {
//             colorScale: 'sequential-green',
//             showValues: true
//           }
//         },
        
//         table: {
//           title: 'Yearly Summary',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Total', field: 'total', format: 'currency' },
//             { header: 'YoY Change', field: 'yoyChange', format: 'percentage' },
//             { header: '# PIIDs', field: 'count' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD L-5: Contract Size Distribution - Histogram Style
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'L-5',
//         cardTitle: 'Contract Value Distribution',
//         cardDescription: 'How contract values are distributed',
        
//         chart: {
//           type: 'bar',
//           title: 'Top 10 Contract Values Ranked',
//           subtitle: 'Descending by obligation amount',
          
//           dataMapping: {
//             source: 'top_10_piids',
//             xAxis: {
//               field: 'index',
//               label: 'Contract Rank',
//               format: '#{value}'
//             },
//             yAxis: {
//               field: 'dollars_obligated',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorByValue: true,
//             colorScale: 'sequential-green',
//             showValues: true,
//             valueFormat: 'currencyCompact',
//             descending: true
//           }
//         },
        
//         table: {
//           title: 'Contract Rankings',
//           columns: [
//             { header: 'Rank', field: 'rank' },
//             { header: 'PIID', field: 'piid', copyable: true },
//             { header: 'Value', field: 'dollars_obligated', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN M (Index 12): Active Contracts
//   // ===========================================================================
//   // Structure: summary + expiring_by_quarter (object map with quarter keys)
//   // Great for: Timeline views, quarter-based analysis
//   // ===========================================================================
  
//   activeContracts: {
//     columnInfo: {
//       column: 'M',
//       columnIndex: 12,
//       headerName: 'Active Contracts',
//       dataSource: 'FAS',
//       primaryValuePath: 'summary.total_obligations',
//       categoriesPath: 'expiring_by_quarter'
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD M-1: Expiration Timeline - Bar Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'M-1',
//         cardTitle: 'Contract Expiration Timeline',
//         cardDescription: 'When do contracts expire?',
        
//         chart: {
//           type: 'bar',
//           title: 'Contracts Expiring by Quarter',
//           subtitle: 'Obligations at risk of expiration',
          
//           dataMapping: {
//             source: 'expiring_by_quarter',
//             xAxis: {
//               field: 'keys',  // "Q1 FY26", "Q2 FY26", etc.
//               label: 'Quarter',
//               sortOrder: 'chronological'
//             },
//             yAxis: {
//               field: 'total_obligations_expiring',
//               label: 'Expiring Obligations ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: {
//               type: 'threshold',
//               thresholds: [10000000, 50000000, 100000000],
//               colors: ['#86efac', '#fbbf24', '#f87171', '#dc2626']
//             },
//             showValues: true,
//             valueFormat: 'currencyCompact'
//           }
//         },
        
//         table: {
//           title: 'Expiration Schedule',
//           columns: [
//             { header: 'Quarter', field: 'quarter' },
//             { header: 'Contracts Expiring', field: 'unique_contracts_expiring' },
//             { header: 'Obligations Expiring', field: 'total_obligations_expiring', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD M-2: Expiration Risk - Stacked Area
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'M-2',
//         cardTitle: 'Cumulative Expiration Risk',
//         cardDescription: 'Running total of expiring contracts',
        
//         chart: {
//           type: 'area',
//           title: 'Cumulative Contract Expirations',
          
//           dataMapping: {
//             source: 'expiring_by_quarter',
//             xAxis: { field: 'keys', label: 'Quarter' },
//             yAxis: {
//               field: 'cumulative',
//               calculated: true,
//               label: 'Cumulative Expiring ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             fillColor: '#fca5a5',
//             lineColor: '#dc2626',
//             fillOpacity: 0.3,
//             showDataPoints: true
//           }
//         },
        
//         table: {
//           title: 'Cumulative Expirations',
//           columns: [
//             { header: 'Quarter', field: 'quarter' },
//             { header: 'This Quarter', field: 'thisQuarter', format: 'currency' },
//             { header: 'Cumulative', field: 'cumulative', format: 'currency' },
//             { header: 'Cumulative %', field: 'cumulativePct', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD M-3: Contract Count vs Value - Dual Axis
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'M-3',
//         cardTitle: 'Expiring Contracts: Count vs Value',
//         cardDescription: 'Number of contracts vs dollar value',
        
//         chart: {
//           type: 'combo',
//           title: 'Contract Count vs Expiring Value',
          
//           dataMapping: {
//             source: 'expiring_by_quarter',
//             xAxis: { field: 'keys' },
//             primaryAxis: {
//               field: 'total_obligations_expiring',
//               type: 'bar',
//               label: 'Obligations ($)',
//               color: '#3b82f6'
//             },
//             secondaryAxis: {
//               field: 'unique_contracts_expiring',
//               type: 'line',
//               label: 'Contract Count',
//               color: '#dc2626'
//             }
//           },
          
//           options: {
//             showLegend: true,
//             dualAxis: true
//           }
//         },
        
//         table: {
//           title: 'Count vs Value',
//           columns: [
//             { header: 'Quarter', field: 'quarter' },
//             { header: '# Contracts', field: 'count' },
//             { header: 'Total Value', field: 'value', format: 'currency' },
//             { header: 'Avg Value', field: 'avgValue', format: 'currency', calculated: true }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD M-4: Expired vs Active - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'M-4',
//         cardTitle: 'Contract Status Overview',
//         cardDescription: 'Expired vs active contract obligations',
        
//         chart: {
//           type: 'donut',
//           title: 'Contract Status: Expired vs Active',
          
//           dataMapping: {
//             source: 'summary',
//             labels: ['Expired', 'Active'],
//             values: ['expired_obligations', 'active_obligations']  // active = total - expired
//           },
          
//           options: {
//             innerRadius: 0.6,
//             colorScheme: ['#dc2626', '#22c55e'],
//             showPercentages: true,
//             centerText: {
//               line1: 'Total',
//               line2: '{total:currency}'
//             }
//           }
//         },
        
//         table: {
//           title: 'Contract Status Summary',
//           columns: [
//             { header: 'Status', field: 'status' },
//             { header: 'Contracts', field: 'count' },
//             { header: 'Obligations', field: 'obligations', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD M-5: FY26 vs FY27 Comparison
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'M-5',
//         cardTitle: 'FY26 vs FY27 Expirations',
//         cardDescription: 'Compare near-term vs future expirations',
        
//         chart: {
//           type: 'bar-grouped',
//           title: 'Contract Expirations: FY26 vs FY27',
          
//           dataMapping: {
//             calculated: true,
//             xAxis: { field: 'quarter_number', label: 'Quarter' },  // Q1, Q2, Q3, Q4
//             series: [
//               { name: 'FY26', color: '#dc2626' },
//               { name: 'FY27', color: '#f97316' }
//             ]
//           },
          
//           options: {
//             showLegend: true,
//             showValues: true
//           }
//         },
        
//         table: {
//           title: 'FY Comparison',
//           columns: [
//             { header: 'Quarter', field: 'quarter' },
//             { header: 'FY26', field: 'fy26', format: 'currency' },
//             { header: 'FY27', field: 'fy27', format: 'currency' },
//             { header: 'Difference', field: 'diff', format: 'currency' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN O (Index 14): AI Product
//   // ===========================================================================
//   // Structure: Nested by fiscal year, each year has top_10_products array
//   // Great for: Product rankings by year, trend analysis
//   // Challenge: Long product names, nested data structure
//   // ===========================================================================
  
//   aiProduct: {
//     columnInfo: {
//       column: 'O',
//       columnIndex: 14,
//       headerName: 'AI Product',
//       dataSource: 'FAS',
//       primaryValuePath: 'summary.grand_total_obligations',
//       categoriesPath: 'fiscal_year_summaries',
//       structurePattern: 'PATTERN_D_NESTED_FISCAL_YEAR'
//     },
    
//     nameHandling: {
//       maxDisplayLength: 30,
//       truncationStyle: 'ellipsis',
//       commonPrefixRemoval: ['Amazon Web Services', 'AWS'],  // Remove common prefixes
//       tooltipShowFull: true
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD O-1: AI Product Spending by Year - Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'O-1',
//         cardTitle: 'AI Product Spending by Year',
//         cardDescription: 'Total AI-related product obligations',
        
//         chart: {
//           type: 'bar',
//           title: 'AI Product Obligations by Fiscal Year',
          
//           dataMapping: {
//             source: 'fiscal_year_summaries',
//             xAxis: {
//               field: 'keys',
//               format: 'FY{value}'
//             },
//             yAxis: {
//               field: 'total_obligations',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-purple',
//             showValues: true,
//             showGrowthIndicators: true
//           }
//         },
        
//         table: {
//           title: 'AI Product Summary by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Obligations', field: 'total_obligations', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_grand_total' },
//             { header: 'Unique Products', field: 'unique_products' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD O-2: Top 10 AI Products (Latest Year) - Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'O-2',
//         cardTitle: 'Top 10 AI Products (Current Year)',
//         cardDescription: 'Highest value AI products in latest fiscal year',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 10 AI Products - FY2025',
          
//           dataMapping: {
//             source: 'fiscal_year_summaries.2025.top_10_products',
//             // Or dynamically: latestYear.top_10_products
//             yAxis: {
//               field: 'product',
//               truncate: 35,
//               removePrefix: 'Amazon Web Services'
//             },
//             xAxis: {
//               field: 'obligations',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-purple',
//             showValues: true,
//             tooltipShowFullName: true
//           }
//         },
        
//         table: {
//           title: 'Top 10 AI Products - FY2025',
//           columns: [
//             { header: 'Rank', field: 'rank' },
//             { header: 'Product', field: 'product' },
//             { header: 'Obligations', field: 'obligations', format: 'currency' },
//             { header: '% of Year', field: 'percentage_of_year' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD O-3: Year-over-Year Product Comparison - Small Multiples
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'O-3',
//         cardTitle: 'Top Products by Year (Small Multiples)',
//         cardDescription: 'Side-by-side view of top products each year',
        
//         chart: {
//           type: 'small-multiples',
//           subType: 'bar-horizontal',
//           title: 'Top 5 AI Products by Fiscal Year',
          
//           dataMapping: {
//             source: 'fiscal_year_summaries',
//             facetBy: 'keys',  // One mini-chart per year
//             perFacet: {
//               source: 'top_10_products',
//               limit: 5,
//               yAxis: { field: 'product', truncate: 20 },
//               xAxis: { field: 'obligations' }
//             }
//           },
          
//           options: {
//             columns: 2,
//             rows: 2,
//             showFacetTitles: true,
//             facetTitleFormat: 'FY{value}',
//             synchronizeAxes: true
//           }
//         },
        
//         table: {
//           title: 'Top 5 Products by Year',
//           pivotTable: true,
//           structure: 'year-columns',
//           showRank: true
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD O-4: Product Count Trend - Line
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'O-4',
//         cardTitle: 'AI Product Diversity Trend',
//         cardDescription: 'Number of unique AI products over time',
        
//         chart: {
//           type: 'line',
//           title: 'Unique AI Products by Fiscal Year',
          
//           dataMapping: {
//             source: 'fiscal_year_summaries',
//             xAxis: { field: 'keys', format: 'FY{value}' },
//             yAxis: { field: 'unique_products', label: 'Unique Products' }
//           },
          
//           options: {
//             lineColor: '#8b5cf6',
//             showDataPoints: true,
//             showArea: true,
//             areaOpacity: 0.1
//           }
//         },
        
//         table: {
//           title: 'Product Count by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Unique Products', field: 'unique_products' },
//             { header: 'YoY Change', field: 'yoyChange', format: 'number' },
//             { header: '% Change', field: 'pctChange', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD O-5: AI Product Distribution - Treemap
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'O-5',
//         cardTitle: 'AI Product Landscape (All Years)',
//         cardDescription: 'Visual representation of AI product spending',
        
//         chart: {
//           type: 'treemap',
//           title: 'AI Product Spending Distribution',
          
//           dataMapping: {
//             // Aggregate products across all years
//             aggregated: true,
//             groupBy: 'product',
//             sumField: 'obligations',
//             limit: 20
//           },
          
//           options: {
//             colorScale: 'sequential-purple',
//             showLabels: true,
//             labelMinSize: 50,
//             tooltipShowDetails: true
//           }
//         },
        
//         table: {
//           title: 'All AI Products',
//           columns: [
//             { header: 'Product', field: 'product' },
//             { header: 'Total (All Years)', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ],
//           pagination: true
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN P (Index 15): AI Category
//   // ===========================================================================
//   // Structure: Same as AI Product but with categories instead of products
//   // Categories: Cloud & Infrastructure, Professional Services, etc.
//   // ===========================================================================
  
//   aiCategory: {
//     columnInfo: {
//       column: 'P',
//       columnIndex: 15,
//       headerName: 'AI Category',
//       dataSource: 'FAS',
//       primaryValuePath: 'summary.grand_total_obligations',
//       categoriesPath: 'fiscal_year_summaries'
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD P-1: Category Distribution - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'P-1',
//         cardTitle: 'AI Category Distribution',
//         cardDescription: 'Breakdown by AI product category',
        
//         chart: {
//           type: 'donut',
//           title: 'AI Obligations by Category',
          
//           dataMapping: {
//             // Aggregate categories across all years
//             aggregated: true,
//             source: 'fiscal_year_summaries',
//             collectFrom: 'top_10_categories',
//             groupBy: 'category',
//             sumField: 'obligations'
//           },
          
//           options: {
//             innerRadius: 0.5,
//             colorScheme: 'categorical-8',
//             showLegend: true,
//             legendPosition: 'right',
//             showPercentages: true
//           }
//         },
        
//         table: {
//           title: 'AI Categories',
//           columns: [
//             { header: 'Category', field: 'category' },
//             { header: 'Total Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD P-2: Category Trend - Stacked Area
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'P-2',
//         cardTitle: 'AI Category Trends',
//         cardDescription: 'How category mix changes over time',
        
//         chart: {
//           type: 'area-stacked',
//           title: 'AI Category Composition by Year',
          
//           dataMapping: {
//             source: 'fiscal_year_summaries',
//             xAxis: { field: 'keys', format: 'FY{value}' },
//             series: {
//               dynamic: true,
//               fromField: 'top_10_categories',
//               nameField: 'category',
//               valueField: 'obligations'
//             }
//           },
          
//           options: {
//             showLegend: true,
//             legendPosition: 'bottom',
//             colorScheme: 'categorical-8'
//           }
//         },
        
//         table: {
//           title: 'Categories by Year',
//           pivotTable: true,
//           rows: 'categories',
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total'],
//           cellFormat: 'currency'
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD P-3: Top Category by Year - Grouped Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'P-3',
//         cardTitle: 'Top Categories by Year',
//         cardDescription: 'Year-over-year category comparison',
        
//         chart: {
//           type: 'bar-grouped',
//           title: 'Top 5 AI Categories by Fiscal Year',
          
//           dataMapping: {
//             source: 'fiscal_year_summaries',
//             xAxis: { field: 'keys', format: 'FY{value}' },
//             series: {
//               limit: 5,
//               dynamic: true
//             }
//           },
          
//           options: {
//             showLegend: true,
//             colorScheme: 'categorical-5'
//           }
//         },
        
//         table: {
//           title: 'Top 5 Categories by Year',
//           columns: [
//             { header: 'Category', field: 'category' },
//             { header: 'FY2022', field: 'fy2022', format: 'currency' },
//             { header: 'FY2023', field: 'fy2023', format: 'currency' },
//             { header: 'FY2024', field: 'fy2024', format: 'currency' },
//             { header: 'FY2025', field: 'fy2025', format: 'currency' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD P-4: Cloud Dominance - Gauge
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'P-4',
//         cardTitle: 'Cloud & Infrastructure Dominance',
//         cardDescription: 'What percentage is cloud-related?',
        
//         chart: {
//           type: 'gauge',
//           title: 'Cloud & Infrastructure Share',
          
//           dataMapping: {
//             calculated: true,
//             value: 'cloudInfrastructure / total * 100'
//           },
          
//           options: {
//             min: 0,
//             max: 100,
//             ranges: [
//               { from: 0, to: 50, color: '#22c55e' },
//               { from: 50, to: 80, color: '#f59e0b' },
//               { from: 80, to: 100, color: '#dc2626' }
//             ],
//             label: 'Cloud Concentration'
//           }
//         },
        
//         table: {
//           title: 'Category Breakdown',
//           columns: [
//             { header: 'Category', field: 'category' },
//             { header: 'Obligations', field: 'obligations', format: 'currency' },
//             { header: '%', field: 'percentage', format: 'percentage' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN Q (Index 16): Top BIC Products
//   // ===========================================================================
//   // Structure: summary + yearly_totals + top_25_products (array)
//   // Great for: Product rankings, trend analysis
//   // Challenge: Long product names
//   // ===========================================================================
  
//   topBicProducts: {
//     columnInfo: {
//       column: 'Q',
//       columnIndex: 16,
//       headerName: 'Top BIC Products',
//       dataSource: 'BIC',
//       primaryValuePath: 'summary.total_all_products',
//       categoriesPath: 'top_25_products',
//       categoryValueType: 'array'
//     },
    
//     nameHandling: {
//       maxDisplayLength: 40,
//       truncationStyle: 'ellipsis',
//       tooltipShowFull: true
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD Q-1: Top 10 BIC Products - Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'Q-1',
//         cardTitle: 'Top 10 BIC Products',
//         cardDescription: 'Best-in-Class products by total price',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 10 BIC Products by Total Price',
          
//           dataMapping: {
//             source: 'top_25_products',
//             limit: 10,
//             sortBy: 'total_price',
//             yAxis: {
//               field: 'product_name',
//               truncate: 40
//             },
//             xAxis: {
//               field: 'total_price',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-blue',
//             showValues: true,
//             tooltipShowFullName: true
//           }
//         },
        
//         table: {
//           title: 'Top 10 BIC Products',
//           columns: [
//             { header: 'Rank', field: 'rank' },
//             { header: 'Product', field: 'product_name' },
//             { header: 'Total Price', field: 'total_price', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD Q-2: BIC Products - Treemap
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'Q-2',
//         cardTitle: 'BIC Product Landscape',
//         cardDescription: 'Visual representation of product sizes',
        
//         chart: {
//           type: 'treemap',
//           title: 'BIC Product Market Share',
          
//           dataMapping: {
//             source: 'top_25_products',
//             limit: 15,
//             id: { field: 'product_name', truncate: 25 },
//             value: { field: 'total_price' }
//           },
          
//           options: {
//             colorScale: 'sequential-blue',
//             showLabels: true,
//             labelMinSize: 60
//           }
//         },
        
//         table: {
//           title: 'Product Summary',
//           columns: [
//             { header: 'Product', field: 'product_name' },
//             { header: 'Total', field: 'total_price', format: 'currency' },
//             { header: '%', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD Q-3: Top 5 Products Trend - Multi-Line
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'Q-3',
//         cardTitle: 'Top 5 Product Trends',
//         cardDescription: 'Year-over-year trends for top products',
        
//         chart: {
//           type: 'line-multi',
//           title: 'Top 5 BIC Product Trends',
          
//           dataMapping: {
//             source: 'top_25_products',
//             limit: 5,
//             xAxis: {
//               source: 'fiscal_year_breakdown',
//               label: 'Fiscal Year'
//             },
//             series: {
//               dynamic: true,
//               nameField: 'product_name',
//               nameTruncate: 20,
//               valueField: 'fiscal_year_breakdown.{year}.total_price'
//             }
//           },
          
//           options: {
//             showDataPoints: true,
//             showLegend: true,
//             legendPosition: 'bottom',
//             colorScheme: 'categorical-5'
//           }
//         },
        
//         table: {
//           title: 'Top 5 Products by Year',
//           pivotTable: true,
//           rows: 'top5Products',
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total'],
//           cellFormat: 'currency'
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD Q-4: Yearly Totals - Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'Q-4',
//         cardTitle: 'BIC Product Spending by Year',
//         cardDescription: 'Total BIC product spend by fiscal year',
        
//         chart: {
//           type: 'bar',
//           title: 'BIC Product Totals by Fiscal Year',
          
//           dataMapping: {
//             source: 'yearly_totals',
//             xAxis: { field: 'keys', format: 'FY{value}' },
//             yAxis: { field: 'values', format: 'currency' }
//           },
          
//           options: {
//             colorScale: 'sequential-blue',
//             showValues: true,
//             showGrowth: true
//           }
//         },
        
//         table: {
//           title: 'Yearly Summary',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Total', field: 'total', format: 'currency' },
//             { header: 'YoY Change', field: 'yoyChange', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD Q-5: Top 5 Products - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'Q-5',
//         cardTitle: 'Top 5 Product Share',
//         cardDescription: 'Market concentration in top products',
        
//         chart: {
//           type: 'donut',
//           title: 'Top 5 BIC Products Share',
          
//           dataMapping: {
//             source: 'top_25_products',
//             limit: 5,
//             addOther: true,
//             labels: { field: 'product_name', truncate: 20 },
//             values: { field: 'total_price' }
//           },
          
//           options: {
//             innerRadius: 0.5,
//             showLegend: true,
//             legendPosition: 'right',
//             colorScheme: 'categorical-6'
//           }
//         },
        
//         table: {
//           title: 'Top 5 Products',
//           columns: [
//             { header: 'Product', field: 'product_name' },
//             { header: 'Total', field: 'total_price', format: 'currency' },
//             { header: '%', field: 'percentage_of_total' }
//           ]
//         }
//       }
//     ]
//   }
// };

// // ============================================================================
// // END OF PART 2
// // ============================================================================
// // Continue to Part 3 for columns R, S, T, U, V, W, X, AC
// // ============================================================================
// // ============================================================================
// // CHART BUFFET SPECIFICATIONS - PART 3
// // ============================================================================
// // 
// // Columns covered:
// // - Column R: Reseller (FAS) - Object map of top 15 resellers
// // - Column S: BIC Reseller - Array of top 15 resellers
// // - Column T: BIC OEM - Array of top 15 manufacturers
// // - Column U: FAS OEM - Object map (NOTE: uses total_obligations not total)
// // - Column V: Funding Agency - Object map of top 10 agencies
// // - Column W: BIC Top Products per Agency - Nested entity structure
// // - Column X: OneGov Tier - Tier classification data
// //
// // EXCLUDED (per requirements):
// // - Column J: OneGov Discounted Products
// // - Column N: Expiring OneGov Discounted Products
// // - Column AC: USAi Profile (not chart-friendly - text profile data)
// //
// // ============================================================================

// const CHART_BUFFET_SPECS_PART3 = {

//   // ===========================================================================
//   // COLUMN R (Index 17): Reseller (FAS)
//   // ===========================================================================
//   // Structure: summary + top_15_reseller_summaries (object map)
//   // Contains reseller/vendor data from FAS
//   // ===========================================================================
  
//   reseller: {
//     columnInfo: {
//       column: 'R',
//       columnIndex: 17,
//       headerName: 'Reseller',
//       dataSource: 'FAS',
//       primaryValuePath: 'summary.total_all_resellers',
//       categoriesPath: 'top_15_reseller_summaries',
//       categoryValueType: 'object_map'
//     },
    
//     nameHandling: {
//       maxDisplayLength: 25,
//       truncationStyle: 'ellipsis',
//       commonSuffixes: [', L.L.C.', ', LLC', ', INC.', ', Inc.', ' INC', ' LLC', ' CORP.', ' Corp.'],
//       removeCommonSuffixes: true
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD R-1: Top 15 Resellers - Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'R-1',
//         cardTitle: 'Top 15 Resellers',
//         cardDescription: 'Highest obligation resellers/vendors',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 15 Resellers by Obligations',
          
//           dataMapping: {
//             source: 'top_15_reseller_summaries',
//             sortBy: 'total',
//             sortDirection: 'desc',
//             yAxis: {
//               field: 'keys',
//               label: 'Reseller',
//               truncate: 25,
//               removeSuffixes: true
//             },
//             xAxis: {
//               field: 'total',
//               label: 'Obligations ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-teal',
//             showValues: true,
//             valueFormat: 'currencyCompact',
//             height: 'auto',
//             minBarHeight: 28
//           }
//         },
        
//         table: {
//           title: 'Top 15 Resellers',
//           columns: [
//             { header: 'Rank', field: 'rank' },
//             { header: 'Reseller', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD R-2: Top 5 Resellers - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'R-2',
//         cardTitle: 'Top 5 Reseller Market Share',
//         cardDescription: 'Market concentration in top resellers',
        
//         chart: {
//           type: 'donut',
//           title: 'Top 5 Resellers Share',
          
//           dataMapping: {
//             source: 'top_15_reseller_summaries',
//             limit: 5,
//             addOther: true,
//             labels: { field: 'keys', truncate: 18, removeSuffixes: true },
//             values: { field: 'total' }
//           },
          
//           options: {
//             innerRadius: 0.55,
//             showLegend: true,
//             legendPosition: 'right',
//             colorScheme: ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#e5e7eb']
//           }
//         },
        
//         table: {
//           title: 'Top 5 Resellers',
//           columns: [
//             { header: 'Reseller', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' },
//             { header: 'Cumulative %', field: 'cumulativePct', format: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD R-3: Top 5 Reseller Trends - Multi-Line
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'R-3',
//         cardTitle: 'Top 5 Reseller Trends',
//         cardDescription: 'Year-over-year trends for top resellers',
        
//         chart: {
//           type: 'line-multi',
//           title: 'Top 5 Reseller Trends by Fiscal Year',
          
//           dataMapping: {
//             source: 'top_15_reseller_summaries',
//             limit: 5,
//             sortBy: 'total',
//             xAxis: {
//               source: 'fiscal_years',
//               label: 'Fiscal Year',
//               format: 'FY{value}'
//             },
//             series: {
//               dynamic: true,
//               nameField: 'keys',
//               nameTruncate: 15,
//               valueField: 'fiscal_years'
//             }
//           },
          
//           options: {
//             showDataPoints: true,
//             showLegend: true,
//             legendPosition: 'bottom',
//             colorScheme: 'categorical-5'
//           }
//         },
        
//         table: {
//           title: 'Top 5 Resellers by Year',
//           pivotTable: true,
//           rows: 'top5Resellers',
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total'],
//           cellFormat: 'currency'
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD R-4: Reseller Stacked Bar by Year
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'R-4',
//         cardTitle: 'Reseller Mix by Year',
//         cardDescription: 'How reseller spending changes annually',
        
//         chart: {
//           type: 'bar-stacked',
//           title: 'Top 5 Resellers by Fiscal Year',
          
//           dataMapping: {
//             source: 'top_15_reseller_summaries',
//             limit: 5,
//             addOther: true,
//             xAxis: { source: 'fiscal_years', format: 'FY{value}' },
//             series: { dynamic: true }
//           },
          
//           options: {
//             showLegend: true,
//             legendPosition: 'bottom',
//             colorScheme: 'categorical-6'
//           }
//         },
        
//         table: {
//           title: 'Reseller Breakdown by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Four Points', field: 'fourPoints', format: 'currency' },
//             { header: 'AWS Inc', field: 'awsInc', format: 'currency' },
//             { header: 'Strategic Comm', field: 'strategicComm', format: 'currency' },
//             { header: 'Other', field: 'other', format: 'currency' },
//             { header: 'Total', field: 'total', format: 'currency' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD R-5: Reseller Treemap
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'R-5',
//         cardTitle: 'Reseller Landscape',
//         cardDescription: 'Visual map of reseller market share',
        
//         chart: {
//           type: 'treemap',
//           title: 'Reseller Market Share',
          
//           dataMapping: {
//             source: 'top_15_reseller_summaries',
//             id: { field: 'keys', truncate: 20, removeSuffixes: true },
//             value: { field: 'total' }
//           },
          
//           options: {
//             colorScale: 'sequential-teal',
//             showLabels: true,
//             labelMinSize: 50
//           }
//         },
        
//         table: {
//           title: 'All Resellers',
//           columns: [
//             { header: 'Reseller', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '%', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD R-6: Reseller Concentration - Pareto
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'R-6',
//         cardTitle: 'Reseller Concentration Analysis',
//         cardDescription: 'How concentrated is spending across resellers?',
        
//         chart: {
//           type: 'bar-pareto',
//           title: 'Reseller Concentration (Pareto)',
          
//           dataMapping: {
//             source: 'top_15_reseller_summaries',
//             bars: { field: 'total' },
//             line: { calculated: 'cumulativePercentage' }
//           },
          
//           options: {
//             barColor: '#14b8a6',
//             lineColor: '#dc2626',
//             show80PercentLine: true
//           }
//         },
        
//         table: {
//           title: 'Concentration Analysis',
//           columns: [
//             { header: 'Reseller', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '%', field: 'percentage', format: 'percentage' },
//             { header: 'Cumulative %', field: 'cumulativePct', format: 'percentage' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN S (Index 18): BIC Reseller
//   // ===========================================================================
//   // Structure: summary + yearly_totals + top_15_resellers (array)
//   // Similar to Column R but from BIC data source, uses array structure
//   // ===========================================================================
  
//   bicReseller: {
//     columnInfo: {
//       column: 'S',
//       columnIndex: 18,
//       headerName: 'BIC Reseller',
//       dataSource: 'BIC',
//       primaryValuePath: 'summary.total_all_resellers',
//       categoriesPath: 'top_15_resellers',
//       categoryValueType: 'array',
//       arrayItemKeyField: 'vendor_name',
//       arrayItemValueField: 'total_sales'
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD S-1: Top 15 BIC Resellers - Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'S-1',
//         cardTitle: 'Top 15 BIC Resellers',
//         cardDescription: 'Top resellers from BIC data',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 15 BIC Resellers by Sales',
          
//           dataMapping: {
//             source: 'top_15_resellers',
//             sortBy: 'total_sales',
//             yAxis: {
//               field: 'vendor_name',
//               truncate: 25
//             },
//             xAxis: {
//               field: 'total_sales',
//               label: 'Total Sales ($)',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-cyan',
//             showValues: true
//           }
//         },
        
//         table: {
//           title: 'Top 15 BIC Resellers',
//           columns: [
//             { header: 'Rank', field: 'rank' },
//             { header: 'Vendor', field: 'vendor_name' },
//             { header: 'Total Sales', field: 'total_sales', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD S-2: Top 5 BIC Resellers - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'S-2',
//         cardTitle: 'Top 5 BIC Reseller Share',
//         cardDescription: 'BIC reseller market concentration',
        
//         chart: {
//           type: 'donut',
//           title: 'Top 5 BIC Resellers',
          
//           dataMapping: {
//             source: 'top_15_resellers',
//             limit: 5,
//             addOther: true,
//             labels: { field: 'vendor_name', truncate: 18 },
//             values: { field: 'total_sales' }
//           },
          
//           options: {
//             innerRadius: 0.5,
//             colorScheme: 'categorical-6',
//             showLegend: true
//           }
//         },
        
//         table: {
//           title: 'Top 5 BIC Resellers',
//           columns: [
//             { header: 'Vendor', field: 'vendor_name' },
//             { header: 'Sales', field: 'total_sales', format: 'currency' },
//             { header: '%', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD S-3: BIC Reseller Trends - Multi-Line
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'S-3',
//         cardTitle: 'Top 5 BIC Reseller Trends',
//         cardDescription: 'Year-over-year BIC reseller trends',
        
//         chart: {
//           type: 'line-multi',
//           title: 'Top 5 BIC Reseller Trends',
          
//           dataMapping: {
//             source: 'top_15_resellers',
//             limit: 5,
//             xAxis: { source: 'fiscal_year_breakdown', format: 'FY{value}' },
//             series: {
//               dynamic: true,
//               nameField: 'vendor_name',
//               nameTruncate: 15,
//               valueField: 'fiscal_year_breakdown.{year}.total_sales'
//             }
//           },
          
//           options: {
//             showDataPoints: true,
//             showLegend: true,
//             legendPosition: 'bottom'
//           }
//         },
        
//         table: {
//           title: 'BIC Resellers by Year',
//           pivotTable: true,
//           rows: 'top5Resellers',
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total']
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD S-4: Yearly BIC Reseller Totals - Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'S-4',
//         cardTitle: 'BIC Reseller Totals by Year',
//         cardDescription: 'Annual BIC reseller sales',
        
//         chart: {
//           type: 'bar',
//           title: 'BIC Reseller Sales by Fiscal Year',
          
//           dataMapping: {
//             source: 'yearly_totals',
//             xAxis: { field: 'keys', format: 'FY{value}' },
//             yAxis: { field: 'values', format: 'currency' }
//           },
          
//           options: {
//             colorScale: 'sequential-cyan',
//             showValues: true
//           }
//         },
        
//         table: {
//           title: 'Yearly Summary',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Total Sales', field: 'total', format: 'currency' },
//             { header: 'YoY Change', field: 'yoyChange', format: 'percentage' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN T (Index 19): BIC OEM
//   // ===========================================================================
//   // Structure: summary + yearly_totals + top_15_manufacturers (array)
//   // Manufacturers/OEMs from BIC data
//   // ===========================================================================
  
//   bicOem: {
//     columnInfo: {
//       column: 'T',
//       columnIndex: 19,
//       headerName: 'BIC OEM',
//       dataSource: 'BIC',
//       primaryValuePath: 'summary.total_all_manufacturers',
//       categoriesPath: 'top_15_manufacturers',
//       categoryValueType: 'array',
//       arrayItemKeyField: 'manufacturer_name',
//       arrayItemValueField: 'total_sales'
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD T-1: Top 15 Manufacturers - Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'T-1',
//         cardTitle: 'Top 15 OEMs/Manufacturers',
//         cardDescription: 'Top manufacturers from BIC data',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 15 Manufacturers by Sales',
          
//           dataMapping: {
//             source: 'top_15_manufacturers',
//             sortBy: 'total_sales',
//             yAxis: {
//               field: 'manufacturer_name',
//               truncate: 25
//             },
//             xAxis: {
//               field: 'total_sales',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-indigo',
//             showValues: true
//           }
//         },
        
//         table: {
//           title: 'Top 15 Manufacturers',
//           columns: [
//             { header: 'Rank', field: 'rank' },
//             { header: 'Manufacturer', field: 'manufacturer_name' },
//             { header: 'Total Sales', field: 'total_sales', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD T-2: Top 5 Manufacturers - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'T-2',
//         cardTitle: 'Top 5 Manufacturer Share',
//         cardDescription: 'OEM market concentration',
        
//         chart: {
//           type: 'donut',
//           title: 'Top 5 Manufacturers',
          
//           dataMapping: {
//             source: 'top_15_manufacturers',
//             limit: 5,
//             addOther: true,
//             labels: { field: 'manufacturer_name', truncate: 18 },
//             values: { field: 'total_sales' }
//           },
          
//           options: {
//             innerRadius: 0.5,
//             colorScheme: 'categorical-6',
//             showLegend: true,
//             legendPosition: 'right'
//           }
//         },
        
//         table: {
//           title: 'Top 5 Manufacturers',
//           columns: [
//             { header: 'Manufacturer', field: 'manufacturer_name' },
//             { header: 'Sales', field: 'total_sales', format: 'currency' },
//             { header: '%', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD T-3: Manufacturer Trends - Multi-Line
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'T-3',
//         cardTitle: 'Top 5 Manufacturer Trends',
//         cardDescription: 'OEM trends over time',
        
//         chart: {
//           type: 'line-multi',
//           title: 'Top 5 Manufacturer Trends',
          
//           dataMapping: {
//             source: 'top_15_manufacturers',
//             limit: 5,
//             xAxis: { source: 'fiscal_year_breakdown', format: 'FY{value}' },
//             series: {
//               dynamic: true,
//               nameField: 'manufacturer_name',
//               nameTruncate: 15,
//               valueField: 'fiscal_year_breakdown.{year}.total_sales'
//             }
//           },
          
//           options: {
//             showDataPoints: true,
//             showLegend: true,
//             colorScheme: 'categorical-5'
//           }
//         },
        
//         table: {
//           title: 'Manufacturers by Year',
//           pivotTable: true,
//           rows: 'top5Manufacturers',
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total']
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD T-4: Manufacturer Treemap
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'T-4',
//         cardTitle: 'OEM Landscape',
//         cardDescription: 'Visual map of manufacturer market share',
        
//         chart: {
//           type: 'treemap',
//           title: 'Manufacturer Market Share',
          
//           dataMapping: {
//             source: 'top_15_manufacturers',
//             id: { field: 'manufacturer_name', truncate: 20 },
//             value: { field: 'total_sales' }
//           },
          
//           options: {
//             colorScale: 'sequential-indigo',
//             showLabels: true,
//             labelMinSize: 50
//           }
//         },
        
//         table: {
//           title: 'All Manufacturers',
//           columns: [
//             { header: 'Manufacturer', field: 'manufacturer_name' },
//             { header: 'Sales', field: 'total_sales', format: 'currency' },
//             { header: '%', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD T-5: Yearly OEM Totals - Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'T-5',
//         cardTitle: 'OEM Sales by Year',
//         cardDescription: 'Annual manufacturer sales totals',
        
//         chart: {
//           type: 'bar',
//           title: 'Manufacturer Sales by Fiscal Year',
          
//           dataMapping: {
//             source: 'yearly_totals',
//             xAxis: { field: 'keys', format: 'FY{value}' },
//             yAxis: { field: 'values', format: 'currency' }
//           },
          
//           options: {
//             colorScale: 'sequential-indigo',
//             showValues: true
//           }
//         },
        
//         table: {
//           title: 'Yearly Summary',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Total', field: 'total', format: 'currency' },
//             { header: 'YoY Change', field: 'yoyChange', format: 'percentage' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN U (Index 20): FAS OEM
//   // ===========================================================================
//   // Structure: summary + top_10_oem_summaries (object map)
//   // IMPORTANT: Uses 'total_obligations' NOT 'total' for item values!
//   // ===========================================================================
  
//   fasOem: {
//     columnInfo: {
//       column: 'U',
//       columnIndex: 20,
//       headerName: 'FAS OEM',
//       dataSource: 'FAS',
//       primaryValuePath: 'summary.total_all_oems',
//       categoriesPath: 'top_10_oem_summaries',
//       categoryValueType: 'object_map',
//       // IMPORTANT: Different field name!
//       itemValueField: 'total_obligations'  // NOT 'total'
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD U-1: Top 10 FAS OEMs - Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'U-1',
//         cardTitle: 'Top 10 OEMs (FAS Data)',
//         cardDescription: 'Top OEMs from FAS procurement data',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 10 OEMs by Obligations',
          
//           dataMapping: {
//             source: 'top_10_oem_summaries',
//             sortBy: 'total_obligations',  // NOTE: Different field!
//             yAxis: {
//               field: 'keys',
//               truncate: 25
//             },
//             xAxis: {
//               field: 'total_obligations',  // NOTE: Different field!
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-amber',
//             showValues: true
//           }
//         },
        
//         table: {
//           title: 'Top 10 FAS OEMs',
//           columns: [
//             { header: 'Rank', field: 'rank' },
//             { header: 'OEM', field: 'name' },
//             { header: 'Obligations', field: 'total_obligations', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD U-2: FAS OEM Distribution - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'U-2',
//         cardTitle: 'FAS OEM Market Share',
//         cardDescription: 'OEM distribution from FAS data',
        
//         chart: {
//           type: 'donut',
//           title: 'FAS OEM Distribution',
          
//           dataMapping: {
//             source: 'top_10_oem_summaries',
//             labels: { field: 'keys' },
//             values: { field: 'total_obligations' }
//           },
          
//           options: {
//             innerRadius: 0.5,
//             colorScheme: 'categorical-10',
//             showLegend: true
//           }
//         },
        
//         table: {
//           title: 'FAS OEM Distribution',
//           columns: [
//             { header: 'OEM', field: 'name' },
//             { header: 'Obligations', field: 'total_obligations', format: 'currency' },
//             { header: '%', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD U-3: FAS OEM Trends - Multi-Line
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'U-3',
//         cardTitle: 'FAS OEM Trends',
//         cardDescription: 'OEM obligations over time',
        
//         chart: {
//           type: 'line-multi',
//           title: 'FAS OEM Trends by Fiscal Year',
          
//           dataMapping: {
//             source: 'top_10_oem_summaries',
//             limit: 5,
//             xAxis: { source: 'fiscal_years', format: 'FY{value}' },
//             series: {
//               dynamic: true,
//               nameField: 'keys',
//               valueField: 'fiscal_years'
//             }
//           },
          
//           options: {
//             showDataPoints: true,
//             showLegend: true,
//             colorScheme: 'categorical-5'
//           }
//         },
        
//         table: {
//           title: 'FAS OEMs by Year',
//           pivotTable: true,
//           rows: 'oems',
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total']
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD U-4: FAS OEM Stacked Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'U-4',
//         cardTitle: 'FAS OEM Mix by Year',
//         cardDescription: 'Annual OEM composition',
        
//         chart: {
//           type: 'bar-stacked',
//           title: 'FAS OEM Composition by Year',
          
//           dataMapping: {
//             source: 'top_10_oem_summaries',
//             xAxis: { source: 'fiscal_years', format: 'FY{value}' },
//             series: { dynamic: true }
//           },
          
//           options: {
//             showLegend: true,
//             colorScheme: 'categorical-10'
//           }
//         },
        
//         table: {
//           title: 'OEM Breakdown by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             // Dynamic columns based on OEMs
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN V (Index 21): Funding Agency
//   // ===========================================================================
//   // Structure: summary + top_10_agency_summaries (object map)
//   // Sub-department level agencies (more granular than Column I)
//   // ===========================================================================
  
//   fundingAgency: {
//     columnInfo: {
//       column: 'V',
//       columnIndex: 21,
//       headerName: 'Funding Agency',
//       dataSource: 'FAS',
//       primaryValuePath: 'summary.total_all_agencies',
//       categoriesPath: 'top_10_agency_summaries'
//     },
    
//     nameHandling: {
//       maxDisplayLength: 25,
//       truncationStyle: 'ellipsis',
//       commonPatterns: [
//         { match: 'U.S. CUSTOMS AND BORDER PROTECTION', replace: 'CBP' },
//         { match: 'DEPT OF THE NAVY', replace: 'Navy' },
//         { match: 'DEPT OF THE AIR FORCE', replace: 'Air Force' },
//         { match: 'DEPT OF THE ARMY', replace: 'Army' },
//         { match: 'DEFENSE HEALTH AGENCY (DHA)', replace: 'DHA' },
//         { match: 'VETERANS AFFAIRS, DEPARTMENT OF', replace: 'VA' }
//       ]
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD V-1: Top 10 Funding Agencies - Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'V-1',
//         cardTitle: 'Top 10 Funding Agencies',
//         cardDescription: 'Sub-department agencies with highest obligations',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 10 Funding Agencies',
          
//           dataMapping: {
//             source: 'top_10_agency_summaries',
//             sortBy: 'total',
//             yAxis: {
//               field: 'keys',
//               truncate: 25,
//               usePatternReplacement: true
//             },
//             xAxis: {
//               field: 'total',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-rose',
//             showValues: true
//           }
//         },
        
//         table: {
//           title: 'Top 10 Funding Agencies',
//           columns: [
//             { header: 'Rank', field: 'rank' },
//             { header: 'Agency', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD V-2: Agency Share - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'V-2',
//         cardTitle: 'Funding Agency Distribution',
//         cardDescription: 'Market share across agencies',
        
//         chart: {
//           type: 'donut',
//           title: 'Funding Agency Share',
          
//           dataMapping: {
//             source: 'top_10_agency_summaries',
//             limit: 5,
//             addOther: true,
//             labels: { field: 'keys', usePatternReplacement: true },
//             values: { field: 'total' }
//           },
          
//           options: {
//             innerRadius: 0.55,
//             colorScheme: ['#be123c', '#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#e5e7eb'],
//             showLegend: true
//           }
//         },
        
//         table: {
//           title: 'Agency Distribution',
//           columns: [
//             { header: 'Agency', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '%', field: 'percentage_of_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD V-3: Agency Trends - Multi-Line
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'V-3',
//         cardTitle: 'Top 5 Agency Trends',
//         cardDescription: 'Year-over-year agency spending',
        
//         chart: {
//           type: 'line-multi',
//           title: 'Top 5 Funding Agency Trends',
          
//           dataMapping: {
//             source: 'top_10_agency_summaries',
//             limit: 5,
//             xAxis: { source: 'fiscal_years', format: 'FY{value}' },
//             series: {
//               dynamic: true,
//               nameField: 'keys',
//               nameTruncate: 12,
//               valueField: 'fiscal_years'
//             }
//           },
          
//           options: {
//             showDataPoints: true,
//             showLegend: true,
//             legendPosition: 'bottom'
//           }
//         },
        
//         table: {
//           title: 'Agencies by Year',
//           pivotTable: true,
//           rows: 'top5Agencies',
//           columns: ['FY2022', 'FY2023', 'FY2024', 'FY2025', 'Total']
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD V-4: Agency Stacked Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'V-4',
//         cardTitle: 'Agency Mix by Year',
//         cardDescription: 'How agency spending changes annually',
        
//         chart: {
//           type: 'bar-stacked',
//           title: 'Funding Agency Mix by Fiscal Year',
          
//           dataMapping: {
//             source: 'top_10_agency_summaries',
//             limit: 5,
//             addOther: true,
//             xAxis: { source: 'fiscal_years' }
//           },
          
//           options: {
//             showLegend: true,
//             legendPosition: 'bottom',
//             colorScheme: 'categorical-6'
//           }
//         },
        
//         table: {
//           title: 'Agency Breakdown by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'CBP', field: 'cbp', format: 'currency' },
//             { header: 'Navy', field: 'navy', format: 'currency' },
//             { header: 'VA', field: 'va', format: 'currency' },
//             { header: 'DHA', field: 'dha', format: 'currency' },
//             { header: 'Other', field: 'other', format: 'currency' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD V-5: Agency Treemap
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'V-5',
//         cardTitle: 'Agency Landscape',
//         cardDescription: 'Visual map of agency obligations',
        
//         chart: {
//           type: 'treemap',
//           title: 'Funding Agency Market Share',
          
//           dataMapping: {
//             source: 'top_10_agency_summaries',
//             id: { field: 'keys', usePatternReplacement: true },
//             value: { field: 'total' }
//           },
          
//           options: {
//             colorScale: 'sequential-rose',
//             showLabels: true
//           }
//         },
        
//         table: {
//           title: 'All Agencies',
//           columns: [
//             { header: 'Agency', field: 'name' },
//             { header: 'Obligations', field: 'total', format: 'currency' },
//             { header: '%', field: 'percentage_of_total' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN W (Index 22): BIC Top Products per Agency
//   // ===========================================================================
//   // Structure: Nested - top_10_agencies -> each has top_3_products array
//   // Most complex structure - great for hierarchical visualizations
//   // ===========================================================================
  
//   bicTopProductsPerAgency: {
//     columnInfo: {
//       column: 'W',
//       columnIndex: 22,
//       headerName: 'BIC Top Products per Agency',
//       dataSource: 'BIC',
//       primaryValuePath: 'summary.grand_total',
//       categoriesPath: 'top_10_agencies',
//       structurePattern: 'PATTERN_E_NESTED_ENTITY'
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD W-1: Agency Totals - Horizontal Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'W-1',
//         cardTitle: 'Top 10 Agencies (BIC Products)',
//         cardDescription: 'Agency spending on BIC products',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 10 Agencies - BIC Product Spend',
          
//           dataMapping: {
//             source: 'top_10_agencies',
//             sortBy: 'agency_total',
//             yAxis: { field: 'keys' },
//             xAxis: {
//               field: 'agency_total',
//               format: 'currency'
//             }
//           },
          
//           options: {
//             colorScale: 'sequential-violet',
//             showValues: true
//           }
//         },
        
//         table: {
//           title: 'Agency BIC Spending',
//           columns: [
//             { header: 'Agency', field: 'agency' },
//             { header: 'Total', field: 'agency_total', format: 'currency' },
//             { header: '% of Total', field: 'percentage_of_grand_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD W-2: Agency Products - Grouped/Nested Bar
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'W-2',
//         cardTitle: 'Top Products by Agency',
//         cardDescription: 'Top 3 products for each top agency',
        
//         chart: {
//           type: 'bar-grouped-nested',
//           title: 'Top 3 Products per Agency',
          
//           dataMapping: {
//             source: 'top_10_agencies',
//             limit: 5,  // Show top 5 agencies
//             groupBy: 'keys',  // Agency name
//             nestedData: 'top_3_products',
//             nestedLabel: { field: 'product_name', truncate: 20 },
//             nestedValue: { field: 'total_price' }
//           },
          
//           options: {
//             showLegend: false,  // Too many products for legend
//             colorByGroup: true,
//             tooltipShowDetails: true
//           }
//         },
        
//         table: {
//           title: 'Products by Agency',
//           hierarchical: true,
//           columns: [
//             { header: 'Agency / Product', field: 'name' },
//             { header: 'Amount', field: 'amount', format: 'currency' },
//             { header: '%', field: 'percentage' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD W-3: Agency Distribution - Donut
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'W-3',
//         cardTitle: 'Agency BIC Distribution',
//         cardDescription: 'BIC spending by agency',
        
//         chart: {
//           type: 'donut',
//           title: 'BIC Products by Agency',
          
//           dataMapping: {
//             source: 'top_10_agencies',
//             limit: 5,
//             addOther: true,
//             labels: { field: 'keys' },
//             values: { field: 'agency_total' }
//           },
          
//           options: {
//             innerRadius: 0.5,
//             colorScheme: 'categorical-6',
//             showLegend: true
//           }
//         },
        
//         table: {
//           title: 'Agency Distribution',
//           columns: [
//             { header: 'Agency', field: 'agency' },
//             { header: 'BIC Spend', field: 'agency_total', format: 'currency' },
//             { header: '%', field: 'percentage_of_grand_total' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD W-4: Sunburst - Hierarchical View
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'W-4',
//         cardTitle: 'Agency → Product Hierarchy',
//         cardDescription: 'Hierarchical view of agency products',
        
//         chart: {
//           type: 'sunburst',
//           title: 'BIC Products by Agency (Hierarchical)',
          
//           dataMapping: {
//             source: 'top_10_agencies',
//             hierarchy: [
//               { level: 1, field: 'keys', label: 'Agency' },
//               { level: 2, source: 'top_3_products', field: 'product_name', truncate: 15 }
//             ],
//             value: {
//               level1: 'agency_total',
//               level2: 'total_price'
//             }
//           },
          
//           options: {
//             colorScheme: 'categorical-10',
//             showLabels: true,
//             labelMinAngle: 10
//           }
//         },
        
//         table: {
//           title: 'Agency Products (Hierarchical)',
//           hierarchical: true,
//           expandable: true,
//           columns: [
//             { header: 'Agency / Product', field: 'name' },
//             { header: 'Amount', field: 'amount', format: 'currency' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD W-5: Top 3 Product Concentration by Agency
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'W-5',
//         cardTitle: 'Product Concentration by Agency',
//         cardDescription: 'How concentrated is each agency\'s spending?',
        
//         chart: {
//           type: 'bar-horizontal',
//           title: 'Top 3 Products % of Agency Total',
          
//           dataMapping: {
//             source: 'top_10_agencies',
//             yAxis: { field: 'keys' },
//             xAxis: {
//               field: 'top_3_percentage_of_agency',
//               parsePercentage: true,
//               domain: [0, 100]
//             }
//           },
          
//           options: {
//             colorScale: {
//               type: 'threshold',
//               thresholds: [50, 75, 90],
//               colors: ['#22c55e', '#f59e0b', '#f97316', '#dc2626']
//             },
//             showValues: true,
//             valueFormat: 'percentage'
//           }
//         },
        
//         table: {
//           title: 'Product Concentration',
//           columns: [
//             { header: 'Agency', field: 'agency' },
//             { header: 'Top 3 Products Total', field: 'top_3_products_total', format: 'currency' },
//             { header: 'Agency Total', field: 'agency_total', format: 'currency' },
//             { header: 'Top 3 %', field: 'top_3_percentage_of_agency' }
//           ]
//         }
//       }
//     ]
//   },

//   // ===========================================================================
//   // COLUMN X (Index 23): OneGov Tier
//   // ===========================================================================
//   // Structure: Tier classification with fiscal year breakdown
//   // Shows calculated tier based on obligations
//   // ===========================================================================
  
//   oneGovTier: {
//     columnInfo: {
//       column: 'X',
//       columnIndex: 23,
//       headerName: 'OneGov Tier',
//       dataSource: 'CALCULATED',
//       primaryValuePath: 'total_obligated'
//     },
    
//     cards: [
//       // -----------------------------------------------------------------------
//       // CARD X-1: Tier Classification - Gauge
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'X-1',
//         cardTitle: 'OneGov Tier Classification',
//         cardDescription: 'Current tier based on average obligations',
        
//         chart: {
//           type: 'tier-badge',  // Custom component
//           title: 'OneGov Tier',
          
//           dataMapping: {
//             overallTier: 'overall_tier',
//             modeTier: 'mode_tier',
//             totalObligated: 'total_obligated',
//             formattedTotal: 'formatted_total'
//           },
          
//           options: {
//             tierColors: {
//               'Tier 1': '#16a34a',  // Green - highest
//               'Tier 2': '#3b82f6',  // Blue
//               'Tier 3': '#f59e0b',  // Amber
//               'Tier 4': '#f97316',  // Orange
//               'Below Tier 4': '#dc2626'  // Red - lowest
//             },
//             showDefinition: true
//           }
//         },
        
//         table: {
//           title: 'Tier Classification Details',
//           columns: [
//             { header: 'Metric', field: 'metric' },
//             { header: 'Value', field: 'value' }
//           ],
//           rows: [
//             { metric: 'Overall Tier', valueField: 'overall_tier' },
//             { metric: 'Mode Tier', valueField: 'mode_tier' },
//             { metric: 'Total Obligated', valueField: 'formatted_total' },
//             { metric: 'Avg/Year', valueField: 'formatted_average' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD X-2: Tier by Year - Bar with Tier Colors
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'X-2',
//         cardTitle: 'Tier by Fiscal Year',
//         cardDescription: 'How tier classification changed over time',
        
//         chart: {
//           type: 'bar',
//           title: 'Annual Tier Classification',
          
//           dataMapping: {
//             source: 'fiscal_year_tiers',
//             xAxis: {
//               field: 'keys',
//               format: 'FY{value}'
//             },
//             yAxis: {
//               field: 'amount',
//               format: 'currency'
//             },
//             colorBy: {
//               field: 'tier',
//               colorMap: {
//                 'Tier 1': '#16a34a',
//                 'Tier 2': '#3b82f6',
//                 'Tier 3': '#f59e0b',
//                 'Tier 4': '#f97316',
//                 'Below Tier 4': '#dc2626'
//               }
//             }
//           },
          
//           options: {
//             showValues: true,
//             showTierLabels: true,
//             tierLabelPosition: 'top'
//           }
//         },
        
//         table: {
//           title: 'Tier by Year',
//           columns: [
//             { header: 'Fiscal Year', field: 'year' },
//             { header: 'Amount', field: 'amount', format: 'currency' },
//             { header: 'Tier', field: 'tier' },
//             { header: 'Formatted', field: 'formatted_amount' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD X-3: Tier Distribution - Pie
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'X-3',
//         cardTitle: 'Tier Distribution Across Years',
//         cardDescription: 'How many years in each tier?',
        
//         chart: {
//           type: 'pie',
//           title: 'Years by Tier',
          
//           dataMapping: {
//             source: 'tier_counts',
//             labels: { field: 'keys' },
//             values: { field: 'values' }
//           },
          
//           options: {
//             colorScheme: {
//               'Tier 1': '#16a34a',
//               'Tier 2': '#3b82f6',
//               'Tier 3': '#f59e0b',
//               'Tier 4': '#f97316'
//             },
//             showLabels: true,
//             showPercentages: false,  // Show count instead
//             showCounts: true
//           }
//         },
        
//         table: {
//           title: 'Tier Counts',
//           columns: [
//             { header: 'Tier', field: 'tier' },
//             { header: 'Years', field: 'count' },
//             { header: 'Definition', field: 'definition' }
//           ]
//         }
//       },
      
//       // -----------------------------------------------------------------------
//       // CARD X-4: Tier Thresholds - Reference Chart
//       // -----------------------------------------------------------------------
//       {
//         cardId: 'X-4',
//         cardTitle: 'Tier Threshold Reference',
//         cardDescription: 'Where does this entity fall in tier thresholds?',
        
//         chart: {
//           type: 'bullet',  // Bullet chart showing position
//           title: 'Position Against Tier Thresholds',
          
//           dataMapping: {
//             actual: 'average_obligations_per_year',
//             thresholds: [
//               { value: 10000000, label: 'Tier 4', color: '#f97316' },
//               { value: 50000000, label: 'Tier 3', color: '#f59e0b' },
//               { value: 200000000, label: 'Tier 2', color: '#3b82f6' },
//               { value: 500000000, label: 'Tier 1', color: '#16a34a' }
//             ]
//           },
          
//           options: {
//             showActualMarker: true,
//             markerLabel: 'Current Average',
//             orientation: 'horizontal'
//           }
//         },
        
//         table: {
//           title: 'Tier Definitions',
//           columns: [
//             { header: 'Tier', field: 'tier' },
//             { header: 'Threshold', field: 'threshold' },
//             { header: 'This Entity', field: 'meetsThreshold', type: 'boolean' }
//           ],
//           rows: [
//             { tier: 'Tier 1', threshold: '> $500M' },
//             { tier: 'Tier 2', threshold: '$200M - $500M' },
//             { tier: 'Tier 3', threshold: '$50M - $200M' },
//             { tier: 'Tier 4', threshold: '$10M - $50M' },
//             { tier: 'Below Tier 4', threshold: '< $10M' }
//           ]
//         }
//       }
//     ]
//   }
// };


// // ============================================================================
// // CHART TYPE REFERENCE
// // ============================================================================

// const CHART_TYPE_REFERENCE = {
//   // Basic Charts
//   'bar': 'Vertical bar chart - good for comparing categories',
//   'bar-horizontal': 'Horizontal bar chart - good for long labels, rankings',
//   'bar-grouped': 'Grouped bar chart - compare multiple series',
//   'bar-stacked': 'Stacked bar chart - show composition',
//   'bar-stacked-horizontal': 'Horizontal stacked bar',
//   'bar-stacked-100': '100% stacked bar - show percentages',
//   'bar-pareto': 'Pareto chart - bars + cumulative line',
  
//   // Line Charts
//   'line': 'Single line chart - trends over time',
//   'line-multi': 'Multiple line chart - compare trends',
//   'area': 'Area chart - emphasize magnitude',
//   'area-stacked': 'Stacked area - composition over time',
//   'area-stacked-100': '100% stacked area - percentage over time',
  
//   // Pie/Donut
//   'pie': 'Pie chart - simple composition',
//   'donut': 'Donut chart - composition with center text',
  
//   // Hierarchical
//   'treemap': 'Treemap - hierarchical data by size',
//   'sunburst': 'Sunburst - hierarchical with levels',
  
//   // Specialized
//   'waterfall': 'Waterfall - show incremental changes',
//   'funnel': 'Funnel - show stage progression',
//   'gauge': 'Gauge - show single value against range',
//   'bullet': 'Bullet chart - value against thresholds',
//   'slope': 'Slope chart - compare two points in time',
//   'sankey': 'Sankey diagram - flow between categories',
//   'bubble': 'Bubble chart - 3 dimensions (x, y, size)',
//   'scatter': 'Scatter plot - correlation analysis',
  
//   // Combo/Complex
//   'combo': 'Combination chart - bars + lines',
//   'small-multiples': 'Small multiples - repeated charts',
  
//   // Custom
//   'tier-badge': 'Custom tier display badge'
// };


// // ============================================================================
// // COLOR SCHEMES
// // ============================================================================

// const COLOR_SCHEMES = {
//   // Sequential (single hue, varying intensity)
//   'sequential-blue': ['#eff6ff', '#bfdbfe', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a'],
//   'sequential-green': ['#f0fdf4', '#bbf7d0', '#4ade80', '#22c55e', '#15803d', '#14532d'],
//   'sequential-teal': ['#f0fdfa', '#99f6e4', '#2dd4bf', '#14b8a6', '#0d9488', '#115e59'],
//   'sequential-cyan': ['#ecfeff', '#a5f3fc', '#22d3ee', '#06b6d4', '#0891b2', '#155e75'],
//   'sequential-purple': ['#faf5ff', '#e9d5ff', '#c084fc', '#a855f7', '#7c3aed', '#581c87'],
//   'sequential-indigo': ['#eef2ff', '#c7d2fe', '#818cf8', '#6366f1', '#4338ca', '#312e81'],
//   'sequential-amber': ['#fffbeb', '#fde68a', '#fbbf24', '#f59e0b', '#d97706', '#92400e'],
//   'sequential-rose': ['#fff1f2', '#fecdd3', '#fb7185', '#f43f5e', '#e11d48', '#9f1239'],
//   'sequential-violet': ['#f5f3ff', '#ddd6fe', '#a78bfa', '#8b5cf6', '#7c3aed', '#5b21b6'],
  
//   // Categorical (distinct colors)
//   'categorical-5': ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
//   'categorical-6': ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'],
//   'categorical-8': ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280'],
//   'categorical-10': ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#6b7280'],
  
//   // Diverging (two extremes)
//   'diverging-red-blue': ['#dc2626', '#f87171', '#fca5a5', '#e5e7eb', '#93c5fd', '#3b82f6', '#1d4ed8'],
//   'diverging-green-red': ['#16a34a', '#4ade80', '#86efac', '#e5e7eb', '#fca5a5', '#f87171', '#dc2626']
// };


// // ============================================================================
// // FORMAT HELPERS
// // ============================================================================

// const FORMAT_HELPERS = {
//   currency: (value) => {
//     if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
//     if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
//     if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
//     return `$${value.toFixed(0)}`;
//   },
  
//   currencyFull: (value) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(value);
//   },
  
//   percentage: (value) => {
//     if (typeof value === 'string') return value;  // Already formatted
//     return `${(value * 100).toFixed(1)}%`;
//   },
  
//   truncate: (text, maxLength) => {
//     if (!text || text.length <= maxLength) return text;
//     return text.substring(0, maxLength - 3) + '...';
//   },
  
//   fiscalYear: (year) => `FY${year}`,
  
//   rank: (index) => `#${index + 1}`
// };


// // ============================================================================
// // SUMMARY: CARDS BY COLUMN
// // ============================================================================

// const CARDS_SUMMARY = {
//   'D': { columnName: 'Obligations', cardCount: 5, chartTypes: ['line', 'bar', 'donut', 'waterfall', 'area'] },
//   'E': { columnName: 'Small Business', cardCount: 5, chartTypes: ['pie', 'bar-grouped', 'bar-stacked', 'line', 'area-stacked-100'] },
//   'F': { columnName: 'SUM Tier', cardCount: 6, chartTypes: ['bar-horizontal', 'donut', 'bar-stacked', 'line', 'sankey', 'area-stacked-100'] },
//   'G': { columnName: 'Sum Type', cardCount: 4, chartTypes: ['pie', 'bar-stacked', 'gauge', 'line-multi'] },
//   'H': { columnName: 'Contract Vehicle', cardCount: 6, chartTypes: ['bar-horizontal', 'donut', 'bar-grouped', 'treemap', 'slope', 'bar-horizontal'] },
//   'I': { columnName: 'Funding Department', cardCount: 6, chartTypes: ['bar-horizontal', 'donut', 'line-multi', 'treemap', 'bar-stacked', 'bar-pareto'] },
//   'K': { columnName: 'Top Ref_PIID', cardCount: 6, chartTypes: ['bar-horizontal', 'donut', 'line-multi', 'bubble', 'bar', 'bar-stacked-horizontal'] },
//   'L': { columnName: 'Top PIID', cardCount: 5, chartTypes: ['bar-horizontal', 'donut', 'line-multi', 'bar', 'bar'] },
//   'M': { columnName: 'Active Contracts', cardCount: 5, chartTypes: ['bar', 'area', 'combo', 'donut', 'bar-grouped'] },
//   'O': { columnName: 'AI Product', cardCount: 5, chartTypes: ['bar', 'bar-horizontal', 'small-multiples', 'line', 'treemap'] },
//   'P': { columnName: 'AI Category', cardCount: 4, chartTypes: ['donut', 'area-stacked', 'bar-grouped', 'gauge'] },
//   'Q': { columnName: 'Top BIC Products', cardCount: 5, chartTypes: ['bar-horizontal', 'treemap', 'line-multi', 'bar', 'donut'] },
//   'R': { columnName: 'Reseller', cardCount: 6, chartTypes: ['bar-horizontal', 'donut', 'line-multi', 'bar-stacked', 'treemap', 'bar-pareto'] },
//   'S': { columnName: 'BIC Reseller', cardCount: 4, chartTypes: ['bar-horizontal', 'donut', 'line-multi', 'bar'] },
//   'T': { columnName: 'BIC OEM', cardCount: 5, chartTypes: ['bar-horizontal', 'donut', 'line-multi', 'treemap', 'bar'] },
//   'U': { columnName: 'FAS OEM', cardCount: 4, chartTypes: ['bar-horizontal', 'donut', 'line-multi', 'bar-stacked'] },
//   'V': { columnName: 'Funding Agency', cardCount: 5, chartTypes: ['bar-horizontal', 'donut', 'line-multi', 'bar-stacked', 'treemap'] },
//   'W': { columnName: 'BIC Top Products per Agency', cardCount: 5, chartTypes: ['bar-horizontal', 'bar-grouped-nested', 'donut', 'sunburst', 'bar-horizontal'] },
//   'X': { columnName: 'OneGov Tier', cardCount: 4, chartTypes: ['tier-badge', 'bar', 'pie', 'bullet'] }
// };

// // Total: 19 columns × ~5 cards each = ~95 chart/table cards

// // ============================================================================
// // END OF CHART BUFFET SPECIFICATIONS
// // ============================================================================