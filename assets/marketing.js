(() => {
  const count = document.getElementById('device-count');
  function updatePrice() {
    const raw = Number(count.value);
    const devices = Math.min(100, Math.max(1, Number.isFinite(raw) ? Math.floor(raw) : 1));
    if (count.value !== '') count.value = devices;
    const extra = (devices - 1) * 5;
    document.getElementById('local-total').textContent = `€${15 + extra}`;
    document.getElementById('cloud-total').textContent = `€${25 + extra}`;
  }
  if (count) {
    count.addEventListener('input', updatePrice);
    count.addEventListener('blur', () => { if (!count.value) count.value = 1; updatePrice(); });
    document.querySelectorAll('[data-device-step]').forEach(button => button.addEventListener('click', () => {
      count.value = (Number(count.value) || 1) + Number(button.dataset.deviceStep);
      updatePrice();
    }));
    updatePrice();
  }
  const names = { android: 'Android', ios: 'iOS', windows: 'Windows', mac: 'Mac' };
  let selected = 'android';
  function selectPlatform(platform) {
    if (!names[platform]) return;
    selected = platform;
    document.querySelectorAll('[data-platform]').forEach(button => {
      const active = button.dataset.platform === platform;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('platform-name').textContent = names[platform];
    const subject = `SmarsysVilla — ${names[platform]} access`;
    document.getElementById('platform-request').href = `mailto:muhamet.gallapeni5@hotmail.com?subject=${encodeURIComponent(subject)}`;
    document.getElementById('platform-announcement').textContent = `SmarsysVilla ${names[platform]}`;
  }
  document.querySelectorAll('[data-platform]').forEach(button => button.addEventListener('click', () => selectPlatform(button.dataset.platform)));
  if (document.getElementById('platform-name')) selectPlatform(selected);
  // Keep simultaneous demo playback from overlapping.
  document.querySelectorAll('video').forEach(video => video.addEventListener('play', () => {
    document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
  }));
})();
