# ESP32 Hardware Integration Guide

**Status**: Template ready, awaiting hardware code from user

---

## Overview

This guide will help integrate ESP32 microcontroller with the FLUIDIC dashboard via Firebase Realtime Database. The ESP32 will:

1. **Read sensor data** (flow, pressure, level, turbidity, TDS, pH)
2. **Control relays** (pump, solenoid valve)
3. **Send updates** to Firebase
4. **Receive commands** from Firebase (two-way communication)

---

## Hardware Checklist

The following components are required:

### Sensors
- [ ] Flow Meter 1 (inlet) - YF-S201 or similar
- [ ] Flow Meter 2 (outlet) - YF-S201 or similar
- [ ] Pressure Sensor 0-10 bar
- [ ] Level Sensor (analog/capacitive)
- [ ] TDS Sensor (water quality)
- [ ] Turbidity Sensor
- [ ] pH Sensor

### Actuators
- [ ] Pump Relay Module (5V, 10A)
- [ ] Solenoid Valve (24V or controllable pump)

### Microcontroller
- [ ] ESP32 Development Board
- [ ] 5V Power Supply
- [ ] WiFi connectivity (built-in)

### Connectivity
- [ ] WiFi router (2.4 GHz, password optional for setup)
- [ ] Micro USB cable for programming

---

## GPIO Pin Mapping (Typical)

Create a configuration file in your ESP32 code:

```cpp
// Pin configuration
#define FLOW_PIN_1 34      // ADC pin for flow sensor 1
#define FLOW_PIN_2 35      // ADC pin for flow sensor 2
#define PRESSURE_PIN 36    // ADC pin for pressure sensor
#define LEVEL_PIN 39       // ADC pin for level sensor
#define TDS_PIN 32         // ADC pin for TDS
#define TURBIDITY_PIN 33   // ADC pin for turbidity
#define PH_PIN 27          // ADC pin for pH

// Control pins
#define PUMP_RELAY_PIN 5   // GPIO5 for pump relay
#define VALVE_RELAY_PIN 18 // GPIO18 for solenoid valve

// Status LED (optional)
#define STATUS_LED_PIN 2   // GPIO2 for WiFi status
```

---

## Firebase Credentials on ESP32

You'll need:
1. **WiFi SSID & Password**
2. **Firebase API Key**
3. **Firebase Database URL**: `https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com`
4. **Firebase Auth Email & Password** (for real-time auth) OR device token

Store these securely (not hardcoded in production):

```cpp
const char* WIFI_SSID = "your_ssid";
const char* WIFI_PASSWORD = "your_password";
const char* FIREBASE_HOST = "pipeline-fault-detecting-syste-default-rtdb.firebaseio.com";
const char* FIREBASE_API_KEY = "your_api_key";
```

---

## Required Libraries

For Arduino IDE / PlatformIO:

```
- FirebaseArduino (by Firebase)
- ESP32 Core
- ArduinoJson
- DHT library (optional, for temperature)
```

Or use Platform.io with:

```ini
[env:esp32]
platform = espressif32
board = esp32doit-devkit-v1
framework = arduino
lib_deps = 
    firebase/Firebase Arduino Library
    bblanchon/ArduinoJson
```

---

## Code Template Structure

Your ESP32 code should follow this structure:

```cpp
// 1. SETUP
// - Initialize WiFi
// - Initialize Firebase
// - Initialize sensor pins (ADC)
// - Initialize relay pins (GPIO, OUTPUT)
// - Test all sensors and relays

// 2. MAIN LOOP
// - Read all sensor values
// - Convert analog readings to physical units
// - Send to Firebase at /SCADA_DATA
// - Read commands from Firebase at /SCADA_DATA/pump, /valve, /mode
// - Execute commands (activate relays)
// - Update status LED
// - Wait 1-2 seconds, repeat

// 3. SENSOR READING FUNCTIONS
// - readFlow1(), readFlow2()
// - readPressure()
// - readLevel()
// - readTDS()
// - readTurbidity()
// - readPH()

// 4. RELAY CONTROL FUNCTIONS
// - setPumpState(int state) // 0=OFF, 1=ON
// - setValveState(int state) // 0=CLOSED, 1=OPEN

// 5. FIREBASE UPDATE FUNCTIONS
// - updateSCADAData()
// - checkAndExecuteCommands()
```

---

## Firebase Data Structure on ESP32

The ESP32 should maintain this structure in Firebase:

