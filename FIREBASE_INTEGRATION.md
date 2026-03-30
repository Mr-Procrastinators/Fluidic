# FLUIDIC - Firebase Integration Guide

## Overview

FLUIDIC is a Smart Pipeline Monitoring system with real-time two-way Firebase integration. The system includes:
- **Hardware**: ESP32 microcontroller (to be implemented)
- **Backend Logic**: GA-VMD algorithm for leak detection
- **Frontend**: React dashboard with real-time sync

---

## Firebase Structure

The application uses Firebase Realtime Database with the following structure:

```
https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com/
├── SCADA_DATA
│   ├── flow1: number (L/min)
│   ├── flow2: number (L/min)
│   ├── level: number (%)
│   ├── pump: number (0=OFF, 1=ON)
│   ├── valve: number (0=CLOSED, 1=OPEN)
│   ├── mode: string ("AUTO" | "MANUAL")
│   └── pressure: number (bar)
│
├── pipeline
│   ├── tds: number (ppm)
│   ├── turbidity: number (NTU)
│   ├── ph: number
│   └── flow: number (L/min for GA-VMD)
│
├── results (GA-VMD Output)
│   ├── status: string ("LEAK" | "NORMAL")
│   ├── location_m: number (distance in meters)
│   ├── latitude: number
│   ├── longitude: number
│   ├── flow: number (L/min)
│   └── timestamp: number (Unix timestamp)
│
└── alerts
    └── [] array of alert objects
```

---

## Two-Way Connection Flow

### 1. Data Flow: Hardware → Firebase → Dashboard

```
ESP32 Sensors (Water Tank)
    ↓
    └─→ Measures: flow1, flow2, level, pressure, pump status, valve status
         │
    ↓ (WiFi/MQTT)
         │
Firebase SCADA_DATA & pipeline nodes
    ↓
    └─→ Real-time listeners on React pages
         │
        ✓ Dashboard: displays all metrics
        ✓ Analytics: tracks trends
        ✓ Control Panel: shows sensor values
        ✓ Logs: shows GA-VMD results

```

### 2. Command Flow: Dashboard → Firebase → Hardware

```
React Dashboard (Control Panel)
          ↓
    User clicks "Start Pump" or "Open Valve"
          ↓
    Updates Firebase:
    - Set pump = 1 or 0
    - Set valve = 1 or 0
    - Set mode = "AUTO" or "MANUAL"
          ↓ (Firebase listener)
          ↓
    ESP32 reads Firebase
          ↓
    Executes command:
    - Activate pump relay
    - Control solenoid valve
          ↓
    Sends feedback back to Firebase
          ↓
    Dashboard updates in real-time
```

---

## GA-VMD Algorithm Integration

### Location: `/GA-VMD/main.py`

The GA-VMD (Genetic Algorithm + Variational Mode Decomposition) algorithm:

1. **Collects** flow data from Firebase (`/pipeline/flow`)
2. **Processes** data through Genetic Algorithm to optimize parameters
3. **Analyzes** signal using Variational Mode Decomposition
4. **Detects** leaks based on signal deviation
5. **Calculates** leak location using time-delay analysis
6. **Sends** results back to Firebase (`/results`)

### Running GA-VMD

```bash
cd GA-VMD
python main.py
```

The algorithm will:
- Wait for 100 flow measurements
- Train GA model (~10 generations)
- Start real-time monitoring loop
- Update Firebase `/results` every second with:
  - Leak status (LEAK/NORMAL)
  - Estimated distance from source
  - GPS coordinates
  - Flow value
  - Timestamp

### Hardware Requirements (Future)

The GA-VMD script expects `WAVE_SPEED` and `PIPE_LENGTH` constants from flow data. These should be configured in `GA-VMD/config.py`.

---

## React Dashboard Pages

### 1. **Dashboard** (`/`)
- Real-time system overview
- Status lights for all nodes
- Key metrics display
- Synced from: `SCADA_DATA`, `pipeline`

### 2. **Analytics** (`/analytics`)
- Trend analysis
- Historical data
- Performance metrics
- Synced from: `SCADA_DATA`

### 3. **Alerts & Faults** (`/alerts`)
- Alert history
- Fault detection
- Critical events
- Synced from: `alerts` node

