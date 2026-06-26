import { db } from './db.js';

// Simple Pub/Sub State Store
class AppState {
  constructor() {
    this.listeners = {};
    this.state = {
      activePage: 'dashboard',
      theme: localStorage.getItem('pp_theme') || 'light',
      userRole: localStorage.getItem('pp_user_role') || null,
      currentUser: JSON.parse(localStorage.getItem('pp_current_user')) || null,
      products: [],
      orders: [],
      users: [],
      settings: db.getSettings()
    };
    
    // Apply initial theme
    document.documentElement.setAttribute('data-theme', this.state.theme);
  }

  // Subscribe to state changes
  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  // Publish changes
  publish(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // State Getters/Setters
  getState() {
    return this.state;
  }

  async refreshData() {
    this.state.products = await db.getProducts();
    this.state.orders = await db.getOrders();
    this.state.users = await db.getUsers();
    this.state.settings = db.getSettings();
    this.publish('dataChanged', this.state);
  }

  setRole(role) {
    this.state.userRole = role;
    if (role) {
      localStorage.setItem('pp_user_role', role);
      this.state.activePage = role === 'admin' ? 'dashboard' : 'builder';
    } else {
      localStorage.removeItem('pp_user_role');
      this.state.activePage = '';
      this.setCurrentUser(null);
    }
    this.publish('roleChanged', role);
    this.publish('pageChanged', this.state.activePage);
  }

  setCurrentUser(user) {
    this.state.currentUser = user;
    if (user) {
      localStorage.setItem('pp_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pp_current_user');
    }
    this.publish('userChanged', user);
  }

  async registerUser(user) {
    await db.saveUser(user);
    await this.refreshData();
  }

  setPage(page) {
    this.state.activePage = page;
    this.publish('pageChanged', page);
  }

  setTheme(theme) {
    this.state.theme = theme;
    localStorage.setItem('pp_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.publish('themeChanged', theme);
  }

  async addOrder(order) {
    await db.saveOrder(order);
    await this.refreshData();
  }

  async updateOrder(order) {
    await db.saveOrder(order);
    await this.refreshData();
  }

  async deleteOrder(orderId) {
    await db.deleteOrder(orderId);
    await this.refreshData();
  }

  async addProduct(product) {
    await db.saveProduct(product);
    await this.refreshData();
  }

  async updateProduct(product) {
    await db.saveProduct(product);
    await this.refreshData();
  }

  async deleteProduct(productId) {
    await db.deleteProduct(productId);
    await this.refreshData();
  }

  updateSettings(settings) {
    db.saveSettings(settings);
    this.state.settings = settings;
    this.publish('settingsChanged', settings);
    this.refreshData();
  }
}

export const state = new AppState();
// Initial fetch
state.refreshData();
