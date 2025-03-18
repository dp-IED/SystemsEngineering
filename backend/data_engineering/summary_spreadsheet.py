import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter
from openpyxl.styles import PatternFill
import io, os
import time
import pandas as pd
from openpyxl import load_workbook, Workbook
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter
from azure.kusto.data import KustoClient, KustoConnectionStringBuilder, DataFormat
from azure.kusto.data.helpers import dataframe_from_result_table
from azure.kusto.ingest import QueuedIngestClient, IngestionProperties
from azure.kusto.ingest.ingestion_properties import ReportLevel
import tempfile
import time
import os
from azure.kusto.data import KustoClient, KustoConnectionStringBuilder
from azure.kusto.data.helpers import dataframe_from_result_table

def save_dataframe_to_excel(df, filename, divisions):
    """
    Saves the DataFrame to an Excel file, splitting it into sheets by divisions.
    """
    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
        for division in divisions:
            df_division = df[df['Division'] == division]
            sheet_name = str(division).replace(':', '').replace('\\', '').replace('/', '').replace('?', '').replace('*', '')[:31]
            if sheet_name.strip() == '':
                sheet_name = 'Other'
            df_division.to_excel(writer, sheet_name=sheet_name, index=False)

def delete_column_from_sheets(workbook, column_title):
    """
    Deletes a column from all sheets in the workbook based on the column title.
    """
    for sheet_name in workbook.sheetnames:
        ws = workbook[sheet_name]
        column = None
        for cell in ws[1]:
            if cell.value == column_title:
                column = cell.column
                break
        if column:
            ws.delete_cols(column)

def format_workbook(workbook):
    """
    Applies formatting to all sheets in the workbook.
    """
    for sheet_name in workbook.sheetnames:
        ws = workbook[sheet_name]
        for col in ws.columns:
            max_length = max((len(str(cell.value)) if cell.value else 0) for cell in col)
            adjusted_width = max_length + 2
            ws.column_dimensions[get_column_letter(col[0].column)].width = adjusted_width

        for row in ws.iter_rows():
            for cell in row:
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = Font(bold=True, size=12)
                
def set_column_width(sheet, start_col, headers, months):
    """
    Set the width of the columns based on the header text.
    """
    num_columns = len(headers)
    for i, month in enumerate(months):
        month_start_col = start_col + i * num_columns
        for j in range(num_columns):
            col_letter = get_column_letter(month_start_col + j)
            sheet.column_dimensions[col_letter].width = max(len(header) for header in headers) + 2  # Adding extra space for padding

def append_monthly_tables_to_excel(filename, start_col):
    # Load the existing workbook
    book = load_workbook(filename)
    sheet = book.active  # Using the active sheet, adjust if needed to target a specific sheet

    # Define the data structure for headers
    headers = ['NetBillable', 'AgencyCommission', 'LevyASBOF', 'TotalInvoicedToDate']
    months = ['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December']

    # Determine the starting row right after existing content
    start_row = 1  # Adjust if you have headers or titles already in the first rows

    # Write the headers for each month
    for i, month in enumerate(months):
        col_offset = start_col + i * len(headers)  # Adjusting column offset for each month
        # Merge cells for the month header
        sheet.merge_cells(start_row=start_row, start_column=col_offset + 1, end_row=start_row, end_column=col_offset + len(headers))
        month_cell = sheet.cell(row=start_row, column=col_offset + 1)
        month_cell.value = month
        month_cell.alignment = Alignment(horizontal="center", vertical="center")
        month_cell.font = Font(bold=True, size=12)

        # Write sub-headers under each month header
        for j, header in enumerate(headers):
            header_cell = sheet.cell(row=start_row + 1, column=col_offset + j + 1)
            header_cell.value = header
            header_cell.alignment = Alignment(horizontal="center", vertical="center")
            header_cell.font = Font(bold=True, size=12)
    
    # Adjust column widths
    set_column_width(sheet, start_col, headers, months)

    # Save the workbook
    book.save(filename)
    book.close()
    print("Data has been populated successfully.")


