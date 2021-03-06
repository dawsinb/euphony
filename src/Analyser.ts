import { CONTEXT, EuphonyNode } from './Euphony';

/**
 * Options for configuring {@link Analyser}
 */
export interface AnalyserOptions {
  /**
   * Threshold which sets {@link Analyser.signal} to true when {@link Analyser.amplitude} is greater than it
   *
   * *Defaults to 0.2*
   */
  threshold?: number;
  /**
   * Callback function that executes when {@link Analyser.signal} turns from false to true
   */
  onSignal?: () => void;
  /**
   * Callback function that executes when {@link Analyser.signal} turns from true to false
   */
  offSignal?: () => void;
  /**
   * Number of frequency bands to split the raw {@link Analyser.frequency} data into
   */
  numberOfBands?: number;
  /**
   * Window size used by the Fast Fourier Transform (FFT) for analysis.
   * Must be a power of 2 between 2^5 and 2^15
   *
   * *Defaults to 2048 (2^11)*
   */
  fftSize?: number;
  /**
   * The minimum decibel value used for scaling FFT data.
   * Any values equal to or lower than this are returned as 0
   *
   * *Defaults to -100*
   */
  minDecibels?: number;
  /**
   * The maximum decibel value used for scaling FFT data.
   * Any values equal to or greater than this are returned as 1
   *
   * *Defaults to -30*
   */
  maxDecibels?: number;
  /**
   * Averaging constant used to smooth FFT analysis data on a scale from 0.0 to 1.0,
   * where 0 represents no averaging and 1 maximum averaging.
   *
   * *Defaults to 0.8*
   */
  smoothingTimeConstant?: number;
}
/** @internal */
export const AnalyserOptionsDefaults: Required<AnalyserOptions> = {
  threshold: 0.2,
  onSignal: () => undefined,
  offSignal: () => undefined,
  numberOfBands: 5,
  fftSize: 2048,
  minDecibels: -100,
  maxDecibels: -30,
  smoothingTimeConstant: 0.8,
};

/**
 * Analyser which retrieves frequency/waveform data of the signal passing through it
 */
export class Analyser extends EuphonyNode {
  /* Data Members and Constructor */

  readonly input: AudioNode;
  readonly output: AudioNode;

  /**
   * Underlying analyser node for visualization data
   * @category Settings
   */
  protected _analyserNode: AnalyserNode;
  /**
   * Window size used by the Fast Fourier Transform (FFT) for analysis.
   * Higher values increase the detail in the frequency data but decrease detail in the waveform data
   * @category Settings
   */
  get fftSize(): number {
    return this._analyserNode.fftSize;
  }
  set fftSize(value: number) {
    // check if given number is within the bounds of 2^5 and 2^15 and is a power of 2
    if (value < 2 ** 5 || value > 2 ** 15 || !(Math.log2(value) % 1 === 0)) {
      throw new RangeError(
        `FFT window must be a power of 2 within bounds of 2^5 and 2^15. Attempted input of ${value}`,
      );
    }

    // update analyser node's fftSize
    this._analyserNode.fftSize = value;
    // update frequency and waveform arrays to new size
    this._frequencyBuffer = new Uint8Array(this.frequencyBinCount);
    this.#frequency = new Float32Array(this.frequencyBinCount);
    this._waveformBuffer = new Uint8Array(this.fftSize);
    this.#waveform = new Float32Array(this.fftSize);
  }
  /**
   * Number of frequency bins used for the FFT.
   * Equal to half of the {@link Analyser.fftSize} and represents the length of {@link Analyser.frequency}
   * @category Settings
   * @readonly
   */
  get frequencyBinCount(): number {
    return this._analyserNode.frequencyBinCount;
  }
  /**
   * The minimum decibel value used for scaling FFT data. Any values equal to or lower than this are returned as 0
   * @category Settings
   */
  get minDecibels(): number {
    return this._analyserNode.minDecibels;
  }
  set minDecibels(value: number) {
    // ensure value is less than max decibels value
    if (value >= this.maxDecibels) {
      throw new RangeError(
        `Attempted to set minDecibels to ${value} which isn't lower than maxDecibels value of ${this.maxDecibels}`,
      );
    }
    this._analyserNode.minDecibels = value;
  }
  /**
   * The maximum decibel value used for scaling FFT data. Any values equal to or higher than this are returned as 1
   * @category Settings
   */
  get maxDecibels(): number {
    return this._analyserNode.maxDecibels;
  }
  set maxDecibels(value: number) {
    // ensure value is less than max decibels value
    if (value <= this.minDecibels) {
      throw new RangeError(
        `Attempted to set maxDecibels to ${value} which isn't greater than minDecibels value of ${this.minDecibels}`,
      );
    }
    this._analyserNode.maxDecibels = value;
  }
  /**
   * Averaging constant used to smooth analysis data on a scale from 0.0 to 1.0, where 0 represents no averaging and 1 maximum averaging.
   * @category Settings
   */
  get smoothingTimeConstant(): number {
    return this._analyserNode.smoothingTimeConstant;
  }
  set smoothingTimeConstant(value: number) {
    // check if given number is within the bounds of 0 and 1
    if (value < 0 || value > 1) {
      throw new RangeError(`SmoothingTimeConstant must be within bounds of 0 and 1. Attempted input of ${value}`);
    }

    this._analyserNode.smoothingTimeConstant = value;
  }
  /**
   * Threshold which sets {@link Analyser.signal} to true when {@link Analyser.amplitude} is greater than it
   * @category Settings
   */
  get threshold(): number {
    return this.#threshold;
  }
  set threshold(value: number) {
    // check if given number is within the bounds of 0 and 1
    if (value < 0 || value > 1) {
      throw new RangeError(`Threshold must be within bounds of 0 and 1. Attempted input of ${value}`);
    }

    this.#threshold = value;
  }
  /** @internal */
  #threshold: number;

