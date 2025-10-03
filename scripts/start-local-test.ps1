# PowerShell script to start the application locally for testing
param(
    [int]$Port = 5000
)

Write-Host "Starting QR Generator application locally for testing..." -ForegroundColor Green

# Activate virtual environment if it exists
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .venv\Scripts\Activate.ps1
}

# Set environment variables for testing
$env:FLASK_ENV = "development"
$env:FLASK_APP = "app.py"
$env:FLASK_RUN_PORT = $Port
$env:CACHE_TTL = "1800"
$env:MEMORY_CACHE_SIZE = "256MB"
$env:LOG_LEVEL = "INFO"

# Check if database exists, if not initialize it
if (-not (Test-Path "instance\app.db")) {
    Write-Host "Database not found. Initializing..." -ForegroundColor Yellow
    
    # Run database initialization
    powershell -ExecutionPolicy Bypass -File "scripts\init-database.ps1"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Database initialization failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Database found" -ForegroundColor Green
}

Write-Host "Starting Flask application on port $Port..." -ForegroundColor Yellow
Write-Host "Application will be available at: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Gray

# Start the Flask application
python app.py