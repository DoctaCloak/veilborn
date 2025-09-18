# Veilborn Bot

A comprehensive Discord bot for the Veilborn guild in Albion Online, handling recruitment, party finding, clock-in/out system, and general server management.

## Features

- **Recruitment System**: Post job openings, apply for positions, manage applications, schedule interviews, and more.
- **Clock In/Out System**: Users can clock in to show availability, get 'Clocked In' role, auto clock-out after 4 hours.
- **Party Finder**: Dedicated channel for clocked-in users with interactive buttons and roster display.
- **Utility Commands**: Ping, user info, server info, kick, event pings.
- **Admin Tools**: Clear roster, setup channels, assign roles.
- **Persistent Storage**: Uses MongoDB for roster and application data.

## Setup

1. **Install Dependencies**

   ```bash
   cd veilborn
   npm install
   ```

2. **Environment Configuration**

   - Copy `env-template.txt` to `.env`
   - Fill in Discord bot credentials and MongoDB URI.

3. **Bot Permissions**

   - Send Messages
   - Manage Roles
   - Read Message History
   - Manage Messages
   - View Channels
   - Manage Channels (for setup)

4. **Deploy Commands**

   ```bash
   npm run register
   ```

5. **Start the Bot**

   ```bash
   npm start
   ```

## Configuration

Edit `config.json` to customize roles, channels, timers, and guild info.

## Deployment

### Docker

```bash
docker build -t veilborn-bot .
docker run -d --env-file .env veilborn-bot
```

## Troubleshooting

- Ensure all environment variables are set correctly.
- Check bot permissions in Discord.
- Verify MongoDB connection.

For more details, see the code and comments.
