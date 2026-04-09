import { App } from "./app";
import { AuthRoute } from "@components/auth/api/v1/auth.route";
import { DatasetRoute } from "@components/dataset/api/v1/dataset.route";
import { BountyRoute } from "@components/bounty/api/v1/bounty.route";
import { UserRoute } from "@components/user/api/v1/user.route";
import { AdminRoute } from "@components/admin/api/v1/admin.route";

const routes = [
  new AuthRoute(),
  new DatasetRoute(),
  new BountyRoute(),
  new UserRoute(),
  new AdminRoute(),
];

export const expressApp = new App(routes);
