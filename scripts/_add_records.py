#!/usr/bin/env python3
"""One-off: append new hand-authored records to lib/data/<slug>.ts.

Only well-known, real venues are added. No prices or opening hours are
invented here; costs/coords/URLs/hours are filled later from primary sources by
scripts/enrich-geo.ts (and left undefined when unverifiable).
"""
import json, re, sys, unicodedata, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def slugify(t):
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:48].strip("-")

def obj(d):
    parts = []
    for k, v in d.items():
        if v is None:
            continue
        parts.append(f"{k}: {json.dumps(v, ensure_ascii=False)}")
    return "    { " + ", ".join(parts) + " },"

def L(name, hood, desc, why, prio, tags, dur, cost=None, res=None, price=None):
    return ("landmarks", obj(dict(id=slugify(name), name=name, neighborhood=hood, description=desc, whyGo=why,
            priority=prio, interestTags=tags, suggestedDurationMin=dur, approxCost=cost, reservationNote=res)))

def R(name, hood, desc, why, prio, tags, dur, cuisine, dishes, meals, price, res=None):
    return ("restaurants", obj(dict(id="r-" + slugify(name), name=name, neighborhood=hood, description=desc, whyGo=why,
            priority=prio, interestTags=tags, suggestedDurationMin=dur, cuisine=cuisine, signatureDishes=dishes,
            mealFor=meals, priceLevel=price, reservationNote=res)))

def C(name, hood, desc, spec, price, prio="interest-specific"):
    return ("cafes", obj(dict(id="c-" + slugify(name), name=name, neighborhood=hood, description=desc,
            specialty=spec, priceLevel=price, priority=prio)))

def N(name, vibe, known, best, when, walk=True):
    return ("neighborhoods", obj(dict(id=slugify(name), name=name, vibe=vibe, knownFor=known, bestFor=best,
            bestTimeToVisit=when, walkable=walk)))

def T(name, desc, dist, time, dur, how, worth):
    return ("dayTrips", obj(dict(id="t-" + slugify(name), name=name, description=desc, distanceFromCity=dist,
            travelTime=time, suggestedDuration=dur, howToGetThere=how, worthItFor=worth)))

MS, HR, IY, IS = "must-see", "highly-recommended", "if-you-have-time", "interest-specific"
FREE = "Free"

ADD = {}

ADD["amsterdam"] = [
  L("Begijnhof", "Canal Ring (Grachtengordel)", "A tranquil courtyard of 14th-century almshouses hidden behind the Spui, with one of the oldest surviving wooden houses in the city.", "A calm, almost secret pocket in the middle of the busiest part of the centre.", HR, ["history", "photography"], 30, FREE),
  L("Museum Rembrandthuis", "Jodenbuurt", "The house where Rembrandt lived and worked from 1639 to 1658, restored with period rooms and his etching studio.", "The most direct way to meet the painter's working life instead of just his canvases.", HR, ["history", "art"], 75),
  L("Westerkerk", "Jordaan", "The 17th-century church whose tower, the Westertoren, is the tallest church tower in Amsterdam, next to the Anne Frank House.", "Climbing the tower gives a view over the canal ring and the Jordaan.", IY, ["history", "photography"], 60),
  L("Stedelijk Museum", "Museum Quarter", "The city's museum of modern and contemporary art and design on the Museumplein.", "A strong counterweight to the Golden Age museums nearby.", IS, ["art", "culture"], 120),
  R("The Pancake Bakery", "Canal Ring (Grachtengordel)", "A long-running canal-house restaurant serving large Dutch pancakes with sweet and savoury toppings.", "A classic, easy Dutch meal in a historic warehouse.", IY, ["food"], 60, "Dutch pancakes", ["Pannenkoeken with bacon", "Apple and cinnamon pancake"], ["breakfast", "lunch", "dinner"], "$$"),
  R("Moeders", "Jordaan", "A homely Dutch restaurant whose walls are covered with photographs of mothers, serving traditional home cooking.", "Honest, hearty Dutch food in a place with a lot of personality.", HR, ["food", "culture"], 90, "Traditional Dutch", ["Stamppot", "Hachee"], ["dinner"], "$$", "Reserve ahead; it is small and popular."),
  R("Stubbe's Haring", "Canal Ring (Grachtengordel)", "A well-known herring stand near Centraal Station serving the classic Dutch raw herring with onions and pickles.", "The quickest, cheapest way to try a true Amsterdam street food.", IS, ["food"], 20, "Dutch street food", ["Raw herring with onions", "Broodje haring"], ["lunch"], "$"),
  R("Bakers & Roasters", "De Pijp", "A casual brunch spot in De Pijp with a New Zealand and Brazilian menu.", "A reliable, relaxed breakfast stop in a lively neighbourhood.", IS, ["food", "cafes"], 60, "Brunch / New Zealand", ["Eggs and bacon brunch", "Pancakes with bacon"], ["breakfast", "lunch"], "$$"),
  C("Coffee & Coconuts", "De Pijp", "A café in a former cinema with a large, bright interior and a relaxed pace.", "Cappuccino and a slice of cake in a striking building", "$$"),
  N("Nine Streets (De Negen Straatjes)", "Nine small cross-streets between the main canals lined with independent boutiques, vintage shops and cafés", ["Independent boutiques", "Vintage shopping", "Canal-side cafés"], ["shopping", "cafes", "culture"], "Weekday late mornings, before the weekend crowd"),
]

ADD["bangkok"] = [
  L("Wat Saket (Golden Mount)", "Rattanakosin (Old City)", "A hilltop temple reached by around 300 steps, with a gilded chedi at the top and 360-degree views over the old city.", "One of the best free-ish views over Rattanakosin and a quiet counterpoint to the Grand Palace.", HR, ["history", "photography"], 75),
  L("Erawan Shrine", "Ratchaprasong", "A Brahmin shrine to Phra Phrom at the Ratchaprasong intersection, where offerings and traditional dance are made daily.", "A vivid, living piece of Thai devotion in the middle of the shopping district.", IY, ["culture", "photography"], 30, FREE),
  L("Lumphini Park", "Silom & Sathorn", "The city's best-known public park, with a lake, paths and resident monitor lizards.", "A real breather from the city, especially early morning when locals exercise.", IY, ["nature"], 60, FREE),
  L("Bangkok Art and Culture Centre", "Siam", "A contemporary art centre at Siam with galleries, a library and a market-style ground floor.", "A good air-conditioned cultural stop right by the BTS.", IS, ["art", "culture"], 90),
  R("Polo Fried Chicken", "Silom & Sathorn", "A street-side restaurant on Soi Sarasin known for its garlic-and-pepper fried chicken and Isaan dishes.", "A local favourite for crisp fried chicken and som tam.", HR, ["food"], 60, "Thai / Isaan", ["Fried chicken", "Som tam", "Sticky rice"], ["lunch", "dinner"], "$"),
  R("Wattana Panich", "Ekkamai", "A long-running beef noodle shop famous for a stew that has been simmering for decades.", "Rich, deeply flavoured beef noodle soup with a local following.", IY, ["food"], 45, "Thai noodles", ["Beef noodle soup", "Stewed beef"], ["lunch", "dinner"], "$"),
  R("Nai Mong Hoi Thod", "Chinatown (Yaowarat)", "A Yaowarat restaurant known for crispy oyster omelette and mussel pancakes.", "A classic Chinatown stop for one of Bangkok's best-loved street dishes.", IY, ["food"], 45, "Thai-Chinese street food", ["Crispy oyster omelette", "Mussel pancake"], ["lunch", "dinner"], "$"),
  R("Nahm", "Silom & Sathorn", "An acclaimed restaurant at the Metropolitan Bangkok serving refined, traditional Thai cooking.", "A rare chance to taste old-style Thai recipes at a high level.", IS, ["food", "luxury"], 120, "Traditional Thai", ["Tasting menu", "Relishes and curries"], ["dinner"], "$$$$", "Reserve well in advance."),
  C("Factory Coffee", "Ratchathewi", "A specialty roaster and espresso bar that is one of Bangkok's best-known third-wave cafés.", "Single-origin espresso and filter coffee", "$$"),
  N("Silom & Sathorn", "The business and nightlife district with markets, temples and rooftop bars side by side", ["Lumphini Park", "Rooftop bars", "Patpong night market"], ["nightlife", "food", "culture"], "Late afternoon into the evening"),
  T("Kanchanaburi", "The riverside town known for the Bridge over the River Kwai, the Death Railway and the Erawan waterfalls.", "~130 km", "2–3 hr by train or van", "full-day", "Train from Thonburi station or a road transfer from Bangkok.", ["Bridge over the River Kwai", "Death Railway", "JEATH War Museum"]),
]

