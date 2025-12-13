/**
 * R04_ReportBuilderExport.js
 * Template Specifications for Report Builder Export System
 * 
 * This file contains template structures and placeholder specifications
 * for Google Docs, Sheets, and Slides export templates.
 * 
 * CHART STRATEGY RECOMMENDATIONS:
 * 1. Google Sheets: Use native Google Charts (best option)
 * 2. Google Docs: Insert chart images or data tables
 * 3. Google Slides: Native charts or chart images
 */

// =============================================================================
// TEMPLATE PLACEHOLDERS REFERENCE
// =============================================================================

/*
BASIC PLACEHOLDERS:
{{reportTitle}} = "OneGov FIT Market Analytics Report"
{{date}} = "12/13/2024"
{{userEmail}} = "john.doe@gsa.gov"
{{entityType}} = "agency" | "vendor" | "oem"
{{columnName}} = "obligations" | "sumTier" | "aiCategories" etc.
{{columnDisplayName}} = "Obligations Analysis" | "SUM Tier Analysis" etc.
{{topN}} = "10" | "15" | "5"
{{totalValue}} = "$112.8B" (formatted currency)
{{generationTimestamp}} = "December 13, 2024 at 2:30 PM EST"

CARD ITERATION PLACEHOLDERS:
{{#cards}} ... {{/cards}} = Repeatable section for each card
{{cardIndex}} = "1" | "2" | "3" (1-based index)
{{cardTitle}} = "Obligations - Top 10 ($112.8B total)"
{{cardType}} = "chart" | "table" | "both"
{{chartType}} = "bar" | "pie" | "line" | "horizontalBar"
{{includeChart}} = true | false
{{includeTable}} = true | false

CHART DATA PLACEHOLDERS:
{{chartLabels}} = "VA, DISA, CMS, Navy, Air Force" (comma-separated)
{{chartValues}} = "29.6B, 13.2B, 11.1B, 10.1B, 9.2B" (formatted values)
{{chartDatasetLabel}} = "Obligations (with percentages)"

TABLE DATA PLACEHOLDERS:
{{tableHeaders}} = ["Entity", "Obligations", "Percentage", "Tier"]
{{#tableRows}} ... {{/tableRows}} = Repeatable for each table row
{{rowData}} = ["Department of Veterans Affairs", "$29.6B", "26.3%", "Tier 1"]

NARRATIVE TEMPLATE PLACEHOLDERS (For Dynamic Storytelling):
{{topEntity}} = "Department of Veterans Affairs" (highest value entity)
{{topEntityValue}} = "$29.6B" (highest value, formatted)
{{topEntityPercent}} = "26.3%" (percentage of total)
{{secondEntity}} = "Defense Information Systems Agency" (second highest)
{{secondEntityValue}} = "$13.2B"
{{entityCount}} = "145" (total entities in analysis)
{{averageValue}} = "$776.7M" (average value per entity)
{{totalAnalyzed}} = "$112.8B" (sum of all analyzed data)

DYNAMIC INSIGHTS PLACEHOLDERS:
{{highestTier}} = "Tier 1 ($500M+)" (most common tier)
{{lowestTier}} = "Below Tier 4 (<$10M)" (least common tier)
{{topCategory}} = "Machine Learning Platforms" (for AI analysis)
{{growthRate}} = "+23.5%" (if time-series data available)
{{concentration}} = "67.8%" (top 3 entities' share of total)

NARRATIVE SENTENCE TEMPLATES:
{{entityType|capitalize}} analysis reveals that {{topEntity}} leads with {{topEntityValue}} 
({{topEntityPercent}} of total {{columnDisplayName|lowercase}}), followed by {{secondEntity}} 
at {{secondEntityValue}}. The top {{topN}} {{entityType}}s account for {{concentration}} 
of the total {{totalAnalyzed}} analyzed.

CONDITIONAL NARRATIVE ELEMENTS:
{{#isAgencyAnalysis}}
This analysis of government agencies shows spending concentration among major departments.
{{/isAgencyAnalysis}}

{{#isVendorAnalysis}}  
This vendor analysis reveals market concentration and competitive landscape.
{{/isVendorAnalysis}}

{{#isHighConcentration}}
The data shows significant concentration, with the top 3 entities controlling {{concentration}} of the market.
{{/isHighConcentration}}

{{#isLowConcentration}}
The data shows a distributed landscape with no single entity dominating the market.
{{/isLowConcentration}}

EXAMPLE NARRATIVE TEMPLATES:

EXECUTIVE SUMMARY NARRATIVE:
"This {{columnDisplayName}} analysis of {{entityCount}} {{entityType}}s reveals a total market value of {{totalAnalyzed}}. 
{{topEntity}} emerges as the clear leader with {{topEntityValue}} ({{topEntityPercent}}), significantly outpacing 
{{secondEntity}} at {{secondEntityValue}}. {{#isHighConcentration}}The market shows strong concentration with the top 
{{topN}} {{entityType}}s controlling {{concentration}} of total spending.{{/isHighConcentration}} 
{{#isLowConcentration}}Despite the large number of participants, spending remains distributed across multiple entities.{{/isLowConcentration}}"

CHART DESCRIPTION NARRATIVE:
"The {{chartType}} chart illustrates {{columnDisplayName}} across the top {{topN}} {{entityType}}s. 
{{topEntity}} dominates the visualization at {{topEntityValue}}, representing {{topEntityPercent}} of the total. 
This analysis covers {{entityCount}} total {{entityType}}s with an average value of {{averageValue}} per entity."

INSIGHTS NARRATIVE:
"Key findings from this analysis include: {{topEntity}}'s market-leading position at {{topEntityValue}}, 
representing a {{concentration}} market share when combined with the next two largest {{entityType}}s. 
The {{highestTier}} category represents the majority of high-value transactions, while {{lowestTier}} 
accounts for the largest number of smaller participants."

DATA STORY NARRATIVE TEMPLATE:
"In analyzing {{entityType}} {{columnDisplayName}}, we examined {{entityCount}} entities totaling {{totalAnalyzed}}. 
The data reveals that {{topEntity}} leads significantly with {{topEntityValue}} ({{topEntityPercent}} of total), 
followed by {{secondEntity}} at {{secondEntityValue}}. This creates a market concentration where the top {{topN}} 
{{entityType}}s control {{concentration}} of all {{columnDisplayName}}. The remaining {{entityCount - topN}} entities 
share the balance, with an average value of {{averageValue}} each."
*/

