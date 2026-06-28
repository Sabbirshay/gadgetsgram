// Product image list — managed in memory, saved as JSON string to backend
let productImages = [];

function getProductImageSrc(p) {
  try {
    const imgs = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []);
    if (imgs.length > 0) return imgs[0];
  } catch (e) {}
  return null;
}

async function loadProducts() {
  try {
    const products = await fetchApi('/products/admin/all');

    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = '';

    products.forEach(p => {
      const imgSrc = getProductImageSrc(p);
      const imgCell = imgSrc
        ? `<img src="${imgSrc}" alt="${p.title}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);">`
        : `<div style="width: 48px; height: 48px; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 1px solid var(--border);">📱</div>`;

      tbody.innerHTML += `
        <tr>
          <td><input type="checkbox" class="product-checkbox" value="${p.id}"></td>
          <td>#${p.id}</td>
          <td>${imgCell}</td>
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
            <button class="btn" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})'> Edit</button>
          </td>
        </tr>
      `;
    });
    // Reset select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllProducts');
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
  } catch (err) {
    console.error('Failed to load products', err);
  }
}

function toggleAllProducts(masterCheckbox) {
  const checkboxes = document.querySelectorAll('.product-checkbox');
  checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
}

async function applyBulkProductAction() {
  const action = document.getElementById('bulk-product-action').value;
  if (!action) {
    alert('Please select a bulk action.');
    return;
  }

  const checkboxes = document.querySelectorAll('.product-checkbox:checked');
  const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));

  if (ids.length === 0) {
    alert('Please select at least one product.');
    return;
  }

  if (!confirm(`Are you sure you want to set ${ids.length} products to ${action}?`)) {
    return;
  }

  try {
    await fetchApi('/products/bulk/status', {
      method: 'PUT',
      body: JSON.stringify({ ids, status: action })
    });
    alert('Products updated successfully.');
    document.getElementById('bulk-product-action').value = '';
    loadProducts();
  } catch (err) {
    alert('Failed to update products.');
  }
}

function showProductModal() {
  document.getElementById('product-form').reset();
  document.getElementById('prod-id').value = '';
  document.getElementById('product-modal-title').innerText = 'Add Product';
  productImages = [];
  renderImagePreviews();
  document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
  document.getElementById('prod-image-file').value = '';
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

  // Load existing images
  try {
    const imgs = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []);
    productImages = [...imgs];
  } catch (e) {
    productImages = [];
  }
  renderImagePreviews();

  document.getElementById('product-modal').style.display = 'flex';
}

// ─── Image Preview Rendering ────────────────────────────────────────────

function renderImagePreviews() {
  const container = document.getElementById('prod-image-preview');
  container.innerHTML = '';

  if (productImages.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; margin: 0;">No images added yet.</p>`;
    return;
  }

  productImages.forEach((url, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 90px; height: 90px; border-radius: 10px; overflow: hidden; border: 2px solid var(--border); background: #f8fafc; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.06);';

    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Product image';
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    img.onerror = function() {
      this.style.display = 'none';
      const errDiv = document.createElement('div');
      errDiv.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--danger);text-align:center;padding:4px;';
      errDiv.textContent = 'Failed to load';
      wrapper.appendChild(errDiv);
    };

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.innerHTML = '✕';
    removeBtn.style.cssText = 'position: absolute; top: 2px; right: 2px; width: 22px; height: 22px; border-radius: 50%; background: rgba(239,68,68,0.9); color: white; border: none; cursor: pointer; font-size: 11px; display: flex; align-items: center; justify-content: center; line-height: 1; box-shadow: 0 1px 3px rgba(0,0,0,0.2);';
    removeBtn.onclick = () => removeImage(index);

    // Badge for index number
    const badge = document.createElement('span');
    badge.innerText = index + 1;
    badge.style.cssText = 'position: absolute; bottom: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,0.55); color: white; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: 600;';

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    wrapper.appendChild(badge);
    container.appendChild(wrapper);
  });
}

function removeImage(index) {
  productImages.splice(index, 1);
  renderImagePreviews();
}

// ─── Add Image from URL ─────────────────────────────────────────────────

function addImageFromUrl() {
  const input = document.getElementById('prod-image-url');
  const url = input.value.trim();

  if (!url) {
    alert('Please enter an image URL.');
    return;
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch (e) {
    alert('Please enter a valid URL.');
    return;
  }

  productImages.push(url);
  renderImagePreviews();
  input.value = '';
}

// ─── Upload Image from Device ───────────────────────────────────────────

async function uploadImageFiles(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const saveBtn = document.getElementById('prod-save-btn');
  const originalText = saveBtn.innerText;
  saveBtn.innerText = 'Uploading...';
  saveBtn.disabled = true;

  for (const file of files) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_URL}/products/upload-image`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (res.status === 401) {
        logout();
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const json = await res.json();
      const data = json.data !== undefined ? json.data : json;
      productImages.push(data.url);
    } catch (err) {
      console.error('Upload failed for', file.name, err);
      alert(`Failed to upload "${file.name}". ${err.message || ''}`);
    }
  }

  renderImagePreviews();
  saveBtn.innerText = originalText;
  saveBtn.disabled = false;

  // Reset file input so same file can be re-selected
  event.target.value = '';
}

// ─── Save Product ───────────────────────────────────────────────────────

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
    images: JSON.stringify(productImages),
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
