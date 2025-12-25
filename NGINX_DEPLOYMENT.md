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
    
    # IMPORTANT: Tell Next.js it's being served under /cardgames
    proxy_set_header X-Forwarded-Prefix /cardgames;
    
    # WebSocket support (for Socket.IO)
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # Prevent caching issues
    proxy_cache_bypass $http_upgrade;
    
    # Disable redirect rewriting
    proxy_redirect off;
}
```

## Deployment Instructions

### 1. On the server, update the environment variable:
```bash
cd /path/to/Thaas
echo "NEXT_PUBLIC_BASE_PATH=/cardgames" >> .env
```

### 2. Rebuild and restart the containers:
```bash
docker compose down
docker compose up -d --build
```

### 3. Update nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/innovitecho.cloud
# Paste the location block above
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### 4. Verify deployment:

**Test direct IP access (should still work):**
```bash
curl -I http://72.60.42.121:5003/
```

**Test subpath access:**
```bash
curl -I http://innovitecho.cloud/cardgames/
```

**Browser test:**
- Open http://innovitecho.cloud/cardgames/
- Check DevTools → Network tab
- Confirm CSS/JS files load from `/cardgames/_next/...`

## How it works:

1. **Direct IP access (http://72.60.42.121:5003/)**: 
   - No `NEXT_PUBLIC_BASE_PATH` set → Next.js uses root path
   - Works normally

2. **Nginx subpath (http://innovitecho.cloud/cardgames/)**:
   - `NEXT_PUBLIC_BASE_PATH=/cardgames` set in production env
   - nginx preserves the `/cardgames` prefix (no trailing slash in proxy_pass)
   - Next.js generates all URLs with `/cardgames` prefix
   - Assets, routes, and links all work correctly

## Troubleshooting:

If assets still don't load:
1. Check browser console for 404s
2. Verify `NEXT_PUBLIC_BASE_PATH` is set: `docker compose exec frontend env | grep BASE_PATH`
3. Rebuild after env changes: `docker compose up -d --build frontend`
4. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
