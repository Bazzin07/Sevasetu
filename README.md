# SevaSetu — AI-Powered Disaster Response & Dispatch Platform

> **Live Demo →** [https://sevasetu-242a8.web.app](https://sevasetu-242a8.web.app)

---

## The Problem

When disasters strike — floods, earthquakes, fires, industrial accidents — the gap between people who need help and people who can provide it widens rapidly. Existing coordination systems fail because:

- **Citizens report emergencies in fragmented ways** — voice messages, WhatsApp texts, social media posts — in multiple local languages with no structure.
- **Coordinators manually match volunteers** to incidents using spreadsheets or phone calls, a process that takes minutes when seconds matter.
- **Volunteer skills are mismatched** — medical emergencies are assigned to logistics volunteers, and vice versa.
- **No real-time visibility** exists into which responders are available, how close they are, or how reliable they've been in past deployments.
- **Duplicate dispatches and race conditions** occur when multiple coordinators assign the same volunteer to different incidents simultaneously.

---

## What SevaSetu Solves

SevaSetu is an end-to-end emergency coordination platform that transforms raw, chaotic crisis signals into precise, AI-driven dispatch actions — all in real time.

### Core Capabilities

**🧠 AI Ingestion Pipeline**  
Raw citizen SOS messages (text, voice, multilingual) are automatically translated, geo-tagged, and classified into one of 36 disaster categories using a structured LLM extraction pipeline (Google Gemini). Coordinators receive clean, actionable incident cards — not raw noise.

**⚡ 5-Signal Hybrid Matching Engine**  
Every volunteer is ranked against every incident using five weighted signals simultaneously:
1. **Semantic Skill Match** — SBERT embeddings + pgvector cosine similarity match volunteer skills to incident requirements at a language-agnostic level.
2. **Geo-Proximity** — Real road distances via OSRM routing (not straight-line estimates).
3. **Urgency Tier** — Decay-adjusted urgency score that escalates automatically if an incident goes unaddressed.
4. **Availability** — Only available volunteers are surfaced; no manual filtering required.
5. **Reliability** — Weighted by each volunteer's historical completion rate across past assignments.

**🗺️ Live Coordinator Dashboard**  
An interactive map view shows geo-tagged incidents alongside ranked volunteer overlays. Coordinators dispatch with a single click; the system generates a personalised AI dispatch brief for the selected responder.

**🔒 Concurrency-Safe Dispatch**  
PostgreSQL row-level locking (`SELECT FOR UPDATE`) ensures that no two coordinators can double-assign the same volunteer to different incidents — even under peak load.

**📡 Facility Discovery**  
Beyond individual volunteers, the platform queries Google Places and OpenStreetMap Overpass in real time to surface nearby hospitals, fire stations, and emergency services for every incident.

**🔄 Self-Calibrating Weights**  
Coordinator feedback (acceptances, rejections, ratings) is fed back into an LLM-driven weight calibrator that continuously fine-tunes matching signal weights over time, improving recommendation accuracy automatically.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                   │
│  Dashboard · Needs · Volunteers · Assignments · Ingest│
│  React Leaflet Maps · Recharts Analytics · Firebase Auth│
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│                  FastAPI Backend                      │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  AI Ingestion│  │  Matching    │  │  Briefing   │ │
│  │  Pipeline   │  │  Engine      │  │  Service    │ │
│  │  (Gemini)   │  │  (5-Signal)  │  │  (Gemini)   │ │
│  └─────────────┘  └──────────────┘  └─────────────┘ │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Embedding  │  │  Responder   │  │  Urgency    │ │
│  │  Service    │  │  Discovery   │  │  Decay      │ │
│  │  (SBERT)    │  │  (OSM/Maps)  │  │  Scheduler  │ │
│  └─────────────┘  └──────────────┘  └─────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│         PostgreSQL + pgvector (Vector DB)             │
│   Volunteers · Needs · Assignments · Embeddings       │
└─────────────────────────────────────────────────────┘
                       │
         GCP Secret Manager (API Keys)
         Firebase Auth (User Identity)
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15, TypeScript, React, Tailwind CSS, React Leaflet, Recharts |
| **Backend** | Python, FastAPI (async), SQLAlchemy, Alembic, Pydantic |
| **AI / NLP** | Google Gemini API, SBERT (Sentence-Transformers), pgvector |
| **Routing & Geo** | OSRM API, Google Places API, OpenStreetMap Overpass |
| **Database** | PostgreSQL with pgvector extension |
| **Auth & Hosting** | Firebase Auth, Firebase Hosting |
| **Security** | GCP Secret Manager (versioned API key management) |

---

## Key Engineering Decisions

- **pgvector over dedicated vector DBs** — Keeps the stack unified in PostgreSQL; avoids operational overhead of a separate Pinecone/Weaviate instance while achieving sub-200ms similarity search across 200+ candidates.
- **Row-level locking on dispatch** — `SELECT FOR UPDATE` on Volunteer + Need rows during assignment creation prevents race conditions without requiring distributed locks or Redis.
- **LLM feedback loop for weight calibration** — Instead of hardcoding matching weights, the system learns from coordinator behaviour, making recommendations progressively more accurate over time.
- **Multilingual-first ingestion** — All text is language-detected and translated before embedding, ensuring semantic matches work across Hindi, Bengali, Tamil, and other regional languages.

---

## License

MIT
