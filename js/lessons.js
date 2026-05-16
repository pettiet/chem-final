/* ================================================================
 * LESSONS — short, mobile-friendly cards. Each card has a title, body,
 * one worked example, and (optionally) a small interactive widget.
 *
 * Widget IDs are referenced here by string and rendered by quiz-engine
 * (which owns the swipe deck). Keep cards SHORT (~80 words body).
 * ================================================================ */
const LESSONS = {

  /* ---------------- Bonding & Polarity ---------------- */
  bonding: [
    {
      title: 'Bonds = how atoms hang out',
      body: 'Atoms bond to get a stable octet. The TYPE of bond depends on how greedy each atom is for electrons (its electronegativity, EN). Big difference = one atom yanks. Small difference = they share.',
      example: 'Ionic bond = a steal in basketball (one atom takes the electron). Covalent bond = a fist-bump (they share). Metallic bond = a mosh pit of shared electrons.',
    },
    {
      title: 'EN difference rules',
      body: 'Subtract electronegativities. The number tells you the bond type — mostly. Always remember HF breaks the pattern: even with ΔEN ~1.9 it’s called polar covalent, not ionic.',
      example: 'ΔEN < 0.4 → nonpolar covalent (e.g., C–H).\nΔEN 0.4–1.7 → polar covalent (e.g., O–H).\nΔEN ≥ 1.7 → ionic (e.g., Na–Cl). Exception: HF.',
      widget: 'en-bond-tool',
    },
    {
      title: 'Metal + nonmetal = ionic',
      body: 'Shortcut: metal + nonmetal almost always = ionic. Nonmetal + nonmetal = covalent. Metal + metal = metallic.',
      example: 'NaCl: Na (metal) + Cl (nonmetal) → ionic.\nCO₂: C + O (both nonmetals) → covalent.\nBrass: Cu + Zn → metallic.',
    },
    {
      title: 'Polar molecule ≠ polar bond',
      body: 'A molecule can have polar bonds and still be NONPOLAR overall if the shape is symmetric and the pulls cancel. You need polar bonds AND an unbalanced shape to get a polar molecule.',
      example: 'CO₂: polar C=O bonds, but linear shape — pulls cancel → nonpolar molecule.\nH₂O: polar O–H bonds, bent shape — pulls don’t cancel → polar molecule.',
    },
  ],

  /* ---------------- Lewis & Geometry ---------------- */
  'lewis-geometry': [
    {
      title: 'Lewis dots in 30 seconds',
      body: 'Count valence electrons. Put the least electronegative atom in the center (never H). Connect with single bonds. Distribute remaining electrons as lone pairs to complete octets (H wants 2). Out of electrons but missing octets? Make double or triple bonds.',
      example: 'CO₂: 4 + 6 + 6 = 16 e⁻. C in middle. Two C=O double bonds. Each O has 2 lone pairs. Done.',
    },
    {
      title: 'VSEPR: shape = repulsion',
      body: 'Electron pairs (bonds and lone pairs) push each other as far apart as possible. The arrangement gives you the shape. Lone pairs push harder than bonds — they squeeze the bond angles smaller.',
      example: 'Sports analogy: imagine balloons tied at the center — they spread out to share space. That’s VSEPR.',
    },
    {
      title: 'The five shapes you actually need',
      body: '2 groups → linear (CO₂, 180°). 3 groups, no lone pair → trigonal planar (BH₃, 120°). 4 groups, no lone pair → tetrahedral (CH₄, 109.5°). 4 groups, 1 lone pair → trigonal pyramidal (NH₃, ~107°). 4 groups, 2 lone pairs → bent (H₂O, ~104.5°).',
      example: 'Memory trick: NH₃ is a tripod, H₂O is a boomerang.',
    },
    {
      title: 'Symmetry → polar or not?',
      body: 'After you know the shape, ask: do the polar bonds cancel? Symmetric shapes (linear, trigonal planar, tetrahedral with identical atoms) → nonpolar. Bent, trigonal pyramidal, or asymmetric → polar.',
      example: 'CCl₄ has polar C–Cl bonds but a tetrahedral, symmetric shape → nonpolar.\nCHCl₃ has the SAME tetrahedral shape but ONE bond is different → polar.',
    },
  ],

  /* ---------------- IMFs ---------------- */
  imf: [
    {
      title: 'IMFs = stickiness between molecules',
      body: 'Inside a molecule = bonds. BETWEEN molecules = intermolecular forces (IMFs). Stronger IMFs = higher boiling/melting points, more viscous, less volatile. Three flavors to know.',
      example: 'Think of IMFs like food stickiness. Dry crackers (weak) vs caramel (strong). The stickier the food, the harder it is to pull apart — same idea.',
    },
    {
      title: 'The three IMFs (weakest → strongest)',
      body: '1) London dispersion: in EVERY molecule, even nonpolar. Stronger in bigger molecules.\n2) Dipole-dipole: only in polar molecules.\n3) Hydrogen bonding: only when H is bonded directly to N, O, or F.',
      example: 'Mnemonic for H-bonding: "FON" — H must be married to F, O, or N.',
    },
    {
      title: 'Trap: BH₃ has NO H-bonding',
      body: 'H must be bonded to N, O, or F. B is none of those, so BH₃ only has London dispersion. Same trick for HCl — Cl isn’t F, so no H-bonding, just dipole-dipole + dispersion.',
      example: 'IMF ranking example: H₂O (H-bonds) > NF₃ (dipole + dispersion) > CF₄ (bigger, more dispersion) > BH₃ (smallest, just dispersion).',
    },
    {
      title: 'IMFs → boiling point',
      body: 'Higher IMFs → more energy needed to rip molecules apart → higher boiling point. That’s why water (H-bonds) boils way higher than H₂S (just dipole), even though H₂S is heavier.',
      example: 'H₂O boils at 100 °C. H₂S boils at –60 °C. Same shape, very different stickiness — hydrogen bonding wins.',
    },
  ],

  /* ---------------- Nomenclature ---------------- */
  nomenclature: [
    {
      title: 'Two naming worlds: ionic vs covalent',
      body: 'Ionic (metal + nonmetal): name the metal, then the nonmetal with -ide. NO Greek prefixes ever.\nCovalent (nonmetal + nonmetal): USE Greek prefixes (mono-, di-, tri-, tetra-, penta-, hexa-, hepta-, octa-, nona-, deca-).',
      example: 'CaCl₂ → calcium chloride. (NOT "calcium dichloride" — never use prefixes on ionic.)\nCCl₄ → carbon tetrachloride. (Prefix is required here.)',
    },
    {
      title: 'Polyatomic ions: memorize these',
      body: 'NO₃⁻ nitrate, NO₂⁻ nitrite. SO₄²⁻ sulfate, SO₃²⁻ sulfite. PO₄³⁻ phosphate. CO₃²⁻ carbonate. OH⁻ hydroxide. NH₄⁺ ammonium. C₂H₃O₂⁻ acetate.',
      example: '-ate vs -ite: -ate has MORE oxygens. Sulfate = SO₄²⁻ (4 O’s). Sulfite = SO₃²⁻ (3 O’s).\nLi₂SO₃ = lithium SULFITE, not sulfate.',
    },
    {
      title: 'Transition metals use Roman numerals',
      body: 'Transition metals can carry different charges, so the name must include the charge in Roman numerals. The number tells you the metal’s oxidation state.',
      example: 'Iron(III) carbonate: Fe³⁺ + CO₃²⁻ → criss-cross → Fe₂(CO₃)₃.\nCopper(II) sulfate: Cu²⁺ + SO₄²⁻ → CuSO₄.',
    },
    {
      title: 'Formula → name, two questions',
      body: '1) Is it ionic or covalent? (Metal in front? → ionic.)\n2) Any polyatomic ions or transition metal charges?\nThen build the name accordingly.',
      example: 'Al₂(SO₄)₃: ionic (Al + polyatomic). Aluminum sulfate. (No prefixes, even though there are 3 sulfates.)\nN₂O₅: covalent. Dinitrogen pentoxide.',
    },
  ],

  /* ---------------- Solutions ---------------- */
  solutions: [
    {
      title: 'Molarity: M = mol / L',
      body: 'Molarity is concentration. Moles of solute divided by liters of SOLUTION (not just the solvent). Always convert mL to L first.',
      example: '2.0 mol NaCl in 500 mL of solution → 0.5 L → 2.0 / 0.5 = 4.0 M.',
    },
    {
      title: 'Dilution: M₁V₁ = M₂V₂',
      body: 'You can’t change moles by adding water — only the volume changes. Moles before = moles after. Multiply concentration × volume on each side.',
      example: 'How much water do you ADD to dilute 100 mL of 6 M HCl to 1 M? V₂ = (6 × 100) / 1 = 600 mL. Add 600 − 100 = 500 mL of water (the subtraction trips people up).',
    },
    {
      title: 'Saturation states',
      body: 'Unsaturated: more solute could dissolve. Saturated: at the limit for that temperature. Supersaturated: temporarily holding MORE than the limit (unstable — disturb it and crystals drop out).',
      example: 'Soda is supersaturated with CO₂. Open the can → bubbles drop out instantly. Same idea.',
      widget: 'solubility-curve',
    },
    {
      title: 'Beer’s Law: A = εbc',
      body: 'Absorbance A is proportional to concentration c. ε is molar absorptivity (a constant for the substance), b is path length. Plug-and-chug — works like y = mx.',
      example: 'If ε = 2.5 L/(mol·cm), b = 1 cm, c = 0.02 M → A = 2.5 × 1 × 0.02 = 0.05.',
    },
  ],

  /* ---------------- Reactions ---------------- */
  reactions: [
    {
      title: 'Five reaction types',
      body: 'Synthesis: A + B → AB.\nDecomposition: AB → A + B.\nSingle replacement: A + BC → AC + B.\nDouble replacement: AB + CD → AD + CB.\nCombustion: hydrocarbon + O₂ → CO₂ + H₂O.',
      example: 'Spotting it: only one product? Synthesis. One reactant breaking up? Decomposition. Two compounds swapping? Double replacement.',
    },
    {
      title: 'Balancing in three steps',
      body: '1) Count atoms on each side. 2) Adjust coefficients (NEVER change subscripts). 3) Recount and verify. Start with the most complicated molecule, save H and O for last.',
      example: 'Balance C₃H₈ + O₂ → CO₂ + H₂O.\n→ C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O. Atoms: 3 C, 8 H, 10 O each side. ✓',
    },
    {
      title: 'Diatomic elements: BrINClHOF',
      body: 'Seven elements exist as diatomic molecules in their natural state: Br₂, I₂, N₂, Cl₂, H₂, O₂, F₂. Mnemonic: "BrINClHOF" (or "Have No Fear Of Ice Cold Beer").',
      example: 'When writing hydrogen gas, it’s H₂, not H. Forgetting this is a classic balancing mistake.',
    },
    {
      title: 'Solubility & net ionic equations',
      body: 'Soluble: nitrates, alkali metal salts, ammonium salts. Mostly insoluble: most carbonates, phosphates, sulfides (except group 1 / NH₄⁺). The NET IONIC equation strips out spectator ions — only the species that ACTUALLY react.',
      example: 'AgNO₃ + NaCl → AgCl(s) + NaNO₃. Net ionic: Ag⁺ + Cl⁻ → AgCl(s). NO₃⁻ and Na⁺ are spectators. Net ionic ≠ skeleton equation (skeleton is just unbalanced).',
    },
  ],

  /* ---------------- Stoichiometry ---------------- */
  stoichiometry: [
    {
      title: 'The mole highway',
      body: 'All conversions go through moles. grams → moles (÷ molar mass). moles → moles (use coefficient ratio). moles → grams (× molar mass). Three lanes, always the same route.',
      example: 'g A → mol A → mol B → g B. Memorize the order, not the numbers.',
    },
    {
      title: 'Mole ratios from coefficients',
      body: 'Balanced equation gives you the ratio. 2 H₂ + O₂ → 2 H₂O means for every 1 mol O₂, you make 2 mol H₂O. Treat the coefficients like a recipe.',
      example: 'Recipe analogy: 2 buns + 1 patty → 1 burger. Got 6 buns? You can make 3 burgers (if you have 3 patties).',
    },
    {
      title: 'Limiting reactant',
      body: 'Divide moles of each reactant by its coefficient. The SMALLER number is the limiting reactant — it runs out first and caps the product.',
      example: '4 mol H₂ and 1 mol O₂ in 2 H₂ + O₂ → 2 H₂O. H₂: 4/2 = 2. O₂: 1/1 = 1. O₂ is limiting — H₂ has leftovers.',
    },
    {
      title: 'Percent yield',
      body: 'Theoretical = how much you SHOULD get from the stoichiometry. Actual = what you actually measured. % yield = (actual / theoretical) × 100. Should be ≤ 100% in real labs.',
      example: 'Theoretical = 10.0 g. Actual = 7.5 g. % yield = (7.5 / 10.0) × 100 = 75%.',
    },
  ],

  /* ---------------- Thermochem ---------------- */
  thermochem: [
    {
      title: 'q = mcΔT',
      body: 'q = heat (J). m = mass (g). c = specific heat capacity. ΔT = T_final − T_initial. Sign matters: ΔT positive means heat absorbed, negative means released.',
      example: 'Heating 100 g of water from 20 °C to 30 °C: q = 100 × 4.186 × 10 = 4186 J. c_water = 4.186 J/(g·°C).',
    },
    {
      title: 'Calorimetry: heat in = heat out',
      body: 'In a calorimeter, energy is conserved. The hot thing loses what the cold thing gains: −q_metal = q_water. Sign flip is the key step — don’t skip it.',
      example: 'Hot copper dropped into cool water → copper loses heat (q negative), water gains it (q positive). Same magnitude, opposite sign.',
    },
    {
      title: 'Endo vs exo',
      body: 'Exothermic: releases heat. ΔH negative. Beaker feels HOT. Products lower in energy than reactants.\nEndothermic: absorbs heat. ΔH positive. Beaker feels COLD. Products higher in energy.',
      example: 'Combustion (burning) = exo. Cold packs (NH₄NO₃ + H₂O) = endo.',
    },
    {
      title: 'Heat ≠ temperature',
      body: 'Temperature = average kinetic energy of molecules. Heat = total energy transferred. A bathtub at 30 °C has way more heat than a teacup at 30 °C, but same temp.',
      example: 'Spark vs bonfire: spark is way hotter (higher T), bonfire releases way more heat (more energy total).',
    },
    {
      title: 'Heating curve plateaus',
      body: 'On a heating curve, temperature is FLAT during phase changes. Energy is being used to break IMFs, not to speed molecules up. Sloped sections = temperature rising. Flat = phase change.',
      example: 'Ice melting at 0 °C: keep adding heat, temp stays at 0 until all ice is liquid. Same at 100 °C for boiling.',
      widget: 'heating-curve',
    },
  ],

  /* ---------------- Nuclear ---------------- */
  nuclear: [
    {
      title: 'Decay types: what changes',
      body: 'Alpha (⁴₂He): mass −4, atomic # −2.\nBeta (⁰₋₁e): mass same, atomic # +1.\nPositron (⁰₊₁e): mass same, atomic # −1.\nGamma (⁰₀γ): nothing changes — pure energy.\nElectron capture: cloud electron pulled in, atomic # −1.',
      example: 'Use these like a video-game move list — each decay does a specific edit to the nucleus.',
    },
    {
      title: 'Balancing nuclear equations',
      body: 'Mass numbers (top) must sum equal on both sides. Atomic numbers (bottom) must sum equal too. Use the rules above to figure out the missing particle.',
      example: '²³⁸₉₂U → ?  + ⁴₂He.\nMissing: 238−4 = 234 mass, 92−2 = 90 protons → ²³⁴₉₀Th.',
    },
    {
      title: 'Half-life math',
      body: 'After n half-lives, fraction remaining = (1/2)ⁿ. n = total time / half-life. Works in two directions: time → amount, or amount → time.',
      example: 'Half-life = 10 yr. After 30 yr, n = 3, fraction = (1/2)³ = 1/8. 80 g sample → 10 g remains.',
      widget: 'halflife-slider',
    },
    {
      title: 'Fission vs fusion',
      body: 'Fission: a BIG nucleus splits into smaller ones. Used in nuclear power plants and atomic bombs.\nFusion: SMALL nuclei combine into a bigger one. Powers the sun, and (someday) clean energy.',
      example: 'Fission = breaking a big LEGO castle into chunks. Fusion = jamming two small bricks together.',
    },
  ],

};

window.LESSONS = LESSONS;
