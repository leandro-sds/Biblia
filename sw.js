// sw.js — Service Worker da Bíblia Sagrada PWA
// Versão do cache — mude este número sempre que atualizar os arquivos
const CACHE_VERSION = 'biblia-v1';

// Arquivos que serão salvos no celular para funcionar offline
const ARQUIVOS_OFFLINE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './logo_biblia.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Versões da Bíblia — todas salvas para uso offline
  './Biblias/00_biblia_livre.json',
  './Biblias/01_almeida_corrigida_fiel.json',
  './Biblias/02_almeida_revista_e_corrigida.json',
  './Biblias/04_nova_versao_internacional.json',
  './Biblias/06_king_james_atualizada.json',
  './Biblias/07_nova_traducao_linguagem_hoje.json',
  './Biblias/09_almeida_seculo_xxi.json',
  './Biblias/14_nova_traducao_novo_mundo.json',
  './Biblias/15_catolica_tradicional.json',
  './Biblias/17_Bíblia para todos (Edição comum).json',
];

// Instalação: salva todos os arquivos no cache do celular
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      console.log('[SW] Salvando arquivos para uso offline...');
      // Salva um por um para não falhar tudo se um arquivo estiver faltando
      return Promise.allSettled(
        ARQUIVOS_OFFLINE.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Não salvou:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Ativação: remove caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Busca: serve do cache se disponível, senão vai na rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Salva no cache para a próxima vez
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline e não está no cache
        return new Response('Conteúdo não disponível offline.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
