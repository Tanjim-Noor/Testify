import os
import sys
from pathlib import Path

# Ensure that backend directory is on sys.path so 'src' package imports work when running the script directly
BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
	sys.path.insert(0, str(BASE_DIR))

from openpyxl import Workbook
from src.services.excel_parser import QuestionExcelParser

# Create a sample workbook
wb = Workbook()
sheet = wb.active
sheet.append(["title","description","complexity","type","options","correct_answers","max_score","tags"])
sheet.append(["What is 2+2?","Simple addition","easy","single_choice","[\"A:3\", \"B:4\", \"C:5\"]","[\"B\"]",1,"math,arithmetic"])
sheet.append(["Explain gravity","Open ended","medium","text",None,None,2,"physics"])

file_path = "sample_questions.xlsx"
wb.save(file_path)

parser = QuestionExcelParser(file_path)
valid, errors = parser.parse()

print("Valid:", valid)
print("Errors:", [e.dict() for e in errors])
