export interface CallbackOptions {
  onLoad?: () => void;
  onError?: () => void;
}
export const DefaultCallbackOptions: Required<CallbackOptions> = {
  onLoad: () => undefined,
  onError: () => undefined,
};
