# 🌾 CropConnect — Agricultural Intelligence & Decision Support System

CropConnect is a full-stack web-based agricultural management platform built for Pakistan. It aggregates crop production data, analyzes regional food surpluses and deficits, provides AI-powered yield forecasting, integrates real-time weather intelligence, and offers GIS-based logistics optimization — all in one unified dashboard for government policy makers, NGO coordinators, and distributors.

---

## 🎯 System Goal

The ultimate goal of CropConnect is to **bridge the information gap in Pakistan's agricultural sector** by providing a centralized, data-driven platform that:

- Gives government officials visibility into national and provincial crop output
- Detects food-insecure regions with critical deficits so aid can be dispatched efficiently
- Optimizes logistics routes from surplus regions to deficit regions using toll-cost analysis
- Monitors weather in real time to help farmers and planners react to climate risks
- Forecasts future crop yields using machine learning so long-term policies can be planned proactively

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), TailwindCSS, Recharts, Leaflet.js |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (access + refresh tokens), bcryptjs |
| Scheduling | node-cron |
| Weather API | OpenWeatherMap API |
| Report Generation | pdf-lib, ExcelJS |
| Fonts | Google Fonts (Outfit) |

---

## 📁 Project Structure

```
CropConnect/
├── Backend/
│   ├── controllers/        # Route handlers (business logic)
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express route definitions
│   ├── services/           # External integrations & background services
│   ├── seeds/              # Database seeding scripts
│   ├── utils/              # Helpers (apiResponse, reportInsights, etc.)
│   ├── scheduler.js        # Automated background task runner
│   └── index.js            # App entry point
├── Frontend/
│   └── src/
│       ├── api/            # Axios API client modules
│       ├── components/     # Reusable UI components
│       ├── context/        # React Context (Auth, Alert)
│       ├── pages/          # Page-level components grouped by feature
│       └── App.jsx         # Root router with role-based guards
```

---

## 👥 User Roles & Access Control

The system implements **Role-Based Access Control (RBAC)** enforced at both the backend (JWT middleware) and frontend (`ProtectedRoute` component in `App.jsx`).

| Role | Access |
|---|---|
| `admin` | Full system access: user management, system health, ingestion logs, all reports, all data |
| `government_policy_maker` | Production data, surplus/deficit analysis, forecasting, reports, alerts, GIS map |
| `ngo_coordinator` | Surplus/deficit data, alerts, GIS logistics, weather analysis |
| `distributor` | GIS routing, market prices, weather data |

---

## 🔐 Authentication System

**File:** `Backend/controllers/auth.controller.js`

### How It Works
- Users register with `username`, `email`, `password`, `fullName`, `role`, and `organization`
- Passwords are hashed with **bcryptjs** (salt rounds: 10)
- On registration, a **verification token** is generated and emailed (24-hour expiry)
- Login returns a short-lived **JWT access token** (15 min) and a long-lived **refresh token** (7 days)
- After **5 failed login attempts**, the account is **locked for 30 minutes**
- Password reset flow: user requests a reset link → SHA-256 hashed token stored → reset URL emailed (1-hour expiry)
- Admin-created users are **auto-verified** (no email needed)