# Define ADX information
CLUSTER = "https://chanelmediacluster.uksouth.kusto.windows.net"
DATABASE = "financial-database-1"
BILLED_QUERY = """
//further clean billed report

billed_report
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
    ClientCode == "C60" or ClientCode == "C65", "PPC",
    MediaName == "SEARCH&SOC" and ClientCode != "C60" and ClientCode != "C65", "Social",
    MediaName == "DISPLAY" and CampaignName contains "VIDEO", "Video",
    MediaName == "DISPLAY" and CampaignName !contains "VIDEO", "Display",
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
    ProductName == "IRE" or ProductName == "ROI", "PPC",
    ProductName contains "MAKE UP" or ProductName contains "LES BEIGE", "Make Up",
    ProductName contains "SKINCARE", "Skincare",
    ProductName contains "CHANCE", "Chance",
    ProductName contains "COCO MELLE", "Coco Melle",
    ProductName contains "NO 5", "No 5",
    ProductName)
// create market column based on LocalCurrencyCode
| extend Market = case(
    ClientCode == "C50" or ClientCode == "C51" or ClientCode == "C52" or ClientCode == "C60", "UK",
    ClientCode == "C58" or ClientCode == "C65", "IRE",
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
|extend Division = case(
    Channel == "Retainer Fee" and Campaign contains "F&B", "F&B",
    Channel == "Retainer Fee" and Campaign contains "FASHION", "FSH&EW",
    Channel == "Retainer Fee" and Campaign contains "EYEWEAR", "FSH&EW",
    Channel == "Retainer Fee" and Campaign contains "JEWELLERY", "W&FJ",
    Channel == "Retainer Fee" and Campaign contains "WATCHES", "W&FJ",
    Division == "Paid Search", "F&B",
    Channel == "Retainer Fee", Division,  // Keep the original division if no match
    Division  // Default to the original division if Channel is not "Retainer Fee"
)
| project 
    PO_Number = PO,
    Campaign,
    Channel,
    ProductCode,
    NormalisedProductName,
    NetBillable = Payable,
    AgencyCommission,
    LevyASBOF = LevyBillable,
    Total_Invoice_Val = UnbilledClientCost,
    Market,
    Division,
    Month,
    InvoiceNo
| sort by Division asc, Campaign asc
"""
BUDGET_QUERY = """
budgettracker
| extend GrandTotalReserve = ['GRAND TOTAL inc reserve'],
PlannedSpendData = ['Planned Spend latest plan'],
Reserve = ['Reserve'] // Include the reserve amount
| extend TotalAvailableBudget = GrandTotalReserve // Budget already includes reserve
| extend Campaign = tolower(trim(" ", Campaign))
| join kind=leftouter (
billed_report
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
by Campaign, Market
| project Campaign, PlannedSpend, ReservedBudget, TotalBudget, Market
"""

ANNUAL_BUDGET_QUERY = "annual_budget_sheet"

# Authentication (Choose the appropriate method)
KCSB = KustoConnectionStringBuilder.with_az_cli_authentication(CLUSTER)
KCSB_INGEST = KustoConnectionStringBuilder.with_az_cli_authentication(CLUSTER.replace("https://", "https://ingest-"))

# Create Kusto Client
client = KustoClient(KCSB)

def ingest_summary(KCSB_INGEST, summary):
    
    ingest_client = QueuedIngestClient(KCSB_INGEST)
    
    # Save DataFrame as CSV for ingestion
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as temp_file:
        summary.to_csv(temp_file.name, header=None, index=False)  # Save DataFrame to CSV
        temp_filename = temp_file.name
        
        # Define Ingestion Properties
        ingestion_props = IngestionProperties(
            database=DATABASE,
            table="new_summary",
            data_format=DataFormat.CSV,  # You can also use JSON or Parquet
            report_level=ReportLevel.FailuresAndSuccesses,
            flush_immediately=True  # Ensure data is available quickly
            )
        
        # Ingest the CSV file into ADX
        ingest_client.ingest_from_file(temp_filename, ingestion_properties=ingestion_props)


# Execute the query
response_1 = client.execute(DATABASE, BILLED_QUERY)
response_2 = client.execute(DATABASE, BUDGET_QUERY)
response_3 = client.execute(DATABASE, ANNUAL_BUDGET_QUERY)

