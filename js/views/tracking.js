import { state } from '../state.js';
import { formatCurrency, formatDate, showToast } from '../utils.js';

export function initTracking() {
  setupTrackingListeners();
  
  // Check if there is an order ID in localStorage to track immediately (from redirect)
  const redirectOrderId = localStorage.getItem('pp_track_order_id');
  if (redirectOrderId) {
    localStorage.removeItem('pp_track_order_id');
    const input = document.getElementById('track-search-input');
    if (input) {
      input.value = redirectOrderId;
      performTrackSearch(redirectOrderId);
    }
  } else {
    // If the customer profile has a saved phone, pre-fill and search
    let profile = null;
    try {
      const saved = localStorage.getItem('pp_user_profile');
      if (saved) profile = JSON.parse(saved);
    } catch (e) {}

    if (profile && profile.phone) {
      const input = document.getElementById('track-search-input');
      if (input && !input.value) {
        input.value = profile.phone;
        performTrackSearch(profile.phone);
      }
    }
  }
}

function setupTrackingListeners() {
  const searchBtn = document.getElementById('track-search-btn');
  const searchInput = document.getElementById('track-search-input');

  if (searchBtn && searchInput) {
    // Re-bind click listener
    const newSearchBtn = searchBtn.cloneNode(true);
    searchBtn.replaceWith(newSearchBtn);
    
    newSearchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (!query) {
        showToast("Empty Search", "Please enter an Order ID or phone number to track.", "warning");
        return;
      }
      performTrackSearch(query);
    });

    // Enter key listener
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) performTrackSearch(query);
      }
    });
  }
}

function performTrackSearch(query) {
  const { orders } = state.getState();
  const matchesContainer = document.getElementById('track-matches-container');
  const matchesGrid = document.getElementById('track-matches-grid');
  const resultsCard = document.getElementById('tracking-results-card');

  // Hide everything initially
  matchesContainer.classList.add('hidden');
  resultsCard.classList.add('hidden');

  // Check if query is 10 digit phone number
  if (/^\d{10}$/.test(query)) {
    const matchingOrders = orders.filter(o => o.phoneNumber === query);
    
    if (matchingOrders.length === 0) {
      showToast("No Orders Found", "No orders found associated with that phone number.", "info");
      return;
    }

    // Display matching orders list
    matchesContainer.classList.remove('hidden');
    matchesGrid.innerHTML = matchingOrders.map(order => `
      <div class="track-match-item-card animate-fade" data-id="${order.id}">
        <div class="match-header">
          <span class="match-id">${order.id}</span>
          <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
        </div>
        <div class="match-body">
          <p><strong>To:</strong> ${order.recipientName}</p>
          <p><strong>Occasion:</strong> ${order.occasion}</p>
          <p><strong>Total:</strong> ${formatCurrency(order.totalAmount)}</p>
          <p class="text-muted" style="font-size: 0.7rem; margin-top: 0.25rem;">Placed ${formatDate(order.createdAt, true)}</p>
        </div>
      </div>
    `).join('');

    // Add click listeners to matches cards
    matchesGrid.querySelectorAll('.track-match-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const orderId = card.dataset.id;
        renderTrackedOrder(orderId);
      });
    });

  } else {
    // Search by Order ID
    const order = orders.find(o => o.id.toUpperCase() === query.toUpperCase());
    if (!order) {
      showToast("Order Not Found", `Could not find order matching ID "${query}". Please check the ID and try again.`, "warning");
      return;
    }
    renderTrackedOrder(order.id);
  }
}

