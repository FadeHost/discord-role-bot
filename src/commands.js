import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { config } from './config.js';

// Custom-id prefix that carries the target role id, e.g. "rolebtn:123456789".
// Because the role id lives in the button itself, self-assign works forever
// with zero stored state — no database, survives restarts and redeploys.
export const BUTTON_PREFIX = 'rolebtn:';

const MAX_ROLES = 5;

export const rolemenuCommand = new SlashCommandBuilder()
  .setName('rolemenu')
  .setDescription('Post a message with buttons that let members give themselves roles.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .setDMPermission(false)
  .addStringOption((o) => o.setName('title').setDescription('Heading shown above the buttons').setRequired(true))
  .addRoleOption((o) => o.setName('role1').setDescription('A role members can pick').setRequired(true))
  .addStringOption((o) => o.setName('description').setDescription('Optional text under the title'))
  .addRoleOption((o) => o.setName('role2').setDescription('Another role members can pick'))
  .addRoleOption((o) => o.setName('role3').setDescription('Another role members can pick'))
  .addRoleOption((o) => o.setName('role4').setDescription('Another role members can pick'))
  .addRoleOption((o) => o.setName('role5').setDescription('Another role members can pick'));

export const commands = [rolemenuCommand.toJSON()];

/** Handle /rolemenu: validate the chosen roles, then post the button panel. */
export async function handleRoleMenu(interaction) {
  const me = interaction.guild.members.me;
  if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({
      content: '⚠️ I need the **Manage Roles** permission to hand out roles. Give it to me and try again.',
      ephemeral: true,
    });
  }

  const roles = [];
  for (let i = 1; i <= MAX_ROLES; i += 1) {
    const role = interaction.options.getRole(`role${i}`);
    if (role) roles.push(role);
  }

  // A bot can only manage roles below its own highest role.
  const tooHigh = roles.filter((r) => r.comparePositionTo(me.roles.highest) >= 0);
  if (tooHigh.length > 0) {
    return interaction.reply({
      content:
        `⚠️ These roles are above my own role, so Discord won't let me assign them: ${tooHigh
          .map((r) => r.toString())
          .join(', ')}\nDrag my role above them in **Server Settings → Roles** and try again.`,
      ephemeral: true,
    });
  }

  // @everyone and managed (bot/integration) roles can't be self-assigned.
  const invalid = roles.filter((r) => r.managed || r.id === interaction.guild.id);
  if (invalid.length > 0) {
    return interaction.reply({
      content: `⚠️ These roles can't be self-assigned: ${invalid.map((r) => r.toString()).join(', ')}`,
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(interaction.options.getString('title'))
    .setColor(config.embedColor);
  const description = interaction.options.getString('description');
  if (description) embed.setDescription(description);

  const row = new ActionRowBuilder().addComponents(
    roles.map((role) =>
      new ButtonBuilder()
        .setCustomId(`${BUTTON_PREFIX}${role.id}`)
        .setLabel(role.name)
        .setStyle(ButtonStyle.Secondary),
    ),
  );

  await interaction.channel.send({ embeds: [embed], components: [row] });
  return interaction.reply({ content: '✅ Role menu posted.', ephemeral: true });
}