// =============================================================================
// GOOGLE DOCS TEMPLATE STRUCTURE
// =============================================================================

/*
DOCUMENT TITLE: {{reportTitle}} - {{date}} - {{userEmail}}

DOCUMENT HEADER:
-----------------------------------
OneGov FIT Market Analytics Report
{{entityType}} Analysis - {{columnDisplayName}}
Generated: {{generationTimestamp}}
Created by: {{userEmail}}
-----------------------------------

REPEATABLE CARD SECTION MECHANISM:
-----------------------------------

[REPEATABLE_SECTION_START] <- Template system marker

{{cardIndex}}. {{cardTitle}}

NARRATIVE SECTION:
{{cardNarrative}}

DETAILED ANALYSIS:
{{cardDataStory}}

{{#includeChart}}
Chart Type: {{chartType}} | Data Points: {{dataPointCount}}

[CHART_IMAGE_PLACEHOLDER_{{cardIndex}}] <- Gets replaced with actual PNG image
- Image dimensions: 500px wide x 300px tall
- Generated from Chart.js data using server-side rendering
- Maintains exact colors and styling from Report Builder
- Static image (not interactive) but visually identical
{{/includeChart}}

{{#includeTable}}
[TABLE_PLACEHOLDER_{{cardIndex}}] <- Gets replaced with native Google Docs table
- Native table with borders and formatting
- Alternating row colors for readability
- Auto-sized columns based on content width
- Headers get bold formatting automatically

| {{header1}} | {{header2}} | {{header3}} | {{header4}} |
|-------------|-------------|-------------|-------------|
{{#tableRows}}
| {{col1}} | {{col2}} | {{col3}} | {{col4}} |
{{/tableRows}}
{{/includeTable}}

-----------------------------------

[REPEATABLE_SECTION_END] <- Template system marker

SECTION DUPLICATION LOGIC:
1. Apps Script finds [REPEATABLE_SECTION_START] to [REPEATABLE_SECTION_END]
2. Extracts this section as a template "recipe"
3. For each card in exportData.cards array:
   - Duplicate the template section
   - Replace {{placeholders}} with actual card data
   - Handle conditional inclusion of charts/tables
   - Insert at end of document
4. Remove original template section markers

CONDITIONAL CONTENT HANDLING:
- If card.includeChart === false: Remove entire {{#includeChart}}...{{/includeChart}} block
- If card.includeTable === false: Remove entire {{#includeTable}}...{{/includeTable}} block  
- If both false: Skip entire card section
- If both true: Include chart image above table

DYNAMIC SIZING:
- 1 card = 1 page section
- 3 cards = 3 page sections  
- 10 cards = 10 page sections (multi-page document)
- Each section auto-adjusts height based on content

DOCUMENT FOOTER:
-----------------------------------
Report generated by OneGov FIT Market System
{{generationTimestamp}}
*/

// =============================================================================
// GOOGLE SHEETS TEMPLATE STRUCTURE
// =============================================================================