# Convert response to Pandas DataFrame
cleaned_billed = dataframe_from_result_table(response_1.primary_results[0])
cleaned_budget_tracker = dataframe_from_result_table(response_2.primary_results[0])
annual_budget = dataframe_from_result_table(response_3.primary_results[0])

# Append total rows for each campaign
overall_totals = cleaned_billed.groupby(['Campaign', 'Market','Division']).agg({
    'NetBillable': 'sum',
    'AgencyCommission': 'sum',
    'LevyASBOF': 'sum',
    'Total_Invoice_Val': 'sum',
    'ProductCode': 'first',
    'NormalisedProductName': 'first',
    'PO_Number': 'first'
}).reset_index()

overall_totals['Channel'] = 'Total'
overall_totals['Month'] = 'Total'


# Combine the detailed and total rows
unmatched_df = pd.concat([cleaned_billed, overall_totals], ignore_index=True)

# Reset index, sort results and display
unmatched_df = unmatched_df.sort_values(by=['Division', 'Campaign', 'Market', 'Month'])
unmatched_df = unmatched_df.reset_index(drop=True)

# pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)

# print(unmatched_df)

# make campaign names lowercase
unmatched_df["NormalisedProductName"] = unmatched_df["NormalisedProductName"].str.lower()

# Separate "total" rows from unmatched_df
totals_df = unmatched_df[unmatched_df["Channel"] == "Total"].copy()
non_totals_df = unmatched_df[unmatched_df["Channel"] != "Total"]

# Merge totals_df with cleaned_budget_tracker based on NormalisedProductName and Campaign
merged_totals_df = totals_df.merge(
    cleaned_budget_tracker,
    left_on=["NormalisedProductName","Market"],
    right_on=["Campaign","Market"],
    how="left"
)
# print("totals")
# print(merged_totals_df)
# print("non totals")
# print(non_totals_df)

non_totals_df = non_totals_df.sort_values(by=['Division', 'Campaign', 'Channel', 'Market'])
merged_totals_df = merged_totals_df.sort_values(by=['Division', 'PO_Number'])
merged_totals_df.rename(columns={"Campaign_x": "Campaign"}, inplace=True)

# print(merged_totals_df)

# Concatenate non-total and total rows
final_merged_df = pd.concat([non_totals_df, merged_totals_df], ignore_index=True)

# Sort by Division, Campaign, and SortOrder (ensuring totals appear last)
final_merged_df = final_merged_df.sort_values(by=['Division', 'Campaign', 'Channel'])

# Reset index
final_merged_df = final_merged_df.reset_index(drop=True)


"""
last_budget_value = annual_budget["2024 CURRENT FORECAST Year 2025 Budget"].dropna().iloc[-1]

last_fnb_index = final_merged_df[final_merged_df["Division"] == "F&B"].index.max()

# Create the new row
new_row = pd.DataFrame({
    "Division": ["F&B"], 
    "ChanelBudget": [last_budget_value]
})


merged_df = pd.concat([final_merged_df.iloc[:last_fnb_index + 1], new_row, final_merged_df.iloc[last_fnb_index + 1:]], ignore_index=True)

"""

columns_to_keep = ['PO_Number', 'Campaign', 'Channel', 'ProductCode', 'TotalBudget', 'NetBillable', 'AgencyCommission', 'LevyASBOF', 'Total_Invoice_Val', 'PlannedSpend', 'ReservedBudget', 'Market', 'Division', 'InvoiceNo', 'Month']

summary_df = final_merged_df[columns_to_keep]
ingest_summary_df = summary_df
# print(ingest_summary_df)


"""
# Identify numerical columns
numerical_cols = ['NetBillable', 'AgencyCommission', 'LevyASBOF', 'Total_Invoice_Val', 
                  'PlannedSpend', 'ReservedBudget', 'TotalBudget', 'ChanelBudget']

# Identify non-numerical columns to keep
non_numerical_cols = ['PO_Number', 'ProductCode', 'Campaign', 'Channel', 'Market', 'Division', 'Month', 'InvoiceNo']

# Group by 'Campaign' and 'Channel', summing numerical columns
summary_df = merged_df.groupby(['PO_Number','Campaign', 'Channel'], as_index=False)[numerical_cols].sum()

# Merge back non-numerical columns (excluding 'Month')
summary_df = summary_df.merge(merged_df[non_numerical_cols].drop_duplicates(), on=['PO_Number','Campaign','Channel'], how='left')

"""

