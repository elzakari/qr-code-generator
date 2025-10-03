#!/bin/bash

set -e

echo "🔐 Generating secure secrets for deployment environments..."

# Function to generate random base64 encoded string
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d '\n'
}

# Function to base64 encode a string
base64_encode() {
    echo -n "$1" | base64 | tr -d '\n'
}

# Generate secrets for staging
echo "📝 Generating staging secrets..."

STAGING_SECRET_KEY=$(generate_secret 32)
STAGING_JWT_SECRET=$(generate_secret 64)
STAGING_DB_URL="postgresql://qr_user:$(generate_secret 16)@postgres-staging:5432/qr_generator_staging"
STAGING_REDIS_URL="redis://redis-staging:6379/0"

# Create staging secrets file with actual values
cat > k8s/secrets-staging-generated.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: qr-generator-secrets
  namespace: qr-generator-staging
type: Opaque
data:
  secret-key: $(base64_encode "$STAGING_SECRET_KEY")
  database-url: $(base64_encode "$STAGING_DB_URL")
  jwt-secret: $(base64_encode "$STAGING_JWT_SECRET")
  redis-url: $(base64_encode "$STAGING_REDIS_URL")
  
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: qr-generator-config
  namespace: qr-generator-staging
data:
  FLASK_ENV: "staging"
  LOG_LEVEL: "INFO"
  CACHE_TTL: "1800"
  MAX_QR_SIZE: "1024"
  RATE_LIMIT: "100"
  CORS_ORIGINS: "https://staging.yourapp.com"
  MONITORING_ENABLED: "true"
  METRICS_PORT: "9090"
  MEMORY_CACHE_SIZE: "256MB"
  CACHE_CLEANUP_INTERVAL: "300"
EOF

# Generate secrets for production
echo "📝 Generating production secrets..."

PROD_SECRET_KEY=$(generate_secret 32)
PROD_JWT_SECRET=$(generate_secret 64)
PROD_DB_URL="postgresql://qr_user:$(generate_secret 24)@postgres-prod:5432/qr_generator_prod"
PROD_REDIS_URL="redis://redis-prod:6379/0"

# Create production secrets file with actual values
cat > k8s/secrets-production-generated.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: qr-generator-secrets
  namespace: qr-generator-production
type: Opaque
data:
  secret-key: $(base64_encode "$PROD_SECRET_KEY")
  database-url: $(base64_encode "$PROD_DB_URL")
  jwt-secret: $(base64_encode "$PROD_JWT_SECRET")
  redis-url: $(base64_encode "$PROD_REDIS_URL")
  ssl-cert: <BASE64_ENCODED_SSL_CERT>
  ssl-key: <BASE64_ENCODED_SSL_KEY>
  
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: qr-generator-config
  namespace: qr-generator-production
data:
  FLASK_ENV: "production"
  LOG_LEVEL: "WARNING"
  CACHE_TTL: "3600"
  MAX_QR_SIZE: "2048"
  RATE_LIMIT: "200"
  CORS_ORIGINS: "https://yourapp.com"
  MONITORING_ENABLED: "true"
  METRICS_PORT: "9090"
  SSL_ENABLED: "true"
  MEMORY_CACHE_SIZE: "512MB"
  CACHE_CLEANUP_INTERVAL: "600"
EOF

echo "✅ Secrets generated successfully!"
echo "📁 Files created:"
echo "   - k8s/secrets-staging-generated.yaml"
echo "   - k8s/secrets-production-generated.yaml"
echo ""
echo "⚠️  IMPORTANT: Store these secrets securely and never commit them to version control!"
echo "💡 Consider using a secrets management system like HashiCorp Vault or AWS Secrets Manager for production."

# Create .gitignore entry for generated secrets
if ! grep -q "secrets-.*-generated.yaml" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Generated secrets - never commit" >> .gitignore
    echo "k8s/secrets-*-generated.yaml" >> .gitignore
    echo "✅ Added generated secrets to .gitignore"
fi