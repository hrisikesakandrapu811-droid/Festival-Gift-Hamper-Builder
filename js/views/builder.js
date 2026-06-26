import { state } from '../state.js';
import { formatCurrency, generateId, showToast } from '../utils.js';

const SUBCATEGORIES_MAP = {
  "Festival Hampers": [
    { value: "Diwali", label: "Diwali 🪔" },
    { value: "Christmas", label: "Christmas 🎄" },
    { value: "New Year", label: "New Year ✨" },
    { value: "Sankranti", label: "Sankranti 🪁" },
    { value: "Holi", label: "Holi 🎨" },
    { value: "Eid", label: "Eid 🌙" },
    { value: "Pongal", label: "Pongal 🏺" },
    { value: "Onam", label: "Onam ⛵" }
  ],
  "Personal Occasion Hampers": [
    { value: "Birthday", label: "Birthday 🎂" },
    { value: "Anniversary", label: "Anniversary 💑" },
    { value: "Engagement", label: "Engagement 🥂" },
    { value: "Wedding", label: "Wedding 💍" },
    { value: "Baby Shower", label: "Baby Shower 🍼" },
    { value: "Housewarming", label: "Housewarming 🏡" }
  ],
  "Corporate Gift Hampers": [
    { value: "Employee Gifts", label: "Employee Gifts 💼" },
    { value: "Client Gifts", label: "Client Gifts 🤝" },
    { value: "Corporate Events", label: "Corporate Events 🏢" },
    { value: "Business Promotions", label: "Business Promotions 📈" }
  ],
  "Seasonal & Special Occasion Hampers": [
    { value: "Valentine's Day", label: "Valentine's Day 💖" },
    { value: "Mother's Day", label: "Mother's Day 🌸" },
    { value: "Father's Day", label: "Father's Day 👔" },
    { value: "Women's Day", label: "Women's Day ♀️" },
    { value: "Friendship Day", label: "Friendship Day 🤝" },
    { value: "Teacher's Day", label: "Teacher's Day 🍎" }
  ],
  "Premium & Customized Hampers": [
    { value: "Luxury Hampers", label: "Luxury Hampers 💎" },
    { value: "Personalized Hampers", label: "Personalized Hampers ✨" },
    { value: "Family Hampers", label: "Family Hampers 👨‍👩‍👧‍👦" },
    { value: "Couple Hampers", label: "Couple Hampers 👩‍❤️‍👨" },
    { value: "Kids Hampers", label: "Kids Hampers 🧸" }
  ]
};

// Selected products in the current build process
// Structure: { productId: quantity }
let selectedItems = {};
let selectedPackaging = null;

export function initBuilder() {
  const { products, settings } = state.getState();
  
  // 1. Initialize Default Packaging
  const packagingOptions = settings.packagingOptions || [];
  selectedPackaging = null;

  // Clear builder state when loading fresh
  selectedItems = {};
  resetFormElements();

  // Populate Packaging Selector
  const pkgSelect = document.getElementById('builder-packaging');
  if (pkgSelect) {
    pkgSelect.innerHTML = `
      <option value="" disabled ${!selectedPackaging ? 'selected' : ''}>Select Container...</option>
      ${packagingOptions.map(pkg => `
        <option value="${pkg.name}" ${selectedPackaging && selectedPackaging.name === pkg.name ? 'selected' : ''}>
          ${pkg.name} (${formatCurrency(pkg.price)})
        </option>
      `).join('')}
    `;
  }

  // Render Product List
  renderProductPicker(products);

  // Initial Calculation Renders
  recalculateTotals();

  // Add Event Listeners
  setupBuilderListeners();
}

function resetFormElements() {
  const { currentUser } = state.getState();
  const nameEl = document.getElementById('builder-customer-name');
  const phoneEl = document.getElementById('builder-phone');
  
  if (currentUser) {
    nameEl.value = currentUser.name;
    nameEl.disabled = true;
    phoneEl.value = currentUser.phone;
    phoneEl.disabled = true;
  } else {
    nameEl.value = '';
    nameEl.disabled = false;
    phoneEl.value = '';
    phoneEl.disabled = false;
  }
  
  document.getElementById('builder-recipient-name').value = '';
  document.getElementById('builder-message').value = '';
  
  const majorSelect = document.getElementById('builder-major-category');
  if (majorSelect) {
    majorSelect.value = '';
  }
  const subSelect = document.getElementById('builder-occasion');
  if (subSelect) {
    subSelect.value = '';
    subSelect.disabled = true;
    subSelect.innerHTML = `<option value="" disabled selected>Choose category first...</option>`;
  }
  
  selectedPackaging = null;
  const pkgSelect = document.getElementById('builder-packaging');
  if (pkgSelect) {
    pkgSelect.value = '';
  }

  // Reset visual previews
  updateGreetingCardPreview('', '', '', '');
  updateHamperBasketVisual(null);

  const catSelect = document.getElementById('builder-category-select');
  if (catSelect) {
    catSelect.value = 'All';
  }
}


