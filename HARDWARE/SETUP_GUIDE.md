# FLUIDIC Smart Pipeline Monitoring - ESP32 Hardware Setup Guide

## Overview
This Arduino code integrates an ESP32 microcontroller with Firebase in real-time to:
- Read sensor data (flow, pressure, tank level, water quality)
- Calculate pressure dynamically from flow values using the formula from `utils.py`
- Send all sensor readings to Firebase every 1 second
- Receive control commands from the web dashboard (pump on/off, valve open/close, mode selection)
- Control relay outputs for pump and emergency valve

---

## Hardware Requirements

### Microcontroller
- **ESP32 DevKit** (or similar ESP32 board)
- WiFi & Bluetooth capable
- Multiple ADC channels, GPIO pins

### Sensors
1. **Flow Sensors (2x)** - For inlet and outlet flow measurement
   - Model: YF-S401 or similar (0-5V analog or pulse output)
   - Pin 34 (GPIO34 / ADC1_CH6) - Inlet Flow (flow1)
   - Pin 35 (GPIO35 / ADC1_CH7) - Outlet Flow (flow2)

2. **⚠️ NO Pressure Sensor Required**
   - **Pressure is CALCULATED from flow values** using Bernoulli principle
   - Formula: `P = 0.5 × ρ × v²` (from utils.py)
   - This is done in real-time by ESP32, GA-VMD, and website
   - Saves hardware cost and maintains consistency across all systems

3. **Tank Level Sensor**
   - Pin 27 (GPIO27) - Ultrasonic or analog level sensor
   - Maps 0-4095 ADC to 0-100%

4. **TDS Sensor** (Total Dissolved Solids)
   - Pin 33 (GPIO33 / ADC1_CH5)
   - Maps 0-4095 ADC to 0-2000 ppm

5. **Turbidity Sensor**
   - Pin 25 (GPIO25)
   - Maps 0-5V to 0-100 NTU

6. **pH Sensor**
   - Pin 26 (GPIO26)
   - Maps 0-5V to 0-14 pH scale

### Control Components
- **Pump Relay Module** - Pin 13 (GPIO13)
  - 5V relay to control pump (0=OFF, 1=ON)
  
- **Emergency Valve Relay** - Pin 12 (GPIO12)
  - 5V relay to control emergency gate valve (0=CLOSED, 1=OPEN)

---

## Installation Steps

### 1. Install Arduino IDE
- Download from: https://www.arduino.cc/en/software
- Extract and run

### 2. Add ESP32 Board Support
1. Open Arduino IDE
2. Go to: **File** → **Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**
5. Go to: **Tools** → **Board** → **Board Manager**
6. Search for "ESP32"
7. Install "ESP32 by Espressif Systems" (latest version)

### 3. Install Required Libraries
1. Go to: **Sketch** → **Include Library** → **Manage Libraries**
2. Search and install:
   - **Firebase Arduino Client Library by Mobizt** (version 4.4.0 or later)
   - **ArduinoJson** (for JSON handling)
3. Click **Install**

### 4. Update WiFi Credentials
In `HARDWARE.ino`, find and update:
```cpp
#define WIFI_SSID "YOUR_SSID"
#define WIFI_PASSWORD "YOUR_PASSWORD"
```
Replace with your actual WiFi network name and password.

### 5. Flash to ESP32
1. Connect ESP32 to computer via USB cable
2. Select: **Tools** → **Board** → **ESP32 Dev Module**
3. Select the correct **COM Port**
4. Click **Upload** (or press Ctrl+U)
5. Wait for compilation and flashing to complete

---

## Firebase Configuration (Already Set)

The code uses these Firebase credentials (from your React app):
- **Project ID**: `pipeline-fault-detecting-syste`
- **Database URL**: `https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com`
- **API Key**: `AIzaSyC7_ZzH47dX90dP4Ew0sPGL5CbgtCGZenU`

**No additional configuration needed** - the Arduino code already has these embedded.

---

## Data Flow Architecture

### Outgoing Data (ESP32 → Firebase)
Every 1 second, the ESP32 sends:

