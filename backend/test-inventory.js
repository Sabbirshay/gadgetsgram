const http = require('http');

const request = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          let parsed = data ? JSON.parse(data) : null;
          if (parsed && parsed.data) parsed = parsed.data;
          resolve({ status: res.statusCode, data: parsed });
        } catch(e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

async function runTest() {
  console.log("--- Starting Inventory Test Trial ---");
  
  // 1. Check Initial Inventory for product 1
  console.log("Fetching initial inventory...");
  let res = await request({ host: 'localhost', port: 3000, path: '/api/v1/inventory/summary', method: 'GET' });
  const p1_before = res.data.find(p => p.id === 1);
  console.log(`Product 1 Before -> Available: ${p1_before.available}, Reserved: ${p1_before.reserved}`);

  // 2. Create Order
  console.log("Creating new order for 2 units of Product 1...");
  res = await request({ 
    host: 'localhost', port: 3000, path: '/api/v1/orders', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    customer_name: "Test QA User",
    phone: "01700000000",
    address: "QA Address",
    district: "Dhaka",
    product_id: 1,
    quantity: 2
  });
  
  if (res.status !== 201) {
    console.error("Failed to create order:", res.data);
    return;
  }
  
  const orderId = res.data.id;
  console.log(`Order created with ID: ${orderId}`);

  // 3. Check Inventory after Order
  console.log("Fetching inventory after order...");
  res = await request({ host: 'localhost', port: 3000, path: '/api/v1/inventory/summary', method: 'GET' });
  const p1_after = res.data.find(p => p.id === 1);
  console.log(`Product 1 After Order -> Available: ${p1_after.available}, Reserved: ${p1_after.reserved}`);

  // 4. Login as Admin
  console.log("Logging in as Admin...");
  res = await request({
    host: 'localhost', port: 3000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@gadgetsgram.com', password: 'Admin@123456' });
  
  if (res.status !== 200 && res.status !== 201) {
    console.error("Failed to login:", res.data);
    return;
  }
  
  const token = res.data.accessToken;
  
  // 5. Cancel Order
  console.log("Cancelling the order...");
  res = await request({
    host: 'localhost', port: 3000, path: `/api/v1/orders/${orderId}/status`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, { status: 'cancelled' });

  if (res.status !== 200) {
    console.error("Failed to cancel order:", res.data);
  } else {
    console.log("Order cancelled successfully:", res.data);
  }

  // 6. Check Inventory after Cancellation
  console.log("Fetching inventory after cancellation...");
  res = await request({ host: 'localhost', port: 3000, path: '/api/v1/inventory/summary', method: 'GET' });
  const p1_final = res.data.find(p => p.id === 1);
  console.log(`Product 1 Final -> Available: ${p1_final.available}, Reserved: ${p1_final.reserved}`);

  if (p1_before.available === p1_final.available && p1_before.reserved === p1_final.reserved) {
    console.log("✅ TEST PASSED: Stock correctly reserved and released!");
  } else {
    console.error("❌ TEST FAILED: Stock mismatch.");
  }
}

runTest().catch(console.error);
