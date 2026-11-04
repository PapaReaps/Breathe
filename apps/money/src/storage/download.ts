import { isNativeApp } from "../platform";

/**
 * Hands a backup file to the person. Nothing is uploaded anywhere by Breathe.
 *
 * - In a web browser: the browser's own download.
 * - In the Android app: the file is written to the app's private cache, then Android's
 *   share sheet opens so the person chooses where to keep it (Files, Drive, and so on).
 *   Older copies in the cache are tidied away first, so backups don't pile up there.
 *
 * Choosing not to share (closing the sheet) is not a problem, so it never throws for that.
 */
export async function downloadTextFile(fileName: string, content: string): Promise<void> {
  if (isNativeApp()) {
    await shareFromApp(fileName, content);
    return;
  }
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before letting go of the file.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function shareFromApp(fileName: string, content: string): Promise<void> {
  const { Directory, Encoding, Filesystem } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");

  try {
    const old = await Filesystem.readdir({ path: "", directory: Directory.Cache });
    for (const file of old.files) {
      if (file.name.endsWith(".breathe-backup.json")) {
        await Filesystem.deleteFile({ path: file.name, directory: Directory.Cache }).catch(() => undefined);
      }
    }
  } catch {
    // Nothing to tidy.
  }

  const written = await Filesystem.writeFile({
    path: fileName,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  try {
    await Share.share({ title: fileName, files: [written.uri], dialogTitle: "Keep your backup file somewhere safe" });
  } catch (problem) {
    // Closing the share sheet without choosing anywhere is fine.
    if (problem instanceof Error && /cancel/i.test(problem.message)) return;
    throw problem;
  }
}
