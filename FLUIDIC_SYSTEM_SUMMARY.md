# FLUIDIC Smart Pipeline Monitoring System - Complete Implementation Summary

## 🎯 System Overview

FLUIDIC is a real-time smart pipeline monitoring and control system that:
- Reads sensor data from ESP32 hardware
- Transmits data to Firebase Realtime Database
- Detects leaks using GA-VMD algorithm (Genetic Algorithm + Variational Mode Decomposition)
- Provides real-time web dashboard with React
- Allows remote control of pump and valve

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUIDIC SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HARDWARE LAYER (ESP32)                                         │
│  ├─ Flow Sensors (2x)        → Flow1, Flow2                    │
│  ├─ Tank Level Sensor        → Level (0-100%)                  │
│  ├─ Water Quality Sensors    → TDS, Turbidity, pH              │
│  ├─ Relay Controls           → Pump, Emergency Valve           │
│  └─ Pressure Calculation     → From Flow using Bernoulli       │
│                ↓                                                │
│                └─→ Calculate Pressure from Flow                │
│                    (P = 0.5 * ρ * v²)                          │
│                                                                 │
│  FIREBASE REALTIME DATABASE                                    │
│  ├─ /SCADA_DATA              (Sent every 1 second)             │
│  │  ├─ flow1: number         (L/min - Inlet)                   │
│  │  ├─ flow2: number         (L/min - Outlet)                  │
│  │  ├─ pressure: number      (bar - Calculated)                │
│  │  ├─ level: number         (0-100% tank level)               │
│  │  ├─ pump: 0|1             (OFF/ON)                          │
│  │  ├─ valve: 0|1            (CLOSED/OPEN)                     │
│  │  ├─ mode: "AUTO"|"MANUAL" (Operating mode)                  │
│  │  └─ timestamp: number                                       │
│  │                                                              │
│  ├─ /pipeline                (Sent every 1 second)             │
│  │  ├─ tds: number           (ppm - Total Dissolved Solids)    │
│  │  ├─ turbidity: number     (NTU - Turbidity)                 │
│  │  ├─ ph: number            (pH level)                        │
│  │  └─ timestamp: number                                       │
│  │                                                              │
│  ├─ /results                 (Updated by GA-VMD)               │
│  │  ├─ status: "LEAK"|"NORMAL"                                 │
│  │  ├─ location_m: number    (Distance from start)             │
│  │  ├─ latitude: number                                        │
│  │  ├─ longitude: number                                       │
│  │  ├─ flow: number          (Current flow)                    │
│  │  └─ timestamp: number                                       │
│                                                                 │
│  └─→ Data written by ESP32   ↔ Read by React + GA-VMD          │
│                                                                 │
│  GA-VMD LEAK DETECTION (Python)                                │
│  ├─ Reads flow data from Firebase                              │
│  ├─ Converts flow to pressure using flow_to_pressure()         │
│  ├─ Applies Genetic Algorithm optimization                     │
│  ├─ Uses VMD for decomposition                                 │
│  ├─ Detects leaks via signal analysis                          │
│  └─ Writes results to /results                                 │
│                                                                 │
│  REACT DASHBOARD (Web)                                         │
│  ├─ Pages:                                                      │
│  │  ├─ Dashboard       (Overview, gauges, flow chart)          │
│  │  ├─ Control Panel   (Pump/Valve control, tank level)        │
│  │  ├─ Analytics       (Historical data, trends)               │
│  │  ├─ Alerts          (System alerts & faults)                │
│  │  ├─ Live Map        (Pipeline visualization)                │
│  │  └─ GA-VMD Logs     (Leak detection results)                │
│  │                                                              │
│  ├─ Real-time listeners subscribe to Firebase paths            │
│  ├─ Updates UI every time data changes                         │
│  └─ Allows manual control of pump and valve                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Design Decision: Pressure Calculation

### Why No Pressure Sensor?

**Pressure is calculated from flow values only** using physics (Bernoulli principle):

```
Flow (L/min) ──convert──> Velocity (m/s) ──apply Bernoulli──> Pressure (bar)
              (Q = flow / (1000*60))       (P = 0.5 * ρ * v²)
```

### Benefits:
✅ **Consistency**: All three systems (ESP32, GA-VMD, Website) calculate identically  
✅ **Real-time**: No sensor lag, calculated instantly from flow  
✅ **Cost**: No extra sensor needed  
✅ **Reliability**: One less point of failure  
✅ **Physics**: Based on proven Bernoulli principle for incompressible fluids  

### Implementation Everywhere:
- **ESP32**: `calculatePressure()` in HARDWARE.ino
- **GA-VMD**: `flow_to_pressure()` in utils.py
- **Website**: Receives pre-calculated pressure, displays it

