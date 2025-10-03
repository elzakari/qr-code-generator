import os
from flask import current_app, request, render_template, jsonify, send_from_directory, url_for, abort
from flask_login import login_required, current_user
from werkzeug.exceptions import BadRequest

from . import bp  # <-- import the blueprint
from .validators import is_valid_url_or_text, normalize_error_correction, clamp_int, clamp_float, looks_like_url
from .utils import save_upload, parse_colors, generate_qr_png, image_to_data_uri, persist_generated, cleanup_old_files
from .models import db, QRCode
from .limiter import limiter
from .csrf import csrf

@bp.before_app_request
def maybe_cleanup():
    try:
        cleanup_old_files()
    except Exception as e:
        current_app.logger.debug("Cleanup skipped: %s", e)

def _extract_form_payload(form, files):
    content = form.get("content", "", type=str)
    if not is_valid_url_or_text(content):
        raise BadRequest("Please provide text or a valid URL.")
    ec = normalize_error_correction(form.get("error_correction", "M"))
    size_px = clamp_int(form.get("size_px", 512), 128, 4096, 512)
    box_size = clamp_int(form.get("box_size", 10), 1, 50, 10)
    margin  = clamp_int(form.get("margin", 4),  0, 32, 4)
    fg_hex, bg_hex = parse_colors(form.get("fg_color", "#000000"), form.get("bg_color", "#FFFFFF"))
    rounded = clamp_float(form.get("rounded", 0.0), 0.0, 0.5, 0.0)
    
    # Add logo size parameter with validation (5-30% of QR code size)
    logo_size = clamp_int(form.get("logo_size", 20), 5, 30, 20)
    
    # Add duplication parameters
    duplicate_count = clamp_int(form.get("duplicate_count", 1), 1, 10, 1)  # Max 10 duplicates
    
    # Handle auto_duplicate as either boolean or string
    auto_duplicate_value = form.get("auto_duplicate", "false")
    if isinstance(auto_duplicate_value, bool):
        auto_duplicate = auto_duplicate_value
    else:
        auto_duplicate = str(auto_duplicate_value).lower() == "true"
    
    upload = files.get("logo")
    logo_path = save_upload(upload) if (upload and upload.filename) else None

    return dict(content=content, ec=ec, size_px=size_px, box_size=box_size, margin=margin,
                fg_hex=fg_hex, bg_hex=bg_hex, rounded=rounded, logo_path=logo_path,
                logo_size=logo_size, duplicate_count=duplicate_count, auto_duplicate=auto_duplicate)

@bp.route("/generate", methods=["POST"])
@login_required
@limiter.limit("100 per minute" if os.getenv("FLASK_ENV", "").lower() == "development" else "10 per minute")
@csrf.exempt
def generate():
    try:
        p = _extract_form_payload(request.form, request.files)
        img = generate_qr_png(
            data=p["content"], size_px=p["size_px"], error_correction=p["ec"],
            fg=p["fg_hex"], bg=p["bg_hex"], box_size=p["box_size"],
            border=p["margin"], rounded_ratio=p["rounded"], logo_path=p["logo_path"],
            logo_size_percent=p["logo_size"]
        )
        data_uri = image_to_data_uri(img)
        qid, _ = persist_generated(img)
        dl_url = url_for("qr.download", id=qid, _external=False)

        # Save to database
        qr_entry = QRCode(id=qid, content=p["content"], user_id=current_user.id)
        db.session.add(qr_entry)
        db.session.commit()

        if request.accept_mimetypes.best == "application/json":
            return jsonify({"id": qid, "download_url": dl_url, "data_uri": data_uri}), 201

        return render_template(
            "result.html",
            data_uri=data_uri,
            download_url=dl_url,
            content_preview=p["content"][:120] + ("..." if len(p["content"]) > 120 else ""),
            is_url=looks_like_url(p["content"])
        )
    except ValueError as ve:
        raise BadRequest(str(ve))
    except BadRequest:
        raise
    except Exception as e:
        current_app.logger.exception("Generation error: %s", e)
        abort(500)