ADD["barcelona"] = [
  L("Palau de la Música Catalana", "El Born", "A Modernista concert hall by Lluís Domènech i Montaner, with a spectacular stained-glass skylight.", "One of the most ornate interiors in the city, and a UNESCO World Heritage site.", HR, ["art", "culture"], 60),
  L("Hospital de Sant Pau", "Eixample", "A Modernista hospital complex by Domènech i Montaner, now a cultural and museum site.", "The scale and detail are often more peaceful than the more famous Gaudí sites.", IY, ["art", "history"], 90),
  L("Casa Vicens", "Gràcia", "Gaudí's first major house, now a museum, covered in tilework and floral detail.", "The earliest Gaudí interior you can visit, in a quieter neighbourhood.", IY, ["art", "history"], 60),
  L("Bunkers del Carmel", "Gràcia", "A former anti-aircraft battery on a hilltop with an open 360-degree view over the city.", "The best free view of Barcelona, especially at sunset.", HR, ["photography"], 60, FREE),
  R("La Cova Fumada", "Barceloneta", "A tiny, long-running Barceloneta tavern famous for the bomba, a fried potato croquette with spicy sauce.", "The original home of the bomba and a very local seafood-tapas stop.", HR, ["food"], 60, "Catalan tapas", ["Bomba", "Grilled seafood"], ["lunch"], "$$"),
  R("Bar del Pla", "El Born", "A small tapas bar with a modern Catalan menu near the Picasso Museum.", "Updated classics and a good wine list.", IY, ["food"], 75, "Modern Catalan tapas", ["Croquettes", "Beef cheek"], ["lunch", "dinner"], "$$"),
  R("Can Culleretes", "Gothic Quarter (Barri Gòtic)", "Often cited as Barcelona's oldest restaurant, serving traditional Catalan cooking since the 18th century.", "A historic dining room serving Catalan classics.", IY, ["food", "history"], 90, "Catalan", ["Escudella", "Cannelloni", "Crema catalana"], ["lunch", "dinner"], "$$"),
  R("Bar Canigó", "Gràcia", "A neighbourhood tapas bar on the Plaça de la Revolució de Setembre de 1868 in Gràcia.", "A local tapas spot away from the main tourist trail.", IS, ["food"], 60, "Catalan tapas", ["Tapas", "Patatas bravas"], ["lunch", "dinner"], "$$"),
  C("Syra Coffee", "Eixample", "A specialty coffee roaster with a pared-back café in the Eixample.", "Espresso and filter coffee", "$$"),
  N("Poble-sec", "A laid-back neighbourhood on the slope of Montjuïc known for its bar-lined Carrer de Blai", ["Pintxo bars on Carrer de Blai", "Theatres and cabaret", "Access to Montjuïc"], ["food", "nightlife", "culture"], "Evenings, for tapas and a drink"),
]

ADD["copenhagen"] = [
  L("Rundetaarn", "Indre By (City Center)", "A 17th-century observatory tower whose spiral ramp leads to a viewing platform over the old town.", "A distinctive, easy panoramic view in the centre of the city.", IY, ["history", "photography"], 45),
  L("The National Museum of Denmark", "Indre By (City Center)", "Denmark's museum of cultural history, covering the Viking Age through to modern times.", "A clear, well-organised introduction to Danish history.", IY, ["history", "culture"], 120),
  L("Kastellet", "Frederiksstaden", "A star-shaped 17th-century fortress with ramparts, a windmill and green paths, still used by the military.", "A peaceful walk and a good way to reach the Little Mermaid on foot.", IS, ["history", "nature"], 45, FREE),
  L("Designmuseum Danmark", "Frederiksstaden", "A design museum in the former Frederiks Hospital with Danish furniture, fashion and craft.", "The best place to understand Danish design.", IS, ["art", "culture"], 90),
  R("Restaurant Schønnemann", "Indre By (City Center)", "A traditional smørrebrød restaurant that has been open since 1877.", "The classic place for open sandwiches and aquavit.", HR, ["food", "history"], 90, "Danish smørrebrød", ["Herring", "Smørrebrød with pork", "Aquavit"], ["lunch"], "$$$", "Reserve ahead for lunch."),
  R("Mother", "Vesterbro", "A pizzeria in the Meatpacking District known for sourdough pizza.", "Good, relaxed pizza in a lively part of town.", IS, ["food"], 60, "Pizza", ["Sourdough pizza"], ["lunch", "dinner"], "$$"),
  R("Manfreds", "Nørrebro", "A natural-wine bistro with a vegetable-forward menu in Nørrebro.", "A well-regarded Nørrebro stop for vegetable-led small plates.", IS, ["food"], 75, "New Nordic / bistro", ["Vegetable small plates", "Natural wine"], ["lunch", "dinner"], "$$$"),
  R("Geist", "Indre By (City Center)", "A modern Nordic restaurant at Kongens Nytorv serving shared plates.", "A stylish, share-friendly central dinner.", IS, ["food"], 90, "Modern Nordic", ["Shared plates"], ["dinner"], "$$$"),
  C("Granola", "Vesterbro", "A nostalgic café on Værnedamsvej with 1950s-style décor and homey brunch dishes.", "Brunch and cakes in a vintage setting", "$$"),
  N("Frederiksberg", "A leafy, residential district with royal gardens, an old-fashioned feel and the zoo", ["Frederiksberg Gardens", "Copenhagen Zoo", "Gammel Kongevej cafés"], ["nature", "cafes"], "Weekday afternoons"),
]

