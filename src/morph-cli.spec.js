import { expect } from 'chai';
import { version } from '../package.json';
import { moduleName, moduleVersion } from './morph-cli';

describe('morph-cli', () => {
  describe('moduleVersion', () => {
    it('is correct', () => {
      expect(moduleVersion).to.equal(version);
    });
  });
  describe('moduleName', () => {
    it('is correct', () => {
      expect(moduleName).to.equal('morph-cli');
    });
  });
});
