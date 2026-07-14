# FadeHost Role Bot

A self-assign role bot for Discord. Post a message with buttons; members click to give themselves roles. No database, nothing to configure beyond your bot token.

## Setup on FadeHost
1. Create a bot at https://discord.com/developers/applications → **New Application → Bot → Reset Token**.
2. Invite it with the **Manage Roles** permission and the `applications.commands` scope.
3. In your FadeHost panel, deploy the **Role Bot** template and paste the token as `DISCORD_TOKEN`.
4. In Discord, run `/rolemenu` — give it a title and up to 5 roles. Done.

> Drag the bot's role **above** the roles it should hand out (Server Settings → Roles), or Discord won't let it.

## Environment variables
| Variable | Default | What it does |
|---|---|---|
| `DISCORD_TOKEN` | — | **Required.** Your bot token. |
| `EMBED_COLOR` | `5865F2` | Hex colour of the role-menu embed. |
| `ACTIVITY` | `Pick your roles` | The bot's "Playing …" status. |
| `EPHEMERAL_REPLIES` | `true` | Whether "Added/Removed role" confirmations are private. |

Built and maintained by [FadeHost](https://fadehost.com). MIT licensed.