ADD["dubai"] = [
  L("Jumeirah Mosque", "Jumeirah & JBR", "One of the city's most photographed mosques, open to non-Muslim visitors on guided tours.", "A rare, welcoming introduction to Islamic culture and architecture in Dubai.", HR, ["culture", "history"], 60),
  L("Dubai Frame", "Al Quoz / Alserkal Avenue", "A giant picture-frame-shaped building in Zabeel Park with views of both old and new Dubai.", "A neat way to see the old city and the skyline in one view.", IY, ["photography"], 60),
  L("Spice Souk (Deira)", "Deira & the Creek", "A covered market in Deira selling spices, dried fruits, frankincense and herbs.", "One of the most sensory and photogenic parts of old Dubai.", HR, ["culture", "photography", "shopping"], 60, FREE),
  L("The Dubai Mall & Dubai Aquarium", "Downtown Dubai", "One of the world's largest malls, with an aquarium, an ice rink and views of the Burj Khalifa and fountain.", "A very large, climate-controlled stop next to the Burj Khalifa.", IY, ["shopping", "adventure"], 150),
  R("Bu Qtair", "Jumeirah & JBR", "A beachside fish shack in Umm Suqeim, loved for fried fish and shrimp with spiced masala.", "A beloved no-frills seafood stop in the shadow of the Burj Al Arab.", HR, ["food"], 60, "Seafood / Gulf", ["Fried hammour", "Masala shrimp"], ["lunch", "dinner"], "$$"),
  R("Al Safadi", "Deira & the Creek", "A Lebanese restaurant chain popular for mezze and grills.", "Dependable mezze and grills at reasonable prices.", IS, ["food"], 60, "Lebanese", ["Mezze", "Mixed grill", "Hummus"], ["lunch", "dinner"], "$$"),
  R("Sikka Café", "Al Fahidi Historical Neighbourhood", "A courtyard café in the Al Fahidi district serving light Emirati-influenced dishes.", "A restful lunch stop within the historic district.", IS, ["food", "culture"], 60, "Café / Middle Eastern", ["Light lunches", "Karak tea"], ["breakfast", "lunch"], "$$"),
  R("Zaroob", "Jumeirah & JBR", "A Levantine street-food restaurant known for shawarma wraps, falafel and salads.", "Easy, tasty and casual, including vegetarian options.", IS, ["food"], 45, "Levantine street food", ["Shawarma", "Falafel wrap", "Manakish"], ["lunch", "dinner"], "$"),
  C("The Coffee Museum", "Al Fahidi Historical Neighbourhood", "A small museum-café in an old house in Al Fahidi presenting the history of coffee.", "Arabic coffee and a short lesson in coffee history", "$$"),
  N("Dubai Marina", "A canal-side district of high-rises, a waterfront promenade and a busy restaurant scene", ["Marina Walk", "JBR beach", "Dhow cruises"], ["nightlife", "food", "beaches"], "Evenings, for the lights on the water", True),
  T("Sharjah", "The neighbouring emirate known for its Arts Area, Heritage Area and museums.", "~30 km", "30–60 min by road", "half-day", "Taxi, Careem or intercity bus from Dubai; traffic can be heavy at rush hour.", ["Sharjah Art Museum", "Heritage Area", "Al Noor Mosque"]),
]

ADD["hong-kong"] = [
  L("Wong Tai Sin Temple", "Kowloon", "A colourful Taoist temple famous for its fortune-telling and kau cim sticks.", "A vivid example of local worship and architecture, easy on the MTR.", HR, ["culture", "photography"], 75),
  L("Chi Lin Nunnery & Nan Lian Garden", "Kowloon", "A Tang-style Buddhist nunnery built in wood without nails, next to a classical Chinese garden.", "A peaceful, meticulous contrast to the city's density.", IY, ["culture", "photography"], 90, FREE),
  L("M+ Museum", "West Kowloon", "A large museum of visual culture in the West Kowloon Cultural District with views over the harbour.", "A strong modern-art stop with harbour views.", IY, ["art", "culture"], 120),
  L("Hong Kong Tramways (Ding Ding)", "Central & Sheung Wan", "The double-decker tram running along the north shore of Hong Kong Island since 1904.", "An inexpensive, atmospheric way to see the island at street level.", HR, ["history", "photography"], 60),
  R("Kam Wah Cafe", "Mong Kok", "A classic cha chaan teng known for its bolo bun with butter.", "The essential Hong Kong-style café breakfast.", IY, ["food"], 45, "Hong Kong café", ["Polo bun with butter", "Milk tea"], ["breakfast"], "$"),
  R("Mido Cafe", "Yau Ma Tei", "A long-running 1950s-style café above Yau Ma Tei, with tiled floors and a leafy view.", "A time capsule of old Hong Kong café culture.", IY, ["food", "culture"], 60, "Hong Kong café", ["Baked pork chop rice", "Milk tea"], ["breakfast", "lunch"], "$"),
  R("Sing Heung Yuen", "Central & Sheung Wan", "A historic dai pai dong in Central famous for tomato soup noodles.", "A cheap, filling local breakfast or lunch.", IS, ["food"], 40, "Hong Kong noodles", ["Tomato soup noodles", "Egg sandwich"], ["breakfast", "lunch"], "$"),
  R("Kung Wo Soybean Factory", "Sham Shui Po", "A traditional tofu maker and dessert shop in Sham Shui Po.", "Fresh tofu pudding in an old-school shop.", IS, ["food"], 30, "Soy and dessert", ["Tofu pudding", "Soy milk"], ["any"], "$"),
  C("Halfway Coffee", "Lan Kwai Fong & SoHo", "A small coffee shop on Elgin Street, known for friendly baristas and quality espresso.", "Flat white and filter coffee", "$$"),
  N("Sham Shui Po", "A working-class district known for fabric markets, electronics streets and inexpensive local food", ["Fabric and bead markets", "Electronics streets", "Dim sum and dessert"], ["food", "shopping"], "Morning to mid-afternoon"),
  T("Cheung Chau", "A small car-free island with a harbourside promenade, beaches and seafood restaurants.", "~10 km", "35–60 min by ferry", "half-day", "Ferry from Central Pier 5 (fast or ordinary).", ["Seafood by the harbour", "Cycling", "Tung Wan beach"]),
]

ADD["istanbul"] = [
  L("Dolmabahçe Palace", "Beşiktaş & Ortaköy", "The 19th-century Ottoman palace on the Bosphorus, with ornate state rooms and a crystal staircase.", "The most opulent Ottoman interiors in the city, on the water.", HR, ["history", "luxury"], 120, None, "Tickets are timed and guided; arrive early."),
  L("Spice Bazaar (Mısır Çarşısı)", "Eminönü", "A 17th-century covered market near the Galata Bridge selling spices, Turkish delight and teas.", "Smaller and more manageable than the Grand Bazaar, and very aromatic.", HR, ["shopping", "food", "culture"], 60, FREE),
  L("Chora Church (Kariye)", "Edirnekapı", "A Byzantine church renowned for its 14th-century mosaics and frescoes.", "Some of the finest Byzantine art in the city, away from the main tourist route.", IY, ["history", "art"], 60),
  L("Istanbul Archaeology Museums", "Sultanahmet", "A museum complex near Topkapı Palace holding classical, Anatolian and ancient Near Eastern collections.", "A rich, calm museum right next to the Sultanahmet sights.", IY, ["history", "culture"], 120),
  R("Karaköy Güllüoğlu", "Karaköy & Galata", "A baklava specialist, a family business that traces its roots to Gaziantep.", "A top-quality baklava stop and an easy sweet break.", HR, ["food"], 30, "Turkish desserts", ["Baklava", "Sütlü Nuriye"], ["any"], "$"),
  R("Sultanahmet Köftecisi Selim Usta", "Sultanahmet", "A long-running köfte restaurant close to the Blue Mosque.", "A simple, reliable local lunch near the main sights.", IY, ["food"], 45, "Turkish grill", ["Köfte", "Piyaz salad"], ["lunch", "dinner"], "$"),
  R("Zübeyir Ocakbaşı", "Beyoğlu / İstiklal Street", "A grill house with an open ocakbaşı grill, popular for kebabs and lamb dishes.", "A traditional, lively grill experience.", IS, ["food"], 90, "Turkish grill / ocakbaşı", ["Adana kebab", "Liver", "Lamb ribs"], ["dinner"], "$$"),
  R("Mikla", "Beyoğlu / İstiklal Street", "A rooftop restaurant on The Marmara Pera serving modern Turkish cuisine.", "A refined dinner with a view over the Golden Horn.", IS, ["food", "luxury"], 120, "Modern Turkish", ["Tasting menu"], ["dinner"], "$$$$", "Reserve well ahead."),
  C("Kronotrop", "Karaköy & Galata", "An Istanbul specialty coffee roaster with cafés across the city.", "Filter coffee and espresso", "$$"),
  N("Balat & Fener", "Colourful old houses, antique shops and small cafés along steep streets by the Golden Horn", ["Colourful houses", "Antique shops", "Churches and synagogues"], ["photography", "cafes", "culture"], "Weekday mornings, when it is quiet"),
  T("Edirne", "A former Ottoman capital with the Selimiye Mosque, a UNESCO World Heritage site by the architect Sinan.", "~240 km", "2.5–3 hr by bus or train", "full-day", "Intercity bus from Esenler or train; consider a hired car for a day trip.", ["Selimiye Mosque", "Old Bazaar", "Edirne tava ciğer"]),
]

