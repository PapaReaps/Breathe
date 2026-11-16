import { useCallback, useEffect, useRef, useState } from "react";
import { EMPTY, readSaved, type MedicationData } from "../logic/medicines";
import { indexedDbStore, type DeviceStore } from "./deviceStore";

export interface Medications {
  data: MedicationData;
  loading: boolean;
  /** The last save didn't work (for example a private window). */
  notSaved: boolean;
  /** What was saved earlier couldn't be read, so it started fresh. */
  readProblem: boolean;
  update: (change: (data: MedicationData) => MedicationData) => void;
}

/** Loads the medicines once, then saves every change straight away. Nothing leaves the device. */
export function useMedications(store: DeviceStore = indexedDbStore): Medications {
  const [data, setData] = useState<MedicationData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [notSaved, setNotSaved] = useState(false);
  const [readProblem, setReadProblem] = useState(false);
  const latest = useRef(data);

  useEffect(() => {
    let live = true;
    store.load().then(
      (raw) => {
        if (!live) return;
        const read = raw === null ? EMPTY : readSaved(raw);
        latest.current = read;
        setData(read);
        setLoading(false);
        void store.requestPersistence();
      },
      () => {
        if (!live) return;
        setReadProblem(true);
        setLoading(false);
      },
    );
    return () => {
      live = false;
    };
  }, [store]);

  const update = useCallback(
    (change: (data: MedicationData) => MedicationData) => {
      const next = change(latest.current);
      latest.current = next;
      setData(next);
      store.save(next).then(
        () => setNotSaved(false),
        () => setNotSaved(true),
      );
    },
    [store],
  );

  return { data, loading, notSaved, readProblem, update };
}
