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
  /* Abstract Members */

  /**
   * Shcedules the audio to be played
   *
   * *Note: It is recommended to allow some amount of scheduling time to prevent audio glitches*
   * @param delay Amount of time in seconds before the audio begins playback
   */
  abstract play(delay: number): void;
  /**
   * Shcedules the audio to be paused, playback can then be resumed by calling {@link Controller.play}
   *
   * *Note: It is recommended to allow some amount of scheduling time to prevent audio glitches*
   * @param delay Amount of time in seconds before the audio is paused
   */
  abstract pause(delay: number): void;
  /**
   * Shcedules the audio to be paused, playback can then be resumed by calling {@link Playback.play}
   *
   * *Note: It is recommended to allow some amount of scheduling time to prevent audio glitches*
   * @param delay Amount of time in seconds before the audio is paused
   */
  abstract stop(delay: number): void;

  /* Data Members and Constructor */

  /**
   * Underlying gain node for controlling volume
   * @internal
   */
  protected _gainNode: GainNode;
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

    // connect controller to output
    this.analyser.connect(CONTEXT.destination);
  }
}