ADD["kuala-lumpur"] = [
  L("Thean Hou Temple", "Seputeh", "A six-tiered Chinese temple on a hillside, dedicated to the sea goddess Mazu, with views over the city.", "One of the most colourful temples in the region, and particularly striking after dark.", IY, ["culture", "photography"], 60, FREE),
  L("Masjid Negara (National Mosque)", "Lake Gardens", "Malaysia's national mosque, with a star-shaped dome and a 73-metre minaret.", "A modernist landmark of Malaysian identity, open to respectful visitors.", IY, ["culture", "history"], 45, FREE),
  L("Merdeka Square (Dataran Merdeka)", "Chinatown (Petaling Street)", "The historic square where Malaysia's independence was proclaimed, with the Sultan Abdul Samad Building.", "The heart of colonial Kuala Lumpur and a great photo stop.", IY, ["history", "photography"], 45, FREE),
  L("KL Bird Park", "Lake Gardens", "A large walk-through aviary in the Lake Gardens with free-flying birds.", "A family-friendly and surprisingly immersive stop.", IS, ["nature"], 120),
  R("Nasi Lemak Tanglin", "Lake Gardens", "A well-known nasi lemak restaurant near the Lake Gardens, loved for sambal and fried chicken.", "The national dish, done well, at a local favourite.", HR, ["food"], 45, "Malaysian", ["Nasi lemak", "Ayam goreng"], ["breakfast", "lunch"], "$"),
  R("Kim Lian Kee", "Chinatown (Petaling Street)", "A long-running Hokkien mee restaurant on Jalan Petaling, founded in 1927.", "The classic KL dark soy noodle dish at its source.", IY, ["food"], 45, "Chinese-Malaysian", ["Hokkien mee"], ["lunch", "dinner"], "$$"),
  R("Madras Lane Hawker Stalls", "Chinatown (Petaling Street)", "A narrow alley of hawker stalls off Petaling Street, known for curry laksa and chee cheong fun.", "A compact introduction to Malaysian hawker food.", IS, ["food"], 45, "Malaysian hawker", ["Curry laksa", "Chee cheong fun"], ["breakfast", "lunch"], "$"),
  R("Soong Kee Beef Noodles", "Chinatown (Petaling Street)", "A traditional beef noodle shop on Jalan Tun H.S. Lee, open since 1945.", "Simple, legendary beef noodles in the heart of Chinatown.", IS, ["food"], 40, "Chinese-Malaysian noodles", ["Beef noodles"], ["lunch"], "$"),
  C("Chocha Foodstore", "Chinatown (Petaling Street)", "A café and bar in a restored Chinatown shophouse serving fusion plates and drinks.", "Coffee and a fusion brunch in a shophouse", "$$"),
  N("Kampung Baru", "A traditional Malay village enclave surrounded by high-rises, known for Malay food", ["Malay home cooking", "Traditional wooden houses", "Weekend Pasar Minggu market"], ["food", "culture"], "Late afternoon to evening"),
]

ADD["lisbon"] = [
  L("Museu Nacional do Azulejo", "Beato", "A museum dedicated to Portuguese tile art, set in the former Madre de Deus convent.", "The story of Portugal's most distinctive craft, in a stunning building.", IY, ["art", "culture"], 90),
  L("Oceanário de Lisboa", "Parque das Nações", "One of the largest indoor aquariums in Europe, in the Parque das Nações district.", "A highlight for families and the best reason to see the modern riverside district.", IY, ["nature"], 120),
  L("Convento do Carmo", "Baixa & Chiado", "The roofless ruins of a Gothic convent church that has stayed open to the sky since the 1755 earthquake.", "A haunting, atmospheric stop right in Chiado.", HR, ["history", "photography"], 45),
  L("MAAT (Museum of Art, Architecture and Technology)", "Belém", "A museum on the Tagus waterfront whose curved roof can be walked on.", "Striking architecture and good views over the river.", IS, ["art", "culture"], 75),
  R("Cervejaria Trindade", "Baixa & Chiado", "A traditional beer hall housed in a former convent, lined with azulejo panels.", "Seafood and beer in a historic tile-lined setting.", IY, ["food", "history"], 90, "Portuguese seafood", ["Seafood platter", "Prego"], ["lunch", "dinner"], "$$"),
  R("Zé da Mouraria", "Mouraria", "A family-run tasca in Mouraria known for generous traditional Portuguese portions.", "Big, hearty portions and a loyal local crowd.", IS, ["food"], 75, "Traditional Portuguese", ["Bacalhau", "Sharing plates"], ["lunch", "dinner"], "$$"),
  R("Solar dos Presuntos", "Baixa & Chiado", "A long-established restaurant near Restauradores known for Minho cooking, ham and seafood.", "A reliable classic for traditional Portuguese dishes.", IS, ["food"], 90, "Portuguese", ["Presunto", "Seafood rice"], ["lunch", "dinner"], "$$$", "Reserve ahead."),
  R("Cantinho do Aziz", "Mouraria", "A Mozambican restaurant in Mouraria famed for spicy chicken and Mozambican curries.", "A distinctive taste of Lisbon's African-Portuguese food scene.", IS, ["food", "culture"], 75, "Mozambican", ["Xima", "Curry", "Spicy chicken"], ["lunch", "dinner"], "$$"),
  C("Pastelaria Versailles", "Avenidas Novas", "A grand Art Nouveau pastry shop and tearoom open since 1922.", "Pastry and coffee in a belle-époque room", "$$"),
  N("Graça", "A hilltop residential neighbourhood with viewpoints, local tascas and a village feel", ["Miradouro da Graça", "Thieves Market on Tuesdays and Saturdays", "Local tascas"], ["photography", "culture"], "Late afternoon for the light"),
]

ADD["london"] = [
  L("Natural History Museum", "South Kensington (Museum Quarter)", "A Victorian cathedral-like museum of the natural world, with dinosaurs, minerals and a blue whale skeleton.", "Free general entry and a building worth seeing in itself.", HR, ["culture", "nature"], 150, FREE),
  L("Kew Gardens", "Kew", "The Royal Botanic Gardens, a UNESCO World Heritage Site with glasshouses and a treetop walkway.", "A full, restful day out of central London.", IY, ["nature", "photography"], 180),
  L("Greenwich: Royal Observatory & Cutty Sark", "Greenwich", "The home of the Prime Meridian and the historic tea clipper Cutty Sark, with views over the Thames.", "A distinctive maritime-history half-day by river.", HR, ["history", "photography"], 180),
  L("Hyde Park & Kensington Gardens", "South Kensington (Museum Quarter)", "A vast pair of royal parks with the Serpentine, Kensington Palace and the Diana Memorial Fountain.", "The best green space for a slow walk in the centre.", IS, ["nature"], 90, FREE),
  R("Padella", "Borough & Bankside", "A pasta restaurant at Borough Market serving fresh hand-rolled pasta.", "Excellent value pasta in a lively spot, with queues to match.", HR, ["food"], 60, "Italian pasta", ["Pici cacio e pepe", "Pappardelle with beef shin ragù"], ["lunch", "dinner"], "$$"),
  R("St. JOHN", "Smithfield", "A restaurant by Fergus Henderson that put nose-to-tail British cooking on the map.", "A defining modern British restaurant, in a former smokehouse.", IY, ["food"], 90, "British nose-to-tail", ["Roast bone marrow and parsley salad", "Eccles cake with Lancashire cheese"], ["lunch", "dinner"], "$$$", "Reserve ahead."),
  R("Kiln", "Soho & Covent Garden", "A Thai grill restaurant in Soho cooking over charcoal and clay pots.", "Bold, smoky Thai flavours at a counter you can walk into.", IS, ["food"], 75, "Thai grill", ["Clay pot baked glass noodles", "Grilled lamb skewers"], ["lunch", "dinner"], "$$"),
  R("Gymkhana", "Mayfair", "A Michelin-starred Indian restaurant in Mayfair inspired by colonial Indian clubs.", "A dressy, high-end Indian dinner.", IS, ["food", "luxury"], 120, "Modern Indian", ["Kid goat methi keema", "Tandoori lamb chops"], ["dinner"], "$$$$", "Reserve well ahead."),
  C("Flat White", "Soho & Covent Garden", "A pioneering Soho café that helped introduce the antipodean flat white to London.", "Flat white", "$$", "highly-recommended"),
  N("South Kensington (Museum Quarter)", "A grand Victorian district with free museums, Hyde Park and elegant white stucco terraces", ["Natural History Museum", "V&A", "Science Museum", "Royal Albert Hall"], ["culture", "art", "history"], "Weekday mornings, before the crowds"),
]

