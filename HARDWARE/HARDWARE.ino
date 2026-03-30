// FLUIDIC Smart Pipeline Monitoring System - ESP32 Hardware Integration
// Real-time sensor data transmission to Firebase with control feedback

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <FirebaseAuth.h>
#include <FirebaseRTDB.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <HardwareSerial.h>

// ============================================================================
// FIREBASE CONFIGURATION (from d:\VS\Fluidic\src\lib\firebase.ts)
// ============================================================================
#define FIREBASE_PROJECT_ID "pipeline-fault-detecting-syste"
#define FIREBASE_DATABASE_URL "https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com"
#define API_KEY "AIzaSyC7_ZzH47dX90dP4Ew0sPGL5CbgtCGZenU"

// WiFi Credentials (Update with your WiFi details)
#define WIFI_SSID "Ransomware"
#define WIFI_PASSWORD "0987654321"

// ============================================================================
// SENSOR PIN CONFIGURATION
// ============================================================================
// Flow Sensors (0-5V analog or pulse-based)
#define FLOW_SENSOR_1_PIN 34    // ADC1_CH6 - Inlet Flow (flow1)
#define FLOW_SENSOR_2_PIN 35    // ADC1_CH7 - Outlet Flow (flow2)

// NOTE: Pressure is CALCULATED from flow values using utils.py formula
// No physical pressure sensor needed - calculated in real-time

// Water Quality Sensors
#define TDS_SENSOR_PIN 33       // ADC1_CH5 - Total Dissolved Solids
#define TURBIDITY_SENSOR_PIN 25 // GPIO25 - Turbidity Sensor
#define PH_SENSOR_PIN 26        // GPIO26 - pH Sensor

// Tank Level Sensor (Analog - 0-100% mapping)
#define LEVEL_SENSOR_PIN 27     // GPIO27 - Water Tank Level

// Control Pins
#define PUMP_RELAY_PIN 13       // GPIO13 - Pump Control (0=OFF, 1=ON)
#define VALVE_RELAY_PIN 12      // GPIO12 - Emergency Gate Valve (0=CLOSED, 1=OPEN)

// ============================================================================
// FIREBASE OBJECTS
// ============================================================================
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================
struct ScadaData {
  float flow1;       // Inlet Flow (L/min)
  float flow2;       // Outlet Flow (L/min)
  float level;       // Tank Level (0-100%)
  int pump;          // Pump State (0=OFF, 1=ON)
  String mode;       // Operating Mode (AUTO/MANUAL)
  float pressure;    // Calculated Pressure (bar)
  int valve;         // Valve State (0=CLOSED, 1=OPEN)
};

struct PipelineData {
  int tds;           // Total Dissolved Solids (ppm)
  float turbidity;   // Turbidity (NTU)
  float ph;          // pH Level
};

ScadaData scada = {0, 0, 0, 0, "AUTO", 0, 0};
PipelineData pipeline = {0, 0, 0};

unsigned long lastUpdateTime = 0;
const unsigned long UPDATE_INTERVAL = 1000; // Update every 1 second

// Flow sensor calibration (adjust based on your sensor specs)
const float FLOW_CALIBRATION_FACTOR = 7.5; // pulses per liter

// Pressure calculation constants (from utils.py)
const float PIPE_DIAMETER = 0.02;    // 20mm diameter
const float RHO = 1000;              // Water density (kg/m³)

// ============================================================================
// SETUP FUNCTION
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Initialize sensor pins
  pinMode(FLOW_SENSOR_1_PIN, INPUT);
  pinMode(FLOW_SENSOR_2_PIN, INPUT);
  pinMode(TDS_SENSOR_PIN, INPUT);
  pinMode(TURBIDITY_SENSOR_PIN, INPUT);
  pinMode(PH_SENSOR_PIN, INPUT);
  pinMode(LEVEL_SENSOR_PIN, INPUT);
  
  // Initialize control relay pins
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(VALVE_RELAY_PIN, OUTPUT);
  
  // Set initial relay states (OFF)
  digitalWrite(PUMP_RELAY_PIN, LOW);
  digitalWrite(VALVE_RELAY_PIN, LOW);
  
  Serial.println("\n\nFLUIDIC Smart Pipeline Monitoring - ESP32 Hardware");
  Serial.println("Initializing...");
  
  // Connect to WiFi
  connectToWiFi();
  
  // Setup Firebase
  setupFirebase();
  
  Serial.println("Setup Complete - Ready for Real-time Data Transmission");
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
  if (WiFi.status() == WL_CONNECTED && Firebase.ready()) {
    unsigned long currentTime = millis();
    
    if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
      lastUpdateTime = currentTime;
      
      // Read sensor values
      readSensors();
      
      // Calculate pressure from flow values (using utils.py formula)
      calculatePressure();
      
      // Send SCADA data to Firebase
      sendScadaData();
      
      // Send Pipeline data to Firebase
      sendPipelineData();
      
      // Read control commands from Firebase
      readControlCommands();
      
      // Print debug info
      printDebugInfo();
    }
  } else {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi disconnected, attempting to reconnect...");
      connectToWiFi();
    }
    if (!Firebase.ready()) {
      Serial.println("Firebase not ready, retrying...");
      setupFirebase();
    }
    delay(1000);
  }
}

