// KaypohKaki — prototype interactivity.
// Tries the Express + Mongoose API first (same origin, /api/...); if it's not
// reachable (e.g. viewing the static Cloudflare deploy with no server running)
// it falls back to localStorage so the demo still works standalone.
// clientId is a random id kept in localStorage to stand in for a logged-in
// user — there is no real authentication here.

const STORE_KEY = 'ppsg_profile';
const TOPICS_KEY = 'ppsg_topics';
const TODOS_KEY = 'ppsg_todos';
const CLIENT_ID_KEY = 'ppsg_client_id';

function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = 'c-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem(CLIENT_ID_KEY, id); } catch (e) {}
  }
  return id;
}

async function apiFetch(path, options) {
  try {
    const res = await fetch('/api' + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null; // backend not running — caller falls back to localStorage
  }
}

function getProfile() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
}
function setProfile(p) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {}
}
function getTopics() {
  try { return JSON.parse(localStorage.getItem(TOPICS_KEY)) || null; } catch (e) { return null; }
}
function setTopics(t) {
  try { localStorage.setItem(TOPICS_KEY, JSON.stringify(t)); } catch (e) {}
}
function getTodos(defaults) {
  try {
    const raw = localStorage.getItem(TODOS_KEY);
    return raw ? JSON.parse(raw) : defaults;
  } catch (e) { return defaults; }
}
function setTodos(t) {
  try { localStorage.setItem(TODOS_KEY, JSON.stringify(t)); } catch (e) {}
}

// ---- Sign-up page: single-select pill groups ----
function initPillGroups() {
  document.querySelectorAll('[data-pill-group]').forEach((group) => {
    group.querySelectorAll('.pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        group.querySelectorAll('.pill').forEach((p) => p.classList.remove('selected'));
        pill.classList.add('selected');
      });
    });
  });
}

function initSignupForm() {
  const form = document.getElementById('signup-form');
  if (!form) return;
  const cached = getProfile();
  if (cached.age) {
    const ageInput = document.getElementById('field-age');
    if (ageInput) ageInput.value = cached.age;
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const marital = form.querySelector('[data-pill-group="marital"] .pill.selected');
    const housing = form.querySelector('[data-pill-group="housing"] .pill.selected');
    const profile = {
      age: document.getElementById('field-age').value || '—',
      income: document.getElementById('field-income').value,
      dependents: document.getElementById('field-dependents').value,
      marital: marital ? marital.textContent.trim() : 'Single',
      housing: housing ? housing.textContent.trim() : 'Renting',
    };
    setProfile(profile);
    apiFetch('/profile', {
      method: 'POST',
      body: JSON.stringify({ clientId: getClientId(), ...profile }),
    });
    window.location.href = 'interests.html';
  });
}

// ---- Interests page: toggle switches ----
const DEFAULT_TOPICS = {
  housing: true, col: true, cpf: true, parenting: false, tax: false, health: false,
};

function initTopicToggles() {
  const cards = document.querySelectorAll('[data-topic]');
  if (!cards.length) return;
  const saved = getTopics() || DEFAULT_TOPICS;
  cards.forEach((card) => {
    const key = card.getAttribute('data-topic');
    const toggle = card.querySelector('.toggle');
    const on = !!saved[key];
    toggle.classList.toggle('on', on);
    card.classList.toggle('on', on);
    card.addEventListener('click', () => {
      const nowOn = !toggle.classList.contains('on');
      toggle.classList.toggle('on', nowOn);
      card.classList.toggle('on', nowOn);
      saved[key] = nowOn;
      setTopics(saved);
      apiFetch(`/profile/${getClientId()}/topics`, {
        method: 'PUT',
        body: JSON.stringify({ topics: saved }),
      });
    });
  });
  const continueBtn = document.getElementById('interests-continue');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => { window.location.href = 'dashboard.html'; });
  }
}

// ---- Dashboard: personalize header, feed filter chips, to-do checklist ----
async function initDashboardPersonalization() {
  const el = document.getElementById('matched-to');
  if (!el) return;
  const remote = await apiFetch(`/profile/${getClientId()}`);
  const profile = remote || getProfile();
  if (profile && profile.age) {
    el.textContent = `Matched to: ${profile.age}, ${profile.marital.toLowerCase()}, ${profile.housing.toLowerCase()}`;
  }
}

const TAG_CLASS_BY_CATEGORY = { housing: 'tag-housing', col: 'tag-col', cpf: 'tag-action', general: 'tag-neutral' };

