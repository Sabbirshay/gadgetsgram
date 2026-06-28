// ─── Date Formatting Helpers ────────────────────────────────────────────

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function statusLabel(status) {
  return (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const STATUS_COLORS = {
  pending:        { bg: '#fef3c7', text: '#b45309', icon: '⏳' },
  confirmed:      { bg: '#dbeafe', text: '#1d4ed8', icon: '✅' },
  packed:         { bg: '#e0e7ff', text: '#4338ca', icon: '📦' },
  courier_booked: { bg: '#fce7f3', text: '#be185d', icon: '🚚' },
  in_transit:     { bg: '#fef3c7', text: '#92400e', icon: '🛣️' },
  delivered:      { bg: '#dcfce3', text: '#15803d', icon: '🎉' },
  returned:       { bg: '#fee2e2', text: '#b91c1c', icon: '↩️' },
  cancelled:      { bg: '#f1f5f9', text: '#475569', icon: '❌' },
};

// ─── Load Orders Table ──────────────────────────────────────────────────

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
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 32px; color: var(--text-muted);">No orders found</td></tr>`;
      return;
    }
    
    orders.forEach(order => {
      const placedAt = formatDateShort(order.created_at);

      // Latest status change time
      let lastStatusTime = '';
      if (order.statusHistory && order.statusHistory.length > 0) {
        const sorted = [...order.statusHistory].sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
        const latest = sorted[0];
        if (latest.to_status === order.status && latest.to_status !== 'pending') {
          lastStatusTime = `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${formatDateShort(latest.changed_at)}</div>`;
        }
      }

      const addressShort = order.address
        ? (order.address.length > 30 ? order.address.substring(0, 30) + '…' : order.address)
        : '—';
      
      tbody.innerHTML += `
        <tr>
          <td><a href="#" onclick="viewOrder(${order.id}); return false;" style="color: var(--primary); text-decoration:none; font-weight: 600;">#${order.id}</a></td>
          <td style="font-size: 13px; white-space: nowrap;">${placedAt}</td>
          <td>
            <div style="font-weight: 500">${order.customer_name}</div>
          </td>
          <td style="font-size: 13px;">
            <div>${order.phone}</div>
            ${order.alternative_phone ? `<div style="font-size: 11px; color: var(--text-muted);">Alt: ${order.alternative_phone}</div>` : ''}
          </td>
          <td style="font-size: 13px; max-width: 180px;">
            <div title="${(order.address || '').replace(/"/g, '&quot;')}">${addressShort}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${order.district || ''}</div>
          </td>
          <td style="font-weight: 600">৳${order.subtotal}</td>
          <td>
            <span class="badge badge-${order.status}">${statusLabel(order.status)}</span>
            ${lastStatusTime}
          </td>
          <td>
            <select style="padding: 4px; border-radius: 4px; border: 1px solid var(--border); font-size: 12px;" onchange="updateStatus(${order.id}, this.value)">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="packed" ${order.status === 'packed' ? 'selected' : ''}>Packed</option>
              <option value="courier_booked" ${order.status === 'courier_booked' ? 'selected' : ''}>Courier Booked</option>
              <option value="in_transit" ${order.status === 'in_transit' ? 'selected' : ''}>In Transit</option>
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

// ─── Update Status ──────────────────────────────────────────────────────

async function updateStatus(orderId, status) {
  try {
    await fetchApi(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    // Reload orders table
    loadOrders();
    // Refresh KPIs if dashboard is cached
    loadDashboardKpis();
    // If the detail modal is open for this order, refresh it
    if (document.getElementById('order-detail-modal').style.display === 'flex') {
      viewOrder(orderId);
    }
  } catch (err) {
    console.error('Failed to update status', err);
    alert('Failed to update status');
  }
}

// ─── Order Detail Modal ─────────────────────────────────────────────────

function closeOrderDetail() {
  document.getElementById('order-detail-modal').style.display = 'none';
}

async function viewOrder(id) {
  const modal = document.getElementById('order-detail-modal');
  const title = document.getElementById('order-detail-title');
  const body = document.getElementById('order-detail-body');

  title.innerText = `Order #${id}`;
  body.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 24px;">Loading order details...</p>';
  modal.style.display = 'flex';

  try {
    const order = await fetchApi(`/orders/${id}`);
    
    const productName = order.product ? order.product.title : `Product #${order.product_id}`;
    
    // Build status timeline
    const timeline = buildStatusTimeline(order);

    body.innerHTML = `
      <!-- Customer Information -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">👤 Customer Information</h3>
        <div style="background: #f8fafc; border-radius: 10px; padding: 16px 20px; border: 1px solid var(--border);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Name</div>
              <div style="font-weight: 600;">${order.customer_name}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Phone</div>
              <div style="font-weight: 500;">${order.phone}</div>
            </div>
            ${order.alternative_phone ? `
            <div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Alternative Phone</div>
              <div style="font-weight: 500;">${order.alternative_phone}</div>
            </div>` : ''}
            <div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">District</div>
              <div style="font-weight: 500;">${order.district || '—'}</div>
            </div>
            <div style="grid-column: 1 / -1;">
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Full Address</div>
              <div style="font-weight: 500;">${order.address || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Details -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">📦 Order Details</h3>
        <div style="background: #f8fafc; border-radius: 10px; padding: 16px 20px; border: 1px solid var(--border);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Product</div>
              <div style="font-weight: 600;">${productName}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Quantity</div>
              <div style="font-weight: 500;">${order.quantity}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Unit Price</div>
              <div style="font-weight: 500;">৳${order.price}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Delivery Charge</div>
              <div style="font-weight: 500;">৳${order.delivery_charge}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Subtotal</div>
              <div style="font-weight: 700; font-size: 18px; color: var(--primary);">৳${order.subtotal}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Order Placed At</div>
              <div style="font-weight: 500;">${formatDateTime(order.created_at)}</div>
            </div>
          </div>
          ${order.notes ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Notes</div>
            <div style="font-weight: 500;">${order.notes}</div>
          </div>` : ''}
        </div>
      </div>

      <!-- Current Status + Change -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">🔄 Current Status</h3>
        <div style="display: flex; align-items: center; gap: 16px; background: #f8fafc; border-radius: 10px; padding: 16px 20px; border: 1px solid var(--border);">
          <span class="badge badge-${order.status}" style="font-size: 14px; padding: 6px 14px;">${statusLabel(order.status)}</span>
          <div style="flex: 1;"></div>
          <label style="font-size: 13px; color: var(--text-muted); font-weight: 500;">Change to:</label>
          <select style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); font-size: 13px;" onchange="updateStatusFromModal(${order.id}, this.value)">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="packed" ${order.status === 'packed' ? 'selected' : ''}>Packed</option>
            <option value="courier_booked" ${order.status === 'courier_booked' ? 'selected' : ''}>Courier Booked</option>
            <option value="in_transit" ${order.status === 'in_transit' ? 'selected' : ''}>In Transit</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
            <option value="returned" ${order.status === 'returned' ? 'selected' : ''}>Returned</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      </div>

      <!-- Status Timeline -->
      <div>
        <h3 style="font-size: 14px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">📋 Status Timeline</h3>
        ${timeline}
      </div>
    `;
  } catch (err) {
    console.error('Failed to load order detail', err);
    body.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 24px;">Failed to load order details.</p>`;
  }
}

