# FLUIDIC System - Setup & Implementation Summary

**Project Status**: Phase 1 Complete | Phase 2 (Hardware) Ready for Implementation

---

## ✅ What's Been Completed

### 1. React Frontend Application
- ✅ Dashboard with real-time metrics
- ✅ Analytics page for trend analysis
- ✅ Alerts & Faults page for event logging
- ✅ Live Map with interactive Leaflet-based mapping
  - 7 sensor locations (Dehradun region) with clickable markers
  - Zoom-to-location functionality
  - Real-time status markers
- ✅ Control Panel with two-way Firebase integration
  - Pump start/stop controls
  - Solenoid valve open/close controls
  - Manual/Auto mode selection
  - Real-time sensor display
- ✅ **NEW**: GA-VMD Logs page (replaced AI Insights)
  - Real-time leak detection display
  - GA-VMD analysis metrics
  - Detection history (last 100 events)
  - Status indicators and location data

### 2. Firebase Integration
- ✅ Realtime database configured
- ✅ Two-way connection architecture
- ✅ SCADA_DATA sync (sensors → dashboard & commands)
- ✅ Pipeline data sync
- ✅ Results endpoint for GA-VMD algorithm
- ✅ Alerts system integration

### 3. GA-VMD Algorithm (Python)
- ✅ Genetic Algorithm implementation
- ✅ Variational Mode Decomposition for signal analysis
- ✅ Leak detection logic
- ✅ Leak location calculation
- ✅ Firebase real-time communication
- ✅ Ready for actual sensor data

### 4. Navigation & UI
- ✅ Sidebar navigation (updated)
- ✅ Route structure for all pages
- ✅ Responsive layout for mobile/tablet/desktop
- ✅ Custom Tailwind styling
- ✅ Real-time clock and status indicators

### 5. Documentation
- ✅ Firebase Integration Guide (FIREBASE_INTEGRATION.md)
- ✅ GA-VMD Setup Guide (GA-VMD-SETUP.md)
- ✅ ESP32 Hardware Integration Guide (ESP32_INTEGRATION.md)
- ✅ This summary document

---

## ⏳ What's Pending

### Phase 2: Hardware Integration (Your Responsibility)
- ⏳ **ESP32 Microcontroller Code**
  - WiFi connectivity
  - Sensor reading (flow, pressure, level, TDS, turbidity, pH)
  - Relay control (pump, valve)
  - Firebase Realtime Database communication
  - Command execution (two-way)

### Phase 3: Calibration & Testing
- ⏳ Sensor calibration
- ⏳ Flow meter characterization
- ⏳ Pressure sensor offset/scaling
- ⏳ Water quality sensor calibration
- ⏳ Live testing with real pipeline data

### Phase 4: Advanced Features
- ⏳ Live GPS coordinates from GA-VMD to Live Map
- ⏳ Email/SMS alerts on leak detection
- ⏳ Historical data export
- ⏳ Advanced reporting

---

## 🚀 Quick Start Guide

### 1. Start the React Application

```bash
cd D:\VS\Fluidic

# Install dependencies (if first time)
npm install

# Start development server
npm run dev
```

Navigate to: **http://localhost:8081**

**Expected behavior**:
- Dashboard loads with mock data
- All pages are accessible from sidebar
- GA-VMD Logs page shows "Waiting for GA-VMD analysis..."

### 2. Start GA-VMD Algorithm (When Ready)

```bash
cd D:\VS\Fluidic\GA-VMD

# Install Python dependencies (if first time)
pip install vmdpy pygad numpy firebase-admin scipy

# Run algorithm
python main.py
```

**Expected behavior**:
- Collects 100 flow measurements
- Runs Genetic Algorithm optimization
- Starts real-time monitoring
- Sends results to Firebase every 1-2 seconds
- GA-VMD Logs page updates automatically

### 3. Integrate ESP32 Hardware (Your Next Step)

When ready with hardware:

```cpp
// Copy the template from ESP32_INTEGRATION.md
// Customize pin mappings for your hardware
// Configure WiFi credentials
// Upload to ESP32

// Expected behavior:
// - ESP32 connects to WiFi
// - Reads all sensors
// - Sends data to Firebase every 1-2 seconds
// - Responds to dashboard controls in real-time
```