// ============================================================================
// WiFi CONNECTION
// ============================================================================
void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection Failed!");
  }
}

// ============================================================================
// FIREBASE SETUP
// ============================================================================
void setupFirebase() {
  // Assign the Firebase project ID
  config.api_key = API_KEY;
  config.database_url = FIREBASE_DATABASE_URL;
  
  // Anonymous authentication
  auth.user.email = "";
  auth.user.password = "";
  
  config.token_status_callback = tokenStatusCallback; // see addons/TokenHelper.h
  config.max_token_generation_retry = 5;
  
  // Limit the size of response payload to be collected before returning
  config.resp_size = 2048; // bytes
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectNetwork(true);
  
  // Since we use Anonymous sign-in, initialize without credentials
  if (!Firebase.signUp(&config, &auth, "", "")) {
    Serial.println(F("Anonymous sign-up failed"));
    Serial.println(Firebase.errorReason());
    return;
  }
  
  Serial.println("Firebase initialized successfully");
}

// ============================================================================
// SENSOR READING FUNCTIONS
// ============================================================================
void readSensors() {
  // Read Flow Sensor 1 (Inlet)
  scada.flow1 = readFlowSensor(FLOW_SENSOR_1_PIN);
  
  // Read Flow Sensor 2 (Outlet)
  scada.flow2 = readFlowSensor(FLOW_SENSOR_2_PIN);
  
  // Read Tank Level (map 0-4095 ADC to 0-100%)
  int levelRaw = analogRead(LEVEL_SENSOR_PIN);
  scada.level = map(levelRaw, 0, 4095, 0, 100);
  
  // Read TDS Sensor (0-4095 ADC to 0-2000 ppm)
  int tdsRaw = analogRead(TDS_SENSOR_PIN);
  pipeline.tds = map(tdsRaw, 0, 4095, 0, 2000);
  
  // Read Turbidity Sensor (0-5V to 0-100 NTU)
  int turbidityRaw = analogRead(TURBIDITY_SENSOR_PIN);
  pipeline.turbidity = (turbidityRaw / 4095.0) * 100.0;
  
  // Read pH Sensor (0-5V to 0-14 pH)
  int phRaw = analogRead(PH_SENSOR_PIN);
  pipeline.ph = (phRaw / 4095.0) * 14.0;
}

// ============================================================================
// FLOW SENSOR READING (Simplified - expects analog 0-5V)
// For pulse-based sensors, use interrupt counting instead
// ============================================================================
float readFlowSensor(int pin) {
  // For analog flow sensors: convert 0-5V to 0-100 L/min
  int rawValue = analogRead(pin);
  float voltage = (rawValue / 4095.0) * 5.0;
  float flow = (voltage / 5.0) * 100.0; // Scale to 0-100 L/min
  
  // Apply simple low-pass filter for stability
  static float prevFlow1 = 0, prevFlow2 = 0;
  float filtered;
  
  if (pin == FLOW_SENSOR_1_PIN) {
    filtered = (prevFlow1 * 0.7) + (flow * 0.3);
    prevFlow1 = filtered;
  } else {
    filtered = (prevFlow2 * 0.7) + (flow * 0.3);
    prevFlow2 = filtered;
  }
  
  return filtered;
}

// ============================================================================
// PRESSURE CALCULATION (from utils.py: flow_to_pressure)
// P = 0.5 * rho * v^2, where v = Q / A
// ============================================================================
void calculatePressure() {
  // Use average of inlet flow for pressure calculation
  float flowLPerMin = scada.flow1;
  
  // Convert L/min to m³/s: Q = (flow / (1000 * 60))
  float Q = flowLPerMin / (1000.0 * 60.0);
  
  // Calculate cross-sectional area: A = π * (d/2)²
  float A = 3.14159 * (PIPE_DIAMETER / 2.0) * (PIPE_DIAMETER / 2.0);
  
  // Calculate velocity: v = Q / A
  float v = Q / A;
  
  // Calculate pressure: P = 0.5 * rho * v²
  // Result is in Pascals, convert to bar (1 bar = 100,000 Pa)
  float pressurePa = 0.5 * RHO * v * v;
  scada.pressure = pressurePa / 100000.0; // Convert to bar
  
  // Limit to reasonable range
  if (scada.pressure < 0) scada.pressure = 0;
  if (scada.pressure > 20) scada.pressure = 20; // Max 20 bar
}