function buildStatusTimeline(order) {
  const history = order.statusHistory || [];
  
  if (history.length === 0) {
    return `<p style="color: var(--text-muted); font-size: 13px;">No status history recorded.</p>`;
  }

  // Sort ascending by changed_at
  const sorted = [...history].sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));

  let html = '<div style="position: relative; padding-left: 28px;">';

  sorted.forEach((entry, index) => {
    const isLast = index === sorted.length - 1;
    const colors = STATUS_COLORS[entry.to_status] || { bg: '#f1f5f9', text: '#475569', icon: '•' };
    const time = formatDateTime(entry.changed_at);
    const label = statusLabel(entry.to_status);
    const fromLabel = entry.from_status ? statusLabel(entry.from_status) : null;

    html += `
      <div style="position: relative; padding-bottom: ${isLast ? '0' : '20px'}; margin-bottom: ${isLast ? '0' : '0'};">
        <!-- Vertical line -->
        ${!isLast ? `<div style="position: absolute; left: -20px; top: 18px; bottom: 0; width: 2px; background: var(--border);"></div>` : ''}
        <!-- Dot -->
        <div style="position: absolute; left: -26px; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: ${colors.bg}; border: 2px solid ${colors.text}; z-index: 1;"></div>
        <!-- Content -->
        <div style="background: ${isLast ? colors.bg : '#fafafa'}; border: 1px solid ${isLast ? colors.text + '33' : 'var(--border)'}; border-radius: 8px; padding: 12px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-weight: 600; color: ${colors.text}; font-size: 14px;">${colors.icon} ${label}</span>
              ${fromLabel ? `<span style="font-size: 12px; color: var(--text-muted); margin-left: 8px;">from ${fromLabel}</span>` : `<span style="font-size: 12px; color: var(--text-muted); margin-left: 8px;">— Order placed</span>`}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 500; white-space: nowrap;">${time}</div>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

// ─── Update from Modal ──────────────────────────────────────────────────

async function updateStatusFromModal(orderId, status) {
  try {
    await fetchApi(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    // Refresh both the modal and the table
    viewOrder(orderId);
    loadOrders();
    loadDashboardKpis();
  } catch (err) {
    console.error('Failed to update status', err);
    alert('Failed to update status');
  }
}
