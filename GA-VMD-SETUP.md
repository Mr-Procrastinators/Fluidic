# GA-VMD Integration Guide

## Overview

The GA-VMD (Genetic Algorithm + Variational Mode Decomposition) algorithm is a sophisticated leak detection system for water pipelines. It runs independently from the React dashboard and communicates through Firebase Realtime Database.

---

## Directory Structure

```
GA-VMD/
├── main.py                    # Main algorithm execution
├── config.py                  # Configuration parameters
├── utils.py                   # Signal processing utilities
├── serviceAccountKey.json     # Firebase authentication (create this)
└── __pycache__/              # Python cache
```

---

## Installation

### 1. Install Python Dependencies

```bash
cd GA-VMD

# Install required packages
pip install vmdpy pygad numpy firebase-admin scipy
```

### 2. Firebase Service Account Key

The GA-VMD script needs `serviceAccountKey.json` to authenticate with Firebase:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: **pipeline-fault-detecting-syste**
3. Go to Settings → Service Accounts → Firebase Admin SDK
4. Click "Generate New Private Key"
5. Save the JSON file as `GA-VMD/serviceAccountKey.json`

⚠️ **IMPORTANT**: This file contains credentials. Never commit to Git!

---

## Configuration

Edit `GA-VMD/config.py` to customize:

```python
PIPE_LENGTH = 100           # Total pipe length in meters
WAVE_SPEED = 1000           # Acoustic wave speed in m/s (adjust based on pipe material)
SAMPLING_RATE = 10          # Sensor samples per second
L = PIPE_LENGTH             # Starting point for calculation
```

### Calibration

For accuracy, calibrate `WAVE_SPEED` based on your pipe type:

| Pipe Material | Typical Wave Speed |
|---------------|-------------------|
| PVC           | 400-600 m/s       |
| Copper        | 800-1200 m/s      |
| Cast Iron     | 1000-1400 m/s     |
| Steel         | 1200-1600 m/s     |
| HDPE          | 300-500 m/s       |

---

## Algorithm Flow

### Phase 1: Training (First 100 samples)

```
1. Collect flow measurements from Firebase (/pipeline/flow)
2. Wait for 100 samples (default: ~100 seconds at 1Hz)
3. Prepare signal:
   - Convert flow data to pressure equivalent
   - Create dual signal (x1, x2) for comparison
```

### Phase 2: Genetic Algorithm Optimization

```
1. Run GA for 10 generations
2. GA optimizes 2 parameters:
   - K: Number of VMD components (range: 2-8)
   - alpha: VMD penalty parameter (range: 500-2500)
3. Fitness function:
   - Decomposes signal using VMD
   - Tests correlation with secondary signal
   - Minimizes decomposition entropy
4. Output: Best K and alpha parameters
```

### Phase 3: Real-Time Monitoring

```
Loop continuously:
  1. Read flow from Firebase
  2. Apply VMD decomposition with optimal parameters
  3. Analyze decomposed components:
     - Extract clean signal (sum of IMFs)
     - Calculate standard deviation
  4. Leak detection:
     - If std_dev > 0.5 → LEAK
     - Otherwise → NORMAL
  5. Leak localization (if leak detected):
     - Calculate time delay between signals
     - Convert delay to distance: L1 = 0.5 * (L + c * dt)
     - Convert to latitude/longitude using start coordinates
  6. Send results to Firebase (/results):
     {
       "status": "LEAK" || "NORMAL",
       "location_m": distance in meters,
       "latitude": calculated latitude,
       "longitude": calculated longitude,
       "flow": current flow rate,
       "timestamp": current Unix timestamp
     }
  7. Wait 1 second, repeat
```

---

## Running GA-VMD

### Method 1: Standalone Execution

```bash
cd GA-VMD
python main.py
```

Output:
```
⏳ Collecting data for GA training...
1/100 → 9.87
2/100 → 10.23
...
100/100 → 10.05
✅ Data ready!

🔧 Running GA...
Generation 0/10: [Best fitness: -2.34]
Generation 1/10: [Best fitness: -2.28]
...
Generation 10/10: [Best fitness: -1.95]
✅ GA Done
Best K: 5
Best alpha: 1234.5

🚀 Starting Monitoring...
Flow: 10.05
Status: NORMAL
Location (m): 45.23
Lat: 26.8489 Lon: 80.9523

Flow: 9.98
Status: LEAK
Location (m): 62.15
Lat: 26.8509 Lon: 80.9547
...
```

