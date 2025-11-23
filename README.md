# LYNQED - Campus Marketplace 🎓🛒

**LYNQED** is a location-based hyper-local marketplace designed specifically for university campuses. It bridges the gap between student entrepreneurs (vendors) and buyers, facilitating real-time commerce, delivery management, and community connection.

> **Status:** Deployed on vercel

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
4.  **Run Locally**
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
