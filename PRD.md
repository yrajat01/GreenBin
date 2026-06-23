# Product Requirement Document (PRD)
## GreenBin: Smart Waste Collection System

### 1. Product Vision
* **What are we building?:** GreenBin is a smart waste management web platform that connects citizens, collection staff, and administrators through real-time bin monitoring, issue reporting, route optimization, and a live analytics dashboard - making waste collection data-driven instead of guesswork.
* **Why are we building it?:** Waste collection today runs on fixed schedules and manual observation. Trucks visit empty bins while overflowing ones are ignored. Citizens have no reporting channel and administrators have no real-time visibility. GreenBin solves this with a connected, transparent, and incentive-driven system.

#### Problem Breakdown
* Trucks follow fixed routes regardless of fill levels - wasting fuel, missing critical bins.
* Citizens have no channel to report overflow or illegal dumping and cannot track resolution.
* Administrators have zero live visibility into bin status or collection performance.
* No incentive exists for citizens to segregate waste properly at the source.

---

### 2. Goals, Scope & Success Metrics

#### Goals & Metrics
| Goal | Success Metric |
| :--- | :--- |
| Citizen can report and track an issue end-to-end | Report submitted status updated → resolved in live demo flow |
| Admin has full real-time operational visibility | Dashboard shows all bin statuses and reports in one view |
| Route optimization beats fixed routing | Generated route shows $\ge20\%$ fewer km vs. baseline |
| Working MVP deployed by Day 7 | Public HTTPS URL accessible and demoable to live jury |

#### Scope
| In Scope MVP (Day 7) | Out of Scope Future Roadmap |
| :--- | :--- |
| Citizen web app with issue reporting + bin map | Real physical IoT sensor integration |
| Simulated IoT fill-level data (cron-based) | Native mobile apps (iOS / Android) |
| Admin dashboard with live map + analytics | Payment gateway for penalty fines |
| Route optimization engine | Multi-city / multi-tenant deployment |
| Rewards system + leaderboard | In-app notifications |

---

### 3. Users & Website Structure

#### User Personas
* **Citizen / Student:** Resident reporting waste issues. *Core Need:* Quick reporting, status tracking, rewards for participation.
* **Collection Staff:** Truck driver / field worker. *Core Need:* Clear prioritized route, simple bin check-off on mobile.
* **Administrator:** Campus / municipal authority. *Core Need:* Live dashboard, report queue, performance analytics.

#### Website Structure
* **Hero Section:** Headline: "Smart Waste. Cleaner Cities." Animated bin fill-level indicator. Two CTAs: Citizen Login and Admin Dashboard. Dark green gradient background.
* **Citizen Dashboard:** Live map of nearby bins (color-coded). Quick Report Issue button. Personal report history with status tracker. Points balance and badge card.
* **Issue Reporting:** 3-step form: issue type → photo upload → location confirm. Auto-captures GPS. Confirmation screen with ticket ID.
* **Admin Dashboard:** Full-screen map with bin pins, reports, truck positions. KPI cards. Route generation panel. Analytics charts by zone and week.
* **Staff Route View:** Mobile-friendly optimized route list. Fill level, address, "Mark as Collected" per bin. Route completion progress bar.
* **About/Contact:** Project overview, team credits, GitHub repo link, demo video link.

---

### 4. User Experience & Visual Requirements

#### Design Aesthetics
* **Citizen Experience:** Feels "Heard". Reporting takes under 60 seconds; every status change is visible. Mobile-first, tap-heavy, 3 clicks max to any feature.
* **Collection Staff Experience:** Feels "Guided". Optimized route list removes all guesswork from the day. Simple checklist, large tap targets, works on small screens.
* **Administrator Experience:** Feels "In Control". One screen answers every operational question. Desktop-first, data-dense with filters, charts, and map layers.

#### Visual Theme & Colors
* **Primary Brand:** Deep Forest Green (`#1A5C38`)
* **Accent/CTA:** Leaf Green (`#4CAF50`)
* **Background Light:** Off-White (`#F9FBF9`)
* **Background Dark:** Dark Slate (`#1C2833`)
* **Warning (60%+):** Amber (`#F39C12`)
* **Critical (80%+):** Red (`#E74C3C`)

---

### 5. Feature Specifications (MOSCOW)

#### Must Have
* **Live fill-level display:** Simulated IoT data updated every 30s. Bins color-coded green / yellow / red. Shown on map and sortable table.
* **Auto-flag critical bins:** Bins crossing 80% auto-flagged, pushed to admin queue and included in next route generation.
* **Issue submission:** Photo + auto-location + issue type (overflow / dumping / missed pickup). Creates ticket in admin queue.
* **Report status tracker:** Submitted → Acknowledged → In Progress → Resolved. Visible on citizen dashboard with timestamps.
* **Optimized route generation:** Nearest-neighbour heuristic over all flagged bins. Output: ordered list + map overlay + distance vs. fixed baseline.
* **Collection confirmation:** Staff marks bin as collected → fill level resets to ~5% on dashboard in real time.
* **Live map + KPI cards:** Interactive map with bin pins, truck positions, open reports. KPI cards: total bins, critical bins, open reports, efficiency %.
* **Report management panel:** Filterable table of all citizen reports. Admin updates status and adds resolution notes.

#### Should Have
* Historical fill trend (7-day line chart per bin).
* In-app notifications for citizens and administrators.
* Overflow heatmap overlay for admin analytics.
* Rewards points + public weekly leaderboard.

#### Could Have
* Milestone badges (First Report, Eco Regular, Eco Champion).

---

### 6. Non-Functional Requirements
* **Performance:** Dashboard loads in <3s on 4G. Route generation completes in <2s for up to 30 bins. Lighthouse score $\ge75$.
* **Usability:** Citizen reporting flow completable in under 60 seconds. No feature requires more than 3 clicks from home screen.
* **Reliability:** Simulation engine runs continuously without manual restarts during live demo.
* **Responsive:** Citizen/Staff: mobile-first (320px+). Admin: desktop-first (1024px+). All touch targets $\ge$ 44x44px.
* **Security & Scalability:** Role-based auth for all three user types. Rate-limiting on citizen reports. Configuration-driven architecture for adding zones/bins without code changes.
