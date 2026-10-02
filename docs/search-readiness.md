# Google search readiness — October 2026

Scope: improve discovery of Banuja Disanayaka, the five project case studies and The Daily Gaze. Preserve the approved design and original photography. No paid services, tracking changes, invented results or ranking guarantees.

## Live baseline audit

On 1 October 2026 UTC (2 October in Sri Lanka), direct HTTP checks confirmed:
- All nine canonical public pages return HTTP 200, self-canonical URLs and index/follow metadata. No HTTP noindex header was present on those pages.
- robots.txt and sitemap.xml return HTTP 200. The sitemap advertises nine pages and the 115 original photographs.
- An unknown URL returns a genuine HTTP 404 with noindex metadata.
- The existing Google verification file returns HTTP 200 with its expected contents.
- Public search retrieval found the homepage, About page and TFC case study. This is discovery evidence, not Search Console coverage or a Google ranking report.

## First SEO pass

- Give every case study a descriptive, distinct search title and description grounded in its visible content. Preserve the owner's name and avoid unsupported production/adoption claims.
- Clarify the Daily Gaze search description with its actual subjects and Sri Lanka/Malaysia coverage.
- Add author, title, description and credit metadata for six representative photographs already present in the journal. CMS hydration updates or removes this metadata when the corresponding live content changes. Original images and watermarks stay intact. No invented licence terms or claim of rich-result eligibility.
- Remove the fixed 13 September sitemap modification date. Google treats lastmod as useful only when it reliably reflects meaningful page updates; omitting this optional field is more accurate than publishing a stale date or stamping every rebuild as new content.
- Allow crawlers to follow the existing permanent redirects from `/v9/` and `/v81/`; these legacy routes were previously blocked in robots.txt. Private admin/API rules remain.
- Expand SEO regression checks: unique titles/descriptions, one main heading, exact self-canonicals, original image references, exactly nine sitemap URLs, 115 image entries and preserved Google verification.

Metadata is rendered into static HTML, including all case-study text and crawlable links. The homepage's existing CMS-managed search title and description remain authoritative.

## Search Console follow-through

The browser reaches the public Search Console introduction and needs Google sign-in before it can access the property. No sitemap submission, URL inspection or indexing request has been made in this session.

Use the existing URL-prefix property `https://banujadisanayaka.netlify.app/`:
1. Check whether `sitemap.xml` is already submitted; submit it if missing and inspect any processing errors.
2. Inspect the homepage, Daily Gaze and five case-study URLs. Check Google's selected canonical, crawl result and rendered page; request indexing for materially updated pages when permitted.
3. Review Page Indexing and Core Web Vitals. Address concrete reported problems; do not interpret a lack of field data as a passing score.
4. Compare search queries, impressions and clicks after Google has recrawled. Focus on the owner's name, project names and relevant photography topics before broad competitive terms.

The verification file is an existing ownership mechanism, not proof that this browser has authenticated access. Google controls crawl timing and rankings; no first-page promise is made.

## References

- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/appearance/snippet
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl

## Validation status

Local regenerated build, release/content checks, expanded SEO checks, static security checks and JavaScript syntax passed. Exact-commit deployment and CI results are recorded on the release pull requests; do not infer production publication from this local report alone.
