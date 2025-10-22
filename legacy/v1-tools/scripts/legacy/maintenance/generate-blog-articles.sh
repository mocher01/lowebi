#!/bin/bash

# Script de génération automatique d'articles Markdown pour un site
# Usage: ./generate-blog-articles.sh <site-name>

set -e

SITE_NAME="$1"

if [ -z "$SITE_NAME" ]; then
    echo "❌ Usage: $0 <site-name>"
    echo "Exemple: $0 qalyarab"
    exit 1
fi

SITE_DIR="configs/$SITE_NAME"
BLOG_DIR="$SITE_DIR/content/blog"
IMAGES_DIR="$BLOG_DIR/images"

echo "🚀 Génération des articles Markdown pour: $SITE_NAME"

# Créer la structure des dossiers
mkdir -p "$BLOG_DIR"
mkdir -p "$IMAGES_DIR"

# Lire la configuration du site pour adapter le contenu
CONFIG_FILE="$SITE_DIR/site-config.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Configuration non trouvée: $CONFIG_FILE"
    exit 1
fi

# Extraire des infos de la config (nom, secteur, etc.)
SITE_BRAND=$(grep -o '"name": *"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
SITE_DESCRIPTION=$(grep -o '"description": *"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)

echo "📋 Site: $SITE_BRAND"
echo "📁 Génération dans: $BLOG_DIR"

# 🎯 GÉNÉRATION AUTOMATIQUE D'ARTICLES SELON LE SECTEUR

# Déterminer le secteur selon le nom/description
SECTEUR="generic"
if [[ "$SITE_BRAND" == *"caligraph"* ]] || [[ "$SITE_BRAND" == *"Qalyarab"* ]]; then
    SECTEUR="calligraphie"
elif [[ "$SITE_DESCRIPTION" == *"restaurant"* ]] || [[ "$SITE_DESCRIPTION" == *"cuisine"* ]]; then
    SECTEUR="restaurant"
elif [[ "$SITE_DESCRIPTION" == *"tech"* ]] || [[ "$SITE_DESCRIPTION" == *"digital"* ]]; then
    SECTEUR="tech"
fi

echo "🎯 Secteur détecté: $SECTEUR"

# Créer un index des articles pour le markdown-loader
cat > "$BLOG_DIR/../blog-index.json" << EOF
{
  "site": "$SITE_NAME",
  "generated": "$(date -Iseconds)",
  "files": []
}
EOF

# Fonction pour créer un article
create_article() {
    local filename="$1"
    local title="$2"
    local excerpt="$3"
    local category="$4"
    local tags="$5"
    local content="$6"
    local image="$7"
    
    local slug="${filename%.md}"
    local date=$(date -Iseconds)
    
    cat > "$BLOG_DIR/$filename" << EOF
---
title: "$title"
slug: "$slug"
excerpt: "$excerpt"
date: "$date"
author: "$SITE_BRAND"
category: "$category"
tags: [$tags]
image: "$image"
---

# $title

$content
EOF
    
    echo "✅ Article créé: $filename"
    
    # Ajouter à l'index
    jq ".files += [\"$filename\"]" "$BLOG_DIR/../blog-index.json" > "$BLOG_DIR/../blog-index.json.tmp" && mv "$BLOG_DIR/../blog-index.json.tmp" "$BLOG_DIR/../blog-index.json"
}

# 🎨 GÉNÉRATION D'ARTICLES SELON LE SECTEUR

case $SECTEUR in
    "calligraphie")
        echo "📝 Génération d'articles pour secteur: Calligraphie"
        
        create_article "histoire-calligraphie-arabe.md" \
            "L'histoire millénaire de la calligraphie arabe" \
            "Découvrez les origines fascinantes de cet art ancestral qui traverse les siècles, depuis les premiers manuscrits jusqu'aux créations contemporaines." \
            "Histoire" \
            '"patrimoine", "art-islamique", "manuscrits"' \
            "La calligraphie arabe possède une histoire riche et complexe qui s'étend sur plus de quatorze siècles. Cet art, né de la nécessité de transcrire le Coran, a évolué pour devenir l'une des formes d'expression artistique les plus raffinées du monde islamique.

## Les origines

Les premiers développements de la calligraphie arabe remontent au VIIe siècle, lorsque les scribes ont commencé à standardiser l'écriture pour la copie des textes sacrés. Cette période a vu naître les premiers styles distinctifs qui allaient influencer des générations d'artistes.

## L'évolution des styles

Au fil des siècles, différentes régions du monde islamique ont développé leurs propres variations stylistiques, créant un riche patrimoine de formes et d'expressions calligraphiques.

### Les centres d'apprentissage

- **Bagdad** : Centre névralgique de l'innovation calligraphique
- **Le Caire** : Développement du style Mameluk
- **Istanbul** : Raffinement de l'art ottoman
- **Cordoue** : Fusion des traditions orientales et occidentales

## L'art moderne

Aujourd'hui, la calligraphie arabe continue d'évoluer, intégrant des techniques contemporaines tout en préservant son essence spirituelle et esthétique." \
            "images/histoire-calligraphie.jpg"

        create_article "techniques-calligraphie-naskh.md" \
            "Maîtriser le style Naskh : guide technique complet" \
            "Explorez les techniques fondamentales du style Naskh, l'un des styles les plus importants de la calligraphie arabe, avec des conseils pratiques pour progresser." \
            "Techniques" \
            '"naskh", "techniques", "apprentissage"' \
            "Le style **Naskh** est considéré comme l'un des styles fondamentaux de la calligraphie arabe. Sa clarté et sa lisibilité en font un excellent point de départ pour les débutants.

## Caractéristiques du Naskh

Le Naskh se distingue par :
- **Clarté** : Chaque lettre est distinctement formée
- **Proportions** : Respect strict des proportions traditionnelles
- **Fluidité** : Mouvement naturel de la plume

## Les outils essentiels

### Le Qalam (roseau)
Le choix du qalam est crucial. Pour le Naskh, privilégiez :
- Largeur de 2-3mm pour débuter
- Coupe droite et nette
- Roseau de qualité (bambou ou roseau naturel)

### L'encre traditionnelle
Préparez votre encre selon la recette traditionnelle :
1. Mélangez la poudre d'encre avec de l'eau pure
2. Ajoutez une goutte de miel pour la fluidité
3. Laissez reposer 24 heures

## Exercices progressifs

### Semaine 1-2 : Les formes de base
- Lignes droites et courbes
- Points et cercles
- Rythme et régularité

### Semaine 3-4 : Les lettres isolées
- Alif, ba, ta, tha
- Concentration sur les proportions
- 100 répétitions par lettre

### Semaine 5-8 : Les liaisons
- Connexions entre lettres
- Mots simples
- Espacement régulier

## Conseils pour progresser

> *La patience et la persévérance sont les clés de la maîtrise calligraphique*

1. **Pratique quotidienne** : 30 minutes minimum
2. **Observation** : Étudiez les maîtres
3. **Correction** : Analysez vos erreurs
4. **Patience** : Les résultats viennent avec le temps" \
            "images/technique-naskh.jpg"

        create_article "debuter-calligraphie-conseils.md" \
            "Guide du débutant : premiers pas en calligraphie arabe" \
            "Tous les conseils essentiels pour commencer l'apprentissage de la calligraphie arabe : matériel, méthodes et exercices pour bien débuter." \
            "Conseils" \
            '"débutant", "matériel", "apprentissage"' \
            "Commencer l'apprentissage de la calligraphie arabe peut sembler intimidant, mais avec les bons conseils et une approche méthodique, chacun peut progresser à son rythme.

## Choisir son matériel

### Investissement de départ (50-80€)
- **Qalam** : 3-4 roseaux de différentes tailles
- **Encre** : Encre traditionnelle de qualité
- **Papier** : Papier ligné spécial calligraphie
- **Règle** : Pour tracer les lignes de guidage

### Matériel complémentaire
- Porte-qalam en bois
- Buvard traditionnel
- Loupe pour les détails fins

## Établir une routine d'apprentissage

### Planning hebdomadaire suggéré
- **Lundi/Mercredi/Vendredi** : 45 minutes de pratique technique
- **Mardi/Jeudi** : 30 minutes d'étude théorique
- **Weekend** : 1 heure de création libre

### Structure d'une séance
1. **Échauffement** (5 min) : Lignes et courbes
2. **Technique** (25 min) : Lettres et mots
3. **Créativité** (10 min) : Composition libre
4. **Analyse** (5 min) : Correction des erreurs

## Les erreurs courantes à éviter

### Erreurs techniques
- Tenir le qalam trop serré
- Négliger l'angle de coupe
- Aller trop vite au début
- Ignorer les proportions

### Erreurs d'apprentissage
- Brûler les étapes
- Manquer de régularité
- Se décourager face aux difficultés
- Négliger la théorie

## Trouver l'inspiration

### Sources traditionnelles
- Manuscrits anciens
- Œuvres des maîtres classiques
- Architecture islamique

### Sources contemporaines
- Calligraphes modernes sur Instagram
- Expositions d'art islamique
- Communautés en ligne

## Progression attendue

### Mois 1-2 : **Fondations**
- Maîtrise des outils
- Premières lettres
- Développement de la patience

### Mois 3-6 : **Consolidation**
- Alphabet complet
- Premiers mots
- Compréhension des règles

### Mois 6-12 : **Expression**
- Phrases courtes
- Style personnel
- Compositions simples

*Rappelez-vous : chaque maître calligraphe a commencé par une première ligne imparfaite.*" \
            "images/guide-debutant.jpg"

        create_article "exposition-calligraphie-2024.md" \
            "Exposition 'Lettres d'Orient' : Un voyage artistique" \
            "Découvrez notre nouvelle exposition qui met à l'honneur les œuvres exceptionnelles de nos élèves et des maîtres contemporains." \
            "Actualités" \
            '"exposition", "événement", "art"' \
            "Nous sommes fiers de vous présenter notre exposition annuelle **'Lettres d'Orient'**, un événement qui célèbre la richesse et la diversité de la calligraphie arabe contemporaine.

## L'exposition en détails

### Dates et horaires
- **Vernissage** : Vendredi 15 mars 2024, 18h00
- **Exposition** : Du 16 mars au 30 avril 2024
- **Horaires** : Mardi au dimanche, 10h00-18h00
- **Entrée libre**

### Lieu
Centre Culturel $SITE_BRAND
15 rue des Arts, Paris 11e
Métro : République (lignes 3, 5, 8, 9, 11)

## Les œuvres présentées

### Section 1 : Tradition
Œuvres réalisées dans les styles classiques :
- **Calligraphies Naskh** : Clarté et élégance
- **Compositions Thuluth** : Majesté et grandeur
- **Miniatures Diwani** : Finesse ottomane

### Section 2 : Innovation
Créations contemporaines qui réinventent l'art :
- **Calligraphie digitale** : Fusion tradition-technologie
- **Installations 3D** : Lettres dans l'espace
- **Art urbain** : Calligraphie de rue

### Section 3 : Apprentissage
Parcours pédagogique pour comprendre :
- **Évolution des styles** : Chronologie illustrée
- **Techniques d'écriture** : Démonstrations interactives
- **Outils traditionnels** : Collection historique

## Événements spéciaux

### Ateliers découverte (gratuits)
- **Samedi 23 mars** : Initiation Naskh (14h-16h)
- **Dimanche 31 mars** : Création de marque-pages (10h-12h)
- **Samedi 6 avril** : Calligraphie pour enfants (14h-15h30)

### Conférences
- **Mercredi 20 mars** : 'L'art calligraphique à travers les siècles'
- **Mercredi 3 avril** : 'Calligraphie et spiritualité'

### Performances live
- **Vendredi 29 mars** : Démonstration de calligraphie géante
- **Samedi 13 avril** : Rencontre avec les artistes

## Les artistes participants

Cette exposition réunit :
- **12 élèves** de nos différents niveaux
- **5 instructeurs** de notre institut
- **3 maîtres invités** reconnus internationalement

### Invité d'honneur : Maître Hassan Al-Karkhi
Calligraphe iraquien de renommée mondiale, spécialiste du style Diwani. Il sera présent lors du vernissage pour une démonstration exceptionnelle.

## Informations pratiques

### Réservations ateliers
- **Téléphone** : 01 42 36 78 90
- **Email** : expo@qalyarab.fr
- **Places limitées** : Inscription obligatoire

### Catalogue de l'exposition
Un magnifique catalogue de 80 pages est disponible :
- **Prix** : 25€
- **Contenu** : Toutes les œuvres + interviews des artistes
- **Format** : 21x24cm, reliure cousue

### Accessibilité
L'exposition est entièrement accessible aux personnes à mobilité réduite.

---

*Cette exposition est organisée avec le soutien de la Mairie de Paris et l'Institut du Monde Arabe.*" \
            "images/exposition-2024.jpg"

        create_article "atelier-ramadan-2024.md" \
            "Atelier spécial Ramadan : Calligraphie des versets sacrés" \
            "Rejoignez-nous pour un moment de recueillement et d'apprentissage autour de la calligraphie des versets coraniques pendant le mois béni du Ramadan." \
            "Actualités" \
            '"ramadan", "spiritualité", "atelier"' \
            "Durant le mois béni du **Ramadan**, l'art de la calligraphie arabe prend une dimension particulièrement spirituelle. Notre atelier spécial vous invite à explorer la beauté des versets coraniques à travers l'art calligraphique.

## Programme de l'atelier

### Session 1 : Préparation spirituelle (1h)
- **Méditation** sur la signification des versets
- **Choix des passages** à calligraphier ensemble
- **Préparation rituelle** des outils traditionnels
- **Récitation** pour s'imprégner du rythme

### Session 2 : Techniques adaptées (1h30)
- **Style Naskh spirituel** : Techniques spécifiques aux textes sacrés
- **Tracé méditatif** : Chaque lettre comme une prière
- **Proportions sacrées** : Géométrie divine du texte
- **Respiration et calligraphie** : Harmoniser souffle et geste

### Session 3 : Réalisation collective (1h30)
- **Calligraphie guidée** des versets choisis
- **Ornementation islamique** : Motifs géométriques simples
- **Finalisation** sur papier traditionnel doré
- **Partage** des créations et ressenti

## Versets sélectionnés

Nous travaillerons notamment sur ces passages :

### Verset de la Lumière (An-Nur 24:35)
> *اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ*
> 
> *\"Allah est la lumière des cieux et de la terre\"*

### Verset du Trône (Al-Baqarah 2:255)
> *اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ*
> 
> *\"Allah - point de divinité à part Lui, le Vivant, Celui qui subsiste par lui-même\"*

### Sourate Al-Fatiha (complète)
La sourate d'ouverture, calligraphiée dans sa beauté intégrale.

## Informations pratiques

### Dates et horaires
- **Tous les vendredis** du Ramadan 2024
- **Horaire** : 14h00 - 17h00 (après la prière du Joumou'a)
- **Durée** : 3 heures avec pause thé/dattes

### Lieu
Salle de calligraphie $SITE_BRAND
Ambiance feutrée et recueillie

### Matériel fourni
- **Qalam** en roseau traditionnel
- **Encre noire** de qualité supérieure
- **Papier doré** spécial manuscrits
- **Modèles** des versets en grand format

### Participation
- **Places limitées** à 15 participants
- **Inscription obligatoire** avant chaque session
- **Contribution libre** selon vos moyens
- **Ouvert à tous** les niveaux, débutants bienvenus

### Esprit de l'atelier
Cet atelier se déroule dans un esprit de **respect** et de **contemplation**. Nous accueillons participants musulmans et non-musulmans désireux de découvrir cette dimension spirituelle de l'art calligraphique.

## Préparation recommandée

### Avant l'atelier
- **Tenue** : Vêtements confortables et discrets
- **État d'esprit** : Venir avec sérénité et ouverture
- **Jeûne** : Les participants jeûnant sont les bienvenus

### Ce que vous repartirez avec
- **Votre création** calligraphiée et ornementée
- **Techniques spéciales** pour les textes sacrés
- **Moment de paix** et de connexion spirituelle
- **Liens** avec d'autres passionnés

## Témoignages des années précédentes

*\"Cette expérience a transformé ma vision de la calligraphie. Chaque trait devient une méditation.\"* - Fatima, participante 2023

*\"Même non-musulman, j'ai été touché par la beauté spirituelle de ces moments.\"* - Pierre, participant 2023

---

**Inscription** : 01 42 36 78 90 ou contact@qalyarab.fr

*Ramadan Kareem à tous* 🌙" \
            "images/atelier-ramadan.jpg"
        ;;
        
    "restaurant")
        echo "📝 Génération d'articles pour secteur: Restaurant"
        
        create_article "histoire-cuisine-traditionnelle.md" \
            "L'histoire de notre cuisine traditionnelle" \
            "Découvrez les origines et l'évolution de nos recettes familiales transmises de génération en génération." \
            "Histoire" \
            '"tradition", "histoire", "famille"' \
            "Notre restaurant perpétue une tradition culinaire familiale qui remonte à plus d'un siècle..."
        
        create_article "secrets-chef.md" \
            "Les secrets de notre chef : techniques et astuces" \
            "Plongez dans les coulisses de notre cuisine et découvrez les techniques qui font la différence." \
            "Techniques" \
            '"cuisine", "chef", "techniques"' \
            "Après 20 ans d'expérience, notre chef partage avec vous ses secrets les mieux gardés..."
        ;;
        
    "tech")
        echo "📝 Génération d'articles pour secteur: Technologie"
        
        create_article "tendances-tech-2024.md" \
            "Les tendances technologiques qui transforment 2024" \
            "Analyse des innovations qui redéfinissent notre approche du digital et de la technologie." \
            "Actualités" \
            '"tech", "innovation", "2024"' \
            "L'année 2024 marque un tournant dans l'évolution technologique avec des avancées majeures..."
        ;;
        
    *)
        echo "📝 Génération d'articles génériques"
        
        create_article "notre-histoire.md" \
            "Notre histoire : les débuts de $SITE_BRAND" \
            "Découvrez comment $SITE_BRAND a vu le jour et évolué pour devenir ce qu'il est aujourd'hui." \
            "Histoire" \
            '"histoire", "entreprise", "débuts"' \
            "L'histoire de $SITE_BRAND commence il y a plusieurs années, avec une vision claire et une passion authentique..."
        
        create_article "nos-valeurs.md" \
            "Nos valeurs et notre engagement" \
            "Les principes fondamentaux qui guident $SITE_BRAND au quotidien et notre engagement envers nos clients." \
            "À propos" \
            '"valeurs", "engagement", "qualité"' \
            "Chez $SITE_BRAND, nous croyons fermement que la qualité et l'authenticité sont les piliers de toute relation durable..."
        ;;
