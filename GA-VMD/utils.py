import numpy as np
import math

# STEP 2
def flow_to_pressure(flow_array, diameter=0.02):
    rho = 1000
    A = math.pi * (diameter**2) / 4

    pressure = []
    for flow in flow_array:
        Q = flow / (1000 * 60)
        v = Q / A
        P = 0.5 * rho * v**2
        pressure.append(P)

    return np.array(pressure)

# STEP 3
def correlation(x, y):
    return np.corrcoef(x, y)[0,1]

# STEP 4
def fuzzy_entropy(signal):
    return np.var(signal)