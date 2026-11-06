import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Open your store' }

export default function RegisterPage() {
  return (
    <div className="container page-center">
      <div>
        <h1>Registration opens soon</h1>
        <p>
          We are building the sign-up and store setup. Please check back in a little while.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
