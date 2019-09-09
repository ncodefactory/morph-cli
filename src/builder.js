/* eslint-disable no-console */
import fs from 'fs';
import tar from 'tar';
import tmp from 'tmp';
import path from 'path';
import moment from 'moment-timezone';
import recursive from 'recursive-readdir';
import fileProcessor from './file-processor';
import lineProcessor, { replaceAll } from './line-processor';
import {
  askAppName,
  askAppBinary,
  askAppDescription,
  askAuthor,
  askRepoDetails,
  askComponentDetails,
  askContainerDetails,
} from './inquirer';
import { makeDirIfNotExists } from './fs-helpers';

const isWin = () => process.platform === 'win32';

const endsWithAny = (text, anyStrings, nocharcase = false) => {
  if (anyStrings == null) {
    return false;
  }

  for (let i = 0; i < anyStrings.length; i += 1) {
    const endsWith = nocharcase
      ? text.toUpperCase().endsWith(anyStrings[i].toUpperCase())
      : text.endsWith(anyStrings[i]);
    if (endsWith) {
      return true;
    }
  }

  return false;
};

const packagePostProcessor = (packageFileName) => {
  let buildedPackage;

  if (!fs.existsSync(packageFileName)) {
    return;
  }

  try {
    buildedPackage = JSON.parse(fs.readFileSync(packageFileName));
    if (buildedPackage.repository && buildedPackage.repository.url === '') {
      delete buildedPackage.repository;
    }

    if (buildedPackage.author && buildedPackage.author.email === '') {
      delete buildedPackage.author;
    }

    fs.writeFileSync(packageFileName, JSON.stringify(buildedPackage, null, 2));
  } catch (error) {
    console.log(error);
  }
};

const extractTemplate = (
  templateFileName,
  destDir,
  replaceDictionary,
  skipFileNames,
  postProcessors,
) => {
  if (!fs.existsSync(templateFileName)) {
    throw new Error(`Project template file not found ${templateFileName}`);
  }

  tmp.dir((err, tmpDir, cleanupCallback) => {
    if (err) {
      throw err;
    }

    tar
      .x({
        file: templateFileName,
        strip: 1,
        C: tmpDir,
      })
      .then(() => {
        recursive(tmpDir, (error, files) => {
          if (error) {
            throw error;
          }

          const processor = fileProcessor(lineProcessor(replaceDictionary));
          files.forEach((file) => {
            const destFile = file.replace(tmpDir, destDir);
            if (endsWithAny(file, skipFileNames, true)) {
              makeDirIfNotExists(path.dirname(destFile));
              fs.copyFileSync(file, destFile);
            } else {
              processor(file, destFile, (fileName) => {
                postProcessors
                  .filter(postProc => postProc.fileName === fileName)
                  .forEach(postProc => postProc.postProcessor(postProc.fileName));
              });
            }
          });
        });
        cleanupCallback();
      })
      .catch(() => {
        cleanupCallback();
      });
  });
};

const normalizeName = name => (name.length && name[0] === '@' ? name.slice(1) : name);

