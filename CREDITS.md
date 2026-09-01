# Photo credits

This same information is also visible live at `/credits` when running the app,
and linked from the site footer on every page.

All destination photography is real, sourced from Wikimedia Commons, and
individually verified (each file's existence, subject, and license were
confirmed via live search against the current Commons site — not copied
from an unverified list).

Images are hotlinked directly from Wikimedia's CDN via their stable
`Special:FilePath` redirect endpoint (see `lib/city-photo-urls.ts`), rather
than bundled as local files, because this project was built in a sandboxed
environment with no network access to any image host. To switch to fully
local files instead, drop a photo at `public/images/destinations/<slug>.jpg`
for any city — see `lib/destination-photo.ts`, which is checked first and
takes priority over the remote URL.

| City | File | Credit | License |
|---|---|---|---|
| Tokyo | Shibuya crossing.jpg | Hide1228 | CC BY-SA 4.0 |
| Paris | Eiffel tower paris france.jpg | Public domain (Pixabay import) | CC0 |
| London | London Tower Bridge 22.jpg | Dronepicr | CC BY 3.0 |
| Dubai | Dubai Skyline 2016.jpg | Tonenight | CC BY-SA 4.0 |
| Singapore | Marina Bay Sands, Singapore, August 2023.jpg | Ralffralff | CC BY-SA 4.0 |
| Bangkok | Wat Arun Ratchawararam Ratchawaramahawihan Temple.jpg | Krishnagopi06 | CC BY-SA 4.0 |
| Rome | Colosseum in rome.jpg | Silviomerci1971 | CC BY-SA 4.0 |
| Barcelona | Barcelona Sagrada familia.jpg | Ot Pi | CC BY-SA 3.0 |
| New York City | New York City skyline.jpg | William Warby | CC BY 2.0 |
| Istanbul | Istanbul Hagia Sophia Sultanahmed.JPG | Julian Nyča | CC BY-SA 4.0 |
| Seoul | Gwanghwamun is the main gate to the south of Gyeongbokgung Palace.jpg | Pinterpandai | CC BY-SA 4.0 |
| Amsterdam | Colorful canal houses at golden hour in Damrak avenue Amsterdam the Netherlands.jpg | Basile Morin | CC BY-SA 4.0 |
| Copenhagen | Nyhavn Copenhagen 2.jpg | Kallerna | CC BY-SA 4.0 |
| Hong Kong | Hong-Kong skyline.JPG | Public domain | CC0 |
| Sydney | Sydney Harbour Bridge and Sydney Opera House panorama.jpg | Kgbo | CC BY-SA 4.0 |
| Zurich | Panoramablick auf die Altstadt von Zürich und den Zürichsee.jpg | MadGeographer | CC BY-SA 3.0 |
| Los Angeles | Bust of James Dean with Hollywood Sign in Background - Griffith Observatory - Los Angeles, CA - USA (6914401045).jpg | Adam Jones | CC BY-SA 2.0 |
| Kuala Lumpur | Petronas Towers view2, Kuala Lumpur.jpg | Gryffindor (public domain release) | Public domain |
| Vienna | Schönbrunn Palace, Vienna.JPG | Gveret Tered | CC0 |
| Lisbon | Tram28lisboa.jpg | Taguelmoust | CC BY 3.0 |

CC BY / CC BY-SA licensed files require attribution if reused/modified
outside this project's own display of them; the table above plus each
`sourcePage` link in `lib/city-photo-urls.ts` provides that attribution
trail. CC0 and public-domain files have no such requirement.
