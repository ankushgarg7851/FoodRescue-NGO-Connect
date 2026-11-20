# FoodRescue NGO Connect — Web Project Backend (3rd Evaluation)

A production-grade Node.js and Express backend for **FoodRescue NGO Connect**, connecting surplus food donors (restaurants, banquets, canteens) with local NGOs to reduce food waste and combat hunger.

---

## 👥 Team Members Contribution & Page Ownership Matrix

| Team Member | GitHub Username | Assigned Pages & Modules | Files Owned & Authored | Key Responsibilities & Backend Contribution |
|---|---|---|---|---|
| **Ankush Garg** | [`@ankushgarg7851`](https://github.com/ankushgarg7851) | **Donor Dashboard, Auth/Login & Lead Full-Stack Architect** | `DONOR DASHBOARD.html`<br>`donor-dashboard.js`<br>`login.html` / `login2.html`<br>`login.js` / `login2.CSS`<br>`signup page.html`<br>`server.js`<br>`models/Donation.js`<br>`models/User.js`<br>`routes/externalRoutes.js`<br>`views/donations-live.ejs`<br>`seed.js`, `check-db.js` | **Lead Full-Stack Architect:** Core Node.js/Express server setup (`server.js`), MongoDB Atlas Cloud Database connection & Mongoose Schemas, External Weather API (`/api/external/weather-advisory`), EJS Template Engine (`/live-donations`), and full-stack real-time integration across all team modules. |
| **Parth Gupta** | [`@ParthlGupta`](https://github.com/ParthlGupta) | **NGO Dashboard, Claiming Portal & MongoDB Claiming Backend (Param 4)** | `NGO DASHBOARD.html`<br>`NGO-DASHBOARD-MONGODB.html`<br>`ngo-dashboard.js`<br>`NGOD.css`<br>`routes/mongoRoutes.js`<br>`routes/apiRoutes.js` (`/claim`) | **NGO Portal & Backend Claiming Lead:** Surplus food feeds grid, dynamic food filtering, and **Backend MongoDB CRUD status update APIs** (`PATCH /api/mongo/donations/:id/status` & `POST /api/donations/:id/claim`) to claim and transition food donations to 'Confirmed' in MongoDB Atlas. |
| **Sambhav** | [`@dsambhav37`](https://github.com/dsambhav37) | **Blog, About Page & Local JSON File-System Backend (Param 3)** | `blog html and css.html`<br>`blog.js`<br>`ABOUT.html`<br>`about.css`<br>`about.js`<br>`routes/jsonRoutes.js`<br>`Data/donations.json`<br>`Data/users.json` | **Content & Local JSON Backend Lead:** Educational articles, mission & vision pages, plus **Backend Express APIs for Local JSON File-System CRUD** (`GET/POST /api/json/donations` and `/api/json/users`), directly fulfilling Parameter 3. |
| **Abhinav Bharti** | [`@abhinavbharti7841`](https://github.com/abhinavbharti7841) | **Reports & Analytics, Tracking & Analytics Backend** | `reports and analytics.html`<br>`reports.css`<br>`reports.js`<br>`Track.html`<br>`track.js`<br>`track.css`<br>`routes/apiRoutes.js` (`/reports/analytics`, `/tracking`) | **Analytics & Tracking Backend Lead:** Community impact charts, category breakdown bars, audit log UI, plus **Backend Timeframe Filtering API** (`GET /api/reports/analytics`) and live journey tracking endpoint (`GET /api/donations/:id/tracking`). |
| **Hrishit Shukla** | [`@shuklahrishit-cmyk`](https://github.com/shuklahrishit-cmyk) | **Home Page, Ratings & Reviews & Feedback Backend** | `HOME.html`<br>`homecss.css`<br>`FoodRescue-Ratings-Reviews.html`<br>`FoodRescue-Ratings-Reviews.css`<br>`reviews.js`<br>`models/Review.js`<br>`routes/apiRoutes.js` (`/reviews`) | **Home & Reviews Backend Lead:** Landing hero section, platform impact stats showcase, plus **Backend MongoDB Reviews CRUD APIs** (`GET/POST /api/reviews`) and Mongoose Review schema. |

---

## 📋 Evaluation Parameters Coverage Matrix

| # | Evaluation Parameter | Implementation Details | Endpoint / Files |
|---|---|---|---|
| **1** | **Fetching and showing data via External APIs calls** | Integrated live weather and food safety advisory using the **Open-Meteo Global Weather API**. Evaluates ambient temperature and humidity to compute food spoilage risks and recommended safe transit windows for perishable surplus food. Also fetches inspirational food rescue quotes via public API. | `GET /api/external/weather-advisory`<br>`GET /api/external/food-quote`<br>Displayed in Donor Dashboard (`donor-dashboard.js`) & NGO Dashboard (`ngo-dashboard.js`). |
| **2** | **Node and Express setup** | Full modular architecture with Express 4.x, CORS, JSON and URL-encoded body parsers, environment variable management via `dotenv`, request logging, error handling middleware, and static asset serving. | `server.js`<br>`package.json`<br>`.env`<br>`GET /api/health` |
| **3** | **Express APIs creation to save/fetch data to local JSON files** | Complete Express endpoints performing full data retrieval, validation, appending, updating, and deleting directly against local JSON files (`Data/donations.json`, `Data/users.json`, `Data/reviews.json`). | `GET /api/json/donations`<br>`POST /api/json/donations`<br>`GET /api/json/donations/:id`<br>`PUT /api/json/donations/:id`<br>`DELETE /api/json/donations/:id`<br>`POST /api/json/users/register`<br>`POST /api/json/users/login` |
| **4** | **CRUD operations using Express APIs to manage data in MongoDB** | Full CRUD implementation using Mongoose Schemas (`Donation`, `User`, `Review`) with schema validation, query filters, status progression, and NGO claiming workflow. Supports both local MongoDB and MongoDB Atlas connection strings with graceful fallback. | `POST /api/mongo/donations` (Create)<br>`GET /api/mongo/donations` (Read All)<br>`GET /api/mongo/donations/:id` (Read One)<br>`PUT /api/mongo/donations/:id` (Update)<br>`PATCH /api/mongo/donations/:id/status` (Update Status)<br>`DELETE /api/mongo/donations/:id` (Delete) |

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. (Optional) Seed Test Data
Populate `Data/donations.json` and MongoDB with realistic donations and test users:
```bash
npm run seed
```

### 3. Start the Server
```bash
npm start
```
> For auto-reloading during development:
> ```bash
> npm run dev
> ```

Open in your browser:
- **Home**: [http://localhost:3000/HOME.html](http://localhost:3000/HOME.html)
- **Donor Dashboard**: [http://localhost:3000/DONOR%20DASHBOARD.html](http://localhost:3000/DONOR%20DASHBOARD.html)
- **NGO Dashboard**: [http://localhost:3000/NGO%20DASHBOARD.html](http://localhost:3000/NGO%20DASHBOARD.html)
- **Donation Tracking**: [http://localhost:3000/Track.html](http://localhost:3000/Track.html)
- **System Health & Evaluation Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🛠️ Configuration & Database Setup (`.env`)

Configure your environment variables in `.env`:

```env
PORT=3000
NODE_ENV=development

# Local MongoDB:
MONGODB_URI=mongodb://127.0.0.1:27017/foodrescue

# Or Cloud MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/foodrescue?retryWrites=true&w=majority
```

*Note: The backend features an intelligent fallback mode. If a local MongoDB instance is not currently running, the server continues to operate seamlessly using local JSON file persistence while still executing full Mongoose schema validations.*

---

## 📡 API Reference

### Parameter 1: External APIs
- `GET /api/external/weather-advisory?lat=28.4595&lon=77.0266&city=Delhi+NCR`
  - Calls Open-Meteo external API.
  - Returns current temperature, humidity, weather condition, and calculated food spoilage risk advisory.
- `GET /api/external/food-quote`
  - Fetches inspirational hunger relief and food rescue tips from public external quote API.

### Parameter 3: Local JSON File APIs (`Data/*.json`)
- `GET /api/json/donations` — Fetch all donations from `Data/donations.json` (supports `?status=...`, `?foodType=...`, `?search=...`, `?donorEmail=...`).
- `GET /api/json/donations/:id` — Fetch single donation by ID from `Data/donations.json`.
- `POST /api/json/donations` — Validate and append new donation to `Data/donations.json`.
- `PUT /api/json/donations/:id` — Update existing donation fields in `Data/donations.json`.
- `PATCH /api/json/donations/:id/status` — Update pickup/delivery status and tracking steps in `Data/donations.json`.
- `DELETE /api/json/donations/:id` — Remove donation from `Data/donations.json`.
- `GET /api/json/users` — Read users from `Data/users.json`.
- `POST /api/json/users/register` — Register user into `Data/users.json`.
- `POST /api/json/users/login` — Authenticate user against `Data/users.json`.
- `GET /api/json/reviews` — Read community reviews from `Data/reviews.json`.
- `POST /api/json/reviews` — Save new review to `Data/reviews.json`.

### Parameter 4: MongoDB CRUD APIs (Mongoose)
- `POST /api/mongo/donations` — **Create** a donation document in MongoDB.
- `GET /api/mongo/donations` — **Read** donations from MongoDB with optional query filters.
- `GET /api/mongo/donations/:id` — **Read** single donation by ID or MongoDB `_id`.
- `PUT /api/mongo/donations/:id` — **Update** donation details in MongoDB.
- `PATCH /api/mongo/donations/:id/status` — **Update** status (`Available`, `Confirmed`, `En Route`, `Delivered`).
- `DELETE /api/mongo/donations/:id` — **Delete** donation document from MongoDB.
- `POST /api/mongo/auth/register` — Register user in MongoDB `users` collection.
- `POST /api/mongo/auth/login` — Authenticate user via MongoDB.
- `GET /api/mongo/reviews` & `POST /api/mongo/reviews` — Read and write reviews to MongoDB `reviews` collection.

### Unified Frontend APIs (`/api/...`)
- `GET /api/donations` — Live hybrid endpoint for dashboards.
- `POST /api/donations` — Add donation (saves to DB and mirrors to JSON).
- `GET /api/donations/:id` — Single donation details for tracking.
- `POST /api/donations/:id/claim` — NGO claims donation and updates status.
- `PATCH /api/donations/:id/status` — Update tracking journey step.
- `DELETE /api/donations/:id` — Cancel / delete donation.
- `GET /api/donations/stats` — Live metrics (total meals, active requests, partner donors).

---

## 🧪 Testing with cURL / Postman / PowerShell

### 1. External Weather API
```bash
curl http://localhost:3000/api/external/weather-advisory
```

### 2. Local JSON File Creation & Retrieval
```bash
curl -X POST http://localhost:3000/api/json/donations \
  -H "Content-Type: application/json" \
  -d '{"foodName":"Dal Makhani","foodType":"Cooked Meals","quantity":40,"pickupWindow":"2026-11-20T18:00:00Z","pickupLocation":"Sector 14","donorName":"Punjab Grill","donorEmail":"grill@donor.org"}'
```

### 3. MongoDB CRUD Create
```bash
curl -X POST http://localhost:3000/api/mongo/donations \
  -H "Content-Type: application/json" \
  -d '{"foodName":"Basmati Rice Combo","foodType":"Cooked Meals","quantity":50,"pickupWindow":"2026-11-20T19:00:00Z","pickupLocation":"Grand Palace","donorName":"Grand Palace","donorEmail":"palace@donor.org"}'
```

### 4. MongoDB CRUD Read
```bash
curl http://localhost:3000/api/mongo/donations
```

---

## 📁 Project Architecture

```
FoodRescue-NGO-Connect/
├── .env                              # Environment configuration (Port, MongoDB URI)
├── .env.example                      # Environment template
├── package.json                      # Dependencies and npm scripts
├── server.js                         # Main Express server setup & middleware
├── seed.js                           # Seed script for initial test data
│
├── models/                           # Mongoose Data Models (Parameter 4)
│   ├── Donation.js                   # Donation schema, validation, timeline
│   ├── User.js                       # User schema with roles (donor/ngo)
│   └── Review.js                     # Review schema
│
├── routes/                           # Modular API Routers
│   ├── externalRoutes.js             # Parameter 1: Weather & Quote External APIs
│   ├── jsonRoutes.js                 # Parameter 3: Local JSON File CRUD APIs
│   ├── mongoRoutes.js                # Parameter 4: MongoDB Mongoose CRUD APIs
│   └── apiRoutes.js                  # Unified API for frontend with auto-sync
│
├── Data/                             # Parameter 3 Local Data Storage
│   ├── donations.json                # Persisted donations JSON file
│   ├── users.json                    # Persisted users JSON file
│   └── reviews.json                  # Persisted community reviews JSON file
│
├── donor-dashboard.js                # Donor Dashboard controller with CRUD & weather card
├── ngo-dashboard.js                  # NGO Dashboard controller with live claims & tracking
├── track.js                          # Dynamic timeline journey tracking controller
├── login.js                          # Authentication with Express backend API
├── Signup page.js                    # Account registration with Express backend API
├── reviews.js                        # Reviews system wired to backend API
├── reports.js                        # Dynamic metrics calculation
└── ... HTML & CSS frontend pages
```
