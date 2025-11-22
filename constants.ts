
import { Product, User, Vendor, Category, Order } from './types';

export const CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Food', icon: 'utensils' },
  { id: 'cat-groceries', name: 'Groceries', icon: 'basket-shopping' },
  { id: 'cat-clothing', name: 'Clothing', icon: 'shirt' },
  { id: 'cat-electronics', name: 'Electronics', icon: 'bolt' },
  { id: 'cat-services', name: 'Services', icon: 'hand-holding-heart' },
  { id: 'cat-books', name: 'Books', icon: 'book' },
];

export const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Jane Doe', email: 'jane@lynqed.com', roles: ['buyer'], avatarUrl: 'https://ui-avatars.com/api/?name=Jane+Doe&background=0D8ABC&color=fff' },
  { id: 'user-2', name: 'John Vendor', email: 'john@lynqed.com', roles: ['vendor'], avatarUrl: 'https://ui-avatars.com/api/?name=John+Vendor&background=random' },
  { id: 'user-3', name: 'Admin User', email: 'admin@lynqed.com', roles: ['admin'], avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff' },
];

export const MOCK_VENDORS: Vendor[] = [
  { 
    vendorId: 'vendor-1', 
    userId: 'user-2', 
    storeName: "John's Groceries", 
    storeDescription: "Fresh essentials and daily provisions.", 
    location: "Hostel A", 
    isApproved: true, 
    rating: 4.5, 
    storeAvatarUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80" 
  },
  { 
    vendorId: 'vendor-2', 
    userId: 'user-99', 
    storeName: "Tech Hub", 
    storeDescription: "Gadgets, chargers, and phone repairs.", 
    location: "Hostel B", 
    isApproved: true, 
    rating: 4.8, 
    storeAvatarUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80" 
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    vendorId: 'vendor-1',
    title: 'Fresh Eggs (Crate)',
    description: 'Farm fresh eggs, delivered daily. Perfect for breakfast.',
    price: 35,
    currency: 'GHS',
    category: 'Groceries',
    images: [
        'https://images.unsplash.com/photo-1582722878654-c2bea702dfbf?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1569246294372-ed319c674f14?auto=format&fit=crop&w=600&q=80'
    ],
    stock: 20,
    status: 'approved',
    location: 'Hostel A',
    contactPhone: '233500000001',
    rating: 4.8
  },
  {
    id: 'prod-2',
    vendorId: 'vendor-1',
    title: 'Indomie Noodles (Pack)',
    description: 'Spicy flavor instant noodles, pack of 5.',
    price: 15,
    currency: 'GHS',
    category: 'Food',
    images: ['https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=600&q=80'],
    stock: 50,
    status: 'approved',
    location: 'Hostel A',
    contactPhone: '233500000001',
    rating: 4.5
  },
   {
    id: 'prod-3',
    vendorId: 'vendor-2',
    title: 'iPhone Fast Charger',
    description: 'Original 20W fast charging adapter and cable.',
    price: 80,
    currency: 'GHS',
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80'],
    stock: 10,
    status: 'approved',
    location: 'Hostel B',
    contactPhone: '233500000002',
    rating: 4.2
  },
  {
    id: 'prod-4',
    vendorId: 'vendor-2',
    title: 'Scientific Calculator',
    description: 'Casio fx-991EX Classwiz. Slightly used.',
    price: 150,
    currency: 'GHS',
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1587145820266-a5951eebebb1?auto=format&fit=crop&w=600&q=80'],
    stock: 1,
    status: 'approved',
    location: 'Hostel B',
    contactPhone: '233500000002',
    rating: 5.0
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-1',
    buyerId: 'user-1',
    vendorId: 'vendor-1',
    items: [{ productId: 'prod-1', quantity: 1, product: MOCK_PRODUCTS[0] }],
    total: 35,
    status: 'placed',
    deliveryOption: 'delivery',
    createdAt: new Date().toISOString()
  }
];
