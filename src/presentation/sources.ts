/**
 * Presentation v1: every public number and factual claim the talk shows, with its source.
 *
 * Status:
 *  - OFFICIAL      stated by the regulator, the operator, the government or the design document;
 *  - VENDOR        a GE Vernova (Hitachi) marketing claim or estimate (said as such on screen);
 *  - DERIVED       computed by us from official figures (the arithmetic is in `supports`);
 *  - ILLUSTRATIVE  a visual comparison, not a technical equivalence.
 *
 * Accessed 2026-10-17 unless stated. Reference documents are kept locally in references/technical/
 * (git-ignored); TECHNICAL_FACTS.md holds the verified Stage 1-10 facts these build on.
 */

export type FactStatus = 'OFFICIAL' | 'VENDOR' | 'DERIVED' | 'ILLUSTRATIVE';

export interface Fact {
  /** What the talk says (English, for the review). */
  claim: string;
  organization: string;
  document: string;
  /** Page, section, table, or the URL. */
  where: string;
  date: string;
  /** Exactly what the source supports (a short quote where practical). */
  supports: string;
  status: FactStatus;
}

const GD = 'GE Vernova Hitachi, BWRX-300 General Description, 005N9751 Revision J';
const GD_DATE = 'June 2026';
const GEV_PAGE = 'GE Vernova, "BWRX-300 Small Modular Reactor" product page';
const GEV_URL = 'https://www.gevernova.com/nuclear/carbon-free-power/bwrx-300-small-modular-reactor';

