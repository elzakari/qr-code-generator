# PowerShell script to test database functionality
Write-Host "Testing database functionality..." -ForegroundColor Green

# Activate virtual environment
if (Test-Path ".venv\Scripts\Activate.ps1") {
    & .venv\Scripts\Activate.ps1
}

$testScript = @"
import os
import sys
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

# Set database URL
os.environ['DATABASE_URL'] = 'sqlite:///instance/app.db'

try:
    from app import create_app
    from qrapp.models import db, User
    
    app = create_app()
    with app.app_context():
        # Test creating a user
        test_user = User(username='testuser')
        test_user.set_password('testpass')
        
        db.session.add(test_user)
        db.session.commit()
        
        # Test querying the user
        found_user = User.query.filter_by(username='testuser').first()
        if found_user and found_user.check_password('testpass'):
            print("✅ Database test successful!")
            print(f"Created and verified user: {found_user.username}")
        else:
            print("❌ Database test failed - user verification failed")
            
        # Clean up
        db.session.delete(found_user)
        db.session.commit()
        
except Exception as e:
    print(f"❌ Database test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
"@

$testScript | python