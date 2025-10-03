import io
import os
import re
import pytest
from app import create_app
from qrapp.models import User, QRCode

@pytest.fixture()
def client(tmp_path):
    app = create_app()
    # redirect instance folders into tmp
    app.config["UPLOAD_FOLDER"] = tmp_path / "uploads"
    app.config["GENERATED_FOLDER"] = tmp_path / "generated"
    app.config["LOG_FOLDER"] = tmp_path / "logs"
    app.config["TESTING"] = True
    for key in ("UPLOAD_FOLDER", "GENERATED_FOLDER", "LOG_FOLDER"):
        os.makedirs(app.config[key], exist_ok=True)
    return app.test_client()

def test_qr_generation_minimal(client):
    resp = client.post("/api/generate", json={
        "content": "hello world",
        "size_px": 256,
        "error_correction": "M",
        "fg_color": "#000000",
        "bg_color": "#FFFFFF",
        "box_size": 10,
        "margin": 4,
        "rounded": 0.0
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert "id" in data and "download_url" in data and "data_uri" in data
    assert data["data_uri"].startswith("data:image/png;base64,")

def test_color_validation(client):
    resp = client.post("/api/generate", json={
        "content": "x",
        "fg_color": "not-a-color",
        "bg_color": "#FFFFFF"
    })
    assert resp.status_code == 400
    assert "error" in resp.get_json()

def test_invalid_upload_rejected(client):
    # create a fake "text" file but name it .png
    data = {
        "content": "test",
        "size_px": "256",
        "error_correction": "M",
        "fg_color": "#000000",
        "bg_color": "#FFFFFF",
        "box_size": "10",
        "margin": "4",
        "rounded": "0.0",
        "logo": (io.BytesIO(b"not an image"), "fake.png"),
    }
    resp = client.post("/generate", data=data, content_type="multipart/form-data")
    assert resp.status_code in (400, 413)  # bad request due to invalid image

def test_user_registration(client):
    resp = client.post("/register", data={
        "username": "testuser",
        "password": "testpass",
        "confirm_password": "testpass"
    })
    assert resp.status_code == 302  # redirect to login

def test_user_login(client):
    # First register
    client.post("/register", data={
        "username": "testuser2",
        "password": "testpass",
        "confirm_password": "testpass"
    })
    # Then login
    resp = client.post("/login", data={
        "username": "testuser2",
        "password": "testpass"
    })
    assert resp.status_code == 302  # redirect to home
