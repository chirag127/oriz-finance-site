import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import ClerkProvider from './ClerkProvider'

/*
 * Header auth affordance. Signed-out shows a modal sign-in trigger; signed-in
 * shows the Clerk user menu. Public content is never behind this.
 */
export default function AuthButton() {
  return (
    <ClerkProvider>
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="auth-signin" data-oriz-auth="signin">
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton
          appearance={{ elements: { userButtonAvatarBox: { width: '26px', height: '26px' } } }}
        />
      </SignedIn>
    </ClerkProvider>
  )
}
