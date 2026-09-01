import sys
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from flask import Flask, jsonify, send_from_directory, request, make_response
from backend.config import Config
from backend.database import init_db
from backend.routes.api import api_bp

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger('UdhaarAI')

def create_app():
    ROOT = Path(__file__).resolve().parent.parent
    FRONTEND = ROOT / 'frontend'

    app = Flask(__name__, static_folder=str(FRONTEND), static_url_path='')
    app.config.from_object(Config)

    # Initialize Database
    init_db(app)

    # Register Blueprints
    app.register_blueprint(api_bp)

    # CORS Headers for all responses
    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
        return response

    @app.before_request
    def handle_options_preflight():
        if request.method == 'OPTIONS':
            res = make_response('', 204)
            res.headers['Access-Control-Allow-Origin'] = '*'
            res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
            return res

    # Static file routes
    @app.get('/')
    def index():
        return send_from_directory(FRONTEND, 'index.html')

    @app.get('/<path:path>')
    def static_files(path):
        if path.startswith('api/'):
            return jsonify({'ok': False, 'message': 'API endpoint not found'}), 404
        target = FRONTEND / path
        if target.exists() and target.is_file():
            return send_from_directory(FRONTEND, path)
        return send_from_directory(FRONTEND, 'index.html')

    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith('/api/'):
            return jsonify({'ok': False, 'message': 'Endpoint not found'}), 404
        return send_from_directory(FRONTEND, 'index.html'), 200

    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"Internal server error: {e}", exc_info=True)
        return jsonify({'ok': False, 'message': 'Internal server error occurred'}), 500

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'ok': False, 'message': 'Bad request'}), 400

    return app

app = create_app()

if __name__ == '__main__':
    logger.info("Starting UdhaarAI Server on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=True)


