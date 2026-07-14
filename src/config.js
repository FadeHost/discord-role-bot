// Environment-driven configuration. Every setting a customer might want to
// change is an env var they can edit in the FadeHost panel (Environment tab).

function parseColor(value, fallback) {
  if (!value) return fallback;
  const hex = value.replace(/^#/, '');
  const n = Number.parseInt(hex, 16);
  return Number.isNaN(n) ? fallback : n;
}

export const config = {
  token: (process.env.DISCORD_TOKEN || '').trim(),

  // Cosmetic customization.
  embedColor: parseColor(process.env.EMBED_COLOR, 0x5865f2), // Discord blurple
  activity: (process.env.ACTIVITY || 'Pick your roles').trim(),

  // If a role sits above the bot's own highest role, Discord won't let the bot
  // assign it. We surface a clear message instead of failing silently.
  ephemeralReplies: (process.env.EPHEMERAL_REPLIES ?? 'true') !== 'false',
};

export function assertConfig() {
  if (!config.token) {
    console.error(
      '[role-bot] DISCORD_TOKEN is not set. Add your bot token in the FadeHost panel → your bot → Environment.',
    );
    process.exit(1);
  }
}
