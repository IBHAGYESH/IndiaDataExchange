import { Request, Response, NextFunction } from "express";

export const tryCatch = (controller: (req: Request, res: Response) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res);
    } catch (error) {
      return next(error);
    }
  };
};

export interface ReturnDataObjInterface {
  data: object | Array<unknown> | string | number | boolean;
  code: number;
  status: boolean;
}

export const returnDataObj = (
  data: object | Array<unknown> | string | number | boolean = "ok",
  code = 200,
  status = true
): ReturnDataObjInterface => {
  return { data, code, status };
};

export const getPagination = ({ limit, page }: { limit: string | number; page: string | number }) => {
  const pageNumber = parseInt(String(page)) || 1;
  const limitNumber = parseInt(String(limit)) || 20;
  const skipNumber = (pageNumber - 1) * limitNumber;
  return { pageNumber, limitNumber, skipNumber };
};

export const truncateAddress = (address: string): string => {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
