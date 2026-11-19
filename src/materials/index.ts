import type { MaterialDef } from './types';
import { basicVariants } from './basic/basic';
import { chrome } from './chrome/chrome';
import { iridescent } from './iridescent/iridescent';

/** Ordered registry: feeds the carousel. */
export const materials: MaterialDef[] = [chrome, iridescent, ...basicVariants];
