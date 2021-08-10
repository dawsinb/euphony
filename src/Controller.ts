import { CONTEXT, EuphonyNode } from './Euphony';
import { Analyser, AnalyserOptions, AnalyserOptionsDefaults } from './Analyser';

/**
 * Options for configuring {@link Controller}
 */
export interface ControllerOptions extends AnalyserOptions {
  volume?: number;
}
/** @internal */
export const ControllerOptionsDefaults: Required<ControllerOptions> = {
  volume: 1.0,
  ...AnalyserOptionsDefaults,
};

/**
 * Controller used by source and logical nodes, which includes volume control and an {@link Analyser} for visualization
 */
export abstract class Controller extends EuphonyNode {
  /* Data Members and Constructor */

  readonly input: AudioNode;
  readonly output: AudioNode;

  /**
   * Underlying gain node for controlling volume
   * @internal
   */
  private _gainNode: GainNode;
  /**
   * Euphony analyser for visualization
   */
  analyser: Analyser;

  /**
   * Volume of the controller, scale 0.0 to 1.0
   */
  get volume() {
    return this._gainNode.gain.value;
  }
  set volume(volume) {
    this._gainNode.gain.value = volume;
  }

  /**
   *
   * @constructor
   * @param options Optional parameters for creating the controller. See {@link ControllerOptions} for more details
   */
  constructor(options: ControllerOptions) {
    super();
    // update options to include defaults
    const updatedOptions: Required<ControllerOptions> = { ...ControllerOptionsDefaults, ...options };

    // create analyser
    this.analyser = new Analyser(updatedOptions);

    // create gain node and connect it to the analyser
    this._gainNode = CONTEXT.createGain();
    this._gainNode.gain.value = updatedOptions.volume;
    this._gainNode.connect(this.analyser.input);

    // denote input and output WebAudio nodes
    this.input = this._gainNode;
    this.output = this.analyser.output;
  }
}
