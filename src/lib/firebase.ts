import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, DataSnapshot } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC7_ZzH47dX90dP4Ew0sPGL5CbgtCGZenU",
  databaseURL: "https://pipeline-fault-detecting-syste-default-rtdb.firebaseio.com",
  projectId: "pipeline-fault-detecting-syste",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, onValue, set };
export type { DataSnapshot };
