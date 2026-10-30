# Deployment Guide

This directory contains all deployment configurations for the 11of application.

## Overview

The deployment setup includes:
- **Backend**: Spring Boot Java application (Port 7071)
- **Frontend**: Next.js application (Port 7070)
- **Process Management**: Systemd services
- **Deployment Strategy**: Blue-green deployment with zero downtime
- **CI/CD**: GitHub Actions with self-hosted runner

## Directory Structure

```
deployment/
├── scripts/
│   ├── deploy-backend.sh       # Backend deployment logic
│   ├── deploy-frontend.sh      # Frontend deployment logic
│   ├── health-check.sh         # Health verification
│   └── rollback.sh             # Rollback automation
├── systemd/
│   ├── 11of-backend.service    # Backend systemd service
│   └── 11of-frontend.service   # Frontend systemd service
└── setup/
    └── server-setup.sh          # Initial server configuration
```

## Initial Server Setup

### 1. Prerequisites

Install required software on your server:

```bash
# Java 21
sudo apt update
sudo apt install openjdk-21-jdk

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# MySQL
sudo apt install mysql-server

# Create database
sudo mysql -e "CREATE DATABASE elevenof_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'elevenof'@'localhost' IDENTIFIED BY 'your-password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON elevenof_db.* TO 'elevenof'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 2. Run Server Setup Script

```bash
# Clone repository
git clone <your-repo-url>
cd <repo-name>

# Run setup script
bash deployment/setup/server-setup.sh
```

This script will:
- Create `11of-app` system user
- Set up directory structure at `/opt/11of`
- Install systemd services
- Configure sudo permissions

**Note:** Frontend node_modules will be installed during the first deployment, not during setup.

### 3. Configure Environment Variables

Create backend environment file:
```bash
sudo nano /opt/11of/backend/.env
```

Add the following (replace with your values):
```env
DB_USERNAME=elevenof
DB_PASSWORD=your-password
JWT_ISSUER_URI=https://yourdomain.com:7071
JWT_JWK_SET_URI=https://yourdomain.com:7071/.well-known/jwks.json
JWT_SECRET=<256-bit-secret-generated-with-openssl-rand-base64-32>
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=11of
FRONTEND_URL=https://yourdomain.com:7070
# Bunny Stream library for highlight videos uploaded by players (any empty = video upload off)
BUNNY_STREAM_LIBRARY_ID=123456
BUNNY_STREAM_API_KEY=your-library-api-key
BUNNY_STREAM_CDN_HOST=vz-xxxxxxxx-xxx.b-cdn.net
SPRING_PROFILES_ACTIVE=prod
```

Create frontend environment file:
```bash
sudo nano /opt/11of/frontend/.env.production
```

Add:
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com:7071/api
```

### 4. Set Up GitHub Actions Runner

1. Go to your GitHub repository → Settings → Actions → Runners
2. Click "New self-hosted runner"
3. Follow GitHub's installation instructions on your server
4. Start the runner:
   ```bash
   cd actions-runner
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```

### 5. Configure GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

**Backend Secrets:**
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_ISSUER_URI`
- `JWT_JWK_SET_URI`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `FRONTEND_URL`
- `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_CDN_HOST` (Bunny Stream > the library > API: library id,
  API key and CDN hostname; highlight video upload is hidden while any of them is empty)

**Frontend Secrets:**
- `NEXT_PUBLIC_API_URL`

## Deployment Process

### Manual Deployment

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Deploy to Production" workflow
4. Click "Run workflow"
5. Choose whether to deploy backend, frontend, or both
6. Click "Run workflow" button

The workflow will:
- Build applications (Java 21, Node 22)
- Create new release directories
- Deploy with zero downtime
- Run health checks
- Automatically rollback if health check fails

### Deployment Stages

1. **Build Phase** (parallel)
   - Backend: Maven build with dependency caching
   - Frontend: npm build with dependency caching

2. **Deploy Phase** (sequential)
   - Create timestamped release directories
   - Copy artifacts and environment files
   - Atomically switch symlinks
   - Reload systemd services (zero downtime)

3. **Verification Phase**
   - Backend health check: `/actuator/health`
   - Frontend health check: HTTP 200 on homepage

4. **Rollback Phase** (if failure)
   - Automatically revert to previous release
   - Restart services

## Manual Operations

### Check Service Status

```bash
sudo systemctl status 11of-backend.service
sudo systemctl status 11of-frontend.service
```

### View Logs

```bash
# Real-time logs
tail -f /opt/11of/backend/logs/app.log
tail -f /opt/11of/frontend/logs/app.log

