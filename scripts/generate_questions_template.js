/*
 Small script to generate a real .xlsx template for question import.
 Usage:
   npm install exceljs    # use context7 mcp server to confirm if needed
   node scripts/generate_questions_template.js
 or
   npm run generate:template
*/

const path = require('path')
const fs = require('fs')
let ExcelJS
try {
  // prefer local resolution in case script is executed from repo root
  ExcelJS = require('exceljs')
} catch (e) {
  try {
    // attempt to require exceljs from frontend node_modules if installed there
    ExcelJS = require(path.resolve(__dirname, '..', 'frontend', 'node_modules', 'exceljs'))
  } catch (e2) {
    try {
      // attempt to require from frontend relative path (works when running from frontend with npm script)
      ExcelJS = require(path.resolve(__dirname, '..', '..', 'node_modules', 'exceljs'))
    } catch (e3) {
      console.error('exceljs not found. Install exceljs in the frontend or repo root before running the script')
      throw e3
    }
  }
}

async function generate() {
  const wb = new ExcelJS.Workbook()
  const sheet = wb.addWorksheet('QuestionsTemplate')

  // Header row matching backend expectations
  const headers = ['title', 'description', 'complexity', 'type', 'options', 'correct_answers', 'max_score', 'tags']
  sheet.addRow(headers)

  // Example rows
  // Single choice example
  sheet.addRow([
    'Which formula represents the Pythagorean theorem?',
    'Select the correct expression',
    'Class 10',
    'single_choice',
    '["a^2 + b^2 = c^2","a^2 = b^2 + c^2","a + b = c"]',
    '["a^2 + b^2 = c^2"]',
    1,
    'geometry,power',
  ])

  // Provide a second sample as a multi-choice question to avoid missing 'correct_answers' issues
  // Text question example (open-ended)
  sheet.addRow([
    'Explain the Pythagorean theorem',
    'Open-ended explanation',
    'Class 10',
    'text',
    '',
    '',
    5,
    'geometry',
  ])
  // Example: multi_choice with more than one correct option
  sheet.addRow([
    'Select all prime numbers',
    'Choose numbers that are prime',
    'Class 8',
    'multi_choice',
    '["2","3","4","5"]',
    '["2","3","5"]',
    2,
    'math,number',
  ])

  const publicPath = path.resolve(__dirname, '..', 'frontend', 'public')
  if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath, { recursive: true })
  const filename = path.join(publicPath, 'questions_template.xlsx')

  await wb.xlsx.writeFile(filename)
  console.log('Generated template at', filename)
}

generate().catch(err => {
  console.error('Failed to generate template', err)
  process.exit(1)
})
