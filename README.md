<div align="center">

# 🎓 Skill Sync

### AI-Powered Capstone Project Collaboration Platform

**A production-grade, institutional platform for engineering colleges to manage capstone projects end-to-end — team formation, AI mentor matching, milestone evidence tracking, structured rubric grading, and departmental grade sheet exports.**

[![Version](https://img.shields.io/badge/Version-v2.1.0-blue?logo=git)](https://github.com/sivaprasantht-yuna/Capstone-Project)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12-yellow?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Playwright](https://img.shields.io/badge/Tested%20With-Playwright%20E2E-2EAD33?logo=playwright)](https://playwright.dev/)
[![Chrome DevTools](https://img.shields.io/badge/Profiled%20With-Chrome%20DevTools%20CDP-4285F4?logo=googlechrome)](https://chromedevtools.github.io/devtools-protocol/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **S5 Mini Project — Unified Full-Stack Platform**  
> React 18 (Vite + TypeScript) + Unified Python FastAPI + Supabase PostgreSQL + Native WebSockets + FastEmbed CPU Deduplication + Playwright & Chrome DevTools Diagnostics

</div>

---

## 📋 Table of Contents

- [What is Skill Sync?](#-what-is-skill-sync)
- [Software Development Life Cycle (SDLC) Model](#-software-development-life-cycle-sdlc-model)
- [Unified System Architecture](#️-unified-system-architecture)
- [Key Features](#-key-features)
- [Core Academic Algorithms](#-core-academic-algorithms)
- [Project Structure](#-project-structure)
- [Quick Start Development](#-quick-start-development)
- [Database Setup & Seeding](#-database-setup--seeding)
- [Demo Credentials](#-demo-credentials)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Automated Testing & Chrome DevTools Diagnostics](#-automated-testing--chrome-devtools-diagnostics)
- [Release Notes](#-release-notes)

---

## 🏆 What is Skill Sync?

Skill Sync eliminates the manual, chaotic process of capstone project management in universities. Built on an **Institutional Deployment Architecture with Role-Based Access Control (RBAC)**, any university or engineering institution can host independent instances to manage faculty mentors, student teams, project evidence deliverables, and departmental capstone lifecycles with absolute data sovereignty.

| Feature | Description |
|---|---|
| 🤝 **AI Teammate Matching** | Cosine similarity & Gale-Shapley matching find complementary student teammates |
| 🎓 **AI Mentor Matching** | Skill overlap dot-products with capacity constraints for optimal mentor allocation |
| 🔍 **Idea Plagiarism & FastEmbed** | Local CPU vector deduplication (`BAAI/bge-small-en-v1.5`) + subword lexical scanning |
| 📁 **Evidence & Deliverables Storage** | Multi-tier file uploads (Cloudinary + local disk fallback) linked to `ProjectEvidence` |
| 💬 **Real-time Team Chat** | Native WebSocket protocol with 20s PING/PONG heartbeats & read receipts |
| ⚡ **Offline Resiliency & Auto-Reconnect** | Automatic socket re-connection on laptop sleep wake-up or Wi-Fi restoration |
| 🎯 **Structured Evaluation Rubrics** | 3-Tier grading (Literature 20%, Architecture 40%, Viva 40%) with live score tallying |
| 📥 **1-Click Grade Sheet Export (CSV)** | Departmental RFC4180 CSV export for coordinator record submission |
| 🛡️ **Admin-Gated Team Governance** | Leader team-dismantles and member departures strictly gated behind Admin approval |
| 📊 **Admin Oversight Dashboard** | Real-time analytics, KPI metrics, mentor load utilization, and at-risk team monitoring |
| 👥 **3 Role Portals** | Tailored experiences for Students, Faculty Mentors, and Institutional Administrators |

---

## 🔄 Software Development Life Cycle (SDLC) Model

Skill Sync was engineered using the **Agile Methodology (Iterative & Incremental Framework)**. This approach allowed the system to evolve dynamically as requirements were evaluated in real time:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Sprint 1   │ ──> │   Sprint 2   │ ──> │   Sprint 3   │ ──> │   Sprint 4   │ ──> │   Sprint 5   │
│  Foundation  │     │ AI Matching  │     │ Governance   │     │  Evidence &  │     │ Hardening &  │
│  & Dual Auth │     │ & FastEmbed  │     │ & Live Chat  │     │ Grade Sheet  │     │ DevTools E2E │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Sprint Breakdown:
1. **Sprint 1 — Core Platform & Authentication:** Unified Python FastAPI backend, Supabase PostgreSQL pooler, and JWT RBAC for Student, Faculty, and Admin roles.
2. **Sprint 2 — AI Deduplication & Gale-Shapley Matching:** Local FastEmbed vector engine (384-dim CPU embeddings) with zero disk footprint, plus two-sided stable matching for teammate and mentor assignment.
3. **Sprint 3 — Collaboration, WebSockets & Governance:** Real-time team messaging with delivery receipts, coupled with Institutional Admin-approved governance workflows for team dismantlement and member exits.
4. **Sprint 4 — Deliverable Evidence, Rubrics & CSV Export:** Multipart file uploads (Cloudinary + local fallback), structured 3-tier capstone rubrics (Literature, Architecture, Viva), and 1-click cohort grade sheet CSV generation.
5. **Sprint 5 — Hardening, Offline Resilience & Diagnostics:** Added WebSocket ping/pong heartbeats, laptop sleep auto-reconnection, full 21-test Playwright E2E automation, and Chrome DevTools Protocol performance profiling.

---

## 🏗️ Unified System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                   │
│     React 18 · Vite · TypeScript · Tailwind CSS · Redux Toolkit        │
│                       http://localhost:5173                            │
└───────────────────────┬────────────────────────┬───────────────────────┘
                        │ REST /api/v1           │ Native WebSocket (Heartbeats)
                        ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 UNIFIED PYTHON FASTAPI BACKEND (8000)                  │
│  • Authentication (JWT, BCrypt, RBAC for Student / Faculty / Admin)    │
│  • Milestone Evidence Engine (Cloudinary API + Local Disk Fallback)    │
│  • WebSocket Manager with 20s PING/PONG Keep-Alives & Read Receipts   │
│  • AI Matching (Gale-Shapley, ILP, FastEmbed 384-dim Vector Engine)   │
│  • Structured Capstone Rubrics & 1-Click CSV Grade Sheet Generator     │
│  • Connection Pooling (SQLAlchemy Engine, pool_pre_ping, auto-recycle) │
└───────────────────────┬────────────────────────┬───────────────────────┘
                        │ SQLAlchemy ORM         │ REST / Cloud API
                        ▼                        ▼
         ┌────────────────────────┐    ┌────────────────────────┐
         │  PostgreSQL (Supabase) │    │  Cloudinary / Storage  │
         │  18 Relational Tables  │    │  (Deliverable Reports) │
         └────────────────────────┘    └────────────────────────┘
```

---

## 🧠 Core Academic Algorithms

### 1. 🎓 Stable Mentor Allocation — Gale-Shapley Deferred Acceptance
- **Theoretical Basis:** *Gale & Shapley (1962)*, *"College Admissions and the Stability of Marriage"*.
- **Problem Formulation:** Matches student teams $T = \{t_1, \dots, t_n\}$ to faculty mentors $M = \{m_1, \dots, m_k\}$ subject to mentor capacity quotas $C(m_j)$.
- **Mathematical Guarantee:** Guarantees a **student-optimal stable matching** in $O(|T| \cdot |M|)$ time with zero blocking pairs.
- **Implementation:** [`backend/routers/mentor_match.py`](file:///d:/Programming/S5%20Mini%20Project/backend/routers/mentor_match.py).

### 2. 🤝 Global Classroom Team Formation — Integer Linear Programming (ILP)
- **Theoretical Basis:** *EDU-TF Framework (arXiv:2506.02756)*, *"Exact and Heuristic Integer Linear Programming for Classroom Team Formation"*.
- **Problem Formulation:** Partitions cohort students into optimal teams maximizing pairwise skill complementarity with strict team bounds ($k_{min} \le |T_m| \le k_{max}$) and a **Zero Stragglers Guarantee**.
- **Implementation:** [`backend/routers/teammate_match.py`](file:///d:/Programming/S5%20Mini%20Project/backend/routers/teammate_match.py).

### 3. 🔍 FastEmbed Vector Deduplication & Plagiarism Gate
- **Architecture:** Local `BAAI/bge-small-en-v1.5` dense model on CPU (384-dimension output vector).
- **Zero-Storage RAM Pipeline:** Extracted proposal text is vectorized on-the-fly and compared via cosine similarity against Supabase pgvector embeddings without writing unapproved drafts to disk.
- **Implementation:** [`backend/app/main.py`](file:///d:/Programming/S5%20Mini%20Project/backend/app/main.py).

---

## 📁 Project Structure

```
Capstone-Project/
├── .agents/
│   └── mcp_config.json              # Playwright & Chrome DevTools MCP servers
│
├── backend/                         # Unified Python FastAPI Platform
│   ├── main.py                      # FastAPI entrypoint, WebSockets, /uploads mount
│   ├── config.py                    # Environment, JWT & Cloudinary settings
│   ├── database.py                  # SQLAlchemy engine & connection pooling
│   ├── models.py                    # 18 Relational ORM models (ProjectEvidence, Teams, etc.)
│   ├── schemas.py                   # Pydantic validation schemas & DTOs
│   ├── security.py                  # JWT tokens, BCrypt hashing, RBAC dependencies
│   ├── websocket_manager.py         # Native WebSocket connection manager
│   ├── reset_and_seed_db.py         # Database reset & clean seeder script
│   ├── requirements.txt             # Python dependencies
│   ├── uploads/milestones/          # Local fallback deliverable evidence storage
│   ├── routers/                     # 15 Modular API Routers
│   │   ├── auth.py                  # Login, Register, Token Refresh
│   │   ├── users.py                 # User Profiles & Normalized Skill DTOs
│   │   ├── projects.py              # Project Repository & Status Filtering
│   │   ├── teams.py                 # Team Lifecycle, Invites, Governance Requests
│   │   ├── tasks.py                 # Student Tasks & Evidence Uploads
│   │   ├── progress.py              # Team Progress Analytics & Timeline
│   │   ├── messages.py              # Team Chat History & Read Receipts
│   │   ├── milestones.py            # Evidence Submission & Rubric Evaluation
│   │   ├── mentorships.py           # Mentorship Requests & Faculty Load
│   │   ├── notifications.py         # In-App Notifications & Unread Counts
│   │   ├── admin.py                 # KPI Analytics, Overview & CSV Grade Export
│   │   ├── matching.py              # Teammate & Mentor Recommendations
│   │   ├── teammate_match.py        # Gale-Shapley & ILP Algorithms
│   │   ├── mentor_match.py          # Workload-Penalized Mentor Allocation
│   │   ├── idea_similarity.py       # TF-IDF & Semantic Similarity
│   │   ├── graph_analysis.py        # Team Network Graph Algorithms
│   │   └── document_sanitizer.py    # AI Document Redaction & Summary
│   └── tests/
│       ├── test_unified_backend.py  # Pytest automated test suite
│       └── test_milestone_rubrics.py# Deliverable submission & grading test
│
├── frontend/                        # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/             # Dashboard, Ideas, Workspace, Chat, Progress
│   │   │   ├── faculty/             # Dashboard, Structured Grading, Mentorship Review
│   │   │   ├── admin/               # Analytics, Team Governance, CSV Export, Approvals
│   │   │   └── auth/                # Login & Registration Pages
│   │   ├── store/                   # Redux Toolkit (Auth, Team, Notifications)
│   │   ├── lib/                     # Axios API client, WebSocket keep-alive client
│   │   └── components/              # Shared UI components & PortalLayouts
│   ├── test_playwright_e2e.mjs      # 21-Test Automated Playwright Test Suite
│   ├── diagnose_chrome_devtools.mjs # Chrome DevTools Protocol (CDP) Diagnostic Runner
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   └── SYSTEM_DESIGN.md             # Comprehensive System Design Document
│
├── start-dev.ps1                    # 1-Click Development Launcher (PowerShell)
└── README.md                        # Project Documentation
```

---

## 🚀 Quick Start (Development)

### Prerequisites
- **Python 3.11+**
- **Node.js 20+ & npm**
- **PostgreSQL Database** (Supabase or local)

---

### 1-Click Launch (PowerShell)

Run the dev launcher from the project root:
```powershell
.\start-dev.ps1
```
This automatically launches:
- **Unified Backend:** `http://localhost:8000` (Interactive Swagger docs: `http://localhost:8000/docs`)
- **React Frontend:** `http://localhost:5173`

---

### Manual Launch

#### 1. Backend Service
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

#### 2. Frontend Client
```bash
cd frontend
npm install
npm run dev
```

---

## 🗄️ Database Setup & Seeding

The database models are managed via SQLAlchemy ORM connected to Supabase PostgreSQL.

### Complete Clean Seeder
To reset all tables and populate with verified demo data:
```bash
cd backend
python reset_and_seed_db.py
```

Seeds:
- **32 Curated Skills** (AI/ML, Full-Stack, Cloud, DevOps, IoT, Security)
- **13 Verified Users** (Institutional Admin, Faculty Mentors, Students)
- **Active & Forming Teams** (*NeuroSync*, *AgriVision*)
- **Milestones, Deliverables & Pre-linked Evidence**
- **Live Chat History with WhatsApp-Style Read Receipts**

---

## 🔐 Demo Credentials

All demo accounts can be launched with 1 click using the demo buttons on the login page:

| Role | Email | Password | Default Portal |
|---|---|---|---|
| **Admin / Coordinator** | `admin@capstonehub.app` | `Admin@123` | `/admin/dashboard` |
| **Faculty Mentor (CSE Head)** | `sasikala.d@demo.capstonehub.app` | `Faculty@123` | `/faculty/dashboard` |
| **Student (Team Lead)** | `siva.prasanth@student.demo.capstonehub.app` | `Student@123` | `/student/dashboard` |
| **Test Student** | `siva@gmail.com` | `Password@123` | `/student/dashboard` |

---

## 📖 API Documentation

- **Swagger UI (Interactive API Explorer):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Spec:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints

```http
# Authentication
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh

# User Profiles
GET  /api/v1/users/profile
PUT  /api/v1/users/profile

# Projects & Ideas
GET  /api/v1/projects?status=OPEN
POST /api/v1/projects
POST /api/scan-document

# Teams & Governance
GET  /api/v1/teams/my
POST /api/v1/teams
POST /api/v1/teams/{id}/governance-request
GET  /api/v1/admin/governance-requests
POST /api/v1/admin/governance-requests/{id}/review

# Milestones & Evidence Deliverables
GET  /api/v1/milestones/team/{teamId}
POST /api/v1/milestones/{id}/submit               # Multipart upload (file + remarks + githubUrl)
POST /api/v1/milestones/{id}/evaluate             # Structured Rubric Evaluation

# Department Admin & Grade Export
GET  /api/v1/admin/analytics/overview
GET  /api/v1/admin/at-risk-teams
GET  /api/v1/admin/grades/export                  # 1-Click RFC4180 Grade Sheet CSV Download

# Native WebSockets with 20s PING/PONG Keep-Alives
WS   /ws/chat/{teamId}
WS   /ws
```

---

## 🔬 Automated Testing & Chrome DevTools Diagnostics

### 1. Playwright End-to-End Test Suite
Skill Sync includes an automated Playwright suite verifying all 3 portals in headless Chromium:

```bash
cd frontend
node test_playwright_e2e.mjs
```

**Test Summary:**
```text
========================================
📊 PLAYWRIGHT E2E TEST SUMMARY
========================================
✅ Passed:         21 / 21
❌ Failed:         0
⚠️  Warnings:       0
🚨 Console Errors: 0
========================================
```

### 2. Chrome DevTools Protocol (CDP) In-Depth Diagnostic
Executes direct Chrome DevTools engine diagnostics across memory, DOM reflows, WebSocket frames, and CPU throttling:

```bash
cd frontend
node diagnose_chrome_devtools.mjs
```

**Diagnostic Summary:**
```text
========================================
🔬 CHROME DEVTOOLS DIAGNOSTIC REPORT
========================================
✅ Memory Health:       Clean (13.01 MB heap in use / 18.63 MB allocated)
✅ DOM Efficiency:      Optimal (493 nodes on dashboard)
✅ Layout Reflows:      Minimal (28 reflows during navigation)
✅ WebSocket Streaming: Real-time keep-alive verified
✅ CPU Throttling:      Smooth interaction under 4× mobile CPU slowdown
✅ Network Health:      41 API calls, 0 404s, 0 500s, 0 console errors
========================================
```

---

## 📌 Release Notes

### Current Version: `v2.1.0` (Capstone Edition)

- 📁 **Multi-Tier Milestone Deliverable Storage:** Multipart file uploads using Cloudinary cloud storage with automated local disk fallback (`uploads/milestones/`).
- 🎯 **Structured Evaluation Rubrics:** Replaced raw inputs with a 3-tier academic rubric (Literature Review 20 pts, Architecture & Implementation 40 pts, Testing & Viva 40 pts).
- 📥 **1-Click Grade Sheet Export:** Instant RFC4180 CSV generation (`/api/v1/admin/grades/export`) containing complete cohort marks and percentages for department records.
- ⚡ **WebSocket Offline Resilience:** Added 20-second PING/PONG keep-alives and automatic reconnection upon laptop wake-up or network restoration.
- 🛡️ **Admin-Gated Team Governance:** Added Institutional Admin approval workflows for team dismantles and member exits to ensure fair dispute resolution.
- 🧪 **Playwright & Chrome DevTools MCP Integration:** Configured dual-MCP testing infrastructure with 21 passing E2E tests and CDP memory/performance profiling.
- 📱 **Mobile & Tablet Polish:** Horizontally scrollable workspace tabs and responsive dropzone padding across touch screens.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ as an S5 Mini Project**  
*Designed for institutional deployment across engineering universities*

</div>