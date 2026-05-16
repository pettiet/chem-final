/* ================================================================
 * QUESTIONS — generator functions, keyed by moduleId. Each generator
 * returns a fresh question object each call so numbers/compounds vary.
 *
 * Question shapes:
 *   { type: 'mc',      prompt, options: [...], correctIndex, explanation }
 *   { type: 'numeric', prompt, answer, tolerance, units, explanation }
 *   { type: 'text',    prompt, accept: [..lowercase..], explanation }
 * ================================================================ */

/* ---------- helpers ---------- */
const _rand = (min, max) => Math.random() * (max - min) + min;
const _randInt = (min, max) => Math.floor(_rand(min, max + 1));
const _pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const _round = (n, d=2) => +Number(n).toFixed(d);
const _shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* Helper to shuffle MC options while tracking the correct one. */
function mc(prompt, correct, distractors, explanation) {
  const all = _shuffle([{ text: correct, ok: true }, ...distractors.map(t => ({ text: t, ok: false }))]);
  return {
    type: 'mc',
    prompt,
    options: all.map(o => o.text),
    correctIndex: all.findIndex(o => o.ok),
    explanation,
  };
}

/* Electronegativity table (Pauling, approximate, for tool + questions) */
const EN = {
  H: 2.20, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98,
  Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58, Cl: 3.16,
  K: 0.82, Ca: 1.00, Br: 2.96, I: 2.66, Fe: 1.83, Cu: 1.90, Zn: 1.65, Ag: 1.93,
};
const _molarMass = {
  H: 1.008, C: 12.01, N: 14.01, O: 16.00, Na: 22.99, Mg: 24.31, Al: 26.98,
  S: 32.06, Cl: 35.45, K: 39.10, Ca: 40.08, Fe: 55.85, Cu: 63.55, Br: 79.90,
};

window.EN_TABLE = EN;

