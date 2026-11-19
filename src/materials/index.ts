import type { MaterialDef } from './types';
import { basicVariants } from './basic/basic';
import { chrome } from './chrome/chrome';
import { glass } from './glass/glass';
import { iridescent } from './iridescent/iridescent';
import { toon } from './toon/toon';

/** Ordered registry: feeds the carousel. */
export const materials: MaterialDef[] = [chrome, glass, iridescent, toon, ...basicVariants];
