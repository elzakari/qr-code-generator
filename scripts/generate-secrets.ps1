# PowerShell script to generate secrets for Windows
$ErrorActionPreference = "Stop"

Write-Host "🔐 Generating secure secrets for deployment environments..." -ForegroundColor Green

# Function to generate random string
function Generate-RandomString {
    param([int]$Length = 32)
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    $random = 1..$Length | ForEach-Object { Get-Random -Maximum $chars.length }
    $private:ofs = ""
    return [String]$chars[$random]
}

# Function to base64 encode
function ConvertTo-Base64 {
    param([string]$Text)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
    return [Convert]::ToBase64String($bytes)
}

Write-Host "📝 Generating staging secrets..." -ForegroundColor Yellow

$stagingSecretKey = Generate-RandomString -Length 32
$stagingJwtSecret = Generate-RandomString -Length 64
$stagingDbPassword = Generate-RandomString -Length 16
$stagingDbUrl = "postgresql://qr_user:$stagingDbPassword@postgres-staging:5432/qr_generator_staging"
$stagingRedisUrl = "redis://redis-staging:6379/0"

# Create staging secrets file
$stagingSecretsContent = @"
apiVersion: v1
kind: Secret
metadata:
  name: qr-generator-secrets
  namespace: qr-generator-staging
type: Opaque
data:
  secret-key: $(ConvertTo-Base64 $stagingSecretKey)
  database-url: $(ConvertTo-Base64 $stagingDbUrl)
  jwt-secret: $(ConvertTo-Base64 $stagingJwtSecret)
  redis-url: $(ConvertTo-Base64 $stagingRedisUrl)
  
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
"@

$stagingSecretsContent | Out-File -FilePath "k8s/secrets-staging-generated.yaml" -Encoding UTF8

Write-Host "✅ Staging secrets generated: k8s/secrets-staging-generated.yaml" -ForegroundColor Green

# Add to .gitignore if not already there
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue
if ($gitignoreContent -notcontains "k8s/secrets-*-generated.yaml") {
    Add-Content .gitignore "`n# Generated secrets - never commit`nk8s/secrets-*-generated.yaml"
    Write-Host "✅ Added generated secrets to .gitignore" -ForegroundColor Green
}

Write-Host "⚠️ IMPORTANT: Store these secrets securely and never commit them to version control!" -ForegroundColor Red