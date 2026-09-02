<div align="center">

# 🎓 Skill Sync

### AI-Powered Capstone Project Collaboration Platform

**A production-grade, institutional platform for engineering colleges to manage capstone projects end-to-end — team formation, AI mentor matching, milestone tracking, and grading.**

[![Version](https://img.shields.io/badge/Version-v2.0.0-blue?logo=git)](https://github.com/sivaprasantht-yuna/Capstone-Project)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12-yellow?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![NVIDIA NIM](https://img.shields.io/badge/AI-NVIDIA%20NIM-76B900?logo=nvidia)](https://build.nvidia.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **S5 Mini Project — Unified Python Full-Stack Architecture (v2.0.0)**  
> React 18 (Vite + TypeScript) + Unified Python FastAPI + Supabase PostgreSQL + Native WebSockets + NVIDIA NIM

</div>

---

## 📋 Table of Contents

- [What is Skill Sync?](#-what-is-skill-sync)
- [Unified System Architecture](#️-unified-system-architecture)
- [Why This Stack?](#-why-this-stack)
- [Data Structures & Algorithms](#-data-structures--algorithms)
- [Key Features](#-key-features)
- [Project Structure](#-project-structure)
- [Quick Start Development](#-quick-start-development)
- [Database Setup & Seeding](#-database-setup--seeding)
- [Demo Credentials](#-demo-credentials)
- [API Documentation](#-api-documentation)
- [Matching & AI Algorithms](#-matching--ai-algorithms)
- [Database Schema](#-database-schema)
- [Environment Configuration](#️-environment-configuration)
- [Running Automated Tests](#-running-automated-tests)
- [Release Notes](#-release-notes)

---

## 🏆 What is Skill Sync?

Skill Sync eliminates the manual, chaotic process of capstone project formation in universities. Built on an **Institutional Dedicated-Deployment Architecture with Role-Based Access Control (RBAC)**, any university or engineering institution can self-host or deploy independent instances to manage faculty mentors, student teams, deliverables, and departmental capstone lifecycles with absolute data sovereignty.

| Feature | Description |
|---|---|
| 🤝 **AI Teammate Matching** | Cosine similarity & Gale-Shapley matching find complementary student teammates |
| 🎓 **AI Mentor Matching** | Skill overlap dot-products with capacity constraints for optimal mentor allocation |
| 🔍 **Idea Plagiarism Check** | Dual-pass lexical (TF-IDF) & semantic subword embeddings flag duplicate ideas |
| 📄 **AI Document Sanitizer** | Automated document parsing + NVIDIA NIM (Llama 3.1) markdown summaries |
| 💬 **Real-time Team Chat** | Native WebSocket protocol with WhatsApp-style delivery & double blue-tick read receipts |
| 🔔 **In-App Notifications** | Role-based notifications with unread badge counter |
| 📋 **Project Deliverables & Tasks** | Task allocation, status tracking (`TODO`, `IN_PROGRESS`, `COMPLETED`), and evidence uploads |
| 🏁 **Milestones & Grading** | Sequential milestone submissions, grading rubrics, and feedback |
| 📊 **Admin Oversight Dashboard** | Real-time analytics, KPI metrics, mentor load utilization, and at-risk team alerts |
| 📜 **Verifiable Certificates** | Unique completion certificates with online verification (`/api/v1/certificates/verify/{certNumber}`) |
| 👥 **3 Role Portals** | Dedicated experiences for Students, Faculty Mentors, and Administrators |

---

## 🏗️ Unified System Architecture

> 📖 **Comprehensive Design Document:** For complete architectural topologies, sequence diagrams, and mathematical formulations, see [docs/SYSTEM_DESIGN.md](file:///d:/Programming/S5%20Mini%20Project/docs/SYSTEM_DESIGN.md).

```
┌────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                   │
│     React 18 · Vite · TypeScript · Tailwind CSS · Redux Toolkit        │
│                       http://localhost:5173                            │
└───────────────────────┬────────────────────────┬───────────────────────┘
                        │ REST /api/v1           │ Native WebSocket /ws/chat
                        ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 UNIFIED PYTHON FASTAPI BACKEND (8000)                  │
│  • Authentication (JWT, BCrypt, RBAC)                                  │
│  • Team Workspace & Task Management                                    │
│  • Native WebSocket Chat Manager + Read Receipts                       │
│  • AI Matching (Gale-Shapley, ILP, Cosine TF-IDF, NLP)                 │
│  • Analytics, Milestones, Certificates & Admin Oversight               │
│  • Connection Pooling (SQLAlchemy Engine, pool_pre_ping, auto-recycle) │
└───────────────────────┬────────────────────────┬───────────────────────┘
                        │ SQLAlchemy ORM         │ REST / API Key
                        ▼                        ▼
         ┌────────────────────────┐    ┌────────────────────────┐
         │  PostgreSQL (Supabase) │    │   NVIDIA NIM Cloud     │
         │  18 Relational Tables  │    │   (Llama 3.1 LLM)      │
         └────────────────────────┘    └────────────────────────┘
```

---

## 🤔 Why This Stack?

### 🐍 Python + FastAPI (Unified Backend)
- **Single Runtime:** Replaced multiple microservices with a unified, high-performance async platform.
- **Native ML & AI Integration:** Direct execution of `scikit-learn`, `numpy`, and NVIDIA NIM AI models without RPC overhead.
- **Robust Connection Pooling:** Multi-threaded connection pooling with `pool_pre_ping=True` and connection recycling.
- **High Concurrency WebSockets:** Native async WebSocket manager handling live team messaging and read receipts.

### ⚛️ React + Vite + TypeScript (Modern Frontend)
- **Fast Build Times:** Sub-5s production builds and instant HMR via Vite.
- **Role-Based Portals:** Modular dashboards with glassmorphism styling for Students, Faculty, and Admins.
- **Native WebSocket Client:** Backoff auto-reconnection and real-time state synchronization via Redux Toolkit.

---

## 🧠 Core Academic Matching & Optimization Algorithms

### 1. 🎓 Stable Mentor Allocation — Gale-Shapley Deferred Acceptance (Many-to-One)
- **Theoretical Basis:** *Gale & Shapley (1962)*, *"College Admissions and the Stability of Marriage"*, American Mathematical Monthly.
- **Problem Formulation:** Matches student teams $T = \{t_1, \dots, t_n\}$ to faculty mentors $M = \{m_1, \dots, m_k\}$ where each mentor $m_j$ has capacity $C(m_j)$.
- **Mathematical Guarantee:** Guarantees a **student-optimal stable matching** in $O(|T| \cdot |M|)$ time with zero blocking pairs.
- **Implementation:** [`backend/routers/mentor_match.py`](file:///d:/Programming/S5%20Mini%20Project/backend/routers/mentor_match.py) & [`backend/dsa/`](file:///d:/Programming/S5%20Mini%20Project/backend/dsa).

### 2. 🤝 Global Classroom Team Formation — Integer Linear Programming (ILP)
- **Theoretical Basis:** *EDU-TF Framework (arXiv:2506.02756)*, *"Exact and Heuristic Integer Linear Programming for Classroom Team Formation"*.
- **Problem Formulation:** Partitions cohort students into optimal teams maximizing pairwise complementarity with strict team bounds ($k_{min} \le |T_m| \le k_{max}$) and **Zero Stragglers Guarantee**.
- **Implementation:** [`backend/routers/teammate_match.py`](file:///d:/Programming/S5%20Mini%20Project/backend/routers/teammate_match.py).

### 3. 🔍 Dual-Pass Lexical (TF-IDF) + Semantic Plagiarism Detection
- **Hierarchical Pipeline:**
  - **Pass 1 (Lexical):** N-Gram $(1, 2)$ TF-IDF with sublinear scaling.
  - **Pass 2 (Semantic):** Dense subword embedding projection capturing conceptual overlap and synonyms.
  - **Output:** Exact duplicate, paraphrased duplicate, thematic overlap, or distinct proposal.
- **Implementation:** [`backend/routers/idea_similarity.py`](file:///d:/Programming/S5%20Mini%20Project/backend/routers/idea_similarity.py).

---

## 📁 Project Structure

```
Capstone-Project/
├── backend/                         # Unified Python FastAPI Platform
│   ├── main.py                      # Application entrypoint, CORS, Lifespan, WebSockets
│   ├── config.py                    # Environment & JWT settings
│   ├── database.py                  # SQLAlchemy engine & connection pooling
│   ├── models.py                    # 18 Relational ORM models
│   ├── schemas.py                   # Pydantic validation schemas & DTOs
│   ├── security.py                  # JWT tokens, BCrypt hashing, RBAC dependencies
│   ├── websocket_manager.py         # Native WebSocket connection manager
│   ├── reset_and_seed_db.py         # Database reset & clean seeder script
│   ├── requirements.txt             # Python dependencies
│   ├── routers/                     # 16 Modular API Routers
│   │   ├── auth.py                  # Login, Register, Refresh Token
│   │   ├── users.py                 # Profiles & Student Details
│   │   ├── projects.py              # Project Repository & PDF Processing
│   │   ├── teams.py                 # Team Lifecycle, Join Requests & Invites
│   │   ├── tasks.py                 # Student Tasks & Evidence Uploads
│   │   ├── progress.py              # Team Progress Analytics & Timeline
│   │   ├── certificates.py          # Certificate Issuance & Verification
│   │   ├── messages.py              # Chat History & Read Receipts
│   │   ├── milestones.py            # Milestones & Submissions
│   │   ├── mentorships.py           # Mentorship Requests & Faculty Load
│   │   ├── notifications.py         # In-App Notifications & Unread Count
│   │   ├── admin.py                 # KPI Analytics, Overview, At-Risk Teams
│   │   ├── matching.py              # Teammate & Mentor Recommendations
│   │   ├── teammate_match.py        # Gale-Shapley & ILP Algorithms
│   │   ├── mentor_match.py          # Workload-Penalized Mentor Matching
│   │   ├── idea_similarity.py       # TF-IDF Plagiarism Detection
│   │   ├── graph_analysis.py        # Team Network Graph Algorithms
│   │   └── document_sanitizer.py    # AI Document Redaction & Summary
│   └── tests/
│       └── test_unified_backend.py  # Pytest automated test suite
│
├── frontend/                        # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/             # Dashboard, Workspace, Chat, Matching, Leaderboard
│   │   │   ├── faculty/             # Dashboard, Grading, Mentorship Review
│   │   │   ├── admin/               # Analytics, All Teams, At-Risk Teams, Projects
│   │   │   └── auth/                # Login & Registration Pages
│   │   ├── store/                   # Redux Toolkit (Auth, Team, Notifications)
│   │   ├── lib/                     # Axios API client, Native WebSocket client
│   │   └── components/              # Shared UI components & Layouts
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   └── SYSTEM_DESIGN.md             # Comprehensive System Design Document
│
├── start-dev.ps1                    # 1-Click Dev Launcher (PowerShell)
└── README.md                        # Documentation
```

---

## 🚀 Quick Start (Development)

### Prerequisites
- **Python 3.11+**
- **Node.js 20+ & npm**
- **PostgreSQL Database** (Supabase or local)

---

### 1-Click Start (Recommended)

Run the dev launcher from PowerShell:
```powershell
.\start-dev.ps1
```
This automatically launches:
- **Unified Backend**: `http://localhost:8000` (Swagger UI: `http://localhost:8000/docs`)
- **React Frontend**: `http://localhost:5173`

---

### Manual Setup & Execution

#### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🗄️ Database Setup & Seeding

The database models are managed via SQLAlchemy ORM.

### Complete Clean Reset & Seeder
To reset all tables and populate with verified demo data:
```bash
cd backend
python reset_and_seed_db.py
```

This seeds:
- **32 Curated Skills** (AI/ML, Full-Stack, Cloud, DevOps, IoT, Security)
- **13 Verified Users** (Admin, Faculty Mentors, Students)
- **Active & Forming Teams** (*NeuroSync*, *AgriVision*)
- **Milestones, Deliverables & Tasks**
- **Live Chat History with Read Receipts**

---

## 🔐 Demo Credentials

All demo accounts are pre-configured with quick login buttons on the login page:

| Role | Email | Password | Default Dashboard |
|---|---|---|---|
| **Admin / Coordinator** | `admin@capstonehub.app` | `Admin@123` | `/admin/dashboard` |
| **Faculty Mentor (CSE Head)** | `sasikala.d@demo.capstonehub.app` | `Faculty@123` | `/faculty/dashboard` |
| **Student (Team Lead)** | `siva.prasanth@student.demo.capstonehub.app` | `Student@123` | `/student/dashboard` |
| **Test Student** | `siva@gmail.com` | `Password@123` | `/student/dashboard` |

*(All other seeded faculty & student accounts also accept `Password@123`)*

---

## 📖 API Documentation

- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc API Spec**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoint Groups

```http
# Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh

# User & Student Profile
GET  /api/v1/users/profile
PUT  /api/v1/users/profile

# Projects
GET  /api/v1/projects
POST /api/v1/projects
GET  /api/v1/projects/domains
POST /api/v1/projects/process-pdf
POST /api/v1/projects/{id}/upvote

# Teams
GET  /api/v1/teams/my
POST /api/v1/teams
GET  /api/v1/teams/open
POST /api/v1/teams/{id}/join-request
POST /api/v1/teams/{id}/invite/{studentId}
PATCH /api/v1/teams/{id}/join-requests/{requestId}/respond

# Tasks & Evidence
GET  /api/v1/teams/{teamId}/tasks
POST /api/v1/teams/{teamId}/tasks
PATCH /api/v1/teams/{teamId}/tasks/{taskId}
POST /api/v1/teams/{teamId}/tasks/{taskId}/evidence

# Milestones
GET  /api/v1/milestones/team/{teamId}
POST /api/v1/milestones/{id}/submit
POST /api/v1/milestones/{id}/grade

# Mentorships
POST /api/v1/mentorships/request
GET  /api/v1/mentorships/pending
GET  /api/v1/mentorships/active
PATCH /api/v1/mentorships/{id}/respond
POST /api/v1/mentorships/{id}/rate

# Notifications
GET  /api/v1/notifications
GET  /api/v1/notifications/unread-count
PATCH /api/v1/notifications/mark-all-read

# Admin Analytics
GET  /api/v1/admin/analytics/overview
GET  /api/v1/admin/teams
GET  /api/v1/admin/at-risk-teams

# Real-Time Native WebSockets
WS   /ws/chat/{teamId}
```

---

## 📊 Database Schema (18 Relational Tables)

```
users ─────────────────────────────────────────────────────────────
  ├── student_profiles        (1:1 user, GitHub/LinkedIn links, bio, points)
  ├── faculty_profiles        (1:1 user, designation, capacity, rating)
  ├── user_skills             (M:N users ↔ skills, proficiency 1–5)
  └── notifications           (per-user inbox, unread tracking)

skills ─────────────────────── (curated domain & programming catalog)

projects ──────────────────────────────────────────────────────────
  └── teams
        ├── team_members      (M:N users ↔ teams, role_in_team, status)
        ├── mentorships       (M:1 team, M:1 faculty mentor)
        ├── milestones        (ordered milestones, due dates, points)
        ├── student_tasks     (tasks assigned to students, completion notes)
        │     └── project_evidence (code commit, file proof, verification)
        ├── messages          (real-time team chat, read receipt timestamps)
        └── certificates      (1:1 team, unique QR verification)

events ─────────────────────── (audit timeline & at-risk detection)
evaluations ────────────────── (milestone grading marks & rubric feedback)
student_contributions ──────── (individual student contribution metrics)
```

---

## ⚙️ Environment Configuration

Create or verify your `.env` file in the project root:

```env
# Database (Supabase PostgreSQL)
DB_URL=postgresql://postgres.xxx:password@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require

# JWT Authentication
JWT_SECRET=CapstoneHubSuperSecretKeyForJWTTokenGeneration2024!!!
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=7

# Cloudinary (File & PDF Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# NVIDIA NIM AI (Document Sanitization & Summarization)
NVIDIA_API_KEY=nvapi-your_api_key_here
```

---

## 🧪 Running Automated Tests

### 1. Backend Pytest Suite
```bash
cd backend
pytest tests/test_unified_backend.py -v
```
- Tests health endpoints, demo logins for all 3 roles, and complete end-to-end workflows (Profiles, Teams, Milestones, Tasks, Chat, Notifications, Plagiarism check).

### 2. Frontend Build Verification
```bash
cd frontend
npm run build
```
- Runs TypeScript type-checking (`tsc`) and Vite production bundling.

---

## 📌 Release Notes

### Current Version: `v2.0.0` (Unified Python Platform)

- ⚡ **Unified Python FastAPI Architecture:** Single runtime replacing the legacy Spring Boot + microservice split.
- 🚀 **100% Feature & Endpoint Parity:** Complete REST API coverage matching all institutional workflows.
- 💬 **Native WebSockets:** High-speed real-time messaging with delivery status and read receipts (no SockJS/STOMP dependency).
- 🗄️ **Optimized Connection Pooling:** Multi-threaded connection pool with health probes (`pool_pre_ping=True`) and stale connection recycling.
- 🛡️ **Zero Orphaned Records:** Clean schema with database-level cascades, constraints, and seeder scripts.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ as an S5 Mini Project**  
*Designed for institutional deployment across engineering universities*

</div>