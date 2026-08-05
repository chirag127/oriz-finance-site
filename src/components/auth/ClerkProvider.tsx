import { ClerkProvider as ClerkReactProvider } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

/*
 * Clerk provider — one publishable key gates the whole *.oriz.in family, so
 * a sign-in on any oriz site carries across every subdomain. PUBLIC content
 * is NEVER gated; Clerk only gates the "save scenario" personal feature.
 *
 * Appearance themed to the Engineering-Print Ledger: cool drafting paper,
 * graphite ink, graph-teal credit accent, oxblood danger, square corners,
 * mono figures.
 */

const publishableKey =
  import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY ?? 'pk_live_Y2xlcmsub3Jpei5pbiQ'

const appearance = {
  variables: {
    colorPrimary: '#0e7c6b',
    colorText: '#17211e',
    colorTextSecondary: '#5c6b64',
    colorBackground: '#f4f7f4',
    colorInputBackground: '#e2e8e4',
    colorInputText: '#17211e',
    colorDanger: '#9b2d24',
    borderRadius: '0px',
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  },
  elements: {
    card: {
      backgroundColor: '#f4f7f4',
      border: '1px solid #b7c4bd',
      boxShadow: '0 1px 2px rgba(23,33,30,0.08)',
      borderRadius: '0px',
    },
    headerTitle: {
      fontFamily: "'Saira Condensed', 'Arial Narrow', system-ui, sans-serif",
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.01em',
      color: '#17211e',
    },
    headerSubtitle: { color: '#5c6b64' },
    formButtonPrimary: {
      backgroundColor: '#0e7c6b',
      color: '#eef2ef',
      fontWeight: '600',
      borderRadius: '0px',
      textTransform: 'none',
    },
    formFieldInput: {
      backgroundColor: '#e2e8e4',
      borderColor: '#b7c4bd',
      color: '#17211e',
      fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    },
    formFieldLabel: { color: '#17211e' },
    footerActionLink: { color: '#0e7c6b' },
    identityPreviewEditButton: { color: '#0e7c6b' },
    logoBox: { height: '26px' },
  },
} as const

export default function ClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkReactProvider publishableKey={publishableKey} appearance={appearance}>
      {children}
    </ClerkReactProvider>
  )
}
