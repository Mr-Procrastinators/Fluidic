# FLUIDIC System - Quick Reference Card

## 🚀 Getting Started (Copy-Paste Commands)

### Start React Dashboard
```bash
cd D:\VS\Fluidic
npm run dev
```
→ Open http://localhost:8081

### Start GA-VMD Algorithm
```bash
cd D:\VS\Fluidic\GA-VMD
python main.py
```

### Build for Production
```bash
cd D:\VS\Fluidic
npm run build
```

---

## 📍 Navigation Map

| Page | URL | Purpose | Data Source |
|------|-----|---------|-------------|
| Dashboard | / | System overview | Firebase SCADA_DATA |
| Analytics | /analytics | Trend analysis | Firebase SCADA_DATA |
| Alerts | /alerts | Event history | Firebase alerts |
| Live Map | /map | 7 sensors + GPS | Firebase pipeline |
| Control | /control | Pump & Valve relay | Firebase SCADA_DATA |
| GA-VMD Logs | /logs | Leak detection | Firebase results |

---

## 🔄 Data Flow Summary

```
HARDWARE (ESP32) → Firebase SCADA_DATA → React Dashboard (All Pages)
React Dashboard → Firebase SCADA_DATA → ESP32 (Pump/Valve Control)
GA-VMD Algorithm → Firebase /results → GA-VMD Logs Page
```

---

## 📊 Firebase Data Nodes

```
/SCADA_DATA
  ├── flow1: L/min
  ├── flow2: L/min
  ├── pressure: bar
  ├── level: %
  ├── pump: 0/1
  ├── valve: 0/1
  └── mode: "AUTO"/"MANUAL"

/pipeline
  ├── tds: ppm
  ├── turbidity: NTU
  ├── ph: float
  └── flow: L/min

/results (GA-VMD Output)
  ├── status: "NORMAL"/"LEAK"
  ├── location_m: meters
  ├── latitude: GPS
  ├── longitude: GPS
  ├── flow: L/min
  └── timestamp: Unix
```

---

## 🎛️ Control Panel Commands

| Control | Firebase Path | Values | Effect |
|---------|---------------|--------|--------|
| Start Pump | `/SCADA_DATA/pump` | 1 | Pump ON |
| Stop Pump | `/SCADA_DATA/pump` | 0 | Pump OFF |
| Open Valve | `/SCADA_DATA/valve` | 1 | Valve OPEN |
| Close Valve | `/SCADA_DATA/valve` | 0 | Valve CLOSED |
| Auto Mode | `/SCADA_DATA/mode` | "AUTO" | Auto control |
| Manual Mode | `/SCADA_DATA/mode` | "MANUAL" | Manual control |

---

## 🔧 GA-VMD Parameters

Edit `GA-VMD/config.py`:

```python
PIPE_LENGTH = 100      # Change to your pipe length (meters)
WAVE_SPEED = 1000      # Calibrate for your pipe material (300-1600)
SAMPLING_RATE = 10     # Samples per second
```

**Common WAVE_SPEED Values**:
- PVC: 500 m/s
- Copper: 1000 m/s
- Steel: 1300 m/s
- HDPE: 400 m/s

---

## 🛠️ File Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| React App | src/ | Frontend dashboard |
| GA-VMD Algo | GA-VMD/main.py | Leak detection |
| Config | GA-VMD/config.py | Algorithm parameters |
| Firebase Init | src/lib/firebase.ts | Firebase connection |
| Hooks | src/hooks/ | Data sync functions |
| Pages | src/pages/ | All page components |
| Docs | *.md files in root | Guides & setup |

---

## ✅ Verification Checklist

### React Working?
- [ ] npm run dev starts without errors
- [ ] http://localhost:8081 loads
- [ ] All pages accessible from sidebar
- [ ] GA-VMD Logs page exists

### Firebase Connected?
- [ ] Dashboard shows metrics (even if zero)
- [ ] Clicking "Start Pump" updates Firebase
- [ ] Control Panel responds to commands
- [ ] All pages update in sync

### GA-VMD Ready?
- [ ] Python 3.8+ installed
- [ ] Dependencies installed (vmdpy, pygad, numpy, firebase-admin)
- [ ] serviceAccountKey.json exists in GA-VMD/
- [ ] `python main.py` runs without import errors

