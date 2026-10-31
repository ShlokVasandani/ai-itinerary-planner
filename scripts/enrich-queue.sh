#!/bin/bash
# Enriches every registered city whose generated overlay is still empty (OSM coords/hours/URLs, then Wikidata fallback).
# Runs one city at a time to respect Nominatim's 1 request/second policy. Stops when /tmp/enrich-stop exists.
cd "$(dirname "$0")/.."
while [ ! -f /tmp/enrich-stop ]; do
  next=""
  for f in lib/data/generated/*.json; do
    slug=$(basename "$f" .json)
    if [ "$(tr -d ' \n' < "$f")" = "{}" ]; then next="$slug"; break; fi
  done
  if [ -z "$next" ]; then sleep 30; continue; fi
  echo "$(date +%T) enriching $next"
  npx tsx scripts/enrich-geo.ts "$next" 2>&1 | tail -2
  npx tsx scripts/geo-fallback.ts "$next" 2>&1 | tail -2
done
