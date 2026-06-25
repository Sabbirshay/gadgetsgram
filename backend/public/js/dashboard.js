async function loadDashboardKpis() {
  try {
    const data = await fetchApi('/analytics/dashboard-kpis');
    
    document.getElementById('kpi-today-orders').innerText = data.todaysOrders;
    document.getElementById('kpi-pending-orders').innerText = data.pendingOrders;
    document.getElementById('kpi-confirmed-orders').innerText = data.confirmedOrders;
    document.getElementById('kpi-delivered-orders').innerText = data.deliveredOrders;
    
    document.getElementById('kpi-today-revenue').innerText = `৳${data.todaysRevenue.toLocaleString()}`;
    document.getElementById('kpi-monthly-revenue').innerText = `৳${data.monthlyRevenue.toLocaleString()}`;
  } catch (err) {
    console.error('Failed to load KPIs', err);
  }
}