function renderProductPicker(productsList) {
  const pickerGrid = document.getElementById('builder-product-grid');
  if (!pickerGrid) return;

  if (productsList.length === 0) {
    pickerGrid.innerHTML = `
      <div style="grid-column: 1/-1; padding: 2rem; text-align: center;" class="text-muted">
        No products in inventory. Please add some in the Inventory panel.
      </div>
    `;
    return;
  }

  pickerGrid.innerHTML = productsList.map(prod => {
    const qty = selectedItems[prod.id] || 0;
    const isSelected = qty > 0;
    const isOutOfStock = prod.stock <= 0;
    const isLowStock = prod.stock > 0 && prod.stock <= prod.threshold;

    let stockBadgeClass = 'instock';
    let stockBadgeText = `In Stock (${prod.stock})`;
    if (isOutOfStock) {
      stockBadgeClass = 'outofstock';
      stockBadgeText = 'Out of Stock';
    } else if (isLowStock) {
      stockBadgeClass = 'lowstock';
      stockBadgeText = `Low Stock (${prod.stock})`;
    }

    return `
      <div class="product-pick-card ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'disabled' : ''}" 
           data-id="${prod.id}" 
           style="${isOutOfStock ? 'opacity: 0.6; pointer-events: none;' : ''}">
        <div class="product-pick-name" title="${prod.name}">${prod.name}</div>
        <span class="status-badge ${stockBadgeClass}" style="align-self: flex-start; font-size: 0.65rem; padding: 0.1rem 0.4rem;">
          ${stockBadgeText}
        </span>
        <div class="product-pick-meta">
          <span class="product-pick-price">${formatCurrency(prod.price)}</span>
        </div>
        
        <div class="qty-controller" onclick="event.stopPropagation()">
          <button class="qty-btn minus" data-id="${prod.id}">&minus;</button>
          <span class="qty-val" id="qty-val-${prod.id}">${qty}</span>
          <button class="qty-btn plus" data-id="${prod.id}">&plus;</button>
        </div>
      </div>
    `;
  }).join('');

  // Setup product item click to select (add 1 if 0)
  pickerGrid.querySelectorAll('.product-pick-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const product = productsList.find(p => p.id === id);
      if (product && product.stock > 0) {
        if (!selectedItems[id]) {
          selectedItems[id] = 1;
          document.getElementById(`qty-val-${id}`).textContent = 1;
          card.classList.add('selected');
          recalculateTotals();
        }
      }
    });
  });

  // Setup plus/minus buttons click
  pickerGrid.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const isPlus = btn.classList.contains('plus');
      const product = productsList.find(p => p.id === id);
      if (!product) return;

      let currentQty = selectedItems[id] || 0;
      const card = pickerGrid.querySelector(`.product-pick-card[data-id="${id}"]`);

      if (isPlus) {
        if (currentQty < product.stock) {
          currentQty++;
          selectedItems[id] = currentQty;
          card.classList.add('selected');
        } else {
          showToast("Out of Stock limit", `Only ${product.stock} units available.`, "warning");
        }
      } else {
        if (currentQty > 0) {
          currentQty--;
          if (currentQty === 0) {
            delete selectedItems[id];
            card.classList.remove('selected');
          } else {
            selectedItems[id] = currentQty;
          }
        }
      }

      document.getElementById(`qty-val-${id}`).textContent = currentQty;
      recalculateTotals();
    });
  });
}

function filterProducts() {
  const { products } = state.getState();
  const searchVal = document.getElementById('builder-product-search').value.toLowerCase();
  
  const catSelect = document.getElementById('builder-category-select');
  const catVal = catSelect ? catSelect.value : 'All';

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchVal);
    const matchesCategory = (catVal === 'All' || p.category === catVal);
    return matchesSearch && matchesCategory;
  });

  renderProductPicker(filtered);
}

