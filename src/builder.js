import repoUrl from 'get-repository-url';
import fs from 'fs';
import tar from 'tar';
import tmp from 'tmp';
import path from 'path';
import recursive from 'recursive-readdir';
import fileProcessor from './file-processor';
import lineProcessor from './line-processor';
import {
  askAppName, askAppDescription, askAuthor, askRepoDetails,
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

const buildReplaceDictionary = async (type, name) => {
  const appDetails = await askAppName(name);
  const result = [
    { key: '$CURRENT_YEAR$', value: new Date().getFullYear() },
    { key: '$NAME$', value: appDetails.name },
  ];

  if (name !== 'empy') {
    const appDescription = await askAppDescription(appDetails.name);
    const authorInfo = await askAuthor();
    const defaultRepoUrl = await repoUrl(appDetails.name);
    const repoDetails = await askRepoDetails(defaultRepoUrl);
    result.push(
      { key: '$DESCRIPTION$', value: appDescription.description },
      { key: '$AUTHOR_EMAIL$', value: authorInfo.authorEmail },
      { key: '$AUTHOR_NAME$', value: authorInfo.authorName },
      { key: '$REPO_URL', value: repoDetails.repoUrl },
    );
  }

  return result;
};

/* eslint-disable no-console */
const writeSummary = (type, dir, name) => {
  console.log('');
  console.log(`\tSuccess! Created ${name} at ${path.resolve(path.join(process.cwd(), dir))}`);
  console.log('\tInside that directory, you can run several commands:');
  console.log('');
  console.log('\t\tnpm run start');
  console.log('\t\t\tStarts the application');
  console.log('');
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
  console.log(`\t\tcd ${dir}`);
  console.log('\t\tnpm install');
  console.log('\t\tnpm run start');
  console.log('');
  console.log('\tHappy hacking!');
  switch (type) {
    case 'empty':
      return;
    default:
      throw new Error(`Unsupported type in summary writer ${type}`);
  }
};
/* eslint-enable no-console */

const build = (type, projectDir, projectName, replaceDictionary) => {
  const templatesDir = nodeEnvIsDebug ? '../assets/templates' : 'templates';
  const templateFileName = path.join(__dirname, templatesDir, `${type}.tar.gz`);
  console.log(); // eslint-disable-line no-console
  console.log(`building a project ${projectName}, please wait...`); // eslint-disable-line no-console
  ExtractTemplate(templateFileName, projectDir, replaceDictionary);
  writeSummary(type, projectDir, projectName);
};
export { buildReplaceDictionary };
export default build;
