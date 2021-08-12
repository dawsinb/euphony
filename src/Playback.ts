import { CONTEXT } from './Euphony';
import { Controller, ControllerOptions, ControllerOptionsDefaults } from './Controller';
import { CallbackOptions, DefaultCallbackOptions } from './Utils';

/**
 * Options for configuring {@link Playback}
 */
export interface PlaybackOptions extends ControllerOptions {
  loop: boolean;
}
/** @internal */
export const PlaybackOptionsDefaults: Required<PlaybackOptions> = {
  loop: false,
  ...ControllerOptionsDefaults,
};

/**
 * Playback node which can load and playback audio from a given url
 */
export class Playback extends Controller {
  /* Data Members and Constructor */

  readonly input: null;
  readonly output: AudioNode;

  /**
   * Underlying buffer source node
   * @internal
   */
  private _sourceNode: AudioBufferSourceNode;
  /**
   * Copy of the buffer to quickly recreate buffer source nodes
   */
  private _buffer: AudioBuffer;
  /**
   * Returns the length of the underlying audio buffer. In other words the length of the loaded audio
   */
  get length(): number {
    return this._buffer.length;
  }

  /**
   * Keeps track of the playing state of the node
   */
  private _playing: boolean = false;
  /**
   * Keeps track of the start time of the node for scheduling playback
   */
  private _startTime: number = 0;
  /**
   * Keeps track of the pause time of the node for scheduling playback
   */
  private _pauseTime: number = 0;

  /**
   * Controls weather the playback should loop after finishing or not
   */
  get loop(): boolean {
    return this._sourceNode.loop;
  }
  set loop(value: boolean) {
    this._sourceNode.loop = value;
  }

  /**
   *
   * @constructor
   * @param options Optional parameters for creating the playback. See {@link PlaybackOptions} for more details
   */
  constructor(options: PlaybackOptions) {
    super(options);
    // update options to include defaults
    const updatedOptions: Required<PlaybackOptions> = { ...PlaybackOptionsDefaults, ...options };

    // create buffer source node and connect it to the gain node
    this._sourceNode = CONTEXT.createBufferSource();
    this._sourceNode.connect(this._gainNode);
    // initialize empty buffer
    this._buffer = new AudioBuffer({ length: 0, sampleRate: CONTEXT.sampleRate });
    this._sourceNode.buffer = this._buffer;
    // set buffer source options
    this.loop = updatedOptions.loop;

    // set input and output WebAudio nodes (source node: so input is null)
    this.input = null;
    this.output = this.analyser.output;
  }

  /**
   * Loads audio from the given url into the audio node
   * @param url Url to load the audio data from (Can be local or external)
   * @param callbacks Callback functions to be used be the loader
   */
  async load(url: string, callbacks: CallbackOptions): Promise<void> {
    // update options to include defaults
    const updatedOptions = { ...DefaultCallbackOptions, callbacks };

    return (
      fetch(url)
        .then((response) => {
          // ensure proper network response
          if (!response.ok) {
            throw new Error('Network response not ok');
          }
          // transform raw data into array buffer
          return response.arrayBuffer();
        })
        // decode array buffer
        .then((buffer) => {
          CONTEXT.decodeAudioData(buffer, (decoded) => {
            this._buffer = decoded;
            this._sourceNode.buffer = this._buffer;
            updatedOptions.onLoad();
          });
        })
        // error handling
        .catch((error) => {
          updatedOptions.onError();
          throw new Error(`There was a problem with fetching/loading the audio: ${error}`);
        })
    );
  }

  /**
   * Shcedules the audio to be played
   *
   * *Note: It is recommended to allow some amount of scheduling time to prevent audio glitches*
   * @param delay Amount of time in seconds before the audio begins playback
   */
  play(delay = 0.1) {
    // ensure playback isn't already ongoing
    if (!this._playing) {
      // record playback status
      this._playing = true;

      // calculate adjusted delay time relative to the audio context
      const adjustedDelay = CONTEXT.currentTime + delay;

      // calculate offset if track was paused
      let offset = 0;
      if (this._pauseTime) {
        // calculate difference in pause and stop time
        offset = (this._pauseTime - this._startTime) % this.length;
        // reset pause time
        this._pauseTime = 0;
      }

      // queue the playback to start
      this._sourceNode.start(adjustedDelay, offset);
      this._startTime = adjustedDelay - offset;
    }
  }
  /**
   * Shcedules the audio to be paused, playback can then be resumed by calling {@link Playback.play}
   *
   * *Note: It is recommended to allow some amount of scheduling time to prevent audio glitches*
   * @param delay Amount of time in seconds before the audio is paused
   */
  pause(delay = 0.1): void {
    // TODO: REPLACE AUDIO NODE WHEN PLAYBACK IS FINISHED AND LOOPING IS DISABLED

    if (this._playing) {
      // record playback status
      this._playing = false;

      // calculate adjusted delay time relative to the audio context
      const adjustedDelay = CONTEXT.currentTime + delay;
      // stop current audio node (this effectively deletes the node) and record it as the pause time
      this._sourceNode.stop(adjustedDelay);
      this._pauseTime = adjustedDelay;

      // create new audio node to replace current node
      const replacementNode = CONTEXT.createBufferSource();
      replacementNode.buffer = this._buffer;
      // replace the audio node
      this._sourceNode = replacementNode;
      replacementNode.connect(this._gainNode);
    }
  }
  /**
   * Shcedules the audio playback to be stopped. If played again by calling {@link Playback.play} the previous time will not be remembered
   *
   * *Note: It is recommended to allow some amount of scheduling time to prevent audio glitches*
   * @param delay Amount of time in seconds before the audio is stopped
   */
  stop(delay = 0.1): void {
    if (this._playing) {
      // record playback status
      this._playing = false;

      // calculate adjusted delay time relative to the audio context
      const adjustedDelay = CONTEXT.currentTime + delay;
      // stop current audio node (this effectively deletes the node)
      this._sourceNode.stop(adjustedDelay);

      // create new audio node to replace current node
      const replacementNode = CONTEXT.createBufferSource();
      replacementNode.buffer = this._buffer;
      // replace the audio node
      this._sourceNode = replacementNode;
      replacementNode.connect(this._gainNode);
    }
  }

  /**
   * Returns the current playback position of the audio in seconds
   */
  getPlaybackTime(): number {
    if (this._playing) {
      return (CONTEXT.currentTime - this._startTime) % this.length;
    } else if (this._pauseTime) {
      return (this._pauseTime - this._startTime) % this.length;
    } else {
      return 0.0;
    }
  }
}
