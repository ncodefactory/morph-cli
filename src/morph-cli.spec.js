import { describe, it } from 'mocha';
import assert from 'assert';
import { name, version } from '../package.json';
import { moduleName, moduleVersion } from './morph-cli';

describe(name, () => {
  describe('moduleVersion', () => {
    it('is correct', () => {
      assert.equal(moduleVersion, version);
    });
  });
  describe('moduleName', () => {
    it('is correct', () => {
      assert.equal(moduleName, name.split('/')[1]);
    });
  });
});
