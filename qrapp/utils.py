import base64
import io
import os
import time
import uuid
from typing import Tuple, Optional

from PIL import Image, ImageOps, ImageDraw, ImageFilter
import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from werkzeug.utils import secure_filename
from flask import current_app

from .validators import is_hex_color

def allowed_file(filename: str) -> bool:
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in current_app.config["ALLOWED_EXTENSIONS"]

def save_upload(file_storage) -> Optional[str]:
    """
    Validates and saves an uploaded image into instance/uploads.
    Returns absolute path if valid, else None.
    """
    if not file_storage or file_storage.filename == "":
        return None

    filename = secure_filename(file_storage.filename)
    if not allowed_file(filename):
        raise ValueError("Unsupported file type. Allowed: png, jpg, jpeg, webp")

    # Save to a temp path, then verify using Pillow before accepting.
    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    tmp_name = f"{uuid.uuid4().hex}_{filename}"
    abs_path = os.path.join(upload_dir, tmp_name)

    file_storage.save(abs_path)

    # Validate image by loading + verify()
    try:
        with Image.open(abs_path) as im:
            im.verify()  # raises if bogus
    except Exception:
        # Remove invalid file
        try:
            os.remove(abs_path)
        except OSError:
            pass
        raise ValueError("Invalid image upload.")

    return abs_path

def ec_mapping(level: str):
    from qrcode.constants import ERROR_CORRECT_L, ERROR_CORRECT_M, ERROR_CORRECT_Q, ERROR_CORRECT_H
    return {
        "L": ERROR_CORRECT_L,
        "M": ERROR_CORRECT_M,
        "Q": ERROR_CORRECT_Q,
        "H": ERROR_CORRECT_H,
    }[level]

def parse_colors(fg_hex: str, bg_hex: str) -> Tuple[str, str]:
    if not is_hex_color(fg_hex):
        raise ValueError("Invalid foreground color.")
    if not is_hex_color(bg_hex):
        raise ValueError("Invalid background color.")
    return fg_hex, bg_hex

def create_circular_mask(size: Tuple[int, int]) -> Image.Image:
    """Create a circular mask for logo with smooth edges"""
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0) + size, fill=255)
    # Apply slight blur for smoother edges
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1))
    return mask