# Drop duplicates to ensure clean merging
summary_df = summary_df.drop_duplicates()

summary_df.loc[:, "StartDate"] = None
summary_df.loc[:, "EndDate"] = None
summary_df.loc[:, "POCloseDownDate"] = None

#rename Total_Invoice_Val to TotalInvoicedToDate
summary_df.rename(columns={'Total_Invoice_Val': 'TotalInvoicedToDate'}, inplace=True)

# Add TotalPOValue and POValueRemaining columns
summary_df['TotalPOValue'] = summary_df['AgencyCommission'] + summary_df['LevyASBOF'] + summary_df['TotalBudget']
summary_df['POValueRemaining'] = summary_df['TotalPOValue'] - summary_df['TotalInvoicedToDate']

# Ensure budget-related values only appear where Channel == "Total"
columns_to_clear = [
    "TotalPOValue", "TotalInvoicedToDate", "POValueRemaining", "TotalBudget", "PlannedSpend", "ReservedBudget", "ChanelBudget"]

summary_df.loc[summary_df["Channel"] != "Total", columns_to_clear] = None  # Set non-"Total" rows to NaN

ordered_columns = ['PO_Number', 'Campaign', 'StartDate', 'EndDate', 'POCloseDownDate', 'Channel', 'ProductCode', 'TotalBudget', 'NetBillable', 'AgencyCommission', 'LevyASBOF', 'TotalPOValue', 'TotalInvoicedToDate', 'POValueRemaining', 'PlannedSpend', 'ReservedBudget', 'Market', 'Division', 'InvoiceNo', 'Month']

ordered_summary_df = summary_df[ordered_columns]

# Identify campaigns that appear at least three times
campaign_counts = summary_df['Campaign'].value_counts()
repeated_campaigns = campaign_counts[campaign_counts >= 3].index

# Process only campaigns that need merging
summary_df['PO_Number'] = summary_df.apply(
    lambda row: row['PO_Number'] if row['Campaign'] not in repeated_campaigns or row['Channel'] == "Total" else None, axis=1
)
summary_df['Campaign'] = summary_df.apply(
    lambda row: row['Campaign'] if row['Campaign'] not in repeated_campaigns or row['Channel'] == "Total" else None, axis=1
)

# Set non-numeric values to None where 'Channel' is "Total"
non_numeric_cols = ['PO_Number', 'Campaign', 'Market', 'Division']
summary_df.loc[summary_df['Channel'] == "Total", non_numeric_cols] = None

# Save DataFrame to Excel, divided by 'Division'
filename = "FormattedAnnualBudget.xlsx"
divisions = ordered_summary_df['Division'].unique()

with pd.ExcelWriter(filename, engine='openpyxl') as writer:
    for division in divisions:
        df_division = ordered_summary_df[ordered_summary_df['Division'] == division]
        sheet_name = str(division).replace(':', '').replace('\\', '').replace('/', '').replace('?', '').replace('*', '')[:31]  # Excel sheet name limits
        if sheet_name.strip() == '':
            sheet_name = 'Other'
        df_division.to_excel(writer, sheet_name=sheet_name, index=False)

time.sleep(2)  # Ensure the file is written


