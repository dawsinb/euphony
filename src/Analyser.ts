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
  private _analyserNode: AnalyserNode;
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
    if (value < 2 ** 5 || value > 2 ** 5 || !(Math.log2(value) % 1 === 0)) {
      throw new RangeError(
        `FFT window must be a power of 2 within bounds of 2^5 and 2^15. Attempted input of ${value}`,
      );
    }

    // update analyser node's fftSize
    this._analyserNode.fftSize = value;
    // update frequency and waveform arrays to new size
    this._frequencyBuffer = new Uint8Array(this.frequencyBinCount);
    this.#frequency = new Float32Array(this.frequencyBinCount);
    this.#waveform = new Uint8Array(this.fftSize);
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
    return this.threshold;
  }
  set threshold(value: number) {
    // check if given number is within the bounds of 0 and 1
    if (value < 0 || value > 1) {
      throw new RangeError(`Threshold must be within bounds of 0 and 1. Attempted input of ${value}`);
    }

    this.threshold = value;
  }

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
   * TODO: add desc (also need to figure out how waveform data is scaled/represented)
   * @category Data
   * @readonly
   */
  get waveform(): Uint8Array {
    return this.#waveform;
  }
  /** @internal */
  #waveform: Uint8Array;

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
    this.threshold = updatedOptions.fftSize;

    // create waveform buffer
    this.#waveform = new Uint8Array(this.fftSize);
  }

  /* Functions */

  /**
   * Updates the data for {@link Analyser.frequency}, {@link Analyser.amplitude}, and {@link Analyser.signal}
   */
  updateFrequency(): void {
    // get raw frequency data (scale is 0-255)
    this._analyserNode.getByteFrequencyData(this._frequencyBuffer);

    // record normalized frequency data as well as a sum of all raw frequency data
    let sum = 0;
    for (let i = 0; i < this.frequencyBinCount; i++) {
      this.frequency[i] = this._frequencyBuffer[i] / 255;
      sum += this._frequencyBuffer[i];
    }
    // normalize and record mean frequency data
    this.#amplitude = sum / this.frequencyBinCount / 255;

    // update signal
    this.#signal = this.amplitude >= this.threshold;
  }

  /**
   * TODO: add desc (also need to figure out how waveform data is scaled/represented)
   */
  updateWaveform(): void {
    // get waveform data
    this._analyserNode.getByteFrequencyData(this.#waveform);
  }
}
