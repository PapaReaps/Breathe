import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { APK_DOWNLOAD, WEB_ADDRESS } from "../src/screens/ShareView";
import { qrSquares } from "../src/screens/QrCode";

const appDir = fileURLToPath(new URL("../", import.meta.url));

describe("Share Breathe Money", () => {
  it("the one-tap Android link is a file every release uploads", () => {
    expect(APK_DOWNLOAD).toBe("https://github.com/PapaReaps/Breathe/releases/latest/download/breathe-money.apk");
    const recipe = readFileSync(appDir + "../../.github/workflows/android.yml", "utf8");
    expect(recipe).toContain('"../out/breathe-money.apk"');
    expect(recipe).toContain("gh release create \"$tag\" out/*.apk");
  });

  it("draws a proper QR code for both links, made on the phone", () => {
    for (const link of [APK_DOWNLOAD, WEB_ADDRESS]) {
      const { size, path } = qrSquares(link);
      // QR codes are 21, 25, 29... squares across, with a solid finder square in the top-left corner.
      expect((size - 17) % 4).toBe(0);
      expect(size).toBeGreaterThanOrEqual(21);
      for (let i = 0; i < 7; i += 1) expect(path).toContain(`M${i} 0h1v1h-1z`);
    }
  });
});
