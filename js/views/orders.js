import { state } from '../state.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';
import { getOccasionCategory } from './dashboard.js';

const FILTER_SUBCATEGORIES_MAP = {
  "Festival Hampers": ["Diwali", "Christmas", "New Year", "Sankranti", "Holi", "Eid", "Pongal", "Onam"],
  "Personal Occasion Hampers": ["Birthday", "Anniversary", "Engagement", "Wedding", "Baby Shower", "Housewarming"],
  "Corporate Gift Hampers": ["Employee Gifts", "Client Gifts", "Corporate Events", "Business Promotions"],
  "Seasonal & Special Occasion Hampers": ["Valentine's Day", "Mother's Day", "Father's Day", "Women's Day", "Friendship Day", "Teacher's Day"],
  "Premium & Customized Hampers": ["Luxury Hampers", "Personalized Hampers", "Family Hampers", "Couple Hampers", "Kids Hampers"]
};

let activeOrderIdForDetails = null;

export function initOrders() {
  renderOrdersTable();
  setupOrdersListeners();
}

function renderOrdersTable() {
  const { orders } = state.getState();
  const searchVal = document.getElementById('orders-search-input').value.toLowerCase();
  const majorCatVal = document.getElementById('orders-filter-major-category').value;
  const occasionVal = document.getElementById('orders-filter-occasion').value;
  const statusVal = document.getElementById('orders-filter-status').value;
  const packagingVal = document.getElementById('orders-filter-packaging').value;
  
  const tableBody = document.getElementById('orders-table-body');
  if (!tableBody) return;

  // Apply filters
  const filtered = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchVal) ||
      order.customerName.toLowerCase().includes(searchVal) ||
      order.recipientName.toLowerCase().includes(searchVal) ||
      order.phoneNumber.includes(searchVal);

    const matchesMajorCategory = majorCatVal === 'All' || getOccasionCategory(order.occasion) === majorCatVal;
    const matchesOccasion = occasionVal === 'All' || order.occasion === occasionVal;
    const matchesStatus = statusVal === 'All' || order.status === statusVal;
    const matchesPackaging = packagingVal === 'All' || order.packagingType === packagingVal;

    return matchesSearch && matchesMajorCategory && matchesOccasion && matchesStatus && matchesPackaging;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted" style="padding: 3rem;">
          No matching orders found.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(order => `
    <tr>
      <td class="font-semibold">${order.id}</td>
      <td>${formatDate(order.createdAt)}</td>
      <td>
        <div class="font-semibold">${order.customerName}</div>
        <div class="text-muted" style="font-size: 0.75rem;">${order.phoneNumber}</div>
      </td>
      <td>${order.recipientName}</td>
      <td>
        <span class="status-badge" style="background-color: var(--warning-bg); color: var(--gold); border: 1px solid var(--gold); font-size: 0.7rem;">
          ${order.occasion}
        </span>
      </td>
      <td class="font-semibold">${formatCurrency(order.totalAmount)}</td>
      <td>
        <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
      </td>
      <td class="orders-actions-cell">
        <button class="btn btn-secondary btn-sm btn-icon view-order-btn" data-id="${order.id}" title="View Details">
          👁️
        </button>
      </td>
    </tr>
  `).join('');

  // Bind individual view click events
  tableBody.querySelectorAll('.view-order-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.dataset.id;
      openOrderDetailsModal(orderId);
    });
  });
}