```json
{
  "SCADA_DATA": {
    "flow1": 10.5,       // float: liters/min
    "flow2": 9.8,        // float: liters/min
    "level": 75,         // int: percentage
    "pressure": 2.5,     // float: bar
    "pump": 1,           // int: 0=OFF, 1=ON
    "valve": 0,          // int: 0=CLOSED, 1=OPEN
    "mode": "AUTO",      // string: "AUTO" or "MANUAL"
    "timestamp": 1711857848  // int: Unix timestamp
  },
  "pipeline": {
    "tds": 120,          // int: ppm
    "turbidity": 2.3,    // float: NTU
    "ph": 7.2,           // float
    "flow": 10.15        // float: average flow for GA-VMD
  }
}
```

---

## Sensor Calibration

### Flow Meters (YF-S201 typical)

```cpp
// YF-S201: 4.5 pulses per milliliter
#define FLOW_CALIBRATION_FACTOR 4.5

// Interrupt handler for flow sensor
volatile int pulseCount1 = 0;

void IRAM_ATTR countPulse1() {
  pulseCount1++;
}

float readFlow1() {
  // Count pulses for 1 second
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN_1), countPulse1, RISING);
  delay(1000);
  detachInterrupt(digitalPinToInterrupt(FLOW_PIN_1));
  
  // Convert pulses to mL/s, then to L/min
  float flowRate = (pulseCount1 / FLOW_CALIBRATION_FACTOR) / 1000 * 60;
  pulseCount1 = 0;
  return flowRate;
}
```

### Pressure Sensor (0-10 bar)

```cpp
// Assuming 0-3.3V maps to 0-10 bar on ADC
float readPressure() {
  int rawValue = analogRead(PRESSURE_PIN);
  float voltage = (rawValue / 4095.0) * 3.3;
  float pressure = (voltage / 3.3) * 10.0;  // 0-10 bar
  return pressure;
}
```

### Level Sensor (Float / Capacitive)

```cpp
float readLevel() {
  int rawValue = analogRead(LEVEL_PIN);
  float percentage = (rawValue / 4095.0) * 100.0;
  return constrain(percentage, 0, 100);
}
```

### Water Quality Sensors (TDS, Turbidity, pH)

```cpp
// TDS Sensor
float readTDS() {
  int rawValue = analogRead(TDS_PIN);
  float voltage = (rawValue / 4095.0) * 3.3;
  float tds = voltage * 500; // Sensor dependent
  return tds;
}

// Turbidity Sensor
float readTurbidity() {
  int rawValue = analogRead(TURBIDITY_PIN);
  float voltage = (rawValue / 4095.0) * 3.3;
  float turbidity = -1120.4 * voltage * voltage + 5742.3 * voltage - 4353.8;
  return constrain(turbidity, 0, 4000);
}

// pH Sensor
float readPH() {
  int rawValue = analogRead(PH_PIN);
  float voltage = (rawValue / 4095.0) * 3.3;
  float ph = 3.5 * voltage;  // Calibration needed
  return constrain(ph, 0, 14);
}
```

---

## Relay Control

```cpp
void setPumpState(int state) {
  if (state == 1) {
    digitalWrite(PUMP_RELAY_PIN, HIGH);  // Activate pump
    Serial.println("Pump: ON");
  } else {
    digitalWrite(PUMP_RELAY_PIN, LOW);   // Deactivate pump
    Serial.println("Pump: OFF");
  }
}

void setValveState(int state) {
  if (state == 1) {
    digitalWrite(VALVE_RELAY_PIN, HIGH);  // Open valve
    Serial.println("Valve: OPEN");
  } else {
    digitalWrite(VALVE_RELAY_PIN, LOW);   // Close valve
    Serial.println("Valve: CLOSED");
  }
}
```

---

## Firebase Communication

### Sending Data

```cpp
void updateSCADAData() {
  // Read all sensors
  float flow1 = readFlow1();
  float flow2 = readFlow2();
  float pressure = readPressure();
  float level = readLevel();
  int pump_state = digitalRead(PUMP_RELAY_PIN);
  int valve_state = digitalRead(VALVE_RELAY_PIN);
  
  // Send to Firebase
  Firebase.setFloat(firebaseData, "/SCADA_DATA/flow1", flow1);
  Firebase.setFloat(firebaseData, "/SCADA_DATA/flow2", flow2);
  Firebase.setFloat(firebaseData, "/SCADA_DATA/pressure", pressure);
  Firebase.setInt(firebaseData, "/SCADA_DATA/level", (int)level);
  Firebase.setInt(firebaseData, "/SCADA_DATA/pump", pump_state);
  Firebase.setInt(firebaseData, "/SCADA_DATA/valve", valve_state);
  
  // Pipeline data for GA-VMD
  Firebase.setFloat(firebaseData, "/pipeline/tds", readTDS());
  Firebase.setFloat(firebaseData, "/pipeline/turbidity", readTurbidity());
  Firebase.setFloat(firebaseData, "/pipeline/ph", readPH());
  Firebase.setFloat(firebaseData, "/pipeline/flow", (flow1 + flow2) / 2);
}
```

