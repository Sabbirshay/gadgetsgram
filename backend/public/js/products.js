async function loadProducts() {
  try {
    const products = await fetchApi('/products/admin/all');
    
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = '';
    
    products.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td>#${p.id}</td>
          <td>
            <div style="font-weight: 600">${p.title}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${p.slug}</div>
          </td>
          <td>৳${p.price}</td>
          <td style="color: var(--success); font-weight: 600;">৳${p.sale_price}</td>
          <td>
            ${p.stock > 10 ? `<span style="color:var(--success)">${p.stock}</span>` : `<span style="color:var(--danger)">${p.stock}</span>`}
          </td>
          <td>
            <span class="badge ${p.status === 'active' ? 'badge-confirmed' : 'badge-cancelled'}">${p.status}</span>
          </td>
          <td>
            <button class="btn" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})'>Edit</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Failed to load products', err);
  }
}

function showProductModal() {
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('product-modal-title').innerText = 'Add Product';
  document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

function editProduct(p) {
  document.getElementById('product-modal-title').innerText = 'Edit Product';
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.title;
  document.getElementById('prod-desc').value = p.description || '';
  document.getElementById('prod-price').value = p.price;
  document.getElementById('prod-sale').value = p.sale_price;
  document.getElementById('prod-stock').value = p.stock;
  document.getElementById('prod-status').value = p.status;
  
  document.getElementById('product-modal').style.display = 'flex';
}

async function saveProduct(e) {
  e.preventDefault();
  
  const id = document.getElementById('prod-id').value;
  const payload = {
    title: document.getElementById('prod-name').value,
    description: document.getElementById('prod-desc').value,
    price: parseInt(document.getElementById('prod-price').value),
    sale_price: parseInt(document.getElementById('prod-sale').value),
    stock: parseInt(document.getElementById('prod-stock').value),
    status: document.getElementById('prod-status').value,
  };
  
  try {
    if (id) {
      await fetchApi(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      await fetchApi('/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    
    closeProductModal();
    loadProducts();
  } catch (err) {
    alert('Failed to save product');
  }
}
