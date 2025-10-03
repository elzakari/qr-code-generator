#!/bin/bash

set -e

# Configuration
ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}
NAMESPACE="qr-generator-${ENVIRONMENT}"

echo "🚀 Deploying QR Generator to ${ENVIRONMENT} environment..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed"
    exit 1
fi

# Create namespace if it doesn't exist
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Apply configurations
echo "📝 Applying Kubernetes configurations..."
kubectl apply -f k8s/secrets-${ENVIRONMENT}.yaml -n ${NAMESPACE}
kubectl apply -f k8s/configmap-${ENVIRONMENT}.yaml -n ${NAMESPACE}
kubectl apply -f k8s/pvc.yaml -n ${NAMESPACE}

# Update deployment with new image
echo "🔄 Updating deployment with image tag: ${IMAGE_TAG}"
kubectl set image deployment/qr-generator qr-generator=your-registry/qr-generator:${IMAGE_TAG} -n ${NAMESPACE}

# Wait for rollout to complete
echo "⏳ Waiting for deployment to complete..."
kubectl rollout status deployment/qr-generator -n ${NAMESPACE} --timeout=300s

# Run health checks
echo "🏥 Running health checks..."
sleep 10
HEALTH_URL=$(kubectl get service qr-generator-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if curl -f "http://${HEALTH_URL}/health" > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

echo "🎉 Deployment to ${ENVIRONMENT} completed successfully!"