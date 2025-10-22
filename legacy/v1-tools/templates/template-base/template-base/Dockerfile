# Multi-stage build pour optimiser la taille
FROM node:18-alpine AS builder

# Dossier de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Installer TOUTES les dépendances (y compris dev dependencies pour le build)
RUN npm install

# Copier le code source
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Variables d'environnement pour le build
ARG SITE_CONFIG
ENV SITE_CONFIG=${SITE_CONFIG}

# Build de l'application
RUN npm run build

# Image de production avec nginx
FROM nginx:alpine

# Copier la configuration nginx - ✅ RESTAURER COMME AVANT
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
