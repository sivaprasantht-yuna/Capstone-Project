<div align="center">

# 🎓 CapstoneHub

### AI-Powered Capstone Project Collaboration Platform

**A production-grade, multi-tenant platform for engineering colleges to manage capstone projects end-to-end — team formation, AI mentor matching, milestone tracking, and grading.**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.2-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11-yellow?logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **S5 Mini Project — Production-Grade Implementation**  
> React + Spring Boot 3 + Python FastAPI + PostgreSQL + Redis + WebSocket

</div>

---

## 📋 Table of Contents

- [What is CapstoneHub?](#-what-is-capstonehub)
- [Why This Stack?](#-why-this-stack)
- [Architecture](#️-architecture)
- [Design Patterns](#-design-patterns-implemented)
- [DSA Implementations](#-data-structures--algorithms)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start-development)
- [Database Setup](#-database-setup)
- [College Deployment Guide](#-deploying-for-your-college)
- [Demo Credentials](#-demo-credentials)
- [API Reference](#-api-documentation)
- [Matching Algorithms](#-matching-algorithm-details)
- [Database Schema](#-database-schema)
- [Environment Variables](#️-environment-configuration)
- [Running Tests](#-running-tests)

---

## 🏆 What is CapstoneHub?

CapstoneHub eliminates the manual, chaotic process of capstone project formation in universities. It is a **multi-tenant SaaS platform** — meaning any college can deploy it and onboard their own faculty, students, and projects with zero code changes.

| Feature | Description |
|---|---|
| 🤝 **AI Teammate Matching** | Cosine similarity on skill vectors finds students who complement your gaps |
| 🎓 **AI Mentor Matching** | Expertise overlap + workload penalty for fair mentor allocation |
| 🔍 **Idea Plagiarism Check** | TF-IDF similarity flags duplicate project ideas before approval |
| 💬 **Real-time Team Chat** | STOMP WebSocket powered team messaging |
| 🔔 **Real-time Notifications** | Push notifications via STOMP user-specific queues |
| 📋 **Project Lifecycle** | 3-phase milestone system with file submissions (Cloudinary CDN) |
| 🏅 **Gamification** | Points leaderboard awarded on on-time submissions |
| ⚠️ **At-Risk Detection** | Nightly cron flags inactive teams and notifies mentor |
| 📄 **PDF Certificates** | iText 8 auto-generated completion certificates with QR verification |
| 👥 **4 Role Portals** | Student / Faculty / Admin / Industry Partner |
| 🐳 **Full Docker Stack** | One-command deployment with all services |

---

## 🤔 Why This Stack?

This project uses **three different languages** intentionally — each chosen for where it excels:

### ☕ Java + Spring Boot (Core Backend)
| Reason | Detail |
|---|---|
| **Strong typing** | Perfect for modelling complex entities: `User`, `Team`, `Mentorship`, `Milestone` |
| **Spring Security + JWT** | Role-based auth (`STUDENT`, `FACULTY`, `ADMIN`, `INDUSTRY`) |
| **Spring Data JPA** | Maps Java classes to PostgreSQL tables — no raw SQL for CRUD |
| **Spring WebSocket (STOMP)** | Powers real-time chat and notifications |
| **Design Pattern support** | Builder, Facade, Observer patterns are natural in OOP |

### 🐍 Python + FastAPI (AI Matching Microservice)
| Reason | Detail |
|---|---|
| **ML ecosystem** | `scikit-learn`, `numpy`, `sentence-transformers` — no Java equivalent |
| **Faster prototyping** | ML algorithms are 5× faster to write in Python |
| **Microservice isolation** | Runs on port 8000; Spring Boot calls it via HTTP proxy |
| **DSA showcase** | Contains its own `min_heap.py`, `skill_graph.py`, `merge_sort.py` |

### ⚛️ React + TypeScript (Frontend)
| Reason | Detail |
|---|---|
| **Component model** | Reusable UI blocks across 4 role-based portals |
| **Type safety** | TypeScript mirrors Java's strong-typing philosophy |
| **Vite** | Sub-second hot reload for fast development |

```
React Frontend  →  Spring Boot (port 8081)  →  Python FastAPI (port 8000)
                          ↕                            ↕
                   PostgreSQL (Supabase)         AI/ML matching logic
                          ↕
                     Redis Cache (1hr TTL)
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                    │
│      React 18 · Vite · TypeScript · Redux · Recharts                │
└─────────────────────────┬────────────────────────┬───────────────────┘
                          │ REST /api/v1            │ WebSocket /ws
                   ┌──────▼─────────────────────────────────────────┐
                   │         SPRING BOOT 3.3 (Port 8081)            │
                   │  Spring Security 6 · JWT · JPA · STOMP         │
                   │  Controllers · Services · Repositories          │
                   └──────┬─────────────────────┬────────────────────┘
                          │ JPA/JDBC             │ HTTP REST
                   ┌──────▼──────┐     ┌────────▼──────────────────┐
                   │ PostgreSQL   │     │  Python FastAPI (Port 8000)│
                   │ (Supabase)  │     │  scikit-learn · TF-IDF    │
                   └──────┬──────┘     │  Min-Heap · Skill Graph   │
                          │            └───────────────────────────-─┘
                   ┌──────▼──────┐
                   │    Redis    │  ← Match result caching (1hr TTL)
                   │ (Port 6379) │
                   └─────────────┘
```

---

## 🎨 Design Patterns Implemented

This project demonstrates all three GoF design pattern categories as part of the S5 Mini Project requirement:

### 1. 🏗️ Creational — Builder Pattern
**Problem:** `NotificationService.sendNotification()` accepted 5 positional parameters, making call-sites fragile.

**Solution:** A fluent `NotificationRequest` builder replaces all raw calls.

```java
// Before (fragile — easy to swap arguments accidentally)
notificationService.sendNotification(userId, message, type, refId, refType);

// After (readable, self-documenting, validated)
notificationService.send(
    NotificationRequest.to(userId)
        .message("You've been invited to join team 'Alpha'!")
        .type(NotificationType.TEAM_INVITE)
        .reference(teamId, "TEAM")
        .build()
);
```

**Files:** `com.capstone.notification.NotificationRequest`, `NotificationService.send()`

---

### 2. 🏛️ Structural — Facade Pattern
**Problem:** `MatchingController` was reaching into `TeamMemberRepository` and `ProjectRepository` directly — leaking repository logic into the controller layer.

**Solution:** `MatchingFacade` provides a single, clean interface. The controller now has **one dependency** instead of three.

```java
// Controller (client) — before: 3 dependencies + business logic inside
// Controller (client) — after: one facade call
return ResponseEntity.ok(matchingFacade.findMentorsFor(teamId, topN));
```

**Files:** `com.capstone.matching.MatchingFacade`, `MatchingController`

---

### 3. 👁️ Behavioural — Observer Pattern
**Problem:** Business logic (audit logging, notifications) was hardcoded inline inside `TeamService`, `MentorshipService`, and `MilestoneService` — any new reaction required modifying those classes.

**Solution:** Services publish domain events. Independent listeners react without coupling.

```
TeamService.createTeam()
    └── eventPublisher.publishEvent(new TeamFormedEvent(...))
              ├── NotificationEventListener.onTeamFormed() → sends push notification
              └── AuditEventListener.auditTeamFormed()    → saves audit log
```

Adding email alerts in the future = **zero changes to TeamService** — just add a new listener.

**Files:** `com.capstone.events.*`, `com.capstone.events.listener.*`

---

## 🧮 Data Structures & Algorithms

| DSA | Language | File | Applied To | Complexity |
|---|---|---|---|---|
| **Min-Heap / BoundedMaxHeap** | Python | `dsa/min_heap.py` | Top-K candidate extraction | O(N log K) |
| **Adjacency List Graph + BFS** | Python | `dsa/skill_graph.py` | Skill bridge discovery | O(V + E) |
| **DFS** | Python | `dsa/skill_graph.py` | Connected component detection | O(V + E) |
| **Union-Find (DSU)** | Python | `dsa/skill_graph.py` | Skill cluster detection | O(V · α(V)) |
| **Merge Sort** | Python + Java | `dsa/merge_sort.py`, `MergeSort.java` | Leaderboard ranking | O(N log N) |
| **Trie (Prefix Tree)** | Java | `dsa/SkillTrie.java` | Skill autocomplete search | O(L) per query |

**Exposed API endpoints for DSA:**
```
GET  /graph/info                → skill graph metadata (vertices, edges, components)
POST /graph/skill-bridges       → BFS-based complementary skill suggestions
POST /graph/shortest-path       → shortest path between two skills (BFS)
GET  /graph/components          → skill clusters (Union-Find)
GET  /api/v1/skills/autocomplete?prefix=py → Trie-powered autocomplete
```

---

## 📁 Project Structure

```
CapstoneHub/
├── backend/                         # Spring Boot 3.3 (Java 21)
│   └── src/main/java/com/capstone/
│       ├── config/                  # Security, WebSocket, Swagger, Cache
│       ├── controller/              # REST Controllers (10)
│       ├── dsa/                     # MergeSort.java, SkillTrie.java
│       ├── events/                  # Domain events (Observer Pattern)
│       │   ├── TeamFormedEvent.java
│       │   ├── MentorMatchedEvent.java
│       │   ├── MilestoneSubmittedEvent.java
│       │   └── listener/
│       │       ├── NotificationEventListener.java
│       │       └── AuditEventListener.java
│       ├── matching/
│       │   └── MatchingFacade.java  # Facade Pattern
│       ├── model/                   # JPA entities (16 tables)
│       ├── notification/
│       │   └── NotificationRequest.java  # Builder Pattern
│       ├── repository/              # Spring Data repos (16)
│       ├── security/                # JWT filter + UserDetailsService
│       ├── service/                 # Business logic (10 services)
│       └── websocket/               # STOMP ChatController
│
├── matching-service/                # Python FastAPI (Port 8000)
│   ├── main.py
│   ├── routers/
│   │   ├── teammate_match.py        # Cosine similarity matching
│   │   ├── mentor_match.py          # Expertise + workload scoring
│   │   └── idea_similarity.py       # TF-IDF plagiarism check
│   ├── services/cosine_engine.py    # Core ML algorithm
│   ├── dsa/
│   │   ├── min_heap.py              # BoundedMaxHeap (Top-K)
│   │   ├── skill_graph.py           # Graph + BFS + DFS + Union-Find
│   │   └── merge_sort.py            # Leaderboard sort
│   ├── tests/                       # pytest unit tests
│   └── Dockerfile
│
├── frontend/                        # React 18 + Vite + TypeScript
│   └── src/
│       ├── pages/
│       │   ├── auth/                # Login, Register (2-step)
│       │   ├── student/             # Dashboard, Teams, Matching, Milestones
│       │   ├── faculty/             # Dashboard, Grading, Mentorship
│       │   ├── admin/               # Analytics, Projects, Users
│       │   └── industry/            # Post projects, Track progress
│       ├── store/                   # Redux (auth, notifications)
│       ├── lib/                     # Axios API client, WebSocket client
│       └── components/              # Shared: PortalLayout, ProtectedRoute
│
├── database/
│   └── seed.sql                     # Demo data for any college
├── docker-compose.yml               # Full 5-service stack
└── .env.example                     # Environment variable template
```

---

## 🚀 Quick Start (Development)

### Prerequisites
```
Java 21+    Maven 3.9+    Node.js 20+    Python 3.11+    Docker Desktop
```

### Step 1 — Clone & Configure
```bash
git clone https://github.com/your-org/capstonehub.git
cd capstonehub
cp .env.example .env
# Edit .env with your Supabase/PostgreSQL credentials
```

### Step 2 — Start the Backend
```bash
cd backend
mvn spring-boot:run
# ✅ Runs on http://localhost:8081
# 📖 Swagger UI: http://localhost:8081/swagger-ui.html
```

### Step 3 — Start the Python Matching Service
```bash
cd matching-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# ✅ Runs on http://localhost:8000
# 📖 FastAPI Docs: http://localhost:8000/docs
```

### Step 4 — Start the Frontend
```bash
cd frontend
npm install
npm run dev
# ✅ Runs on http://localhost:5173
```

---

## 🗄️ Database Setup

CapstoneHub uses **Hibernate auto-DDL** — tables are created automatically when Spring Boot starts. You only need to seed the demo data.

### Option A — Supabase (Recommended for Cloud)
1. Create a project at [supabase.com](https://supabase.com)
2. Copy your connection string into `application.properties`
3. Spring Boot creates all tables on first run
4. Open **Supabase → SQL Editor** and paste `database/seed.sql`

### Option B — Local PostgreSQL
```bash
# Start with Docker
docker compose up postgres -d

# Seed demo data (after Spring Boot has run once)
psql -h localhost -U capstone_user -d capstone_db -f database/seed.sql
```

### Option C — Full Docker Stack
```bash
docker compose up --build -d
# All services start automatically including DB seeding
```

---

## 🏫 Deploying for Your College

CapstoneHub is designed as a **multi-tenant production platform**. Any college can deploy it without touching the source code.

### Step 1 — Deploy the Stack
```bash
git clone https://github.com/your-org/capstonehub.git
cd capstonehub
cp .env.example .env
# Fill in your college's DB URL, JWT secret, Cloudinary keys
docker compose up --build -d
```

### Step 2 — Seed Demo Data
Run `database/seed.sql` in your SQL editor. It uses a neutral `@demo.capstonehub.app` domain.

### Step 3 — Migrate Emails to Your College Domain
After seeding, run this **one SQL command** to switch all demo emails to your real college domain:

```sql
-- Migrate faculty emails to your college domain
UPDATE users
SET email = REPLACE(email, '@demo.capstonehub.app', '@yourcollege.edu')
WHERE role = 'FACULTY';

-- Migrate student emails
UPDATE users
SET email = REPLACE(email, '@student.demo.capstonehub.app', '@student.yourcollege.edu')
WHERE role = 'STUDENT';
```

#### Examples for Real Colleges:
```sql
-- For VIT Vellore
UPDATE users SET email = REPLACE(email, '@demo.capstonehub.app', '@vit.ac.in') WHERE role = 'FACULTY';

-- For SRM Institute
UPDATE users SET email = REPLACE(email, '@demo.capstonehub.app', '@srmist.edu.in') WHERE role = 'FACULTY';

-- For Anna University
UPDATE users SET email = REPLACE(email, '@demo.capstonehub.app', '@annauniv.edu') WHERE role = 'FACULTY';

-- For PSG College of Technology
UPDATE users SET email = REPLACE(email, '@demo.capstonehub.app', '@psgtech.ac.in') WHERE role = 'FACULTY';
```

### Step 4 — Onboard Your Real Faculty
Once deployed, faculty can:
- **Self-register** at `/register` using their college email
- **Be invited** by admin via the Admin Panel → Manage Users

### Step 5 — Customise Departments & Settings
From the Admin Portal, update:
- Department names to match your college structure
- Max team sizes per project
- Milestone deadlines and evaluation rubrics

> **Zero code changes required** for any of the above steps.

---

## 🔐 Demo Credentials

> All demo accounts use the neutral `@demo.capstonehub.app` domain.

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@capstonehub.app` | `Admin@123` |
| **Faculty (CSE Head)** | `sasikala.d@demo.capstonehub.app` | `Faculty@123` |
| **Faculty (AI&DS Head)** | `gomathi.r@demo.capstonehub.app` | `Faculty@123` |
| **Faculty (ECE Head)** | `prakash.sp@demo.capstonehub.app` | `Faculty@123` |
| **Faculty (AI&ML Head)** | `bharathi.a@demo.capstonehub.app` | `Faculty@123` |
| **Faculty (IT Head)** | `naveena.s@demo.capstonehub.app` | `Faculty@123` |
| **Student (CSE)** | `arjun.selvam@student.demo.capstonehub.app` | `Student@123` |
| **Student (AI&DS)** | `meena.lakshmi@student.demo.capstonehub.app` | `Student@123` |
| **Student (ECE)** | `rohith.kumar@student.demo.capstonehub.app` | `Student@123` |
| **Industry Partner** | `partner@technova.com` | `Faculty@123` |

---

## 📖 API Documentation

- **Swagger UI**: `http://localhost:8081/swagger-ui.html`
- **API Base URL**: `http://localhost:8081/api/v1/`
- **Python Service Docs**: `http://localhost:8000/docs`

### Key Endpoints

```
# Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login

# AI Matching
GET  /api/v1/matching/teammates?topN=5
GET  /api/v1/matching/mentors/{teamId}?topN=3
POST /api/v1/matching/idea-similarity

# Team Management
POST /api/v1/teams
POST /api/v1/teams/{teamId}/invite/{userId}
PUT  /api/v1/teams/{teamId}/invite/respond

# Milestones
GET  /api/v1/milestones/team/{teamId}
POST /api/v1/milestones/{id}/submit   (multipart file upload)
POST /api/v1/milestones/{id}/evaluate

# Mentorship
POST /api/v1/mentorships/request
PUT  /api/v1/mentorships/{id}/respond

# Admin
GET  /api/v1/admin/analytics/overview
GET  /api/v1/admin/at-risk-teams
POST /api/v1/projects                 (admin approves projects)

# Certificates
POST /api/v1/certificates/generate/{teamId}
GET  /api/v1/certificates/verify/{certNumber}

# DSA Endpoints (Skill Graph)
GET  /graph/info
POST /graph/skill-bridges
POST /graph/shortest-path

# WebSocket (STOMP)
WS   /ws
SUB  /topic/team/{teamId}            (team chat)
SUB  /user/queue/notifications       (personal notifications)
```

---

## 🧠 Matching Algorithm Details

### Teammate Matching — Complementary Cosine Similarity
```
For each candidate student:
  gap_score[i] = (1 - requester_skill[i] / 4) × (candidate_skill[i] / 4)
  match_score  = Σ(gap_score) / num_skills

Labels:  HIGH (≥ 0.50) · MEDIUM (≥ 0.25) · LOW (< 0.25)
```
Students who **fill your skill gaps** rank higher than students with the same skills as you.

---

### Mentor Matching — Expertise + Workload Penalty
```
overlap_score  = cosine_similarity(team_skill_vector, faculty_skill_vector)
load_ratio     = current_teams / max_capacity
penalty_factor = 1 - (0.4 × load_ratio)    ← max 40% workload penalty
final_score    = overlap_score × penalty_factor
```
Balances expertise match with mentor **fairness** — busy professors are penalised.

---

### Idea Similarity — TF-IDF Plagiarism Detection
```
corpus       = [all_existing_approved_ideas..., new_submitted_idea]
tfidf_matrix = TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True).fit_transform(corpus)
similarity   = cosine_similarity(new_idea_vector, existing_vectors)

Threshold: ≥ 0.65 (65%) → flagged as DUPLICATE
```

---

## 📊 Database Schema (16 Tables)

```
users ─────────────────────────────────────────────────────────────
  ├── student_profiles        (1:1 user)
  └── faculty_profiles        (1:1 user)

skills
  └── user_skills             (M:N users ↔ skills, proficiency 1–4)

projects ──────────────────────────────────────────────────────────
  └── teams
        ├── team_members      (M:N users ↔ teams, invite status)
        ├── mentorships       (M:1 team, M:1 faculty)
        └── milestones
              ├── submissions (file upload via Cloudinary)
              └── evaluations (marks, feedback)

messages      (team chat, M:1 team)
notifications (per-user inbox)
events        (audit log for at-risk detection)
certificates  (1:1 team, QR-verified)
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and fill in your values:

```env
# Database (Supabase or local PostgreSQL)
DB_URL=jdbc:postgresql://your-host:5432/your-database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# JWT (minimum 32 characters — change this!)
JWT_SECRET=your_very_long_random_secret_key_here_minimum_32_chars

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Redis (optional — disables caching if not set)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🐳 One-Command Production Deploy

```bash
# 1. Configure your .env file
cp .env.example .env
vim .env   # Add your secrets

# 2. Start all 5 services
docker compose up --build -d

# Services will be available at:
# Frontend:         http://localhost:3000
# Backend API:      http://localhost:8081
# Matching Service: http://localhost:8000
# Swagger Docs:     http://localhost:8081/swagger-ui.html
# FastAPI Docs:     http://localhost:8000/docs
```

---

## 🧪 Running Tests

```bash
# Python matching service unit tests
cd matching-service
pytest tests/ -v

# Spring Boot backend tests
cd backend
mvn test

# Check backend compile
mvn compile
```

---

## 🎨 Design System

- **Dark theme** with `indigo-600` primary brand colour
- **Glassmorphism** cards (`backdrop-blur`, `bg-white/5`)
- **Framer Motion** animations (fade-in, slide-up, score bar fills)
- **Recharts** for admin analytics (PieChart, BarChart, LineChart)
- **Inter** font via Google Fonts
- Animated skill match progress bars with colour-coded levels

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ as an S5 Mini Project**  
*Designed to be production-deployed at any engineering college*

</div>
