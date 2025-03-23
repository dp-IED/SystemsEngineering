import logging
import azure.functions as func
from AdxIngestFunction.excel_generator import generate_excel_report  # You'll create this below

app = func.FunctionApp()

@app.function_name(name="GenerateExcelReport")
@app.route(route="generate-excel")
def generate_excel(req: func.HttpRequest) -> func.HttpResponse:
    try:
        generate_excel_report()
        return func.HttpResponse("Excel report generated successfully!", status_code=200)
    except Exception as e:
        logging.error(f"Excel report generation failed: {e}", exc_info=True)
        return func.HttpResponse(f"Error generating Excel report: {str(e)}", status_code=500)