### 4. **Live Map** (`/map`)
- 7 sensor locations (Dehradun region)
- Real-time GPS tracking
- Leak indication markers
- **NOTE**: Currently uses mock Leaflet map, will integrate with GA-VMD coordinates
- Synced from: `SCADA_DATA`, `pipeline`

### 5. **Control Panel** (`/control`)
- Pump start/stop controls
- Valve open/close controls
- Manual/Auto mode toggle
- Real-time sensor readouts
- **Two-way**: Sends commands to `SCADA_DATA` node
- Receives feedback from sensors

### 6. **GA-VMD Logs** (`/logs`)
- Real-time leak detection results
- Analysis metrics
- Detection history (last 100 events)
- Location data
- **Synced from**: `/results` (GA-VMD output)

---

## Firebase Security Rules (To Be Implemented)

```json
{
  "rules": {
    "SCADA_DATA": {
      ".read": true,
      ".write": "auth != null || root.child('public').val() === true",
      "$field": {
        ".validate": "newData.isNumber()"
      }
    },
    "pipeline": {
      ".read": true,
      ".write": "auth != null"
    },
    "results": {
      ".read": true,
      ".write": "root.child('ga-service').child('token').val() === auth.token.uid"
    },
    "alerts": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

---

## Component Sync Architecture

All pages use React hooks that listen to Firebase updates:

```typescript
// Every page uses these hooks:
const scada = useScadaData();        // SCADA_DATA branch
const pipeline = usePipelineData();  // pipeline branch
const alerts = useAlerts();          // alerts branch

// Updates are automatic via Firebase onValue listeners
// When any device updates Firebase, all pages update simultaneously
```

---

## ESP32 Hardware Setup (Future)

### Required Sensors
- Flow sensors (x2) - measures flow rate
- Pressure sensor - measures water pressure
- Level sensor - measures tank level
- Arduino IDE or PlatformIO for programming

### Data to Send to Firebase
```cpp
// Pseudo-code for ESP32
void updateFirebase() {
  firebaseData.setDouble("/SCADA_DATA/flow1", flowSensor1.read());
  firebaseData.setDouble("/SCADA_DATA/flow2", flowSensor2.read());
  firebaseData.setInt("/SCADA_DATA/level", levelSensor.read());
  firebaseData.setDouble("/SCADA_DATA/pressure", pressureSensor.read());
  firebaseData.setInt("/SCADA_DATA/pump", pumpRelay.state());
  firebaseData.setInt("/SCADA_DATA/valve", solenoidValve.state());
  firebaseData.setString("/SCADA_DATA/mode", currentMode);
}

// Commands to Read from Firebase
void handleCommands() {
  // Check for pump command
  firebaseData.getInt("/SCADA_DATA/pump", pumpState);
  if (pumpState == 1) startPump();
  else stopPump();
  
  // Check for valve command
  firebaseData.getInt("/SCADA_DATA/valve", valveState);
  if (valveState == 1) openValve();
  else closeValve();
}
```

---

## Current Status

✅ **Completed:**
- Firebase configuration in React app
- Real-time data synchronization hooks
- Dashboard pages with Firebase listeners
- GA-VMD Python algorithm (pending hardware data)
- Control Panel with two-way command support
- GA-VMD Logs display

⏳ **Pending:**
- ESP32 code for hardware sensors and relays
- Firebase authentication setup
- Firebase security rules implementation
- Live GPS coordinate updates from GA-VMD to Live Map

---

## Environment Variables

Required Firebase credentials (already configured in `src/lib/firebase.ts`):
- `databaseURL`: https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com
- `projectId`: pipeline-fault-detecting-syste

GA-VMD uses service account key:
- `GA-VMD/serviceAccountKey.json` (must be created for Python backend)

---

## Development Commands

```bash
# Start React dev server
npm run dev

# Start GA-VMD monitoring
cd GA-VMD && python main.py

# Build for production
npm run build

# Type checking
npm run type-check
```

---

## Notes for Hardware Integration

1. **MQTT Alternative**: If WiFi direct upload is slow, consider MQTT bridge
2. **Data Format**: All numeric values should be transmitted as numbers, not strings
3. **Frequency**: Send updates every 1-2 seconds for real-time feel
4. **Fallback**: GA-VMD code includes fallback to random data if real data unavailable
5. **Time Sync**: Ensure ESP32 clock is synced (NTP) for accurate timestamps

---

**Last Updated**: March 31, 2026
**Next Step**: ESP32 code implementation when hardware ready
