# 📖 Effet de Feuilletage de Livre (Book Page Flip)

## 🎯 Fonctionnalités

L'écran de lecture des chapitres utilise maintenant un **vrai effet de feuilletage de livre** avec :

### ✨ Animations Réalistes
- **Rotation 3D** : Les pages tournent avec un effet de perspective réaliste
- **Transition fluide** : Animation de 300ms pour un rendu naturel
- **Effet de courbure** : Simulation visuelle du pli de la page
- **Opacité progressive** : La page qui se tourne devient transparente

### 🎮 Interactions Gestuelles
- **Swipe horizontal** : Glissez vers la gauche/droite pour tourner les pages
- **Détection de vélocité** : Un swipe rapide change de page même avec peu de distance
- **Seuil de déclenchement** : 30% de la largeur de la page ou vélocité > 500
- **Retour élastique** : Si le swipe est insuffisant, la page revient à sa position

### 💾 Sauvegarde de Progression
- **AsyncStorage** : Sauvegarde automatique de la dernière page lue
- **Reprise automatique** : Reprend à la dernière page lors de la réouverture
- **Clé unique** : `lastPage_{storyId}_{chapterId}`

### 🎨 Design
- **Fond beige papier** : #FFF9E6 pour un effet livre vintage
- **Ombres réalistes** : Effet de profondeur avec shadowOffset et shadowRadius
- **Bordures** : Couleur #D4C5A9 pour simuler les bords du papier
- **Numérotation** : Page X / Total en bas de chaque page

## 🔧 Architecture Technique

### Composants
1. **`BookFlip.tsx`** : Composant réutilisable de page flip
   - Gère les animations avec `react-native-reanimated`
   - Détecte les gestes avec `react-native-gesture-handler`
   - Supporte du contenu dynamique (pages[])

2. **`read-chapter.tsx`** : Écran de lecture
   - Charge le chapitre depuis l'API
   - Divise le contenu en pages (150 mots/page)
   - Intègre BookFlip avec sauvegarde de progression

### Technologies
- **react-native-reanimated** : Pour les animations 60fps
- **react-native-gesture-handler** : Pour la détection des swipes
- **AsyncStorage** : Pour la persistance de la progression

## 📱 Utilisation

### Gestes
- **Swipe gauche** → Page suivante
- **Swipe droite** → Page précédente
- **Tap** → Afficher/masquer les contrôles

### Contrôles
- **Header** : Titre de l'histoire et du chapitre
- **Barre de progression** : Indicateur visuel de l'avancement
- **Bouton retour** : Retour à la liste des chapitres

## 🎬 Animations

### Page Actuelle (qui se tourne)
```typescript
rotateY: [-180°, 0°, 180°]
translateX: [PAGE_WIDTH, 0, -PAGE_WIDTH]
opacity: [0, 1, 0]
```

### Pages en Dessous
```typescript
opacity: [0, 0.5, 1] // Apparition progressive
```

## 🔄 Flow de Navigation

```
Page d'accueil
  ↓
Story Details
  ↓
Liste des Chapitres
  ↓
Lecture avec Page Flip ← Sauvegarde progression
  ↑
Reprise automatique
```

## 🚀 Améliorations Futures Possibles

1. **Effet de pli plus prononcé** : Ajouter un gradient sur la page qui se tourne
2. **Son de page** : Ajouter un son subtil lors du feuilletage
3. **Mode double page** : Afficher 2 pages côte à côte en mode paysage
4. **Marque-pages** : Permettre de sauvegarder plusieurs positions
5. **Annotations** : Permettre de surligner ou annoter le texte

## 📝 Notes Techniques

- **Performance** : Utilise `useNativeDriver: true` pour 60fps
- **Compatibilité** : Fonctionne sur iOS et Android
- **Expo** : Compatible avec Expo (pas besoin de eject)
- **Contenu dynamique** : Supporte n'importe quel texte de l'API
