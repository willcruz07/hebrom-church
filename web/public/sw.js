// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Ignorar navegação — Safari não aceita SW servindo redirects em navigate
  if (event.request.mode === 'navigate') {
    return;
  }

  // Ignorar Firebase, não-GET e cross-origin requests
  if (
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('firebasestorage.googleapis.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request, { redirect: 'follow' })
      .then((response) => {
        // Não cachear respostas inválidas, opacas ou redirects
        if (
          !response ||
          response.status !== 200 ||
          response.type === 'opaque' ||
          response.redirected
        ) {
          return response;
        }

        // Cachear apenas respostas válidas
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Fallback para cache apenas se a rede falhar
        return caches.match(event.request);
      }),
  );
});