  /**
   * Buffer to hold raw frequency data
   * @category Data
   */
  private _frequencyBuffer: Uint8Array;
  /**
   * Computed frequency data with each item being the normalized decibel value from 0.0 to 1.0 for a specefic frequency.
   * Where the range of the scale represents {@link Analyser.minDecibels} and {@link Analyser.maxDecibels} respectively.
   * The frequencies are linearly spread from 0 to half of the sample rate which is determined by the audio device used for output
   * and the length of the array is equal to the {@link Analyser.frequencyBinCount}.
   *
   * ***Note: Only updated on {@link Analyser.updateFrequency} call****
   * @category Data
   * @readonly
   */
  get frequency(): Float32Array {
    return this.#frequency;
  }
  /** @internal */
  #frequency: Float32Array;
  /**
   * Computed amplitude showing the mean normalized decibel value from 0.0 to 1.0,
   * where the minimum of the scale represents the {@link Analyser.minDecibels} and the maximum {@link Analyser.maxDecibels}.
   *
   * ***Note: Only updated on {@link Analyser.updateFrequency} call***
   * @category Data
   * @readonly
   */
  get amplitude(): number {
    return this.#amplitude;
  }
  /** @internal */
  #amplitude: number;
  /**
   * Output signal of the node, true when {@link Analyser.amplitude} is greater than {@link Analyser.threshold}
   *
   * ***Note: Only updated on {@link Analyser.updateFrequency} call****
   * @category Data
   * @readonly
   */
  get signal(): boolean {
    return this.#signal;
  }
  /** @internal  */
  #signal: boolean;
  /**
   * Callback function that executes when {@link Analyser.signal} turns from false to true
   */
  onSignal: () => void;
  /**
   * Callback function that executes when {@link Analyser.signal} turns from true to false
   */
  offSignal: () => void;

  /**
   * Frequency data by band intervals. Bands are divided up on a log-scale according to {@link Analyser.numberOfBands}.
   *
   * Takes the highest frequency in each band as the intensity for that band
   */
  get bands(): Float32Array {
    return this.#bands;
  }
  /** @internal */
  #bands: Float32Array = new Float32Array();
  /**
   * Number of frequency bands to split the raw {@link Analyser.frequency} data into
   */
  set numberOfBands(count: number) {
    // check if given number is within bounds
    if (count < 1) {
      throw RangeError(`Number of bands can't be lawer than 1`);
    }
    if (count > Math.log(this.fftSize)) {
      throw RangeError(`Number of bands can't be greater than the log of the fftWindow ${Math.log(this.fftSize)}`);
    }

    // update number of bands
    this.#numberOfBands = count;
    // create new array with updated size
    this.#bands = new Float32Array(this.numberOfBands);
    // update band intervals
    this._bandIntervals = this.calcBandIntervals();
  }
  get numberOfBands(): number {
    return this.#numberOfBands;
  }
  /** @internal */
  #numberOfBands: number = 0;
  /** @internal */
  private _bandIntervals: Array<number> = [];

