/*
  Cloudflare Pages Function: /api/orders
  Handles: POST (create order), GET (fetch orders by email)
  Bound D1 database: DB
*/

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json();
    const {
      orderId, customerName, customerEmail, customerPhone,
      address, city, state, pincode, totalAmount, itemsJson, paymentStatus
    } = body;

    if (!orderId || !customerEmail) {
      return new Response(JSON.stringify({ success: false, error: 'orderId and customerEmail are required' }), { headers: corsHeaders });
    }

    // Get user_id from users table if exists
    const userRow = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(customerEmail.toLowerCase()).first();
    const userId = userRow ? userRow.id : null;

    await env.DB.prepare(
      `INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, address, city, state, pincode, country, total_amount, payment_status, items_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'India', ?, ?, ?)`
    ).bind(
      orderId,
      userId,
      customerName || '',
      customerEmail.toLowerCase(),
      customerPhone || '',
      address || '',
      city || '',
      state || '',
      pincode || '',
      parseFloat(totalAmount) || 0,
      paymentStatus || 'Payment Pending (QR Sent)',
      typeof itemsJson === 'string' ? itemsJson : JSON.stringify(itemsJson || [])
    ).run();

    return new Response(JSON.stringify({ success: true, orderId }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return new Response(JSON.stringify({ success: false, error: 'email param required' }), { headers: corsHeaders });
    }

    const result = await env.DB.prepare(
      'SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC'
    ).bind(email.toLowerCase()).all();

    const orders = (result.results || []).map(row => ({
      id: row.id,
      date: new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      address: row.address,
      city: row.city,
      state: row.state,
      pincode: row.pincode,
      total: row.total_amount,
      status: row.payment_status,
      items: (() => { try { return JSON.parse(row.items_json); } catch(e) { return []; } })(),
    }));

    return new Response(JSON.stringify({ success: true, orders }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
