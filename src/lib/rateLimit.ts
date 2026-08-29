// Structural, not `SanityClient` from `@sanity/client` -- that package is
// only a transitive dependency here (pulled in via `next-sanity`/`sanity`,
// never declared directly in package.json), so importing its types would
// work today purely by npm hoisting luck. This only ever needs `.fetch()`.
type FetchClient = { fetch<T>(query: string, params?: Record<string, unknown>): Promise<T> };

// Shared by /api/comments and /api/contact -- the two public write
// endpoints that create real content and (for contact) send an email, so a
// scripted flood does real damage (inbox noise, moderation-queue spam) that
// the existing honeypot/captcha alone don't stop (a bot posting straight to
// the API skips the honeypot field's own page entirely; a captcha only
// slows down, doesn't rate-limit, repeat requests).
//
// Counts recent submissions against Sanity itself rather than a separate
// Redis/Upstash store -- no new account to set up, and every document type
// this checks against already has an `ip` field logged for spam detection
// (comments/route.ts's own "known spammer" check does the exact same kind
// of query). One extra read per submission is a non-issue at this site's
// traffic level.
export async function isRateLimited(
  client: FetchClient,
  {
    type,
    ip,
    timestampField,
    windowMs,
    max,
  }: { type: string; ip: string; timestampField: "_createdAt" | "createdAt"; windowMs: number; max: number },
): Promise<boolean> {
  // "unknown" means the request had no x-forwarded-for header at all (only
  // really happens off the deployed site, e.g. local dev) -- treating that as a single
  // shared bucket would risk rate-limiting every such visitor together as
  // if they were one, so it's exempted rather than guessed at. Same
  // "$ip != 'unknown'" exemption already used in comments/route.ts's
  // known-spammer check.
  if (ip === "unknown") return false;

  const cutoff = new Date(Date.now() - windowMs).toISOString();
  const count = await client.fetch<number>(
    `count(*[_type == $type && ip == $ip && ${timestampField} > $cutoff])`,
    { type, ip, cutoff },
  );
  return count >= max;
}
