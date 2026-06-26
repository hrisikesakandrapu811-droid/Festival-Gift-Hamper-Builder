// Database Wrapper (LocalStorage)

const DEFAULT_PRODUCTS = [
  { id: "p1", name: "Dairy Milk", category: "Chocolates & Sweets", price: 80, stock: 50, threshold: 10 },
  { id: "p2", name: "Ferrero Rocher", category: "Chocolates & Sweets", price: 350, stock: 30, threshold: 8 },
  { id: "p3", name: "KitKat", category: "Chocolates & Sweets", price: 60, stock: 40, threshold: 10 },
  { id: "p4", name: "Assorted Chocolates", category: "Chocolates & Sweets", price: 250, stock: 25, threshold: 6 },
  { id: "p5", name: "Laddu Box", category: "Chocolates & Sweets", price: 300, stock: 20, threshold: 5 },
  { id: "p6", name: "Kaju Katli", category: "Chocolates & Sweets", price: 450, stock: 15, threshold: 5 },
  { id: "p7", name: "Almonds", category: "Dry Fruits & Snacks", price: 200, stock: 60, threshold: 12 },
  { id: "p8", name: "Cashews", category: "Dry Fruits & Snacks", price: 250, stock: 45, threshold: 10 },
  { id: "p9", name: "Pistachios", category: "Dry Fruits & Snacks", price: 300, stock: 35, threshold: 8 },
  { id: "p10", name: "Raisins", category: "Dry Fruits & Snacks", price: 150, stock: 50, threshold: 10 },
  { id: "p11", name: "Mixed Dry Fruits", category: "Dry Fruits & Snacks", price: 400, stock: 30, threshold: 8 },
  { id: "p12", name: "Cookies", category: "Dry Fruits & Snacks", price: 120, stock: 40, threshold: 10 },
  { id: "p13", name: "Namkeen Pack", category: "Dry Fruits & Snacks", price: 90, stock: 55, threshold: 15 },
  { id: "p14", name: "Coffee Powder", category: "Beverages", price: 150, stock: 35, threshold: 8 },
  { id: "p15", name: "Green Tea", category: "Beverages", price: 200, stock: 25, threshold: 6 },
  { id: "p16", name: "Herbal Tea", category: "Beverages", price: 180, stock: 30, threshold: 8 },
  { id: "p17", name: "Coffee Mug", category: "Personalized Gifts", price: 250, stock: 20, threshold: 5 },
  { id: "p18", name: "Photo Frame", category: "Personalized Gifts", price: 300, stock: 15, threshold: 4 },
  { id: "p19", name: "Keychain", category: "Personalized Gifts", price: 100, stock: 100, threshold: 15 },
  { id: "p20", name: "Customized Cushion", category: "Personalized Gifts", price: 350, stock: 12, threshold: 3 },
  { id: "p21", name: "Greeting Card", category: "Personalized Gifts", price: 80, stock: 80, threshold: 15 },
  { id: "p22", name: "Candles", category: "Home & Decor", price: 100, stock: 60, threshold: 10 },
  { id: "p23", name: "Aroma Candles", category: "Home & Decor", price: 200, stock: 25, threshold: 5 },
  { id: "p24", name: "Diyas", category: "Home & Decor", price: 50, stock: 150, threshold: 20 },
  { id: "p25", name: "Decorative Lights", category: "Home & Decor", price: 180, stock: 45, threshold: 10 },
  { id: "p26", name: "Indoor Plant", category: "Home & Decor", price: 350, stock: 10, threshold: 3 },
  { id: "p27", name: "Rangoli Kit", category: "Festival Essentials", price: 120, stock: 35, threshold: 8 },
  { id: "p28", name: "Puja Kit", category: "Festival Essentials", price: 350, stock: 18, threshold: 5 },
  { id: "p29", name: "Christmas Ornaments", category: "Festival Essentials", price: 250, stock: 40, threshold: 10 },
  { id: "p30", name: "Perfume", category: "Lifestyle & Premium Gifts", price: 600, stock: 20, threshold: 5 },
  { id: "p31", name: "Watch", category: "Lifestyle & Premium Gifts", price: 1500, stock: 10, threshold: 2 },
  { id: "p32", name: "Luxury Chocolate Box", category: "Chocolates & Sweets", price: 650, stock: 15, threshold: 4 },
  { id: "p33", name: "Premium Dry Fruit Basket", category: "Dry Fruits & Snacks", price: 950, stock: 12, threshold: 3 },
  { id: "p34", name: "Gift Voucher", category: "Special Occasion Gifts", price: 500, stock: 200, threshold: 20 },
  { id: "p35", name: "Water Bottle", category: "Office & Utility Gifts", price: 250, stock: 30, threshold: 8 },
  { id: "p36", name: "Notebook", category: "Office & Utility Gifts", price: 150, stock: 50, threshold: 10 },
  { id: "p37", name: "Pen Set", category: "Office & Utility Gifts", price: 250, stock: 35, threshold: 8 },
  { id: "p38", name: "Teddy Bear", category: "Special Occasion Gifts", price: 350, stock: 18, threshold: 5 },
  { id: "p39", name: "Flower Bouquet", category: "Special Occasion Gifts", price: 400, stock: 15, threshold: 4 },
  { id: "p40", name: "Cake Voucher", category: "Special Occasion Gifts", price: 300, stock: 50, threshold: 10 },
  { id: "p41", name: "Snack Hamper", category: "Dry Fruits & Snacks", price: 600, stock: 10, threshold: 3 },
  { id: "p42", name: "Fruit Basket", category: "Special Occasion Gifts", price: 500, stock: 8, threshold: 3 },
  { id: "p43", name: "Honey Jar", category: "Special Occasion Gifts", price: 180, stock: 30, threshold: 6 },
  { id: "p44", name: "Scented Soap Set", category: "Lifestyle & Premium Gifts", price: 250, stock: 25, threshold: 5 },
  { id: "p45", name: "Handcrafted Gift Item", category: "Special Occasion Gifts", price: 450, stock: 15, threshold: 4 },
  { id: "p46", name: "Travel Mug", category: "Personalized Gifts", price: 300, stock: 25, threshold: 6 },
  { id: "p47", name: "Desk Organizer", category: "Office & Utility Gifts", price: 400, stock: 12, threshold: 3 },
  { id: "p48", name: "Mobile Stand", category: "Office & Utility Gifts", price: 150, stock: 40, threshold: 8 },
  { id: "p49", name: "Bluetooth Speaker", category: "Office & Utility Gifts", price: 800, stock: 15, threshold: 4 },
  { id: "p50", name: "Personalized Name Plate", category: "Personalized Gifts", price: 600, stock: 10, threshold: 2 },
  { id: "p51", name: "Handmade Card", category: "Personalized Gifts", price: 120, stock: 40, threshold: 8 },
  { id: "p52", name: "Silk Scarf", category: "Lifestyle & Premium Gifts", price: 500, stock: 15, threshold: 3 },
  { id: "p53", name: "Wallet", category: "Lifestyle & Premium Gifts", price: 450, stock: 20, threshold: 5 },
  { id: "p54", name: "Beauty Kit", category: "Lifestyle & Premium Gifts", price: 900, stock: 10, threshold: 2 },
  { id: "p55", name: "Skincare Kit", category: "Lifestyle & Premium Gifts", price: 800, stock: 12, threshold: 3 },
  { id: "p56", name: "Gourmet Snacks Pack", category: "Dry Fruits & Snacks", price: 450, stock: 20, threshold: 5 },
  { id: "p57", name: "Tea Gift Set", category: "Beverages", price: 350, stock: 25, threshold: 6 },
  { id: "p58", name: "Coffee Gift Set", category: "Beverages", price: 400, stock: 20, threshold: 5 },
  { id: "p59", name: "Dry Fruit Jar Set", category: "Dry Fruits & Snacks", price: 750, stock: 15, threshold: 4 },
  { id: "p60", name: "Decorative Showpiece", category: "Home & Decor", price: 500, stock: 10, threshold: 3 },
  { id: "p61", name: "Festive Decoration Kit", category: "Home & Decor", price: 650, stock: 15, threshold: 4 },
  { id: "p62", name: "Premium Candle Set", category: "Home & Decor", price: 400, stock: 20, threshold: 5 },
  { id: "p63", name: "Customized Tumbler", category: "Personalized Gifts", price: 450, stock: 25, threshold: 6 },
  { id: "p64", name: "Corporate Gift Set", category: "Corporate Gifts", price: 1200, stock: 15, threshold: 4 }
];

