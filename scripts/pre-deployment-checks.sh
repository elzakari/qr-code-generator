#!/bin/bash

set -e

ENVIRONMENT=${1:-staging}
NAMESPACE="qr-generator-${ENVIRONMENT}"

echo "🔍 Running pre-deployment checks for ${ENVIRONMENT}..."

# Check if kubectl is available and configured
echo "⚙️ Checking kubectl configuration..."
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed"
    exit 1
fi

if ! kubectl cluster-info &> /dev/null; then
    echo "❌ kubectl is not configured or cluster is not accessible"
    exit 1
fi

echo "✅ kubectl is configured and cluster is accessible"

# Check if required files exist
echo "📁 Checking required deployment files..."
REQUIRED_FILES=(
    "k8s/secrets-${ENVIRONMENT}-generated.yaml"
    "k8s/pvc.yaml"
    "k8s/deployment.yaml"
    "Dockerfile"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All required files are present"

# Check Docker image
echo "🐳 Checking Docker image..."
if ! docker images | grep -q "qr-generator"; then
    echo "⚠️  Docker image not found locally. Building..."
    docker build -t qr-generator:latest .
fi

echo "✅ Docker image is available"

# Validate Kubernetes manifests
echo "📋 Validating Kubernetes manifests..."
kubectl apply --dry-run=client -f k8s/secrets-${ENVIRONMENT}-generated.yaml
kubectl apply --dry-run=client -f k8s/pvc.yaml
kubectl apply --dry-run=client -f k8s/deployment.yaml

echo "✅ Kubernetes manifests are valid"

# Check resource availability
echo "💾 Checking cluster resources..."
NODES=$(kubectl get nodes --no-headers | wc -l)
if [[ $NODES -lt 1 ]]; then
    echo "❌ No nodes available in the cluster"
    exit 1
fi

echo "✅ Cluster has $NODES node(s) available"

# Check if namespace exists or can be created
echo "🏷️ Checking namespace..."
if kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "✅ Namespace $NAMESPACE already exists"
else
    echo "📝 Namespace $NAMESPACE will be created during deployment"
fi

echo "🎉 All pre-deployment checks passed!"
echo "🚀 Ready to deploy to ${ENVIRONMENT} environment"