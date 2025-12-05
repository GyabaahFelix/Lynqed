
# LYNQED - Campus Marketplace 🎓🛒

**LYNQED** is a location-based hyper-local marketplace designed specifically for university campuses. It bridges the gap between student entrepreneurs (vendors) and buyers, facilitating real-time commerce, delivery management, and community connection.

> **Status:** Development Complete / Deployment Pending 🚧

---

## 🌟 Key Features

### 🛍️ Buyer Experience
*   **Visual Discovery:** High-fidelity product cards with full-bleed imagery (Franko Trading style).
*   **Campus Maps:** Interactive Leaflet map showing vendor locations relative to hostels.
*   **Smart Search:** Filter by category, price, rating, and location.
*   **Guest Checkout:** "Shadow Account" creation allowing purchases without upfront registration.
*   **Wishlist:** Save favorite items for later.

### 🏪 Vendor Ecosystem
*   **Storefronts:** Dedicated public profiles with ratings, contact info, and catalog.
*   **Inventory Management:** Real-time stock tracking (auto-decrements on purchase).
*   **Order Dashboard:** Accept orders, dispatch drivers, and track earnings.
*   **Multi-Image Upload:** Drag-and-drop support for detailed product showcases.

### 🛡️ Administration & Security
*   **Role-Based Access:** Distinct flows for Buyers, Vendors, Admins, and Delivery Staff.
*   **Moderation:** Admin dashboard to approve/reject products and verify vendors.
*   **Hidden Access:** Secured routes for administrative tasks.
*   **Self-Healing Auth:** robust handling of profile creation and login states.

---

## 🛠️ Tech Stack

*   **Frontend:** React 18, TypeScript, Vite
*   **Styling:** Tailwind CSS
*   **Backend:** Supabase (PostgreSQL, Auth, Realtime)
*   **Maps:** Leaflet.js (OpenStreetMap)
*   **Deployment:** Vercel

---

## 🚀 Setup Instructions

1.  **Clone the repository**
2.  **Install dependencies**
    ```bash
    npm install
    ```
3.  **Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  **Database Setup (Supabase)**
    Run the following SQL in the Supabase SQL Editor to create tables and RLS policies:

    ```sql
    -- Enable UUID extension
    create extension if not exists "uuid-ossp";

    -- PROFILES (Users)
    create table public.profiles (
      id uuid references auth.users not null primary key,
      email text,
      name text,
      avatar_url text,
      roles text[] default '{buyer}', 
      is_banned boolean default false,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- VENDORS
    create table public.vendors (
      id uuid default uuid_generate_v4() primary key,
      vendor_id text unique not null,
      user_id uuid references public.profiles(id),
      store_name text,
      store_description text,
      store_avatar_url text,
      location text,
      contact_phone text,
      is_approved boolean default false,
      rating numeric default 5.0,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- PRODUCTS
    create table public.products (
      id uuid default uuid_generate_v4() primary key,
      vendor_id text references public.vendors(vendor_id),
      title text,
      description text,
      price numeric,
      currency text default 'GHS',
      category text,
      images text[],
      stock integer default 0,
      status text default 'pending', 
      location text,
      contact_phone text,
      rating numeric default 0,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- ORDERS
    create table public.orders (
      id uuid default uuid_generate_v4() primary key,
      buyer_id uuid references public.profiles(id),
      vendor_id text,
      delivery_person_id uuid references public.profiles(id),
      items jsonb,
      total numeric,
      delivery_fee numeric default 0,
      status text default 'placed',
      delivery_option text,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- DELIVERY PERSONS
    create table public.delivery_persons (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references public.profiles(id),
      full_name text,
      vehicle_type text,
      status text default 'pending',
      total_deliveries integer default 0,
      rating numeric default 5.0,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );

    -- RLS POLICIES & FUNCTIONS
    alter table public.profiles enable row level security;
    alter table public.vendors enable row level security;
    alter table public.products enable row level security;
    alter table public.orders enable row level security;
    alter table public.delivery_persons enable row level security;

    -- Helper to check if admin
    create or replace function public.is_admin()
    returns boolean as $$
    select exists (
      select 1 from public.profiles
      where id = auth.uid() and 'admin' = any(roles)
    );
    $$ language sql security definer;

    -- Profiles Policies
    create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
    create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
    create policy "Admins can update any profile" on public.profiles for update using (is_admin());

    -- Vendors Policies
    create policy "Vendors viewable by everyone" on public.vendors for select using (true);
    create policy "Users can register as vendor" on public.vendors for insert with check (auth.uid() = user_id);
    create policy "Owners can update vendor" on public.vendors for update using (auth.uid() = user_id);
    create policy "Admins can update vendors" on public.vendors for update using (is_admin());

    -- Products Policies
    create policy "Products viewable by everyone" on public.products for select using (true);
    create policy "Vendors can insert products" on public.products for insert with check (
      exists (select 1 from public.vendors where vendor_id = products.vendor_id and user_id = auth.uid())
    );
    create policy "Vendors can update own products" on public.products for update using (
       exists (select 1 from public.vendors where vendor_id = products.vendor_id and user_id = auth.uid())
    );
    create policy "Admins can update products" on public.products for update using (is_admin());
    create policy "Admins can delete products" on public.products for delete using (is_admin());

    -- Orders Policies
    create policy "Users see own orders" on public.orders for select using (auth.uid() = buyer_id);
    create policy "Vendors see orders for them" on public.orders for select using (
      exists (select 1 from public.vendors where vendor_id = orders.vendor_id and user_id = auth.uid())
    );
    create policy "Drivers see assigned orders" on public.orders for select using (
      auth.uid() = delivery_person_id 
      or (status = 'ready_for_pickup' and delivery_option = 'delivery' and delivery_person_id is null)
    );
    create policy "Buyers can create orders" on public.orders for insert with check (auth.uid() = buyer_id);
    create policy "Related parties can update orders" on public.orders for update using (
      auth.uid() = buyer_id 
      or exists (select 1 from public.vendors where vendor_id = orders.vendor_id and user_id = auth.uid())
      or auth.uid() = delivery_person_id
      or (status = 'ready_for_pickup' and delivery_person_id is null) -- Allow drivers to claim
    );

    -- Delivery Persons Policies
    create policy "Public view drivers" on public.delivery_persons for select using (true);
    create policy "Users can register as driver" on public.delivery_persons for insert with check (auth.uid() = user_id);
    create policy "Drivers update own" on public.delivery_persons for update using (auth.uid() = user_id);
    create policy "Admins update drivers" on public.delivery_persons for update using (is_admin());
    ```

5.  **Run Locally**
    ```bash
    npm run dev
    ```

---

## 🗄️ Database Schema (Supabase)

*   **Profiles:** Extends Auth users with Roles (`buyer`, `vendor`, `admin`) and Avatar.
*   **Vendors:** Stores business metadata (`storeName`, `location`, `rating`).
*   **Products:** Inventory items with `images[]`, `price`, `stock`, `status`.
*   **Orders:** Transactional records linked to Buyer and Vendor.
*   **DeliveryPersons:** Logistics personnel data.

---

## 📦 Deployment

This project is configured for **Vercel**.
1.  Connect your GitHub repository to Vercel.
2.  Add the Environment Variables in Vercel Settings.
3.  Deploy.

*(Ensure `vercel.json` is present to handle SPA routing)*.
