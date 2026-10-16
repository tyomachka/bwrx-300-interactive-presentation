# Claude Code Prompt — Stage 11 Micro-Polish: Low Quality at Windows 125–150% Scaling

Stage 11 is approved except for one delivery-oriented change.

Read `DEVELOPMENT_RULES.md` and the current `docs/stage11-review/STAGE11-REPORT.md`.

Do **not** start Stage 12. Do **not** redesign or revalidate unrelated systems. This is a MICRO FAST polish.

## Goal

Low quality is the intended presentation preset.

At 1920×1080 with Windows display scaling at 125% or 150%, the current Low preset caps pixel ratio at 1, so the app renders only 1536×864 or 1280×720 and the browser upscales it.

The Stage 11 measurements already show that Low can render the full 1920×1080 buffer smoothly on the reference machine.

Change Low so that Windows scaling may increase its pixel ratio **only until the existing 1920×1080 Low pixel budget is reached**.

In other words:

- 1920×1080 @ 100%: remain 1920×1080, pixel-for-pixel unchanged.
- 1536×864 CSS @ DPR 1.25: render 1920×1080.
- 1280×720 CSS @ DPR 1.5: render 1920×1080.
- 1920×1080 CSS @ DPR 2: remain capped by the 1920×1080 Low pixel budget.
- 3840×2160: remain capped at 1920×1080.
- `?scale=` must continue to work as the emergency performance lever on slower PCs.

Do not raise the Low pixel budget above 1920×1080.

## Why

For the lecture, Low is preferred over High because it is smooth throughout. There is no reason to accept avoidable softness at common Windows scaling settings when the same 1080p render cost has already been validated.

## Validation — MICRO only

1. `npm run check`
2. Verify drawing-buffer sizes for:
   - 1920×1080 @ DPR 1
   - 1536×864 @ DPR 1.25
   - 1280×720 @ DPR 1.5
   - 1920×1080 @ DPR 2
   - 3840×2160 @ DPR 1
3. Confirm the 1920×1080 @ DPR 1 master frame is byte-identical to the approved Stage 11 build.
4. Run one Low 48-second real-time playback at the new 1920×1080 effective buffer.
5. Confirm `?scale=0.75` and `?scale=0.5` still reduce the buffer and remain functional.
6. No FULL regression rerun unless an unexpected mismatch occurs.

## Review deliverable

Update only:
- the relevant compatibility table/paragraph in `STAGE11-REPORT.md`;
- `START-HERE.txt` if its Low/scaling wording needs adjustment;
- one small validation JSON or text result.

No new 48-second export is needed because 1080p content must remain visually identical.

Stop for approval. Do not commit Stage 11 yet.
