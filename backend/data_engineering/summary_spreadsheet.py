import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter
import io
from azure.kusto.data import KustoClient, KustoConnectionStringBuilder
from azure.kusto.data.helpers import dataframe_from_result_table

# Define your database and table
CLUSTER = "https://chanelmediacluster.uksouth.kusto.windows.net"
DATABASE = "financial-database-1"
QUERY_1 = """
unbilled_report
// add column of months
| extend Month = datetime_part("month", todatetime(BuyMonth))
| extend Month = case(
    Month == 1, "January",
    Month == 2, "February",
    Month == 3, "March",
    Month == 4, "April",
    Month == 5, "May",
    Month == 6, "June",
    Month == 7, "July",
    Month == 8, "August",
    Month == 9, "September",
    Month == 10, "October",
    Month == 11, "November",
    Month == 12, "December",
    "Unknown"
)
// add column of media names from PO tracker
| extend Channel = case(
    MediaName == "SEARCH&SOC", "Social & PPC",
    MediaName == "DISPLAY", "Display & VOD",
    MediaName == "PRESS", "Print",
    MediaName == "CINEMA", "Cinema",
    MediaName == "TELEVISION", "TV",
    MediaName == "FEES", "Retainer Fee",
    MediaName == "POSTER", "OOH",
    MediaName == "INT'L", "Retainer Fee",
    MediaName)
// normalise product names
| extend NormalisedProductName = case(
    ProductName == "EYEWEAR", "Eyewear",
    ProductName contains "FASHION" or ProductName contains "MDA", "Fashion",
    ProductName == "JEWELLERY HJ", "High Jewellery",
    ProductName contains "WATCHES", "Watches",
    ProductName == "BLEU", "Bleu",
    ProductName == "UK", "PPC",
    ProductName contains "MAKE UP" or ProductName contains "LES BEIGE", "Make Up",
    ProductName contains "SKINCARE", "Skincare",
    ProductName contains "CHANCE", "Chance",
    ProductName contains "COCO MELLE", "Coco Melle",
    ProductName contains "NO 5", "No 5",
    ProductName)
// create market column based on LocalCurrencyCode
| extend Market = case(
    CampaignName has "UK", "UK",
    CampaignName has "IRE", "IRE",
    "")
// clean up campaign name - remove _ and CHANEL, remove channel name
| extend Campaign = replace_regex(CampaignName, @"_", " ")
| extend Campaign = replace_regex(Campaign, @"\b(CHANEL)\b", "")
| extend Campaign = replace_regex(Campaign, @"-", " ")
| extend Campaign = replace_regex(Campaign, @"\b(UK|IRE|SOCIAL|SOCIA|SO|SOC|DISPLAY|D|DSP|DISP|FEE|FEES)\b", "")
// create year column, and create MainName column without year and suffix
| extend Year = extract(@"(20\d{2}|2[0-9])\b", 0, Campaign)
| extend Year = iff(strlen(Year) == 2, strcat("20", Year), Year)
// remove unnecessary characters
| extend Campaign = trim(" ", replace_regex(Campaign, @"(20\d{2}|2[0-9])\b|FB|FR|MU|WFJ|\bWA\b|FSH|BEA|VIDEO|\.", ""))
// remove spaces
| extend Campaign = trim(" ", replace_regex(Campaign, @" ", ""))
// normalise campaign names
| extend Campaign = case(
    Campaign contains "BLEUH1", "Bleu H1",
    Campaign contains "BLEUH2", "Bleu H2",
    Campaign contains "LESBEIGEHERO" or Campaign contains "LESBEIGESHERO", "Les Beiges HERO",
    Campaign contains "COCOCRUSHH1", "Coco Crush H1",
    Campaign contains "J12H1", "J12 H1",
    Campaign contains "N1H2", "N1 H2",
    Campaign contains "EYEWEAR", "Eyewear",
    Campaign contains "NO5LEAU", "No.5 Leau",
    Campaign contains "C50/07", "C50/07",
    Campaign contains "NO5LEAUDROP", "No.5 Leau Drop",
    Campaign contains "BLEU", "Bleu",
    Campaign contains "LESBEIGES" or Campaign contains "LESBEIGE", "Les Beiges",
    Campaign contains "HIGHJEWELLERY", "High Jewellery",
    Campaign contains "COCOMELLE", "Coco Melle",
    ProductName == "MDA", "MDA",
    Campaign)
| extend Division = case(
    Channel == "Retainer Fee" and Campaign contains "F&B", "F&B",
    Channel == "Retainer Fee" and Campaign contains "FASHION", "FSH&EW",
    Channel == "Retainer Fee" and Campaign contains "EYEWEAR", "FSH&EW",
    Channel == "Retainer Fee" and Campaign contains "JEWELLERY", "W&FJ",
    Channel == "Retainer Fee" and Campaign contains "WATCHES", "W&FJ",
    Division == "Paid Search", "F&B",
    Channel == "Retainer Fee", Division,  // Keep the original division if no match
    Division  // Default to the original division if Channel is not "Retainer Fee"
)
| summarize 
    NetBillable = sum(Payable), 
    AgencyCommission = sum(AgencyCommission), 
    LevyASBOF = sum(LevyBillable), 
    ProductCode = take_any(ProductCode),
    NormalisedProductName = take_any(NormalisedProductName),
    PO_Number = take_any(PO),
    Market = take_any(Market),
    Total_Invoice_Val = sum(UnbilledClientCost)
by Campaign, Division, Channel, Month
| sort by Division asc, Campaign asc
"""
QUERY_2 = """
budget_tracker
| extend GrandTotalReserve = ['GRAND TOTAL inc reserve'],
PlannedSpendData = ['Planned Spend latest plan'],
Reserve = ['Reserve'] // Include the reserve amount
| extend TotalAvailableBudget = GrandTotalReserve // Budget already includes reserve
| extend Campaign = tolower(trim(" ", Campaign))
| join kind=leftouter (
unbilled_report
| extend Campaign = replace_regex(CampaignName, @"_", " ")
| extend Campaign = replace_regex(Campaign, @"\b(CHANEL)\b", "")
| extend Campaign = replace_regex(Campaign, @"-", " ")
| extend Campaign = replace_regex(Campaign, @"\b(UK|IRE|SOCIAL|DISPLAY|FEE|DSP|DISP)\b", "")
| extend Campaign = trim(" ", replace_regex(Campaign, @"(20\d{2})\b|FB|FR|MU|WFJ|WA|FSH|BEA|VIDEO|\.", ""))
| extend Campaign = trim(" ", replace_regex(Campaign, @"\s+", " "))
| extend Campaign = tolower(Campaign)
| extend Campaign = case(
Campaign contains "bleu", "Bleu",
Campaign contains "no.5", "No. 5",
Campaign contains "les beige", "Make Up",
Campaign contains "coco melle", "Coco Melle",
Campaign contains "chance", "Chance",
Campaign contains "skincare", "Skincare",
Campaign contains "travel", "Travel Retail",
Campaign contains "watches", "Watches",
Campaign contains "jewellery", "Fine Jewellery",
Campaign contains "high jewellery", "High Jewellery",
Campaign contains "fashion", "Fashion",
Campaign contains "eyewear", "Eyewear",
Campaign contains "ppc", "PPC",
"Other")
| project Campaign, UnbilledCurrency
) on Campaign
| summarize
TotalUnbilled = sum(UnbilledCurrency),
TotalBudget = sum(TotalAvailableBudget),
PlannedSpend = sum(PlannedSpendData),
ReservedBudget = sum(Reserve)
by Campaign
| project Campaign, PlannedSpend, ReservedBudget, TotalBudget
"""