/*
SHEET NAME: "{{reportTitle}} - {{date}}"

HEADER SECTION (A1:F3):
A1: OneGov FIT Market Analytics Report
A2: Entity Type: {{entityType}} | Column: {{columnDisplayName}} | Top {{topN}}
A3: Generated: {{generationTimestamp}} | Created by: {{userEmail}}

TEMPLATE TAB SYSTEM FOR DYNAMIC CHARTS:
========================================

TEMPLATE TABS (Pre-built in template file):
├── Summary Tab (header info, always included)
├── Bar_Template Tab (for card.chartType === "bar")
├── HorizontalBar_Template Tab (for card.chartType === "horizontalBar")
├── Pie_Template Tab (for card.chartType === "pie")  
├── Doughnut_Template Tab (for card.chartType === "doughnut" or "donut")
├── Line_Template Tab (for card.chartType === "line")
├── Area_Template Tab (for card.chartType === "area")
├── Funnel_Template Tab (for card.chartType === "funnel")
├── FiscalYear_Template Tab (for card.chartType === "fiscal-year")
├── Tier_Template Tab (for card.chartType === "tier")
├── CategoryObligations_Template Tab (for card.chartType === "categoryObligations")
└── Table_Template Tab (for card.chartType === "table" or includeChart === false)

CHART TYPE SPECIFIC TEMPLATE STRUCTURES:
========================================

BAR_TEMPLATE TAB:
A1: {{cardTitle}}
A2: Chart Type: Bar | Generated: {{timestamp}}

DATA SECTION (A4:C15):
A4: Entity/Label | Value | Percentage  
A5: {{label1}} | {{value1}} | {{percent1}}
A6: {{label2}} | {{value2}} | {{percent2}}

CHART AREA (D4:J15):
- Native Google Sheets COLUMN chart
- Data range: A4:C15
- Colors: Report Builder blue palette
- Y-axis: Currency formatting ($1M, $1B)

HORIZONTALBAR_TEMPLATE TAB:
A1: {{cardTitle}}
A2: Chart Type: Horizontal Bar | Generated: {{timestamp}}

DATA SECTION (A4:C15):
A4: Entity/Label | Value | Percentage
A5: {{label1}} | {{value1}} | {{percent1}}

CHART AREA (D4:J15):
- Native Google Sheets BAR chart (horizontal)
- Data range: A4:C15
- X-axis: Currency formatting
- Longer entity names fit better

PIE_TEMPLATE TAB:
A1: {{cardTitle}}
A2: Chart Type: Pie | Generated: {{timestamp}}

DATA SECTION (A4:B15):
A4: Category/Label | Value
A5: {{label1}} | {{value1}}
A6: {{label2}} | {{value2}}

CHART AREA (D4:J15):
- Native Google Sheets PIE chart
- Data range: A4:B15 (no percentage column needed)
- Legend positioned right
- Colors: Sequential Report Builder palette

DOUGHNUT_TEMPLATE TAB:
A1: {{cardTitle}}
A2: Chart Type: Doughnut | Generated: {{timestamp}}

DATA SECTION (A4:B15):
A4: Category/Label | Value
A5: {{label1}} | {{value1}}

CHART AREA (D4:J15):
- Native Google Sheets DOUGHNUT chart
- Data range: A4:B15
- Center displays total value
- Hole size: 40%

LINE_TEMPLATE TAB:
A1: {{cardTitle}}
A2: Chart Type: Line | Generated: {{timestamp}}

DATA SECTION (A4:C15):
A4: Time Period | Value | Trend
A5: {{period1}} | {{value1}} | {{trend1}}
A6: {{period2}} | {{value2}} | {{trend2}}

CHART AREA (D4:J15):
- Native Google Sheets LINE chart
- Data range: A4:C15
- X-axis: Time periods
- Y-axis: Currency formatting
- Smooth curve lines

AREA_TEMPLATE TAB:
A1: {{cardTitle}}
A2: Chart Type: Area | Generated: {{timestamp}}

DATA SECTION (A4:D15):
A4: Time Period | Series1 | Series2 | Series3
A5: {{period1}} | {{value1a}} | {{value1b}} | {{value1c}}

CHART AREA (D4:J15):
- Native Google Sheets AREA chart (stacked)
- Data range: A4:D15
- Multiple data series stacked
- Semi-transparent fill colors

FUNNEL_TEMPLATE TAB:
A1: {{cardTitle}}
A2: Chart Type: Funnel | Generated: {{timestamp}}

DATA SECTION (A4:C15):
A4: Stage/Category | Value | Percentage
A5: {{stage1}} | {{value1}} | {{percent1}}
A6: {{stage2}} | {{value2}} | {{percent2}}

CHART AREA (D4:J15):
- Native Google Sheets COLUMN chart (descending)
- Data range: A4:C15
- Sorted by value descending
- Funnel effect with color gradient

FISCALYEAR_TEMPLATE TAB:
A1: {{cardTitle}}
A2: Chart Type: Fiscal Year Trend | Generated: {{timestamp}}

DATA SECTION (A4:D15):
A4: Fiscal Year | Obligations | Contracts | Growth %
A5: {{fy1}} | {{obligations1}} | {{contracts1}} | {{growth1}}

CHART AREA (D4:J15):
- Native Google Sheets COMBO chart
- Primary axis: Obligations (column)
- Secondary axis: Growth % (line)
- FY labels on X-axis

TIER_TEMPLATE TAB:
A1: {{cardTitle}}
A2: Chart Type: Tier Distribution | Generated: {{timestamp}}

DATA SECTION (A4:E15):
A4: Tier | Value | Count | Avg Value | Percentage
A5: Tier 1 ($500M+) | {{tier1Value}} | {{tier1Count}} | {{tier1Avg}} | {{tier1Percent}}

CHART AREA (D4:J15):
- Native Google Sheets PIE chart
- Data range: A4:B15 (Tier, Value)
- Color coded by tier level
- Tier hierarchy maintained

CATEGORYOBLIGATIONS_TEMPLATE TAB:
A1: {{cardTitle}}
A2: Chart Type: Category Analysis | Generated: {{timestamp}}

DATA SECTION (A4:F15):
A4: Category | Obligations | Vendors | Avg Deal | Growth | Market Share
A5: {{cat1}} | {{obl1}} | {{vendors1}} | {{avg1}} | {{growth1}} | {{share1}}

CHART AREA (D4:J15):
- Native Google Sheets COLUMN chart
- Multi-series: Obligations + Avg Deal Size
- Category labels on X-axis
- Dual Y-axis scaling

TABLE_TEMPLATE TAB:
A1: {{cardTitle}}
A2: Chart Type: Table Only | Generated: {{timestamp}}

DATA SECTION (A4:H25):
A4: {{header1}} | {{header2}} | {{header3}} | {{header4}} | {{header5}}
A5: {{row1col1}} | {{row1col2}} | {{row1col3}} | {{row1col4}} | {{row1col5}}

NO CHART AREA:
- Table spans full width A4:H25
- Headers bold with blue background
- Alternating row colors
- Auto-fit column widths
- Freeze header row

SUMMARY TABLE SECTION (for all chart types):
A17:D25 or A27:D35:
- Formatted data table for display
- Headers with bold styling (#144673 background)
- Alternating row colors (white/#f8f9fa)
- Auto-sized columns based on content
- Currency formatting for value columns
- Percentage formatting for percent columns

DYNAMIC TAB CREATION PROCESS:
============================

1. FOR EACH CARD in exportData.cards:
   a) Find matching template tab (Bar_Template, Pie_Template, etc.)
   b) Copy template tab to new tab in output spreadsheet
   c) Rename copied tab: "1. Obligations Analysis", "2. Tier Distribution", etc.
   d) Populate data in copied tab (A5:C15 range)
   e) Chart automatically updates with new data
   f) Hide original template tabs

2. CONDITIONAL CONTENT HANDLING:
   - If card.includeChart === false: Delete chart area (D4:J15), keep only data
   - If card.includeTable === false: Delete summary table section (A17:D25)
   - If both false: Create minimal tab with just title and metadata

3. FINAL OUTPUT STRUCTURE:
   ├── Summary (header info)
   ├── 1. Obligations Analysis (from Bar_Template)
   ├── 2. Tier Distribution (from Pie_Template)  
   ├── 3. AI Categories (from HorizontalBar_Template)
   └── Hidden: Original template tabs

ADVANTAGES OF TAB SYSTEM:
- Native Google Charts (best quality, interactive)
- Perfect chart formatting (pre-designed in template)
- Automatic updates when data changes  
- Easy maintenance (update template once)
- Professional appearance matching Report Builder
*/