const DEFAULT_SETTINGS = {
  shopName: "Paper Plane",
  currencySymbol: "₹",
  packagingOptions: [
    { name: "Cardboard Box", price: 150 },
    { name: "Wooden Tray", price: 300 },
    { name: "Festive Gift Box", price: 400 },
    { name: "Premium Basket", price: 500 },
    { name: "Corporate Gift Box", price: 600 },
    { name: "Luxury Hamper Basket", price: 750 }
  ]
};

const DEFAULT_USERS = [];

// Initial database check & seed
function initDatabase() {
  // Ensure the database is seeded with the 64 product catalog on boot
  if (!localStorage.getItem("pp_database_seeded_v3")) {
    localStorage.setItem("pp_products", JSON.stringify(DEFAULT_PRODUCTS));
    localStorage.setItem("pp_orders", JSON.stringify([]));
    localStorage.setItem("pp_settings", JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem("pp_users", JSON.stringify([]));
    localStorage.setItem("pp_database_seeded_v3", "true");
  }

  if (!localStorage.getItem("pp_products")) {
    localStorage.setItem("pp_products", JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem("pp_orders")) {
    localStorage.setItem("pp_orders", JSON.stringify([]));
  }
  if (!localStorage.getItem("pp_users")) {
    localStorage.setItem("pp_users", JSON.stringify([]));
  }

  // Clear Rajesh/Anjali seed data if present in localStorage from previous seeding
  try {
    const currentUsers = JSON.parse(localStorage.getItem("pp_users")) || [];
    if (currentUsers.length === 2 && currentUsers[0].id === "u1" && currentUsers[1].id === "u2") {
      localStorage.setItem("pp_users", JSON.stringify([]));
    }
  } catch (e) {
    console.error("Cleanup seeded users failed:", e);
  }
  const currentSettings = localStorage.getItem("pp_settings");
  if (currentSettings) {
    try {
      const parsed = JSON.parse(currentSettings);
      if (!parsed.packagingOptions || parsed.packagingOptions.length !== 6 || parsed.packagingOptions[2].name === "Gold Gift Box" || parsed.firebase) {
        localStorage.setItem("pp_settings", JSON.stringify(DEFAULT_SETTINGS));
      }
    } catch(e) {
      localStorage.setItem("pp_settings", JSON.stringify(DEFAULT_SETTINGS));
    }
  } else {
    localStorage.setItem("pp_settings", JSON.stringify(DEFAULT_SETTINGS));
  }
}

initDatabase();
// Expose API wrapper
export const db = {
  // PRODUCTS
  async getProducts() {
    return JSON.parse(localStorage.getItem("pp_products")) || [];
  },

  async saveProduct(product) {
    const products = await this.getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    
    if (existingIndex > -1) {
      products[existingIndex] = product;
    } else {
      products.push(product);
    }
    
    localStorage.setItem("pp_products", JSON.stringify(products));
    return product;
  },

  async deleteProduct(productId) {
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    localStorage.setItem("pp_products", JSON.stringify(filtered));
    return true;
  },

  // ORDERS
  async getOrders() {
    const orders = JSON.parse(localStorage.getItem("pp_orders")) || [];
    // Sort local orders desc
    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async saveOrder(order) {
    const orders = await this.getOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);
    
    if (existingIndex > -1) {
      orders[existingIndex] = order;
    } else {
      orders.unshift(order); // Add to beginning
    }
    
    localStorage.setItem("pp_orders", JSON.stringify(orders));

    // Update inventory stock based on products in order
    if (existingIndex === -1) {
      const products = await this.getProducts();
      for (const item of order.items) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          product.stock = Math.max(0, product.stock - item.qty);
          await this.saveProduct(product);
        }
      }
    }
    return order;
  },

  async deleteOrder(orderId) {
    const orders = await this.getOrders();
    const filtered = orders.filter(o => o.id !== orderId);
    localStorage.setItem("pp_orders", JSON.stringify(filtered));
    return true;
  },

  // SETTINGS
  getSettings() {
    return JSON.parse(localStorage.getItem("pp_settings")) || DEFAULT_SETTINGS;
  },

  saveSettings(settings) {
    localStorage.setItem("pp_settings", JSON.stringify(settings));
    return settings;
  },

  // USERS
  async getUsers() {
    return JSON.parse(localStorage.getItem("pp_users")) || [];
  },

  async saveUser(user) {
    const users = await this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase() || u.phone === user.phone);
    if (existingIndex > -1) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem("pp_users", JSON.stringify(users));
    return user;
  },

  // DATA UTILS
  async clearAllData() {
    localStorage.setItem("pp_products", JSON.stringify([]));
    localStorage.setItem("pp_orders", JSON.stringify([]));
    localStorage.setItem("pp_users", JSON.stringify(DEFAULT_USERS));
  }
};

// Helper for local synchronous retrieval (useful for immediate app bootstrapping)
export function getSettings() {
  return JSON.parse(localStorage.getItem("pp_settings")) || DEFAULT_SETTINGS;
}
