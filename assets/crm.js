/* Scout CRM (étape 1) : liste des comptes, fiche compte, mes tâches.
   Chargé après le script principal (index.html). Expose window.scoutCrm.
   Données : API /crm/* (scout-api/crm.js). */
(function () {
  'use strict';

  var API = (window.SCOUT_API_URL) || 'https://scout-api-production-fa8d.up.railway.app';
  var PAGE = 100;

  var STATUS_LABEL = { nouveau: 'Nouveau', contacte: 'Contacté', engage: 'Engagé', qualifie: 'Qualifié', transmis: 'Transmis CRM', client: 'Client', perdu: 'Perdu' };
  var STATUS_ORDER = ['nouveau', 'contacte', 'engage', 'qualifie', 'transmis', 'client', 'perdu'];
  var ACTION_LABEL = {
    email: 'Email envoyé', email_bounced: 'Email non remis', linkedin_message: 'Message LinkedIn', linkedin_connect: 'Invitation LinkedIn',
    phone: 'Appel', call: 'Appel', in_person: 'Rencontre', meeting: 'Rendez-vous', third_party: 'Via un tiers', via_third_party: 'Via un tiers',
    other: 'Autre action', reply_positive: 'Réponse positive', reply_negative: 'Réponse négative', already_client: 'Marqué déjà client',
    already_prospected_external: 'Déjà prospecté hors Scout', not_relevant: 'Marqué non pertinent', transmitted_crm: 'Transmis au CRM',
    stale_flag: 'Signalé obsolète', nonprospect: 'Marqué non prospect'
  };
  var ICON = {
    mail: '<svg viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 4l6 4.5L14 4" stroke="currentColor" stroke-width="1.4"/></svg>',
    chat: '<svg viewBox="0 0 16 16" fill="none"><path d="M2 3.5h12v7H6l-3 2.5v-2.5H2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    phone: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1 3-1.5 1a8 8 0 004.5 4.5L11 9l3 1v3a1 1 0 01-1 1A11 11 0 012 3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    note: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9H3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5.5 8h5M5.5 10.5h3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    user: '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.6" stroke="currentColor" stroke-width="1.4"/><path d="M3 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    flag: '<svg viewBox="0 0 16 16" fill="none"><path d="M3.5 14V2.5M3.5 3h8l-1.5 3 1.5 3h-8" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    send: '<svg viewBox="0 0 16 16" fill="none"><path d="M2 8l12-5.5L10 14l-2-4.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    dot: '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" fill="currentColor"/></svg>'
  };

  // ── utilitaires ────────────────────────────────────────────────────────────
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function headers(json) {
    var h = (typeof window.getAuthHeaders === 'function') ? window.getAuthHeaders() : {};
    if (json) h = Object.assign({ 'Content-Type': 'application/json' }, h);
    return h;
  }
  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', headers: headers(!!opts.body) };
    if (opts.body) init.body = JSON.stringify(opts.body);
    return fetch(API + path, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) { var e = new Error(d.error || ('HTTP ' + r.status)); e.status = r.status; throw e; }
        return d;
      });
    });
  }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'crm-toast'; t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200);
  }
  function initials(name) { name = String(name || '').trim(); return name ? name.slice(0, 2).toUpperCase() : '?'; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function relTime(iso) {
    if (!iso) return '';
    var d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
    if (s < 60) return "à l'instant";
    if (s < 3600) return 'il y a ' + Math.floor(s / 60) + ' min';
    if (s < 86400) return 'il y a ' + Math.floor(s / 3600) + ' h';
    var days = Math.floor(s / 86400);
    if (days < 30) return 'il y a ' + days + ' j';
    if (days < 365) return 'il y a ' + Math.floor(days / 30) + ' mois';
    return 'il y a ' + Math.floor(days / 365) + ' an' + (days >= 730 ? 's' : '');
  }
  function fmtDate(ymd) {
    if (!ymd) return '';
    var p = String(ymd).slice(0, 10).split('-'); if (p.length < 3) return ymd;
    var m = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][+p[1] - 1];
    return (+p[2]) + ' ' + m + (p[0] !== String(new Date().getFullYear()) ? ' ' + p[0] : '');
  }
  function dueClass(ymd) { if (!ymd) return ''; var t = todayStr(); return ymd < t ? 'crm-late' : (ymd === t ? 'crm-today' : ''); }
  function dayLabel(iso) {
    var d = new Date(iso), t = new Date(); var y = new Date(); y.setDate(t.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === y.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: d.getFullYear() !== t.getFullYear() ? 'numeric' : undefined });
  }
  function statusPill(s, manual) {
    return '<span class="crm-pill s-' + esc(s) + '">' + esc(STATUS_LABEL[s] || s) + (manual === false ? '' : '') + '</span>';
  }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  // ── état ───────────────────────────────────────────────────────────────────
  var S = {
    facets: null,
    filters: lsGet('scout_crm_filters', {}),
    sort: lsGet('scout_crm_sort', { sort: 'last_activity', dir: 'desc' }),
    view: lsGet('scout_crm_view', 'all'),
    rows: [], total: 0, loading: false, selected: {},
    savedViews: [],
    account: null,
    taskScope: 'me', taskState: 'open'
  };

  var BUILTIN_VIEWS = [
    { id: 'all', name: 'Tous les comptes', filters: {} },
    { id: 'mine', name: 'Mes comptes', filters: { owner: 'me' } },
    { id: 'unowned', name: 'Sans propriétaire', filters: { owner: 'none', contacts: 'with' } },
    { id: 'tasks', name: 'Tâches en retard', filters: { tasks: 'overdue' }, sort: 'next_task', dir: 'asc' },
    { id: 'engaged', name: 'Engagés', filters: { status: 'engage,qualifie' } },
    { id: 'cold', name: 'Contactés sans suite 90 j', filters: { status: 'contacte', activity: 'stale90' } }
  ];

  function loadFacets() {
    if (S.facets) return Promise.resolve(S.facets);
    return api('/crm/facets').then(function (d) { S.facets = d; return d; });
  }
  function loadSavedViews() {
    return api('/crm/views').then(function (d) { S.savedViews = d.views || []; }).catch(function () { S.savedViews = []; });
  }
  function allViews() { return BUILTIN_VIEWS.concat(S.savedViews.map(function (v) { v.custom = true; return v; })); }

  // ── LISTE DES COMPTES ──────────────────────────────────────────────────────
  function panelAccounts() { return document.getElementById('panel-accounts'); }

  function renderAccountsShell() {
    var p = panelAccounts(); if (!p) return;
    p.innerHTML = '<div class="crm-wrap" id="crm-list">'
      + '<div class="crm-views" id="crm-views" role="tablist" aria-label="Vues"></div>'
      + '<div class="crm-toolbar" id="crm-toolbar"></div>'
      + '<div class="crm-row" style="justify-content:space-between;margin-bottom:8px;"><span class="crm-meta" id="crm-count" aria-live="polite"></span>'
      + '<span class="crm-row"><button class="crm-btn ghost" id="crm-reset" type="button">Réinitialiser les filtres</button>'
      + '<button class="crm-btn ghost" id="crm-export" type="button">Exporter (CSV)</button></span></div>'
      + '<div class="crm-table-wrap"><table class="crm-table" id="crm-table"><thead></thead><tbody></tbody></table>'
      + '<div class="crm-more" id="crm-more" style="display:none"><button class="crm-btn" type="button" id="crm-more-btn">Afficher plus</button></div></div>'
      + '<div id="crm-bulk"></div>'
      + '</div><div class="crm-wrap" id="crm-detail" style="display:none"></div>';
    document.getElementById('crm-reset').onclick = function () { applyView('all'); };
    document.getElementById('crm-export').onclick = exportCsv;
    document.getElementById('crm-more-btn').onclick = function () { fetchAccounts(true); };
  }

  function renderViews() {
    var el = document.getElementById('crm-views'); if (!el) return;
    el.innerHTML = allViews().map(function (v) {
      var on = v.id === S.view;
      return '<button type="button" role="tab" aria-selected="' + on + '" class="crm-chip' + (on ? ' on' : '') + '" data-view="' + esc(v.id) + '">' + esc(v.name)
        + (v.custom ? ' <span class="x" data-del="' + esc(v.id) + '" title="Supprimer la vue" aria-label="Supprimer la vue">×</span>' : '') + '</button>';
    }).join('') + '<button type="button" class="crm-chip add" id="crm-save-view">+ Enregistrer la vue</button>';
    el.querySelectorAll('[data-view]').forEach(function (b) {
      b.onclick = function (e) {
        var del = e.target.getAttribute && e.target.getAttribute('data-del');
        if (del) { e.stopPropagation(); deleteView(del); return; }
        applyView(b.getAttribute('data-view'));
      };
    });
    document.getElementById('crm-save-view').onclick = saveViewDialog;
  }

  function applyView(id) {
    var v = allViews().find(function (x) { return x.id === id; }) || BUILTIN_VIEWS[0];
    S.view = v.id; S.filters = Object.assign({}, v.filters || {});
    S.sort = { sort: v.sort || 'last_activity', dir: v.dir || 'desc' };
    lsSet('scout_crm_view', S.view); lsSet('scout_crm_filters', S.filters); lsSet('scout_crm_sort', S.sort);
    renderViews(); renderToolbar(); fetchAccounts();
  }

  function saveViewDialog() {
    var pop = document.createElement('div'); pop.className = 'crm-pop';
    pop.innerHTML = '<div class="crm-pop-box" role="dialog" aria-label="Enregistrer la vue"><h3>Enregistrer la vue</h3>'
      + '<input class="crm-input" id="crm-view-name" maxlength="60" placeholder="Nom de la vue, ex. Pompiers Benelux">'
      + '<div class="crm-meta" style="margin:8px 0 14px;">Garde les filtres et le tri actuels. Visible seulement par vous.</div>'
      + '<div class="crm-row" style="justify-content:flex-end"><button class="crm-btn ghost" type="button" data-c>Annuler</button><button class="crm-btn primary" type="button" data-ok>Enregistrer</button></div></div>';
    document.body.appendChild(pop);
    var inp = pop.querySelector('#crm-view-name'); inp.focus();
    var close = function () { pop.remove(); };
    pop.onclick = function (e) { if (e.target === pop) close(); };
    pop.querySelector('[data-c]').onclick = close;
    var ok = function () {
      var name = inp.value.trim(); if (!name) { inp.focus(); return; }
      var v = { id: 'v' + Date.now().toString(36), name: name, filters: Object.assign({}, S.filters), sort: S.sort.sort, dir: S.sort.dir };
      var views = S.savedViews.map(function (x) { return { id: x.id, name: x.name, filters: x.filters, sort: x.sort, dir: x.dir }; }).concat([v]);
      api('/crm/views', { method: 'PUT', body: { views: views } }).then(function (d) {
        S.savedViews = d.views || []; S.view = v.id; lsSet('scout_crm_view', S.view); renderViews(); close(); toast('Vue enregistrée');
      }).catch(function (e) { toast('Erreur : ' + e.message); });
    };
    pop.querySelector('[data-ok]').onclick = ok;
    inp.onkeydown = function (e) { if (e.key === 'Enter') ok(); if (e.key === 'Escape') close(); };
  }

  function deleteView(id) {
    var v = S.savedViews.find(function (x) { return x.id === id; }); if (!v) return;
    if (!confirm('Supprimer la vue « ' + v.name + ' » ?')) return;
    var views = S.savedViews.filter(function (x) { return x.id !== id; }).map(function (x) { return { id: x.id, name: x.name, filters: x.filters, sort: x.sort, dir: x.dir }; });
    api('/crm/views', { method: 'PUT', body: { views: views } }).then(function (d) {
      S.savedViews = d.views || []; if (S.view === id) applyView('all'); else renderViews();
    }).catch(function (e) { toast('Erreur : ' + e.message); });
  }

  function opt(v, label, cur) { return '<option value="' + esc(v) + '"' + (String(cur || '') === String(v) ? ' selected' : '') + '>' + esc(label) + '</option>'; }

  function renderToolbar() {
    var el = document.getElementById('crm-toolbar'); if (!el || !S.facets) return;
    var f = S.filters, F = S.facets;
    var sel = function (key, label, options) {
      return '<select class="crm-sel' + (f[key] ? ' set' : '') + '" data-f="' + key + '" aria-label="' + esc(label) + '">' + opt('', label, f[key]) + options + '</select>';
    };
    var nf = Object.keys(f).filter(function (k) { return k !== 'q' && f[k]; }).length;
    el.innerHTML = '<input class="crm-search" id="crm-q" type="search" placeholder="Rechercher un compte, un pays, un contact…" aria-label="Rechercher" value="' + esc(f.q || '') + '">'
      + '<button type="button" class="crm-btn crm-filters-btn" id="crm-filters-btn" aria-expanded="' + !!S.filtersOpen + '">Filtres' + (nf ? ' (' + nf + ')' : '') + '</button>'
      + sel('owner', 'Propriétaire : tous', opt('me', 'Moi', f.owner) + opt('none', 'Sans propriétaire', f.owner) + F.users.map(function (u) { return opt(u.id, u.name, f.owner); }).join(''))
      + sel('status', 'Statut : tous', STATUS_ORDER.map(function (s) { return opt(s, STATUS_LABEL[s], f.status); }).join('') + (f.status && f.status.indexOf(',') > 0 ? opt(f.status, 'Plusieurs', f.status) : ''))
      + sel('pays', 'Pays : tous', F.pays.map(function (x) { return opt(x.v, x.v + ' (' + x.n + ')', f.pays); }).join(''))
      + sel('secteur', 'Secteur : tous', F.secteurs.map(function (x) { return opt(x.v, x.v + ' (' + x.n + ')', f.secteur); }).join(''))
      + sel('activity', 'Activité : toutes', opt('30', 'Moins de 30 j', f.activity) + opt('90', 'Moins de 90 j', f.activity) + opt('stale90', 'Rien depuis 90 j', f.activity) + opt('never', 'Jamais contacté', f.activity))
      + sel('contacts', 'Contacts : tous', opt('with', 'Avec contacts', f.contacts) + opt('without', 'Sans contact', f.contacts))
      + sel('tasks', 'Tâches : toutes', opt('open', 'Tâche ouverte', f.tasks) + opt('overdue', 'Tâche en retard', f.tasks));
    el.classList.toggle('open', !!S.filtersOpen);
    document.getElementById('crm-filters-btn').onclick = function () { S.filtersOpen = !S.filtersOpen; el.classList.toggle('open', S.filtersOpen); this.setAttribute('aria-expanded', S.filtersOpen); };
    var t;
    document.getElementById('crm-q').oninput = function (e) {
      clearTimeout(t); var v = e.target.value;
      t = setTimeout(function () { setFilter('q', v.trim()); }, 300);
    };
    el.querySelectorAll('[data-f]').forEach(function (s) { s.onchange = function () { setFilter(s.getAttribute('data-f'), s.value); }; });
  }

  function setFilter(k, v) {
    if (v) S.filters[k] = v; else delete S.filters[k];
    S.view = matchView(); lsSet('scout_crm_view', S.view); lsSet('scout_crm_filters', S.filters);
    renderViews(); renderToolbar(); fetchAccounts();
    var q = document.getElementById('crm-q'); if (q && k === 'q') { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  function matchView() {
    var key = JSON.stringify(sortObj(S.filters));
    var v = allViews().find(function (x) { return JSON.stringify(sortObj(x.filters || {})) === key; });
    return v ? v.id : '';
  }
  function sortObj(o) { var r = {}; Object.keys(o).sort().forEach(function (k) { if (o[k]) r[k] = o[k]; }); return r; }

  function queryString(offset) {
    var p = new URLSearchParams();
    Object.keys(S.filters).forEach(function (k) { if (S.filters[k]) p.set(k, S.filters[k]); });
    p.set('sort', S.sort.sort); p.set('dir', S.sort.dir); p.set('limit', PAGE); p.set('offset', offset || 0);
    return p.toString();
  }

  var fetchSeq = 0;
  function fetchAccounts(more) {
    var seq = ++fetchSeq;
    if (!more) { S.rows = []; S.selected = {}; renderBulk(); }
    var tb = document.querySelector('#crm-table tbody');
    if (!more && tb) tb.innerHTML = '<tr><td colspan="8" class="crm-empty">Chargement…</td></tr>';
    S.loading = true;
    return api('/crm/accounts?' + queryString(more ? S.rows.length : 0)).then(function (d) {
      if (seq !== fetchSeq) return;
      S.rows = more ? S.rows.concat(d.accounts) : d.accounts; S.total = d.total; S.loading = false;
      renderTable();
    }).catch(function (e) {
      if (seq !== fetchSeq) return;
      S.loading = false;
      if (tb) tb.innerHTML = '<tr><td colspan="8" class="crm-empty">Impossible de charger les comptes (' + esc(e.message) + ').</td></tr>';
    });
  }

  var COLS = [
    { k: 'nom', label: 'Compte', sort: 'nom' },
    { k: 'secteur', label: 'Secteur', sort: 'secteur' },
    { k: 'status', label: 'Statut', sort: 'status' },
    { k: 'owner', label: 'Propriétaire', sort: 'owner' },
    { k: 'contacts', label: 'Contacts', sort: 'contacts' },
    { k: 'activity', label: 'Dernière activité', sort: 'last_activity' },
    { k: 'task', label: 'Prochaine tâche', sort: 'next_task' }
  ];

  function renderTable() {
    var th = document.querySelector('#crm-table thead'), tb = document.querySelector('#crm-table tbody');
    if (!th || !tb) return;
    var allSel = S.rows.length && S.rows.every(function (r) { return S.selected[r.id]; });
    th.innerHTML = '<tr><th class="cb"><input type="checkbox" id="crm-selall" aria-label="Tout sélectionner"' + (allSel ? ' checked' : '') + '></th>'
      + COLS.map(function (c) {
        var on = S.sort.sort === c.sort;
        return '<th class="sortable" data-sort="' + c.sort + '" aria-sort="' + (on ? (S.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' + c.label + (on ? '<span class="arr">' + (S.sort.dir === 'asc' ? '▲' : '▼') + '</span>' : '') + '</th>';
      }).join('') + '</tr>';
    th.querySelectorAll('[data-sort]').forEach(function (h) {
      h.onclick = function () {
        var s = h.getAttribute('data-sort');
        S.sort = { sort: s, dir: (S.sort.sort === s && S.sort.dir === 'desc') ? 'asc' : (S.sort.sort === s ? 'desc' : (s === 'nom' || s === 'pays' || s === 'next_task' ? 'asc' : 'desc')) };
        lsSet('scout_crm_sort', S.sort); fetchAccounts();
      };
    });
    document.getElementById('crm-selall').onchange = function (e) {
      S.rows.forEach(function (r) { if (e.target.checked) S.selected[r.id] = true; else delete S.selected[r.id]; });
      renderTable(); renderBulk();
    };
    var cnt = document.getElementById('crm-count');
    if (cnt) cnt.textContent = S.total.toLocaleString('fr-FR') + ' compte' + (S.total > 1 ? 's' : '') + (S.rows.length < S.total ? ' · ' + S.rows.length + ' affichés' : '');
    if (!S.rows.length) {
      tb.innerHTML = '<tr><td colspan="8" class="crm-empty">Aucun compte ne correspond à ces filtres.</td></tr>';
    } else {
      tb.innerHTML = S.rows.map(function (r) {
        var sel = !!S.selected[r.id];
        return '<tr data-id="' + esc(r.id) + '" class="' + (sel ? 'sel' : '') + '">'
          + '<td class="cb"><input type="checkbox" data-cb="' + esc(r.id) + '" aria-label="Sélectionner ' + esc(r.nom) + '"' + (sel ? ' checked' : '') + '></td>'
          + '<td><div class="crm-acc-name">' + esc(r.nom) + '</div><div class="crm-acc-sub">' + esc([r.pays, r.type].filter(Boolean).join(' · ')) + '</div></td>'
          + '<td class="c-secteur">' + esc(r.secteur || '') + '</td>'
          + '<td class="c-status">' + statusPill(r.status) + '</td>'
          + '<td class="c-owner">' + (r.owner_name ? '<span class="crm-owner"><span class="crm-avatar">' + esc(initials(r.owner_name)) + '</span>' + esc(r.owner_name) + '</span>' : '<span class="crm-muted">Personne</span>') + '</td>'
          + '<td class="c-contacts crm-num">' + (r.n_contacts ? r.n_contacts + ' <span class="crm-muted">· ' + r.n_emails + ' email' + (r.n_emails > 1 ? 's' : '') + '</span>' : '<span class="crm-muted">0</span>') + '</td>'
          + '<td class="c-activity">' + (r.last_activity_at ? esc(relTime(r.last_activity_at)) : '<span class="crm-muted">Jamais</span>') + '</td>'
          + '<td class="c-task">' + (r.next_task_due ? '<span class="' + dueClass(r.next_task_due) + '">' + esc(fmtDate(r.next_task_due)) + '</span>' + (r.open_tasks > 1 ? ' <span class="crm-muted">+' + (r.open_tasks - 1) + '</span>' : '') : (r.open_tasks ? 'Sans date' : '<span class="crm-muted">Aucune</span>')) + '</td>'
          + '</tr>';
      }).join('');
    }
    tb.querySelectorAll('tr[data-id]').forEach(function (tr) {
      tr.onclick = function (e) {
        if (e.target.matches('input[type=checkbox]')) return;
        if (e.target.closest('td.cb')) { var c = tr.querySelector('input'); c.checked = !c.checked; c.onchange(); return; }
        openAccount(tr.getAttribute('data-id'));
      };
    });
    tb.querySelectorAll('[data-cb]').forEach(function (c) {
      c.onchange = function () { var id = c.getAttribute('data-cb'); if (c.checked) S.selected[id] = true; else delete S.selected[id]; c.closest('tr').classList.toggle('sel', c.checked); renderBulk(); };
    });
    var more = document.getElementById('crm-more'); if (more) more.style.display = S.rows.length < S.total ? 'flex' : 'none';
  }

  function renderBulk() {
    var el = document.getElementById('crm-bulk'); if (!el) return;
    var ids = Object.keys(S.selected);
    if (!ids.length || !S.facets) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="crm-bulk" role="region" aria-label="Actions groupées"><b>' + ids.length + ' sélectionné' + (ids.length > 1 ? 's' : '') + '</b>'
      + '<select class="crm-sel" id="crm-bulk-owner" aria-label="Assigner à"><option value="">Assigner à…</option><option value="__none">Personne</option>'
      + S.facets.users.map(function (u) { return '<option value="' + esc(u.id) + '">' + esc(u.name) + '</option>'; }).join('') + '</select>'
      + '<select class="crm-sel" id="crm-bulk-status" aria-label="Changer le statut"><option value="">Changer le statut…</option><option value="__auto">Automatique</option>'
      + STATUS_ORDER.map(function (s) { return '<option value="' + s + '">' + STATUS_LABEL[s] + '</option>'; }).join('') + '</select>'
      + '<button class="crm-btn" type="button" id="crm-bulk-export">Exporter</button>'
      + '<button class="crm-btn ghost" type="button" id="crm-bulk-clear" style="margin-left:auto">Désélectionner</button></div>';
    var run = function (body, label) {
      api('/crm/accounts/bulk', { method: 'POST', body: Object.assign({ ids: ids }, body) }).then(function (d) {
        toast(label + ' : ' + d.updated + ' compte' + (d.updated > 1 ? 's' : '')); fetchAccounts();
      }).catch(function (e) { toast('Erreur : ' + e.message); });
    };
    document.getElementById('crm-bulk-owner').onchange = function (e) {
      var v = e.target.value; if (!v) return;
      run({ owner_user_id: v === '__none' ? null : v }, 'Propriétaire mis à jour');
    };
    document.getElementById('crm-bulk-status').onchange = function (e) {
      var v = e.target.value; if (!v) return;
      run({ crm_status: v === '__auto' ? null : v }, 'Statut mis à jour');
    };
    document.getElementById('crm-bulk-export').onclick = function () { exportCsv(S.rows.filter(function (r) { return S.selected[r.id]; })); };
    document.getElementById('crm-bulk-clear').onclick = function () { S.selected = {}; renderTable(); renderBulk(); };
  }

  function exportCsv(rowsArg) {
    var go = function (rows) {
      var head = ['Compte', 'Pays', 'Type', 'Secteur', 'Statut', 'Propriétaire', 'Contacts', 'Emails', 'Dernière activité', 'Prochaine tâche', 'ID Scout'];
      var q = function (v) { v = v == null ? '' : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var lines = [head.join(';')].concat(rows.map(function (r) {
        return [r.nom, r.pays, r.type, r.secteur, STATUS_LABEL[r.status] || r.status, r.owner_name || '', r.n_contacts, r.n_emails,
          r.last_activity_at ? String(r.last_activity_at).slice(0, 10) : '', r.next_task_due || '', r.id].map(q).join(';');
      }));
      var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'scout-comptes-' + todayStr() + '.csv';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast(rows.length + ' compte' + (rows.length > 1 ? 's' : '') + ' exporté' + (rows.length > 1 ? 's' : ''));
    };
    if (Array.isArray(rowsArg)) return go(rowsArg);
    if (S.total <= S.rows.length) return go(S.rows);
    // tout exporter : on recharge sans pagination (max 500 par appel)
    var all = [], off = 0;
    var step = function () {
      var p = new URLSearchParams(queryString(off)); p.set('limit', 500); p.set('offset', off);
      return api('/crm/accounts?' + p.toString()).then(function (d) {
        all = all.concat(d.accounts); off += d.accounts.length;
        if (d.accounts.length && off < d.total && off < 5000) return step();
        go(all);
      });
    };
    step().catch(function (e) { toast('Erreur export : ' + e.message); });
  }

  function showList() {
    var l = document.getElementById('crm-list'), d = document.getElementById('crm-detail');
    if (l) l.style.display = ''; if (d) d.style.display = 'none';
    S.account = null;
  }

  function onAccountsPanel(opts) {
    var p = panelAccounts(); if (!p) return;
    if (!document.getElementById('crm-list')) renderAccountsShell();
    var tab = opts && opts.tab;
    if (tab === 'comptes' || tab === 'contacts') tab = null; // anciens liens #end-users/comptes
    Promise.all([loadFacets(), S.savedViews.length ? null : loadSavedViews()]).then(function () {
      if (opts && opts.filter) {
        // Tuiles du tableau de bord (ancien panneau Comptes)
        if (opts.filter === 'ready') { S.filters = { contacts: 'with', status: 'nouveau' }; }
        if (opts.filter === 'covered') { S.filters = { status: 'contacte,engage,qualifie,transmis,client' }; }
        S.view = matchView();
      }
      renderViews(); renderToolbar();
      if (tab) { renderAccountDetail(decodeURIComponent(tab)); if (!S.rows.length) fetchAccounts(); }
      else { showList(); fetchAccounts(); }
    }).catch(function (e) {
      p.innerHTML = '<div class="crm-wrap"><div class="crm-empty">Impossible de charger les comptes : ' + esc(e.message) + '</div></div>';
    });
  }

  // ── FICHE COMPTE ───────────────────────────────────────────────────────────
  function openAccount(id) {
    if (!id) return;
    var l = document.getElementById('crm-list');
    S.cameFromList = !!(l && l.style.display !== 'none' && document.getElementById('panel-accounts').classList.contains('active'));
    if (typeof window.go === 'function') window.go('accounts', { tab: encodeURIComponent(id) });
  }

  function renderAccountDetail(id) {
    var l = document.getElementById('crm-list'), d = document.getElementById('crm-detail');
    if (!d) return;
    l.style.display = 'none'; d.style.display = '';
    d.innerHTML = '<button class="crm-back" type="button" id="crm-back">← Comptes</button><div class="crm-empty">Chargement de la fiche…</div>';
    document.getElementById('crm-back').onclick = backToList;
    window.scrollTo(0, 0);
    return Promise.all([loadFacets(), api('/crm/accounts/' + encodeURIComponent(id))]).then(function (res) {
      S.account = res[1];
      drawDetail();
    }).catch(function (e) {
      d.innerHTML = '<button class="crm-back" type="button" id="crm-back">← Comptes</button><div class="crm-empty">' + (e.status === 404 ? 'Ce compte n’existe plus.' : 'Erreur : ' + esc(e.message)) + '</div>';
      document.getElementById('crm-back').onclick = backToList;
    });
  }

  function backToList() {
    if (history.length > 1 && /^#accounts\/./.test(location.hash) && S.cameFromList) { history.back(); return; }
    if (typeof window.go === 'function') window.go('accounts');
  }

  function autoStatusOf(acc, contacts, timeline) {
    var k = timeline.map(function (t) { return t.kind; });
    if (k.indexOf('already_client') >= 0) return 'client';
    if (k.indexOf('transmitted_crm') >= 0) return 'transmis';
    if (k.indexOf('reply_positive') >= 0) return 'engage';
    var out = ['email', 'linkedin_message', 'linkedin_connect', 'phone', 'call', 'in_person', 'meeting', 'third_party', 'via_third_party', 'other'];
    if (k.some(function (x) { return out.indexOf(x) >= 0; })) return 'contacte';
    return 'nouveau';
  }

  function drawDetail() {
    var d = document.getElementById('crm-detail'); var A = S.account; if (!d || !A) return;
    var a = A.account, F = S.facets;
    var auto = autoStatusOf(a, A.contacts, A.timeline);
    var cur = a.crm_status || '';
    var openTasks = A.tasks.filter(function (t) { return !t.done_at; });
    var doneTasks = A.tasks.filter(function (t) { return t.done_at; });
    var sources = (a.sources || []).filter(function (u) { return /^https?:\/\//i.test(String(u || '')); });

    d.innerHTML = '<button class="crm-back" type="button" id="crm-back">← Comptes</button>'
      + '<div class="crm-head"><div style="min-width:0;flex:1 1 320px;"><h2>' + esc(a.nom) + '</h2>'
      + '<div class="crm-meta">' + esc([a.pays, a.secteur, a.type].filter(Boolean).join(' · ')) + '</div></div>'
      + '<div class="crm-head-fields">'
      + '<div class="crm-field"><label for="crm-d-owner">Propriétaire</label><select class="crm-sel" id="crm-d-owner"><option value="">Personne</option>'
      + F.users.map(function (u) { return '<option value="' + esc(u.id) + '"' + (String(u.id) === String(a.owner_user_id) ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select></div>'
      + '<div class="crm-field"><label for="crm-d-status">Statut</label><select class="crm-sel" id="crm-d-status"><option value="">Automatique (' + esc(STATUS_LABEL[auto]) + ')</option>'
      + STATUS_ORDER.map(function (s) { return '<option value="' + s + '"' + (s === cur ? ' selected' : '') + '>' + STATUS_LABEL[s] + '</option>'; }).join('') + '</select></div>'
      + '</div></div>'
      + '<div class="crm-grid"><div class="crm-main">'
      // composer
      + '<div class="crm-card crm-composer"><div class="tabs" role="tablist"><button type="button" class="on" data-mode="note" role="tab">Note</button><button type="button" data-mode="task" role="tab">Tâche</button></div>'
      + '<div id="crm-comp-note"><textarea class="crm-ta" id="crm-note" placeholder="Compte rendu d’appel, info budget, prochaine étape…" aria-label="Note"></textarea>'
      + '<div class="foot"><span class="crm-meta" style="margin-right:auto">Visible par toute l’équipe</span><button class="crm-btn primary" type="button" id="crm-note-save">Ajouter la note</button></div></div>'
      + '<div id="crm-comp-task" style="display:none"><input class="crm-input" id="crm-task-title" maxlength="300" placeholder="Ex. Rappeler le chef du service drones" aria-label="Tâche">'
      + '<div class="foot"><span class="crm-row">'
      + '<button type="button" class="crm-chip" data-due="' + addDays(1) + '">Demain</button><button type="button" class="crm-chip" data-due="' + addDays(7) + '">Dans 1 semaine</button><button type="button" class="crm-chip" data-due="' + addDays(30) + '">Dans 1 mois</button>'
      + '<input class="crm-sel" type="date" id="crm-task-due" aria-label="Échéance" value="' + addDays(7) + '"></span>'
      + '<select class="crm-sel" id="crm-task-owner" aria-label="Attribuer à">' + F.users.map(function (u) { return '<option value="' + esc(u.id) + '"' + (String(u.id) === String(F.me.user_id) ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('') + '</select>'
      + '<button class="crm-btn primary" type="button" id="crm-task-save">Créer la tâche</button></div></div></div>'
      // timeline
      + '<div class="crm-card"><h3>Historique <span class="crm-meta">' + A.timeline.length + ' élément' + (A.timeline.length > 1 ? 's' : '') + '</span></h3><div id="crm-tl">' + timelineHtml(A.timeline) + '</div></div>'
      + '</div><aside class="crm-side">'
      // tâches
      + '<div class="crm-card"><h3>Tâches <span class="crm-meta">' + openTasks.length + ' ouverte' + (openTasks.length > 1 ? 's' : '') + '</span></h3>'
      + (openTasks.length ? openTasks.map(taskHtml).join('') : '<div class="crm-meta">Aucune tâche ouverte.</div>')
      + (doneTasks.length ? '<details style="margin-top:8px"><summary class="crm-meta" style="cursor:pointer">' + doneTasks.length + ' terminée' + (doneTasks.length > 1 ? 's' : '') + '</summary>' + doneTasks.map(taskHtml).join('') + '</details>' : '')
      + '</div>'
      // contacts
      + '<div class="crm-card"><h3>Contacts <span class="crm-meta">' + A.contacts.length + '</span></h3>'
      + (A.contacts.length ? A.contacts.map(function (c) {
        var name = ((c.prenom || '') + ' ' + (c.nom || '')).trim() || 'Sans nom';
        var last = c.last_action_type ? (ACTION_LABEL[c.last_action_type] || c.last_action_type) + ' ' + relTime(c.last_action_at) + (c.last_action_by ? ' par ' + c.last_action_by : '') : 'Jamais contacté';
        return '<div class="crm-ct" data-ct="' + esc(c.id) + '" role="button" tabindex="0"><span class="crm-avatar">' + esc(initials((c.prenom || '?')[0] + (c.nom || '')[0])) + '</span><div style="min-width:0">'
          + '<div class="crm-ct-name">' + esc(name) + '</div><div class="crm-ct-sub">' + esc(c.titre || '') + '</div>'
          + '<div class="crm-ct-sub">' + (c.email ? '<span class="crm-dot ' + esc(c.email_status || '') + '" title="Email : ' + esc(c.email_status || 'non vérifié') + '"></span>' : '') + esc(last) + '</div></div></div>';
      }).join('') : '<div class="crm-meta">Aucun contact rattaché à ce compte.</div>')
      + '</div>'
      // infos
      + '<div class="crm-card crm-info"><h3>Infos</h3>'
      + (a.description ? '<p class="crm-desc">' + esc(a.description) + '</p>' : '')
      + '<dl>'
      + (a.quantite_estimee ? '<dt>Quantité</dt><dd>' + esc(a.quantite_estimee) + '</dd>' : '')
      + (a.budget_estime ? '<dt>Budget</dt><dd>' + esc(a.budget_estime) + '</dd>' : '')
      + ((a.produits_ids || []).length ? '<dt>Produits</dt><dd>' + (a.produits_ids || []).length + ' référencé' + ((a.produits_ids || []).length > 1 ? 's' : '') + '</dd>' : '')
      + ((a.societes_ids || []).length ? '<dt>Fournisseurs</dt><dd>' + esc((a.societes_ids || []).join(', ')) + '</dd>' : '')
      + '<dt>Dynamics</dt><dd>' + (a.dynamics_id ? esc(a.dynamics_id) : '<span class="crm-muted">Pas encore lié</span>') + '</dd>'
      + '<dt>Créé</dt><dd>' + esc(a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '') + '</dd>'
      + '</dl>'
      + (sources.length ? '<div style="margin-top:10px">' + sources.slice(0, 5).map(function (s) { return '<div style="font-size:12px;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><a class="crm-link" href="' + esc(s) + '" target="_blank" rel="noopener">' + esc(s.replace(/^https?:\/\//, '')) + '</a></div>'; }).join('') + '</div>' : '')
      + (typeof window._legacyOpenEndUser === 'function' ? '<div style="margin-top:10px"><button type="button" class="crm-link" id="crm-legacy">Voir la fiche marché (produits, fournisseurs)</button></div>' : '')
      + '</div>'
      + '</aside></div>';

    bindDetail();
  }

  function timelineHtml(tl) {
    if (!tl.length) return '<div class="crm-meta">Rien pour l’instant. Ajoutez une note ou lancez une action depuis un contact.</div>';
    var out = [], lastDay = '';
    tl.forEach(function (t) {
      var day = dayLabel(t.at);
      if (day !== lastDay) { out.push('<div class="crm-tl-day">' + esc(day) + '</div>'); lastDay = day; }
      var ic = ICON.dot, cls = '', title = '', body = t.body ? '<div class="txt">' + esc(t.body) + '</div>' : '';
      var who = esc(t.author || 'Scout') + ' · ' + esc(new Date(t.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      var ct = t.contact_name ? ' avec <button type="button" class="crm-link" data-ct="' + esc(t.contact_id) + '">' + esc(t.contact_name) + '</button>' : '';
      if (t.src === 'event') {
        var p = t.payload || {};
        if (t.kind === 'note') { ic = ICON.note; cls = 'k-note'; title = 'Note'; }
        else if (t.kind === 'owner') { ic = ICON.user; cls = 'k-sys'; title = 'Propriétaire : ' + esc(p.from || 'personne') + ' → <b>' + esc(p.to || 'personne') + '</b>'; }
        else if (t.kind === 'status') { ic = ICON.flag; cls = 'k-sys'; title = 'Statut : ' + esc(p.from === 'auto' ? 'automatique' : (STATUS_LABEL[p.from] || p.from)) + ' → <b>' + esc(p.to === 'auto' ? 'automatique' : (STATUS_LABEL[p.to] || p.to)) + '</b>'; }
        else if (t.kind === 'task_done') { ic = ICON.check; cls = 'k-pos'; title = 'Tâche terminée'; }
        else { title = esc(t.kind); }
      } else {
        var k = t.kind;
        title = esc(ACTION_LABEL[k] || k) + ct;
        if (k === 'email' || k === 'email_bounced') { ic = ICON.mail; cls = k === 'email' ? 'k-out' : 'k-neg'; }
        else if (k.indexOf('linkedin') === 0) { ic = ICON.chat; cls = 'k-out'; }
        else if (k === 'phone' || k === 'call') { ic = ICON.phone; cls = 'k-out'; }
        else if (k === 'reply_positive' || k === 'already_client') { ic = ICON.check; cls = 'k-pos'; }
        else if (k === 'reply_negative' || k === 'not_relevant') { ic = ICON.x; cls = 'k-neg'; }
        else if (k === 'transmitted_crm') { ic = ICON.send; cls = 'k-sys'; }
        if (t.subject) body = '<div class="subj">« ' + esc(t.subject) + ' »</div>' + body;
      }
      var canDel = t.src === 'event' && t.kind === 'note' && S.facets && (S.facets.me.role === 'admin' || t.author === S.facets.me.name);
      out.push('<div class="crm-tl-item"><span class="crm-tl-ic ' + cls + '" aria-hidden="true">' + ic + '</span><div class="crm-tl-body"><div>' + title + '</div><div class="who">' + who + '</div>' + body + '</div>'
        + (canDel ? '<button type="button" class="crm-tl-del" data-delev="' + esc(t.id) + '" title="Supprimer la note" aria-label="Supprimer la note">×</button>' : '') + '</div>');
    });
    return out.join('');
  }

  function taskHtml(t) {
    var sub = [];
    if (t.due_date) sub.push('<span class="' + (t.done_at ? '' : dueClass(t.due_date)) + '">' + esc(fmtDate(t.due_date)) + '</span>');
    if (t.owner_name && !(!S.account && S.taskScope === 'me')) sub.push(esc(t.owner_name));
    if (t.contact_name) sub.push(esc(t.contact_name));
    if (t.account_nom && !S.account) sub.push('<button type="button" class="crm-link" data-acc="' + esc(t.end_user_id) + '">' + esc(t.account_nom) + '</button>' + (t.account_pays ? ' <span class="crm-muted">' + esc(t.account_pays) + '</span>' : ''));
    if (t.done_at) sub.push('fait ' + esc(relTime(t.done_at)) + (t.done_by ? ' par ' + esc(t.done_by) : ''));
    return '<div class="crm-task' + (t.done_at ? ' done' : '') + '"><input type="checkbox" data-task="' + esc(t.id) + '"' + (t.done_at ? ' checked' : '') + ' aria-label="Terminer : ' + esc(t.title) + '">'
      + '<div style="min-width:0;flex:1"><div class="t">' + esc(t.title) + '</div><div class="s">' + sub.join(' · ') + '</div></div>'
      + '<button type="button" class="del" data-deltask="' + esc(t.id) + '" title="Supprimer" aria-label="Supprimer la tâche">×</button></div>';
  }

  function bindTasks(root, after) {
    root.querySelectorAll('[data-task]').forEach(function (c) {
      c.onchange = function () {
        api('/crm/tasks/' + c.getAttribute('data-task'), { method: 'PATCH', body: { done: c.checked } })
          .then(function () { toast(c.checked ? 'Tâche terminée' : 'Tâche rouverte'); after(); })
          .catch(function (e) { toast('Erreur : ' + e.message); c.checked = !c.checked; });
      };
    });
    root.querySelectorAll('[data-deltask]').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('Supprimer cette tâche ?')) return;
        api('/crm/tasks/' + b.getAttribute('data-deltask'), { method: 'DELETE' }).then(after).catch(function (e) { toast('Erreur : ' + e.message); });
      };
    });
    root.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
  }

  function openContact(id) {
    if (typeof window.openContactDetail === 'function') window.openContactDetail(id);
  }

  function bindDetail() {
    var d = document.getElementById('crm-detail'); var a = S.account.account;
    var reload = function () { return api('/crm/accounts/' + encodeURIComponent(a.id)).then(function (r) { S.account = r; drawDetail(); }); };
    document.getElementById('crm-back').onclick = backToList;
    d.querySelectorAll('.crm-composer [data-mode]').forEach(function (b) {
      b.onclick = function () {
        d.querySelectorAll('.crm-composer [data-mode]').forEach(function (x) { x.classList.toggle('on', x === b); });
        var m = b.getAttribute('data-mode');
        document.getElementById('crm-comp-note').style.display = m === 'note' ? '' : 'none';
        document.getElementById('crm-comp-task').style.display = m === 'task' ? '' : 'none';
        (m === 'note' ? document.getElementById('crm-note') : document.getElementById('crm-task-title')).focus();
      };
    });
    document.getElementById('crm-d-owner').onchange = function (e) {
      api('/crm/accounts/' + encodeURIComponent(a.id), { method: 'PATCH', body: { owner_user_id: e.target.value || null } })
        .then(function () { toast('Propriétaire mis à jour'); reload(); }).catch(function (er) { toast('Erreur : ' + er.message); });
    };
    document.getElementById('crm-d-status').onchange = function (e) {
      api('/crm/accounts/' + encodeURIComponent(a.id), { method: 'PATCH', body: { crm_status: e.target.value || null } })
        .then(function () { toast('Statut mis à jour'); reload(); }).catch(function (er) { toast('Erreur : ' + er.message); });
    };
    var noteBtn = document.getElementById('crm-note-save');
    noteBtn.onclick = function () {
      var v = document.getElementById('crm-note').value.trim(); if (!v) { document.getElementById('crm-note').focus(); return; }
      noteBtn.disabled = true;
      api('/crm/accounts/' + encodeURIComponent(a.id) + '/notes', { method: 'POST', body: { body: v } })
        .then(function () { toast('Note ajoutée'); return reload(); }).catch(function (er) { toast('Erreur : ' + er.message); noteBtn.disabled = false; });
    };
    document.getElementById('crm-note').onkeydown = function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) noteBtn.click(); };
    d.querySelectorAll('[data-due]').forEach(function (b) { b.onclick = function () { document.getElementById('crm-task-due').value = b.getAttribute('data-due'); }; });
    var taskBtn = document.getElementById('crm-task-save');
    taskBtn.onclick = function () {
      var title = document.getElementById('crm-task-title').value.trim(); if (!title) { document.getElementById('crm-task-title').focus(); return; }
      taskBtn.disabled = true;
      api('/crm/tasks', { method: 'POST', body: { title: title, due_date: document.getElementById('crm-task-due').value || null, end_user_id: a.id, owner_user_id: document.getElementById('crm-task-owner').value } })
        .then(function () { toast('Tâche créée'); return reload(); }).catch(function (er) { toast('Erreur : ' + er.message); taskBtn.disabled = false; });
    };
    document.getElementById('crm-task-title').onkeydown = function (e) { if (e.key === 'Enter') taskBtn.click(); };
    bindTasks(d, reload);
    d.querySelectorAll('[data-ct]').forEach(function (el) {
      el.onclick = function (e) { e.stopPropagation(); openContact(el.getAttribute('data-ct')); };
      el.onkeydown = function (e) { if (e.key === 'Enter') openContact(el.getAttribute('data-ct')); };
    });
    d.querySelectorAll('[data-delev]').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('Supprimer cette note ?')) return;
        api('/crm/events/' + b.getAttribute('data-delev'), { method: 'DELETE' }).then(reload).catch(function (er) { toast('Erreur : ' + er.message); });
      };
    });
    var lg = document.getElementById('crm-legacy');
    if (lg) lg.onclick = function () { window.go('end-users', { legacy: true }); setTimeout(function () { window._legacyOpenEndUser(a.id); }, 300); };
  }

  // ── MES TÂCHES ─────────────────────────────────────────────────────────────
  function onTasksPanel() {
    var p = document.getElementById('panel-tasks'); if (!p) return;
    if (!document.getElementById('crm-tasks')) {
      p.innerHTML = '<div class="crm-wrap" id="crm-tasks"><div class="crm-row" style="justify-content:space-between;margin-bottom:12px;">'
        + '<div class="crm-views" style="margin:0" role="tablist"><button type="button" class="crm-chip" data-scope="me">Mes tâches</button><button type="button" class="crm-chip" data-scope="team">Équipe</button></div>'
        + '<div class="crm-views" style="margin:0"><button type="button" class="crm-chip" data-state="open">À faire</button><button type="button" class="crm-chip" data-state="done">Terminées (30 j)</button></div></div>'
        + '<div class="crm-newtask"><input class="crm-input" id="crm-nt-title" maxlength="300" placeholder="Nouvelle tâche, ex. Préparer la démo pour le SDIS 69" aria-label="Nouvelle tâche">'
        + '<input class="crm-input" type="date" id="crm-nt-due" aria-label="Échéance" value="' + addDays(1) + '">'
        + '<select class="crm-input" id="crm-nt-owner" aria-label="Attribuer à"></select>'
        + '<button class="crm-btn primary" type="button" id="crm-nt-save">Ajouter</button></div>'
        + '<div class="crm-meta" style="margin:-8px 0 16px">Pour rattacher une tâche à un compte, créez-la depuis la fiche du compte.</div>'
        + '<div id="crm-tasks-list"></div></div>';
      p.querySelectorAll('[data-scope]').forEach(function (b) { b.onclick = function () { S.taskScope = b.getAttribute('data-scope'); loadTasks(); }; });
      p.querySelectorAll('[data-state]').forEach(function (b) { b.onclick = function () { S.taskState = b.getAttribute('data-state'); loadTasks(); }; });
      var save = document.getElementById('crm-nt-save');
      save.onclick = function () {
        var t = document.getElementById('crm-nt-title').value.trim(); if (!t) { document.getElementById('crm-nt-title').focus(); return; }
        save.disabled = true;
        api('/crm/tasks', { method: 'POST', body: { title: t, due_date: document.getElementById('crm-nt-due').value || null, owner_user_id: document.getElementById('crm-nt-owner').value || null } })
          .then(function () { document.getElementById('crm-nt-title').value = ''; save.disabled = false; toast('Tâche créée'); loadTasks(); })
          .catch(function (e) { save.disabled = false; toast('Erreur : ' + e.message); });
      };
      document.getElementById('crm-nt-title').onkeydown = function (e) { if (e.key === 'Enter') save.click(); };
    }
    loadFacets().then(function (F) {
      var sel = document.getElementById('crm-nt-owner');
      if (sel && !sel.options.length) sel.innerHTML = F.users.map(function (u) { return '<option value="' + esc(u.id) + '"' + (String(u.id) === String(F.me.user_id) ? ' selected' : '') + '>' + esc(u.name) + '</option>'; }).join('');
    }).catch(function () {});
    loadTasks();
  }

  function loadTasks() {
    var p = document.getElementById('crm-tasks'); if (!p) return;
    p.querySelectorAll('[data-scope]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-scope') === S.taskScope); });
    p.querySelectorAll('[data-state]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-state') === S.taskState); });
    var list = document.getElementById('crm-tasks-list');
    list.innerHTML = '<div class="crm-empty">Chargement…</div>';
    api('/crm/tasks?scope=' + S.taskScope + '&state=' + S.taskState).then(function (d) {
      var tasks = d.tasks || [];
      if (S.taskState === 'open' && S.taskScope === 'me') updateBadge(tasks);
      if (!tasks.length) { list.innerHTML = '<div class="crm-empty">' + (S.taskState === 'open' ? 'Rien à faire. Les tâches créées depuis une fiche compte arrivent ici.' : 'Aucune tâche terminée ces 30 derniers jours.') + '</div>'; return; }
      var html = '';
      if (S.taskState === 'done') {
        html = '<div class="crm-card">' + tasks.map(taskHtml).join('') + '</div>';
      } else {
        var t = todayStr(), w = addDays(7);
        var groups = [
          { k: 'late', label: 'En retard', test: function (x) { return x.due_date && x.due_date < t; } },
          { k: 'today', label: "Aujourd'hui", test: function (x) { return x.due_date === t; } },
          { k: 'week', label: '7 prochains jours', test: function (x) { return x.due_date > t && x.due_date <= w; } },
          { k: 'later', label: 'Plus tard', test: function (x) { return x.due_date > w; } },
          { k: 'none', label: 'Sans échéance', test: function (x) { return !x.due_date; } }
        ];
        groups.forEach(function (g) {
          var items = tasks.filter(g.test); if (!items.length) return;
          html += '<div class="crm-tasks-sec"><h4 class="' + (g.k === 'late' ? 'late' : '') + '">' + g.label + ' · ' + items.length + '</h4><div class="crm-card" style="padding-top:4px;padding-bottom:4px">' + items.map(taskHtml).join('') + '</div></div>';
        });
      }
      list.innerHTML = html;
      bindTasks(list, loadTasks);
    }).catch(function (e) { list.innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }

  function updateBadge(tasks) {
    var t = todayStr();
    var n = (tasks || []).filter(function (x) { return x.due_date && x.due_date <= t; }).length;
    ['subnav-tasks-badge'].forEach(function (id) { var b = document.getElementById(id); if (b) { b.textContent = n; b.style.display = n ? '' : 'none'; } });
    S.badgeCount = n;
  }
  function refreshBadge() {
    if (!(window.getAuthHeaders && window.getAuthHeaders().Authorization)) return;
    api('/crm/tasks?scope=me&state=open').then(function (d) { updateBadge(d.tasks); }).catch(function () {});
  }

  // ── branchement ───────────────────────────────────────────────────────────
  function onPanel(id, opts) {
    try {
      if (id === 'accounts') onAccountsPanel(opts || {});
      else if (id === 'tasks') onTasksPanel();
      if (typeof S.badgeCount === 'number') setTimeout(function () { var b = document.getElementById('subnav-tasks-badge'); if (b) { b.textContent = S.badgeCount; b.style.display = S.badgeCount ? '' : 'none'; } }, 30);
    } catch (e) { console.error('[crm] onPanel', e); }
  }

  // L'ancien panneau Comptes reste disponible (fiche marché) ; toute ouverture d'un compte passe par la nouvelle fiche.
  if (typeof window.openEndUser === 'function' && !window._legacyOpenEndUser) {
    window._legacyOpenEndUser = window.openEndUser;
    window.openEndUser = function (id) { openAccount(id); };
    try { openEndUser = window.openEndUser; } catch (e) {}
  }

  window.scoutCrm = { onPanel: onPanel, openAccount: openAccount, refreshBadge: refreshBadge };
  setTimeout(refreshBadge, 2500);
  setInterval(refreshBadge, 5 * 60 * 1000);
})();
