import { initials } from '../domain/performance';

/** Department tints. Deliberately avoids green, amber and red, which are reserved for status. */
const TINTS = ['orange', 'violet', 'pink', 'blue', 'cyan', 'slate', 'indigo'] as const;
const FIXED: Record<string, (typeof TINTS)[number]> = {
  Leadership: 'orange', Marketing: 'violet', Creative: 'pink', Operations: 'blue', Support: 'cyan', Finance: 'slate'
};
export function tintFor(dept: string) {
  if (FIXED[dept]) return FIXED[dept];
  let h = 0; for (const c of dept) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

/** Initials in a soft, department colored tile, so a person's team is visible at a glance. */
export function Avatar({ name, dept, size = 28 }: { name: string; dept: string; size?: number }) {
  return (
    <span className={`av t-${tintFor(dept)}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.37) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
