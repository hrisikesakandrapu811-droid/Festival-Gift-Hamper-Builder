import { state } from './state.js';
import { initDashboard } from './views/dashboard.js';
import { initBuilder } from './views/builder.js';
import { initOrders } from './views/orders.js';
import { initInventory } from './views/inventory.js';
import { initCustomers } from './views/customers.js';
import { initReports } from './views/reports.js';
import { initSettings } from './views/settings.js';
import { initTracking } from './views/tracking.js';
import { initUserSettings } from './views/user-settings.js';
import { showToast, generateId } from './utils.js';

// DOM Elements
const sidebar = document.querySelector('.sidebar');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.querySelector('.page-title');
const mobileToggle = document.querySelector('.mobile-toggle');
const sidebarOverlay = document.querySelector('.sidebar-overlay');
const themeBtns = document.querySelectorAll('.theme-btn');
const rolePortal = document.getElementById('role-selection-portal');
const menuList = document.getElementById('sidebar-menu-list');

// Mapping pages to their init functions
const viewInitializers = {
  dashboard: initDashboard,
  builder: initBuilder,
  orders: initOrders,
  inventory: initInventory,
  customers: initCustomers,
  reports: initReports,
  settings: initSettings,
  tracking: initTracking,
  'user-settings': initUserSettings
};

const ADMIN_MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'orders', label: 'Orders', icon: 'shopping-cart' },
  { id: 'inventory', label: 'Inventory', icon: 'clipboard-list' },
  { id: 'customers', label: 'Customers', icon: 'users' },
  { id: 'reports', label: 'Reports', icon: 'bar-chart-3' },
  { id: 'settings', label: 'Settings', icon: 'settings' }
];

const USER_MENU = [
  { id: 'builder', label: 'Build Hamper', icon: 'package-plus' },
  { id: 'tracking', label: 'Track Order', icon: 'map-pin' },
  { id: 'user-settings', label: 'Settings', icon: 'settings' }
];

// Routing & View Manager
function handlePageChange(pageId) {
  // 1. Hide all content sections and show active one
  contentSections.forEach(section => {
    if (section.id === `${pageId}-view`) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  });

  // 2. Highlight active menu item
  const menuItems = menuList.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    if (item.dataset.page === pageId) {
      item.classList.add('active');
      const textEl = item.querySelector('.menu-text');
      pageTitle.textContent = textEl ? textEl.textContent : pageId;
    } else {
      item.classList.remove('active');
    }
  });

  // 3. Call view-specific initializer script
  if (viewInitializers[pageId]) {
    try {
      viewInitializers[pageId]();
    } catch (err) {
      console.error(`Error loading page ${pageId}:`, err);
      showToast("View Error", `Failed to initialize view: ${pageId}`, "error");
    }
  }

  // 4. Close mobile sidebar if open
  closeMobileSidebar();
}

// Render dynamic sidebar items
function renderSidebarMenu() {
  const { userRole, activePage } = state.getState();
  if (!userRole) return;

  const menu = userRole === 'admin' ? ADMIN_MENU : USER_MENU;
  menuList.innerHTML = menu.map(item => `
    <li class="menu-item ${activePage === item.id ? 'active' : ''}" data-page="${item.id}">
      <i data-lucide="${item.icon}"></i>
      <span class="menu-text">${item.label}</span>
    </li>
  `).join('');

  // Re-bind click event listeners to new items
  const menuItems = menuList.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.dataset.page;
      state.setPage(pageId);
    });
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Update profile card in sidebar
function updateSidebarProfile(role) {
  const avatarEl = document.getElementById('sidebar-user-avatar');
  const nameEl = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  
  if (role === 'admin') {
    if (avatarEl) avatarEl.textContent = 'PP';
    if (nameEl) nameEl.textContent = state.getState().settings.shopName || 'Manager';
    if (roleEl) roleEl.textContent = 'Paper Plane Admin';
  } else {
    const { currentUser } = state.getState();
    const displayName = currentUser ? currentUser.name : 'Guest Customer';
    const displayRole = currentUser ? 'Registered Customer' : 'Valued Customer';
    
    if (avatarEl) {
      const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      avatarEl.textContent = initials || 'CU';
    }
    if (nameEl) nameEl.textContent = displayName;
    if (roleEl) roleEl.textContent = displayRole;
  }
}

