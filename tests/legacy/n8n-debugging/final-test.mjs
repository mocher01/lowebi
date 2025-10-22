/**
 * Final test of the credential
 */

async function finalTest() {
  try {
    // Test the webhook directly with the token
    console.log('🧪 Testing webhook with correct token...');
    
    const webhookResponse = await fetch('https://automation.locod-ai.fr/webhook/final-test-contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': 'secure-webhook-token-2025-1753817922809'
      },
      body: JSON.stringify({
        name: 'Final Test',
        email: 'test@example.com', 
        message: 'Testing credential'
      })
    });
    
    console.log('📊 Status:', webhookResponse.status);
    const text = await webhookResponse.text();
    console.log('📝 Response:', text);
    
    if (webhookResponse.status === 200) {
      console.log('🎉 SUCCESS! The two-step credential creation worked!');
    } else if (text.includes('Authorization data is wrong')) {
      console.log('❌ FAILED: Still getting authorization error');
      
      // Let's also test the working webhook for comparison
      console.log('\n🔍 Comparing with working Qalyarab webhook...');
      const workingResponse = await fetch('https://automation.locod-ai.fr/webhook/563f80d8-bea9-4691-af7c-4234abb78326', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          message: 'Test'
        })
      });
      
      console.log('📊 Working webhook status:', workingResponse.status);
      const workingText = await workingResponse.text();
      console.log('📝 Working webhook response:', workingText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

finalTest();