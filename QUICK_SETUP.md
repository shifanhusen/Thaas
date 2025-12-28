# Quick Setup - Game History Database

## Step 1: Run SQL in pgAdmin 4

1. Open **pgAdmin 4**
2. Connect to your PostgreSQL database
3. Open **Query Tool** (Tools > Query Tool)
4. Copy and paste the entire content from `create_game_history_table.sql`
5. Click **Execute** (F5)
6. You should see: "CREATE TABLE" and "CREATE INDEX" messages

## Step 2: Verify Table Created

Run this query in pgAdmin:
```sql
SELECT * FROM game_history LIMIT 1;
```

You should see the table structure (even if empty).

## Step 3: Restart Your App

On your Ubuntu server:
```bash
cd /path/to/Thaas/backend
git pull
npm run build
pm2 restart all
```

That's it! The game history feature is now active. ✅

---

## What This Does

- Game history is automatically saved when games finish
- Access history at: `http://your-domain:8080/game-history`
- Frontend history page at: `/history`
