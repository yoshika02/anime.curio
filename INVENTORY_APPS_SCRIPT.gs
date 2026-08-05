/**
 * AnimeCurio – Google Sheets Inventory & Orders API
 * ==================================================
 * HOW TO SET UP / UPDATE:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script → replace code with this file
 * 3. Click Deploy → Manage Deployments → Edit (Pencil) → New Version → Deploy
 *
 * SPREADSHEET TABS:
 * 1. "anime inventory" or "Inventory" (for catalog products)
 * 2. "Orders" (auto-created if not exists, records incoming orders with columns):
 *    Order ID | Timestamp | Name | WhatsApp | Email | Business | City | Order Items | Order Total | Notes | Status
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

/**
 * Automatically logs placed orders into the "Orders" tab in Google Sheets!
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let ordersSheet = ss.getSheetByName('Orders');
    
    // Auto-create "Orders" sheet with exact headers if it doesn't exist
    if (!ordersSheet) {
      ordersSheet = ss.insertSheet('Orders');
      ordersSheet.appendRow([
        'Order ID', 'Timestamp', 'Name', 'WhatsApp', 'Email', 'Business', 'City', 'Order Items', 'Order Total', 'Notes', 'Status'
      ]);
      ordersSheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#f3e8ff');
    }

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    // Append order row to Google Sheets
    ordersSheet.appendRow([
      payload.orderId || '',
      payload.timestamp || new Date().toLocaleString('en-IN'),
      payload.name || '',
      payload.whatsapp || '',
      payload.email || '',
      payload.business || '',
      payload.city || '',
      payload.orderItems || '',
      payload.orderTotal || 0,
      payload.notes || '',
      payload.status || 'Payment Pending (QR Sent)'
    ]);

    return jsonResponse({ success: true, orderId: payload.orderId });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