// ============================================================================
// SEND SCADA DATA TO FIREBASE
// ============================================================================
void sendScadaData() {
  if (!Firebase.ready()) return;
  
  // Create JSON with SCADA data
  FirebaseJson json;
  json.set("flow1", (double)scada.flow1);
  json.set("flow2", (double)scada.flow2);
  json.set("level", (double)scada.level);
  json.set("pump", scada.pump);
  json.set("mode", scada.mode);
  json.set("pressure", (double)scada.pressure);
  json.set("valve", scada.valve);
  json.set("timestamp", getTimestamp());
  
  // Send to Firebase at SCADA_DATA path
  if (Firebase.RTDB.setJSON(&fbdo, "/SCADA_DATA", &json)) {
    Serial.println("✓ SCADA data sent to Firebase");
  } else {
    Serial.print("✗ Failed to send SCADA data: ");
    Serial.println(fbdo.errorReason());
  }
}

// ============================================================================
// SEND PIPELINE DATA TO FIREBASE
// ============================================================================
void sendPipelineData() {
  if (!Firebase.ready()) return;
  
  // Create JSON with Pipeline data
  FirebaseJson json;
  json.set("tds", (int)pipeline.tds);
  json.set("turbidity", (double)pipeline.turbidity);
  json.set("ph", (double)pipeline.ph);
  json.set("timestamp", getTimestamp());
  
  // Send to Firebase at pipeline path
  if (Firebase.RTDB.setJSON(&fbdo, "/pipeline", &json)) {
    Serial.println("✓ Pipeline data sent to Firebase");
  } else {
    Serial.print("✗ Failed to send pipeline data: ");
    Serial.println(fbdo.errorReason());
  }
}

// ============================================================================
// READ CONTROL COMMANDS FROM FIREBASE
// ============================================================================
void readControlCommands() {
  if (!Firebase.ready()) return;
  
  // Read pump state (0=OFF, 1=ON)
  if (Firebase.RTDB.getInt(&fbdo, "/SCADA_DATA/pump")) {
    int pumpCmd = fbdo.intData();
    if (pumpCmd != scada.pump) {
      scada.pump = pumpCmd;
      digitalWrite(PUMP_RELAY_PIN, pumpCmd ? HIGH : LOW);
      Serial.print("→ Pump command: ");
      Serial.println(pumpCmd ? "START" : "STOP");
    }
  }
  
  // Read valve state (0=CLOSED, 1=OPEN)
  if (Firebase.RTDB.getInt(&fbdo, "/SCADA_DATA/valve")) {
    int valveCmd = fbdo.intData();
    if (valveCmd != scada.valve) {
      scada.valve = valveCmd;
      digitalWrite(VALVE_RELAY_PIN, valveCmd ? HIGH : LOW);
      Serial.print("→ Valve command: ");
      Serial.println(valveCmd ? "OPEN" : "CLOSED");
    }
  }
  
  // Read operating mode (AUTO/MANUAL)
  if (Firebase.RTDB.getString(&fbdo, "/SCADA_DATA/mode")) {
    String modeCmd = fbdo.stringData();
    if (modeCmd != scada.mode) {
      scada.mode = modeCmd;
      Serial.print("→ Mode changed to: ");
      Serial.println(scada.mode);
    }
  }
}

// ============================================================================
// FIREBASE TOKEN STATUS CALLBACK
// ============================================================================
void tokenStatusCallback(token_info_t info) {
  if (info.status == token_status_ready) {
    Serial.println("\nReady with ID token");
  } else if (info.status == token_status_expired) {
    Serial.println("\nToken expired, renewing...");
  } else if (info.status == token_status_error) {
    Serial.print("\nToken error: ");
    Serial.println(info.error.message);
  } else if (info.status == token_status_undefined) {
    Serial.println("\nToken undefined");
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
unsigned long getTimestamp() {
  // For real timestamp, integrate NTP time
  // For now, return millis() which resets on reboot
  return millis();
}

void printDebugInfo() {
  Serial.println("\n===== FLUIDIC System Status =====");
  Serial.print("Flow 1 (Inlet): "); Serial.print(scada.flow1); Serial.println(" L/min");
  Serial.print("Flow 2 (Outlet): "); Serial.print(scada.flow2); Serial.println(" L/min");
  Serial.print("Pressure (Calculated): "); Serial.print(scada.pressure); Serial.println(" bar");
  Serial.print("Tank Level: "); Serial.print(scada.level); Serial.println("%");
  Serial.print("TDS: "); Serial.print(pipeline.tds); Serial.println(" ppm");
  Serial.print("Turbidity: "); Serial.print(pipeline.turbidity); Serial.println(" NTU");
  Serial.print("pH: "); Serial.print(pipeline.ph); Serial.println("");
  Serial.print("Pump: "); Serial.println(scada.pump ? "ON" : "OFF");
  Serial.print("Valve: "); Serial.println(scada.valve ? "OPEN" : "CLOSED");
  Serial.print("Mode: "); Serial.println(scada.mode);
  Serial.println("==================================\n");
}
