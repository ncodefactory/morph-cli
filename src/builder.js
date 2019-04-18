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
} from './inquirer';
import { makeDirIfNotExists } from './fs-helpers';
import { isWin } from './os-helpers';

const endsWithAny = (text, anyStrings) => {
  if (anyStrings == null) {
    return false;
  }

  for (let i = 0; i < anyStrings.length; i = +1) {
    if (text.endsWith(anyStrings[i])) {
      return true;
    }
  }

  return false;
};

const nodeEnvIsDebug = () => process.env.NODE_ENV !== 'production';

const extractTemplate = (templateFileName, destDir, replaceDictionary, skipFileNames) => {
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
            if (endsWithAny(file, skipFileNames)) {
              makeDirIfNotExists(path.dirname(destFile));
              fs.copyFileSync(file, destFile);
            } else {
              processor(file, destFile);
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
  const appDetails = await askAppName(name);
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
    const defaultRepoUrl = `https://github.com/${
      appDetails.name.length && appDetails.name[0] === '@'
        ? appDetails.name.slice(1)
        : appDetails.name
    }`;
    const repoDetails = await askRepoDetails(defaultRepoUrl);
    result.push(
      { key: '$DESCRIPTION$', value: appDescription.description },
      { key: '$AUTHOR_EMAIL$', value: authorInfo.authorEmail },
      { key: '$AUTHOR_NAME$', value: authorInfo.authorName },
      { key: '$REPO_URL$', value: repoDetails.repoUrl },
    );
  }

  return result;
};

/* eslint-disable no-console */
const writeSummary = (type, dir, replaceDictionary) => {
  const relativeDir = path.relative(process.cwd(), dir);
  console.log('');
  console.log(
    `\tSuccess! Created ${
      replaceDictionary.find(item => item.key === '$NAME$').value
    } at ${relativeDir}`,
  );
  console.log('\tInside that directory, you can run several commands:');
  console.log('');
  if (type === 'empty' || type === 'webapi') {
    console.log('\t\tnpm run start');
    console.log('\t\t\tStarts the application');
    console.log('');
  }

  if (type === 'component') {
    console.log('\t\tnpm run start');
    console.log('\t\t\tStarts the test application with component preview');
    console.log('');
  }

  if (type === 'cli') {
    console.log('\t\tnpm run add');
    console.log('\t\t\tInstalls the application for tests');
    console.log('');
    console.log('\t\tnpm run remove');
    console.log('\t\t\tUninstalls the application from tests');
    console.log('');
  }

  console.log('\t\tnpm run test');
  console.log('\t\t\tRuns the unit tests');
  console.log('');
  console.log('\t\tnpm run compile');
  console.log(
    '\t\t\tCreates transpiled versions of source files with source maps (required for debugging)',
  );
  console.log('');
  console.log('\t\tnpm run upgrade');
  console.log('\t\t\tUpgrades dependencies to the latest verisons');

  if (type === 'webapi' || type === 'webapp') {
    console.log('');
    console.log('\t\tnpm run docker-build');
    console.log('\t\t\tBuilds docker image for this app (docker required)');
    console.log('');
    console.log('\t\tnpm run docker-run');
    console.log(
      '\t\t\tRun docker container from image builded with npm run docker-build command (docker required)',
    );
  }

  console.log('');
  console.log('\tWe suggest that you begin by typing:');
  console.log('');
  console.log(`\t\tcd ${relativeDir}`);
  console.log('\t\tnpm install');
  if (type === 'empty' || type === 'component' || type === 'webapi' || type === 'webapp') {
    console.log('\t\tnpm run start');
  }

  if (type === 'module') {
    console.log('\t\tnpm run test');
  }

  if (type === 'cli') {
    console.log('\t\tnpm run add');
    console.log(`\t\t${replaceDictionary.find(item => item.key === '$BIN$').value}`);
    console.log('\t\tnpm run remove');
  }

  console.log('');
  console.log('\tHappy hacking!');
  console.log('');
};
/* eslint-enable no-console */

const build = async (projectType, projectDir, projectName) => {
  const replaceDictionary = await buildReplaceDictionary(projectType, projectDir, projectName);
  const templatesDir = nodeEnvIsDebug ? '../assets/templates' : 'templates';
  const templateFileName = path.join(__dirname, templatesDir, `${projectType}.tar.gz`);
  console.log(); // eslint-disable-line no-console
  // eslint-disable-next-line no-console
  console.log(
    `building a project ${
      replaceDictionary.find(item => item.key === '$NAME$').value
    }, please wait...`,
  ); // eslint-disable-line no-console
  const skipFileNames = [];
  if (projectType === 'component') {
    skipFileNames.push('favicon.ico');
  }

  extractTemplate(templateFileName, projectDir, replaceDictionary, skipFileNames);
  writeSummary(projectType, projectDir, replaceDictionary);
};

export default build;
