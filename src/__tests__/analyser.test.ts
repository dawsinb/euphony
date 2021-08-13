// compatibility fix for web audio api to work with jsdom
import 'web-audio-test-api';
// import euphony
import * as Euphony from '../index';

describe('Analyser Tests', () => {
  describe('Initialization Tests', () => {
    test('Initialization with default options', () => {
      const analyser = new Euphony.Analyser();

      expect(analyser.threshold).toBe(Euphony.AnalyserOptionsDefaults.threshold);
      expect(analyser.fftSize).toBe(Euphony.AnalyserOptionsDefaults.fftSize);
      expect(analyser.minDecibels).toBe(Euphony.AnalyserOptionsDefaults.minDecibels);
      expect(analyser.maxDecibels).toBe(Euphony.AnalyserOptionsDefaults.maxDecibels);
      expect(analyser.smoothingTimeConstant).toBe(Euphony.AnalyserOptionsDefaults.smoothingTimeConstant);
    });

    test('Initialization with config options', () => {
      const options = {
        threshold: 0.5,
        fftSize: 1024,
        minDecibels: -80,
        maxDecibels: -40,
        smoothingTimeConstant: 0.6,
      };
      const analyser = new Euphony.Analyser(options);

      expect(analyser.threshold).toBe(options.threshold);
      expect(analyser.fftSize).toBe(options.fftSize);
      expect(analyser.minDecibels).toBe(options.minDecibels);
      expect(analyser.maxDecibels).toBe(options.maxDecibels);
      expect(analyser.smoothingTimeConstant).toBe(options.smoothingTimeConstant);
    });
  });
});
