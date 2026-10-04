// A narration URL counts as "real" only when it is an https link to a host
// other than the example.com placeholder this project used for unseeded audio
// rows (see audio_urls). Anything else — null, empty, a non-https scheme, or a
// placeholder host — must hide the listen UI instead of offering a dead tap.
//
// Host needs no URL parser: React Native's URL polyfill is partial, so this
// extracts the authority component with plain string work.

/** True only for a real, non-placeholder https audio URL. */
export function hasRealAudio(url?: string | null): boolean {
  if (typeof url !== 'string' || !url.startsWith('https://')) return false;

  const host = url
    .slice('https://'.length)
    .split(/[/?#]/, 1)[0] // authority, before path/query/hash
    .split('@')
    .pop()! // drop any userinfo
    .split(':')[0] // drop any port
    .toLowerCase();

  return host !== '' && host !== 'example.com' && !host.endsWith('.example.com');
}
