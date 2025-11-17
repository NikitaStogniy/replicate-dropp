# Team Account System - Setup Guide

This application now uses a team-based authentication system with the following features:

## Features

- **User Authentication**: Email/password authentication via NextAuth
- **Team Management**: Users belong to teams with shared access
- **Role-Based Access**: Admin and User roles with different permissions
- **Usage Tracking**: Track generations per user and per team
- **Usage Limits**: Set limits per user or team-wide
- **Invite System**: Admins can generate invite codes for new team members

## Initial Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `REPLICATE_API_TOKEN`: Your Replicate API token
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your app URL (e.g., `http://localhost:3000`)

### 2. Database Migration

The database has already been migrated with the schema, but if you need to run it again:

```bash
node migrations/run-migration.js
```

### 3. Create Initial Team & Admin

Run the setup script to create your first team and admin user:

```bash
node scripts/create-initial-team.js
```

This will prompt you for:
- Team name
- Admin email
- Admin name (optional)
- Admin password

It will also generate an invite code for adding team members.

### 4. Start the Application

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with your admin credentials.

## User Roles

### Admin
- View team-wide usage statistics
- See per-user generation counts
- Generate invite codes for new users
- Add/disable/remove team members
- Set usage limits (per-user and team-wide)
- Access admin dashboard at `/admin`

### User
- Generate images/videos using AI models
- View own generations
- Access shared team generations

## Invite System

Admins can create two types of invite codes:

1. **Team Invite Codes**: For new users to join the team
2. **Password Reset Codes**: For existing users who forgot passwords

To create invite codes:
1. Sign in as admin
2. Go to `/admin`
3. Navigate to "Invite Codes" tab
4. Click "Generate Code"

Share the code with new team members who can use it during signup at `/signup`.

## Usage Limits

Admins can set limits in two ways:

1. **Team-wide limit**: Maximum generations for the entire team
2. **Per-user limit**: Maximum generations for individual users

When a limit is reached, users will see an error when attempting to generate.

## API Routes

### Authentication
- `POST /api/auth/signup` - Register with invite code
- `POST /api/auth/[...nextauth]` - NextAuth handlers (signin/signout)

### Admin (Admin-only)
- `GET /api/admin/users` - List team users
- `PATCH /api/admin/users` - Update user (disable/limits)
- `DELETE /api/admin/users` - Delete user
- `GET /api/admin/invite-codes` - List invite codes
- `POST /api/admin/invite-codes` - Create invite code
- `GET /api/admin/usage` - Get usage statistics
- `GET /api/admin/limits` - Get team limits
- `PATCH /api/admin/limits` - Update team limits

### Generation
- `POST /api/generate` - Generate image/video (requires auth)

## Database Schema

Main tables:
- `teams` - Team information and limits
- `users` - User accounts with roles and limits
- `generations` - Generation history with user/team tracking
- `invite_codes` - Invite and password reset codes
- `sessions`, `accounts` - NextAuth session management

## Migration from Old System

The old secret key authentication has been completely removed. All users now need to:

1. Register using an invite code (get from admin)
2. Sign in with email/password
3. Authenticate before generating images

Previous localStorage history is no longer used. All generations are now stored in the database.

## Troubleshooting

### "Unauthorized" when generating
- Make sure you're signed in
- Check that your account is active (not disabled by admin)
- Verify you're assigned to a team

### Can't create account
- Verify you have a valid invite code
- Check that the code hasn't been used already
- Ensure the code hasn't expired

### Database connection errors
- Verify `DATABASE_URL` is correct in `.env.local`
- Check that Neon database is accessible
- Confirm the migration ran successfully

## Production Deployment

1. Set environment variables in your hosting platform
2. Update `NEXTAUTH_URL` to your production domain
3. Ensure `NEXTAUTH_SECRET` is a strong random value
4. Run the initial setup script to create your team
5. Configure your Neon database for production use

## Security Notes

- Passwords are hashed using bcrypt
- Sessions are JWT-based with secure cookies
- Database queries use parameterized queries to prevent SQL injection
- Usage limits prevent abuse
- Admin actions are protected by role checks
