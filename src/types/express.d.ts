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

    /**
     * Deliberately permissive at the Express/Connect boundary. This project
     * mounts Vite/Connect middleware as well as normal Express handlers.
     * Concrete application middleware still uses the typed Request/Response
     * signatures above.
     */
    type Handler = (...args: any[]) => any;

    type ErrorHandler = (...args: any[]) => any;

    interface ExpressApplication {
      set(name: string, value: any): this;
      use(...handlers: (Handler | ErrorHandler)[]): this;
      get(path: string, ...handlers: Handler[]): this;
      post(path: string, ...handlers: Handler[]): this;
      put(path: string, ...handlers: Handler[]): this;
      patch(path: string, ...handlers: Handler[]): this;
      delete(path: string, ...handlers: Handler[]): this;
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