  /**
   * Buffer to hold raw waveform data
   * @category Data
   */
  private _waveformBuffer: Uint8Array;
  /**
   * Computed waveform data with each item being the normalized decibel value from -1.0 to 1.0 for each sample on the time domain.
   * The length of the array is equal to the {@link Analyser.fftSize}.
   *
   * ***Note: Only updated on {@link Analyser.updateWaveform} call****
   * @category Data
   * @readonly
   */
  get waveform(): Float32Array {
    return this.#waveform;
  }
  /** @internal */
  #waveform: Float32Array;

  /**
   *
   * @constructor
   * @param options Optional parameters for creating the analyser. See {@link AnalyserOptions} for more details
   */
  constructor(options: AnalyserOptions = {}) {
    super();
    // update options to include defaults
    const updatedOptions: Required<AnalyserOptions> = { ...AnalyserOptionsDefaults, ...options };

    // create underlying analyser node and apply options
    this._analyserNode = CONTEXT.createAnalyser();
    this.fftSize = updatedOptions.fftSize;
    this.minDecibels = updatedOptions.minDecibels;
    this.maxDecibels = updatedOptions.maxDecibels;
    this.smoothingTimeConstant = updatedOptions.smoothingTimeConstant;

    // denote input and output WebAudio nodes
    this.input = this._analyserNode;
    this.output = this._analyserNode;

    // create frequency buffer
    this._frequencyBuffer = new Uint8Array(this.frequencyBinCount);
    // create array to hold normalized frequency values
    this.#frequency = new Float32Array(this.frequencyBinCount);
    // init internal processed frequency data members
    this.#amplitude = 0;
    this.#signal = false;
    // init threshold to given option param
    this.#threshold = updatedOptions.threshold;

    // init signal callbacks
    this.onSignal = updatedOptions.onSignal;
    this.offSignal = updatedOptions.offSignal;

    // update number of bands
    this.numberOfBands = updatedOptions.numberOfBands;

    // create waveform buffer
    this._waveformBuffer = new Uint8Array(this.fftSize);
    // create array to hold normalized waveform values
    this.#waveform = new Float32Array(this.fftSize);
  }

  /* Functions */

  /**
   * Updates the data for {@link Analyser.frequency}, {@link Analyser.bands}, {@link Analyser.amplitude}, and {@link Analyser.signal}
   */
  updateFrequency(): void {
    // get raw frequency data (scale is 0-255)
    this._analyserNode.getByteFrequencyData(this._frequencyBuffer);
    // reset band data
    this.#bands.fill(0);

    // record frequency data
    let sum = 0;
    for (let i = 0; i < this.frequencyBinCount; i++) {
      // add data to amplitude sum
      sum += this._frequencyBuffer[i];

      // record normalized raw frequency data
      this.#frequency[i] = this._frequencyBuffer[i] / 255;

      // get band index
      const band = this._bandIntervals.findIndex((interval) => {
        return interval > i;
      });
      // if current value is greater than previous then replace it
      this.#bands[band] = Math.max(this.#bands[band], this.#frequency[i]);
    }
    // record mean normalized frequency data
    this.#amplitude = sum / this.frequencyBinCount / 255;

    // update signal
    if (this.#amplitude >= this.#threshold) {
      // if signal was previously false then trigger onSignal function
      if (!this.#signal) {
        this.onSignal();
      }
      this.#signal = true;
    } else {
      // if signal was previously true then trigger offSignal function
      if (this.#signal) {
        this.offSignal();
      }
      this.#signal = false;
    }
  }

  /**
   * Updates the data for {@link Analyser.waveform}
   */
  updateWaveform(): void {
    // get raw waveform data
    this._analyserNode.getByteTimeDomainData(this._waveformBuffer);

    // normalize waveform data
    for (let i = 0; i < this.fftSize; i++) {
      // subtract by 127 to get values between [-128, 128], then divide by 127 to normalize to [-1.0, 1.0]
      this.#waveform[i] = (this._waveformBuffer[i] - 128) / 128;
    }
  }

  /**
   * Calculates and records the log-scale intervals for the frequency bands
   * @internal
   */
  private calcBandIntervals(): Array<number> {
    // calculate logarithmic difference of start and end point
    const logDiff = Math.log(this.fftSize) / this.numberOfBands;
    // calculate exponential factor
    const factor = Math.exp(logDiff);

    // create array to hold results (start is 1)
    const intervals = [1];

    // loop to create each band interval
    // skip index 0 because we already have the start
    // skip last index because anything not in previous bands goes in the final band
    for (let i = 1; i < this.numberOfBands - 1; i++) {
      // caclulate last interval times the exponential factor
      let interval = intervals[intervals.length - 1] * factor;
      // convert to int
      interval = Math.floor(interval);

      intervals.push(interval);
    }

    return intervals;
  }
}