export const FACTS = {
  // ---- BWRX-300 design --------------------------------------------------------------------------
  outputNet: {
    claim: '~300 MW of electricity per unit',
    organization: 'GE Vernova Hitachi',
    document: GD,
    where: 'Table 21-2 "Capacity to Electric Grid", p. 123',
    date: GD_DATE,
    supports: '"Capacity to Electric Grid ~300 MWe (net to grid)"; gross ~316 MWe, 870 MWth (Table 2-1, p. 28)',
    status: 'OFFICIAL',
  },
  footprint: {
    claim: 'The BWRX-300 power block covers about 1.6 international football pitches of area (about 148 x 78 m)',
    organization: 'GE Hitachi Nuclear Energy',
    document: 'GE-Hitachi, BWRX-300 General Description, 005N9751 Revision F (Released for Information); copy filed with the CNSC as CMD 24-H3 Ref R1-9',
    where: '§9 (plant layout), p. 63 of 95; https://api.cnsc-ccsn.gc.ca/dms/digital-medias/CMD-24-H3-Ref-R1-9-GEH-005N9751-BWRX-300-General-Description-Rev-F.pdf/object',
    date: 'December 2023 (downloaded 2026-10-17, sha256 dd6b9dd0...c11f)',
    supports:
      '"The power block is comprised of the RB, TB, CB, RWB, and the Turbine Maintenance Building. The footprint of the power block is approximately 148 m x 78 m." 148 x 78 = 11,544 m2 = 1.62 x 7,140 m2 (one 105 x 68 m pitch). The current Rev J (June 2026) no longer states the sides: Table 21-2 (p. 123) gives "Plant Powerblock Footprint 9,800 m2 (rectangular building envelope)" (= 1.37 pitches) and §10 (p. 77) lists the same buildings. GE Vernova\'s product page: "small enough to fit within two international football pitches" (area; the 148 x 78 m rectangle does not nest in two 105 x 68 m rectangles).',
    status: 'DERIVED',
  },
  pitch: {
    claim: 'An international-size pitch is 105 x 68 m; the National Stadium being built in Vilnius is a UEFA category IV project',
    organization: 'UEFA; LRT (Lithuanian National Radio and Television)',
    document: 'UEFA Stadium Infrastructure Regulations (in force 1 June 2025), Article 5.01 "Field of play"; LRT, "Nacionalinis stadionas pamažu kyla" (2025-09-03)',
    where: 'https://documents.uefa.com/r/PxVtjcYr9Ntgwd0wYgq2xw/snbCQQ1y5eRWxnjVf4WgnQ ; https://www.lrt.lt/naujienos/verslas/4/2662517/nacionalinis-stadionas-pamazu-kyla-pasizvalgykite-kaip-vyksta-darbai',
    date: 'accessed 2026-10-17',
    supports:
      'UEFA art. 5.01: categories 3 and 4, field of play length "105m", width "68m". LRT: piles drilled for a "UEFA IV kategorijos stadiono" in Šeškinė, 18,000 seats, a football-only stadium (no running track), completion planned for the end of 2027. No published construction drawing with the pitch size was found: the screen shows an international-size 105 x 68 m pitch and names the stadium only as the category it is built to.',
    status: 'OFFICIAL',
  },
  constructionTime: {
    claim: '24-36 months, nth-of-a-kind, first nuclear concrete to ready for fuel load',
    organization: 'GE Vernova',
    document: GEV_PAGE,
    where: GEV_URL,
    date: 'accessed 2026-10-17',
    supports:
      '"can be built in approximately 24-36 months from first nuclear concrete pour to ready for fuel load" (nth-of-a-kind units). The newer GD Rev J says "30-36 months from the time of first safety-related concrete to ready to load fuel" (§18, p. 101) and "<30 months" nth-of-a-kind (Table 21-2, p. 125). Excludes licensing, financing and site preparation.',
    status: 'VENDOR',
  },
  homes: {
    claim: '~300,000 homes (scale illustration)',
    organization: 'GE Vernova',
    document: GEV_PAGE,
    where: GEV_URL,
    date: 'accessed 2026-10-17',
    supports: '"enough to power approximately 300,000 homes". A vendor figure; depends on the household consumption assumed.',
    status: 'VENDOR',
  },
  coreCounts: {
    claim: '240 fuel bundles, 57 control blades',
    organization: 'GE Vernova Hitachi',
    document: GD,
    where: 'Table 2-1 p. 28; Table 21-2 p. 124; Fig 3-6',
    date: GD_DATE,
    supports: '240 GNF2 fuel assemblies; 57 cruciform control rods (blades)',
    status: 'OFFICIAL',
  },
  naturalCirculation: {
    claim: 'Water circulates through the core without recirculation pumps',
    organization: 'GE Vernova Hitachi',
    document: GD,
    where: 'Table 2-1 p. 28; §3.1.1',
    date: GD_DATE,
    supports: 'Reactor coolant recirculation: "Natural Circulation" (ABWR: internal pumps)',
    status: 'OFFICIAL',
  },
  condenserLoop: {
    claim: 'Turbine exhaust condenses in the condenser; condensate and feedwater pumps return the water to the reactor',
    organization: 'GE Vernova Hitachi',
    document: GD,
    where: '§5.1.2 p. 55; §5.1.5 p. 56-57; §5.1.6 p. 57; §3.1 (NBS functions)',
    date: GD_DATE,
    supports:
      '"Each LP turbine exhausts directly to the main condenser connected underneath each LP turbine"; "The main condenser is a single-pressure, two-shell unit"; the CFS has "two condensate pumps, two reactor FW pumps" and feedwater heaters; the NBS "Receive[s] Feedwater ... to the RPV". Pumps, heaters and the cooling-water system are simplified away in the visual.',
    status: 'OFFICIAL',
  },
  loadFollowing: {
    claim: 'Designed to change output with demand (50-100 % daily)',
    organization: 'GE Vernova Hitachi',
    document: GD,
    where: 'Table 21-2 "Load Following Range and Speed", p. 123',
    date: GD_DATE,
    supports: '"50 - 100% daily, 0.5% per minute" (speaker context only; not on screen)',
    status: 'OFFICIAL',
  },
  icsTrains: {
    claim: 'Three isolation-condenser trains, each in its own pool',
    organization: 'GE Vernova Hitachi',
    document: GD,
    where: '§3.3 p. 40 (TECHNICAL_FACTS ICS-01)',
    date: GD_DATE,
    supports: '"The ICS consists of three independent trains, each containing a Heat Exchanger (HX) - or IC - that is submerged in a dedicated pool of water"',
    status: 'OFFICIAL',
  },
  icsSevenDays: {
    claim: '7 days of decay-heat removal without operator action (two trains suffice)',
    organization: 'GE Vernova Hitachi',
    document: GD,
    where: '§3.3 p. 41 (ICS-05); §2 p. 25 (ICS-06)',
    date: GD_DATE,
    supports:
      '"With two ICS trains in service, decay heat removal is sustained for seven days without operator action." The ICs "require no Alternating Current (AC) power to perform their functions." Heat does not become zero after 7 days; pool inventory can be replenished.',
    status: 'OFFICIAL',
  },
  decayHeat: {
    claim: 'After shutdown the fission products keep releasing heat',
    organization: 'U.S. DOE',
    document: 'DOE-HDBK-1019/1-93, Nuclear Physics and Reactor Theory, Vol. 1, Module 1',
    where: 'pp. 61-62 (TECHNICAL_FACTS FIS-06)',
    date: 'January 1993',
    supports: '"When a reactor is shut down, fissions essentially cease, but energy is still being released from the decay of fission products."',
    status: 'OFFICIAL',
  },
  fissionNeutrons: {
    claim: 'A fission releases energy (mostly heat) and 2-3 new neutrons',
    organization: 'U.S. NRC / U.S. DOE',
    document: 'NRC Glossary "Fission"; DOE-HDBK-1019/1-93 Module 1',
    where: 'NRC glossary; DOE pp. 49, 57-61 (TECHNICAL_FACTS FIS-01..05)',
    date: 'NRC 2023-01-20; DOE 1993',
    supports: '"releases a considerable amount of energy (usually in the form of heat) ... and two or more daughter neutrons"; typical U-235 fission releases 3 neutrons; fragments ~95 and ~140',
    status: 'OFFICIAL',
  },
  smrDefinition: {
    claim: 'SMR: up to ~300 MW(e) per unit',
    organization: 'IAEA',
    document: '"What are Small Modular Reactors (SMRs)?"',
    where: 'https://www.iaea.org/newscenter/news/what-are-small-modular-reactors-smrs',
    date: 'accessed 2026-10-17',
    supports: '"Small modular reactors (SMRs) are advanced nuclear reactors that have a power capacity of up to 300 MW(e) per unit"',
    status: 'OFFICIAL',
  },
  largeUnit: {
    claim: 'One ~1,500 MW unit ~ five 300 MW modules (capacity illustration); the large plant drawn at matched scale with an illustrative layout',
    organization: 'GE Vernova Hitachi (reference values)',
    document: GD,
    where: 'Table 2-1, p. 28',
    date: GD_DATE,
    supports:
      'Large BWRs of the same family: ABWR ~1,350 MWe and ESBWR ~1,600 MWe gross, vs BWRX-300 ~316 MWe gross. ~1,535 / ~300 net = 5.1. Capacity only: not a claim that five SMRs equal one large unit in cost, output profile or site. The large plant\'s buildings are a simplified BWR massing (no public drawing gives the ESBWR building sides); on screen: "Mastelis suderintas; pastatų išdėstymas iliustracinis".',
    status: 'ILLUSTRATIVE',
  },
  esbwr: {
    claim: 'ESBWR: ~1,500 MW (net), a large boiling-water reactor of the same family',
    organization: 'U.S. Nuclear Regulatory Commission',
    document: 'NRC, "ESBWR" design certification page; final rule (design certified 2014-10-15)',
    where: 'https://www.nrc.gov/reactors/new-reactors/large-lwr/design-cert/esbwr.html',
    date: 'accessed 2026-10-17',
    supports: 'Rated up to 4,500 MWt; "rated gross electrical power output of 1,594 megawatts electric (MWe)" and "a net estimated electrical power output of approximately 1,535 MWe" (can vary by up to 50 MWe with the turbine island and site). GD Rev J Table 2-1 (p. 28): ~1,600 MWe gross, 4,500 MWth, natural circulation (the BWRX-300 is its scaled-down successor, §1).',
    status: 'OFFICIAL',
  },
  vessels: {
    claim: 'Reactor vessels: ESBWR 7.1 m x 27.6 m inside, 1,132 fuel bundles; BWRX-300 ~4.2 m x ~27.4 m inside, 240 bundles',
    organization: 'GE Vernova Hitachi',
    document: GD,
    where: 'Table 2-1 "Comparison of Key Features", pp. 28-29; §3.1.2 (RPV), p. 30',
    date: GD_DATE,
    supports:
      'Table 2-1: ESBWR "RPV Diameter (ID) 7.1 m", "RPV Height (Inside) 27.6 m", 1,132 bundles; BWRX-300 "4 m", "27 m", 240 bundles. §3.1.2: "The RPV has a minimum inside diameter of approximately 4.2 m ... and a nominal inner height of approximately 27.36 m." The diagram uses 4.2 m and 27.36 m (the more precise text values; the model\'s vessel, scene/plant/dimensions.ts, uses the same) and draws both vessels at one scale.',
    status: 'OFFICIAL',
  },

  // ---- Projects --------------------------------------------------------------------------------------
  darlington: {
    claim: 'Canada, Darlington: first BWRX-300 under construction',
    organization: 'Canadian Nuclear Safety Commission',
    document: 'News release "Commission authorizes Ontario Power Generation Inc. to construct 1 BWRX-300 reactor at the Darlington New Nuclear Project site"; CNSC Darlington New Nuclear Project page',
    where: 'https://www.canada.ca/en/nuclear-safety-commission/news/2025/04/ ; https://www.cnsc-ccsn.gc.ca/eng/reactors/new-reactor-power-plant-projects/new-reactor-power-plant-facilities/darlington-new-nuclear-project/',
    date: '2025-04-04 (licence); page accessed 2026-10-17',
    supports: 'Licence to construct one BWRX-300 issued 4 April 2025; first regulatory hold point lifted 30 March 2026; OPG applied for a licence to operate in March 2026. GD Rev J §1: "construction underway at Ontario Power Generation\'s New Darlington site".',
    status: 'OFFICIAL',
  },
  clinchRiver: {
    claim: 'USA, Clinch River (TVA): construction permit issued',
    organization: 'U.S. Nuclear Regulatory Commission',
    document: 'News release 26-079 "NRC Approves Construction of Nation\'s First Small Modular Reactor"',
    where: 'https://www.nrc.gov/about-nrc/news-releases/2026/26-079',
    date: '2026-09-29',
    supports: 'Construction permit for TVA\'s 300 MW GE Vernova Hitachi BWR at Clinch River, Oak Ridge, Tennessee; "TVA will need a separate operating license" before loading fuel. No construction start date announced.',
    status: 'OFFICIAL',
  },
  poland: {
    claim: 'Poland (OSGE): development and licensing; first site Włocławek',
    organization: 'GE Vernova Hitachi; ORLEN',
    document: `${GD} §1 p. 8; ORLEN press release "ORLEN and Synthos reach agreement paving the way for Poland's first SMR nuclear power plant in Włocławek"`,
    where: 'https://www.orlen.pl/en/about-the-company/media/press-releases/current/2025/August-2025/',
    date: 'GD June 2026; ORLEN August 2025',
    supports: 'GD: "in Poland with decisions in principle to construct issued to ORLEN Synthos Green Energy (OSGE)". ORLEN: the first plant is planned in Włocławek. Not under construction.',
    status: 'OFFICIAL',
  },
  estonia: {
    claim: 'Estonia (Fermi Energia): BWRX-300 planned',
    organization: 'GE Vernova',
    document: GEV_PAGE,
    where: GEV_URL,
    date: 'accessed 2026-10-17',
    supports: 'Fermi Energia, Estonia: BWRX-300 project, "600 MWe" proposed total output. Planning stage (site selection); no licence.',
    status: 'VENDOR',
  },
  lithuaniaMou: {
    claim: 'Lithuania is assessing the BWRX-300 (memorandum, Feb 2026)',
    organization: 'Ministry of Energy of the Republic of Lithuania',
    document: '"Trilateral memorandum signed on the assessment of small modular reactors in Lithuania"',
    where: 'https://enmin.lrv.lt/en/news/trilateral-memorandum-signed-on-the-assessment-of-small-modular-reactors-in-lithuania-mVOh',
    date: '2026-02-25',
    supports:
      'Ignalina NPP / Altra, Synthos Green Energy and GE Vernova Hitachi signed an MoU in Washington to assess deploying the BWRX-300 in Lithuania (technical and economic feasibility, safety and licensing, market). The minister: "Renewable energy is and will remain Lithuania\'s clear choice"; the technologies are at the analysis stage.',
    status: 'OFFICIAL',
  },

  // ---- Lithuania's electricity -------------------------------------------------------------------
  ltRenewables2025: {
    claim: 'In 2025 wind, solar and other renewables produced 50 % of Lithuania\'s electricity demand',
    organization: 'Litgrid (Lithuanian transmission system operator)',
    document: '"Litgrid metų apžvalga: Lietuvos atsinaujinančių išteklių elektrinės pirmą kartą užtikrino pusę šalies elektros poreikio"',
    where: 'https://www.litgrid.eu/naujienos/litgrid-metu-apzvalga-lietuvos-atsinaujinanciu-istekliu-elektrines-pirma-karta-uztikrino-puse-salies-elektros-poreikio',
    date: '2026-01-28',
    supports: '"vien tik vėjo, saulės ir kitų atsinaujinančių išteklių elektrinės per metus pagamino 50 proc." of annual demand; local plants 73 %; wind 4.293 TWh, solar 1.79 TWh; imports 6.071 TWh; total demand 13.261 TWh.',
    status: 'OFFICIAL',
  },
} satisfies Record<string, Fact>;

export type FactId = keyof typeof FACTS;
