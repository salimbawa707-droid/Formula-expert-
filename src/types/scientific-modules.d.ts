declare module '3dmol' {
  export const rasmolElementColors: any;
  export const SurfaceType: {
    VDW: number;
    MS: number;
    SAS: number;
    SES: number;
  };
  export function createViewer(element: HTMLElement | null, config?: any): any;
  export function $3Dmol(): any;
  const def: any;
  export default def;
}

declare module 'smiles-drawer' {
  export class Drawer {
    constructor(options?: any);
    draw(tree: any, target: HTMLCanvasElement | string, theme?: string, weights?: boolean, infoOnly?: boolean): void;
  }
  export function parse(
    smiles: string,
    success: (tree: any) => void,
    error?: (err: any) => void
  ): void;
  const SmilesDrawer: {
    Drawer: typeof Drawer;
    parse: typeof parse;
  };
  export default SmilesDrawer;
}
