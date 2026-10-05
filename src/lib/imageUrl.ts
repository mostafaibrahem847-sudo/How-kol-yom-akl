// Card thumbnail helper: asks Cloudinary for a resized, auto-optimized copy of
// a recipe photo so grids/lists transfer far fewer bytes than the full-size
// hero on the detail screen.
//
// The transform segment goes right after /image/upload/ and BEFORE the optional
// version/folder segments, e.g.
//   .../image/upload/v123/recipe-images/a.jpg  ->  .../image/upload/w_600,q_auto,f_auto/v123/recipe-images/a.jpg
// Non-Cloudinary URLs and already-transformed URLs are returned unchanged, so
// the stored `image_url` is never rewritten at the source.

const CLOUDINARY_HOST = 'res.cloudinary.com';
const UPLOAD_PATH = '/image/upload/';

/**
 * Returns a Cloudinary card-sized variant of `url`, or the URL unchanged when it
 * is not a Cloudinary upload URL / is already transformed. Pure string handling.
 */
export function cardImageUrl(url: string | null | undefined, width = 600): string | undefined {
  if (!url) return undefined;
  const value = url.trim();
  if (!value) return undefined;

  // scheme://host/path — rejects relative paths (no scheme) as non-Cloudinary.
  const match = /^([a-z][a-z0-9+.-]*:\/\/)([^/]+)(\/.*)$/i.exec(value);
  if (!match) return url;

  const host = match[2].split(':')[0].toLowerCase();
  if (host !== CLOUDINARY_HOST) return url;

  const path = match[3];
  const marker = path.indexOf(UPLOAD_PATH);
  if (marker === -1) return url;

  const afterUpload = path.slice(marker + UPLOAD_PATH.length);
  // An existing transform is the first segment after /upload/ and uses one of
  // the Cloudinary width/quality/format flags.
  const firstSegment = afterUpload.split('/')[0];
  if (firstSegment.includes('w_') || firstSegment.includes('q_') || firstSegment.includes('f_')) {
    return url;
  }

  const origin = match[1] + match[2];
  const head = path.slice(0, marker + UPLOAD_PATH.length);
  return `${origin}${head}w_${width},q_auto,f_auto/${afterUpload}`;
}
