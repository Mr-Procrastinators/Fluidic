// FLUIDIC Smart Pipeline Monitoring System - ESP32 Hardware Integration
// Real-time sensor data transmission to Firebase with control feedback

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>
#include <HardwareSerial.h>

// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================
#define FIREBASE_PROJECT_ID "pipeline-fault-detecting-syste"
#define FIREBASE_DATABASE_URL "https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com"
#define API_KEY "AIzaSyC7_ZzH47dX90dP4Ew0sPGL5CbgtCGZenU"

// WiFi Credentials (Update with your WiFi details)
#define WIFI_SSID "VICTUS"
#define WIFI_PASSWORD "7355480663"

// ============================================================================
// SENSOR PIN CONFIGURATION
// ============================================================================
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
  float flow1;
  float flow2;
  float level;
  int pump;
  String mode;
  float pressure;
  int valve;
};

struct PipelineData {
  int tds;
  float turbidity;
  float ph;
};

ScadaData scada = {0, 0, 0, 0, "AUTO", 0, 0};
PipelineData pipeline = {0, 0, 0};

unsigned long lastUpdateTime = 0;
const unsigned long UPDATE_INTERVAL = 200; // Faster loop for faster pump/valve response

// Pressure calculation constants
const float PIPE_DIAMETER = 0.02;
const float RHO = 1000;

// ============================================================================
// SETUP FUNCTION
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(FLOW_SENSOR_1_PIN, INPUT);
  pinMode(FLOW_SENSOR_2_PIN, INPUT);
  pinMode(TDS_SENSOR_PIN, INPUT);
  pinMode(TURBIDITY_SENSOR_PIN, INPUT);
  pinMode(PH_SENSOR_PIN, INPUT);
  pinMode(LEVEL_SENSOR_PIN, INPUT);

  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(VALVE_RELAY_PIN, OUTPUT);

  digitalWrite(PUMP_RELAY_PIN, LOW);
  digitalWrite(VALVE_RELAY_PIN, LOW);

  Serial.println("\n\nFLUIDIC Smart Pipeline Monitoring - ESP32 Hardware");
  Serial.println("Initializing...");

  connectToWiFi();
  setupFirebase();

  Serial.println("Setup Complete - Ready for Real-time Data Transmission");
}

// ============================================================================
// MAIN LOOP
// ============================================================================
void loop() {
  if (WiFi.status() == WL_CONNECTED && Firebase.ready()) {
    readControlCommands();

    unsigned long currentTime = millis();

    if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
      lastUpdateTime = currentTime;

      readSensors();
      calculatePressure();
      sendScadaData();
      sendPipelineData();
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
  config.api_key = API_KEY;
  config.database_url = FIREBASE_DATABASE_URL;

  auth.user.email = "";
  auth.user.password = "";

  config.token_status_callback = tokenStatusCallback;
  config.max_token_generation_retry = 5;
  config.resp_size = 2048;

  Firebase.begin(&config, &auth);
  Firebase.reconnectNetwork(true);

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
  scada.flow1 = readFlowSensor(FLOW_SENSOR_1_PIN);
  scada.flow2 = readFlowSensor(FLOW_SENSOR_2_PIN);

  int levelRaw = analogRead(LEVEL_SENSOR_PIN);
  scada.level = map(levelRaw, 0, 4095, 0, 100);

  int tdsRaw = analogRead(TDS_SENSOR_PIN);
  pipeline.tds = map(tdsRaw, 0, 4095, 0, 2000);

  int turbidityRaw = analogRead(TURBIDITY_SENSOR_PIN);
  pipeline.turbidity = (turbidityRaw / 4095.0) * 100.0;

  int phRaw = analogRead(PH_SENSOR_PIN);
  pipeline.ph = (phRaw / 4095.0) * 14.0;
}

// Flow sensor read
float readFlowSensor(int pin) {
  int rawValue = analogRead(pin);
  float voltage = (rawValue / 4095.0) * 5.0;
  float flow = (voltage / 5.0) * 100.0;

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

void calculatePressure() {
  float flowLPerMin = scada.flow1;
  float Q = flowLPerMin / (1000.0 * 60.0);
  float A = 3.14159 * (PIPE_DIAMETER / 2.0) * (PIPE_DIAMETER / 2.0);
  float v = Q / A;
  float pressurePa = 0.5 * RHO * v * v;
  scada.pressure = pressurePa / 100000.0;

  if (scada.pressure < 0) scada.pressure = 0;
  if (scada.pressure > 20) scada.pressure = 20;
}

// ============================================================================
// SEND SCADA DATA TO FIREBASE
// ============================================================================
void sendScadaData() {
  if (!Firebase.ready()) return;

  FirebaseJson json;
  json.set("flow1", (double)scada.flow1);
  json.set("flow2", (double)scada.flow2);
  json.set("level", (double)scada.level);
  json.set("pump", scada.pump);
  json.set("mode", scada.mode);
  json.set("pressure", (double)scada.pressure);
  json.set("valve", scada.valve);
  json.set("timestamp", getTimestamp());

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

  FirebaseJson json;
  json.set("tds", (int)pipeline.tds);
  json.set("turbidity", (double)pipeline.turbidity);
  json.set("ph", (double)pipeline.ph);
  json.set("timestamp", getTimestamp());

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

  if (Firebase.RTDB.getInt(&fbdo, "/SCADA_DATA/pump")) {
    int pumpCmd = fbdo.intData();
    if (pumpCmd != scada.pump) {
      scada.pump = pumpCmd;
      digitalWrite(PUMP_RELAY_PIN, pumpCmd ? HIGH : LOW);
      Serial.print("→ Pump command: ");
      Serial.println(pumpCmd ? "START" : "STOP");
    }
  }

  if (Firebase.RTDB.getInt(&fbdo, "/SCADA_DATA/valve")) {
    int valveCmd = fbdo.intData();
    if (valveCmd != scada.valve) {
      scada.valve = valveCmd;
      digitalWrite(VALVE_RELAY_PIN, valveCmd ? HIGH : LOW);
      Serial.print("→ Valve command: ");
      Serial.println(valveCmd ? "OPEN" : "CLOSED");
    }
  }

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