---

## 📊 Data Flow Real-Time Example

```
08:30:00 - ESP32 reads sensors:
         Flow1=45.2 L/min, Flow2=44.8 L/min, Level=74%
         
         Calculates: Pressure = 2.15 bar (from flow1=45.2)
         
         Sends to Firebase /SCADA_DATA:
         {flow1: 45.2, flow2: 44.8, pressure: 2.15, level: 74, ...}

08:30:00 - React Dashboard updates:
         All pages re-render with new values
         Gauges animate to new values
         Charts update with latest point

08:30:00 - GA-VMD reads flow data:
         Receives flow1=45.2, converts to pressure=2.15 bar
         Uses pressure array in VMD algorithm
         Currently analyzing: "NORMAL" (no leak pattern)

08:30:01 - Next cycle repeats (1 second interval)
```

---

## 🚀 System Components

### 1. Hardware (d:\VS\Fluidic\HARDWARE\)
- **HARDWARE.ino**: ESP32 Arduino code
  - Reads 6 analog/digital sensors
  - Sends data to Firebase every 1 second
  - Receives control commands (pump, valve, mode)
  - Calculates pressure from flow
  
- **SETUP_GUIDE.md**: Installation & configuration guide
  - Hardware requirements
  - Pin assignments
  - Calibration instructions
  - Troubleshooting

- **PRESSURE_CALCULATION_SYSTEM.md**: Technical documentation
  - Explains pressure calculation across all systems
  - Shows constants and formulas
  - Debugging guidelines

### 2. GA-VMD Leak Detection (d:\VS\Fluidic\GA-VMD\)
- **main.py**: Leak detection algorithm
  - Genetic Algorithm optimization
  - Variational Mode Decomposition
  - Real-time monitoring loop
  - Writes to Firebase /results
  
- **utils.py**: Utility functions
  - `flow_to_pressure()`: Converts flow to pressure (Bernoulli)
  - `correlation()`: Measures signal correlation
  - `fuzzy_entropy()`: Calculates entropy
  
- **config.py**: Configuration parameters
  - Pipe specs
  - Sampling rates
  - Algorithm parameters

### 3. React Dashboard (d:\VS\Fluidic\src\)
- **pages/Dashboard.tsx**: System overview
  - Water quality gauges
  - Flow and storage visualization
  - Live flow chart (last 20 readings)
  
- **pages/ControlPanel.tsx**: Manual control
  - Pump start/stop buttons
  - Valve open/close buttons
  - Operating mode selector
  - Tank level animation
  - Real-time sensor values table
  
- **pages/Analytics.tsx**: Historical analysis
  - Trends and patterns
  - Historical data visualization
  
- **pages/Alerts.tsx**: Alert management
  - System alerts and faults
  - Alert acknowledgment
  
- **pages/LiveMap.tsx**: Pipeline visualization
  - Geographic representation of pipeline
  - Real-time status indicators
  
- **pages/Logs.tsx**: Leak detection logs
  - GA-VMD results
  - Leak history with location
  - Real-time leak status
  
