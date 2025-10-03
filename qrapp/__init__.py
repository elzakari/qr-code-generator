from flask import Blueprint

# This name ("qr") is used in url_for("qr.download", ...)
bp = Blueprint("qr", __name__)

# Import routes so they register on this blueprint
from . import routes  # noqa: E402,F401
