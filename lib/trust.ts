// Trust signals rendered beneath primary CTAs (see components/trust-signals.tsx).
// Kept here rather than in JSX so the claims we make to customers have one
// source of truth — these are public factual assertions, not copy.

export interface TrustConfig {
  /** Google Business Profile star rating, e.g. 4.9. */
  googleRating: number;
  /** Number of Google reviews behind that rating. */
  googleReviewCount: number;
  /** Window in which we'll re-clean free if the customer isn't satisfied. */
  guaranteeDays: number;
}

export const trust: TrustConfig = {
  // PROTOTYPE_TODO: placeholders — confirm against the live Google Business
  // Profile before this is shown to real traffic. A rating or review count that
  // doesn't match the profile is a claim we can't back up.
  googleRating: 4.9,
  googleReviewCount: 150,

  // PROTOTYPE_TODO: confirm the guarantee window and terms with the owner.
  guaranteeDays: 7,
};
