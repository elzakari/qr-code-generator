# PowerShell script for staging deployment on Windows
param(
    [string]$Environment = "staging",
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting staging deployment process..." -ForegroundColor Green

# Step 1: Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check if Docker is available
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if kubectl is available (for Kubernetes deployment)
$useKubernetes = $false
if (Get-Command kubectl -ErrorAction SilentlyContinue) {
    Write-Host "✅ kubectl found - will deploy to Kubernetes" -ForegroundColor Green
    $useKubernetes = $true
} else {
    Write-Host "⚠️ kubectl not found - will deploy locally with Docker" -ForegroundColor Yellow
}

# Step 2: Build Docker image
Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$imageName = "qr-generator:staging-$timestamp"

try {
    docker build -t $imageName .
    docker tag $imageName "qr-generator:staging-latest"
    Write-Host "✅ Docker image built successfully: $imageName" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build Docker image: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Deploy based on available infrastructure
if ($useKubernetes) {
    Write-Host "📦 Deploying to Kubernetes staging environment..." -ForegroundColor Yellow
    
    # Generate secrets if needed
    if (-not (Test-Path "k8s/secrets-staging-generated.yaml")) {
        Write-Host "🔐 Generating staging secrets..." -ForegroundColor Yellow
        & .\scripts\generate-secrets.ps1
    }
    
    $namespace = "qr-generator-staging"
    
    # Create namespace
    kubectl create namespace $namespace --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply configurations
    kubectl apply -f k8s/secrets-staging-generated.yaml
    kubectl apply -f k8s/pvc.yaml -n $namespace
    
    # Update deployment for staging
    (Get-Content k8s/deployment.yaml) -replace 'your-registry/qr-generator:latest', $imageName -replace 'replicas: 3', 'replicas: 2' | Set-Content k8s/deployment-staging.yaml
    
    kubectl apply -f k8s/deployment-staging.yaml -n $namespace
    
    # Wait for deployment
    Write-Host "⏳ Waiting for deployment to be ready..." -ForegroundColor Yellow
    kubectl rollout status deployment/qr-generator -n $namespace --timeout=300s
    
    Write-Host "✅ Kubernetes deployment completed" -ForegroundColor Green
} else {
    # Local Docker deployment
    Write-Host "🐳 Deploying locally with Docker..." -ForegroundColor Yellow
    
    # Stop existing container if running
    docker stop qr-generator-staging -ErrorAction SilentlyContinue
    docker rm qr-generator-staging -ErrorAction SilentlyContinue
    
    # Run new container
    docker run -d `
        --name qr-generator-staging `
        -p 8080:5000 `
        -e FLASK_ENV=staging `
        -e LOG_LEVEL=INFO `
        -e CACHE_TTL=1800 `
        -e MEMORY_CACHE_SIZE=256MB `
        $imageName
    
    Write-Host "✅ Local Docker deployment completed" -ForegroundColor Green
    Write-Host "🔗 Application available at: http://localhost:8080" -ForegroundColor Cyan
}

Write-Host "🎉 Staging deployment completed successfully!" -ForegroundColor Green