
---

# VIN-KJ AUTO SERVICES

## Project Overview

Full-stack website for **VIN-KJ AUTO SERVICES** — a professional car window tinting, PPF, wrapping, and auto detailing business based in Nairobi, Kenya.

The application allows customers to:

* Browse available tinting, PPF, wrapping, and detailing services
* Book service appointments online with date & time scheduling
* Shop for auto spare parts and accessories
* Add products to a cart and place orders
* Pay via **M-Pesa (Daraja STK Push)** or **Stripe**
* View the company gallery and location with Google Maps

The admin portal (`/admin/`) provides management of services, products, orders, bookings, payments, and gallery items via Django Admin.

---

## Tech Stack

| Layer       | Technology                                          |
|-------------|-----------------------------------------------------|
| Backend     | Python 3.12, Django 6.0.1, Django REST Framework    |
| Frontend    | HTML, CSS, JavaScript, Bootstrap 5                  |
| Database    | SQLite (default), PostgreSQL-ready                  |
| Payments    | M-Pesa (Safaricom Daraja API), Stripe               |
| Static Files| WhiteNoise (compressed manifest)                    |
| Server      | Nginx (reverse proxy) + Gunicorn (WSGI)             |
| Deployment  | Docker, CapRover                                    |

---

## Project Structure

```
Vinny_JK_Company/
├── vinny_kj/                # Django project settings
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── api/                     # Main application (models, views, serializers)
│   ├── models.py            # Services, Product, Order, Booking, Cart, Payment, Gallery
│   ├── views.py             # API views & business logic
│   ├── serializers.py       # DRF serializers
│   ├── urls.py              # API route definitions
│   ├── admin.py             # Django Admin configuration
│   └── utils.py             # M-Pesa & Stripe payment utilities
│
├── Fronted/                 # Static frontend (served by Nginx)
│   ├── index.html           # Home page
│   ├── services.html        # Services & booking page
│   ├── products.html        # Products & shop page
│   ├── about.html           # About & gallery page
│   ├── css/styles.css       # Custom styles
│   └── js/main.js           # Frontend JavaScript
│
├── Dockerfile               # Multi-service container (Nginx + Gunicorn)
├── nginx.conf               # Nginx reverse proxy configuration
├── captain-definition       # CapRover deployment config
├── manage.py
├── requirements.txt
└── .env.example             # Environment variable template
```

---

## Core Features

### Services & Booking
* CRUD operations for tinting, PPF, wrapping, and detailing services
* Online booking with date, time slot selection, and vehicle details
* Booking lifecycle management (pending → confirmed → completed / cancelled)
* Booking analytics: daily, weekly, monthly summaries and revenue

### Products & Orders
* Product catalog with categories, SKU, stock tracking, and availability
* Shopping cart with add/update/remove items
* Order creation from cart with automatic stock reduction
* Order cancellation with stock restoration (2-hour cancellation window)
* Order status tracking (pending, paid, out for delivery, delivered, completed)

### Payments
* **M-Pesa**: Safaricom Daraja STK Push integration with callback handling
* **Stripe**: Payment intent creation for card payments

### Gallery
* Image gallery management for showcasing completed projects
* Categorized by service type (Tinting, Wrapping, PPF, etc.)

### Admin Portal
* Django Admin at `/admin/` for managing all resources
* Order management with inline order items
* Gallery management with category filtering

---

## API Endpoints

### Services
```
GET    /api/services/              # List all services
POST   /api/services/              # Create a service
GET    /api/services/{id}/         # Service detail
PUT    /api/services/{id}/         # Update a service
DELETE /api/services/{id}/         # Delete a service
```

### Products
```
GET    /api/products/              # List all products
POST   /api/products/              # Create a product
GET    /api/products/{id}/         # Product detail
PUT    /api/products/{id}/         # Update a product
DELETE /api/products/{id}/         # Delete a product
```

### Orders
```
GET    /api/orders/                # List all orders
POST   /api/orders/create/         # Create order from cart
GET    /api/orders/{id}/           # Order detail
PUT    /api/orders/{id}/           # Update order
POST   /api/orders/{id}/cancel/    # Cancel order (within 2 hours)
```

### Bookings
```
GET    /api/bookings/              # List all bookings
POST   /api/bookings/create/       # Create a booking
GET    /api/bookings/{id}/         # Booking detail
PUT    /api/bookings/{id}/         # Update a booking
POST   /api/bookings/{id}/confirm/ # Confirm a booking
POST   /api/bookings/{id}/complete/# Complete a booking
POST   /api/bookings/{id}/cancel/  # Cancel a booking
```

### Booking Analytics
```
GET    /api/bookings/summary/      # Booking status summary
GET    /api/bookings/revenue/      # Total revenue
GET    /api/bookings/daily/        # Daily booking count
GET    /api/bookings/weekly/       # Weekly booking count
GET    /api/bookings/monthly/      # Monthly booking count
```

### Cart
```
POST   /api/cart/create/           # Create a new cart
GET    /api/cart/{uuid}/           # Get cart details
POST   /api/cart/{uuid}/items/     # Add item to cart
PUT    /api/cart/items/{id}/       # Update cart item quantity
DELETE /api/cart/items/{id}/       # Remove item from cart
```

### Payments
```
POST   /api/payment/mpesa/initiate/{order_id}/   # Initiate M-Pesa STK Push
POST   /api/payment/mpesa/callback/              # M-Pesa callback (webhook)
POST   /api/payment/stripe/initiate/{order_id}/  # Create Stripe payment intent
```

### Gallery
```
GET    /api/gallery/               # List gallery items
POST   /api/gallery/               # Upload gallery item
GET    /api/gallery/{id}/          # Gallery item detail
PUT    /api/gallery/{id}/          # Update gallery item
DELETE /api/gallery/{id}/          # Delete gallery item
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Vinny_JK_Company
```

### 2. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate   # Linux/Mac
# venv\Scripts\activate    # Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 5. Run Migrations

```bash
python manage.py migrate
```

### 6. Create Superuser

```bash
python manage.py createsuperuser
```

### 7. Run Development Server

```bash
python manage.py runserver
```

The frontend is served as static files from the `Fronted/` directory. In production, Nginx handles this.

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```
# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=*
CSRF_TRUSTED_ORIGINS=https://your-domain.com

# Superuser (auto-created on first deploy)
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=your-secure-password
DJANGO_SUPERUSER_EMAIL=admin@example.com

# M-Pesa (Daraja)
DARAJA_CONSUMER_KEY=your-consumer-key
DARAJA_CONSUMER_SECRET=your-consumer-secret
DARAJA_PASSKEY=your-passkey
DARAJA_BUSINESS_SHORTCODE=your-shortcode
DARAJA_BASE_URL=https://sandbox.safaricom.co.ke
DARAJA_CALLBACK_URL=https://your-domain.com/api/payment/mpesa/callback/

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-public
```

---

## Deployment (CapRover)

The project is configured for one-click deployment on CapRover:

1. Push the code to your CapRover app (via Git or tarball upload)
2. CapRover uses `captain-definition` → `Dockerfile` to build the container
3. The Docker container runs both **Nginx** (port 80) and **Gunicorn** (port 8000)
4. On startup, migrations run automatically and a superuser is created from env vars
5. Set your environment variables in the CapRover app dashboard

---

## Author

Developed by **ENGTIMOH & VINCENT0-AI**

