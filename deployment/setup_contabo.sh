#!/bin/bash
# ==============================================================================
# Milliy Narx - Production Setup Script for Contabo VPS (Ubuntu 22.04 / 24.04 LTS)
# ==============================================================================

set -e

echo "=== 1. Tizim paketlarini yangilash ==="
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y python3-pip python3-venv postgresql postgresql-contrib nginx certbot python3-certbot-nginx curl git

echo "=== 2. PostgreSQL ma'lumotlar bazasini sozlash ==="
DB_NAME="milliynarx"
DB_USER="milliynarx_user"
DB_PASS="SecureContaboPass2026!"

sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || true

echo "=== 3. Katalog tuzilishi va huquqlarni o'rnatish ==="
PROJECT_DIR="/var/www/milliynarx"
sudo mkdir -p $PROJECT_DIR/uploads
sudo chown -R www-data:www-data $PROJECT_DIR
sudo chmod -R 775 $PROJECT_DIR/uploads

echo "=== 4. Python virtual muhitini sozlash ==="
sudo -u www-data python3 -m venv $PROJECT_DIR/venv
sudo -u www-data $PROJECT_DIR/venv/bin/pip install --upgrade pip
sudo -u www-data $PROJECT_DIR/venv/bin/pip install -r $PROJECT_DIR/backend/requirements.txt

echo "=== 5. Muhit o'zgaruvchilari (.env) sozlash ==="
if [ ! -f "$PROJECT_DIR/.env" ]; then
    sudo -u www-data cp $PROJECT_DIR/.env.example $PROJECT_DIR/.env
fi

echo "=== 6. Node.js o'rnatish va Frontendni paketlash (Build) ==="
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
cd $PROJECT_DIR/frontend
sudo -u www-data npm install
sudo -u www-data npm run build
cd $PROJECT_DIR

echo "=== 7. Systemd xizmatini o'rnatish ==="
sudo cp $PROJECT_DIR/deployment/milliy-narx-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable milliy-narx-api
sudo systemctl restart milliy-narx-api

echo "=== 8. Nginx konfiguratsiyasini ulash ==="
sudo cp $PROJECT_DIR/deployment/nginx.conf /etc/nginx/sites-available/milliy-narx.conf
sudo ln -sf /etc/nginx/sites-available/milliy-narx.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "=== 9. Let's Encrypt SSL sertifikatini olish ==="
echo "Sertifikat olish uchun quyidagi buyruqni domen yo'naltirilgach bajaring:"
echo "sudo certbot --nginx -d milliy-narx.uz -d www.milliy-narx.uz"

echo "=== O'rnatish muvaffaqiyatli yakunlandi! ==="
