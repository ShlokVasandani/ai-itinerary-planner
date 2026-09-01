import Link from "next/link";
import { destinations } from "@/lib/data";
import DestinationCard from "@/components/DestinationCard";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import { getCityPhotoUrl, cityPhotos } from "@/lib/city-photo-urls";

export default function Home() {
  const feature = destinations[0]; // Tokyo — this edition's featured cover story
  const featurePhoto = getCityPhotoUrl(feature.slug);
  const totalPlaces = destinations.reduce(
    (sum, d) => sum + d.landmarks.length + d.restaurants.length + d.cafes.length,
    0
  );

  return (
    <main>
      <section className="hero">
        <div className="hero-photo">
          {featurePhoto && (
            <img src={featurePhoto} alt={cityPhotos[feature.slug]?.alt ?? feature.city} className="city-photo" />
          )}
          <div className="hero-scrim" aria-hidden="true" />
        </div>

        <div className="hero-body">
          <p className="eyebrow">Issue No. 01 — {destinations.length} Cities</p>
          <h1>
            Trips built around <em>the way you travel</em>.
          </h1>
          <p className="hero-lede">
            Sekai plans real, geographically sensible itineraries from a hand-curated
            dataset of landmarks, restaurants, and neighborhoods — no invented venues,
            no generic filler.
          </p>
          <div className="hero-actions">
            <Link href="/planner" className="hero-cta-link">
              Start planning a trip →
            </Link>
            <a href="#destinations" className="hero-secondary-link">
              Browse the {destinations.length} destinations
            </a>
          </div>
        </div>

        <div className="hero-figure">
          <span className="hero-figure-label">Featured this edition</span>
          <span className="hero-figure-city">{feature.city}</span>
          <span className="hero-figure-tagline">{feature.tagline}</span>
        </div>

        <div className="hero-stat-strip">
          <span><strong><CountUp value={destinations.length} /></strong> curated destinations</span>
          <span><strong><CountUp value={totalPlaces} suffix="+" /></strong> real places catalogued</span>
          <span><strong>3 / 5 / 7</strong> day itineraries, every city</span>
        </div>

        <a href="#destinations" className="hero-scroll-cue" aria-label="Scroll to destinations">
          <span>Scroll</span>
          <span className="hero-scroll-chevron" aria-hidden="true" />
        </a>
      </section>

      <section className="destinations" id="destinations">
        <Reveal>
          <div className="section-heading">
            <div>
              <p className="eyebrow">The Destination Hub</p>
              <h2>Where to next?</h2>
            </div>
            <p>Pick a city to explore its landmarks, food scene, and neighborhoods in depth.</p>
          </div>
        </Reveal>
        <div className="dest-grid">
          {destinations.map((d, i) => (
            <Reveal key={d.slug} delay={(i % 4) * 90} className={i < 2 ? "dest-card-featured-slot" : undefined}>
              <DestinationCard d={d} index={i} featured={i < 2} secondary={[3, 7, 12, 16].includes(i)} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="how">
        <Reveal>
          <p className="eyebrow">How It Works</p>
        </Reveal>
        <div className="steps">
          <Reveal delay={0}>
            <article>
              <span>01</span>
              <h3>Pick a city &amp; trip length</h3>
              <p>Choose from 20 richly documented destinations and a 3, 5, or 7-day trip.</p>
            </article>
          </Reveal>
          <Reveal delay={100}>
            <article>
              <span>02</span>
              <h3>Tell us your style</h3>
              <p>Budget, travel style, and interests shape which places make the cut.</p>
            </article>
          </Reveal>
          <Reveal delay={200}>
            <article>
              <span>03</span>
              <h3>Get a real day-by-day plan</h3>
              <p>Geographically clustered stops, realistic timing, and paced meals — no backtracking.</p>
            </article>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
