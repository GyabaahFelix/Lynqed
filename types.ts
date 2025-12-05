
export type Role = 'buyer' | 'vendor' | 'admin' | 'deliveryPerson' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: Role[];
  defaultLocation?: string;
  isBanned?: boolean; // New
}

export interface Vendor {
  id?: string; // Database Primary Key (UUID/Int)
  vendorId: string; // Custom String ID (e.g. v-1234)
  userId: string;
  storeName: string;
  storeDescription: string;
  storeAvatarUrl?: string;
  location: string;
  isApproved: boolean;
  rating: number;
  createdAt?: string;
  contactPhone?: string;
}

export interface DeliveryPerson {
  id: string;
  userId: string;
  fullName: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  vehicleType: string;
  totalDeliveries?: number;
  rating?: number;
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
  images: string[];
  contactPhone?: string;
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

// Expanded Order Status for granular tracking
export type OrderStatus = 
  | 'placed' 
  | 'received' 
  | 'preparing'         // Vendor is packing
  | 'ready_for_pickup'  // Vendor is done, waiting for driver
  | 'assigned'          // Driver accepted
  | 'picked_up'         // Driver has item
  | 'in_route'          // Driver moving to buyer
  | 'delivered' 
  | 'declined' 
  | 'cancelled';

export interface Order {
  id: string;
  buyerId: string;
  vendorId: string;
  deliveryPersonId?: string;
  items: CartItem[];
  total: number;
  deliveryFee?: number;
  status: OrderStatus;
  deliveryOption: 'delivery' | 'pickup';
  createdAt: string;
  locationCoordinates?: { lat: number; lng: number }; // For distance calc
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
}