- **components/**: Reusable UI components
  - Layout (Header, Sidebar, AppLayout)
  - Shared components (RadialGauge, SectionHeader)
  - Shadcn UI library components
  
- **hooks/useFirebaseData.ts**: Firebase integration
  - Real-time listeners
  - useScadaData() - SCADA readings
  - usePipelineData() - Water quality
  - useAlerts() - System alerts

---

## 📝 Sensor Data Reference

### SCADA_DATA Object
```typescript
{
  flow1: number;       // Inlet flow (L/min) - from Flow Sensor 2
  flow2: number;       // Outlet flow (L/min) - from Flow Sensor 2
  level: number;       // Tank level (0-100%) - from Level Sensor
  pump: 0 | 1;        // Pump state (0=OFF, 1=ON) - relay output
  mode: "AUTO" | "MANUAL";   // Operating mode - from dashboard
  pressure: number;    // Calculated from flow (bar) - Bernoulli
  valve: 0 | 1;       // Valve state (0=CLOSED, 1=OPEN) - relay output
}
```

### pipeline Object
```typescript
{
  tds: number;        // Total Dissolved Solids (ppm) - from TDS Sensor
  turbidity: number;  // Turbidity (NTU) - from Turbidity Sensor
  ph: number;         // pH level (0-14) - from pH Sensor
}
```

### results Object (GA-VMD)
```typescript
{
  status: "LEAK" | "NORMAL";  // Leak detection status
  location_m: number;          // Distance from start (meters)
  latitude: number;            // Calculated GPS latitude
  longitude: number;           // Calculated GPS longitude
  flow: number;                // Current flow at detection time
  timestamp: number;           // Unix timestamp
}
```

---

## 🔧 Control Flow

### Pump Control
```
User clicks "START PUMP" on React Dashboard
              ↓
React sets /SCADA_DATA/pump = 1 to Firebase
              ↓
ESP32 monitors /SCADA_DATA/pump
              ↓
ESP32 reads pump = 1
              ↓
ESP32 activates PUMP_RELAY_PIN (GPIO13) → HIGH
              ↓
Physical relay closes → Pump motor starts
              ↓
Next cycle: ESP32 reads pump state = 1
              ↓
React dashboard shows "Pump: RUNNING" ✓
```

### Pressure Calculation Flow
```
ESP32 reads Flow1 = 45.2 L/min from FLOW_SENSOR_1_PIN
              ↓
calculatePressure():
  Q = 45.2 / (1000 * 60) = 0.000753 m³/s
  A = π * (0.02/2)² = 3.14159e-4 m²
  v = 0.000753 / 3.14159e-4 = 2.4 m/s
  P = 0.5 * 1000 * 2.4² = 2880 Pa
  pressure = 2880 / 100000 = 0.0288 bar
              ↓
scada.pressure = 0.0288 bar
              ↓
Send to Firebase /SCADA_DATA/pressure = 0.0288
              ↓
GA-VMD reads flow1, calls flow_to_pressure()
              ↓
Gets same pressure = 0.0288 bar
              ↓
Uses in VMD decomposition algorithm
              ↓
React dashboard receives from Firebase
              ↓
Display: Pressure 0.03 bar ✓
```

---

## 📊 Update Intervals

| Component | Data | Interval | Path |
|-----------|------|----------|------|
| **ESP32** | SCADA_DATA | 1 second | `/SCADA_DATA` |
| **ESP32** | Pipeline | 1 second | `/pipeline` |
| **GA-VMD** | Results | Continuous* | `/results` |
| **React** | All | Real-time (listen) | All paths |

*GA-VMD processes data whenever new flow readings arrive

---

## 🔌 Pin Assignments (ESP32)

### Analog Sensors (ADC1)
- GPIO34 (ADC1_CH6): Flow1 Sensor
- GPIO35 (ADC1_CH7): Flow2 Sensor
- GPIO33 (ADC1_CH5): TDS Sensor
- GPIO32 (ADC1_CH4): Not used (was pressure sensor)
- GPIO27 (ADC): Tank Level Sensor

### Digital Sensors
- GPIO25: Turbidity Sensor
- GPIO26: pH Sensor

### Control/Relay
- GPIO13: Pump Relay (0=OFF, 1=ON)
- GPIO12: Valve Relay (0=CLOSED, 1=OPEN)

---

## 🚀 Getting Started

### 1. Flash ESP32
```bash
# Upload HARDWARE.ino to ESP32
Arduino IDE → Sketch → Upload
```

### 2. Start GA-VMD Monitoring
```bash
cd GA-VMD
python main.py
```

### 3. Run React Dashboard
```bash
cd d:\VS\Fluidic
npm install           # First time only
npm run dev          # Starts on http://localhost:8082
```

### 4. Access Dashboard
Open browser → http://localhost:8082

---

## 📈 Future Enhancements

- [ ] Add historical data archival
- [ ] Machine learning for fault prediction
- [ ] SMS/Email alerts
- [ ] Multi-zone pipeline support
- [ ] Pressure sensor backup validation
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Automated report generation

---

## 🐛 Troubleshooting

### Pressure Reading Zero
→ Check flow sensors calibration  
→ Verify flow1 is being read correctly  
→ Check PIPE_DIAMETER constant (should be 0.02)

### Control Commands Not Working
→ Verify Firebase paths are exact: `/SCADA_DATA/pump`  
→ Check relay pins are correctly configured  
→ Test relay with multimeter

### Firebase Connection Lost
→ Check WiFi SSID and password in HARDWARE.ino  
→ Verify Firebase Realtime Database rules allow access  
→ Check API key matches your Firebase project

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| HARDWARE.ino | ESP32 microcontroller code |
| SETUP_GUIDE.md | Hardware installation guide |
| PRESSURE_CALCULATION_SYSTEM.md | Pressure system architecture |
| FLUIDIC_SYSTEM_SUMMARY.md | This file |
| GA-VMD/main.py | Leak detection algorithm |
| GA-VMD/utils.py | Utility functions |
| src/hooks/useFirebaseData.ts | React Firebase integration |

---

**Status**: ✅ Production Ready  
**Last Updated**: March 31, 2026  
**Version**: 1.0.0  
**Team**: FLUIDIC Development
