#!/bin/bash

# Script to verify all images are accessible on a running site
# Usage: ./verify-images.sh <site-name> <port>

SITE_NAME="$1"
PORT="$2"

if [ -z "$SITE_NAME" ] || [ -z "$PORT" ]; then
    echo "Usage: $0 <site-name> <port>"
    echo "Example: $0 translatepro 3003"
    exit 1
fi

BASE_URL="http://localhost:$PORT"
CONFIG_FILE="configs/$SITE_NAME/site-config.json"

echo "🔍 Verifying images for $SITE_NAME on port $PORT"
echo "=================================================="

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Config file not found: $CONFIG_FILE"
    exit 1
fi

# Test hero image
HERO_IMAGE=$(node -e "
const config = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
console.log(config.content?.hero?.image || '');
")

if [ ! -z "$HERO_IMAGE" ]; then
    echo -n "🖼️  Hero image ($HERO_IMAGE): "
    if curl -s -f "$BASE_URL/assets/$HERO_IMAGE" > /dev/null; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
fi

# Test logos
echo -n "🏷️  Navbar logo: "
NAVBAR_LOGO=$(node -e "
const config = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
console.log(config.brand?.logos?.navbar || '');
")

if [ ! -z "$NAVBAR_LOGO" ]; then
    if curl -s -f "$BASE_URL/assets/$NAVBAR_LOGO" > /dev/null; then
        echo "✅ OK ($NAVBAR_LOGO)"
    else
        echo "❌ FAILED ($NAVBAR_LOGO)"
    fi
else
    echo "⚠️  Not configured"
fi

# Test service images
echo "🛠️  Service images:"
node -e "
const config = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
const services = config.content?.services || [];
services.forEach((service, i) => {
    if (service.image) {
        console.log(service.image);
    }
});
" | while read -r image; do
    if [ ! -z "$image" ]; then
        echo -n "   • $image: "
        if curl -s -f "$BASE_URL/assets/$image" > /dev/null; then
            echo "✅ OK"
        else
            echo "❌ FAILED"
        fi
    fi
done

# Test general images
echo "📸 General images:"
node -e "
const config = JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8'));
const images = config.content?.images || {};
Object.entries(images).forEach(([key, image]) => {
    console.log(image);
});
" | while read -r image; do
    if [ ! -z "$image" ]; then
        echo -n "   • $image: "
        if curl -s -f "$BASE_URL/assets/$image" > /dev/null; then
            echo "✅ OK"
        else
            echo "❌ FAILED"
        fi
    fi
done

# Test blog images
if [ -d "configs/$SITE_NAME/content/blog" ]; then
    echo "📝 Blog images:"
    find "configs/$SITE_NAME/content/blog" -name "*.md" -exec grep -l "^image:" {} \; | while read -r blog_file; do
        image=$(grep "^image:" "$blog_file" | cut -d: -f2 | sed 's/^ *//' | sed 's/ *$//')
        if [ ! -z "$image" ]; then
            echo -n "   • $image: "
            if curl -s -f "$BASE_URL/assets/blog/images/$image" > /dev/null; then
                echo "✅ OK"
            else
                echo "❌ FAILED"
            fi
        fi
    done
fi

echo ""
echo "🏁 Image verification completed for $SITE_NAME"