ADD["los-angeles"] = [
  L("LACMA & Urban Light", "Mid-Wilshire", "The Los Angeles County Museum of Art, with the Urban Light installation of restored street lamps outside.", "A very photogenic public art stop and the region's largest art museum.", IY, ["art", "photography"], 120),
  L("Walt Disney Concert Hall", "Downtown LA (DTLA)", "A Frank Gehry concert hall in steel, home of the LA Philharmonic.", "One of LA's most recognisable pieces of architecture.", IY, ["art", "culture", "photography"], 60),
  L("Venice Canals", "Santa Monica & Venice", "A residential network of canals and footbridges built in the early 1900s.", "A quiet, picturesque alternative to the Venice Boardwalk.", IS, ["photography"], 45, FREE),
  L("Hollywood Sign viewpoints", "Hollywood", "The famous hillside sign, best seen from Griffith Observatory or Lake Hollywood Park.", "Close enough for a photo without a long hike.", IY, ["photography"], 45, FREE),
  R("Philippe the Original", "Downtown LA (DTLA)", "A sawdust-floored deli claiming to have invented the French dip sandwich in 1908.", "An old-school LA institution, cheap and quick.", HR, ["food", "history"], 45, "American deli", ["French dip sandwich", "Pickled eggs"], ["lunch"], "$"),
  R("Pink's Hot Dogs", "Hollywood", "A roadside hot-dog stand open since 1939, with long queues and celebrity-named dogs.", "A classic LA snack stop.", IS, ["food"], 30, "American fast food", ["Chili dog"], ["lunch"], "$"),
  R("Musso & Frank Grill", "Hollywood", "Hollywood's oldest restaurant, open since 1919, with red banquettes and steaks.", "Old Hollywood atmosphere and classic martinis.", IY, ["food", "history"], 90, "American steakhouse", ["Steak", "Martini", "Flannel cakes"], ["dinner"], "$$$"),
  R("Gjusta", "Santa Monica & Venice", "A bakery, deli and smokehouse in Venice popular for breakfast and takeaway.", "A good place to assemble a beach picnic.", IS, ["food", "cafes"], 45, "Bakery / deli", ["Smoked fish", "Sandwiches", "Pastries"], ["breakfast", "lunch"], "$$"),
  C("Go Get Em Tiger", "Silver Lake & Los Feliz", "A neighbourhood coffee shop with outlets across LA, known for ground-roasted beans and breakfast items.", "Cold brew and pastries", "$$"),
  N("West Hollywood", "A compact, walkable city within LA known for nightlife, shopping and LGBTQ+ culture", ["Sunset Strip", "Melrose Avenue", "Santa Monica Boulevard nightlife"], ["nightlife", "shopping", "food"], "Evenings"),
]

ADD["new-york-city"] = [
  L("Grand Central Terminal", "Midtown Manhattan", "The 1913 Beaux-Arts train terminal with its celestial ceiling and Main Concourse clock.", "One of the most beautiful public spaces in New York, free to enter.", HR, ["history", "photography"], 45, FREE),
  L("American Museum of Natural History", "Upper West Side", "One of the world's largest natural history museums, with dinosaur halls and the Hayden Planetarium.", "A classic New York museum day, good with kids.", IY, ["culture", "nature"], 180),
  L("Washington Square Park", "West Village / Greenwich Village", "The centre of Greenwich Village, with its arch, fountain and street performers.", "A lively people-watching spot.", IS, ["culture", "photography"], 30, FREE),
  L("Times Square", "Midtown Manhattan", "The neon-lit intersection of Broadway and Seventh Avenue.", "Overwhelming and crowded, but an essential New York sight at night.", IS, ["photography"], 30, FREE),
  R("Ess-a-Bagel", "Midtown Manhattan", "A classic New York bagel shop known for large, chewy hand-rolled bagels.", "A very New York breakfast.", IY, ["food"], 30, "Bagels", ["Bagel with cream cheese and lox"], ["breakfast"], "$"),
  R("Los Tacos No. 1", "Chelsea", "A taco stand in Chelsea Market serving tacos made from Tijuana-style recipes.", "Fresh tortillas and a fast-moving line.", IS, ["food"], 30, "Mexican", ["Adobada taco", "Carne asada"], ["lunch"], "$"),
  R("Prince Street Pizza", "SoHo & Nolita", "A Nolita slice shop famous for its thick, square pepperoni slice.", "The long queue is worth it for the pepperoni square.", IS, ["food"], 30, "Pizza", ["Spicy Spring pepperoni square"], ["lunch"], "$"),
  R("The Halal Guys", "Midtown Manhattan", "A halal street cart that became a chain, famous for chicken-and-rice platters with white sauce.", "A classic New York street-food platter.", IS, ["food"], 20, "Halal street food", ["Chicken over rice", "Gyro platter"], ["lunch", "dinner"], "$"),
  C("Caffè Reggio", "West Village / Greenwich Village", "A Greenwich Village café open since 1927, claimed to have brought the cappuccino machine to the US.", "Cappuccino in a historic café", "$$"),
  N("Midtown Manhattan", "The commercial heart of New York with Broadway, Grand Central and Rockefeller Center", ["Times Square", "Grand Central Terminal", "Rockefeller Center"], ["culture", "photography"], "Evenings for the lights"),
  T("Philadelphia", "The historic city where the United States declared independence, with Independence Hall and the Liberty Bell.", "~150 km", "1 hr 15 min by Amtrak or ~1.5 hr by bus", "full-day", "Amtrak from Penn Station, or intercity buses.", ["Independence Hall", "Liberty Bell", "Reading Terminal Market"]),
]

