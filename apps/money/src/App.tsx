import { useEffect } from "react";
import { registerServiceWorker } from "./registerServiceWorker";
import CalculatorScreen from "./screens/CalculatorScreen";

export default function App() {
  useEffect(() => {
    // Only in the published app, so the developer view never keeps old copies of files.
    if (import.meta.env.PROD) registerServiceWorker(`${import.meta.env.BASE_URL}sw.js`);
  }, []);
  return <CalculatorScreen />;
}