### Key Endpoints
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/verify-email/:token` | Email verification |
| POST | `/api/auth/forgot-password` | Send reset link |
| PUT | `/api/auth/reset-password/:token` | Reset password |
| POST | `/api/auth/refresh-token` | Refresh access token |

---

## 📊 Feature 1: Crop Production Data

### What It Does
Provides a comprehensive, filterable database of Pakistan's agricultural output at **National**, **Provincial**, and **District** levels. Users can browse, filter, and drill into individual production records.

### Production List Page (`Frontend/src/pages/production/ProductionList.jsx`)
- Displays a paginated table of all production records (20 per page)
- Each row shows: **Season/Year** (e.g., "2023-24"), **Crop** (with emoji icon), **Region** (District or Province), **Production (tonnes)**, **Area (hectares)**, and **Yield (t/ha)**
- **Filters:** Year, Crop Type, Region — debounced (500ms) to reduce unnecessary API calls
- Clicking any row navigates to the **detailed record page** (`/production/:id`)
- Header stats show total records count and number of active crop types

### Production Detail
- Shows all metrics: production value, area cultivated, yield per hectare
- Displays data source (PBS, MNFSR, USDA_FAS, Economic Survey, etc.)
- Shows reliability rating (high/medium/low), notes, and tags (e.g., "flood_affected", "drought")

### Production Analysis Page
- Aggregated charts and trends across years
- Year-over-year growth rate calculations
- Province-level comparisons

### Backend Implementation (`Backend/controllers/production.controller.js`)
- Uses **MongoDB aggregation pipelines** to group data by crop, province, district
- Implements **in-memory caching** (`Map`) for expensive aggregation queries
- Calculates growth rates by comparing year-over-year production deltas
- Supports pagination, sorting, and multi-dimensional filtering

### Data Model (`Backend/models/productionData.model.js`)
```
year: String (e.g., "2023-24")
level: "national" | "provincial" | "district"
province, district: ObjectId refs
cropType, cropCode, cropName
areaCultivated: { value, unit: "hectares" }
production: { value, unit: "tonnes" }
yield: { value, unit: "tonnes_per_hectare" }
dataSource: PBS | MNFSR | USDA_FAS | Economic_Survey | ...
isEstimated, isForecast, reliability
notes, tags
```

### Data Source
Production data is sourced from **PBS (Pakistan Bureau of Statistics)**, **MNFSR (Ministry of National Food Security & Research)**, and related government agencies. It is seeded into MongoDB via scripts in `Backend/seeds/` and can be automatically ingested via the daily scheduler.

---

## 📈 Feature 2: Surplus / Deficit Analysis

### What It Does
Calculates whether each district/province produces more or less food than it consumes. Identifies food-insecure regions and generates automated recommendations and alerts.

### How It Works (`Backend/controllers/surplusDeficit.controller.js`)
1. **Balance Calculation:** `balance = production - (population × per_capita_consumption)`
2. **Status Assignment:** `surplus` (balance > 0) or `deficit` (balance < 0)
3. **Severity Classification:**
   - `critical`: deficit > 30% of consumption need
   - `high`: deficit 15–30%
   - `moderate`: deficit < 15%
4. **Self-Sufficiency Ratio:** `(production / consumption) × 100`
5. **Recommendations:** Auto-generated based on status and severity
6. **Alerts:** Critical deficit regions trigger automatic alert creation in the database, targeting relevant user roles

### Surplus/Deficit Pages
- **List View:** Table of all regions with status badges (Surplus/Deficit), balance figures, and severity indicators
- **Detail View:** Clicking a region shows full breakdown: production, consumption, balance, severity, recommendations, and suggested distribution sources
- **Analysis Page:** Aggregated charts — total surplus vs. deficit by province, top deficit districts, crop-by-crop breakdown

### Data Used
- Production data from the `ProductionData` collection
- Population estimates and per-capita consumption constants stored in district/province models

---

## 🗺️ Feature 3: GIS & Interactive Map

### What It Does
Renders an interactive map of Pakistan color-coded by surplus/deficit status. Also calculates optimized logistics routes from surplus regions to deficit regions, factoring in road toll costs and transport distances.

### Map View (`Frontend/src/pages/gis/MapView.jsx`)
- Full-screen interactive map powered by **Leaflet.js** with GeoJSON district/province boundaries
- **Filter Controls** (floating glassmorphism panel):
  - Crop Layer (Wheat, Rice, Cotton, Maize, Sugarcane)
  - Year
  - View Level (District / Province)
- **Color Coding:**
  - 🟢 Green = Surplus
  - 🟡 Yellow = Moderate Deficit
  - 🔴 Red = Critical Deficit
  - ⚫ Gray = Balanced / No Data
- **Region Info Panel** (slides in from right on click):
  - Shows production, consumption, net balance
  - Self-sufficiency ratio with progress bar
  - Region name and status badge

### Route Optimization (`Backend/controllers/gis.controller.js`)
- Retrieves all surplus regions for a crop and all deficit regions
- For each surplus-deficit pair, calculates:
  - **Geographic distance** (Haversine formula using lat/lng coordinates)
  - **Toll costs** from stored `TollRate` data
  - **Total transport cost** = distance × rate per km + toll fees
- Returns a ranked list of routes sorted by cost-efficiency
- The frontend displays these as dashed route lines on the map with cost summaries

### GeoJSON Data
- District and province boundaries stored as GeoJSON in the database
- Fetched via `/api/gis/geojson/districts` and `/api/gis/geojson/provinces`
- Each feature is enriched with surplus/deficit data before being sent to the frontend

---

## ☁️ Feature 4: Weather Intelligence

### What It Does
Fetches real-time weather data and 7-day forecasts for any district using the **OpenWeatherMap API**. Evaluates weather conditions against crop-specific stress thresholds and generates alerts when dangerous conditions are detected.

### Weather Analysis Page (`Frontend/src/pages/weather/WeatherAnalysis.jsx`)
- **District Selector** — dropdown of all 100+ Pakistani districts
- **Current Weather Widget** — live temperature, humidity, wind speed, conditions
- **7-Day Extended Forecast** — daily cards with max/min temp, condition icon, rainfall probability
- **Climate Summary Tiles** — avg temp, max/min temp, total rainfall, avg humidity (from 30-day history)
- **Crop Impact Analysis** — per-crop risk cards showing:
  - Current conditions relevant to that crop (wheat, rice, cotton, sugarcane, maize)
  - Active stressors (e.g., "Heat Stress", "High Humidity")
  - Recommendations (e.g., "Increase irrigation frequency")
  - 10-day forecast impact table (expandable) with per-day risk badge
- **Climate Advisories** — automated warnings for heat stress (>35°C avg), flooding risk (>100mm rain), disease risk (>80% humidity)
- **Historical Charts:**
  - Temperature & Humidity area chart (30-day history)
  - Rainfall bar chart (30-day history)

### Backend Implementation (`Backend/services/weather.service.js`, `Backend/controllers/weather.controller.js`)
- Calls **OpenWeatherMap API** (current + 5-day/3-hour forecast endpoint)
- Aggregates 3-hour forecast data into daily summaries
- **Crop Stress Thresholds** (hardcoded by crop):
  - Wheat: heat stress > 32°C, frost risk < 5°C
  - Rice: heat stress > 38°C, waterlogging risk > 60mm rain
  - Cotton: cold stress < 15°C
- If thresholds are breached, the service creates an `Alert` record in MongoDB and (for critical conditions) triggers an **email notification** to subscribers
- Weather data is cached in MongoDB for 4 hours to reduce API calls

### Environment Variable Required
```
WEATHER_API_KEY=your_openweathermap_api_key
```

---

## 🔮 Feature 5: AI Yield Forecasting

### What It Does
Provides ML-powered crop production forecasts from 2024 to 2033, with confidence intervals, model accuracy metrics, regional comparisons, and scenario-based policy recommendations.

### Yield Forecasting Page (`Frontend/src/pages/production/YieldForecasting.jsx`)

**Controls:**
- Crop selector (Wheat, Rice, Cotton)
- Region selector (Pakistan national / Punjab / Sindh / KPK / Balochistan)
- Multi-Crop Comparison toggle (overlays all crops on one chart)

**Key Visualizations:**
1. **Production Timeline Chart** — solid green line (actual 2018–2024) + dashed indigo line (forecast 2024–2033) + shaded confidence band (±error margin)
2. **Year-over-Year Growth Rate** — bar chart of annual % change in forecast
3. **Forecast Uncertainty Heatmap** — uncertainty increases for years further in the future
4. **Historical Accuracy Validation** — actual vs. AI backtest comparison (2018–2024)
5. **Residual Analysis** — bar chart comparing actual vs. predicted for overlapping years
6. **Regional Forecast Comparison** — cross-province bar chart for a selected forecast year
7. **Market Prices Cross-Reference** — district-level current wholesale prices for the selected crop

**AI Insights Panel:**
- Overall trend summary (e.g., "significant increase of 12%")
- Growth path comparison (start vs. end forecast values)
- Reliability score based on R² metric

**Scenario-Based Recommendations:**
For the final forecast year, three scenarios are presented:
- **Optimistic:** Expand exports, invest in grain reserves
- **Baseline:** Maintain policies, monitor market prices
- **Conservative/Pessimistic:** Activate import plans, increase subsidies

**Model Performance Metrics** (displayed at bottom):
- Test R² Score, Cross-Validation R² Score, RMSE, MAE

### Backend (`Backend/controllers/prediction.controller.js`)
- Pulls historical data from `ProductionData` model
- Pulls forecast data from `YieldPrediction` model (pre-seeded by Python ML scripts)
- Merges both into a unified timeline response
- Caches results per `(crop, region)` combination

### Data Source
- Historical production: PBS / MNFSR records (2018–2024), seeded via `Backend/seeds/`
- Forecast data: Generated offline by Python ML models (Linear Regression, Random Forest, XGBoost), results stored in `YieldPrediction` collection along with `ModelPerformance` metrics (R², RMSE, MAE, MAPE, bestModel)

---

## 📉 Feature 6: Market Price Monitoring

### What It Does
Tracks wholesale crop prices across districts, identifies top gainers, volatile crops, and triggers alerts when prices breach configured thresholds.

### Market Price Page
- **Latest Prices Table** — most recent price per crop across all districts
- **Price History Chart** — time series for a selected crop+district pair (configurable time window: 7/30/90 days)
- **Market Highlights** (dashboard widget):
  - Average wheat price (PKR/40kg)
  - Top gainer (7-day % gain)
  - Most volatile crop (by price update frequency)

### Backend (`Backend/controllers/market.controller.js`)
- `getLatestPrices()`: Aggregation pipeline groups by crop, takes the most recent entry, populates crop and district names, caches result
- `getPriceHistory()`: Returns time-series price data for a specific crop+district within a date range
- `getMarketHighlights()`: Computes avg wheat price, top gainer (% change over 7 days), and most volatile crop (most price updates in 30 days)

### Price Threshold Alerting (`Backend/services/priceMonitor.service.js`)
- Admins can configure `PriceThreshold` records per crop (with optional district scope):
  - `thresholdType`: "above", "below", or "both"
  - `upperLimit`, `lowerLimit` (PKR values)
  - `alertSeverity`: low / medium / high / critical
  - `cooldownHours`: prevents alert spam
- The scheduler runs this check **every 30 minutes**
- If a threshold is breached (and cooldown has passed), a `price_alert` Alert is created in the database
- Critical/high severity alerts also trigger in-app + email delivery

---

## 🚨 Feature 7: Alerts System

### What It Does
Provides a centralized, role-filtered notification system for all system events (price breaches, critical deficits, weather extremes, manual admin alerts).

### Alert Types
| Type | Trigger |
|---|---|
| `deficit_alert` | Critical deficit detected in surplus/deficit analysis |
| `price_alert` | Market price breaches a configured threshold |
| `weather_alert` | Extreme temperature or rainfall detected for a district |
| `system_alert` | Admin-created manual alert |

### Alert Lifecycle
1. **Created** (status: `active`) — auto by system or manually by admin
2. **Acknowledged** (status: `acknowledged`) — any authorized user marks it read
3. **Resolved** (status: `resolved`) — admin or policy maker closes it with optional resolution notes

### Filtering & Display (`Backend/controllers/alert.controller.js`)
- Alerts are **filtered by user role** — each user only sees alerts targeted at their role or at `"all"`
- Endpoints:
  - `GET /api/alerts` — paginated list with filters (type, severity, status, province, district, crop)
  - `GET /api/alerts/active` — unresolved alerts only
  - `GET /api/alerts/critical` — severity=critical and status≠resolved
  - `GET /api/alerts/unread/count` — count for badge display
  - `GET /api/alerts/summary` — total, active, critical, unacknowledged counts + breakdown by type
  - `PUT /api/alerts/:id/acknowledge` — mark as acknowledged
  - `PUT /api/alerts/:id/resolve` — resolve with notes
  - `POST /api/alerts` — admin creates manual alert

### Delivery Channels
- **In-App:** Always enabled
- **Email:** Enabled for `critical` and `high` severity alerts (via Nodemailer service)

---

## 📄 Feature 8: Report Generation

### What It Does
Allows users to generate downloadable analytical reports in **PDF**, **Excel**, or **CSV** format with embedded charts, KPI summaries, and AI-driven decision support insights.

### Report Types

#### Production Analysis Report (`POST /api/reports/production-analysis`)
**Parameters:** year, crops (array), provinces (array), format (pdf/excel/csv)

**PDF Structure:**
1. Title page with table of contents
2. Executive Summary — 6 KPI boxes (Total Production, Total Area, Avg Yield, Provinces, Districts, Crop Types)
3. Charts — Production by Province (horizontal bar), Yield by Crop (horizontal bar) — rendered using pdf-lib drawing primitives
4. Decision Support & Insights — AI-generated text insights (yield anomalies, top producers, recommendations)
5. Detailed Data Table — color-coded rows (green = high production, red = low)

**Excel Structure:**
- Sheet 1: Production data table
- Sheet 2: Insights & Recommendations

#### Surplus/Deficit Report (`POST /api/reports/surplus-deficit`)
**Parameters:** year, crops (array), format (pdf/excel/csv)

**PDF Structure:**
1. Title page
2. Executive Summary — 6 KPI boxes (Total Regions, Surplus Regions, Deficit Regions, Critical Zones, Net Balance, Total Surplus)
3. Charts — Surplus vs Deficit by Province (grouped bars in green/red), Top Deficit Districts
4. Decision Support & Insights
5. Color-coded data table (green rows = surplus, red rows = deficit)

### Report Storage
- Generated files saved to `Backend/public/reports/`
- Report metadata (filename, fileUrl, fileSize, status, parameters) stored in `Report` MongoDB collection
- Users can view and re-download reports from the Reports List page
- Non-admin users can only see their own reports; admins see all

---

## ⚙️ Feature 9: Admin Panel

### Admin Dashboard (`Frontend/src/pages/dashboard/AdminDashboard.jsx`)
- **Stats Row:** Total Users, Active Alerts, System Status, Reports Generated
- **Platform Activity Chart:** Area chart showing new user registrations and active sessions over 6 months
- **Quick Actions:** User Management, System Health, Reports
- **Live Weather Widget** embedded in sidebar
- **Admin Shortcuts:** Role Definitions, Audit Logs

### User Management (`Backend/controllers/admin.controller.js`)
- `GET /api/admin/users` — paginated user list with filters (role, isActive, isVerified, search)
- `POST /api/admin/users` — create user (auto-verified)
- `PUT /api/admin/users/:id` — update role, status, organization
- `DELETE /api/admin/users/:id` — delete user

### System Health (`GET /api/admin/health`)
Returns:
- Database connection status
- Failed ingestion count (last 24h)
- Pending reports count
- Server memory usage (RSS, heap total, heap used in MB)
- Process uptime

### Data Ingestion Logs (`GET /api/admin/ingestion-logs`)
- Every automated data import is logged in `DataIngestionLog`
- Filterable by status (success/failed) and source type
- Shows timestamp, record counts, initiating user or "scheduler"

### System Settings (`GET/PUT /api/admin/settings`)
- Key-value settings grouped by category
- Editable settings can be updated via `PUT /api/admin/settings/:key`
- Non-editable system constants are read-only

---

## 🕐 Feature 10: Automated Scheduler

**File:** `Backend/scheduler.js`

The scheduler uses **node-cron** to run background tasks automatically without any user intervention.

| Schedule | Task | Details |
|---|---|---|
| Daily (midnight) | **PBS Data Ingestion** | Fetches latest production data from government sources and updates the database |
| Every 4 hours | **Weather Updates** | Calls OpenWeatherMap API for all districts, stores results, checks crop stress thresholds |
| Every 30 minutes | **Price Threshold Check** | Runs `checkAllThresholds()` — compares latest market prices against all active `PriceThreshold` configurations |
| Daily (1:00 AM) | **Report Generation** | Auto-generates scheduled reports for users who have opted into periodic summaries |

All scheduled runs are logged to `DataIngestionLog` with status, timestamps, and record counts.

---

## 🌐 External Data Dependencies

| Source | Purpose | Integration Method |
|---|---|---|
| **OpenWeatherMap API** | Current weather, 5-day/3-hour forecast | REST API via HTTPS (`WEATHER_API_KEY` env var) |
| **PBS (Pakistan Bureau of Statistics)** | Official crop production figures | Seeded via scripts; daily ingestion updates |
| **MNFSR** | National food security data | Seeded as official historical records |
| **USDA FAS** | Cross-reference production data | Imported as `dataSource: "USDA_FAS"` records |
| **Pakistan Economic Survey** | Annual agricultural statistics | Seeded as `dataSource: "Economic_Survey"` |

---

## 🗃️ Database Models Summary

| Model | Purpose |
|---|---|
| `User` | User accounts, roles, auth tokens, preferences |
| `ProductionData` | Crop production, area, yield by year/region |
| `SurplusDeficit` | Balance calculations per crop/district/year |
| `Alert` | System notifications with lifecycle management |
| `Report` | Report metadata and file references |
| `Weather` | Stored weather observations per district |
| `MarketPrice` | Timestamped wholesale prices per crop/district |
| `YieldPrediction` | ML forecast data (2024–2033) |
| `ModelPerformance` | ML model accuracy metrics (R², RMSE, MAE) |
| `PriceThreshold` | Configurable price alert thresholds |
| `DataIngestionLog` | Audit log for all data import operations |
| `SystemSettings` | Key-value application configuration |
| `Province` | Province reference data with GeoJSON |
| `District` | District reference data with coordinates and GeoJSON |
| `CropType` | Crop catalog (name, code, category, thresholds) |
| `TollRate` | Road toll data for logistics cost calculation |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- OpenWeatherMap API Key

### Environment Variables (`Backend/.env`)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cropconnect
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=7d
WEATHER_API_KEY=your_openweathermap_key
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.yourprovider.com
EMAIL_USER=your@email.com
EMAIL_PASS=yourpassword
```

