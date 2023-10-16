/**
 * @file Dexio - a Discord bot for announcing Pokémon Go encounters.
 * @author Jonathan Hiles <jonathan@hil.es>
 */

import chalk from 'chalk';
import gradient from 'gradient-string';
import {getConfig} from './config/index.js';
import {log} from './logging.js';

/**********************************************************************/
// Print a splash message.
console.log(gradient.pastel.multiline(atob('ICBfX19fICAgICAgICAgICAgXyAgICAgICAgIF8gICAgICAgICAgIF8KIHwgIF8gXCAgX19fX18gIF8oXykgX19fICAgfCB8X18gICBfX18gfCB8XwogfCB8IHwgfC8gXyBcIFwvIC8gfC8gXyBcICB8ICdfIFwgLyBfIFx8IF9ffAogfCB8X3wgfCAgX18vPiAgPHwgfCAoXykgfCB8IHxfKSB8IChfKSB8IHxfCiB8X19fXy8gXF9fXy9fL1xfXF98XF9fXy8gIHxfLl9fLyBcX19fLyBcX198')));
console.log(' '.repeat(33) + chalk.grey('└ by Axieum') + '\n');

/**********************************************************************/
// Load the configuration to be used throughout the bot.
const config = getConfig();
