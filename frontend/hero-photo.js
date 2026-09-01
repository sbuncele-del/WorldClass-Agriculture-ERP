document.querySelectorAll('.hero').forEach((hero) => {
  const value = hero.style.getPropertyValue('--hero');
  const match = value.match(/url\(["']?(.*?)["']?\)/);
  if (!match) return;
  const image = document.createElement('img');
  image.className = 'hero-photo';
  image.src = match[1];
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  hero.prepend(image);
});
