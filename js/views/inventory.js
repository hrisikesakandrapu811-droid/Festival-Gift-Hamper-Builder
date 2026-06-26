import { state } from '../state.js';
import { formatCurrency, generateId, showToast } from '../utils.js';

let activeProductIdForEdit = null;

export function initInventory() {
  renderInventoryTable();
  setupInventoryListeners();
}

function renderInventoryTable() {
  const { products } = state.getState();
  const searchVal = document.getElementById('inventory-search-input').value.toLowerCase();
  const categoryVal = document.getElementById('inventory-filter-category').value;
  
  const tableBody = document.getElementById('inventory-table-body');
  if (!tableBody) return;

  // Sync Category Filter Dropdown with unique database categories
  syncCategoryDropdown(products);

  // Apply filters
  const filtered = products.filter(prod => {
    const matchesSearch = 
      prod.name.toLowerCase().includes(searchVal) ||
      prod.category.toLowerCase().includes(searchVal);

    const matchesCategory = categoryVal === 'All' || prod.category === categoryVal;

    return matchesSearch && matchesCategory;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted" style="padding: 3rem;">
          No products found. Add some using the "Add Product" button!
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(prod => {
    const isOutOfStock = prod.stock <= 0;
    const isLowStock = prod.stock > 0 && prod.stock <= prod.threshold;
    
    let indicatorColor = 'green';
    let statusText = 'In Stock';
    let badgeClass = 'instock';

    if (isOutOfStock) {
      indicatorColor = 'red';
      statusText = 'Out of Stock';
      badgeClass = 'outofstock';
    } else if (isLowStock) {
      indicatorColor = 'yellow';
      statusText = 'Low Stock';
      badgeClass = 'lowstock';
    }

    return `
      <tr>
        <td class="font-semibold">${prod.id}</td>
        <td>
          <div class="font-semibold">${prod.name}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${prod.category}</div>
        </td>
        <td class="font-semibold">${formatCurrency(prod.price)}</td>
        <td>
          <div class="flex align-center">
            <span class="stock-indicator ${indicatorColor} ${isLowStock ? 'pulse' : ''}"></span>
            <span class="font-semibold">${prod.stock}</span>
            <span class="text-muted" style="font-size: 0.75rem; margin-left: 0.25rem;">(Limit: ${prod.threshold})</span>
          </div>
        </td>
        <td>
          <span class="status-badge ${badgeClass}">${statusText}</span>
        </td>
        <td class="orders-actions-cell">
          <button class="btn btn-secondary btn-sm btn-icon edit-prod-btn" data-id="${prod.id}" title="Edit Product">
            ✏️
          </button>
          <button class="btn btn-secondary btn-sm btn-icon delete-prod-btn" data-id="${prod.id}" title="Delete Product" style="color: var(--danger);">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Bind Actions
  tableBody.querySelectorAll('.edit-prod-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      openProductModal(id);
    });
  });

  tableBody.querySelectorAll('.delete-prod-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      handleDeleteProduct(id);
    });
  });
}

function syncCategoryDropdown(products) {
  const select = document.getElementById('inventory-filter-category');
  if (!select) return;

  const currentVal = select.value;
  
  // Static list of categories
  const categories = [
    'All',
    'Chocolates & Sweets',
    'Dry Fruits & Snacks',
    'Beverages',
    'Personalized Gifts',
    'Home & Decor',
    'Festival Essentials',
    'Lifestyle & Premium Gifts',
    'Office & Utility Gifts',
    'Special Occasion Gifts',
    'Corporate Gifts'
  ];

  // Only re-render options if they changed
  const optionTexts = Array.from(select.options).map(o => o.value);
  const isSync = categories.length === optionTexts.length && categories.every((val, i) => val === optionTexts[i]);

  if (!isSync) {
    select.innerHTML = categories.map(cat => `
      <option value="${cat}">${cat}</option>
    `).join('');
    select.value = categories.includes(currentVal) ? currentVal : 'All';
  }
}

function setupInventoryListeners() {
  const searchInput = document.getElementById('inventory-search-input');
  const catSelect = document.getElementById('inventory-filter-category');
  const addBtn = document.getElementById('add-product-btn');

  if (searchInput) searchInput.addEventListener('input', renderInventoryTable);
  if (catSelect) catSelect.addEventListener('change', renderInventoryTable);

  if (addBtn) {
    // Rebind add click
    const newBtn = addBtn.cloneNode(true);
    addBtn.replaceWith(newBtn);
    newBtn.addEventListener('click', () => openProductModal(null));
  }

  // Modal Save click
  const saveBtn = document.getElementById('product-modal-save-btn');
  if (saveBtn) {
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.replaceWith(newSaveBtn);
    newSaveBtn.addEventListener('click', handleSaveProduct);
  }

  // Close clicks
  const modalClose = document.getElementById('product-modal-close');
  const modalBackdrop = document.getElementById('product-modal-backdrop');
  const cancelBtn = document.getElementById('product-modal-cancel-btn');

  if (modalClose) modalClose.addEventListener('click', closeProductModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeProductModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeProductModal);
}

function openProductModal(productId = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');
  
  if (!modal || !title) return;

  activeProductIdForEdit = productId;

  if (productId) {
    // Edit mode
    title.textContent = "Edit Product";
    const { products } = state.getState();
    const prod = products.find(p => p.id === productId);
    if (prod) {
      document.getElementById('prod-name').value = prod.name;
      document.getElementById('prod-category').value = prod.category;
      document.getElementById('prod-price').value = prod.price;
      document.getElementById('prod-stock').value = prod.stock;
      document.getElementById('prod-threshold').value = prod.threshold;
    }
  } else {
    // Add mode
    title.textContent = "Add Product";
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-category').value = '';
    document.getElementById('prod-price').value = '';
    document.getElementById('prod-stock').value = '';
    document.getElementById('prod-threshold').value = '5'; // default
  }

  modal.classList.add('open');
}

function closeProductModal() {
  activeProductIdForEdit = null;
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('open');
}

async function handleSaveProduct() {
  const name = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value.trim();
  const price = parseFloat(document.getElementById('prod-price').value);
  const stock = parseInt(document.getElementById('prod-stock').value);
  const threshold = parseInt(document.getElementById('prod-threshold').value);

  // Form Validations
  if (!name) {
    showToast("Input Error", "Product name is required.", "warning");
    return;
  }
  if (!category) {
    showToast("Input Error", "Product category is required.", "warning");
    return;
  }
  if (isNaN(price) || price < 0) {
    showToast("Input Error", "Please provide a valid price.", "warning");
    return;
  }
  if (isNaN(stock) || stock < 0) {
    showToast("Input Error", "Please specify stock amount.", "warning");
    return;
  }
  if (isNaN(threshold) || threshold < 0) {
    showToast("Input Error", "Please provide a valid low stock limit.", "warning");
    return;
  }

  const id = activeProductIdForEdit || generateId("PRD");
  const productData = { id, name, category, price, stock, threshold };

  try {
    if (activeProductIdForEdit) {
      await state.updateProduct(productData);
      showToast("Product Updated", `Successfully saved changes for "${name}".`, "success");
    } else {
      await state.addProduct(productData);
      showToast("Product Created", `Successfully added new product "${name}".`, "success");
    }

    closeProductModal();
    renderInventoryTable();
  } catch (err) {
    console.error("Failed to save product:", err);
    showToast("Error", "Could not write product to DB.", "error");
  }
}

async function handleDeleteProduct(id) {
  const { products } = state.getState();
  const prod = products.find(p => p.id === id);
  if (!prod) return;

  if (confirm(`Are you sure you want to delete product "${prod.name}"?`)) {
    try {
      await state.deleteProduct(id);
      showToast("Product Deleted", `Removed "${prod.name}" from inventory.`, "info");
      renderInventoryTable();
    } catch (err) {
      console.error("Failed to delete product:", err);
      showToast("Error", "Could not remove product from DB.", "error");
    }
  }
}
