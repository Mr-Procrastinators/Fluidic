import { database } from "@/lib/firebase";
import { ref, update } from "firebase/database";

export const resolveAlert = async (id: string) => {
  const alertRef = ref(database, `alerts/${id}`);
  await update(alertRef, {
    status: "resolved",
  });
};