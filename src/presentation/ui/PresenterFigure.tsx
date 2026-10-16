/**
 * Placeholder presenter figure: a quiet, neutral standing silhouette (two postures). A real
 * illustrated portrait replaces it by setting `portrait` in presentation/config.ts (an image with a
 * transparent background, drawn in the same box).
 */
import { useId } from 'react';
import type { Presenter } from '../config';

const POSES = [
  {
    // Standing, arms relaxed.
    arms: [
      'M22 80 Q14 84 13 100 L10 186 Q10 196 18 197 Q24 196 24 188 L27 104 Z',
      'M98 80 Q106 84 107 100 L110 186 Q110 196 102 197 Q96 196 96 188 L93 104 Z',
    ],
    legs: ['M33 180 L58 180 L55 340 Q55 348 47 348 L40 348 Q36 346 37 338 Z', 'M62 180 L87 180 L83 338 Q84 346 80 348 L73 348 Q65 348 65 340 Z'],
  },
  {
    // Weight on one leg, a hand on the hip.
    arms: ['M22 80 Q14 84 13 100 L11 184 Q11 194 19 195 Q25 194 25 186 L27 104 Z', 'M98 80 Q113 92 116 120 L106 158 Q101 167 93 160 L102 124 Z'],
    legs: ['M33 180 L58 180 L50 340 Q50 348 42 348 L35 348 Q31 346 32 338 Z', 'M62 180 L87 180 L87 338 Q88 346 84 348 L77 348 Q69 348 69 340 Z'],
  },
] as const;

export function PresenterFigure({ presenter, variant }: { presenter: Presenter; variant: number }) {
  const gradient = useId();
  if (presenter.portrait) return <img className="talk-figure talk-figure--portrait" src={presenter.portrait} alt="" draggable={false} />;
  const pose = POSES[variant % POSES.length]!;
  return (
    <svg className="talk-figure" viewBox="0 0 120 360" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#59616b" />
          <stop offset="0.55" stopColor="#363c43" />
          <stop offset="1" stopColor="#22262b" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="352" rx="44" ry="6" fill="#000" opacity="0.35" />
      <g fill={`url(#${gradient})`} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8">
        {pose.legs.map((d) => (
          <path key={d} d={d} />
        ))}
        <ellipse cx={variant ? 39 : 44} cy="349" rx="12" ry="5" />
        <ellipse cx={variant ? 81 : 76} cy="349" rx="12" ry="5" />
        {pose.arms.map((d) => (
          <path key={d} d={d} />
        ))}
        <path d="M40 68 Q60 62 80 68 L96 76 Q102 80 101 92 L96 184 Q60 194 24 184 L19 92 Q18 80 24 76 Z" />
        <rect x="53" y="50" width="14" height="18" rx="5" />
        <ellipse cx="60" cy="33" rx="17" ry="21.5" />
      </g>
      {/* A thin warm rim on the lit side: the project's one accent, very quietly. */}
      <path d="M77 15 Q79 30 75 47" fill="none" stroke="rgba(232,163,61,0.35)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
