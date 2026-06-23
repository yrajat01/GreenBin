# Team Contribution & Branching Strategy

This document details the feature distribution, git branching workflow, and individual responsibilities for building **GreenBin**.

## 👥 Task Allocation Matrix

| Teammate | Primary Focus | Modules / Features Assigned |
| :--- | :--- | :--- |
| **Rajat Yadav** <br>*(Tech ID: C15E59)* | Backend & Engine | Node.js Server Environment, MongoDB Integration, Nearest-Neighbour Route Optimization Engine, IoT Cron Simulator[cite: 1]. |
| **Ritik Prajapati** <br>*(Tech ID: BD36AE)* | Frontend (Admin) | Desktop Admin Dashboard, Leaflet Map Integration, Recharts Implementation, Filterable Report Management[cite: 1]. |
| **Anshuman Shukla** <br>*(Tech ID: BD36DA)* | Frontend (Citizen/Staff) | Mobile-First Citizen View, 3-Step Reporting Form (GPS + Image Upload simulation), Staff Checklist Route View[cite: 1]. |
| **Priyanshu Singh** <br>*(Tech ID: 9C1F4C)* | Auth & DevOps | Firebase Role-Based Authentication, Tailwind UI Layout, Deployment Pipelines (Vercel & Render)[cite: 1]. |

---

## 🌿 Git Branching Strategy

To guarantee clean collaboration and avoid merge conflicts, our team follows a feature-branch workflow. **No commits are allowed directly on the `main` branch.**

### Branch Hierarchy
* `main`: Houses stable, production-ready code deployed live[cite: 1].
* `dev`: Integration branch where all individual features are merged and tested before production staging.
* `feature/` branches: Individual workspace isolation branches.

### Naming Conventions
* Backend Features: `feature/backend-auth`, `feature/route-engine`
* Frontend Features: `feature/admin-dash`, `feature/citizen-report`
* Bug Fixes: `bugfix/map-render-issue`

### Merge Process Flow
1. Pull the latest code from `dev`: `git pull origin dev`
2. Spin up your specific branch: `git checkout -b feature/your-feature-name`
3. Commit locally using clean descriptive messages: `git commit -m "feat: added nearest-neighbour heuristic algorithm"`
4. Push to remote: `git push origin feature/your-feature-name`
5. Submit a **Pull Request (PR)** targeting the `dev` branch. At least one teammate must code-review and approve the PR before merging.
