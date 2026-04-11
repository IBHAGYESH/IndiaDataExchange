import { Router, Response } from "express";
import { tryCatch } from "@utils/index";
import { authMiddleware } from "@middlewares/auth.middleware";
import { UserService } from "@components/user/services/user.service";
import { AuthRequest } from "@utils/interface";

export class UserRoute {
  public path = "/api/user";
  public router = Router();
  private service = new UserService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      `${this.path}/profile`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { data, code } = await this.service.getProfile(req.user!.userId);
        res.status(code).json(data);
      })
    );

    this.router.delete(
      `${this.path}/account`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { data, code } = await this.service.deleteAccount(req.user!.userId);
        res.status(code).json(data);
      })
    );

    this.router.get(
      `${this.path}/listings`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { data, code } = await this.service.getListings(req.user!.userId);
        res.status(code).json(data);
      })
    );

    this.router.get(
      `${this.path}/purchases`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { data, code } = await this.service.getPurchases(req.user!.userId);
        res.status(code).json(data);
      })
    );

    this.router.get(
      `${this.path}/bounties`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { data, code } = await this.service.getBounties(req.user!.userId);
        res.status(code).json(data);
      })
    );

    this.router.get(
      `${this.path}/submissions`,
      authMiddleware,
      tryCatch(async (req: AuthRequest, res: Response) => {
        const { data, code } = await this.service.getSubmissions(req.user!.userId);
        res.status(code).json(data);
      })
    );
  }
}
