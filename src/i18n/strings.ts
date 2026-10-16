/**
 * Every audience-facing UI string, in Lithuanian and English (Stage 11 localization). The English
 * is the approved Stage 11 wording; the Lithuanian is written for students without a nuclear
 * background: plain, short enough for a projector, one term per concept. Component names and
 * descriptions are in i18n/components.ts; developer diagnostics stay in English.
 *
 * `UiStrings` is the contract: a missing or extra string in either language fails the type check.
 */
import type { FissionLabelKey } from '../config/fission';
import type { QualityLevel } from '../config/quality';
import { useLanguageStore, type Language } from './language';

export interface UiStrings {
  /** Browser tab title. */
  pageTitle: string;
  language: { group: string; names: Record<Language, string> };
  shortcut: (key: string) => string;
  setup: {
    start: string;
    resume: string;
    startTitle: string;
    /** Presentation v1: back into the talk where it was left (after Esc). */
    resumeTalk: string;
    /** The 48 s cinematic (secondary, the backup / reference). */
    cinematic: string;
    cinematicTitle: string;
    quality: string;
    qualityGroup: string;
    levels: Record<QualityLevel, string>;
    resetView: string;
    fullScreen: string;
    exitFullScreen: string;
    fullScreenTitle: string;
  };
  explore: {
    toolbar: string;
    xray: string;
    section: string;
    sectionContext: string;
    plant: string;
    reactor: string;
    cutPosition: string;
    flow: string;
    control: string;
    controlSlider: string;
    controlSliderTitle: string;
    safety: string;
    safetyTitle: string;
    isolate: string;
    labels: string;
    reset: string;
    focus: string;
    clearSelection: string;
  };
  loading: { preparing: string; ready: string };
  status: {
    webglTitle: string;
    webglText: string;
    crashTitle: string;
    crashText: string;
    lostTitle: string;
    lostText: string;
    restart3d: string;
    restart3dNow: string;
    restartLow: string;
    reload: string;
    playBackup: string;
    /** Followed by the video's file name. */
    backupHint: string;
    backupDialog: string;
    closeVideo: string;
    missingVideo: string;
    /** Text before and after the video's file name. */
    openVideo: readonly [string, string];
    technicalDetails: string;
  };
  /** The Stage 10 fission inset's on-screen words. */
  fission: Record<FissionLabelKey, string>;
}

