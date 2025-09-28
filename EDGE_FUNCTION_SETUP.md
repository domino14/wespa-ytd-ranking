# Supabase Edge Function Setup Guide

This guide explains how to deploy and manage the YTD calculation Edge Function.

## 📋 Prerequisites

1. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   ```

2. **Docker** installed (required for local testing)

3. **Your Supabase project** credentials

## 🚀 Initial Setup

### Step 1: Initialize Supabase (if not already done)

```bash
# In your project root
supabase init
```

### Step 2: Link to your Supabase project

```bash
# Get your project reference ID from Supabase dashboard
supabase link --project-ref YOUR_PROJECT_REF

# You'll be prompted for your database password
```

### Step 3: Set up environment variables

Create `.env.local` file in the project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PROXY_URL=https://wespa-ytd.xword.club/api
```

## 📦 Deploying the Edge Function

### Deploy to Supabase

```bash
# Deploy the calculate-ytd function
supabase functions deploy calculate-ytd

# Set environment secrets
supabase secrets set PROXY_URL=https://wespa-ytd.xword.club/api
```

The service role key is automatically available in Edge Functions, no need to set it.

### Verify Deployment

```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs calculate-ytd
```

## 🧪 Testing

### Local Testing

```bash
# Start local Supabase stack
supabase start

# Serve the function locally
supabase functions serve calculate-ytd --env-file .env.local

# In another terminal, test the function
curl -L -X POST 'http://localhost:54321/functions/v1/calculate-ytd' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{"yearConfigId": "YOUR_YEAR_CONFIG_UUID"}'
```

### Remote Testing

```bash
# Test deployed function
curl -L -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/calculate-ytd' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{"yearConfigId": "YOUR_YEAR_CONFIG_UUID"}'
```

## 🔄 Updating the Function

After making changes to `supabase/functions/calculate-ytd/index.ts`:

```bash
# Redeploy the function
supabase functions deploy calculate-ytd

# Monitor logs to ensure it's working
supabase functions logs calculate-ytd --tail
```

## 📊 Monitoring

### View Logs

```bash
# Stream logs in real-time
supabase functions logs calculate-ytd --tail

# View last 100 logs
supabase functions logs calculate-ytd --limit 100

# Filter logs by level
supabase functions logs calculate-ytd --level error
```

### Check Function Metrics

In Supabase Dashboard:
1. Go to **Functions** section
2. Click on `calculate-ytd`
3. View invocations, duration, and errors

## 🐛 Troubleshooting

### Common Issues

#### 1. "Function not found" Error
- Ensure function is deployed: `supabase functions list`
- Check function name is correct

#### 2. "Unauthorized" Error
- Verify anon key is correct
- Ensure RLS policies allow function access

#### 3. "Timeout" Error
- Edge Functions have a 150-second timeout by default
- For very large datasets, consider processing in batches

#### 4. "CORS" Error
- The function includes CORS headers
- Check that your frontend URL is allowed

### Debug Mode

Add console.log statements in the function for debugging:

```typescript
console.log('Processing tournament:', tournament.name)
```

Then view logs:
```bash
supabase functions logs calculate-ytd --tail
```

## 🔒 Security Notes

1. **Service Role Key**: Never expose this in client code
2. **RLS Policies**: The function bypasses RLS using service role
3. **Rate Limiting**: Consider adding rate limiting for production

## 📈 Performance Optimization

### Current Performance

- **Small dataset** (< 10 tournaments): ~5 seconds
- **Medium dataset** (10-30 tournaments): ~15 seconds
- **Large dataset** (30+ tournaments): ~30-60 seconds

### Optimization Tips

1. **Caching**: Tournament results are cached after first fetch
2. **Batch Operations**: Players and results are inserted in batches
3. **Parallel Processing**: Consider using Promise.all for tournaments

## 🔑 Environment Variables Summary

| Variable | Where to Set | Description |
|----------|--------------|-------------|
| `SUPABASE_URL` | Automatic | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Automatic | Service role key (built-in) |
| `PROXY_URL` | `supabase secrets set` | Cloudflare Worker URL for WESPA proxy |

## 📝 Function Details

**Endpoint**: `https://YOUR_PROJECT.supabase.co/functions/v1/calculate-ytd`

**Method**: `POST`

**Headers**:
```
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json
```

**Body**:
```json
{
  "yearConfigId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully calculated YTD standings for 150 players",
  "playerCount": 150,
  "tournamentCount": 20
}
```

## 🚨 Important Notes

1. **Invocation Limits**: 500,000 free invocations per month
2. **Execution Time**: No hard limit, but billed by GB-seconds
3. **Memory**: 256MB default (can be increased if needed)
4. **Logs Retention**: 7 days on free tier, 90 days on paid

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)