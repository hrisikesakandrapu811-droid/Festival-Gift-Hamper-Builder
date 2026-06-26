import { state } from '../state.js';
import { formatCurrency, formatDate } from '../utils.js';

let salesChartInstance = null;
let occasionChartInstance = null;

export function initDashboard() {
  const { orders, products } = state.getState();

  // 1. Calculate Metrics
  const totalHampers = orders.reduce((sum, order) => sum + order.items.reduce((qSum, i) => qSum + i.qty, 0), 0);
  const activeOrders = orders.filter(o => o.status !== 'Delivered').length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const lowStockCount = products.filter(p => p.stock <= p.threshold).length;

  // Render Metric values
  document.getElementById('metric-total-hampers').textContent = totalHampers;
  document.getElementById('metric-active-orders').textContent = activeOrders;
  document.getElementById('metric-revenue').textContent = formatCurrency(totalRevenue);
  
  const lowStockEl = document.getElementById('metric-low-stock');
  lowStockEl.textContent = lowStockCount;
  if (lowStockCount > 0) {
    lowStockEl.parentElement.classList.add('text-danger');
    lowStockEl.parentElement.classList.remove('text-muted');
  } else {
    lowStockEl.parentElement.classList.remove('text-danger');
    lowStockEl.parentElement.classList.add('text-muted');
  }

  // 2. Render Recent Orders List
  const recentTableBody = document.getElementById('dashboard-recent-table-body');
  if (orders.length === 0) {
    recentTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted" style="padding: 2rem;">
          No orders placed yet. Go to "Build Hamper" to create one!
        </td>
      </tr>
    `;
  } else {
    const recent = orders.slice(0, 5);
    recentTableBody.innerHTML = recent.map(order => `
      <tr>
        <td class="font-semibold">${order.id}</td>
        <td>
          <div class="font-semibold">${order.customerName}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${order.phoneNumber}</div>
        </td>
        <td>${order.recipientName}</td>
        <td><span class="status-badge" style="background-color: var(--warning-bg); color: var(--gold); border: 1px solid var(--gold); font-size: 0.7rem;">${order.occasion}</span></td>
        <td class="font-semibold">${formatCurrency(order.totalAmount)}</td>
        <td>
          <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
        </td>
      </tr>
    `).join('');
  }

  // 3. Render Occasion Statistics
  renderOccasionStats(orders);

  // 4. Load Analytics Charts
  renderDashboardCharts(orders);
}

// Map individual occasions to one of the 5 requested categories
export function getOccasionCategory(occasion) {
  if (!occasion) return "Other";
  
  const festivalOccasions = [
    "Diwali", "Christmas", "New Year", "Sankranti", 
    "Holi", "Eid", "Pongal", "Onam"
  ];
  
  const personalOccasions = [
    "Birthday", "Anniversary", "Engagement", "Wedding", 
    "Baby Shower", "Housewarming"
  ];
  
  const corporateOccasions = [
    "Employee Gifts", "Client Gifts", "Corporate Events", "Business Promotions"
  ];
  
  const seasonalOccasions = [
    "Valentine's Day", "Mother's Day", "Father's Day", 
    "Women's Day", "Friendship Day", "Teacher's Day"
  ];
  
  const premiumOccasions = [
    "Luxury Hampers", "Personalized Hampers", "Family Hampers", 
    "Couple Hampers", "Kids Hampers"
  ];

  const occ = occasion.toLowerCase().trim();
  
  if (festivalOccasions.some(o => occ === o.toLowerCase() || occ.includes(o.toLowerCase()) || o.toLowerCase().includes(occ))) return "Festival Hampers";
  if (personalOccasions.some(o => occ === o.toLowerCase() || occ.includes(o.toLowerCase()) || o.toLowerCase().includes(occ))) return "Personal Occasion Hampers";
  if (corporateOccasions.some(o => occ === o.toLowerCase() || occ.includes(o.toLowerCase()) || o.toLowerCase().includes(occ))) return "Corporate Gift Hampers";
  if (seasonalOccasions.some(o => occ === o.toLowerCase() || occ.includes(o.toLowerCase()) || o.toLowerCase().includes(occ))) return "Seasonal & Special Occasion Hampers";
  if (premiumOccasions.some(o => occ === o.toLowerCase() || occ.includes(o.toLowerCase()) || o.toLowerCase().includes(occ))) return "Premium & Customized Hampers";
  
  // Custom fallback checks
  if (occ.includes("welcome") || occ.includes("employee") || occ.includes("client") || occ.includes("corporate") || occ.includes("business") || occ.includes("promotion")) return "Corporate Gift Hampers";
  if (occ.includes("wedding") || occ.includes("engagement") || occ.includes("anniversary") || occ.includes("birthday") || occ.includes("baby") || occ.includes("housewarming")) return "Personal Occasion Hampers";
  if (occ.includes("diwali") || occ.includes("christmas") || occ.includes("sankranti") || occ.includes("holi") || occ.includes("eid") || occ.includes("pongal") || occ.includes("onam")) return "Festival Hampers";
  if (occ.includes("valentine") || occ.includes("mother") || occ.includes("father") || occ.includes("women") || occ.includes("friend") || occ.includes("teacher")) return "Seasonal & Special Occasion Hampers";
  if (occ.includes("luxury") || occ.includes("personalized") || occ.includes("family") || occ.includes("couple") || occ.includes("kids")) return "Premium & Customized Hampers";

  return "Festival Hampers";
}

function renderOccasionStats(orders) {
  const listEl = document.getElementById('popular-occasions-list');
  if (!listEl) return;

  const categories = [
    "Festival Hampers",
    "Personal Occasion Hampers",
    "Corporate Gift Hampers",
    "Seasonal & Special Occasion Hampers",
    "Premium & Customized Hampers"
  ];

  const counts = categories.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {});

  let totalOrdersCount = orders.length;

  orders.forEach(order => {
    const cat = getOccasionCategory(order.occasion);
    if (counts[cat] !== undefined) {
      counts[cat]++;
    }
  });

  const categoryColors = {
    "Festival Hampers": "#ff9933",
    "Personal Occasion Hampers": "#8b5cf6",
    "Corporate Gift Hampers": "#0d9488",
    "Seasonal & Special Occasion Hampers": "#f43f5e",
    "Premium & Customized Hampers": "#d4af37"
  };

  listEl.innerHTML = categories
    .map(cat => {
      const count = counts[cat];
      const percent = totalOrdersCount > 0 ? Math.round((count / totalOrdersCount) * 100) : 0;
      const color = categoryColors[cat];
      return `
        <div class="occasion-stat-item">
          <div class="occasion-stat-header">
            <span style="font-size: 0.8rem;">${cat}</span>
            <span class="text-muted" style="font-size: 0.75rem;">${count} (${percent}%)</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${percent}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderDashboardCharts(orders) {
  const revenueCtx = document.getElementById('revenue-chart-canvas');
  const occasionCtx = document.getElementById('occasion-chart-canvas');
  if (!revenueCtx || !occasionCtx) return;

  // Aggregate monthly revenue for the past 6 months
  const monthlyData = {};
  const months = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const mName = d.toLocaleString('default', { month: 'short' });
    months.push(mName);
    monthlyData[mName] = 0;
  }

  orders.forEach(order => {
    const oDate = new Date(order.createdAt);
    const mName = oDate.toLocaleString('default', { month: 'short' });
    if (monthlyData[mName] !== undefined) {
      monthlyData[mName] += order.totalAmount;
    }
  });

  const revenueValues = months.map(m => monthlyData[m]);

  // Aggregate category totals for doughnut chart
  const categories = [
    "Festival Hampers",
    "Personal Occasion Hampers",
    "Corporate Gift Hampers",
    "Seasonal & Special Occasion Hampers",
    "Premium & Customized Hampers"
  ];

  const categoryTotals = categories.map(cat => 
    orders.filter(o => getOccasionCategory(o.occasion) === cat).reduce((sum, o) => sum + o.totalAmount, 0)
  );

  // 1. Line/Area Chart for Revenue
  if (salesChartInstance) salesChartInstance.destroy();
  
  salesChartInstance = new Chart(revenueCtx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Monthly Revenue',
        data: revenueValues,
        borderColor: '#d4af37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#d4af37',
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.1)' },
          ticks: { color: '#64748b', font: { family: 'Outfit' } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { family: 'Outfit' } }
        }
      }
    }
  });

  // 2. Doughnut Chart for Categories Share
  if (occasionChartInstance) occasionChartInstance.destroy();

  const categoryColors = [
    '#ff9933', // Festival Orange
    '#8b5cf6', // Personal Occasion Violet
    '#0d9488', // Corporate Teal
    '#f43f5e', // Seasonal Rose
    '#d4af37'  // Premium Gold
  ];

  // Render Custom HTML Legend
  const legendEl = document.getElementById('occasion-legend');
  if (legendEl) {
    const totalSales = categoryTotals.reduce((sum, val) => sum + val, 0);
    legendEl.innerHTML = categories.map((cat, idx) => {
      const color = categoryColors[idx];
      const val = categoryTotals[idx];
      const percent = totalSales > 0 ? Math.round((val / totalSales) * 100) : 0;
      
      // Shorten label for clean display
      let shortLabel = cat;
      if (cat === "Festival Hampers") shortLabel = "Festival";
      else if (cat === "Personal Occasion Hampers") shortLabel = "Personal";
      else if (cat === "Corporate Gift Hampers") shortLabel = "Corporate";
      else if (cat === "Seasonal & Special Occasion Hampers") shortLabel = "Seasonal";
      else if (cat === "Premium & Customized Hampers") shortLabel = "Premium";

      return `
        <div class="legend-item" title="${cat}: ${percent}%">
          <span class="legend-color-dot" style="background-color: ${color};"></span>
          <span class="legend-label" style="font-weight: 500;">${shortLabel} (${percent}%)</span>
        </div>
      `;
    }).join('');
  }

  occasionChartInstance = new Chart(occasionCtx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: categoryTotals,
        backgroundColor: categoryColors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Hide native Chart.js legend to prevent overlap/overflow
        }
      },
      cutout: '65%'
    }
  });
}
