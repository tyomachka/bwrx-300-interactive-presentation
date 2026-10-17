# Design-study fonts (Stage 1 only; not used by the presentation)

Loaded only with `?study=b` / `?study=c` (presentation/study). The portable build compiles them out.
Both are subsets (Basic Latin, Latin-1, Latin Extended-A — every Lithuanian letter — plus the
punctuation and symbols the talk copy uses: „ “ – — … × ≈ ≠ → ≤ ≥ −), all variation axes and
OpenType layout features kept, hinting dropped, WOFF2.

| File | Source | Licence | Size |
|---|---|---|---|
| `InterVariable-study.woff2` | Inter 4 `Inter[opsz,wght].ttf`, google/fonts `ofl/inter` | SIL OFL 1.1, no Reserved Font Name (`Inter-OFL.txt`) | 104,260 B (from 876,576 B TTF) |
| `BWRXStudySansC.woff2` | IBM Plex Sans `IBMPlexSans[wdth,wght].ttf`, google/fonts `ofl/ibmplexsans` | SIL OFL 1.1 with Reserved Font Name "Plex" (`IBMPlexSans-OFL.txt`) | 78,136 B (from 537,244 B TTF) |

A subset is a Modified Version under OFL §3, and IBM reserves the name "Plex", so the subset's
name table is renamed to "BWRX Study Sans C" (family, full, PostScript and unique names); the
copyright and licence records are kept. Inter has no Reserved Font Name and keeps its name.
