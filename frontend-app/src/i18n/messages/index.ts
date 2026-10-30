import type { Messages } from './types';
import home from './home';
import partner from './partner';

/** Every translatable string, keyed by its Vietnamese source: [English, Español, 한국어]. */
export const MESSAGES: Messages = {
  ...home,
  ...partner,
};
