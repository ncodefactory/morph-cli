import Stream from 'stream';
import readline from 'readline';
import path from 'path';
import fs from 'fs';
import { makeDirIfNotExists } from './fs-helpers';

const fileProcessor = lineProcessor => (sourcefileName, destinationFileName) => {
  if (fs.existsSync(destinationFileName)) {
    fs.unlinkSync(destinationFileName);
  }

  const instream = fs.createReadStream(sourcefileName);
  const outstream = new Stream();
  outstream.readable = true;
  outstream.writable = true;

  const rl = readline.createInterface({
    input: instream,
    output: outstream,
    terminal: false,
  });
  const destDir = path.dirname(destinationFileName);
  makeDirIfNotExists(destDir);

  rl.on('line', (line) => {
    fs.appendFileSync(destinationFileName, lineProcessor(line) + '\n');
  });
};

export default fileProcessor;
