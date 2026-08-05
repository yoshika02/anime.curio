/**
 * AnimeCurio – Google Sheets Inventory API
 * ==========================================
 * HOW TO SET UP:
 * 1. Open your Google Sheet (create one with the columns below)
 * 2. Go to Extensions → Apps Script → paste this entire file
 * 3. Click Deploy → New Deployment → Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL and paste it into App.jsx (SHEETS_API_URL)
 *
 * SHEET COLUMN ORDER (Row 1 = headers, exactly these names):
 *   id | category | title | subtitle | price | actualPrice | rating | reviews | badge | badgeColor | stock | image
 *
 * NOTE ON PRICES:
 * - "price" = Current Selling Price (e.g. 366)
 * - "actualPrice" (or "mrp" / "originalPrice") = Actual Original MRP (e.g. 540)
 *
 * CATEGORY values (case-sensitive): figurines | combos | mystery | keychains
 *
 * EXAMPLE ROW:
 *   1 | figurines | Shadow Swordsman 1/7 Scale | Demon Slayer Series | 366 | 540 | 4.9 | 312 | New | #a31a1a | 15 | /products/figurine_1.png
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('anime inventory') || ss.getSheetByName('Inventory') || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return jsonResponse({ products: [], error: 'No inventory data found' });
    }

    const headers = data[0].map(h => String(h).trim());
    const products = data
      .slice(1)
      .filter(row => row[0] !== '' && row[0] !== null) // skip empty rows
      .map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          const val = row[i];
          // Auto-cast numeric fields
          if (['id', 'price', 'actualPrice', 'originalPrice', 'mrp', 'MRP', 'rating', 'reviews', 'stock', 'category', 'category_id', 'categoryId'].includes(header)) {
            obj[header] = Number(val) || (header === 'category' || header === 'category_id' || header === 'categoryId' ? val : 0);
          } else {
            obj[header] = String(val).trim();
          }
        });
        return obj;
      });

    return jsonResponse({ products, total: products.length, updatedAt: new Date().toISOString() });

  } catch (err) {
    return jsonResponse({ products: [], error: err.message });
  }
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
