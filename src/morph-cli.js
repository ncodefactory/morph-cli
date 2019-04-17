import program from 'commander';
import { name, version, description } from '../package.json';
import newHandler, { supportedProjectTypes } from './new-handler';
import showModuleBanner from './module-banner';

const moduleName = name.split('/')[1];
const moduleVersion = version;
const moduleDescription = description;

const run = async () => {
  program
    .version(moduleVersion)
    .command('new <projectType>')
    .description('creates a new morph project of indicated type')
    .option(
      '-n, --dir-name [dirName]',
      'project root directory name (use current directory name if not specified)',
    )
    .option('-f, --force [force]', 'use this option for overwrite existing files')
    .action(async (projectType, options) => {
      try {
        await newHandler(projectType, options.dirName, options.force);
      } catch (error) {
        console.log(`error: ${error.message}`); // eslint-disable-line no-console
      }
    })
    .on('--help', () => {
      console.log(''); // eslint-disable-line no-console
      console.log('Available project types:'); // eslint-disable-line no-console
      supportedProjectTypes.forEach((value) => {
        const formattedName = value.name + ' '.repeat(9 - value.name.length);
        console.log(`  ${formattedName} - ${value.desc}`); // eslint-disable-line no-console
      });
    });

  program
    .command('info')
    .description('shows an information banner')
    .action(() => {
      try {
        showModuleBanner(false);
      } catch (error) {
        console.log(`error: ${error.message}`); // eslint-disable-line no-console
      }
    });

  program.parse(process.argv);
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
};

export {
  moduleName, moduleVersion, moduleDescription, run,
};
