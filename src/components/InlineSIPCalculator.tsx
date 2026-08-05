/*
 * SIGNATURE — the plotted SIP growth curve on graph paper.
 *
 * The hero thesis of an India-finance world rendered as engineering print:
 * money compounding drawn as a rising line across ruled grid cells, axes
 * labelled like an engineering plot, the final corpus dimensioned with a teal
 * leader + arrow callout. Left column = three drafting-style keys; right =
 * the plotted sheet. Updates on every keystroke, no submit. The curve strokes
 * itself in on input change (one orchestrated motion); reduced-motion = instant.
 *
 * All figures in IBM Plex Mono with tabular slashed-zero numerals; the rupee
 * glyph stays in the body face so the seam vanishes.
 */
import { type ChangeEvent, useId, useMemo, useState } from 'react'
import { calculateSIP } from '~/lib/finmath'
import { formatINR, formatINRCompact } from '~/lib/format'

const DEFAULTS = { monthly: 10_000, rate: 12, years: 15 }

// plot geometry (viewBox units)
const W = 520
const H = 300
const PAD = { l: 16, r: 16, t: 18, b: 26 }

export default function InlineSIPCalculator() {
  const [monthly, setMonthly] = useState(DEFAULTS.monthly)
  const [rate, setRate] = useState(DEFAULTS.rate)
  const [years, setYears] = useState(DEFAULTS.years)
  const gid = useId().replace(/:/g, '')

  const result = useMemo(() => calculateSIP(monthly, rate, years), [monthly, rate, years])

  const onNumber =
    (set: (n: number) => void, fallback: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value)
      set(Number.isFinite(v) && v >= 0 ? v : fallback)
    }

  // Build the value + invested polylines across the plot area.
  const { valuePts, investPts, lastX, lastY, pathLen } = useMemo(() => {
    const pts = [{ year: 0, invested: 0, value: 0 }, ...result.yearlyBreakdown]
    const maxV = Math.max(...pts.map((p) => p.value), 1)
    const x = (i: number) => PAD.l + (i / (pts.length - 1)) * (W - PAD.l - PAD.r)
    const y = (v: number) => H - PAD.b - (v / maxV) * (H - PAD.t - PAD.b)
    const vp = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
    const ip = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.invested).toFixed(1)}`).join(' ')
    // rough polyline length for the stroke-draw dasharray
    const coords = pts.map((p, i) => [x(i), y(p.value)] as const)
    let len = 0
    for (let i = 1; i < coords.length; i++) {
      len += Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1])
    }
    const last = coords[coords.length - 1]
    return { valuePts: vp, investPts: ip, lastX: last[0], lastY: last[1], pathLen: Math.ceil(len) + 20 }
  }, [result])

  const animKey = `${monthly}-${rate}-${years}`

  return (
    <div className="isip sheet">
      <div className="isip-keys">
        <p className="isip-title mono">FIG. 1 — SIP CORPUS vs TIME</p>
        <Key label="Monthly ₹" value={monthly} step={500} min={0} onChange={onNumber(setMonthly, 0)} />
        <Key label="Return % p.a." value={rate} step={0.5} min={0} max={40} onChange={onNumber(setRate, 0)} />
        <Key label="Years" value={years} step={1} min={1} max={50} onChange={onNumber(setYears, 1)} />
        <p className="isip-hint">Plotted in your browser. Nothing typed here leaves the page.</p>
      </div>

      <figure className="isip-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`SIP corpus grows to ${formatINR(result.totalValue, { withRupee: true })} over ${years} years`}
          className="plot-svg"
        >
          <defs>
            <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--credit)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--credit)" stopOpacity="0" />
            </linearGradient>
            <marker id={`arw-${gid}`} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--credit)" />
            </marker>
          </defs>

          {/* baseline + left axis (engineering plot rules) */}
          <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} className="plot-axis" />
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} className="plot-axis" />

          {/* invested (principal) reference line — dashed, muted */}
          <polyline points={investPts} className="plot-invest" fill="none" />

          {/* corpus area + the plotted growth curve (the signature) */}
          <polygon
            points={`${PAD.l},${H - PAD.b} ${valuePts} ${lastX.toFixed(1)},${H - PAD.b}`}
            fill={`url(#fill-${gid})`}
          />
          <polyline
            key={animKey}
            points={valuePts}
            className="plot-line"
            data-animate="true"
            fill="none"
            style={{ '--len': pathLen } as React.CSSProperties}
          />

          {/* dimension callout to the final corpus */}
          <circle cx={lastX} cy={lastY} r="3.5" className="plot-node" />
          <line
            x1={lastX}
            y1={lastY}
            x2={lastX - 118}
            y2={Math.max(lastY - 34, PAD.t + 6)}
            className="plot-leader"
            markerEnd={`url(#arw-${gid})`}
          />
          <text
            x={lastX - 122}
            y={Math.max(lastY - 38, PAD.t + 2)}
            textAnchor="end"
            className="plot-callout plot-callout-val"
          >
            {formatINRCompact(result.totalValue)}
          </text>

          {/* axis ticks: 0 and final year */}
          <text x={PAD.l} y={H - 8} className="plot-tick">y0</text>
          <text x={W - PAD.r} y={H - 8} textAnchor="end" className="plot-tick">y{years}</text>
        </svg>

        <figcaption className="isip-readout">
          <span className="ro">
            <span className="ro-k mono">Invested</span>
            <span className="ro-v"><span className="rupee" aria-hidden="true">₹</span><span className="num">{formatINR(result.investedAmount)}</span></span>
          </span>
          <span className="ro">
            <span className="ro-k mono">Gain @ {rate.toFixed(1)}%</span>
            <span className="ro-v"><span className="rupee" aria-hidden="true">₹</span><span className="num">{formatINR(result.wealthGained)}</span></span>
          </span>
          <span className="ro ro-total">
            <span className="ro-k mono">Corpus</span>
            <span className="ro-v"><span className="rupee" aria-hidden="true">₹</span><span className="num">{formatINR(result.totalValue)}</span></span>
          </span>
        </figcaption>

        <a className="isip-open" href="/calculators/sip/">Open full SIP with year-by-year ledger →</a>
      </figure>

      <style>{`
        .isip {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          align-items: stretch;
          padding: clamp(1.1rem, 3vw, 1.75rem);
        }
        @media (min-width: 840px) {
          .isip { grid-template-columns: 0.78fr 1.22fr; gap: 2rem; }
        }
        .isip-keys { display: grid; gap: 0.85rem; align-content: start; }
        .isip-title {
          font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--ink-mute); margin: 0 0 0.25rem;
        }
        .isip-hint { margin: 0.35rem 0 0; font-size: 12px; color: var(--ink-mute); line-height: 1.5; }

        .isip-plot { margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
        .plot-svg {
          width: 100%; height: auto; display: block;
          background:
            linear-gradient(0deg, color-mix(in oklab, var(--grid) 12%, transparent) 0 1px, transparent 1px 20px),
            linear-gradient(90deg, color-mix(in oklab, var(--grid) 12%, transparent) 0 1px, transparent 1px 20px);
          background-size: 20px 20px;
          border: 1px solid var(--rule);
        }
        .plot-axis { stroke: var(--ink-mute); stroke-width: 1; }
        .plot-invest { stroke: var(--ink-mute); stroke-width: 1.25; stroke-dasharray: 4 3; opacity: 0.7; }
        .plot-line { stroke: var(--credit); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
        .plot-node { fill: var(--credit); stroke: var(--tape); stroke-width: 1.5; }
        .plot-leader { stroke: var(--credit); stroke-width: 1; }
        .plot-callout-val { fill: var(--credit); font-size: 15px; font-weight: 600; }
        .plot-tick { fill: var(--ink-mute); font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.05em; }

        .isip-readout {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;
          border-top: 1px solid var(--rule); padding-top: 0.85rem;
        }
        @media (max-width: 520px) { .isip-readout { grid-template-columns: 1fr; gap: 0.4rem; } }
        .ro { display: flex; flex-direction: column; gap: 0.15rem; }
        .ro-k { font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-mute); }
        .ro-v { font-family: var(--font-mono); font-size: 16px; color: var(--ink); font-variant-numeric: tabular-nums slashed-zero; }
        .ro-total .ro-v { color: var(--credit); font-weight: 600; }
        .ro-total { border-left: 2px solid var(--credit); padding-left: 0.6rem; }
        @media (max-width: 520px) { .ro-total { border-left: 0; padding-left: 0; border-top: 2px solid var(--credit); padding-top: 0.4rem; } }

        .isip-open {
          font-family: var(--font-sans); font-size: 13px; color: var(--credit);
          text-decoration: underline; text-decoration-color: color-mix(in oklab, var(--credit) 50%, transparent);
          text-underline-offset: 3px;
        }
        .isip-open:hover { text-decoration-color: var(--credit); }
        .isip-open:focus-visible { outline: 2px solid var(--credit); outline-offset: 2px; }
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
        .key-label { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-mute); }
        .key-input {
          height: 44px;
          padding: 0 0.85rem;
          background: var(--paper-deep);
          border: 1px solid var(--rule);
          border-radius: 0;
          color: var(--ink);
          font-size: 18px;
          text-align: right;
          font-feature-settings: 'tnum' 1, 'zero' 1, 'calt' 0;
        }
        .key-input:focus { outline: 2px solid var(--credit); outline-offset: 1px; border-color: var(--credit); }
      `}</style>
    </label>
  )
}