ADD["paris"] = [
  L("Musée de l'Orangerie", "1st arrondissement", "A small museum in the Tuileries Garden best known for Monet's large Water Lilies murals.", "An easy, intimate and very beautiful hour.", HR, ["art", "culture"], 75),
  L("Panthéon", "Latin Quarter", "A neoclassical monument housing the tombs of French national figures, including Voltaire, Rousseau, Hugo and Marie Curie.", "A grand building with a dome-top view and a pendulum.", IY, ["history", "culture"], 75),
  L("Musée Rodin", "7th arrondissement", "A museum in the 18th-century Hôtel Biron with Rodin's sculptures in its garden, including The Thinker.", "One of the most pleasant museum gardens in Paris.", HR, ["art", "culture"], 90),
  L("Place des Vosges", "Le Marais", "Paris's oldest planned square, a symmetrical arcade of red-brick houses and a garden.", "A free, elegant stop in the middle of the Marais.", IS, ["history", "photography"], 30, FREE),
  R("Breizh Café", "Le Marais", "A crêperie in the Marais serving buckwheat galettes and sweet crêpes with Breton ingredients.", "A modern, well-regarded take on Breton crêpes.", HR, ["food"], 60, "Breton crêperie", ["Buckwheat galette", "Salted-butter caramel crêpe"], ["lunch", "dinner"], "$$"),
  R("Le Relais de l'Entrecôte", "Saint-Germain-des-Prés", "A restaurant serving a set menu of steak-frites with a secret sauce and unlimited fries.", "A no-choice classic, with a line outside at dinner.", IS, ["food"], 75, "French steakhouse", ["Steak-frites with secret sauce"], ["lunch", "dinner"], "$$"),
  R("Bouillon Pigalle", "Montmartre", "A modern take on the traditional Parisian bouillon, with classic dishes at low prices.", "Classic French food at budget prices in a large room.", IS, ["food"], 75, "French bouillon", ["Œuf mayonnaise", "Steak tartare", "Profiteroles"], ["lunch", "dinner"], "$"),
  R("Chez Gladines", "Butte-aux-Cailles", "A Basque-style bistro in the Butte-aux-Cailles, known for large portions at modest prices.", "A very local, student-friendly neighbourhood spot.", IS, ["food"], 75, "Basque-influenced bistro", ["Piperade", "Cassoulet"], ["lunch", "dinner"], "$$"),
  C("Coutume Café", "7th arrondissement", "A specialty coffee roaster and café that helped start Paris's third-wave coffee scene.", "Filter coffee and pastries", "$$"),
  N("Oberkampf & Bastille", "A lively east-side district of bars, small clubs and casual restaurants", ["Rue Oberkampf bars", "Bastille Opera", "Passage Lhomme"], ["nightlife", "food"], "Evenings"),
  T("Fontainebleau", "A royal château and forest, the residence of French sovereigns for centuries.", "~60 km", "~40 min by train plus a short bus ride", "full-day", "Train from Gare de Lyon to Fontainebleau-Avon, then bus to the château.", ["Château de Fontainebleau", "Forest walks", "Gardens"]),
]

ADD["rome"] = [
  L("Capitoline Museums", "Centro Storico", "The oldest public museums in the world, on Michelangelo's Piazza del Campidoglio.", "Great ancient sculptures and a superb rooftop view over the Forum.", HR, ["art", "history"], 120),
  L("Spanish Steps", "Centro Storico", "A monumental stairway of 135 steps connecting Piazza di Spagna to Trinità dei Monti.", "A classic Roman meeting place and photo spot.", IS, ["photography"], 30, FREE),
  L("Villa Borghese Gardens", "Centro Storico", "Rome's large landscaped park with lakes, a zoo and several museums.", "A good green break between sights.", IS, ["nature"], 90, FREE),
  L("Appian Way (Via Appia Antica)", "Appia Antica", "The ancient Roman road lined with catacombs, tombs and villas, now a regional park.", "A peaceful, atmospheric contrast to the centre.", IY, ["history", "nature"], 180),
  R("Pizzeria Ai Marmi", "Trastevere", "A lively marble-topped pizzeria in Trastevere serving thin Roman pizza, nicknamed 'L'Obitorio'.", "Authentic, crispy Roman pizza at fair prices.", HR, ["food"], 75, "Roman pizza", ["Margherita", "Supplì", "Fiori di zucca"], ["dinner"], "$$"),
  R("Felice a Testaccio", "Testaccio", "A Testaccio trattoria known for cacio e pepe, finished at the table.", "One of the classic Roman pasta restaurants.", HR, ["food"], 90, "Roman trattoria", ["Cacio e pepe", "Tonnarelli", "Carbonara"], ["lunch", "dinner"], "$$", "Reserve ahead."),
  R("Trattoria Da Teo", "Trastevere", "A small Trastevere trattoria serving Roman classics on a quiet square.", "A traditional meal on a quiet piazza.", IS, ["food"], 75, "Roman trattoria", ["Amatriciana", "Carbonara", "Saltimbocca"], ["lunch", "dinner"], "$$"),
  R("Forno Campo de' Fiori", "Centro Storico", "A bakery on Campo de' Fiori known for pizza bianca and other baked goods.", "A quick and cheap snack from a long-time local favourite.", IS, ["food"], 20, "Bakery", ["Pizza bianca", "Pizza rossa"], ["breakfast", "lunch"], "$"),
  C("Barnum Café", "Centro Storico", "A cosy café on Via del Pellegrino with a vintage feel, known for coffee and cakes.", "Cappuccino and cake", "$$"),
  N("Jewish Ghetto (Ghetto Ebraico)", "Rome's historic Jewish quarter, with ancient ruins and Roman-Jewish cooking", ["Carciofi alla giudia", "Portico d'Ottavia", "Great Synagogue"], ["food", "history", "culture"], "Lunchtime"),
  T("Orvieto", "A hill town in Umbria with a striking Gothic cathedral and underground caves.", "~120 km", "~1 hr 15 min by direct train", "full-day", "Direct train from Roma Termini; funicular from the station to the town.", ["Orvieto Cathedral", "Underground caves", "Wine bars"]),
]

ADD["seoul"] = [
  L("Jogyesa Temple", "Insadong", "The head temple of the Jogye Order of Korean Buddhism, in the middle of Insadong.", "A calm, active temple that is free to enter.", HR, ["culture", "history"], 45, FREE),
  L("Cheonggyecheon Stream", "Jung-gu", "A restored stream that runs for several kilometres through downtown Seoul.", "A walkable, tree-lined escape from the city.", IY, ["nature", "photography"], 60, FREE),
  L("National Museum of Korea", "Yongsan", "One of the world's largest museums of Korean history and art.", "A thorough, free introduction to Korean history.", HR, ["history", "culture", "art"], 150, FREE),
  L("Insadong Culture Street", "Insadong", "A pedestrian street of traditional tea houses, galleries and craft shops.", "A good place for souvenirs and tea.", IY, ["shopping", "culture"], 90, FREE),
  R("Hadongkwan", "Myeongdong", "A long-running Myeongdong restaurant famous for gomtang (clear beef soup), open since 1939.", "A very traditional, simple Korean meal.", IY, ["food", "history"], 45, "Korean soup", ["Gomtang"], ["lunch"], "$$"),
  R("Wooraeoak", "Jung-gu", "A well-known naengmyeon restaurant serving cold buckwheat noodles.", "The classic Pyongyang-style cold noodles.", IY, ["food"], 45, "Korean noodles", ["Mul naengmyeon", "Bulgogi"], ["lunch"], "$$"),
  R("Balwoo Gongyang", "Jongno", "A temple-cuisine restaurant run by a Buddhist nun and chef, serving vegetarian course meals.", "A thoughtful, vegetarian introduction to Korean temple food.", IS, ["food", "culture"], 120, "Korean temple food (vegetarian)", ["Temple cuisine course"], ["lunch", "dinner"], "$$$$", "Reservation recommended."),
  R("Samcheongdong Sujebi", "Bukchon Hanok Village", "A long-running restaurant in Samcheong-dong known for sujebi (hand-torn dough soup).", "A comforting local bowl after a walk around Bukchon.", IS, ["food"], 45, "Korean soup", ["Sujebi", "Pajeon"], ["lunch", "dinner"], "$$"),
  C("Fritz Coffee Company", "Mapo", "A roastery known for its Mangwon branch and the 'Old Fritz' signature blend.", "Filter coffee and espresso", "$$"),
  N("Itaewon", "An international neighbourhood of restaurants, bars and shops below Namsan", ["International restaurants", "Antique Furniture Street", "Nightlife"], ["nightlife", "food"], "Evenings"),
  T("Suwon Hwaseong Fortress", "A UNESCO World Heritage fortress wall from the 18th century, with gates and a walking trail.", "~30 km", "~1 hr by subway or train", "full-day", "Subway line 1 or a train from Seoul Station to Suwon Station, then bus or taxi.", ["Fortress wall walk", "Hwaseong Haenggung", "Suwon galbi"]),
]

