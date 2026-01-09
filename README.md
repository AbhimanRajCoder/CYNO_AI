<p align="center">
  <img src="https://img.shields.io/badge/Microsoft%20Azure-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white" alt="Azure"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
</p>

<h1 align="center">🏥 CYNO Healthcare Platform</h1>

<p align="center">
  <strong>AI-Powered Medical Document Analysis & Tumor Board Decision Support</strong><br/>
  <em>Built with Microsoft Azure AI Services</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen" alt="Status"/>
  <img src="https://img.shields.io/badge/Healthcare%20Grade-Hospital%20Compliant-blue" alt="Healthcare"/>
  <img src="https://img.shields.io/badge/Azure%20Verified-✓-0078D4" alt="Azure Verified"/>
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Microsoft Azure Integration](#-microsoft-azure-integration)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Features](#-features)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Safety & Compliance](#-safety--compliance)
- [License](#-license)

---

## Overview

**CYNO** is a hospital-grade healthcare platform that leverages **Microsoft Azure AI Services** to provide:

- 🔍 **Intelligent Medical Document OCR** - Dual-layer OCR with Azure AI Document Intelligence
- 🧠 **Multi-Agent Tumor Board Analysis** - AI-powered clinical decision support
- ☁️ **Azure AI Agent Service Orchestration** - Enterprise-grade agent management
- 📊 **Comprehensive Patient Management** - End-to-end healthcare workflow

---

## ☁️ Microsoft Azure Integration

CYNO leverages multiple Microsoft Azure services for enterprise-grade AI capabilities:

### Azure Services Used

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MICROSOFT AZURE AI SERVICES                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │  AZURE AI DOCUMENT          │  │  AZURE AI AGENT SERVICE             │  │
│  │  INTELLIGENCE               │  │                                     │  │
│  │  ─────────────────────────  │  │  ───────────────────────────────    │  │
│  │                             │  │                                     │  │
│  │  • Medical Report OCR       │  │  • Agent Orchestration              │  │
│  │  • Handwriting Recognition  │  │  • Parallel Execution               │  │
│  │  • Table Extraction         │  │  • Governance & Observability       │  │
│  │  • Layout Analysis          │  │  • Failure Handling                 │  │
│  │                             │  │                                     │  │
│  │  Used in: Dual-Layer OCR    │  │  Used in: Tumor Board Pipeline      │  │
│  │  Fallback when PaddleOCR    │  │  Orchestrates 4 medical agents      │  │
│  │  confidence is low          │  │  without performing reasoning       │  │
│  │                             │  │                                     │  │
│  └─────────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Details

| Azure Service | Purpose | Integration Point |
|---------------|---------|-------------------|
| **Azure AI Document Intelligence** | High-accuracy OCR for medical documents | `BACKEND/routers/ocr_llm.py` |
| **Azure AI Agent Service** | Agent orchestration & governance | `BACKEND/routers/azure_agent_orchestrator.py` |

---

## 🏗️ Architecture

### System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              CYNO PLATFORM                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         FRONTEND (Next.js 14)                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │  │
│  │  │ Patient  │  │  Report  │  │    AI    │  │    Tumor Board       │ │  │
│  │  │ Manager  │  │  Upload  │  │ Analysis │  │    Dashboard         │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬────────────┘ │  │
│  └───────┼─────────────┼─────────────┼───────────────────┼──────────────┘  │
│          │             │             │                   │                 │
│          └─────────────┴─────────────┴───────────────────┘                 │
│                                    │                                       │
│                                    ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        BACKEND (FastAPI)                             │  │
│  │                                                                      │  │
│  │  ┌─────────────────────┐  ┌─────────────────────────────────────┐   │  │
│  │  │   OCR Pipeline      │  │      Tumor Board AI Pipeline        │   │  │
│  │  │   ─────────────     │  │      ──────────────────────────     │   │  │
│  │  │                     │  │                                     │   │  │
│  │  │  ┌───────────────┐  │  │  ╔═════════════════════════════╗   │   │  │
│  │  │  │  PaddleOCR    │  │  │  ║  ☁️ AZURE AI AGENT SERVICE  ║   │   │  │
│  │  │  │  (Primary)    │  │  │  ║  (Orchestration Layer)      ║   │   │  │
│  │  │  └───────┬───────┘  │  │  ╚═════════════╦═══════════════╝   │   │  │
│  │  │          │          │  │                ║                   │   │  │
│  │  │          ▼          │  │    ┌───────────╬───────────┐       │   │  │
│  │  │  ┌───────────────┐  │  │    ▼           ▼           ▼       │   │  │
│  │  │  │ Confidence    │  │  │  ┌─────┐   ┌─────┐   ┌─────┐       │   │  │
│  │  │  │ Check < 0.75? │  │  │  │Rad. │   │Path.│   │Clin.│       │   │  │
│  │  │  └───────┬───────┘  │  │  │Agent│   │Agent│   │Agent│       │   │  │
│  │  │          │ Yes      │  │  └──┬──┘   └──┬──┘   └──┬──┘       │   │  │
│  │  │          ▼          │  │     │         │         │          │   │  │
│  │  │  ╔═══════════════╗  │  │     └─────────┴─────────┘          │   │  │
│  │  │  ║ ☁️ AZURE AI   ║  │  │                │                   │   │  │
│  │  │  ║ DOCUMENT      ║  │  │                ▼                   │   │  │
│  │  │  ║ INTELLIGENCE  ║  │  │      ┌─────────────────┐           │   │  │
│  │  │  ║ (Fallback)    ║  │  │      │ Research Agent  │           │   │  │
│  │  │  ╚═══════════════╝  │  │      └────────┬────────┘           │   │  │
│  │  │                     │  │               │                    │   │  │
│  │  └─────────────────────┘  │               ▼                    │   │  │
│  │                           │      ┌─────────────────┐           │   │  │
│  │                           │      │  Coordinator    │           │   │  │
│  │                           │      │  (Local CYNO)   │           │   │  │
│  │                           │      └────────┬────────┘           │   │  │
│  │                           │               │                    │   │  │
│  │                           └───────────────┼────────────────────┘   │  │
│  │                                           │                        │  │
│  │                                           ▼                        │  │
│  │                               ┌─────────────────────┐              │  │
│  │                               │    PostgreSQL       │              │  │
│  │                               │    (via Prisma)     │              │  │
│  │                               └─────────────────────┘              │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Dual-Layer OCR Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DUAL-LAYER OCR SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Medical Document                                                      │
│        │                                                                │
│        ▼                                                                │
│   ┌─────────────────────────────┐                                       │
│   │     PaddleOCR (Primary)     │  ◄── Fast, Local, No API Cost        │
│   │     ─────────────────────   │                                       │
│   │     • Text Extraction       │                                       │
│   │     • Block Detection       │                                       │
│   │     • Confidence Scoring    │                                       │
│   └──────────────┬──────────────┘                                       │
│                  │                                                      │
│                  ▼                                                      │
│   ┌─────────────────────────────┐                                       │
│   │   Confidence Check          │                                       │
│   │   Average Score < 0.75?     │                                       │
│   └──────────────┬──────────────┘                                       │
│                  │                                                      │
│         ┌───────┴───────┐                                               │
│         │               │                                               │
│    Yes (Low)       No (Good)                                            │
│         │               │                                               │
│         ▼               │                                               │
│   ╔═════════════════╗   │                                               │
│   ║ ☁️ AZURE AI     ║   │                                               │
│   ║ DOCUMENT        ║   │                                               │
│   ║ INTELLIGENCE    ║   │  ◄── High Accuracy, Cloud-Based              │
│   ║ ───────────────  ║   │                                               │
│   ║ • prebuilt-read ║   │                                               │
│   ║ • Layout API    ║   │                                               │
│   ║ • Table Extract ║   │                                               │
│   ╚════════╤════════╝   │                                               │
│            │            │                                               │
│            ▼            ▼                                               │
│   ┌─────────────────────────────┐                                       │
│   │    Best Result Selection    │                                       │
│   │    (Higher Confidence Wins) │                                       │
│   └──────────────┬──────────────┘                                       │
│                  │                                                      │
│                  ▼                                                      │
│         Structured Medical Data                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Azure AI Agent Service Orchestration

```
┌─────────────────────────────────────────────────────────────────────────┐
│              AZURE AI AGENT SERVICE ORCHESTRATION                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ╔═══════════════════════════════════════════════════════════════════╗  │
│  ║                 ☁️ AZURE AI AGENT SERVICE                         ║  │
│  ║  ─────────────────────────────────────────────────────────────    ║  │
│  ║                                                                   ║  │
│  ║  RESPONSIBILITIES:             BOUNDARIES (What Azure CANNOT do): ║  │
│  ║  ✓ Trigger agent execution     ✗ Medical reasoning               ║  │
│  ║  ✓ Manage parallel runs        ✗ Diagnosis generation            ║  │
│  ║  ✓ Handle timeouts/retries     ✗ Database access                 ║  │
│  ║  ✓ Track success/failure       ✗ Modify agent outputs            ║  │
│  ║  ✓ Governance logging          ✗ Final synthesis                 ║  │
│  ║                                                                   ║  │
│  ╚═══════════════════════════════════════════════════════════════════╝  │
│                           │                                             │
│     ┌─────────────────────┼─────────────────────┐                       │
│     │                     │                     │                       │
│     ▼                     ▼                     ▼                       │
│  ┌─────────┐        ┌─────────┐          ┌─────────┐                    │
│  │Radiology│        │Pathology│          │Clinical │     PHASE 1:       │
│  │ Agent   │        │ Agent   │          │ Agent   │     PARALLEL       │
│  │(CYNO)   │        │(CYNO)   │          │(CYNO)   │                    │
│  └────┬────┘        └────┬────┘          └────┬────┘                    │
│       │                  │                    │                         │
│       └──────────────────┴────────────────────┘                         │
│                          │                                              │
│                          ▼                                              │
│                   ┌─────────────┐                                       │
│                   │  Research   │                PHASE 2:               │
│                   │   Agent     │                SEQUENTIAL             │
│                   │   (CYNO)    │                                       │
│                   └──────┬──────┘                                       │
│                          │                                              │
│  ────────────────────────┼────────────────────────────────────────────  │
│                          │                                              │
│                          ▼                                              │
│                 ┌────────────────┐                                      │
│                 │  Coordinator   │  ◄── ALWAYS LOCAL (Never in Azure)  │
│                 │    Agent       │                                      │
│                 │    (CYNO)      │      Final synthesis, conflict       │
│                 └────────┬───────┘      resolution, safety checks       │
│                          │                                              │
│                          ▼                                              │
│                  TumorBoardCase                                         │
│                  (Database)                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance Python API framework |
| **Prisma** | Type-safe ORM for PostgreSQL |
| **PaddleOCR** | Primary OCR engine |
| **Azure AI Document Intelligence** | Secondary OCR (fallback) |
| **Azure AI Agent Service** | Agent orchestration |
| **Ollama** | Local LLM inference |

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Icon library |
| **jsPDF** | PDF report generation |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database |
| **Azure Cognitive Services** | AI/ML services |
| **Docker** | Containerization (optional) |

---

## ✨ Features

### 🔍 AI-Powered Medical Document Analysis

- **Dual-Layer OCR**: PaddleOCR primary with Azure AI Document Intelligence fallback
- **Intelligent Extraction**: Automatic identification of patient info, lab values, diagnoses
- **Structured Output**: JSON-formatted medical data ready for analysis

### 🧠 Multi-Agent Tumor Board

- **4 Specialized Agents**:
  - 📡 **Radiology Agent** - Imaging analysis
  - 🔬 **Pathology Agent** - Histopathology/flow cytometry
  - 🏥 **Clinical Agent** - Labs and clinical notes
  - 📚 **Research Agent** - Evidence-based recommendations
- **Local Coordinator**: Synthesizes all agent outputs
- **Azure Orchestration**: Enterprise-grade agent management

### 📊 Patient Management

- Complete patient records management
- Report upload and organization
- AI analysis history
- Activity audit logs

### 🔒 Hospital-Grade Safety

- Medical reasoning stays local (never in Azure)
- Feature-flag controlled integrations
- Partial failure tolerance
- Comprehensive audit logging

---

## 🚀 Installation

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Ollama (for local LLM)

### Backend Setup

```bash
# Navigate to backend
cd BACKEND

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
npx prisma generate
npx prisma db push

# Start server
uvicorn main:app --reload
```

### Frontend Setup

```bash
# Navigate to frontend
cd FRONTEND

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## ⚙️ Configuration

### Environment Variables

Create `BACKEND/.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cyno

# Ollama LLM
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=mistral

# ═══════════════════════════════════════════════════════════════
# MICROSOFT AZURE CONFIGURATION
# ═══════════════════════════════════════════════════════════════

# Azure AI Document Intelligence (OCR)
AZURE_DOC_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOC_INTELLIGENCE_KEY=your-api-key

# OCR Engine Configuration
# Options: paddle | azure | hybrid
# - paddle: PaddleOCR only
# - azure: Azure AI only
# - hybrid: PaddleOCR primary, Azure fallback
OCR_ENGINE=hybrid

# Azure AI Agent Service (Tumor Board Orchestration)
AZURE_AI_AGENT_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_AI_AGENT_KEY=your-api-key
AZURE_AGENT_ORCHESTRATION_ENABLED=true
```

### Azure Service Setup

1. **Create Azure Cognitive Services resource**
2. **Enable Document Intelligence API**
3. **Enable AI Agent Service**
4. **Copy endpoint and key to `.env`**

---

## 📖 API Documentation

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients` | GET/POST | Patient management |
| `/api/reports` | GET/POST | Report management |
| `/api/ai-analysis/analyze` | POST | Trigger AI analysis |
| `/api/tumor-board-ai/{id}/generate` | POST | Generate tumor board |
| `/api/azure-demo/status` | GET | Check Azure status |
| `/api/azure-demo/simulate-orchestration` | POST | Demo orchestration |

### Azure Demo Endpoints

```bash
# Check Azure configuration
curl http://localhost:8000/api/azure-demo/status

# Simulate full orchestration with logs
curl -X POST http://localhost:8000/api/azure-demo/simulate-orchestration

# Test partial failure handling
curl -X POST http://localhost:8000/api/azure-demo/simulate-partial-failure
```

---

## 🔒 Safety & Compliance

### Azure Integration Safety Rules

| Rule | Implementation |
|------|----------------|
| **Orchestration-Only Boundary** | Azure triggers agents, doesn't reason |
| **Medical Reasoning Isolation** | All LLM calls stay in CYNO |
| **Database Protection** | Azure has no DB access |
| **Feature Flag Control** | `AZURE_AGENT_ORCHESTRATION_ENABLED` |
| **Partial Failure Tolerance** | Individual agent failures don't stop pipeline |
| **Safe Fallback** | System works without Azure |

### Data Flow Safety

```
┌────────────────────────────────────────────────────────────────────┐
│                         SAFETY BOUNDARIES                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ☁️ AZURE LAYER (Orchestration Only)                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ✓ Can: Trigger, Monitor, Log, Time                          │  │
│  │ ✗ Cannot: Reason, Diagnose, Write DB, Modify Outputs        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                              ▼                                     │
│  🏥 CYNO LAYER (Medical Logic)                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ✓ All medical reasoning via local LLM                       │  │
│  │ ✓ Coordinator synthesis (always local)                      │  │
│  │ ✓ Database writes                                            │  │
│  │ ✓ Final output generation                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
CYNO MICROSOFT AZURE VERSION/
├── BACKEND/
│   ├── routers/
│   │   ├── ocr_llm.py              # Dual-layer OCR (PaddleOCR + Azure)
│   │   ├── tumor_board_ai.py       # Tumor Board with Azure integration
│   │   ├── azure_agent_orchestrator.py  # Azure AI Agent Service
│   │   ├── azure_demo.py           # Demo endpoints
│   │   └── ...
│   ├── tumor_board_agents/         # Medical AI agents
│   │   ├── radiology_agent.py
│   │   ├── pathology_agent.py
│   │   ├── clinical_agent.py
│   │   ├── research_agent.py
│   │   └── coordinator.py
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   ├── main.py                     # FastAPI application
│   ├── config.py                   # Configuration
│   └── .env                        # Environment variables
│
├── FRONTEND/
│   ├── app/
│   │   ├── hospital/
│   │   │   └── dashboard/          # Dashboard pages
│   │   │       ├── patients/
│   │   │       ├── ai-analysis/
│   │   │       └── tumor-board/
│   │   └── components/             # Reusable components
│   ├── package.json
│   └── tailwind.config.js
│
└── README.md                       # This file
```

---

## 🏆 Microsoft Azure Benefits

| Benefit | Description |
|---------|-------------|
| **Enterprise Scale** | Azure AI services handle production workloads |
| **High Accuracy** | Document Intelligence provides superior OCR for complex documents |
| **Governance** | Agent Service provides audit trails and observability |
| **Reliability** | Azure's 99.9% SLA for critical healthcare operations |
| **Security** | Enterprise-grade security and compliance |
| **Hybrid Ready** | Works with local models + Azure enhancement |

---

## 📜 License

MIT License - See LICENSE file for details.

---

<p align="center">
  <strong>Built with ❤️ for Healthcare</strong><br/>
  <em>Powered by Microsoft Azure AI</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Microsoft%20Azure-Partner-0078D4?style=flat-square" alt="Azure Partner"/>
</p>
