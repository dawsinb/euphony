/**
 * TODO: add desc
 */
export interface Callbacks {
  onLoad?: () => void;
  onError?: () => void;
}
/** @internal */
export const DefaultCallbacks: Required<Callbacks> = {
  onLoad: () => undefined,
  onError: () => undefined,
};
