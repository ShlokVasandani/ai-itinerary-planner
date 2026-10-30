import type { Interest } from "../../../lib/types";

/** Maps Wikidata "instance of" labels to what the planner needs: whether to keep the item, its interests and a typical visit length. */

const ACCEPT =
  /museum|gallery|cathedral|church|basilica|chapel|abbey|monastery|convent|temple|shrine|mosque|synagogue|pagoda|stupa|mausoleum|tomb|castle|fortress|fort\b|palace|manor|chateau|château|citadel|ruins?|archaeological|monument|memorial|statue|fountain|gate\b|city wall|tower|bridge|square|plaza|park|garden|zoo|aquarium|botanical|beach|waterfall|lake|mountain|hill\b|volcano|cave|island|viewpoint|lighthouse|observatory|market|bazaar|souk|opera|theatre|theater|concert hall|cultural center|skyscraper|amusement park|theme park|tourist|attraction|heritage|world heritage|landmark|promenade|boulevard|pier|harbou?r|canal|cemetery|arch\b|obelisk|windmill|aqueduct|old town|historic district|hall\b|pavilion|boardwalk|national park|nature reserve|water park|funicular|cable car/i;
const REJECT =
  /operation|event\b|incident|massacre|assassination|disaster|library|archive|university|faculty|school|college|hospital|company|corporation|publishing|research|institute|academy|newspaper|football|sports club|sports team|television|radio|political|party|battle|war\b|uprising|rebellion|shooting|murder|treaty|election|historical country|former country|state\b|kingdom|empire|dynasty|human settlement|village|municipality of|district of|cadastral|electoral|administrative|metro\b|rapid transit|railway|train station|bus station|airport|highway|road\b|street\b|neighborhood|neighbourhood|quarter\b|ward\b|borough|urban area|city or town|region|province|county|prison|barracks|embassy|ministry|parliament building|government|court\b|bank\b|hotel|office building|business|apartment|residential|stadium|arena|racecourse|football venue|sports venue|exhibition centre|convention/i;

export interface Classified {
  keep: boolean;
  interests: Interest[];
  minutes: number;
  kind: string;
}

export function classify(types: string[]): Classified {
  const t = types.join(" | ").toLowerCase();
  const none: Classified = { keep: false, interests: [], minutes: 60, kind: "" };
  if (!t) return none;
  const accepted = types.filter((x) => ACCEPT.test(x) && !REJECT.test(x));
  // An item may carry both an accepted and a rejected type (a museum that is also an "organization");
  // keep it when at least one accepted type survives rejection.
  if (accepted.length === 0) return none;
  const a = accepted.join(" | ").toLowerCase();
  const interests = new Set<Interest>();
  let minutes = 60;
  const kind = accepted[0];
  const has = (re: RegExp) => re.test(a);
  if (has(/museum|gallery/)) {
    interests.add("art");
    interests.add("culture");
    minutes = 120;
  }
  if (has(/art museum|gallery|modern art/)) interests.add("art");
  if (has(/history museum|archaeolog|ruin|castle|fortress|fort\b|palace|citadel|manor|chateau|château|monument|memorial|tomb|mausoleum|city wall|heritage|old town|historic|cemetery|aqueduct|obelisk|arch\b/)) {
    interests.add("history");
    minutes = has(/castle|palace|fortress|citadel/) ? 120 : Math.max(minutes, 60);
  }
  if (has(/cathedral|church|basilica|chapel|abbey|monastery|convent|temple|shrine|mosque|synagogue|pagoda|stupa/)) {
    interests.add("history");
    interests.add("culture");
    minutes = 45;
  }
  if (has(/park|garden|botanical|beach|waterfall|lake|mountain|hill\b|volcano|cave|island|nature reserve|national park/)) {
    interests.add("nature");
    minutes = 90;
  }
  if (has(/beach|island|promenade|pier|boardwalk/)) interests.add("beaches");
  if (has(/zoo|aquarium|amusement|theme park|water park/)) {
    interests.add("adventure");
    minutes = has(/zoo|amusement|theme park|water park/) ? 180 : 120;
  }
  if (has(/tower|bridge|viewpoint|lighthouse|observatory|skyscraper|square|plaza|fountain|statue|gate\b|funicular|cable car|windmill|canal|harbou?r|pier|boulevard/)) {
    interests.add("photography");
    minutes = Math.min(minutes, has(/tower|observatory|funicular|cable car/) ? 60 : 30);
  }
  if (has(/market|bazaar|souk/)) {
    interests.add("shopping");
    interests.add("food");
    minutes = 75;
  }
  if (has(/opera|theatre|theater|concert hall|cultural center/)) {
    interests.add("culture");
    minutes = 90;
  }
  if (interests.size === 0) {
    interests.add("culture");
    interests.add("photography");
  }
  return { keep: true, interests: [...interests].slice(0, 4), minutes, kind };
}
