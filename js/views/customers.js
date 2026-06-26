import { state } from '../state.js';
import { formatDate } from '../utils.js';

export function initCustomers() {
  renderCustomersTable();
  setupCustomersListeners();
}

function renderCustomersTable() {
  const { users, orders } = state.getState();
  const searchVal = document.getElementById('customers-search-input').value.toLowerCase();
  
  const tableBody = document.getElementById('customers-table-body');
  if (!tableBody) return;

  // Filter based on search input
  const filtered = users.filter(user => {
    return (
      user.name.toLowerCase().includes(searchVal) ||
      user.email.toLowerCase().includes(searchVal) ||
      user.phone.includes(searchVal) ||
      user.id.toLowerCase().includes(searchVal)
    );
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted" style="padding: 3rem;">
          No customers registered yet.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(user => {
    // Count orders placed by this customer phone number
    const userOrdersCount = orders.filter(o => o.phoneNumber === user.phone).length;
    
    return `
      <tr>
        <td class="font-semibold">${user.id}</td>
        <td>
          <div class="font-semibold">${user.name}</div>
        </td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td>${formatDate(user.createdAt || new Date().toISOString())}</td>
        <td>
          <span class="status-badge" style="background-color: var(--warning-bg); color: var(--gold); border: 1px solid var(--gold); font-size: 0.75rem; padding: 0.2rem 0.6rem;">
            ${userOrdersCount} Hampers Built
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function setupCustomersListeners() {
  const searchInput = document.getElementById('customers-search-input');
  if (searchInput) {
    // Re-bind to clear previous listeners
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.replaceWith(newSearchInput);
    newSearchInput.addEventListener('input', renderCustomersTable);
  }
}
