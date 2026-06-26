import { state } from '../state.js';
import { showToast } from '../utils.js';

export function initSettings() {
  renderSettingsForm();
  setupSettingsListeners();
}

function renderSettingsForm() {
  const { settings } = state.getState();

  // General settings
  document.getElementById('set-shop-name').value = settings.shopName || "Paper Plane";
  document.getElementById('set-currency').value = settings.currencySymbol || "₹";

  // Packaging prices
  const pkgOptions = settings.packagingOptions || [];
  pkgOptions.forEach((pkg, index) => {
    const inputId = `set-pkg-price-${index}`;
    const inputEl = document.getElementById(inputId);
    if (inputEl) {
      inputEl.value = pkg.price;
    }
  });
}

function setupSettingsListeners() {
  // Save Settings Button
  const saveBtn = document.getElementById('settings-save-btn');
  if (saveBtn) {
    const newBtn = saveBtn.cloneNode(true);
    saveBtn.replaceWith(newBtn);
    newBtn.addEventListener('click', handleSaveSettings);
  }

  // Data Actions
  const clearBtn = document.getElementById('settings-clear-all-btn');
  if (clearBtn) {
    const newBtn = clearBtn.cloneNode(true);
    clearBtn.replaceWith(newBtn);
    newBtn.addEventListener('click', handleClearAll);
  }
}

async function handleSaveSettings() {
  const shopName = document.getElementById('set-shop-name').value.trim();
  const currencySymbol = document.getElementById('set-currency').value;

  if (!shopName) {
    showToast("Validation Error", "Please provide a valid shop name.", "warning");
    return;
  }

  // Re-read packaging inputs
  const { settings } = state.getState();
  const currentPkg = settings.packagingOptions || [];
  const updatedPkg = currentPkg.map((pkg, index) => {
    const inputVal = parseFloat(document.getElementById(`set-pkg-price-${index}`).value);
    return {
      name: pkg.name,
      price: isNaN(inputVal) || inputVal < 0 ? 0 : inputVal
    };
  });

  const updatedSettings = {
    shopName,
    currencySymbol,
    packagingOptions: updatedPkg
  };

  try {
    state.updateSettings(updatedSettings);
    showToast("Settings Saved", "Global configurations updated successfully.", "success");
    
    // Update logo brand name visual immediately
    const brandLabel = document.querySelector('.sidebar-brand');
    if (brandLabel) brandLabel.textContent = shopName;
    
  } catch (err) {
    console.error("Save settings error:", err);
    showToast("Save Error", "Failed to commit settings to disk.", "error");
  }
}

async function handleClearAll() {
  if (confirm("Are you sure you want to clear all data? This will permanently delete all products, hampers, orders, and inventory records. This action cannot be undone.")) {
    try {
      const { db } = await import('../db.js');
      await db.clearAllData();
      await state.refreshData();
      
      showToast("Database Cleared", "All products, orders, and inventory logs have been removed.", "info");
      
      renderSettingsForm();
    } catch (err) {
      console.error("Clear database error:", err);
      showToast("Clear Failed", "Could not prune local collections.", "error");
    }
  }
}
