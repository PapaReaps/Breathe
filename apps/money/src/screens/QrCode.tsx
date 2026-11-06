import qrcode from "qrcode-generator";

/**
 * A QR code drawn on the phone itself: no internet, nothing sent anywhere.
 * Always dark squares on a white card, in light and dark mode, so every camera can read it.
 */
export function qrSquares(text: string): { size: number; path: string } {
  const code = qrcode(0, "M");
  code.addData(text);
  code.make();
  const size = code.getModuleCount();
  let path = "";
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (code.isDark(row, col)) path += `M${col} ${row}h1v1h-1z`;
    }
  }
  return { size, path };
}

export function QrCode({ text, label }: { text: string; label: string }) {
  const { size, path } = qrSquares(text);
  return (
    <div className="qr-card">
      <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} role="img" aria-label={label} shapeRendering="crispEdges">
        <rect x={-2} y={-2} width={size + 4} height={size + 4} fill="#ffffff" />
        <path d={path} fill="#000000" />
      </svg>
    </div>
  );
}