### Hardware (When Ready)?
- [ ] ESP32 code compiles
- [ ] ESP32 connects to WiFi
- [ ] Sensor data flows to Firebase
- [ ] Commands are executed
- [ ] Real data updates dashboard

---

## 🐛 Quick Fixes

| Issue | Solution |
|-------|----------|
| npm not found | Install Node.js from nodejs.org |
| Firebase auth error | Check API key in src/lib/firebase.ts |
| GA-VMD import error | Run `pip install -r requirements.txt` |
| Port 8081 in use | Change in vite.config.ts or kill process on port 8080 |
| No sensor data | Start ESP32 code or check Firebase database |
| GA-VMD waiting forever | Ensure flow data exists at /pipeline/flow |
| Pages not loading | Check browser console for errors (F12) |

---

## 📱 Browser Support

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (tested on Android Chrome)

---

## 🔐 Credentials (Do Not Share)

- Firebase API Key: In src/lib/firebase.ts (okay to share)
- Firebase Database URL: https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com/
- GA-VMD Service Key: GA-VMD/serviceAccountKey.json **KEEP SECRET**
- ESP32 WiFi Password: **KEEP IN HARDWARE ONLY**

---

## 📞 Support Resources

**For React Issues**:
- Check `npm run dev` terminal for error messages
- Open browser F12 → Console tab for JavaScript errors
- Read FIREBASE_INTEGRATION.md

**For GA-VMD Issues**:
- Check GA-VMD terminal output
- Verify config.py parameters
- Read GA-VMD-SETUP.md

**For Hardware Issues**:
- Refer to ESP32_INTEGRATION.md template
- Check Arduino IDE serial monitor for responses
- Verify Firebase connectivity

---

## 📈 Performance Tips

| Task | Optimization |
|------|-------------|
| Reduce Firebase queries | Data already real-time synced |
| Speed up GA-VMD | Reduce generations (default: 10) |
| Faster dashboard | Already optimized with Vite |
| Lighter database | Only store last 100 logs |

---

## 🎯 Typical Workflow

1. **Development**
   ```bash
   npm run dev
   # Develop locally with hot reload
   ```

2. **Testing GA-VMD**
   ```bash
   python GA-VMD/main.py
   # Watch logs page update in real-time
   ```

3. **Hardware Integration**
   ```cpp
   // Upload your ESP32 code
   // Watch sensors appear in Control Panel
   ```

4. **Production Deployment**
   ```bash
   npm run build
   # Outputs optimized files
   ```

---

## 🎓 Learning Resources

- [Firebase Realtime DB](https://firebase.google.com/docs/database)
- [React Hooks](https://react.dev/reference/react/hooks)
- [Tailwind CSS](https://tailwindcss.com/)
- [ESP32 Arduino](https://github.com/espressif/arduino-esp32)
- [VMD Algorithm](https://ieeexplore.ieee.org/document/6847066)

---

## "I Want To..."

### Change the logo
→ Edit `src/components/layout/Sidebar.tsx` line with "💧"

### Add more sensor types
→ Update `/SCADA_DATA` in Firebase, add to `src/hooks/useFirebaseData.ts`

### Modify GA-VMD sensitivity
→ Edit `GA-VMD/main.py` line ~150, change threshold value

### Add email alerts
→ Implement Firebase Cloud Functions or add third-party service

### Deploy to the cloud
→ See vite production deployment guides

### Test with mock data
→ GA-VMD already has fallback, Control Panel lets you manually set values

---

## 📅 Version History

| Date | Status | Changes |
|------|--------|---------|
| Mar 31, 2026 | v1.0 | Initial RC with all pages working |
| - | v2.0 | Hardware integration (awaiting ESP32 code) |
| - | v3.0 | Live GPS + email alerts |

---

## 🎉 You're All Set!

**Current Status**: ✅ Frontend Ready | ⏳ Hardware Awaiting

**Next Action**: 
1. Test the app with `npm run dev`
2. Review the detailed guides
3. Prepare your ESP32 code
4. Integrate when hardware is ready!

---

**Last Updated**: March 31, 2026
**Questions?** Refer to SETUP_SUMMARY.md for detailed info
