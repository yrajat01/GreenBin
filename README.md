# GreenBin 🌍🔋
> **Theme Selection:** Smart Cities & Sustainability / Smart Waste Management

GreenBin is an intelligent, real-time waste management platform connecting **citizens**, **collection staff**, and **municipal administrators**. It replaces guesswork in urban waste collection with live IoT bin telemetry, crowd-sourced citizen issue reporting, nearest-neighbour heuristic route optimization, and municipal analytics dashboards.

---

## 👥 Team Information
* **Team Name:** Dev-TA
* **Teammates & Tech IDs:**
  1. **Rajat Yadav** (Tech ID: C15E59)
  2. **Ritik Prajapati** (Tech ID: BD36AE)
  3. **Anshuman Shukla** (Tech ID: BD36DA)
  4. **Priyanshu Singh** (Tech ID: 9C1F4C)

---

## 🛠️ Tech Stack

* **Frontend:** React 19, Vite, Tailwind CSS, Leaflet.js / React-Leaflet, Lucide Icons, Socket.io-client
* **Backend:** Node.js, Express 5, Socket.io, Node-cron
* **Database:** MongoDB (Local, Docker, or MongoDB Atlas) via Mongoose 9
* **Authentication:** Hybrid — Built-in Local/Mock Auth for zero-friction local development + Firebase Auth SDK integration
* **Optimization & Telemetry:** Nearest-neighbour routing algorithm, 30-second automated IoT sensor simulation
* **DevOps & Containerization:** Docker Compose, Vercel (Client), Render (Server)

---

## 📁 Repository Structure

```text
GreenBin/
├── client/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/     # UI widgets, layout, navigation & maps
│   │   ├── context/        # AuthContext (supports mock & real auth)
│   │   ├── pages/          # Admin, Citizen, Staff, Login, Leaderboard
│   │   └── services/       # REST API & Socket.io client handlers
│   ├── public/_redirects   # SPA client-side routing for Netlify/Cloudflare
│   ├── .env.example        # Frontend environment variables template
│   ├── vercel.json         # Vercel SPA routing and security headers
│   └── package.json
├── server/                 # Node.js + Express backend & WebSocket server
│   ├── src/
│   │   ├── config/         # MongoDB and Firebase Admin configurations
│   │   ├── middleware/     # Role-based auth middleware
│   │   ├── models/         # Mongoose schemas (Bin, User, Report, Route, Collection)
│   │   ├── routes/         # REST API endpoints (/api/bins, /api/reports, etc.)
│   │   └── services/       # IoT simulation engine & database seeder
│   ├── .env.example        # Backend environment variables template
│   ├── Dockerfile          # Standalone backend container
│   └── package.json
├── scripts/
│   └── setup.js            # Cross-platform environment initialiser
├── Dockerfile              # Multi-stage production fullstack container
├── docker-compose.yml      # Containerized database & fullstack app services
├── render.yaml             # Render Blueprint deployment definition
├── vercel.json             # Root Vercel zero-config routing
├── Procfile                # Standard PaaS process runner
├── DEPLOYMENT.md           # Step-by-step production hosting manual
├── package.json            # Root workspace scripts (concurrent runners)
└── README.md
```

---

## 🚀 Local Setup & Run Instructions

Follow these instructions to clone, configure, and launch the entire GreenBin platform on your local machine.

### Prerequisites

