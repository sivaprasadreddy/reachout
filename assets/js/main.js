(() => {
  'use strict';
  const search = document.querySelector('#search');
  if (search) {
    const grid = document.querySelector('#profile-grid');
    const cards = [...grid.children];
    const filters = [...document.querySelectorAll('[data-category].filter')];
    let category = 'All people';
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    if (filters.some(f => f.dataset.category === params.get('category'))) category = params.get('category');
    const update = () => {
      const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      let count = 0;
      for (const card of cards) {
        card.hidden = !((category === 'All people' || card.dataset.category === category) && terms.every(term => normalize(card.dataset.search).includes(term)));
        if (!card.hidden) count++;
      }
      filters.forEach(f => { const active = f.dataset.category === category; f.classList.toggle('active', active); f.setAttribute('aria-pressed', String(active)); });
      document.querySelector('#result-count').textContent = `Showing ${count === cards.length ? 'all ' : ''}${count} ${count === 1 ? 'person' : 'people'}`;
      document.querySelector('#empty-state').hidden = count !== 0;
      const url = new URL(location.href);
      if (search.value.trim()) url.searchParams.set('q', search.value.trim()); else url.searchParams.delete('q');
      if (category !== 'All people') url.searchParams.set('category', category); else url.searchParams.delete('category');
      history.replaceState(null, '', url);
    };
    search.addEventListener('input', update);
    filters.forEach(f => f.addEventListener('click', () => { category = f.dataset.category; update(); }));
    document.querySelector('#sort').addEventListener('change', event => {
      const direction = event.target.value === 'reverse' ? -1 : 1;
      cards.sort((a, b) => direction * a.dataset.name.localeCompare(b.dataset.name)).forEach(c => grid.append(c));
    });
    document.querySelector('#reset-search').addEventListener('click', () => { search.value = ''; category = 'All people'; update(); search.focus(); });
    document.addEventListener('keydown', e => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
    });
    window.addEventListener('popstate', () => { const p = new URLSearchParams(location.search); search.value = p.get('q') || ''; category = filters.some(f => f.dataset.category === p.get('category')) ? p.get('category') : 'All people'; update(); });
    update();
  }
  async function copy(text, status) {
    try { await navigator.clipboard.writeText(text); status.textContent = 'Copied to clipboard.'; }
    catch { status.textContent = 'Clipboard unavailable. Select and copy the text manually.'; }
  }
  document.querySelector('#share-profile')?.addEventListener('click', () => copy(location.href.split('?')[0], document.querySelector('#share-status')));
  const form = document.querySelector('#profile-form');
  if (!form) return;
  const profiles = JSON.parse(document.querySelector('#existing-profiles').textContent);
  const edit = new URLSearchParams(location.search).get('edit');
  const existing = Object.hasOwn(profiles, edit) ? profiles[edit] : null;
  const platforms = ['website', 'github', 'instagram', 'linkedin', 'x', 'twitter', 'youtube', 'tiktok', 'facebook', 'threads', 'bluesky', 'mastodon', 'dribbble', 'behance', 'medium', 'devdotto', 'hashnode', 'substack', 'twitch', 'discord', 'spotify', 'pinterest', 'reddit', 'telegram', 'whatsapp', 'stackoverflow', 'codepen', 'patreon', 'other'];
  const linksContainer = document.querySelector('#form-links');
  let linkId = 0;
  function addLink(link = {}) {
    const id = ++linkId;
    const row = document.createElement('div'); row.className = 'link-row';
    row.innerHTML = `<div class="link-row-head"><strong>LINK</strong><button class="remove-link" type="button" aria-label="Remove link ${id}">Remove</button></div><div class="form-pair"><label for="link-label-${id}">Link label<input id="link-label-${id}" class="link-label" required maxlength="80" placeholder="My portfolio"></label><label for="link-icon-${id}">Platform<select id="link-icon-${id}" class="link-icon"></select></label></div><label for="link-url-${id}">URL<input id="link-url-${id}" class="link-url" required type="url" pattern="https?://[^\\s]+" placeholder="https://…"></label>`;
    const select = row.querySelector('select');
    platforms.forEach(platform => { const option = document.createElement('option'); option.value = platform; option.textContent = platform === 'website' ? 'Website / custom link' : platform; select.append(option); });
    row.querySelector('.link-label').value = link.label || '';
    row.querySelector('.link-url').value = link.url || '';
    select.value = platforms.includes(link.icon) ? link.icon : 'website';
    row.querySelector('button').addEventListener('click', () => { row.remove(); if (!linksContainer.children.length) addLink(); document.querySelector('#add-link').focus(); });
    linksContainer.append(row);
    return row;
  }
  if (existing) {
    document.querySelector('#form-title').textContent = `Suggest an edit for ${existing.name}`;
    for (const field of ['name', 'role', 'bio', 'location', 'category']) form.elements[field].value = existing[field];
    form.elements.slug.value = edit; form.elements.slug.readOnly = true;
    form.elements.tags.value = (existing.tags || []).join(', ');
    existing.links.forEach(addLink);
  } else addLink();
  document.querySelector('#add-link').addEventListener('click', () => { if (linksContainer.children.length >= 20) return; addLink().querySelector('input').focus(); });
  let yaml = '', filename = '';
  // JSON double-quoted strings are valid YAML scalars and prevent YAML injection.
  const quote = value => JSON.stringify(value.trim());
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const slug = data.get('slug');
    const slugInput = form.elements.slug;
    if (!existing && Object.hasOwn(profiles, slug)) { slugInput.setCustomValidity('This handle is already taken. Choose another or edit the existing profile.'); slugInput.reportValidity(); return; }
    const tags = data.get('tags').split(',').map(t => t.trim()).filter(Boolean).slice(0, 5);
    yaml = ['name: ' + quote(data.get('name')), 'role: ' + quote(data.get('role')), 'bio: ' + quote(data.get('bio')), 'location: ' + quote(data.get('location')), 'category: ' + quote(data.get('category'))];
    if (existing?.example) yaml.push('example: true');
    if (existing?.avatar) yaml.push('avatar: ' + quote(existing.avatar));
    yaml.push('tags: ' + JSON.stringify(tags), 'links:');
    for (const row of linksContainer.children) {
      yaml.push('  - label: ' + quote(row.querySelector('.link-label').value), '    url: ' + quote(row.querySelector('.link-url').value), '    icon: ' + quote(row.querySelector('.link-icon').value));
    }
    yaml = yaml.join('\n') + '\n'; filename = slug + '.yaml';
    document.querySelector('#yaml-output').textContent = yaml;
    const result = document.querySelector('#yaml-result'); result.hidden = false;
    const repo = form.dataset.repository.replace(/\/$/, '');
    const branch = form.dataset.branch;
    const proposal = document.querySelector('#github-proposal');
    const instructions = document.querySelector('#proposal-instructions');
    if (/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
      if (existing) {
        proposal.href = `${repo}/edit/${encodeURIComponent(branch)}/data/profiles/${encodeURIComponent(filename)}`;
        instructions.textContent = 'Copy the YAML below, then continue on GitHub. Replace the existing file with your changes and choose “Propose changes” to open a pull request. A GitHub account is required.';
      } else {
        const query = new URLSearchParams({ filename: `data/profiles/${filename}`, value: yaml, message: `Add profile: ${data.get('name')}` });
        proposal.href = `${repo}/new/${encodeURIComponent(branch)}?${query}`;
        instructions.textContent = 'Continue on GitHub to review this new file, choose “Propose changes”, and create a pull request. A GitHub account is required. Your profile publishes after review and merge.';
      }
      proposal.hidden = false;
    } else { proposal.hidden = true; instructions.textContent = `Download this file to data/profiles/${filename} in the project repository, then create a pull request. The site owner must set params.repository in hugo.yaml to enable the GitHub shortcut (deployment configures it automatically).`; }
    document.querySelector('#yaml-title').focus();
    result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
  form.elements.slug.addEventListener('input', () => form.elements.slug.setCustomValidity(''));
  document.querySelector('#copy-yaml').addEventListener('click', () => copy(yaml, document.querySelector('#form-status')));
  document.querySelector('#download-yaml').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([yaml], { type: 'application/yaml' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
