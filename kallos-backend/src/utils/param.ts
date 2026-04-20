import { Request } from 'express';

/** Safely extract a route param as string (Express 5 types params as string | string[]) */
export const param = (req: Request, key: string): string =>
  Array.isArray(req.params[key]) ? (req.params[key] as string[])[0]! : (req.params[key] as string);
