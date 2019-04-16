import fs from 'fs';
import tar from 'tar';
import tmp from 'tmp';
import path from 'path';
import recursive from 'recursive-readdir';
import fileProcessor from './file-processor';
import lineProcessor from './line-processor';
import {
  askAppName,
  askAppBinary,
  askAppDescription,
  askAuthor,
  askRepoDetails,
  askComponentDetails,
} from './inquirer';

const nodeEnvIsDebug = () => process.env.NODE_ENV !== 'production';
const ExtractTemplate = (templateFileName, destDir, replaceDictionary) => {
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
            processor(file, file.replace(tmpDir, destDir));
          });
        });
        cleanupCallback();
      })
      .catch(() => {
        cleanupCallback();
      });
  });
};

const buildReplaceDictionary = async (type, projectDir, name) => {
  const appDetails = await askAppName(name);
  const result = [
    { key: '$DIRECTORY_NAME$', value: projectDir },
    { key: '$CURRENT_YEAR$', value: new Date().getFullYear() },
    { key: '$NAME$', value: appDetails.name },
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
    const appDescription = await askAppDescription(appDetails.name);
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
  if (type === 'empty') {
    console.log('\t\tnpm run start');
    console.log('\t\t\tStarts the application');
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
  console.log('');
  console.log('\tWe suggest that you begin by typing:');
  console.log('');
  console.log(`\t\tcd ${relativeDir}`);
  console.log('\t\tnpm install');
  if (type === 'empty') {
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
};
/* eslint-enable no-console */

const build = (type, projectDir, replaceDictionary) => {
  const templatesDir = nodeEnvIsDebug ? '../assets/templates' : 'templates';
  const templateFileName = path.join(__dirname, templatesDir, `${type}.tar.gz`);
  console.log(); // eslint-disable-line no-console
  // eslint-disable-next-line no-console
  console.log(
    `building a project ${
      replaceDictionary.find(item => item.key === '$NAME$').value
    }, please wait...`,
  ); // eslint-disable-line no-console
  ExtractTemplate(templateFileName, projectDir, replaceDictionary);
  writeSummary(type, projectDir, replaceDictionary);
};
export { buildReplaceDictionary };
export default build;
