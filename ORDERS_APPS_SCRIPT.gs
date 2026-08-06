/**
 * AnimeCurio – Google Sheets Orders & Automatic Email Dispatch
 * =============================================================
 * HOW TO DEPLOY / UPDATE:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this ENTIRE file (replace all existing content)
 * 3. Click Run → select "doPost" → Authorize Gmail permissions when prompted
 * 4. Click Deploy → Manage Deployments → Edit (✏️) → New Version → Deploy
 *
 * WHAT THIS DOES:
 * - Records every order into the "Orders" tab in Google Sheets
 * - Sends a premium branded confirmation email to the CUSTOMER with payment QR
 * - Sends a new order alert email to anime.curio.studio@gmail.com
 */

// ─── CONFIG ─────────────────────────────────────────────────────────────────
var STORE_EMAIL    = 'anime.curio.studio@gmail.com';
var STORE_PHONE    = '+91 83600 48865';
var STORE_NAME     = 'AnimeCurio';
var STORE_TAGLINE  = 'Exclusive Anime Merchandise & Figurines';
var STORE_WEBSITE  = 'https://animecurio.com';
// UPI QR code — hosted publicly so it embeds in email
// Replace this URL with your actual GPay/UPI QR image link
var PAYMENT_QR_URL = 'https://lh3.googleusercontent.com/d/1luAmR0pS7uCUQSJE1fN6kGXOyIQSpud0=s600';
var UPI_ID         = 'singhmandeep1722@oksbi';

// ─── TEST: Run this from the Apps Script editor to verify email works ─────────
// Select "testEmail" in the dropdown and click ▶ Run
function testEmail() {
  var testPayload = {
    orderId:    'ACK-TEST123',
    timestamp:  new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    name:       'Test Customer',
    whatsapp:   '+91 9999999999',
    email:      STORE_EMAIL,   // sends test to yourself first
    business:   '',
    city:       'Delhi',
    orderItems: '1. Naruto Figurine x 1 - ₹149; 2. Sasuke Keychain x 2 - ₹79',
    orderTotal: '₹307 (incl. ₹79 shipping)',
    notes:      '38B, Test Street, Delhi 110001',
    status:     'Payment Pending (QR Sent)'
  };
  var result = processOrder(testPayload);
  Logger.log('Test result: ' + JSON.stringify(result));
}

