
---

#  Tinting & Auto Spares Backend API

##  Project Overview

This project is the **backend ** for a **Tinting and Auto Spares company website**.
It provides RESTful APIs that allow customers to:

* Book tinting or auto services before visiting the shop
* Buy auto spare parts online
* View company location and directions
* Manage customer orders and bookings
* Enable admin management of services, products, and orders

The backend is built using **Python (Django & Django REST Framework)** and exposes APIs that can be consumed by any frontend (React, mobile app, etc.).

---

Tech Stack

 **Backend Framework:** Django
 **API Framework:** Django REST Framework (DRF)
 **Database:** SQLite (development), PostgreSQL (production ready)
 **API Testing:** Postman
 **Language:** Python 3

---

##  Project Structure

```
backend/
│
├── VintAutojk/                  
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── api/                 # Customer & admin 
├── services/              # Tinting & auto services
├── products/              # Auto spare parts
├── bookings/              # Service bookings
├── orders/                # Online product orders
│
├── manage.py
└── requirements.txt
```

---

##  Core Features (Backend Only)

###  Admin Management
* Admin management
### 🛠 Services Module

* Create, update, delete tinting and auto services
* Service pricing and descriptions
* Service availability

###  Booking System

* Customers can book services before coming
* Date & time scheduling
* Vehicle & contacts details (Full name, Phone number,Vehicle model, number plate, description)
  
###  Products & Online Sales

* Auto spare parts listing
* Product categories
* Stock management
* Online ordering
* Payment method intergration

###  Company Location & Directions

* Store location details
* Google Maps integration (frontend consumption)
* Contact information API

---

##  API Endpoints (Sample)

### Services

```
GET    /api/services/
POST   /api/services/
GET    /api/services/{id}/
PUT    /api/services/{id}/
DELETE /api/services/{id}/
```

### Bookings

```
POST   /api/bookings/
GET    /api/bookings/
GET    /api/bookings/{id}/
```

### Products

```
GET    /api/products/
POST   /api/products/
GET    /api/products/{id}/
```

### Orders

```
POST   /api/orders/
GET    /api/orders/
```

---

##  API Testing

All APIs are tested using **Postman**.

* HTTP methods: `GET`, `POST`, `PUT`, `DELETE`
* JSON request & response format
---

##  Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/EngTimoh/VintAutoJK_Company.
cd tinting-auto-spares-backend
```

### 2️⃣ Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate   
```

### 3️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

### 4️⃣ Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5️⃣ Run Development Server

```bash
python manage.py runserver
```

---

##  Environment Variables

Create a `.env` file for sensitive data:

```
SECRET_KEY=your_secret_key
DEBUG=True
DATABASE_URL=your_database_url
```

---

##  Author

Developed by **[ENGTIMOH & VINCENT0-AI]**
Backend Developers | Django Specialist


