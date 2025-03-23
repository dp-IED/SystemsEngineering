import azure.functions as func
import logging
from AdxIngestFunction.excel_generator import generate_excel_report  # If you moved it to its own file
# OR from this file if still defined here

app = func.FunctionApp()

@app.function_name(name="GenerateExcelHttpTrigger")
@app.route(route="generate-excel", auth_level=func.AuthLevel.ANONYMOUS)
def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("HTTP trigger received - starting report generation.")
    
    try:
        generate_excel_report()
        return func.HttpResponse("Excel report generated successfully!", status_code=200)
    except Exception as e:
        logging.error(f"Error during report generation: {e}")
        return func.HttpResponse(f"Failed: {str(e)}", status_code=500)
