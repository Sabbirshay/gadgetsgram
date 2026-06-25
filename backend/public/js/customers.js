async function loadCustomers() {
  try {
    const customers = await fetchApi('/customers');
    
    const tbody = document.getElementById('customers-tbody');
    tbody.innerHTML = '';
    
    customers.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td>#${c.id}</td>
          <td style="font-weight: 500">${c.name}</td>
          <td>${c.phone}</td>
          <td>${c.email || '-'}</td>
          <td><span class="badge ${c.orders_count > 3 ? 'badge-packed' : 'badge-pending'}">${c.orders_count}</span></td>
          <td style="font-weight: 600">৳${c.lifetime_value}</td>
          <td>
            <button class="btn" style="padding: 4px 8px; font-size: 12px;" onclick="alert('Customer profile coming soon')">View Profile</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Failed to load customers', err);
  }
}
