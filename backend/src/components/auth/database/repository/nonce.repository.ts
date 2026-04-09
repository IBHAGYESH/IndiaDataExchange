import { NonceModel, INonce } from "../models";

export class NonceRepository {
  private model = NonceModel;

  async create(walletAddress: string, nonce: string) {
    await this.model.deleteMany({ walletAddress });
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    return await this.model.create({ walletAddress, nonce, expiresAt });
  }

  async findValid(walletAddress: string, nonce: string): Promise<INonce | null> {
    return await this.model.findOne({
      walletAddress,
      nonce,
      expiresAt: { $gt: new Date() },
    });
  }

  async delete(walletAddress: string) {
    return await this.model.deleteMany({ walletAddress });
  }
}
