let sdkPromise = null;

export function loadMapMyIndiaSdk(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error('Missing VITE_MAPMYINDIA_API_KEY'));
  }

  if (window.mappls) {
    return Promise.resolve(window.mappls);
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://apis.mappls.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=3.0`;
    script.async = true;
    script.onload = () => {
      if (window.mappls) resolve(window.mappls);
      else reject(new Error('MapMyIndia SDK loaded but mappls is unavailable'));
    };
    script.onerror = () => reject(new Error('Failed to load MapMyIndia SDK'));
    document.body.appendChild(script);
  });

  return sdkPromise;
}
