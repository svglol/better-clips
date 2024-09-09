# Better Twitch Clips

A better way to browse/watch Twitch clips. Built with Nuxt.

## Features

- Browse clips by game, category.
- Watch clips in a player.
- Share clips.
- Download clips.

## Development

### Setup

1. Install [pnpm](https://pnpm.io/)
2. Install dependencies with `pnpm install`
3. Create a `.env` file in the root of the project with the following content:
   ```
   NUXT_TWITCH_CLIENT_ID=your-twitch-client-id
   NUXT_TWITCH_CLIENT_SECRET=your-twitch-client-secret
   NUXT_BASE_URL=base-url
   NUXT_SESSION_PASSWORD=your-session-password
   ```
4. Run `pnpm dev`

### Testing

Run `pnpm test`

### Linting

Run `pnpm lint`

### Committing

This project uses [commitlint](https://commitlint.js.org/) and [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/).

## License

[MIT](LICENSE)
