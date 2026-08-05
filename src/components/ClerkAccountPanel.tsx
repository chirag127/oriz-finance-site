import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
  useUser,
} from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { deleteScenario, listScenarios, type Scenario } from '~/lib/scenarios'
import ClerkProvider from './auth/ClerkProvider'

/*
 * Account panel — Clerk identity + the signed-in user's saved scenarios from
 * Firestore (keyed by Clerk user id). Public site never routes through this;
 * it is the one gated surface.
 */
function ScenarioList() {
  const { userId } = useAuth()
  const [rows, setRows] = useState<Scenario[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let live = true
    listScenarios(userId)
      .then((r) => live && setRows(r))
      .catch(() => live && setErr('Could not load saved scenarios.'))
    return () => {
      live = false
    }
  }, [userId])

  async function remove(id: string) {
    if (!userId) return
    await deleteScenario(userId, id)
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null)
  }

  if (err) return <p className="ap-note ap-err">{err}</p>
  if (rows === null) return <p className="ap-note">Loading saved scenarios…</p>
  if (rows.length === 0)
    return (
      <p className="ap-note">
        No saved scenarios yet. Open any calculator and press <strong>Save</strong> to keep it here.
      </p>
    )

  return (
    <ul className="ap-list">
      {rows.map((s) => (
        <li className="ap-item" key={s.id}>
          <a className="ap-item-link" href={`/calculators/${s.slug}/`}>
            <span className="ap-item-name">{s.name}</span>
            <span className="ap-item-slug mono">{s.slug}</span>
          </a>
          <button type="button" className="ap-del" onClick={() => remove(s.id)}>
            delete
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function ClerkAccountPanel() {
  return (
    <ClerkProvider>
      <div className="ap">
        <SignedOut>
          <p className="ap-heading">Sign in to save scenarios</p>
          <p className="ap-note">
            The calculators work fully without an account. Signing in only lets you save a
            computation and re-open it on any device — one account across every oriz site.
          </p>
          <SignInButton mode="modal">
            <button type="button" className="ap-primary">
              Sign in / create account
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <div className="ap-me">
            <UserButton />
            <SignedInName />
          </div>
          <p className="ap-sub mono">Saved scenarios</p>
          <ScenarioList />
        </SignedIn>
      </div>

      <style>{`
        .ap { display: block; }
        .ap-heading {
          font-family: var(--font-display);
          font-weight: 700;
          font-stretch: expanded;
          text-transform: uppercase;
          font-size: 1.25rem;
          color: var(--ink);
          margin: 0 0 0.75rem;
        }
        .ap-note { color: var(--ink-mute); line-height: 1.6; margin: 0 0 1.25rem; font-size: 0.9375rem; }
        .ap-err { color: var(--debit); }
        .ap-primary {
          height: 44px; padding-inline: 1.25rem;
          background: var(--credit); color: var(--paper);
          border: 1px solid var(--credit); border-radius: 3px;
          font-family: var(--font-sans); font-size: 0.9375rem; font-weight: 600; cursor: pointer;
        }
        .ap-primary:hover { background: var(--ink); border-color: var(--ink); }
        .ap-primary:focus-visible { outline: 2px solid var(--credit); outline-offset: 2px; }
        .ap-me { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1.25rem; }
        .ap-sub {
          font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--ink-mute); margin: 0 0 0.75rem;
        }
        .ap-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.35rem; }
        .ap-item {
          display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
          padding: 0.5rem 0.6rem; background: var(--tape); border: 1px solid var(--rule); border-radius: 3px;
        }
        .ap-item-link { display: flex; flex-direction: column; gap: 0.1rem; }
        .ap-item-name { font-weight: 700; color: var(--ink); font-size: 0.9375rem; }
        .ap-item-slug { font-size: 11px; color: var(--ink-mute); }
        .ap-del {
          background: transparent; border: 0; color: var(--ink-mute);
          font-family: var(--font-mono); font-size: 11px; text-transform: uppercase;
          letter-spacing: 0.1em; cursor: pointer;
        }
        .ap-del:hover { color: var(--debit); }
      `}</style>
    </ClerkProvider>
  )
}

function SignedInName() {
  const { user } = useUser()
  const name = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'Signed in'
  return <span className="ap-item-name">{name}</span>
}
