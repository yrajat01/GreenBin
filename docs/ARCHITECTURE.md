# GreenBin System Architecture

## 1. Overview
GreenBin is a full-stack smart waste management and municipal sustainability platform. It combines real-time IoT bin capacity telemetry, dynamic collection route optimization (Nearest-Neighbor Traveling Salesperson Problem), citizen issue crowdsourcing with gamified eco-points, and administrative route dispatch.

---

## 2. High-Level System Architecture

```
                  ┌───────────────────────────────────────────────┐
                  │                 Client Tier                   │
                  │       (Vite + React 19 + Tailwind CSS)        │
                  └──────────────┬──────────────────┬─────────────┘
                                 │ HTTP / JSON      │ WebSocket
                                 ▼                  ▼
                  ┌───────────────────────────────────────────────┐
                  │                 Server Tier                   │
                  │             (Express.js + Node)               │
                  ├───────────────────────────────────────────────┤
                  │ Routes        - Request routing & RBAC        │
                  │ Controllers   - HTTP validation & envelopes   │
                  │ Services      - Business logic & heuristics   │
                  │ Middleware    - Auth, Async, Central Error    │
                  └──────────────┬──────────────────┬─────────────┘
                                 │                  │
                                 ▼                  ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │  MongoDB Atlas  │    │  Firebase Auth  │
                    │   (Mongoose)    │    │ (Admin SDK opt) │
                    └─────────────────┘    └─────────────────┘
```

---

## 3. Directory Structure

```
GreenBin/
├── client/                               # Frontend Single Page Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                   # Atomic, reusable UI elements
│   │   │   │   ├── Navbar.jsx            # Role-aware navigation bar
│   │   │   │   ├── StatCard.jsx          # KPI metric cards
│   │   │   │   ├── StatusBadge.jsx       # Status badge with design tokens
│   │   │   │   ├── Modal.jsx             # Accessible modal dialog
│   │   │   │   ├── Toast.jsx             # Notification alert
│   │   │   │   ├── LoadingSpinner.jsx    # Loading indicators & spinners
│   │   │   │   └── ErrorBoundary.jsx     # Top-level React error catcher
│   │   │   └── map/
│   │   │       └── MapComponent.jsx      # Leaflet map with routing & truck GPS
│   │   ├── config/
│   │   │   ├── env.js                    # Centralized client env variables
│   │   │   └── firebase.js               # Firebase Client SDK setup
│   │   ├── constants/
│   │   │   ├── roles.js                  # Roles & route constants
│   │   │   └── binStatus.js              # Bin & report status mapping
│   │   ├── context/
│   │   │   ├── AuthContext.jsx           # Global user authentication state
│   │   │   └── SocketContext.jsx         # Global WebSocket state & connection
│   │   ├── hooks/
│   │   │   ├── useAuth.js                # Auth consumer hook
│   │   │   ├── useSocket.js              # Real-time event listener hook
│   │   │   ├── useBins.js                # Bin queries & real-time updates
│   │   │   └── useReports.js             # Reports submission & state
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx       # Standard layout wrapper
│   │   ├── pages/                        # View components
│   │   │   ├── AdminDashboard.jsx        # Admin monitoring & dispatch
│   │   │   ├── CitizenDashboard.jsx      # Citizen dashboard & quick report
│   │   │   ├── Home.jsx                  # Marketing & public landing page
│   │   │   ├── Leaderboard.jsx           # Gamified citizen rankings
│   │   │   ├── Login.jsx                 # Role-based login portal
│   │   │   ├── ReportIssue.jsx           # 4-step issue reporting workflow
│   │   │   ├── Signup.jsx                # Citizen self-registration
│   │   │   └── StaffRouteView.jsx        # Field staff turn-by-turn navigation
│   │   ├── services/                     # API client & domain services
│   │   │   ├── apiClient.js              # Fetch client with interceptors
│   │   │   ├── authService.js            # User authentication endpoints
│   │   │   ├── binService.js             # Smart bin operations
│   │   │   ├── reportService.js          # Issue reporting operations
│   │   │   ├── routeService.js           # Route optimization operations
│   │   │   ├── leaderboardService.js     # Leaderboard data
│   │   │   └── socketService.js          # Socket client connection
│   │   ├── utils/
│   │   │   ├── geo.js                    # Haversine distance & bearing math
│   │   │   └── formatters.js             # Formatting functions
│   │   ├── App.jsx                       # Provider hierarchy & routes
│   │   ├── index.css                     # Tailwind directives & design tokens
│   │   └── main.jsx                      # Entrypoint
│   └── package.json
│
├── server/                               # Backend REST & WebSocket Server
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                    # Centralized env validation
│   │   │   ├── db.js                     # MongoDB connection with auto-reconnect
│   │   │   └── firebase.js               # Firebase Admin SDK initialization
│   │   ├── constants/
│   │   │   └── roles.js                  # System roles, statuses, and zones
│   │   ├── controllers/                  # Request handling & orchestration
│   │   │   ├── binController.js
│   │   │   ├── reportController.js
│   │   │   ├── routeController.js
│   │   │   ├── leaderboardController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js         # JWT / local token verification & RBAC
│   │   │   ├── asyncHandler.js           # Async route error wrapper
│   │   │   └── errorHandler.js           # Centralized API error formatter
│   │   ├── models/                       # Mongoose schemas
│   │   │   ├── Bin.js                    # Smart waste container model
│   │   │   ├── Collection.js             # Collection history log
│   │   │   ├── Report.js                 # Citizen issue tickets
│   │   │   ├── Route.js                  # Optimized collection routes
│   │   │   └── User.js                   # Citizen, staff, and admin accounts
│   │   ├── routes/                       # Express router definitions
│   │   │   ├── index.js                  # Aggregated API router
│   │   │   ├── binRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   ├── routeRoutes.js
│   │   │   ├── leaderboardRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── services/                     # Pure domain business logic
│   │   │   ├── binService.js
│   │   │   ├── reportService.js
│   │   │   ├── routeService.js
│   │   │   ├── leaderboardService.js
│   │   │   ├── userService.js
│   │   │   ├── routing.js                # Nearest Neighbor TSP heuristic
│   │   │   ├── seed.js                   # Initial infrastructure seeder
│   │   │   └── simulation.js             # IoT fill level simulation engine
│   │   ├── utils/
│   │   │   ├── apiError.js               # Operational error classes
│   │   │   ├── apiResponse.js            # Standardized response formatters
│   │   │   └── logger.js                 # Structured console logger
│   │   └── server.js                     # Express app setup & lifecycle
│   └── package.json
└── docs/
    ├── ARCHITECTURE.md
    └── API.md
```

