/**
 * AnimeCurio – Google Sheets Orders & Automatic Email Dispatch
 * =============================================================
 * SHEET NAME: "order sheet anime curio"
 * DEPLOYED ON: anime.curio.studio@gmail.com
 *
 * HOW TO UPDATE:
 * 1. Open Google Sheet → Extensions → Apps Script
 * 2. Replace ALL content with this file
 * 3. Run "testEmail" function first to authorize Gmail
 * 4. Deploy → Manage Deployments → Edit → New Version → Deploy
 */

// ─── CONFIG ─────────────────────────────────────────────────────────────────
var STORE_EMAIL    = 'anime.curio.studio@gmail.com';
var STORE_PHONE    = '+91 83600 48865';
var STORE_NAME     = 'AnimeCurio';
var STORE_TAGLINE  = 'Exclusive Anime Merchandise & Figurines';
var STORE_WEBSITE  = 'https://animecurio.com';
var PAYMENT_QR_URL = 'https://lh3.googleusercontent.com/d/1luAmR0pS7uCUQSJE1fN6kGXOyIQSpud0=s600';
var UPI_ID         = 'singhmandeep1722@oksbi';
var ORDER_SHEET_NAME = 'order sheet anime curio';  // ← your exact sheet tab name

// ─── TEST: Select "testEmail" in dropdown → click ▶ Run to authorize Gmail ───
function testEmail() {
  Logger.log('Starting test email...');
  try {
    var subject = '✅ AnimeCurio Test – Email Working!';
    var body = '<div style="font-family:Arial,sans-serif;padding:20px;max-width:500px;">'
      + '<h2 style="color:#a31a1a;">AnimeCurio Email Test</h2>'
      + '<p>✅ Your Google Apps Script is correctly authorized and sending emails!</p>'
      + '<p>Orders placed on animecurio.com will now automatically send confirmation emails to customers.</p>'
      + '<p style="color:#6b7280;font-size:12px;">Sent at: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + '</p>'
      + '</div>';
    MailApp.sendEmail({ to: STORE_EMAIL, subject: subject, htmlBody: body, name: STORE_NAME });
    Logger.log('✅ Test email sent to ' + STORE_EMAIL);
  } catch (err) {
    Logger.log('❌ Email error: ' + err.message);
  }

  // Also test sheet writing
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(ORDER_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(ORDER_SHEET_NAME);
      sheet.appendRow(['Order ID','Timestamp','Name','WhatsApp','Email','Business','City','Order Items','Order Total','Shipping Address','Status']);
      Logger.log('Created new sheet: ' + ORDER_SHEET_NAME);
    }
    sheet.appendRow(['TEST-001', new Date().toLocaleString('en-IN'), 'Test Customer', '+91 9999999999', STORE_EMAIL, '', 'Delhi', 'Test Item x1 - ₹149', '₹228 (incl. ₹79 shipping)', 'Test Address, Delhi 110001', 'Test Entry']);
    Logger.log('✅ Test row written to sheet: ' + ORDER_SHEET_NAME);
  } catch (sheetErr) {
    Logger.log('❌ Sheet write error: ' + sheetErr.message);
  }
}

// ─── GET: Serve Inventory Data ────────────────────────────────────────────────
function doGet(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    // Look for inventory sheet — NOT the orders sheet
    var sheet = ss.getSheetByName('anime inventory')
             || ss.getSheetByName('Inventory')
             || ss.getSheetByName('Sheet1')
             || ss.getSheets()[0];

    // If the first sheet is the orders sheet, try to find actual inventory
    if (sheet && sheet.getName() === ORDER_SHEET_NAME) {
      var allSheets = ss.getSheets();
      for (var s = 0; s < allSheets.length; s++) {
        if (allSheets[s].getName() !== ORDER_SHEET_NAME) {
          sheet = allSheets[s];
          break;
        }
      }
    }

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return jsonResponse({ products: [], error: 'No inventory data found in sheet: ' + sheet.getName() });
    }

    var headers = data[0].map(function(h) { return String(h).trim(); });
    var numericFields = ['id','price','actualPrice','originalPrice','mrp','MRP','rating','reviews','stock','category_id','categoryId'];
    var products = data
      .slice(1)
      .filter(function(row) { return row[0] !== '' && row[0] !== null && row[0] !== undefined; })
      .map(function(row) {
        var obj = {};
        headers.forEach(function(header, i) {
          var val = row[i];
          if (numericFields.indexOf(header) !== -1) {
            obj[header] = Number(val) || 0;
          } else {
            obj[header] = String(val === null || val === undefined ? '' : val).trim();
          }
        });
        return obj;
      });

    return jsonResponse({ products: products, total: products.length, updatedAt: new Date().toISOString() });
  } catch (err) {
    return jsonResponse({ products: [], error: err.message });
  }
}

