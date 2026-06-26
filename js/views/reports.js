import { state } from '../state.js';
import { formatCurrency, formatDate, exportToCSV, exportToPDF } from '../utils.js';

export function initReports() {
  renderReportsData();
  setupReportsListeners();
}

function renderReportsData() {
  const { orders } = state.getState();

  // 1. Compile summary figures
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgHamperValue = orders.length > 0 ? (totalRevenue / orders.length) : 0;
  
  // Find top occasion
  const counts = {};
  orders.forEach(o => {
    counts[o.occasion] = (counts[o.occasion] || 0) + 1;
  });
  let topOccasion = "-";
  let maxCount = 0;
  Object.entries(counts).forEach(([occ, val]) => {
    if (val > maxCount) {
      maxCount = val;
      topOccasion = occ;
    }
  });

  const totalItemsSold = orders.reduce((sum, o) => 
    sum + o.items.reduce((qSum, item) => qSum + item.qty, 0), 0
  );

  // Render values
  document.getElementById('report-total-revenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('report-avg-value').textContent = formatCurrency(avgHamperValue);
  document.getElementById('report-top-occasion').textContent = topOccasion;
  document.getElementById('report-items-sold').textContent = totalItemsSold;

  // Render historical orders list in reports table
  const tableBody = document.getElementById('reports-table-body');
  if (!tableBody) return;

  if (orders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted" style="padding: 2rem;">
          No data available.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = orders.map(order => `
    <tr>
      <td class="font-semibold">${order.id}</td>
      <td>${formatDate(order.createdAt)}</td>
      <td>${order.customerName}</td>
      <td>
        <span class="status-badge" style="background-color: var(--warning-bg); color: var(--gold); border: 1px solid var(--gold); font-size: 0.7rem;">
          ${order.occasion}
        </span>
      </td>
      <td class="font-semibold">${formatCurrency(order.totalAmount)}</td>
      <td><span class="status-badge ${order.status.toLowerCase()}">${order.status}</span></td>
    </tr>
  `).join('');
}

function setupReportsListeners() {
  const csvBtn = document.getElementById('report-export-csv-btn');
  const pdfBtn = document.getElementById('report-export-pdf-btn');

  if (csvBtn) {
    const newCsv = csvBtn.cloneNode(true);
    csvBtn.replaceWith(newCsv);
    newCsv.addEventListener('click', handleExportCSV);
  }

  if (pdfBtn) {
    const newPdf = pdfBtn.cloneNode(true);
    pdfBtn.replaceWith(newPdf);
    newPdf.addEventListener('click', handleExportPDF);
  }
}

function handleExportCSV() {
  const { orders } = state.getState();
  if (orders.length === 0) {
    alert("No order records to export.");
    return;
  }

  const headers = ["Order ID", "Date", "Customer Name", "Phone Number", "Recipient Name", "Occasion", "Packaging", "Total Amount", "Status"];
  const rows = orders.map(o => [
    o.id,
    formatDate(o.createdAt),
    o.customerName,
    o.phoneNumber,
    o.recipientName,
    o.occasion,
    o.packagingType,
    o.totalAmount,
    o.status
  ]);

  exportToCSV(headers, rows, `paperplane_orders_report_${new Date().toISOString().split('T')[0]}.csv`);
}

function handleExportPDF() {
  const { orders } = state.getState();
  if (orders.length === 0) {
    alert("No order records to export.");
    return;
  }

  const headers = ["Order ID", "Date", "Customer", "Occasion", "Total Price", "Status"];
  const rows = orders.map(o => [
    o.id,
    formatDate(o.createdAt),
    o.customerName,
    o.occasion,
    formatCurrency(o.totalAmount),
    o.status
  ]);

  // Aggregate stats summaries
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalItemsSold = orders.reduce((sum, o) => 
    sum + o.items.reduce((qSum, item) => qSum + item.qty, 0), 0
  );

  const summaries = [
    { label: "Total Revenue Generated", value: formatCurrency(totalRevenue) },
    { label: "Total Hampers Prepared", value: `${totalItemsSold} packages` },
    { label: "Total Order Invoices", value: `${orders.length} orders` }
  ];

  exportToPDF(
    "Sales & Hamper Distribution Summary",
    headers,
    rows,
    `paperplane_sales_report_${new Date().toISOString().split('T')[0]}.pdf`,
    summaries
  );
}