### Method 2: Continuous Background Process (Linux/Mac)

```bash
nohup python GA-VMD/main.py > ga-vmd.log 2>&1 &
```

### Method 3: Windows Background Service

Create `run_gavmd.bat`:
```batch
@echo off
cd D:\VS\Fluidic\GA-VMD
python main.py > ga-vmd.log 2>&1
pause
```

Run as scheduled task or in background terminal.

---

## Monitoring Output

### Firebase `/results` Node Structure

The algorithm updates this structure every 1-2 seconds:

```json
{
  "status": "NORMAL",           // "NORMAL" or "LEAK"
  "location_m": 45.5,           // Distance from pipe start
  "latitude": 26.8485,          // GPS latitude
  "longitude": 80.9512,         // GPS longitude
  "flow": 10.2,                 // Current flow rate L/min
  "timestamp": 1711857848       // Unix timestamp
}
```

### React Dashboard Updates

The **GA-VMD Logs** page (`/logs`) automatically:
1. Listens to `/results` in Firebase
2. Displays latest result in hero card
3. Shows metrics: Status, Flow, Distance, Live indicator
4. Logs last 100 detection events in a table
5. Updates in real-time as algorithm runs

---

## Troubleshooting

### 1. "No module named 'vmdpy'"

```bash
pip install --upgrade vmdpy
```

### 2. "Firebase authentication failed"

- Check `serviceAccountKey.json` exists in GA-VMD folder
- Verify Firebase credentials are valid
- Check Firebase database URL in `main.py`:
  ```python
  'databaseURL': 'https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com/'
  ```

### 3. "Waiting for flow data forever"

Make sure ESP32 is sending data to Firebase (`/pipeline/flow`). Check in React Dashboard if flow sensors are updating.

If no real data, the script will use mock data (with warning):
```
⚠️ Using mock data
```

### 4. "GA fitness function returning -1e9"

The decomposed signal quality is poor. Try:
- Adjust `WAVE_SPEED` in `config.py`
- Increase correlation threshold in fitness function
- Ensure input signal is valid (not all zeros)

### 5. Results showing "location_m: 0" or NaN

The delay calculation is finding zero difference. Likely:
- Signal quality too poor
- Pipe length configured incorrectly
- Wave speed needs calibration

---

## Parameter Tuning

### For Better Leak Detection

**Increase sensitivity** (more false positives, catches smaller leaks):
```python
# In main.py, line ~150
is_leak = np.std(clean_signal) > 0.3  # Lower threshold
```

**Decrease sensitivity** (fewer false positives):
```python
is_leak = np.std(clean_signal) > 0.8  # Higher threshold
```

### For Better Localization

**Fine-tune wave speed**:
- If estimated distances are too far: increase WAVE_SPEED
- If estimated distances are too near: decrease WAVE_SPEED

**Adjust pipe length**:
```python
# In config.py
PIPE_LENGTH = 150  # Adjust to actual pipe length
```

---

## Integration with Hardware (ESP32)

When you provide the ESP32 code later, ensure it:

1. **Sends flow data** to Firebase `/pipeline/flow` (1-2 Hz)
2. **Reads commands** from Firebase `/SCADA_DATA`
3. **Synchronizes time** via NTP

The GA-VMD script will automatically:
- Use real sensor data instead of mock data
- Improve leak detection accuracy
- Provide precise location estimates

---

## Performance Metrics

Typical execution times:
- **Training phase**: 100-120 seconds (100 samples @ 1 Hz)
- **GA optimization**: 30-60 seconds (10 generations × 0.3-6s per fitness evaluation)
- **Real-time analysis**: 0.1-0.5 seconds per loop iteration

Total startup time: ~2-3 minutes before real-time monitoring begins.

---

## Research Paper

The algorithm is based on:
- **Variational Mode Decomposition**: Analyzing intrinsic modes
- **Genetic Algorithm**: Parameter optimization
- **Time-delay Analysis**: Leak localization

See the research paper in the `GA-VMD/` directory for detailed methodology.

---

## Next Steps

1. ✅ GA-VMD script ready (Python)
2. ⏳ ESP32 hardware code (you will provide)
3. ⏳ Real sensor calibration
4. ⏳ Live GPS integration with Live Map
5. ⏳ Email/SMS alerts on leak detection

---

**Status**: GA-VMD algorithm setup complete, awaiting hardware integration.

**Last Updated**: March 31, 2026
