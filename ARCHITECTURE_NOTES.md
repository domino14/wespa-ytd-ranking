# Architecture Considerations for YTD Calculations

## Current Issues & Solutions

### 1. ✅ **Fixed: Player Data Extraction**
- **Before**: Used position as player ID, placeholder names
- **After**: Properly extracts WESPA player IDs and names from HTML
- **Optimization**: Batch upserts for better performance

### 2. ❌ **Missing: Database Transactions**

Currently, the YTD calculation doesn't use transactions, which could lead to:
- Partial data if process fails mid-way
- Inconsistent state between players and results tables
- Race conditions if multiple admins compute simultaneously

**Supabase Transaction Limitations:**
- Supabase doesn't support client-side transactions via REST API
- Options:
  1. Use Supabase Edge Functions (supports transactions)
  2. Use database functions/stored procedures
  3. Implement idempotent operations with cleanup

### 3. ⚠️ **Performance & Timeout Concerns**

## Cloudflare Workers Limits

**Free Tier:**
- **CPU Time**: 10ms per request (very tight!)
- **Duration**: 30 seconds max wall time
- **Memory**: 128MB
- **Subrequests**: 50 per request

**Paid Tier ($5/month):**
- **CPU Time**: 30 seconds
- **Duration**: 30 seconds max wall time
- **Memory**: 128MB
- **Subrequests**: 1000 per request

## Supabase Edge Functions Limits

**Free Tier:**
- **Invocations**: 500K/month
- **Duration**: No hard limit (but billed by GB-seconds)
- **Memory**: 256MB default
- **Better for**: Long-running operations, database transactions

## Current YTD Calculation Profile

For a typical year with ~20 tournaments:
1. Fetch tournaments from DB: ~100ms
2. For each tournament without results:
   - Fetch from WESPA API: ~500ms
   - Parse HTML: ~50ms
   - Upsert players: ~200ms
   - Insert results: ~300ms
3. Calculate points: ~500ms
4. Save standings: ~200ms

**Total time**: 5-30 seconds depending on cached data

## Recommended Architecture

### Option 1: Supabase Edge Function (Recommended)

```typescript
// supabase/functions/calculate-ytd/index.ts
import { createClient } from '@supabase/supabase-js'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const supabase = createClient(...)

  // Use database transaction
  const { data, error } = await supabase.rpc('calculate_ytd_standings', {
    year_config_id: req.body.yearConfigId
  })

  return new Response(JSON.stringify({ success: !error }))
})
```

**Benefits:**
- Proper transaction support
- No timeout issues
- Can run for minutes if needed
- Direct database access

### Option 2: Database Stored Procedure

```sql
CREATE OR REPLACE FUNCTION calculate_ytd_standings(p_year_config_id UUID)
RETURNS TABLE(player_id UUID, total_points INT)
LANGUAGE plpgsql
AS $$
BEGIN
  -- All calculation logic in SQL
  -- Automatic transaction handling
  -- Best performance
END;
$$;
```

**Benefits:**
- Fastest execution
- Automatic transaction
- No network overhead

**Drawbacks:**
- Complex logic in SQL
- Harder to maintain
- Can't fetch from external APIs

### Option 3: Queue-Based Processing (Advanced)

```typescript
// Frontend initiates
await supabase.from('ytd_jobs').insert({
  year_config_id: yearId,
  status: 'pending'
})

// Background worker processes
// Could use Cloudflare Queues, Supabase Realtime, or cron
```

**Benefits:**
- Non-blocking UI
- Retry on failure
- Progress tracking

## Immediate Improvements (Without Major Refactor)

### 1. Add Idempotency

```typescript
// Clear before recalculating
await supabase
  .from('tournament_results')
  .delete()
  .eq('tournament_id', tournament.id)

// Then insert fresh data
```

### 2. Add Progress Feedback

```typescript
onProgress?.(current, total, `Processing ${tournament.name}...`)
```

### 3. Implement Chunking

```typescript
// Process tournaments in batches of 5
const chunks = chunk(tournaments, 5)
for (const batch of chunks) {
  await Promise.all(batch.map(processTournament))
}
```

### 4. Add Error Recovery

```typescript
const failedTournaments = []
for (const tournament of tournaments) {
  try {
    await processTournament(tournament)
  } catch (error) {
    failedTournaments.push(tournament)
    continue // Don't stop entire process
  }
}
```

## Recommendation

**For MVP**: Keep current architecture but add:
- Progress indicators
- Error recovery
- Idempotent operations

**For Production**: Move to Supabase Edge Function:
- Proper transactions
- No timeout issues
- Better error handling
- Background processing capability

**Long-term**: Consider queue-based system for:
- Multiple concurrent calculations
- Scheduled updates
- Audit trail