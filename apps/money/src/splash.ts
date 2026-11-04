/** Lets the opening breath (in index.html) finish and fade away, now the app is ready to show. */
export function hideSplash(): void {
  const done = (window as unknown as { breatheSplashDone?: () => void }).breatheSplashDone;
  if (typeof done === "function") done();
}

/** Remembers light or dark (only that word), so the next opening screen starts in the right colour. */
export function rememberAppearance(appearance: string): void {
  try {
    if (appearance === "light" || appearance === "dark") localStorage.setItem("breathe-appearance", appearance);
    else localStorage.removeItem("breathe-appearance");
  } catch {
    // Not available (for example a private window). The opening screen just follows the device.
  }
}
