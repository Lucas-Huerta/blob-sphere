# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Visiteurs qui parcourent une vitrine : ils ouvrent la page pour regarder et jouer avec les matériaux du blob, puis repartent. Public confirmé : visiteurs « showcase ». Non confirmé (à ne pas supposer) : développeurs/designers en quête d'inspiration, utilisateurs cherchant la détente.

## Product Purpose

Blob Sphere affiche sur sa page principale une sphère 3D déformable (« blob »), animée en permanence, rendue avec des matériaux shader GLSL faits main. Le visiteur change de blob/matériau via un carrousel (flèches, swipe, clavier, pagination) et interagit en souris/tactile (orbit, poke). Réussite : le visiteur est captivé par la matière et explore plusieurs matériaux.

## Positioning

- Un grand catalogue de matériaux shader distincts (chrome, verre, iridescent, lave, gelée, holographique, toon, plasma, perle, or, glace, ferrofluide, velours, aurore, wireframe, cristal…), chacun dans un dossier autonome.
- Un mode « Chill » : respiration guidée 4-7-8 où le blob gonfle/dégonfle, l'animation ralentit et l'interface s'efface.
- Contrôle par la main via webcam (V2, à venir) : pincer, étirer, rapprocher, swipe. Optionnel, opt-in, traitement 100 % local.

## Operating Context

Un seul canvas plein écran, un blob au centre, nom + courte description du matériau dessous. Panneau de réglages (lil-gui) généré depuis les uniforms, bouton « Mix » pour mélanger deux matériaux, dossier « Effects » (bloom, grain, aberration chromatique, poussière), réglage « Base shape » (sphère, icosaèdre bas-poly, tore, nœud).

## Capabilities and Constraints

- Stack existante : Vite, TypeScript strict, Three.js vanilla (pas de React), GLSL via `vite-plugin-glsl`, UI en HTML/CSS/TS simples, GSAP, lil-gui, Vitest, ESLint + Prettier, pnpm.
- Performance : cible 60 fps sur laptop à GPU intégré, `pixelRatio` plafonné à 2, rendu pausé quand l'onglet est caché.
- Le site doit fonctionner entièrement sans caméra ; le hand tracking (MediaPipe) est chargé en lazy et seulement sur opt-in explicite, rien n'est envoyé sur le réseau.
- Accessibilité exigée par le projet : carrousel navigable au clavier, boutons labellisés, respect de `prefers-reduced-motion`.
- Hébergement : non décidé (Vercel, Netlify ou GitHub Pages envisagés). Ne rien supposer.
- Questions ouvertes : fond de page qui s'adapte au matériau (le canvas est transparent, le fond est le `--bg` CSS) ; support mobile du hand tracking.
- Code, commentaires et identifiants en anglais ; docs et échanges en français.

## Brand Commitments

Nom : « Blob Sphere ». Aucun logo, identité ou référence visuelle imposés.

## Evidence on Hand

Le catalogue de matériaux et les fonctionnalités V1 / V1.5 existent dans le code (`src/materials/`, `src/core/`, `src/ui/`). Aucun témoignage, chiffre d'usage, presse ou client : ne rien inventer de tel.

## Product Principles

1. La matière est le produit : le blob et son shader mènent, l'interface se fait discrète.
2. Ajouter un matériau doit rester trivial et autonome (un dossier, un `MaterialDef`), sans toucher aux fichiers partagés.
3. Tout reste optionnel et local : pas de caméra requise, aucune donnée envoyée.
4. La fluidité prime : 60 fps et transitions continues avant la quantité d'effets.
5. Respecter le confort : mouvement réduit, clavier complet, mode Chill.

## Accessibility & Inclusion

Navigation clavier complète du carrousel (← →), boutons labellisés, `prefers-reduced-motion` réduit amplitude et vitesse des animations. Le mode Chill se quitte avec Échap.
