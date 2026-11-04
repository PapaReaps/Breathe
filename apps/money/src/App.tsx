import { useEffect } from "react";
import { registerServiceWorker } from "./registerServiceWorker";
import CalculatorScreen from "./screens/CalculatorScreen";
import { isNativeApp } from "./platform";

export default function App() {
  useEffect(() => {
    // Only in the published app, so the developer view never keeps old copies of files.
    // Not in the Android app: its files are already on the phone, and a new version replaces them.
    if (import.meta.env.PROD && !isNativeApp()) registerServiceWorker(`${import.meta.env.BASE_URL}sw.js`);
  }, []);
  return <CalculatorScreen />;
}
