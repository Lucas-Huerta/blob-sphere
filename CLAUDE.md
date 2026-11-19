# Blob Sphere

Projet web qui affiche sur sa page principale une **sphère 3D déformable (« blob »)** rendue avec différents **matériaux shader**. L'utilisateur change de blob / matériau via un **carrousel**. Plus tard, il pourra manipuler la sphère avec ses **mains via la webcam** (pincer, étirer).

## Vision & fonctionnalités

### V1 — Cœur du produit
- Page principale plein écran avec un blob 3D au centre, animé en permanence (déformation organique).
- Carrousel (flèches, swipe, clavier ← →, points de pagination) pour passer d'un matériau à l'autre. Chaque entrée du carrousel = un blob + un matériau.
- Transition fluide entre deux matériaux (morph de la forme, fondu/dissolve du shader, léger mouvement de caméra).
- Interaction souris/tactile de base : rotation (orbit) et « poke » du blob au survol/clic.
- Nom + courte description du matériau affichés sous le blob.

### V2 — Contrôle par la main (fonctionnalité additionnelle, plus tard)
- Accès webcam (`getUserMedia`), détection des mains en temps réel.
- Gestes :
  - **Pincer** (pouce + index) : saisir/attirer la surface du blob au point de pincement.
  - **Étirer** (deux mains qui s'écartent, ou pince qui s'éloigne) : étirer / agrandir le blob.
  - **Rapprocher** : comprimer le blob.
  - **Swipe de la main** : changer de blob dans le carrousel.