---

## 📂 Project Structure

```
Fluidic/
├── src/
│   ├── components/
│   │   ├── layout/        # AppLayout, Header, Sidebar
│   │   ├── shared/        # RadialGauge, SectionHeader
│   │   └── ui/            # Shadcn UI components
│   ├── hooks/
│   │   └── useFirebaseData.ts  # Firebase sync hooks
│   ├── lib/
│   │   └── firebase.ts    # Firebase config
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Analytics.tsx
│   │   ├── Alerts.tsx
│   │   ├── LiveMap.tsx    # ⚠️ Do not modify (as requested)
│   │   ├── ControlPanel.tsx
│   │   ├── Logs.tsx       # ✨ NEW - GA-VMD Results
│   │   └── ...
│   ├── App.tsx            # Route definitions
│   └── main.tsx
├── GA-VMD/
│   ├── main.py            # Main algorithm
│   ├── config.py          # Configuration
│   ├── utils.py           # Signal processing
│   └── serviceAccountKey.json  # (Your credentials)
├── Documentation
│   ├── FIREBASE_INTEGRATION.md   # Firebase architecture
│   ├── GA-VMD-SETUP.md           # Algorithm usage
│   ├── ESP32_INTEGRATION.md      # Hardware template
│   └── SETUP_SUMMARY.md          # This file
└── ... (config files, package.json, etc.)
```

---

## 🔌 Two-Way Connection Flow

### Dashboard → Hardware

```
React Control Panel (User clicks)
        ↓
    Firebase /SCADA_DATA/pump = 1
        ↓
    ESP32 reads Firebase listener
        ↓
    Activates pump relay
        ↓
    Sends sensor feedback back to Firebase
        ↓
    Dashboard updates in real-time ✓
```

### Hardware → Dashboard

```
ESP32 Sensors (Water flowing)
        ↓
    Measures: flow1, flow2, pressure, level, etc.
        ↓
    Sends to Firebase /SCADA_DATA
        ↓
    React pages listen via useFirebaseData() hook
        ↓
    Dashboard displays metrics instantly ✓
```

### GA-VMD Algorithm → Dashboard

```
GA-VMD monitoring loop (Python)
        ↓
    Analyzes flow data every 1-2 seconds
        ↓
    Detects leak status & location
        ↓
    Sends to Firebase /results
        ↓
    Logs page displays results instantly ✓
```

---

## 📊 All Pages Stay in Sync

All pages use real-time Firebase listeners:

| Page | Data Synced From | Updates |
|------|-----------------|---------|
| Dashboard | SCADA_DATA | Every 1s |
| Analytics | SCADA_DATA | Every 1s |
| Alerts | alerts node | Real-time |
| Live Map | SCADA_DATA, pipeline | Every 1s |
| Control Panel | SCADA_DATA | Every 1s |
| GA-VMD Logs | results node | Every 1-2s |

When one page changes a value, all others see it immediately.

---

## 🔑 Firebase Database URL

```
https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com/
```

**Current Data Structure**:
```json
{
  "SCADA_DATA": {
    "flow1": 10.5,
    "flow2": 9.8,
    "level": 75,
    "pump": 0,
    "valve": 1,
    "mode": "AUTO",
    "pressure": 2.3
  },
  "pipeline": {
    "tds": 125,
    "turbidity": 2.1,
    "ph": 7.2,
    "flow": 10.15
  },
  "results": {
    "status": "NORMAL",
    "location_m": 45.5,
    "latitude": 26.8485,
    "longitude": 80.9512,
    "flow": 10.5,
    "timestamp": 1711857848
  }
}
```

---

## 🛠️ Configuration Files to Update

### For GA-VMD (`GA-VMD/config.py`)
```python
PIPE_LENGTH = 100        # Total pipe length (meters)
WAVE_SPEED = 1000        # Acoustic wave speed (m/s)
SAMPLING_RATE = 10       # Sensor samples/second
```

**Calibration tip**: Adjust `WAVE_SPEED` based on pipe material (300-1600 m/s range)

