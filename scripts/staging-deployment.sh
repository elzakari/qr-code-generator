#!/bin/bash

set -e

echo "🚀 Starting staging deployment process..."

# Step 1: Generate secrets if not already done
if [[ ! -f "k8s/secrets-staging-generated.yaml" ]]; then
    echo "🔐 Generating secrets..."
    ./scripts/generate-secrets.sh
fi

# Step 2: Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."
./scripts/pre-deployment-checks.sh staging

# Step 3: Build and tag Docker image
echo "🐳 Building Docker image for staging..."
docker build -t qr-generator:staging-$(date +%Y%m%d-%H%M%S) .
docker tag qr-generator:staging-$(date +%Y%m%d-%H%M%S) qr-generator:staging-latest

# Step 4: Deploy to staging
echo "📦 Deploying to staging environment..."
NAMESPACE="qr-generator-staging"

# Create namespace
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Apply configurations
kubectl apply -f k8s/secrets-staging-generated.yaml
kubectl apply -f k8s/pvc.yaml -n $NAMESPACE

# Update deployment manifest for staging
sed 's/your-registry\/qr-generator:latest/qr-generator:staging-latest/g' k8s/deployment.yaml > k8s/deployment-staging.yaml
sed -i 's/replicas: 3/replicas: 2/g' k8s/deployment-staging.yaml
sed -i 's/FLASK_ENV.*production/FLASK_ENV: staging/g' k8s/deployment-staging.yaml

kubectl apply -f k8s/deployment-staging.yaml -n $NAMESPACE

# Wait for deployment
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/qr-generator -n $NAMESPACE --timeout=300s

# Step 5: Run post-deployment health checks
echo "🏥 Running health checks..."
sleep 30

# Get service endpoint
SERVICE_IP=$(kubectl get service qr-generator-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "localhost")
SERVICE_PORT=$(kubectl get service qr-generator-service -n $NAMESPACE -o jsonpath='{.spec.ports[0].port}')

if [[ "$SERVICE_IP" == "localhost" ]]; then
    # Use port-forward for local testing
    kubectl port-forward service/qr-generator-service 8080:80 -n $NAMESPACE &
    PORT_FORWARD_PID=$!
    sleep 5
    SERVICE_URL="http://localhost:8080"
else
    SERVICE_URL="http://${SERVICE_IP}:${SERVICE_PORT}"
fi

# Health check
if curl -f "${SERVICE_URL}/health" > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    if [[ -n "$PORT_FORWARD_PID" ]]; then
        kill $PORT_FORWARD_PID
    fi
    exit 1
fi

# Clean up port-forward if used
if [[ -n "$PORT_FORWARD_PID" ]]; then
    kill $PORT_FORWARD_PID
fi

echo "🎉 Staging deployment completed successfully!"
echo "📊 Deployment Summary:"
echo "   Environment: staging"
echo "   Namespace: $NAMESPACE"
echo "   Service URL: $SERVICE_URL"
echo "   Replicas: 2"
echo ""
echo "🔗 Next steps:"
echo "   1. Run comprehensive tests: ./scripts/staging-tests.sh $SERVICE_URL"
echo "   2. Monitor application metrics"
echo "   3. Validate memory caching functionality"