import { words } from "../content/words";

/** The warm little badge for your savings. Its colour comes from App options. */
export function PotBadge({ amount }: { amount: string }) {
  const home = words.home;
  return (
    <p className="pot-badge" aria-label={home.potLine(amount)}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z" fill="currentColor" />
      </svg>
      <span className="pot-label">{home.potLabel}</span>
      <span className="pot-amount">{amount}</span>
      <span className="pot-label">{home.potKept}</span>
    </p>
  );
}