// ─── GET: Inventory ──────────────────────────────────────────────────────────
function doGet(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('anime inventory')
             || ss.getSheetByName('Inventory')
             || ss.getSheets()[0];
    var data  = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return jsonResponse({ products: [], error: 'No inventory data found' });
    }

    var headers  = data[0].map(function(h) { return String(h).trim(); });
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
    var sheet = ss.getSheetByName('Orders') || ss.getSheetByName('orders');

    if (!sheet) {
      sheet = ss.insertSheet('Orders');
      sheet.appendRow([
        'Order ID','Timestamp','Name','WhatsApp','Email',
        'Business','City','Order Items','Order Total','Shipping Address','Status'
      ]);
    }

    // Parse payload — handles both JSON body and URL params
    var payload = {};
    try {
      if (e && e.postData && e.postData.contents) {
        payload = JSON.parse(e.postData.contents);
      } else if (e && e.parameter) {
        payload = e.parameter;
      }
    } catch (parseErr) {
      Logger.log('Payload parse error: ' + parseErr.message);
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

    // 1. Record to Google Sheets
    sheet.appendRow([
      orderId, timestamp, name, whatsapp, email,
      business, city, orderItems, orderTotal, address, status
    ]);

    // 2. Build item rows HTML
    var itemRowsHtml = '';
    var itemLines = orderItems.split(';');
    itemLines.forEach(function(line) {
      var trimmed = line.trim();
      if (trimmed) {
        itemRowsHtml += '<tr>'
          + '<td style="padding:10px 12px;border-bottom:1px solid #f3e8ea;font-size:13px;color:#374151;">' + trimmed + '</td>'
          + '</tr>';
      }
    });

    // 3. Premium Branded Email to Customer
    var customerSubject = '✅ Order Confirmed — ' + orderId + ' | ' + STORE_NAME;
    var customerHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">'

      // Header
      + '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:24px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">'
      + '<tr><td style="background:linear-gradient(135deg,#6b0f1a 0%,#a31a1a 100%);padding:32px 24px;text-align:center;">'
      + '<h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px;font-weight:900;">' + STORE_NAME + '</h1>'
      + '<p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:2px;">' + STORE_TAGLINE + '</p>'
      + '</td></tr>'

      // Order Reference Banner
      + '<tr><td style="padding:28px 24px 0;text-align:center;">'
      + '<p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;">Your Order Reference</p>'
      + '<p style="margin:8px 0 0;font-size:26px;font-weight:900;color:#a31a1a;letter-spacing:2px;">' + orderId + '</p>'
      + '</td></tr>'

      // Greeting
      + '<tr><td style="padding:24px 28px;">'
      + '<p style="margin:0;font-size:15px;color:#111827;">Dear <strong>' + name + '</strong>,</p>'
      + '<p style="margin:10px 0 0;font-size:14px;color:#4b5563;line-height:1.6;">Thank you for shopping at <strong>' + STORE_NAME + '</strong>! 🎉 Your order has been received successfully. Our team will confirm the details on <strong>WhatsApp</strong> shortly.</p>'
      + '</td></tr>'

      // Customer Details Box
      + '<tr><td style="padding:0 28px 24px;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f4;border-radius:12px;overflow:hidden;">'
      + '<tr><td colspan="2" style="padding:12px 16px;background:#f5d0d7;">'
      + '<p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9f1239;">Customer Details</p>'
      + '</td></tr>'
      + '<tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;width:40%;border-bottom:1px solid #fce7eb;">WhatsApp / Phone</td>'
      + '<td style="padding:10px 16px;font-size:13px;font-weight:700;color:#111827;border-bottom:1px solid #fce7eb;">' + whatsapp + '</td></tr>'
      + (business ? '<tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #fce7eb;">Business / Shop</td><td style="padding:10px 16px;font-size:13px;font-weight:700;color:#111827;border-bottom:1px solid #fce7eb;">' + business + '</td></tr>' : '')
      + '<tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #fce7eb;">Delivery City</td>'
      + '<td style="padding:10px 16px;font-size:13px;font-weight:700;color:#111827;border-bottom:1px solid #fce7eb;">' + city + '</td></tr>'
      + '<tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;">Order Time</td>'
      + '<td style="padding:10px 16px;font-size:13px;font-weight:700;color:#111827;">' + timestamp + '</td></tr>'
      + '</table>'
      + '</td></tr>'

      // Order Summary
      + '<tr><td style="padding:0 28px 24px;">'
      + '<p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111827;">Order Summary</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3e8ea;border-radius:10px;overflow:hidden;">'
      + itemRowsHtml
      + '<tr style="background:#fdf2f4;"><td style="padding:12px 16px;font-size:15px;font-weight:900;color:#a31a1a;">Total: ' + orderTotal + '</td></tr>'
      + '</table>'
      + '</td></tr>'

      // Shipping Address
      + (address ? '<tr><td style="padding:0 28px 24px;"><p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#374151;">📦 Shipping Address</p><p style="margin:0;font-size:13px;color:#4b5563;background:#f9fafb;padding:10px 14px;border-radius:8px;border:1px solid #e5e7eb;">' + address + '</p></td></tr>' : '')

      // Payment QR Section
      + '<tr><td style="padding:0 28px 28px;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff1f2;border:1.5px dashed #f43f5e;border-radius:14px;overflow:hidden;">'
      + '<tr><td style="padding:20px;text-align:center;">'
      + '<p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#9f1239;">💳 Complete Your Payment</p>'
      + '<p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Scan the QR code below using Google Pay, PhonePe, or any UPI app</p>'
      + '<img src="' + PAYMENT_QR_URL + '" alt="Payment QR Code" width="180" height="180" style="border-radius:12px;border:3px solid #fff;box-shadow:0 4px 16px rgba(163,26,26,0.15);">'
      + '<p style="margin:14px 0 4px;font-size:13px;color:#4b5563;">Or pay directly via UPI ID:</p>'
      + '<p style="margin:0 0 12px;font-size:15px;font-weight:900;color:#a31a1a;background:#fff;padding:8px 20px;border-radius:8px;display:inline-block;border:1px solid #fecdd3;">' + UPI_ID + '</p>'
      + '<p style="margin:8px 0 4px;font-size:13px;color:#4b5563;">Need help? Contact us:</p>'
      + '<p style="margin:0;font-size:14px;font-weight:700;color:#111827;">📞 ' + STORE_PHONE + '</p>'
      + '<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">📧 ' + STORE_EMAIL + '</p>'
      + '</td></tr>'
      + '</table>'
      + '</td></tr>'

      // Footer
      + '<tr><td style="background:#fafafa;padding:20px 28px;text-align:center;border-top:1px solid #f3f4f6;">'
      + '<p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#a31a1a;">' + STORE_NAME + '</p>'
      + '<p style="margin:0;font-size:12px;color:#9ca3af;">Thank you for your order! 🌸 Your anime merch is on its way to you.</p>'
      + '<p style="margin:8px 0 0;font-size:11px;color:#d1d5db;">© ' + new Date().getFullYear() + ' ' + STORE_NAME + ' — <a href="' + STORE_WEBSITE + '" style="color:#a31a1a;text-decoration:none;">' + STORE_WEBSITE + '</a></p>'
      + '</td></tr>'

      + '</table>'
      + '</body></html>';

    // 4. Owner Alert Email (plain but informative)
    var ownerSubject = '[NEW ORDER] ' + orderId + ' — ' + name + ' | ' + orderTotal;
    var ownerHtml = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:500px;margin:20px auto;padding:20px;border:2px solid #a31a1a;border-radius:12px;">'
      + '<h2 style="color:#a31a1a;margin:0 0 16px;">🛒 New AnimeCurio Order</h2>'
      + '<table width="100%" style="border-collapse:collapse;">'
      + '<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;width:35%;">Order ID</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#111827;">' + orderId + '</td></tr>'
      + '<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">Customer</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#111827;">' + name + '</td></tr>'
      + '<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">Email</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#111827;">' + email + '</td></tr>'
      + '<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">WhatsApp</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#111827;">' + whatsapp + '</td></tr>'
      + '<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">City</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#111827;">' + city + '</td></tr>'
      + '<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">Address</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#111827;">' + address + '</td></tr>'
      + '<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">Items</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#111827;">' + orderItems.replace(/;/g,'<br>') + '</td></tr>'
      + '<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">Total</td><td style="padding:6px 0;font-size:16px;font-weight:900;color:#a31a1a;">' + orderTotal + '</td></tr>'
      + '<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">Status</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#111827;">' + status + '</td></tr>'
      + '</table>'
      + '<p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Recorded at: ' + timestamp + '</p>'
      + '</body></html>';

    // 5. Send Emails
    if (email) {
      try {
        MailApp.sendEmail({ to: email, subject: customerSubject, htmlBody: customerHtml, name: STORE_NAME });
        Logger.log('Customer email sent to: ' + email);
      } catch (err1) {
        Logger.log('Customer email error: ' + err1.message);
      }
    }

    try {
      MailApp.sendEmail({ to: STORE_EMAIL, subject: ownerSubject, htmlBody: ownerHtml, name: STORE_NAME });
      Logger.log('Owner alert sent to: ' + STORE_EMAIL);
    } catch (err2) {
      Logger.log('Owner email error: ' + err2.message);
    }

    return jsonResponse({ success: true, orderId: orderId, message: 'Order recorded and emails dispatched' });

  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────
function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
