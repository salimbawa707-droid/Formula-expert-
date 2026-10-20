declare module 'express' {
  namespace express {
    interface Request {
      [key: string]: any;
      body: any;
      headers: Record<string, string | undefined> & {
        authorization?: string;
      };
      ip?: string;
      socket: { remoteAddress?: string | undefined };
      method: string;
      path?: string;
      url?: string;
      app: { get(name: string): any };
    }

    interface Response {
      [key: string]: any;
      status(code: number): Response;
      json(body?: any): Response;
      send(body?: any): Response;
      sendFile(path: string): Response;
      end(): Response;
      setHeader(name: string, value: string | number): Response;
    }

    type NextFunction = (error?: any) => void;

    interface Handler {
      (req: Request, res: Response, next: NextFunction): any;
    }

    interface ErrorHandler {
      (error: any, req: Request, res: Response, next: NextFunction): any;
    }

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
      json(options?: any): Handler;
      urlencoded(options?: any): Handler;
      static(root: string): Handler;
    }
  }

  const express: express.ExpressFactory;
  export = express;
}
