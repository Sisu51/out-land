self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('land-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/styles.css',
        '/app.js',
        '/parcels.geojson',
        '/public_land.geojson'
      ]);
    })
  );
});