function setupOrdersListeners() {
  // Input & dropdown listeners
  const searchInput = document.getElementById('orders-search-input');
  const majorSelect = document.getElementById('orders-filter-major-category');
  const occasionSelect = document.getElementById('orders-filter-occasion');

  const filters = [
    majorSelect,
    occasionSelect,
    document.getElementById('orders-filter-status'),
    document.getElementById('orders-filter-packaging')
  ];

  if (searchInput) {
    searchInput.addEventListener('input', renderOrdersTable);
  }

  if (majorSelect && occasionSelect) {
    majorSelect.addEventListener('change', (e) => {
      const selectedCat = e.target.value;
      if (selectedCat === 'All') {
        occasionSelect.disabled = true;
        occasionSelect.value = 'All';
        occasionSelect.innerHTML = `<option value="All">All Subcategories</option>`;
      } else if (FILTER_SUBCATEGORIES_MAP[selectedCat]) {
        occasionSelect.disabled = false;
        occasionSelect.innerHTML = `
          <option value="All">All Subcategories</option>
          ${FILTER_SUBCATEGORIES_MAP[selectedCat].map(sub => `
            <option value="${sub}">${sub}</option>
          `).join('')}
        `;
      }
      renderOrdersTable();
    });
  }

  filters.forEach(filter => {
    if (filter) {
      filter.addEventListener('change', renderOrdersTable);
    }
  });

  // Modal Action Listeners
  const statusSelect = document.getElementById('details-order-status-select');
  if (statusSelect) {
    statusSelect.addEventListener('change', async (e) => {
      if (!activeOrderIdForDetails) return;
      
      const newStatus = e.target.value;
      const { orders } = state.getState();
      const order = orders.find(o => o.id === activeOrderIdForDetails);
      
      if (order && order.status !== newStatus) {
        order.status = newStatus;
        await state.updateOrder(order);
        showToast("Status Updated", `Order ${order.id} status changed to ${newStatus}.`, "success");
        renderOrdersTable();
        
        // Refresh details modal view
        openOrderDetailsModal(activeOrderIdForDetails);
      }
    });
  }

  const deleteBtn = document.getElementById('details-delete-order-btn');
  if (deleteBtn) {
    // Re-bind click
    const newBtn = deleteBtn.cloneNode(true);
    deleteBtn.replaceWith(newBtn);
    newBtn.addEventListener('click', async () => {
      if (!activeOrderIdForDetails) return;
      
      if (confirm(`Are you sure you want to delete order ${activeOrderIdForDetails}? This action cannot be undone.`)) {
        await state.deleteOrder(activeOrderIdForDetails);
        showToast("Order Deleted", `Order ${activeOrderIdForDetails} has been removed.`, "info");
        closeOrderDetailsModal();
        renderOrdersTable();
      }
    });
  }

  const modalClose = document.getElementById('order-details-modal-close');
  const modalBackdrop = document.getElementById('order-details-modal-backdrop');
  if (modalClose) modalClose.addEventListener('click', closeOrderDetailsModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeOrderDetailsModal);
}

function openOrderDetailsModal(orderId) {
  const { orders } = state.getState();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  activeOrderIdForDetails = orderId;

  // Set general details
  document.getElementById('details-order-id').textContent = order.id;
  document.getElementById('details-order-date').textContent = formatDate(order.createdAt, true);
  document.getElementById('details-customer-name').textContent = order.customerName;
  document.getElementById('details-customer-phone').textContent = order.phoneNumber;
  document.getElementById('details-recipient-name').textContent = order.recipientName;
  document.getElementById('details-order-occasion').textContent = order.occasion;
  document.getElementById('details-order-packaging').textContent = `${order.packagingType} (${formatCurrency(order.packagingPrice)})`;
  
  // Set status selector
  const statusSelect = document.getElementById('details-order-status-select');
  if (statusSelect) {
    statusSelect.value = order.status;
  }

  // Populate items table
  const itemsTableBody = document.getElementById('details-order-items-body');
  if (itemsTableBody) {
    itemsTableBody.innerHTML = order.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${formatCurrency(item.price)}</td>
        <td>x${item.qty}</td>
        <td class="text-right font-semibold">${formatCurrency(item.price * item.qty)}</td>
      </tr>
    `).join('');
  }

  // Set Message and Pricing sums
  document.getElementById('details-greeting-text').textContent = order.personalMessage;
  
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  document.getElementById('details-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('details-packaging-fee').textContent = formatCurrency(order.packagingPrice);
  document.getElementById('details-grand-total').textContent = formatCurrency(order.totalAmount);

  // Show Modal
  const modal = document.getElementById('order-details-modal');
  if (modal) modal.classList.add('open');
}

function closeOrderDetailsModal() {
  activeOrderIdForDetails = null;
  const modal = document.getElementById('order-details-modal');
  if (modal) modal.classList.remove('open');
}
export { closeOrderDetailsModal };