// =============================================================================
// GOOGLE SLIDES TEMPLATE STRUCTURE
// =============================================================================

/*
PRESENTATION TITLE: {{reportTitle}} - {{date}} - {{userEmail}}

SLIDE 1: TITLE SLIDE
Title: OneGov FIT Market Analytics Report
Subtitle: {{entityType}} Analysis - {{columnDisplayName}}
          Generated: {{generationTimestamp}}
          Created by: {{userEmail}}

TEMPLATE SLIDE SYSTEM FOR DYNAMIC CONTENT:
==========================================

TEMPLATE SLIDES (Pre-built in template file):
├── SLIDE 1: Title Slide (always included)
├── SLIDE 2: Chart_Template (for cards with charts)
├── SLIDE 3: Table_Template (for cards with tables only)
├── SLIDE 4: Both_Template (for cards with chart + table)
└── SLIDE 5: Summary Slide (always included)

CHART_TEMPLATE SLIDE LAYOUT:
-----------------------------
Title Area: {{cardTitle}}
Subtitle: {{chartType}} Analysis | {{dataPointCount}} data points

CHART AREA (Center stage):
[CHART_PLACEHOLDER_{{cardIndex}}] 
- Chart image: 700px wide x 400px tall
- Generated from Chart.js data as PNG
- Positioned center-stage for maximum visibility
- Maintains Report Builder colors and styling

METADATA FOOTER:
Generated: {{timestamp}} | Data: {{entityType}} {{columnDisplayName}}

TABLE_TEMPLATE SLIDE LAYOUT:
-----------------------------
Title Area: {{cardTitle}} - Data Analysis

TABLE AREA (Full width):
[TABLE_PLACEHOLDER_{{cardIndex}}]
- Native Google Slides table
- Auto-sized columns based on content
- Headers with bold blue background (#144673)
- Alternating row colors (white/light blue)
- Maximum 8 columns wide for readability

BOTH_TEMPLATE SLIDE LAYOUT:
---------------------------
Title Area: {{cardTitle}}

SPLIT LAYOUT:
Left 60%: Chart image (500px x 350px)
Right 40%: Summary table (condensed version)

DATA FOOTER: Key metrics summary

DYNAMIC SLIDE CREATION PROCESS:
==============================

1. FOR EACH CARD in exportData.cards:
   a) Determine layout needed:
      - Chart only → Copy Chart_Template
      - Table only → Copy Table_Template  
      - Both → Copy Both_Template
   
   b) Copy appropriate template slide
   c) Position new slide after previous card slides
   d) Replace {{placeholders}} with card data
   e) Insert chart images and/or tables
   f) Remove template slide markers

2. CONDITIONAL LAYOUT SELECTION:
   if (card.includeChart && card.includeTable) → Both_Template
   else if (card.includeChart) → Chart_Template  
   else if (card.includeTable) → Table_Template
   else → Skip slide entirely

3. CHART IMAGE HANDLING:
   - Generate PNG from Chart.js data
   - Resize to fit slide layout (700x400 for full, 500x350 for split)
   - Replace [CHART_PLACEHOLDER_X] with actual image
   - Maintain aspect ratio and professional appearance

4. TABLE HANDLING:
   - Create native Slides table element
   - Populate with card.tableData.headers and card.tableData.rows
   - Apply OneGov color scheme
   - Auto-adjust column widths for readability

5. FINAL PRESENTATION STRUCTURE:
   ├── Title Slide (report info)
   ├── Card 1 Slide (obligations chart + table) 
   ├── Card 2 Slide (tier distribution pie chart only)
   ├── Card 3 Slide (AI categories table only)
   ├── Summary Slide (generation info)
   └── Hidden: Original template slides

PRESENTATION FLOW ADVANTAGES:
- One slide per insight = clean narrative flow
- Charts get center-stage visibility for presentations  
- Tables remain detailed and readable
- Professional slide transitions and formatting
- Easy to present in meetings or export as PDF
*/

