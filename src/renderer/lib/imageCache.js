// Session-level cache of dish image data URLs so grids don't re-fetch
// the same image over IPC on every render.
const cache = new Map();

export async function getImage(ref) {
  if (!ref) return null;
  if (cache.has(ref)) return cache.get(ref);
  const promise = window.vizo.images.data(ref).then((res) => {
    const url = res.ok ? res.dataUrl : null;
    cache.set(ref, url);
    return url;
  });
  cache.set(ref, promise);
  return promise;
}

export function primeImage(ref, dataUrl) {
  if (ref && dataUrl) cache.set(ref, dataUrl);
}
