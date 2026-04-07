export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, amount, plan } = req.body;

  if (!name || !phone || !email || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const orderId = 'DD_' + plan.toUpperCase() + '_' + Date.now();

  try {
    const response = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CF_APP_ID,
        'x-client-secret': process.env.CF_SECRET_KEY
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: 'CUST_' + Date.now(),
          customer_name: name,
          customer_phone: phone,
          customer_email: email
        },
        order_meta: {
          return_url: 'https://doctordhundo.in/thank-you.html?order_id={order_id}&plan=' + plan
        },
        order_note: 'DoctorDhundo ' + plan + ' membership'
      })
    });

    const data = await response.json();

    if (data.payment_session_id) {
      return res.status(200).json({
        payment_session_id: data.payment_session_id,
        order_id: orderId
      });
    } else {
      return res.status(400).json({ error: 'Could not create order', details: data });
    }

  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}
