# Database Migration Setup Guide

## Local Development (Windows)

1. **Create .env file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit .env with your local database credentials:**
   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=thaas_db
   ```

3. **Generate and run migrations:**
   ```bash
   npm run migration:generate -- src/migrations/AddGameHistory
   npm run migration:run
   ```

4. **Uncomment game history code** in:
   - `backend/src/game/game.module.ts`
   - `backend/src/game/game.service.ts`

## Ubuntu Server (Production)

### 1. SSH into your server:
```bash
ssh user@your-server-ip
```

### 2. Navigate to backend directory:
```bash
cd /path/to/Thaas/backend
```

### 3. Create .env file with Docker PostgreSQL connection:
```bash
nano .env
```

Add the following (adjust based on your Docker setup):
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=thaas_db
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
PORT=8080
```

**If PostgreSQL is in a Docker container**, you might need:
- Use the Docker container name as host: `DATABASE_HOST=postgres-container-name`
- Or use the Docker network IP
- Or map the port and use localhost

### 4. Check Docker PostgreSQL connection:
```bash
# Get container name
docker ps

# Get container IP (if needed)
docker inspect postgres-container-name | grep IPAddress

# Test connection
docker exec -it postgres-container-name psql -U postgres -d thaas_db
```

### 5. Install dependencies (if not already):
```bash
npm install
```

### 6. Generate migration:
```bash
npm run migration:generate -- src/migrations/AddGameHistory
```

### 7. Run migration:
```bash
npm run migration:run
```

### 8. Uncomment game history code:
```bash
# Edit these files and remove the comment markers (/* */ and //)
nano src/game/game.module.ts
nano src/game/game.service.ts
```

### 9. Rebuild and restart the app:
```bash
npm run build
pm2 restart all  # or however you're running the app
```

## Docker Network Setup (If Backend is Also in Docker)

If both backend and PostgreSQL are in Docker containers:

### Option 1: Docker Compose (Recommended)
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: thaas_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: postgres
      DATABASE_PASSWORD: your_password
      DATABASE_NAME: thaas_db
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Then run migrations:
```bash
docker-compose exec backend npm run migration:run
```

### Option 2: Existing Docker Network
```bash
# Find the network
docker network ls

# Connect backend to PostgreSQL network
docker network connect postgres-network backend-container

# Use container name as DATABASE_HOST
DATABASE_HOST=postgres-container-name
```

## Verification

After running migrations, verify the table was created:

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d thaas_db

# List tables
\dt

# You should see 'game_history' table
# Exit
\q
```

## Troubleshooting

### Migration fails with "relation already exists"
```bash
# Revert the migration
npm run migration:revert

# Then run again
npm run migration:run
```

### Cannot connect to PostgreSQL
1. Check if PostgreSQL is running: `docker ps | grep postgres`
2. Check port mapping: `docker port postgres-container-name`
3. Verify .env DATABASE_HOST matches container name/IP
4. Check firewall rules
5. Try connecting directly: `psql -h DATABASE_HOST -U postgres -d thaas_db`

### TypeORM CLI not working
Install ts-node globally if needed:
```bash
npm install -g ts-node
```
