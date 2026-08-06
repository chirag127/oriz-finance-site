/*
 * SIPCalculator (full page) — drives the /calculators/sip/ page.
 *
 * Layout: the page itself is a 3-col grid (inputs / result+chart / formula).
 * This island provides the inputs (controlled), the big result hero number,
 * the sparkline chart on the graph grid, the assumptions list, and the
 * full-width year-by-year ledger table below the slab with a double-rule
 * totals row.
 *
 * Numbers everywhere are JetBrains Mono with tabular-nums slashed-zero;
 * the rupee glyph is rendered as a separate <span class="rupee"> 0.9em in
 * Source Sans 3 so the seam is invisible.
 */
import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { calculateSIP } from '~/lib/finmath'
import { formatINR } from '~/lib/format'

const KEY = 'oriz:finance:sip'
const DEFAULTS = { monthly: 10_000, rate: 12, years: 15 }

interface Saved {
  monthly: number
  rate: number
  years: number
}

function loadSaved(): Saved {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const p = JSON.parse(raw) as Partial<Saved>
    return {
      monthly: Number(p.monthly) || DEFAULTS.monthly,
      rate: Number(p.rate) || DEFAULTS.rate,
      years: Number(p.years) || DEFAULTS.years,
    }
  } catch {
    return DEFAULTS
  }
}

