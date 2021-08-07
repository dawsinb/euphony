/**
 * Audio context used for the creation and management of underlying WebAudio nodes.
 *
 * This context is automatically initialized at import and then used by all euphony objects.
 * But, due to the way the WebAudio API is implemented it is highly recommended to use only one audio context,
 * so this constant only needs to be accessed if you intend to use euphony with another Web Audio based API.
 */
export const CONTEXT: AudioContext = new AudioContext();

// TODO: add in support for legacy browsers