def create_logo_background(size: Tuple[int, int], bg_color: str = "#FFFFFF") -> Image.Image:
    """Create a white circular background for the logo to improve contrast"""
    background = Image.new('RGBA', size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(background)
    
    # Create a slightly larger white circle as background
    padding = 4
    circle_size = (size[0] + padding * 2, size[1] + padding * 2)
    circle_pos = (-padding, -padding)
    
    # Draw white circle with slight transparency for better blending
    draw.ellipse(circle_pos + (circle_pos[0] + circle_size[0], circle_pos[1] + circle_size[1]), 
                 fill=(255, 255, 255, 240))
    
    return background

def process_logo_for_qr(logo_path: str, target_size: int, logo_size_percent: int = 20) -> Image.Image:
    """
    Process logo for optimal QR code integration:
    - Resize to appropriate size based on percentage
    - Apply circular mask for better integration
    - Add white background for contrast
    - Optimize for scanability
    """
    try:
        with Image.open(logo_path) as logo:
            logo = logo.convert("RGBA")
            
            # Calculate logo size based on percentage of QR code
            logo_size = int(target_size * (logo_size_percent / 100))
            
            # Ensure minimum and maximum sizes for scanability
            min_size = max(32, int(target_size * 0.05))  # Minimum 5% or 32px
            max_size = min(int(target_size * 0.30), target_size // 3)  # Maximum 30% or 1/3
            logo_size = max(min_size, min(logo_size, max_size))
            
            # Resize logo maintaining aspect ratio
            logo.thumbnail((logo_size, logo_size), Image.LANCZOS)
            
            # Create a square canvas for the logo
            canvas_size = (logo_size, logo_size)
            canvas = Image.new('RGBA', canvas_size, (255, 255, 255, 0))
            
            # Center the logo on the canvas
            logo_x = (canvas_size[0] - logo.width) // 2
            logo_y = (canvas_size[1] - logo.height) // 2
            canvas.paste(logo, (logo_x, logo_y), logo if logo.mode == 'RGBA' else None)
            
            # Create circular mask for smoother integration
            mask = create_circular_mask(canvas_size)
            
            # Create white background for better contrast
            background = create_logo_background(canvas_size)
            
            # Composite: background + logo with circular mask
            result = Image.new('RGBA', canvas_size, (255, 255, 255, 0))
            result.paste(background, (0, 0))
            result.paste(canvas, (0, 0), mask)
            
            return result
            
    except Exception as e:
        current_app.logger.warning("Logo processing failed: %s", e)
        raise ValueError(f"Failed to process logo: {str(e)}")

def generate_qr_png(
    data: str,
    size_px: int,
    error_correction: str,
    fg: str,
    bg: str,
    box_size: int,
    border: int,
    rounded_ratio: float,
    logo_path: Optional[str] = None,
    logo_size_percent: int = 20
) -> Image.Image:
    """
    Build a QR code image (Pillow Image) with optional rounded modules and enhanced logo overlay.
    
    Args:
        data: Content to encode
        size_px: Final image size in pixels
        error_correction: Error correction level (L, M, Q, H)
        fg: Foreground color (hex)
        bg: Background color (hex)
        box_size: Size of each QR module
        border: Border size in modules
        rounded_ratio: Ratio for rounded corners (0.0-0.5)
        logo_path: Path to logo file
        logo_size_percent: Logo size as percentage of QR code (5-30%)
    """
    # Use higher error correction when logo is present for better scanability
    if logo_path and error_correction in ['L', 'M']:
        current_app.logger.info(f"Upgrading error correction from {error_correction} to Q for logo compatibility")
        error_correction = 'Q'  # Upgrade to Q for better logo compatibility
    
    # Configure QR builder
    qr = qrcode.QRCode(
        version=None,  # auto-detect optimal version
        error_correction=ec_mapping(error_correction),
        box_size=box_size,
        border=border
    )
    qr.add_data(data)
    qr.make(fit=True)

    # Use StyledPilImage for rounded modules if requested
    if rounded_ratio > 0.0:
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer(radius_ratio=rounded_ratio),
            fill_color=fg,
            back_color=bg
        )
    else:
        img = qr.make_image(
            fill_color=fg,
            back_color=bg
        )

    # Convert to RGBA for compositing and resizing
    img = img.convert("RGBA")

    # Resize to requested size_px (maintain square)
    if size_px:
        img = img.resize((size_px, size_px), Image.LANCZOS)

    # Enhanced logo overlay with proper sizing and positioning
    if logo_path:
        try:
            # Process logo with enhanced features
            processed_logo = process_logo_for_qr(logo_path, size_px, logo_size_percent)
            
            # Calculate center position for logo
            logo_x = (img.width - processed_logo.width) // 2
            logo_y = (img.height - processed_logo.height) // 2
            
            # Composite the logo onto the QR code
            img.alpha_composite(processed_logo, (logo_x, logo_y))
            
            current_app.logger.info(f"Successfully applied logo: {processed_logo.width}x{processed_logo.height} "
                                  f"({logo_size_percent}% of {size_px}px QR code)")
            
        except Exception as e:
            current_app.logger.warning("Logo overlay failed: %s", e)
            # Continue without logo rather than failing completely
            pass

    return img

def image_to_data_uri(pil_img: Image.Image) -> str:
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"

def persist_generated(pil_img: Image.Image) -> Tuple[str, str]:
    """
    Saves the generated image under instance/generated with a UUID filename.
    Returns (id, absolute_path).
    """
    out_dir = current_app.config["GENERATED_FOLDER"]
    os.makedirs(out_dir, exist_ok=True)
    _id = uuid.uuid4().hex
    filename = f"{_id}.png"
    abs_path = os.path.join(out_dir, filename)
    pil_img.save(abs_path, format="PNG")
    return _id, abs_path

def cleanup_old_files():
    """
    Best-effort cleanup of old files from uploads and generated directories.
    Controlled by CLEANUP_MAX_AGE_HOURS.
    """
    max_age = current_app.config.get("CLEANUP_MAX_AGE_HOURS", 2)
    cutoff = time.time() - (max_age * 3600)
    for key in ("UPLOAD_FOLDER", "GENERATED_FOLDER"):
        directory = current_app.config[key]
        try:
            for name in os.listdir(directory):
                path = os.path.join(directory, name)
                if os.path.isfile(path):
                    try:
                        if os.path.getmtime(path) < cutoff:
                            os.remove(path)
                    except OSError:
                        pass
        except FileNotFoundError:
            continue
