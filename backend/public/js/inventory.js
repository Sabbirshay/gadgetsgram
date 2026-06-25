async function loadInventory() {
  const tbody = document.getElementById('inventory-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading...</td></tr>';
  
  try {
    const summaries = await fetchApi('/inventory/summary');
    
    if (!summaries || summaries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No inventory records found.</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    summaries.forEach(item => {
      const statusBadge = item.available <= 0 
        ? '<span class="badge badge-returned">Out of Stock</span>'
        : item.available <= 10 
          ? '<span class="badge badge-pending">Low Stock</span>' 
          : '<span class="badge badge-delivered">In Stock</span>';
          
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${item.id}</td>
        <td style="font-weight: 500;">${item.title}</td>
        <td style="font-weight: 700;">${item.available}</td>
        <td style="color: var(--text-muted);">${item.reserved}</td>
        <td style="color: var(--text-muted);">${item.sold}</td>
        <td style="color: var(--text-muted);">${item.returned}</td>
        <td>${statusBadge}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load inventory', err);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load inventory.</td></tr>';
  }
}

async function uploadInventoryCsv(event) {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/v1/inventory/bulk-update', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      alert(\`Successfully updated \${result.updatedCount} products!\`);
      loadInventory();
    } else {
      const err = await response.json();
      alert('Error updating inventory: ' + (err.message || 'Unknown error'));
    }
  } catch (err) {
    console.error('Upload failed', err);
    alert('Failed to upload file.');
  }
  
  // Reset input
  event.target.value = '';
}
