import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { formId, amount, firstName, lastName, email, paymentMethodId } = body;

    // Validate required fields
    if (!formId || !amount || !firstName || !lastName || !email || !paymentMethodId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get environment variables
    const GIVEWP_URL = import.meta.env.GIVEWP_URL;
    const GIVEWP_API_KEY = import.meta.env.GIVEWP_API_KEY;
    const GIVEWP_API_TOKEN = import.meta.env.GIVEWP_API_TOKEN;

    if (!GIVEWP_URL || !GIVEWP_API_KEY || !GIVEWP_API_TOKEN) {
      console.error('Missing GiveWP environment variables');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Server configuration error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare the donation payload for GiveWP
    const donationPayload = {
      form_id: formId,
      amount: amount,
      donor: {
        first_name: firstName,
        last_name: lastName,
        email: email
      },
      payment: {
        gateway: 'stripe',
        method: 'card',
        stripe_payment_method_id: paymentMethodId
      }
    };

    // Make request to GiveWP API
    const giveWPResponse = await fetch(`${GIVEWP_URL}/wp-json/give-api/v2/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GIVEWP_API_TOKEN}`,
        'X-WP-Nonce': GIVEWP_API_KEY
      },
      body: JSON.stringify(donationPayload)
    });

    if (!giveWPResponse.ok) {
      const errorText = await giveWPResponse.text();
      console.error('GiveWP API Error:', errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Payment processing failed' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const giveWPResult = await giveWPResponse.json();

    return new Response(JSON.stringify({ 
      success: true, 
      donation: giveWPResult 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Donation submission error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};