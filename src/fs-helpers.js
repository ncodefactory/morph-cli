import fs from 'fs';

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

const makeDirIfNotExists = (direcotryName) => {
  if (!directoryExists(direcotryName)) {
    fs.mkdirSync(direcotryName, { recursive: true });
  }
};

export { directoryExists, directoryIsEmpty, makeDirIfNotExists };