QUERY_3 = "annual_budget_sheet"

# Authentication (Choose the appropriate method)
KCSB = KustoConnectionStringBuilder.with_az_cli_authentication(CLUSTER)

# Create Kusto Client
client = KustoClient(KCSB)

# Execute the query
response_1 = client.execute(DATABASE, QUERY_1)
response_2 = client.execute(DATABASE, QUERY_2)
response_3 = client.execute(DATABASE, QUERY_3)

# Convert response to Pandas DataFrame
cleaned_unbilled = dataframe_from_result_table(response_1.primary_results[0])
cleaned_budget_tracker = dataframe_from_result_table(response_2.primary_results[0])
annual_budget = dataframe_from_result_table(response_3.primary_results[0])

# Group by 'Campaign' and 'Channel', then sum the relevant numerical columns
annual_summary = cleaned_unbilled.groupby(["Campaign", "Channel", "Division", "Month"], as_index=False).agg({
    "Division": "first",  # Keeps the first occurrence
    "NetBillable": "sum",
    "AgencyCommission": "sum",
    "LevyASBOF": "sum",
    "ProductCode": "first",  # Keeps the first occurrence
    "NormalisedProductName": 'first',
    "PO_Number": lambda x: ", ".join(sorted(set(x.dropna()))),  # Unique sorted PO numbers
    "Market": lambda x: ", ".join(sorted(set(x.dropna()))),  # Unique sorted markets
    "Total_Invoice_Val": "sum"  # Sum total invoice values
})

# Append total rows for each campaign
overall_totals = annual_summary.groupby(['Campaign', 'Division']).agg({
    'NetBillable': 'sum',
    'AgencyCommission': 'sum',
    'LevyASBOF': 'sum',
    'Total_Invoice_Val': 'sum',
    'ProductCode': 'first',
    'NormalisedProductName': 'first',
    'PO_Number': 'first',
    'Market': 'first'
}).reset_index()

overall_totals['Channel'] = "Total"
overall_totals['Month'] = "Total"

# Combine the detailed and total rows
final_df = pd.concat([annual_summary, overall_totals], ignore_index=True)

# Reset index, sort results and display
final_df = final_df.sort_values(by=['Division', 'Campaign', 'Month'])
final_df = final_df.reset_index(drop=True)

# make campaign names lowercase
final_df["NormalisedProductName"] = final_df["NormalisedProductName"].str.lower()

# Perform the merge (joining on "Normalised Product Name" and "Campaign")
merged_df = final_df.merge(
    cleaned_budget_tracker,
    left_on="NormalisedProductName",
    right_on="Campaign",
    how="left"  
)

merged_df = merged_df.drop(columns=['NormalisedProductName', 'Campaign_y'])
merged_df = merged_df.rename(columns={"Campaign_x": "Campaign"})

last_budget_value = annual_budget["2024 CURRENT FORECAST Year 2025 Budget"].dropna().iloc[-1]

new_row = pd.DataFrame({"ChanelBudget": [last_budget_value]})
merged_df = pd.concat([merged_df, new_row], ignore_index=True)

pd.set_option('display.max_columns', None)

print(merged_df)