# Systemd logs
journalctl -u 11of-backend.service -f
journalctl -u 11of-frontend.service -f
```

### Manual Deployment

```bash
# Deploy backend
sudo -u 11of-app bash /opt/11of/scripts/deploy-backend.sh /path/to/backoffice.jar

# Deploy frontend
sudo -u 11of-app bash /opt/11of/scripts/deploy-frontend.sh /path/to/build
```

### Manual Rollback

```bash
# Rollback backend
sudo -u 11of-app bash /opt/11of/scripts/rollback.sh backend

# Rollback frontend
sudo -u 11of-app bash /opt/11of/scripts/rollback.sh frontend
```

### Check Deployed Releases

```bash
# List backend releases
ls -la /opt/11of/backend/releases/

# List frontend releases
ls -la /opt/11of/frontend/releases/

# Check current release
readlink /opt/11of/backend/current
readlink /opt/11of/frontend/current
```

### Restart Services

```bash
sudo systemctl restart 11of-backend.service
sudo systemctl restart 11of-frontend.service
```

## Background Removal (rembg)

Player avatars and full-body photos get their background removed on the server by
[rembg](https://github.com/danielgatis/rembg) with the `isnet-general-use` model (the same library the
anylearn sticker artwork was cut out with). There is no service running all the time: the backend starts
`deployment/rembg/cutout.py` once per uploaded photo, at most one at a time, after shrinking the photo to
1280 px on the long side.

- Installed into `/opt/rembg` (venv + model, about 1.5 GB disk) by `deployment/rembg/install.sh`, which
  both deploy workflows run on every backend deploy (it does nothing once installed). Run it by hand with
  `sudo bash deployment/rembg/install.sh` if needed.
- Measured on a sample photo: about 4 s and a peak of about 1 GB RAM per photo, then the memory is freed.
  The box is shared with anylearn, so keep 2 GB of swap (`sudo fallocate -l 2G /swapfile && sudo chmod 600
  /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`, then add it to `/etc/fstab`).
- Not installed or failing = the photo keeps its background (logged as a warning), uploads never fail.
- Local development: install rembg (`pip install "rembg[cpu]"`) and set `APP_REMBG_COMMAND="python
  /path/to/deployment/rembg/cutout.py"` and `APP_REMBG_MODEL_DIR=~/.u2net`; without it photos keep their
  background.
- The first run downloads the model (about 180 MB) into the model dir and the upload waits for it; download it
  ahead with `U2NET_HOME=~/.u2net python -c "from rembg import new_session; new_session('isnet-general-use')"`.
  Check the setup without the backend: `python deployment/rembg/cutout.py < photo.jpg > out.png`.
- The backend logs the command it uses at start (`Background removal: ...`) and, when it fails, the end of the
  script's error output (`Background removal failed, using original image: ...`).

## Reverse Proxy Setup (Optional but Recommended)

Configure nginx as a reverse proxy for SSL/TLS termination:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Backend API
    location /api {
        proxy_pass http://localhost:7071;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:7070;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Service won't start

```bash
# Check logs
journalctl -u 11of-backend.service -n 50
journalctl -u 11of-frontend.service -n 50

# Common issues:
# - Database connection failed → Check DB credentials
# - Port already in use → Check if another process is using 7070/7071
# - Permission denied → Check file ownership and permissions
```

### Health check fails

```bash
# Test endpoints manually
curl http://localhost:7071/actuator/health
curl http://localhost:7070

# Check if services are running
sudo systemctl status 11of-backend.service
sudo systemctl status 11of-frontend.service
```

### Deployment fails

```bash
# Check GitHub Actions runner logs
cd actions-runner
cat _diag/Runner_*.log

# Check if scripts are executable
ls -la /opt/11of/scripts/

# Check sudo permissions
sudo -l -U 11of-app
```

## Security Notes

✅ Secrets never committed to repository
✅ Dedicated `11of-app` user with minimal sudo permissions
✅ Systemd security hardening enabled
✅ File permissions properly configured
✅ Environment files readable only by app user

## Maintenance

### Log Rotation

Logs are automatically appended. Set up logrotate:

```bash
sudo nano /etc/logrotate.d/11of
```

Add:
```
/opt/11of/*/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 11of-app 11of-app
}
```

### Database Backups

Set up automated MySQL backups:

```bash
#!/bin/bash
mysqldump -u elevenof -p'your-password' elevenof_db | gzip > /opt/11of/backups/db-$(date +%Y%m%d).sql.gz
```

Add to crontab:
```bash
0 2 * * * /opt/11of/scripts/backup-db.sh
```

## Support

For issues or questions, check:
- Application logs in `/opt/11of/*/logs/`
- Systemd logs with `journalctl`
- GitHub Actions workflow runs