function setupBuilderListeners() {
  const { products, settings } = state.getState();

  // Product Search input
  const searchInput = document.getElementById('builder-product-search');
  if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
  }

  // Category Selector dropdown
  const catSelect = document.getElementById('builder-category-select');
  if (catSelect) {
    catSelect.addEventListener('change', filterProducts);
  }

  // Packaging select listener
  const pkgSelect = document.getElementById('builder-packaging');
  if (pkgSelect) {
    pkgSelect.addEventListener('change', (e) => {
      const selectedName = e.target.value;
      const pkg = settings.packagingOptions.find(p => p.name === selectedName);
      if (pkg) {
        selectedPackaging = pkg;
        recalculateTotals();
        updateHamperBasketVisual(selectedName);
      }
    });
  }

  // Dynamic occasion subcategory dropdown loader
  const occSelect = document.getElementById('builder-occasion');
  const majorSelect = document.getElementById('builder-major-category');
  if (majorSelect && occSelect) {
    majorSelect.addEventListener('change', (e) => {
      const selectedCat = e.target.value;
      if (SUBCATEGORIES_MAP[selectedCat]) {
        occSelect.disabled = false;
        occSelect.innerHTML = `
          <option value="" disabled selected>Select Subcategory...</option>
          ${SUBCATEGORIES_MAP[selectedCat].map(sub => `
            <option value="${sub.value}">${sub.label}</option>
          `).join('')}
        `;
      } else {
        occSelect.disabled = true;
        occSelect.innerHTML = `<option value="" disabled selected>Choose category first...</option>`;
      }
      updateCardLive();
    });
  }

  // Greeting message keyup listener
  const msgInput = document.getElementById('builder-message');
  const custNameInput = document.getElementById('builder-customer-name');
  const recNameInput = document.getElementById('builder-recipient-name');

  const updateCardLive = () => {
    updateGreetingCardPreview(
      occSelect ? occSelect.value : '',
      msgInput ? msgInput.value : '',
      custNameInput ? custNameInput.value : '',
      recNameInput ? recNameInput.value : ''
    );
  };

  [msgInput, occSelect, custNameInput, recNameInput].forEach(el => {
    if (el) {
      el.addEventListener('input', updateCardLive);
      el.addEventListener('change', updateCardLive);
    }
  });

  // Submit Order Button click
  const submitBtn = document.getElementById('builder-submit-btn');
  if (submitBtn) {
    // Clone button to strip existing listeners and avoid duplicate bindings
    const newBtn = submitBtn.cloneNode(true);
    submitBtn.replaceWith(newBtn);
    newBtn.addEventListener('click', handleOrderSubmission);
  }
}

function recalculateTotals() {
  const { products } = state.getState();
  const summaryList = document.getElementById('builder-summary-items');
  const totalLabel = document.getElementById('builder-total-amount');
  
  if (!summaryList || !totalLabel) return;

  let subtotal = 0;
  const itemsHtml = [];
  const previewChips = [];

  // 1. Gather Selected Products
  Object.entries(selectedItems).forEach(([id, qty]) => {
    const prod = products.find(p => p.id === id);
    if (prod) {
      const itemCost = prod.price * qty;
      subtotal += itemCost;
      
      itemsHtml.push(`
        <div class="invoice-summary-row">
          <span>${prod.name} (x${qty})</span>
          <span>${formatCurrency(itemCost)}</span>
        </div>
      `);

      // Add item chips to display inside the hamper basket visual
      for (let i = 0; i < qty; i++) {
        // Random tilt angle for natural stack effect
        const randomRotate = (Math.random() - 0.5) * 12;
        previewChips.push(`
          <div class="preview-item-chip" style="--rand: ${Math.random()}; transform: rotate(${randomRotate}deg);">
            ${prod.name.split(' ')[0]}
          </div>
        `);
      }
    }
  });

  // 2. Add Packaging Cost
  const pkgCost = selectedPackaging ? selectedPackaging.price : 0;
  const totalAmount = subtotal + pkgCost;

  // Render pricing details
  let html = itemsHtml.join('');
  if (html === '') {
    html = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8125rem;">No products selected yet</div>`;
  }
  
  summaryList.innerHTML = `
    ${html}
    <div class="invoice-summary-row" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--border-color);">
      <span>Packaging: ${selectedPackaging ? selectedPackaging.name : 'None'}</span>
      <span>${formatCurrency(pkgCost)}</span>
    </div>
  `;

  totalLabel.textContent = formatCurrency(totalAmount);

  // 3. Render Item Chips into the Hamper Basket Visual Container
  const itemsWrapper = document.getElementById('basket-items-layer');
  if (itemsWrapper) {
    itemsWrapper.innerHTML = previewChips.join('');
  }
}