function renderFeedCard(a) {
  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('data-category', a.category);
  const when = a.pubDate ? new Date(a.pubDate).toLocaleDateString() : '';
  card.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
      <span class="tag ${TAG_CLASS_BY_CATEGORY[a.category] || 'tag-neutral'}">${a.tagLabel}</span>
      <span style="font-size:12px; color: var(--text-faint);">${escapeHtml(a.source || '')} · ${when}</span>
    </div>
    <span style="font-weight:700; font-size:17px; line-height:1.35;">${escapeHtml(a.title)}</span>
    <p style="font-size:14px; line-height:1.6; color: var(--text-muted); margin:0;">${escapeHtml(a.description)}</p>
    <div class="full-article" style="display:none; font-size:14px; line-height:1.7; color: var(--text-muted); white-space:pre-line; border-top:1px solid var(--border); padding-top:14px; margin-top:2px;"></div>
    <div style="display:flex; align-items:center; gap:18px; padding-top:2px; flex-wrap:wrap;">
      <span class="read-full-toggle" style="font-size:13px; font-weight:700; color: var(--primary); cursor:pointer;">Read full article</span>
      <a href="${a.link}" target="_blank" rel="noopener" style="font-size:13px; font-weight:700; color: var(--text-muted);">Open on ${escapeHtml(a.source || 'source')}</a>
      <a href="forum.html" style="font-size:13px; font-weight:700; color: var(--text-muted);">Discuss in community</a>
    </div>`;

  const toggle = card.querySelector('.read-full-toggle');
  const body = card.querySelector('.full-article');
  toggle.addEventListener('click', async () => {
    if (body.style.display !== 'none') {
      body.style.display = 'none';
      toggle.textContent = 'Read full article';
      return;
    }
    body.style.display = '';
    if (!body.dataset.loaded) {
      body.textContent = 'Loading full article…';
      const article = await apiFetch(`/feed/article?url=${encodeURIComponent(a.link)}`);
      if (article && article.content) {
        body.textContent = article.content;
        body.dataset.loaded = '1';
      } else {
        body.textContent = "Couldn't load the full article — try opening it on the source site instead.";
      }
    }
    toggle.textContent = 'Hide full article';
  });

  return card;
}

async function initLiveFeed() {
  const list = document.getElementById('feed-list');
  if (!list) return;
  const items = await apiFetch('/feed');
  if (!items || !items.length) return; // keep the static demo cards as fallback

  list.innerHTML = '';
  items.forEach((a) => list.appendChild(renderFeedCard(a)));

  // re-apply whichever feed filter chip is currently active
  const activeChip = document.querySelector('[data-feed-filter].active');
  if (activeChip) activeChip.click();
}

function initFeedSearch() {
  const input = document.getElementById('feed-search-input');
  const clearBtn = document.getElementById('feed-search-clear');
  const status = document.getElementById('feed-search-status');
  const list = document.getElementById('feed-list');
  if (!input || !list) return;

  function setStatus(text) {
    status.textContent = text;
    status.style.display = text ? '' : 'none';
  }

  async function runSearch(query) {
    setStatus(`Searching for "${query}"…`);
    const items = await apiFetch(`/feed/search?q=${encodeURIComponent(query)}`);
    if (items === null) {
      setStatus(`Couldn't search right now — showing your regular feed instead.`);
      return;
    }
    list.innerHTML = '';
    if (!items.length) {
      setStatus(`No results for "${query}".`);
      return;
    }
    setStatus(`${items.length} result${items.length === 1 ? '' : 's'} for "${query}"`);
    items.forEach((a) => list.appendChild(renderFeedCard(a)));
  }

  input.addEventListener('input', () => {
    clearBtn.style.display = input.value ? '' : 'none';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const query = input.value.trim();
    if (query) runSearch(query);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    setStatus('');
    initLiveFeed();
  });
}

function initFeedFilter() {
  const chips = document.querySelectorAll('[data-feed-filter]');
  if (!chips.length) return;
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.getAttribute('data-feed-filter');
      document.querySelectorAll('[data-category]').forEach((card) => {
        const match = filter === 'all' || card.getAttribute('data-category') === filter;
        card.style.display = match ? '' : 'none';
      });
    });
  });
}

const DEFAULT_TODOS = [
  { todoId: 'paynow', title: 'Link NRIC to PayNow', note: 'Needed to receive the Cost-of-Living Special Payment automatically.', tag: 'DUE 15 NOV', tagClass: 'tag-action', done: false },
  { todoId: 'cpf-topup', title: 'Submit CPF voluntary top-up', note: "Complete before year end to claim this year's tax relief.", tag: 'DUE 31 DEC', tagClass: 'tag-housing', done: false },
  { todoId: 'hdb-update', title: 'Update HDB flat particulars', note: 'Confirmed eligible for the new income ceiling.', tag: '', tagClass: '', done: true },
  { todoId: 'medisave', title: 'Check MediSave top-up eligibility', note: 'Not eligible this cycle — income above threshold.', tag: '', tagClass: '', done: true },
];

let todosSource = 'local'; // 'api' or 'local' — decides how a click persists

async function renderTodos() {
  const list = document.getElementById('todo-list');
  if (!list) return;
  const remote = await apiFetch(`/todos/${getClientId()}`);
  const todos = remote || getTodos(DEFAULT_TODOS);
  todosSource = remote ? 'api' : 'local';
  paintTodos(list, todos);
  updateProgress(todos);
}

