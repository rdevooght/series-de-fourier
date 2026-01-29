## 1. Architecture Générale

Basé sur Svelte 5 + D3.js

### Structure des Répertoires
- `src/`
  - `lib/`
    - `fourier.js` : Module mathématique pur (sans dépendances UI).
    - `DrawingCanvas.svelte` : Composant hybride SVG/Canvas pour la saisie utilisateur.
    - `FunctionPlot.svelte` : Composant de visualisation basé sur D3.
  - `App.svelte` : Contrôleur principal et gestionnaire d'état.

---

## 2. Flux de Données et Réactivité

Le flux de données est unidirectionnel et réactif, orchestré par `App.svelte`.

1.  **Saisie Utilisateur** :
    - L'utilisateur dessine sur `DrawingCanvas`.
    - L'événement `dragEnd` déclenche un `dispatch('draw', { points })`.
2.  **Mise à jour de l'État** :
    - `App.svelte` reçoit les points bruts dans `handleDraw`.
    - La variable réactive `drawnPoints` est mise à jour.
3.  **Calcul Mathématique (Réactif)** :
    - Un bloc réactif `$: coefs = computeFourierCoefs(...)` détecte le changement de `drawnPoints`, `a`, `b`, ou `maxK`.
    - Le calcul est relancé automatiquement.
4.  **Échantillonnage pour Affichage** :
    - Une fois `coefs` disponible, d'autres blocs réactifs génèrent `approxPoints`, `cosTerms`, et `sinTerms` via `sampleFunction`.
    - Ces tableaux de points sont passés aux composants `FunctionPlot` pour le rendu.

---

## 3. fourier.js

### 3.1. Nettoyage de la Courbe (`cleanCurve`)
Les dessins à main levée sont imparfaits et peuvent contenir des boucles ou des retours en arrière en X, ce qui viole la définition d'une fonction $y=f(x)$.
*   **Algorithme** : Parcours séquentiel des points. On garde un point $P_i$ si et seulement si $P_i.x > \max(x_{precedents})$. Cela garantit une fonction strictement monotone croissante en X.

### 3.2. Intégration Numérique (`integrate`)
Le calcul des coefficients repose sur l'intégrale $\int_a^b f(x) g(x) dx$.
*   **Méthode** : Trapèzes.
*   **Gestion des bornes** : Il faut connaitre la valeur de la fonction aux bornes a et b, mais il est peu probable que des points dessinés par l'utilisateur tombent exactement sur ces bornes.
    *   L'algorithme identifie les segments du dessin qui contiennent $a$ et $b$.
    *   Il utilise l'**interpolation linéaire** (`interpolate` function) pour calculer la valeur virtuelle de $y$ exactement à $x=a$ et $x=b$.
    *   L'intégrale est calculée uniquement sur la sous-portion de la courbe comprise dans $[a, b]$.

### 3.3. Calcul des Coefficients (`computeAk`, `computeBk`)
Pour calculer $a_k = \frac{2}{L} \int_a^b f(x) \cos(\frac{2k\pi x}{L}) dx$ :
1.  **Sur-échantillonnage (`oversample`)** :
    *   Si la fonction oscillante (le cosinus ou sinus) a une fréquence élevée (grand $k$), elle peut varier énormément entre deux points du dessin utilisateur.
    *   L'algorithme `oversample` insère des points interpolés artificiels pour s'assurer qu'il y a au moins 10 points par période de l'oscillation. C'est crucial pour éviter l'aliasing numérique (erreur d'intégration).
2.  **Produit** : On génère une nouvelle courbe temporaire où chaque point est $(x, y_{dessin} \times \cos(\dots))$.
3.  **Intégration** : On intègre cette courbe produit.

---

## 4. Détails d'Implémentation des Composants

### `DrawingCanvas.svelte` : Hybride Canvas/SVG
*   **SVG** pour les éléments statiques ou structurels (axes, grilles, repères de domaine).
*   **Canvas API (2D Context)** pour le tracé en temps réel.
*   D3 est utilisé pour mapper les coordonnées écrans (pixels) vers les coordonnées du domaine (mathématiques) via `xScale.invert(x)`.

### `FunctionPlot.svelte` : Dessine plusieurs courbes sur le même graphe
*   Utilise `d3.line().curve(d3.curveBasis)` (ou Linear) pour générer des chemins SVG fluides à partir des tableaux de points discrets.
*   Il gère la mise à l'échelle dynamique : si l'amplitude de la fonction change, l'axe Y s'adapte automatiquement grâce aux "props" réactives `yDomain`.