Ensure you have the following installed on your machine:
* **Node.js**: v18.0.0 or later ([Download Node.js](https://nodejs.org/))
* **npm**: v9.0.0 or later (bundled with Node.js)
* **MongoDB**: Either one of:
  * **Docker Desktop** (Recommended — run with one command `npm run docker:up`)
  * **Local MongoDB Community Server** running on `mongodb://127.0.0.1:27017`
  * **MongoDB Atlas** cloud cluster URI

---

### Option A: Quickstart (Recommended)

1. **Clone your fork and navigate into the project:**
   ```bash
   git clone https://github.com/<your-username>/GreenBin.git
   cd GreenBin
   ```

2. **Initialize Environment Variables:**
   ```bash
   npm run setup
   ```
   *This automatically generates `server/.env` and `client/.env` from their respective `.env.example` templates with ready-to-use local defaults.*

3. **Install Dependencies:**
   ```bash
   npm run install:all
   ```
   *Installs root, backend, and frontend dependencies.*

4. **Start MongoDB:**
   * **If using Docker (Easiest):**
     ```bash
     npm run docker:up
     ```
   * **If using local MongoDB service:** Ensure your local MongoDB service is running (e.g. `mongod` or via Windows Services).
   * **If using MongoDB Atlas:** Open `server/.env` and paste your connection string into `MONGODB_URI`.

5. **Start Both Server & Client Concurrently:**
   ```bash
   npm run dev
   ```
   * This launches:
     * **Backend Server & WebSockets:** `http://localhost:5000`
     * **Frontend Client (Vite):** `http://localhost:5173`
   * On first launch, the server automatically checks the database and seeds default bins, demo users, and initial reports!

6. **Open the Application:**
   Visit **[http://localhost:5173](http://localhost:5173)** in your browser.

---

### Option B: Manual Setup (Separate Terminals)

If you prefer to run server and client in independent terminal windows:

#### 1. Backend Setup
```bash
cd server
cp .env.example .env    # On Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev
```
*Backend will start on `http://localhost:5000`.*

#### 2. Frontend Setup
```bash
cd client
cp .env.example .env    # On Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev
```
*Frontend will start on `http://localhost:5173`.*

---

## 👤 Pre-Configured Demo Accounts

For immediate testing, default accounts are pre-seeded into the database. You can also use the **Quick Demo Login buttons** on the sign-in page (`/login`) to sign in instantly with a single click.

| Role | Email | Password | Access & Features |
| :--- | :--- | :--- | :--- |
| **Municipal Admin** | `admin@greenbin.com` | `12345678` | Live city heatmap, fill-level telemetry, report management, route trigger |
| **Collection Staff** | `staff@greenbin.com` | `12345678` | Optimized collection route, step-by-step waypoint checklist, completion tracking |
| **Citizen** | `rajat@greenbin.com` | `12345678` | Nearest bin map, GPS issue reporting (foul smell, overflow), green points, leaderboard |

> **Note on Firebase:** Firebase configuration is **optional** for local development. GreenBin includes a built-in hybrid authentication layer that allows full functionality (login, registration, role gates, and profile persistence) using local MongoDB and mock tokens without needing a Firebase project.

---

## 🧪 IoT Simulation & Route Optimization

* **Real-time Fill Level Simulation:** The server runs a background job (`node-cron`) every 30 seconds that simulates waste accumulation across city bins and broadcasts updates via **Socket.io**. Watch the bins on the Admin and Citizen maps change color and status in real time!
* **Manual Data Re-seeding:** If you ever want to reset the database to the clean initial state:
  ```bash
  npm run seed
  ```
  *(Or send a `GET` request to `http://localhost:5000/api/seed`)*
* **Nearest-Neighbour Route Engine:** Collection staff routes are dynamically computed based on critical bins (`fillLevel >= 80%` or verified smell reports), starting from the central depot coordinates (`26.8467, 80.9462`).

---

## 📋 Available NPM Scripts

From the repository root:

| Command | Description |
| :--- | :--- |
| `npm run setup` | Copies `.env.example` to `.env` in both `server/` and `client/` if missing |
| `npm run install:all` | Installs dependencies across root, server, and client |
| `npm run dev` | Runs both backend and frontend concurrently with unified colored logs |
| `npm run dev:server` | Starts only the Express backend server |
| `npm run dev:client` | Starts only the Vite React frontend |
| `npm run build` | Builds the client application for production |
| `npm start` | Starts the production server (serves API, Sockets & Client SPA) |
| `npm run seed` | Re-seeds the MongoDB database with initial sample bins, users, and reports |
| `npm run docker:up` | Starts a local MongoDB instance in the background via Docker Compose |
| `npm run docker:all` | Builds and runs the full stack (App + MongoDB) in Docker containers |
| `npm run docker:down` | Stops all running Docker containers |

---

## 🌐 Production Deployment & Hosting

GreenBin is configured for immediate, hassle-free deployment across major cloud providers:

* **Vercel + Render (Recommended):** Deploy frontend to [Vercel](https://vercel.com) using [`vercel.json`](./vercel.json) and backend to [Render](https://render.com) using [`render.yaml`](./render.yaml).
* **Single-Service Deploy:** Deploy to Render, Railway, or Heroku as a single service using `npm start` (Express serves the compiled Vite SPA directly from `client/dist`).
* **Docker Container:** Build with `docker build -t greenbin .` or deploy with `docker-compose.yml`.

👉 **For complete step-by-step instructions and environment variable guides, read [DEPLOYMENT.md](./DEPLOYMENT.md).**

---

---

## ❓ Troubleshooting

<details>
<summary><b>1. MongoDB connection failed: "ECONNREFUSED 127.0.0.1:27017"</b></summary>

* If you have Docker installed, simply run:
  ```bash
  npm run docker:up
  ```
* If you have MongoDB installed locally, ensure the service is running (e.g. `net start MongoDB` on Windows or `sudo systemctl start mongod` on Linux/macOS).
* If you are using MongoDB Atlas, check that `server/.env` has your valid `MONGODB_URI` string and that your current IP address is whitelisted in MongoDB Atlas Network Access.
</details>

<details>
<summary><b>2. Port 5000 or 5173 is already in use</b></summary>

* Change `PORT` in `server/.env` (e.g. `PORT=5001`).
* Update `VITE_API_URL` and `VITE_SOCKET_URL` in `client/.env` to match the new port (`http://localhost:5001`).
</details>

<details>
<summary><b>3. Do I need a Firebase account to run this locally?</b></summary>

* **No.** Leave `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_KEY` empty in `server/.env`, and leave the Firebase keys empty in `client/.env`. The application will operate in local authentication mode, using local MongoDB records and test tokens.
</details>

---

## 📄 License
This project was developed for the Smart Cities & Sustainability Hackathon by **Dev-TA**. Distributed under the ISC License.
