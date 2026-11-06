import Link from 'next/link'

import { StoreIcon } from '@/components/StoreIcon'
import { SITE_NAME } from '@/lib/config'
import { getStoreTypes } from '@/lib/storeTypes'

export const revalidate = 60

const TRUST = [
  { title: 'Open your store free', text: 'Pick a store type and start in minutes.' },
  { title: 'Contact sellers directly', text: 'Message or WhatsApp the seller, no middleman.' },
  { title: 'Verified sellers', text: 'Look for the badge on trusted stores.' },
]

const STEPS = [
  { title: 'Choose your store type', text: 'Music, books, digital products, fashion, services or more.' },
  { title: 'Create your account', text: 'We set up your store and dashboard for you.' },
  { title: 'Add your products', text: 'Upload, set prices and discounts, and share your store.' },
]

export default async function HomePage() {
  const storeTypes = await getStoreTypes()

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-card">
            <div className="hero-content">
              <span className="eyebrow">Welcome to {SITE_NAME}</span>
              <h1>A store for everything you sell.</h1>
              <p>
                Musicians, writers, designers, fashion sellers and service providers: open a store
                made for what you do and let buyers find you.
              </p>
              <div className="hero-actions">
                <Link href="/register" className="btn btn-light">
                  Open your store
                </Link>
                <a href="#store-types" className="btn btn-outline">
                  See store types
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="store-types" className="section">
        <div className="container">
          <div className="section-head">
            <h2>Find the store that fits you</h2>
            <p>Every seller gets a store and dashboard built for what they sell.</p>
          </div>
          <div className="grid grid-3">
            {storeTypes.map((type) => (
              <Link key={type.slug} href={`/register?type=${type.slug}`} className="card">
                <div className="icon-bubble">
                  <StoreIcon name={type.icon} />
                </div>
                <h3>{type.name}</h3>
                {type.tagline ? <p>{type.tagline}</p> : null}
                <span className="more">Open this store &rarr;</span>
              </Link>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 16 }}>
            Do not see your type? Choose &ldquo;My type isn&apos;t here&rdquo; when you register and
            we will create one for you.
          </p>
        </div>
      </section>

      <section className="container">
        <div className="trust">
          <h2>Why sellers and buyers choose {SITE_NAME}</h2>
          <div className="grid grid-3">
            {TRUST.map((item) => (
              <div key={item.title} className="trust-item">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section">
        <div className="container">
          <div className="section-head">
            <h2>How it works</h2>
          </div>
          <div className="grid grid-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="card">
                <div className="step-number">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="cta">
          <h2>Ready to open your store?</h2>
          <p>It only takes a few minutes. Showcase what you sell and let buyers contact you.</p>
          <Link href="/register" className="btn btn-light">
            Get started
          </Link>
        </div>
      </section>
    </>
  )
}