### Installation & Setup

```bash
# 1. Install Backend dependencies
cd Backend
npm install

# 2. Seed the database (provinces, districts, crops, production data, market prices, weather, toll rates, AI predictions)
node seeds/masterSeed.js

# 3. Start Backend
npm run dev

# 4. Install Frontend dependencies
cd ../Frontend
npm install

# 5. Start Frontend
npm run dev
```

The backend runs on `http://localhost:3000` and the frontend on `http://localhost:5173`.

---

## 🔑 API Base Routes

| Prefix | Feature |
|---|---|
| `/api/auth` | Authentication |
| `/api/production` | Crop production data |
| `/api/surplus-deficit` | Surplus/deficit analysis |
| `/api/gis` | GeoJSON maps, districts, routes |
| `/api/weather` | Weather data & crop impact |
| `/api/predictions` | Yield forecasting |
| `/api/market` | Market prices |
| `/api/alerts` | Alert management |
| `/api/reports` | Report generation & download |
| `/api/admin` | Admin panel endpoints |

---

## 📌 Key Design Decisions

1. **In-Memory Caching:** Heavy aggregation queries (GIS, production trends, market highlights) are cached in a `Map` object to avoid re-running expensive MongoDB pipelines on every request.

2. **Multi-Level Geographic Hierarchy:** All production and surplus/deficit data supports `national → provincial → district` granularity, allowing both high-level policy views and granular district-level drill-downs.

3. **Role-Filtered Alerts:** Alerts are stored with `targetRoles` arrays, so every query automatically filters results to show only what's relevant to the logged-in user's role.

4. **Offline ML Forecasts:** Yield predictions are pre-computed offline (Python ML pipeline) and stored in MongoDB. This keeps API response times fast and separates the compute-heavy ML workload from the web server.

5. **Automated Scheduler as System Backbone:** The `scheduler.js` cron runner ensures the system stays current without manual intervention — data freshness is maintained automatically.

6. **PDF Generation Without External Services:** Reports are generated server-side using `pdf-lib` (pure JavaScript) and `ExcelJS`, with bar charts drawn programmatically — no headless browser or external PDF service required.
