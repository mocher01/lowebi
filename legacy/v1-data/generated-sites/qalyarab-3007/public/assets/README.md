# Assets pour le site Qalyarab

> 📐 **Guide complet des assets disponible ici :** [docs/ASSETS_GUIDE.md](../../../docs/ASSETS_GUIDE.md)

Ce dossier contient les images et assets spécifiques au site Qalyarab.

## 🖼️ Images actuelles

| Fichier | Dimensions | Taille | Usage | Status |
|---------|------------|--------|-------|--------|
| `qalyarab-logo.png` | 200x56px | 1.3KB | Logo navigation | ✅ Optimal |
| `qalyarab-logo.svg` | Vectoriel | 374B | Logo vectoriel | ✅ Parfait |
| `qalyarab-hero.png` | 800x600px | 1.5MB | Image hero accueil | ⚠️ À optimiser |
| `qalyarab-hero.svg` | Vectoriel | 808B | Hero alternatif | ✅ Léger |
| `qalyarab-favicon.ico` | 32x32px | 304B | Favicon | ✅ Standard |
| `qalyarab-favicon.svg` | Vectoriel | 245B | Favicon moderne | ✅ Moderne |

## 🎯 Configuration JSON

Ces assets sont référencés dans `site-config.json` :

```json
{
  "brand": {
    "logo": "qalyarab-logo.png",
    "favicon": "qalyarab-favicon.ico"
  },
  "content": {
    "hero": {
      "image": "qalyarab-hero.png"
    }
  },
  "seo": {
    "ogImage": "qalyarab-logo.png"
  }
}
```

## ⚡ Optimisations recommandées

### 🔧 Image hero trop lourde
```bash
# Optimiser l'image hero (1.5MB → ~100KB)
cd configs/qalyarab/assets/
convert qalyarab-hero.png -resize 800x600 -quality 85 qalyarab-hero-optimized.jpg
cwebp -q 80 qalyarab-hero.png -o qalyarab-hero.webp
```

### 📝 Ajouter une image Open Graph
```bash
# Créer une image OG dédiée (1200x630px)
convert qalyarab-hero.png -resize 1200x630^ -gravity center -crop 1200x630+0+0 qalyarab-og.jpg
```

## 🧪 Tests de validation

```bash
# Vérifier tous les assets
file qalyarab-*.*

# Tester la génération
cd /var/apps/website-generator
./scripts/generate-site.sh qalyarab --build --docker

# Vérifier dans le container
docker exec qalyarab ls -la /usr/share/nginx/html/assets/
```

## 📋 Dimensions optimales (référence rapide)

- **Logo :** 200x56px (PNG/SVG)
- **Hero :** 800x600px (JPG/WEBP) 
- **Favicon :** 32x32px (ICO)
- **Open Graph :** 1200x630px (JPG)

## 🔗 Liens utiles

- [Guide complet des assets](../../../docs/ASSETS_GUIDE.md)
- [Configuration site](../site-config.json)
- [Template base](../../../template-base/)

---

**✨ Pour plus de détails, consulte le [Guide complet des assets](../../../docs/ASSETS_GUIDE.md) !**