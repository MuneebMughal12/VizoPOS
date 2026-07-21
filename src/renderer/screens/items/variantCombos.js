// Pure helpers for the variant combination generator. Kept separate from
// the modal so the logic is easy to reason about and test.

// Split on newlines or commas; trim; drop blanks; dedupe case-insensitively
// while keeping the first-seen casing.
export function parseList(text) {
  const seen = new Set();
  const out = [];
  for (const raw of String(text || '').split(/[\n,]/)) {
    const v = raw.trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

// Identity of a variant = group + name, case-insensitive. Used to skip
// duplicates on generation.
export function variantKey(group, name) {
  return `${String(group || '').trim().toLowerCase()}|${String(name || '').trim().toLowerCase()}`;
}

// Build variant rows from the two lists.
//  - both filled  -> group × size combinations (group=g, name=size)
//  - only one     -> plain variants (name = each value, no group)
//  - neither      -> []
// Result is deduped within itself.
export function buildCombos(groupText, sizeText) {
  const groups = parseList(groupText);
  const sizes = parseList(sizeText);

  let rows = [];
  if (groups.length && sizes.length) {
    for (const g of groups) for (const s of sizes) rows.push({ group: g, name: s, price: '' });
  } else {
    const vals = groups.length ? groups : sizes;
    for (const v of vals) rows.push({ group: '', name: v, price: '' });
  }

  const seen = new Set();
  return rows.filter((r) => {
    const k = variantKey(r.group, r.name);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Merge generated rows into existing variants.
//  mode 'replace' -> generated rows become the whole list (focus starts at 0)
//  mode 'add'     -> append only rows not already present (focus starts at
//                    the first appended row)
// Returns { variants, focusIndex }.
export function mergeVariants(existing, generated, mode) {
  if (mode === 'replace') {
    return { variants: generated, focusIndex: 0 };
  }
  const have = new Set(existing.map((v) => variantKey(v.group, v.name)));
  const toAdd = generated.filter((r) => !have.has(variantKey(r.group, r.name)));
  return { variants: [...existing, ...toAdd], focusIndex: existing.length };
}
