import fs from 'fs';
import tar from 'tar';
import tmp from 'tmp';
import path from 'path';
import recursive from 'recursive-readdir';
import fileProcessor from './file-processor';
import lineProcessor from './line-processor';
import { askAuthor, askAppDetails, askRepoDetails } from './inquirer';

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
  const appDetails = await askAppDetails(name);
  const authorInfo = await askAuthor();
  const repoDetails = await askRepoDetails(name);
  const result = [
    { key: '$NAME$', value: appDetails.name },
    { key: '$DESCRIPTION$', value: appDetails.description },
    { key: '$AUTHOR_NAME$', value: authorInfo.authorName },
    { key: '$AUTHOR_EMAIL$', value: authorInfo.authorEmail },
    { key: '$REPO_URL$', value: repoDetails.repoUrl },
    { key: '$CURRENT_YEAR$', value: new Date().getFullYear() },
  ];
  switch (type) {
    case 'empty':
      return result;
    default:
      throw new Error(`Unsupported type in replaceDictionary builder ${type}`);
  }
};

/* eslint-disable no-console */
const writeSummary = (type, name) => {
  console.log('');
  console.log(`\tSuccess! Created ${name} at ${path.resolve(path.join(process.cwd(), name))}`);
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
  console.log('\tWe suggest that you begin by typing:');
  console.log('');
  console.log(`\t\tcd ${name}`);
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

const build = (type, directoryName, replaceDictionary) => {
  const templatesDir = nodeEnvIsDebug ? '../assets/templates' : 'templates';
  const templateFileName = path.join(__dirname, templatesDir, `${type}.tar.gz`);
  console.log(); // eslint-disable-line no-console
  console.log(`building a project ${directoryName}, please wait...`); // eslint-disable-line no-console
  ExtractTemplate(templateFileName, directoryName, replaceDictionary);
  writeSummary(type, directoryName);
};
export { buildReplaceDictionary };
export default build;