// =============================================================================
// CHART IMPLEMENTATION STRATEGIES
// =============================================================================

/*
CHART DATA STRUCTURE FROM FRONTEND:
{
  chartType: "bar" | "pie" | "line" | "horizontalBar",
  chartData: {
    labels: ["VA", "DISA", "CMS", "Navy", "Air Force"],
    datasets: [{
      label: "Obligations (with percentages)",
      data: [29606600882.12, 13242606617.43, 11061052537.66],
      backgroundColor: ["#1f77b4", "#ff7f0e", "#2ca02c"],
      borderColor: "#144673"
    }]
  }
}

GOOGLE SHEETS CHART IMPLEMENTATION:
1. Insert data into sheet columns
2. Create native Google Sheets chart
3. Configure chart type based on chartData.chartType:
   - "bar" -> COLUMN chart
   - "pie" -> PIE chart  
   - "line" -> LINE chart
   - "horizontalBar" -> BAR chart
4. Apply colors from chartData.datasets[0].backgroundColor
5. Set title to card title

GOOGLE DOCS CHART IMPLEMENTATION:
1. Create Chart.js chart on server (headless)
2. Export as image (PNG)
3. Insert image into document
4. Add data table below chart

GOOGLE SLIDES CHART IMPLEMENTATION:
1. Insert data into embedded sheet
2. Create native Google Slides chart
3. Configure styling to match Report Builder
4. Alternative: Insert pre-generated chart image

COLOR SCHEME (Match Report Builder UI):
Primary Blue: #144673
Secondary Orange: #f47920
Success Green: #22c55e
Warning Yellow: #f59e0b
Light Blue: #87ceeb
Dark Navy: #1e3a8a
*/

// =============================================================================
// TEMPLATE POPULATION FUNCTIONS SPECIFICATION
// =============================================================================

/*
REQUIRED FUNCTIONS TO IMPLEMENT:

1. populateDocTemplate(templateId, cardData, metadata)
   - Copy template document
   - Replace all {{placeholder}} values
   - Insert chart images or tables
   - Return new document URL

2. populateSheetsTemplate(templateId, cardData, metadata)
   - Copy template spreadsheet
   - Create sheets for each card
   - Insert native Google Charts
   - Populate data tables
   - Return new spreadsheet URL

3. populateSlidesTemplate(templateId, cardData, metadata)
   - Copy template presentation
   - Create slides for each card
   - Insert native charts or chart images
   - Populate data tables
   - Return new presentation URL

CARD DATA STRUCTURE EXPECTED:
{
  id: "card-1",
  title: "Obligations - Top 10 ($112.8B total)",
  chartType: "bar",
  includeChart: true,
  includeTable: true,
  chartData: { labels: [...], datasets: [...] },
  tableData: { headers: [...], rows: [[...]] },
  metadata: { entityType: "agency", columnId: "obligations" }
}

METADATA STRUCTURE:
{
  reportTitle: "OneGov FIT Market Analytics Report",
  entityType: "agency",
  columnName: "obligations", 
  columnDisplayName: "Obligations Analysis",
  topN: 10,
  totalValue: "$112.8B",
  userEmail: "john.doe@gsa.gov",
  generationTimestamp: "December 13, 2024 at 2:30 PM EST"
}
*/

// =============================================================================
// REAL DATA STRUCTURES FROM REPORT BUILDER
// =============================================================================