function renderTrackedOrder(orderId) {
  const { orders } = state.getState();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const resultsCard = document.getElementById('tracking-results-card');
  resultsCard.classList.remove('hidden');

  // Set ID & Status
  document.getElementById('track-order-id').textContent = order.id;
  const statusBadge = document.getElementById('track-order-status-badge');
  statusBadge.className = `status-badge ${order.status.toLowerCase()}`;
  statusBadge.textContent = order.status;

  // Render Stepper nodes & connectors
  const nodes = ['pending', 'assembled', 'shipped', 'delivered'];
  const statusHierarchy = {
    'Pending': 1,
    'Assembled': 2,
    'Shipped': 3,
    'Delivered': 4
  };
  
  const currentStep = statusHierarchy[order.status] || 1;

  // Update nodes
  nodes.forEach((node, index) => {
    const el = document.getElementById(`step-node-${node}`);
    if (el) {
      if (index + 1 <= currentStep) {
        el.classList.add('active');
        if (index + 1 === currentStep) {
          el.classList.add('current');
        } else {
          el.classList.remove('current');
        }
      } else {
        el.classList.remove('active', 'current');
      }
    }
  });

  // Update connectors
  const connectors = ['assembled', 'shipped', 'delivered'];
  connectors.forEach((conn, index) => {
    const el = document.getElementById(`connector-${conn}`);
    if (el) {
      if (index + 2 <= currentStep) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    }
  });

  // Status message
  const descEl = document.getElementById('track-status-description');
  const descriptions = {
    'Pending': 'We have received your order details. Our gift artisans will start assembling your handcrafted basket shortly.',
    'Assembled': 'Your gift hamper has been fully assembled, wrapped with premium decoration, and is waiting to be collected by our dispatch carrier.',
    'Shipped': 'Your hamper is currently in transit with our logistics carrier. It is on its way to bring joy to the recipient!',
    'Delivered': 'Wonderful news! Your gift hamper has been successfully delivered. We hope it made their occasion brighter and more memorable!'
  };
  descEl.textContent = descriptions[order.status] || 'Order details loaded successfully.';

  // Transit Logs
  renderTransitLog(order);

  // Greeting Card visual
  renderGreetingCard(order);

  // Invoice breakdown
  document.getElementById('track-recipient-name').textContent = order.recipientName;
  document.getElementById('track-occasion').textContent = order.occasion;
  document.getElementById('track-packaging-type').textContent = `${order.packagingType} (${formatCurrency(order.packagingPrice)})`;

  const itemsListEl = document.getElementById('track-items-list');
  itemsListEl.innerHTML = order.items.map(item => `
    <li style="display: flex; justify-content: space-between; align-items: center;">
      <span>${item.name} <span class="text-muted" style="font-size: 0.75rem;">(x${item.qty})</span></span>
      <span>${formatCurrency(item.price * item.qty)}</span>
    </li>
  `).join('');

  document.getElementById('track-total-amount').textContent = formatCurrency(order.totalAmount);

  // Scroll results card into view smoothly
  resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderTransitLog(order) {
  const logEl = document.getElementById('tracking-timeline-log');
  if (!logEl) return;

  const baseTime = new Date(order.createdAt);
  
  // Helpers to add time
  const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

  const logs = [];

  // Log 1: Order Placed (Always shown)
  logs.push({
    title: "Order Placed & Confirmed",
    desc: "Your transaction was successfully processed. Order entered production queue.",
    time: baseTime
  });

  const statusHierarchy = {
    'Pending': 1,
    'Assembled': 2,
    'Shipped': 3,
    'Delivered': 4
  };
  
  const currentStep = statusHierarchy[order.status] || 1;

  // Log 2: Assembled (Shown if Assembled, Shipped, or Delivered)
  if (currentStep >= 2) {
    logs.push({
      title: "Gift Hamper Assembled & Decorated",
      desc: `Hamper packed in ${order.packagingType} container and greeting card attached.`,
      time: addMinutes(baseTime, 45)
    });
  }

  // Log 3: Shipped (Shown if Shipped or Delivered)
  if (currentStep >= 3) {
    logs.push({
      title: "Dispatched from Hub",
      desc: "Order picked up by courier partner and is currently in transit.",
      time: addMinutes(baseTime, 135)
    });
  }

  // Log 4: Delivered (Only if status is Delivered)
  if (currentStep >= 4) {
    logs.push({
      title: "Delivered to Destination",
      desc: `Successfully delivered and received by ${order.recipientName}.`,
      time: addMinutes(baseTime, 270)
    });
  }

  // Render logs in reverse chronological order
  logEl.innerHTML = logs.reverse().map(log => `
    <li class="timeline-log-item animate-fade">
      <div class="log-indicator"></div>
      <div class="log-content">
        <div class="log-title">${log.title}</div>
        <div class="log-desc">${log.desc}</div>
        <div class="log-time">${formatDate(log.time, true)}</div>
      </div>
    </li>
  `).join('');
}

function renderGreetingCard(order) {
  const card = document.getElementById('track-greeting-card');
  if (!card) return;

  // Clear existing themes
  card.className = "greeting-card-preview";

  let themeClass = "card-theme-default";
  let greetingTitle = "Warm Wishes";

  const cardThemes = {
    "Diwali": { theme: "card-theme-diwali", title: "Happy Diwali" },
    "Christmas": { theme: "card-theme-christmas", title: "Merry Christmas" },
    "New Year": { theme: "card-theme-newyear", title: "Happy New Year" },
    "Sankranti": { theme: "card-theme-sankranti", title: "Happy Sankranti" },
    "Holi": { theme: "card-theme-holi", title: "Happy Holi" },
    "Eid": { theme: "card-theme-eid", title: "Eid Mubarak" },
    "Pongal": { theme: "card-theme-pongal", title: "Happy Pongal" },
    "Onam": { theme: "card-theme-onam", title: "Happy Onam" },
    "Birthday": { theme: "card-theme-birthday", title: "Happy Birthday" },
    "Anniversary": { theme: "card-theme-anniversary", title: "Happy Anniversary" },
    "Engagement": { theme: "card-theme-engagement", title: "Happy Engagement" },
    "Wedding": { theme: "card-theme-wedding", title: "Congratulations" },
    "Baby Shower": { theme: "card-theme-babyshower", title: "Happy Baby Shower" },
    "Housewarming": { theme: "card-theme-housewarming", title: "Happy Housewarming" },
    "Employee Gifts": { theme: "card-theme-corp-welcome", title: "For Our Employee" },
    "Client Gifts": { theme: "card-theme-corp-appreciation", title: "With Our Appreciation" },
    "Corporate Events": { theme: "card-theme-corp-event", title: "Corporate Event" },
    "Business Promotions": { theme: "card-theme-corp-premium", title: "Executive Gift" },
    "Valentine's Day": { theme: "card-theme-valentines", title: "Happy Valentine's Day" },
    "Mother's Day": { theme: "card-theme-mothersday", title: "Happy Mother's Day" },
    "Father's Day": { theme: "card-theme-fathersday", title: "Happy Father's Day" },
    "Women's Day": { theme: "card-theme-womensday", title: "Happy Women's Day" },
    "Friendship Day": { theme: "card-theme-friendship", title: "Happy Friendship Day" },
    "Teacher's Day": { theme: "card-theme-teachersday", title: "Happy Teacher's Day" },
    "Luxury Hampers": { theme: "card-theme-luxury", title: "Luxury Collection" },
    "Personalized Hampers": { theme: "card-theme-personalized", title: "Personalized Gift" },
    "Family Hampers": { theme: "card-theme-family", title: "Warmest Wishes" },
    "Couple Hampers": { theme: "card-theme-couple", title: "Best Wishes" },
    "Kids Hampers": { theme: "card-theme-kids", title: "Just for You" }
  };

  const occ = order.occasion;
  if (occ && cardThemes[occ]) {
    themeClass = cardThemes[occ].theme;
    greetingTitle = cardThemes[occ].title;
  }

  const cleanMessage = order.personalMessage || `Wishing you a joyful and wonderful celebration!`;
  const signatureFrom = order.customerName ? `From: ${order.customerName}` : "";
  const headerTo = order.recipientName ? `To: ${order.recipientName}` : "Best Wishes";

  card.classList.add(themeClass);
  card.innerHTML = `
    <div class="card-occasion-title">${greetingTitle}</div>
    <div style="font-size: 0.7rem; font-weight: 700; opacity: 0.8; margin-bottom: 0.5rem;">${headerTo}</div>
    <div class="card-message-text">${cleanMessage}</div>
    <div class="card-signature">${signatureFrom}</div>
  `;
}