const buildReplaceDictionary = async (type, projectDir, name) => {
  const appDetails = await askAppName(name || path.basename(projectDir));
  const result = [
    { key: '$DIRECTORY_NAME$', value: projectDir },
    {
      key: '$DIRECTORY_PLATFORM_STRING$',
      value: replaceAll(projectDir, path.sep, '$PATH_SEPARATOR$'),
    },
    { key: '$PATH_SEPARATOR$', value: isWin() ? `${path.sep}${path.sep}` : path.sep },
    { key: '$CURRENT_YEAR$', value: new Date().getFullYear() },
    { key: '$CURRENT_TIMEZONE$', value: moment.tz.guess() },
    { key: '$NAME$', value: appDetails.name },
    { key: '$NORMALIZED_NAME$', value: normalizeName(appDetails.name) },
  ];

  if (type === 'webapi' || type === 'webapp' || type === 'webdashboard') {
    const containerDetails = await askContainerDetails(
      result.find(item => item.key === '$NORMALIZED_NAME$').value,
    );
    result.push({ key: '$CONTAINER_NAME$', value: containerDetails.containerName });
  }

  if (type === 'cli') {
    const binInfo = await askAppBinary();
    result.push({ key: '$BIN$', value: binInfo.binName });
  }

  if (type === 'component') {
    const componentInfo = await askComponentDetails();
    result.push({ key: '$COMPONENT_NAME$', value: componentInfo.componentName });
  }

  if (type !== 'empty') {
    const appDescription = await askAppDescription(appDetails.name, type);
    const authorInfo = await askAuthor();
    const repoDetails = await askRepoDetails();
    result.push(
      { key: '$DESCRIPTION$', value: appDescription.description },
      { key: '$AUTHOR_EMAIL$', value: authorInfo.authorEmail },
      { key: '$AUTHOR_NAME$', value: authorInfo.authorName },
      { key: '$REPO_URL$', value: repoDetails.repoUrl },
    );
  }

  return result;
};

const summaryStrings = {
  npm_install: '\t\tnpm install',
  npm_run_start: '\t\tnpm run start',
  npm_run_start_desc: '\t\t\tStarts the application',
  npm_run_test: '\t\tnpm run test',
  npm_run_test_desc: '\t\t\tRuns the unit tests',
  npm_run_compile: '\t\tnpm run compile',
  npm_run_compile_desc:
    '\t\t\tCreates transpiled versions of source files with source maps (required for debugging)',
  npm_run_docker_build: '\t\tnpm run docker-build',
  npm_run_docker_build_desc: '\t\t\tBuilds docker image for this app (docker required)',
  npm_run_docker_run: '\t\tnpm run docker-run',
  npm_run_docker_run_desc:
    '\t\t\tRun docker container from image builded with npm run docker-build command (docker required)',
  or_if_you_want_docker: '\tor, if you want run this app in docker container:',
};

const writeEmptyAvailableCommands = () => {
  console.log(summaryStrings.npm_run_start);
  console.log(summaryStrings.npm_run_start);
  console.log('');
  console.log(summaryStrings.npm_run_test);
  console.log(summaryStrings.npm_run_test_desc);
  console.log('');
  console.log(summaryStrings.npm_run_compile);
  console.log(summaryStrings.npm_run_compile_desc);
};
const writeModuleAvailableCommands = () => {
  console.log(summaryStrings.npm_run_test);
  console.log(summaryStrings.npm_run_test_desc);
  console.log('');
  console.log(summaryStrings.npm_run_compile);
  console.log(summaryStrings.npm_run_compile_desc);
};
const writeComponentAvailableCommands = () => {
  console.log(summaryStrings.npm_run_start);
  console.log(`\t\t\t${summaryStrings.npm_run_start} with component preview`);
  console.log('');
  console.log(summaryStrings.npm_run_test);
  console.log(summaryStrings.npm_run_test_desc);
  console.log('');
  console.log(summaryStrings.npm_run_compile);
  console.log(summaryStrings.npm_run_compile_desc);
};
const writeCliAvailableCommands = () => {
  console.log('\t\tnpm run add');
  console.log('\t\t\tInstalls the application for tests');
  console.log('');
  console.log('\t\tnpm run remove');
  console.log('\t\t\tUninstalls the application from tests');
  console.log('');
  console.log(summaryStrings.npm_run_test);
  console.log(summaryStrings.npm_run_test_desc);
  console.log('');
  console.log(summaryStrings.npm_run_compile);
  console.log(summaryStrings.npm_run_compile_desc);
};
const writeWebApiAvailableCommands = () => {
  console.log(summaryStrings.npm_run_start);
  console.log(summaryStrings.npm_run_start);
  console.log('');
  console.log(summaryStrings.npm_run_test);
  console.log(summaryStrings.npm_run_test_desc);
  console.log('');
  console.log(summaryStrings.npm_run_compile);
  console.log(summaryStrings.npm_run_compile_desc);
  console.log('');
  console.log(summaryStrings.npm_run_docker_build);
  console.log(summaryStrings.npm_run_docker_build_desc);
  console.log('');
  console.log(summaryStrings.npm_run_docker_run);
  console.log(summaryStrings.npm_run_docker_run_desc);
};
const writeWebAppAvailableCommands = () => {
  console.log(summaryStrings.npm_run_test);
  console.log(summaryStrings.npm_run_test_desc);
  console.log('');
  console.log(summaryStrings.npm_run_compile);
  console.log(summaryStrings.npm_run_compile_desc);
  console.log('');
  console.log(summaryStrings.npm_run_docker_build);
  console.log(summaryStrings.npm_run_docker_build_desc);
  console.log('');
  console.log(summaryStrings.npm_run_docker_run);
  console.log(summaryStrings.npm_run_docker_run_desc);
};
const writeWebDashboardAvailableCommands = () => {
  console.log(summaryStrings.npm_run_test);
  console.log(summaryStrings.npm_run_test_desc);
  console.log('');
  console.log(summaryStrings.npm_run_compile);
  console.log(summaryStrings.npm_run_compile_desc);
  console.log('');
  console.log(summaryStrings.npm_run_docker_build);
  console.log(summaryStrings.npm_run_docker_build_desc);
  console.log('');
  console.log(summaryStrings.npm_run_docker_run);
  console.log(summaryStrings.npm_run_docker_run_desc);
};
const writeDesktopAvailableCommands = () => {
  console.log(summaryStrings.npm_run_start);
  console.log('\t\t\tStarts the application in development mode (electron with devtools)');
  console.log('');
  console.log(summaryStrings.npm_run_test);
  console.log(summaryStrings.npm_run_test_desc);
  console.log('');
  console.log('\t\tnpm run pack');
  console.log('\t\t\tBuilds application package for deployment');
};

