# Knock Segment RETL Adapter

A minimal Next.js adapter that bridges **Segment Reverse ETL** with **Knock static audiences**. Deploy to Vercel and connect Segment to sync audience membership to Knock.

## Overview

This adapter exposes two endpoints that Segment Reverse ETL can call:

| Endpoint                                           | Purpose                              |
| -------------------------------------------------- | ------------------------------------ |
| `POST /api/segment/audiences/:audience_key/add`    | Add members to a Knock audience      |
| `POST /api/segment/audiences/:audience_key/remove` | Remove members from a Knock audience |

The `audience_key` is extracted from the URL path. Both endpoints accept either a single JSON object or an array of objects containing user membership data.

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone <your-repo-url>
cd knock-segment-retl-adapter
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file with your Knock API key:

```bash
KNOCK_API_KEY=sk_test_your_api_key_here
# Optional: override Knock API base URL
# KNOCK_BASE_URL=https://api.knock.app
```

4. Start the development server:

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

## Environment Variables

| Variable         | Required | Default                 | Description               |
| ---------------- | -------- | ----------------------- | ------------------------- |
| `KNOCK_API_KEY`  | Yes      | —                       | Your Knock API secret key |
| `KNOCK_BASE_URL` | No       | `https://api.knock.app` | Knock API base URL        |

## API Reference

### URL Format

```
POST /api/segment/audiences/{audience_key}/add
POST /api/segment/audiences/{audience_key}/remove
```

The `audience_key` in the URL path specifies which Knock audience to modify.

### Request Body Format

Both endpoints accept the same payload format:

**Single object:**

```json
{
  "user_id": "user_123",
  "tenant": "acme-corp"
}
```

**Array of objects:**

```json
[
  { "user_id": "user_123", "tenant": "acme-corp" },
  { "user_id": "user_456", "tenant": null },
  { "user_id": "user_789" }
]
```

| Field     | Type           | Required | Description                             |
| --------- | -------------- | -------- | --------------------------------------- |
| `user_id` | string         | Yes      | The user ID to add/remove               |
| `tenant`  | string \| null | No       | Optional tenant for multi-tenant setups |

### Response Format

```json
{
  "audience_key": "premium-users",
  "members_count": 3,
  "status": 200,
  "response": { ... }
}
```

- Returns `200` if the Knock API call succeeded
- Returns the upstream status code if the Knock API call failed

## Example cURL Commands

### Add members to an audience

```bash
# Single user
curl -X POST http://localhost:3000/api/segment/audiences/premium-users/add \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_123", "tenant": "acme-corp"}'

# Multiple users
curl -X POST http://localhost:3000/api/segment/audiences/premium-users/add \
  -H "Content-Type: application/json" \
  -d '[
    {"user_id": "user_123", "tenant": "acme-corp"},
    {"user_id": "user_456"},
    {"user_id": "user_789"}
  ]'
```

### Remove members from an audience

```bash
# Single user
curl -X POST http://localhost:3000/api/segment/audiences/premium-users/remove \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_123", "tenant": "acme-corp"}'

# Multiple users
curl -X POST http://localhost:3000/api/segment/audiences/premium-users/remove \
  -H "Content-Type: application/json" \
  -d '[
    {"user_id": "user_123"},
    {"user_id": "user_456"}
  ]'
```

## Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket
2. Import the project in [Vercel](https://vercel.com)
3. Add the `KNOCK_API_KEY` environment variable in Vercel project settings
4. Deploy!

The adapter will be available at your Vercel URL (e.g., `https://your-app.vercel.app`).

## Configuring Segment Reverse ETL

### 1. Create your data model

In Segment, create a SQL model that returns the users who should be in each audience:

```sql
SELECT
  tenant,
  user_id
FROM your_schema.audience_members
WHERE audience_key = 'premium-users'
  AND is_active = true
```

Create a separate model for each audience you want to sync, or use a single model if your destination supports dynamic URL paths.

### 2. Create the Reverse ETL destination

1. Go to **Connections → Destinations** in Segment
2. Add a new **HTTP API** destination (or **Webhook** destination)
3. Configure the destination URL to point to your deployed adapter

### 3. Configure sync mappings

Segment Reverse ETL syncs work by detecting changes between syncs. You'll configure **two separate event mappings** per audience:

#### For "Rows Added" (new audience members)

- **Event type:** Added
- **URL:** `https://your-app.vercel.app/api/segment/audiences/premium-users/add`
- **Method:** POST
- **Map fields:**
  - `user_id` → `user_id` column from your model
  - `tenant` → `tenant` column from your model (if applicable)

#### For "Rows Removed" (users leaving the audience)

- **Event type:** Removed
- **URL:** `https://your-app.vercel.app/api/segment/audiences/premium-users/remove`
- **Method:** POST
- **Map fields:**
  - `user_id` → `user_id` column from your model
  - `tenant` → `tenant` column from your model (if applicable)

### 4. Set the sync schedule

Configure how often Segment should check for changes and sync to Knock (e.g., every hour, daily).

### How it works

1. Segment runs your SQL model periodically
2. It compares results to the previous sync
3. **New rows** (users added to audience) → calls `/api/segment/audiences/{audience_key}/add`
4. **Missing rows** (users removed from audience) → calls `/api/segment/audiences/{audience_key}/remove`
5. The adapter forwards these to the Knock Audiences API

## Notes

- This adapter is intentionally minimal — no request signature verification, retries, or rate limiting
- For production use, consider adding authentication (e.g., shared secret header validation)
- Each request targets a single audience (specified in the URL path), making it easy to configure in Segment

## License

MIT
