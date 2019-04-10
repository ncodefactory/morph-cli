import { expect } from 'chai';
import handler from './new-handler';

describe('new command handler', () => {
  it('is a valid function', () => {
    handler('module', 'name');
  });
  it('throws an exception for an unsupported project type', () => {
    const unknownProjectType = 'unknown';
    expect(() => handler(unknownProjectType, 'name')).to.throw(
      `Unsupported projectType: ${unknownProjectType}`,
    );
  });
});
