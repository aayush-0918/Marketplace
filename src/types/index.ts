export type UserRole = 'customer' | 'retailer' | 'wholesaler';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  availabilityDate?: string;
  retailerId?: string;
  wholesalerId?: string;
  isProxy?: boolean;
  ratings: number;
  reviewCount: number;
  location?: {
    lat: number;
    lng: number;
    name: string;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'online' | 'offline';
  deliveryDate?: string;
  createdAt: string;
  trackingNumber?: string;
}

export interface Feedback {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
