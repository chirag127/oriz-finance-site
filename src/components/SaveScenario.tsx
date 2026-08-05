import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/clerk-react'
import { useState } from 'react'
import { saveScenario } from '~/lib/scenarios'
import ClerkProvider from './auth/ClerkProvider'

/*
 * Save-scenario control — the ONE Clerk-gated affordance on a calculator page.
 * Signed-out users see a subtle prompt to sign in; the calculator itself is
 * never blocked. Signed-in users write the current inputs to Firestore keyed
 * by their Clerk id.
 */
interface Props {
  slug: string
  name: string
  /** localStorage key the calculator island persists its inputs under. */
  storageKey?: string
}

function SaveInner({ slug, name, storageKey }: Props) {
  const { userId } = useAuth()
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')

  function currentInputs(): Record<string, number | string> {
    if (!storageKey || typeof localStorage === 'undefined') return {}
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as Record<string, number | string>) : {}
    } catch {
      return {}
    }
  }

  async function save() {
    if (!userId) return
    setState('saving')
    try {
      await saveScenario(
        userId,
        slug,
        `${name} · ${new Date().toLocaleDateString('en-IN')}`,
        currentInputs(),
      )
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="save">
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="save-hint">Sign in to save this scenario</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <button type="button" className="save-btn" onClick={save} disabled={state === 'saving'}>
          {state === 'done' ? 'Saved ✓' : state === 'saving' ? 'Saving…' : 'Save scenario'}
        </button>
        {state === 'error' && <span className="save-err">Save failed — retry.</span>}
        {state === 'done' && (
          <a className="save-link" href="/account/">See saved →</a>
        )}
      </SignedIn>
      <style>{`
        .save { display: inline-flex; align-items: center; gap: 0.75rem; }
        .save-btn {
          height: 40px; padding-inline: 1rem;
          background: var(--credit); color: var(--paper);
          border: 1px solid var(--credit); border-radius: 3px;
          font-family: var(--font-sans); font-size: 0.875rem; font-weight: 600; cursor: pointer;
        }
        .save-btn:hover:not(:disabled) { background: var(--ink); border-color: var(--ink); }
        .save-btn:focus-visible { outline: 2px solid var(--credit); outline-offset: 2px; }
        .save-btn:disabled { opacity: 0.6; cursor: default; }
        .save-hint {
          background: transparent; border: 1px dashed var(--rule); border-radius: 3px;
          color: var(--ink-mute); font-family: var(--font-mono); font-size: 12px;
          padding: 0.4rem 0.7rem; cursor: pointer;
        }
        .save-hint:hover { color: var(--credit); border-color: var(--credit); }
        .save-hint:focus-visible { outline: 2px solid var(--credit); outline-offset: 2px; }
        .save-err { color: var(--debit); font-size: 12px; }
        .save-link { color: var(--credit); font-size: 12px; text-decoration: underline; text-underline-offset: 3px; }
      `}</style>
    </div>
  )
}

export default function SaveScenario(props: Props) {
  return (
    <ClerkProvider>
      <SaveInner {...props} />
    </ClerkProvider>
  )
}
