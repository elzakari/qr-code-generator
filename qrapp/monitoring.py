import time
import logging
from functools import wraps
from flask import request, g, jsonify

logger = logging.getLogger(__name__)

# Simple in-memory metrics storage
metrics = {
    'request_count': 0,
    'request_times': [],
    'qr_generation_count': 0,
    'qr_generation_times': []
}

def monitor_requests(app):
    """Add request monitoring to Flask app"""
    
    @app.before_request
    def before_request():
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            metrics['request_times'].append(duration)
            metrics['request_count'] += 1
            
            # Keep only last 100 request times to prevent memory growth
            if len(metrics['request_times']) > 100:
                metrics['request_times'] = metrics['request_times'][-100:]
                
        return response

def track_qr_generation():
    """Decorator to track QR generation metrics"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                metrics['qr_generation_times'].append(duration)
                metrics['qr_generation_count'] += 1
                
                # Keep only last 100 generation times
                if len(metrics['qr_generation_times']) > 100:
                    metrics['qr_generation_times'] = metrics['qr_generation_times'][-100:]
                    
                return result
            except Exception as e:
                logger.error(f"QR generation failed: {e}")
                raise
        return wrapper
    return decorator

def setup_health_check(app):
    """Add health check endpoint"""
    
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'timestamp': time.time(),
            'version': app.config.get('VERSION', '1.0.0')
        })
    
    @app.route('/metrics')
    def metrics_endpoint():
        avg_request_time = sum(metrics['request_times']) / len(metrics['request_times']) if metrics['request_times'] else 0
        avg_qr_time = sum(metrics['qr_generation_times']) / len(metrics['qr_generation_times']) if metrics['qr_generation_times'] else 0
        
        return jsonify({
            'request_count': metrics['request_count'],
            'average_request_time': avg_request_time,
            'qr_generation_count': metrics['qr_generation_count'],
            'average_qr_generation_time': avg_qr_time,
            'timestamp': time.time()
        })