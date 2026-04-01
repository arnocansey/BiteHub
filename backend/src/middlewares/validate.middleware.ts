import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export const validate =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({
        message: "Validation failed",
        errors: parsed.error.flatten()
      });
    }

    req.body = parsed.data;
    next();
  };

