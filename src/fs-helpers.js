import fs from 'fs';

const directoryExists = directoryName => {
  try {
    return fs.statSync(directoryName).isDirectory();
  } catch (err) {
    return false;
  }
};

const directoryIsEmpty = directoryName => {
  try {
    return !fs.readdirSync(directoryName).length;
  } catch (err) {
    return false;
  }
};

const makeDirIfNotExists = directoryName => {
  if (!directoryExists(directoryName)) {
    fs.mkdirSync(directoryName, { recursive: true });
  }
};

export { directoryExists, directoryIsEmpty, makeDirIfNotExists };
