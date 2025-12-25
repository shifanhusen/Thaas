# nginx Configuration for Card Game App

## Add this to your nginx server block (SAME AS FUTPOINTS)

```nginx
# Card Game - with trailing slash (strips /cardgames prefix like futpoints does)
location /cardgames/ {
    proxy_pass http://127.0.0.1:5003/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Deployment Instructions

### On the server:

```bash
cd /root/Thaas  # or your Thaas directory

# Pull latest changes
git pull

# Rebuild containers
docker compose down
docker compose up -d --build

# Nginx should already be configured - just reload
sudo systemctl reload nginx
```

### Verify:
```bash
curl -I http://innovitecho.cloud/cardgames/
```

## How it works (SAME AS FUTPOINTS):

- nginx config: `proxy_pass http://127.0.0.1:5003/;` (trailing slash strips `/cardgames`)
- Request: `http://innovitecho.cloud/cardgames/games/bondi`
- Proxied to: `http://127.0.0.1:5003/games/bondi` (prefix removed)
- Next.js serves from root path (no basePath needed)
