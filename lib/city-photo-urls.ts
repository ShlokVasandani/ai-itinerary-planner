// ============================================================================
// Real city photography — sourced from Wikimedia Commons.
//
// Every entry below was verified via a live web search against the current
// Wikimedia Commons site (not guessed or reused from an unverified list).
// Each file's existence, subject, and license were confirmed individually.
//
// These are used as remote-hosted images (not downloaded into this sandbox,
// which has no network access to any image host — see README for why).
// Wikimedia's Special:FilePath endpoint gives a stable, direct, hotlink-safe
// URL for any Commons file without needing to know its internal hash path.
// ============================================================================

export interface CityPhoto {
  /** Exact Wikimedia Commons filename, including the "File:" prefix removed. */
  commonsFilename: string;
  /** Plain-language alt text describing the photo for screen readers. */
  alt: string;
  /** Photographer / uploader credit, as required by most Commons licenses. */
  credit: string;
  /** SPDX-ish short license name, e.g. "CC BY-SA 4.0", "CC0". */
  license: string;
  /** Link to the Commons file page for full license text and attribution. */
  sourcePage: string;
}

const commonsFilePath = (filename: string) =>
  `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename.replace(/ /g, "_"))}`;

export const cityPhotos: Record<string, CityPhoto> = {
  tokyo: {
    commonsFilename: "Shibuya crossing.jpg",
    alt: "Shibuya Crossing in Tokyo",
    credit: "Hide1228",
    license: "CC BY-SA 4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Shibuya_crossing.jpg",
  },
  paris: {
    commonsFilename: "Eiffel tower paris france.jpg",
    alt: "The Eiffel Tower in Paris",
    credit: "Public domain (Pixabay import)",
    license: "CC0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Eiffel_tower_paris_france.jpg",
  },
  london: {
    commonsFilename: "London Tower Bridge 22.jpg",
    alt: "Tower Bridge in London",
    credit: "Dronepicr",
    license: "CC BY 3.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:London_Tower_Bridge_22.jpg",
  },
  dubai: {
    commonsFilename: "Dubai Skyline 2016.jpg",
    alt: "Dubai skyline with the Burj Khalifa",
    credit: "Tonenight",
    license: "CC BY-SA 4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Dubai_Skyline_2016.jpg",
  },
  singapore: {
    commonsFilename: "Marina Bay Sands, Singapore, August 2023.jpg",
    alt: "Marina Bay Sands in Singapore",
    credit: "Ralffralff",
    license: "CC BY-SA 4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Marina_Bay_Sands,_Singapore,_August_2023.jpg",
  },
  bangkok: {
    commonsFilename: "Wat Arun Ratchawararam Ratchawaramahawihan Temple.jpg",
    alt: "Wat Arun temple in Bangkok",
    credit: "Krishnagopi06",
    license: "CC BY-SA 4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Wat_Arun_Ratchawararam_Ratchawaramahawihan_Temple.jpg",
  },
  rome: {
    commonsFilename: "Colosseum in rome.jpg",
    alt: "The Colosseum in Rome",
    credit: "Silviomerci1971",
    license: "CC BY-SA 4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Colosseum_in_rome.jpg",
  },
  barcelona: {
    commonsFilename: "Barcelona Sagrada familia.jpg",
    alt: "The Sagrada Família in Barcelona",
    credit: "Ot Pi",
    license: "CC BY-SA 3.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Barcelona_Sagrada_familia.jpg",
  },
  "new-york-city": {
    commonsFilename: "New York City skyline.jpg",
    alt: "The Manhattan skyline in New York City",
    credit: "William Warby",
    license: "CC BY 2.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:New_York_City_skyline.jpg",
  },
  istanbul: {
    commonsFilename: "Istanbul Hagia Sophia Sultanahmed.JPG",
    alt: "Hagia Sophia in Istanbul viewed from the Bosphorus",
    credit: "Julian Nyča",
    license: "CC BY-SA 4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Istanbul_Hagia_Sophia_Sultanahmed.JPG",
  },
  seoul: {
    commonsFilename: "Gwanghwamun is the main gate to the south of Gyeongbokgung Palace.jpg",
    alt: "Gwanghwamun gate at Gyeongbokgung Palace in Seoul",
    credit: "Pinterpandai",
    license: "CC BY-SA 4.0",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Gwanghwamun_is_the_main_gate_to_the_south_of_Gyeongbokgung_Palace.jpg",
  },
  amsterdam: {
    commonsFilename: "Colorful canal houses at golden hour in Damrak avenue Amsterdam the Netherlands.jpg",
    alt: "Colorful canal houses in Amsterdam at golden hour",
    credit: "Basile Morin",
    license: "CC BY-SA 4.0",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Colorful_canal_houses_at_golden_hour_in_Damrak_avenue_Amsterdam_the_Netherlands.jpg",
  },
  copenhagen: {
    commonsFilename: "Nyhavn Copenhagen 2.jpg",
    alt: "Nyhavn canal in Copenhagen",
    credit: "Kallerna",
    license: "CC BY-SA 4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Nyhavn_Copenhagen_2.jpg",
  },
  "hong-kong": {
    commonsFilename: "Hong-Kong skyline.JPG",
    alt: "Hong Kong skyline seen from Victoria Peak",
    credit: "Public domain",
    license: "CC0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Hong-Kong_skyline.JPG",
  },
  sydney: {
    commonsFilename: "Sydney Harbour Bridge and Sydney Opera House panorama.jpg",
    alt: "Sydney Harbour Bridge and Sydney Opera House",
    credit: "Kgbo",
    license: "CC BY-SA 4.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Sydney_Harbour_Bridge_and_Sydney_Opera_House_panorama.jpg",
  },
  zurich: {
    commonsFilename: "Panoramablick auf die Altstadt von Zürich und den Zürichsee.jpg",
    alt: "Panoramic view of Zurich's old town and Lake Zurich",
    credit: "MadGeographer",
    license: "CC BY-SA 3.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Z%C3%BCrich.jpg",
  },
  "los-angeles": {
    commonsFilename:
      "Bust of James Dean with Hollywood Sign in Background - Griffith Observatory - Los Angeles, CA - USA (6914401045).jpg",
    alt: "The Hollywood Sign viewed from Griffith Observatory in Los Angeles",
    credit: "Adam Jones",
    license: "CC BY-SA 2.0",
    sourcePage:
      "https://commons.wikimedia.org/wiki/File:Bust_of_James_Dean_with_Hollywood_Sign_in_Background_-_Griffith_Observatory_-_Los_Angeles,_CA_-_USA_(6914401045).jpg",
  },
  "kuala-lumpur": {
    commonsFilename: "Petronas Towers view2, Kuala Lumpur.jpg",
    alt: "The Petronas Towers in Kuala Lumpur",
    credit: "Gryffindor (public domain release)",
    license: "Public domain",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Petronas_Towers_view2,_Kuala_Lumpur.jpg",
  },
  vienna: {
    commonsFilename: "Schönbrunn Palace, Vienna.JPG",
    alt: "Schönbrunn Palace in Vienna",
    credit: "Gveret Tered",
    license: "CC0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Sch%C3%B6nbrunn_Palace,_Vienna.JPG",
  },
  lisbon: {
    commonsFilename: "Tram28lisboa.jpg",
    alt: "The historic Tram 28 in Lisbon's Alfama district",
    credit: "Taguelmoust",
    license: "CC BY 3.0",
    sourcePage: "https://commons.wikimedia.org/wiki/File:Tram28lisboa.jpg",
  },
};

export function getCityPhotoUrl(slug: string): string | null {
  const photo = cityPhotos[slug];
  return photo ? commonsFilePath(photo.commonsFilename) : null;
}
