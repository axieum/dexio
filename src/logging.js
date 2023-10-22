/**
 * @file Logging utilities.
 * @author Jonathan Hiles <jonathan@hil.es>
 * @since 1.0.0
 */

import process from 'node:process';
import {createLogger, format, transports} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import chalk from 'chalk';

/** A hierarchy of log level names. */
const LEVELS = {
  error: 0,
  warn: 1,
  success: 2,
  info: 3,
  verbose: 4,
  debug: 5,
};

/** A mapping of log levels to colours for use in terminals. */
const COLORS = {
  error: 'brightRed',
  warn: 'brightYellow',
  success: 'brightGreen',
  info: [],
  verbose: 'cyan',
  debug: 'grey',
};

/** A mapping of log levels to symbols for use in terminals. */
const SYMBOLS = {
  error: chalk.redBright('◉'),
  warn: chalk.yellow('◉'),
  success: chalk.greenBright('◉'),
  info: '◉',
  verbose: chalk.cyan('○'),
  debug: chalk.grey('◌'),
};

/** A predefined collection of reusable log labels. */
export const LABELS = {
  DISCORD: {label: 'discord'},
  COMMANDS: {label: 'commands'},
  CONFIG: {label: 'config'},
  POKEMON: {label: 'pokémon'},
  POKESTOPS: {label: 'pokéstops'},
  GYMS: {label: 'gyms'},
  WEATHER: {label: 'weather'},
  ROUTES: {label: 'routes'},
};

/** A mapping of predefined log labels to their styled variant for use in terminals. */
const STYLED_LABELS = {
  discord: chalk.hex('#ffbb33')('[DISCORD]'),
  commands: chalk.hex('#ffdc9c')('[COMMANDS]'),
  config: chalk.hex('#f6e3bf')('[CONFIG]'),
  pokémon: chalk.hex('#f44336')('[POKÉMON]'),
  pokéstops: chalk.hex('#e91e63')('[POKÉSTOPS]'),
  gyms: chalk.hex('#9c27b0')('[GYMS]'),
  weather: chalk.hex('#3f51b5')('[WEATHER]'),
  routes: chalk.hex('#607d8b')('[ROUTES]'),
};

/** The global logger. */
export const log = createLogger({
  level: process.env.DEXIO_LOG_LEVEL ?? 'verbose',
  levels: LEVELS,
  format: format.combine(
    format.timestamp(),
    format.splat(),
    format.metadata({fillExcept: ['timestamp', 'level', 'message']}),
  ),
  transports: [
    // Console
    // https://github.com/winstonjs/winston/blob/master/docs/transports.md#console-transport
    new transports.Console({
      format: format.combine(
        format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
        format.colorize({message: true, colors: COLORS}),
        format.printf(info => {
          const symbol = SYMBOLS[info.level] ?? SYMBOLS.info;
          const timestamp = chalk.grey(`[${info.timestamp}]`);
          const label = info.metadata.label && (STYLED_LABELS[info.metadata.label] ?? `[${info.metadata.label.toUpperCase()}]`);
          return `${symbol} ${timestamp}${label ? ` ${label}` : ''} ${info.message}`;
        }),
      ),
      stderrLevels: ['error', 'warn'],
    }),
    // Daily rotating file
    // https://github.com/winstonjs/winston-daily-rotate-file#options
    new DailyRotateFile({
      filename: './logs/%DATE%.log',
      auditFile: './logs/.audit.json',
      maxSize: process.env.DEXIO_LOG_MAX_SIZE || null,
      maxFiles: process.env.DEXIO_LOG_RETENTION || '14d',
      zippedArchive: true,
      format: format.combine(
        format.uncolorize({message: true}),
        format.json({deterministic: false}),
      ),
    }),
  ],
});
