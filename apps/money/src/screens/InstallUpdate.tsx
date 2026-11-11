import { useState } from "react";
import { words } from "../content/words";

const text = words.settings;

type InstallStep =
  | { step: "ready" }
  | { step: "downloading"; percent: number | null }
  | { step: "needs-permission" }
  | { step: "installing" }
  | { step: "not-downloaded" };

/**
 * "Download and install": the Android code fetches the file from Breathe Money's own GitHub
 * release, checks it, then Android's installer asks the person. The GitHub page stays as a
 * fallback link.
 */
export function InstallUpdate({ apk, page, label, showGithub = true }: { apk: string; page: string; label?: string; showGithub?: boolean }) {
  const [state, setState] = useState<InstallStep>({ step: "ready" });

  const install = async () => {
    const { ApkInstaller } = await import("../apkInstaller");
    const answer = await ApkInstaller.install();
    setState(answer.needsPermission ? { step: "needs-permission" } : { step: "installing" });
  };

  const downloadAndInstall = async () => {
    setState({ step: "downloading", percent: null });
    const { ApkInstaller } = await import("../apkInstaller");
    const listener = await ApkInstaller.addListener("progress", ({ percent }) => setState({ step: "downloading", percent }));
    try {
      await ApkInstaller.download({ url: apk });
      await install();
    } catch {
      setState({ step: "not-downloaded" });
    } finally {
      void listener.remove();
    }
  };

  const openPermission = async () => {
    const { ApkInstaller } = await import("../apkInstaller");
    await ApkInstaller.openInstallSettings();
  };

  return (
    <div aria-live="polite">
      {state.step === "downloading" ? <p>{text.updatesDownloading(state.percent)}</p> : null}
      {state.step === "installing" ? <p>{text.updatesInstalling}</p> : null}
      {state.step === "not-downloaded" ? <p>{text.updatesNotDownloaded}</p> : null}
      {state.step === "needs-permission" ? (
        <>
          <p>{text.updatesPermission}</p>
          <div className="buttons">
            <button type="button" className="secondary" onClick={() => void openPermission()}>
              {text.updatesOpenPermission}
            </button>
            <button type="button" onClick={() => void install().catch(() => setState({ step: "not-downloaded" }))}>
              {text.updatesInstallNow}
            </button>
          </div>
        </>
      ) : null}
      {state.step === "ready" || state.step === "not-downloaded" || state.step === "installing" ? (
        <div className="buttons">
          <button type="button" onClick={() => void downloadAndInstall()}>
            {label ?? text.updatesInstall}
          </button>
        </div>
      ) : null}
      {showGithub ? (
        <p className="small">
          <a href={page} target="_blank" rel="noopener noreferrer">
            {text.updatesOrGithub}
          </a>
        </p>
      ) : null}
    </div>
  );
}
