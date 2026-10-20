declare module 'express' {
  interface Request {
    body: any;
    headers: Record<string, string | string[] | undefined>;
    ip?: string;
    socket: { remoteAddress?: string | undefined };
    method: string;
    path?: string;
    url?: string;
    app: { get(name: string): any };
  }

  interface Response {
    status(code: number): Response;
    json(body?: any): Response;
    send(body?: any): Response;
    sendFile(path: string): Response;
    end(): Response;
    setHeader(name: string, value: string | number): Response;
  }

  type NextFunction = (error?: any) => void;

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
    json(options?: any): any;
    urlencoded(options?: any): any;
    static(root: string): any;
  }

  const express: ExpressFactory;
  export = express;
}