const writeRealTimeAvailableCommands = () => {
  console.log('\t\tIn server directory:');
  writeWebApiAvailableCommands();
  console.log('');
  console.log('\t\tIn client directory:');
  writeWebAppAvailableCommands();
};

const writeEmptySuggestCommands = () => {
  console.log(summaryStrings.npm_run_start);
};
const writeModuleSuggestCommands = () => {
  console.log(summaryStrings.npm_run_test);
};
const writeComponentSuggestCommands = () => {
  console.log(summaryStrings.npm_run_start);
};
const writeCliSuggestCommands = (binCommandText) => {
  console.log('\t\tnpm run add');
  console.log(`\t\t${binCommandText}`);
  console.log('\t\tnpm run remove');
};
const writeWebApiSuggestCommands = (relativeDir) => {
  console.log(summaryStrings.npm_run_start);
  console.log('');
  console.log(summaryStrings.or_if_you_want_docker);
  console.log('');
  console.log(`\t\tcd ${relativeDir}`);
  console.log(summaryStrings.npm_install);
  console.log(summaryStrings.npm_run_docker_build);
  console.log(summaryStrings.npm_run_docker_run);
};
const writeWebAppSuggestCommands = (relativeDir) => {
  console.log(summaryStrings.npm_run_start);
  console.log('');
  console.log(summaryStrings.or_if_you_want_docker);
  console.log('');
  console.log(`\t\tcd ${relativeDir}`);
  console.log(summaryStrings.npm_install);
  console.log(summaryStrings.npm_run_docker_build);
  console.log(summaryStrings.npm_run_docker_run);
};
const writeWebDashboardSuggestCommands = (relativeDir) => {
  console.log(summaryStrings.npm_run_start);
  console.log('');
  console.log(summaryStrings.or_if_you_want_docker);
  console.log('');
  console.log(`\t\tcd ${relativeDir}`);
  console.log(summaryStrings.npm_install);
  console.log(summaryStrings.npm_run_docker_build);
  console.log(summaryStrings.npm_run_docker_run);
};
const writeDesktopSuggestCommands = () => {
  console.log(summaryStrings.npm_run_start);
};
const writeRealTimeSuggestCommands = () => {
  console.log(summaryStrings.npm_run_start);
};