@bp.route("/download/<id>", methods=["GET"])
@login_required
def download(id):
    if not id or len(id) < 8:
        abort(404)
    filename = f"{id}.png"
    folder = current_app.config["GENERATED_FOLDER"]
    path = os.path.join(folder, filename)
    if not os.path.isfile(path):
        abort(404)
    return send_from_directory(folder, filename, as_attachment=True, mimetype="image/png")

# Add the API endpoint that the frontend expects
@bp.route("/api/qr/<id>/download", methods=["GET"])
@login_required
def api_download(id):
    """API endpoint for downloading QR codes - matches frontend expectations"""
    if not id or len(id) < 8:
        abort(404)
    
    # Check if this QR belongs to the current user
    qr = QRCode.query.filter_by(id=id, user_id=current_user.id).first()
    if not qr:
        abort(404)
    
    filename = f"{id}.png"
    folder = current_app.config["GENERATED_FOLDER"]
    path = os.path.join(folder, filename)
    if not os.path.isfile(path):
        abort(404)
    
    # Get format from query parameter (default to png)
    format_type = request.args.get('format', 'png').lower()
    if format_type not in ['png']:
        format_type = 'png'
    
    return send_from_directory(folder, filename, as_attachment=True, mimetype="image/png")

@bp.route("/dashboard", methods=["GET"])
@login_required
def dashboard():
    qrs = QRCode.query.filter_by(user_id=current_user.id).order_by(QRCode.created_at.desc()).limit(50).all()
    return render_template("dashboard.html", qrs=qrs)

@bp.route("/api/generate", methods=["POST"])
@login_required
@limiter.limit("100 per minute" if os.getenv("FLASK_ENV", "").lower() == "development" else "10 per minute")
@csrf.exempt
def api_generate():
    try:
        # Handle both JSON and FormData requests
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Handle FormData (with file upload)
            data = request.form.to_dict()
            files = request.files
        else:
            # Handle JSON request
            data = request.get_json(force=True, silent=False) or {}
            files = {}

        class Proxy:
            def __init__(self, d): self.d = d
            def get(self, k, default=None, type=None):
                v = self.d.get(k, default)
                if type is int:
                    try: return int(v)
                    except: return default
                if type is float:
                    try: return float(v)
                    except: return default
                if type is str:
                    return "" if v is None else str(v)
                return v

        p = _extract_form_payload(Proxy(data), files=files)
        
        # Generate the primary QR code
        img = generate_qr_png(
            data=p["content"], size_px=p["size_px"], error_correction=p["ec"],
            fg=p["fg_hex"], bg=p["bg_hex"], box_size=p["box_size"],
            border=p["margin"], rounded_ratio=p["rounded"], logo_path=p["logo_path"],
            logo_size_percent=p["logo_size"]
        )
        data_uri = image_to_data_uri(img)
        qid, _ = persist_generated(img)
        dl_url = url_for("qr.download", id=qid, _external=False)

        # Save primary QR to database
        qr_entry = QRCode(id=qid, content=p["content"], user_id=current_user.id)
        db.session.add(qr_entry)
        
        # Handle automatic duplication
        duplicates = []
        if p["auto_duplicate"] or p["duplicate_count"] > 1:
            duplicate_count = p["duplicate_count"] if p["duplicate_count"] > 1 else 2  # Default to 2 if auto_duplicate is true
            
            for i in range(1, duplicate_count):  # Start from 1 since we already have the original
                # Generate duplicate QR code with same parameters
                duplicate_img = generate_qr_png(
                    data=p["content"], size_px=p["size_px"], error_correction=p["ec"],
                    fg=p["fg_hex"], bg=p["bg_hex"], box_size=p["box_size"],
                    border=p["margin"], rounded_ratio=p["rounded"], logo_path=p["logo_path"],
                    logo_size_percent=p["logo_size"]
                )
                duplicate_qid, _ = persist_generated(duplicate_img)
                duplicate_dl_url = url_for("qr.download", id=duplicate_qid, _external=False)
                
                # Save duplicate to database
                duplicate_entry = QRCode(id=duplicate_qid, content=p["content"], user_id=current_user.id)
                db.session.add(duplicate_entry)
                
                duplicates.append({
                    "id": duplicate_qid,
                    "download_url": duplicate_dl_url,
                    "data_uri": image_to_data_uri(duplicate_img)
                })
        
        db.session.commit()

        # Return response with original and duplicates
        response_data = {
            "id": qid, 
            "download_url": dl_url, 
            "data_uri": data_uri,
            "duplicates": duplicates,
            "total_generated": 1 + len(duplicates)
        }
        
        return jsonify(response_data), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        current_app.logger.exception("API error: %s", e)
        return jsonify({"error": "Internal server error"}), 500