function paintTodos(list, todos) {
  list.innerHTML = '';
  todos.forEach((t) => {
    const item = document.createElement('div');
    item.className = 'todo-item' + (t.done ? ' done' : '');
    item.innerHTML = `
      <div class="todo-check">${t.done ? checkSvg() : ''}</div>
      <div style="display:flex; flex-direction:column; gap:5px;">
        <span class="todo-title" style="font-size:14px; font-weight:700; line-height:1.3;">${t.title}</span>
        <span style="font-size:12px; color: var(--text-faint); line-height:1.4;">${t.note}</span>
        ${t.tag ? `<span class="tag ${t.tagClass}" style="width:fit-content;">${t.tag}</span>` : ''}
      </div>`;
    item.addEventListener('click', async () => {
      t.done = !t.done;
      if (todosSource === 'api') {
        await apiFetch(`/todos/${getClientId()}/${t.todoId}`, {
          method: 'PATCH',
          body: JSON.stringify({ done: t.done }),
        });
      } else {
        setTodos(todos);
      }
      const list = document.getElementById('todo-list');
      paintTodos(list, todos);
      updateProgress(todos);
    });
    list.appendChild(item);
  });
}

function checkSvg() {
  return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l6 6 12-12"/></svg>';
}

function updateProgress(todos) {
  const bar = document.getElementById('todo-progress-bar');
  const label = document.getElementById('todo-progress-label');
  if (!bar) return;
  const done = todos.filter((t) => t.done).length;
  const pct = Math.round((done / todos.length) * 100);
  bar.style.width = pct + '%';
  label.textContent = `${done} / ${todos.length} done`;
}

// ---- Forum: category filter + start-a-discussion (backed by shared MongoDB threads) ----
async function initForum() {
  const cats = document.querySelectorAll('[data-forum-cat]');
  const threads = document.getElementById('thread-list');
  if (!threads) return;

  const remoteThreads = await apiFetch('/forum/threads');
  if (remoteThreads) {
    threads.innerHTML = '';
    remoteThreads.forEach((t) => threads.appendChild(renderThread(t)));
  }

  cats.forEach((cat) => {
    cat.addEventListener('click', () => {
      cats.forEach((c) => c.classList.remove('active'));
      cat.classList.add('active');
      const filter = cat.getAttribute('data-forum-cat');
      threads.querySelectorAll('[data-thread-cat]').forEach((thread) => {
        const match = filter === 'all' || thread.getAttribute('data-thread-cat') === filter;
        thread.style.display = match ? '' : 'none';
      });
    });
  });

  const startBtn = document.getElementById('start-discussion-btn');
  const formWrap = document.getElementById('new-thread-form');
  if (startBtn && formWrap) {
    startBtn.addEventListener('click', () => {
      formWrap.style.display = formWrap.style.display === 'none' ? 'flex' : 'none';
    });
    const postBtn = document.getElementById('post-thread-btn');
    postBtn.addEventListener('click', async () => {
      const titleInput = document.getElementById('new-thread-title');
      const bodyInput = document.getElementById('new-thread-body');
      const title = titleInput.value.trim();
      if (!title) { titleInput.focus(); return; }
      const body = bodyInput.value.trim();
      const created = await apiFetch('/forum/threads', {
        method: 'POST',
        body: JSON.stringify({ title, body, category: 'general', author: 'You' }),
      });
      const thread = created || { title, body, category: 'general', author: 'You', replies: 0, createdAt: new Date().toISOString() };
      threads.prepend(renderThread(thread));
      titleInput.value = '';
      bodyInput.value = '';
      formWrap.style.display = 'none';
    });
  }
}

const CATEGORY_LABELS = { housing: 'HOUSING & BTO', cpf: 'CPF & RETIREMENT', general: 'GENERAL' };
const CATEGORY_TAG_CLASS = { housing: 'tag-housing', cpf: 'tag-action', general: 'tag-col' };

function renderThread(t) {
  const el = document.createElement('div');
  el.className = 'thread';
  el.setAttribute('data-thread-cat', t.category || 'general');
  const initials = (t.author || 'A').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const timeAgo = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'just now';
  el.innerHTML = `
    <span class="tag ${CATEGORY_TAG_CLASS[t.category] || 'tag-neutral'}" style="width:fit-content;">${CATEGORY_LABELS[t.category] || 'GENERAL'}</span>
    <span style="font-weight:700; font-size:16px;">${escapeHtml(t.title)}</span>
    <p style="font-size:14px; color:var(--text-muted); margin:0; line-height:1.5;">${escapeHtml(t.body || '')}</p>
    <div style="display:flex; align-items:center; gap:16px; padding-top:4px; flex-wrap:wrap;">
      <div style="display:flex; align-items:center; gap:6px;">
        <div class="avatar" style="width:22px; height:22px; font-size:10px; background: var(--primary);">${initials}</div>
        <span style="font-size:13px; color: var(--text-faint);">Started by ${escapeHtml(t.author || 'Anonymous')}</span>
      </div>
      <span style="font-size:13px; color: var(--text-faint);">${t.replies || 0} replies</span>
      <span style="font-size:13px; color: var(--text-faint);">${escapeHtml(timeAgo)}</span>
    </div>`;
  return el;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  initPillGroups();
  initSignupForm();
  initTopicToggles();
  initDashboardPersonalization();
  initFeedFilter();
  initLiveFeed();
  initFeedSearch();
  renderTodos();
  initForum();
});
