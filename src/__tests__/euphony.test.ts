// compatibility fix for web audio api to work with jsdom
import 'web-audio-test-api';
// import euphony
import * as Euphony from '../index';

describe('Euphony Global Tests', () => {
  test('Check audio context for proper initialization', () => {
    expect(typeof Euphony.CONTEXT).toBeDefined();
  });
});
