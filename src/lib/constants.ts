// Single source of truth for site-wide strings.
// The sibling site hardcoded its GitHub URL in three places — we extract
// from day one so rebranding, forking, or URL changes stay painless.

export const SITE_NAME = 'DontTouchMyPic';
export const SITE_URL = 'https://donttouchmypic.com';
export const SITE_TAGLINE = 'Image tools that actually respect your photos.';

// NOTE: assumes the same GitHub owner as the sibling repo (NickPax).
// Update once the repo actually exists.
export const GITHUB_REPO = 'https://github.com/NickPax/donttouchmypic';

export const SIBLING_SITES = [
  { name: 'DontTouchMyDoc', url: 'https://donttouchmydoc.com', blurb: 'PDF tools that never upload.' },
] as const;
