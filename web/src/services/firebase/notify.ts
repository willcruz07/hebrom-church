export function notifyNewPost(title: string, body: string, url: string): void {
  fetch('/api/notifications/new-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, url }),
  }).catch((err) => console.error('Erro ao disparar notificação:', err))
}
