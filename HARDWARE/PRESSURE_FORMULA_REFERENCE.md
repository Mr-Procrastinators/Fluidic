# Pressure Calculation Formula - Quick Reference

## The Formula (Used Everywhere)

```
┌─────────────────────────────────────────────────────────────────┐
│                  BERNOULLI PRINCIPLE                            │
│                                                                 │
│  Step 1: Convert Flow to Volumetric Rate                       │
│          Q = flow (L/min) / (1000 * 60)                        │
│          Q = flow / 60000  [m³/s]                              │
│                                                                 │
│  Step 2: Calculate Cross-Sectional Area                        │
│          A = π * (diameter / 2)²                               │
│          A = π * (0.02 / 2)²                                   │
│          A = π * (0.01)²                                       │
│          A = 3.14159 * 0.0001                                  │
│          A ≈ 3.14159e-4  [m²]                                  │
│                                                                 │
│  Step 3: Calculate Velocity                                    │
│          v = Q / A  [m/s]                                      │
│                                                                 │
│  Step 4: Apply Bernoulli (Dynamic Pressure)                    │
│          P = 0.5 * ρ * v²  [Pa]                                │
│          where ρ = 1000 kg/m³ (water density)                  │
│                                                                 │
│  Step 5: Convert to Bar                                        │
│          P (bar) = P (Pa) / 100000                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Constants (Fixed)

| Constant | Symbol | Value | Unit |
|----------|--------|-------|------|
| Pipe Diameter | d | 0.02 | m (20 mm) |
| Water Density | ρ (rho) | 1000 | kg/m³ |
| Pascal to Bar | - | 100,000 | Pa/bar |

---

## Examples

### Example 1: Flow = 45.2 L/min

```
Q = 45.2 / 60000 = 0.000753 m³/s
A = 3.14159e-4 m²
v = 0.000753 / 3.14159e-4 = 2.4 m/s
P = 0.5 * 1000 * 2.4² = 2880 Pa
P = 2880 / 100000 = 0.0288 bar ≈ 0.03 bar
```

### Example 2: Flow = 10 L/min

```
Q = 10 / 60000 = 0.000167 m³/s
A = 3.14159e-4 m²
v = 0.000167 / 3.14159e-4 = 0.53 m/s
P = 0.5 * 1000 * 0.53² = 140 Pa
P = 140 / 100000 = 0.0014 bar ≈ 0.00 bar
```

### Example 3: Flow = 100 L/min

```
Q = 100 / 60000 = 0.00167 m³/s
A = 3.14159e-4 m²
v = 0.00167 / 3.14159e-4 = 5.3 m/s
P = 0.5 * 1000 * 5.3² = 14,045 Pa
P = 14,045 / 100000 = 0.14 bar
```

---

## Implementations

### C++ (ESP32 - HARDWARE.ino)

```cpp
void calculatePressure() {
  float flowLPerMin = scada.flow1;
  float Q = flowLPerMin / (1000.0 * 60.0);
  float A = 3.14159 * (PIPE_DIAMETER / 2.0) * (PIPE_DIAMETER / 2.0);
  float v = Q / A;
  float pressurePa = 0.5 * RHO * v * v;
  scada.pressure = pressurePa / 100000.0;
}

// Constants defined as:
const float PIPE_DIAMETER = 0.02;
const float RHO = 1000;
```

### Python (GA-VMD - utils.py)

```python
def flow_to_pressure(flow_array, diameter=0.02):
    rho = 1000
    A = math.pi * (diameter**2) / 4
    
    pressure = []
    for flow in flow_array:
        Q = flow / (1000 * 60)
        v = Q / A
        P = 0.5 * rho * v**2
        pressure.append(P)  # Returns in Pascals
    
    return np.array(pressure)
```

### JavaScript (React - Displays Pre-calculated)

```typescript
// Pressure is sent by ESP32 in bar
const scada = useScadaData();
console.log(scada.pressure); // Already in bar, no calculation needed
```

---

## Verification Across Systems

✅ **ESP32 calculates**: Flow → Pressure (sent to Firebase as `pressure` field)  
✅ **GA-VMD calculates**: Flow → Pressure (used internally in VMD)  
✅ **Website receives**: Pre-calculated pressure from ESP32  

All three use **identical formula and constants**.

---

## Physical Meaning

**Pressure** here represents **dynamic pressure** from flowing fluid:
- The "push" caused by fluid motion
- NOT static pressure (like water depth)
- Based on kinetic energy: **KE = 0.5 × m × v² → Pressure = 0.5 × ρ × v²**

For water flowing through a 20mm pipe:
- **~1 L/min** = ~0.00001 bar (negligible)
- **~10 L/min** = ~0.001 bar
- **~50 L/min** = ~0.03 bar
- **~100 L/min** = ~0.14 bar

---

## Why This Formula?

1. **Conservation of Energy**: Bernoulli's principle from fluid dynamics
2. **No Sensor Needed**: Calculated purely from flow measurement
3. **Physics-based**: Works for incompressible fluids (water)
4. **Real-time**: Instant pressure availability
5. **Consistent**: Same calculation in all three systems

---

**Last Updated**: March 31, 2026
