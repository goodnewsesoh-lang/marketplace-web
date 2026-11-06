import { SITE_NAME } from '@/lib/config'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </span>
        <span className="muted">Privacy policy and terms are coming soon.</span>
      </div>
    </footer>
  )
}