ADD["singapore"] = [
  L("Singapore Botanic Gardens", "Tanglin", "A UNESCO World Heritage garden with the National Orchid Garden and a rainforest.", "A lush, free and well-kept escape from the city.", HR, ["nature", "photography"], 120, FREE),
  L("Raffles Hotel", "Marina Bay", "The colonial-era hotel where the Singapore Sling was invented.", "A piece of Singapore history and architecture.", IY, ["history", "luxury"], 60),
  L("ArtScience Museum", "Marina Bay", "The lotus-shaped museum at Marina Bay Sands with immersive exhibitions.", "A distinctive building with changing exhibitions.", IS, ["art", "culture"], 90),
  L("Haw Par Villa", "West Coast", "A free theme park of dioramas depicting Chinese folklore and the ten courts of hell.", "One of Singapore's weirdest and most memorable stops.", IS, ["culture", "photography"], 90, FREE),
  R("Old Airport Road Food Centre", "Geylang", "A hawker centre known for some of Singapore's most-loved hawker stalls.", "A local favourite among Singapore's best hawker centres.", HR, ["food"], 60, "Hawker", ["Chwee kueh", "Wanton noodles", "Rojak"], ["lunch", "dinner"], "$"),
  R("Song Fa Bak Kut Teh", "Clarke Quay", "A famed bak kut teh restaurant serving peppery pork rib soup.", "A warming, classic Singaporean dish.", IY, ["food"], 45, "Singaporean-Chinese", ["Pork rib soup", "You tiao"], ["lunch", "dinner"], "$$"),
  R("Komala Vilas", "Little India", "A long-running vegetarian restaurant in Little India known for banana leaf meals and dosas.", "A reliable vegetarian meal in Little India.", IS, ["food"], 60, "South Indian vegetarian", ["Banana leaf meal", "Masala dosa"], ["breakfast", "lunch", "dinner"], "$"),
  R("Ya Kun Kaya Toast", "Chinatown", "The traditional kopitiam breakfast of kaya toast, soft-boiled eggs and kopi.", "The quintessential Singapore breakfast.", IS, ["food"], 30, "Kopitiam", ["Kaya toast set", "Soft-boiled eggs", "Kopi"], ["breakfast"], "$"),
  C("Chye Seng Huat Hardware", "Jalan Besar", "A café and roastery in a former hardware store on Tyrwhitt Road.", "Single-origin coffee and brunch", "$$"),
  N("Orchard Road", "Singapore's main shopping boulevard of malls, department stores and landscaped walkways", ["Shopping malls", "Christmas lights", "Botanic Gardens nearby"], ["shopping", "luxury"], "Weekday afternoons", True),
  T("Johor Bahru", "Malaysia's southern city across the Causeway, reachable in under an hour.", "~25 km", "~1 hr including immigration", "full-day", "Bus 170 from Queen Street, or the KTM Shuttle Tebrau train from Woodlands; bring your passport.", ["Arulmigu Sri Rajakaliamman Glass Temple", "Food courts", "Johor Premium Outlets"]),
]

ADD["sydney"] = [
  L("Queen Victoria Building", "Sydney CBD", "A Romanesque Revival shopping arcade from 1898 with stained glass and a famous clock.", "A beautiful historic arcade in the middle of the city.", IS, ["shopping", "history"], 45, FREE),
  L("Museum of Contemporary Art Australia", "Circular Quay & The Rocks", "A contemporary art museum on Circular Quay with a rooftop café and harbour views.", "A strong, accessible art stop right on the harbour.", IY, ["art", "culture"], 90),
  L("Barangaroo Reserve", "Barangaroo", "A restored headland park on the harbour, with sandstone paths and views.", "A good free walk with views back to the Harbour Bridge.", IS, ["nature", "photography"], 60, FREE),
  L("Watsons Bay", "Watsons Bay", "A harbour-side village with Hornby Lighthouse and the dramatic South Head cliffs.", "A relaxed half-day by ferry with a seafood lunch.", HR, ["nature", "photography", "food"], 150),
  R("Doyles on the Beach", "Watsons Bay", "A third-generation seafood restaurant on Watsons Bay with views of the city skyline.", "Seafood with a skyline view, best reached by ferry.", HR, ["food", "photography"], 90, "Seafood", ["Fish and chips", "Seafood platter"], ["lunch", "dinner"], "$$$", "Book weekend lunch ahead."),
  R("Harry's Cafe de Wheels", "Woolloomooloo", "A pie cart that has been serving meat pies with peas and mash since 1938.", "A late-night Sydney institution.", IS, ["food", "history"], 20, "Australian pies", ["Tiger pie", "Pie with peas and mash"], ["any"], "$"),
  R("Mamak", "Haymarket", "A Malaysian restaurant in Haymarket known for roti canai made in the window.", "A fast-moving, cheap, tasty meal.", IS, ["food"], 45, "Malaysian", ["Roti canai", "Satay", "Nasi lemak"], ["lunch", "dinner"], "$"),
  R("Sydney Cove Oyster Bar", "Circular Quay & The Rocks", "A waterfront oyster bar on the eastern side of Circular Quay with a view of the Opera House.", "Oysters with a very good view.", IS, ["food", "photography"], 75, "Seafood", ["Oysters", "Seafood platter"], ["lunch", "dinner"], "$$$"),
  C("Campos Coffee", "Newtown", "A Sydney specialty roaster whose flagship café is in Newtown.", "Flat white", "$$"),
  N("Darling Harbour & Barangaroo", "A waterfront entertainment district with restaurants, museums and new harbour-front parks", ["Barangaroo Reserve", "Darling Harbour", "Australian National Maritime Museum"], ["food", "culture"], "Evening"),
  T("Royal National Park", "The world's second-oldest national park, with coastal cliffs, beaches and walking tracks.", "~30 km", "~1 hr by train", "full-day", "Train to Cronulla or Otford, or drive.", ["Coast Track", "Wattamolla beach", "Figure Eight Pools"]),
]

ADD["tokyo"] = [
  L("Imperial Palace East Gardens", "Chiyoda", "The former Edo Castle grounds, now a public garden with stone walls and tower foundations.", "A calm, free green space in the centre of Tokyo.", IY, ["history", "nature"], 90, FREE),
  L("Tokyo Tower", "Minato", "The 333-metre red-and-white lattice tower completed in 1958.", "A retro icon with night views of the city.", IY, ["photography", "history"], 75),
  L("Ueno Park", "Ueno", "A large park with museums, a zoo and a shrine, and one of the best cherry-blossom spots in Tokyo.", "A museum quarter and cherry blossoms in the same park.", IY, ["nature", "culture", "art"], 120, FREE),
  L("Hamarikyu Gardens", "Ginza", "A landscaped Edo-period garden with a tidal pond and a tea house, set against the skyscrapers of Shiodome.", "A calm, traditional garden a short walk from Ginza, with a teahouse on the pond.", IY, ["nature", "photography"], 75),
  R("Gyukatsu Motomura", "Shibuya", "A restaurant serving breaded beef cutlet that diners finish on a small hot plate.", "A fun and filling lunch in Shibuya.", HR, ["food"], 45, "Gyukatsu (beef cutlet)", ["Gyukatsu set"], ["lunch", "dinner"], "$$"),
  R("Uobei Shibuya Dogenzaka", "Shibuya", "A conveyor-belt sushi restaurant where orders are placed on touch screens and delivered by rail.", "A cheap, entertaining and quick sushi meal.", IS, ["food"], 40, "Conveyor-belt sushi", ["Salmon nigiri", "Tuna nigiri"], ["lunch", "dinner"], "$"),
  R("Rokurinsha (Tokyo Station Ramen Street)", "Chiyoda", "A popular tsukemen (dipping noodle) shop in the Tokyo Ramen Street under Tokyo Station.", "A top tsukemen stop right at Tokyo Station.", IY, ["food"], 45, "Tsukemen (ramen)", ["Tsukemen"], ["lunch", "dinner"], "$$"),
  R("Umegaoka Sushi no Midori", "Shibuya", "A popular sushi restaurant known for large pieces of fish at moderate prices.", "A Tokyo favourite for good value sushi, often with a queue.", IS, ["food"], 60, "Sushi", ["Nigiri sets"], ["lunch", "dinner"], "$$"),
  C("Fuglen Tokyo", "Shibuya", "A Tokyo outpost of the Oslo coffee bar, with vintage Scandinavian furniture.", "Coffee in the day, cocktails by night", "$$"),
  N("Harajuku & Omotesando", "Youth fashion on Takeshita Street meets tree-lined boulevards of luxury architecture", ["Takeshita Street", "Meiji Jingu", "Omotesando architecture"], ["shopping", "photography", "culture"], "Weekday mornings, before the crowds"),
]

