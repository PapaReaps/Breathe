import { useState } from "react";
import { TIP_LINKS, isTipLink } from "../content/support";
import { words } from "../content/words";
import { isNativeApp } from "../platform";

const text = words.tip;

/**
 * "Leave a tip": three amounts. Each opens Stripe's own payment page:
 * over the app on Android (it slides up, and closing it comes straight back here),
 * or in a new tab on the web. Nothing is sent from Breathe itself.
 */
export function TipView() {
  const [opened, setOpened] = useState(false);

  async function open(url: string) {
    if (!isTipLink(url)) return;
    try {
      if (isNativeApp()) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url, toolbarColor: "#1f5f5b" });
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      setOpened(true);
    } catch {
      // If the page can't open (no internet, for example), nothing changes here.
    }
  }

  return (
    <>
      <p>{text.intro}</p>
      <p className="hint">{text.gentle}</p>
      <div className="tip-amounts">
        {TIP_LINKS.map((tip) => (
          <button key={tip.amount} type="button" aria-label={text.buttonLabel(tip.amount)} onClick={() => void open(tip.url)}>
            {tip.amount}
          </button>
        ))}
      </div>
      <p className="small">{text.opens}</p>
      <p className="gentle small">{text.privacy}</p>
      <p className="small" aria-live="polite">
        {opened ? text.thanks : ""}
      </p>
    </>
  );
}
