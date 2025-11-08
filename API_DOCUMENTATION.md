# WESPA YTD Rankings API Documentation

## Base URL
```
https://wespa-proxy.delsolar.workers.dev/api
```

## Overview
The WESPA YTD Rankings API provides access to year-to-date tournament standings and season information. All endpoints support CORS and return JSON responses.

## Endpoints

### 1. Get Available Seasons
First, call this endpoint to retrieve all available seasons and their SeasonIDs.

**Endpoint:** `GET /seasons`

**Example Request:**
```bash
curl https://wespa-proxy.delsolar.workers.dev/api/seasons
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "2025",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "is_active": true
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "2024",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "is_active": false
  }
]
```

**Response Fields:**
- `id` (string) - SeasonID, use this to query specific season standings
- `name` (string) - Display name for the season
- `start_date` (string) - Season start date (YYYY-MM-DD)
- `end_date` (string) - Season end date (YYYY-MM-DD)
- `is_active` (boolean) - Whether this is the currently active season

**Caching:** 5 minutes

---

### 2. Get Current Season Standings (Recommended)
Use this endpoint to get standings for the default/active season without needing a SeasonID.

**Endpoint:** `GET /standings/current`

**Example Request:**
```bash
curl https://wespa-proxy.delsolar.workers.dev/api/standings/current
```

**Response:**
```json
[
  {
    "player_name": "John Doe",
    "total_points": 1250,
    "tournaments_played": 5,
    "best_finish": 1,
    "last_updated": "2025-11-07T12:00:00Z",
    "wespa_id": 1234
  },
  {
    "player_name": "Jane Smith",
    "total_points": 980,
    "tournaments_played": 4,
    "best_finish": 2,
    "last_updated": "2025-11-07T12:00:00Z",
    "wespa_id": 5678
  }
]
```

**Response Fields:**
- `player_name` (string) - Player's full name
- `total_points` (number) - Total YTD points accumulated
- `tournaments_played` (number) - Number of tournaments participated in
- `best_finish` (number) - Best finishing position (1 = first place)
- `last_updated` (string) - ISO 8601 timestamp of last data update
- `wespa_id` (number) - Player's WESPA ID

**Sorting:** Results are ordered by `total_points` descending (highest ranked first)

**Caching:** 3 minutes

---

### 3. Get Specific Season Standings
Use this endpoint with a SeasonID from the `/seasons` endpoint to retrieve standings for a particular season.

**Endpoint:** `GET /standings/{SeasonID}`

**Example Request:**
```bash
curl https://wespa-proxy.delsolar.workers.dev/api/standings/550e8400-e29b-41d4-a716-446655440000
```

**Response:** Same format as endpoint 2 (Current Season Standings)

**Caching:** 3 minutes

---

### 4. Get Tournament Info by ID
Retrieve detailed information about a specific tournament, including its category.

**Endpoint:** `GET /tournament-info/{ID}`

**URL Parameters:**
- `ID` - Can be either:
  - Tournament UUID (internal database ID), OR
  - WESPA Tournament ID (numeric)

**Example Request (using WESPA ID):**
```bash
curl https://wespa-proxy.delsolar.workers.dev/api/tournament-info/12345
```

**Example Request (using UUID):**
```bash
curl https://wespa-proxy.delsolar.workers.dev/api/tournament-info/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "wespa_id": 12345,
  "name": "World Scrabble Championship 2025",
  "date": "2025-08-15",
  "category": "platinum",
  "url": "https://wespa.org/aardvark/html/tournaments/12345.html",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T12:00:00Z"
}
```

**Response Fields:**
- `id` (string) - Internal UUID
- `wespa_id` (number) - WESPA tournament identifier
- `name` (string) - Tournament name
- `date` (string) - Tournament date (YYYY-MM-DD)
- `category` (string|null) - Tournament category: `platinum`, `gold`, `silver`, `bronze`, or `invitational`. `null` if not categorized.
- `url` (string) - Link to WESPA tournament page
- `created_at` (string) - ISO 8601 timestamp
- `updated_at` (string) - ISO 8601 timestamp

**Error Response (404):**
```json
{
  "error": "Tournament not found"
}
```

**Caching:** 3 minutes

---

### 5. Get Recent Categorized Tournaments
Retrieve a list of recent tournaments that have been categorized/tagged.

**Endpoint:** `GET /tournaments/categorized`

**Query Parameters (all optional):**
- `limit` (number) - Maximum number of tournaments to return (default: 10, max: 100)
- `category` (string) - Filter by specific category: `platinum`, `gold`, `silver`, `bronze`, or `invitational`
- `year` (number) - Filter by year (e.g., 2025)

**Example Requests:**
```bash
# Get 10 most recent categorized tournaments
curl https://wespa-proxy.delsolar.workers.dev/api/tournaments/categorized

# Get 20 most recent platinum tournaments
curl https://wespa-proxy.delsolar.workers.dev/api/tournaments/categorized?limit=20&category=platinum

# Get all categorized tournaments from 2025
curl https://wespa-proxy.delsolar.workers.dev/api/tournaments/categorized?year=2025&limit=100

# Get gold tournaments from 2024
curl https://wespa-proxy.delsolar.workers.dev/api/tournaments/categorized?category=gold&year=2024
```

**Response:**
```json
{
  "count": 10,
  "tournaments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "wespa_id": 12345,
      "name": "World Scrabble Championship 2025",
      "date": "2025-08-15",
      "category": "platinum",
      "url": "https://wespa.org/aardvark/html/tournaments/12345.html",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-15T12:00:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "wespa_id": 67890,
      "name": "National Championship 2025",
      "date": "2025-07-20",
      "category": "gold",
      "url": "https://wespa.org/aardvark/html/tournaments/67890.html",
      "created_at": "2025-01-02T00:00:00Z",
      "updated_at": "2025-01-16T12:00:00Z"
    }
  ]
}
```

**Response Fields:**
- `count` (number) - Number of tournaments returned
- `tournaments` (array) - Array of tournament objects (see endpoint 4 for field descriptions)

**Sorting:** Results are ordered by tournament `date` descending (most recent first)

**Note:** Only returns tournaments that have been categorized (tournaments with `category = null` are excluded)

**Error Response (invalid category):**
```json
{
  "error": "Invalid category",
  "valid_categories": ["platinum", "gold", "silver", "bronze", "invitational"]
}
```

**Caching:** 3 minutes

---

## Typical Usage Flow

1. **Get available seasons** (optional, if you need to list seasons):
   ```bash
   curl https://wespa-proxy.delsolar.workers.dev/api/seasons
   ```

2. **Get current standings** (most common use case):
   ```bash
   curl https://wespa-proxy.delsolar.workers.dev/api/standings/current
   ```

3. **Get historical season** (using SeasonID from step 1):
   ```bash
   curl https://wespa-proxy.delsolar.workers.dev/api/standings/{SeasonID}
   ```

## CORS Support
All endpoints include:
```
Access-Control-Allow-Origin: *
```

This allows requests from any domain.

## Rate Limiting
No explicit rate limiting is currently enforced, but please be respectful with request frequency. Response caching is recommended.
