/**
 * @file Discord slash interaction utilities.
 * @author Jonathan Hiles <jonathan@hil.es>
 * @since 1.0.0
 */

import chalk from 'chalk';
import {GatewayServer} from 'slash-create';
import {COMMANDS} from './cmd/index.js';
import {LABELS, log} from './logging.js';

/**
 * Registers and syncs all Discord slash commands.
 *
 * @param {SlashCreator} creator slash-create client
 * @return {Promise} promise for syncing slash commands
 */
export async function syncSlashCommands(creator) {
  log.info('Syncing slash commands...', LABELS.COMMANDS);
  return creator
    .withServer(new GatewayServer(handler => creator.client.ws.on('INTERACTION_CREATE', handler)))
    .on('debug', message => log.debug(message, LABELS.COMMANDS))
    .on('warn', message => log.warn(message, LABELS.COMMANDS))
    .on('error', message => log.error(message, LABELS.COMMANDS))
    .on('commandRegister', cmd =>log.verbose('Registering command: %s', chalk.underline(`/${cmd.commandName}`), LABELS.COMMANDS))
    .on('commandRun', (cmd, _, ctx) => log.info('%s ran command %s', chalk.bold(`@${ctx.user.username}`), chalk.underline(`/${cmd.commandName}`), LABELS.COMMANDS))
    .on('commandError', (cmd, error) => log.error('The %s command failed!\n%s', chalk.underline(`/${cmd.commandName}`), error, LABELS.COMMANDS))
    .registerCommands(COMMANDS)
    .syncCommandsAsync()
    .then(() => log.log('success', 'Successfully synced slash commands!', LABELS.COMMANDS))
    .catch(error => log.error('Unable to sync slash commands!\n%s', error, LABELS.COMMANDS));
}
