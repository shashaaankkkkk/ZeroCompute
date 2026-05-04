#!/bin/bash

echo "Starting ZeroCompute Platform Setup..."

# 1. Install Global/Common Requirements
echo "Installing Python dependencies..."
pip install fastapi uvicorn requests rich django djangorestframework django-cors-headers passlib[bcrypt] python-jose[cryptography] python-multipart pydantic pydantic-settings sqlalchemy aiosqlite

# 2. Setup Django Backend
echo "Setting up Django database..."
cd portal-backend
python manage.py migrate
cd ..

# 3. Setup Web Portal (Frontend)
echo "Installing Web Portal dependencies..."
cd web-portal
npm install
cd ..

echo "------------------------------------------------"
echo "Setup Complete!"
echo "Run ./run-all.sh to start the platform."
echo "------------------------------------------------"
