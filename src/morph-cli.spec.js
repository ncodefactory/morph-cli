import { expect } from 'chai';
import { name, version } from '../package.json';
import { moduleName, moduleVersion } from './morph-cli';

describe(name, () => {
  describe('moduleVersion', () => {
    it('is correct', () => {
      expect(moduleVersion).to.equal(version);
    });
  });
  describe('moduleName', () => {
    it('is correct', () => {
      expect(moduleName).to.equal(name);
    });
  });
});
