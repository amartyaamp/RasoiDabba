# Smart Kitchen Inventory System &mdash; Project Roadmap & GitHub Setup

This roadmap outlines the complete 4-tier architecture and engineering plan for deploying the **Smart Kitchen Inventory System** into physical kitchen hardware, edge gateway appliances, and cloud services.

Use this document to configure your **GitHub Project Board**, create milestones, define sprint backlogs, and track hardware/software deliverables.

---

## 1. System Tier Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 4: USER INTERFACES                         │
│  - Kitchen Inventory Web/PWA (Port 3000)                               │
│  - SSE Real-time Updates (/api/events)                                 │
│  - Restock Alerts & Automated Grocery Shopping Checklist               │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                               HTTP / SSE
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                  TIER 3: CORE INGRESS & APP SERVICE                    │
│  - POST /api/telemetry (Ingress validation & schema parser)            │
│  - Tare Zero-Calibration Engine (Net = Raw - Tare)                     │
│  - Fill Percentage Math: (Net / Capacity) * 100                        │
│  - Debounced Threshold Alert Engine (<20% warning, <10% critical)      │
│  - Decoupled Network Adapters (REST, Firebase, MQTT)                   │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                  Structured JSON (Wi-Fi / Ethernet)
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                    TIER 2: CENTRAL EDGE GATEWAY                        │
│  - Hardware: Raspberry Pi 4 / Pi Zero 2 W (Kitchen Hub)                │
│  - BLE Scanner Daemon: Bleak (Python Async)                            │
│  - Continuous discovery of smart jar beacons (SmartJar_*)              │
│  - Local SQLite packet buffer for network offline resilience           │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                  BLE 5.0 GATT (Low-Power Local Radio)
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                  TIER 1: SMART CONTAINER SENSOR NODES                  │
│  - Hardware: ESP32 / nRF52 + HX711 24-bit ADC + Strain Load Cell       │
│  - Form Factor: 3D printed puck embedded into base of food jars        │
│  - Power: 3.7V 500mAh LiPo battery (~6-12 months battery life)         │
│  - Firmware: Deep Sleep (ULP, <15µA) with wake on timer / vibration    │
│  - Characteristics: GATT 0xDEF1 (weight_g), 0xDEF2 (battery_mv)        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. GitHub Project Board Configuration

### Recommended GitHub Projects (v2) Setup
- **Template**: Team Planning / Feature Work
- **Recommended Views**:
  1. **Kanban Board** (Grouped by `Status`): Backlog &rarr; Ready for Dev &rarr; In Progress &rarr; Hardware Test &rarr; Done
  2. **Milestone Roadmap** (Timeline view grouped by Milestone)
  3. **Tier Breakdown** (Table view grouped by custom field `Tier`)
  4. **Hardware vs Software** (Filtered view for embedded firmware vs web/backend)

### Custom Fields
| Field Name | Type | Options |
|---|---|---|
| **Tier** | Single Select | `Tier 1: Hardware Node`, `Tier 2: Edge Gateway`, `Tier 3: Ingress Core`, `Tier 4: UI & Alerts` |
| **Component** | Single Select | `ESP32 Firmware`, `HX711 Calibration`, `Bleak Gateway`, `Node Ingress`, `PWA Client` |
| **Priority** | Single Select | `P0 - Blocker`, `P1 - High`, `P2 - Medium`, `P3 - Low` |
| **Hardware Required** | Single Select | `Yes (ESP32/HX711/Pi)`, `No (Simulation / Mock)` |
| **Target Milestone** | Milestone | `v0.1 - MVP Ingress`, `v0.2 - ESP32 Firmware`, `v0.3 - Pi Gateway`, `v0.4 - Full Kitchen Integration` |

---

## 3. Milestones & Issue Breakdown

### Milestone 1: Tier 3 &mdash; Core Ingress & App Service (Status: COMPLETED)
- [x] **#1 Core Ingress API**: Build `POST /api/telemetry` schema validator and ingress handler.
- [x] **#2 Tare Zero-Calibration Engine**: Implement `POST /api/containers/:id/tare` to isolate food net weight from physical jar tare.
- [x] **#3 Real-time Event Streaming**: Implement Server-Sent Events (SSE) `/api/events` for instant browser push without polling.
- [x] **#4 Threshold & Notification Engine**: Automatic warning triggers at 20% and critical alerts at 10%, generating formatted grocery restock checklists.
- [x] **#5 Pluggable Network Adapters**: Decouple transport logic so edge hubs can switch between REST, Firebase, and MQTT.

### Milestone 2: Tier 1 &mdash; Hardware Sensor Puck & ESP32 Firmware
- [ ] **#6 Load Cell & HX711 Circuitry**:
  - Integrate 1kg/5kg micro strain-gauge load cell with HX711 24-bit ADC amplifier.
  - Test calibration factor equation: `scale.set_scale(CALIBRATION_FACTOR)`.
- [ ] **#7 BLE GATT Peripheral Server**:
  - Implement custom BLE Service UUID `12345678-1234-5678-1234-56789abcdef0`.
  - Expose Characteristic `0xDEF1` (`uint16_t` weight in grams, Read/Notify).
  - Expose Characteristic `0xDEF2` (`uint16_t` battery in millivolts, Read).
  - Expose Characteristic `0xDEF3` (`uint8_t` command opcode for tare / LED blink).