if os.path.exists(filename) and os.path.getsize(filename) > 0:
    wb = load_workbook(filename)
    
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        
        # Get the column index for relevant headers
        header_row = 1
        columns_to_merge_by_value = ["Campaign", "PO_Number", "Channel"]
        columns_to_merge_like_po = ["StartDate", "EndDate", "POCloseDownDate"]
        all_columns_to_merge = columns_to_merge_by_value + columns_to_merge_like_po

        column_indices = {}

        # Search for the columns by header name
        for col_idx, cell in enumerate(ws[header_row], start=1):
            if cell.value in columns_to_merge_by_value:
                column_indices[cell.value] = col_idx

        # Ensure all columns are found
        missing_columns = [col for col in columns_to_merge_by_value if col not in column_indices]
        if missing_columns:
            print(f"Error: Columns not found - {missing_columns}")
            continue

        # Merge cells for each identified column
        for col_name, col_index in column_indices.items():
            values = [ws.cell(row=row, column=col_index).value for row in range(2, ws.max_row + 1)]  # Get values in column (skip header)
            
            start_row = 2  # First row where data starts
            for i in range(1, len(values)):
                if col_name in columns_to_merge_by_value:  # Merge when values are the same
                    if values[i] != values[i - 1]:  # If value changes, merge previous block
                        if i + 1 > start_row:  # Ensure more than 1 row exists
                            ws.merge_cells(
                                start_row=start_row,
                                end_row=i + 1,
                                start_column=col_index,
                                end_column=col_index
                            )
                        start_row = i + 2  # Move to next block
                
                elif col_name in columns_to_merge_like_po:  # Merge exactly like PO_Number
                    if values[i] != values[i - 1]:  # If value changes, merge previous block
                        if i +1 > start_row:  # Ensure more than 1 row exists
                            ws.merge_cells(
                                start_row=start_row,
                                end_row=i + 1,
                                start_column=col_index,
                                end_column=col_index
                            )
                        start_row = i + 2  # Move to next block
            
            # Merge the last block if needed
            if start_row <= ws.max_row:
                ws.merge_cells(
                    start_row=start_row,
                    end_row=ws.max_row,
                    start_column=col_index,
                    end_column=col_index
                )

    wb.save(filename)
    print("Merged cells successfully.")
                

    # Assuming 'delete_column_from_sheets' and 'format_workbook' functions are defined as previous
    delete_column_from_sheets(wb, 'Division')
    format_workbook(wb)
    
    # Define fill colours
    header_fill = PatternFill(start_color="48546C", end_color="48546C", fill_type="solid")  # Header background
    header_font = Font(color="FFFFFF", bold=True)  # White header text
    channel_fill = PatternFill(start_color="71AD47", end_color="71AD47", fill_type="solid")  # Green for Channel column
    product_fill = PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid")  # Light pink for product-related columns
    invoice_fill = PatternFill(start_color="C6E0B4", end_color="C6E0B4", fill_type="solid")  # Light green for TotalInvoiceVal column
    total_row_fill = PatternFill(start_color="BFBFBF", end_color="BFBFBF", fill_type="solid")  # Gray for total rows
    
    # Columns to format
    product_columns = ["ProductCode", "TotalBudget", "NetBillable", "AgencyCommission", "LevyASBOF"]
    invoice_column = "TotalInvoiceVal"
    channel_column = "Channel"
    
    # Apply formatting to all sheets
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        
        # Apply styles to the header row (assumes headers are in row 1)
        for cell in ws[1]:  # Iterate over header row
            cell.fill = header_fill
            cell.font = header_font
        
        # Get column indices dynamically
        column_indices = {cell.value: cell.column for cell in ws[1] if cell.value}
        
        # Apply formatting to columns if they exist
        for row in ws.iter_rows(min_row=2, max_row=ws.max_row):
            total_row = False  # Flag to check if row contains 'Total'
            
            for cell in row:
                col_name = ws.cell(row=1, column=cell.column).value  # Get column name
                cell_value = str(cell.value).lower() if cell.value else ""  # Convert value to lowercase for comparison
                    
                if col_name == channel_column:  # Channel column (green)
                    cell.fill = channel_fill
                    
                elif col_name in product_columns:  # Product-related columns (light pink)
                    cell.fill = product_fill
                
                elif col_name == invoice_column:  # TotalInvoiceVal column (light green)
                    cell.fill = invoice_fill
                    
                if "total" in cell_value:  # Check if 'Total' appears in any column of the row
                    total_row = True
                    
                # If the row is a total row, apply gray to all its cells
                if total_row:
                    for cell in row:
                        cell.fill = total_row_fill

    wb.save(filename)
else:
    print("Error: The file does not exist or is empty.")
# Usage
filename = 'FormattedAnnualBudget.xlsx'  # Specify the path to your file
start_col = 19  # Adjust as necessary to the column where the January headers should begin
# print(summary_df)
append_monthly_tables_to_excel(filename, start_col)
ingest_summary(KCSB_INGEST, ingest_summary_df)