@bp.route("/api/qr/user", methods=["GET"])
@login_required
def api_get_user_qrs():
    try:
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 10, type=int), 50)  # Cap at 50
        
        qrs = QRCode.query.filter_by(user_id=current_user.id)\
                         .order_by(QRCode.created_at.desc())\
                         .paginate(page=page, per_page=limit, error_out=False)
        
        qr_list = []
        for qr in qrs.items:
            qr_list.append({
                'id': qr.id,
                'content': qr.content,
                'created_at': qr.created_at.isoformat(),
                'download_url': url_for('qr.download', id=qr.id, _external=False)
            })
        
        return jsonify({
            'success': True,
            'qrs': qr_list,
            'total': qrs.total,
            'page': page,
            'pages': qrs.pages
        })
    except Exception as e:
        current_app.logger.exception("API error: %s", e)
        return jsonify({'success': False, 'error': 'Failed to fetch QR codes'}), 500

@bp.route("/api/qr/<id>", methods=["DELETE"])
@login_required
@csrf.exempt  # Add this line
def api_delete_qr(id):
    try:
        qr = QRCode.query.filter_by(id=id, user_id=current_user.id).first()
        if not qr:
            return jsonify({'success': False, 'error': 'QR code not found'}), 404
        
        # Delete the file
        filename = f"{id}.png"
        folder = current_app.config["GENERATED_FOLDER"]
        path = os.path.join(folder, filename)
        if os.path.isfile(path):
            try:
                os.remove(path)
            except OSError:
                pass
        
        # Delete from database
        db.session.delete(qr)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        current_app.logger.exception("API error: %s", e)
        return jsonify({'success': False, 'error': 'Failed to delete QR code'}), 500

@bp.route("/api/qr/search", methods=["GET"])
@login_required
def api_search_qrs():
    try:
        query = request.args.get('q', '').strip()
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 10, type=int), 50)  # Cap at 50
        
        if not query:
            return jsonify({'success': True, 'qrs': []})
        
        qrs = QRCode.query.filter_by(user_id=current_user.id)\
                         .filter(QRCode.content.contains(query))\
                         .order_by(QRCode.created_at.desc())\
                         .paginate(page=page, per_page=limit, error_out=False)
        
        qr_list = []
        for qr in qrs.items:
            qr_list.append({
                'id': qr.id,
                'content': qr.content,
                'created_at': qr.created_at.isoformat(),
                'download_url': url_for('qr.download', id=qr.id, _external=False)
            })
        
        return jsonify({
            'success': True,
            'qrs': qr_list,
            'total': qrs.total,
            'page': page,
            'pages': qrs.pages
        })
    except Exception as e:
        current_app.logger.exception("API error: %s", e)
        return jsonify({'success': False, 'error': 'Failed to search QR codes'}), 500

@bp.route("/api/dashboard", methods=["GET"])
@login_required
def api_dashboard():
    try:
        qrs = QRCode.query.filter_by(user_id=current_user.id)\
                         .order_by(QRCode.created_at.desc())\
                         .limit(10).all()
        
        qr_list = []
        for qr in qrs:
            qr_list.append({
                'id': qr.id,
                'content': qr.content,
                'created_at': qr.created_at.isoformat(),
                'download_url': url_for('qr.download', id=qr.id, _external=False)
            })
        
        return jsonify({
            'success': True,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'isAdmin': current_user.is_admin
            },
            'qrs': qr_list
        })
    except Exception as e:
        current_app.logger.exception("API error: %s", e)
        return jsonify({'success': False, 'error': 'Failed to fetch dashboard data'}), 500
