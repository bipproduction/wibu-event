import dotenv from "dotenv";
import admin from "firebase-admin";
import { decode } from "js-base64";
dotenv.config();

const EVENT_SERVICE_ACCOUNT_SERVER = process.env.EVENT_SERVICE_ACCOUNT_SERVER!;
const EVENT_DATABASE_URL = process.env.EVENT_DATABASE_URL!;

if (!EVENT_SERVICE_ACCOUNT_SERVER || !EVENT_DATABASE_URL) {
  throw new Error(
    "EVENT_SERVICE_ACCOUNT_SERVER or EVENT_DATABASE_URL not found"
  );
}

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      decode(EVENT_SERVICE_ACCOUNT_SERVER as string)
    );
    const databaseURL = decode(EVENT_DATABASE_URL as string);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL,
    });
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw error;
  }
}

const realtimeDB = admin.database();

// Cache untuk menyimpan listener yang sudah diinisialisasi
const listenerCache: Record<string, boolean> = {};

function eventServer<T>({ projectId }: { projectId: string }) {
  function set<T>(subscribe: T, data: T, onSuccess?: () => void) {
    const ref = realtimeDB.ref(`wibu/${projectId}/${subscribe}`);
    ref.set({ data }, (err) => {
      if (err) {
        console.log("Error setting value:", err);
        return;
      }
      onSuccess?.();
    });
  }

  function onChange<T>(subscribe: T, event: (val: T) => void) {
    const refPath = `wibu/${projectId}/${subscribe}`;

    // Cek jika listener sudah ada, jika sudah, skip
    if (listenerCache[refPath]) {
      return;
    }

    const ref = realtimeDB.ref(refPath);

    ref.on("child_changed", (snapshot) => {
      event(snapshot.val());
    });

    // Tandai listener sebagai sudah diinisialisasi
    listenerCache[refPath] = true;

    // Return a cleanup function to remove the listener
    return () => {
      ref.off("child_changed");
      delete listenerCache[refPath]; // Hapus dari cache saat listener dilepas
    };
  }

  return { onChange, set };
}

export { eventServer };
