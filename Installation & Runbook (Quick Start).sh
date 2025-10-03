# 1) clone your project folder
cd qrgen

# 2) create virtualenv
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate

# 3) install
pip install --upgrade pip
pip install -r requirements.txt

# 4) run (option A)
export FLASK_APP=app.py
export FLASK_ENV=development    # optional for local dev
flask run

# or run (option B)
python app.py