### For ESP32 (When you create)
```cpp
#define WIFI_SSID "your_network"
#define WIFI_PASSWORD "your_password"
#define FIREBASE_API_KEY "your_key"

// Sensor pin mappings
#define FLOW_PIN_1 34
#define PRESSURE_PIN 36
// ... (full template in ESP32_INTEGRATION.md)
```

---

## ⚙️ System Requirements

### For React Development
- Node.js 18+ with npm
- Modern web browser
- Internet connection for Firebase
- VS Code (recommended)

### For GA-VMD
- Python 3.8+
- Libraries: `vmdpy`, `pygad`, `numpy`, `firebase-admin`, `scipy`
- Firebase service account key (JSON)

### For ESP32 Hardware
- ESP32 development board
- USB cable for programming
- Arduino IDE or PlatformIO
- WiFi router (2.4 GHz)

---

## 🔒 Security Notes

### Firebase Rules (To be implemented)
Currently, database allows read/write without authentication. For production:

```json
{
  "rules": {
    "SCADA_DATA": {
      ".read": true,
      ".write": "auth != null || isEsp32()"
    },
    "results": {
      ".read": true,
      ".write": "isGAVMDService()"
    }
  }
}
```

### Credentials Management
- ✅ React: API key in code (public)
- ⚠️ GA-VMD: serviceAccountKey.json (keep private, .gitignore)
- ⚠️ ESP32: WiFi password (keep in secure EEPROM, not hardcoded)

---

## 📈 Deployment Checklist

When ready to go live:

- [ ] Firebase security rules implemented
- [ ] ESP32 code tested on real hardware
- [ ] All sensors calibrated
- [ ] GA-VMD trained on real data (100+ samples)
- [ ] Admin credentials created
- [ ] Domain/SSL configured (if needed)
- [ ] Backup strategy in place
- [ ] Alert recipients configured
- [ ] Error logging enabled
- [ ] Load testing completed

---

## 🐛 Troubleshooting

### Dashboard shows "Waiting for GA-VMD analysis..."
→ Start GA-VMD: `python GA-VMD/main.py`

### Firebase data not updating
→ Check network connection, verify Firebase credentials, check Firebase console for data

### ESP32 not connecting to WiFi
→ Check WiFi SSID/password, ensure 2.4 GHz band, check antenna connection

### Flow meters reading zero
→ Check sensor connections, verify Arduino pin assignments, test with mock data first

### GA-VMD showing "LEAK" constantly
→ Adjust threshold in `main.py` (line ~150), recalibrate WAVE_SPEED

---

## 📚 Useful Resources

- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [React + Firebase Patterns](https://firebase.google.com/docs/database/admin/start)
- [ESP32 Arduino Guides](https://docs.espressif.com/projects/arduino-esp32/)
- [VMD Research Paper](https://ieeexplore.ieee.org/document/6847066)

---

## 📞 Next Steps

1. **Immediate**: Review this setup summary and linked documentation
2. **Short-term**: Test GA-VMD algorithm with mock data
3. **Hardware**: Design and build ESP32 sensor/relay board
4. **Integration**: Provide ESP32 code when hardware ready
5. **Calibration**: Calibrate sensors with real water samples
6. **Deployment**: Test full system end-to-end

---

## 📋 Checklist for ESP32 Code (When You Provide It)

Your ESP32 code should:
- [ ] Connect to WiFi
- [ ] Authenticate with Firebase
- [ ] Read all 7 sensors
- [ ] Send data to `/SCADA_DATA` every 1-2 seconds
- [ ] Read commands from `/SCADA_DATA/pump`, `/valve`, `/mode`
- [ ] Activate/deactivate relays on command
- [ ] Handle Firebase disconnection gracefully
- [ ] Include error logging
- [ ] Have watchdog timer enabled
- [ ] Proper pin configuration documented

---

## 🎉 Current Running Ports

- **React App**: http://localhost:8081
- **Firebase**: Backend only (no local port)
- **GA-VMD**: Backend only (runs continuously)
- **ESP32**: Will connect via WiFi to Firebase

---

**System Status**: ✅ Frontend Ready | ⏳ Hardware Pending

**Last Updated**: March 31, 2026

**For Questions**: Refer to the detailed guides in documentation folder

**Next Action**: When you have ESP32 code ready, share it and we'll integrate it!