- Retour visuel : petits points/squelette de la main en overlay, indicateur de pince active.
- Doit rester **optionnel** : le site fonctionne entièrement sans caméra (opt-in explicite, rien n'est envoyé sur le réseau, traitement 100 % local).

## Catalogue de matériaux (à rendre en shaders)

Chaque matériau = un couple vertex/fragment GLSL + des uniforms réglables. Classés par priorité d'implémentation.

**Priorité 1 (à faire d'abord, bon rapport effet/effort)**
1. ✅ **Chrome liquide / mercure** — réflexion environnement (cubemap/HDRI), fresnel fort, quasi miroir. *(fait : `materials/chrome/`)*
2. ✅ **Verre / cristal avec dispersion** — réfraction, aberration chromatique, fresnel, légère teinte. *(fait : `materials/glass/`, double réfraction approximée sur une sphère)*
3. ✅ **Iridescent / bulle de savon** — interférence en couche mince (thin-film), couleurs changeant avec l'angle. *(fait : `materials/iridescent/`, épaisseur de film par bruit déformé + gravité, rendu transparent)*
4. ✅ **Lave / magma** — bruit fbm animé, émissif chaud, croûte sombre, fissures lumineuses. *(fait : `materials/lava/`, ridged fbm domain-warped, chaleur localisée au clic)*
5. **Gelée / subsurface scattering** — translucidité simulée, SSS approximé (wrap lighting + épaisseur), brillance.

**Priorité 2**
6. **Holographique / foil arc-en-ciel** — gradient angulaire, scanlines, bruit de grain.
7. **Toon / cel-shading** — bandes de lumière quantifiées, contour (rim/outline).
8. **Plasma / énergie** — bruit multi-octaves animé, glow additif, éclairs.
9. **Perle / opale** — nacre, iridescence douce, subtile profondeur laiteuse.
10. **Or / métal brossé (PBR)** — BRDF métallique, anisotropie optionnelle.
11. **Glace / verre dépoli** — réfraction floutée, givre, bruit de surface.

**Priorité 3 (bonus, plus coûteux)**
12. **Ferrofluide** — noir brillant avec pointes (normal/displacement spikes) piloté par bruit.
13. **Velours / tissu (sheen)** — rim light diffus, retroréflexion.
14. **Aurore / dégradé fresnel** — gradients fluides colorés, glow en bordure.
15. **Wireframe / grille holo (tron)** — grille, scan, transparence.
16. **Cristal à facettes** — normales plates (flat shading), gemme.
17. **Tache d'huile (oil slick)** — iridescence sombre et marbrée.
18. **Fourrure (shell texturing)** — plusieurs coques, très gourmand.

### Idées supplémentaires (backlog, non priorisées)

**Matières organiques / douces**
- **Cire de bougie** — SSS marqué, translucide chaud, surface légèrement mate.
- **Peau / chair stylisée** — SSS rouge sur les bords fins, léger duvet.
- **Bonbon / gummy** — translucide saturé, brillance spéculaire forte, légère absorption.
- **Miel / ambre / résine** — réfraction épaisse, teinte dorée, bulles ou inclusions en bruit 3D.
- **Lait / crème** — blanc diffus, léger SSS, spéculaire doux.
- **Caoutchouc / gomme mate** — diffus uniforme, rim light, très peu de spéculaire.
- **Cellules biologiques (Voronoi)** — cellules vues par transparence, noyaux, membranes.

**Matières minérales / solides**
- **Marbre / pierre veinée** — veines par bruit déformé (domain warping), poli brillant.
- **Obsidienne / verre volcanique** — noir très réfléchissant, reflets nets.
- **Verre fumé / vitrail** — réfraction + absorption colorée par zones.
- **Béton / pierre brute** — normal map procédurale, rugosité élevée.
- **Rouille / métal oxydé** — mélange métal propre et corrosion par masque de bruit.
- **Cuivre patiné** — métal + patine verte dans les creux (cavité/AO approximé).
- **Fibre de carbone** — motif tissé, sheen anisotrope.

**Effets lumineux / abstraits**
- **Néon / tube lumineux** — émissif fort, bloom (post-process) de la bordure.
- **Nébuleuse / galaxie** — fbm coloré à l'intérieur, étoiles en points, parallaxe selon la vue.
- **Soleil / étoile** — granulation, taches sombres, couronne en fresnel additif.
- **Planète** — bandes (gaz géante) ou continents/océans par seuil de bruit + atmosphère.
- **Thermique / infrarouge** — palette chaud/froid selon la normale ou la profondeur.
- **Rayons X** — transparence inversée au fresnel, structures internes.
- **Glitch / RGB split** — décalage des canaux, bandes de distorsion temporelles.
- **Pixel / voxel** — quantification des normales/positions, rendu à la Minecraft.
- **Matrix / pluie de code** — texture de glyphes défilant en coordonnées sphériques.
- **Encre dans l'eau** — volutes par domain warping, sur fond translucide.
- **Peinture à l'huile** — coups de pinceau (flow field), reliefs, craquelures.
- **Dégradé mesh / aurora fluide** — plusieurs couleurs mélangées par bruit basse fréquence.
- **Points / nuage de particules** — la sphère rendue en `Points` avec taille liée au bruit.

**Variantes d'un matériau existant (faciles)**
- Chrome → **or liquide**, **cuivre liquide**, **chrome noir**.
- Verre → **verre teinté** (rouge/vert), **diamant** (IOR 2.4 + forte dispersion), **eau** (IOR 1.33, faible dispersion).
- Iridescent → **opale** et **tache d'huile** (même base thin-film, autres paramètres).

**Techniques transverses à envisager**
- Post-process **bloom** (néon, lave, plasma) et léger **grain** pour unifier le rendu.
- **Caustiques** projetées sur le fond pour les matériaux transparents.
- **Matcap** comme chemin rapide pour tester une idée avant d'écrire le shader complet.
- Réponse des matériaux au **poke / pinch** (ex. lave qui s'éclaire à l'endroit touché, ferrofluide qui pique vers la main).

## Stack technique

| Besoin | Choix | Pourquoi |
|---|---|---|
| Build / dev server | **Vite** | HMR rapide, support GLSL via plugin, zéro config |
| Langage | **TypeScript** (strict) | Sûreté sur les uniforms, structures des matériaux |
| 3D | **Three.js** (vanilla, pas de React) | Contrôle total sur le rendu et les shaders ; moins de couches |
| Shaders | **GLSL** (WebGL2) dans des fichiers `.glsl` via `vite-plugin-glsl` | Édition lisible, `#include` pour partager le bruit/fresnel |
| UI carrousel | **HTML/CSS/TS** simples (pas de framework UI) | Légèreté ; l'UI est minimale |
| Animation UI | **GSAP** (ou tweens maison) | Transitions de carrousel et de uniforms |
| Hand tracking (V2) | **MediaPipe Tasks Vision – HandLandmarker** | Temps réel dans le navigateur, 21 points/main, WASM+GPU |
| Lint / format | **ESLint + Prettier** | |
| Tests | **Vitest** (logique pure : geste → paramètres, carrousel) | Les shaders se valident visuellement |
| Gestionnaire de paquets | **pnpm** (ou npm si indisponible) | |

> Alternative envisagée : React Three Fiber. Écartée pour l'instant : le projet est centré sur un seul canvas et des shaders custom, la couche React n'apporte pas assez. À reconsidérer si l'UI grossit.

## Technique de rendu du blob

- Géométrie : `IcosahedronGeometry(1, 64+)` (détail élevé, topologie uniforme, pas de pôles contrairement à une UV sphere).
- **Vertex shader** : déplacement des sommets le long de la normale par **simplex noise 3D animé** (`uTime`, `uAmplitude`, `uFrequency`). Les normales sont **recalculées** dans le shader (différences finies sur 2 tangentes voisines) pour un éclairage correct sur la surface déformée.
- **Uniforms communs** à tous les matériaux : `uTime`, `uResolution`, `uCameraPosition`, `uEnvMap`, `uAmplitude`, `uFrequency`, `uPointer` (poke souris), et en V2 : `uPinchPoints[]`, `uStretch` (voir plus bas).
- **Fragment shader** : propre à chaque matériau (voir catalogue), qui consomme normale/position/vue/fresnel fournis par un chunk commun.
- Environnement : HDRI léger (equirect → PMREM) partagé, pour les matériaux réfléchissants/réfractifs.
- Performance : un seul `WebGLRenderer`, **un seul mesh** dont on échange le `ShaderMaterial` (ou deux pendant la transition), `pixelRatio` plafonné à 2, rendu pausé quand l'onglet est caché. Cible : 60 fps sur laptop intégré.

## Architecture du projet

```
blob-sphere/
├── CLAUDE.md
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── hdri/                  # environnements (equirect .hdr/.jpg compressés)
└── src/
    ├── main.ts                # point d'entrée : crée App et le démarre
    ├── app.ts                 # orchestre scène, carrousel, inputs, boucle de rendu
    ├── core/
    │   ├── renderer.ts        # WebGLRenderer, resize, boucle rAF
    │   ├── scene.ts           # scène, caméra, lumières, environnement
    │   └── clock.ts           # temps, delta, pause visibilité
    ├── blob/
    │   ├── Blob.ts            # mesh + géométrie + application d'un matériau + déformations
    │   └── deformation.ts     # état de déformation (poke, pinch, stretch) → uniforms
    ├── materials/
    │   ├── index.ts           # registre ordonné des matériaux (alimente le carrousel)
    │   ├── types.ts           # interface MaterialDef { id, name, description, create(), uniforms }
    │   ├── chrome/            # un dossier par matériau
    │   │   ├── chrome.ts      # fabrique le ShaderMaterial + réglages
    │   │   ├── chrome.vert.glsl
    │   │   └── chrome.frag.glsl
    │   ├── glass/ …
    │   └── …
    ├── shaders/
    │   └── chunks/            # code GLSL partagé : noise.glsl, fresnel.glsl, normals.glsl, tonemap.glsl
    ├── carousel/
    │   ├── Carousel.ts        # état (index courant), navigation, événements
    │   └── carousel.css
    ├── input/
    │   ├── pointer.ts         # souris / tactile → rotation, poke
    │   ├── keyboard.ts        # ← → pour le carrousel
    │   └── hands/             # (V2) tout ce qui touche à la webcam
    │       ├── HandTracker.ts       # init MediaPipe, flux caméra, landmarks bruts
    │       ├── gestures.ts          # landmarks → gestes (pinch, stretch, swipe) — pur, testable
    │       ├── smoothing.ts         # filtre (One Euro / lerp) anti-jitter
    │       └── HandOverlay.ts       # rendu 2D des mains pour le feedback
    ├── ui/
    │   └── hud.ts             # nom du matériau, pagination, bouton « activer la caméra »
    └── utils/                 # maths, easing, helpers DOM
```

### Principes d'architecture
- **Un matériau = un dossier autonome** (fabrique + GLSL). Ajouter un matériau = créer le dossier + l'inscrire dans `materials/index.ts`. Aucun autre fichier à toucher.
- **Le carrousel ne connaît que le registre** de matériaux (id, nom, description) ; il émet un événement `change(index)`, `App` demande au `Blob` d'appliquer le matériau.
- **Les inputs sont découplés** : souris, clavier et (V2) mains produisent tous les mêmes **intentions** (`next`, `prev`, `poke(point)`, `grab(point)`, `stretch(factor)`, `rotate(dx, dy)`). `App` les route vers `Carousel`/`Blob`. Cela permet d'ajouter le hand tracking sans modifier le reste.
- **`gestures.ts` est une fonction pure** (landmarks in → gestes out) pour être testée sans caméra.
- **Lazy loading** : MediaPipe (WASM + modèle) n'est chargé que si l'utilisateur active la caméra.

## Plan pour le hand tracking (V2)

- Modèle : MediaPipe `HandLandmarker`, mode `VIDEO`, `numHands: 2`, délégué GPU.
- Détection de **pince** : distance(pouce tip `#4`, index tip `#8`) normalisée par la taille de la main (distance poignet `#0` → base du majeur `#9`), avec **hystérésis** (seuils d'entrée/sortie différents) pour éviter le clignotement.
- **Étirement** : pendant une pince, variation de la distance entre les deux mains (ou déplacement de la pince) → `uStretch` ; direction = axe entre les deux points.
- **Mapping 2D → 3D** : les landmarks (x, y normalisés, z relatif) sont projetés en rayon depuis la caméra de la scène pour trouver le point d'impact sur le blob → `uPinchPoints`.
- **Lissage** obligatoire (One Euro filter) et ressort physique côté blob (la déformation revient doucement à zéro au relâchement).
- UX : demande de permission explicite, message clair si refusée, fallback souris, miroir horizontal de l'image caméra.
- Confidentialité : traitement local, aucune image envoyée ni stockée.

## Commandes (à mettre en place à l'initialisation)

```bash
pnpm install        # dépendances
pnpm dev            # serveur de dev Vite (HMR, shaders rechargés à chaud)
pnpm build          # build de production
pnpm preview        # prévisualiser le build
pnpm lint           # ESLint
pnpm test           # Vitest
```

## Conventions

- **Code, commentaires, noms de fichiers/identifiants : en anglais.** Docs et échanges avec l'utilisateur : en français.
- TypeScript `strict`, pas de `any`. Imports ES modules, chemins relatifs ou alias `@/` → `src/`.
- Shaders : un fichier par stage, `#include` des chunks partagés ; uniforms préfixés par `u`, varyings par `v`.
- Ne pas dupliquer le bruit/fresnel/normales : toujours passer par `shaders/chunks/`.
- Valeurs « magiques » d'un matériau (couleurs, fréquences) exposées comme uniforms nommés avec valeurs par défaut dans `<material>.ts`, pas codées en dur dans le GLSL.
- Libérer les ressources GPU (`dispose()`) des matériaux/textures quand on change de matériau.
- Accessibilité : carrousel navigable au clavier, boutons labellisés, respect de `prefers-reduced-motion` (réduire l'amplitude/vitesse des animations).
- Commits petits et ciblés, messages à l'impératif.

## Feuille de route

1. **Setup** : Vite + TS + Three.js + `vite-plugin-glsl`, ESLint/Prettier, scène avec blob déformé (matériau de test).
2. **Chunks shaders** (noise, fresnel, normales recalculées) + environnement HDRI.
3. **Carrousel + registre de matériaux** + HUD + transitions.
4. **Matériaux priorité 1** (chrome, verre, iridescent, lave, gelée).
5. **Interaction souris/tactile** (rotation, poke) + accessibilité + perf.
6. **Matériaux priorité 2 puis 3**.
7. **V2 — hand tracking** : `HandTracker`, `gestures`, lissage, overlay, mapping vers la déformation.
8. Polish : responsive mobile, chargement, déploiement (Vercel/Netlify/GitHub Pages).

## Questions ouvertes
- Un blob par matériau avec une forme de base différente, ou toujours la même sphère avec seulement le matériau qui change ?
- Fond de page : couleur/dégradé qui s'adapte au matériau courant ?
- Support mobile pour le hand tracking (perfs caméra + GPU) ou desktop uniquement ?
- Hébergement cible.
