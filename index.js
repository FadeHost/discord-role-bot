import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  PermissionFlagsBits,
} from 'discord.js';
import { config, assertConfig } from './src/config.js';
import { commands, handleRoleMenu, BUTTON_PREFIX } from './src/commands.js';

assertConfig();

// Guilds is the only gateway intent needed — role assignment uses the REST API,
// and buttons arrive as interactions. No privileged intents, so nothing extra
// to toggle in the Developer Portal.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  console.log(`[role-bot] online as ${c.user.tag} in ${c.guilds.cache.size} server(s)`);
  c.user.setActivity(config.activity);

  // Register slash commands globally. New servers see them within an hour;
  // for instant availability, invite the bot and it registers on startup.
  try {
    const rest = new REST().setToken(config.token);
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
    console.log('[role-bot] slash commands registered');
  } catch (err) {
    console.error('[role-bot] failed to register commands:', err.message);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'rolemenu') {
      return await handleRoleMenu(interaction);
    }

    if (interaction.isButton() && interaction.customId.startsWith(BUTTON_PREFIX)) {
      return await toggleRole(interaction);
    }
  } catch (err) {
    console.error('[role-bot] interaction error:', err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '⚠️ Something went wrong. Please try again.', ephemeral: true }).catch(() => {});
    }
  }
});

/** A member clicked a role button — add the role if they lack it, else remove it. */
async function toggleRole(interaction) {
  const roleId = interaction.customId.slice(BUTTON_PREFIX.length);
  const role = interaction.guild.roles.cache.get(roleId) ?? (await interaction.guild.roles.fetch(roleId).catch(() => null));

  if (!role) {
    return interaction.reply({ content: '⚠️ That role no longer exists.', ephemeral: true });
  }

  const me = interaction.guild.members.me;
  if (!me.permissions.has(PermissionFlagsBits.ManageRoles) || role.comparePositionTo(me.roles.highest) >= 0) {
    return interaction.reply({
      content: `⚠️ I can't manage **${role.name}** — check that my role is above it and I have Manage Roles.`,
      ephemeral: true,
    });
  }

  const member = interaction.member;
  const has = member.roles.cache.has(roleId);
  if (has) {
    await member.roles.remove(roleId);
    return interaction.reply({ content: `➖ Removed ${role}.`, ephemeral: config.ephemeralReplies });
  }
  await member.roles.add(roleId);
  return interaction.reply({ content: `➕ Added ${role}.`, ephemeral: config.ephemeralReplies });
}

client.login(config.token).catch((error) => {
  if (String(error.code) === 'TokenInvalid' || String(error).includes('TOKEN_INVALID')) {
    console.error('[role-bot] Discord rejected DISCORD_TOKEN. Reset it at discord.com/developers → your app → Bot → Reset Token, paste the new one under Environment variables in the FadeHost panel, and restart.');
  } else {
    console.error(`[role-bot] Could not log in to Discord: ${error.message}`);
  }
  process.exit(1);
});

// The FadeHost runtime sends SIGTERM on stop/restart — exit cleanly.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`[role-bot] ${signal} received, shutting down`);
    client.destroy();
    process.exit(0);
  });
}
