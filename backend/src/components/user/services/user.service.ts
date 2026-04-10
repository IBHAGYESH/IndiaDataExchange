import { UserRepository } from "../database/repository/user.repository";
import { DatasetRepository } from "@components/dataset/database/repository/dataset.repository";
import { PurchaseRepository } from "@components/purchase/database/repository/purchase.repository";
import { BountyRepository } from "@components/bounty/database/repository/bounty.repository";
import { SubmissionRepository } from "@components/submission/database/repository/submission.repository";
import { getSignedUrl } from "@libraries/pinata.service";
import { AppError } from "@middlewares/error.middleware";
import { returnDataObj } from "@utils/index";

const userRepo = new UserRepository();
const datasetRepo = new DatasetRepository();
const purchaseRepo = new PurchaseRepository();
const bountyRepo = new BountyRepository();
const submissionRepo = new SubmissionRepository();

export class UserService {
  async getProfile(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError("NotFound", 404, "User not found", true);

    const [listed, purchases, bounties, submissions] = await Promise.all([
      datasetRepo.getCount({ sellerId: userId }),
      purchaseRepo.getTotalPurchasesByDataset(userId),
      bountyRepo.getCount({ buyerId: userId }),
      submissionRepo.model.countDocuments({ sellerId: userId }),
    ]);

    return returnDataObj({ user, stats: { listed, purchases, bounties, submissions } });
  }

  async updateProfile(userId: string, updates: { name?: string; bio?: string }) {
    const user = await userRepo.update(userId, updates);
    if (!user) throw new AppError("NotFound", 404, "User not found", true);
    return returnDataObj({ user });
  }

  async getListings(userId: string) {
    const datasets = await datasetRepo.findBySellerId(userId);
    return returnDataObj({ datasets, total: datasets.length });
  }

  async getPurchases(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError("NotFound", 404, "User not found", true);

    const purchases = await purchaseRepo.findByBuyerWallet(user.walletAddress);

    const purchasesWithUrls = await Promise.all(
      purchases.map(async (p: Record<string, unknown>) => {
        const dataset = p.datasetId as Record<string, unknown> | null | undefined;
        let downloadUrl: string | null = null;
        let datasetPublic = dataset;
        if (dataset && typeof dataset === "object" && "title" in dataset) {
          const cid = dataset.fullDataIpfsCid as string | undefined;
          if (cid) downloadUrl = getSignedUrl(cid);
          const { fullDataIpfsCid: _cid, fullDataFileName: _fn, ...pub } = dataset;
          datasetPublic = pub;
        }
        return { ...p, datasetId: datasetPublic, downloadUrl };
      })
    );

    return returnDataObj({ purchases: purchasesWithUrls, total: purchasesWithUrls.length });
  }

  async getBounties(userId: string) {
    const bounties = await bountyRepo.findByBuyerId(userId);

    const bountiesWithSubmissions = await Promise.all(
      bounties.map(async (b: any) => {
        const rawSubs = await submissionRepo.findByBountyIdWithFullData(b._id.toString());
        const submissions = rawSubs.map((s: Record<string, unknown>) => {
          const { fullDataIpfsCid, ...rest } = s;
          const cid = fullDataIpfsCid as string | undefined;
          return {
            ...rest,
            ...(s.status === "accepted" && cid ? { downloadUrl: getSignedUrl(cid) } : {}),
          };
        });
        return { ...b, submissions };
      })
    );

    return returnDataObj({ bounties: bountiesWithSubmissions, total: bountiesWithSubmissions.length });
  }

  async getSubmissions(userId: string) {
    const raw = await submissionRepo.findBySellerIdWithFullData(userId);
    const submissions = raw.map((s: Record<string, unknown>) => {
      const { fullDataIpfsCid, ...rest } = s;
      const cid = fullDataIpfsCid as string | undefined;
      return {
        ...rest,
        ...(s.status === "accepted" && cid ? { downloadUrl: getSignedUrl(cid) } : {}),
      };
    });
    return returnDataObj({ submissions, total: submissions.length });
  }
}
