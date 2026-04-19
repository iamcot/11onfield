# Running on Port 80

The frontend app is configured to run on port 80 (default HTTP port).

## Important Notes

### Running on Port 80 Requires Elevated Permissions

Port 80 is a privileged port on Unix-based systems (macOS, Linux). You'll need to run the app with elevated permissions:

### Development Mode

```bash
# Option 1: Using sudo (macOS/Linux)
sudo npm run dev

# Option 2: Using sudo with environment preservation
sudo -E npm run dev
```

### Production Mode

```bash
# Build first
npm run build

# Then start with sudo
sudo npm run start
```

## Alternative: Use Port 3000 (No Sudo Required)

If you don't want to use sudo, you can change back to port 3000:

```json
// package.json
"scripts": {
  "dev": "next dev",
  "start": "next start"
}
```

Then the app will run on: http://localhost:3000

## Alternative: Use Port Forwarding

Instead of running on port 80 directly, you can:

1. Run the app on port 3000 (no sudo needed)
2. Use nginx or another reverse proxy to forward port 80 to 3000

### Using nginx (macOS with Homebrew)

```bash
# Install nginx
brew install nginx

# Configure nginx to proxy port 80 to 3000
# Edit /usr/local/etc/nginx/nginx.conf
```

### Simple iptables redirect (Linux)

```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
```

## Current Configuration

- **Dev server**: http://localhost:80 (requires sudo)
- **Production server**: http://localhost:80 (requires sudo)
- **API URL**: Configured in `/src/config/app.config.ts`
