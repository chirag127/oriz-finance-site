import { ClerkProvider as ClerkReactProvider } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

/*
 * Clerk provider — one publishable key gates the whole *.oriz.in family, so
 * a sign-in on any oriz site carries across every subdomain. PUBLIC content
 * is NEVER gated; Clerk only gates the "save scenario" personal feature.
 *
 * Appearance themed to the Ready Reckoner: manila paper, graphite ink, teal
 * credit accent, oxblood danger, square-ish corners, mono figures.
 */

const publishableKey =
  import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY ?? 'pk_live_Y2xlcmsub3Jpei5pbiQ'

const appearance = {
  variables: {
    colorPrimary: '#0b6e63',
    colorText: '#23262b',
    colorTextSecondary: '#6a6d66',
    colorBackground: '#f7f4ea',
    colorInputBackground: '#f2efe6',
    colorInputText: '#23262b',
    colorDanger: '#8e2a2a',
    borderRadius: '3px',
    fontFamily: "'Public Sans', system-ui, sans-serif",
  },
  elements: {
    card: {
      backgroundColor: '#f7f4ea',
      border: '1px solid #cabf9f',
      boxShadow: '0 1px 2px rgba(35,38,43,0.08)',
      borderRadius: '4px',
    },
    headerTitle: {
      fontFamily: "'Archivo Expanded', 'Archivo', system-ui, sans-serif",
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '-0.01em',
      color: '#23262b',
    },
    headerSubtitle: { color: '#6a6d66' },
    formButtonPrimary: {
      backgroundColor: '#0b6e63',
      color: '#f2efe6',
      fontWeight: '600',
      borderRadius: '3px',
      textTransform: 'none',
    },
    formFieldInput: {
      backgroundColor: '#f2efe6',
      borderColor: '#cabf9f',
      color: '#23262b',
      fontFamily: "'Spline Sans Mono', ui-monospace, monospace",
    },
    formFieldLabel: { color: '#23262b' },
    footerActionLink: { color: '#0b6e63' },
    identityPreviewEditButton: { color: '#0b6e63' },
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
