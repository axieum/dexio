/**
 * @file Dexio - a Discord bot for announcing Pokémon Go encounters.
 * @author Jonathan Hiles <jonathan@hil.es>
 */

import process from 'node:process';
import chalk from 'chalk';
import {Client, GatewayIntentBits} from 'discord.js';
import gradient from 'gradient-string';
import {SlashCreator} from 'slash-create';
import {getConfig} from './config/index.js';
import {LABELS, log} from './logging.js';
import {syncSlashCommands} from './slash.js';

/**********************************************************************/
// Print a splash message.
console.log(gradient.pastel.multiline(atob('ICBfX19fICAgICAgICAgICAgXyAgICAgICAgIF8gICAgICAgICAgIF8KIHwgIF8gXCAgX19fX18gIF8oXykgX19fICAgfCB8X18gICBfX18gfCB8XwogfCB8IHwgfC8gXyBcIFwvIC8gfC8gXyBcICB8ICdfIFwgLyBfIFx8IF9ffAogfCB8X3wgfCAgX18vPiAgPHwgfCAoXykgfCB8IHxfKSB8IChfKSB8IHxfCiB8X19fXy8gXF9fXy9fL1xfXF98XF9fXy8gIHxfLl9fLyBcX19fLyBcX198')));
console.log(' '.repeat(33) + chalk.grey('└ by Axieum') + '\n');

/**********************************************************************/
// Load the configuration to be used throughout the bot.
const config = getConfig();

/**********************************************************************/
// Spin up a new Discord client.
const client = new Client({intents: [GatewayIntentBits.Guilds]});

client.once('ready', () => log.log('success', gradient.pastel(`Ready! Logged in as ${client.user.tag}`), LABELS.DISCORD));

/**********************************************************************/
// Register and sync Discord slash interactions.
const slash = new SlashCreator({
  token: config.client.token,
  publicKey: config.client.publicKey,
  applicationID: config.client.applicationId,
  client,
});

await syncSlashCommands(slash);

/**********************************************************************/
// Login to Discord.
await client
  .login(config.client.token)
  .catch(error => {
    log.error('Unable to login to Discord!\n%s', error, LABELS.DISCORD);
    process.exitCode = 1; // Error
  });
