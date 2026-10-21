import firebase_admin
from firebase_admin import credentials, db

cred = credentials.Certificate("D:\\VS\\Fluidic\\GA-VMD\\serviceAccountKey.json")

firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com/'
})

ref = db.reference('/gavmd_result')

ref.set({
    "status": "TEST",
    "flow": 10
})

print("DONE")