# nginx Configuration for Card Game App

## Add this to your nginx server block (e.g., /etc/nginx/sites-available/innovitecho.cloud)

```nginx
# Card Game - accessible at http://innovitecho.cloud/cardgames/
location /cardgames/ {
    # NO trailing slash - preserve the /cardgames prefix
    proxy_pass http://127.0.0.1:5003;
    
    proxy_http_version 1.1;
    
    # Standard proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket support (for Socket.IO)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Prevent caching issues
    proxy_cache_bypass $http_upgrade;
    
    # Disable redirect rewriting
    proxy_redirect off;
}

# Backend API
location /cardgames/api/ {
    proxy_pass http://127.0.0.1:5004/;
    
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Deployment Instructions

### 1. Update nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/innovitecho.cloud
# Paste the location blocks above
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### 2. On the server, rebuild and restart the containers:
```bash
cd /path/to/Thaas
docker compose down
docker compose up -d --build
```

### 3. Verify deployment:

**Test subpath access:**
```bash
curl -I http://innovitecho.cloud/cardgames/
```

**Browser test:**
- Open http://innovitecho.cloud/cardgames/
- Check DevTools → Network tab
- Confirm CSS/JS files load from `/cardgames/_next/...`

## Important Notes:

- The app is now **configured for production deployment only** with `basePath: '/cardgames'`
- For local development on your machine (Windows), use `npm run dev:local` to remove basePath
- The production build is optimized for nginx subpath deployment at `/cardgames/`
