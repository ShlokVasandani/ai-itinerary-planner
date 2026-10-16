import Link from "next/link";
import { destinations } from "@/lib/data";
import { generateItinerary } from "@/lib/itinerary-engine";
import DestinationCard from "@/components/DestinationCard";
import DecryptWord from "@/components/DecryptWord";
import HeroRoute from "@/components/HeroRoute";
import HeroSearch from "@/components/HeroSearch";
import PhotoExpand from "@/components/PhotoExpand";
import Photo from "@/components/Photo";
import StackedDays from "@/components/StackedDays";
import { cityPhotos } from "@/lib/city-photo-urls";

const HERO_WORDS = ["Lisbon", "Tokyo", "Rome", "Seoul", "Paris", "Sydney"];

export default function Home() {
  const lisbon = destinations.find((d) => d.slug === "lisbon") ?? destinations[0];
  const sample = generateItinerary({
    destination: lisbon,
    duration: 3,
    budget: "mid-range",
    travelStyle: "first-time",
    interests: ["history", "food", "photography"],
    pace: "balanced",
    seed: "landing",
  });
  const totalPlaces = destinations.reduce(
    (n, d) => n + d.landmarks.length + d.restaurants.length + d.cafes.length + d.nightlife.length + d.shopping.length,
    0
  );
  const located = destinations.reduce(
    (n, d) => n + [...d.landmarks, ...d.restaurants, ...d.cafes].filter((p) => p.coords).length,
    0
  );
  const options = destinations.map((d) => ({ slug: d.slug, label: `${d.city}, ${d.country}` }));
  const expandCity = destinations.find((d) => d.slug === "rome") ?? destinations[0];

  return (
    <main>
      <section className="hero">
        <HeroRoute />
        <div className="hero-inner">
          <p className="eyebrow">Itineraries from real, verified places</p>
          <h1 aria-label="Plan your next trip to a city you'll actually enjoy">
            <span aria-hidden="true">
              Plan your next
              <br />
              trip to <DecryptWord words={HERO_WORDS} />
            </span>
          </h1>
          <p className="lede">
            Real places, real opening hours, real distances. Pick a city and your dates and get a day-by-day plan you
            can book from.
          </p>
          <HeroSearch cities={options} />
        </div>
      </section>

      <section className="stats" aria-label="What is in the data">
        <ul>
          <li>
            <strong>{destinations.length}</strong>
            <span>cities, each hand-curated</span>
          </li>
          <li>
            <strong>{totalPlaces}</strong>
            <span>real places catalogued</span>
          </li>
          <li>
            <strong>{located}</strong>
            <span>pinned to OpenStreetMap coordinates</span>
          </li>
          <li>
            <strong>1–14</strong>
            <span>day trips, with real dates</span>
          </li>
        </ul>
      </section>

      <section className="expand-section" aria-labelledby="expand-title">
        <PhotoExpand
          caption={
            <>
              <p className="eyebrow eyebrow-on-dark">{expandCity.country}</p>
              <h2 id="expand-title">{expandCity.city}</h2>
              <p>{expandCity.tagline}</p>
            </>
          }
        >
          <Photo slug={expandCity.slug} city={expandCity.city} sizes="100vw" />
        </PhotoExpand>
        {cityPhotos[expandCity.slug] && (
          <p className="photo-credit">
            Photo: {cityPhotos[expandCity.slug].credit}, {cityPhotos[expandCity.slug].license} ·{" "}
            <a href={cityPhotos[expandCity.slug].sourcePage} target="_blank" rel="noopener noreferrer">
              Wikimedia Commons
            </a>
          </p>
        )}
      </section>

      <section className="section stack-section" id="how" aria-labelledby="how-title">
        <div className="stack-intro">
          <p className="eyebrow">A sample plan</p>
          <h2 id="how-title" className="section-title">
            Three days in {lisbon.city}, straight from the planner
          </h2>
          <p className="lede">
            This is unedited engine output: stops grouped by neighborhood, ordered nearest-first, with walking and transit
            time between them. Set your dates and it will also dodge closed days.
          </p>
          <Link href={`/planner?city=${lisbon.slug}&go=1`} className="btn btn-ghost">
            Build your own →
          </Link>
        </div>
        <StackedDays itinerary={sample} />
      </section>

      <section className="section" id="destinations" aria-labelledby="dest-title">
        <h2 id="dest-title" className="section-title">
          Where to next?
        </h2>
        <div className="dest-grid">
          {destinations.map((d, i) => (
            <DestinationCard key={d.slug} d={d} priority={i < 3} />
          ))}
        </div>
      </section>

      <section className="section dark" aria-labelledby="book-title">
        <div className="dark-inner">
          <p className="eyebrow eyebrow-on-dark">From plan to booked</p>
          <h2 id="book-title" className="section-title on-dark">
            Official sites first, then the booking sites you already use
          </h2>
          <p className="lede on-dark">
            Every stop links to the venue&apos;s own site and a map. Flights, stays and tours open on Google Flights,
            Skyscanner, Booking.com, Airbnb, Viator, GetYourGuide and Klook with your dates already filled in.
          </p>
          <Link href="/planner" className="btn btn-primary">
            Plan my trip
          </Link>
        </div>
      </section>
    </main>
  );
}
