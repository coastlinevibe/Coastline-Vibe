# Banned Users Cleanup

This document describes the process for automatically cleaning up banned user accounts after 10 days.

## How it Works

1. When an admin bans a user, we record the ban date in the `profiles` table.
2. A daily cron job calls the API endpoint `/api/cron/cleanup-banned-accounts`.
3. The API endpoint identifies users who have been banned for more than 10 days and permanently deletes their accounts.

## Database Changes

The following database changes were implemented:

1. Added `ban_date` column to the `profiles` table (see `src/migrations/add_ban_date_to_profiles.sql`).
2. Created an index for faster lookups of banned profiles by date.

## API Endpoint

A new API endpoint was created at `/api/cron/cleanup-banned-accounts` that:
- Queries for users banned more than 10 days ago
- Deletes those user accounts permanently
- Returns a JSON response with the results

## Setting Up the Cron Job

To ensure the cleanup process runs automatically, you should set up a cron job that calls the API endpoint daily. Here's how:

### Option 1: Using an External Cron Service (Recommended)

You can use a service like [Cron-job.org](https://cron-job.org/) or [EasyCron](https://www.easycron.com/):

1. Sign up for an account
2. Create a new cron job
3. Set the URL to `https://your-domain.com/api/cron/cleanup-banned-accounts`
4. Set the schedule to run daily (e.g., at midnight)

### Option 2: Using GitHub Actions

Create a file at `.github/workflows/cleanup-banned-users.yml`:

```yaml
name: Cleanup Banned Users

on:
  schedule:
    - cron: '0 0 * * *'  # Runs at midnight every day

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cleanup API
        run: |
          curl -X GET https://your-domain.com/api/cron/cleanup-banned-accounts
```

### Option 3: Using a Server-side Cron Job

If you have access to the server:

```bash
# Edit the crontab
crontab -e

# Add this line to run daily at midnight
0 0 * * * curl -X GET https://your-domain.com/api/cron/cleanup-banned-accounts
```

## Testing the Cleanup Process

You can manually test the cleanup process by:

1. Banning a user
2. Manually editing their `ban_date` in the database to be more than 10 days ago:
   ```sql
   UPDATE profiles
   SET ban_date = '2023-01-01'  -- Set to a date more than 10 days ago
   WHERE id = 'user_id_here';
   ```
3. Visit `/api/cron/cleanup-banned-accounts` in your browser or make a GET request to that endpoint
4. Check the JSON response to see if the user was deleted

## Security Considerations

For production, you may want to add authentication to the API endpoint to prevent unauthorized access. This could be done by:

1. Adding a secret key as a query parameter
2. Implementing IP address whitelisting
3. Using basic authentication
