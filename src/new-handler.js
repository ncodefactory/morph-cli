import path from 'path';
import fs from 'fs';
import { init } from './morph-cli';
import build, { buildReplaceDictionary } from './builder';

const supportedProjectTypes = [
  { name: 'empty', desc: 'empty node app' },
  // { name: 'module', desc: 'npm module' },
  // { name: 'api', desc: 'web api' },
  // { name: 'cli', desc: 'command line interface app' },
  // { name: 'component', desc: 'react app component' },
];

const getCurrentDirectoryBase = () => path.basename(process.cwd());

const directoryExists = (directoryName) => {
  try {
    return fs.statSync(directoryName).isDirectory();
  } catch (err) {
    return false;
  }
};

const directoryIsEmpty = (directoryName) => {
  try {
    return !fs.readdirSync(directoryName).length;
  } catch (err) {
    return false;
  }
};

const resolveProjectDir = (projectName) => {
  const dirBase = getCurrentDirectoryBase();
  return path.resolve(projectName || dirBase);
};

const throwWhenUnknownProjectType = (projectType) => {
  if (!supportedProjectTypes.some(value => value.name === projectType)) {
    throw new Error(
      `Unsupported project type: ${projectType}. Use one of the following: ${supportedProjectTypes
        .map(ut => ut.name)
        .join(', ')}`,
    );
  }
};

const handler = async (projectType, projectName, force) => {
  throwWhenUnknownProjectType(projectType);
  const projectDir = resolveProjectDir(projectName);
  if (!directoryExists(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  } else if (!directoryIsEmpty(projectDir)) {
    if (!force) {
      throw new Error(
        `Directory is not empty (${projectDir}). Use force to overwrite existing files`,
      );
    }
  }

  init(false);
  const replaceDictionary = await buildReplaceDictionary(projectType, projectName);
  build(projectType, projectDir, projectName, replaceDictionary);
};

export { supportedProjectTypes };
export default handler;
