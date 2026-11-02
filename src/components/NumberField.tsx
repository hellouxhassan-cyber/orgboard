import { useRef, useState } from 'react';
import { clampForUnit } from '../domain/performance';
import type { Unit } from '../domain/types';

const ADORN: Record<Unit, { pre?: string; suf?: string }> = {
  currency: { pre: '$' }, percent: { suf: '%' }, ratio: { suf: '×' }, day: { pre: 'Day' }, number: {}
};

/** Plain digits for editing. Never uses exponent notation. */
const plain = (v: number) => v.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 4 });

/**
 * Number input that reads well at rest (2,250,000 with a $ in front) and edits as a plain number.
 * Focusing selects the whole value, so typing replaces it. Values are kept valid for their unit.
 * Calls onChange with null when cleared.
 */
export function NumberField(props: {
  value: number | null; unit: Unit; onChange: (v: number | null) => void;
  label: string; id?: string; disabled?: boolean; className?: string; block?: boolean; onCommit?: () => void;
}) {
  const { value, unit, onChange, label, id, disabled, className = 'in', block, onCommit } = props;
  const [draft, setDraft] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const a = ADORN[unit] ?? {};
  const shown = draft ?? (value == null ? '' : value.toLocaleString('en-US', { maximumFractionDigits: 4 }));
  const style = { ['--pre' as string]: a.pre ? `${a.pre.length * 8 + 6}px` : '0px', ['--suf' as string]: a.suf ? '14px' : '0px' };
  return (
    <span className={`nf${block ? ' block' : ''}`} style={style}>
      {a.pre && <span className="adorn pre" aria-hidden="true">{a.pre}</span>}
      <input
        ref={ref} id={id} className={className} type="text" inputMode="decimal" autoComplete="off"
        aria-label={label} disabled={disabled} value={shown}
        onFocus={() => {
          setDraft(value == null ? '' : plain(value));
          // Swapping the formatted text for plain digits drops the browser's selection, so select again.
          requestAnimationFrame(() => { if (document.activeElement === ref.current) ref.current?.select(); });
        }}
        onChange={e => {
          const raw = e.target.value.replace(/[^0-9.]/g, '');
          setDraft(raw);
          if (raw === '') onChange(null);
          else if (!Number.isNaN(+raw)) onChange(clampForUnit(+raw, unit));
        }}
        onBlur={() => { setDraft(null); onCommit?.(); }}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      />
      {a.suf && <span className="adorn suf" aria-hidden="true">{a.suf}</span>}
    </span>
  );
}
