# 🔄 Migration Guide: PostgreSQL → Supabase

If you previously had the backend running with raw PostgreSQL, here's how to migrate to Supabase.

---

## 📋 What Changed

- **Database Client**: `pg` package → `@supabase/supabase-js`
- **Connection**: Connection string → Supabase URL + Service Key
- **Setup**: Manual PostgreSQL → Supabase hosted
- **All logic remains the same**: No business logic changes!

---

## 🚀 Quick Migration Steps

### 1. Install New Dependency

```bash
# Remove old PostgreSQL package
npm uninstall pg

# Install Supabase client
npm install @supabase/supabase-js@^2.39.0
```

### 2. Create Supabase Project

Follow the [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) guide to:
- Create a new Supabase project
- Run the `schema.sql` in SQL Editor
- Get your credentials

### 3. Update Environment Variables

**Old `.env`:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/backend_orchestrator
```

**New `.env`:**
```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Migrate Data (Optional)

If you had existing users/keys in PostgreSQL:

#### Export from PostgreSQL

```bash
# Export users
psql -d backend_orchestrator -c "COPY users TO STDOUT CSV HEADER" > users.csv

# Export keys
psql -d backend_orchestrator -c "COPY user_llm_keys TO STDOUT CSV HEADER" > keys.csv
```

#### Import to Supabase

1. Go to Supabase Dashboard → Table Editor
2. Select `users` table → Import Data → Upload `users.csv`
3. Select `user_llm_keys` table → Import Data → Upload `keys.csv`

**OR** use SQL Editor:

```sql
-- Import users
COPY users(user_id, email, created_at)
FROM '/path/to/users.csv'
DELIMITER ','
CSV HEADER;

-- Import keys
COPY user_llm_keys(user_id, provider, encrypted_key, created_at, updated_at)
FROM '/path/to/keys.csv'
DELIMITER ','
CSV HEADER;
```

### 5. Test the Migration

```bash
# Start server
npm run dev

# You should see:
# ✅ Connected to Supabase database
# ✅ Database schema verified
```

### 6. Clean Up (Optional)

```bash
# Stop local PostgreSQL if you're not using it anymore
# Or keep it for local development
```

---

## 🔍 Code Changes Summary

Only **one file** changed: `db.js`

**Key differences:**

### Before (PostgreSQL)
```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
```

### After (Supabase)
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('user_id', userId)
  .single();
```

---

## ✅ Benefits of Supabase

### Before (Raw PostgreSQL)
- ❌ Manual setup and maintenance
- ❌ Need to manage backups
- ❌ No built-in dashboard
- ❌ Need separate hosting
- ❌ Manual connection pooling

### After (Supabase)
- ✅ Instant setup (2 minutes)
- ✅ Automatic backups
- ✅ Beautiful dashboard
- ✅ Hosted and managed
- ✅ Built-in connection pooling
- ✅ Free tier (500MB DB, 2GB bandwidth)
- ✅ Real-time capabilities (if needed later)
- ✅ Row-level security built-in

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"

```bash
npm install @supabase/supabase-js@^2.39.0
```

### Error: "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY"

Check your `.env` file has both:
```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

### Error: "PGRST116 - table not found"

Run `schema.sql` in Supabase SQL Editor:
1. Go to SQL Editor
2. Paste entire `schema.sql`
3. Click "Run"

### Data didn't migrate properly

Check:
- CSV export was successful
- Column names match exactly
- Dates are in ISO format
- No special characters in data

---

## 🎯 What Stays the Same

✅ All API endpoints
✅ Authentication flow
✅ LLM logic
✅ MCP integration
✅ Encryption/decryption
✅ Session management
✅ All business logic

**Only the database client changed!**

---

## 📊 Performance Comparison

| Metric | PostgreSQL | Supabase |
|--------|-----------|----------|
| **Setup Time** | 30+ min | 2 min |
| **Query Performance** | Fast | Fast (same engine!) |
| **Scaling** | Manual | Auto |
| **Backups** | Manual | Auto |
| **Monitoring** | Need tools | Built-in |
| **Cost (dev)** | Free (self-host) | Free (500MB) |

---

## 🚀 Next Steps

After migration:

1. **Test all endpoints** with your Chrome extension
2. **Verify data encryption** works correctly
3. **Check Google OAuth** flow end-to-end
4. **Monitor Supabase Dashboard** for usage
5. **Set up RLS policies** if needed (optional)

---

## ❓ FAQ

**Q: Do I need to change my Chrome extension?**

No! All API endpoints remain the same.

---

**Q: Will my existing session tokens work?**

Yes! Sessions are stored in memory, not database.

---

**Q: Can I keep using PostgreSQL?**

Yes! The old code is available in git history. But Supabase is recommended for ease of use.

---

**Q: What about costs?**

Supabase free tier includes:
- 500 MB database
- 2 GB bandwidth
- 50 MB file storage
- Unlimited API requests

Perfect for development and small production use!

---

**Q: Is Supabase secure?**

Yes! It's PostgreSQL with:
- SSL connections
- Row-level security
- Service role authentication
- SOC 2 Type 2 compliant

---

## 📚 Resources

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL vs Supabase](https://supabase.com/docs/guides/database/postgres)

---

Need help? Check the main [README.md](./README.md) or create an issue!
