/**
 * Component names and one-sentence descriptions per language (Stage 11 localization). English is
 * the component registry itself (scene/components.ts, the approved wording); Lithuanian is here,
 * typed by `ComponentId`, so a component without a translation fails the type check.
 *
 * Lithuanian names stay short (one to three words); where a term needs explaining (valdymo mentės,
 * žemyntekmės kanalas), the description does it. `inside` is the locative phrase for "in <parent>"
 * (Lithuanian inflects the name, so it cannot be built from the label); a parent without one falls
 * back to "dalis: <name>".
 */
import { COMPONENT_IDS, COMPONENTS, type ComponentId } from '../scene/components';
import type { Language } from './language';

export interface ComponentText {
  label: string;
  description: string;
}

const C = COMPONENT_IDS;

const LT: Record<ComponentId, ComponentText & { inside?: string }> = {
  // ---- Plant ----
  [C.plant]: { label: 'BWRX-300 elektrinė', description: '300 MW klasės elektrinė su verdančio vandens reaktoriumi.', inside: 'elektrinėje' },
  [C.siteGround]: { label: 'Gruntas', description: 'Aikštelė žemės paviršiaus lygyje.' },
  [C.reactorBuilding]: { label: 'Reaktoriaus pastatas', description: 'Antžeminėje dalyje yra kuro perkrovimo aikštelė ir aušinimo baseinai; pats reaktorius – po žeme.', inside: 'reaktoriaus pastate' },
  [C.reactorShaft]: { label: 'Reaktoriaus šachta', description: 'Reaktoriaus pastatas tęsiasi apie 36 m po žeme: tai cilindras, įleistas į vertikalią šachtą.', inside: 'reaktoriaus šachtoje' },
  [C.containment]: { label: 'Apsauginis gaubtas', description: 'Sandarus plieno ir betono kompozito indas aplink reaktorių – paskutinis barjeras, neleidžiantis radioaktyviosioms medžiagoms patekti į aplinką.', inside: 'apsauginiame gaubte' },
  [C.mainSteamPath]: { label: 'Pagrindinis garo vamzdynas', description: 'Juo sausi garai teka iš reaktoriaus indo į turbiną.' },
  [C.turbineBuilding]: { label: 'Turbinų salė', description: 'Čia yra turbina, generatorius ir kondensatorius.', inside: 'turbinų salėje' },
  [C.turbine]: { label: 'Turbina', description: 'Garai plečiasi aukšto ir žemo slėgio pakopose ir suka veleną.' },
  [C.generator]: { label: 'Generatorius', description: 'Jį suka turbinos velenas, o sukimąsi jis paverčia elektra.' },
  [C.icsPools]: { label: 'Izoliacinių kondensatorių baseinai', description: 'Trys baseinai virš apsauginio gaubto, kiekviename – po izoliacinį kondensatorių, galintį aušinti reaktorių pasyviai, be siurblių ir operatorių.' },
  [C.supportBuildings]: { label: 'Pagalbiniai pastatai', description: 'Valdymo, atliekų tvarkymo ir techninės priežiūros pastatai aplink energetinį bloką.' },

  // ---- Reactor pressure vessel ----
  [C.rpv]: { label: 'Reaktoriaus slėginis indas', description: '27 m aukščio plieninis slėginis indas, kuriame yra aktyvioji zona, vanduo ir garai.', inside: 'reaktoriaus slėginiame inde' },
  [C.upperHead]: { label: 'Indo dangtis', description: 'Varžtais pritvirtinta nuimama indo viršutinė dalis; keičiant kurą ji nukeliama.' },
  [C.shell]: { label: 'Indo korpusas', description: 'Kalti žiedai ir lakštai, apie 13,5 cm storio; vidinis skersmuo – 4,2 m.' },
  [C.lowerHead]: { label: 'Indo dugnas', description: 'Suapvalinta indo apačia; pro ją įeina valdymo strypų pavaros.' },
  [C.mainSteamNozzle]: { label: 'Garo išvadas', description: 'Čia sausi garai išeina iš indo ir dviem pagrindiniais garo vamzdynais teka į turbiną.' },
  [C.controlRodDrives]: { label: 'Valdymo strypų pavaros', description: '57 tikslaus judesio pavaros po indu kelia ir nuleidžia valdymo mentes.' },
  [C.core]: { label: 'Reaktoriaus aktyvioji zona', description: 'Čia vyksta branduolių dalijimasis: 240 kuro rinklių (3,8 m aukščio), kurias aušina aukštyn tekantis vanduo.', inside: 'aktyviojoje zonoje' },
  [C.fuelBundles]: { label: 'Kuras', description: '240 GNF2 kuro rinklių; kiekviena – 10 × 10 kuro strypų gardelė metaliniame kanale.' },
  [C.controlBlades]: { label: 'Valdymo mentės', description: '57 kryžiaus formos plokštės įslenka aukštyn tarp keturių kuro rinklių grupių, sugeria neutronus ir taip mažina galią.' },
  [C.corePlate]: { label: 'Atraminė plokštė', description: 'Plokštė aktyviosios zonos apačioje, laikanti kuro atramas.' },
  [C.topGuide]: { label: 'Viršutinė gardelė', description: 'Gardelė virš aktyviosios zonos, išlaikanti kiekvieną keturių rinklių grupę savo vietoje.' },
  [C.coreShroud]: { label: 'Aktyviosios zonos apvalkalas', description: 'Plieninis cilindras aplink aktyviąją zoną; jis atskiria kylantį srautą nuo grįžtančio vandens.' },
  [C.shroudSupport]: { label: 'Apvalkalo atrama', description: 'Žiedas ant kojelių, privirintas prie indo dugno; vanduo pro tarpus tarp kojelių teka į aktyviąją zoną.' },
  [C.guideTubes]: { label: 'Kreipiamieji vamzdžiai', description: 'Vamzdžiai po aktyviąja zona: jie kreipia kiekvieną valdymo mentę ir laiko virš jų esantį kurą.' },
  [C.chimney]: { label: 'Kaminas', description: 'Aukštas atviras cilindras virš aktyviosios zonos: juo kyla karštas garų ir vandens mišinys, ir taip palaikoma natūrali cirkuliacija.' },
  [C.chimneyHead]: { label: 'Kamino dangtis', description: 'Dangtis ant kamino, ant kurio įrengti garo separatoriai.' },
  [C.steamSeparators]: { label: 'Garo separatoriai', description: 'Nejudantys sūkuriniai separatoriai išsuka vandenį iš garų; vanduo krenta atgal į žemyntekmės kanalą.' },
  [C.steamDryer]: { label: 'Garo džiovintuvas', description: 'Zigzaginių plokštelių eilės sulaiko paskutinius vandens lašelius, prieš garams išeinant iš indo.' },
  [C.downcomer]: { label: 'Žemyntekmės kanalas', description: 'Žiedinis tarpas tarp kamino ir indo sienelės, kuriuo vėsesnis vanduo teka žemyn.' },
};

/** A component's name and description in the given language. */
export function componentText(id: ComponentId, language: Language): ComponentText {
  return language === 'lt' ? LT[id] : COMPONENTS[id];
}

/** "in <parent>": the parent-navigation button in the Explore panel. */
export function insideText(parentId: ComponentId, language: Language): string {
  if (language === 'en') return `in ${COMPONENTS[parentId].label}`;
  return LT[parentId].inside ?? `dalis: ${LT[parentId].label}`;
}
