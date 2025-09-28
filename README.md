# WESPA Year-to-Date Ranking System

A web application for managing and displaying Year-to-Date rankings for the World English Scrabble Players Association (WESPA) tournaments.

## Features

- **Tournament Management**: Fetch and categorize WESPA tournaments by year
- **Category Tagging**: Tag tournaments as Platinum/Majors, Gold, Silver, Bronze, or Invitational
- **Season Management**: Configure custom season dates (doesn't have to be calendar year)
- **YTD Calculations**: Automatically calculate player standings based on tournament results
- **Multi-Season Support**: View rankings for different seasons/years
- **Public Rankings**: Display current YTD standings with season selection
- **Admin Interface**: Secure admin panel for managing tournaments, seasons, and points
- **Serverless Architecture**: Built with Cloudflare Workers for CORS proxy

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Library**: Mantine UI
- **Backend**: Supabase (PostgreSQL)
- **Proxy**: Cloudflare Workers
- **Hosting**: Can be deployed to any static hosting service

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account
- Cloudflare account (for Workers)

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in the SQL editor
3. Get your project URL and anon key from Settings > API
4. Enable authentication for admin users

### 3. Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Development

Run the React app:
```bash
npm run dev
```

Run the Cloudflare Worker locally:
```bash
npm run worker:dev
```

### 6. Deployment

#### Deploy the Worker to Cloudflare:
```bash
npm run worker:deploy
```

#### Build the React app:
```bash
npm run build
```

The `dist` folder can be deployed to any static hosting service.

## Usage

### Admin Panel

1. Navigate to `/login`
2. Sign in with your Supabase admin credentials
3. **Settings Tab**: Configure season dates (e.g., "2025 Season" from 2024-09-01 to 2025-08-31)
4. **Tournaments Tab**: Set the active year, load tournaments, and tag them with categories
5. **Points Table Tab**: Customize the points awarded for each position and tournament category
6. Click "Save & Compute YTD" to calculate standings for the active season

### Public Rankings

- The main page (`/`) displays YTD standings with season selection
- Use the season dropdown to view rankings for different years
- Search for specific players using the search bar
- Rankings are cached and update when admin computes new standings

## API Endpoints (Cloudflare Worker)

- `POST /api/tournaments` - Fetch tournament list from WESPA
- `GET /api/tournament/:id` - Fetch specific tournament results

## Points System

The points awarded for each position and tournament category are stored in the database (`points_config` table) and can be managed through the admin interface. The default values follow WESPA's standard points distribution but can be customized as needed.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is for use by WESPA and affiliated organizations.