---

## 4. Key Architectural Patterns

### 1. Three-Tier Server Architecture
- **Routes Layer (`routes/`)**: Responsible only for defining endpoint paths, HTTP verbs, and attaching authentication/RBAC middleware.
- **Controllers Layer (`controllers/`)**: Extracts request parameters, validates input, calls corresponding service methods, and serializes responses using `ApiResponse`.
- **Services Layer (`services/`)**: Houses all business logic, database mutations, mathematical heuristics, and real-time socket event emissions. Controllers and routes never perform direct DB writes.

### 2. Centralized Error Handling
- Controllers use `asyncHandler` to eliminate repetitive `try/catch` boilerplate.
- Operational errors are instantiated using `ApiError` with specific HTTP status codes (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `tooManyRequests`).
- Express `errorHandler` middleware catches all unhandled exceptions, sanitizes validation errors from Mongoose, formats standard JSON responses, and logs server crashes.

### 3. Client State & Service Separation
- Pages do not issue ad-hoc `fetch` requests. All network interactions are routed through domain services (`binService`, `reportService`, etc.) backed by `apiClient`.
- Real-time updates use `SocketContext` and the `useSocketEvent` hook to subscribe to domain events with automatic unsubscription upon component unmount.
- Reusable custom hooks (`useBins`, `useReports`, `useAuth`) manage local state transitions and optimistic UI updates.

### 4. Security & Anti-Enumeration
- Login requests validate email, password, and requested role concurrently. Any mismatch returns a generic HTTP 401 `"Invalid email or password"` without disclosing whether the email exists or belongs to another role.
- Self-registration is strictly restricted to the `citizen` role. Any registration request containing `role: 'admin'` or `role: 'staff'` is rejected with HTTP 403. Admin and staff records must be provisioned directly by the database administrator.

