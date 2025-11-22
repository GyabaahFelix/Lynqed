
export type Role = 'buyer' | 'vendor' | 'admin' | 'deliveryPerson' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: Role[];
  defaultLocation?: string;
}

export interface Vendor {
  vendorId: string;
  userId: string;
  storeName: string;
  storeDescription: string;
  storeAvatarUrl?: string;
  location: string;
  isApproved: boolean;
  rating: number;
}

export interface DeliveryPerson {
  id: string;
  userId: string;
  fullName: string;
  status: 'pending' | 'approved' | 'rejected';
  vehicleType: string;
}

export type ProductStatus = 'pending' | 'approved' | 'rejected';

export interface Product {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[]; // Changed from image string to array
  contactPhone?: string; // Added contact info
  stock: number;
  status: ProductStatus;
  location: string;
  rating?: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export type OrderStatus = 'placed' | 'received' | 'in_route' | 'ready_for_pickup' | 'delivered';

export interface Order {
  id: string;
  buyerId: string;
  vendorId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  deliveryOption: 'delivery' | 'pickup';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
