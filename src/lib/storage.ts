import { User, CartItem, Order, Feedback } from '@/types';

const STORAGE_KEYS = {
  USER: 'ecommerce_user',
  CART: 'ecommerce_cart',
  ORDERS: 'ecommerce_orders',
  FEEDBACK: 'ecommerce_feedback',
  RETAILER_PRODUCTS: 'retailer_products',
  WHOLESALER_PRODUCTS: 'wholesaler_products',
  WHOLESALER_ORDERS: 'wholesaler_orders',
  CUSTOMER_PURCHASES: 'customer_purchases',
};

export const storage = {
  // User
  getUser: (): User | null => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  // Cart
  getCart: (): CartItem[] => {
    const cart = localStorage.getItem(STORAGE_KEYS.CART);
    return cart ? JSON.parse(cart) : [];
  },
  setCart: (cart: CartItem[]) => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  },

  // Orders
  getOrders: (): Order[] => {
    const orders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return orders ? JSON.parse(orders) : [];
  },
  addOrder: (order: Order) => {
    const orders = storage.getOrders();
    orders.unshift(order);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },
  updateOrder: (orderId: string, updates: Partial<Order>) => {
    const orders = storage.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    }
  },

  // Feedback
  getFeedback: (): Feedback[] => {
    const feedback = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    return feedback ? JSON.parse(feedback) : [];
  },
  addFeedback: (feedback: Feedback) => {
    const allFeedback = storage.getFeedback();
    allFeedback.unshift(feedback);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(allFeedback));
  },

  // Retailer Products
  getRetailerProducts: (retailerId: string) => {
    const products = localStorage.getItem(STORAGE_KEYS.RETAILER_PRODUCTS);
    const allProducts = products ? JSON.parse(products) : [];
    return allProducts.filter((p: any) => p.retailerId === retailerId);
  },
  addRetailerProduct: (product: any) => {
    const products = localStorage.getItem(STORAGE_KEYS.RETAILER_PRODUCTS);
    const allProducts = products ? JSON.parse(products) : [];
    allProducts.unshift(product);
    localStorage.setItem(STORAGE_KEYS.RETAILER_PRODUCTS, JSON.stringify(allProducts));
  },
  updateRetailerProduct: (productId: string, updates: any) => {
    const products = localStorage.getItem(STORAGE_KEYS.RETAILER_PRODUCTS);
    const allProducts = products ? JSON.parse(products) : [];
    const index = allProducts.findIndex((p: any) => p.id === productId);
    if (index !== -1) {
      allProducts[index] = { ...allProducts[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.RETAILER_PRODUCTS, JSON.stringify(allProducts));
    }
  },
  deleteRetailerProduct: (productId: string) => {
    const products = localStorage.getItem(STORAGE_KEYS.RETAILER_PRODUCTS);
    const allProducts = products ? JSON.parse(products) : [];
    const filtered = allProducts.filter((p: any) => p.id !== productId);
    localStorage.setItem(STORAGE_KEYS.RETAILER_PRODUCTS, JSON.stringify(filtered));
  },

  // Wholesaler Products
  getWholesalerProducts: (wholesalerId: string) => {
    const products = localStorage.getItem(STORAGE_KEYS.WHOLESALER_PRODUCTS);
    const allProducts = products ? JSON.parse(products) : [];
    return allProducts.filter((p: any) => p.wholesalerId === wholesalerId);
  },
  addWholesalerProduct: (product: any) => {
    const products = localStorage.getItem(STORAGE_KEYS.WHOLESALER_PRODUCTS);
    const allProducts = products ? JSON.parse(products) : [];
    allProducts.unshift(product);
    localStorage.setItem(STORAGE_KEYS.WHOLESALER_PRODUCTS, JSON.stringify(allProducts));
  },
  updateWholesalerProduct: (productId: string, updates: any) => {
    const products = localStorage.getItem(STORAGE_KEYS.WHOLESALER_PRODUCTS);
    const allProducts = products ? JSON.parse(products) : [];
    const index = allProducts.findIndex((p: any) => p.id === productId);
    if (index !== -1) {
      allProducts[index] = { ...allProducts[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.WHOLESALER_PRODUCTS, JSON.stringify(allProducts));
    }
  },
  deleteWholesalerProduct: (productId: string) => {
    const products = localStorage.getItem(STORAGE_KEYS.WHOLESALER_PRODUCTS);
    const allProducts = products ? JSON.parse(products) : [];
    const filtered = allProducts.filter((p: any) => p.id !== productId);
    localStorage.setItem(STORAGE_KEYS.WHOLESALER_PRODUCTS, JSON.stringify(filtered));
  },

  // Wholesaler Orders (Retailer placing orders with wholesalers)
  getWholesalerOrders: () => {
    const orders = localStorage.getItem(STORAGE_KEYS.WHOLESALER_ORDERS);
    return orders ? JSON.parse(orders) : [];
  },
  addWholesalerOrder: (order: any) => {
    const orders = storage.getWholesalerOrders();
    orders.unshift(order);
    localStorage.setItem(STORAGE_KEYS.WHOLESALER_ORDERS, JSON.stringify(orders));
  },
  updateWholesalerOrder: (orderId: string, updates: any) => {
    const orders = storage.getWholesalerOrders();
    const index = orders.findIndex((o: any) => o.id === orderId);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.WHOLESALER_ORDERS, JSON.stringify(orders));
    }
  },

  // Customer Purchases (for tracking by retailers)
  getCustomerPurchases: () => {
    const purchases = localStorage.getItem(STORAGE_KEYS.CUSTOMER_PURCHASES);
    return purchases ? JSON.parse(purchases) : [];
  },
  addCustomerPurchase: (purchase: any) => {
    const purchases = storage.getCustomerPurchases();
    purchases.unshift(purchase);
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_PURCHASES, JSON.stringify(purchases));
  },
};