**SCADA_DATA Path:**
```json
{
  "flow1": 45.2,           // Inlet flow (L/min)
  "flow2": 44.8,           // Outlet flow (L/min)
  "pressure": 2.15,        // Calculated from flow (bar)
  "level": 74,             // Tank level (%)
  "pump": 1,               // Pump state (0=OFF, 1=ON)
  "valve": 0,              // Valve state (0=CLOSED, 1=OPEN)
  "mode": "AUTO",          // Operating mode
  "timestamp": 123456789   // Milliseconds since boot
}
```

**pipeline Path:**
```json
{
  "tds": 450,              // Total dissolved solids (ppm)
  "turbidity": 2.3,        // Turbidity (NTU)
  "ph": 7.2,               // pH level
  "timestamp": 123456789
}
```

### Incoming Commands (Firebase → ESP32)
The ESP32 monitors these Firebase paths for control commands:

- `/SCADA_DATA/pump` → Controls pump relay (0 or 1)
- `/SCADA_DATA/valve` → Controls gate valve relay (0 or 1)
- `/SCADA_DATA/mode` → Sets operating mode ("AUTO" or "MANUAL")

When changed on the web dashboard, the ESP32 detects the change and updates the relay outputs immediately.

---

## Pressure Calculation

**⚠️ IMPORTANT: Pressure is CALCULATED from flow values only - NO physical pressure sensor needed**

The pressure is **calculated in real-time** across all systems (ESP32, GA-VMD, Website) using the Bernoulli principle:

**Formula** (from `utils.py`):
```
Q = flow_rate / (1000 × 60)      // Convert L/min to m³/s
A = π × (diameter / 2)²          // Pipe cross-sectional area
v = Q / A                         // Velocity (m/s)
P = 0.5 × ρ × v²                 // Pressure (Pa)
P_bar = P / 100000               // Convert to bar
```

**Constants (hardcoded everywhere):**
- Pipe diameter: 0.02 m (20 mm)
- Water density (ρ): 1000 kg/m³
- Output range: 0-20 bar (limited)

**This ensures:**
✅ All three systems (ESP32, GA-VMD, Website) calculate pressure identically  
✅ No hardware sensor failure points  
✅ Real-time pressure available immediately without sensor lag  
✅ Reduced BOM cost  
✅ Physics-based accuracy

**Implementation:**
- **ESP32**: Calculated in `calculatePressure()` function
- **GA-VMD**: Calculated in `flow_to_pressure()` from utils.py
- **Website**: Sent pre-calculated by ESP32, displayed as-is

---

## Sensor Calibration

Before deployment, calibrate each sensor:

### Flow Sensors
- Remove and measure known flow rate (e.g., with measuring cup + stopwatch)
- Adjust `FLOW_CALIBRATION_FACTOR` in code to match actual output
- Default: 7.5 pulses/liter (for YF-S401)

### Analog Sensors (TDS, Turbidity, pH)
- Use calibration solutions or known values
- Measure ADC output for each reference point
- The code maps linear scale - if needed, customize in `readSensors()` function

### Tank Level
- Fill tank to known heights
- Measure ultrasonic distance or voltage output
- Adjust mapping in `readSensors()` from current `map(levelRaw, 0, 4095, 0, 100)`

Example calibration (if sensor reads 2000 at 50% tank level):
```cpp
scada.level = map(levelRaw, 0, 2000, 0, 100); // Custom mapping
```

---

## Troubleshooting

### 1. WiFi Connection Issues
- Check WiFi SSID and password are correct
- ESP32 must be within range of 2.4 GHz WiFi network
- Check Serial Monitor for connection messages (115200 baud)

