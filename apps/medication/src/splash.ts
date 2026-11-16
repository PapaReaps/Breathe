/** Lets the opening breath (in index.html) finish and float away, now the app is ready to show. */
export function hideSplash(): void {
  const done = (window as unknown as { breatheSplashDone?: () => void }).breatheSplashDone;
  if (typeof done === "function") done();
}
