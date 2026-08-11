export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle Preflight Requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ─── API ROUTES ─────────────────────────────────────────────────────────
    if (url.pathname.startsWith('/api/')) {
      try {
        // --- USERS API ---
        if (url.pathname === '/api/users') {
          if (request.method === 'POST') {
            const body = await request.json();
            const { action } = body;

            if (action === 'register') {
              const { id, name, email, phone, password, address, city, state, pincode } = body;
              const existing = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?').bind(email.toLowerCase()).first();
              if (existing) return new Response(JSON.stringify({ success: false, error: 'Email already registered' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

              await env.DB.prepare(`INSERT INTO users (id, name, email, phone, password, address, city, state, pincode, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'India')`)
                .bind(id, name, email.toLowerCase(), phone || '', password, address || '', city || '', state || '', pincode || '').run();
              
              const newUser = { id, name, email: email.toLowerCase(), phone, address, city, state, pincode };
              return new Response(JSON.stringify({ success: true, user: newUser }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            if (action === 'login') {
              const { email, password } = body;
              const user = await env.DB.prepare('SELECT id, name, email, phone, address, city, state, pincode FROM users WHERE email = ? AND password = ?')
                .bind(email.toLowerCase(), password).first();
              if (!user) return new Response(JSON.stringify({ success: false, error: 'Invalid email or password' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              return new Response(JSON.stringify({ success: true, user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            if (action === 'update') {
              const { email, name, phone, address, city, state, pincode } = body;
              await env.DB.prepare(`UPDATE users SET name=?, phone=?, address=?, city=?, state=?, pincode=? WHERE email=?`)
                .bind(name || '', phone || '', address || '', city || '', state || '', pincode || '', email.toLowerCase()).run();
              return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            if (action === 'forgot') {
              const { email } = body;
              const user = await env.DB.prepare('SELECT id, name, email FROM users WHERE email = ?').bind(email.toLowerCase()).first();
              if (!user) return new Response(JSON.stringify({ success: false, error: 'No account found with this email' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
              return new Response(JSON.stringify({ success: true, message: 'If this email exists, a reset link has been sent.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          }

          if (request.method === 'GET') {
            const email = url.searchParams.get('email');
            if (!email) return new Response(JSON.stringify({ success: false, error: 'email param required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            const user = await env.DB.prepare('SELECT id, name, email, phone, address, city, state, pincode FROM users WHERE email = ?').bind(email.toLowerCase()).first();
            if (!user) return new Response(JSON.stringify({ success: false, error: 'User not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            return new Response(JSON.stringify({ success: true, user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        // --- ORDERS API ---
        if (url.pathname === '/api/orders') {
          if (request.method === 'POST') {
            const body = await request.json();
            const { orderId, customerName, customerEmail, customerPhone, shippingAddress, totalAmount, itemsJson, paymentStatus } = body;
            if (!orderId || !customerEmail) return new Response(JSON.stringify({ success: false, error: 'orderId and customerEmail required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

            const userRow = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(customerEmail.toLowerCase()).first();
            const userId = userRow ? userRow.id : null;

            await env.DB.prepare(`INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_status, items_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
              .bind(orderId, userId, customerName || '', customerEmail.toLowerCase(), customerPhone || '', shippingAddress || '', parseFloat(totalAmount) || 0, paymentStatus || 'Payment Pending', typeof itemsJson === 'string' ? itemsJson : JSON.stringify(itemsJson || [])).run();
            
            return new Response(JSON.stringify({ success: true, orderId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          if (request.method === 'GET') {
            const email = url.searchParams.get('email');
            if (!email) return new Response(JSON.stringify({ success: false, error: 'email param required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

            const result = await env.DB.prepare('SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC').bind(email.toLowerCase()).all();
            const orders = (result.results || []).map(row => ({
              id: row.id,
              date: new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              name: row.customer_name,
              email: row.customer_email,
              phone: row.customer_phone,
              address: row.shipping_address,
              total: row.total_amount,
              status: row.payment_status,
              items: (() => { try { return JSON.parse(row.items_json); } catch(e) { return []; } })(),
            }));
            return new Response(JSON.stringify({ success: true, orders }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        // --- REVIEWS API ---
        if (url.pathname === '/api/reviews') {
          if (request.method === 'POST') {
            const body = await request.json();
            const { productId, userId, userName, rating, comment } = body;
            
            if (!productId || !userId || !rating || !comment) {
              return new Response(JSON.stringify({ success: false, error: 'Missing required review fields' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const reviewId = 'REV-' + Date.now();
            await env.DB.prepare(`INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?, ?)`)
              .bind(reviewId, String(productId), userId, userName || 'Anonymous User', parseInt(rating), comment).run();
            
            return new Response(JSON.stringify({ success: true, reviewId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          if (request.method === 'GET') {
            const productId = url.searchParams.get('productId');
            if (!productId) return new Response(JSON.stringify({ success: false, error: 'productId param required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

            const result = await env.DB.prepare('SELECT id, user_name, rating, comment, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC').bind(String(productId)).all();
            
            const reviews = (result.results || []).map(row => ({
              id: row.id,
              userName: row.user_name,
              rating: row.rating,
              comment: row.comment,
              date: new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            }));
            
            return new Response(JSON.stringify({ success: true, reviews }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        return new Response(JSON.stringify({ success: false, error: 'Endpoint not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ─── STATIC ASSETS ──────────────────────────────────────────────────────
    // Cloudflare handles serving from the [assets] directory automatically
    // The request will fall through to the assets binding if not caught by the API logic above
    return env.ASSETS.fetch(request);
  }
};
