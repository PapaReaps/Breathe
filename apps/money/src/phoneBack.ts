import { isNativeApp } from "./platform";

/**
 * In the Android app, the phone's own Back (button or swipe) steps back one page,
 * just like the Back button at the top of each page. It reaches the open panel as a
 * "cancel", the same as pressing Escape on a computer, and each panel decides where
 * that goes. With nothing open, Back tucks Breathe away (it stays as you left it).
 */
export async function listenForPhoneBack(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { App } = await import("@capacitor/app");
    await App.addListener("backButton", () => {
      // Anything open that isn't a panel (the app picker) closes first, by cancelling this event.
      if (!window.dispatchEvent(new Event("breathe:back", { cancelable: true }))) return;
      const open = [...document.querySelectorAll<HTMLDialogElement>("dialog[open]")];
      const top = open[open.length - 1];
      if (top) {
        const asked = new Event("cancel", { cancelable: true });
        if (top.dispatchEvent(asked)) top.close();
        return;
      }
      void App.minimizeApp();
    });
  } catch {
    // Without it, Android's usual Back still works.
  }
}
