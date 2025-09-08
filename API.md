# Tournament Tracker API Documentation

> Last updated: 2025-09-08

## Overview

The Tournament Tracker API provides programmatic access to various types of data and functionality. Access is controlled through API keys with scope-based permissions + your website-level permissions.

>[!NOTE]
> If you're experiencing any issues, or want to report a bug, [open a GitHub issue](https://github.com/Hiviexd/tournament-tracker/issues/new) or contact me on Discord (hivie).

## Base URL

The base URL for the API is: `https://tcomm.hivie.tn/api/{endpoint}`

## Authentication

All API requests must include an API key in the `Authorization` header:

```text
Authorization: Bearer YOUR_API_KEY
```

## Creating an API Key

- Log in to the website with your osu! account
- Navigate to Settings → API Keys
- Provide a descriptive name for your key
- Select the required scopes (see [Scopes](#scopes) below)
- Click "Generate API Key"

**⚠️ Important:** The raw API key is only shown once after creation. Save it securely as it cannot be retrieved later.

## Scopes

| Scope | Description | Access Level |
|-------|-------------|--------------|
| `beatmaps:read` | Access mappool compliance checking | Read |
| `tournaments:read` | Access tournament data and listings | Read |
| `votings:read` | Access public voting data and results | Read |
| `resources:read` | Access resource library | Read |
| `users:read` | Access your own user profile data | Read |
| `tickets:read` | Access ticket/report data | Read |

## Rate Limits

The API allows for 100 requests per minute, with 20 requests per 10 seconds (burst). Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Available Endpoints

### Beatmaps

#### Check Beatmap Compliance

```http
POST /api/beatmaps/check
```

**Required Scope:** `beatmaps:read`

**Request Body:**

```json
{
  "input": "list of beatmap IDs, and/or URLs. Separators like spaces, commas, and newlines are supported.",
}
```

**Response:**

```json
{
  message: "Beatmaps checked successfully!",
  "allowed": [...], // IBeatmap[]
  "partial": [...], // IBeatmapWithNotes[]
  "disallowed": [...], // IBeatmap[]
  "errors": [...], // string[] (beatmap IDs that were not found in the response)
}
```

*References:*

- [IBeatmap](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/OsuApi.ts#L77)
- [IBeatmapWithNotes](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/OsuApi.ts#L111)

### Tournaments

#### Search Tournaments

```http
GET /api/tournaments
```

**Required Scope:** `tournaments:read`

**Query Parameters:**

- `search` (string): Search tournaments by name or tags
- `mode` (string): Filter by game mode (`osu`, `taiko`, `catch`, `mania`)
- `host` (string): Filter by host's osu! username or ID
- `type` (string): Filter by tournament type (`tournament`, `contest`)
- `status` (string): Filter by [official support status](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/Tournament.ts#L11)
- `state` (string): Filter by state (`active` by default, can specify `archived` or `all`)
- `page` (number): Page number (default: 1)

**Response:**

```json
{
  "tournaments": [...], // A censored version of ITournament[]
  "totalCount": 150,
  "currentPage": 1,
  "totalPages": 15
}
```

*References:*

- [ITournament](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/Tournament.ts#L53)

#### Get Tournament by ID

```http
GET /api/tournaments/{tournamentId}
```

**Required Scope:** `tournaments:read`

**Path Parameters:**

- `tournamentId` (string): Tournament's MongoDB document ID

**Response:**

```json
{
  "tournament": { ... }, // A censored version of ITournament
}
```

*References:*

- [ITournament](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/Tournament.ts#L53)

### Votings

#### Search Votes

```http
GET /api/votes
```

**Required Scope:** `votings:read`

**Query Parameters:**

- `title` (string): Search votes by title
- `category` (string): Filter by voting category
- `assignedGroup` (string): Filter by assigned group (`tc` or `cc`)
- `page` (number): Page number (default: 1)

**Response:**

```json
{
  "votings": [...], // A censored version of IVoting[]
  "totalCount": 150,
  "currentPage": 1,
  "totalPages": 15
}
```

*References:*

- [IVoting](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/Voting.ts#L55)

#### Get Vote by ID

```http
GET /api/votes/{voteId}
```

**Required Scope:** `votings:read`

**Path Parameters:**

- `voteId` (string): Vote's MongoDB document ID

**Response:**

```json
{
  ..., // A censored version of IVoting
}
```

*References:*

- [IVoting](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/Voting.ts#L55)

### Resources

#### Get Resources

```http
GET /api/resources
```

**Required Scope:** `resources:read`

**Query Parameters:**

- `search` (string): Search resources by name or description
- `author` (string): Filter by author's osu! username or ID
- `category` (string): Filter by [category](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/Resource.ts#L4)
- `type` (string): Filter by [type](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/Resource.ts#L6) (`official` or `community`)
- `page` (number): Page number (default: 1)

**Response:**

```json
{
  "resources": [...], // IResource[]
  "totalCount": 150,
  "currentPage": 1,
  "totalPages": 15
}
```

*References:*

- [IResource](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/Resource.ts#L26)

### Users

#### Get Current User

```http
GET /api/users/me
```

**Required Scope:** `users:read`

**Response:**

```json
{
  ..., // IUser
}
```

*References:*

- [IUser](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/User.ts#L30)

### Tickets/Reports

> [!NOTE]
> Tickets and reports are the same entity, they're differentiated by the `type` field.

#### Search Tickets/Reports
```http
GET /api/tickets
```

**Required Scope:** `tickets:read`

**Query Parameters:**

> [!IMPORTANT]
> Querying reports is not possible, you'll only get reports that you own if you set `type` to `report`, other queries are ignored.

- `type` (string): Filter by ticket type (`ticket` or `report`)
- `title` (string): Search by title or content
- `assignedGroup` (string): Filter by assigned group (`tc` or `cc`)
- `showOwn` (string): Filter by own tickets (`true` or `false`)
- `isActive` (string): Filter by state (`true` or `false`)
- `page` (number): Page number (default: 1)

**Response:**

```json
{
  "tickets": [...], // A censored version of ITicket[]
  "totalCount": 150,
  "currentPage": 1,
  "totalPages": 15
}
```

*References:*

- [ITicket](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/Ticket.ts#L31)

#### Get Ticket/Report by ID

```http
GET /api/tickets/{ticketId}
```

**Required Scope:** `tickets:read`

**Path Parameters:**

- `ticketId` (string): Ticket/Report's MongoDB document ID

**Response:**

```json
{
  ..., // A censored version of ITicket
}
```

*References:*

- [ITicket](https://github.com/Hiviexd/tournament-tracker/blob/main/interfaces/Ticket.ts#L31)

## Error Responses

### Authentication Errors

#### 401 Unauthorized

```json
{
  "error": "Invalid or revoked API key"
}
```

#### 403 Forbidden

```json
{
  "error": "Missing required scope"
}
```

#### 403 Forbidden (CORS)

```json
{
  "error": "Access denied. This endpoint is only accessible from the client application or with a valid API key."
}
```

### Rate Limiting

#### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded"
}
```

### General Errors

#### 400 Bad Request

```json
{
  "error": "Validation error"
}
```

#### 404 Not Found

```json
{
  "error": "API endpoint not found"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Something went wrong!"
}
```

## Examples

### Python Example
```python
import requests
import time

class TournamentTrackerAPI:
    def __init__(self, api_key, base_url="https://tcomm.hivie.tn"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def get_tournaments(self, **params):
        response = requests.get(
            f"{self.base_url}/api/tournaments/",
            headers=self.headers,
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def get_tournament(self, tournament_id):
        response = requests.get(
            f"{self.base_url}/api/tournaments/{tournament_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()

# Usage
api = TournamentTrackerAPI("your-api-key")
tournaments = api.get_tournaments(search="Suiji", status="badgeApproved", state="all")
```

### JavaScript Example
```javascript
class TournamentTrackerAPI {
    constructor(apiKey, baseUrl = 'https://tcomm.hivie.tn') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
    }
    
    async getTournaments(params = {}) {
        const url = new URL(`${this.baseUrl}/api/tournaments/`);
        Object.keys(params).forEach(key => 
            url.searchParams.append(key, params[key])
        );
        
        const response = await fetch(url, {
            headers: this.headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    async getTournament(tournamentId) {
        const response = await fetch(
            `${this.baseUrl}/api/tournaments/${tournamentId}`,
            { headers: this.headers }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
}

// Usage
const api = new TournamentTrackerAPI('your-api-key');
const tournaments = await api.getTournaments({ search: 'Suiji', status: 'badgeApproved', state: 'all' });
```

### Google Sheets Example for Mappool Compliance purposes

This example shows how to create a custom function in Google Sheets that checks mappool compliance using the API.

#### Setup Instructions

1. **Open Google Sheets** and create a new spreadsheet
2. **Go to Extensions → Apps Script**
3. **Replace the default code** with the following:

```javascript
// Configuration - Replace with your actual API key
const API_KEY = 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://tcomm.hivie.tn';

/**
 * Check beatmap compliance and return results in 4 cells
 * Usage: =CHECK_COMPLIANCE(B2)
 * @param {string} input - Beatmap IDs, URLs, or mixed input from a cell
 */
function CHECK_COMPLIANCE(input) {
  if (!input || input.toString().trim() === '') {
    return [['No input']];
  }
  
  try {
    const url = `${BASE_URL}/api/beatmaps/check`;
    
    const options = {
      'method': 'POST',
      'headers': {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify({
        'input': input.toString()
      })
    };
    
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() !== 200) {
      return [[`Error: ${response.getResponseCode()}`]];
    }
    
    const result = JSON.parse(response.getContentText());

    // At this point, you can parse the results however you want.
    // In this example, we'll just return the results' beatmap IDs in 4 columns.
    
    const approved = (result.allowed || []).map(beatmap => beatmap.id).join(', ');
    const partial = (result.partial || []).map(beatmap => beatmap.id).join(', ');
    const disallowed = (result.disallowed || []).map(beatmap => beatmap.id).join(', ');
    const errors = (result.errors || []).join(', ');
    
    return [[approved, partial, disallowed, errors]];
    
  } catch (error) {
    return [[`Error: ${error.message}`, '', '', '']];
  }
}
```

#### Usage Instructions

1. **Save the script** (Ctrl+S) and give it a name like "Mappool Compliance Checker"

2. **Authorize the script** when prompted:
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow"

3. **Go back to your Google Sheet** and set up your data:

| A | B | C | D | E |
|---|---|---|---|---|
| **Beatmap Input** | **Approved** | **Partial** | **Disallowed** | **Errors** |
| 1234567,2345678,3456789 | `=CHECK_COMPLIANCE(A2)` | | | |

> [!NOTE]
> If you use the code above verbatim, the `CHECK_COMPLIANCE` function will automatically fill cells B2, C2, D2, and E2 with the approved, partial, disallowed, and error beatmap IDs respectively.

> [!TIP]
> Examples of supported input formats:
> ```text
> # Single beatmap ID
> 1234567
>
> # Multiple IDs (comma-separated)
> 1234567,2345678,3456789
>
> # Mixed with URLs
> 1234567, https://osu.ppy.sh/beatmapsets/123#osu/2345678
>
> # Line-separated
> 1234567
>2345678
> 3456789
>
> # Beatmapset URLs
> https://osu.ppy.sh/beatmapsets/123#osu/456
> ```