/* ================================================================ */
const Q = {

  /* ---------------- BONDING ---------------- */
  bonding: [
    // 1) EN diff → bond type (3 cases rotated)
    () => {
      const pairs = [
        { a:'Na', b:'Cl', kind:'ionic',          why:'ΔEN ≈ 2.23 (≥1.7) → ionic.' },
        { a:'K',  b:'Br', kind:'ionic',          why:'ΔEN ≈ 2.14 → ionic.' },
        { a:'H',  b:'O',  kind:'polar covalent', why:'ΔEN ≈ 1.24 (0.4–1.7) → polar covalent.' },
        { a:'C',  b:'O',  kind:'polar covalent', why:'ΔEN ≈ 0.89 → polar covalent.' },
        { a:'C',  b:'H',  kind:'nonpolar covalent', why:'ΔEN ≈ 0.35 (<0.4) → nonpolar covalent.' },
        { a:'N',  b:'N',  kind:'nonpolar covalent', why:'Same atom → ΔEN = 0 → nonpolar covalent.' },
      ];
      const p = _pick(pairs);
      const diff = Math.abs(EN[p.a] - EN[p.b]).toFixed(2);
      return mc(
        `What type of bond forms between ${p.a} and ${p.b}? (ΔEN ≈ ${diff})`,
        p.kind,
        ['ionic','polar covalent','nonpolar covalent','metallic'].filter(x => x !== p.kind),
        p.why
      );
    },

    // 2) HF trick — exception
    () => mc(
      'H–F has an electronegativity difference of ~1.78. What kind of bond is it?',
      'polar covalent',
      ['ionic','nonpolar covalent','metallic'],
      'Famous exception: even with ΔEN ≈ 1.78, HF is classified as POLAR COVALENT (it exists as discrete H–F molecules, not as a lattice of ions).'
    ),

    // 3) Metal + nonmetal vs nonmetal + nonmetal
    () => {
      const items = [
        { f:'MgO',  k:'ionic',    why:'Mg (metal) + O (nonmetal) → ionic.' },
        { f:'CO₂',  k:'covalent', why:'C + O are both nonmetals → covalent.' },
        { f:'NaF',  k:'ionic',    why:'Na (metal) + F (nonmetal) → ionic.' },
        { f:'NH₃',  k:'covalent', why:'N + H are both nonmetals → covalent.' },
        { f:'CaCl₂',k:'ionic',    why:'Ca (metal) + Cl (nonmetal) → ionic.' },
      ];
      const it = _pick(items);
      return mc(`Is ${it.f} ionic or covalent?`, it.k, [it.k === 'ionic' ? 'covalent' : 'ionic','metallic','network'], it.why);
    },

    // 4) Polar molecule vs nonpolar molecule (shape + bond)
    () => {
      const items = [
        { f:'CO₂',  k:'nonpolar', why:'Linear, symmetric — polar C=O bonds cancel.' },
        { f:'H₂O',  k:'polar',    why:'Bent shape — O–H bonds don’t cancel.' },
        { f:'CH₄',  k:'nonpolar', why:'Tetrahedral, all C–H bonds symmetric.' },
        { f:'NH₃',  k:'polar',    why:'Trigonal pyramidal with a lone pair — bonds don’t cancel.' },
        { f:'CCl₄', k:'nonpolar', why:'Tetrahedral, symmetric — pulls cancel.' },
        { f:'CHCl₃',k:'polar',    why:'One bond is different (C–H) — symmetry broken.' },
      ];
      const it = _pick(items);
      return mc(`Is ${it.f} a polar or nonpolar molecule?`, it.k, [it.k === 'polar' ? 'nonpolar' : 'polar','ionic','metallic'], it.why);
    },

    // 5) Numeric EN difference
    () => {
      const pairs = [['Mg','O'],['Na','Cl'],['C','H'],['H','N'],['Al','Cl'],['Si','O']];
      const [a,b] = _pick(pairs);
      const diff = Math.abs(EN[a] - EN[b]);
      return {
        type:'numeric',
        prompt:`Calculate the electronegativity difference between ${a} (${EN[a]}) and ${b} (${EN[b]}).`,
        answer: _round(diff, 2),
        tolerance: 0.05,
        units: '',
        explanation: `|${EN[a]} − ${EN[b]}| = ${diff.toFixed(2)}.`
      };
    },

    // 6) Which bond is most polar?
    () => mc(
      'Which bond is the MOST polar?',
      'H–F',
      ['H–Cl','H–Br','H–I'],
      'F has the highest electronegativity. The bigger the EN difference with H, the more polar the bond.'
    ),

    // 7) Identify diatomic / nonpolar
    () => mc(
      'Which molecule has a totally nonpolar covalent bond?',
      'N₂',
      ['HCl','H₂O','NaCl'],
      'Two identical atoms (N≡N) → ΔEN = 0 → perfectly nonpolar.'
    ),

    // 8) Concept: metallic bond
    () => mc(
      'What best describes a metallic bond?',
      'A "sea" of delocalized electrons shared among metal cations',
      ['Electrons completely transferred from one atom to another',
       'Electrons shared in a fixed pair between two nonmetals',
       'A weak attraction between molecules'],
      'Metallic bonding = positive metal ions in a delocalized electron sea — explains why metals conduct and are malleable.'
    ),

    // 9) Ionic compound formula
    () => mc(
      'Which formula represents an IONIC compound?',
      'KBr',
      ['CO','PCl₃','CH₂O'],
      'K is a metal, Br is a nonmetal → ionic. The others are all nonmetal + nonmetal (covalent).'
    ),

    // 10) Polarity prediction from formula
    () => {
      const list = [
        { f:'BF₃', k:'nonpolar', why:'Trigonal planar, symmetric — polar B–F bonds cancel.' },
        { f:'SO₂', k:'polar',    why:'Bent shape (one lone pair on S) — bonds don’t cancel.' },
        { f:'HCl', k:'polar',    why:'Diatomic with a clear ΔEN — polar.' },
        { f:'Br₂', k:'nonpolar', why:'Same atom on both sides — ΔEN = 0.' },
      ];
      const it = _pick(list);
      return mc(`Is ${it.f} polar or nonpolar overall?`, it.k, [it.k === 'polar' ? 'nonpolar' : 'polar'], it.why);
    },

    // 11) Concept: lattice vs molecule
    () => mc(
      'Ionic compounds form a repeating lattice rather than individual molecules. Why?',
      'Each ion is electrostatically attracted to many oppositely charged neighbors',
      ['Because ionic bonds are weaker than covalent',
       'Because metals can\'t form discrete molecules',
       'Because of London dispersion forces'],
      'Cations and anions arrange themselves in 3D so every ion is surrounded by oppositely charged ions → lattice.'
    ),

    // 12) EN comparison
    () => mc(
      'Which element has the HIGHEST electronegativity?',
      'F',
      ['O','N','Cl'],
      'Fluorine (3.98) is the most electronegative element on the periodic table.'
    ),
  ],

  /* ---------------- LEWIS & GEOMETRY ---------------- */
  'lewis-geometry': [
    // 1) Shape from formula
    () => {
      const items = [
        { f:'H₂O',  s:'bent',                a:'~104.5°' },
        { f:'NH₃',  s:'trigonal pyramidal',  a:'~107°'   },
        { f:'CH₄',  s:'tetrahedral',         a:'109.5°'  },
        { f:'CO₂',  s:'linear',              a:'180°'    },
        { f:'BH₃',  s:'trigonal planar',     a:'120°'    },
        { f:'BF₃',  s:'trigonal planar',     a:'120°'    },
      ];
      const it = _pick(items);
      const choices = ['linear','bent','trigonal planar','trigonal pyramidal','tetrahedral'];
      return mc(
        `What is the molecular geometry of ${it.f}?`,
        it.s,
        choices.filter(c => c !== it.s).slice(0,3),
        `${it.f} has shape ${it.s} (bond angle ${it.a}).`
      );
    },

    // 2) Lone pair count
    () => {
      const items = [
        { f:'H₂O',  lp:2, total:'O has 2 bonding pairs + 2 lone pairs.' },
        { f:'NH₃',  lp:1, total:'N has 3 bonding pairs + 1 lone pair.' },
        { f:'CH₄',  lp:0, total:'C has 4 bonding pairs, no lone pairs.' },
        { f:'HF',   lp:3, total:'F has 1 bonding pair + 3 lone pairs.' },
      ];
      const it = _pick(items);
      return {
        type: 'numeric',
        prompt: `How many lone pairs are on the central atom in ${it.f}?`,
        answer: it.lp, tolerance: 0, units: '',
        explanation: it.total
      };
    },

    // 3) Bond angle
    () => mc(
      'What is the approximate bond angle in CH₄?',
      '109.5°',
      ['90°','120°','180°'],
      'Tetrahedral geometry → 109.5° between bonds.'
    ),

    // 4) Why H₂O bent and not linear
    () => mc(
      'Why is H₂O bent instead of linear?',
      'The two lone pairs on oxygen push the bonds closer together',
      ['Hydrogen is too small',
       'Oxygen forms double bonds',
       'Water has too few electrons'],
      'Lone pairs on the central atom repel bonding pairs and force the bent shape (~104.5°).'
    ),

    // 5) Polar/nonpolar from shape
    () => {
      const items = [
        { f:'CCl₄', k:'nonpolar', why:'Tetrahedral and symmetric — polar bonds cancel.' },
        { f:'CHCl₃',k:'polar',    why:'Tetrahedral but asymmetric (one C–H, three C–Cl).' },
        { f:'BF₃',  k:'nonpolar', why:'Trigonal planar, symmetric.' },
        { f:'NH₃',  k:'polar',    why:'Trigonal pyramidal — lone pair makes it asymmetric.' },
      ];
      const it = _pick(items);
      return mc(`${it.f} is overall…`, it.k, [it.k === 'polar' ? 'nonpolar' : 'polar'], it.why);
    },

    // 6) Total valence electrons
    () => {
      const items = [
        { f:'H₂O', n:8,  parts:'2(1) + 6 = 8' },
        { f:'NH₃', n:8,  parts:'5 + 3(1) = 8' },
        { f:'CH₄', n:8,  parts:'4 + 4(1) = 8' },
        { f:'CO₂', n:16, parts:'4 + 2(6) = 16' },
        { f:'NH₄⁺', n:8, parts:'5 + 4(1) − 1 (positive charge) = 8' },
      ];
      const it = _pick(items);
      return {
        type:'numeric',
        prompt:`How many total valence electrons does ${it.f} have?`,
        answer: it.n, tolerance: 0, units:'',
        explanation:`${it.parts} = ${it.n} valence electrons.`
      };
    },

    // 7) Predicting geometry from electron groups
    () => mc(
      'A central atom has 4 electron groups, 0 lone pairs. The molecular geometry is…',
      'tetrahedral',
      ['linear','trigonal planar','bent'],
      '4 groups, 0 lone pairs → tetrahedral (109.5°).'
    ),

    // 8) 4 groups, 1 lone pair
    () => mc(
      'A central atom has 4 electron groups and 1 lone pair. The shape is…',
      'trigonal pyramidal',
      ['tetrahedral','bent','trigonal planar'],
      'NH₃ is the classic example — the lone pair gives a tripod shape.'
    ),

    // 9) 2 groups, 0 lone pairs
    () => mc(
      'A central atom has 2 electron groups and 0 lone pairs. The shape is…',
      'linear',
      ['bent','trigonal planar','tetrahedral'],
      'CO₂ is the example — 180° linear.'
    ),

    // 10) Number of bonds (BH₃)
    () => {
      const items = [
        { f:'BH₃',  n:3, why:'B is in the center with three single B–H bonds.' },
        { f:'CH₄',  n:4, why:'C with four single C–H bonds.' },
        { f:'CO₂',  n:4, why:'Two C=O double bonds → 4 bond pairs total.' },
        { f:'N₂',   n:3, why:'Triple bond → 3 bonding pairs.' },
      ];
      const it = _pick(items);
      return {
        type:'numeric',
        prompt:`How many BONDING pairs of electrons are in ${it.f}?`,
        answer: it.n, tolerance: 0, units:'',
        explanation: it.why
      };
    },

    // 11) Shape of NH₄⁺
    () => mc(
      'What is the geometry of NH₄⁺?',
      'tetrahedral',
      ['trigonal pyramidal','square planar','linear'],
      'No lone pairs on N (it gave one up for the positive charge), 4 bonded H — tetrahedral.'
    ),

    // 12) Geometry of CO₂ trick (linear despite 2 double bonds)
    () => mc(
      'CO₂ has two C=O double bonds. Its molecular geometry is…',
      'linear',
      ['bent','trigonal planar','tetrahedral'],
      'Each double bond counts as ONE electron group. 2 groups, 0 lone pairs → linear.'
    ),
  ],

  /* ---------------- IMFs ---------------- */
  imf: [
    // 1) Identify strongest IMF
    () => {
      const items = [
        { f:'H₂O',  ans:'hydrogen bonding', why:'H bonded to O → H-bonds. Strongest of the three on this list.' },
        { f:'HCl',  ans:'dipole-dipole',    why:'Polar molecule but H is NOT bonded to N/O/F, so NO H-bonding. Dipole-dipole is strongest here.' },
        { f:'CH₄',  ans:'London dispersion',why:'Nonpolar, no dipole, no H–F/O/N → only London dispersion.' },
        { f:'NH₃',  ans:'hydrogen bonding', why:'H bonded to N → H-bonds present.' },
        { f:'BH₃',  ans:'London dispersion',why:'B is NOT N/O/F, so no H-bonding. BH₃ is also nonpolar — only dispersion.' },
        { f:'CO₂',  ans:'London dispersion',why:'Nonpolar molecule (linear, symmetric) — only dispersion forces.' },
      ];
      const it = _pick(items);
      const choices = ['hydrogen bonding','dipole-dipole','London dispersion'].filter(c => c !== it.ans);
      return mc(`What is the STRONGEST IMF present in ${it.f}?`, it.ans, choices, it.why);
    },

    // 2) Trap: BH₃ does NOT have H-bonding
    () => mc(
      'Does BH₃ exhibit hydrogen bonding?',
      'No — H must be bonded to N, O, or F. B is none of those.',
      ['Yes — it has H atoms bonded to a small atom.',
       'Yes — boron has lone pairs.',
       'Only at low temperature.'],
      'Hydrogen bonding requires H directly bonded to N, O, or F. Boron does not qualify.'
    ),

    // 3) Order by BP
    () => mc(
      'Rank by boiling point (lowest → highest): CH₄, H₂O, HCl',
      'CH₄ < HCl < H₂O',
      ['H₂O < HCl < CH₄','CH₄ < H₂O < HCl','HCl < CH₄ < H₂O'],
      'H₂O has H-bonding (strongest), HCl has dipole-dipole, CH₄ only dispersion.'
    ),

    // 4) Dispersion size effect
    () => mc(
      'Among nonpolar molecules, which factor MOST affects London dispersion strength?',
      'Size / molar mass of the molecule',
      ['Number of hydrogen atoms','Polarity of bonds','Temperature of the room'],
      'Bigger electron cloud = more polarizable = stronger London dispersion.'
    ),

    // 5) H-bonding criteria
    () => mc(
      'Which molecule CAN form hydrogen bonds with itself?',
      'CH₃OH',
      ['CH₄','CO₂','PH₃'],
      'CH₃OH has H bonded to O — qualifies. None of the others has H on N/O/F.'
    ),

    // 6) IMFs in HF
    () => mc(
      'Which IMFs are present in liquid HF?',
      'London dispersion, dipole-dipole, AND hydrogen bonding',
      ['Only London dispersion',
       'Only hydrogen bonding',
       'Only dipole-dipole'],
      'All polar/H-bond capable molecules also have dipole and dispersion. The list stacks: dispersion is always there.'
    ),

    // 7) Dispersion is in EVERY molecule
    () => mc(
      'Which IMF is present in EVERY molecule?',
      'London dispersion',
      ['Hydrogen bonding','Dipole-dipole','Ionic bonding'],
      'Dispersion forces exist in every substance with electrons (which is all of them).'
    ),

    // 8) Why does water have such a high BP
    () => mc(
      'Why does H₂O have an unusually high boiling point compared to H₂S?',
      'Hydrogen bonding in water requires more energy to break',
      ['Water has more electrons',
       'Sulfur is heavier',
       'Water is more polar than ionic'],
      'H–O qualifies for H-bonding. H–S does not. H-bonds are much stronger than the dipole-dipole forces in H₂S.'
    ),

    // 9) Trap: HCl — no H-bonding even with H
    () => mc(
      'Does HCl form hydrogen bonds?',
      'No — Cl is not N, O, or F',
      ['Yes — H is involved',
       'Yes — Cl is electronegative enough',
       'Only with metals'],
      'H-bonding requires H bonded specifically to N, O, or F. Cl is too big and not electronegative enough.'
    ),

    // 10) Identify all IMFs
    () => {
      const items = [
        { f:'CO₂', ans:'London dispersion only',   why:'Nonpolar molecule → just dispersion.' },
        { f:'H₂O', ans:'Dispersion, dipole, and H-bonding',  why:'Polar AND H–O → all three.' },
        { f:'HCl', ans:'Dispersion + dipole-dipole', why:'Polar but no H-bonding (Cl not N/O/F).' },
      ];
      const it = _pick(items);
      const distractors = [
        'London dispersion only',
        'Dispersion + dipole-dipole',
        'Dispersion, dipole, and H-bonding',
      ].filter(d => d !== it.ans);
      return mc(`What IMFs are present in ${it.f}?`, it.ans, distractors, it.why);
    },

    // 11) IMF ranking with the canonical four
    () => mc(
      'Rank the IMF strengths: H₂O, NF₃, CF₄, BH₃',
      'H₂O > NF₃ > CF₄ > BH₃',
      ['BH₃ > CF₄ > NF₃ > H₂O',
       'CF₄ > BH₃ > NF₃ > H₂O',
       'NF₃ > H₂O > BH₃ > CF₄'],
      'H₂O has H-bonds (strongest). NF₃ is polar (dipole + dispersion). CF₄ is nonpolar but bigger than BH₃ so more dispersion. BH₃ is the smallest, just dispersion.'
    ),

    // 12) Volatility
    () => mc(
      'A liquid that evaporates very easily at room temperature has…',
      'weak IMFs',
      ['very strong H-bonds','high molar mass','many lone pairs'],
      'Weaker IMFs → easier to escape into vapor → more volatile.'
    ),
  ],

  /* ---------------- NOMENCLATURE ---------------- */
  nomenclature: [
    // 1) Simple ionic name (CaCl₂ — common "calcium dichloride" mistake)
    () => mc(
      'What is the correct name for CaCl₂?',
      'calcium chloride',
      ['calcium dichloride','calcium(II) chloride','dicalcium chloride'],
      'Ionic compounds do NOT use Greek prefixes. CaCl₂ is just "calcium chloride".'
    ),

    // 2) MgCl₂
    () => mc(
      'What is the correct name for MgCl₂?',
      'magnesium chloride',
      ['magnesium dichloride','magnesium(II) chloride','dimagnesium chloride'],
      'Ionic — no prefixes. The subscript 2 is implied by charge balance (Mg²⁺ + 2 Cl⁻).'
    ),

    // 3) -ite vs -ate (Li₂SO₃)
    () => mc(
      'What is the name of Li₂SO₃?',
      'lithium sulfite',
      ['lithium sulfate','lithium sulfide','dilithium sulfite'],
      'SO₃²⁻ = sulfite (3 oxygens). SO₄²⁻ would be sulfate (4 oxygens). No prefixes for ionic.'
    ),

    // 4) Transition metal — Iron(III) carbonate
    () => mc(
      'What is the formula for iron(III) carbonate?',
      'Fe₂(CO₃)₃',
      ['FeCO₃','Fe₃(CO₃)₂','Fe(CO₃)₃'],
      'Fe³⁺ + CO₃²⁻ → criss-cross charges → Fe₂(CO₃)₃.'
    ),

    // 5) Aluminum sulfate formula
    () => mc(
      'What is the formula for aluminum sulfate?',
      'Al₂(SO₄)₃',
      ['AlSO₄','Al(SO₄)₃','Al₃(SO₄)₂'],
      'Al³⁺ + SO₄²⁻ → criss-cross → Al₂(SO₄)₃.'
    ),

    // 6) Ammonium nitrate
    () => mc(
      'What is the formula for ammonium nitrate?',
      'NH₄NO₃',
      ['NH₃NO₃','(NH₄)₂NO₃','NH₄(NO₂)'],
      'NH₄⁺ (ammonium) + NO₃⁻ (nitrate). Charges balance 1:1 → NH₄NO₃.'
    ),

    // 7) Covalent prefix name
    () => {
      const items = [
        { f:'CO',     n:'carbon monoxide',         d:['carbon oxide','carbon dioxide','monocarbon oxide'] },
        { f:'CO₂',    n:'carbon dioxide',          d:['carbon oxide','dicarbon oxide','monocarbon dioxide'] },
        { f:'N₂O₅',   n:'dinitrogen pentoxide',    d:['nitrogen pentoxide','dinitrogen oxide','dinitrogen heptoxide'] },
        { f:'PCl₃',   n:'phosphorus trichloride',  d:['phosphorus chloride','phosphorus(III) chloride','triphosphorus chloride'] },
        { f:'SF₆',    n:'sulfur hexafluoride',     d:['sulfur fluoride','sulfur(VI) fluoride','hexasulfur fluoride'] },
      ];
      const it = _pick(items);
      return mc(`Name the covalent compound ${it.f}.`, it.n, it.d, 'Covalent compounds USE Greek prefixes. Mono- is dropped on the FIRST atom only.');
    },

    // 8) Roman numeral required
    () => {
      const items = [
        { f:'FeCl₂', n:'iron(II) chloride',  d:['iron chloride','iron(III) chloride','iron dichloride'] },
        { f:'CuO',   n:'copper(II) oxide',   d:['copper oxide','copper(I) oxide','copper dioxide'] },
        { f:'FeCl₃', n:'iron(III) chloride', d:['iron chloride','iron(II) chloride','iron trichloride'] },
      ];
      const it = _pick(items);
      return mc(`Name ${it.f}.`, it.n, it.d, 'Transition metals can have variable charges, so Roman numerals are required.');
    },

    // 9) Recognize polyatomic
    () => mc(
      'Which formula represents potassium phosphate?',
      'K₃PO₄',
      ['KPO₄','K(PO₄)₃','K₃PO₃'],
      'PO₄³⁻ = phosphate. K⁺ balances 3:1 → K₃PO₄. (K₃PO₃ would be potassium phosphite.)'
    ),

    // 10) Free-typed name
    () => {
      const items = [
        { f:'NaCl',  ans:['sodium chloride'] },
        { f:'MgO',   ans:['magnesium oxide'] },
        { f:'KBr',   ans:['potassium bromide'] },
        { f:'CaF₂',  ans:['calcium fluoride'] },
      ];
      const it = _pick(items);
      return {
        type: 'text',
        prompt: `Type the name of ${it.f}.`,
        accept: it.ans,
        explanation: `${it.f} = ${it.ans[0]}. No prefixes for ionic compounds.`
      };
    },

    // 11) Free-typed formula
    () => {
      const items = [
        { name:'sodium nitrate',     ans:['nano3','nano₃'] },
        { name:'calcium carbonate',  ans:['caco3','caco₃'] },
        { name:'potassium hydroxide',ans:['koh'] },
        { name:'ammonium chloride',  ans:['nh4cl','nh₄cl'] },
      ];
      const it = _pick(items);
      return {
        type:'text',
        prompt:`What is the formula for ${it.name}? (Ignore subscripts — e.g., write "Na2SO4")`,
        accept: it.ans,
        explanation: `${it.name} → ${it.ans[0].toUpperCase()}.`
      };
    },

    // 12) -ate vs -ite multiple choice
    () => mc(
      'Which ion is the SULFITE ion?',
      'SO₃²⁻',
      ['SO₄²⁻','S²⁻','HSO₄⁻'],
      'SO₃²⁻ = sulfite (3 oxygens). SO₄²⁻ = sulfate (4 oxygens). -ite has one less O.'
    ),

    // 13) Mixed up name
    () => mc(
      'Which name is INCORRECT for the formula given?',
      'CaCl₂ → calcium dichloride',
      ['NaCl → sodium chloride','CO₂ → carbon dioxide','FeCl₃ → iron(III) chloride'],
      'No Greek prefixes for ionic compounds — CaCl₂ is just "calcium chloride".'
    ),
  ],

  /* ---------------- SOLUTIONS ---------------- */
  solutions: [
    // 1) Molarity calc
    () => {
      const moles = _round(_rand(0.1, 1.0), 3);
      const liters = _round(_rand(0.2, 1.6), 2);
      const ans = _round(moles / liters, 3);
      return {
        type: 'numeric',
        prompt: `What is the molarity of ${moles} mol of NaCl dissolved in ${liters} L of solution?`,
        answer: ans, tolerance: 0.01, units: 'M',
        explanation: `M = mol / L = ${moles} / ${liters} = ${ans} M.`
      };
    },

    // 2) Moles from M and V (with mL)
    () => {
      const M = _round(_rand(0.2, 2.5), 2);
      const mL = _randInt(100, 750);
      const L = mL / 1000;
      const ans = _round(M * L, 3);
      return {
        type:'numeric',
        prompt:`How many moles of solute are in ${mL} mL of ${M} M solution?`,
        answer: ans, tolerance: 0.01, units:'mol',
        explanation:`${mL} mL = ${L} L. mol = M × L = ${M} × ${L} = ${ans} mol.`
      };
    },

    // 3) Dilution: find new concentration
    () => {
      const M1 = _round(_rand(2, 6), 1);
      const V1 = _randInt(50, 200);
      const V2 = V1 + _randInt(100, 500);
      const ans = _round((M1 * V1) / V2, 3);
      return {
        type:'numeric',
        prompt:`${V1} mL of ${M1} M HCl is diluted to ${V2} mL. What is the new molarity?`,
        answer: ans, tolerance: 0.02, units:'M',
        explanation:`M₁V₁ = M₂V₂ → M₂ = (${M1} × ${V1}) / ${V2} = ${ans} M.`
      };
    },

    // 4) Dilution: find volume of water TO ADD
    () => {
      const M1 = _round(_rand(4, 10), 1);
      const V1 = _randInt(50, 150);
      const M2 = _round(_rand(0.5, 2), 1);
      const V2 = _round((M1 * V1) / M2, 0);
      const add = +(V2 - V1).toFixed(0);
      return {
        type:'numeric',
        prompt:`How much WATER must be ADDED to ${V1} mL of ${M1} M HCl to dilute it to ${M2} M?`,
        answer: add, tolerance: 2, units:'mL',
        explanation:`V₂ = (M₁V₁)/M₂ = (${M1}×${V1})/${M2} = ${V2} mL. Water added = V₂ − V₁ = ${V2} − ${V1} = ${add} mL.`
      };
    },

    // 5) Saturated definition
    () => mc(
      'Which best describes a SATURATED solution?',
      'It has dissolved as much solute as it can hold at that temperature',
      ['It has very little solute',
       'It has been diluted with water',
       'It is heating up'],
      'Saturated = at the solubility limit for that temperature. Adding more solute would just settle out.'
    ),

    // 6) Supersaturated definition
    () => mc(
      'Which solution is UNSTABLE and may spontaneously crystallize if disturbed?',
      'supersaturated',
      ['unsaturated','saturated','dilute'],
      'Supersaturated = temporarily holding MORE than the saturation limit. Any disturbance triggers crystal formation.'
    ),

    // 7) Beer's Law solve for c
    () => {
      const A = _round(_rand(0.1, 1.0), 2);
      const eps = _randInt(50, 500);
      const b = 1;
      const c = _round(A / (eps * b), 5);
      return {
        type:'numeric',
        prompt:`Using A = εbc with A = ${A}, ε = ${eps} L/(mol·cm), b = ${b} cm, solve for c.`,
        answer: c, tolerance: c * 0.05, units:'M',
        explanation:`c = A / (ε × b) = ${A} / (${eps} × ${b}) = ${c} M.`
      };
    },

    // 8) Grams of solute needed
    () => {
      const M = _round(_rand(0.5, 2.0), 2);
      const L = _round(_rand(0.25, 1.0), 2);
      const mm = 58.44; // NaCl
      const ans = _round(M * L * mm, 2);
      return {
        type:'numeric',
        prompt:`How many grams of NaCl (M = 58.44 g/mol) are needed to make ${L} L of a ${M} M solution?`,
        answer: ans, tolerance: ans * 0.02, units:'g',
        explanation:`mol = M × L = ${M} × ${L} = ${_round(M*L, 3)} mol. g = mol × M = ${_round(M*L,3)} × 58.44 = ${ans} g.`
      };
    },

    // 9) Solute / solvent vocab
    () => mc(
      'In a salt-water solution, which is the SOLVENT?',
      'water',
      ['salt','the dissolved ions','the beaker'],
      'Solvent = what does the dissolving (and is usually in larger amount). Solute = what gets dissolved.'
    ),

    // 10) Temperature effect on solubility
    () => mc(
      'For most solid solutes in water, solubility increases as temperature…',
      'increases',
      ['decreases','stays the same','first decreases, then increases'],
      'Most solids dissolve better in hot water. (Gases are opposite — they dissolve less in hot water.)'
    ),

    // 11) Beer's Law solve for A
    () => {
      const eps = _randInt(100, 800);
      const b = 1;
      const c = _round(_rand(0.001, 0.05), 4);
      const A = _round(eps * b * c, 3);
      return {
        type:'numeric',
        prompt:`Calculate the absorbance: ε = ${eps} L/(mol·cm), b = ${b} cm, c = ${c} M.`,
        answer: A, tolerance: A * 0.03, units:'',
        explanation:`A = εbc = ${eps} × ${b} × ${c} = ${A}.`
      };
    },

    // 12) Concept: dilution moles
    () => mc(
      'When you dilute a solution by adding water, what happens to the moles of solute?',
      'Stays the same',
      ['Decreases','Increases','Becomes zero'],
      'Adding water changes the volume but NOT the moles of solute. That\'s why M₁V₁ = M₂V₂.'
    ),

    // 13) Find original concentration (reverse of #2)
    () => {
      const mol = _round(_rand(0.05, 0.6), 3);
      const mL = _randInt(100, 500);
      const M = _round(mol / (mL / 1000), 3);
      return {
        type:'numeric',
        prompt:`${mol} mol of solute is dissolved in ${mL} mL of solution. What is the molarity?`,
        answer: M, tolerance: 0.02, units:'M',
        explanation:`M = mol / L = ${mol} / ${mL/1000} = ${M} M.`
      };
    },
  ],

  /* ---------------- REACTIONS ---------------- */
  reactions: [
    // 1) Reaction type identification
    () => {
      const items = [
        { eq:'2 H₂ + O₂ → 2 H₂O',           t:'synthesis' },
        { eq:'2 H₂O → 2 H₂ + O₂',           t:'decomposition' },
        { eq:'Zn + CuSO₄ → ZnSO₄ + Cu',     t:'single replacement' },
        { eq:'NaCl + AgNO₃ → NaNO₃ + AgCl', t:'double replacement' },
        { eq:'CH₄ + 2 O₂ → CO₂ + 2 H₂O',    t:'combustion' },
        { eq:'2 NaCl → 2 Na + Cl₂',         t:'decomposition' },
        { eq:'CaO + CO₂ → CaCO₃',           t:'synthesis' },
      ];
      const it = _pick(items);
      const all = ['synthesis','decomposition','single replacement','double replacement','combustion'];
      return mc(
        `Classify the reaction: ${it.eq}`,
        it.t,
        all.filter(x => x !== it.t).slice(0, 3),
        `Look at the pattern: ${it.t}.`
      );
    },

    // 2) Combustion product prediction
    () => mc(
      'Complete combustion of any hydrocarbon (CxHy) produces:',
      'CO₂ + H₂O',
      ['CO + H₂','C + H₂O','CO₂ + H₂'],
      'Burning C + H in plenty of oxygen → carbon dioxide + water.'
    ),

    // 3) Balancing — coefficient of O₂ in propane combustion
    () => mc(
      'Balance: C₃H₈ + ? O₂ → 3 CO₂ + 4 H₂O. What coefficient goes in front of O₂?',
      '5',
      ['3','4','6'],
      'Right side has 3(2) + 4(1) = 10 O atoms. So we need 5 O₂.'
    ),

    // 4) Diatomic recall
    () => mc(
      'Which set is correct for the seven diatomic elements?',
      'H₂, N₂, O₂, F₂, Cl₂, Br₂, I₂',
      ['H, N, O, F, Cl, Br, I',
       'O₂, N₂, H₂ only',
       'O₂, S₈, P₄, H₂, N₂, Cl₂, F₂'],
      'BrINClHOF — Br, I, N, Cl, H, O, F. These exist as diatomics in their elemental form.'
    ),

    // 5) Predict product — single replacement
    () => mc(
      'Predict the product: Zn + 2 HCl →',
      'ZnCl₂ + H₂',
      ['ZnCl + H₂','Zn₂Cl + H','ZnH + HCl'],
      'More reactive metal (Zn) displaces hydrogen. Product is the salt + H₂ gas.'
    ),

    // 6) Solubility rule
    () => mc(
      'Which compound is INSOLUBLE in water?',
      'CaCO₃',
      ['NaNO₃','KCl','NH₄Cl'],
      'Most carbonates are insoluble (except group 1 / NH₄⁺). Nitrates, alkali salts, and ammonium salts are soluble.'
    ),

    // 7) Skeleton vs net ionic vocab
    () => mc(
      'A "skeleton equation" is…',
      'a reaction written with correct formulas but NOT balanced',
      ['the same as a net ionic equation',
       'the balanced ionic version with spectator ions removed',
       'only used for combustion'],
      'Skeleton = unbalanced. Net ionic = balanced ionic equation with spectator ions removed. They are NOT the same.'
    ),

    // 8) Net ionic equation
    () => mc(
      'For AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq), the NET ionic equation is:',
      'Ag⁺(aq) + Cl⁻(aq) → AgCl(s)',
      ['Ag⁺ + Cl⁻ + Na⁺ + NO₃⁻ → AgCl + Na⁺ + NO₃⁻',
       'AgNO₃ + NaCl → AgCl + NaNO₃',
       'Na⁺ + NO₃⁻ → NaNO₃'],
      'Spectator ions (Na⁺ and NO₃⁻) cancel. Only the species that actually react and precipitate remain.'
    ),

    // 9) Synthesis predict products
    () => mc(
      'Predict the product: Na + Cl₂ → ',
      '2 NaCl (after balancing)',
      ['NaCl₂','Na₂Cl','NaCl₃'],
      'Na⁺ + Cl⁻ → NaCl. Balanced: 2 Na + Cl₂ → 2 NaCl.'
    ),

    // 10) Coefficient of H₂O in this balance
    () => mc(
      'Balance: 2 C₂H₆ + ? O₂ → 4 CO₂ + ? H₂O',
      '7 O₂ → 4 CO₂ + 6 H₂O',
      ['5 O₂ → 4 CO₂ + 6 H₂O',
       '7 O₂ → 2 CO₂ + 6 H₂O',
       '6 O₂ → 4 CO₂ + 4 H₂O'],
      '2 C₂H₆ has 12 H → 6 H₂O. C balanced as 4 CO₂. O total: 4(2)+6(1) = 14 → 7 O₂.'
    ),

    // 11) Decomposition
    () => mc(
      'Which equation is a decomposition reaction?',
      '2 H₂O₂ → 2 H₂O + O₂',
      ['Zn + 2 HCl → ZnCl₂ + H₂',
       'N₂ + 3 H₂ → 2 NH₃',
       'AgNO₃ + NaCl → AgCl + NaNO₃'],
      'One reactant breaks down into two or more products → decomposition.'
    ),

    // 12) Balance check
    () => mc(
      'Is the equation balanced? N₂ + H₂ → NH₃',
      'No, it needs coefficients of 1, 3, 2',
      ['Yes, it is balanced',
       'No, it needs 2, 1, 2',
       'No, it needs 3, 1, 2'],
      'Balanced: N₂ + 3 H₂ → 2 NH₃. 2 N each side, 6 H each side.'
    ),

    // 13) Double replacement — precipitate identify
    () => mc(
      'In Pb(NO₃)₂ + 2 KI → PbI₂ + 2 KNO₃, which compound is the precipitate (insoluble solid)?',
      'PbI₂',
      ['KNO₃','Pb(NO₃)₂','KI'],
      'KNO₃ is soluble (all nitrates and group 1 salts are). PbI₂ is the classic yellow insoluble product.'
    ),
  ],

  /* ---------------- STOICHIOMETRY ---------------- */
  stoichiometry: [
    // 1) Mole-to-mole using coefficients
    () => {
      const items = [
        { eq:'2 H₂ + O₂ → 2 H₂O',     a:'H₂', b:'H₂O', ratioFrom:2, ratioTo:2 },
        { eq:'N₂ + 3 H₂ → 2 NH₃',     a:'H₂', b:'NH₃', ratioFrom:3, ratioTo:2 },
        { eq:'CH₄ + 2 O₂ → CO₂ + 2 H₂O', a:'CH₄', b:'H₂O', ratioFrom:1, ratioTo:2 },
      ];
      const it = _pick(items);
      const amt = _randInt(2, 10);
      const ans = _round(amt * it.ratioTo / it.ratioFrom, 3);
      return {
        type:'numeric',
        prompt:`For ${it.eq}: how many moles of ${it.b} are produced from ${amt} mol of ${it.a}?`,
        answer: ans, tolerance: 0.05, units:'mol',
        explanation:`Use the mole ratio from coefficients: ${amt} mol ${it.a} × (${it.ratioTo} ${it.b} / ${it.ratioFrom} ${it.a}) = ${ans} mol ${it.b}.`
      };
    },

    // 2) Mass-to-mass (water from H₂)
    () => {
      const g = _round(_rand(2, 20), 2);
      const mol_H2 = g / 2.016;
      const mol_H2O = mol_H2 * (2/2);
      const ans = _round(mol_H2O * 18.02, 2);
      return {
        type:'numeric',
        prompt:`For 2 H₂ + O₂ → 2 H₂O: how many grams of water are produced from ${g} g of H₂? (H₂ = 2.016 g/mol; H₂O = 18.02 g/mol)`,
        answer: ans, tolerance: ans * 0.03, units:'g',
        explanation:`${g} g H₂ ÷ 2.016 = ${_round(mol_H2,3)} mol H₂. Ratio 2:2 → ${_round(mol_H2O,3)} mol H₂O. × 18.02 = ${ans} g.`
      };
    },

    // 3) Limiting reactant
    () => {
      const h2 = _randInt(2, 8);
      const o2 = _randInt(1, 6);
      const h2_capacity = h2 / 2;
      const lim = h2_capacity < o2 ? 'H₂' : 'O₂';
      const why = h2_capacity < o2
        ? `H₂: ${h2}/2 = ${h2_capacity}. O₂: ${o2}/1 = ${o2}. ${h2_capacity} < ${o2} → H₂ is limiting.`
        : `H₂: ${h2}/2 = ${h2_capacity}. O₂: ${o2}/1 = ${o2}. ${o2} < ${h2_capacity} → O₂ is limiting.`;
      return mc(
        `For 2 H₂ + O₂ → 2 H₂O: ${h2} mol H₂ react with ${o2} mol O₂. Which is the limiting reactant?`,
        lim,
        [lim === 'H₂' ? 'O₂' : 'H₂', 'Both are limiting', 'Neither — they react fully'],
        why
      );
    },

    // 4) % yield
    () => {
      const theo = _round(_rand(5, 30), 1);
      const actual = _round(theo * _rand(0.5, 0.95), 2);
      const ans = _round((actual / theo) * 100, 1);
      return {
        type:'numeric',
        prompt:`Theoretical yield = ${theo} g. Actual yield = ${actual} g. What is the percent yield?`,
        answer: ans, tolerance: 0.5, units:'%',
        explanation:`(${actual} / ${theo}) × 100 = ${ans}%.`
      };
    },

    // 5) Moles from grams
    () => {
      const g = _round(_rand(2, 60), 2);
      const ans = _round(g / 18.02, 3);
      return {
        type:'numeric',
        prompt:`How many moles are in ${g} g of H₂O? (M = 18.02 g/mol)`,
        answer: ans, tolerance: 0.02, units:'mol',
        explanation:`mol = g / M = ${g} / 18.02 = ${ans} mol.`
      };
    },

    // 6) Grams from moles
    () => {
      const mol = _round(_rand(0.2, 3), 2);
      const ans = _round(mol * 44.01, 2);
      return {
        type:'numeric',
        prompt:`What is the mass of ${mol} mol of CO₂? (M = 44.01 g/mol)`,
        answer: ans, tolerance: ans * 0.02, units:'g',
        explanation:`g = mol × M = ${mol} × 44.01 = ${ans} g.`
      };
    },

    // 7) Concept: never change subscripts
    () => mc(
      'When balancing equations, you can change ___ but NEVER change ___.',
      'coefficients; subscripts',
      ['subscripts; coefficients','atoms; electrons','products; reactants'],
      'Changing subscripts changes the chemical identity. Only coefficients (the big numbers in front) get adjusted.'
    ),

    // 8) Theoretical yield calc
    () => {
      const g_h2 = _round(_rand(2, 10), 2);
      const mol_h2 = g_h2 / 2.016;
      const mol_h2o = mol_h2; // 2:2
      const theo = _round(mol_h2o * 18.02, 2);
      return {
        type:'numeric',
        prompt:`What is the theoretical yield of H₂O (in grams) when ${g_h2} g of H₂ reacts completely with excess O₂? (2 H₂ + O₂ → 2 H₂O)`,
        answer: theo, tolerance: theo * 0.03, units:'g',
        explanation:`${g_h2} g H₂ → ${_round(mol_h2,3)} mol → 2:2 ratio → ${_round(mol_h2o,3)} mol H₂O × 18.02 = ${theo} g.`
      };
    },

    // 9) Limiting reactant — find excess remaining
    () => mc(
      'In 2 H₂ + O₂ → 2 H₂O, you have 4 mol H₂ and 3 mol O₂. After reaction, how much O₂ is left over?',
      '1 mol',
      ['0 mol','2 mol','3 mol'],
      'H₂ is limiting (4/2 = 2 < 3/1). 4 mol H₂ uses 2 mol O₂. 3 − 2 = 1 mol O₂ remains.'
    ),

    // 10) Mole ratio concept
    () => mc(
      'In 2 H₂ + O₂ → 2 H₂O, the mole ratio of H₂ to H₂O is:',
      '1 : 1',
      ['2 : 1','1 : 2','3 : 2'],
      'Coefficients 2 and 2 → ratio 2:2 = 1:1.'
    ),

    // 11) Conversion order
    () => mc(
      'The standard order to convert grams of A to grams of B is:',
      'g A → mol A → mol B → g B',
      ['g A → g B directly',
       'g A → mol B → g B',
       'mol A → g A → mol B → g B'],
      'Mole ratios only work on moles. Always pass through moles in the middle.'
    ),

    // 12) Identify limiting from grams
    () => {
      const gNa = _round(_rand(2, 15), 1);
      const gCl2 = _round(_rand(5, 25), 1);
      const molNa = gNa / 22.99;
      const molCl2 = gCl2 / 70.90;
      const limCapNa = molNa / 2; // 2 Na + Cl₂
      const limCapCl2 = molCl2 / 1;
      const lim = limCapNa < limCapCl2 ? 'Na' : 'Cl₂';
      const why = `${gNa} g Na = ${_round(molNa,3)} mol → ${_round(limCapNa,3)} "rxn units". ${gCl2} g Cl₂ = ${_round(molCl2,3)} mol → ${_round(limCapCl2,3)} "rxn units". Smaller wins → ${lim} is limiting.`;
      return mc(
        `For 2 Na + Cl₂ → 2 NaCl: ${gNa} g Na reacts with ${gCl2} g Cl₂. Which is limiting?`,
        lim,
        [lim === 'Na' ? 'Cl₂' : 'Na', 'Both', 'Cannot tell without molar masses'],
        why
      );
    },
  ],

  /* ---------------- THERMOCHEM ---------------- */
  thermochem: [
    // 1) q = mcΔT — solve for q
    () => {
      const m = _randInt(50, 250);
      const dT = _randInt(5, 40);
      const c = 4.186;
      const q = _round(m * c * dT, 0);
      return {
        type:'numeric',
        prompt:`How much heat (in J) is required to warm ${m} g of water by ${dT} °C? (c = 4.186 J/g·°C)`,
        answer: q, tolerance: q * 0.02, units:'J',
        explanation:`q = mcΔT = ${m} × 4.186 × ${dT} = ${q} J.`
      };
    },

    // 2) Solve for ΔT
    () => {
      const q = _randInt(1000, 12000);
      const m = _randInt(50, 250);
      const c = 4.186;
      const dT = _round(q / (m * c), 2);
      return {
        type:'numeric',
        prompt:`${q} J of heat is added to ${m} g of water. What is ΔT? (c = 4.186 J/g·°C)`,
        answer: dT, tolerance: dT * 0.03, units:'°C',
        explanation:`ΔT = q / (mc) = ${q} / (${m} × 4.186) = ${dT} °C.`
      };
    },

    // 3) Solve for mass
    () => {
      const q = _randInt(500, 6000);
      const dT = _randInt(5, 30);
      const c = 4.186;
      const m = _round(q / (c * dT), 1);
      return {
        type:'numeric',
        prompt:`If ${q} J of heat raises a water sample by ${dT} °C, what mass of water is it? (c = 4.186 J/g·°C)`,
        answer: m, tolerance: m * 0.03, units:'g',
        explanation:`m = q / (cΔT) = ${q} / (4.186 × ${dT}) = ${m} g.`
      };
    },

    // 4) Sign of ΔT
    () => mc(
      'If T_initial = 25 °C and T_final = 15 °C, what is the sign of ΔT?',
      'Negative (heat was lost)',
      ['Positive (heat was gained)','Zero','Undefined'],
      'ΔT = T_f − T_i = 15 − 25 = −10 °C. Negative ΔT means the substance cooled down.'
    ),

    // 5) Endo vs exo
    () => {
      const items = [
        { d:'A reaction with ΔH = −150 kJ/mol', ans:'exothermic', why:'Negative ΔH → releases heat → exothermic.' },
        { d:'A reaction with ΔH = +85 kJ/mol',  ans:'endothermic', why:'Positive ΔH → absorbs heat → endothermic.' },
        { d:'The beaker feels HOT to the touch during a reaction', ans:'exothermic', why:'Releasing heat to surroundings = exothermic.' },
        { d:'A cold pack snaps and gets cold',  ans:'endothermic', why:'Absorbs heat from surroundings → endo.' },
      ];
      const it = _pick(items);
      return mc(it.d + ' — this is…', it.ans, [it.ans === 'exothermic' ? 'endothermic' : 'exothermic'], it.why);
    },

    // 6) Calorimetry sign flip
    () => mc(
      'In calorimetry, why is the equation written −q_metal = q_water?',
      'Heat lost by the metal equals heat gained by the water — opposite signs',
      ['Because the metal has more mass',
       'Because the water is hotter',
       'Because the calorimeter conducts heat'],
      'Energy is conserved. The metal loses what the water gains, hence the negative sign.'
    ),

    // 7) Heat vs temperature
    () => mc(
      'Which statement is TRUE about heat and temperature?',
      'Heat is total energy transferred; temperature is average kinetic energy',
      ['Heat and temperature are the same thing',
       'Heat is measured in °C',
       'Temperature is measured in joules'],
      'Heat is energy in transit. Temperature reflects the average kinetic energy of molecules.'
    ),

    // 8) Heating curve plateau
    () => mc(
      'On a heating curve, why is the temperature flat during a phase change?',
      'Energy is being used to break IMFs, not to raise temperature',
      ['Heating has stopped',
       'The thermometer is broken',
       'Molecules are speeding up faster than ever'],
      'During melting/boiling, added heat breaks the intermolecular forces between molecules; temperature only rises when KE increases.'
    ),

    // 9) ΔH stoichiometry
    () => {
      const dH = -_randInt(100, 500);
      const mol = _randInt(2, 6);
      const ans = dH * mol;
      return {
        type:'numeric',
        prompt:`Given: A → B, ΔH = ${dH} kJ/mol. How much heat is released when ${mol} mol of A reacts? (Use a negative value for released heat.)`,
        answer: ans, tolerance: 1, units:'kJ',
        explanation:`Total ΔH = ${dH} × ${mol} = ${ans} kJ.`
      };
    },

    // 10) Calorimetry result direction
    () => mc(
      'A hot piece of metal is dropped into cooler water. As they reach the same temperature:',
      'The metal cools and the water warms',
      ['Both stay at the same starting temperatures',
       'Both get colder',
       'The water cools and the metal warms'],
      'Heat always flows from hot to cold. They meet at an intermediate temperature.'
    ),

    // 11) c_water value
    () => mc(
      'The specific heat capacity of liquid water is approximately:',
      '4.186 J/g·°C',
      ['1.0 J/g·°C','0.385 J/g·°C','100 J/g·°C'],
      'Water has a famously high specific heat — ~4.186 J/g·°C — which is why it’s a great coolant.'
    ),

    // 12) Endo product energy
    () => mc(
      'In an ENDOTHERMIC reaction, the energy of the products compared to the reactants is:',
      'Higher',
      ['Lower','Equal','Zero'],
      'Endo absorbs energy → products end up at a higher energy state than reactants.'
    ),

    // 13) Calorimetry full calc
    () => {
      const m = _randInt(50, 200);
      const dT = _randInt(5, 25);
      const c = 4.186;
      const q = _round(m * c * dT, 0);
      return {
        type:'numeric',
        prompt:`A piece of hot metal is dropped into ${m} g of water at 20 °C. The water warms to ${20+dT} °C. How much heat did the metal lose? (Magnitude only, c_water = 4.186 J/g·°C)`,
        answer: q, tolerance: q * 0.03, units:'J',
        explanation:`Heat gained by water = mcΔT = ${m} × 4.186 × ${dT} = ${q} J. By conservation, the metal lost the same amount.`
      };
    },
  ],

  /* ---------------- NUCLEAR ---------------- */
  nuclear: [
    // 1) Alpha decay effect
    () => mc(
      'When a nucleus undergoes ALPHA decay, the mass number ___ and the atomic number ___.',
      'decreases by 4; decreases by 2',
      ['decreases by 2; decreases by 4',
       'stays the same; increases by 1',
       'increases by 4; increases by 2'],
      'Alpha particle is a ⁴₂He nucleus — losing it removes 4 mass units and 2 protons.'
    ),

    // 2) Beta decay effect
    () => mc(
      'Beta decay changes the nucleus how?',
      'Mass stays the same; atomic number increases by 1',
      ['Mass −4, atomic number −2',
       'Mass stays the same; atomic number −1',
       'No change at all'],
      'A neutron converts into a proton + an emitted electron (β⁻). Mass number unchanged, atomic number goes up.'
    ),

    // 3) Half-life calculation
    () => {
      const initial = _randInt(40, 200);
      const halflives = _randInt(2, 5);
      const remaining = _round(initial * Math.pow(0.5, halflives), 3);
      return {
        type:'numeric',
        prompt:`A ${initial} g sample undergoes ${halflives} half-lives. How much remains?`,
        answer: remaining, tolerance: remaining * 0.02, units:'g',
        explanation:`Remaining = initial × (1/2)^n = ${initial} × (1/2)^${halflives} = ${remaining} g.`
      };
    },

    // 4) Number of half-lives
    () => {
      const halflife = _randInt(5, 50);
      const halflives = _randInt(2, 5);
      const totalTime = halflife * halflives;
      return {
        type:'numeric',
        prompt:`An isotope has a half-life of ${halflife} years. How many half-lives have passed in ${totalTime} years?`,
        answer: halflives, tolerance: 0, units:'',
        explanation:`n = time / half-life = ${totalTime} / ${halflife} = ${halflives}.`
      };
    },

    // 5) Identify missing particle
    () => mc(
      '²³⁸₉₂U → ?  + ⁴₂He. Identify the daughter nucleus.',
      '²³⁴₉₀Th',
      ['²³⁴₉₂U','²³⁸₉₀Th','²³⁰₈₈Ra'],
      'Mass: 238 − 4 = 234. Atomic #: 92 − 2 = 90 → Thorium.'
    ),

    // 6) Fission vs fusion
    () => mc(
      'Which is FUSION?',
      'Two hydrogen nuclei combine into helium',
      ['A uranium atom splits into smaller atoms',
       'An atom releases an alpha particle',
       'An electron is absorbed into the nucleus'],
      'Fusion = combining small nuclei into a bigger one. Fission = splitting a big nucleus into smaller pieces.'
    ),

    // 7) Gamma decay effect
    () => mc(
      'What changes in the nucleus during pure GAMMA emission?',
      'Nothing — only energy is released',
      ['Mass −4, atomic # −2',
       'Atomic # changes by 1',
       'A neutron becomes a proton'],
      'Gamma rays are pure electromagnetic energy. No change in mass or atomic number.'
    ),

    // 8) Positron decay
    () => mc(
      'Positron emission changes the nucleus how?',
      'Mass stays the same; atomic number decreases by 1',
      ['Mass −4, atomic # −2',
       'Mass stays the same; atomic # +1',
       'Mass +1; atomic # 0'],
      'A proton converts to a neutron + emitted positron. Atomic number drops by 1, mass unchanged.'
    ),

    // 9) Half-life — amount remaining percent
    () => mc(
      'After 4 half-lives, what fraction of a radioactive sample remains?',
      '1/16',
      ['1/4','1/8','1/32'],
      '(1/2)⁴ = 1/16.'
    ),

    // 10) Electron capture
    () => mc(
      'In electron capture, the atomic number ___.',
      'decreases by 1',
      ['increases by 1','stays the same','decreases by 2'],
      'An inner electron is absorbed; a proton becomes a neutron. Atomic # drops by 1; mass unchanged.'
    ),

    // 11) Fission application
    () => mc(
      'Which process powers modern nuclear power plants?',
      'Fission of uranium',
      ['Fusion of hydrogen',
       'Alpha decay of radium',
       'Beta decay of carbon-14'],
      'Power plants use controlled fission of U-235 (or Pu-239).'
    ),

    // 12) Solve for initial amount
    () => {
      const remaining = _randInt(5, 50);
      const halflives = _randInt(2, 4);
      const initial = _round(remaining * Math.pow(2, halflives), 2);
      return {
        type:'numeric',
        prompt:`After ${halflives} half-lives, ${remaining} g of an isotope remain. What was the initial mass?`,
        answer: initial, tolerance: initial * 0.02, units:'g',
        explanation:`Initial = remaining × 2^n = ${remaining} × 2^${halflives} = ${initial} g.`
      };
    },

    // 13) Identify decay type from change
    () => {
      const items = [
        { from:'¹⁴₆C → ¹⁴₇N', t:'beta', why:'Mass same, atomic # +1 → beta decay.' },
        { from:'²²⁶₈₈Ra → ²²²₈₆Rn', t:'alpha', why:'Mass −4, atomic # −2 → alpha decay.' },
        { from:'⁴⁰₁₉K → ⁴⁰₁₈Ar', t:'positron emission', why:'Mass same, atomic # −1 → positron (or electron capture).' },
      ];
      const it = _pick(items);
      return mc(`What type of decay is shown? ${it.from}`, it.t, ['alpha','beta','positron emission','gamma'].filter(x => x !== it.t).slice(0,3), it.why);
    },
  ],

};

window.QUESTIONS = Q;