export const UI_STRINGS: Record<Language, UiStrings> = {
  en: {
    pageTitle: 'BWRX-300 — Interactive Reactor',
    language: { group: 'Language', names: { lt: 'Lietuvių', en: 'English' } },
    shortcut: (key) => `Shortcut: ${key}`,
    setup: {
      start: 'Start presentation',
      resume: 'Resume',
      startTitle: 'Shortcut: Right arrow or Space',
      resumeTalk: 'Resume presentation',
      cinematic: '48 s film',
      cinematicTitle: 'The 48-second cinematic (the backup video in real time)',
      quality: 'Quality',
      qualityGroup: 'Rendering quality',
      levels: { high: 'High', low: 'Low' },
      resetView: 'Reset view',
      fullScreen: 'Full screen',
      exitFullScreen: 'Exit full screen',
      fullScreenTitle: 'F11 also works',
    },
    explore: {
      toolbar: 'Explore',
      xray: 'X-ray',
      section: 'Section',
      sectionContext: 'Section context',
      plant: 'Plant',
      reactor: 'Reactor',
      cutPosition: 'Cut position',
      flow: 'Flow',
      control: 'Control',
      controlSlider: 'Control blades: withdrawn to inserted',
      controlSliderTitle: 'Control blades: left withdrawn, right inserted',
      safety: 'Safety',
      safetyTitle: 'Passive cooling: isolation condensers. Shortcut: S',
      isolate: 'Isolate',
      labels: 'Labels',
      reset: 'Reset',
      focus: 'Focus',
      clearSelection: 'Clear selection',
    },
    loading: { preparing: 'Preparing 3D scene', ready: 'Ready' },
    status: {
      webglTitle: 'The 3D view cannot start on this computer',
      webglText: 'Use the backup video below, or open this file in the latest Chrome or Edge.',
      crashTitle: 'The 3D view stopped',
      crashText: 'Restart it, or show the backup video instead.',
      lostTitle: 'Graphics reset',
      lostText: 'The graphics driver interrupted the 3D view. It usually comes back by itself in a moment.',
      restart3d: 'Restart 3D',
      restart3dNow: 'Restart 3D now',
      restartLow: 'Restart in low quality',
      reload: 'Reload page',
      playBackup: 'Play the backup video',
      backupHint: 'The same presentation as a video:',
      backupDialog: 'Backup video',
      closeVideo: 'Close video',
      missingVideo: 'The backup video was not found next to this page.',
      openVideo: ['Open', 'from the presentation folder with any video player.'],
      technicalDetails: 'Technical details',
    },
    fission: { nucleus: 'U-235', neutron: 'neutron', heat: 'energy → heat' },
  },
  lt: {
    pageTitle: 'BWRX-300 — interaktyvus reaktorius',
    language: { group: 'Kalba', names: { lt: 'Lietuvių', en: 'English' } },
    shortcut: (key) => `Klavišas: ${key}`,
    setup: {
      start: 'Pradėti pristatymą',
      resume: 'Tęsti',
      startTitle: 'Klavišas: rodyklė dešinėn arba tarpas',
      resumeTalk: 'Tęsti pristatymą',
      cinematic: '48 s filmas',
      cinematicTitle: '48 sekundžių filmas (atsarginis vaizdo įrašas realiu laiku)',
      quality: 'Kokybė',
      qualityGroup: 'Vaizdo kokybė',
      levels: { high: 'Aukšta', low: 'Žema' },
      resetView: 'Atkurti vaizdą',
      fullScreen: 'Visas ekranas',
      exitFullScreen: 'Išeiti iš viso ekrano',
      fullScreenTitle: 'Taip pat veikia F11',
    },
    explore: {
      toolbar: 'Tyrinėjimas',
      xray: 'Rentgenas',
      section: 'Pjūvis',
      sectionContext: 'Pjūvio sritis',
      plant: 'Jėgainė',
      reactor: 'Reaktorius',
      cutPosition: 'Pjūvio padėtis',
      flow: 'Srautai',
      control: 'Valdymas',
      controlSlider: 'Valdymo mentės: nuo ištrauktų iki įstumtų',
      controlSliderTitle: 'Valdymo mentės: kairėje ištrauktos, dešinėje įstumtos',
      safety: 'Sauga',
      safetyTitle: 'Pasyvusis aušinimas: izoliaciniai kondensatoriai. Klavišas: S',
      isolate: 'Išskirti',
      labels: 'Užrašai',
      reset: 'Atkurti',
      focus: 'Priartinti',
      clearSelection: 'Atšaukti pasirinkimą',
    },
    loading: { preparing: 'Ruošiama 3D scena', ready: 'Paruošta' },
    status: {
      webglTitle: 'Šiame kompiuteryje 3D vaizdo paleisti nepavyksta',
      webglText: 'Rodykite atsarginį vaizdo įrašą arba atverkite šį failą naujausia „Chrome“ ar „Edge“ naršykle.',
      crashTitle: '3D vaizdas sustojo',
      crashText: 'Paleiskite jį iš naujo arba rodykite atsarginį vaizdo įrašą.',
      lostTitle: 'Grafikos sutrikimas',
      lostText: 'Grafikos tvarkyklė pertraukė 3D vaizdą. Dažniausiai jis po akimirkos atsistato pats.',
      restart3d: 'Paleisti 3D iš naujo',
      restart3dNow: 'Paleisti 3D dabar',
      restartLow: 'Paleisti žema kokybe',
      reload: 'Perkrauti puslapį',
      playBackup: 'Rodyti atsarginį vaizdo įrašą',
      backupHint: 'Tas pats pristatymas vaizdo įrašu:',
      backupDialog: 'Atsarginis vaizdo įrašas',
      closeVideo: 'Uždaryti vaizdo įrašą',
      missingVideo: 'Atsarginio vaizdo įrašo šalia šio puslapio nėra.',
      openVideo: ['Atverkite', 'iš pristatymo aplanko bet kuriuo vaizdo grotuvu.'],
      technicalDetails: 'Techninė informacija',
    },
    fission: { nucleus: 'U-235', neutron: 'neutronas', heat: 'energija → šiluma' },
  },
};

/**
 * The page language (screen readers, hyphenation) and the tab title follow the audience language.
 * Subscribed here, outside React: a switch must re-render only the components that show text,
 * never <App> and the canvas under it (a re-render re-bakes drei's ContactShadows).
 */
function applyToDocument(language: Language): void {
  document.documentElement.lang = language;
  document.title = UI_STRINGS[language].pageTitle;
}
applyToDocument(useLanguageStore.getState().language);
useLanguageStore.subscribe((s) => applyToDocument(s.language));

/** The UI strings in the current language (re-renders on a switch). */
export function useStrings(): UiStrings {
  return UI_STRINGS[useLanguageStore((s) => s.language)];
}