function updateHamperBasketVisual(pkgName) {
  const basket = document.getElementById('hamper-basket-body');
  if (!basket) return;

  // Clear existing classes
  basket.className = "basket-body";
  
  const parent = basket.parentElement; // .hamper-visual-preview
  if (parent) {
    // Reset all parent classes to default
    parent.className = "hamper-visual-preview";
    if (!pkgName) {
      parent.classList.add("no-packaging");
      return;
    }
    if (pkgName.includes("Cardboard")) {
      parent.classList.add("shape-cardboard-box");
    } else if (pkgName.includes("Wooden") || pkgName.includes("Tray")) {
      parent.classList.add("shape-wooden-tray");
    } else if (pkgName.includes("Festive")) {
      parent.classList.add("shape-festive-box");
    } else if (pkgName.includes("Corporate")) {
      parent.classList.add("shape-corporate-box");
    } else if (pkgName.includes("Luxury")) {
      parent.classList.add("shape-luxury-basket");
    } else if (pkgName.includes("Premium") || pkgName.includes("Basket")) {
      parent.classList.add("shape-premium-basket");
    }
  }
  
  // Set packaging type colors
  if (pkgName.includes("Cardboard")) {
    basket.classList.add("packaging-cardboard");
  } else if (pkgName.includes("Wooden")) {
    basket.classList.add("packaging-wooden");
  } else if (pkgName.includes("Festive")) {
    basket.classList.add("packaging-festive");
  } else if (pkgName.includes("Corporate")) {
    basket.classList.add("packaging-corporate");
  } else if (pkgName.includes("Luxury")) {
    basket.classList.add("packaging-luxury");
  } else if (pkgName.includes("Basket") || pkgName.includes("Premium")) {
    basket.classList.add("packaging-basket");
  } else {
    basket.classList.add("packaging-glass");
  }
}

const OCCASION_MESSAGES = {
  // 1. Festival Hampers
  "Diwali": "May the light of diyas illuminate your home with wealth and prosperity! Wishing you and your family a glowing, happy, and safe Diwali!",
  "Christmas": "Merry Christmas! May your days be warm, bright, and filled with joy and laughter. Wishing you a peaceful holiday season.",
  "New Year": "Cheers to a beautiful and prosperous New Year! May 2026 bring you endless success, good health, and joyful moments.",
  "Sankranti": "Wishing you a harvest of joy, prosperity, and sweet moments this Makar Sankranti. Happy flying!",
  "Holi": "May your life be painted with the vibrant and joyous colors of Holi! Wishing you a splashing good time and happy memories.",
  "Eid": "Eid Mubarak! May the blessings of Allah fill your life with peace, joy, and prosperity today and always.",
  "Pongal": "May this Pongal bring abundance, happiness, and prosperity to your home. Have a wonderful and delicious harvest festival!",
  "Onam": "Wishing you a harvest of happiness, prosperity, and peace on the festive occasion of Onam. Happy Onam!",

  // 2. Personal Occasion Hampers
  "Birthday": "Happy Birthday! Wishing you a fantastic day ahead filled with love, laughter, and all your heart's desires. Have a blast!",
  "Anniversary": "Happy Anniversary! Here's to another beautiful year of love, partnership, and unforgettable memories together.",
  "Engagement": "Congratulations on your engagement! Wishing you a lifetime of love, laughter, and wonderful adventures on this new journey.",
  "Wedding": "Best wishes on your wedding day! May your love grow stronger with each passing year, and may your home be filled with joy.",
  "Baby Shower": "Congratulations on your bundle of joy! Wishing you all the love, happiness, and sweet moments as you welcome your little one.",
  "Housewarming": "Congratulations on your new home! May it be filled with warm memories, laughter, peace, and abundance for years to come.",

  // 3. Corporate Gift Hampers
  "Employee Gifts": "Thank you for your hard work and outstanding dedication to our team. We are proud and grateful to have you with us!",
  "Client Gifts": "With our sincere appreciation for your valuable partnership. We look forward to many more years of successful collaboration.",
  "Corporate Events": "Celebrating milestones and looking forward to a bright future. Thank you for being an essential part of our journey.",
  "Business Promotions": "A premium token of our appreciation for your partnership. Here's to achieving greater heights together.",

  // 4. Seasonal & Special Occasion Hampers
  "Valentine's Day": "Happy Valentine's Day! You make my heart full and my life incredibly beautiful. Sending you all my love today and forever.",
  "Mother's Day": "Happy Mother's Day to the most amazing mom! Thank you for your endless love, patience, and support. You are my inspiration.",
  "Father's Day": "Happy Father's Day! Thank you for your strength, wisdom, guidance, and for always being there for me. You're the best!",
  "Women's Day": "Happy International Women's Day! Celebrating your strength, grace, resilience, and the incredible impact you make every day.",
  "Friendship Day": "Happy Friendship Day! Grateful for your presence in my life, the constant laughs, and the beautiful bond we share.",
  "Teacher's Day": "Happy Teacher's Day! Thank you for your patience, guidance, and for inspiring us to achieve our best. You are truly valued.",

  // 5. Premium & Customized Hampers
  "Luxury Hampers": "A curated selection of refined delights, handpicked to deliver an extraordinary experience of pure luxury.",
  "Personalized Hampers": "Crafted with special attention and personalized elements, designed uniquely to bring a warm smile to your face.",
  "Family Hampers": "Warmest wishes of togetherness, health, and joy to you and your beautiful family. From our family to yours.",
  "Couple Hampers": "Wishing a wonderful couple a lifetime of love, shared dreams, and beautiful moments together. Cheers to you!",
  "Kids Hampers": "A bundle of sweet surprises, fun treats, and pure joy, just for you! Have a super fun and playful day!"
};

