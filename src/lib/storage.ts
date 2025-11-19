import { User, CartItem, Order, Feedback } from '@/types';

const STORAGE_KEYS = {
  USER: 'ecommerce_user',
  CART: 'ecommerce_cart',
  ORDERS: 'ecommerce_orders',
  FEEDBACK: 'ecommerce_feedback',
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
};
