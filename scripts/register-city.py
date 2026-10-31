#!/usr/bin/env python3
"""Registers a hand-authored city (lib/data/<slug>.ts exporting <camel> and <camel>Meta) in lib/data/index.ts. Idempotent."""
import re, sys, os, json
root = os.path.join(os.path.dirname(__file__), "..")
idx = os.path.join(root, "lib/data/index.ts")
def camel(slug):
    parts = slug.split("-")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])
s = open(idx).read()
for slug in sys.argv[1:]:
    c = camel(slug)
    gen = os.path.join(root, f"lib/data/generated/{slug}.json")
    if not os.path.exists(gen):
        open(gen, "w").write("{}\n")
    if f'from "./{slug}"' in s:
        continue
    s = s.replace("// [more-imports]", f'import {{ {c}, {c}Meta }} from "./{slug}";\n// [more-imports]')
    s = s.replace("// [more-generated-imports]", f'import {c}Generated from "./generated/{slug}.json";\n// [more-generated-imports]')
    s = s.replace("  // [more-sources]", f"  {c},\n  // [more-sources]")
    s = s.replace("  // [more-meta]", f'  "{slug}": {c}Meta,\n  // [more-meta]')
    s = s.replace("  // [more-generated]", f'  "{slug}": {c}Generated as unknown as GeneratedCity,\n  // [more-generated]')
open(idx, "w").write(s)