esac

# Créer quelques images placeholder
echo "🖼️ Génération des images placeholder..."

# Créer des images placeholder SVG pour éviter les erreurs 404
for image in "histoire-calligraphie.jpg" "technique-naskh.jpg" "guide-debutant.jpg" "exposition-2024.jpg" "atelier-ramadan.jpg"; do
    if [ ! -f "$IMAGES_DIR/$image" ]; then
        cat > "$IMAGES_DIR/${image%.jpg}.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <rect width="800" height="400" fill="#f8fafc"/>
  <text x="400" y="200" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif" font-size="24" fill="#64748b">
    Image: ${image%.jpg}
  </text>
  <text x="400" y="230" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif" font-size="16" fill="#94a3b8">
    $SITE_BRAND
  </text>
</svg>
EOF
        echo "  📸 Image placeholder: $image"
    fi
done

echo ""
echo "🎉 Génération terminée !"
echo "📊 Résumé:"
echo "  • Site: $SITE_NAME ($SECTEUR)"
echo "  • Articles créés: $(jq '.files | length' "$BLOG_DIR/../blog-index.json")"
echo "  • Dossier: $BLOG_DIR"
echo "  • Index: $BLOG_DIR/../blog-index.json"
echo ""
echo "✅ Le blog est prêt à être intégré au site !"