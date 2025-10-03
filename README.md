<<<<<<< HEAD
# Flask QR Generator

A local-first Flask app to generate and customize QR codes (PNG) with colors, rounded modules, margins, and optional logo overlays. Includes HTML UI, REST endpoints, JSON API, logging, and tests.

## Features
- Text/URL input, size (px), error correction (L/M/Q/H), FG/BG colors (hex), margin, box size, rounded modules.
- Optional logo overlay (secure upload + server-side compositing).
- Returns inline preview (data URI) + downloadable PNG.
- REST: `POST /generate`, `GET /download/<id>`
- JSON API: `POST /api/generate`
- Basic validation, logging, error pages, and file cleanup.

## Setup

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
flask init-db
flask create-admin
python app.py
```

## Deployment

### Heroku
1. Create Heroku app
2. Set environment variables: SECRET_KEY, DATABASE_URL
3. Deploy using git push heroku main

### Docker
```bash
docker build -t qrgen .
docker run -p 5000:5000 qrgen
```

### AWS/Vercel
Use Dockerfile for containerized deployment.
=======
# EasyMS-QR-Generator
QR Code Generator
>>>>>>> 5f58be8e7f9037543c4f44a3ad32552b12da8dc9
