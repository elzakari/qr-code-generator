# PowerShell script to initialize the database with absolute paths
Write-Host "Initializing QR Generator database..." -ForegroundColor Green

# Get current directory as absolute path
$currentDir = Get-Location
$dbPath = Join-Path $currentDir "instance\app.db"
$absoluteDbPath = [System.IO.Path]::GetFullPath($dbPath)

Write-Host "Working directory: $currentDir" -ForegroundColor Cyan
Write-Host "Database path: $absoluteDbPath" -ForegroundColor Cyan

# Activate virtual environment if it exists
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & .venv\Scripts\Activate.ps1
}

# Create instance directory and subdirectories if they don't exist
$instanceDirs = @("instance", "instance\logs", "instance\generated", "instance\uploads")
foreach ($dir in $instanceDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Yellow
    }
}

# Remove existing database if it exists
if (Test-Path $dbPath) {
    Write-Host "Removing existing database..." -ForegroundColor Yellow
    Remove-Item $dbPath -Force
}

# Create database using absolute path approach
Write-Host "Creating database with absolute path approach..." -ForegroundColor Yellow

$initScript = @"
import os
import sys
import sqlite3
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

# Use absolute path for database
db_absolute_path = r'$absoluteDbPath'
print(f"Using absolute database path: {db_absolute_path}")

# Set environment variable with absolute path
os.environ['DATABASE_URL'] = f'sqlite:///{db_absolute_path}'

try:
    # First, create the database file directly with absolute path
    print("Creating SQLite database file...")
    conn = sqlite3.connect(db_absolute_path)
    conn.close()
    print(f"Created database file: {db_absolute_path}")
    
    # Verify file exists
    if os.path.exists(db_absolute_path):
        print(f"Database file verified: {os.path.getsize(db_absolute_path)} bytes")
    else:
        raise Exception("Database file was not created")
    
    # Now use Flask to create tables
    print("Creating Flask app and tables...")
    from app import create_app
    from qrapp.models import db
    
    # Override the database URL in the app config
    app = create_app()
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_absolute_path}'
    
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("Database tables created successfully!")
        
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"Created tables: {tables}")
        
        if not tables:
            raise Exception("No tables were created")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
"@

# Write and run the initialization script
$tempScript = "temp_init_db.py"
$initScript | Out-File -FilePath $tempScript -Encoding UTF8

python $tempScript
$exitCode = $LASTEXITCODE

# Clean up temporary script
Remove-Item $tempScript -Force -ErrorAction SilentlyContinue

# Check results
if ($exitCode -eq 0 -and (Test-Path $dbPath)) {
    Write-Host "Database initialized successfully!" -ForegroundColor Green
    Write-Host "Database location: $absoluteDbPath" -ForegroundColor Cyan
    
    # Show database info
    $dbSize = (Get-Item $dbPath).Length
    Write-Host "Database size: $dbSize bytes" -ForegroundColor Gray
    
    # Test database connection
    Write-Host "Testing database connection..." -ForegroundColor Yellow
    $testScript = @"
import sqlite3
import os
db_path = r'$absoluteDbPath'
try:
    print(f"Testing connection to: {db_path}")
    print(f"File exists: {os.path.exists(db_path)}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Tables in database: {[table[0] for table in tables]}")
    conn.close()
    print("Database connection test successful!")
except Exception as e:
    print(f"Database test failed: {e}")
    import traceback
    traceback.print_exc()
"@
    
    $testScript | python
    
} else {
    Write-Host "Database initialization failed" -ForegroundColor Red
    exit 1
}

Write-Host "Database initialization complete!" -ForegroundColor Green