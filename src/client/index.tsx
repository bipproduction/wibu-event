'use client'
import React from "react";
import { hookstate, useHookstate } from '@hookstate/core';
import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase, onChildChanged, ref, set } from "firebase/database";
import { decode } from "js-base64";
import { useEffect, useMemo } from "react";

type Event = {
  id: string;
  val: any;
};

const remoteState = hookstate<Event | null>(null);
const localState = hookstate<Event | null>(null);

const useRemote = () => {
  const state = useHookstate(remoteState);
  return [state.value, state.set] as const;
}

const useLocal = () => {
  const state = useHookstate(localState);
  return [state.value, state.set] as const;
}

const useFirebaseApp = (config: string) => {
  return useMemo(() => {
    const appConfig = JSON.parse(decode(config));
    if (getApps().length === 0) {
      return initializeApp(appConfig);
    }
    return getApp();
  }, [config]);
};

const useDatabase = (config: string) => {
  const app = useFirebaseApp(config);
  return useMemo(() => getDatabase(app), [app]);
};

function useSubscribeToEvents(database: ReturnType<typeof getDatabase>, projectId: string, listSubscribe: string[]) {
  const [, setRemoteVal] = useRemote();

  useEffect(() => {
    listSubscribe.forEach((subscribe) => {
      const dbRef = ref(database, `wibu/${projectId}/${subscribe}`);
      onChildChanged(dbRef, (snapshot) => {
        setRemoteVal({ id: subscribe, val: snapshot.val() });
      });
    });
  }, [database, projectId, listSubscribe, setRemoteVal]);
}

function useSyncLocalEvent(database: ReturnType<typeof getDatabase>, projectId: string) {
  const [localVal] = useLocal();

  useEffect(() => {
    if (localVal) {
      const dbRef = ref(database, `wibu/${projectId}/${localVal.id}`);
      set(dbRef, { data: localVal.val });
    }
  }, [database, projectId, localVal]);
}

/**
 * # keterangan
 * ### PARAMETER
 * - `config`: config adalah string parameter dari .env yang berasal dari hasil encrypt firebase config menggunakan jf-base64.  
 * contoh:  
 * ```tsx 
 *    const { EVENT_SERVICE_ACCOUNT_CLIENT }: Record<ENV, string> = process.env as any
 * ```
 * - peojectId: adalah id unik untuk setiap project
 * - listSubscribe: list subscribe yang akan di subscribe, tambahkan sesuai dengan kebutuhan
 * ### CONTOH PENGGUNAAN
 * ```tsx
 *    import { useEventClient } from "wibu-event/client"
 *    ...ReactComponent(){...
 *    const [val, setVal] = useEventClient()
 * ```
 * 
 */
function EventProvider({ children, config, projectId, listSubscribe }: { children: React.ReactNode, config: string, projectId: string, listSubscribe: string[] }) {
  const database = useDatabase(config);

  useSubscribeToEvents(database, projectId, listSubscribe);
  useSyncLocalEvent(database, projectId);

  return <div>{children}</div>;
}

function useEventClient() {
  const [remoteVal] = useRemote();
  const [, setLocalVal] = useLocal();
  return [remoteVal, setLocalVal] as const;
}

export { EventProvider, useEventClient };
