export function campaignHref(campaignId: string): string {
  return `/campaigns/${campaignId}`;
}

export function adSetHref(campaignId: string, adSetId: string): string {
  return `${campaignHref(campaignId)}/ad-sets/${adSetId}`;
}

export function adHref(
  campaignId: string,
  adSetId: string,
  adId: string,
): string {
  return `${adSetHref(campaignId, adSetId)}/ads/${adId}`;
}