const writeSummary = (type, dir, replaceDictionary) => {
  const relativeDir = path.relative(process.cwd(), dir);
  console.log('');
  if (type === 'realtime') {
    console.log(`\tSuccess! Created server application at ${relativeDir}/server`);
    console.log(`\tand client application at ${relativeDir}/client`);
    console.log('\tInside these directories, you can run several commands:');
  } else {
    console.log(
      `\tSuccess! Created ${
        replaceDictionary.find(item => item.key === '$NAME$').value
      } at ${relativeDir}`,
    );
    console.log('\tInside that directory, you can run several commands:');
  }
  console.log('');

  switch (type) {
    case 'empty':
      writeEmptyAvailableCommands();
      break;
    case 'module':
      writeModuleAvailableCommands();
      break;
    case 'component':
      writeComponentAvailableCommands();
      break;
    case 'cli':
      writeCliAvailableCommands();
      break;
    case 'webapi':
      writeWebApiAvailableCommands();
      break;
    case 'webapp':
      writeWebAppAvailableCommands();
      break;
    case 'webdashboard':
      writeWebDashboardAvailableCommands();
      break;
    case 'desktop':
      writeDesktopAvailableCommands();
      break;
    case 'realtime':
      writeRealTimeAvailableCommands();
      break;
    default:
      break;
  }

  console.log('');
  console.log('\tWe suggest that you begin by typing:');
  console.log('');
  if (type !== 'realtime') {
    console.log(`\t\tcd ${relativeDir}`);
    console.log(summaryStrings.npm_install);
  }

  switch (type) {
    case 'empty':
      writeEmptySuggestCommands();
      break;
    case 'module':
      writeModuleSuggestCommands();
      break;
    case 'component':
      writeComponentSuggestCommands();
      break;
    case 'cli':
      writeCliSuggestCommands(replaceDictionary.find(item => item.key === '$BIN$').value);
      break;
    case 'webapi':
      writeWebApiSuggestCommands(relativeDir);
      break;
    case 'webapp':
      writeWebAppSuggestCommands(relativeDir);
      break;
    case 'webdashboard':
      writeWebDashboardSuggestCommands(relativeDir);
      break;
    case 'desktop':
      writeDesktopSuggestCommands();
      break;
    case 'realtime':
      console.log(`\t\tcd ${relativeDir}\\server`);
      console.log(summaryStrings.npm_install);
      writeWebApiSuggestCommands();
      console.log('');
      console.log(`\t\tcd ${relativeDir}\\client`);
      console.log(summaryStrings.npm_install);
      writeWebAppSuggestCommands();
      break;
    default:
      break;
  }

  console.log('');
  console.log('\tHappy hacking!');
  console.log('');
};

const build = async (projectType, projectDir, projectName) => {
  const replaceDictionary = await buildReplaceDictionary(projectType, projectDir, projectName);
  const templateFileName = path.join(__dirname, 'templates', `${projectType}.tar.gz`);
  console.log();
  console.log(
    `building a project ${
      replaceDictionary.find(item => item.key === '$NAME$').value
    }, please wait...`,
  );
  const skipFileNames = [];
  if (
    projectType === 'component'
    || projectType === 'webapp'
    || projectType === 'desktop'
    || projectType === 'realtime'
  ) {
    skipFileNames.push('favicon.ico');
  }

  if (projectType === 'desktop') {
    skipFileNames.push('.png', '.ico', '.icns');
  }

  extractTemplate(templateFileName, projectDir, replaceDictionary, skipFileNames, [
    { fileName: path.join(projectDir, 'package.json'), postProcessor: packagePostProcessor },
  ]);
  writeSummary(projectType, projectDir, replaceDictionary);
};

export default build;
