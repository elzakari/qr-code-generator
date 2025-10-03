from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from .models import db, User
from .forms import LoginForm, RegisterForm
from .csrf import csrf

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('qr.dashboard'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            next_page = request.args.get('next')
            # Ensure we don't redirect to auth pages
            if next_page and not next_page.startswith('/auth/'):
                return redirect(next_page)
            return redirect(url_for('qr.dashboard'))
        flash('Invalid username or password')
    return render_template('login.html', form=form)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('qr.dashboard'))
    form = RegisterForm()
    if form.validate_on_submit():
        user = User(username=form.username.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Registration successful! Please log in.')
        return redirect(url_for('auth.login'))
    return render_template('register.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

# JSON API endpoints for frontend
@auth_bp.route('/api/login', methods=['POST'])
@csrf.exempt
def api_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400
        
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return jsonify({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'isAdmin': user.is_admin
                },
                'redirectTo': '/dashboard'  # Provide default redirect
            })
        else:
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': 'Login failed'}), 500

@auth_bp.route('/api/register', methods=['POST'])
@csrf.exempt
def api_register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': 'Username already exists'}), 409
        
        # Create new user
        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        # Log in the new user
        login_user(user)
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'isAdmin': user.is_admin
            },
            'redirectTo': '/dashboard'  # Provide default redirect
        })
    except Exception as e:
        print(f"Registration error: {str(e)}")  # Debug print
        import traceback
        traceback.print_exc()  # Print full traceback
        return jsonify({'success': False, 'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/api/logout', methods=['POST'])
@csrf.exempt
def api_logout():
    try:
        logout_user()
        return jsonify({'success': True, 'redirectTo': '/login'})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Logout failed'}), 500

@auth_bp.route('/api/user', methods=['GET'])
@login_required
def api_current_user():
    try:
        return jsonify({
            'success': True,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'isAdmin': current_user.is_admin
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': 'Failed to get user info'}), 500