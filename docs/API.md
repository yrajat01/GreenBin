# GreenBin REST API Reference

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://<your-backend-domain>/api`

## Authentication
Protected routes require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <token>
```
Tokens are generated upon successful login (`/api/users/login`) or signup (`/api/users/signup`).

---

## 1. Authentication & Users

### `POST /api/users/login`
Authenticates a user and issues an authorization token.

**Request Body:**
```json
{
  "email": "citizen@example.com",
  "password": "yourPassword123",
  "role": "citizen"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "local-uid-user-1730560000000",
  "user": {
    "uid": "uid-user-1730560000000",
    "name": "Jane Doe",
    "email": "citizen@example.com",
    "role": "citizen",
    "zone": "Zone-A",
    "points": 50,
    "badgesEarned": ["First Report"]
  }
}
```

**Error (401 Unauthorized):**
```json
{
  "message": "Invalid email or password"
}
```

---

### `POST /api/users/signup`
Self-registration for citizen accounts only.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "citizen@example.com",
  "password": "yourPassword123",
  "zone": "Zone-A"
}
```

**Response (201 Created):**
```json
{
  "message": "Citizen account registered successfully",
  "token": "local-uid-user-1730560000000",
  "user": { ... }
}
```

---

### `GET /api/users/me`
Retrieves profile of the authenticated user. Requires `Authorization: Bearer <token>`.

---

## 2. Smart Bins

### `GET /api/bins`
Returns all smart waste containers with current fill levels, statuses, and coordinates.

**Response (200 OK):**
```json
[
  {
    "binId": "GB-042",
    "location": {
      "name": "Market St & 5th (Central Park)",
      "lat": 26.8407,
      "lng": 80.9422
    },
    "fillLevel": 94,
    "status": "critical",
    "zone": "Zone-A",
    "collectionType": "sensor",
    "lastCollected": "2026-11-01T12:00:00.000Z"
  }
]
```

---

### `GET /api/bins/:binId`
Returns details for a single bin by its unique identifier (e.g., `GB-042`).

---

### `PATCH /api/bins/:binId/collect`
Marks a bin as emptied/collected. Restricted to `staff` and `admin` roles.
- Resets `fillLevel` to 5% and `status` to `normal`.
- Creates a `Collection` history log.
- Resolves all pending reports associated with the bin.
- Broadcasts WebSocket events `bin_update` and `bin_collected`.

---

## 3. Issue Reports & Gamification

### `POST /api/reports`
Submits a citizen issue report. Restricted to `citizen` and `admin` roles.
- Rate-limited to 5 reports per hour per user.
- Sets bin status to `smell_reported`.
- Awards 10 eco-points and evaluates milestone badges (`First Report`, `Eco Regular`, `Eco Champion`).

**Request Body:**
```json
{
  "binId": "GB-042",
  "issueType": "Foul Smell",
  "description": "Bin is overflowing and causing bad odor.",
  "photoUrl": ""
}
```

---

### `GET /api/reports/my`
Retrieves reports submitted by the logged-in user.

---

### `GET /api/reports`
Retrieves all system reports. Restricted to `admin`.

---

### `PATCH /api/reports/:id`
Updates resolution status and administrative notes. Restricted to `admin`.

---

## 4. Route Optimization

### `GET /api/route/generate`
Generates a Nearest-Neighbor Traveling Salesperson route covering critical and smell-reported bins. Restricted to `admin`.

**Response (200 OK):**
```json
{
  "message": "Optimized route generated successfully",
  "routeId": "RT-1730561234567",
  "binSequence": ["GB-042", "GB-005", "GB-008"],
  "totalDistance": 7.8,
  "baselineDistance": 10.9,
  "percentSaved": 28,
  "assignedStaffId": "uid-staff"
}
```

---

### `GET /api/route/current`
Retrieves the active assigned route with full bin coordinate details for field staff.

---

## 5. Leaderboard

### `GET /api/leaderboard`
Returns public citizen rankings globally (top 10) and per municipal zone (top 5).

---

## 6. System Health

### `GET /api/health`
Returns system status, process uptime, and database connection state.

