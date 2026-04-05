/**
 * normalizeInput — robust character-by-character stdin builder.
 *
 * Rules per extracted value:
 *   Array  → elements space-joined on one line, NO length prefix.
 *             null / None kept as the literal word "null".
 *             Nested arrays emitted as a single JSON token.
 *   String → inner content (quotes stripped), single line.
 *   Other  → pushed as-is (numbers, booleans, identifiers).
 *
 * Examples handled correctly:
 *   "root = [3,9,20,null,null,15,7]"       → "3 9 20 null null 15 7"
 *   "root = [3,9,20,null,null,15,7], k = 2" → "3 9 20 null null 15 7\n2"
 *   "nums = [2,7,11,15], target = 9"        → "2 7 11 15\n9"
 *   "s = \"hello\""                          → "hello"
 *   "[1,2,3]"                               → "1 2 3"
 *   "5"                                     → "5"
 */
export const normalizeInput = (input) => {
  if (!input) return '';

  // Strip leading "Input:" label if present
  const src = input.replace(/^Input:\s*/i, '').trim();
  const len = src.length;
  const results = [];

  // ── Read one complete value starting at index `start` ──────────────────
  // Returns { value: string, end: number }
  const readValue = (start) => {
    let j = start;
    while (j < len && src[j] === ' ') j++; // skip leading spaces
    if (j >= len) return { value: '', end: j };

    const ch = src[j];

    // Array (possibly nested)
    if (ch === '[') {
      let depth = 0, begin = j;
      while (j < len) {
        if (src[j] === '[') depth++;
        else if (src[j] === ']') { depth--; if (depth === 0) { j++; break; } }
        else if (src[j] === '"' || src[j] === "'") {
          const q = src[j++];
          while (j < len && src[j] !== q) { if (src[j] === '\\') j++; j++; }
          j++;
          continue;
        }
        j++;
      }
      return { value: src.slice(begin, j), end: j };
    }

    // Double-quoted string
    if (ch === '"') {
      const begin = j; j++;
      while (j < len && src[j] !== '"') { if (src[j] === '\\') j++; j++; }
      j++;
      return { value: src.slice(begin, j), end: j };
    }

    // Single-quoted string
    if (ch === "'") {
      const begin = j; j++;
      while (j < len && src[j] !== "'") { if (src[j] === '\\') j++; j++; }
      j++;
      return { value: src.slice(begin, j), end: j };
    }

    // Plain token (number / boolean / null / identifier)
    const begin = j;
    while (j < len && src[j] !== ',' && src[j] !== '\n') j++;
    return { value: src.slice(begin, j).trim(), end: j };
  };

  // ── Convert a raw value string → push line(s) into results ─────────────
  const pushValue = (raw) => {
    raw = raw.trim();
    if (!raw) return;

    // Array
    if (raw.startsWith('[') && raw.endsWith(']')) {
      const inner = raw.slice(1, -1);
      const elements = [];
      let j = 0;
      const ilen = inner.length;

      while (j < ilen) {
        // skip separators
        while (j < ilen && (inner[j] === ',' || inner[j] === ' ')) j++;
        if (j >= ilen) break;

        const ch = inner[j];
        if (ch === '[') {
          // nested array — keep as one token
          let depth = 0, begin = j;
          while (j < ilen) {
            if (inner[j] === '[') depth++;
            else if (inner[j] === ']') { depth--; if (depth === 0) { j++; break; } }
            j++;
          }
          elements.push(inner.slice(begin, j));
        } else if (ch === '"' || ch === "'") {
          const q = inner[j++];
          const begin = j;
          while (j < ilen && inner[j] !== q) { if (inner[j] === '\\') j++; j++; }
          elements.push(inner.slice(begin, j));
          j++;
        } else {
          const begin = j;
          while (j < ilen && inner[j] !== ',' && inner[j] !== ']') j++;
          const tok = inner.slice(begin, j).trim();
          if (tok) elements.push(tok);
        }
      }

      // Space-joined, NO length prefix — null/None preserved
      results.push(elements.map(e => (e === 'None' ? 'null' : e)).join(' '));
      return;
    }

    // Quoted string → strip quotes
    if ((raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'"))) {
      results.push(raw.slice(1, -1));
      return;
    }

    // Plain value
    results.push(raw);
  };

  // ── Main scan: find each assignment / bare value ────────────────────────
  let i = 0;
  while (i < len) {
    // skip separators between assignments
    while (i < len && (src[i] === ',' || src[i] === ' ' || src[i] === '\n')) i++;
    if (i >= len) break;

    // Look ahead for "identifier =" (skip lhs if found)
    let j = i, depth = 0, foundEq = false;
    while (j < len && src[j] !== '\n') {
      const c = src[j];
      if (c === '[') { depth++; j++; continue; }
      if (c === ']') { depth--; j++; continue; }
      if ((c === '"' || c === "'") && depth === 0) {
        const q = c; j++;
        while (j < len && src[j] !== q) { if (src[j] === '\\') j++; j++; }
        j++; continue;
      }
      if (c === '=' && depth === 0 && src[j + 1] !== '=') {
        foundEq = true;
        i = j + 1; // value starts after '='
        break;
      }
      if (c === ',' && depth === 0) break; // comma before '=' → bare value
      j++;
    }

    const { value, end } = readValue(i);
    pushValue(value);
    i = end;
  }

  return results.join('\n') + '\n';
};
