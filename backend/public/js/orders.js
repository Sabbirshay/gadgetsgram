async function loadOrders() {
  const dateFilter = document.getElementById('filter-date').value;
  const statusFilter = document.getElementById('filter-status').value;
  const searchFilter = document.getElementById('filter-search').value;
  
  let url = '/orders?';
  if (dateFilter) url += `dateRange=${dateFilter}&`;
  if (statusFilter) url += `status=${statusFilter}&`;
  if (searchFilter) url += `search=${searchFilter}&`;

  try {
    const json = await fetchApi(url);
    const orders = json || [];
    
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No orders found</td></tr>`;
      return;
    }
    
    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
      
      tbody.innerHTML += `
        <tr>
          <td><a href="#" onclick="viewOrder(${order.id})" style="color: var(--primary); text-decoration:none; font-weight: 600;">#${order.id}</a></td>
          <td>${date}</td>
          <td>
            <div style="font-weight: 500">${order.customer_name}</div>
          </td>
          <td>${order.phone}</td>
          <td style="font-weight: 600">৳${order.subtotal}</td>
          <td><span class="badge badge-${order.status}">${order.status}</span></td>
          <td>
            <select style="padding: 4px; border-radius: 4px; border: 1px solid var(--border);" onchange="updateStatus(${order.id}, this.value)">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="packed" ${order.status === 'packed' ? 'selected' : ''}>Packed</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="returned" ${order.status === 'returned' ? 'selected' : ''}>Returned</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Failed to load orders', err);
  }
}

async function updateStatus(orderId, status) {
  try {
    await fetchApi(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    // Just reload orders table
    loadOrders();
    // Also refresh KPIs if dashboard is cached
    loadDashboardKpis();
  } catch (err) {
    console.error('Failed to update status', err);
    alert('Failed to update status');
  }
}

async function viewOrder(id) {
  alert(`Order details modal for #${id} coming soon!`);
}
