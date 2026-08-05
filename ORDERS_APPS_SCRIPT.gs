/**
 * AnimeCurio – Google Sheets Orders & Inventory Apps Script
 * =========================================================
 * HOW TO USE IN YOUR GOOGLE SHEET:
 * 1. Open your Google Sheet (with "Inventory" tab and "Orders" tab)
 * 2. Go to Extensions → Apps Script
 * 3. Replace/Paste this entire script
 * 4. Click Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL and set it as SHEETS_API_URL in App.jsx!
 *
 * ORDERS SHEET COLUMN HEADERS (Row 1 of "Orders" tab):
 * Order ID | Timestamp | Name | WhatsApp | Email | Business | City | Order Items | Order Total | Notes | Status
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
      .filter(row => row[0] !== '' && row[0] !== null)
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

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Orders') || ss.getSheetByName('orders');
    
    // Auto-create "Orders" tab with headers if it doesn't exist yet
    if (!sheet) {
      sheet = ss.insertSheet('Orders');
      sheet.appendRow([
        'Order ID', 'Timestamp', 'Name', 'WhatsApp', 'Email',
        'Business', 'City', 'Order Items', 'Order Total', 'Notes', 'Status'
      ]);
    }

    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const orderId = payload.orderId || ('ACK-' + Math.floor(100000 + Math.random() * 900000));
    const timestamp = payload.timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const name = payload.name || '';
    const whatsapp = payload.whatsapp || payload.phone || '';
    const email = payload.email || '';
    const business = payload.business || payload.company || '';
    const city = payload.city || '';
    const orderItems = payload.orderItems || payload.itemsSummary || '';
    const orderTotal = payload.orderTotal || payload.total || '';
    const notes = payload.notes || payload.address || '';
    const status = payload.status || 'Payment Pending (QR Sent)';

    // Append new order row
    sheet.appendRow([
      orderId,
      timestamp,
      name,
      whatsapp,
      email,
      business,
      city,
      orderItems,
      orderTotal,
      notes,
      status
    ]);

    return jsonResponse({
      success: true,
      orderId: orderId,
      message: 'Order recorded in Google Sheets Orders tab'
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
