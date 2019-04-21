import path from 'path';
import fs from 'fs';
import showModuleBanner from './module-banner';
import build from './builder';
import { directoryExists, directoryIsEmpty } from './fs-helpers';

const supportedProjectTypes = [
  { name: 'empty', desc: 'empty node app' },
  { name: 'module', desc: 'npm module' },
  { name: 'component', desc: 'react app component' },
  { name: 'cli', desc: 'command line interface app' },
  { name: 'webapi', desc: 'web api serwer or web app backend layer' },
  { name: 'webapp', desc: 'react app' },
];

const getCurrentDirectoryBase = () => path.basename(process.cwd());

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

const handler = async (projectType, dirName, force) => {
  throwWhenUnknownProjectType(projectType);
  const projectDir = resolveProjectDir(dirName);
  if (!directoryExists(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  } else if (!directoryIsEmpty(projectDir)) {
    if (!force) {
      throw new Error(
        `Directory is not empty (${projectDir}). Use force to overwrite existing files`,
      );
    }
  }

  showModuleBanner(false);
  build(projectType, projectDir, dirName);
};

export { supportedProjectTypes };
export default handler;
