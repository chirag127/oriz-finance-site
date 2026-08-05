/*
 * The hero: a live SIP that prints onto a paper tally-roll. Left column =
 * machine keys (three inputs). Right column = the manila tape; each computed
 * line strikes in from the print head. Updates on every keystroke, no submit.
 *
 * The tape IS the signature element — every figure is Spline Sans Mono with
 * tabular slashed-zero numerals; the rupee glyph stays in Public Sans so the
 * seam vanishes. Totals get the teal double-rule.
 */
import { type ChangeEvent, useMemo, useState } from 'react'
import { calculateSIP } from '~/lib/finmath'
import { formatINR } from '~/lib/format'

const DEFAULTS = { monthly: 10_000, rate: 12, years: 15 }

export default function InlineSIPCalculator() {
  const [monthly, setMonthly] = useState(DEFAULTS.monthly)
  const [rate, setRate] = useState(DEFAULTS.rate)
  const [years, setYears] = useState(DEFAULTS.years)

  const result = useMemo(() => calculateSIP(monthly, rate, years), [monthly, rate, years])

  const onNumber =
    (set: (n: number) => void, fallback: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value)
      set(Number.isFinite(v) && v >= 0 ? v : fallback)
    }

  const lines: { k: string; v: number; cls?: string; i: number }[] = [
    { k: `${monthly.toLocaleString('en-IN')} × ${years * 12} mo`, v: result.investedAmount, i: 0 },
    { k: `growth @ ${rate.toFixed(1)}% p.a.`, v: result.wealthGained, i: 1 },
    { k: 'corpus', v: result.totalValue, cls: 'is-total', i: 2 },
  ]

  return (
    <div className="isip">
      <div className="isip-keys">
        <Key label="Monthly ₹" value={monthly} step={500} min={0} onChange={onNumber(setMonthly, 0)} />
        <Key label="Return % p.a." value={rate} step={0.5} min={0} max={40} onChange={onNumber(setRate, 0)} />
        <Key label="Years" value={years} step={1} min={1} max={50} onChange={onNumber(setYears, 1)} />
        <p className="isip-hint">
          Runs in your browser. Nothing typed here leaves the page.
        </p>
      </div>

      {/* keyed on the three inputs so React remounts → the strike animation replays */}
      <div className="tape" data-animate="true" key={`${monthly}-${rate}-${years}`}>
        <p className="tape-head">
          <span>SIP · READY RECKONER</span>
          <span>RR-01</span>
        </p>
        {lines.map((ln) => (
          <div
            className={`tape-line${ln.cls ? ` ${ln.cls}` : ''}`}
            style={{ '--i': ln.i } as React.CSSProperties}
            key={ln.k}
          >
            <span className="k">{ln.k}</span>
            <span className="v">
              <span className="rupee" aria-hidden="true">₹</span>
              <span className="num">{formatINR(ln.v).replace('₹', '')}</span>
            </span>
          </div>
        ))}
        <p className="tape-foot mono">
          {years} y · {rate.toFixed(1)}% · monthly compounding
        </p>
        <a className="tape-open" href="/calculators/sip/">
          Open full SIP with year-by-year ledger →
        </a>
      </div>

      <style>{`
        .isip {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        @media (min-width: 800px) {
          .isip { grid-template-columns: 0.85fr 1.15fr; gap: 2.5rem; }
        }
        .isip-keys { display: grid; gap: 0.9rem; align-content: start; }
        .isip-hint {
          margin: 0.5rem 0 0;
          font-size: 12px;
          color: var(--ink-mute);
          line-height: 1.5;
        }
        .tape-foot {
          margin: 0.9rem 0 0;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        .tape-open {
          display: inline-block;
          margin-top: 0.6rem;
          font-family: var(--font-sans);
          font-size: 13px;
          color: var(--credit);
          text-decoration: underline;
          text-decoration-color: color-mix(in oklab, var(--credit) 50%, transparent);
          text-underline-offset: 3px;
        }
        .tape-open:hover { text-decoration-color: var(--credit); }
        .tape-open:focus-visible { outline: 2px solid var(--credit); outline-offset: 2px; }
      `}</style>
    </div>
  )
}

interface KeyProps {
  label: string
  value: number
  step: number
  min?: number
  max?: number
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

function Key({ label, value, step, min, max, onChange }: KeyProps) {
  return (
    <label className="key">
      <span className="key-label mono">{label}</span>
      <input
        className="num key-input"
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        aria-label={label}
      />
      <style>{`
        .key { display: flex; flex-direction: column; gap: 0.3rem; }
        .key-label {
          font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-mute);
        }
        .key-input {
          height: 46px;
          padding: 0 0.9rem;
          background: var(--paper-deep);
          border: 1px solid var(--rule);
          border-bottom: 3px solid color-mix(in oklab, var(--ink) 35%, var(--rule));
          border-radius: 4px 4px 3px 3px;
          color: var(--ink);
          font-size: 19px;
          text-align: right;
          box-shadow: inset 0 1px 0 color-mix(in oklab, #fff 45%, transparent);
          font-feature-settings: 'tnum' 1, 'zero' 1, 'calt' 0;
        }
        .key-input:focus {
          outline: 2px solid var(--credit);
          outline-offset: 1px;
          border-color: var(--credit);
        }
      `}</style>
    </label>
  )
}
