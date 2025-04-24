document.addEventListener('click', function(event) {
  const link = event.target.closest('a');
  if (link) {
    const url = new URL(link.href);
    if (url.hostname !== window.location.hostname) {
      event.preventDefault();
      window.open(url.href, '_blank');
    }
  }
});

