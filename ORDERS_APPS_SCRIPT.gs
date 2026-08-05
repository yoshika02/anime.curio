/**
 * AnimeCurio – Google Sheets Orders & Automatic Email Dispatch Apps Script
 * =========================================================================
 * HOW TO UPDATE YOUR DEPLOYED SCRIPT:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this updated script (replaces existing content)
 * 3. Click Deploy → Manage Deployments → Edit (Pencil Icon) → New Version → Deploy
 * 
 * FEATURES:
 * - Appends every placed order into the "Orders" tab in Google Sheets
 * - Automatically emails the Customer with their Confirmation ID & Payment Details
 * - Automatically emails Store Owner (anime.curio.studio@gmail.com) with the new order alert
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
    
    // Auto-create "Orders" tab with headers if it doesn't exist
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

    // 1. Append new order row to Google Sheet
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

    // 2. Automatically Dispatch Confirmation & Payment QR Email
    const storeEmail = 'anime.curio.studio@gmail.com';
    const storePhone = '8360048865';

    const emailSubject = "Payment QR & Order Confirmation: " + orderId + " - AnimeCurio";
    const emailHtmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #c2485b; margin: 0; font-size: 26px;">AnimeCurio</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Exclusive Merchandise & Figurines</p>
        </div>

        <div style="background-color: #fdf2f4; border-left: 4px solid #c2485b; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0; color: #9f1239;">Order Confirmed!</h3>
          <p style="margin: 0; font-size: 15px; color: #374151;">Hi <strong>${name}</strong>, your order has been received successfully.</p>
          <p style="margin: 6px 0 0 0; font-size: 14px; font-weight: bold; color: #c2485b;">Confirmation ID: ${orderId}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 12px 0; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Order Details</h4>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Customer:</strong> ${name}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>WhatsApp:</strong> ${whatsapp}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
          ${business ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Business:</strong> ${business}</p>` : ''}
          <p style="margin: 4px 0; font-size: 14px;"><strong>Shipping Address:</strong> ${notes}</p>
          <p style="margin: 12px 0 4px 0; font-size: 14px; font-weight: bold;"><strong>Items:</strong></p>
          <p style="margin: 4px 0; font-size: 14px; color: #4b5563; background: #fff; padding: 8px; border-radius: 6px; border: 1px solid #e5e7eb;">${orderItems}</p>
          <p style="margin: 12px 0 0 0; font-size: 16px; font-weight: bold; color: #c2485b;">Total Amount: ${orderTotal}</p>
        </div>

        <div style="text-align: center; background-color: #fff1f2; border: 1px dashed #f43f5e; padding: 20px; border-radius: 16px; margin-bottom: 20px;">
          <h3 style="color: #9f1239; margin: 0 0 8px 0;">💳 Complete Payment via UPI / Google Pay</h3>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #4b5563;">Scan the QR code in your app or send payment for <strong>${orderTotal}</strong> to store line:</p>
          <p style="margin: 4px 0; font-size: 15px; font-weight: bold; color: #111827;">WhatsApp Line: +91 ${storePhone}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #4b5563;">Store Support: ${storeEmail}</p>
        </div>

        <div style="text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
          <p style="margin: 0;">Thank you for shopping at AnimeCurio!</p>
        </div>
      </div>
    `;

    // Send email to Customer
    if (email) {
      try {
        MailApp.sendEmail({
          to: email,
          subject: emailSubject,
          htmlBody: emailHtmlBody
        });
      } catch (err1) {
        Logger.log("Customer email error: " + err1.message);
      }
    }

    // Send email alert to Store Owner (anime.curio.studio@gmail.com)
    try {
      MailApp.sendEmail({
        to: storeEmail,
        subject: "[NEW ORDER] " + orderId + " - " + name + " (" + orderTotal + ")",
        htmlBody: emailHtmlBody
      });
    } catch (err2) {
      Logger.log("Store owner alert error: " + err2.message);
    }

    return jsonResponse({
      success: true,
      orderId: orderId,
      message: 'Order recorded and emails dispatched successfully'
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