// ─── POST: Record Order + Send Emails ────────────────────────────────────────
function doPost(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(ORDER_SHEET_NAME);

    // Create the orders sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(ORDER_SHEET_NAME);
      sheet.appendRow([
        'Order ID','Timestamp','Name','WhatsApp','Email',
        'Business','City','Order Items','Order Total','Shipping Address','Status'
      ]);
      Logger.log('Created orders sheet: ' + ORDER_SHEET_NAME);
    }

    // Parse payload
    var payload = {};
    try {
      if (e && e.postData && e.postData.contents) {
        payload = JSON.parse(e.postData.contents);
        Logger.log('Payload parsed: ' + e.postData.contents.substring(0, 200));
      } else if (e && e.parameter) {
        payload = e.parameter;
        Logger.log('Using URL params: ' + JSON.stringify(e.parameter));
      } else {
        Logger.log('No payload received');
      }
    } catch (parseErr) {
      Logger.log('Parse error: ' + parseErr.message + ' | Raw: ' + (e && e.postData ? e.postData.contents : 'empty'));
    }

    var orderId    = payload.orderId    || ('ACK-' + Math.floor(100000 + Math.random() * 900000));
    var timestamp  = payload.timestamp  || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    var name       = payload.name       || 'Valued Customer';
    var whatsapp   = payload.whatsapp   || payload.phone || '';
    var email      = payload.email      || '';
    var business   = payload.business   || payload.company || '';
    var city       = payload.city       || '';
    var orderItems = payload.orderItems || payload.itemsSummary || '';
    var orderTotal = payload.orderTotal || payload.total || '';
    var address    = payload.notes      || payload.address || '';
    var status     = payload.status     || 'Payment Pending (QR Sent)';

    Logger.log('Recording order: ' + orderId + ' | customer: ' + name + ' | email: ' + email);

    // 1. Write to Google Sheet
    sheet.appendRow([
      orderId, timestamp, name, whatsapp, email,
      business, city, orderItems, orderTotal, address, status
    ]);
    Logger.log('Row written to sheet successfully');

    // 2. Build item rows for email
    var itemRowsHtml = '';
    var itemLines = (orderItems || '').split(';');
    itemLines.forEach(function(line) {
      var trimmed = line.trim();
      if (trimmed) {
        itemRowsHtml += '<tr><td style="padding:10px 12px;border-bottom:1px solid #f3e8ea;font-size:13px;color:#374151;">' + trimmed + '</td></tr>';
      }
    });

    // 3. Customer confirmation email
    var customerSubject = '✅ Order Confirmed — ' + orderId + ' | AnimeCurio';
    var customerHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">'
      + '<tr><td style="background:linear-gradient(135deg,#6b0f1a 0%,#a31a1a 100%);padding:32px 24px;text-align:center;">'
      + '<h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;">AnimeCurio</h1>'
      + '<p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Exclusive Anime Merchandise &amp; Figurines</p>'
      + '</td></tr>'
      + '<tr><td style="padding:28px 24px 0;text-align:center;">'
      + '<p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;">Your Order Reference</p>'
      + '<p style="margin:8px 0 0;font-size:26px;font-weight:900;color:#a31a1a;letter-spacing:2px;">' + orderId + '</p>'
      + '</td></tr>'
      + '<tr><td style="padding:24px 28px;">'
      + '<p style="margin:0;font-size:15px;color:#111827;">Dear <strong>' + name + '</strong>,</p>'
      + '<p style="margin:10px 0 0;font-size:14px;color:#4b5563;line-height:1.6;">Thank you for shopping at <strong>AnimeCurio</strong>! 🎉 Your order has been received. We will contact you on WhatsApp with payment details shortly.</p>'
      + '</td></tr>'
      + '<tr><td style="padding:0 28px 24px;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f4;border-radius:12px;overflow:hidden;">'
      + '<tr><td colspan="2" style="padding:12px 16px;background:#f5d0d7;"><p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9f1239;">Customer Details</p></td></tr>'
      + '<tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #fce7eb;">WhatsApp</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#111827;border-bottom:1px solid #fce7eb;">' + whatsapp + '</td></tr>'
      + '<tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #fce7eb;">City</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#111827;border-bottom:1px solid #fce7eb;">' + city + '</td></tr>'
      + '<tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;">Order Time</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#111827;">' + timestamp + '</td></tr>'
      + '</table></td></tr>'
      + '<tr><td style="padding:0 28px 24px;">'
      + '<p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111827;">Order Summary</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3e8ea;border-radius:10px;overflow:hidden;">'
      + itemRowsHtml
      + '<tr style="background:#fdf2f4;"><td style="padding:12px 16px;font-size:15px;font-weight:900;color:#a31a1a;">Total: ' + orderTotal + '</td></tr>'
      + '</table></td></tr>'
      + (address ? '<tr><td style="padding:0 28px 24px;"><p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#374151;">📦 Shipping Address</p><p style="margin:0;font-size:13px;color:#4b5563;background:#f9fafb;padding:10px 14px;border-radius:8px;border:1px solid #e5e7eb;">' + address + '</p></td></tr>' : '')
      + '<tr><td style="padding:0 28px 28px;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff1f2;border:1.5px dashed #f43f5e;border-radius:14px;">'
      + '<tr><td style="padding:20px;text-align:center;">'
      + '<p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#9f1239;">💳 Complete Your Payment</p>'
      + '<p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Scan QR below using Google Pay, PhonePe, or any UPI app</p>'
      + '<img src="' + PAYMENT_QR_URL + '" alt="Payment QR" width="180" height="180" style="border-radius:12px;border:3px solid #fff;box-shadow:0 4px 16px rgba(163,26,26,0.15);">'
      + '<p style="margin:14px 0 4px;font-size:13px;color:#4b5563;">Or pay directly via UPI ID:</p>'
      + '<p style="margin:0 0 12px;font-size:15px;font-weight:900;color:#a31a1a;background:#fff;padding:8px 20px;border-radius:8px;display:inline-block;border:1px solid #fecdd3;">' + UPI_ID + '</p>'
      + '<p style="margin:8px 0 0;font-size:14px;font-weight:700;color:#111827;">📞 ' + STORE_PHONE + '</p>'
      + '<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">📧 ' + STORE_EMAIL + '</p>'
      + '</td></tr></table></td></tr>'
      + '<tr><td style="background:#fafafa;padding:20px 28px;text-align:center;border-top:1px solid #f3f4f6;">'
      + '<p style="margin:0;font-size:12px;color:#9ca3af;">Thank you for shopping at AnimeCurio! 🌸</p>'
      + '</td></tr></table></body></html>';

    // 4. Owner alert
    var ownerSubject = '[NEW ORDER] ' + orderId + ' — ' + name + ' | ' + orderTotal;
    var ownerHtml = '<div style="font-family:Arial,sans-serif;max-width:500px;padding:20px;border:2px solid #a31a1a;border-radius:12px;">'
      + '<h2 style="color:#a31a1a;">🛒 New Order — AnimeCurio</h2>'
      + '<table><tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Order ID</td><td style="font-weight:700;">' + orderId + '</td></tr>'
      + '<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Customer</td><td style="font-weight:700;">' + name + '</td></tr>'
      + '<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Email</td><td style="font-weight:700;">' + email + '</td></tr>'
      + '<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">WhatsApp</td><td style="font-weight:700;">' + whatsapp + '</td></tr>'
      + '<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">City</td><td style="font-weight:700;">' + city + '</td></tr>'
      + '<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Items</td><td style="font-weight:700;">' + orderItems + '</td></tr>'
      + '<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Total</td><td style="font-size:16px;font-weight:900;color:#a31a1a;">' + orderTotal + '</td></tr>'
      + '<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Address</td><td style="font-weight:700;">' + address + '</td></tr>'
      + '</table></div>';

    // 5. Send emails
    if (email) {
      try {
        MailApp.sendEmail({ to: email, subject: customerSubject, htmlBody: customerHtml, name: STORE_NAME });
        Logger.log('Customer email sent to: ' + email);
      } catch (err1) {
        Logger.log('Customer email FAILED: ' + err1.message);
      }
    } else {
      Logger.log('No customer email address provided — skipping customer email');
    }

    try {
      MailApp.sendEmail({ to: STORE_EMAIL, subject: ownerSubject, htmlBody: ownerHtml, name: STORE_NAME });
      Logger.log('Owner alert sent to: ' + STORE_EMAIL);
    } catch (err2) {
      Logger.log('Owner email FAILED: ' + err2.message);
    }

    return jsonResponse({ success: true, orderId: orderId, message: 'Order recorded and emails dispatched' });

  } catch (err) {
    Logger.log('doPost CRITICAL error: ' + err.message + '\n' + err.stack);
    return jsonResponse({ success: false, error: err.message });
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
