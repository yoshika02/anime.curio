/*
  Cloudflare Pages Function: /api/users
  Handles: POST (register/login), GET (fetch user by email)
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
    const { action } = body;

    if (action === 'register') {
      const { id, name, email, phone, password, address, city, state, pincode } = body;

      // Check if email already exists
      const existing = await env.DB.prepare(
        'SELECT id, email FROM users WHERE email = ?'
      ).bind(email.toLowerCase()).first();

      if (existing) {
        return new Response(JSON.stringify({ success: false, error: 'Email already registered' }), { headers: corsHeaders });
      }

      // Insert new user
      await env.DB.prepare(
        `INSERT INTO users (id, name, email, phone, password, address, city, state, pincode, country)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'India')`
      ).bind(id, name, email.toLowerCase(), phone || '', password, address || '', city || '', state || '', pincode || '').run();

      const newUser = { id, name, email: email.toLowerCase(), phone, address, city, state, pincode };
      return new Response(JSON.stringify({ success: true, user: newUser }), { headers: corsHeaders });
    }

    if (action === 'login') {
      const { email, password } = body;
      const user = await env.DB.prepare(
        'SELECT id, name, email, phone, address, city, state, pincode FROM users WHERE email = ? AND password = ?'
      ).bind(email.toLowerCase(), password).first();

      if (!user) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid email or password' }), { headers: corsHeaders });
      }
      return new Response(JSON.stringify({ success: true, user }), { headers: corsHeaders });
    }

    if (action === 'update') {
      const { email, name, phone, address, city, state, pincode } = body;
      await env.DB.prepare(
        `UPDATE users SET name=?, phone=?, address=?, city=?, state=?, pincode=? WHERE email=?`
      ).bind(name || '', phone || '', address || '', city || '', state || '', pincode || '', email.toLowerCase()).run();

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (action === 'forgot') {
      const { email } = body;
      const user = await env.DB.prepare('SELECT id, name, email FROM users WHERE email = ?').bind(email.toLowerCase()).first();
      if (!user) {
        return new Response(JSON.stringify({ success: false, error: 'No account found with this email' }), { headers: corsHeaders });
      }
      // In production, you'd send a reset email here
      return new Response(JSON.stringify({ success: true, message: 'If this email exists, a reset link has been sent.' }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), { headers: corsHeaders });

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
    if (!email) return new Response(JSON.stringify({ success: false, error: 'email param required' }), { headers: corsHeaders });

    const user = await env.DB.prepare(
      'SELECT id, name, email, phone, address, city, state, pincode FROM users WHERE email = ?'
    ).bind(email.toLowerCase()).first();

    if (!user) return new Response(JSON.stringify({ success: false, error: 'User not found' }), { headers: corsHeaders });
    return new Response(JSON.stringify({ success: true, user }), { headers: corsHeaders });

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
