# Architecture rules
- Keep the Outbox landing page lazy-loaded and standalone, with route-scoped brand tokens in global CSS, to isolate its design and asset costs from existing pages.
- Keep Outbox offer values and optional pixel guards in a small tested module so pricing and campaign-link constraints remain verifiable.
- Use Helmet for Outbox client-side metadata without changing the site's static head; social crawlers that do not run JavaScript need server-rendered metadata before per-route share previews can be guaranteed.