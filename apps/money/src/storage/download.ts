/** Hands a text file to the browser's own download. Nothing is uploaded anywhere. */
export function downloadTextFile(fileName: string, content: string): void {
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
