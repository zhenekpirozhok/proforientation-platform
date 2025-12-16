import { slugify } from './slugify';

describe('slugify', () => {
  it('converts string to slug', () => {
    expect(slugify(' Hello World! ')).toBe('hello-world');
  });
});