ADD["vienna"] = [
  L("Karlskirche", "Innere Stadt (City Center)", "A baroque church with a huge dome, flanked by two columns inspired by Trajan's Column.", "One of Vienna's most striking baroque buildings, and a panoramic lift inside.", IY, ["history", "photography"], 45),
  L("Kunsthistorisches Museum", "Innere Stadt (City Center)", "A museum of fine art with Habsburg collections, including Bruegel's masterpieces.", "One of the world's great art museums, in an opulent building.", HR, ["art", "history"], 150),
  L("Hundertwasserhaus", "Landstraße", "A colourful apartment building designed by Friedensreich Hundertwasser.", "A quirky counterpoint to imperial Vienna.", IS, ["art", "photography"], 30, FREE),
  L("Spanish Riding School", "Innere Stadt (City Center)", "The home of the Lipizzaner horses, performing classical dressage in the Hofburg.", "A uniquely Viennese tradition.", IS, ["culture", "history"], 90),
  R("Zum Schwarzen Kameel", "Innere Stadt (City Center)", "A historic delicatessen and restaurant, in business since 1618, known for open-faced sandwiches.", "A classic Viennese lunch stop.", IY, ["food", "history"], 60, "Viennese deli", ["Brötchen (open-faced sandwiches)", "Schnitzel"], ["lunch", "dinner"], "$$$"),
  R("Bitzinger Würstelstand", "Innere Stadt (City Center)", "A sausage stand outside the Albertina, a Viennese standby for a quick bite.", "A quick, cheap and very Viennese snack.", IS, ["food"], 20, "Austrian sausage", ["Käsekrainer", "Bratwurst"], ["any"], "$"),
  R("Café Landtmann", "Innere Stadt (City Center)", "A grand coffee house on the Ringstrasse next to the Burgtheater, open since 1873.", "A traditional Viennese coffee house with Ringstrasse views.", IS, ["food", "cafes", "history"], 75, "Viennese coffee house", ["Apfelstrudel", "Wiener Melange"], ["breakfast", "lunch"], "$$$"),
  R("Skopik & Lohn", "Leopoldstadt", "A cosy neighbourhood restaurant in Leopoldstadt with a seasonal Austrian menu.", "A local-feeling evening away from the central sights.", IS, ["food"], 90, "Modern Austrian", ["Seasonal Austrian dishes"], ["dinner"], "$$"),
  C("Café Sperl", "MuseumsQuartier & Neubau", "A traditional coffee house from 1880 with billiard tables and period décor.", "Melange and Sperl-Torte", "$$"),
  N("Josefstadt", "A quiet, elegant district behind the City Hall with theatres, cafés and quiet streets", ["Theater in der Josefstadt", "Quiet cafés", "Courtyard restaurants"], ["culture", "cafes"], "Late afternoon"),
  T("Baden bei Wien", "A spa town south of Vienna with Biedermeier architecture, thermal baths and a park.", "~26 km", "~1 hr by Badner Bahn tram", "half-day", "Badner Bahn from Oper/Karlsplatz or Wiener Neustadt line.", ["Kurpark", "Thermal baths", "Biedermeier old town"]),
]

ADD["zurich"] = [
  L("Lindenhof", "Altstadt (Old Town)", "A hilltop square on the site of a Roman fort, with views over the river Limmat and old town.", "The best free viewpoint in the old town.", HR, ["history", "photography"], 30, FREE),
  L("Lindt Home of Chocolate", "Kilchberg", "A chocolate museum and shop in Kilchberg on the lake, with a large chocolate fountain.", "A fun chocolate-centred day out, with tasting.", IS, ["food", "culture"], 120),
  L("Museum Rietberg", "Enge", "A museum of non-European art in a park villa and a modern extension.", "A beautiful setting and a striking collection.", IS, ["art", "culture"], 90),
  L("Zürich Zoo", "Zürichberg", "A zoo on the Zürichberg famous for its Masoala Rainforest hall.", "A good family option, with a rainforest under glass.", IS, ["nature"], 180),
  R("Café Odeon", "Seefeld", "A historic café at Bellevue where Lenin, Einstein and others are said to have sat.", "A Jugendstil café with a long literary history.", IY, ["food", "cafes", "history"], 75, "Café", ["Coffee", "Light meals"], ["breakfast", "lunch"], "$$$"),
  R("Raclette Stube", "Altstadt (Old Town)", "A cosy restaurant in the Old Town serving raclette and fondue.", "A cosy, traditional Swiss cheese dinner.", IY, ["food"], 90, "Swiss cheese", ["Raclette", "Fondue"], ["dinner"], "$$$"),
  R("Zunfthaus zur Waag", "Altstadt (Old Town)", "A guild house on Münsterhof with a restaurant serving Zurich specialities.", "A historic setting for local dishes.", IS, ["food", "history"], 90, "Swiss", ["Zürcher Geschnetzeltes", "Rösti"], ["lunch", "dinner"], "$$$"),
  R("Zum Kropf", "Altstadt (Old Town)", "A beer-hall style restaurant close to Paradeplatz with hearty Swiss and Bavarian dishes.", "A big-portion Swiss lunch in an ornate beer hall.", IS, ["food"], 75, "Swiss / Bavarian", ["Bratwurst", "Sauerkraut", "Schnitzel"], ["lunch", "dinner"], "$$"),
  C("Café Terrasse", "Seefeld", "A café on the Limmat with a river-side terrace.", "Coffee on the riverside", "$$$"),
  N("Langstrasse (Kreis 4)", "A multicultural district known for nightlife, bars and street art", ["Bars and clubs", "Street art", "International food"], ["nightlife", "food"], "Evenings"),
]

SRC_ORDER = ["landmarks", "restaurants", "cafes", "neighborhoods", "dayTrips"]

def main():
    for slug, items in ADD.items():
        path = os.path.join(ROOT, "lib", "data", f"{slug}.ts")
        text = open(path).read()
        if "// [added-v2]" in text:
            print("skip", slug)
            continue
        by = {}
        for sect, line in items:
            by.setdefault(sect, []).append(line)
        lines = text.split("\n")
        out = []
        cur = None
        for line in lines:
            m = re.match(r"  (\w+): \[$", line)
            if m:
                cur = m.group(1)
            if re.match(r"  \],", line) and cur in by:
                out.extend(by[cur])
                cur = None
            elif re.match(r"  \],", line):
                cur = None
            out.append(line)
        # mark file
        text2 = "\n".join(out)
        text2 = text2.replace("export const", "// [added-v2] records appended by scripts/_add_records.py\nexport const", 1)
        open(path, "w").write(text2)
        print("updated", slug, {k: len(v) for k, v in by.items()})

main()