### Receiving Commands

```cpp
void checkAndExecuteCommands() {
  // Check pump command
  if (Firebase.getInt(firebaseData, "/SCADA_DATA/pump")) {
    int pump_cmd = firebaseData.intData();
    setPumpState(pump_cmd);
  }
  
  // Check valve command
  if (Firebase.getInt(firebaseData, "/SCADA_DATA/valve")) {
    int valve_cmd = firebaseData.intData();
    setValveState(valve_cmd);
  }
  
  // Check mode
  if (Firebase.getString(firebaseData, "/SCADA_DATA/mode")) {
    String mode = firebaseData.stringData();
    if (mode == "AUTO") {
      // Handle auto mode logic
    } else if (mode == "MANUAL") {
      // Handle manual mode logic
    }
  }
}
```

---

## Main Loop Structure

```cpp
void loop() {
  // Check WiFi connection
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED_PIN, HIGH);  // WiFi connected
    
    // Read sensors and send data
    updateSCADAData();
    
    // Check for commands and execute
    checkAndExecuteCommands();
    
  } else {
    digitalWrite(STATUS_LED_PIN, LOW);   // WiFi disconnected
    Serial.println("Reconnecting to WiFi...");
    WiFi.reconnect();
  }
  
  // Wait 1-2 seconds before next loop
  delay(1000);
}
```

---

## Testing Checklist

When your code is ready:

- [ ] ESP32 connects to WiFi
- [ ] ESP32 authenticates with Firebase
- [ ] Flow meter reading works (test by running water)
- [ ] Pressure sensor reading works (apply pressure, watch value change)
- [ ] Level sensor reading works (fill tank, watch percentage increase)
- [ ] TDS sensor reading works (test with known solutions)
- [ ] Turbidity sensor reading works
- [ ] pH sensor reading works
- [ ] Pump relay activates/deactivates on command
- [ ] Valve relay activates/deactivates on command
- [ ] Full round trip: Change Control Panel → Firebase → ESP32 → Execute → Send feedback
- [ ] Dashboard updates in real-time when sensors change
- [ ] GA-VMD algorithm starts receiving flow data

---

## Safety Considerations

1. **Relay Protection**: Add protection diodes to relay circuits
2. **Sensor Isolation**: Use optoisolators for sensor inputs from high-voltage circuits
3. **Watchdog**: Enable ESP32 watchdog timer
4. **Error Recovery**: Handle Firebase disconnection gracefully
5. **Water Safety**: Ensure pump/valve fail-safe defaults (off/closed)

---

## Debugging

### Serial Monitor

Log all activity to Serial for troubleshooting:

```cpp
Serial.begin(115200);
Serial.println("System starting...");
Serial.println("WiFi SSID: " + String(WIFI_SSID));
Serial.println("Flow1: " + String(readFlow1()) + " L/min");
```

### Firebase Realtime Monitor

In Firebase Console:
1. Go to your Realtime Database
2. Watch `/SCADA_DATA` for updates
3. Manually edit `/SCADA_DATA/pump` to test command execution

### Expected Serial Output

```
System starting...
WiFi connecting...
WiFi connected! IP: 192.168.1.100
Firebase connected
Loop 1: Flow1=10.5, Flow2=9.8, Pressure=2.3, Level=75%
Loop 2: Pump command received: ON
Relay activated: PUMP=ON
Loop 3: Flow1=11.2, Flow2=10.1, Pressure=2.8, Level=76%
...
```

---

## Next Steps (After Code Provided)

1. Upload and test ESP32 code
2. Verify all sensor readings
3. Verify relay control
4. Monitor Gas-VMD algorithm output
5. Calibrate sensors for accuracy
6. Integrate live leak location with map

---

## File Structure

When ready, provide:

```
esp32_code/
├── main.ino          # Main sketch file
├── config.h          # Configuration header
├── sensors.h         # Sensor reading functions
├── relays.h          # Relay control functions
├── firebase_handler.h # Firebase communication
└── README.md         # Your implementation notes
```

---

**Status**: Template complete, ready for your ESP32 code

**Last Updated**: March 31, 2026

**Next**: User provides ESP32 hardware code

---

## Contact / Questions

When integrating, refer to:
- [Firebase Arduino Library Docs](https://firebase.google.com/docs/database/arduino/start)
- [ESP32 Arduino Docs](https://docs.espressif.com/projects/arduino-esp32/en/latest/)
- [Sensor Datasheets](./GA-VMD/)
