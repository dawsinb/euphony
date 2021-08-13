// compatibility fix for web audio api to work with jsdom
import 'web-audio-test-api';
// import euphony
import * as Euphony from '../index';

describe('Playback Tests', () => {
  describe('Initialization Tests', () => {
    test('Initialization with default options', () => {
      const playback = new Euphony.Playback();

      // test params from playback class
      expect(playback.loop).toBe(Euphony.PlaybackOptionsDefaults.loop);
      // test params from base class controller
      expect(playback.volume).toBe(Euphony.PlaybackOptionsDefaults.volume);
      expect(playback.analyser.fftSize).toBe(Euphony.PlaybackOptionsDefaults.fftSize);
    });

    test('Initialization with config options', () => {
      const options = {
        loop: true,
        volume: 0.5,
        fftSize: 1024,
      };
      const playback = new Euphony.Playback(options);

      // test params from playback class
      expect(playback.loop).toBe(options.loop);
      // test params from base class controller
      expect(playback.volume).toBe(options.volume);
      expect(playback.analyser.fftSize).toBe(options.fftSize);
    });
  });
});
