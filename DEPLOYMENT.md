# GreenBin 🌍🔋 Production Hosting & Deployment Guide

This guide covers deploying the **GreenBin** Smart Waste Management & Sustainability platform to production across popular hosting platforms (Vercel, Render, Railway, Docker, and MongoDB Atlas).

---

## 🏗️ Architecture Overview

GreenBin is built as a modern fullstack architecture:
* **Frontend:** React 19 + Vite SPA (Client-side routed)
* **Backend:** Node.js Express 5 + Socket.io (WebSocket telemetry & IoT simulation)
* **Database:** MongoDB (MongoDB Atlas cloud cluster)
* **Auth:** Hybrid Firebase Auth + local MongoDB fallback

You can host GreenBin using either:
1. **Separated Hosting (Recommended for scale):** Frontend on **Vercel** + Backend on **Render** (or Railway).
2. **Unified Single-Service Hosting (Easiest / Lowest cost):** Frontend built and served directly by Express on **Render**, **Railway**, or **Docker** as a single service.

---

## 🗄️ Database Setup: MongoDB Atlas (Cloud)

Before deploying the backend, prepare your cloud MongoDB database:

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Deploy a free **M0 Sandbox Cluster**.
3. Under **Database Access**, create a database user (e.g., `greenbin_admin`) and save the password.
4. Under **Network Access**, click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`) so cloud servers (Render/Vercel) can connect.
5. In your Cluster view, click **Connect** ➔ **Drivers (Node.js)** and copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/greenbin?retryWrites=true&w=majority
   ```

---

## 🚀 Option 1: Vercel (Frontend) + Render (Backend) [Recommended]

### Part A: Deploy Backend on Render

1. Go to [render.com](https://render.com) and create a **New Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   * **Name:** `greenbin-backend`
   * **Root Directory:** `server`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Health Check Path:** `/api/health`
4. Add the following **Environment Variables**:
   | Variable | Value / Description |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | Your MongoDB Atlas connection string |
   | `CLIENT_URL` | Your Vercel frontend URL (e.g. `https://greenbin.vercel.app`) |
   | `DEPOT_LAT` | `26.8467` |
   | `DEPOT_LNG` | `80.9462` |
   | `FIREBASE_PROJECT_ID` | (Optional) Your Firebase project ID or leave empty for mock mode |
   | `FIREBASE_SERVICE_ACCOUNT_KEY` | (Optional) Firebase service account key |
5. Click **Create Web Service**. Once deployed, copy your backend URL (e.g. `https://greenbin-backend.onrender.com`).

---

### Part B: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New ➔ Project**.
2. Import your GreenBin GitHub repository.
3. Vercel automatically detects the configuration from the repository's `vercel.json`:
   * **Framework Preset:** Vite
   * **Root Directory:** `./` (or `client` if deploying client directly)
   * **Build Command:** `npm --prefix client run build` (or `npm run build` if Root is `client`)
   * **Output Directory:** `client/dist` (or `dist` if Root is `client`)
4. Add the following **Environment Variables** in Vercel:
   | Variable | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://greenbin-backend.onrender.com` (Your Render backend URL) |
   | `VITE_SOCKET_URL` | `https://greenbin-backend.onrender.com` (Your Render backend URL) |
5. Click **Deploy**.
6. **Important Final Step:** Copy your assigned Vercel URL (e.g. `https://greenbin.vercel.app`) and update the `CLIENT_URL` environment variable on Render so CORS and WebSockets allow requests from your Vercel domain.

---

## ⚡ Option 2: 1-Click Render Blueprint Deploy

The repository includes a ready-to-use [`render.yaml`](./render.yaml) blueprint specification.

1. In Render, click **New ➔ Blueprint**.
2. Connect your repository.
3. Render will automatically configure both services:
   * `greenbin-backend` (Node API + Socket.io)
   * `greenbin-frontend` (Static Web App with rewrite rules)
4. Populate `MONGODB_URI` in the dashboard when prompted and deploy!

---

## 📦 Option 3: Monolithic / Single-Service Hosting (Railway / Render / Heroku)

GreenBin's backend Express server automatically detects and serves the built client assets from `client/dist` when run in production mode!

To deploy as a single service:
1. Set the build command to:
   ```bash
   npm run install:all && npm run build
   ```
2. Set the start command to:
   ```bash
   npm start
   ```
3. Environment variables needed:
   * `NODE_ENV=production`
   * `MONGODB_URI=<your-atlas-uri>`
   * `CLIENT_URL=http://localhost:5000` (or leave default)

Both the React SPA and the Express API will be accessible from the exact same URL without any cross-origin hurdles!

---

## 🐳 Option 4: Docker Container Deployment

The repository includes production Dockerfiles:
* [`Dockerfile`](./Dockerfile): Multi-stage container building client + server for fullstack deployment
* [`server/Dockerfile`](./server/Dockerfile): Standalone lightweight backend API container
* [`docker-compose.yml`](./docker-compose.yml): Production & local composition

### Running Fullstack Container with Docker:

```bash
# Build the production image
docker build -t greenbin:latest .

# Run container with external MongoDB Atlas
docker run -d -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/greenbin" \
  --name greenbin-app \
  greenbin:latest
```

### Running Complete Stack with Docker Compose:

```bash
docker compose up -d
```
Visit `http://localhost:5000` to access the application.

---

## 🛡️ Pre-Launch Checklist

- [x] **Database Connectivity:** MongoDB Atlas IP whitelist set to `0.0.0.0/0` (Allow from Anywhere).
- [x] **Initial Data Seeding:** Database automatically seeds default bins, users, and reports on first run if empty. Alternatively, hit `GET /api/seed` to manually trigger seed data.
- [x] **Health Checks:** Cloud health check available at `/api/health` and `/health`.
- [x] **Client-Side Routing (SPA):** Configured via [`client/vercel.json`](./client/vercel.json), [`client/public/_redirects`](./client/public/_redirects), and Express fallback.
- [x] **Cross-Origin Requests:** Backend dynamically allows configured `CLIENT_URL`, `localhost`, `.vercel.app`, and `.onrender.com` domains.
- [x] **Asset Bundling:** Vite build optimized with vendor chunk splitting for fast browser load times.
