/**
 * Design study tokens: one normalized type scale (8 roles instead of ~15 sizes) and one disciplined
 * palette per direction, written as CSS variables on the overlay root (study.css reads only these).
 * Sizes are px on the 1920 x 1080 stage and become stage-relative (cqh); small print keeps a pixel
 * floor on 1280 x 800 / 1024 x 768 projectors. Every weight is a real instance of its face.
 */
import type { StudyDirection } from './studyMode';

interface Role {
  size: number;
  weight: number;
  /** em */
  tracking: number;
  leading: number;
  /** Smallest rendered px on small stages (small print only). */
  floor?: number;
}

type Roles = Record<'display' | 'metric' | 'h1' | 'h2' | 'body' | 'label' | 'source' | 'micro', Role>;

export interface StudyTokens {
  name: string;
  font: string;
  roles: Roles;
  color: {
    bg: string;
    text: string;
    text2: string;
    /** Source / qualifier ink (the --s-source variable is the type size). */
    sourceInk: string;
    amber: string;
    cool: string;
    steam: string;
    copper: string;
    steel: string;
    panel: string;
  };
}

/** Shared semantic colours: amber = the one current concept; cool = water / cooling; copper = heat. */
const SEMANTIC = {
  bg: '#0d0f12',
  amber: '#e8a33d',
  cool: '#78b4da',
  steam: '#e8edf0',
  copper: '#d38c5c',
  steel: '#8a939c',
} as const;

export const STUDY_TOKENS: Record<StudyDirection, StudyTokens> = {
  a: {
    name: 'Precision',
    // System face, exactly as today (not bundled: Microsoft licence; Windows 11 only).
    font: '"Segoe UI Variable Display", "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
    roles: {
      display: { size: 76, weight: 600, tracking: -0.01, leading: 1.02 },
      metric: { size: 100, weight: 350, tracking: -0.02, leading: 1 },
      h1: { size: 48, weight: 400, tracking: -0.005, leading: 1.12 },
      h2: { size: 30, weight: 400, tracking: 0, leading: 1.2 },
      body: { size: 23, weight: 400, tracking: 0, leading: 1.36, floor: 13 },
      label: { size: 19, weight: 600, tracking: 0.01, leading: 1.2, floor: 12 },
      source: { size: 17, weight: 400, tracking: 0, leading: 1.4, floor: 12 },
      micro: { size: 16, weight: 600, tracking: 0.16, leading: 1.2, floor: 12 },
    },
    color: { ...SEMANTIC, text: '#f2f1ed', text2: '#d1d5d9', sourceInk: '#b8bec4', panel: 'rgba(13, 15, 18, 0.72)' },
  },
  b: {
    name: 'Editorial cinematic',
    font: '"Study Inter", system-ui, sans-serif',
    roles: {
      display: { size: 80, weight: 600, tracking: -0.03, leading: 0.98 },
      metric: { size: 108, weight: 500, tracking: -0.035, leading: 0.95 },
      h1: { size: 52, weight: 600, tracking: -0.022, leading: 1.06 },
      h2: { size: 32, weight: 500, tracking: -0.012, leading: 1.15 },
      body: { size: 24, weight: 400, tracking: -0.006, leading: 1.38, floor: 13 },
      label: { size: 19, weight: 500, tracking: -0.004, leading: 1.2, floor: 12 },
      source: { size: 17, weight: 400, tracking: 0, leading: 1.4, floor: 12 },
      micro: { size: 16, weight: 600, tracking: 0.12, leading: 1.2, floor: 12 },
    },
    color: { ...SEMANTIC, text: '#f7f8f8', text2: '#d3d8dc', sourceInk: '#b9c0c6', panel: 'rgba(13, 15, 18, 0.6)' },
  },
  c: {
    name: 'Technical documentary',
    // IBM Plex Sans, subset and renamed (OFL Reserved Font Name "Plex"): fonts/README.md.
    font: '"Study Sans C", system-ui, sans-serif',
    roles: {
      display: { size: 72, weight: 500, tracking: -0.015, leading: 1.02 },
      metric: { size: 96, weight: 400, tracking: -0.02, leading: 1 },
      h1: { size: 46, weight: 500, tracking: -0.01, leading: 1.12 },
      h2: { size: 28, weight: 500, tracking: 0, leading: 1.2 },
      body: { size: 22, weight: 400, tracking: 0, leading: 1.4, floor: 13 },
      label: { size: 18, weight: 500, tracking: 0.005, leading: 1.2, floor: 12 },
      source: { size: 16, weight: 400, tracking: 0.005, leading: 1.4, floor: 12 },
      micro: { size: 16, weight: 600, tracking: 0.1, leading: 1.2, floor: 12 },
    },
    color: { ...SEMANTIC, text: '#eef1f4', text2: '#cbd3da', sourceInk: '#b6bec6', panel: 'rgba(12, 15, 19, 0.74)' },
  },
};

const cqh = (px: number) => `${(px / 10.8).toFixed(3)}cqh`;
const size = (r: Role) => (r.floor ? `max(${r.floor}px, ${cqh(r.size)})` : cqh(r.size));

/** The CSS variables a direction puts on the overlay root (on top of presentation/design.ts). */
export function studyVariables(direction: StudyDirection): Record<string, string> {
  const t = STUDY_TOKENS[direction];
  const vars: Record<string, string> = { '--s-font': t.font };
  for (const [name, r] of Object.entries(t.roles)) {
    vars[`--s-${name}`] = size(r);
    vars[`--s-${name}-w`] = String(r.weight);
    vars[`--s-${name}-ls`] = `${r.tracking}em`;
    vars[`--s-${name}-lh`] = String(r.leading);
  }
  // Colours never share a name with a type role (--s-source is the size, --s-source-ink the colour).
  for (const [name, value] of Object.entries(t.color)) vars[`--s-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] = value;
  return vars;
}
