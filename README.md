<div align="center">

# 🎓 CapstoneHub

### AI-Powered Capstone Project Collaboration Platform

**A production-grade, multi-tenant platform for engineering colleges to manage capstone projects end-to-end — team formation, AI mentor matching, milestone tracking, and grading.**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.2-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11-yellow?logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![HF Spaces](https://img.shields.io/badge/Java%20Backend-HF%20Spaces-orange?logo=huggingface)](https://huggingface.co/spaces)
[![Vercel](https://img.shields.io/badge/Python%20%26%20Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![NVIDIA NIM](https://img.shields.io/badge/AI-NVIDIA%20NIM-76B900?logo=nvidia)](https://build.nvidia.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **S5 Mini Project — Production-Grade Implementation**  
> React (Vercel) + Spring Boot (Hugging Face Spaces) + Python FastAPI (Vercel) + Supabase + NVIDIA NIM

</div>

---

## 📋 Table of Contents

- [What is CapstoneHub?](#-what-is-capstonehub)
- [Architecture](#️-architecture)
- [Why This Stack?](#-why-this-stack)
- [Design Patterns](#-design-patterns-implemented)
- [DSA Implementations](#-data-structures--algorithms)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start-development)
- [Database Setup](#-database-setup)
- [Cloud Deployment](#-cloud-deployment)
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
| 📄 **AI Document Sanitizer** | PDFBox extracts text → NVIDIA NIM (Llama 3) generates a clean project overview |
| 💬 **Real-time Team Chat** | STOMP WebSocket powered team messaging |
| 🔔 **Real-time Notifications** | Push notifications via STOMP user-specific queues |
| 📋 **Project Lifecycle** | 3-phase milestone system with file submissions (Cloudinary CDN) |
| 🏅 **Gamification** | Points leaderboard awarded on on-time submissions |
| ⚠️ **At-Risk Detection** | Nightly cron flags inactive teams and notifies mentor |
| 📄 **PDF Certificates** | iText 8 auto-generated completion certificates with QR verification |
| 👥 **4 Role Portals** | Student / Faculty / Admin / Industry Partner |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         BROWSER                                    │
│   React 18 · Vite · TypeScript · Redux · Recharts                 │
│                     [Vercel]                                       │
└──────────────────────┬─────────────────────┬──────────────────────┘
                       │ REST /api/v1         │ WebSocket /ws
              ┌────────▼──────────────────────────────────┐
              │     SPRING BOOT 3.3 — Java 21             │
              │  Spring Security · JWT · JPA · STOMP       │
              │          [Hugging Face Spaces]             │
              └────────┬──────────────────┬───────────────┘
                       │ JPA/JDBC         │ HTTP JSON (text only)
              ┌────────▼────────┐  ┌──────▼──────────────────────┐
              │  PostgreSQL      │  │  Python FastAPI             │
              │  (Supabase)     │  │  scikit-learn · NVIDIA NIM  │
              └────────┬────────┘  │  [Vercel Serverless]        │
                       │           └─────────────────────────────┘
              ┌────────▼────────┐
              │   Cloudinary    │  ← File & PDF uploads (CDN)
              └─────────────────┘
```

### How PDF AI Processing Works

```
User uploads PDF  →  Java (PDFBox extracts text, ~5KB)
                  →  Vercel Python receives tiny JSON text payload
                  →  NVIDIA NIM (Llama 3.1) generates clean Markdown
                  →  Returns "## Project Overview" + "## Problem Statement"
```

> **Why this split?** Java does the heavy PDF lifting locally (no network cost), then sends only kilobytes of text to Vercel — avoiding Vercel's 4.5MB body limit entirely.

---

## 🤔 Why This Stack?

### ☕ Java + Spring Boot (Core Backend — HF Spaces)
| Reason | Detail |
|---|---|
| **Strong typing** | Perfect for modelling complex entities: `User`, `Team`, `Mentorship`, `Milestone` |
| **Spring Security + JWT** | Role-based auth (`STUDENT`, `FACULTY`, `ADMIN`, `INDUSTRY`) |
| **Spring Data JPA** | Maps Java classes to PostgreSQL tables — no raw SQL for CRUD |
| **Spring WebSocket (STOMP)** | Powers real-time chat and notifications |
| **Apache PDFBox 3** | Strips raw text from uploaded PDFs locally — no network overhead |
| **iText 8** | Generates QR-verified completion certificates as PDF |

### 🐍 Python + FastAPI (AI Matching Service — Vercel)
| Reason | Detail |
|---|---|
| **ML ecosystem** | `scikit-learn`, `numpy` — no Java equivalent |
| **NVIDIA NIM API** | Calls `meta/llama-3.1-8b-instruct` via OpenAI-compatible endpoint |
| **Serverless fit** | Stateless AI endpoints map perfectly to Vercel functions |
| **DSA showcase** | Contains `min_heap.py`, `skill_graph.py`, `merge_sort.py` |

### ⚛️ React + TypeScript (Frontend — Vercel)
| Reason | Detail |
|---|---|
| **Component model** | Reusable UI blocks across 4 role-based portals |
| **Type safety** | TypeScript mirrors Java's strong-typing philosophy |
| **Vite** | Sub-second hot reload for fast development |

---

## 🎨 Design Patterns Implemented

### 1. 🏗️ Creational — Builder Pattern
**Problem:** `NotificationService.sendNotification()` accepted 5 positional parameters, making call-sites fragile.

**Solution:** A fluent `NotificationRequest` builder replaces all raw calls.

```java
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
**Problem:** `MatchingController` was reaching into multiple repositories directly — leaking business logic into the controller layer.

**Solution:** `MatchingFacade` provides a single, clean interface.

```java
// Controller — one facade call instead of three dependencies
return ResponseEntity.ok(matchingFacade.findMentorsFor(teamId, topN));
```

**Files:** `com.capstone.matching.MatchingFacade`, `MatchingController`

---

### 3. 👁️ Behavioural — Observer Pattern
**Problem:** Audit logging and notifications were hardcoded inside `TeamService`, `MentorshipService`, etc.

**Solution:** Services publish domain events. Independent listeners react without coupling.

```
TeamService.createTeam()
    └── eventPublisher.publishEvent(new TeamFormedEvent(...))
              ├── NotificationEventListener.onTeamFormed() → push notification
              └── AuditEventListener.auditTeamFormed()    → audit log
```

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

---

## 📁 Project Structure

```
CapstoneHub/
├── backend/                         # Spring Boot 3.3 (Java 21) — HF Spaces
│   └── src/main/java/com/capstone/
│       ├── config/                  # Security, WebSocket, Swagger, Cache
│       ├── controller/              # REST Controllers
│       ├── dsa/                     # MergeSort.java, SkillTrie.java
│       ├── events/                  # Domain events (Observer Pattern)
│       ├── matching/
│       │   └── MatchingFacade.java  # Facade Pattern
│       ├── model/                   # JPA entities (16 tables)
│       ├── notification/
│       │   └── NotificationRequest.java  # Builder Pattern
│       ├── repository/              # Spring Data repos
│       ├── security/                # JWT filter + UserDetailsService
│       ├── service/
│       │   ├── DocumentSanitizerService.java  # PDFBox text extraction
│       │   └── ...
│       └── websocket/               # STOMP ChatController
│
├── matching-service/                # Python FastAPI — Vercel Serverless
│   ├── main.py
│   ├── vercel.json                  # Vercel deployment config
│   ├── routers/
│   │   ├── teammate_match.py        # Cosine similarity matching
│   │   ├── mentor_match.py          # Expertise + workload scoring
│   │   ├── idea_similarity.py       # TF-IDF plagiarism check
│   │   └── document_sanitizer.py   # NVIDIA NIM text → Markdown
│   ├── services/cosine_engine.py    # Core ML algorithm
│   ├── dsa/
│   │   ├── min_heap.py              # BoundedMaxHeap (Top-K)
│   │   ├── skill_graph.py           # Graph + BFS + DFS + Union-Find
│   │   └── merge_sort.py            # Leaderboard sort
│   └── requirements.txt
│
├── frontend/                        # React 18 + Vite + TypeScript — Vercel
│   └── src/
│       ├── pages/
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
├── Dockerfile                       # Java-only multi-stage build for HF Spaces
├── .github/workflows/
│   ├── sync-to-hf.yml               # Auto-deploy Java backend to HF Spaces
│   ├── keep-alive.yml               # Ping HF Space every 14 min
│   └── keep-awake.yml               # Backup keep-alive ping
└── .env.example                     # Environment variable template
```

---

## 🚀 Quick Start (Development)

### Prerequisites
```
Java 21+    Maven 3.9+    Node.js 20+    Python 3.11+
```

### Step 1 — Clone & Configure
```bash
git clone https://github.com/sivaprasantht-yuna/Capstone-Project.git
cd Capstone-Project
cp .env.example .env
# Edit .env with your Supabase credentials
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

CapstoneHub uses **Hibernate auto-DDL** — tables are created automatically when Spring Boot starts. You only need to seed demo data.

### Supabase (Recommended)
1. Create a project at [supabase.com](https://supabase.com)
2. Copy your **JDBC connection string** into `DB_URL`
3. Spring Boot creates all tables on first run
4. Open **Supabase → SQL Editor** and paste `database/seed.sql`

### Local PostgreSQL
```bash
# Start with Docker
docker compose up postgres -d

# Seed demo data (after Spring Boot has run once)
psql -h localhost -U capstone_user -d capstone_db -f database/seed.sql
```

---

## ☁️ Cloud Deployment

CapstoneHub uses a **three-service serverless architecture**:

| Service | Platform | What it runs |
|---|---|---|
| Java Spring Boot | Hugging Face Spaces (Docker) | Core API, WebSocket, PDF processing |
| Python FastAPI | Vercel (Serverless) | AI matching, NVIDIA NIM document sanitizer |
| React Frontend | Vercel (Static) | All 4 role portals |

### Deploy Java Backend → Hugging Face Spaces

The `sync-to-hf.yml` GitHub Action auto-deploys on every push to `main` that changes `backend/` or `Dockerfile`.

**One-time setup:**
1. Add `HF_TOKEN` to GitHub → Settings → Secrets (get it from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens))
2. Add these secrets in your HF Space → Settings → Variables and secrets:

| Secret | Value |
|---|---|
| `DB_URL` | `jdbc:postgresql://...supabase.co:5432/postgres` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | Your Supabase DB password |
| `JWT_SECRET` | Random 32+ char string |
| `CLOUDINARY_CLOUD_NAME` | From cloudinary.com/console |
| `CLOUDINARY_API_KEY` | From cloudinary.com/console |
| `CLOUDINARY_API_SECRET` | From cloudinary.com/console |
| `MATCHING_SERVICE_URL` | Your Vercel Python URL |
| `REDIS_URL` | Upstash Redis URL (or skip — cache is disabled) |

### Deploy Python Service → Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import this repo, set **Root Directory** to `matching-service/`
3. Add environment variable: `NVIDIA_API_KEY` = `nvapi-xxxxx` (from [build.nvidia.com](https://build.nvidia.com))
4. Deploy

### Deploy Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Import this repo, set **Root Directory** to `frontend/`
3. Add environment variables:
   - `VITE_API_URL` = `https://tgashwinyt-paatu-padava.hf.space/api/v1`
   - `VITE_WS_URL` = `wss://tgashwinyt-paatu-padava.hf.space/ws`
4. Deploy

---

## 🔐 Demo Credentials

> All demo accounts use the neutral `@demo.capstonehub.app` domain.

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@capstonehub.app` | `Admin@123` |
| **Faculty (CSE Head)** | `sasikala.d@demo.capstonehub.app` | `Faculty@123` |
| **Faculty (AI&DS Head)** | `gomathi.r@demo.capstonehub.app` | `Faculty@123` |
| **Student (CSE)** | `arjun.selvam@student.demo.capstonehub.app` | `Student@123` |
| **Student (AI&DS)** | `meena.lakshmi@student.demo.capstonehub.app` | `Student@123` |
| **Industry Partner** | `partner@technova.com` | `Faculty@123` |

---

## 📖 API Documentation

- **Swagger UI**: `https://tgashwinyt-paatu-padava.hf.space/swagger-ui.html`
- **Python Service Docs**: `https://your-vercel-url.vercel.app/docs`

### Key Endpoints

```
# Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login

# AI Matching (proxied to Vercel Python)
GET  /api/v1/matching/teammates?topN=5
GET  /api/v1/matching/mentors/{teamId}?topN=3
POST /api/v1/matching/idea-similarity

# Document Sanitizer (PDFBox + NVIDIA NIM)
POST /api/v1/sanitizer/process-pdf    ← upload PDF here (Java extracts text)
# Java → sends text → POST /api/v1/sanitizer/process-text (Vercel Python + NVIDIA NIM)

# Team Management
POST /api/v1/teams
POST /api/v1/teams/{teamId}/invite/{userId}
PUT  /api/v1/teams/{teamId}/invite/respond

# Milestones
GET  /api/v1/milestones/team/{teamId}
POST /api/v1/milestones/{id}/submit   (multipart PDF/file upload)
POST /api/v1/milestones/{id}/evaluate

# Certificates
POST /api/v1/certificates/generate/{teamId}
GET  /api/v1/certificates/verify/{certNumber}

# DSA Endpoints
GET  /graph/info
POST /graph/skill-bridges
POST /graph/shortest-path
GET  /graph/components

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

### Mentor Matching — Expertise + Workload Penalty
```
overlap_score  = cosine_similarity(team_skill_vector, faculty_skill_vector)
load_ratio     = current_teams / max_capacity
penalty_factor = 1 - (0.4 × load_ratio)    ← max 40% workload penalty
final_score    = overlap_score × penalty_factor
```

### Idea Similarity — TF-IDF Plagiarism Detection
```
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

```env
# ── Database (Supabase) ───────────────────────────────────────────
DB_URL=jdbc:postgresql://xxx.supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=your_supabase_password

# ── JWT ──────────────────────────────────────────────────────────
JWT_SECRET=your_very_long_random_secret_key_minimum_32_chars

# ── Cloudinary (file & PDF uploads) ──────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Python Matching Service (Vercel URL) ─────────────────────────
MATCHING_SERVICE_URL=https://your-python-service.vercel.app

# ── Redis (optional — caching disabled by default) ───────────────
REDIS_URL=redis://your-upstash-url:6379

# ── NVIDIA NIM (set in Vercel Python project, not HF) ────────────
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxx
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

# Verify backend compiles
mvn compile -q
```

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