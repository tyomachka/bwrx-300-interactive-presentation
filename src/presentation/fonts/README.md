# Presentation font: Inter Variable (subset)

The talk's only typeface (presentation/design.ts, ui/talk.css). Bundled, never fetched from a
server: the normal build emits it as one cached asset, the portable build embeds it in the HTML
(data URI). The scene's ready gate waits for it, so the opening never shows a fallback face.

| File | Source | Licence | Size |
|---|---|---|---|
| `InterVariable.woff2` | Inter 4 `Inter[opsz,wght].ttf`, google/fonts `ofl/inter` | SIL OFL 1.1, no Reserved Font Name (`Inter-OFL.txt`) | 104,260 B (from 876,576 B TTF) |

Subset (fontTools 4.67, WOFF2): Basic Latin, Latin-1, Latin Extended-A (every Lithuanian letter),
plus the punctuation and symbols the talk copy uses: „ “ – — … × ≈ ≠ → ≤ ≥ −. Both variation axes
(opsz 14–32, wght 100–900) and every OpenType layout feature are kept; hinting is dropped. Inter has
no Reserved Font Name, so the subset keeps its name. Chosen in the Stage 1 design study
(docs/presentation-design-study/DESIGN-STUDY.md §4).

Inter's `tnum` feature also respaces `-`, `.` and `*`: tabular figures are applied only to numbers
that count up, never to the whole overlay.
