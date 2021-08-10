/**
 * Audio context used for the creation and management of underlying WebAudio nodes.
 *
 * This context is automatically initialized at import and then used by all euphony objects.
 * But, due to the way the WebAudio API is implemented it is highly recommended to use only one audio context,
 * so this constant only needs to be accessed if you intend to use euphony with another Web Audio based API.
 */
export const CONTEXT: AudioContext = new AudioContext();

// TODO: add in support for legacy browsers

export abstract class EuphonyNode {
  /**
   * Underlying WebAudio node used for input to the Euphony node
   * @category Utility
   * @readonly
   */
  abstract readonly input: AudioNode | null;
  /**
   * Underlying WebAudio node used for output from the Euphony node
   * @category Utility
   * @readonly
   */
  abstract readonly output: AudioNode;

  /**
   * Function for connecting a Euphony node to another Euphony node or a WebAudio node
   * @param destination The destionation to connect to, either a Euphony node or base WebAudio node
   * @category Utility
   */
  connect(destination: EuphonyNode | AudioNode): void {
    if (destination instanceof EuphonyNode) {
      if (destination.input === null) {
        throw new Error('Cannot connect to source node');
      } else {
        this.output.connect(destination.input);
      }
    } else {
      this.output.connect(destination);
    }
  }
}
