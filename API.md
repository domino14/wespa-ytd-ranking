# WESPA YTD Rankings API

A REST API for accessing WESPA Year-to-Date tournament rankings data.

## Base URL

- **Production**: `https://wespa-ytd.xword.club/api`
- **Development**: `http://localhost:8787/api`

## Authentication

All endpoints are publicly accessible and do not require authentication.

## Endpoints

### Get Available Seasons

Get a list of all configured tournament seasons.

**Endpoint:** `GET /seasons`

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "2024-2025",
    "start_date": "2024-09-01",
    "end_date": "2025-08-31",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "2023-2024",
    "start_date": "2023-09-01",
    "end_date": "2024-08-31",
    "is_active": false,
    "created_at": "2023-01-15T10:30:00Z",
    "updated_at": "2023-01-15T10:30:00Z"
  }
]
```

**Fields:**
- `id`: Unique identifier for the season (UUID)
- `name`: Display name for the season (e.g., "2024-2025", "Summer 2025")
- `start_date`: Season start date (YYYY-MM-DD)
- `end_date`: Season end date (YYYY-MM-DD)
- `is_active`: Whether this is the currently active season
- `created_at`: When the season was created
- `updated_at`: When the season was last modified

---

### Get Standings by Season

Get YTD standings for a specific season.

**Endpoint:** `GET /standings/{year_config_id}`

**Parameters:**
- `year_config_id`: The UUID of the season configuration

**Response:**
```json
[
  {
    "player_name": "John Doe",
    "total_points": 15500,
    "tournaments_played": 8,
    "best_finish": 2,
    "last_updated": "2025-01-15T10:30:00Z"
  },
  {
    "player_name": "Jane Smith",
    "total_points": 14200,
    "tournaments_played": 6,
    "best_finish": 1,
    "last_updated": "2025-01-15T10:30:00Z"
  }
]
```

**Fields:**
- `player_name`: Player's full name
- `total_points`: Total points earned in the season
- `tournaments_played`: Number of tournaments participated in
- `best_finish`: Best position achieved in any tournament
- `last_updated`: When the standings were last calculated

---

### Get Current Season Standings

Get YTD standings for the currently active season.

**Endpoint:** `GET /standings/current`

**Response:** Same format as `/standings/{year_config_id}` but automatically uses the active season.

**Error Response** (if no active season):
```json
{
  "error": "No active year configured"
}
```

---

### Get Tournament List (Legacy)

Fetch tournament data from WESPA for a date range.

**Endpoint:** `POST /tournaments`

**Request Body:**
```json
{
  "startyear": "2024",
  "endyear": "2025",
  "state": "",
  "partname": ""
}
```

**Response:** Raw HTML from WESPA website

---

### Get Tournament Results (Legacy)

Fetch specific tournament results from WESPA.

**Endpoint:** `GET /tournament/{tournament_id}`

**Parameters:**
- `tournament_id`: WESPA tournament ID number

**Response:** Raw HTML from WESPA website

## Error Responses

All errors return JSON with the following format:

```json
{
  "error": "Error description",
  "message": "Detailed error message (optional)"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (missing or invalid parameters)
- `404`: Not Found (season/tournament doesn't exist)
- `500`: Internal Server Error

## Caching

- **Seasons** (`/seasons`): Cached for 5 minutes
- **Standings** (`/standings/*`): Cached for 3 minutes
- **Tournament data**: No caching (proxied directly from WESPA)

## Rate Limiting

The API runs on Cloudflare Workers with the following limits:
- **Free tier**: 100,000 requests per day
- **Burst**: 1,000 requests per minute

## CORS

All endpoints include CORS headers allowing access from any origin:
```
Access-Control-Allow-Origin: *
```

## Example Usage

### JavaScript/TypeScript

```javascript
// Get available seasons
const seasons = await fetch('https://wespa-ytd.xword.club/api/seasons')
  .then(res => res.json());

// Get current standings
const standings = await fetch('https://wespa-ytd.xword.club/api/standings/current')
  .then(res => res.json());

// Get specific season standings
const seasonId = '550e8400-e29b-41d4-a716-446655440000';
const seasonStandings = await fetch(`https://wespa-ytd.xword.club/api/standings/${seasonId}`)
  .then(res => res.json());
```

### cURL

```bash
# Get seasons
curl https://wespa-ytd.xword.club/api/seasons

# Get current standings
curl https://wespa-ytd.xword.club/api/standings/current

# Get specific season standings
curl https://wespa-ytd.xword.club/api/standings/550e8400-e29b-41d4-a716-446655440000
```

## Notes

- Standings are cached and updated when an admin recalculates them
- Season dates can be any range (not necessarily calendar years)
- Player names are as recorded in WESPA tournament results
- Points are calculated based on tournament category and finishing position
- The API is read-only; no endpoints for modifying data