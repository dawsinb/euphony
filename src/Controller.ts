import { CONTEXT } from './Euphony';
import { Analyser, AnalyserOptions, AnalyserOptionsDefaults } from './Analyser';

export interface ControllerOptions extends AnalyserOptions {
  volume?: number;
}
/** @internal */
export const ControllerOptionsDefaults: Required<ControllerOptions> = {
  volume: 1.0,
  ...AnalyserOptionsDefaults,
};

/**
 * Base class used by source and logical nodes for controlling properties and analysis
 */
export class Controller {
  analyser: Analyser;

  protected constructor(options: ControllerOptions) {
    // update options to include defaults
    const updatedOptions: Required<AnalyserOptions> = { ...AnalyserOptionsDefaults, ...options };

    // create analyser
    this.analyser = new Analyser(updatedOptions);

    // TODO: Controller implementation
  }
}
