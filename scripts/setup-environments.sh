#!/bin/bash

set -e

echo "🔧 Setting up deployment environments..."

# Function to create namespace and apply configurations
setup_environment() {
    local ENV=$1
    local NAMESPACE="qr-generator-${ENV}"
    
    echo "📝 Setting up ${ENV} environment..."
    
    # Create namespace
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply secrets and configmaps
    if [[ -f "k8s/secrets-${ENV}.yaml" ]]; then
        echo "🔐 Applying secrets for ${ENV}..."
        kubectl apply -f "k8s/secrets-${ENV}.yaml" -n ${NAMESPACE}
    fi
    
    if [[ -f "k8s/configmap-${ENV}.yaml" ]]; then
        echo "⚙️ Applying config for ${ENV}..."
        kubectl apply -f "k8s/configmap-${ENV}.yaml" -n ${NAMESPACE}
    fi
    
    # Apply PVCs
    echo "💾 Setting up persistent volumes..."
    kubectl apply -f k8s/pvc.yaml -n ${NAMESPACE}
    
    echo "✅ ${ENV} environment setup complete"
}

# Setup staging environment
setup_environment "staging"

# Setup production environment (if specified)
if [[ "$1" == "production" ]]; then
    setup_environment "production"
fi

echo "🎉 Environment setup completed successfully!"