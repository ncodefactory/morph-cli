import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import { name, description } from '../package.json';

const moduleBanner = chalk.green(
  `${figlet.textSync(
    name.split('/')[1],
  )}\n  ${description}\n     https://github.com/ncodefactory/morph-cli\n\n     type mo --help for application usage help\n`,
);

const showModuleBanner = (clrscr = true) => {
  if (clrscr) {
    clear();
  }

  console.log(moduleBanner); // eslint-disable-line no-console
};

export default showModuleBanner;
