declare module 'express' {
  type Middleware = (req: any, res: any, next: any) => any;
  interface ExpressApplication {
    set(name: string, value: any): this;
    use(...handlers: any[]): this;
    get(path: string, ...handlers: any[]): this;
    post(path: string, ...handlers: any[]): this;
    put(path: string, ...handlers: any[]): this;
    patch(path: string, ...handlers: any[]): this;
    delete(path: string, ...handlers: any[]): this;
    listen(...args: any[]): any;
  }
  interface ExpressFactory {
    (): ExpressApplication;
    json(options?: any): Middleware;
    urlencoded(options?: any): Middleware;
  }
  const express: ExpressFactory;
  export = express;
}