/*
ACTUAL CHART DATA STRUCTURE (from Report Builder frontend):
This is the complete structure passed from F04_ExactReactWithJSON.html to backend

EXAMPLE 1 - BAR CHART (Obligations by Agency):
{
  id: "card-obligations-agency",
  title: "Obligations - Top 10 ($112.8B total)",
  chartType: "bar",
  includeChart: true,
  includeTable: true,
  chartData: {
    labels: [
      "Department of Veterans Affairs",
      "Defense Information Systems Agency", 
      "Centers for Medicare & Medicaid Services",
      "Department of the Navy",
      "Department of the Air Force"
    ],
    datasets: [{
      label: "Obligations (with percentages)",
      data: [29606600882.12, 13242606617.43, 11061052537.66, 10089956127.45, 9242194764.32],
      backgroundColor: [
        "#1f77b4", // Blue
        "#ff7f0e", // Orange  
        "#2ca02c", // Green
        "#d62728", // Red
        "#9467bd"  // Purple
      ],
      borderColor: "#144673",
      borderWidth: 1,
      hoverBackgroundColor: [
        "#1a6ba0", "#e6710d", "#25932b", "#c21e26", "#8559a8"
      ]
    }]
  },
  tableData: {
    headers: ["Entity", "Obligations", "Percentage", "Tier"],
    rows: [
      ["Department of Veterans Affairs", "$29.6B", "26.3%", "Tier 1 ($500M+)"],
      ["Defense Information Systems Agency", "$13.2B", "11.7%", "Tier 1 ($500M+)"],
      ["Centers for Medicare & Medicaid Services", "$11.1B", "9.8%", "Tier 1 ($500M+)"],
      ["Department of the Navy", "$10.1B", "8.9%", "Tier 1 ($500M+)"],
      ["Department of the Air Force", "$9.2B", "8.2%", "Tier 1 ($500M+)"]
    ]
  },
  metadata: {
    entityType: "agency",
    columnId: "obligations",
    columnDisplayName: "Obligations Analysis",
    topN: 10,
    totalValue: 112847404027.45,
    totalValueFormatted: "$112.8B",
    currentSelection: "obligations"
  }
}

EXAMPLE 2 - PIE CHART (SUM Tier Distribution):
{
  id: "card-sumTier-agency", 
  title: "SUM Tier - Top 10 ($112.8B total)",
  chartType: "pie",
  includeChart: true,
  includeTable: true,
  chartData: {
    labels: [
      "Tier 1 ($500M+)",
      "Tier 2 ($200M–$500M)", 
      "Tier 3 ($50M–$200M)",
      "Tier 4 ($10M–$50M)",
      "Below Tier 4 (<$10M)"
    ],
    datasets: [{
      label: "SUM Tier Distribution",
      data: [89234567890.12, 15678901234.56, 5432109876.54, 1987654321.12, 512345678.90],
      backgroundColor: [
        "#22c55e", // Success Green (Tier 1)
        "#3b82f6", // Blue (Tier 2) 
        "#f59e0b", // Warning Yellow (Tier 3)
        "#ef4444", // Red (Tier 4)
        "#6b7280"  // Gray (Below Tier 4)
      ],
      borderColor: "#ffffff",
      borderWidth: 2,
      hoverOffset: 4
    }]
  },
  tableData: {
    headers: ["Tier", "Total Obligations", "Percentage", "Agency Count"],
    rows: [
      ["Tier 1 ($500M+)", "$89.2B", "79.1%", "12"],
      ["Tier 2 ($200M–$500M)", "$15.7B", "13.9%", "8"],
      ["Tier 3 ($50M–$200M)", "$5.4B", "4.8%", "15"],
      ["Tier 4 ($10M–$50M)", "$2.0B", "1.8%", "23"],
      ["Below Tier 4 (<$10M)", "$512.3M", "0.5%", "87"]
    ]
  },
  metadata: {
    entityType: "agency",
    columnId: "sumTier", 
    columnDisplayName: "SUM Tier Analysis",
    topN: 10,
    totalValue: 112847404027.45,
    totalValueFormatted: "$112.8B",
    currentSelection: "sumTier"
  }
}

EXAMPLE 3 - HORIZONTAL BAR CHART (AI Categories):
{
  id: "card-aiCategories-vendor",
  title: "AI Categories - Top 10 ($45.2B total)",
  chartType: "horizontalBar",
  includeChart: true,
  includeTable: true,
  chartData: {
    labels: [
      "Machine Learning Platforms",
      "Natural Language Processing", 
      "Computer Vision Services",
      "Robotic Process Automation",
      "Predictive Analytics"
    ],
    datasets: [{
      label: "AI Categories Investment",
      data: [18500000000.25, 12300000000.75, 8900000000.50, 3800000000.90, 1700000000.60],
      backgroundColor: [
        "rgba(31, 119, 180, 0.8)",
        "rgba(255, 127, 14, 0.8)",
        "rgba(44, 160, 44, 0.8)", 
        "rgba(214, 39, 40, 0.8)",
        "rgba(148, 103, 189, 0.8)"
      ],
      borderColor: [
        "rgba(31, 119, 180, 1)",
        "rgba(255, 127, 14, 1)",
        "rgba(44, 160, 44, 1)",
        "rgba(214, 39, 40, 1)", 
        "rgba(148, 103, 189, 1)"
      ],
      borderWidth: 1
    }]
  },
  tableData: {
    headers: ["Category", "Investment", "Percentage", "Vendors"],
    rows: [
      ["Machine Learning Platforms", "$18.5B", "40.9%", "45"],
      ["Natural Language Processing", "$12.3B", "27.2%", "32"],
      ["Computer Vision Services", "$8.9B", "19.7%", "28"],
      ["Robotic Process Automation", "$3.8B", "8.4%", "19"],
      ["Predictive Analytics", "$1.7B", "3.8%", "15"]
    ]
  },
  metadata: {
    entityType: "vendor",
    columnId: "aiCategories",
    columnDisplayName: "AI Categories Analysis", 
    topN: 10,
    totalValue: 45200000000.00,
    totalValueFormatted: "$45.2B",
    currentSelection: "aiCategories"
  }
}

COMPLETE EXPORT DATA STRUCTURE PASSED TO BACKEND:
{
  reportTitle: "OneGov FIT Market Analytics Report",
  userEmail: "gerald.mavis@gsa.gov",
  entityType: "agency", // or "vendor" or "oem"
  columnName: "obligations", // actual column id
  columnDisplayName: "Obligations Analysis", // user-friendly display name
  topN: 10,
  totalValue: 112847404027.45,
  totalValueFormatted: "$112.8B",
  generationTimestamp: "December 13, 2024 at 2:30 PM EST",
  cards: [
    // Array of card objects like the examples above
    // Can contain 1-10 cards depending on user selection
    // Each card can be bar, pie, line, or horizontalBar
    // Each card can include chart, table, or both
  ]
}

ALL POSSIBLE CHART TYPES:
- "bar" - Vertical bar chart
- "horizontalBar" - Horizontal bar chart  
- "pie" - Pie chart
- "doughnut" - Doughnut chart (pie with center hole)
- "donut" - Alternative name for doughnut chart
- "line" - Line chart (for time series data)
- "area" - Area chart (filled line chart)
- "funnel" - Funnel chart (for categorical data analysis)
- "table" - Table-only display (no chart)
- "fiscal-year" - Custom fiscal year chart
- "tier" - Custom tier distribution chart
- "categoryObligations" - Custom category obligations chart

ALL POSSIBLE ENTITY TYPES:
- "agency" - Government agencies
- "vendor" - Reseller companies
- "oem" - Original equipment manufacturers

ALL POSSIBLE COLUMN TYPES FROM REPORT BUILDER:
- "obligations" - Dollar amounts spent
- "sumTier" - Tier categorization 
- "aiCategories" - AI/ML category analysis
- "contractVehicle" - Contract types used
- "fundingOffice" - Funding office breakdown
- "productService" - Product/service categories
- "geography" - Geographic distribution
- "timeAnalysis" - Time-based trends

TABLE STRUCTURE NOTES:
- Headers are always strings
- Row data can be: strings, formatted currency, percentages, counts
- Currency always formatted like "$29.6B", "$512.3M" 
- Percentages always formatted like "26.3%", "0.5%"
- Counts are integers like "12", "87"
- Tier values follow R03_Tier_Ref.js format
*/

