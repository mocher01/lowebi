#!/bin/bash

# Generate SSL Certificates for Development/Testing
# Note: For production, use proper certificates from Let's Encrypt or a CA

SSL_DIR="./ssl"
DOMAIN="162.55.213.90"
DAYS=365

# Create SSL directory
mkdir -p $SSL_DIR

echo "🔐 Generating SSL certificates for $DOMAIN..."

# Generate private key
openssl genrsa -out $SSL_DIR/key.pem 2048

# Generate certificate signing request
openssl req -new -key $SSL_DIR/key.pem -out $SSL_DIR/csr.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

# Generate self-signed certificate
openssl x509 -req -in $SSL_DIR/csr.pem -signkey $SSL_DIR/key.pem -out $SSL_DIR/cert.pem -days $DAYS -extensions v3_req -extfile <(cat <<EOF
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
DNS.3 = *.162.55.213.90
IP.1 = 162.55.213.90
IP.2 = 127.0.0.1
EOF
)

# Set appropriate permissions
chmod 600 $SSL_DIR/key.pem
chmod 644 $SSL_DIR/cert.pem

# Clean up CSR
rm $SSL_DIR/csr.pem

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificate: $SSL_DIR/cert.pem"
echo "🔑 Private Key: $SSL_DIR/key.pem"
echo ""
echo "⚠️  Note: These are self-signed certificates for development."
echo "   For production, use certificates from Let's Encrypt or a trusted CA."
echo ""
echo "🚀 To start with SSL:"
echo "   docker-compose -f docker-compose.prod.yml up -d"