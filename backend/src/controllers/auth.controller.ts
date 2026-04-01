import type { Request, Response } from "express";
import { authService } from "../services/auth.service";

export const authController = {
  registerCustomer(req: Request, res: Response) {
    return authService.register(req.body).then((result) => res.status(201).json(result));
  },

  registerAdmin(req: Request, res: Response) {
    return authService.register(req.body).then((result) => res.status(201).json(result));
  },

  registerVendor(req: Request, res: Response) {
    return authService.register(req.body).then((result) => res.status(201).json(result));
  },

  registerRider(req: Request, res: Response) {
    return authService.register(req.body).then((result) => res.status(201).json(result));
  },

  login(req: Request, res: Response) {
    const { email, password } = req.body;
    return authService.login(email, password).then((result) => res.json(result));
  },

  forgotPassword(req: Request, res: Response) {
    return authService.forgotPassword(req.body.email).then((result) => res.json(result));
  },

  resetPassword(req: Request, res: Response) {
    return authService.resetPassword(req.body.token, req.body.password).then((result) => res.json(result));
  },

  refresh(req: Request, res: Response) {
    return authService.refresh(req.body.refreshToken).then((result) => res.json(result));
  },

  me(req: Request, res: Response) {
    return authService.me(req.user!.sub).then((user) => res.json(user));
  }
};