// =============================================================================
// TEMPLATE IDS CONFIGURATION
// =============================================================================

/*
After creating templates, store these IDs in the code:

const EXPORT_TEMPLATE_IDS = {
  DOC: "1ABC123_Google_Doc_Template_ID",
  SHEET: "1DEF456_Google_Sheet_Template_ID", 
  SLIDES: "1GHI789_Google_Slides_Template_ID"
};

These templates should be:
1. Created once manually or via setup function
2. Stored in a shared Drive location
3. Given proper permissions for the script to copy
4. Updated as needed for formatting changes
*/

// =============================================================================
// IMPLEMENTATION NOTES
// =============================================================================

/*
ADVANTAGES OF THIS APPROACH:
1. Professional, consistent formatting
2. Native Google Charts that look great
3. Easier maintenance - update template, affects all exports
4. Better performance - copying templates faster than building from scratch
5. Supports complex layouts and branding

IMPLEMENTATION STEPS:
1. Create the 3 template files with placeholders
2. Implement template copying and population functions
3. Replace current export functions with template-based ones
4. Test with actual Report Builder card data
5. Refine templates based on output quality

CHART QUALITY PRIORITY:
1. Google Sheets native charts (best quality, interactive)
2. Google Slides native charts (good quality, presentation-ready)  
3. Chart.js generated images (consistent with Report Builder UI)
4. Data tables as fallback (always works)
*/

// =============================================================================
// NARRATIVE TEMPLATE SYSTEM - DYNAMIC STORYTELLING
// =============================================================================