// Handle role transitions
function handleRoleChange(role) {
  const container = document.querySelector('.app-container');
  if (!role) {
    rolePortal.classList.remove('hidden');
    container.style.display = 'none';
    
    // Reset inputs
    const inputs = rolePortal.querySelectorAll('input');
    inputs.forEach(i => i.value = '');

    // Reset views
    document.getElementById('portal-role-selection').classList.remove('hidden');
    document.getElementById('portal-admin-login').classList.add('hidden');
    document.getElementById('portal-customer-auth').classList.add('hidden');
    document.getElementById('portal-subtitle').textContent = "Choose your portal below to continue";
  } else {
    rolePortal.classList.add('hidden');
    container.style.display = 'flex';
    
    updateSidebarProfile(role);
    renderSidebarMenu();
    
    const activePage = state.getState().activePage;
    handlePageChange(activePage);
  }
}

// Mobile sidebar controls
function openMobileSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
}

function closeMobileSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Sync state data on launch
  await state.refreshData();

  // Handle initial role state
  const currentRole = state.getState().userRole;
  handleRoleChange(currentRole);

  // Subscriptions
  state.subscribe('roleChanged', (role) => {
    handleRoleChange(role);
  });

  state.subscribe('pageChanged', (pageId) => {
    if (pageId) {
      handlePageChange(pageId);
    }
  });

  state.subscribe('themeChanged', (theme) => {
    themeBtns.forEach(btn => {
      if (btn.dataset.theme === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  });

  state.subscribe('settingsChanged', (settings) => {
    const currentRole = state.getState().userRole;
    updateSidebarProfile(currentRole);
  });

  // Setup Portal Role Selection buttons
  const btnUser = document.getElementById('btn-select-user');
  const btnAdmin = document.getElementById('btn-select-admin');
  const btnSwitch = document.getElementById('sidebar-switch-role-btn');

  // Views inside portal
  const viewSelection = document.getElementById('portal-role-selection');
  const viewAdminLogin = document.getElementById('portal-admin-login');
  const viewCustomerAuth = document.getElementById('portal-customer-auth');
  const portalSubtitle = document.getElementById('portal-subtitle');

  if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
      viewSelection.classList.add('hidden');
      viewAdminLogin.classList.remove('hidden');
      portalSubtitle.textContent = "Enter store credentials to access manager tools";
    });
  }

  if (btnUser) {
    btnUser.addEventListener('click', () => {
      viewSelection.classList.add('hidden');
      viewCustomerAuth.classList.remove('hidden');
      portalSubtitle.textContent = "Sign in or register to customize your festival gift hamper";
    });
  }

  // Back buttons
  const btnAdminBack = document.getElementById('btn-admin-login-back');
  if (btnAdminBack) {
    btnAdminBack.addEventListener('click', () => {
      viewAdminLogin.classList.add('hidden');
      viewSelection.classList.remove('hidden');
      portalSubtitle.textContent = "Choose your portal below to continue";
    });
  }

  const btnCustBack = document.getElementById('btn-cust-auth-back');
  if (btnCustBack) {
    btnCustBack.addEventListener('click', () => {
      viewCustomerAuth.classList.add('hidden');
      viewSelection.classList.remove('hidden');
      portalSubtitle.textContent = "Choose your portal below to continue";
    });
  }

  // Admin login submission
  const btnAdminSubmit = document.getElementById('btn-admin-login-submit');
  if (btnAdminSubmit) {
    btnAdminSubmit.addEventListener('click', () => {
      const username = document.getElementById('admin-login-username').value.trim();
      const password = document.getElementById('admin-login-password').value;

      if (username.toLowerCase() === 'admin' && password === 'paperplane') {
        showToast("Success", "Welcome, Store Manager!", "success");
        state.setRole('admin');
      } else {
        showToast("Auth Error", "Invalid manager username or password.", "error");
      }
    });
  }

  // Customer portal signin/signup tabs
  const tabSignin = document.getElementById('tab-cust-signin');
  const tabSignup = document.getElementById('tab-cust-signup');
  const formSignin = document.getElementById('form-cust-signin');
  const formSignup = document.getElementById('form-cust-signup');

  if (tabSignin && tabSignup) {
    tabSignin.addEventListener('click', () => {
      tabSignin.classList.add('active');
      tabSignup.classList.remove('active');
      formSignin.classList.remove('hidden');
      formSignup.classList.add('hidden');
    });

    tabSignup.addEventListener('click', () => {
      tabSignup.classList.add('active');
      tabSignin.classList.remove('active');
      formSignup.classList.remove('hidden');
      formSignin.classList.add('hidden');
    });
  }

  // Customer Sign In submission
  const btnCustSigninSubmit = document.getElementById('btn-cust-signin-submit');
  if (btnCustSigninSubmit) {
    btnCustSigninSubmit.addEventListener('click', () => {
      const query = document.getElementById('cust-signin-query').value.trim();
      const password = document.getElementById('cust-signin-password').value;

      if (!query || !password) {
        showToast("Form Error", "Please fill in all sign-in fields.", "warning");
        return;
      }

      const { users } = state.getState();
      const user = users.find(u => (u.email.toLowerCase() === query.toLowerCase() || u.phone === query) && u.password === password);

      if (user) {
        showToast("Welcome Back", `Successfully signed in as ${user.name}!`, "success");
        state.setCurrentUser(user);
        state.setRole('user');
      } else {
        showToast("Login Failed", "Invalid credentials. Please register or verify spelling.", "error");
      }
    });
  }

  // Customer Register submission
  const btnCustSignupSubmit = document.getElementById('btn-cust-signup-submit');
  if (btnCustSignupSubmit) {
    btnCustSignupSubmit.addEventListener('click', async () => {
      const name = document.getElementById('cust-signup-name').value.trim();
      const email = document.getElementById('cust-signup-email').value.trim();
      const phone = document.getElementById('cust-signup-phone').value.trim();
      const password = document.getElementById('cust-signup-password').value;

      // Validations
      if (!name || !email || !phone || !password) {
        showToast("Validation Error", "All registration fields are required.", "warning");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        showToast("Validation Error", "Please provide a valid email structure.", "warning");
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        showToast("Validation Error", "Phone number must be exactly 10 digits.", "warning");
        return;
      }
      if (password.length < 6) {
        showToast("Validation Error", "Password must be at least 6 characters.", "warning");
        return;
      }

      const { users } = state.getState();
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase() || u.phone === phone);
      if (exists) {
        showToast("Registry Alert", "An account with this email or phone is already registered.", "warning");
        return;
      }

      const newUser = {
        id: generateId("USR"),
        name,
        email,
        phone,
        password,
        createdAt: new Date().toISOString()
      };

      try {
        await state.registerUser(newUser);
        showToast("Registration Success", `Welcome to Paper Plane, ${newUser.name}!`, "success");
        state.setCurrentUser(newUser);
        state.setRole('user');
      } catch (err) {
        console.error("Register account error:", err);
        showToast("Internal Error", "Could not register account.", "error");
      }
    });
  }

  if (btnSwitch) {
    btnSwitch.addEventListener('click', () => {
      state.setRole(null);
    });
  }

  // Mobile sidebar toggle clicks
  mobileToggle.addEventListener('click', openMobileSidebar);
  sidebarOverlay.addEventListener('click', closeMobileSidebar);

  // Theme switch buttons clicks
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      state.setTheme(theme);
    });
  });

  // Initialize theme active button
  const currentTheme = state.getState().theme;
  themeBtns.forEach(btn => {
    if (btn.dataset.theme === currentTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Initializing Lucide icons dynamic replacement
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
