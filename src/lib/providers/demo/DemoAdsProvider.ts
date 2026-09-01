import { getStore, nextId } from "@/lib/server/store";
import {
  ProviderError,
  type AdLocation,
  type AdsProvider,
  type AdSetLocation,
  type CreateAdInput,
  type CreateAdSetInput,
  type CreateCampaignInput,
  type StatusTarget,
} from "../types";
import type { AdAccount, Campaign } from "@/types/ads";

/** New entities start paused so a create call can never begin spending. */
const CREATED_STATUS = "paused" as const;

/**
 * Deterministic in-process provider used for the demo. State lives in process
 * memory, so a restart returns the account to its seeded condition.
 */
export class DemoAdsProvider implements AdsProvider {
  readonly id = "demo";
  readonly label = "Demo Ads Provider";
  readonly mode = "demo" as const;

  async getAccount(): Promise<AdAccount> {
    return getStore().account;
  }

  async listCampaigns(): Promise<Campaign[]> {
    return getStore().campaigns;
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    return (
      getStore().campaigns.find((campaign) => campaign.id === campaignId) ?? null
    );
  }

  async getAdSet(adSetId: string): Promise<AdSetLocation | null> {
    for (const campaign of getStore().campaigns) {
      const adSet = campaign.adSets.find((entry) => entry.id === adSetId);
      if (adSet) return { campaign, adSet };
    }
    return null;
  }

  async getAd(adId: string): Promise<AdLocation | null> {
    for (const campaign of getStore().campaigns) {
      for (const adSet of campaign.adSets) {
        const ad = adSet.ads.find((entry) => entry.id === adId);
        if (ad) return { campaign, adSet, ad };
      }
    }
    return null;
  }

  async createCampaign(input: CreateCampaignInput): Promise<Campaign> {
    const store = getStore();
    const campaign: Campaign = {
      id: nextId("cmp"),
      accountId: store.account.id,
      name: input.name,
      status: CREATED_STATUS,
      objective: input.objective,
      budget: input.budget,
      startDate: input.startDate,
      endDate: input.endDate,
      adSets: [],
    };
    store.campaigns = [...store.campaigns, campaign];
    return campaign;
  }

  async createAdSet(input: CreateAdSetInput): Promise<AdSetLocation> {
    const campaign = await this.getCampaign(input.campaignId);
    if (!campaign) {
      throw new ProviderError("not_found", "Parent campaign not found in this account");
    }

    const adSet = {
      id: nextId("adset"),
      campaignId: campaign.id,
      name: input.name,
      status: CREATED_STATUS,
      budget: { amount: input.dailyBudget, period: "daily" as const },
      audience: input.audience,
      placements: ["Feed", "Stories"],
      optimizationGoal: input.optimizationGoal,
      bidStrategy: "Lowest cost",
      ads: [],
    };
    campaign.adSets = [...campaign.adSets, adSet];
    return { campaign, adSet };
  }

  async createAd(input: CreateAdInput): Promise<AdLocation> {
    const located = await this.getAdSet(input.adSetId);
    if (!located) {
      throw new ProviderError("not_found", "Parent ad set not found in this account");
    }
    const { campaign, adSet } = located;

    const ad = {
      id: nextId("ad"),
      adSetId: adSet.id,
      campaignId: campaign.id,
      name: input.name,
      status: CREATED_STATUS,
      creative: {
        id: nextId("cr"),
        name: `${input.name} creative`,
        format: input.format,
        headline: input.headline,
        body: input.body,
        description: input.description,
        callToAction: input.callToAction,
        destinationUrl: input.destinationUrl,
        accent: "blue" as const,
      },
      // A new ad has no delivery history, so its series starts empty rather
      // than being seeded with invented performance.
      daily: [],
    };
    adSet.ads = [...adSet.ads, ad];
    return { campaign, adSet, ad };
  }

  async setAdSetBudget(adSetId: string, dailyBudget: number): Promise<void> {
    const located = await this.getAdSet(adSetId);
    if (!located) {
      throw new ProviderError("not_found", `Ad set ${adSetId} no longer exists`);
    }
    located.adSet.budget.amount = dailyBudget;
  }

  async setStatus(target: StatusTarget): Promise<void> {
    if (target.level === "campaign") {
      const campaign = await this.getCampaign(target.id);
      if (!campaign) {
        throw new ProviderError("not_found", `Campaign ${target.id} no longer exists`);
      }
      campaign.status = target.status;
      return;
    }

    if (target.level === "ad_set") {
      const located = await this.getAdSet(target.id);
      if (!located) {
        throw new ProviderError("not_found", `Ad set ${target.id} no longer exists`);
      }
      located.adSet.status = target.status;
      return;
    }

    const located = await this.getAd(target.id);
    if (!located) {
      throw new ProviderError("not_found", `Ad ${target.id} no longer exists`);
    }
    located.ad.status = target.status;
  }
}