/*
NARRATIVE FORM FILL CAPABILITIES:

The template system supports sophisticated narrative generation where you can write
stories with placeholders that get automatically filled with actual data points.
This allows for dynamic, data-driven storytelling in your exports.

HOW NARRATIVE FORM FILLING WORKS:
=================================

1. WRITE NARRATIVE TEMPLATES:
   You write narrative text with {{placeholder}} markers that get replaced with 
   real data from the analysis. The system automatically calculates insights
   like top entities, percentages, concentrations, and trends.

2. EXAMPLE NARRATIVE INPUT (what you write in template):
   "This {{columnDisplayName}} analysis reveals that {{topEntity}} dominates 
   the landscape with {{topEntityValue}} ({{topEntityPercent}} of total), 
   significantly ahead of {{secondEntity}} at {{secondEntityValue}}. 
   {{#isHighConcentration}}The top {{topN}} entities control {{concentration}} 
   of the market, indicating significant concentration.{{/isHighConcentration}}"

3. EXAMPLE NARRATIVE OUTPUT (what users see in export):
   "This Obligations Analysis reveals that Department of Veterans Affairs dominates 
   the landscape with $29.6B (26.3% of total), significantly ahead of Defense 
   Information Systems Agency at $13.2B. The top 10 entities control 87.4% 
   of the market, indicating significant concentration."

AVAILABLE NARRATIVE PLACEHOLDERS:
=================================

ENTITY DATA:
{{topEntity}} = "Department of Veterans Affairs"
{{topEntityValue}} = "$29.6B" 
{{topEntityPercent}} = "26.3%"
{{secondEntity}} = "Defense Information Systems Agency"
{{secondEntityValue}} = "$13.2B"
{{thirdEntity}} = "Centers for Medicare & Medicaid Services"
{{bottomEntity}} = "Small Business Administration"
{{entityCount}} = "145"

AGGREGATED INSIGHTS:
{{totalAnalyzed}} = "$112.8B"
{{averageValue}} = "$776.7M" 
{{medianValue}} = "$245.3M"
{{concentration}} = "87.4%" (top 3 share)
{{topNConcentration}} = "67.8%" (top N share)
{{diversityIndex}} = "0.23" (how spread out the data is)

CATEGORICAL DATA:
{{topTier}} = "Tier 1 ($500M+)"
{{bottomTier}} = "Below Tier 4 (<$10M)"
{{mostCommonCategory}} = "Machine Learning Platforms"
{{fastestGrowingCategory}} = "Computer Vision Services"

CONDITIONAL STORY ELEMENTS:
{{#isHighConcentration}} ... {{/isHighConcentration}}
{{#isLowConcentration}} ... {{/isLowConcentration}}
{{#isAgencyAnalysis}} ... {{/isAgencyAnalysis}}
{{#isVendorAnalysis}} ... {{/isVendorAnalysis}}
{{#isOEMAnalysis}} ... {{/isOEMAnalysis}}
{{#hasGrowthData}} ... {{/hasGrowthData}}

NARRATIVE TEMPLATE EXAMPLES:
============================

EXECUTIVE SUMMARY TEMPLATE:
"This comprehensive {{columnDisplayName}} analysis examines {{entityCount}} {{entityType}}s 
representing {{totalAnalyzed}} in total value. {{topEntity}} emerges as the dominant 
player with {{topEntityValue}} ({{topEntityPercent}}), followed by {{secondEntity}} 
at {{secondEntityValue}}. {{#isHighConcentration}}The market exhibits significant 
concentration with the top {{topN}} {{entityType}}s controlling {{concentration}} 
of total activity.{{/isHighConcentration}} {{#isLowConcentration}}Despite having 
{{entityCount}} participants, the market remains relatively distributed with no 
single entity dominating.{{/isLowConcentration}}"

TREND ANALYSIS TEMPLATE:
"{{#hasGrowthData}}Over the analysis period, {{topEntity}} has grown {{growthRate}}, 
maintaining its leadership position in {{columnDisplayName}}. {{fastestGrowingCategory}} 
shows the strongest growth trajectory at {{categoryGrowthRate}}.{{/hasGrowthData}}
{{#noGrowthData}}This snapshot analysis shows current market positions without 
historical trend data.{{/noGrowthData}}"

INSIGHTS TEMPLATE:
"Key insights from this {{columnDisplayName}} analysis include: (1) {{topEntity}}'s 
market leadership at {{topEntityValue}} represents {{topEntityPercent}} of the total 
market; (2) The top tier ({{topTier}}) accounts for {{topTierPercent}} of all activity; 
(3) {{entityCount}} total {{entityType}}s participate in this market with an average 
value of {{averageValue}} each."

CONTEXTUAL NARRATIVE TEMPLATE:
"{{#isAgencyAnalysis}}This government agency spending analysis highlights departmental 
budget allocations and resource distribution across federal entities.{{/isAgencyAnalysis}}
{{#isVendorAnalysis}}This vendor market analysis reveals competitive positioning and 
market share distribution among private sector providers.{{/isVendorAnalysis}}
{{#isOEMAnalysis}}This original equipment manufacturer analysis shows technology 
provider market dynamics and product portfolio strengths.{{/isOEMAnalysis}}"

TEMPLATE INTEGRATION IN DOCUMENTS:
==================================

GOOGLE DOCS - NARRATIVE SECTIONS:
Each card section can include:
- {{cardNarrative}} = Custom story for this specific chart/table
- {{cardDataStory}} = Auto-generated insights based on the data
- {{cardConclusion}} = Summary takeaway for this analysis

GOOGLE SHEETS - NARRATIVE CELLS:
Tab structure includes narrative cells:
- A1: {{cardNarrative}} (story about what this data shows)
- A20: {{dataInsights}} (key findings and trends)
- A22: {{recommendedActions}} (what this data suggests)

GOOGLE SLIDES - NARRATIVE TEXT BOXES:
Slide layouts include narrative areas:
- Slide subtitle: {{cardNarrative}} (brief story)
- Slide notes: {{speakerNotes}} (detailed narrative for presentations)
- Summary slide: {{overallStory}} (comprehensive narrative)

DYNAMIC CALCULATION EXAMPLES:
=============================

The system automatically calculates these narrative elements:

CONCENTRATION CALCULATION:
concentration = (sum of top 3 values / total value) * 100
if concentration > 70%: isHighConcentration = true
if concentration < 30%: isLowConcentration = true

GROWTH CALCULATION:
if (current period data && previous period data):
  growthRate = ((current - previous) / previous) * 100
  hasGrowthData = true

ENTITY RANKING:
topEntity = highest value entity name
secondEntity = second highest value entity name  
bottomEntity = lowest value entity name

EXAMPLE COMPLETE NARRATIVE OUTPUT:
"This Obligations Analysis examines 145 agencies representing $112.8B in total 
spending. Department of Veterans Affairs emerges as the dominant player with $29.6B 
(26.3%), followed by Defense Information Systems Agency at $13.2B. The market exhibits 
significant concentration with the top 10 agencies controlling 87.4% of total activity. 
Key insights include: VA's market leadership represents over a quarter of all federal 
IT spending, the top tier (Tier 1 $500M+) accounts for 89% of all obligations, and 
145 total agencies participate with an average spending of $776.7M each."

This creates professional, data-driven narratives that adapt to any dataset while 
maintaining consistent storytelling quality.
*/