function updateGreetingCardPreview(occasion, message, customer, recipient) {
  const card = document.getElementById('greeting-card-preview');
  if (!card) return;

  // Reset classes
  card.className = "greeting-card-preview";

  const defaultMsg = occasion ? (OCCASION_MESSAGES[occasion] || `Wishing you a joyful and wonderful celebration!`) : `Wishing you a joyful and wonderful celebration!`;
  const cleanMessage = message.trim() || defaultMsg;
  const signatureFrom = customer.trim() ? `From: ${customer}` : "";
  const headerTo = recipient.trim() ? `To: ${recipient}` : "Best Wishes";

  // Dynamic input placeholder update
  const msgInput = document.getElementById('builder-message');
  if (msgInput) {
    msgInput.placeholder = defaultMsg;
  }

  let themeClass = "card-theme-default";
  let greetingTitle = occasion ? "Warm Wishes" : "Greeting Card";

  const cardThemes = {
    // 1. Festival Hampers
    "Diwali": { theme: "card-theme-diwali", title: "Happy Diwali" },
    "Christmas": { theme: "card-theme-christmas", title: "Merry Christmas" },
    "New Year": { theme: "card-theme-newyear", title: "Happy New Year" },
    "Sankranti": { theme: "card-theme-sankranti", title: "Happy Sankranti" },
    "Holi": { theme: "card-theme-holi", title: "Happy Holi" },
    "Eid": { theme: "card-theme-eid", title: "Eid Mubarak" },
    "Pongal": { theme: "card-theme-pongal", title: "Happy Pongal" },
    "Onam": { theme: "card-theme-onam", title: "Happy Onam" },

    // 2. Personal Occasion Hampers
    "Birthday": { theme: "card-theme-birthday", title: "Happy Birthday" },
    "Anniversary": { theme: "card-theme-anniversary", title: "Happy Anniversary" },
    "Engagement": { theme: "card-theme-engagement", title: "Happy Engagement" },
    "Wedding": { theme: "card-theme-wedding", title: "Congratulations" },
    "Baby Shower": { theme: "card-theme-babyshower", title: "Happy Baby Shower" },
    "Housewarming": { theme: "card-theme-housewarming", title: "Happy Housewarming" },

    // 3. Corporate Gift Hampers
    "Employee Gifts": { theme: "card-theme-corp-welcome", title: "For Our Employee" },
    "Client Gifts": { theme: "card-theme-corp-appreciation", title: "With Our Appreciation" },
    "Corporate Events": { theme: "card-theme-corp-event", title: "Corporate Event" },
    "Business Promotions": { theme: "card-theme-corp-premium", title: "Executive Gift" },

    // 4. Seasonal & Special Occasion Hampers
    "Valentine's Day": { theme: "card-theme-valentines", title: "Happy Valentine's Day" },
    "Mother's Day": { theme: "card-theme-mothersday", title: "Happy Mother's Day" },
    "Father's Day": { theme: "card-theme-fathersday", title: "Happy Father's Day" },
    "Women's Day": { theme: "card-theme-womensday", title: "Happy Women's Day" },
    "Friendship Day": { theme: "card-theme-friendship", title: "Happy Friendship Day" },
    "Teacher's Day": { theme: "card-theme-teachersday", title: "Happy Teacher's Day" },

    // 5. Premium & Customized Hampers
    "Luxury Hampers": { theme: "card-theme-luxury", title: "Luxury Collection" },
    "Personalized Hampers": { theme: "card-theme-personalized", title: "Personalized Gift" },
    "Family Hampers": { theme: "card-theme-family", title: "Warmest Wishes" },
    "Couple Hampers": { theme: "card-theme-couple", title: "Best Wishes" },
    "Kids Hampers": { theme: "card-theme-kids", title: "Just for You" }
  };

  if (occasion && cardThemes[occasion]) {
    themeClass = cardThemes[occasion].theme;
    greetingTitle = cardThemes[occasion].title;
  }

  card.classList.add(themeClass);
  card.innerHTML = `
    <div class="card-occasion-title">${greetingTitle}</div>
    <div style="font-size: 0.7rem; font-weight: 700; opacity: 0.8; margin-bottom: 0.5rem;">${headerTo}</div>
    <div class="card-message-text">${cleanMessage}</div>
    <div class="card-signature">${signatureFrom}</div>
  `;
}