### 2. Firebase Not Connecting
- Verify Firebase credentials are correct (they're hardcoded and match your React app)
- Check WiFi is connected first
- Firebase Realtime Database must have appropriate security rules (set to public for testing)

### 3. Sensors Reading Zero
- Check pin connections are correct
- Verify ADC pins can read analog voltage (use Arduino Map function if needed)
- Check sensor power supply (typically 5V)

### 4. Control Commands Not Working
- Verify Firebase paths are exactly: `/SCADA_DATA/pump`, `/SCADA_DATA/valve`, `/SCADA_DATA/mode`
- Check web dashboard is actually writing to these paths
- Ensure relays are properly connected to GPIO pins

### 5. Serial Monitor Debugging
- Open **Tools** → **Serial Monitor** (115200 baud)
- Should show connection status and data being sent
- Check for error messages

---

## Wiring Diagram Reference

```
ESP32 PIN LAYOUT:
┌─────────────────────────────────────────────┐
│         ESP32 DevKit V4                     │
├─────────────────────────────────────────────┤
│ GND  → Sensor Ground                        │
│ 3.3V → Not used (use 5V external)           │
│ 5V   → External 5V Power Supply             │
│                                             │
│ GPIO 34 (ADC1_CH6)   → Flow1 Sensor        │
│ GPIO 35 (ADC1_CH7)   → Flow2 Sensor        │
│ GPIO 33 (ADC1_CH5)   → TDS Sensor          │
│ GPIO 25              → Turbidity Sensor    │
│ GPIO 26              → pH Sensor           │
│ GPIO 27              → Tank Level Sensor   │
│                                             │
│ GPIO 13              → Pump Relay Module    │
│ GPIO 12              → Valve Relay Module   │
│                                             │
│ GND  → All Sensor Grounds                  │
│ RX   → (Optional UART)                     │
│ TX   → (Optional UART)                     │
│                                             │
│ ❌ NO PRESSURE SENSOR (calculated from flow)
└─────────────────────────────────────────────┘
```

---

## Testing Procedure

### Step 1: Flash and Verify Connection
1. Upload code to ESP32
2. Open Serial Monitor (115200 baud)
3. Watch for: "WiFi Connected" and "Firebase initialized"

### Step 2: Check Data in Firebase
1. Go to Firebase Console
2. Navigate to Realtime Database
3. Watch for `/SCADA_DATA` and `/pipeline` nodes updating every second

### Step 3: Test Dashboard Display
1. Open http://localhost:8082/control (or wherever your React app runs)
2. Verify sensor values appear and update in real-time
3. All pages should show updated readings

### Step 4: Test Control Commands
1. On Control Panel page, click "Start Pump"
2. Verify ESP32 pump relay activates (and Serial shows message)
3. Click "Stop Pump" - relay should deactivate
4. Repeat for valve control

### Step 5: Monitor for 1+ Hour
- Check for any disconnection messages
- Verify stable data transmission
- Monitor Stack trace for memory leaks

---

## Power Supply Recommendations

- **ESP32**: 500mA at 5V minimum
- **Sensors**: 20-50mA total at 5V
- **Relays**: 100-200mA each (when activated)

**Total**: ~1A at 5V

Use a dedicated 5V power supply (USB power bank, external PSU, or Arduino power connector).
**Do NOT** rely solely on USB computer connection for long-term operation.

---

## Advanced Customization

### Change Update Interval
In `loop()` function:
```cpp
const unsigned long UPDATE_INTERVAL = 1000; // Change 1000 to desired milliseconds
```

### Adjust Pressure Calculation
Edit in `calculatePressure()`:
```cpp
const float PIPE_DIAMETER = 0.02;    // Change to your pipe diameter in meters
```

### Add More Sensors
1. Add new pin definition at top
2. Create read function similar to `readFlowSensor()`
3. Add to `readSensors()`
4. Include in Firebase JSON in `sendScadaData()` or `sendPipelineData()`

### Change Firebase Paths
Modify the "/SCADA_DATA" and "/pipeline" strings in Firebase calls to use custom paths.
**Must match** what your React app expects.

---

## Support & Documentation

- **Firebase Arduino Library**: https://github.com/mobizt/Firebase-ESP8266
- **ESP32 Arduino Core**: https://github.com/espressif/arduino-esp32
- **ArduinoJson Library**: https://arduinojson.org/

---

**Status**: ✅ Ready for deployment  
**Last Updated**: March 31, 2026  
**Compatibility**: ESP32, Firebase Realtime Database, React Dashboard
