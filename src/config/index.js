/**
 * @file Configuration schema, loading and validation.
 * @author Jonathan Hiles <jonathan@hil.es>
 * @since 1.0.0
 */

import fs from 'node:fs';
import process from 'node:process';
import {inspect} from 'node:util';
import chalk from 'chalk';
import JSON5 from 'json5';
import _ from 'lodash';
import {z, ZodError} from 'zod';
import {fromZodIssue} from 'zod-validation-error';
import {LABELS, log} from '../logging.js';

/** The filename of the user-provided configuration file. */
const USER_CONFIG = 'config.json5';

/** The configuration schema. */
export const ConfigSchema = z.object({
  // Discord bot client details
  client: z.object({
    // Bot → Token
    token: z.string().nonempty(),
    // General Information → Public Key
    publicKey: z.string().nonempty(),
    // General Information → Application ID
    applicationId: z.string().nonempty(),
  }),
});

/**
 * Loads and returns the default configuration file.
 *
 * @return {object} default config object
 */
export function loadDefaults() {
  log.verbose('Applying default configuration', LABELS.CONFIG);
  const content = fs.readFileSync(new URL('default.json5', import.meta.url)).toString();
  const object = JSON5.parse(content);
  log.debug('Default config: %s', inspect(object, {colors: true}), LABELS.CONFIG);
  return object;
}

/**
 * Loads and returns the user-provided configuration file.
 *
 * @return {object} user config object
 */
export function loadUserConfig() {
  log.verbose('Applying user configuration: %s', chalk.underline(USER_CONFIG), LABELS.CONFIG);

  // If the config file doesn't exist yet, create one
  try {
    if (!fs.existsSync(USER_CONFIG)) {
      fs.copyFileSync(new URL('example.json5', import.meta.url), USER_CONFIG);
      log.log('success', `We couldn't find a ${chalk.bold.underline(USER_CONFIG)} file so we've created one for you`, LABELS.CONFIG);
      log.log('info', '↪ Go ahead and apply your changes to this file, and then restart the bot', LABELS.CONFIG);
    }
  } catch (error) {
    log.error('Unable to create default user configuration file!\n%s', error, LABELS.CONFIG);
    return {};
  }

  // Attempt to read the config file
  try {
    const content = fs.readFileSync(USER_CONFIG).toString();
    const object = JSON5.parse(content);
    log.debug('User config: %s', inspect(object, {colors: true}), LABELS.CONFIG);
    return object;
  } catch (error) {
    log.error('Unable to read user configuration file!\n%s', error, LABELS.CONFIG);
    return {};
  }
}

/**
 * Loads and returns environment variables that are present.
 *
 * @return {object} config object
 */
export function loadEnvironment() {
  log.verbose('Applying environment variables', LABELS.CONFIG);
  const content = fs.readFileSync(new URL('environment.json5', import.meta.url)).toString();
  const parsed = JSON5.parse(content);

  const replaceWithEnv = object => Object.keys(object).forEach(key => {
    const value = object[key];
    if (typeof value === 'string') {
      if (Object.hasOwn(process.env, value) && process.env[value] !== null) {
        log.debug('%s → %s', value, process.env[value], LABELS.CONFIG);
        object[key] = process.env[value];
      } else {
        delete object[key];
      }
    } else if (typeof value === 'object') {
      replaceWithEnv(value);
    }
  });
  replaceWithEnv(parsed);

  log.debug('Environment config: %s', inspect(parsed, {colors: true}), LABELS.CONFIG);

  return parsed;
}

/**
 * Loads, validates and returns the configuration file.
 *
 * @return {object|null} validated config object or null if invalid
 */
export function getConfig() {
  log.info('Loading configuration...', LABELS.CONFIG);

  // Merge the various configurations
  const defaults = loadDefaults();
  const userConfig = loadUserConfig();
  const environment = loadEnvironment();
  const merged = _.merge(defaults, userConfig, environment);

  // Validate the configuration
  let config;
  try {
    log.verbose('Validating configuration', LABELS.CONFIG);
    config = ConfigSchema.parse(merged);
  } catch (error) {
    if (error instanceof ZodError) {
      log.error(
        error.issues.reduce(
          (message, issue, i) => `${message}\n${i < error.issues.length - 1 ? '├' : '└'} ${fromZodIssue(issue, {prefix: null})}`,
          `We found ${chalk.bold.underline(`${error.issues.length} ${error.issues.length === 1 ? 'issue' : 'issues'}`)} with your configuration:`,
        ),
        LABELS.CONFIG,
      );
    /* c8 ignore next 3 */
    } else {
      log.error('The configuration could not be validated!\n%s', error, LABELS.CONFIG);
    }

    process.exitCode = 78; // Configuration error
    return null;
  }

  // Finally, return the validated config object
  log.log('success', 'Successfully loaded configuration!', LABELS.CONFIG);
  log.debug('Validated config: %s', inspect(config, {colors: true}), LABELS.CONFIG);
  return config;
}
