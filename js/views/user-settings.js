import { state } from '../state.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';

export function initUserSettings() {
  loadProfileForm();
  setupUserSettingsListeners();
  renderUserHistory();
}

function loadProfileForm() {
  const { currentUser } = state.getState();
  const nameInput = document.getElementById('user-set-name');
  const phoneInput = document.getElementById('user-set-phone');
  const emailInput = document.getElementById('user-set-email');

  if (!currentUser) {
    if (nameInput) nameInput.value = '';
    if (phoneInput) { phoneInput.value = ''; phoneInput.disabled = false; }
    if (emailInput) emailInput.value = '';
    return;
  }

  if (nameInput) nameInput.value = currentUser.name || '';
  if (phoneInput) {
    phoneInput.value = currentUser.phone || '';
    phoneInput.disabled = true; // Lock phone number to maintain database integrity
  }
  if (emailInput) emailInput.value = currentUser.email || '';
}

function setupUserSettingsListeners() {
  // Save profile button
  const saveBtn = document.getElementById('user-settings-save-btn');
  if (saveBtn) {
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.replaceWith(newSaveBtn);
    newSaveBtn.addEventListener('click', handleSaveProfile);
  }

  // Theme switch buttons in user settings
  const themeBtns = document.querySelectorAll('#user-settings-view .theme-btn');
  themeBtns.forEach(btn => {
    // Remove old listeners and clone
    const newBtn = btn.cloneNode(true);
    btn.replaceWith(newBtn);
    
    newBtn.addEventListener('click', () => {
      state.setTheme(newBtn.dataset.theme);
      updateThemeButtons();
    });
  });

  updateThemeButtons();
}

function updateThemeButtons() {
  const currentTheme = state.getState().theme;
  const themeBtns = document.querySelectorAll('#user-settings-view .theme-btn');
  themeBtns.forEach(btn => {
    if (btn.dataset.theme === currentTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

async function handleSaveProfile() {
  const name = document.getElementById('user-set-name').value.trim();
  const email = document.getElementById('user-set-email').value.trim();

  // Validation
  if (!name) {
    showToast("Validation Error", "Please enter your name.", "warning");
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showToast("Validation Error", "Please enter a valid email address.", "warning");
    return;
  }

  const { currentUser } = state.getState();
  if (!currentUser) return;

  const updatedUser = {
    ...currentUser,
    name,
    email
  };

  try {
    const { db } = await import('../db.js');
    await db.saveUser(updatedUser);
    state.setCurrentUser(updatedUser);
    await state.refreshData();

    showToast("Profile Updated", "Your profile details have been saved successfully.", "success");

    // Update profile avatar and label in sidebar immediately
    const avatarEl = document.getElementById('sidebar-user-avatar');
    const nameEl = document.getElementById('sidebar-user-name');
    
    if (nameEl) nameEl.textContent = name;
    if (avatarEl) {
      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      avatarEl.textContent = initials || 'CU';
    }
  } catch (err) {
    console.error("Save profile error:", err);
    showToast("Update Failed", "Could not save profile modifications.", "error");
  }
}

function renderUserHistory() {
  const historyList = document.getElementById('user-history-list');
  if (!historyList) return;

  const { currentUser } = state.getState();

  if (!currentUser || !currentUser.phone) {
    historyList.innerHTML = `
      <div style="padding: 1.5rem; text-align: center; border: 1px dashed var(--border-color); border-radius: var(--radius-md);" class="text-muted">
        Sign in to view your purchase order history here.
      </div>
    `;
    return;
  }

  const { orders } = state.getState();
  const userOrders = orders.filter(o => o.phoneNumber === currentUser.phone);

  if (userOrders.length === 0) {
    historyList.innerHTML = `
      <div style="padding: 1.5rem; text-align: center; border: 1px dashed var(--border-color); border-radius: var(--radius-md);" class="text-muted">
        No orders found for phone number ${currentUser.phone}.
      </div>
    `;
    return;
  }

  historyList.innerHTML = userOrders.map(order => `
    <div class="user-history-item-card animate-fade" data-id="${order.id}" style="cursor: pointer; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-secondary); transition: var(--transition);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
        <span style="font-family: var(--font-sans); font-weight: 600; color: var(--gold);">${order.id}</span>
        <span class="status-badge ${order.status.toLowerCase()}" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">${order.status}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem;" class="text-muted">
        <span>To: ${order.recipientName} (${order.occasion})</span>
        <span class="font-semibold">${formatCurrency(order.totalAmount)}</span>
      </div>
    </div>
  `).join('');

  // Bind click handler to trace order
  historyList.querySelectorAll('.user-history-item-card').forEach(card => {
    card.addEventListener('click', () => {
      const orderId = card.dataset.id;
      localStorage.setItem('pp_track_order_id', orderId);
      state.setPage('tracking');
    });
    
    // Add hover effect style dynamically if not styled
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = 'var(--gold)';
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = 'var(--shadow-sm)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = 'var(--border-color)';
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
    });
  });
}
