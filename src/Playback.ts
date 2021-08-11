import { CONTEXT } from './Euphony';
import { Controller, ControllerOptions, ControllerOptionsDefaults } from './Controller';

interface PlaybackOptions extends ControllerOptions {
  loop: boolean;
}
const PlaybackOptionsDefaults: Required<PlaybackOptions> = {
  loop: false,
  ...ControllerOptionsDefaults,
};

class Playback extends Controller {
  readonly input: null;
  readonly output: AudioNode;

  private _sourceNode: AudioBufferSourceNode;

  constructor(options: PlaybackOptions) {
    super(options);
    // update options to include defaults
    const updatedOptions: Required<PlaybackOptions> = { ...PlaybackOptionsDefaults, ...options };

    // create buffer source node and connect it to the gain node
    this._sourceNode = CONTEXT.createBufferSource();
    this._sourceNode.connect(this._gainNode);

    this.input = null;
    this.output = this.analyser.output;
  }
}
