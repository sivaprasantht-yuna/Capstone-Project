<div align="center">

# 🎓 Skill Sync

### AI-Powered Capstone Project Collaboration Platform

**A production-grade, institutional platform for engineering colleges to manage capstone projects end-to-end — team formation, AI mentor matching, milestone tracking, and grading.**

[![Version](https://img.shields.io/badge/Version-v1.0.0-blue?logo=git)](https://github.com/sivaprasantht-yuna/Capstone-Project)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.2-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11-yellow?logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![HF Spaces](https://img.shields.io/badge/Java%20Backend-HF%20Spaces-orange?logo=huggingface)](https://huggingface.co/spaces)
[![Vercel](https://img.shields.io/badge/Python%20%26%20Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![NVIDIA NIM](https://img.shields.io/badge/AI-NVIDIA%20NIM-76B900?logo=nvidia)](https://build.nvidia.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **S5 Mini Project — Production-Grade Implementation (v1.0.0)**  
> React (Vercel) + Spring Boot (Hugging Face Spaces) + Python FastAPI (Vercel) + Supabase + NVIDIA NIM

</div>

---

## 📋 Table of Contents

- [What is Skill Sync?](#-what-is-skill-sync)
- [Architecture & Tenant Isolation Strategy](#️-architecture--tenant-isolation-strategy)
- [Why This Stack?](#-why-this-stack)
- [Design Patterns](#-design-patterns-implemented)
- [Data Structures & Algorithms](#-data-structures--algorithms)
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
- [Version & Release Notes](#-version--release-notes)

---

## 🏆 What is Skill Sync?

Skill Sync eliminates the manual, chaotic process of capstone project formation in universities. Built on an **Institutional Dedicated-Deployment Architecture with Role-Based Access Control (RBAC)**, any university or engineering institution can self-host or deploy independent instances to manage their faculty mentors, student teams, and departmental capstone lifecycles with absolute data sovereignty.

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
| 👥 **3 Role Portals** | Student / Faculty Mentor / Department Coordinator & Admin |

---

## 🏗️ Architecture & System Design

> 📖 **Comprehensive Design Document:** For complete architectural topologies, sequence diagrams, multi-tenant isolation proofs, and fault-tolerance matrices, see [docs/SYSTEM_DESIGN.md](file:///d:/Programming/S5%20Mini%20Project/docs/SYSTEM_DESIGN.md).

```
┌────────────────────────────────────────────────────────────────────┐
│                         BROWSER                                    │
│   React 18 · Vite · TypeScript · Redux Toolkit · Lucide Icons      │
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

### 🏢 Tenant Isolation & Data Security Model

Skill Sync employs an **Institutional Single-Tenant / Dedicated-Deployment Model** with **Role-Based Access Control (RBAC)** across Student, Faculty, and Admin personas:

1. **Why Dedicated Institutional Instances?**
   - **Academic Data Sovereignty & FERPA Compliance:** University student records, evaluations, and grading rubrics are strictly isolated per institution with zero risk of cross-college data leaks or query misconfigurations.
   - **Zero Noisy-Neighbor Bottlenecks:** Heavy end-of-semester batch grading, cron evaluators, and PDF certificate generation are scoped strictly to one college instance.
   - **Independent Academic Cycles:** Each institution configures its own department lists, academic years, submission windows, and grading criteria independently.

2. **Roadmap for Shared-Database Multi-Tenant SaaS Extension:**
   For organizations desiring a single shared database instance across multiple colleges:
   - **Discriminator Column:** Add `tenant_id UUID` / `college_id` foreign key columns to all 16 core entities (`users`, `teams`, `projects`, etc.).
   - **PostgreSQL Row-Level Security (RLS):**
     ```sql
     ALTER TABLE users ENABLE ROW LEVEL SECURITY;
     CREATE POLICY tenant_isolation_policy ON users
       USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
     ```
   - **Hibernate Discriminator Filter / Interceptor:** Inject the active `tenant_id` from the verified JWT claims into the thread-local database session before query execution.

---

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
| **Spring Security + JWT** | Role-based access control (`STUDENT`, `FACULTY`, `ADMIN`) |
| **Spring Data JPA** | Maps Java classes to PostgreSQL tables with indexed search queries |
| **Spring WebSocket (STOMP)** | Powers real-time chat and notifications |
| **Apache PDFBox 3** | Strips raw text from uploaded PDFs locally — no network overhead |
| **iText 8** | Generates QR-verified completion certificates as PDF |

### 🐍 Python + FastAPI (AI Matching Service — Vercel)
| Reason | Detail |
|---|---|
| **ML ecosystem** | `scikit-learn`, `numpy` — standard machine learning algorithms |
| **NVIDIA NIM API** | Calls `meta/llama-3.1-8b-instruct` via OpenAI-compatible endpoint |
| **Serverless fit** | Stateless AI endpoints map perfectly to Vercel functions |
| **Optimized Algorithms** | C-optimized `heapq` top-K selection, Timsort ranking, and Graph BFS |

### ⚛️ React + TypeScript (Frontend — Vercel)
| Reason | Detail |
|---|---|
| **Component model** | Reusable UI blocks across 3 role-based portals |
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

## 🧠 Core Academic Matching & Optimization Algorithms

The platform grounds its core intelligence workflows in proven algorithmic literature:

### 1. 🎓 Stable Mentor Allocation — Gale-Shapley Deferred Acceptance (Many-to-One)
- **Literature & Theoretical Foundation:**
  - *Gale & Shapley (1962)*, *"College Admissions and the Stability of Marriage"*, American Mathematical Monthly.
  - *Roth & Shapley (2012 Nobel Prize in Economic Sciences)* for the theory of stable allocations and market design.
  - *OPRA Framework (arXiv:2005.13714)*, *"Optimal Program Allocation via Stable Matching"*.
- **Problem Formulation:**
  - Matches student teams $T = \{t_1, \dots, t_n\}$ to faculty mentors $M = \{m_1, \dots, m_k\}$ where each mentor $m_j$ has capacity $C(m_j)$.
  - Two-sided preference profiles are generated from skill-overlap dot-products and faculty capacity bounds.
- **Mathematical Guarantee:**
  - Provably guarantees a **student-optimal stable matching** in $O(|T| \cdot |M|)$ time.
  - **Zero Blocking Pairs:** No team $t$ and mentor $m$ exist who would both strictly prefer to be matched to each other over their assigned partners.
- **Implementation:** `matching-service/services/gale_shapley.py` (`POST /match/mentors/stable-allocation`).

---

### 2. 🤝 Global Classroom Team Formation — Integer Linear Programming (ILP)
- **Literature & Theoretical Foundation:**
  - *EDU-TF Framework (arXiv:2506.02756)*, *"Exact and Heuristic Integer Linear Programming for Classroom Team Formation with Real-world Constraints"*.
  - *Lappas, Liu, & Terzi (KDD 2009)*, *"Finding a Team of Experts in Social Networks"*.
- **Problem Formulation:**
  - Given a cohort of $N$ students with skill profiles, partition all students into $M$ teams maximizing global pairwise complementarity:
    $$\max \sum_{m=1}^{M} \sum_{i < j \in T_m} C(i, j)$$
    Subject to:
    1. $\sum_{m=1}^M x_{i, m} = 1 \quad \forall i \in \{1, \dots, N\}$ (**Zero Stragglers Guarantee — 100% placement**).
    2. $k_{min} \le |T_m| \le k_{max} \quad \forall m$ (**Strict Team Bounds, e.g. 3 to 4 members**).
- **Implementation:** `matching-service/services/team_partition_ilp.py` (`POST /match/teams/optimal-partition`).

---

### 3. 🔍 Dual-Pass Lexical (TF-IDF) + Semantic Paraphrase Plagiarism Detection
- **Hierarchical NLP Pipeline:**
  - **Pass 1 (Lexical):** N-Gram $(1, 2)$ TF-IDF with sublinear term-frequency scaling for rapid, interpretable word-level overlap.
  - **Pass 2 (Semantic):** Multi-granular dense subword embedding projection capturing conceptual overlap and synonyms (e.g. *"autonomous drone farm obstacle avoidance"* vs *"UAV fruit orchard navigation cameras"*).
  - **Ensemble Output:** Returns `lexical_score`, `semantic_score`, `hybrid_score`, and match classification (`EXACT_DUPLICATE`, `PARAPHRASED_DUPLICATE`, `THEMATIC_OVERLAP`, `DISTINCT_PROPOSAL`).
- **Implementation:** `matching-service/routers/idea_similarity.py` (`POST /match/idea-similarity`).

---

## 🧮 Data Structures & Foundational Algorithms

| Algorithm / Structure | Tech / Library | File | Applied To | Complexity |
|---|---|---|---|---|
| **Gale-Shapley (Many-to-One)** | Python / Custom | `services/gale_shapley.py` | Stable Mentor-Team Allocation | O(\|T\| · \|M\|) |
| **ILP Optimal Partitioning** | Python / NumPy | `services/team_partition_ilp.py` | Cohort Team Assembly (Zero Stragglers) | O(N² + Passes · M) |
| **Dual-Pass TF-IDF + Semantic** | Scikit-Learn / NumPy | `routers/idea_similarity.py` | Proposal Plagiarism & Paraphrase Check | O(\|Corpus\| · L) |
| **Bounded Min-Heap** | Python `heapq` (C engine) | `dsa/min_heap.py` | Top-K candidate extraction | O(N log K) |
| **Adjacency List Graph + BFS** | Python | `dsa/skill_graph.py` | Skill bridge discovery | O(V + E) |
| **DFS & Connected Components** | Python | `dsa/skill_graph.py` | Graph cluster detection | O(V + E) |
| **Union-Find (DSU)** | Python | `dsa/skill_graph.py` | Disjoint skill set partitioning | O(V · α(V)) |
| **Stable Sorting** | Python Timsort / Java `List.sort` | `dsa/merge_sort.py`, `MergeSort.java` | Leaderboard multi-key ranking | O(N log N) |
| **Indexed Prefix & Text Search** | Spring Data JPA / PostgreSQL | `SkillRepository.java`, `SkillTrieService.java` | Skill catalog autocomplete | O(log N + K) |

---

## 📁 Project Structure

```
SkillSync/
├── backend/                         # Spring Boot 3.3 (Java 21) — HF Spaces
│   └── src/main/java/com/capstone/
│       ├── config/                  # Security, WebSocket, Swagger, Cache
│       ├── controller/              # REST Controllers
│       ├── dsa/                     # MergeSort.java, SkillTrieService.java
│       ├── events/                  # Domain events (Observer Pattern)
│       ├── matching/
│       │   └── MatchingFacade.java  # Facade Pattern
│       ├── model/                   # JPA entities (16 tables)
│       ├── notification/
│       │   └── NotificationRequest.java  # Builder Pattern
│       ├── repository/              # Spring Data repos (indexed search)
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
│   │   ├── min_heap.py              # BoundedMaxHeap (Python heapq)
│   │   ├── skill_graph.py           # Graph + BFS + DFS + Union-Find
│   │   └── merge_sort.py            # Stable multi-key ranking
│   └── requirements.txt
│
├── frontend/                        # React 18 + Vite + TypeScript — Vercel
│   └── src/
│       ├── pages/
│       │   ├── student/             # Dashboard, Teams, Matching, Milestones
│       │   ├── faculty/             # Dashboard, Grading, Mentorship
│       │   └── admin/               # Analytics, Projects, Users
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

## 🗄️ Database Setup & Flyway Migrations

Skill Sync uses **Flyway versioned migrations** located in `backend/src/main/resources/db/migration/`:
- `V1__init_schema.sql`: Full canonical multi-tenant schema with `tenant_id` columns, foreign keys, and composite indexes.
- `V2__seed_initial_data.sql`: Base institutional configuration and mock catalog data.

### Supabase (Recommended)
1. Create a project at [supabase.com](https://supabase.com)
2. Copy your **JDBC connection string** into `DB_URL`
3. Spring Boot runs Flyway migrations automatically on startup (`spring.flyway.enabled=true`).

### Local PostgreSQL
```bash
# Start PostgreSQL container
docker compose up postgres -d

# Start backend — Flyway automatically applies migrations
cd backend
mvn spring-boot:run
```

---

## ☁️ Cloud Deployment

Skill Sync uses a **three-service serverless architecture**:

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
| **Admin / Coordinator** | `admin@capstonehub.app` | `Admin@123` |
| **Faculty Mentor (CSE Head)** | `sasikala.d@demo.capstonehub.app` | `Faculty@123` |
| **Faculty Mentor (AI&DS Head)** | `gomathi.r@demo.capstonehub.app` | `Faculty@123` |
| **Student (CSE)** | `arjun.selvam@student.demo.capstonehub.app` | `Student@123` |
| **Student (AI&DS)** | `meena.lakshmi@student.demo.capstonehub.app` | `Student@123` |

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

# ── Redis (optional — caching with Caffeine fallback) ────────────
REDIS_URL=redis://your-upstash-url:6379

# ── NVIDIA NIM (set in Vercel Python project, not HF) ────────────
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxx
```

---

## 🔒 Secrets Management & Security Architecture

### Zero Hardcoded Secrets Policy
- **No In-Code Credentials:** All credentials (database connection strings, JWT signing keys, Cloudinary tokens, and NVIDIA NIM API keys) are strictly injected via runtime environment variables or platform secret managers (GitHub Secrets, Hugging Face Space Secrets, Vercel Environment Variables).
- **Environment Isolation:** Local `.env` files are git-ignored (`.gitignore`) with only sanitized `.env.example` templates committed.

### Key Rotation Protocol
1. **JWT Secret Rotation:** Generate a new 256-bit Base64 key (`openssl rand -base64 32`). Update `JWT_SECRET` across backend deployment environments. Existing valid tokens expire gracefully within their 24-hour TTL window (`app.jwt.expiration-ms`).
2. **Database Credential Cycling:** Update password in Supabase/PostgreSQL, update `DB_PASSWORD` secret in HF Spaces, and trigger automated container rolling restart without downtime.
3. **NVIDIA NIM API Key:** Generate a new key in NVIDIA Build Portal, replace `NVIDIA_API_KEY` in Vercel project settings, and redeploy. The fallback document sanitizer ensures 100% uptime during key swaps.

---

## 🧪 Running Tests & CI Automation

The project includes an automated GitHub Actions CI pipeline (`.github/workflows/ci.yml`) gating pull requests and commits across all 3 modules:

```bash
# 1. Python Matching Service Unit Tests (FastAPI + Cosine Engine)
cd matching-service
pytest tests/ -v

# 2. Spring Boot Backend Compilation & Tests (Java 21)
cd backend
mvn clean test-compile

# 3. React Frontend Build & Typecheck (Vite + TypeScript)
cd frontend
npm run build
```

---

## 📌 Version & Release Notes

### Current Version: `v1.0.0` (Initial Production Release)

Skill Sync `v1.0.0` is the initial production-ready version designed for institutional deployment across engineering colleges.

#### Module Version Breakdown

| Service / Module | Package Version | Tech Stack & Core Libraries | Deployment Target |
|---|---|---|---|
| **Core Backend** | `v1.0.0` | Java 21 · Spring Boot 3.3.2 · Spring Security (JWT) · STOMP WebSocket · PDFBox 3 · iText 8 | Hugging Face Spaces (Docker) |
| **Frontend Web App** | `v1.0.0` | React 18.3.1 · Vite 5.3.1 · TypeScript 5.4.5 · Redux Toolkit 2.2.6 · Tailwind CSS 3.4.4 | Vercel (Static Web) |
| **Matching Microservice** | `v1.0.0` | Python 3.11 · FastAPI 0.111.0 · scikit-learn 1.5.1 · NumPy 1.26.4 · OpenAI SDK 1.35.0 | Vercel (Serverless) |
| **Database** | — | PostgreSQL 15+ (Supabase) with Hibernate Auto-DDL | Supabase Cloud |
| **AI LLM Engine** | — | NVIDIA NIM API (`meta/llama-3.1-8b-instruct`) | NVIDIA Build Cloud |

#### Release Highlights (`v1.0.0`)
- 👥 **Role-Based Portals:** Complete portal implementations for 3 distinct user roles: Student, Faculty Mentor, and Department Coordinator/Admin.
- 🤝 **AI Skill & Mentor Matching:** Cosine similarity skill-gap algorithm combined with C-optimized `heapq` for complementary student teammate discovery, and workload-penalized mentor matching.
- 🔍 **TF-IDF Plagiarism Detection:** Real-time n-gram TF-IDF vectorizer flagging duplicate capstone project ideas prior to approval.
- 📄 **Smart PDF Document Sanitizer:** Offloaded local PDF text extraction via Apache PDFBox coupled with NVIDIA NIM (Llama 3.1) text-to-markdown summarization.
- 💬 **Real-time Messaging & Notifications:** STOMP protocol WebSockets providing instant team chat feeds and personal notification queues.
- 📜 **QR-Verified PDF Certificates:** Automated completion certificate generation using iText 8 with verifiable QR code routes (`/api/v1/certificates/verify/{certNumber}`).
- ☁️ **Serverless Cloud Architecture:** Automated CI/CD pipelines deploying Spring Boot to HF Spaces, Python & React to Vercel, and database hosting on Supabase.

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