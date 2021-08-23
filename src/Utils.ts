/**
 * Callback functions for async operations
 */
export interface Callbacks {
  /**
   * Executed after the function properly finishes
   */
  onLoad?: () => void;
  /**
   * Executes on error. *Note this does not prevent an error from still being thrown*
   */
  onError?: () => void;
}
/** @internal */
export const DefaultCallbacks: Required<Callbacks> = {
  onLoad: () => undefined,
  onError: () => undefined,
};