async function handleOrderSubmission() {
  const custName = document.getElementById('builder-customer-name').value.trim();
  const phone = document.getElementById('builder-phone').value.trim();
  const recName = document.getElementById('builder-recipient-name').value.trim();
  const occasion = document.getElementById('builder-occasion').value;
  const message = document.getElementById('builder-message').value.trim();

  // Validations
  if (!custName) {
    showToast("Input Error", "Please provide a customer name.", "warning");
    document.getElementById('builder-customer-name').focus();
    return;
  }
  if (!phone || !/^\d{10}$/.test(phone)) {
    showToast("Input Error", "Please enter an exact 10-digit phone number.", "warning");
    document.getElementById('builder-phone').focus();
    return;
  }
  if (!recName) {
    showToast("Input Error", "Please specify a recipient name.", "warning");
    document.getElementById('builder-recipient-name').focus();
    return;
  }
  if (!occasion) {
    showToast("Input Error", "Please select a festival occasion.", "warning");
    document.getElementById('builder-occasion').focus();
    return;
  }
  if (!selectedPackaging) {
    showToast("Input Error", "Please select a packaging container.", "warning");
    document.getElementById('builder-packaging').focus();
    return;
  }
  if (Object.keys(selectedItems).length === 0) {
    showToast("Hamper is empty", "Add at least one product to the hamper.", "warning");
    return;
  }

  // Calculate prices
  const { products } = state.getState();
  let subtotal = 0;
  const itemsArray = [];

  for (const [id, qty] of Object.entries(selectedItems)) {
    const prod = products.find(p => p.id === id);
    if (prod) {
      // Re-verify stock levels
      if (prod.stock < qty) {
        showToast("Stock Insufficient", `Insufficient stock for ${prod.name}. Available: ${prod.stock}`, "error");
        return;
      }
      subtotal += prod.price * qty;
      itemsArray.push({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        qty: qty
      });
    }
  }

  const pkgCost = selectedPackaging ? selectedPackaging.price : 0;
  const totalVal = subtotal + pkgCost;

  const newOrder = {
    id: generateId("ORD"),
    customerName: custName,
    phoneNumber: phone,
    recipientName: recName,
    occasion: occasion,
    packagingType: selectedPackaging ? selectedPackaging.name : 'Standard Box',
    packagingPrice: pkgCost,
    items: itemsArray,
    personalMessage: message || `Wishing you a joyful and wonderful celebration!`,
    totalAmount: totalVal,
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  try {
    // Save order
    await state.addOrder(newOrder);
    showToast("Success!", `Order ${newOrder.id} has been created and registered.`, "success");
    
    // Switch page based on active role
    const { userRole } = state.getState();
    if (userRole === 'admin') {
      state.setPage('orders');
    } else {
      localStorage.setItem('pp_track_order_id', newOrder.id);
      state.setPage('tracking');
    }
  } catch (error) {
    console.error("Order submit failed:", error);
    showToast("Submission Error", "Failed to save order.", "error");
  }
}
