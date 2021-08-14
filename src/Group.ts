import { CONTEXT } from './Euphony';
import { Controller, ControllerOptions, ControllerOptionsDefaults } from './Controller';
import { Playback } from './Playback';

/**
 * Options for configuring {@link Group}
 */
// tslint:disable-next-line:no-empty-interface
export interface GroupOptions extends ControllerOptions {
  sources?: Array<Controller>;
}
/** @internal */
export const GroupOptionsDefaults: Required<GroupOptions> = {
  sources: new Array<Controller>(),
  ...ControllerOptionsDefaults,
};

export class Group extends Controller {
  /* Data Members and Constructor */

  readonly input: AudioNode;
  readonly output: AudioNode;

  get sources(): Array<Controller> {
    return this.#sources;
  }
  #sources: Array<Controller>;

  constructor(options: GroupOptions = {}) {
    super(options);
    // update options to include defaults
    const updatedOptions: Required<GroupOptions> = { ...GroupOptionsDefaults, ...options };

    // set input and output WebAudio nodes
    this.input = this._gainNode;
    this.output = this.analyser.output;

    // initialize sources list with given sources
    this.#sources = updatedOptions.sources;
    // connect sources to the group
    updatedOptions.sources.forEach((source) => {
      source.output.disconnect();
      source.output.connect(this.input);
    });
  }

  /**
   * Shcedules the audio to be played for each member in the group, including those of other connected groups recursively.
   *
   * *Note: It is recommended to allow some amount of scheduling time to prevent audio glitches*
   * @param delay Amount of time in seconds before the audio is paused
   */
  play(delay: number = 0.1): void {
    this.#sources.forEach((source) => {
      source.play(delay);
    });
  }
  /**
   * Shcedules the audio to be paused for each member in the group, including those of other connected groups recursively.
   * Playback can then be resumed by calling {@link Group.play}
   *
   * *Note: It is recommended to allow some amount of scheduling time to prevent audio glitches*
   * @param delay Amount of time in seconds before the audio is paused
   */
  pause(delay: number = 0.1): void {
    this.#sources.forEach((source) => {
      source.pause(delay);
    });
  }
  /**
   * Shcedules the audio to be stopped for each member in the group, including those of other connected groups recursively.
   * If played again by calling {@link Group.play} the previous time will not be remembered
   *
   * *Note: It is recommended to allow some amount of scheduling time to prevent audio glitches*
   * @param delay Amount of time in seconds before the audio is paused
   */
  stop(delay: number = 0.1): void {
    this.#sources.forEach((source) => {
      source.stop(delay);
    });
  }

  /**
   * Synchronizes all members of a group to the length of the maximum buffer, including those of other connected sub-groups recursively.
   *
   * @param _length Forces the buffers to be synced to this value. ***This is only used for the recursion and does not need to be set***
   */
  sync(_length?: number): void {
    // determine length to set buffers to
    let length: number = 0;
    // if no length given, calculate maximum length
    if (_length === undefined) {
      length = this._getMaxBufferLength();
    }
    // else use the force value given in the param
    else {
      length = _length;
    }

    // loop through all sources inlcuding those in sub-groups and adjust the buffer
    this.#sources.forEach((source) => {
      if (source instanceof Group) {
        // sync buffers of subgroup and force length to the already calculated value
        source.sync(length);
      } else if (source instanceof Playback) {
        source.adjustBuffer(length);
      }
    });
  }
  /**
   * Gets the maximum buffer length of all sources including those in sub-groups recursively
   * @internal
   */
  _getMaxBufferLength(): number {
    // loop through all sources and recurse through subgroups to get max length
    let maxLength: number = 0;
    this.#sources.forEach((source) => {
      if (source instanceof Group) {
        // recursively get max length of sub group
        const result: number = source._getMaxBufferLength();
        maxLength = Math.max(result, maxLength);
      } else if (source instanceof Playback) {
        maxLength = Math.max(source.length, maxLength);
      }
    });
    // return max length that was found
    return maxLength;
  }
}
