#!/usr/bin/env node
import { run } from './morph-cli';

(async () => {
  try {
    await run();
  } catch (error) {
    console.log(error); // eslint-disable-line no-console
  }
})();