- [ ] **#8 Ultra-Low Power (ULP) Optimization**:
  - Configure ESP32 deep sleep state drawing $<15\mu\text{A}$.
  - Add periodic wake timer (e.g. 60-120 seconds) and tilt/vibration interrupt (SW-420 or MPU6050) to wake immediately on jar handling.
- [ ] **#9 3D Printed Jar Base Enclosure**:
  - Design compact circular base puck housing 500mAh LiPo, TP4056 USB-C charging module, HX711 board, and ESP32-C3/S3 mini.

### Milestone 3: Tier 2 &mdash; Central Kitchen Edge Gateway (Raspberry Pi)
- [ ] **#10 Async BLE Discovery Service**:
  - Python daemon with `bleak` scanning for devices advertising prefix `SmartJar_*`.
  - Non-blocking connection and GATT read handling.
- [ ] **#11 Packet Framing & Ingress Dispatch**:
  - Parse raw little-endian bytes from GATT characteristics into structured JSON payload.
  - Implement `RestNetworkAdapter` dispatching `POST /api/telemetry` to Core Service.
- [ ] **#12 Local Offline Persistence**:
  - SQLite/buffer queue to store telemetry frames when home Wi-Fi is temporarily disconnected.
  - Automatic flush upon connection restoration.
- [ ] **#13 Alternative Adapters (MQTT & Firebase)**:
  - Add Mosquitto MQTT publisher for Home Assistant dashboard integration.
  - Add Firebase Firestore client for direct cloud synchronization without a local server.

### Milestone 4: Tier 4 &mdash; Production PWA & Kitchen Tablet Integration
- [ ] **#14 Kitchen Kiosk Display Mode**:
  - Responsive full-screen tablet dashboard optimized for mounted kitchen iPad or Raspberry Pi touchscreen.
  - High-contrast visual fill gauges and quick-tap pour buttons.
- [ ] **#15 Web Push Notifications**:
  - Integrate Web Push API with VAPID keys for system notifications when coffee, rice, or spices drop below threshold.
- [ ] **#16 One-Click Grocery Export**:
  - Export restock checklist directly to Google Keep, Todoist, Apple Reminders, or clipboard markdown.

---

## 4. Hardware Reference & Pinout Guide

### ESP32 to HX711 Wiring
| HX711 Pin | ESP32 GPIO | Description |
|---|---|---|
| **VCC** | 3.3V | Power supply |
| **GND** | GND | Ground |
| **DT (Data)** | GPIO 16 | HX711 24-bit serial data out |
| **SCK (Clock)**| GPIO 4 | HX711 serial clock input |

### Load Cell 4-Wire Color Code
| Load Cell Wire | HX711 Connection | Signal |
|---|---|---|
| **Red** | E+ | Excitation Positive |
| **Black**| E- | Excitation Negative |
| **White**| A- | Signal Negative |
| **Green**| A+ | Signal Positive |

### Tare Calibration Formula
$$\text{Weight (grams)} = \frac{\text{Raw ADC Reading} - \text{Zero Offset}}{\text{Calibration Factor}}$$
```cpp
// Calibration code snippet
scale.tare(); // Zero the scale with empty platter
Serial.println("Place known 500g weight...");
// Read raw and compute:
float factor = scale.get_value(10) / 500.0;
scale.set_scale(factor);
```

---

## 5. Bleak Gateway Reference Implementation (`gateway/hub_daemon.py`)

```python
import asyncio
import json
import requests
from bleak import BleakScanner, BleakClient

SERVICE_UUID      = "12345678-1234-5678-1234-56789abcdef0"
CHAR_WEIGHT_UUID  = "12345678-1234-5678-1234-56789abcdef1"
CHAR_BATTERY_UUID = "12345678-1234-5678-1234-56789abcdef2"
INGRESS_ENDPOINT  = "http://localhost:3000/api/telemetry"

async def process_jar(device):
    print(f"Connecting to {device.name} [{device.address}]...")
    try:
        async with BleakClient(device.address, timeout=10.0) as client:
            weight_bytes = await client.read_gatt_char(CHAR_WEIGHT_UUID)
            battery_bytes = await client.read_gatt_char(CHAR_BATTERY_UUID)
            
            raw_weight_g = int.from_bytes(weight_bytes, byteorder="little")
            battery_mv = int.from_bytes(battery_bytes, byteorder="little")
            battery_v = round(battery_mv / 1000.0, 2)
            
            payload = {
                "container_id": device.name.lower().replace("smartjar_", "jar_"),
                "raw_weight_g": raw_weight_g,
                "battery_v": battery_v,
                "rssi": device.rssi,
                "timestamp": int(asyncio.get_event_loop().time() * 1000)
            }
            
            response = requests.post(INGRESS_ENDPOINT, json=payload, timeout=5)
            print(f"Dispatched {payload['container_id']}: {response.status_code}")
    except Exception as exc:
        print(f"Error processing {device.name}: {exc}")

async def run_gateway_loop():
    print("Kitchen Edge Gateway listening for Smart Jars...")
    while True:
        devices = await BleakScanner.discover(timeout=5.0)
        jar_devices = [d for d in devices if d.name and d.name.startswith("SmartJar_")]
        for jar in jar_devices:
            await process_jar(jar)
        await asyncio.sleep(15)

if __name__ == "__main__":
    asyncio.run(run_gateway_loop())
```
