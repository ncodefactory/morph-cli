import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import program from 'commander';
import { name, version, description } from '../package.json';
import newHandler, { supportedProjectTypes } from './new-handler';

const moduleName = name.split('/')[1];
const moduleVersion = version;
const moduleDescription = description;
const moduleBanner = chalk.green(`${figlet.textSync(moduleName)}\n  ${moduleDescription}\n     https://github.com/ncodefactory/morph-cli\n`);

const init = (clrscr = true) => {
  if (clrscr) {
    clear();
  }

  console.log(moduleBanner); // eslint-disable-line no-console
};

const run = async () => {
  program
    .version(moduleVersion)
    .command('new <projectType>')
    .description('creates a new morph project of indicated type')
    .option(
      '-n, --app-name [appName]',
      'project name (use current directory name if not specified)',
    )
    .option('-f, --force [force]', 'use this option for overwrite existing files')
    .action(async (projectType, options) => {
      try {
        await newHandler(projectType, options.appName, options.force);
      } catch (error) {
        console.log(`error: ${error.message}`); // eslint-disable-line no-console
      }
    })
    .command('info')
    .description('shows an information banner')
    .action(() => {
      try {
        init(false);
      } catch (error) {
        console.log(`error: ${error.message}`); // eslint-disable-line no-console
      }
    })
    .on('--help', () => {
      console.log(''); // eslint-disable-line no-console
      console.log('available project types:'); // eslint-disable-line no-console
      console.log('------------------------'); // eslint-disable-line no-console

      supportedProjectTypes.forEach((value) => {
        console.log(`${value.name} - ${value.desc}`); // eslint-disable-line no-console
      });
    });

  program.parse(process.argv);
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
};

export {
  moduleName, moduleVersion, moduleDescription, moduleBanner, init, run,
};
