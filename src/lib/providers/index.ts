import { DemoAdsProvider } from "./demo/DemoAdsProvider";
import { ProviderError, type AdsProvider } from "./types";

export * from "./types";

const DEFAULT_PROVIDER = "demo";

let cached: AdsProvider | null = null;

/**
 * Resolves the provider for the current server session.
 *
 * Demo Ads is the default so the product never depends on external credentials
 * to run. Selecting an unimplemented provider fails loudly instead of silently
 * falling back to demo data, which would misrepresent where numbers came from.
 */
export function getAdsProvider(): AdsProvider {
  const requested = process.env.ADS_PROVIDER?.trim() || DEFAULT_PROVIDER;

  if (requested !== DEFAULT_PROVIDER) {
    throw new ProviderError(
      "unavailable",
      `ADS_PROVIDER="${requested}" is not implemented. Remove the variable to use the demo provider.`,
    );
  }

  cached ??= new DemoAdsProvider();
  return cached;
}