export default function SIPCalculator() {
  const [{ monthly, rate, years }, setState] = useState<Saved>(DEFAULTS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState(loadSaved())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ monthly, rate, years }))
    } catch {
      /* storage unavailable — fine */
    }
  }, [hydrated, monthly, rate, years])

  const result = useMemo(() => calculateSIP(monthly, rate, years), [monthly, rate, years])

  const onNum =
    (k: 'monthly' | 'rate' | 'years', floor: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value)
      setState((s) => ({ ...s, [k]: Number.isFinite(v) && v >= floor ? v : floor }))
    }

  // Build the sparkline path from year-end values, normalized into a 0..1
  // box. The sparkline is a single accent stroke on the graph grid — no
  // axis labels, no fill, no gradient. The grid IS the axis.
  const W = 800
  const H = 200
  const path = useMemo(() => {
    const max = result.yearlyBreakdown.length
      ? Math.max(...result.yearlyBreakdown.map((y) => y.value))
      : 1
    if (max === 0 || result.yearlyBreakdown.length < 2) return ''
    return result.yearlyBreakdown
      .map((y, i) => {
        const x = (i / (result.yearlyBreakdown.length - 1)) * W
        const yp = H - (y.value / max) * H
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yp.toFixed(1)}`
      })
      .join(' ')
  }, [result.yearlyBreakdown])

  return (
    <div className="sipfull">
      <div className="sipfull-slab">
        {/* ── Left: inputs ── */}
        <section className="sipfull-col sipfull-inputs" aria-label="Inputs">
          <h2 className="sipfull-h mono">Inputs</h2>
          <Field
            label="Monthly investment (₹)"
            value={monthly}
            min={0}
            max={1_000_000}
            step={500}
            onChange={onNum('monthly', 0)}
            onSlide={(v) => setState((s) => ({ ...s, monthly: v }))}
            sliderMin={500}
            sliderMax={200_000}
          />
          <Field
            label="Expected annual return (%)"
            value={rate}
            min={0}
            max={40}
            step={0.5}
            onChange={onNum('rate', 0)}
            onSlide={(v) => setState((s) => ({ ...s, rate: v }))}
            sliderMin={1}
            sliderMax={30}
          />
          <Field
            label="Tenure (years)"
            value={years}
            min={1}
            max={50}
            step={1}
            onChange={onNum('years', 1)}
            onSlide={(v) => setState((s) => ({ ...s, years: v }))}
            sliderMin={1}
            sliderMax={40}
          />
        </section>

        {/* ── Centre: result hero + sparkline ── */}
        <section className="sipfull-col sipfull-result" aria-label="Result">
          <h2 className="sipfull-h mono">Final corpus</h2>
          <div className="sipfull-hero">
            <span className="rupee" aria-hidden="true">
              ₹
            </span>
            <span className="num sipfull-hero-num">{formatINR(result.totalValue)}</span>
          </div>
          <p className="sipfull-caption mono">
            {years} y &middot; {rate.toFixed(1)}% p.a. &middot; monthly compounding
          </p>
          <div className="sipfull-chart">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
              <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
            </svg>
          </div>
        </section>

        {/* ── Right: formula + assumptions ── */}
        <section className="sipfull-col sipfull-formula" aria-label="Formula and assumptions">
          <h2 className="sipfull-h mono">Formula</h2>
          <pre className="sipfull-pre mono">{`M = P × ({(1+i)^n − 1} / i) × (1+i)`}</pre>
          <h3 className="sipfull-sub mono">Assumptions</h3>
          <ul className="sipfull-asm">
            <li>
              <span className="num">P</span> = monthly instalment, paid at start of each month
              (annuity-due).
            </li>
            <li>
              <span className="num">i</span> = annual rate ÷ 12. Compounding is monthly.
            </li>
            <li>
              <span className="num">n</span> = total months = years × 12.
            </li>
            <li>Returns are nominal — pre-inflation, pre-expense-ratio, pre-tax.</li>
            <li>
              Equity returns vary year to year; constant-rate is a teaching assumption, not a
              prediction.
            </li>
            <li>
              Edge case: when <span className="num">i = 0</span>, FV reduces to{' '}
              <span className="num">P × n</span>.
            </li>
          </ul>
        </section>
      </div>

      {/* ── Year-by-year ledger table ── */}
      <section className="sipfull-table-wrap" aria-label="Year-by-year ledger">
        <h2 className="sipfull-h mono sipfull-h-table">Year-by-year ledger</h2>
        <div className="sipfull-table-scroll">
          <table className="sipfull-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Opening</th>
                <th>Invested</th>
                <th>Interest</th>
                <th>Closing</th>
              </tr>
            </thead>
            <tbody>
              {result.yearlyBreakdown.map((row, i) => {
                const opening = i === 0 ? 0 : (result.yearlyBreakdown[i - 1]?.value ?? 0)
                const investedThisYear = monthly * 12
                const interest = row.value - opening - investedThisYear
                return (
                  <tr key={row.year}>
                    <td className="num">{row.year}</td>
                    <td className="num">{formatINR(opening)}</td>
                    <td className="num">{formatINR(investedThisYear)}</td>
                    <td className="num">{formatINR(Math.max(0, Math.round(interest)))}</td>
                    <td className="num">{formatINR(row.value)}</td>
                  </tr>
                )
              })}
              <tr className="totals">
                <td>Total</td>
                <td className="num" />
                <td className="num">{formatINR(result.investedAmount)}</td>
                <td className="num">{formatINR(result.wealthGained)}</td>
                <td className="num">{formatINR(result.totalValue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .sipfull { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2.5rem; }
        .sipfull-slab {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 2rem;
          min-width: 0;
        }
        @media (min-width: 960px) {
          .sipfull-slab {
            grid-template-columns: minmax(220px, 1fr) minmax(280px, 1.1fr) minmax(220px, 1fr);
            gap: 2.5rem;
          }
        }
        .sipfull-col {
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--rule);
          min-width: 0;
        }
        @media (min-width: 960px) {
          .sipfull-col {
            border-bottom: 0;
          }
          .sipfull-col + .sipfull-col {
            border-left: 1px solid var(--rule);
            padding-left: 2rem;
          }
        }
        .sipfull-h {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--ink-mute);
          font-weight: 500;
          margin: 0 0 1rem;
        }
        .sipfull-sub {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--ink-mute);
          font-weight: 500;
          margin: 1.5rem 0 0.625rem;
        }

        .sipfull-hero {
          display: flex;
          align-items: baseline;
          color: var(--accent);
          line-height: 1;
        }
        .sipfull-hero-num {
          font-size: clamp(36px, 6vw, 56px);
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        .sipfull-hero .rupee {
          font-size: clamp(28px, 5vw, 48px);
        }
        .sipfull-caption {
          margin: 0.75rem 0 1.25rem;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        .sipfull-chart {
          width: 100%;
          height: 200px;
          padding-block: 0.25rem;
        }
        .sipfull-chart svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .sipfull-pre {
          margin: 0;
          padding: 0.875rem 1rem;
          background: color-mix(in oklab, var(--rule) 25%, transparent);
          border: 1px solid var(--rule);
          font-size: 14px;
          color: var(--ink);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .sipfull-asm {
          list-style: none;
          padding: 0;
          margin: 0.5rem 0 0;
          color: var(--ink-mute);
          font-size: 13px;
          line-height: 1.55;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .sipfull-asm li {
          padding-left: 1rem;
          position: relative;
        }
        .sipfull-asm li::before {
          content: '·';
          position: absolute;
          left: 0.25rem;
          color: var(--rule);
        }

        .sipfull-table-wrap {
          padding-top: 0.5rem;
        }
        .sipfull-h-table {
          margin-bottom: 0.75rem;
        }
        .sipfull-table-scroll {
          overflow-x: auto;
        }
        .sipfull-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          font-family: var(--font-mono);
          font-feature-settings: 'tnum' 1, 'zero' 1, 'calt' 0;
        }
        .sipfull-table thead th {
          font-family: var(--font-mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--ink-mute);
          font-weight: 500;
          padding: 0.625rem 0.75rem;
          border-bottom: 1px solid var(--rule);
          text-align: right;
        }
        .sipfull-table thead th:first-child { text-align: left; }
        .sipfull-table tbody td {
          padding: 0.5rem 0.75rem;
          text-align: right;
          color: var(--ink);
        }
        .sipfull-table tbody td:first-child {
          text-align: left;
          color: var(--ink-mute);
        }
        .sipfull-table tbody tr:nth-child(odd) td {
          background: color-mix(in oklab, var(--rule) 8%, transparent);
        }
      `}</style>
    </div>
  )
}

interface FieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSlide: (v: number) => void
  sliderMin: number
  sliderMax: number
}

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
  onSlide,
  sliderMin,
  sliderMax,
}: FieldProps) {
  return (
    <label className="sipf-field">
      <span className="sipf-label mono">{label}</span>
      <input
        className="num sipf-input"
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
      />
      <input
        className="sipf-slider"
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={step}
        value={value}
        onChange={(e) => onSlide(Number(e.target.value))}
        aria-label={`${label} slider`}
      />
      <style>{`
        .sipf-field { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1.25rem; min-width: 0; }
        .sipf-label {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        .sipf-input {
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
          height: 44px;
          padding: 0 0.875rem;
          background: var(--paper);
          border: 1px solid var(--rule);
          color: var(--ink);
          font-size: 18px;
          text-align: right;
          font-feature-settings: 'tnum' 1, 'zero' 1, 'calt' 0;
        }
        .sipf-input:focus {
          outline: 2px solid var(--accent);
          outline-offset: -1px;
          border-color: var(--accent);
        }
        .sipf-slider {
          accent-color: var(--accent);
          width: 100%;
        }
      `}</style>
    </label>
  )
}
