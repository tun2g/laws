/**
 * Cron schedule for the fetcher — read at startup. Defaults to every 15 min.
 * Set NEWS_CRON='0 0 * * * *' for hourly in prod, or any 6-field cron expr.
 */
export const NEWS_CRON = process.env.NEWS_CRON || '0 */15 * * * *';

/** Hard cap of articles kept per source; older rows are pruned each cycle. */
export const MAX_PER_SOURCE = 1000;

/** Hard cap on the page size accepted by GET /api/news. */
export const MAX_PAGE_SIZE = 50;

/** Default page size when the caller doesn't specify one. */
export const DEFAULT_PAGE_SIZE = 9;
