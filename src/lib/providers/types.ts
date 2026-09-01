import type {
  Ad,
  AdAccount,
  AdSet,
  Audience,
  Budget,
  Campaign,
  CampaignObjective,
  CreativeFormat,
  EntityStatus,
  HierarchyLevel,
} from "@/types/ads";

export type ProviderErrorCode = "not_found" | "invalid" | "unavailable";

export class ProviderError extends Error {
  constructor(
    readonly code: ProviderErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface AdSetLocation {
  campaign: Campaign;
  adSet: AdSet;
}

export interface AdLocation extends AdSetLocation {
  ad: Ad;
}

export interface CreateCampaignInput {
  name: string;
  objective: CampaignObjective;
  budget: Budget;
  startDate: string;
  endDate: string | null;
}

export interface CreateAdSetInput {
  campaignId: string;
  name: string;
  dailyBudget: number;
  audience: Audience;
  optimizationGoal: string;
}

export interface CreateAdInput {
  adSetId: string;
  name: string;
  format: CreativeFormat;
  headline: string;
  body: string;
  description: string;
  callToAction: string;
  destinationUrl: string;
}

export interface StatusTarget {
  level: HierarchyLevel;
  id: string;
  status: EntityStatus;
}

/**
 * The contract every ad platform implementation satisfies. Demo Ads is the
 * default; a network backed provider can replace it without touching the
 * WebMCP tool contracts, the application services, or the UI.
 *
 * Every method is asynchronous because a real provider is a remote API. Keeping
 * the seam synchronous would make the abstraction cosmetic.
 *
 * Implementations are constructed with server held credentials and are already
 * scoped to one ad account. They never accept an account identifier as an
 * argument, so a caller cannot reach an account it was not issued.
 */
export interface AdsProvider {
  readonly id: string;
  readonly label: string;
  readonly mode: "demo" | "live";

  getAccount(): Promise<AdAccount>;
  listCampaigns(): Promise<Campaign[]>;
  getCampaign(campaignId: string): Promise<Campaign | null>;
  getAdSet(adSetId: string): Promise<AdSetLocation | null>;
  getAd(adId: string): Promise<AdLocation | null>;

  createCampaign(input: CreateCampaignInput): Promise<Campaign>;
  createAdSet(input: CreateAdSetInput): Promise<AdSetLocation>;
  createAd(input: CreateAdInput): Promise<AdLocation>;

  setAdSetBudget(adSetId: string, dailyBudget: number): Promise<void>;
  setStatus(target: StatusTarget): Promise<void>;
}
