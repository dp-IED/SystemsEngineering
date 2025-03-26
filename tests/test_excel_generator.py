import unittest
from unittest.mock import patch, MagicMock
import pandas as pd
import tempfile
import os
from AdxIngestFunction.excel_generator import generate_excel_report

class TestExcelGenerator(unittest.TestCase):
    @patch("AdxIngestFunction.excel_generator.load_workbook")
    @patch("AdxIngestFunction.excel_generator.pd.read_csv")
    def test_save_dataframe_to_excel_and_formatting(self, mock_read_csv, mock_load_workbook):
        # Create a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
            fake_path = tmp.name

        # Setup mocked DataFrame with 'Division'
        df = pd.DataFrame({
            'Division': ['F&B', 'FSH&EW', 'W&FJ'],
            'A': [1, 2, 3]
        })
        mock_read_csv.return_value = df

        # Mock worksheet
        mock_ws = MagicMock()
        mock_ws.max_row = 3
        mock_ws.columns = [
            [MagicMock(value="Header1", column=1), MagicMock(value="Header2", column=2)]
        ]
        mock_ws.iter_rows.return_value = [
            [MagicMock(value="Header1", column=1), MagicMock(value="Header2", column=2)],
            [MagicMock(value="total campaign", column=1), MagicMock(value="123", column=2)],
        ]
        mock_ws.__getitem__.return_value = MagicMock(value="SomeHeader")

        # Mock workbook
        mock_wb = MagicMock()
        mock_wb.sheetnames = ["Sheet1"]
        mock_wb.__getitem__.return_value = mock_ws
        mock_load_workbook.return_value = mock_wb

        # Run
        try:
            generate_excel_report(fake_path)
        finally:
            if os.path.exists(fake_path):
                os.remove(fake_path)
                
        # ✅ Assert workbook was loaded exactly 3 times
        assert mock_load_workbook.call_count == 3

        # ✅ Assert save called 3 times
        assert mock_wb.save.call_count == 3

        # Optional: Check all calls saved to correct path
        for call in mock_wb.save.call_args_list:
            assert call.args[0] == fake_path



        # Assert workbook was loaded and saved
        mock_load_workbook.assert_called()

if __name__ == '__main__':
    unittest.main()
