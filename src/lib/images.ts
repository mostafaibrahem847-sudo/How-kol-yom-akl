// Guard for surfaces that render a real photo instead of a placeholder fallback
// (the Home featured card is full-bleed, so a missing photo is very visible).
//
// `image_url` is optional in the catalog, and this project has used example.com
// placeholder hosts for media that had not been authored yet (see audio_urls).
// Both must count as "no photo" so the card never renders a blank hero.
const PLACEHOLDER_HOSTS = ['example.com', 'example.org', 'example.net', 'placeholder'];

/** True only for a real, absolute https image URL — never a null or placeholder. */
export function hasRealPhoto(url?: string | null): boolean {
  if (!url) return false;

  const value = url.trim();
  if (!/^https:\/\//i.test(value)) return false;

  const lower = value.toLowerCase();
  return !PLACEHOLDER_HOSTS.some((host) => lower.includes(host));
}
