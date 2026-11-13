import Link from 'next/link'

import { AuthNav } from './AuthNav'
import { Logo } from './Logo'

export function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
        <nav className="nav" aria-label="Main">
          <a href="/#store-types">Store types</a>
          <a href="/#how-it-works">How it works</a>
        </nav>
        <AuthNav />
      </div>
    </header>
  )
}
