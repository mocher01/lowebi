#!/bin/bash

# Script de déploiement avec nginx-reverse
# Usage: ./scripts/deploy-to-nginx.sh <site-name> [--ssl]

set -e

SITE_NAME="$1"
USE_SSL="$2"

if [ -z "$SITE_NAME" ]; then
    echo "❌ Usage: $0 <site-name> [--ssl]"
    echo "   Example: $0 