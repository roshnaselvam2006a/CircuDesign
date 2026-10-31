<div align="center">

# ♻️ CircuDesign

### **AI-Powered CAD & BOM Circular Economy Redesign Platform**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_%2F_3.0-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://ai.google.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.185-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<br />

<img src="./assets/hero-banner.png" alt="CircuDesign Dashboard & CAD 3D Multi-Agent Platform" width="100%" style="border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.4);" />

<br />
<br />

**CircuDesign** is an intelligent, multi-agent AI engineering workbench designed to transform traditional hardware product development. By combining **3D CAD STEP file parsing**, **Retrieval-Augmented Generation (RAG) material science intelligence**, and **multi-constraint structural validation**, CircuDesign enables engineering teams to autonomously audit, optimize, and redesign products for the **circular economy**—drastically reducing carbon footprints without compromising structural integrity.

### [🚀 Try the Live Demo](https://circudesign-into.onrender.com/)

</div>

---

## 🌟 Key Features

- **🤖 5-Agent Autonomous Orchestration Engine**:
  - **BOM Deconstructor Agent**: Parses structural hardware assemblies, categorizing fasteners, enclosures, PCBs, and thermal elements.
  - **Material Science RAG Agent**: Searches curated material databases and bio-based material alternatives to substitute high-emission plastics/metals with sustainable options.
  - **Structural Integrity Agent**: Validates proposed material swaps against required yield strengths and safety factor margins (MPa).
  - **Circular Lifecycle Agent**: Evaluates disassembly times, end-of-life recovery pathways, toxicity index reduction, and net CO₂ savings.
  - **Multi-Constraint Orchestrator**: Coordinates iterative agent loops balancing sustainability, mechanical strength, cost multiplier, and supply chain readiness.

- **📐 Interactive 3D CAD STEP/IGES Viewer**:
  - Powered by WebAssembly (`occt-import-js`) and Three.js / React Three Fiber.
  - Interactive exploded views, individual part highlighting, volume estimation, and real-time mesh rendering directly in the browser.

- **🛡️ Human-in-the-Loop (HITL) Safety Gate**:
  - Automatically flags high-risk material substitutions (e.g., tensile strength drops > 15%) for engineer review and manual override.

- **📊 Comprehensive Eco-Analytics Dashboard**:
  - Real-time carbon reduction KPIs ($kg CO_2 / kg$).
  - Circular economy radar charts (Disassembly Score, Recyclability Index, Toxicity Reduction).
  - One-click PDF/CSV report exports for sustainability compliance and EPD audits.

---

## 🏗️ Multi-Agent Architecture Workflow

```mermaid
flowchart TD
    A[📁 Upload CAD STEP / BOM Data] --> B[🧩 BOM Deconstructor Agent]
    B --> C[🧪 Material Science RAG Agent]
    C --> D[⚙️ Structural Integrity Agent]
    
    D -- ⚠️ Safety Margin Failure --> C
    D -- ✅ Mechanical Pass --> E[♻️ Circular Lifecycle Agent]
    
    E --> F[🎯 Multi-Constraint Orchestrator]
    F -- Flagged High Risk Swap --> G[👤 Human Engineer Review Gate]
    F -- Auto Approved --> H[📊 Circular Redesign Dashboard & Report]
    G -- Approved / Modified --> H
```

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons, Recharts, Motion (Framer) |
| **3D Engine** | Three.js, React Three Fiber, `@react-three/drei`, WebAssembly (`occt-import-js`) |
| **AI & RAG** | Google Gemini API (`@google/genai`), Material Dataset Matching, Vector / CSV RAG |
| **Backend & Server** | Node.js, Express, `tsx` server runner |
| **Cloud & Auth** | Firebase Auth & Firestore |

---

## 🚀 Quick Start Guide

### 📋 Prerequisites

- **Node.js**: `v18.x` or higher
- **npm** or **bun**: Package manager
- **Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

---

### 📥 1. Install Dependencies

```bash
# Install dependencies
npm install
```

---

### 🔑 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Gemini API Key (Required for Multi-Agent RAG Engine)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration (Optional for Cloud Persistence)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

### 🏃 3. Run Development Server

```bash
npm run dev
```

The application and Express backend will launch at **`http://localhost:3000`**.

---

### 📦 4. Build for Production

```bash
# Build Vite client & bundle Express server
npm run build

# Start production server
npm start
```

---

## 📂 Project Structure

```
CircuDesign/
├── assets/
│   └── hero-banner.png         # High-resolution README banner image
├── src/
│   ├── cad/                    # STEP parser & Three.js 3D viewport canvas
│   ├── components/             # Dashboard, Agent Logs, HITL Gate, Metrics Charts
│   ├── context/                # Auth & App State providers
│   ├── data/                   # Material dataset CSV & RAG datasets
│   ├── lib/                    # Gemini API & Firebase integrations
│   ├── server/                 # Express backend API endpoints
│   ├── types.ts                # TypeScript type definitions for BOM, Agents & CAD
│   └── App.tsx                 # Core layout & tab routing
├── materials_dataset.csv       # Curated eco-materials database
├── server.ts                   # Express server entry point
├── package.json
└── README.md
```

---

## 📡 API Endpoints

- **`GET /api/health`**: Healthcheck endpoint returning server status & Gemini connection state.
- **`POST /api/analyze-bom`**: Initiates multi-agent BOM deconstruction and material RAG pipeline.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for more details.

---

<div align="center">

Made with ❤️ for Sustainable Engineering & Circular Economy Innovation.

</div>
