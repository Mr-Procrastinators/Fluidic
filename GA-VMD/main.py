import numpy as np
from vmdpy import VMD
import pygad
import time
import math

import firebase_admin
from firebase_admin import credentials, db

from utils import *
import config

# ================= FIREBASE SETUP =================
cred = credentials.Certificate("serviceAccountKey.json")

firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com/'
})

ref = db.reference('/pipeline')
result_ref = db.reference('/results')

# ================= PARAMETERS =================
WINDOW_SIZE = 10
flow_buffer = []

# ================= PIPE START LOCATION =================
START_LAT = 26.8467
START_LON = 80.9462

def get_leak_location(L1):
    angle = 0  # change if pipe direction changes

    delta_lat = (L1 * math.cos(math.radians(angle))) / 111320
    delta_lon = (L1 * math.sin(math.radians(angle))) / 111320

    lat = START_LAT + delta_lat
    lon = START_LON + delta_lon

    return lat, lon

# ================= STEP 1: COLLECT DATA =================
print("⏳ Collecting data for GA training...")

while len(flow_buffer) < WINDOW_SIZE:
    try:
        data = ref.get()

        if data and "flow" in data:
            flow = data["flow"]
        else:
            # 🔥 fallback (no ESP32)
            flow = np.random.normal(10, 0.5)
            print("⚠️ Using mock data")

        flow_buffer.append(flow)
        print(f"{len(flow_buffer)}/100 → {flow}")

        time.sleep(1)

    except Exception as e:
        print("Error:", e)
        time.sleep(2)

print("✅ Data ready!")

# ================= PREPARE SIGNAL =================
flow1 = np.array(flow_buffer)
flow2 = np.roll(flow1, 1)

x1 = flow_to_pressure(flow1)
x2 = flow_to_pressure(flow2)

# ================= GA FITNESS =================
def fitness_func(ga, solution, solution_idx):

    K = int(solution[0])
    alpha = solution[1]

    if K < 2:
        return -1e9

    try:
        u, _, _ = VMD(x1, alpha, tau=0, K=K, DC=0, init=1, tol=1e-7)

        valid_imfs = []
        for imf in u:
            if correlation(imf, x2) > 0.3:
                valid_imfs.append(imf)

        if not valid_imfs:
            return -1e9

        reconstructed = np.sum(valid_imfs, axis=0)
        entropy = fuzzy_entropy(reconstructed)

        return -(entropy + 0.01 * K)

    except:
        return -1e9

# ================= RUN GA =================
print("🔧 Running GA...")

ga_instance = pygad.GA(
    num_generations=10,
    num_parents_mating=4,
    fitness_func=fitness_func,
    sol_per_pop=8,
    num_genes=2,
    gene_space=[
        {'low': 2, 'high': 8},
        {'low': 500, 'high': 2500}
    ],
    mutation_num_genes=1
)

ga_instance.run()

solution, _, _ = ga_instance.best_solution()

BEST_K = int(solution[0])
BEST_ALPHA = solution[1]

print("✅ GA Done")
print("Best K:", BEST_K)
print("Best alpha:", BEST_ALPHA)

# ================= REAL-TIME LOOP =================
print("🚀 Starting Monitoring...")

while True:
    try:
        data = ref.get()

        if data and "flow" in data:
            flow = data["flow"]
        else:
            flow = np.random.normal(10, 0.5)

        flow_buffer.append(flow)
        if len(flow_buffer) > WINDOW_SIZE:
            flow_buffer.pop(0)

        print(f"Flow: {flow}")

        if len(flow_buffer) == WINDOW_SIZE:

            x = flow_to_pressure(flow_buffer)

            u, _, _ = VMD(x, BEST_ALPHA, tau=0, K=BEST_K, DC=0, init=1, tol=1e-7)
            clean_signal = np.sum(u, axis=0)

            # 🚨 Leak detection
            is_leak = np.std(clean_signal) > 0.5

            # 📍 Location
            delay = np.argmax(clean_signal) - np.argmax(x)
            delta_t = delay / config.SAMPLING_RATE

            L1 = 0.5 * (config.PIPE_LENGTH + config.WAVE_SPEED * delta_t)

            lat, lon = get_leak_location(L1)

            # 🔥 Send to Firebase
            result_ref.set({
                "status": "LEAK" if is_leak else "NORMAL",
                "location_m": float(L1),
                "latitude": float(lat),
                "longitude": float(lon),
                "flow": float(flow),
                "timestamp": int(time.time())
            })

            print("Status:", "LEAK" if is_leak else "NORMAL")
            print("Location (m):", L1)
            print("Lat:", lat, "Lon:", lon)

        time.sleep(1)

    except Exception as e:
        print("Error:", e)
        time.sleep(2)