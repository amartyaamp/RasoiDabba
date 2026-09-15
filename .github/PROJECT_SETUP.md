# GitHub Project Setup Guide &mdash; Smart Kitchen Inventory

This guide provides instructions for setting up the **GitHub Projects (v2)** board, issue templates, milestones, and CI automation for the Smart Kitchen Inventory repository.

---

## 1. Create the GitHub Project

1. Go to your repository or organization on GitHub.
2. Click **Projects** &rarr; **New project** &rarr; Select **Board** or **Feature Work** template.
3. Name the project: **Smart Kitchen Inventory System**.
4. Set description: *Multi-tier IoT kitchen inventory tracking across ESP32 BLE load cell nodes, Raspberry Pi Edge Hub, and Web/PWA client.*

---

## 2. Configure Custom Fields

In your Project Settings (&bull;&bull;&bull; &rarr; **Settings** &rarr; **Custom fields**), add the following fields:

### Field 1: `Tier` (Single Select)
- 🟣 `Tier 1: Hardware Node (ESP32)`
- 🔵 `Tier 2: Edge Gateway (Pi Hub)`
- 🟢 `Tier 3: Ingress Core (Express/API)`
- 🟡 `Tier 4: Client & Alerts (React/PWA)`

### Field 2: `Hardware Dependency` (Single Select)
- 🔴 `Physical Hardware Required` (Needs ESP32, HX711, or Raspberry Pi)
- 🟢 `Software Simulator Compatible` (Can be tested via web simulator / curl)

### Field 3: `Priority` (Single Select)
- 🚨 `P0 - Blocker`
- ⚡ `P1 - High`
- 🔹 `P2 - Medium`
- ☕ `P3 - Low`

---

## 3. Recommended Project Views

1. **Kanban Board** (Default view):
   - Columns: `Backlog` &rarr; `Ready for Dev` &rarr; `In Progress` &rarr; `Hardware Test / Staging` &rarr; `Done`
   - Card content: Show `Tier`, `Priority`, and `Assignees`.

2. **Milestone Timeline / Roadmap View**:
   - Layout: **Roadmap**
   - Group by: `Milestone`
   - Date fields: Start Date &rarr; Target Date.

3. **Subsystem Matrix**:
   - Layout: **Table**
   - Group by: `Tier`
   - Sort by: `Priority` ascending.

---

## 4. GitHub Issue Labels

Create these labels in **Repository Settings** &rarr; **Labels**:

| Label | Color | Description |
|---|---|---|
| `tier:hardware` | `#7057ff` | ESP32, HX711, strain gauges, battery circuitry, 3D printing |
| `tier:gateway` | `#0075ca` | Raspberry Pi, Bleak BLE scanner daemon, SQLite buffer |
| `tier:backend` | `#008672` | Express API, SSE stream, tare engine, alert dispatch |
| `tier:frontend` | `#e4e669` | React components, gauges, pour simulation, PWA |
| `hardware-blocker`| `#d73a4a` | Requires physical bench testing on hardware bench |
| `simulator-ready` | `#a2eeef` | Can be verified in software stub simulator |

---

## 5. Repository Directory Layout (Monorepo Blueprint)

```
smart-kitchen-inventory/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── 01_hardware_node.md
│   │   ├── 02_gateway_daemon.md
│   │   └── 03_software_feature.md
│   ├── workflows/
│   │   └── ci.yml
│   └── PROJECT_SETUP.md
├── firmware/
│   ├── esp32_loadcell_node/
│   │   ├── platformio.ini
│   │   └── src/main.cpp
├── gateway/
│   ├── hub_daemon.py
│   ├── requirements.txt
│   └── systemd/kitchen-hub.service
├── server.ts
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── InventoryView.tsx
│   │   ├── NodeSimulator.tsx
│   │   ├── EndpointTester.tsx
│   │   └── AlertsView.tsx
│   └── types.ts
├── PROJECT_ROADMAP.md
└── package.json
```
