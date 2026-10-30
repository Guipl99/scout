/* Scout : prospection account-based (portefeuille, comptes, contacts, tâches). Dynamics reste le CRM.
   Chargé après le script principal (index.html). Expose window.scoutCrm.
   Données : API /crm/* (scout-api/crm.js). */
(function () {
  'use strict';

  var API = (window.SCOUT_API_URL) || 'https://scout-api-production-fa8d.up.railway.app';
  var PAGE = 100;

  var STATUS_LABEL = { nouveau: 'Nouveau', contacte: 'Contacté', engage: 'Engagé', qualifie: 'Qualifié', transmis: 'Dans Dynamics', client: 'Client', perdu: 'Perdu' };
  var STATUS_ORDER = ['nouveau', 'contacte', 'engage', 'qualifie', 'transmis', 'client', 'perdu'];
  var ROLE_LABEL = { decideur: 'Décideur', acheteur: 'Acheteur', utilisateur: 'Utilisateur', technique: 'Technique', influenceur: 'Influenceur' };
  var ROLE_HINT = { decideur: 'Signe ou arbitre : chef de service, commandant, directeur', acheteur: 'Achats, marchés publics, acquisition', utilisateur: 'Opère les drones au quotidien', technique: 'Évalue la solution : technique, innovation, SI' };
  var KEY_ROLES = ['decideur', 'acheteur', 'utilisateur', 'technique'];
  var HEAT_LABEL = { chaud: 'Chaud', tiede: 'Tiède', froid: 'Froid' };
  var ACT_LABEL = { phone: 'Appel', in_person: 'Rendez-vous', email: 'Email', linkedin_message: 'LinkedIn', third_party: 'Via un tiers', other: 'Autre' };
  var OUTCOME_LABEL = { positive: 'Positif', neutral: 'Neutre', negative: 'Négatif' };
  var ACTION_LABEL = {
    email: 'Email envoyé', email_bounced: 'Email non remis', linkedin_message: 'Message LinkedIn', linkedin_connect: 'Invitation LinkedIn',
    phone: 'Appel', call: 'Appel', in_person: 'Rendez-vous', meeting: 'Rendez-vous', third_party: 'Via un tiers', via_third_party: 'Via un tiers',
    other: 'Autre action', reply_positive: 'Réponse positive', reply_negative: 'Réponse négative', already_client: 'Marqué déjà client',
    already_prospected_external: 'Déjà prospecté hors Scout', not_relevant: 'Marqué non pertinent', transmitted_crm: 'Saisi dans Dynamics',
    stale_flag: 'Signalé obsolète', nonprospect: 'Marqué non prospect'
  };
  var ICON = {
    mail: '<svg viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 4l6 4.5L14 4" stroke="currentColor" stroke-width="1.4"/></svg>',
    chat: '<svg viewBox="0 0 16 16" fill="none"><path d="M2 3.5h12v7H6l-3 2.5v-2.5H2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    phone: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1 3-1.5 1a8 8 0 004.5 4.5L11 9l3 1v3a1 1 0 01-1 1A11 11 0 012 3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    meet: '<svg viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="5" r="2.2" stroke="currentColor" stroke-width="1.3"/><circle cx="11" cy="5.5" r="1.8" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 13c0-2.3 1.8-3.8 4-3.8s4 1.5 4 3.8M10 9.4c2 0 4 1.2 4 3.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    note: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9H3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5.5 8h5M5.5 10.5h3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    user: '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.6" stroke="currentColor" stroke-width="1.4"/><path d="M3 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    flag: '<svg viewBox="0 0 16 16" fill="none"><path d="M3.5 14V2.5M3.5 3h8l-1.5 3 1.5 3h-8" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    send: '<svg viewBox="0 0 16 16" fill="none"><path d="M2 8l12-5.5L10 14l-2-4.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    edit: '<svg viewBox="0 0 16 16" fill="none"><path d="M10.5 2.5l3 3L6 13H3v-3z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    dot: '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" fill="currentColor"/></svg>'
  };

  // ── utilitaires ────────────────────────────────────────────────────────────
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Lien sûr : http(s) uniquement, schéma ajouté si absent, sinon lien neutre.
  function safeUrl(u) { u = String(u == null ? '' : u).trim(); if (!u) return '#'; if (!/^https?:\/\//i.test(u)) { if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '#'; u = 'https://' + u.replace(/^\/+/, ''); } return esc(u); }
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
        if (!r.ok) { var e = new Error(d.error || ('HTTP ' + r.status)); e.status = r.status; e.data = d; throw e; }
        return d;
      });
    });
  }
  // Liste déroulante de comptes avec recherche (rattachement, signaux)
  function acctPicker(host, opts) {
    opts = opts || {};
    host.innerHTML = '<div class="crm-pick"><input type="search" class="crm-input" placeholder="' + esc(opts.placeholder || 'Rechercher un compte…') + '" aria-label="' + esc(opts.placeholder || 'Rechercher un compte') + '" autocomplete="off"><ul class="crm-pick-list" role="listbox" hidden></ul></div>';
    var inp = host.querySelector('input'), ul = host.querySelector('ul'), timer = null, items = [], seq = 0;
    function draw() {
      ul.hidden = !items.length;
      ul.innerHTML = items.map(function (a, i) {
        return '<li role="option"><button type="button" data-i="' + i + '"><b>' + esc(a.nom) + '</b><span class="crm-meta"> ' + esc([a.pays, a.parent_nom ? '› ' + a.parent_nom : ''].filter(Boolean).join(' ')) + '</span></button></li>';
      }).join('');
      ul.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { pick(items[+b.getAttribute('data-i')]); }; });
    }
    function pick(a) { if (!a) return; items = []; draw(); inp.value = a.nom; if (opts.onPick) opts.onPick(a); }
    inp.oninput = function () {
      clearTimeout(timer); var q = inp.value.trim();
      if (q.length < 2) { items = []; draw(); return; }
      timer = setTimeout(function () {
        var my = ++seq;
        api('/crm/accounts?limit=8&sort=nom&dir=asc&q=' + encodeURIComponent(q)).then(function (d) {
          if (my !== seq) return;
          items = (d.accounts || []).filter(function (a) { return (opts.exclude || []).indexOf(a.id) < 0; }); draw();
        }).catch(function () {});
      }, 220);
    };
    inp.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); pick(items[0]); } if (e.key === 'Escape') { items = []; draw(); e.stopPropagation(); } };
    if (opts.focus) setTimeout(function () { inp.focus(); }, 30);
    return inp;
  }
  function prioBadge(v) { var n = v || 0; return '<span class="crm-prio' + (n >= 60 ? ' hi' : n >= 35 ? ' mid' : '') + '" title="Priorité : adéquation + intention + relation">' + n + '</span>'; }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'crm-toast'; t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2400);
  }
  function initials(name) {
    var p = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '?';
    return ((p[0][0] || '') + (p.length > 1 ? (p[p.length - 1][0] || '') : (p[0][1] || ''))).toUpperCase();
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayStr() { return ymd(new Date()); }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
  function relTime(iso) {
    if (!iso) return '';
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return "à l'instant";
    if (s < 3600) return 'il y a ' + Math.floor(s / 60) + ' min';
    if (s < 86400) return 'il y a ' + Math.floor(s / 3600) + ' h';
    var days = Math.floor(s / 86400);
    if (days < 30) return 'il y a ' + days + ' j';
    if (days < 365) return 'il y a ' + Math.floor(days / 30) + ' mois';
    return 'il y a ' + Math.floor(days / 365) + ' an' + (days >= 730 ? 's' : '');
  }
  function fmtDate(v) {
    if (!v) return '';
    var p = String(v).slice(0, 10).split('-'); if (p.length < 3) return v;
    var m = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][+p[1] - 1];
    return (+p[2]) + ' ' + m + (p[0] !== String(new Date().getFullYear()) ? ' ' + p[0] : '');
  }
  function dueClass(v) { if (!v) return ''; var t = todayStr(); return v < t ? 'crm-late' : (v === t ? 'crm-today' : ''); }
  function dayLabel(iso) {
    var d = new Date(iso), t = new Date(); var y = new Date(); y.setDate(t.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === y.toDateString()) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: d.getFullYear() !== t.getFullYear() ? 'numeric' : undefined });
  }
  function statusPill(s) { return '<span class="crm-pill s-' + esc(s) + '">' + esc(STATUS_LABEL[s] || s) + '</span>'; }
  function tierBadge(t) { return t ? '<span class="crm-tier t' + esc(t) + '" title="Tier ' + esc(t) + '">T' + esc(t) + '</span>' : '<span class="crm-tier none" title="Pas de tier">·</span>'; }
  function heatBadge(score, heat) { return '<span class="crm-heat h-' + esc(heat || 'froid') + '" title="Engagement : ce que le compte fait envers nous">' + esc(score || 0) + '<small>' + esc(HEAT_LABEL[heat] || '') + '</small></span>'; }
  function isAdminNow() { return (S.facets && S.facets.me && S.facets.me.role === 'admin') || (window.scoutSession && window.scoutSession.role === 'admin'); }
  function coverageDots(roles) {
    roles = roles || [];
    return '<span class="crm-cov" title="Comité d’achat : ' + KEY_ROLES.map(function (r) { return ROLE_LABEL[r] + (roles.indexOf(r) >= 0 ? ' ✓' : ' manquant'); }).join(', ') + '">'
      + KEY_ROLES.map(function (r) { return '<i class="' + (roles.indexOf(r) >= 0 ? 'on' : '') + '">' + ROLE_LABEL[r][0] + '</i>'; }).join('') + '</span>';
  }
  function rolePill(role, manual) {
    if (!role) return '<span class="crm-role none">Rôle ?</span>';
    return '<span class="crm-role r-' + esc(role) + (manual ? '' : ' guess') + '" title="' + (manual ? 'Rôle saisi' : 'Rôle déduit du titre, à confirmer') + '">' + esc(ROLE_LABEL[role] || role) + '</span>';
  }
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function opt(v, label, cur) { return '<option value="' + esc(v) + '"' + (String(cur == null ? '' : cur) === String(v) ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function go(panel, opts) { if (typeof window.go === 'function') window.go(panel, opts || {}); }
  function personName(c) { return ((c.prenom || '') + ' ' + (c.nom || '')).trim() || 'Sans nom'; }

  // ── état ───────────────────────────────────────────────────────────────────
  var S = {
    facets: null,
    filters: lsGet('scout_crm_filters', {}),
    sort: lsGet('scout_crm_sort', { sort: 'priority', dir: 'desc' }),
    treeView: !!lsGet('scout_crm_tree', 0),
    view: lsGet('scout_crm_view', 'all'),
    rows: [], total: 0, selected: {},
    savedViews: [], savedLoaded: false,
    account: null, contact: null,
    tlFilter: 'all',
    taskScope: 'me', taskState: 'open',
    people: { filters: lsGet('scout_crm_pfilters', {}), sort: { sort: 'last_activity', dir: 'desc' }, rows: [], total: 0 },
    homeScope: 'me'
  };

  var BUILTIN_VIEWS = [
    { id: 'all', name: 'Tous les comptes', filters: {}, sort: 'score', dir: 'desc' },
    { id: 'mine', name: 'Mes comptes', filters: { owner: 'me' }, sort: 'tier', dir: 'asc' },
    { id: 't1', name: 'Tier 1', filters: { tier: '1' }, sort: 'score', dir: 'desc' },
    { id: 'hot', name: 'Chauds', filters: { heat: 'chaud,tiede' }, sort: 'score', dir: 'desc' },
    { id: 'gaps', name: 'Comités incomplets', filters: { tier: '1,2', coverage: 'incomplete' }, sort: 'tier', dir: 'asc' },
    { id: 'stale', name: 'Tier 1–2 sans activité 30 j', filters: { tier: '1,2', activity: 'stale30' }, sort: 'tier', dir: 'asc' },
    { id: 'unowned', name: 'Sans propriétaire', filters: { owner: 'none', contacts: 'with' }, sort: 'score', dir: 'desc' },
    { id: 'tasks', name: 'Tâches en retard', filters: { tasks: 'overdue' }, sort: 'next_task', dir: 'asc' }
  ];

  function loadFacets() {
    if (S.facets) return Promise.resolve(S.facets);
    return api('/crm/facets').then(function (d) { S.facets = d; return d; });
  }
  function loadSavedViews() {
    if (S.savedLoaded) return Promise.resolve();
    return api('/crm/views').then(function (d) { S.savedViews = d.views || []; S.savedLoaded = true; }).catch(function () { S.savedViews = []; });
  }
  function allViews() { return BUILTIN_VIEWS.concat(S.savedViews.map(function (v) { v.custom = true; return v; })); }
  function userOptions(cur, emptyLabel) {
    return (emptyLabel != null ? opt('', emptyLabel, cur) : '') + (S.facets ? S.facets.users.map(function (u) { return opt(u.id, u.name, cur); }).join('') : '');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ACCUEIL : MA JOURNÉE (une seule page) + FILE « À FAIRE » (tâches, relances, réponses)
  // ═════════════════════════════════════════════════════════════════════════
  // File unifiée : tâches Scout (crm_tasks) + relances dues (/me/tracking) + réponses positives
  // pas encore transmises à Dynamics. Chaque élément a une échéance et une action principale.
  function loadQueue(scope, opts) {
    var team = scope === 'team', prosp = opts && opts.prospect, own = team ? '' : '&owner=me';
    var none = function (k) { return function () { var o = {}; o[k] = []; return o; }; };
    return Promise.all([
      api('/crm/tasks?scope=' + (team ? 'team' : 'me') + '&state=open').catch(function () { return { tasks: [] }; }),
      api('/me/tracking?scope=' + (team ? 'team' : 'me')).catch(function () { return { tracking: [] }; }),
      api('/assist/relances/ready').catch(function () { return { ready: [] }; }),
      api('/assist/reactions?scope=' + (team ? 'team' : 'me')).catch(function () { return { reactions: [] }; }),
      // Prospection (dans la même file) : actions proposées par la veille, comptes chauds, comptes à ouvrir, VIP
      prosp ? api('/crm/signals/proposed?scope=' + (team ? 'all' : 'me')).catch(none('rows')) : { rows: [] },
      prosp ? api('/crm/accounts?heat=chaud,tiede&sort=score&dir=desc&limit=8' + own).catch(none('accounts')) : { accounts: [] },
      prosp ? api('/crm/accounts?activity=never&contacts=with&sort=priority&dir=desc&limit=8' + own).catch(none('accounts')) : { accounts: [] },
      prosp ? api('/crm/contacts?vip=1&limit=8' + own).catch(none('contacts')) : { contacts: [] },
      // visites du site et chats sur mes comptes (fil des signaux, 14 jours)
      prosp ? api('/signals/feed?days=14&scope=' + (team ? 'all' : 'me')).catch(none('items')) : { items: [] }
    ]).then(function (r) {
      var items = [];
      var ready = {}; (r[2].ready || []).forEach(function (d) { ready[d.contact_id] = d; });
      (r[0].tasks || []).forEach(function (t) {
        items.push({ kind: 'task', id: 'task-' + t.id, due: t.due_date || null, title: t.title, task: t, tier: t.account_tier || null, created: t.created_at,
          who: t.owner_name, contact_id: t.contact_id, contact_name: t.contact_name, account_id: t.end_user_id, account_nom: t.account_nom });
      });
      (r[1].tracking || []).forEach(function (x) {
        var name = personName(x);
        if (x.status === 'waiting' && (x.urgency === 'overdue' || x.urgency === 'due' || x.urgency === 'future') && x.next_relance) {
          items.push({ kind: 'relance', tier: x.account_tier || null, id: 'rel-' + x.id, due: String(x.next_relance).slice(0, 10), title: (x.stage === '1er mail' ? 'Relance 1' : 'Relance 2') + ' : ' + name,
            sub: x.titre, who: x.owner, contact_id: x.id, contact_name: name, account_id: x.end_user_id, account_nom: x.account_nom || x.organisation, x: x, draft: ready[x.id] || null });
        } else if (x.status === 'interested') {
          items.push({ kind: 'reply', tier: x.account_tier || null, id: 'rep-' + x.id, due: x.last_action_at ? String(x.last_action_at).slice(0, 10) : null, title: 'Réponse positive : ' + name,
            sub: 'À qualifier puis saisir dans Dynamics', who: x.owner, contact_id: x.id, contact_name: name, account_id: x.end_user_id, account_nom: x.account_nom || x.organisation, x: x });
        }
      });
      // Réactions à nos emails : clic sur un lien suivi, ou visite du site par le même organisme après l'envoi.
      (r[3].reactions || []).forEach(function (x) {
        var name = personName(x), days = Math.max(0, Math.round((new Date(x.first_at) - new Date(x.sent_at)) / 864e5));
        var what = x.kind === 'clic' ? 'a ouvert le lien de ton email' : (x.account_nom || 'Son organisme') + ' est venu sur elistair.com';
        var when = days === 0 ? 'le jour même' : days === 1 ? 'le lendemain' : days + ' jours après';
        items.push({ kind: 'reaction', id: 'rea-' + x.key, due: String(x.last_at).slice(0, 10), title: 'Réaction : ' + name, who: x.performed_by,
          sub: what + ' ' + when + ' · ' + x.pages + ' page' + (x.pages > 1 ? 's' : '') + ((x.titles || []).length ? ' : ' + x.titles.filter(Boolean).slice(0, 3).join(', ') : ''),
          contact_id: x.contact_id, contact_name: name, account_id: x.end_user_id, account_nom: x.account_nom, key: x.key });
      });
      if (prosp) {
        var seenAcc = {}; items.forEach(function (it) { if (it.account_id) seenAcc[it.account_id] = 1; });
        ((r[4] && r[4].rows) || []).forEach(function (sg) {
          var acc = (sg.accounts || [])[0];
          items.push({ kind: 'signal', id: 'sig-' + sg.kind + '-' + sg.ref_id, sg: sg, score: sg.score || 0, account_id: acc && acc.id, tier: acc && acc.tier });
          if (acc) seenAcc[acc.id] = 1;
        });
        ((r[8] && r[8].items) || []).forEach(function (f) {
          if ((f.type !== 'visit' && f.type !== 'chat') || !f.account || f.imp < 2) return;
          items.push({ kind: f.type, id: 'f-' + f.key, fkey: f.key, title: f.title, sub: f.why, account_id: f.account.id, account_nom: f.account.nom, tier: f.account.tier, who: f.account.owner_name, imp: f.imp, at: f.at, qualified: f.status === 'qualified' });
          seenAcc[f.account.id] = 1;
        });
        ((r[5] && r[5].accounts) || []).forEach(function (a) {
          if (seenAcc[a.id]) return; seenAcc[a.id] = 1;
          var why = [];
          if (a.web_pages_90d) why.push(a.web_pages_90d + ' page' + (a.web_pages_90d > 1 ? 's' : '') + ' vue' + (a.web_pages_90d > 1 ? 's' : '') + ' sur le site' + (a.last_visit ? ', ' + relTime(a.last_visit) : ''));
          if (a.chats_90d) why.push('chat sur le site');
          if (a.n_market_recent) why.push('marché récent');
          if (a.last_activity_at) why.push('activité ' + relTime(a.last_activity_at));
          items.push({ kind: 'hot', id: 'hot-' + a.id, title: a.nom, sub: why.join(' · ') || 'Engagement en hausse', account_id: a.id, account_nom: a.nom, tier: a.tier, who: a.owner_name, score: a.score || 0 });
        });
        ((r[7] && r[7].contacts) || []).forEach(function (c) {
          items.push({ kind: 'vip', id: 'vip-' + c.id, title: personName(c), sub: [c.titre, c.pays].filter(Boolean).join(' · '), contact_id: c.id, contact_name: personName(c), account_id: c.end_user_id, account_nom: c.account_nom || c.organisation, tier: c.tier });
          if (c.end_user_id) seenAcc[c.end_user_id] = 1;
        });
        ((r[6] && r[6].accounts) || []).forEach(function (a) {
          if (seenAcc[a.id]) return; seenAcc[a.id] = 1;
          items.push({ kind: 'open', id: 'open-' + a.id, title: a.nom, sub: 'Jamais contacté · ' + (a.n_contacts || 0) + ' contact' + (a.n_contacts > 1 ? 's' : '') + (a.pays ? ' · ' + a.pays : ''), account_id: a.id, account_nom: a.nom, tier: a.tier, who: a.owner_name, priority: a.priority || 0 });
        });
      }
      items.forEach(function (it) { it.prio = queuePriority(it); it.later = isLater(it); });
      items.sort(function (a, b) { return b.prio - a.prio; });
      return items;
    });
  }
  var KIND_LABEL = { task: 'Tâche', relance: 'Relance', reply: 'Réponse', reaction: 'Réaction', signal: 'Marché', hot: 'Compte chaud', open: 'À ouvrir', vip: 'VIP', visit: 'Visite', chat: 'Chat' };
  var PROSP_KINDS = { signal: 1, hot: 1, open: 1, vip: 1, visit: 1, chat: 1 };

  // File unique classée par importance et urgence, sans planning au jour ou à la semaine :
  //   réactions à nos emails, puis réponses positives, puis relances dues et tâches, pondérées par le tier du compte
  //   et par le retard. Une tâche n'a pas besoin d'échéance ; une date future la range dans « Pas encore dues ».
  function daysFrom(d) { return d ? Math.round((new Date(todayStr()) - new Date(String(d).slice(0, 10))) / 864e5) : null; }
  function queuePriority(it) {
    var tierPts = it.tier == 1 ? 60 : it.tier == 2 ? 30 : it.tier == 3 ? 0 : 10;
    var late = daysFrom(it.due);
    if (it.kind === 'reaction') return 1000 - Math.min(99, Math.max(0, daysFrom(it.due) || 0)) + tierPts / 10;
    if (it.kind === 'reply') return 900 + tierPts / 10;
    if (it.kind === 'signal') return 600 + (it.score || 0) * 5 + tierPts / 10;
    if (it.kind === 'chat') return (it.qualified ? 700 : 450) + (it.imp || 0) * 5 + tierPts / 10;
    if (it.kind === 'visit') return 420 + (it.imp || 0) * 8 + tierPts / 2;
    if (it.kind === 'hot') return 400 + Math.min(it.score || 0, 50) + tierPts / 2;
    if (it.kind === 'vip') return 380 + tierPts / 2;
    if (it.kind === 'open') return 150 + Math.min(it.priority || 0, 100) / 2 + tierPts / 2;
    if (it.kind === 'relance') return late != null && late >= 0 ? 300 + Math.min(late, 30) * 4 + tierPts : 120 + late * 4 + tierPts;
    // tâche
    if (late == null) return 260 + tierPts + Math.min(30, Math.max(0, daysFrom(it.created) || 0));
    return late >= 0 ? 320 + Math.min(late, 30) * 4 + tierPts : 140 + late * 4 + tierPts;
  }
  function isLater(it) { return (it.kind === 'relance' || it.kind === 'task') && it.due && it.due > todayStr(); }

  function queueItemHtml(it, opts) {
    opts = opts || {};
    if (it.kind === 'signal') return '<div class="crm-q k-signal">' + sigCard(it.sg) + '</div>';
    if (PROSP_KINDS[it.kind]) {
      var isCt = it.kind === 'vip';
      var target = isCt ? 'data-qct="' + esc(it.contact_id) + '"' : 'data-qacc="' + esc(it.account_id) + '"';
      var psub = [esc(it.sub || '')];
      if ((isCt || it.fkey) && it.account_nom) psub.push((it.tier ? tierBadge(it.tier) + ' ' : '') + (it.account_id ? '<button type="button" class="crm-link" data-qacc="' + esc(it.account_id) + '">' + esc(it.account_nom) + '</button>' : esc(it.account_nom)));
      if (opts.showWho && it.who) psub.push(esc(it.who));
      return '<div class="crm-q k-' + it.kind + '"><span class="crm-q-ic k-prosp" aria-hidden="true">' + (it.kind === 'open' ? ICON.send : it.kind === 'chat' ? ICON.chat : ICON.flag) + '</span><div class="crm-q-b"><div class="t"><span class="crm-q-kind k-' + it.kind + '">' + KIND_LABEL[it.kind] + '</span>'
        + (!isCt && it.tier ? tierBadge(it.tier) + ' ' : '') + '<button type="button" class="crm-link strong" ' + target + '>' + esc(it.title) + '</button></div><div class="s">' + psub.filter(Boolean).join(' · ') + '</div></div>'
        + '<div class="crm-q-a"><button type="button" class="crm-btn sm" ' + target + '>' + (isCt ? 'Ouvrir le contact' : 'Ouvrir le compte') + '</button>'
        + (it.fkey ? '<button type="button" class="crm-btn sm" data-ftask="' + esc(it.fkey) + '" data-facc-id="' + esc(it.account_id) + '" data-ftitle="' + esc(it.title) + '">' + ICON.check + ' Tâche</button><button type="button" class="crm-btn ghost sm" data-fdis="' + esc(it.fkey) + '">Écarter</button>' : '')
        + '</div><div class="crm-feed-pick" hidden></div></div>';
    }
    var t = todayStr();
    var dueCls = it.due ? (it.due < t ? 'crm-late' : (it.due === t ? 'crm-today' : '')) : '';
    var late = daysFrom(it.due);
    var dueTxt = it.due ? (late > 0 ? (it.kind === 'relance' ? 'Due depuis ' + late + ' j' : 'En retard de ' + late + ' j') : (late === 0 ? (it.kind === 'relance' ? 'Due' : 'Échéance atteinte') : (it.kind === 'relance' ? 'Prévue le ' : 'Échéance ') + fmtDate(it.due))) : 'À faire';
    if (it.kind === 'reply') dueTxt = it.due ? 'Reçue le ' + fmtDate(it.due) : 'Reçue';
    if (it.kind === 'reaction') { dueTxt = it.sub; dueCls = 'crm-today'; }
    var sub = [];
    if (it.kind === 'reply' || it.kind === 'reaction') dueCls = 'crm-today';
    sub.push('<span class="' + dueCls + '">' + esc(dueTxt) + '</span>');
    if (it.account_nom) sub.push((it.tier ? tierBadge(it.tier) + ' ' : '') + (it.account_id ? '<button type="button" class="crm-link" data-qacc="' + esc(it.account_id) + '">' + esc(it.account_nom) + '</button>' : esc(it.account_nom)));
    if (it.kind === 'task' && it.contact_name) sub.push('<button type="button" class="crm-link" data-qct="' + esc(it.contact_id) + '">' + esc(it.contact_name) + '</button>');
    if (opts.showWho && it.who) sub.push(esc(it.who));
    var lead = it.kind === 'task'
      ? '<input type="checkbox" data-task="' + esc(it.task.id) + '" aria-label="Terminer : ' + esc(it.title) + '">'
      : '<span class="crm-q-ic k-' + it.kind + '" aria-hidden="true">' + (it.kind === 'relance' ? ICON.mail : ICON.check) + '</span>';
    var actions = '';
    if (it.kind === 'relance') actions = (it.draft ? '<span class="crm-q-ready" title="Rédigée par Scout ce matin : à relire et modifier avant l’envoi">' + (it.draft.edited ? 'Brouillon relu' : 'Brouillon prêt') + '</span>' : '')
      + '<button type="button" class="crm-btn sm primary" data-qrel="' + esc(it.contact_id) + '">' + (it.draft ? 'Relire et envoyer' : 'Préparer la relance') + '</button>';
    if (it.kind === 'reply') actions = '<button type="button" class="crm-btn sm" data-qct="' + esc(it.contact_id) + '">Qualifier</button><button type="button" class="crm-btn sm" data-qcopy="' + esc(it.contact_id) + '" title="Copie nom, titre, organisation, pays, email et LinkedIn pour les coller dans Dynamics">Copier la fiche</button><button type="button" class="crm-btn sm primary" data-qtx="' + esc(it.contact_id) + '" title="Une fois le contact créé dans Dynamics. Scout n’envoie rien à Dynamics.">Saisi dans Dynamics ✓</button>';
    if (it.kind === 'reply' && it.x) { S.qx = S.qx || {}; S.qx[it.contact_id] = it.x; }
    if (it.kind === 'reaction') actions = '<button type="button" class="crm-btn sm primary" data-qct="' + esc(it.contact_id) + '">Appeler ou écrire</button><button type="button" class="crm-btn sm ghost" data-qseen="' + esc(it.key) + '" title="Retirer de la file">Vu</button>';
    if (it.kind === 'task') actions = '<button type="button" class="del" data-deltask="' + esc(it.task.id) + '" title="Supprimer" aria-label="Supprimer la tâche">×</button>';
    return '<div class="crm-q k-' + it.kind + '">' + lead + '<div class="crm-q-b"><div class="t"><span class="crm-q-kind k-' + it.kind + '">' + KIND_LABEL[it.kind] + '</span>'
      + (it.kind === 'task' ? esc(it.title) : '<button type="button" class="crm-link strong" data-qct="' + esc(it.contact_id) + '">' + esc(it.title) + '</button>')
      + '</div><div class="s">' + sub.join(' · ') + '</div></div><div class="crm-q-a">' + actions + '</div></div>';
  }

  var FEED_REASONS = ['Pas une cible', 'Déjà en contact', 'Concurrent ou fournisseur', 'Particulier ou étudiant', 'Autre'];
  // Écarter un signal visite / chat : raison demandée (elle sert au bilan des sources dans Pilotage)
  function askFeedReason(host, key, onDone) {
    host.hidden = false;
    host.innerHTML = '<span class="crm-meta">Pourquoi ?</span> ' + FEED_REASONS.map(function (r) { return '<button type="button" class="crm-chip sm" data-frs="' + esc(r) + '">' + esc(r) + '</button>'; }).join(' ');
    host.querySelectorAll('[data-frs]').forEach(function (rb) {
      rb.onclick = function () { api('/signals/feed/dismiss', { method: 'POST', body: { key: key, reason: rb.getAttribute('data-frs') } }).then(function () { toast('Écarté, merci pour le retour'); onDone(); }).catch(function (e) { toast('Erreur : ' + e.message); }); };
    });
  }
  function bindQueue(root, after) {
    bindTasks(root, after);
    root.querySelectorAll('[data-fdis]').forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); var row = b.closest('.crm-q'); askFeedReason(row.querySelector('.crm-feed-pick'), b.getAttribute('data-fdis'), after); };
    });
    root.querySelectorAll('[data-ftask]').forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation(); b.disabled = true;
        var key = b.getAttribute('data-ftask'), t = (/^chat:/.test(key) ? 'Répondre au chat : ' : 'Relancer après la visite du site : ') + b.getAttribute('data-ftitle');
        api('/crm/tasks', { method: 'POST', body: { title: t.slice(0, 280), end_user_id: b.getAttribute('data-facc-id') || null } })
          .then(function () { return api('/signals/feed/dismiss', { method: 'POST', body: { key: key, state: 'task' } }); })
          .then(function () { toast('Tâche créée'); after(); }).catch(function (er) { b.disabled = false; toast('Erreur : ' + er.message); });
      };
    });
    root.querySelectorAll('[data-qacc]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openAccount(b.getAttribute('data-qacc')); }; });
    root.querySelectorAll('[data-qct]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openContact(b.getAttribute('data-qct')); }; });
    root.querySelectorAll('[data-qrel]').forEach(function (b) {
      b.onclick = function () { if (typeof window.trkRelance === 'function') { S.afterRelance = after; window.trkRelance(b.getAttribute('data-qrel')); } else openContact(b.getAttribute('data-qrel')); };
    });
    root.querySelectorAll('[data-qseen]').forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); b.disabled = true; api('/assist/reactions/seen', { method: 'POST', body: { key: b.getAttribute('data-qseen') } }).then(function () { if (after) after(); refreshBadge(); }).catch(function (er) { b.disabled = false; toast('Erreur : ' + er.message); }); };
    });
    root.querySelectorAll('[data-qcopy]').forEach(function (b) {
      b.onclick = function () {
        var x = (S.qx || {})[b.getAttribute('data-qcopy')] || {};
        var txt = [personName(x), x.titre, x.account_nom || x.organisation, x.pays, x.email, x.linkedin].filter(Boolean).join('\n');
        var done = function () { toast('Fiche copiée : colle-la dans Dynamics'); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { window.prompt('Copie la fiche :', txt); });
        else window.prompt('Copie la fiche :', txt);
      };
    });
    root.querySelectorAll('[data-qtx]').forEach(function (b) {
      b.onclick = function () {
        b.disabled = true;
        api('/action/transmit-crm', { method: 'POST', body: { contact_id: b.getAttribute('data-qtx') } })
          .then(function () { toast('Marqué comme saisi dans Dynamics'); after(); }).catch(function (e) { b.disabled = false; toast('Erreur : ' + e.message); });
      };
    });
  }



  // ═════════════════════════════════════════════════════════════════════════
  // SIGNAUX À TRAITER : appels d'offres et contrats, en un clic
  // ═════════════════════════════════════════════════════════════════════════
  // ═════════════════════════════════════════════════════════════════════════
  // SIGNAUX › FIL : marchés, visites du site, chats, du plus récent au plus ancien.
  // Trois gestes partout : rattacher (ou créer) le compte, créer une tâche, écarter.
  // ═════════════════════════════════════════════════════════════════════════
  var FEED_TYPE = { market: 'Marché', visit: 'Visite', chat: 'Chat' };
  function onFeedPanel() {
    var p = document.getElementById('panel-feed'); if (!p) return;
    S.feedScope = S.feedScope || lsGet('scout_feed_scope', 'me');
    S.feedType = S.feedType || 'all'; S.feedDays = S.feedDays || 30;
    p.innerHTML = '<div class="crm-wrap crm-home"><div class="crm-row crm-home-head"><div><div class="crm-meta crm-lead-in">Tout ce qui bouge : appels d’offres et contrats, organismes venus sur le site, chats. Ce qui concerne tes comptes remonte aussi dans Aujourd’hui.</div></div>'
      + '<select class="crm-sel" id="crm-feed-days" aria-label="Période">' + [[7, '7 jours'], [30, '30 jours'], [90, '90 jours']].map(function (d) { return '<option value="' + d[0] + '"' + (S.feedDays === d[0] ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select></div>'
      + '<div class="crm-row crm-qbar"><div class="crm-views" style="margin:0" id="crm-feed-scope"></div><div class="crm-views" style="margin:0" id="crm-feed-type"></div></div>'
      + '<div id="crm-feed-body"><div class="crm-empty">Chargement…</div></div></div>';
    document.getElementById('crm-feed-days').onchange = function () { S.feedDays = +this.value; loadFeed(); };
    loadFeed();
  }
  function loadFeed() {
    var body = document.getElementById('crm-feed-body'); if (!body) return;
    var seq = (S.feedSeq = (S.feedSeq || 0) + 1);
    api('/signals/feed?days=' + S.feedDays + '&scope=' + S.feedScope).then(function (d) {
      if (seq !== S.feedSeq) return;
      var c = d.counts || {}, items = d.items || [];
      var sc = document.getElementById('crm-feed-scope');
      sc.innerHTML = [['me', 'Mes comptes', c.me], ['all', 'Tout', c.all], ['unlinked', 'Sans compte', c.unlinked]].map(function (x) {
        return '<button type="button" class="crm-chip sm' + (S.feedScope === x[0] ? ' on' : '') + '" data-fs="' + x[0] + '">' + x[1] + '<span class="n"> ' + (x[2] || 0) + '</span></button>';
      }).join('');
      sc.querySelectorAll('[data-fs]').forEach(function (b) { b.onclick = function () { S.feedScope = b.getAttribute('data-fs'); lsSet('scout_feed_scope', S.feedScope); loadFeed(); }; });
      var byType = { all: items.length, market: 0, visit: 0, chat: 0 }; items.forEach(function (it) { byType[it.type]++; });
      var ty = document.getElementById('crm-feed-type');
      ty.innerHTML = [['all', 'Tous'], ['market', 'Marchés'], ['visit', 'Visites'], ['chat', 'Chats']].map(function (x) {
        return '<button type="button" class="crm-chip sm' + (S.feedType === x[0] ? ' on' : '') + '" data-ft="' + x[0] + '">' + x[1] + '<span class="n"> ' + (byType[x[0]] || 0) + '</span></button>';
      }).join('');
      ty.querySelectorAll('[data-ft]').forEach(function (b) { b.onclick = function () { S.feedType = b.getAttribute('data-ft'); drawFeed(); }; });
      S.feedItems = items; drawFeed();
    }).catch(function (e) { body.innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }
  function feedRow(it, i) {
    var acc = it.account;
    var title = esc(it.title);
    if (it.type === 'market' && it.url) title = '<a class="crm-link strong" href="' + esc(it.url) + '" target="_blank" rel="noopener">' + title + '</a>';
    else if (it.type === 'visit' && acc) title = '<button type="button" class="crm-link strong" data-facc="' + esc(acc.id) + '">' + title + '</button>';
    else if (it.type === 'chat') title = '<button type="button" class="crm-link strong" data-fchat="' + i + '">' + title + '</button>';
    else title = '<b>' + title + '</b>';
    var sub = [];
    if (it.type === 'market') { sub.push(sigScore(it.score)); if (it.flux) sub.push('<span class="crm-ms-type">' + esc(sigType(it)) + '</span>'); var v = it.value_max ? (it.value_max >= 1e9 ? (it.value_max / 1e9).toFixed(1).replace('.', ',') + ' Md' : it.value_max >= 1e6 ? Math.round(it.value_max / 1e6) + ' M' : '') : ''; sub.push(esc([it.buyer, it.pays, v].filter(Boolean).join(' · '))); }
    if (it.type === 'visit') sub.push(esc([it.org && it.org.country, it.org && it.org.domain].filter(Boolean).join(' · ')));
    var accHtml = acc ? '<span class="crm-feed-acc">' + (acc.tier ? tierBadge(acc.tier) + ' ' : '') + '<button type="button" class="crm-link" data-facc="' + esc(acc.id) + '">' + esc(acc.nom) + '</button>' + (acc.owner_name ? ' · ' + esc(acc.owner_name) : ' · sans commercial') + '</span>'
      : '<span class="crm-feed-acc none">Sans compte</span>';
    var btns = '';
    if (!acc) btns += it.type === 'visit' ? '<button type="button" class="crm-btn sm primary" data-fa="create" data-i="' + i + '">Créer le compte</button><button type="button" class="crm-btn sm" data-fa="link" data-i="' + i + '">Rattacher</button>'
      : '<button type="button" class="crm-btn sm" data-fa="link" data-i="' + i + '">Rattacher</button>';
    btns += '<button type="button" class="crm-btn sm' + (acc ? ' primary' : '') + '" data-fa="task" data-i="' + i + '">' + ICON.check + ' Tâche</button>';
    if (it.type === 'visit' && acc && it.org && it.org.domain) btns += '<button type="button" class="crm-btn sm" data-fa="contacts" data-i="' + i + '" title="Recherche Hunter sur ' + esc(it.org.domain) + ' : 1 crédit">Chercher des contacts</button>';
    btns += '<button type="button" class="crm-btn ghost sm" data-fa="dismiss" data-i="' + i + '">Écarter</button>';
    return '<div class="crm-feed-row t-' + it.type + (it.imp >= 4 ? ' strong' : '') + '" data-row="' + i + '">'
      + '<span class="crm-q-kind k-' + it.type + '">' + FEED_TYPE[it.type] + '</span>'
      + '<div class="crm-feed-b"><div class="t">' + title + '</div>'
      + '<div class="s">' + sub.filter(Boolean).join(' ') + (it.why ? '<span class="crm-meta"> ' + esc(it.why) + '</span>' : '') + '</div>'
      + '<div class="s">' + accHtml + ' <span class="crm-meta">· ' + esc(relTime(it.at)) + '</span></div>'
      + '<div class="crm-feed-pick" hidden></div></div>'
      + '<div class="crm-feed-a">' + btns + '</div></div>';
  }
  function drawFeed() {
    var body = document.getElementById('crm-feed-body'); if (!body) return;
    document.querySelectorAll('#crm-feed-type [data-ft]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-ft') === S.feedType); });
    var all = S.feedItems || [];
    var list = all.map(function (it, i) { return { it: it, i: i }; }).filter(function (x) { return S.feedType === 'all' || x.it.type === S.feedType; });
    if (!list.length) { body.innerHTML = '<div class="crm-empty">' + (S.feedScope === 'me' ? 'Rien de neuf sur tes comptes sur cette période. Regarde « Tout » ou « Sans compte ».' : 'Rien sur cette période.') + '</div>'; return; }
    var html = '', last = '';
    list.forEach(function (x) {
      var day = x.it.at ? dayLabel(x.it.at) : 'Sans date';
      if (day !== last) { html += (last ? '</div>' : '') + '<div class="crm-tl-day">' + esc(day) + '</div><div class="crm-card crm-feed">'; last = day; }
      html += feedRow(x.it, x.i);
    });
    body.innerHTML = html + '</div>';
    bindFeed(body);
  }
  // Recherche de contacts sur le domaine d'un organisme venu sur le site (Hunter, 1 crédit, sur clic seulement).
  // Les emails gouvernementaux non confirmés par Hunter ne sont pas ajoutés.
  function feedContacts(it, pick, btn) {
    pick.hidden = false; pick.innerHTML = '<span class="crm-meta">Recherche sur ' + esc(it.org.domain) + '…</span>'; btn.disabled = true;
    api('/v/accounts/search-contacts', { method: 'POST', body: { key: it.org.key } }).then(function (r) {
      var cands = (r.candidates || []).filter(function (c) { return !c.existing_id; });
      if (!cands.length) { pick.innerHTML = '<span class="crm-meta">' + esc(r.message || ('Aucun nouveau contact trouvé sur ' + (r.domain || it.org.domain) + '.')) + '</span>'; btn.disabled = false; return; }
      pick.innerHTML = '<div class="crm-feed-cands">' + cands.map(function (c, k) {
        return '<label class="crm-feed-cand"><input type="checkbox" value="' + esc(c.email) + '"' + (c.suggested ? ' checked' : '') + '> <b>' + esc(((c.prenom || '') + ' ' + (c.nom || '')).trim() || c.email) + '</b> <span class="crm-meta">' + esc([c.titre, c.email, c.confidence ? c.confidence + ' %' : ''].filter(Boolean).join(' · ')) + '</span></label>';
      }).join('') + '</div><button type="button" class="crm-btn sm primary" data-add>Ajouter au compte</button> <span class="crm-meta">Chaque email est vérifié avant l’ajout.</span>';
      pick.querySelector('[data-add]').onclick = function () {
        var emails = [].map.call(pick.querySelectorAll('input:checked'), function (x) { return x.value; });
        if (!emails.length) { toast('Coche au moins un contact'); return; }
        this.disabled = true;
        api('/v/accounts/add-contacts', { method: 'POST', body: { key: it.org.key, emails: emails } }).then(function (out) {
          var ids = (out.contacts || []).map(function (c) { return c.id; }).filter(Boolean);
          return (ids.length ? api('/crm/accounts/' + encodeURIComponent(it.account.id) + '/attach-contacts', { method: 'POST', body: { ids: ids } }) : Promise.resolve({ attached: 0 })).then(function (a) {
            var sk = (out.skipped || []).length;
            pick.innerHTML = '<span class="crm-meta">' + (out.contacts || []).length + ' contact' + ((out.contacts || []).length > 1 ? 's' : '') + ' ajouté' + ((out.contacts || []).length > 1 ? 's' : '') + ' à ' + esc(it.account.nom) + (sk ? ', ' + sk + ' écarté' + (sk > 1 ? 's' : '') + ' (email non confirmé)' : '') + '.</span>';
          });
        }).catch(function (e) { pick.innerHTML = '<span class="crm-meta">Erreur : ' + esc(e.message) + '</span>'; });
      };
    }).catch(function (e) { pick.innerHTML = '<span class="crm-meta">Erreur : ' + esc(e.message) + '</span>'; btn.disabled = false; });
  }
  function bindFeed(body) {
    var items = S.feedItems || [];
    var done = function (row, msg) { toast(msg); row.classList.add('gone'); setTimeout(function () { row.remove(); }, 250); refreshPropBadge(); };
    body.querySelectorAll('[data-facc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-facc')); }; });
    body.querySelectorAll('[data-fchat]').forEach(function (b) { b.onclick = function () { go('chat'); }; });
    body.querySelectorAll('[data-fa]').forEach(function (b) {
      b.onclick = function () {
        var it = items[+b.getAttribute('data-i')], a = b.getAttribute('data-fa'), row = b.closest('.crm-feed-row'), pick = row.querySelector('.crm-feed-pick');
        if (a === 'task') {
          if (it.type === 'market') {
            return api('/crm/signals/' + it.kind + '/' + encodeURIComponent(it.ref_id) + '/action', { method: 'POST', body: { action: it.flux === 1 ? 'go' : 'accept' } })
              .then(function () { done(row, 'Tâche créée dans Aujourd’hui'); }).catch(function (e) { toast('Erreur : ' + e.message); });
          }
          var title = it.type === 'visit' ? 'Relancer ' + it.title + ' : visite du site (' + (it.why || '').split(' · ')[0] + ')' : 'Répondre au chat : ' + it.title;
          return api('/crm/tasks', { method: 'POST', body: { title: title.slice(0, 280), end_user_id: it.account ? it.account.id : null } })
            .then(function () { return api('/signals/feed/dismiss', { method: 'POST', body: { key: it.key, state: 'task' } }); })
            .then(function () { done(row, 'Tâche créée dans Aujourd’hui'); }).catch(function (e) { toast('Erreur : ' + e.message); });
        }
        if (a === 'contacts') return feedContacts(it, pick, b);
        if (a === 'create') {
          b.disabled = true;
          return api('/crm/accounts', { method: 'POST', body: { nom: it.org.name, pays: it.org.country || null, domain: it.org.domain || null, type: it.org.org_type === 'government' ? 'Sécurité publique' : 'Entreprise', source: 'visite du site' } })
            .then(function (r) { S.treeData = null; toast(r.existed ? 'Ce compte existait déjà : ' + r.account.nom : 'Compte créé' + (r.account.owner_name ? ', attribué à ' + r.account.owner_name : '')); loadFeed(); })
            .catch(function (e) { b.disabled = false; toast('Erreur : ' + e.message); });
        }
        if (a === 'link') {
          pick.hidden = false;
          return acctPicker(pick, { focus: true, placeholder: 'Rattacher à quel compte ?', onPick: function (acc) {
            if (it.type === 'market') {
              api('/crm/signals/' + it.kind + '/' + encodeURIComponent(it.ref_id) + '/action', { method: 'POST', body: { action: 'link', end_user_id: acc.id } })
                .then(function () { toast('Rattaché à ' + acc.nom); loadFeed(); }).catch(function (e) { toast('Erreur : ' + e.message); });
            } else if (it.type === 'visit' && it.org && it.org.domain) {
              // les prochaines visites de ce domaine se rattacheront seules au compte
              api('/crm/accounts/' + encodeURIComponent(acc.id)).then(function (D) {
                if (D.account && D.account.domain && !D.account.domain_guessed && D.account.domain.toLowerCase() !== it.org.domain) { toast(acc.nom + ' a déjà le domaine ' + D.account.domain); return null; }
                return api('/crm/accounts/' + encodeURIComponent(acc.id), { method: 'PATCH', body: { domain: it.org.domain } }).then(function () { toast('Rattaché à ' + acc.nom); loadFeed(); });
              }).catch(function (e) { toast('Erreur : ' + e.message); });
            } else { toast('Rattache ce chat depuis l’onglet Chat du site'); go('chat'); }
          } });
        }
        if (a === 'dismiss') {
          if (it.type !== 'market') return askFeedReason(pick, it.key, function () { row.classList.add('gone'); setTimeout(function () { row.remove(); }, 250); });
          pick.hidden = false;
          pick.innerHTML = '<span class="crm-meta">Pourquoi ?</span> ' + SIG_REASONS.map(function (r) { return '<button type="button" class="crm-chip sm" data-rs="' + esc(r) + '">' + esc(r) + '</button>'; }).join(' ');
          pick.querySelectorAll('[data-rs]').forEach(function (rb) {
            rb.onclick = function () {
              api('/crm/signals/' + it.kind + '/' + encodeURIComponent(it.ref_id) + '/action', { method: 'POST', body: { action: it.flux === 1 ? 'nogo' : 'not_relevant', reason: rb.getAttribute('data-rs') } })
                .then(function () { done(row, 'Écarté, merci pour le retour'); }).catch(function (e) { toast('Erreur : ' + e.message); });
            };
          });
        }
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // QUALITÉ DES DONNÉES (admins, sous Statistiques)
  // ═════════════════════════════════════════════════════════════════════════
  function loadHygiene() {
    var box = document.getElementById('crm-hygiene'); if (!box) return;
    api('/crm/hygiene').then(function (d) {
      var r = d.report || {}, last = d.last_run;
      var kpi = function (v, l) { return '<div class="crm-kpi" style="cursor:default"><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>'; };
      box.innerHTML = '<h3>Qualité des données <span class="crm-meta">' + (last ? 'dernier nettoyage ' + esc(relTime(last.at)) : 'jamais nettoyée') + ' · automatique chaque semaine</span></h3>'
        + '<div class="crm-kpis">' + kpi(r.duplicates_count || 0, 'doublons probables') + kpi(r.t12_no_owner || 0, 'Tier 1–2 sans propriétaire') + kpi(r.accounts_no_country || 0, 'comptes sans pays')
        + kpi(r.accounts_no_sector || 0, 'comptes sans secteur') + kpi(r.orphan_contacts || 0, 'contacts sans compte') + kpi(r.tasks_late_30 || 0, 'tâches en retard de 30 j+') + '</div>'
        + '<div class="crm-row" style="gap:8px;margin-bottom:10px"><button type="button" class="crm-btn" id="crm-hyg-run">Lancer le nettoyage maintenant</button><span class="crm-meta">Corrige seul l’écriture des secteurs (casse, accents) et les espaces dans les noms. Les doublons se fusionnent à la main ci-dessous.</span></div>'
        + ((r.duplicates || []).length ? '<details><summary class="crm-link" style="cursor:pointer">Voir les doublons (' + r.duplicates.length + ')</summary><div class="crm-dups">' + r.duplicates.map(function (g, gi) {
          return '<div class="crm-dup">' + g.map(function (a, ai) {
            return '<div class="crm-row" style="gap:8px"><button type="button" class="crm-link" data-open="' + esc(a.id) + '">' + esc(a.nom) + '</button><span class="crm-meta">' + esc(a.pays || '') + ' · ' + esc(a.id) + '</span>'
              + '<button type="button" class="crm-btn ghost sm" data-keep="' + gi + ':' + ai + '">Garder celui-ci</button></div>';
          }).join('') + '</div>';
        }).join('') + '</div></details>' : '');
      box.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-open')); }; });
      var run = document.getElementById('crm-hyg-run');
      run.onclick = function () { run.disabled = true; run.textContent = 'Nettoyage…'; api('/crm/hygiene/run', { method: 'POST' }).then(function (x) { toast('Nettoyage : ' + (x.fixed.secteurs || 0) + ' secteurs et ' + (x.fixed.noms || 0) + ' noms corrigés'); S.treeData = null; loadHygiene(); }).catch(function (e) { toast('Erreur : ' + e.message); run.disabled = false; }); };
      box.querySelectorAll('[data-keep]').forEach(function (b) { b.onclick = function () {
        var p = b.getAttribute('data-keep').split(':'), g = r.duplicates[+p[0]], keep = g[+p[1]];
        var others = g.filter(function (x) { return x.id !== keep.id; });
        if (!window.confirm('Fusionner ' + others.length + ' doublon' + (others.length > 1 ? 's' : '') + ' dans « ' + keep.nom + ' » ? Contacts, tâches, notes et marchés seront déplacés. Le doublon est masqué, rien n’est supprimé.')) return;
        others.reduce(function (pr, o) { return pr.then(function () { return api('/crm/accounts/' + encodeURIComponent(o.id) + '/merge', { method: 'POST', body: { into: keep.id } }); }); }, Promise.resolve())
          .then(function () { toast('Fusion faite'); S.treeData = null; loadHygiene(); }).catch(function (e) { toast('Erreur : ' + e.message); });
      }; });
    }).catch(function (e) { box.innerHTML = '<h3>Qualité des données</h3><div class="crm-meta">' + esc(e.status === 403 ? 'Réservé aux admins.' : 'Erreur : ' + e.message) + '</div>'; });
  }


  // ═════════════════════════════════════════════════════════════════════════
  // SIGNAUX MARCHÉ : cartes « action proposée » et onglet Marchés
  // ═════════════════════════════════════════════════════════════════════════
  function sigType(sg) {
    if (sg.flux === 1) return /avis amont/.test(sg.why || '') ? 'Avis amont' : 'Appel d’offres';
    if (sg.flux === 2) return 'Concurrent' + (sg.competitor ? ' : ' + sg.competitor : '');
    if (sg.flux === 3) return 'Achat déclencheur';
    return sg.kind === 'tender' ? 'Appel d’offres' : 'Contrat';
  }
  function sigScore(n) { return '<span class="crm-ms-score s' + (n >= 5 ? 'hi' : n >= 3 ? 'mid' : 'lo') + '" title="Note sur 8 : produit, moment, compte, taille">' + n + '/8</span>'; }
  function sigCard(sg) {
    var acc = (sg.accounts || [])[0];
    var title = esc(sg.title || 'Sans titre');
    var btns = sg.flux === 1
      ? '<button type="button" class="crm-btn primary sm" data-sa="go">Go</button><button type="button" class="crm-btn sm" data-sa="nogo">No-go</button>'
      : '<button type="button" class="crm-btn primary sm" data-sa="accept">Accepter</button>';
    btns += '<button type="button" class="crm-btn ghost sm" data-sa="not_relevant">Pas pertinent</button>';
    if (!acc) btns = '<button type="button" class="crm-btn sm" data-sa="link">Relier à un compte</button>' + btns;
    return '<div class="crm-ms" data-sk="' + esc(sg.kind) + '" data-sr="' + esc(sg.ref_id) + '">'
      + '<div class="crm-ms-head">' + sigScore(sg.score) + '<span class="crm-ms-type">' + esc(sigType(sg)) + '</span>'
      + '<b class="crm-ms-title">' + (sg.url ? '<a href="' + esc(sg.url) + '" target="_blank" rel="noopener">' + title + '</a>' : title) + '</b></div>'
      + '<div class="crm-ms-body"><div><div class="crm-meta">Pourquoi : ' + esc(sg.why || '') + '</div>'
      + '<div class="crm-ms-act">' + esc(sg.action || '') + '</div>'
      + (sg.source ? '<div class="crm-meta">Source : ' + esc(sg.source) + (sg.type ? ' · ' + esc(sg.type) : '') + '</div>' : '')
      + '<div class="crm-meta">' + (acc ? '<button type="button" class="crm-link" data-acc="' + esc(acc.id) + '">' + esc(acc.nom) + '</button> · ' + esc(acc.owner_name || 'sans commercial') : 'Sans compte : à relier (tri admin)') + '</div></div>'
      + '<div class="crm-ms-btns">' + btns + '</div></div>'
      + '<div class="crm-ms-pick" hidden></div></div>';
  }
  var SIG_REASONS = ['Hors produit', 'Hors zone', 'Trop petit', 'Déjà connu', 'Autre'];
  function bindSigCards(root, reload) {
    root.querySelectorAll('.crm-ms').forEach(function (card) {
      var kind = card.getAttribute('data-sk'), ref = card.getAttribute('data-sr');
      var send = function (body, msg) {
        card.style.opacity = '.5';
        return api('/crm/signals/' + kind + '/' + encodeURIComponent(ref) + '/action', { method: 'POST', body: body })
          .then(function () { toast(msg); reload(); refreshPropBadge(); })
          .catch(function (e) { card.style.opacity = ''; toast('Erreur : ' + e.message); });
      };
      card.querySelectorAll('[data-sa]').forEach(function (b) {
        b.onclick = function () {
          var a = b.getAttribute('data-sa');
          if (a === 'go') return send({ action: 'go' }, 'Go : tâche créée dans À faire');
          if (a === 'accept') return send({ action: 'accept' }, 'Action acceptée : tâche créée dans À faire');
          if (a === 'link') {
            var host = card.querySelector('.crm-ms-pick'); host.hidden = false;
            acctPicker(host, { focus: true, placeholder: 'Relier à quel compte ?', onPick: function (acc) { send({ action: 'link', end_user_id: acc.id }, 'Relié à ' + acc.nom); } });
            return;
          }
          // no-go / pas pertinent : choix de la raison (sert à ajuster les mots-clés)
          var host2 = card.querySelector('.crm-ms-pick'); host2.hidden = false;
          host2.innerHTML = '<span class="crm-meta">' + (a === 'nogo' ? 'Pourquoi no-go ?' : 'Pourquoi pas pertinent ?') + '</span> '
            + SIG_REASONS.map(function (r) { return '<button type="button" class="crm-chip" data-rs="' + esc(r) + '">' + esc(r) + '</button>'; }).join(' ');
          host2.querySelectorAll('[data-rs]').forEach(function (rb) {
            rb.onclick = function () { send({ action: a, reason: rb.getAttribute('data-rs') }, a === 'nogo' ? 'No-go enregistré' : 'Écarté, merci pour le retour'); };
          });
        };
      });
      card.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
    });
  }

  function onMarketPanel() {
    var p = document.getElementById('panel-market'); if (!p) return;
    S.mkView = S.mkView || lsGet('scout_market_view', 'competitors');
    p.innerHTML = '<div class="crm-wrap crm-home">'
      + '<div class="crm-row crm-home-head"><div class="crm-meta crm-lead-in">Consultation. Les actions à mener arrivent dans Prospection.</div>'
      + '<div class="crm-seg"><button type="button" class="crm-chip" data-mv="competitors">Concurrents</button><button type="button" class="crm-chip" data-mv="library">Bibliothèque</button></div></div>'
      + '<div id="crm-mk-body"><div class="crm-empty">Chargement…</div></div></div>';
    p.querySelectorAll('[data-mv]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-mv') === S.mkView);
      b.onclick = function () { S.mkView = b.getAttribute('data-mv'); lsSet('scout_market_view', S.mkView); onMarketPanel(); };
    });
    if (S.mkView === 'library') loadLibrary(); else loadCompetitors();
  }
  function mkRow(sg) {
    var val = sg.value_max ? (sg.value_max >= 1e9 ? (sg.value_max / 1e9).toFixed(1).replace('.', ',') + ' Md' : sg.value_max >= 1e6 ? Math.round(sg.value_max / 1e6) + ' M' : Math.round(sg.value_max / 1e3) + ' k') : '';
    var acc = (sg.accounts || [])[0];
    var title = esc(sg.title || 'Sans titre');
    return '<div class="crm-mk-row">' + sigScore(sg.score)
      + '<span class="m"><span class="crm-ms-type">' + esc(sigType(sg)) + '</span> <b>' + (sg.url ? '<a href="' + esc(sg.url) + '" target="_blank" rel="noopener">' + title + '</a>' : title) + '</b>'
      + '<span class="crm-meta">' + esc([sg.buyer, sg.pays, sg.supplier, val, sg.source].filter(Boolean).join(' · ')) + '</span>'
      + (sg.why ? '<span class="crm-meta">' + esc(sg.why) + '</span>' : '') + '</span>'
      + '<span class="r crm-meta">' + esc(sg.date ? fmtDate(sg.date) : '') + (acc ? '<br><button type="button" class="crm-link" data-acc="' + esc(acc.id) + '">' + esc(acc.nom) + '</button>' : '') + '</span></div>';
  }
  function loadCompetitors() {
    var body = document.getElementById('crm-mk-body');
    api('/crm/market/competitors').then(function (d) {
      var list = d.competitors || [];
      body.innerHTML = '<div class="crm-meta" style="margin:0 0 10px">Contrats, commandes et distributeurs des concurrents filaires, avec acheteur nommé. Les levées de fonds et lancements de produit n’y figurent pas.</div>'
        + list.map(function (c) {
          return '<div class="crm-card"><h3>' + esc(c.name) + ' <span class="crm-meta">' + c.n + ' marché' + (c.n > 1 ? 's' : '') + ' en base</span></h3>'
            + (c.items.length ? c.items.map(mkRow).join('') : '<div class="crm-empty" style="padding:10px">Rien en base pour l’instant.</div>') + '</div>';
        }).join('');
      body.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
    }).catch(function (e) { body.innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }
  function loadLibrary() {
    var body = document.getElementById('crm-mk-body');
    S.mkQ = S.mkQ || ''; S.mkMin = S.mkMin == null ? 0 : S.mkMin; S.mkKind = S.mkKind || '';
    body.innerHTML = '<div class="crm-row" style="gap:8px;margin-bottom:10px;flex-wrap:wrap"><input type="search" class="crm-input" id="crm-mk-q" placeholder="Rechercher un titre, un acheteur, un pays, un fournisseur…" value="' + esc(S.mkQ) + '" style="flex:1;min-width:220px">'
      + '<select class="crm-input" id="crm-mk-kind" style="width:auto"><option value="">Tout</option><option value="tender">Appels d’offres</option><option value="contract">Contrats</option></select>'
      + '<select class="crm-input" id="crm-mk-min" style="width:auto"><option value="0">Toutes les notes</option><option value="3">3 et plus</option><option value="5">5 et plus</option></select></div>'
      + '<div id="crm-mk-list"><div class="crm-empty">Chargement…</div></div>';
    var q = document.getElementById('crm-mk-q'), k = document.getElementById('crm-mk-kind'), m = document.getElementById('crm-mk-min');
    k.value = S.mkKind; m.value = String(S.mkMin);
    var t = null;
    var run = function () {
      S.mkQ = q.value.trim(); S.mkKind = k.value; S.mkMin = parseInt(m.value, 10) || 0;
      api('/crm/market/library?q=' + encodeURIComponent(S.mkQ) + '&kind=' + S.mkKind + '&min=' + S.mkMin).then(function (d) {
        var list = document.getElementById('crm-mk-list'); if (!list) return;
        var c = d.counts || {};
        list.innerHTML = '<div class="crm-meta" style="margin-bottom:8px">' + d.n + ' résultat' + (d.n > 1 ? 's' : '') + (d.n > 200 ? ' (200 affichés)' : '') + ' · ' + (c.total || 0) + ' en base, ' + (c.proposed || 0) + ' notés 5 et plus, ' + (c.watch || 0) + ' notés 3 ou 4</div>'
          + '<div class="crm-card">' + ((d.rows || []).map(mkRow).join('') || '<div class="crm-empty" style="padding:10px">Aucun résultat.</div>') + '</div>';
        list.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
      }).catch(function (e) { document.getElementById('crm-mk-list').innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
    };
    q.oninput = function () { clearTimeout(t); t = setTimeout(run, 250); };
    k.onchange = run; m.onchange = run;
    run();
  }


  // ═════════════════════════════════════════════════════════════════════════
  // VEILLE : comptes qui évaluent, testent, achètent ou utilisent un drone filaire
  // (posts LinkedIn publics, sites des concurrents et distributeurs, presse). Centré comptes.
  // ═════════════════════════════════════════════════════════════════════════
  var VK = { evaluation: 'Évalue', demo: 'Démo', achat: 'Achète', ao: 'Appel d’offres', livraison: 'Livré', usage: 'Utilise' };
  var VK_HOT = { evaluation: 1, demo: 1, achat: 1, ao: 1 };
  function veilleKind(k) { return '<span class="crm-vk' + (VK_HOT[k] ? ' hot' : '') + '">' + esc(VK[k] || k) + '</span>'; }
  function veilleHit(h, withOrg) {
    var src = h.source === 'linkedin' ? 'LinkedIn' : 'Web';
    return '<div class="crm-vh" data-vh="' + h.id + '">' + veilleKind(h.kind)
      + '<span class="m">' + (withOrg ? '<b>' + esc(h.org_name) + '</b> <span class="crm-meta">' + esc([h.org_country, h.secteur].filter(Boolean).join(' · ')) + '</span><br>' : '')
      + esc(h.evidence || h.title || '') + '<br><span class="crm-meta">' + esc([h.competitor ? 'Concurrent : ' + h.competitor : '', h.date ? fmtDate(h.date) : ''].filter(Boolean).join(' · '))
      + ' · <a class="crm-link" href="' + esc(h.url) + '" target="_blank" rel="noopener">' + src + '</a></span></span>'
      + '<span class="r"><button type="button" class="crm-link crm-vh-ign" data-ign="' + h.id + '" title="Hors sujet : ne plus afficher">Ignorer</button></span></div>';
  }
  function onVeillePanel() {
    var p = document.getElementById('panel-veille'); if (!p) return;
    S.vFilter = S.vFilter || lsGet('scout_veille_f', 'hot'); S.vMine = S.vMine == null ? lsGet('scout_veille_mine', false) : S.vMine;
    p.innerHTML = '<div class="crm-wrap crm-home">'
      + '<div class="crm-row crm-home-head"><div class="crm-meta crm-lead-in">Comptes qui évaluent, testent, achètent ou utilisent un drone filaire, repérés chaque semaine sur LinkedIn (posts publics), les sites des concurrents et de leurs distributeurs, et la presse.</div></div>'
      + '<div class="crm-row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px"><div class="crm-seg">'
      + '<button type="button" class="crm-chip" data-vf="hot">En phase d’achat</button><button type="button" class="crm-chip" data-vf="client">Équipés chez un concurrent</button><button type="button" class="crm-chip" data-vf="all">Tout</button></div>'
      + '<label class="crm-meta" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="crm-v-mine"' + (S.vMine ? ' checked' : '') + '> Mes comptes</label>'
      + '<span class="crm-meta" id="crm-v-last" style="margin-left:auto"></span></div>'
      + '<div id="crm-v-body"><div class="crm-empty">Chargement…</div></div></div>';
    p.querySelectorAll('[data-vf]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-vf') === S.vFilter);
      b.onclick = function () { S.vFilter = b.getAttribute('data-vf'); lsSet('scout_veille_f', S.vFilter); onVeillePanel(); };
    });
    document.getElementById('crm-v-mine').onchange = function () { S.vMine = this.checked; lsSet('scout_veille_mine', S.vMine); drawVeille(); };
    Promise.all([S.facets ? Promise.resolve(S.facets) : loadFacets().catch(function () { return null; }), api('/crm/veille')]).then(function (r) {
      S.veille = r[1]; drawVeille();
    }).catch(function (e) { document.getElementById('crm-v-body').innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }
  function drawVeille() {
    var body = document.getElementById('crm-v-body'); if (!body || !S.veille) return;
    var d = S.veille, meId = S.facets && S.facets.me && String(S.facets.me.user_id);
    var last = d.last && d.last.at ? 'Dernier passage : ' + fmtDate(d.last.at) : 'Premier passage en cours';
    var lastEl = document.getElementById('crm-v-last'); if (lastEl) lastEl.textContent = d.running ? 'Recherche en cours…' : last;
    var accs = (d.accounts || []).filter(function (a) {
      if (S.vMine && String(a.owner_user_id) !== meId) return false;
      if (S.vFilter === 'hot') return a.hot;
      if (S.vFilter === 'client') return a.hits.some(function (h) { return !VK_HOT[h.kind]; });
      return true;
    });
    var html = accs.length ? accs.map(function (a) {
      var hits = S.vFilter === 'hot' ? a.hits.filter(function (h) { return VK_HOT[h.kind]; }) : S.vFilter === 'client' ? a.hits.filter(function (h) { return !VK_HOT[h.kind]; }) : a.hits;
      return '<div class="crm-card crm-vacc"><div class="crm-vacc-head"><button type="button" class="crm-link strong" data-acc="' + esc(a.id) + '">' + esc(a.nom) + '</button>'
        + heatBadge(a.score, a.heat) + (a.client_of ? '<span class="crm-buy">Client ' + esc(a.client_of) + '</span>' : '')
        + '<span class="crm-meta">' + esc([a.pays, a.owner_name || 'Sans commercial'].filter(Boolean).join(' · ')) + '</span></div>'
        + hits.slice(0, 4).map(function (h) { return veilleHit(h, false); }).join('')
        + (hits.length > 4 ? '<div class="crm-meta">+ ' + (hits.length - 4) + ' autre' + (hits.length > 5 ? 's' : '') + ' dans la fiche</div>' : '') + '</div>';
    }).join('') : '<div class="crm-empty">' + (d.last ? 'Aucun compte pour ce filtre.' : 'La première recherche tourne (quelques minutes). Revenez plus tard.') + '</div>';
    var un = (d.unlinked || []);
    if (un.length && !S.vMine) html += '<div class="crm-card"><h3>Organisations à rattacher <span class="crm-meta">' + un.length + '</span></h3>'
      + '<div class="crm-meta" style="margin-bottom:6px">Nom ambigu ou hors secteurs cibles : reliez-les à un compte, ou ignorez-les.</div>'
      + un.slice(0, 40).map(function (h) { return veilleHit(h, true).replace('<span class="r">', '<span class="r"><button type="button" class="crm-link" data-vlink="' + h.id + '">Relier</button> '); }).join('') + '</div>';
    body.innerHTML = html;
    body.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
    body.querySelectorAll('[data-ign]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-ign');
        api('/crm/veille/' + id + '/action', { method: 'POST', body: { action: 'ignore' } }).then(function () {
          var row = b.closest('.crm-vh'); if (row) row.remove(); toast('Signal ignoré');
        }).catch(function (e) { toast('Erreur : ' + e.message); });
      };
    });
    body.querySelectorAll('[data-vlink]').forEach(function (b) {
      b.onclick = function () {
        var row = b.closest('.crm-vh'), host = document.createElement('div'); host.style.width = '100%'; row.appendChild(host);
        acctPicker(host, { focus: true, placeholder: 'Relier à quel compte ?', onPick: function (acc) {
          api('/crm/veille/' + b.getAttribute('data-vlink') + '/action', { method: 'POST', body: { action: 'link', end_user_id: acc.id } })
            .then(function () { toast('Relié à ' + acc.nom); onVeillePanel(); }).catch(function (e) { toast('Erreur : ' + e.message); });
        } });
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PROSPECTION : prochaine action, comptes chauds, comptes à ouvrir, VIP
  // ═════════════════════════════════════════════════════════════════════════
  // ═════════════════════════════════════════════════════════════════════════
  // STATISTIQUES : activité de l'équipe, conversion, portefeuille
  // ═════════════════════════════════════════════════════════════════════════
  function onStatsPanel() {
    var p = document.getElementById('panel-stats'); if (!p) return;
    S.statsDays = S.statsDays || 30;
    var chips = [[7, '7 jours'], [30, '30 jours'], [90, '90 jours'], [365, '12 mois']].map(function (x) {
      return '<button type="button" class="crm-chip' + (S.statsDays === x[0] ? ' on' : '') + '" data-sd="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
    p.innerHTML = '<div class="crm-wrap crm-home"><div class="crm-row crm-home-head"><div><h2 class="crm-h2">Statistiques</h2><div class="crm-meta">Activité de l’équipe et conversion</div></div>'
      + '<div class="crm-views" style="margin:0">' + chips + '</div></div><div id="crm-stats-body"><div class="crm-empty">Chargement…</div></div></div>';
    p.querySelectorAll('[data-sd]').forEach(function (b) { b.onclick = function () { S.statsDays = parseInt(b.getAttribute('data-sd'), 10); onStatsPanel(); }; });
    api('/crm/stats?days=' + S.statsDays).then(drawStats).catch(function (e) { document.getElementById('crm-stats-body').innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }
  function drawStats(d) {
    var body = document.getElementById('crm-stats-body'); if (!body) return;
    var t = d.total || {}, A = d.accounts || {};
    var me = (S.facets && S.facets.me && S.facets.me.name) || (window.scoutSession && window.scoutSession.first_name) || '';
    var kpi = function (v, l, sub) { return '<div class="crm-kpi" style="cursor:default"><b>' + esc(v) + '</b><span>' + esc(l) + '</span>' + (sub ? '<small class="crm-meta">' + esc(sub) + '</small>' : '') + '</div>'; };
    var html = '<div class="crm-kpis">'
      + kpi(t.reached || 0, 'contacts touchés')
      + kpi(t.first_emails || 0, 'premiers emails')
      + kpi(t.relances || 0, 'relances')
      + kpi(t.positive || 0, 'réponses positives')
      + kpi(t.transmitted || 0, 'saisis dans Dynamics')
      + kpi((t.calls_meetings || 0) + (t.notes || 0), 'appels, RDV et notes')
      + '</div>';
    // Graphique 12 semaines (barres : emails ; points : réponses positives)
    // 12 semaines complètes, y compris celles sans activité
    var W = (function () {
      var byW = {}; (d.weeks || []).forEach(function (w) { byW[w.week] = w; });
      var now = new Date(); var day = (now.getDay() + 6) % 7; var mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      var out = [];
      for (var i = 11; i >= 0; i--) {
        var dt = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() - 7 * i);
        var k = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
        out.push(byW[k] || { week: k, emails: 0, positive: 0, transmitted: 0 });
      }
      return out;
    })();
    var maxE = Math.max(1, Math.max.apply(null, W.map(function (w) { return w.emails; }).concat([1])));
    var bw = 100 / Math.max(W.length, 1);
    var bars = W.map(function (w, i) {
      var h = Math.round(125 * w.emails / maxE), x = i * bw;
      var lab = new Date(w.week + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      return '<g><title>Semaine du ' + esc(lab) + ' : ' + w.emails + ' emails, ' + w.positive + ' réponses positives, ' + w.transmitted + ' saisis dans Dynamics</title>'
        + '<rect x="' + (x + bw * 0.18) + '%" y="' + (165 - h) + '" width="' + (bw * 0.64) + '%" height="' + Math.max(h, 1) + '" rx="3" fill="var(--accent)" opacity=".75"></rect>'
        + (w.positive ? '<text x="' + (x + bw / 2) + '%" y="' + (158 - h) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#6A8B74">+' + w.positive + '</text>' : '')
        + '<text x="' + (x + bw / 2) + '%" y="183" text-anchor="middle" font-size="10" fill="var(--text3)">' + esc(lab) + '</text></g>';
    }).join('');
    html += '<div class="crm-home-cols"><div class="crm-home-main">'
      + '<div class="crm-card"><h3>Emails envoyés par semaine <span class="crm-meta">12 dernières semaines, équipe · en vert : réponses positives</span></h3>'
      + (W.some(function (w) { return w.emails; }) ? '<svg width="100%" height="190" role="img" aria-label="Emails par semaine">' + bars + '</svg>' : '<div class="crm-meta">Aucune activité sur la période.</div>') + '</div>';
    // Tableau par commercial
    var P = d.people || [];
    var cols = [['reached', 'Contacts touchés'], ['first_emails', '1ers emails'], ['relances', 'Relances'], ['calls_meetings', 'Appels / RDV'], ['linkedin', 'LinkedIn'], ['positive', 'Réponses +'], ['transmitted', 'Dans Dynamics'], ['tasks_done', 'Tâches faites'], ['notes', 'Notes']];
    html += '<div class="crm-card"><h3>Par commercial <span class="crm-meta">' + esc(d.days === 365 ? '12 mois' : d.days + ' jours') + '</span></h3>'
      + (P.length ? '<div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Commercial</th>' + cols.map(function (c) { return '<th style="text-align:right">' + esc(c[1]) + '</th>'; }).join('') + '</tr></thead><tbody>'
        + P.map(function (r) {
          var mine = me && String(r.name).toLowerCase() === String(me).toLowerCase();
          return '<tr' + (mine ? ' class="sel"' : '') + '><td><b>' + esc(r.name) + '</b></td>' + cols.map(function (c) { return '<td style="text-align:right;font-variant-numeric:tabular-nums">' + (r[c[0]] || '<span class="crm-meta">0</span>') + '</td>'; }).join('')
            + '</tr>';
        }).join('') + '</tbody></table></div>' : '<div class="crm-meta">Aucune action enregistrée sur la période.</div>')
      + '</div></div><aside class="crm-home-side">';
    // Portefeuille
    var bar = function (v, tot, label, filters) {
      var w = tot ? Math.round(100 * v / tot) : 0;
      return '<button type="button" class="crm-mini" style="display:block;width:100%" data-kf=\'' + esc(JSON.stringify(filters)) + '\'><span class="m"><b>' + v + '</b> <span>' + esc(label) + ' · ' + w + ' %</span></span>'
        + '<span style="display:block;height:6px;border-radius:3px;background:var(--bg3);margin-top:6px"><span style="display:block;height:6px;width:' + w + '%;border-radius:3px;background:var(--accent)"></span></span></button>';
    };
    html += '<div class="crm-card"><h3>Portefeuille <span class="crm-meta">' + (A.total || 0) + ' comptes</span></h3>'
      + bar(A.owned || 0, A.total, 'avec un propriétaire', {}) + bar(A.tiered || 0, A.total, 'avec un tier', { tier: '1,2,3' })
      + bar(A.engaged || 0, A.total, 'engagés (90 j)', { heat: 'chaud,tiede' }) + bar(A.transmis || 0, A.total, 'dans Dynamics', { status: 'transmis' })
      + '</div>'
      + '<div class="crm-card"><h3>Lecture</h3><div class="crm-meta" style="line-height:1.6">« Contacts touchés » compte les personnes contactées par email, LinkedIn, appel ou RDV. Les réponses positives de la période peuvent venir d’emails envoyés plus tôt.</div></div>'
      + '</aside></div>';
    var isAdmin = (S.facets && S.facets.me && S.facets.me.role === 'admin') || (window.scoutSession && window.scoutSession.role === 'admin');
    html += '<div class="crm-card" id="crm-sig-stats"><h3>Sources de signaux</h3><div class="crm-meta">Chargement…</div></div>';
    if (isAdmin) html += '<div class="crm-card" id="crm-hygiene"><h3>Qualité des données</h3><div class="crm-meta">Chargement…</div></div>';
    body.innerHTML = html;
    body.querySelectorAll('[data-kf]').forEach(function (b) { b.onclick = function () { openAccountsWith(JSON.parse(b.getAttribute('data-kf'))); }; });
    loadSigStats();
    if (isAdmin) loadHygiene();
  }
  // Bilan par source : ce qui arrive, ce qui mène à une action, ce qui est écarté et pourquoi (pour couper le bruit)
  function loadSigStats() {
    var box = document.getElementById('crm-sig-stats'); if (!box) return;
    var days = Math.max(30, S.statsDays || 30);
    api('/signals/stats?days=' + days).then(function (d) {
      var rows = Object.keys(d.sources || {}).map(function (k) {
        var x = d.sources[k], treated = x.taches + x.ecartes;
        var rate = treated ? Math.round(100 * x.taches / treated) + ' %' : '–';
        var reasons = Object.keys(x.raisons || {}).sort(function (a, b) { return x.raisons[b] - x.raisons[a]; }).slice(0, 3).map(function (r) { return esc(r) + ' (' + x.raisons[r] + ')'; }).join(', ');
        return '<tr><td><b>' + esc(x.label) + '</b></td><td>' + x.recus + '</td><td>' + x.avec_compte + '</td><td>' + x.taches + '</td><td>' + x.ecartes + '</td><td>' + rate + '</td><td class="crm-meta">' + (reasons || '–') + '</td></tr>';
      }).join('');
      box.innerHTML = '<h3>Sources de signaux <span class="crm-meta">' + d.days + ' derniers jours · ' + (d.comptes_crees || 0) + ' compte' + (d.comptes_crees > 1 ? 's' : '') + ' créé' + (d.comptes_crees > 1 ? 's' : '') + ' depuis un signal</span></h3>'
        + '<div style="overflow-x:auto"><table class="crm-table crm-sigstats"><thead><tr><th>Source</th><th>Reçus</th><th>Avec compte</th><th>Tâches</th><th>Écartés</th><th>Taux d’action</th><th>Raisons d’écart</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        + '<div class="crm-meta" style="margin-top:8px">Taux d’action : tâches créées sur signaux traités. Une source souvent écartée pour la même raison est à resserrer.</div>';
    }).catch(function (e) { box.innerHTML = '<h3>Sources de signaux</h3><div class="crm-meta">Indisponible : ' + esc(e.message) + '</div>'; });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // AUJOURD'HUI : un seul écran, une seule file classée par importance et urgence.
  // Réunit l'ancienne « Ma journée », « À faire » et « Prospection » (actions proposées
  // par la veille, comptes chauds, comptes à ouvrir, VIP).
  // ═════════════════════════════════════════════════════════════════════════
  var QF = [['all', 'Tout'], ['urgent', 'Urgent'], ['relance', 'Relances'], ['reply', 'Réponses et réactions'], ['task', 'Tâches'], ['prosp', 'Prospection']];
  function qMatch(x, f) {
    if (f === 'all') return true;
    if (f === 'urgent') return x.kind === 'reaction' || x.kind === 'reply' || (!PROSP_KINDS[x.kind] && x.due && x.due < todayStr());
    if (f === 'reply') return x.kind === 'reply' || x.kind === 'reaction';
    if (f === 'prosp') return !!PROSP_KINDS[x.kind];
    return x.kind === f;
  }
  function onHomePanel() {
    var p = document.getElementById('panel-home'); if (!p) return;
    S.homeScope = S.homeScope || 'me'; S.qFilter = S.qFilter || 'all'; S.taskState = S.taskState || 'open';
    var me = (window.scoutSession && window.scoutSession.first_name) || '';
    var dateTxt = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    dateTxt = dateTxt.charAt(0).toUpperCase() + dateTxt.slice(1);
    p.innerHTML = '<div class="crm-wrap crm-home" id="crm-tasks"><div class="crm-row crm-home-head">'
      + '<div><h2 class="crm-h2" id="crm-home-title">Bonjour' + (me ? ' ' + esc(me) : '') + '</h2><div class="crm-meta">' + esc(dateTxt) + '</div></div>'
      + '<div class="crm-views" style="margin:0"><button type="button" class="crm-chip" data-hs="me">Moi</button><button type="button" class="crm-chip" data-hs="team">Équipe</button></div></div>'
      + '<div id="crm-home-ao"></div><div id="crm-home-digest"></div><div id="crm-home-hero"></div>'
      + '<div class="crm-home-cols"><div class="crm-home-main">'
      + '<div class="crm-row crm-qbar"><div class="crm-views" style="margin:0" role="tablist">' + QF.map(function (x) { return '<button type="button" class="crm-chip sm" data-qf="' + x[0] + '">' + x[1] + '<span class="n" data-qn="' + x[0] + '"></span></button>'; }).join('') + '</div>'
      + '<button type="button" class="crm-btn sm" id="crm-nt-open">+ Nouvelle tâche</button></div>'
      + '<div class="crm-newtask" id="crm-nt-row" hidden><input class="crm-input" id="crm-nt-title" maxlength="300" placeholder="Nouvelle tâche, ex. Préparer la démo pour le SDIS 69" aria-label="Nouvelle tâche">'
      + '<input class="crm-input" type="date" id="crm-nt-due" aria-label="Échéance (facultative)" title="Facultatif : la file se classe par importance">'
      + '<select class="crm-input" id="crm-nt-owner" aria-label="Attribuer à"></select>'
      + '<button class="crm-btn primary" type="button" id="crm-nt-save">Ajouter</button></div>'
      + '<div id="crm-tasks-list"><div class="crm-empty">Chargement…</div></div>'
      + '<div class="crm-meta crm-q-foot"><button type="button" class="crm-link" id="crm-q-done"></button></div>'
      + '</div><aside class="crm-home-side" id="crm-home-side"></aside></div></div>';
    p.querySelectorAll('[data-hs]').forEach(function (b) { b.onclick = function () { S.homeScope = b.getAttribute('data-hs'); S.taskState = 'open'; loadHome(); }; });
    p.querySelectorAll('[data-qf]').forEach(function (b) { b.onclick = function () { S.qFilter = b.getAttribute('data-qf'); S.taskState = 'open'; drawQueue(); }; });
    document.getElementById('crm-q-done').onclick = function () { S.taskState = S.taskState === 'done' ? 'open' : 'done'; S.taskState === 'done' ? drawDone() : drawQueue(); };
    document.getElementById('crm-nt-open').onclick = function () { var r = document.getElementById('crm-nt-row'); r.hidden = !r.hidden; if (!r.hidden) document.getElementById('crm-nt-title').focus(); };
    var save = document.getElementById('crm-nt-save');
    save.onclick = function () {
      var t = document.getElementById('crm-nt-title').value.trim(); if (!t) { document.getElementById('crm-nt-title').focus(); return; }
      save.disabled = true;
      api('/crm/tasks', { method: 'POST', body: { title: t, due_date: document.getElementById('crm-nt-due').value || null, owner_user_id: document.getElementById('crm-nt-owner').value || null } })
        .then(function () { document.getElementById('crm-nt-title').value = ''; save.disabled = false; toast('Tâche créée'); loadHome(); })
        .catch(function (e) { save.disabled = false; toast('Erreur : ' + e.message); });
    };
    document.getElementById('crm-nt-title').onkeydown = function (e) { if (e.key === 'Enter') save.click(); };
    loadFacets().then(function (F) {
      var sel = document.getElementById('crm-nt-owner');
      if (sel && !sel.options.length) sel.innerHTML = F.users.map(function (u) { return opt(u.id, u.name, F.me.user_id); }).join('');
      var ht = document.getElementById('crm-home-title'); if (ht && F.me && F.me.name) ht.textContent = 'Bonjour ' + F.me.name;
    }).catch(function () {});
    loadHome();
  }
  // compatibilité : l'ancien onglet « À faire » et la file d'équipe pointent ici
  function onTasksPanel() { go('home'); }
  function loadTasks() { loadHome(); }

  function loadHome() {
    var p = document.getElementById('panel-home'); if (!p || !document.getElementById('crm-tasks-list')) return;
    var team = S.homeScope === 'team';
    S.taskScope = S.homeScope; S.inTasksPanel = true;
    p.querySelectorAll('[data-hs]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-hs') === S.homeScope); });
    var seq = (S.homeSeq = (S.homeSeq || 0) + 1);
    Promise.all([
      loadQueue(S.homeScope, { prospect: true }),
      api('/crm/home?owner=' + (team ? 'team' : 'me')).catch(function () { return {}; }),
      api('/me/stats').catch(function () { return {}; })
    ]).then(function (r) {
      if (seq !== S.homeSeq) return;
      var queue = r[0], d = r[1] || {}, st = r[2] || {};
      S.queueItems = queue;
      if (!team) updateBadge(queue.filter(function (x) { return !PROSP_KINDS[x.kind]; }));
      drawHero(queue, st);
      drawSide(d, st, team);
      loadDigest();
      loadAo();
      if (S.taskState === 'done') drawDone(); else drawQueue();
    }).catch(function (e) { var l = document.getElementById('crm-tasks-list'); if (l) l.innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }
  // Résumé de la semaine en signaux : affiché à la première ouverture de la semaine, jusqu'à ce qu'on le ferme
  function isoWeek() { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); var w1 = new Date(d.getFullYear(), 0, 4); return d.getFullYear() + '-' + Math.round(((d - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7 + 1); }
  function loadDigest() {
    var host = document.getElementById('crm-home-digest'); if (!host) return;
    if (lsGet('scout_digest_week', '') === isoWeek()) { host.innerHTML = ''; return; }
    var meId = S.facets && S.facets.me && String(S.facets.me.user_id);
    api('/signals/feed?days=7&scope=all').then(function (d) {
      var items = d.items || [];
      var mine = function (it) { return it.account && String(it.account.owner_user_id) === meId; };
      var pts = [];
      var v = items.filter(function (it) { return it.type === 'visit' && mine(it); }).sort(function (a, b) { return b.imp - a.imp; });
      if (v.length) pts.push('<b>' + (v.length > 1 ? v.length + ' de tes comptes</b> sont venus' : '1 de tes comptes</b> est venu') + ' sur le site : ' + v.slice(0, 3).map(function (x) { return esc(x.account.nom) + ' (' + esc((x.why || '').split(' · ')[0]) + ')'; }).join(', ') + '.');
      var c = items.filter(function (it) { return it.type === 'chat' && mine(it); });
      if (c.length) pts.push('<b>' + c.length + ' chat' + (c.length > 1 ? 's' : '') + '</b> sur tes comptes : ' + c.slice(0, 2).map(function (x) { return esc(x.title); }).join(', ') + '.');
      var m = items.filter(function (it) { return it.type === 'market' && mine(it); });
      if (m.length) pts.push('<b>' + m.length + ' marché' + (m.length > 1 ? 's' : '') + '</b> sur tes comptes, dont ' + esc(m[0].title.slice(0, 80)) + '.');
      var comp = items.filter(function (it) { return it.type === 'market' && it.competitor; });
      if (comp.length) pts.push('Concurrents : ' + comp.slice(0, 3).map(function (x) { return '<b>' + esc(x.competitor) + '</b> chez ' + esc(x.buyer || x.pays || '?'); }).join(', ') + (comp.length > 3 ? ' et ' + (comp.length - 3) + ' autres' : '') + '.');
      var un = items.filter(function (it) { return it.type === 'visit' && !it.account; }).length;
      if (un) pts.push('<b>' + un + ' organisme' + (un > 1 ? 's' : '') + ' public' + (un > 1 ? 's' : '') + '</b> venus sur le site n’ont pas encore de compte : <button type="button" class="crm-link" data-dg-go>à voir dans Signaux</button>.');
      if (!pts.length) { host.innerHTML = ''; return; }
      host.innerHTML = '<div class="crm-card crm-digest"><h3>Ta semaine en signaux <span class="crm-meta">7 derniers jours</span><button type="button" class="crm-link" data-dg-close>Fermer pour la semaine</button></h3><ul>' + pts.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul></div>';
      host.querySelector('[data-dg-close]').onclick = function () { lsSet('scout_digest_week', isoWeek()); host.innerHTML = ''; };
      var g = host.querySelector('[data-dg-go]'); if (g) g.onclick = function () { S.feedScope = 'unlinked'; go('feed'); };
    }).catch(function () { host.innerHTML = ''; });
  }

  // ── AO drone filaire ouverts : en tête d'Aujourd'hui pour toute l'équipe, pastille et alerte à l'arrivée ──
  function aoHidden() { return lsGet('scout_ao_hidden', []) || []; }
  function loadAo() {
    if (typeof window.getAuthHeaders !== 'function' || !window.getAuthHeaders().Authorization) return Promise.resolve();
    return api('/signals/tethered-open').then(function (d) {
      var items = d.items || [];
      S.ao = items; S.aoChannel = !!d.alert_channel;
      var hid = aoHidden();
      S.aoCount = items.filter(function (t) { return !t.decision && hid.indexOf(t.id) < 0; }).length;
      paintBadge(); drawAo(); notifyAo(items);
    }).catch(function () {});
  }
  function notifyAo(items) {
    var seen = lsGet('scout_ao_seen', null);
    var ids = items.map(function (t) { return t.id; });
    if (!seen) { lsSet('scout_ao_seen', ids); return; } // première ouverture : le bandeau suffit
    var fresh = items.filter(function (t) { return seen.indexOf(t.id) < 0 && !t.decision; });
    if (!fresh.length) return;
    lsSet('scout_ao_seen', seen.concat(fresh.map(function (t) { return t.id; })).slice(-300));
    var t0 = fresh[0];
    var msg = (fresh.length > 1 ? fresh.length + ' nouveaux AO drone filaire ouverts' : 'Nouvel AO drone filaire : ' + (t0.acheteur || t0.pays || '')) + ', en tête d’Aujourd’hui';
    toast(msg);
    try {
      if (window.Notification && Notification.permission === 'granted') {
        var n = new Notification('Scout · AO drone filaire', { body: fresh.map(function (t) { return (t.acheteur || '?') + (t.cloture ? ' · clôture ' + fmtDate(t.cloture) : ''); }).join('\n'), tag: 'scout-ao' });
        n.onclick = function () { window.focus(); go('home'); n.close(); };
      }
    } catch (e) {}
  }
  function aoWhen(t) {
    if (t.days_left == null) return 'Clôture non précisée';
    if (t.days_left <= 0) return 'Clôture aujourd’hui';
    return 'Clôture dans ' + t.days_left + ' j · ' + fmtDate(t.cloture);
  }
  function drawAo() {
    var host = document.getElementById('crm-home-ao'); if (!host) return;
    var hid = aoHidden();
    var items = (S.ao || []).filter(function (t) { return hid.indexOf(t.id) < 0; });
    if (!items.length) { host.innerHTML = ''; return; }
    var askNotif = window.Notification && Notification.permission === 'default';
    host.innerHTML = '<section class="crm-card crm-ao" aria-label="Appels d’offres drone filaire ouverts"><h3><span class="crm-ao-dot"></span>'
      + (items.length > 1 ? items.length + ' appels d’offres drone filaire ouverts' : 'Appel d’offres drone filaire ouvert')
      + (askNotif ? '<button type="button" class="crm-link" data-ao-notif>Être alerté sur cet appareil</button>' : '') + '</h3>'
      + items.map(function (t) {
        var acc = (t.accounts || [])[0];
        var urgent = t.days_left != null && t.days_left <= 14;
        var dec = t.decision === 'go' || t.decision === 'accept' ? '<span class="crm-ao-tag go">Go, tâche créée</span>' : '';
        return '<div class="crm-ao-row" data-ao="' + esc(t.id) + '"><div class="crm-ao-main">'
          + '<div class="crm-ao-t">' + esc(t.titre) + '</div>'
          + '<div class="crm-meta">' + esc([t.acheteur, t.pays].filter(Boolean).join(' · ')) + (t.source_name ? ' · ' + esc(t.source_name) : '') + '</div>'
          + '<div class="crm-meta">' + (acc ? 'Compte <button type="button" class="crm-link" data-acc="' + esc(acc.id) + '">' + esc(acc.nom) + '</button> · ' + esc(acc.owner_name || 'sans commercial') : 'Pas encore de compte : à relier dans Signaux') + '</div></div>'
          + '<div class="crm-ao-side"><span class="crm-ao-when' + (urgent ? ' urgent' : '') + '">' + esc(aoWhen(t)) + '</span>' + dec
          + '<div class="crm-ao-act">' + (t.url ? '<a class="crm-btn sm" href="' + esc(t.url) + '" target="_blank" rel="noopener">Voir l’avis</a>' : '')
          + (dec ? '' : '<button type="button" class="crm-btn sm primary" data-ao-go>Go</button><button type="button" class="crm-btn sm" data-ao-nogo>No-go</button>')
          + '<button type="button" class="crm-link" data-ao-hide title="Masquer pour moi">Masquer</button></div></div></div>';
      }).join('') + '</section>';
    host.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
    var nb = host.querySelector('[data-ao-notif]');
    if (nb) nb.onclick = function () { Notification.requestPermission().then(function (p) { toast(p === 'granted' ? 'Alertes activées sur cet appareil' : 'Alertes refusées par le navigateur'); drawAo(); }); };
    host.querySelectorAll('.crm-ao-row').forEach(function (row) {
      var id = row.getAttribute('data-ao');
      var send = function (body, msg) {
        row.style.opacity = '.5';
        api('/crm/signals/tender/' + encodeURIComponent(id) + '/action', { method: 'POST', body: body })
          .then(function () { toast(msg); loadAo(); if (document.getElementById('crm-tasks-list')) loadHome(); })
          .catch(function (e) { row.style.opacity = ''; toast('Erreur : ' + e.message); });
      };
      var g = row.querySelector('[data-ao-go]'); if (g) g.onclick = function () { send({ action: 'go' }, 'Go : tâche créée pour le commercial du compte'); };
      var ng = row.querySelector('[data-ao-nogo]');
      if (ng) ng.onclick = function () {
        if (!ng.classList.contains('confirm')) { ng.classList.add('confirm'); ng.textContent = 'Confirmer le no-go'; return; }
        send({ action: 'nogo', reason: 'décidé depuis Aujourd’hui' }, 'No-go noté');
      };
      row.querySelector('[data-ao-hide]').onclick = function () { lsSet('scout_ao_hidden', aoHidden().concat([id]).slice(-300)); loadAo(); };
    });
  }
  function drawHero(queue, st) {
    var box = document.getElementById('crm-home-hero'); if (!box) return;
    var now = queue.filter(function (x) { return !x.later; });
    var urgent = now.filter(function (x) { return qMatch(x, 'urgent'); }).length;
    var nReply = queue.filter(function (x) { return x.kind === 'reply'; }).length;
    var nProsp = queue.filter(function (x) { return PROSP_KINDS[x.kind]; }).length;
    box.innerHTML = '<div class="crm-hero">'
      + '<button type="button" class="crm-hero-card main" id="crm-hero-next" title="Scout choisit le meilleur contact à travailler dans tes segments : décideur vérifié, compte prioritaire, jamais contacté. Tu écris, Scout note et planifie la relance."><span class="ic">' + ICON.send + '</span><span><b>Prochaine action</b><small>Écrire au prochain contact suggéré</small></span><span class="go">→</span></button>'
      + '<button type="button" class="crm-hero-card" data-hq="urgent"><b class="' + (urgent ? 'crm-late' : '') + '">' + (now.length - nProsp) + '</b><span>à traiter' + (urgent ? '<small class="crm-late">dont ' + urgent + ' urgent' + (urgent > 1 ? 's' : '') + '</small>' : '') + '</span></button>'
      + '<button type="button" class="crm-hero-card" data-hq="reply"><b' + (nReply ? ' class="crm-today"' : '') + '>' + nReply + '</b><span>réponse' + (nReply > 1 ? 's' : '') + ' positive' + (nReply > 1 ? 's' : '') + ' à saisir dans Dynamics</span></button>'
      + '<button type="button" class="crm-hero-card" data-hq="prosp"><b>' + nProsp + '</b><span>piste' + (nProsp > 1 ? 's' : '') + ' de prospection<small>signaux marché, comptes chauds, VIP</small></span></button>'
      + '</div>';
    document.getElementById('crm-hero-next').onclick = function () { if (window.scoutAction && window.scoutAction.open) window.scoutAction.open(); };
    box.querySelectorAll('[data-hq]').forEach(function (b) { b.onclick = function () { S.qFilter = b.getAttribute('data-hq'); S.taskState = 'open'; drawQueue(); var l = document.getElementById('crm-tasks-list'); if (l) l.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
  }
  function drawQueue() {
    var p = document.getElementById('panel-home'), list = document.getElementById('crm-tasks-list'); if (!p || !list) return;
    var items = S.queueItems || [], team = S.homeScope === 'team';
    var counts = {}; QF.forEach(function (f) { counts[f[0]] = items.filter(function (x) { return !x.later && qMatch(x, f[0]); }).length; });
    p.querySelectorAll('[data-qn]').forEach(function (n) { var c = counts[n.getAttribute('data-qn')]; n.textContent = c ? ' ' + c : ''; });
    p.querySelectorAll('[data-qf]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-qf') === S.qFilter); });
    var done = document.getElementById('crm-q-done'); if (done) done.textContent = 'Tâches terminées (30 j)';
    var shown = items.filter(function (x) { return qMatch(x, S.qFilter); });
    var now = shown.filter(function (x) { return !x.later; }), later = shown.filter(function (x) { return x.later; });
    var html = now.length ? '<div class="crm-card crm-qcard">' + now.map(function (x) { return queueItemHtml(x, { showWho: team }); }).join('') + '</div>'
      : '<div class="crm-empty">' + (S.qFilter === 'all' ? 'Rien à traiter. Lance « Prochaine action » pour ouvrir un nouveau compte.' : 'Rien dans ce filtre.') + '</div>';
    if (later.length) html += '<details class="crm-later"><summary>Pas encore dues · ' + later.length + '</summary><div class="crm-card crm-qcard">'
      + later.map(function (x) { return queueItemHtml(x, { showWho: team }); }).join('') + '</div></details>';
    list.innerHTML = html;
    bindQueue(list, loadHome);
    bindSigCards(list, loadHome);
  }
  function drawDone() {
    var list = document.getElementById('crm-tasks-list'); if (!list) return;
    var done = document.getElementById('crm-q-done'); if (done) done.textContent = '← Revenir à la file';
    document.querySelectorAll('#panel-home [data-qf]').forEach(function (b) { b.classList.remove('on'); });
    list.innerHTML = '<div class="crm-empty">Chargement…</div>';
    api('/crm/tasks?scope=' + S.homeScope + '&state=done').then(function (d) {
      var tasks = d.tasks || [];
      list.innerHTML = tasks.length ? '<div class="crm-card">' + tasks.map(taskHtml).join('') + '</div>' : '<div class="crm-empty">Aucune tâche terminée ces 30 derniers jours.</div>';
      bindTasks(list, drawDone);
    }).catch(function (e) { list.innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }
  function drawSide(d, st, team) {
    var box = document.getElementById('crm-home-side'); if (!box) return;
    var k = d.kpi || {}, ownerF = team ? {} : { owner: 'me' }, html = '';
    if (!team && k.n === 0) html += '<div class="crm-card crm-callout"><b>Aucun compte ne t’est encore attribué.</b> Ouvre <button type="button" class="crm-link" data-kf=\'{"owner":"none","contacts":"with"}\'>les comptes sans propriétaire</button> et attribue-toi ceux de ta zone.</div>';
    if (st && st.ok) html += '<div class="crm-card"><h3>' + (team ? 'Semaine de l’équipe' : 'Ma semaine') + '</h3><div class="crm-week">'
      + '<div><b>' + (st.emails_7d || 0) + '</b><span>emails envoyés</span></div><div><b>' + (st.relances_7d || 0) + '</b><span>relances</span></div>'
      + '<div><b>' + (st.actions_7d || 0) + '</b><span>actions</span></div><div><b>' + (st.interested || 0) + '</b><span>intéressés</span></div></div></div>';
    var tile = function (val, label, filters, cls) { return '<button type="button" class="crm-kpi ' + (cls || '') + '" data-kf=\'' + esc(JSON.stringify(Object.assign({}, ownerF, filters))) + '\'><b>' + esc(val) + '</b><span>' + esc(label) + '</span></button>'; };
    html += '<div class="crm-card"><h3>' + (team ? 'Portefeuille de l’équipe' : 'Mon portefeuille') + '</h3><div class="crm-kpis two">'
      + tile(k.n || 0, 'Comptes', {}) + tile((k.t1 || 0) + ' · ' + (k.t2 || 0) + ' · ' + (k.t3 || 0), 'Tier 1 · 2 · 3', { tier: '1,2,3' })
      + tile(k.stale || 0, 'T1–2 sans activité 30 j', { tier: '1,2', activity: 'stale30' }, k.stale ? 'warn' : '')
      + tile(k.gaps || 0, 'Comités incomplets', { tier: '1,2', coverage: 'incomplete' }, k.gaps ? 'warn' : '') + '</div></div>';
    if ((d.web || []).length) html += '<div class="crm-card"><h3>Visites sur elistair.com</h3>' + d.web.slice(0, 5).map(function (a) {
      return '<button type="button" class="crm-mini" data-acc="' + esc(a.id) + '">' + tierBadge(a.tier) + '<span class="m"><b>' + esc(a.nom) + '</b><span>' + esc(a.web_pages_90d + ' page' + (a.web_pages_90d > 1 ? 's' : '') + (a.last_visit ? ' · ' + relTime(a.last_visit) : '')) + '</span></span></button>';
    }).join('') + '</div>';
    box.innerHTML = html;
    box.querySelectorAll('[data-kf]').forEach(function (b) { b.onclick = function () { openAccountsWith(JSON.parse(b.getAttribute('data-kf'))); }; });
    box.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
  }

  function openAccountsWith(filters) {
    S.filters = filters || {}; S.view = matchView();
    lsSet('scout_crm_filters', S.filters); lsSet('scout_crm_view', S.view);
    go('accounts');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // LISTE DES COMPTES
  // ═════════════════════════════════════════════════════════════════════════
  function panelAccounts() { return document.getElementById('panel-accounts'); }

  function renderAccountsShell() {
    var p = panelAccounts(); if (!p) return;
    // Une seule barre (recherche, vues rapides, menu Vues, Filtres, affichage, export), filtres repliés dessous.
    p.innerHTML = '<div class="crm-wrap" id="crm-list">'
      + '<div class="crm-bar"><div class="crm-toolbar" id="crm-toolbar"></div>'
      + '<div class="crm-views" id="crm-views" role="tablist" aria-label="Vues"></div>'
      + '<span class="crm-bar-r"><span class="crm-meta" id="crm-count" aria-live="polite"></span>'
      + '<span class="crm-seg" role="group" aria-label="Affichage"><button type="button" class="crm-chip sm' + (S.treeView ? '' : ' on') + '" id="crm-v-list">Liste</button><button type="button" class="crm-chip sm' + (S.treeView ? ' on' : '') + '" id="crm-v-tree">Arbre</button></span>'
      + '<span class="crm-menu" id="crm-cols"></span>'
      + (isAdminNow() ? '<button class="crm-btn ghost sm" id="crm-export" type="button" title="Exporter la liste en CSV">Exporter</button>' : '') + '</span></div>'
      + '<div class="crm-fpanel" id="crm-fpanel"></div>'
      + '<div id="crm-tier-banner"></div>'
      + '<div class="crm-table-wrap" id="crm-table-wrap"' + (S.treeView ? ' hidden' : '') + '><table class="crm-table" id="crm-table"><thead></thead><tbody></tbody></table>'
      + '<div class="crm-more" id="crm-more" style="display:none"><button class="crm-btn" type="button" id="crm-more-btn">Afficher plus</button></div></div>'
      + '<div class="crm-card crm-tree" id="crm-tree"' + (S.treeView ? '' : ' hidden') + '></div>'
      + '<div id="crm-bulk"></div>'
      + '</div><div class="crm-wrap crm-record" id="crm-detail" style="display:none"></div>';
    colsMenu(document.getElementById('crm-cols'), '#crm-table', 'scout_cols_acc', COLS.filter(function (c) { return c.k !== 'nom'; }).map(function (c) { return [c.k, c.label]; }));
    var exb = document.getElementById('crm-export'); if (exb) exb.onclick = function () { exportCsv(); };
    document.getElementById('crm-more-btn').onclick = function () { fetchAccounts(true); };
    var setView = function (tree) {
      S.treeView = tree; lsSet('scout_crm_tree', tree ? 1 : 0);
      document.getElementById('crm-v-list').classList.toggle('on', !tree); document.getElementById('crm-v-tree').classList.toggle('on', tree);
      document.getElementById('crm-table-wrap').hidden = tree; document.getElementById('crm-tree').hidden = !tree;
      if (tree) drawTree();
    };
    document.getElementById('crm-v-list').onclick = function () { setView(false); };
    document.getElementById('crm-v-tree').onclick = function () { setView(true); };
    if (S.treeView) setTimeout(drawTree, 0);
    loadTierBanner();
  }

  // ── Tiers proposés : Scout propose un tier pour les comptes sans tier, le commercial valide ──
  function loadTierBanner(force) {
    var el = document.getElementById('crm-tier-banner'); if (!el) return;
    var scope = S.tierScope || 'me';
    if (!force && S.tierSug && S.tierSug.scope === scope && Date.now() - S.tierSug.at < 10 * 60 * 1000) return drawTierBanner();
    api('/crm/tiers/suggest?scope=' + scope).then(function (d) {
      // Un admin sans portefeuille propre voit directement les propositions de l'équipe.
      if (!d.total && scope === 'me' && isAdminNow() && !S.tierScope) { S.tierScope = 'all'; return loadTierBanner(true); }
      d.at = Date.now(); S.tierSug = d; drawTierBanner();
    }).catch(function () { el.innerHTML = ''; });
  }
  function drawTierBanner() {
    var el = document.getElementById('crm-tier-banner'), d = S.tierSug; if (!el || !d) return;
    if (!d.total) { el.innerHTML = ''; return; }
    var c = d.counts;
    el.innerHTML = '<div class="crm-tier-banner"><span><b>' + d.total.toLocaleString('fr-FR') + (d.scope === 'all' ? ' comptes de l’équipe' : ' de tes comptes') + ' n’ont pas de tier.</b> Scout propose ' + c[1] + ' en Tier 1, ' + c[2] + ' en Tier 2 et ' + c[3].toLocaleString('fr-FR') + ' en Tier 3.</span>'
      + (isAdminNow() ? '<span class="crm-seg"><button type="button" class="crm-chip sm' + (d.scope === 'me' ? ' on' : '') + '" data-tsc="me">Mes comptes</button><button type="button" class="crm-chip sm' + (d.scope === 'all' ? ' on' : '') + '" data-tsc="all">Équipe</button></span>' : '')
      + '<button type="button" class="crm-btn primary sm" id="crm-tier-open">Voir et valider</button></div>';
    el.querySelectorAll('[data-tsc]').forEach(function (b) { b.onclick = function () { S.tierScope = b.getAttribute('data-tsc'); loadTierBanner(true); }; });
    document.getElementById('crm-tier-open').onclick = openTierReview;
  }
  function openTierReview() {
    var d = S.tierSug; if (!d) return;
    var pop = document.createElement('div'); pop.className = 'crm-pop';
    var team = d.scope === 'all';
    var row = function (x) {
      return '<tr><td><button type="button" class="crm-link" data-tacc="' + esc(x.id) + '">' + esc(x.nom) + '</button><div class="crm-meta">' + esc([x.pays, x.secteur, team ? x.owner_name : ''].filter(Boolean).join(' · ')) + '</div></td>'
        + '<td class="crm-meta">' + esc(x.why || 'peu d’éléments') + '</td>'
        + '<td><select class="crm-sel" data-tid="' + esc(x.id) + '" aria-label="Tier pour ' + esc(x.nom) + '">' + [1, 2, 3].map(function (t) { return '<option value="' + t + '"' + (t === x.suggested ? ' selected' : '') + '>Tier ' + t + '</option>'; }).join('') + '</select></td></tr>';
    };
    var t1 = d.accounts.filter(function (x) { return x.suggested === 1; }), t2 = d.accounts.filter(function (x) { return x.suggested === 2; });
    pop.innerHTML = '<div class="crm-pop-box crm-tier-box" role="dialog" aria-label="Valider les tiers proposés"><h3>Tiers proposés' + (team ? ' pour l’équipe' : '') + '</h3>'
      + '<div class="crm-meta" style="margin-bottom:10px">Classement dans le portefeuille de chaque commercial : au plus ' + d.rule.t1 + ' comptes en Tier 1 et ' + d.rule.t2 + ' en Tier 2, d’après le secteur, l’usage drone, l’engagement, les marchés, les visites du site et le comité couvert. Change ce qui ne te convient pas, puis valide. Les comptes qui ont déjà un tier ne sont pas touchés.</div>'
      + '<div class="crm-tier-scroll"><table class="crm-table"><thead><tr><th>Compte</th><th>Pourquoi</th><th>Tier</th></tr></thead><tbody>'
      + (t1.length ? '<tr class="crm-tier-sep"><td colspan="3">Tier 1 proposé · ' + t1.length + '</td></tr>' + t1.map(row).join('') : '')
      + (t2.length ? '<tr class="crm-tier-sep"><td colspan="3">Tier 2 proposé · ' + t2.length + '</td></tr>' + t2.map(row).join('') : '')
      + '<tr class="crm-tier-sep"><td colspan="3">Tier 3 · ' + d.t3_ids.length.toLocaleString('fr-FR') + ' autres comptes, classés en Tier 3 à la validation</td></tr>'
      + '</tbody></table></div>'
      + '<div class="crm-row" style="justify-content:flex-end;margin-top:14px"><span class="crm-meta" id="crm-tier-msg" style="margin-right:auto" role="status" aria-live="polite"></span><button class="crm-btn ghost" type="button" data-c>Plus tard</button><button class="crm-btn primary" type="button" id="crm-tier-ok">Valider les tiers</button></div></div>';
    document.body.appendChild(pop);
    var close = function () { pop.remove(); };
    pop.onclick = function (e) { if (e.target === pop) close(); };
    pop.querySelector('[data-c]').onclick = close;
    pop.querySelectorAll('[data-tacc]').forEach(function (b) { b.onclick = function () { close(); openAccount(b.getAttribute('data-tacc')); }; });
    var ok = document.getElementById('crm-tier-ok'), msg = document.getElementById('crm-tier-msg');
    ok.onclick = function () {
      var items = [];
      pop.querySelectorAll('select[data-tid]').forEach(function (s) { items.push({ id: s.getAttribute('data-tid'), tier: parseInt(s.value, 10) }); });
      d.t3_ids.forEach(function (id) { items.push({ id: id, tier: 3 }); });
      ok.disabled = true; var done = 0, upd = 0, chunks = [];
      for (var i = 0; i < items.length; i += 400) chunks.push(items.slice(i, i + 400));
      var next = function () {
        if (!chunks.length) { toast(upd + ' comptes classés'); close(); S.tierSug = null; loadTierBanner(true); fetchAccounts(); return; }
        var c = chunks.shift();
        api('/crm/tiers/apply', { method: 'POST', body: { items: c } }).then(function (r) { done += c.length; upd += r.updated || 0; msg.textContent = done + ' / ' + items.length; next(); })
          .catch(function (e) { msg.textContent = 'Erreur : ' + e.message; ok.disabled = false; });
      };
      next();
    };
  }

  // Vue arbre : pays › comptes de tête › comptes rattachés
  function drawTree() {
    var box = document.getElementById('crm-tree'); if (!box) return;
    box.innerHTML = '<div class="crm-row" style="gap:8px;margin-bottom:10px"><input type="search" class="crm-input" id="crm-tree-q" placeholder="Filtrer l’arbre (nom de compte)" aria-label="Filtrer l’arbre" style="max-width:340px"><span class="crm-meta" id="crm-tree-n"></span></div><div id="crm-tree-body"><div class="crm-empty">Chargement…</div></div>';
    var q = document.getElementById('crm-tree-q'), t = null;
    q.value = S.treeQ || '';
    q.oninput = function () { clearTimeout(t); t = setTimeout(function () { S.treeQ = q.value.trim(); renderTreeBody(); }, 200); };
    (S.treeData ? Promise.resolve(S.treeData) : api('/crm/tree').then(function (d) { S.treeData = d.accounts || []; return S.treeData; }))
      .then(renderTreeBody).catch(function (e) { document.getElementById('crm-tree-body').innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }
  function renderTreeBody() {
    var body = document.getElementById('crm-tree-body'); if (!body || !S.treeData) return;
    var all = S.treeData, byId = {}, kids = {};
    all.forEach(function (a) { byId[a.id] = a; });
    all.forEach(function (a) { if (a.parent_id && byId[a.parent_id]) (kids[a.parent_id] = kids[a.parent_id] || []).push(a); });
    var ql = (S.treeQ || '').toLowerCase(), keep = null;
    if (ql) {
      keep = {};
      var addUp = function (a) { while (a && !keep[a.id]) { keep[a.id] = 1; a = byId[a.parent_id]; } };
      var addDown = function (a) { (kids[a.id] || []).forEach(function (k) { keep[k.id] = 1; addDown(k); }); };
      all.forEach(function (a) { if (String(a.nom || '').toLowerCase().indexOf(ql) >= 0) { addUp(a); addDown(a); } });
    }
    var shown = all.filter(function (a) { return !keep || keep[a.id]; });
    var countries = {};
    shown.forEach(function (a) { if (!a.parent_id || !byId[a.parent_id]) (countries[a.pays || 'Sans pays'] = countries[a.pays || 'Sans pays'] || []).push(a); });
    var node = function (a, depth) {
      var ch = (kids[a.id] || []).filter(function (k) { return !keep || keep[k.id]; });
      var label = '<button type="button" class="crm-tree-acc" data-acc="' + esc(a.id) + '">' + tierBadge(a.tier) + '<span>' + esc(a.nom) + '</span>' + (ch.length ? '<span class="crm-meta">' + ch.length + '</span>' : '') + '</button>';
      if (!ch.length || depth > 8) return '<div class="crm-tree-leaf">' + label + '</div>';
      return '<details' + (ql || depth < 1 ? ' open' : '') + '><summary>' + label + '</summary><div class="crm-tree-kids">' + ch.map(function (k) { return node(k, depth + 1); }).join('') + '</div></details>';
    };
    var names = Object.keys(countries).sort(function (x, y) { return countries[y].length - countries[x].length; });
    document.getElementById('crm-tree-n').textContent = shown.length.toLocaleString('fr-FR') + ' compte' + (shown.length > 1 ? 's' : '') + ' · ' + names.length + ' pays';
    body.innerHTML = names.length ? names.map(function (c) {
      var roots = countries[c].sort(function (x, y) { return ((kids[y.id] || []).length - (kids[x.id] || []).length) || String(x.nom).localeCompare(String(y.nom)); });
      return '<details class="crm-tree-country"' + (ql || names.length === 1 ? ' open' : '') + '><summary><b>' + esc(c) + '</b> <span class="crm-meta">' + roots.length + '</span></summary><div class="crm-tree-kids">'
        + roots.slice(0, 400).map(function (a) { return node(a, 0); }).join('') + (roots.length > 400 ? '<div class="crm-meta">+ ' + (roots.length - 400) + ' autres : affinez le filtre</div>' : '') + '</div></details>';
    }).join('') : '<div class="crm-empty">Aucun compte.</div>';
    body.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); openAccount(b.getAttribute('data-acc')); }; });
  }

  // Organigramme : compte de tête en haut, branches dessous, compte ouvert mis en évidence
  function loadOrg(id) {
    var box = document.getElementById('crm-org'); if (!box) return;
    box.innerHTML = '<div class="crm-card"><h3>Organigramme</h3><div class="crm-meta">Chargement…</div></div>';
    (S.treeData ? Promise.resolve(S.treeData) : api('/crm/tree').then(function (d) { S.treeData = d.accounts || []; return S.treeData; }))
      .then(function () { drawOrg(id); })
      .catch(function (e) { box.innerHTML = '<div class="crm-card"><h3>Organigramme</h3><div class="crm-meta">Indisponible : ' + esc(e.message) + '</div></div>'; });
  }
  function drawOrg(id) {
    var box = document.getElementById('crm-org'); if (!box || !S.treeData) return;
    var byId = {}, kids = {};
    S.treeData.forEach(function (a) { byId[a.id] = a; });
    S.treeData.forEach(function (a) { if (a.parent_id && byId[a.parent_id]) (kids[a.parent_id] = kids[a.parent_id] || []).push(a); });
    Object.keys(kids).forEach(function (k) { kids[k].sort(function (x, y) { return ((kids[y.id] || []).length - (kids[x.id] || []).length) || String(x.nom).localeCompare(String(y.nom), 'fr', { numeric: true }); }); });
    var cur = byId[id]; if (!cur) { box.innerHTML = ''; return; }
    var path = {}, root = cur, guard = 0;
    path[cur.id] = 1;
    while (root.parent_id && byId[root.parent_id] && guard++ < 20) { root = byId[root.parent_id]; path[root.id] = 1; }
    var total = 0;
    var count = function (a, d) { total++; if (d < 30) (kids[a.id] || []).forEach(function (k) { count(k, d + 1); }); };
    count(root, 0);
    var MAXW = 10;
    var first = function (n) { return String(n || '').split(' ')[0]; };
    var short = function (a) {
      var nm = String(a.nom || ''), par = a.parent_id && byId[a.parent_id] ? String(byId[a.parent_id].nom || '').replace(/\s*\(.*\)\s*$/, '') : '';
      if (par && par.length > 3 && nm.toLowerCase().indexOf(par.toLowerCase()) === 0) {
        var rest = nm.slice(par.length).replace(/^[\s\-–:,·|]+/, '');
        if (rest.length > 2 && rest[0] !== '(') return rest;
      }
      return nm;
    };
    var card = function (a) {
      var n = (kids[a.id] || []).length;
      var meta = [a.n_contacts ? a.n_contacts + ' contact' + (a.n_contacts > 1 ? 's' : '') : '', a.owner_name ? first(a.owner_name) : ''].filter(Boolean).join(' · ');
      return '<button type="button" class="crm-org-box' + (a.id === id ? ' on' : '') + (path[a.id] && a.id !== id ? ' path' : '') + (a.parent_source === 'auto' ? ' auto" title="Rattaché par Scout, à vérifier' : '') + '" data-org="' + esc(a.id) + '"' + (a.id === id ? ' aria-current="true"' : '') + '>'
        + '<span class="t">' + (a.tier ? tierBadge(a.tier) : '') + '<b title="' + esc(a.nom) + '">' + esc(short(a)) + '</b></span>'
        + (meta || n ? '<span class="crm-meta">' + esc(meta) + (n && meta ? ' · ' : '') + (n ? n + ' rattaché' + (n > 1 ? 's' : '') : '') + '</span>' : '') + '</button>';
    };
    // profondeur affichée : 3 niveaux sous la tête, plus le chemin vers le compte ouvert et ses enfants directs
    var node = function (a, d) {
      var ch = kids[a.id] || [];
      var open = ch.length && (d < 2 || path[a.id]);
      if (!open) return '<li>' + card(a) + '</li>';
      var leaves = ch.every(function (k) { return !(kids[k.id] || []).length; });
      if (leaves && ch.length > 4) {
        // beaucoup de feuilles : une colonne compacte plutôt qu'une ligne très large
        var shown = ch.slice(0, 24);
        if (path[a.id]) ch.forEach(function (k) { if (path[k.id] && shown.indexOf(k) < 0) shown.push(k); });
        return '<li>' + card(a) + '<ul><li><div class="crm-org-stack" style="--cols:' + Math.min(4, Math.ceil(shown.length / 5)) + '">' + shown.map(card).join('')
          + (ch.length > shown.length ? '<span class="crm-meta">+ ' + (ch.length - shown.length) + ' autres</span>' : '') + '</div></li></ul></li>';
      }
      var vis = ch.slice(0, MAXW);
      ch.forEach(function (k) { if (path[k.id] && vis.indexOf(k) < 0) vis.push(k); });
      return '<li>' + card(a) + '<ul>' + vis.map(function (k) { return node(k, d + 1); }).join('')
        + (ch.length > vis.length ? '<li><span class="crm-org-more">+ ' + (ch.length - vis.length) + ' autres</span></li>' : '') + '</ul></li>';
    };
    var pref = null; try { pref = localStorage.getItem('scout_org_open'); } catch (e) {}
    var isOpen = pref ? pref === '1' : true;
    box.innerHTML = '<details class="crm-card crm-org-card"' + (isOpen ? ' open' : '') + '><summary><h3>Organigramme <span class="crm-meta">' + total + ' compte' + (total > 1 ? 's' : '') + ' sous ' + esc(root.nom) + '</span></h3></summary>'
      + '<div class="crm-org" tabindex="0" aria-label="Organigramme du groupe ' + esc(root.nom) + '"><ul>' + node(root, 0) + '</ul></div></details>';
    var det = box.querySelector('details');
    det.addEventListener('toggle', function () { try { localStorage.setItem('scout_org_open', det.open ? '1' : '0'); } catch (e) {} if (det.open) center(); });
    box.querySelectorAll('[data-org]').forEach(function (b) { b.onclick = function () { var x = b.getAttribute('data-org'); if (x !== id) openAccount(x); }; });
    var center = function () {
      var on = box.querySelector('.crm-org-box.on'), sc = box.querySelector('.crm-org'); if (!on || !sc) return;
      var r1 = on.getBoundingClientRect(), r2 = sc.getBoundingClientRect();
      sc.scrollLeft += (r1.left + r1.width / 2) - (r2.left + r2.width / 2);
    };
    center();
  }

  var QUICK_VIEWS = ['all', 'mine', 't1', 'hot'];
  function renderViews() {
    var el = document.getElementById('crm-views'); if (!el) return;
    var views = allViews(), cur = views.find(function (v) { return v.id === S.view; });
    var quick = views.filter(function (v) { return QUICK_VIEWS.indexOf(v.id) >= 0; });
    var other = views.filter(function (v) { return QUICK_VIEWS.indexOf(v.id) < 0; });
    var inMenu = cur && QUICK_VIEWS.indexOf(cur.id) < 0;
    el.innerHTML = quick.map(function (v) {
      var on = v.id === S.view;
      return '<button type="button" role="tab" aria-selected="' + on + '" class="crm-chip sm' + (on ? ' on' : '') + '" data-view="' + esc(v.id) + '">' + esc(v.id === 'all' ? 'Tous' : v.name) + '</button>';
    }).join('')
      + '<span class="crm-menu"><button type="button" class="crm-chip sm' + (inMenu ? ' on' : '') + '" id="crm-views-btn" aria-haspopup="true" aria-expanded="false">' + esc(inMenu ? cur.name : 'Vues') + ' ▾</button>'
      + '<div class="crm-menu-list" id="crm-views-menu" hidden>'
      + other.map(function (v) {
        return '<div class="crm-menu-it' + (v.id === S.view ? ' on' : '') + '"><button type="button" data-view="' + esc(v.id) + '">' + esc(v.name) + '</button>'
          + (v.custom ? '<button type="button" class="x" data-del="' + esc(v.id) + '" title="Supprimer la vue" aria-label="Supprimer la vue ' + esc(v.name) + '">×</button>' : '') + '</div>';
      }).join('')
      + '<div class="crm-menu-sep"></div><div class="crm-menu-it"><button type="button" id="crm-save-view">+ Enregistrer la vue actuelle</button></div></div></span>';
    var menu = document.getElementById('crm-views-menu'), mb = document.getElementById('crm-views-btn');
    var closeMenu = function () { menu.hidden = true; mb.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', outside, true); };
    var outside = function (e) { if (!e.target.closest || !e.target.closest('.crm-menu')) closeMenu(); };
    mb.onclick = function () { if (menu.hidden) { menu.hidden = false; mb.setAttribute('aria-expanded', 'true'); document.addEventListener('click', outside, true); } else closeMenu(); };
    el.querySelectorAll('[data-view]').forEach(function (b) { b.onclick = function () { document.removeEventListener('click', outside, true); applyView(b.getAttribute('data-view')); }; });
    el.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); closeMenu(); deleteView(b.getAttribute('data-del')); }; });
    document.getElementById('crm-save-view').onclick = function () { closeMenu(); saveViewDialog(); };
  }

  function applyView(id) {
    var v = allViews().find(function (x) { return x.id === id; }) || BUILTIN_VIEWS[0];
    S.view = v.id; S.filters = Object.assign({}, v.filters || {});
    S.sort = { sort: v.sort || 'score', dir: v.dir || 'desc' };
    lsSet('scout_crm_view', S.view); lsSet('scout_crm_filters', S.filters); lsSet('scout_crm_sort', S.sort);
    renderViews(); renderToolbar(); fetchAccounts();
  }

  function popup(title, inner, onOk, okLabel) {
    var pop = document.createElement('div'); pop.className = 'crm-pop';
    pop.innerHTML = '<div class="crm-pop-box" role="dialog" aria-label="' + esc(title) + '"><h3>' + esc(title) + '</h3>' + inner
      + '<div class="crm-row" style="justify-content:flex-end;margin-top:14px"><button class="crm-btn ghost" type="button" data-c>Annuler</button><button class="crm-btn primary" type="button" data-ok>' + esc(okLabel || 'Enregistrer') + '</button></div></div>';
    document.body.appendChild(pop);
    var close = function () { pop.remove(); document.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    pop.onclick = function (e) { if (e.target === pop) close(); };
    pop.querySelector('[data-c]').onclick = close;
    var ok = pop.querySelector('[data-ok]');
    ok.onclick = function () { ok.disabled = true; Promise.resolve(onOk(pop)).then(function (r) { if (r === false) ok.disabled = false; else close(); }).catch(function (e) { ok.disabled = false; toast('Erreur : ' + e.message); }); };
    var first = pop.querySelector('input,select,textarea'); if (first) first.focus();
    pop.querySelectorAll('input').forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') ok.click(); }); });
    return pop;
  }

  function saveViewDialog() {
    popup('Enregistrer la vue', '<input class="crm-input" id="crm-view-name" maxlength="60" placeholder="Nom de la vue, ex. Pompiers Benelux"><div class="crm-meta" style="margin-top:8px;">Garde les filtres et le tri actuels. Visible seulement par vous.</div>', function (pop) {
      var name = pop.querySelector('#crm-view-name').value.trim(); if (!name) return false;
      var v = { id: 'v' + Date.now().toString(36), name: name, filters: Object.assign({}, S.filters), sort: S.sort.sort, dir: S.sort.dir };
      var views = S.savedViews.map(function (x) { return { id: x.id, name: x.name, filters: x.filters, sort: x.sort, dir: x.dir }; }).concat([v]);
      return api('/crm/views', { method: 'PUT', body: { views: views } }).then(function (d) {
        S.savedViews = d.views || []; S.view = v.id; lsSet('scout_crm_view', S.view); renderViews(); toast('Vue enregistrée');
      });
    });
  }

  function deleteView(id) {
    var v = S.savedViews.find(function (x) { return x.id === id; }); if (!v) return;
    if (!confirm('Supprimer la vue « ' + v.name + ' » ?')) return;
    var views = S.savedViews.filter(function (x) { return x.id !== id; }).map(function (x) { return { id: x.id, name: x.name, filters: x.filters, sort: x.sort, dir: x.dir }; });
    api('/crm/views', { method: 'PUT', body: { views: views } }).then(function (d) {
      S.savedViews = d.views || []; if (S.view === id) applyView('all'); else renderViews();
    }).catch(function (e) { toast('Erreur : ' + e.message); });
  }

  function renderToolbar() {
    var el = document.getElementById('crm-toolbar'); if (!el || !S.facets) return;
    var f = S.filters, F = S.facets;
    var sel = function (key, label, options) {
      return '<select class="crm-sel' + (f[key] ? ' set' : '') + '" data-f="' + key + '" aria-label="' + esc(label) + '">' + opt('', label, f[key]) + options
        + (f[key] && options.indexOf('value="' + esc(f[key]) + '"') < 0 ? opt(f[key], 'Sélection multiple', f[key]) : '') + '</select>';
    };
    var nf = Object.keys(f).filter(function (k) { return k !== 'q' && f[k]; }).length;
    el.innerHTML = '<input class="crm-search" id="crm-q" type="search" placeholder="Rechercher un compte, un domaine, un contact…" aria-label="Rechercher" value="' + esc(f.q || '') + '">'
      + '<button type="button" class="crm-chip sm crm-filters-btn' + (nf ? ' set' : '') + '" id="crm-filters-btn" aria-expanded="' + !!S.filtersOpen + '" aria-controls="crm-fpanel">Filtres' + (nf ? ' · ' + nf : '') + '</button>';
    var fp = document.getElementById('crm-fpanel');
    fp.innerHTML = '<div class="crm-fsel">'
      + sel('owner', 'Propriétaire', opt('me', 'Moi', f.owner) + opt('none', 'Sans propriétaire', f.owner) + F.users.map(function (u) { return opt(u.id, u.name, f.owner); }).join(''))
      + sel('tier', 'Tier', opt('1', 'Tier 1', f.tier) + opt('2', 'Tier 2', f.tier) + opt('3', 'Tier 3', f.tier) + opt('1,2', 'Tier 1 et 2', f.tier) + opt('none', 'Sans tier', f.tier))
      + sel('heat', 'Engagement', opt('chaud', 'Chaud', f.heat) + opt('tiede', 'Tiède', f.heat) + opt('chaud,tiede', 'Chaud ou tiède', f.heat) + opt('froid', 'Froid', f.heat))
      + sel('status', 'Statut', STATUS_ORDER.map(function (s) { return opt(s, STATUS_LABEL[s], f.status); }).join(''))
      + sel('coverage', 'Comité', opt('incomplete', 'Incomplet', f.coverage) + opt('no_decideur', 'Sans décideur', f.coverage) + opt('complete', 'Complet', f.coverage))
      + sel('pays', 'Pays', F.pays.map(function (x) { return opt(x.v, x.v + ' (' + x.n + ')', f.pays); }).join(''))
      + sel('secteur', 'Secteur', F.secteurs.map(function (x) { return opt(x.v, x.v + ' (' + x.n + ')', f.secteur); }).join(''))
      + sel('activity', 'Activité', opt('30', 'Moins de 30 j', f.activity) + opt('90', 'Moins de 90 j', f.activity) + opt('stale30', 'Rien depuis 30 j', f.activity) + opt('stale90', 'Rien depuis 90 j', f.activity) + opt('never', 'Jamais contacté', f.activity))
      + sel('tasks', 'Tâches', opt('open', 'Tâche ouverte', f.tasks) + opt('overdue', 'Tâche en retard', f.tasks) + opt('none', 'Aucune tâche', f.tasks))
      + sel('web', 'Site web', opt('yes', 'A visité le site (90 j)', f.web))
      + sel('market', 'Marchés', opt('yes', 'Appel d’offres ou contrat', f.market) + opt('recent', 'Marché de moins d’un an', f.market))
      + (nf ? '<button type="button" class="crm-link" id="crm-reset">Effacer les filtres</button>' : '') + '</div>';
    fp.insertAdjacentHTML('beforeend', activeChips(f, fp));
    fp.classList.toggle('open', !!S.filtersOpen);
    fp.classList.toggle('has-active', !!nf);
    var rs = document.getElementById('crm-reset'); if (rs) rs.onclick = function () { applyView('all'); };
    fp.querySelectorAll('[data-rmf]').forEach(function (b) { b.onclick = function () { setFilter(b.getAttribute('data-rmf'), ''); }; });
    document.getElementById('crm-filters-btn').onclick = function () { S.filtersOpen = !S.filtersOpen; fp.classList.toggle('open', S.filtersOpen); this.setAttribute('aria-expanded', S.filtersOpen); };
    var t;
    document.getElementById('crm-q').oninput = function (e) {
      clearTimeout(t); var v = e.target.value;
      t = setTimeout(function () { setFilter('q', v.trim()); }, 300);
    };
    fp.querySelectorAll('[data-f]').forEach(function (s) { s.onchange = function () { setFilter(s.getAttribute('data-f'), s.value); }; });
  }

  // Filtres actifs en pastilles retirables, visibles quand le panneau est replié.
  function activeChips(f, fp) {
    var out = [];
    fp.querySelectorAll('select[data-f],select[data-pf]').forEach(function (sl) {
      var k = sl.getAttribute('data-f') || sl.getAttribute('data-pf'); if (!f[k]) return;
      var o = sl.options[sl.selectedIndex], lab = sl.getAttribute('aria-label');
      out.push('<button type="button" class="crm-chip sm on" data-rm' + (sl.getAttribute('data-pf') ? 'p' : '') + 'f="' + esc(k) + '" title="Retirer ce filtre">' + esc(lab) + ' : ' + esc(o ? o.textContent : f[k]) + ' <span class="x" aria-hidden="true">×</span></button>');
    });
    return out.length ? '<div class="crm-factive">' + out.join('') + '</div>' : '';
  }

  function setFilter(k, v) {
    if (v) S.filters[k] = v; else delete S.filters[k];
    S.view = matchView(); lsSet('scout_crm_view', S.view); lsSet('scout_crm_filters', S.filters);
    renderViews(); renderToolbar(); fetchAccounts();
    var q = document.getElementById('crm-q'); if (q && k === 'q') { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  function sortObj(o) { var r = {}; Object.keys(o || {}).sort().forEach(function (k) { if (o[k]) r[k] = o[k]; }); return r; }
  function matchView() {
    var key = JSON.stringify(sortObj(S.filters));
    var v = allViews().find(function (x) { return JSON.stringify(sortObj(x.filters)) === key; });
    return v ? v.id : '';
  }

  function queryString(offset, limit) {
    var p = new URLSearchParams();
    Object.keys(S.filters).forEach(function (k) { if (S.filters[k]) p.set(k, S.filters[k]); });
    p.set('sort', S.sort.sort); p.set('dir', S.sort.dir); p.set('limit', limit || PAGE); p.set('offset', offset || 0);
    return p.toString();
  }

  var fetchSeq = 0;
  function fetchAccounts(more, keepSel) {
    var seq = ++fetchSeq;
    if (!more) { S.rows = []; if (!keepSel) S.selected = {}; renderBulk(); }
    var tb = document.querySelector('#crm-table tbody');
    if (!more && tb) tb.innerHTML = '<tr><td colspan="10" class="crm-empty">Chargement…</td></tr>';
    return api('/crm/accounts?' + queryString(more ? S.rows.length : 0)).then(function (d) {
      if (seq !== fetchSeq) return;
      S.rows = more ? S.rows.concat(d.accounts) : d.accounts; S.total = d.total;
      renderTable();
    }).catch(function (e) {
      if (seq !== fetchSeq) return;
      if (tb) tb.innerHTML = '<tr><td colspan="10" class="crm-empty">Impossible de charger les comptes (' + esc(e.message) + ').</td></tr>';
    });
  }

  // Bouton « Colonnes » : masque des colonnes, mémorisé par navigateur. Le nom reste toujours affiché.
  function colsMenu(host, tableSel, key, cols) {
    if (!host) return;
    var hidden = lsGet(key, []) || [];
    var apply = function () {
      var id = 'crm-colhide-' + key, st = document.getElementById(id);
      if (!st) { st = document.createElement('style'); st.id = id; document.head.appendChild(st); }
      st.textContent = hidden.map(function (k) { return '@media (min-width: 761px) { ' + tableSel + ' .c-' + k + ' { display: none; } }'; }).join('\n');
      var b = host.querySelector('.crm-cols-btn'); if (b) b.textContent = 'Colonnes' + (hidden.length ? ' · ' + (cols.length - hidden.length) + '/' + cols.length : '') + ' ▾';
    };
    host.innerHTML = '<button type="button" class="crm-btn ghost sm crm-cols-btn" aria-haspopup="true" aria-expanded="false"></button>'
      + '<div class="crm-menu-list right" hidden>' + cols.map(function (c) {
        return '<label class="crm-menu-check"><input type="checkbox" data-col="' + c[0] + '"' + (hidden.indexOf(c[0]) < 0 ? ' checked' : '') + '> ' + esc(c[1]) + '</label>';
      }).join('') + '</div>';
    var btn = host.querySelector('.crm-cols-btn'), menu = host.querySelector('.crm-menu-list');
    var outside = function (e) { if (!host.contains(e.target)) close(); };
    var close = function () { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', outside, true); };
    btn.onclick = function () { if (menu.hidden) { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); document.addEventListener('click', outside, true); } else close(); };
    menu.querySelectorAll('[data-col]').forEach(function (cb) {
      cb.onchange = function () {
        var k = cb.getAttribute('data-col');
        hidden = hidden.filter(function (x) { return x !== k; }); if (!cb.checked) hidden.push(k);
        lsSet(key, hidden); apply();
      };
    });
    apply();
  }

  var COLS = [
    { k: 'tier', label: 'Tier', sort: 'tier', asc: true },
    { k: 'nom', label: 'Compte', sort: 'nom', asc: true },
    { k: 'prio', label: 'Priorité', sort: 'priority' },
    { k: 'score', label: 'Engagement', sort: 'score' },
    { k: 'status', label: 'Statut', sort: 'status' },
    { k: 'coverage', label: 'Comité', sort: 'coverage' },
    { k: 'owner', label: 'Propriétaire', sort: 'owner', asc: true },
    { k: 'activity', label: 'Dernière activité', sort: 'last_activity' },
    { k: 'task', label: 'Prochaine tâche', sort: 'next_task', asc: true }
  ];

  function renderTable() {
    var th = document.querySelector('#crm-table thead'), tb = document.querySelector('#crm-table tbody');
    if (!th || !tb) return;
    var allSel = S.rows.length && S.rows.every(function (r) { return S.selected[r.id]; });
    th.innerHTML = '<tr><th class="cb"><input type="checkbox" id="crm-selall" aria-label="Tout sélectionner"' + (allSel ? ' checked' : '') + '></th>'
      + COLS.map(function (c) {
        var on = S.sort.sort === c.sort;
        return '<th class="sortable c-' + c.k + '" data-sort="' + c.sort + '" data-asc="' + (c.asc ? 1 : 0) + '" aria-sort="' + (on ? (S.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none') + '">' + c.label + (on ? '<span class="arr">' + (S.sort.dir === 'asc' ? '▲' : '▼') + '</span>' : '') + '</th>';
      }).join('') + '</tr>';
    th.querySelectorAll('[data-sort]').forEach(function (h) {
      h.onclick = function () {
        var s = h.getAttribute('data-sort');
        S.sort = { sort: s, dir: S.sort.sort === s ? (S.sort.dir === 'asc' ? 'desc' : 'asc') : (h.getAttribute('data-asc') === '1' ? 'asc' : 'desc') };
        lsSet('scout_crm_sort', S.sort); fetchAccounts();
      };
    });
    document.getElementById('crm-selall').onchange = function (e) {
      S.rows.forEach(function (r) { if (e.target.checked) S.selected[r.id] = true; else delete S.selected[r.id]; });
      renderTable(); renderBulk();
    };
    var cnt = document.getElementById('crm-count');
    if (cnt) cnt.textContent = S.total.toLocaleString('fr-FR') + ' compte' + (S.total > 1 ? 's' : '');
    if (!S.rows.length) {
      tb.innerHTML = '<tr><td colspan="10" class="crm-empty">Aucun compte ne correspond à ces filtres.</td></tr>';
    } else {
      tb.innerHTML = S.rows.map(function (r) {
        var sel = !!S.selected[r.id];
        return '<tr data-id="' + esc(r.id) + '" class="' + (sel ? 'sel' : '') + '">'
          + '<td class="cb"><input type="checkbox" data-cb="' + esc(r.id) + '" aria-label="Sélectionner ' + esc(r.nom) + '"' + (sel ? ' checked' : '') + '></td>'
          + '<td class="c-tier">' + tierBadge(r.tier) + '</td>'
          + '<td class="c-nom"><div class="crm-acc-name" title="' + esc(r.nom) + '">' + esc(r.nom) + '</div><div class="crm-acc-sub">' + esc([r.pays, r.secteur].filter(Boolean).join(' · ')) + (r.n_contacts ? ' · ' + r.n_contacts + ' contact' + (r.n_contacts > 1 ? 's' : '') : '') + '</div></td>'
          + '<td class="c-prio">' + prioBadge(r.priority) + '</td>'
          + '<td class="c-score"><span class="crm-score-cell">' + heatBadge(r.score, r.heat) + (r.client_of ? '<span class="crm-buy crm-buy-c" title="Équipé chez ce concurrent (veille)">Client ' + esc(r.client_of) + '</span>' : '') + (r.n_veille_eval && !r.n_market_tethered ? '<span class="crm-buy crm-buy-t" title="' + r.n_veille_eval + ' signal(s) en 12 mois : évaluation, démo ou achat de drone filaire (veille)">Achat filaire</span>' : '') + (r.n_market_recent && r.score === r.score_v2 ? (r.n_market_tethered ? '<span class="crm-buy crm-buy-t" title="' + r.n_market_tethered + ' marché(s) de drone filaire en 12 mois">Achat filaire</span>' : '<span class="crm-buy" title="' + r.n_market_recent + ' marché(s) drone en 12 mois">Achat drone</span>') : '') + (r.web_pages_90d ? '<span class="crm-web" title="' + r.web_pages_90d + ' pages vues sur elistair.com (90 j)">web</span>' : '') + '</span></td>'
          + '<td class="c-status">' + statusPill(r.status) + '</td>'
          + '<td class="c-coverage">' + coverageDots(r.roles) + '</td>'
          + '<td class="c-owner">' + (r.owner_name ? '<span class="crm-owner"><span class="crm-avatar">' + esc(initials(r.owner_name)) + '</span>' + esc(r.owner_name) + '</span>' : '<span class="crm-muted">Personne</span>') + '</td>'
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
      + '<select class="crm-sel" id="crm-bulk-owner" aria-label="Assigner à"><option value="">Assigner à…</option><option value="__none">Personne</option>' + userOptions('', null) + '</select>'
      + '<select class="crm-sel" id="crm-bulk-tier" aria-label="Tier"><option value="">Tier…</option><option value="1">Tier 1</option><option value="2">Tier 2</option><option value="3">Tier 3</option><option value="__none">Sans tier</option></select>'
      + '<select class="crm-sel" id="crm-bulk-status" aria-label="Changer le statut"><option value="">Statut…</option><option value="__auto">Automatique</option>'
      + STATUS_ORDER.map(function (s) { return '<option value="' + s + '">' + STATUS_LABEL[s] + '</option>'; }).join('') + '</select>'
      + (isAdminNow() ? '<button class="crm-btn" type="button" id="crm-bulk-export">Exporter</button>' : '')
      + '<button class="crm-btn ghost" type="button" id="crm-bulk-clear" style="margin-left:auto">Désélectionner</button></div>';
    var run = function (body, label) {
      api('/crm/accounts/bulk', { method: 'POST', body: Object.assign({ ids: ids }, body) }).then(function (d) {
        toast(label + ' : ' + d.updated + ' compte' + (d.updated > 1 ? 's' : '')); fetchAccounts(false, true);
      }).catch(function (e) { toast('Erreur : ' + e.message); });
    };
    document.getElementById('crm-bulk-owner').onchange = function (e) { var v = e.target.value; if (v) run({ owner_user_id: v === '__none' ? null : v }, 'Propriétaire mis à jour'); };
    document.getElementById('crm-bulk-tier').onchange = function (e) { var v = e.target.value; if (v) run({ tier: v === '__none' ? null : v }, 'Tier mis à jour'); };
    document.getElementById('crm-bulk-status').onchange = function (e) { var v = e.target.value; if (v) run({ crm_status: v === '__auto' ? null : v }, 'Statut mis à jour'); };
    var bex = document.getElementById('crm-bulk-export'); if (bex) bex.onclick = function () { exportCsv(S.rows.filter(function (r) { return S.selected[r.id]; })); };
    document.getElementById('crm-bulk-clear').onclick = function () { S.selected = {}; renderTable(); renderBulk(); };
  }

  function downloadCsv(head, rows, name) {
    var q = function (v) { v = v == null ? '' : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [head.join(';')].concat(rows.map(function (r) { return r.map(q).join(';'); }));
    var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '-' + todayStr() + '.csv';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportCsv(rowsArg) {
    var out = function (rows) {
      downloadCsv(['Compte', 'Tier', 'Pays', 'Secteur', 'Domaine', 'Statut', 'Score', 'Engagement', 'Comité (rôles couverts)', 'Propriétaire', 'Contacts', 'Emails', 'Dernière activité', 'Prochaine tâche', 'Prochaine étape', 'ID Scout', 'ID Dynamics'],
        rows.map(function (r) {
          return [r.nom, r.tier || '', r.pays, r.secteur, r.domain || '', STATUS_LABEL[r.status] || r.status, r.score, HEAT_LABEL[r.heat] || '', (r.roles || []).map(function (x) { return ROLE_LABEL[x] || x; }).join(', '),
            r.owner_name || '', r.n_contacts, r.n_emails, r.last_activity_at ? String(r.last_activity_at).slice(0, 10) : '', r.next_task_due || '', r.next_step || '', r.id, r.dynamics_id || ''];
        }), 'scout-comptes');
      toast(rows.length + ' compte' + (rows.length > 1 ? 's' : '') + ' exporté' + (rows.length > 1 ? 's' : ''));
    };
    if (Array.isArray(rowsArg)) return out(rowsArg);
    if (S.total <= S.rows.length) return out(S.rows);
    var all = [], off = 0;
    var step = function () {
      return api('/crm/accounts?' + queryString(off, 500)).then(function (d) {
        all = all.concat(d.accounts); off += d.accounts.length;
        if (d.accounts.length && off < d.total && off < 5000) return step();
        out(all);
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
    Promise.all([loadFacets(), loadSavedViews()]).then(function () {
      if (opts && opts.filter) {
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

  // ═════════════════════════════════════════════════════════════════════════
  // CHAMPS ÉDITABLES (fiche compte et fiche contact)
  // ═════════════════════════════════════════════════════════════════════════
  // field: { k, label, type: text|textarea|select|date|url, options: [[v,label]], value, display (html), placeholder }
  function fieldRow(f) {
    var empty = f.value == null || f.value === '';
    return '<div class="crm-f" data-fk="' + esc(f.k) + '"><dt>' + esc(f.label) + '</dt><dd>'
      + '<button type="button" class="crm-fv' + (empty ? ' empty' : '') + '" data-edit="' + esc(f.k) + '" title="Modifier">'
      + (empty ? esc(f.placeholder || '—') : (f.display != null ? f.display : esc(f.value))) + '<span class="pen" aria-hidden="true">' + ICON.edit + '</span></button></dd></div>';
  }

  function bindFields(root, fields, save) {
    var byKey = {}; fields.forEach(function (f) { byKey[f.k] = f; });
    root.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.onclick = function () {
        var f = byKey[btn.getAttribute('data-edit')]; if (!f) return;
        var dd = btn.parentNode; var cur = f.value == null ? '' : f.value;
        var input;
        if (f.type === 'select') {
          dd.innerHTML = '<select class="crm-sel crm-fin">' + (f.options || []).map(function (o) { return opt(o[0], o[1], cur); }).join('') + '</select>';
        } else if (f.type === 'textarea') {
          dd.innerHTML = '<textarea class="crm-ta crm-fin" rows="4">' + esc(cur) + '</textarea><div class="crm-meta" style="margin-top:4px">Ctrl+Entrée pour enregistrer, Échap pour annuler</div>';
        } else {
          dd.innerHTML = '<input class="crm-input crm-fin" type="' + (f.type === 'date' ? 'date' : 'text') + '" value="' + esc(cur) + '" placeholder="' + esc(f.placeholder || '') + '">';
        }
        input = dd.querySelector('.crm-fin'); input.focus(); if (input.select && f.type !== 'select') try { input.select(); } catch (e) {}
        var done = false;
        var commit = function () {
          if (done) return; done = true;
          var v = input.value;
          if (String(v) === String(cur)) { save(null); return; }
          save(f.k, v);
        };
        var cancel = function () { if (done) return; done = true; save(null); };
        if (f.type === 'select') { input.onchange = commit; input.onblur = function () { setTimeout(cancel, 150); }; }
        else {
          input.onblur = commit;
          input.onkeydown = function (e) {
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            if (e.key === 'Enter' && (f.type !== 'textarea' || e.metaKey || e.ctrlKey)) { e.preventDefault(); commit(); }
          };
        }
      };
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // FICHE COMPTE (3 colonnes : à propos / activité / comité et associations)
  // ═════════════════════════════════════════════════════════════════════════
  function openAccount(id) {
    if (!id) return;
    var l = document.getElementById('crm-list');
    S.cameFromList = !!(l && l.style.display !== 'none' && panelAccounts() && panelAccounts().classList.contains('active'));
    go('accounts', { tab: encodeURIComponent(id) });
  }

  function renderAccountDetail(id) {
    clearOtherRecord('account');
    var l = document.getElementById('crm-list'), d = document.getElementById('crm-detail');
    if (!d) return;
    l.style.display = 'none'; d.style.display = '';
    if (!S.account || S.account.account.id !== id) d.innerHTML = '<button class="crm-back" type="button" id="crm-back">← Comptes</button><div class="crm-empty">Chargement de la fiche…</div>';
    var b = document.getElementById('crm-back'); if (b) b.onclick = backToList;
    window.scrollTo(0, 0);
    return Promise.all([loadFacets(), api('/crm/accounts/' + encodeURIComponent(id))]).then(function (res) {
      if (res[1] && res[1].merged_into === '__archive__') { toast('Ce compte a été archivé lors du nettoyage'); backToList(); return; }
      if (res[1] && res[1].merged_into) { toast('Ce compte a été fusionné : ouverture du compte conservé'); openAccount(res[1].merged_into); return; }
      S.account = res[1]; S.tlFilter = 'all';
      drawAccount();
    }).catch(function (e) {
      d.innerHTML = '<button class="crm-back" type="button" id="crm-back">← Comptes</button><div class="crm-empty">' + (e.status === 404 ? 'Ce compte n’existe plus.' : 'Erreur : ' + esc(e.message)) + '</div>';
      document.getElementById('crm-back').onclick = backToList;
    });
  }

  // ── Brief de compte (IA) : ce qu'il faut savoir avant un appel, à partir des seules données de Scout ──
  function loadBrief(id, refresh) {
    var box = document.getElementById('crm-brief'); if (!box) return;
    box.innerHTML = '<div class="crm-card crm-brief"><div class="crm-meta">Préparation du brief…</div></div>';
    api('/assist/brief/' + encodeURIComponent(id) + (refresh ? '?refresh=1' : '')).then(function (b) {
      S.brief = b; S.briefFor = id; drawBrief(b);
    }).catch(function (e) { box.innerHTML = '<div class="crm-card crm-brief"><div class="crm-meta">Brief indisponible : ' + esc(e.message) + '</div></div>'; });
  }
  function drawBrief(b) {
    var box = document.getElementById('crm-brief'); if (!box) return;
    var list = function (arr) { return (arr || []).length ? '<ul>' + arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<div class="crm-meta">Rien de connu.</div>'; };
    box.innerHTML = '<div class="crm-card crm-brief"><h3>Brief du compte <span class="crm-meta">' + (b.generated_at ? 'préparé ' + esc(relTime(b.generated_at)) : '') + ' · à partir des données de Scout</span>'
      + '<span class="crm-row" style="gap:8px"><button type="button" class="crm-link" id="crm-brief-refresh">Actualiser</button><button type="button" class="crm-link" id="crm-brief-close" aria-label="Fermer le brief">Fermer</button></span></h3>'
      + '<p class="lead">' + esc(b.situation || '') + '</p>'
      + '<div class="crm-brief-grid"><div><h4>Interlocuteurs</h4>' + list(b.interlocuteurs) + '</div><div><h4>Signaux récents</h4>' + list(b.signaux) + '</div>'
      + '<div><h4>Angle Elistair</h4><p>' + esc(b.angle || '') + '</p></div><div><h4>Questions à poser</h4>' + list(b.questions) + '</div></div>'
      + (b.prochaine_action ? '<div class="crm-brief-next"><b>Prochaine action :</b> ' + esc(b.prochaine_action) + '</div>' : '') + '</div>';
    document.getElementById('crm-brief-refresh').onclick = function () { loadBrief(S.briefFor, true); };
    document.getElementById('crm-brief-close').onclick = function () { S.brief = null; S.briefFor = null; box.innerHTML = ''; };
  }

  function reloadAccount() {
    if (!S.account) return Promise.resolve();
    return api('/crm/accounts/' + encodeURIComponent(S.account.account.id)).then(function (r) { S.account = r; drawAccount(); });
  }

  function backToList() {
    if (/^#accounts\/./.test(location.hash) && S.cameFromList && history.length > 1) { history.back(); return; }
    go('accounts');
  }

  function autoStatusOf(timeline) {
    var k = timeline.map(function (t) { return t.kind; });
    if (k.indexOf('already_client') >= 0) return 'client';
    if (k.indexOf('transmitted_crm') >= 0) return 'transmis';
    if (k.indexOf('reply_positive') >= 0) return 'engage';
    var out = ['email', 'linkedin_message', 'linkedin_connect', 'phone', 'call', 'in_person', 'meeting', 'third_party', 'via_third_party', 'other'];
    if (k.some(function (x) { return out.indexOf(x) >= 0; })) return 'contacte';
    return 'nouveau';
  }

  function accountFields(a, sm) {
    var F = S.facets;
    return [
      { k: 'tier', label: 'Tier ABM', type: 'select', value: a.tier ? String(a.tier) : '', display: a.tier ? tierBadge(a.tier) + ' Tier ' + a.tier : null, placeholder: 'Définir', options: [['', 'Aucun'], ['1', 'Tier 1 : cible prioritaire'], ['2', 'Tier 2'], ['3', 'Tier 3']] },
      { k: 'owner_user_id', label: 'Propriétaire', type: 'select', value: a.owner_user_id ? String(a.owner_user_id) : '', display: a.owner_name ? '<span class="crm-avatar">' + esc(initials(a.owner_name)) + '</span>' + esc(a.owner_name) : null, placeholder: 'Personne', options: [['', 'Personne']].concat(F.users.map(function (u) { return [String(u.id), u.name]; })) },
      { k: 'crm_status', label: 'Statut', type: 'select', value: a.crm_status || '', display: statusPill(a.crm_status || sm.status) + (a.crm_status ? '' : ' <span class="crm-muted">auto</span>'), options: [['', 'Automatique (' + STATUS_LABEL[autoStatusOf(S.account.timeline)] + ')']].concat(STATUS_ORDER.map(function (s) { return [s, STATUS_LABEL[s]]; })) },
      { k: 'next_step', label: 'Prochaine étape', type: 'text', value: a.next_step, placeholder: 'Ex. démo Safe-T avec le chef drones' },
      { k: 'next_step_date', label: 'Échéance', type: 'date', value: a.next_step_date, display: a.next_step_date ? '<span class="' + dueClass(a.next_step_date) + '">' + esc(fmtDate(a.next_step_date)) + '</span>' : null, placeholder: 'Ajouter' },
      { k: 'domain', label: 'Domaine', type: 'text', value: a.domain || '', display: (a.domain ? esc(a.domain) : (sm.domain ? esc(sm.domain) + ' <span class="crm-muted">déduit des emails</span>' : null)), placeholder: 'ex. sdis69.fr' },
      { k: 'pays', label: 'Pays', type: 'text', value: a.pays },
      { k: 'ville', label: 'Ville', type: 'text', value: a.ville, placeholder: 'Ajouter' },
      { k: 'secteur', label: 'Secteur', type: 'text', value: a.secteur },
      { k: 'type', label: 'Type', type: 'select', value: a.type || '', options: [['', '—'], ['Gouvernement', 'Gouvernement'], ['Militaire', 'Militaire'], ['Civil', 'Civil'], ['ONG', 'ONG']] },
      { k: 'budget_estime', label: 'Budget', type: 'text', value: a.budget_estime, placeholder: 'Ajouter' },
      { k: 'quantite_estimee', label: 'Flotte / quantité', type: 'text', value: a.quantite_estimee, placeholder: 'Ajouter' },
      { k: 'linkedin_url', label: 'LinkedIn', type: 'text', value: a.linkedin_url, display: a.linkedin_url ? '<a class="crm-link" href="' + safeUrl(a.linkedin_url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">Page LinkedIn</a>' : null, placeholder: 'Ajouter' },
      { k: 'dynamics_id', label: 'ID Dynamics', type: 'text', value: a.dynamics_id, placeholder: 'Pas encore lié' },
      { k: 'description', label: 'Description', type: 'textarea', value: a.description, placeholder: 'Ajouter' }
    ];
  }

  function drawAccount() {
    var d = document.getElementById('crm-detail'); var A = S.account; if (!d || !A) return;
    var a = A.account, sm = A.summary || {}, F = S.facets;
    S.ctx = 'account';
    var openTasks = A.tasks.filter(function (t) { return !t.done_at; });
    var doneTasks = A.tasks.filter(function (t) { return t.done_at; });
    var fields = accountFields(a, sm);
    var byRole = {}; A.contacts.forEach(function (c) { var r = c.role || 'none'; (byRole[r] = byRole[r] || []).push(c); });
    var others = (byRole.influenceur || []).concat(byRole.none || []);

    d.innerHTML = '<button class="crm-back" type="button" id="crm-back">← Comptes</button>'
      + '<div class="crm-rec-head"><div class="crm-rec-id">' + tierBadge(a.tier) + '<div style="min-width:0">'
      + ((A.ancestors || []).length ? '<nav class="crm-crumbs" aria-label="Rattachement">' + A.ancestors.map(function (x) { return '<button type="button" class="crm-link" data-acc="' + esc(x.id) + '">' + esc(x.nom) + '</button>'; }).join(' › ') + ' ›</nav>' : '')
      + '<h2>' + esc(a.nom) + '</h2>'
      + '<div class="crm-meta">' + esc([a.pays, a.ville, a.secteur].filter(Boolean).join(' · ')) + (sm.domain ? ' · <a class="crm-link" href="https://' + esc(sm.domain) + '" target="_blank" rel="noopener">' + esc(sm.domain) + '</a>' : '') + '</div></div></div>'
      + '<div class="crm-rec-kpis">'
      + '<div><span>Priorité</span>' + prioBadge(sm.priority) + '</div>'
      + '<div><span>Engagement</span>' + heatBadge(sm.score, sm.heat) + '</div>'
      + '<div><span>Statut</span>' + statusPill(sm.status) + '</div>'
      + '<div><span>Comité</span>' + coverageDots(sm.roles) + '</div>'
      + '<div><span>Dernière activité</span><b>' + (sm.last_activity_at ? esc(relTime(sm.last_activity_at)) : 'Jamais') + '</b></div>'
      + '</div></div>'
      + '<div class="crm-actions">'
      + '<button type="button" class="crm-btn" data-compose="activity">' + ICON.phone + ' Saisir une activité</button>'
      + '<button type="button" class="crm-btn" data-compose="note">' + ICON.note + ' Note</button>'
      + '<button type="button" class="crm-btn" data-compose="task">' + ICON.check + ' Tâche</button>'
      + '<button type="button" class="crm-btn" id="crm-add-contact">' + ICON.plus + ' Contact</button>'
      + '<button type="button" class="crm-btn" id="crm-brief-btn" title="Résumé du compte avant un appel ou un rendez-vous">' + ICON.note + ' Brief</button>'
      + '</div>'
      + (sm.parent_id || (A.children || []).length ? '<div id="crm-org"></div>' : '') + '<div class="crm-rec-grid">'
      // ── colonne gauche : à propos
      + '<aside class="crm-rec-left"><div class="crm-card"><h3>À propos du compte</h3><dl class="crm-fields" id="crm-acc-fields">' + fields.map(fieldRow).join('') + '</dl>'
      + '<div class="crm-parent"><div class="crm-meta" style="margin:10px 0 4px">Rattaché à</div>'
      + (sm.parent_id ? '<div class="crm-row" style="gap:6px;flex-wrap:wrap"><button type="button" class="crm-link" data-acc="' + esc(sm.parent_id) + '">' + esc(sm.parent_nom || 'compte parent') + '</button>' + (a.parent_source === 'auto' ? '<span class="crm-auto-tag" title="Rattachement fait par Scout à partir du nom ou du domaine mail. Changez-le ou détachez-le s’il est faux : Scout ne le refera pas.">par Scout</span>' : '') + '<button type="button" class="crm-btn ghost sm" id="crm-parent-edit">Changer</button><button type="button" class="crm-btn ghost sm" id="crm-parent-clear">Détacher</button></div><div id="crm-parent-pick" hidden></div>'
        : '<div id="crm-parent-pick"></div>')
      + '</div>'
      + (typeof window._legacyOpenEndUser === 'function' ? '<button type="button" class="crm-link" id="crm-legacy" style="margin-top:10px;font-size:12.5px">Fiche marché : produits et fournisseurs</button>' : '') + '</div>'
      + '<div class="crm-card"><h3>Priorité <span class="crm-meta">sur 100</span></h3><div class="crm-score-big">' + prioBadge(sm.priority) + '</div>'
      + '<div class="crm-prio-parts">'
      + [['Adéquation', sm.fit, 40, 'tier, secteur cible, usage drone'], ['Intention', sm.intent, 40, 'engagement du compte et marchés récents'], ['Relation', sm.relation, 20, 'emails connus et comité couvert']].map(function (x) {
        return '<div title="' + esc(x[3]) + '"><span>' + x[0] + '</span><span class="crm-prio-bar"><i style="width:' + Math.round(100 * (x[1] || 0) / x[2]) + '%"></i></span><b>' + (x[1] || 0) + '/' + x[2] + '</b></div>';
      }).join('') + '</div></div>'
      + (sm.score_v2 != null && sm.score === sm.score_v2
        ? '<div class="crm-card"><h3>Engagement <span class="crm-meta">ce que le compte fait envers nous</span></h3><div class="crm-score-big">' + heatBadge(sm.score, sm.heat) + '</div>'
          + '<ul class="crm-score-list">'
          + '<li><b>' + (sm.eng_echanges || 0) + '</b> échanges (réponses, rendez-vous, appels aboutis)</li>'
          + '<li><b>' + (sm.eng_web || 0) + '</b> visites du site' + (sm.web_pages_90d ? ' (' + sm.web_pages_90d + ' pages en 90 j' + (sm.eng_retours ? ', revient souvent' : '') + ')' : (sm.domain ? '' : ' (renseignez le domaine)')) + '</li>'
          + (sm.eng_ao ? '<li><b>' + sm.eng_ao + '</b> marché filaire (appel d’offres ou contrat)</li>' : '')
          + (sm.eng_chat ? '<li><b>' + sm.eng_chat + '</b> chat sur le site</li>' : '')
          + (sm.eng_clics ? '<li><b>' + sm.eng_clics + '</b> clics sur nos emails</li>' : '')
          + '</ul><div class="crm-meta" style="margin-top:6px">Un échange perd la moitié de sa valeur en 60 jours, une visite ou un chat en 30 jours ; revenir plusieurs semaines compte en plus. Un appel d’offres filaire ouvert compte plein. Nos propres envois ne comptent pas.</div>'
          + (sm.n_market_recent ? '<div class="crm-buys">' + (sm.n_market_tethered ? '<span class="crm-buy crm-buy-t">Achat filaire</span> ' : '<span class="crm-buy">Achat drone</span> ') + sm.n_market_recent + ' marché' + (sm.n_market_recent > 1 ? 's' : '') + ' drone en 12 mois' + (sm.n_market_tethered ? ', dont ' + sm.n_market_tethered + ' filaire' + (sm.n_market_tethered > 1 ? 's' : '') : '') + ' (compte dans la priorité)</div>' : '')
          + '</div></aside>'
        : '<div class="crm-card"><h3>Engagement <span class="crm-meta">90 jours</span></h3><div class="crm-score-big">' + heatBadge(sm.score, sm.heat) + '</div>'
          + '<ul class="crm-score-list"><li>Actions et activités sur les contacts</li>'
          + '<li>' + (sm.web_pages_90d ? '<b>' + sm.web_pages_90d + '</b> page' + (sm.web_pages_90d > 1 ? 's' : '') + ' vue' + (sm.web_pages_90d > 1 ? 's' : '') + ' sur elistair.com' : 'Pas de visite rattachée' + (sm.domain ? '' : ' (renseignez le domaine)')) + '</li>'
          + (sm.chats_90d ? '<li><b>' + sm.chats_90d + '</b> conversation' + (sm.chats_90d > 1 ? 's' : '') + ' sur le chat du site</li>' : '')
          + '</ul></div></aside>')
      // ── colonne centrale : composer + timeline
      + '<main class="crm-rec-main"><div id="crm-brief"></div><div class="crm-card crm-composer" id="crm-composer"></div>'
      + '<div class="crm-card"><h3>Historique <span class="crm-tl-filters" role="tablist">'
      + [['all', 'Tout'], ['act', 'Activités'], ['note', 'Notes'], ['sys', 'Modifications']].map(function (x) { return '<button type="button" class="crm-chip sm' + (S.tlFilter === x[0] ? ' on' : '') + '" data-tlf="' + x[0] + '">' + x[1] + '</button>'; }).join('')
      + '</span></h3><div id="crm-tl">' + timelineHtml(filterTl(A.timeline), true) + '</div></div></main>'
      // ── colonne droite : comité d'achat, tâches, contacts, web
      + '<aside class="crm-rec-right">'
      + '<div class="crm-card"><h3>Comité d’achat <span class="crm-meta">' + (sm.coverage || 0) + ' / 4 rôles</span></h3>'
      + KEY_ROLES.map(function (r) {
        var list = byRole[r] || [];
        return '<div class="crm-com"><div class="crm-com-h"><span class="crm-role r-' + r + '">' + ROLE_LABEL[r] + '</span><span class="crm-meta">' + esc(ROLE_HINT[r]) + '</span></div>'
          + (list.length ? list.map(contactLine).join('') : '<button type="button" class="crm-com-miss" data-addrole="' + r + '">' + ICON.plus + ' Trouver ou ajouter un ' + ROLE_LABEL[r].toLowerCase() + '</button>') + '</div>';
      }).join('')
      + (others.length ? '<div class="crm-com"><div class="crm-com-h"><span class="crm-role none">Autres</span><span class="crm-meta">rôle à préciser</span></div>' + others.map(contactLine).join('') + '</div>' : '')
      + '</div>'
      + '<div class="crm-card"><h3>Comptes rattachés <span class="crm-meta">' + (A.children || []).length + '</span></h3>'
      + ((A.children || []).length ? A.children.map(function (c) { return '<button type="button" class="crm-mini" data-acc="' + esc(c.id) + '">' + tierBadge(c.tier) + '<span class="m"><b>' + esc(c.nom) + '</b><span>' + esc(c.pays || '') + '</span></span></button>'; }).join('') : '<div class="crm-meta">Aucun compte rattaché.</div>')
      + '<div id="crm-child-pick" style="margin-top:8px"></div></div>'
      + '<div class="crm-card"><h3>Tâches <span class="crm-meta">' + openTasks.length + ' ouverte' + (openTasks.length > 1 ? 's' : '') + '</span></h3>'
      + (openTasks.length ? openTasks.map(taskHtml).join('') : '<div class="crm-meta">Aucune tâche ouverte.</div>')
      + (doneTasks.length ? '<details style="margin-top:8px"><summary class="crm-meta" style="cursor:pointer">' + doneTasks.length + ' terminée' + (doneTasks.length > 1 ? 's' : '') + '</summary>' + doneTasks.map(taskHtml).join('') + '</details>' : '')
      + '</div>'
      + (A.veille && A.veille.length ? '<div class="crm-card"><h3>Veille drone filaire <span class="crm-meta">' + A.veille.length + '</span></h3>' + A.veille.map(function (h) { return veilleHit(h, false); }).join('') + '<div class="crm-meta" style="margin-top:6px">Repéré sur LinkedIn, les sites des concurrents et la presse. Compte dans l’engagement.</div></div>' : '')
      + (A.market && A.market.length ? '<div class="crm-card"><h3>Marchés <span class="crm-meta">' + A.market.length + '</span></h3>' + A.market.map(function (m) {
        var val = m.value_max ? (m.value_max >= 1e9 ? (m.value_max / 1e9).toFixed(1).replace('.', ',') + ' Md' : Math.round(m.value_max / 1e6) + ' M') : '';
        var label = esc(m.title || 'Sans titre');
        return '<div class="crm-webrow" style="align-items:flex-start;gap:8px"><span><span class="crm-q-kind k-' + (m.kind === 'tender' ? 'relance' : 'task') + '">' + (m.kind === 'tender' ? 'Appel d’offres' : 'Contrat') + '</span> '
          + (m.url ? '<a class="crm-link" href="' + esc(m.url) + '" target="_blank" rel="noopener">' + label + '</a>' : label)
          + '<br><span class="crm-meta">' + esc([m.buyer, val].filter(Boolean).join(' · ')) + '</span>'
          + (m.why ? '<br><span class="crm-meta">' + esc(m.why) + '</span>' : '') + '</span>'
          + '<span class="crm-meta" style="white-space:nowrap;text-align:right">' + (m.score != null ? '<span class="crm-ms-score s' + (m.score >= 5 ? 'hi' : 'mid') + '" title="Note sur 8">' + m.score + '/8</span><br>' : '') + esc(m.date ? fmtDate(m.date) : '') + '</span></div>';
      }).join('') + '<div class="crm-meta" style="margin-top:6px">Seuls les marchés notés 3 sur 8 et plus s’affichent ici. Rattachés par le nom de l’acheteur.</div></div>' : '')
      + (A.web && A.web.length ? '<div class="crm-card"><h3>Pages vues <span class="crm-meta">elistair.com</span></h3>' + A.web.map(function (w) {
        return '<div class="crm-webrow"><span>' + esc(w.title && w.title !== 'Elistair' ? w.title : w.path) + '</span><span class="crm-meta">' + esc(relTime(w.ts)) + '</span></div>';
      }).join('') + '</div>' : '')
      + '</aside></div>';

    // liaisons
    document.getElementById('crm-back').onclick = backToList;
    d.querySelectorAll('.crm-crumbs [data-acc], .crm-parent [data-acc], .crm-mini[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
    var setParent = function (pid) {
      return api('/crm/accounts/' + encodeURIComponent(a.id), { method: 'PATCH', body: { parent_id: pid } })
        .then(function () { S.treeData = null; toast(pid ? 'Compte rattaché' : 'Compte détaché'); return reloadAccount(); })
        .catch(function (e) { toast('Erreur : ' + e.message); });
    };
    loadOrg(a.id);
    var pp = document.getElementById('crm-parent-pick');
    var mountParent = function () { pp.hidden = false; acctPicker(pp, { placeholder: 'Rattacher à… (ex. ministère, direction)', exclude: [a.id], onPick: function (x) { setParent(x.id); }, focus: !!sm.parent_id }); };
    if (!sm.parent_id) mountParent();
    var pe = document.getElementById('crm-parent-edit'); if (pe) pe.onclick = mountParent;
    var pc = document.getElementById('crm-parent-clear'); if (pc) pc.onclick = function () { setParent(null); };
    d.querySelectorAll('[data-ign]').forEach(function (b) {
      b.onclick = function () { api('/crm/veille/' + b.getAttribute('data-ign') + '/action', { method: 'POST', body: { action: 'ignore' } }).then(function () { var row = b.closest('.crm-vh'); if (row) row.remove(); toast('Signal ignoré'); }).catch(function (e) { toast('Erreur : ' + e.message); }); };
    });
    acctPicker(document.getElementById('crm-child-pick'), { placeholder: '+ Rattacher un compte à celui-ci', exclude: [a.id].concat((A.children || []).map(function (c) { return c.id; })), onPick: function (x) {
      api('/crm/accounts/' + encodeURIComponent(x.id), { method: 'PATCH', body: { parent_id: a.id } })
        .then(function () { S.treeData = null; toast(x.nom + ' rattaché'); return reloadAccount(); }).catch(function (e) { toast('Erreur : ' + e.message); });
    } });
    bindFields(document.getElementById('crm-acc-fields'), fields, function (k, v) {
      if (k == null) { drawAccount(); return; }
      var body = {}; body[k] = v === '' ? null : v;
      api('/crm/accounts/' + encodeURIComponent(a.id), { method: 'PATCH', body: body })
        .then(function () { toast('Enregistré'); return reloadAccount(); })
        .catch(function (e) { toast('Erreur : ' + e.message); drawAccount(); });
    });
    d.querySelectorAll('[data-compose]').forEach(function (b) { b.onclick = function () { drawComposer(b.getAttribute('data-compose'), true); }; });
    drawComposer(S.composeMode || 'activity', false);
    document.getElementById('crm-brief-btn').onclick = function () { loadBrief(a.id, false); };
    if (S.briefFor === a.id && S.brief) drawBrief(S.brief);
    d.querySelectorAll('[data-tlf]').forEach(function (b) {
      b.onclick = function () {
        S.tlFilter = b.getAttribute('data-tlf');
        d.querySelectorAll('[data-tlf]').forEach(function (x) { x.classList.toggle('on', x === b); });
        document.getElementById('crm-tl').innerHTML = timelineHtml(filterTl(A.timeline), true); bindTimeline(d, reloadAccount);
      };
    });
    bindTimeline(d, reloadAccount);
    bindTasks(d, reloadAccount);
    d.querySelectorAll('[data-ct]').forEach(function (el) {
      el.onclick = function (e) { e.stopPropagation(); openContact(el.getAttribute('data-ct')); };
      el.onkeydown = function (e) { if (e.key === 'Enter') openContact(el.getAttribute('data-ct')); };
    });
    d.querySelectorAll('[data-addrole]').forEach(function (b) { b.onclick = function () { addContactDialog(a, b.getAttribute('data-addrole')); }; });
    document.getElementById('crm-add-contact').onclick = function () { addContactDialog(a, ''); };
    var lg = document.getElementById('crm-legacy');
    if (lg) lg.onclick = function () { go('end-users', { legacy: true }); setTimeout(function () { window._legacyOpenEndUser(a.id); }, 300); };
  }

  function contactLine(c) {
    var last = c.last_action_type ? (ACTION_LABEL[c.last_action_type] || c.last_action_type) + ' ' + relTime(c.last_action_at) : 'Jamais contacté';
    return '<div class="crm-ct" data-ct="' + esc(c.id) + '" role="button" tabindex="0"><span class="crm-avatar">' + esc(initials(personName(c))) + '</span><div style="min-width:0;flex:1">'
      + '<div class="crm-ct-name">' + esc(personName(c)) + (c.buying_role ? '' : (c.role ? ' <span class="crm-guess" title="Rôle déduit du titre, à confirmer sur la fiche contact">?</span>' : '')) + '</div>'
      + '<div class="crm-ct-sub">' + esc(c.titre || 'Titre inconnu') + '</div>'
      + '<div class="crm-ct-sub">' + (c.email ? '<span class="crm-dot ' + esc(c.email_status || '') + '" title="Email : ' + esc(c.email_status || 'non vérifié') + '"></span>' : '<span class="crm-dot" title="Pas d’email"></span>') + esc(last) + '</div></div></div>';
  }

  function filterTl(tl) {
    if (S.tlFilter === 'all') return tl;
    return tl.filter(function (t) {
      var sys = t.src === 'event' && ['owner', 'status', 'field', 'contact_added'].indexOf(t.kind) >= 0;
      var note = t.src === 'event' && t.kind === 'note';
      if (S.tlFilter === 'sys') return sys;
      if (S.tlFilter === 'note') return note;
      return !sys && !note;
    });
  }

  // Composer : activité / note / tâche
  // Dictée : reconnaissance vocale du navigateur (Chrome, Edge, Safari récents). Le texte s'ajoute à la zone de saisie.
  var SPEECH = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  var ICON_MIC = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><rect x="5.5" y="1.5" width="5" height="8.5" rx="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M3 7.5a5 5 0 0010 0M8 12.5v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  var REC = null;
  function stopDictation() { if (REC) { try { REC.stop(); } catch (e) {} } }
  function toggleDictation(ta, btn) {
    if (REC) { stopDictation(); return; }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
    var rec = new SR(); REC = rec;
    rec.lang = (document.documentElement.lang || 'fr').slice(0, 2) === 'en' ? 'en-GB' : 'fr-FR';
    rec.continuous = true; rec.interimResults = true;
    var base = ta.value ? ta.value.replace(/\s*$/, '') + ' ' : '';
    rec.onresult = function (e) {
      var fin = '', tmp = '';
      for (var i = 0; i < e.results.length; i++) { var r = e.results.item(i); if (r.isFinal) fin += r.item(0).transcript; else tmp += r.item(0).transcript; }
      ta.value = base + fin + tmp;
    };
    var end = function () { REC = null; btn.classList.remove('rec'); btn.setAttribute('aria-pressed', 'false'); btn.innerHTML = ICON_MIC + ' Dicter'; };
    rec.onend = end;
    rec.onerror = function (e) { end(); if (e.error === 'not-allowed') toast('Micro refusé : autorise-le dans le navigateur'); };
    try { rec.start(); btn.classList.add('rec'); btn.setAttribute('aria-pressed', 'true'); btn.innerHTML = ICON_MIC + ' Arrêter'; ta.focus(); } catch (e) { end(); }
  }

  function drawComposer(mode, focus) {
    var box = document.getElementById('crm-composer'); if (!box) return;
    S.composeMode = mode;
    var C = S.ctx === 'contact' ? S.contact : null;
    var A = S.ctx === 'account' ? S.account : null, a = A ? A.account : null;
    var contacts = A ? A.contacts : [];
    var F = S.facets;
    var tabs = '<div class="tabs" role="tablist">' + [['activity', 'Activité'], ['note', 'Note'], ['task', 'Tâche']].map(function (x) {
      return '<button type="button" role="tab" class="' + (mode === x[0] ? 'on' : '') + '" data-mode="' + x[0] + '">' + x[1] + '</button>';
    }).join('') + '</div>';
    var ctSelect = function (id) {
      if (C) return '';
      return '<select class="crm-sel" id="' + id + '" aria-label="Contact"><option value="">' + (contacts.length ? 'Contact (facultatif)' : 'Aucun contact') + '</option>'
        + contacts.map(function (c) { return opt(c.id, personName(c) + (c.titre ? ' · ' + c.titre : ''), ''); }).join('') + '</select>';
    };
    var html = tabs;
    if (mode === 'activity') {
      html += '<div class="crm-row" style="margin-bottom:8px">' + Object.keys(ACT_LABEL).map(function (k, i) { return '<button type="button" class="crm-chip sm' + (i === 0 ? ' on' : '') + '" data-atype="' + k + '">' + ACT_LABEL[k] + '</button>'; }).join('') + '</div>'
        + '<div class="crm-ta-wrap"><textarea class="crm-ta" id="crm-act-notes" placeholder="Compte rendu : tape ou dicte en vrac, Scout le remet au propre" aria-label="Compte rendu"></textarea>'
        + '<div class="crm-ta-tools">' + (SPEECH ? '<button type="button" class="crm-btn ghost sm" id="crm-act-mic" aria-pressed="false">' + ICON_MIC + ' Dicter</button>' : '')
        + '<button type="button" class="crm-btn ghost sm" id="crm-act-ai">Mettre au propre</button><span class="crm-meta" id="crm-act-ai-msg" role="status" aria-live="polite"></span></div></div>'
        + '<div class="foot"><span class="crm-row">' + ctSelect('crm-act-ct')
        + '<input class="crm-sel" type="date" id="crm-act-date" value="' + todayStr() + '" max="' + todayStr() + '" aria-label="Date">'
        + '<select class="crm-sel" id="crm-act-out" aria-label="Résultat"><option value="">Résultat</option><option value="positive">Positif</option><option value="neutral">Neutre</option><option value="negative">Négatif</option></select></span>'
        + '<button class="crm-btn primary" type="button" id="crm-act-save">Enregistrer</button></div>'
        + '<div class="crm-nextstep"><label class="crm-meta crm-row" style="gap:6px"><input type="checkbox" id="crm-act-follow"> Prochaine étape</label>'
        + '<input class="crm-input" id="crm-act-next" maxlength="300" placeholder="Ex. envoyer la fiche SAFE-T et caler une démo" aria-label="Prochaine étape">'
        + '<input class="crm-sel" type="date" id="crm-act-next-date" aria-label="Échéance de la prochaine étape (facultative)" title="Facultatif"></div>';
    } else if (mode === 'note') {
      html += '<textarea class="crm-ta" id="crm-note" placeholder="Info budget, organisation, contexte… (visible par toute l’équipe)" aria-label="Note"></textarea>'
        + '<div class="foot">' + (SPEECH ? '<button type="button" class="crm-btn ghost sm" id="crm-note-mic" aria-pressed="false">' + ICON_MIC + ' Dicter</button>' : '') + '<span class="crm-meta" style="margin-right:auto">Ctrl+Entrée pour enregistrer</span><button class="crm-btn primary" type="button" id="crm-note-save">Ajouter la note</button></div>';
    } else {
      html += '<input class="crm-input" id="crm-task-title" maxlength="300" placeholder="Ex. Rappeler le chef du service drones" aria-label="Tâche">'
        + '<div class="foot"><span class="crm-row">'
        + '<button type="button" class="crm-chip sm" data-due="' + addDays(1) + '">Demain</button><button type="button" class="crm-chip sm" data-due="' + addDays(7) + '">1 semaine</button><button type="button" class="crm-chip sm" data-due="' + addDays(30) + '">1 mois</button>'
        + '<input class="crm-sel" type="date" id="crm-task-due" aria-label="Échéance (facultative)" title="Facultatif">' + ctSelect('crm-task-ct') + '</span>'
        + '<select class="crm-sel" id="crm-task-owner" aria-label="Attribuer à">' + F.users.map(function (u) { return opt(u.id, u.name, (a && a.owner_user_id) || F.me.user_id); }).join('') + '</select>'
        + '<button class="crm-btn primary" type="button" id="crm-task-save">Créer la tâche</button></div>';
    }
    box.innerHTML = html;
    box.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { drawComposer(b.getAttribute('data-mode'), true); }; });
    var reload = C ? reloadContact : reloadAccount;
    var accId = C ? C.contact.end_user_id : a.id;
    var fixedCt = C ? C.contact.id : null;
    if (mode === 'activity') {
      var type = 'phone';
      box.querySelectorAll('[data-atype]').forEach(function (b) { b.onclick = function () { type = b.getAttribute('data-atype'); box.querySelectorAll('[data-atype]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
      var save = document.getElementById('crm-act-save');
      save.onclick = function () {
        var notes = document.getElementById('crm-act-notes').value.trim();
        var ct = fixedCt || (document.getElementById('crm-act-ct') ? document.getElementById('crm-act-ct').value : '');
        var dv = document.getElementById('crm-act-date').value;
        var body = { type: type, notes: notes, outcome: document.getElementById('crm-act-out').value || null };
        if (dv && dv !== todayStr()) body.date = dv + 'T12:00:00';
        if (ct) body.contact_id = ct; else body.end_user_id = accId;
        if (!body.end_user_id && !body.contact_id) { toast('Ce contact n’est rattaché à aucun compte'); return; }
        var follow = document.getElementById('crm-act-follow').checked;
        var nextTitle = (document.getElementById('crm-act-next').value || '').trim() || ('Relancer après ' + ACT_LABEL[type].toLowerCase());
        var nextDate = document.getElementById('crm-act-next-date').value || null;
        save.disabled = true; stopDictation();
        api('/crm/activities', { method: 'POST', body: body }).then(function () {
          if (!follow) return null;
          return api('/crm/tasks', { method: 'POST', body: { title: nextTitle, due_date: nextDate, end_user_id: accId || null, contact_id: ct || null } });
        }).then(function () { toast(follow ? 'Activité et prochaine étape enregistrées' : 'Activité enregistrée'); return reload(); })
          .catch(function (e) { toast('Erreur : ' + e.message); save.disabled = false; });
      };
      var ta = document.getElementById('crm-act-notes');
      document.getElementById('crm-act-next').oninput = function () { document.getElementById('crm-act-follow').checked = !!this.value.trim(); };
      var mic = document.getElementById('crm-act-mic'); if (mic) mic.onclick = function () { toggleDictation(ta, mic); };
      document.getElementById('crm-act-ai').onclick = function () {
        var raw = ta.value.trim(), m = document.getElementById('crm-act-ai-msg'), btn = this;
        if (raw.length < 5) { m.textContent = 'Tape ou dicte d’abord quelques mots.'; ta.focus(); return; }
        stopDictation(); btn.disabled = true; m.textContent = 'Mise au propre…';
        var ct = fixedCt || (document.getElementById('crm-act-ct') ? document.getElementById('crm-act-ct').value : '');
        api('/assist/activity-note', { method: 'POST', body: { text: raw, type: type, end_user_id: accId || null, contact_id: ct || null } }).then(function (r) {
          S.rawNote = raw; ta.value = r.notes || raw;
          if (r.outcome) document.getElementById('crm-act-out').value = r.outcome;
          if (r.next_step) { document.getElementById('crm-act-next').value = r.next_step; document.getElementById('crm-act-follow').checked = true; }
          if (r.next_date) document.getElementById('crm-act-next-date').value = r.next_date;
          m.innerHTML = 'Relis avant d’enregistrer. <button type="button" class="crm-link" id="crm-act-undo">Revenir au texte d’origine</button>';
          document.getElementById('crm-act-undo').onclick = function () { ta.value = S.rawNote || ''; m.textContent = ''; };
        }).catch(function (e) { m.textContent = 'Erreur : ' + e.message; }).then(function () { btn.disabled = false; });
      };
      if (focus) ta.focus();
    } else if (mode === 'note') {
      var nb = document.getElementById('crm-note-save'), ta = document.getElementById('crm-note');
      nb.onclick = function () {
        var v = ta.value.trim(); if (!v) { ta.focus(); return; }
        if (!accId) { toast('Rattachez d’abord ce contact à un compte'); return; }
        nb.disabled = true;
        api('/crm/accounts/' + encodeURIComponent(accId) + '/notes', { method: 'POST', body: { body: v, contact_id: fixedCt } })
          .then(function () { toast('Note ajoutée'); return reload(); }).catch(function (e) { toast('Erreur : ' + e.message); nb.disabled = false; });
      };
      ta.onkeydown = function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) nb.click(); };
      var nmic = document.getElementById('crm-note-mic'); if (nmic) nmic.onclick = function () { toggleDictation(ta, nmic); };
      if (focus) ta.focus();
    } else {
      box.querySelectorAll('[data-due]').forEach(function (b) { b.onclick = function () { document.getElementById('crm-task-due').value = b.getAttribute('data-due'); }; });
      var tb = document.getElementById('crm-task-save'), ti = document.getElementById('crm-task-title');
      tb.onclick = function () {
        var title = ti.value.trim(); if (!title) { ti.focus(); return; }
        var ct = fixedCt || (document.getElementById('crm-task-ct') ? document.getElementById('crm-task-ct').value : '');
        tb.disabled = true;
        api('/crm/tasks', { method: 'POST', body: { title: title, due_date: document.getElementById('crm-task-due').value || null, end_user_id: accId || null, contact_id: ct || null, owner_user_id: document.getElementById('crm-task-owner').value } })
          .then(function () { toast('Tâche créée'); return reload(); }).catch(function (e) { toast('Erreur : ' + e.message); tb.disabled = false; });
      };
      ti.onkeydown = function (e) { if (e.key === 'Enter') tb.click(); };
      if (focus) ti.focus();
    }
    if (focus) box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function addContactDialog(a, role) {
    var inner = '<div class="crm-form">'
      + '<div class="crm-form-2"><label>Prénom<input class="crm-input" id="nc-prenom"></label><label>Nom<input class="crm-input" id="nc-nom"></label></div>'
      + '<label>Titre / fonction<input class="crm-input" id="nc-titre" placeholder="Ex. Chef du service drones"></label>'
      + '<label>Rôle dans le comité<select class="crm-sel" id="nc-role" style="max-width:none">' + opt('', 'À préciser', role) + Object.keys(ROLE_LABEL).map(function (r) { return opt(r, ROLE_LABEL[r], role); }).join('') + '</select></label>'
      + '<label>Email<input class="crm-input" id="nc-email" type="email" placeholder="' + esc(a.domain ? 'prenom.nom@' + a.domain : '') + '"></label>'
      + '<div class="crm-form-2"><label>Téléphone<input class="crm-input" id="nc-tel"></label><label>LinkedIn<input class="crm-input" id="nc-li" placeholder="URL du profil"></label></div>'
      + '<div class="crm-meta">N’inventez pas d’email : laissez vide si vous ne l’avez pas, il pourra être vérifié plus tard.</div></div>';
    popup('Ajouter un contact à ' + a.nom, inner, function (pop) {
      var v = function (id) { return pop.querySelector('#' + id).value.trim(); };
      if (!v('nc-nom') && !v('nc-prenom')) { toast('Nom requis'); return false; }
      return api('/crm/contacts', { method: 'POST', body: { end_user_id: a.id, prenom: v('nc-prenom'), nom: v('nc-nom'), titre: v('nc-titre'), buying_role: v('nc-role') || null, email: v('nc-email') || null, telephone: v('nc-tel') || null, linkedin: v('nc-li') || null } })
        .then(function () { toast('Contact ajouté'); return reloadAccount(); })
        .catch(function (e) {
          if (e.status === 409 && e.data && e.data.contact_id && confirm(e.message + '. Ouvrir ce contact ?')) { openContact(e.data.contact_id); return; }
          throw e;
        });
    }, 'Ajouter');
  }

  function timelineHtml(tl, showContact) {
    if (!tl.length) return '<div class="crm-meta">Rien à afficher. Saisissez une activité ou une note.</div>';
    var out = [], lastDay = '';
    var me = S.facets && S.facets.me;
    tl.forEach(function (t) {
      var day = dayLabel(t.at);
      if (day !== lastDay) { out.push('<div class="crm-tl-day">' + esc(day) + '</div>'); lastDay = day; }
      var ic = ICON.dot, cls = '', title = '', body = t.body ? '<div class="txt">' + esc(t.body) + '</div>' : '';
      var who = esc(t.author || 'Scout') + ' · ' + esc(new Date(t.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      var ct = (showContact && t.contact_name) ? ' avec <button type="button" class="crm-link" data-ct="' + esc(t.contact_id) + '">' + esc(t.contact_name) + '</button>' : '';
      var outcome = t.outcome ? ' <span class="crm-out o-' + esc(t.outcome) + '">' + esc(OUTCOME_LABEL[t.outcome] || t.outcome) + '</span>' : '';
      var canDel = false;
      if (t.src === 'event') {
        var p = t.payload || {};
        if (t.kind === 'note') { ic = ICON.note; cls = 'k-note'; title = 'Note' + ct; canDel = true; }
        else if (t.kind === 'activity') { ic = p.type === 'phone' ? ICON.phone : (p.type === 'in_person' ? ICON.meet : ICON.chat); cls = 'k-out'; title = esc(ACT_LABEL[p.type] || 'Activité') + (p.outcome ? ' <span class="crm-out o-' + esc(p.outcome) + '">' + esc(OUTCOME_LABEL[p.outcome]) + '</span>' : ''); canDel = true; }
        else if (t.kind === 'owner') { ic = ICON.user; cls = 'k-sys'; title = 'Propriétaire : ' + esc(p.from || 'personne') + ' → <b>' + esc(p.to || 'personne') + '</b>'; }
        else if (t.kind === 'status') { ic = ICON.flag; cls = 'k-sys'; title = 'Statut : ' + esc(p.from === 'auto' ? 'automatique' : (STATUS_LABEL[p.from] || p.from)) + ' → <b>' + esc(p.to === 'auto' ? 'automatique' : (STATUS_LABEL[p.to] || p.to)) + '</b>'; }
        else if (t.kind === 'field') {
          ic = ICON.edit; cls = 'k-sys';
          var lbl = p.field === 'buying_role' ? 'Rôle' : (p.label || p.field);
          var fmt = function (v) { if (v == null || v === '') return 'vide'; if (p.field === 'buying_role') return ROLE_LABEL[v] || v; if (p.field === 'tier') return 'Tier ' + v; if (p.field === 'next_step_date') return fmtDate(v); return v; };
          title = (p.contact && showContact ? esc(p.contact) + ' : ' : '') + esc(lbl) + (p.field === 'description' ? ' modifiée' : ' : ' + esc(fmt(p.from)) + ' → <b>' + esc(fmt(p.to)) + '</b>');
        }
        else if (t.kind === 'contact_added') { ic = ICON.plus; cls = 'k-sys'; title = 'Contact ajouté : <b>' + esc(p.contact || t.contact_name || '') + '</b>'; }
        else if (t.kind === 'task_done') { ic = ICON.check; cls = 'k-pos'; title = 'Tâche terminée' + ct; }
        else { title = esc(t.kind); }
      } else {
        var k = t.kind;
        title = esc(ACTION_LABEL[k] || k) + ct + outcome;
        if (k === 'email' || k === 'email_bounced') { ic = ICON.mail; cls = k === 'email' ? 'k-out' : 'k-neg'; }
        else if (k.indexOf('linkedin') === 0) { ic = ICON.chat; cls = 'k-out'; }
        else if (k === 'phone' || k === 'call') { ic = ICON.phone; cls = 'k-out'; }
        else if (k === 'in_person' || k === 'meeting') { ic = ICON.meet; cls = 'k-out'; }
        else if (k === 'reply_positive' || k === 'already_client') { ic = ICON.check; cls = 'k-pos'; }
        else if (k === 'reply_negative' || k === 'not_relevant') { ic = ICON.x; cls = 'k-neg'; }
        else if (k === 'transmitted_crm') { ic = ICON.send; cls = 'k-sys'; }
        if (t.subject) body = '<div class="subj">« ' + esc(t.subject) + ' »</div>' + body;
      }
      canDel = canDel && me && (me.role === 'admin' || t.author === me.name);
      out.push('<div class="crm-tl-item"><span class="crm-tl-ic ' + cls + '" aria-hidden="true">' + ic + '</span><div class="crm-tl-body"><div>' + title + '</div><div class="who">' + who + '</div>' + body + '</div>'
        + (canDel ? '<button type="button" class="crm-tl-del" data-delev="' + esc(t.id) + '" title="Supprimer" aria-label="Supprimer">×</button>' : '') + '</div>');
    });
    return out.join('');
  }

  function bindTimeline(root, reload) {
    root.querySelectorAll('#crm-tl [data-ct]').forEach(function (el) { el.onclick = function (e) { e.stopPropagation(); openContact(el.getAttribute('data-ct')); }; });
    root.querySelectorAll('[data-delev]').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('Supprimer cet élément de l’historique ?')) return;
        api('/crm/events/' + b.getAttribute('data-delev'), { method: 'DELETE' }).then(reload).catch(function (er) { toast('Erreur : ' + er.message); });
      };
    });
  }

  function taskHtml(t) {
    var sub = [];
    if (t.due_date) sub.push('<span class="' + (t.done_at ? '' : dueClass(t.due_date)) + '">' + esc(fmtDate(t.due_date)) + '</span>');
    if (t.owner_name && !(S.inTasksPanel && S.taskScope === 'me')) sub.push(esc(t.owner_name));
    if (t.contact_name) sub.push((t.contact_id ? '<button type="button" class="crm-link" data-tct="' + esc(t.contact_id) + '">' + esc(t.contact_name) + '</button>' : esc(t.contact_name)));
    if (t.account_nom) sub.push('<button type="button" class="crm-link" data-tacc="' + esc(t.end_user_id) + '">' + esc(t.account_nom) + '</button>');
    if (t.done_at) sub.push('fait ' + esc(relTime(t.done_at)) + (t.done_by ? ' par ' + esc(t.done_by) : ''));
    return '<div class="crm-task' + (t.done_at ? ' done' : '') + '"><input type="checkbox" data-task="' + esc(t.id) + '"' + (t.done_at ? ' checked' : '') + ' aria-label="Terminer : ' + esc(t.title) + '">'
      + '<div style="min-width:0;flex:1"><div class="t">' + esc(t.title) + '</div><div class="s">' + sub.join(' · ') + '</div></div>'
      + '<button type="button" class="del" data-deltask="' + esc(t.id) + '" title="Supprimer" aria-label="Supprimer la tâche">×</button></div>';
  }

  function bindTasks(root, after) {
    root.querySelectorAll('[data-task]').forEach(function (c) {
      c.onchange = function () {
        api('/crm/tasks/' + c.getAttribute('data-task'), { method: 'PATCH', body: { done: c.checked } })
          .then(function () { toast(c.checked ? 'Tâche terminée' : 'Tâche rouverte'); refreshBadge(); after(); })
          .catch(function (e) { toast('Erreur : ' + e.message); c.checked = !c.checked; });
      };
    });
    root.querySelectorAll('[data-deltask]').forEach(function (b) {
      b.onclick = function () {
        if (!confirm('Supprimer cette tâche ?')) return;
        api('/crm/tasks/' + b.getAttribute('data-deltask'), { method: 'DELETE' }).then(function () { refreshBadge(); after(); }).catch(function (e) { toast('Erreur : ' + e.message); });
      };
    });
    root.querySelectorAll('[data-tacc]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openAccount(b.getAttribute('data-tacc')); }; });
    root.querySelectorAll('[data-tct]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openContact(b.getAttribute('data-tct')); }; });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CONTACTS : LISTE + FICHE
  // ═════════════════════════════════════════════════════════════════════════
  function openContact(id) { if (id) go('people', { tab: encodeURIComponent(id) }); }

  function onPeoplePanel(opts) {
    var p = document.getElementById('panel-people'); if (!p) return;
    if (!document.getElementById('crm-plist')) {
      p.innerHTML = '<div class="crm-wrap" id="crm-plist"><div class="crm-bar"><div class="crm-toolbar" id="crm-ptoolbar"></div>'
        + '<div class="crm-views" id="crm-pviews" role="tablist" aria-label="Vues"></div>'
        + '<span class="crm-bar-r"><span class="crm-meta" id="crm-pcount" aria-live="polite"></span><span class="crm-menu" id="crm-pcols"></span><button class="crm-btn ghost sm" id="crm-pexport" type="button" title="Exporter la liste en CSV">Exporter</button></span></div>'
        + '<div class="crm-fpanel" id="crm-pfpanel"></div>'
        + '<div class="crm-table-wrap"><table class="crm-table" id="crm-ptable"><thead></thead><tbody></tbody></table>'
        + '<div class="crm-more" id="crm-pmore" style="display:none"><button class="crm-btn" type="button" id="crm-pmore-btn">Afficher plus</button></div></div></div>'
        + '<div class="crm-wrap crm-record" id="crm-pdetail" style="display:none"></div>';
      document.getElementById('crm-pmore-btn').onclick = function () { fetchPeople(true); };
      document.getElementById('crm-pexport').onclick = exportPeople;
      colsMenu(document.getElementById('crm-pcols'), '#crm-ptable', 'scout_cols_ppl', [['account', 'Compte'], ['role', 'Rôle'], ['email', 'Email'], ['owner', 'Propriétaire'], ['activity', 'Dernière activité']]);
    }
    var tab = opts && opts.tab;
    loadFacets().then(function () {
      renderPeopleToolbar();
      if (tab) { renderContactDetail(decodeURIComponent(tab)); if (!S.people.rows.length) fetchPeople(); }
      else { document.getElementById('crm-plist').style.display = ''; document.getElementById('crm-pdetail').style.display = 'none'; S.contact = null; fetchPeople(); }
    }).catch(function (e) { p.innerHTML = '<div class="crm-wrap"><div class="crm-empty">Erreur : ' + esc(e.message) + '</div></div>'; });
  }

  function renderPeopleToolbar() {
    var el = document.getElementById('crm-ptoolbar'); if (!el) return;
    var f = S.people.filters, F = S.facets;
    var sel = function (key, label, options) { return '<select class="crm-sel' + (f[key] ? ' set' : '') + '" data-pf="' + key + '" aria-label="' + esc(label) + '">' + opt('', label, f[key]) + options + '</select>'; };
    var nf = Object.keys(f).filter(function (k) { return k !== 'q' && f[k]; }).length;
    el.innerHTML = '<input class="crm-search" id="crm-pq" type="search" placeholder="Rechercher un nom, un email, un titre, un compte…" aria-label="Rechercher" value="' + esc(f.q || '') + '">'
      + '<button type="button" class="crm-chip sm crm-filters-btn' + (nf ? ' set' : '') + '" id="crm-pfilters-btn" aria-expanded="' + !!S.pFiltersOpen + '" aria-controls="crm-pfpanel">Filtres' + (nf ? ' · ' + nf : '') + '</button>';
    // Vues rapides : un clic remplace les filtres.
    var PV = [['all', 'Tous', {}], ['mine', 'Mes comptes', { owner: 'me' }], ['dec', 'Décideurs', { role: 'decideur' }], ['never', 'Jamais contactés', { activity: 'never' }]];
    var fkey = JSON.stringify(sortObj(Object.assign({}, f, { q: '' })));
    var vEl = document.getElementById('crm-pviews');
    if (vEl) {
      vEl.innerHTML = PV.map(function (v) { var on = JSON.stringify(sortObj(v[2])) === fkey; return '<button type="button" role="tab" aria-selected="' + on + '" class="crm-chip sm' + (on ? ' on' : '') + '" data-pv="' + v[0] + '">' + v[1] + '</button>'; }).join('');
      vEl.querySelectorAll('[data-pv]').forEach(function (b) { b.onclick = function () {
        var v = PV.filter(function (x) { return x[0] === b.getAttribute('data-pv'); })[0];
        S.people.filters = Object.assign(f.q ? { q: f.q } : {}, v[2]); lsSet('scout_crm_pfilters', S.people.filters); renderPeopleToolbar(); fetchPeople();
      }; });
    }
    var fp = document.getElementById('crm-pfpanel');
    fp.innerHTML = '<div class="crm-fsel">'
      + sel('role', 'Rôle', Object.keys(ROLE_LABEL).map(function (r) { return opt(r, ROLE_LABEL[r], f.role); }).join('') + opt('none', 'Rôle inconnu', f.role))
      + sel('owner', 'Propriétaire du compte', opt('me', 'Mes comptes', f.owner) + opt('none', 'Sans propriétaire', f.owner) + F.users.map(function (u) { return opt(u.id, u.name, f.owner); }).join(''))
      + sel('tier', 'Tier du compte', opt('1', 'Tier 1', f.tier) + opt('2', 'Tier 2', f.tier) + opt('3', 'Tier 3', f.tier))
      + sel('activity', 'Activité', opt('30', 'Moins de 30 j', f.activity) + opt('never', 'Jamais contacté', f.activity))
      + sel('account', 'Compte', opt('with', 'Rattaché à un compte', f.account) + opt('without', 'Sans compte', f.account))
      + sel('email', 'Email', opt('none', 'Sans email', f.email))
      + (nf ? '<button type="button" class="crm-link" id="crm-preset">Effacer les filtres</button>' : '') + '</div>';
    fp.insertAdjacentHTML('beforeend', activeChips(f, fp));
    fp.classList.toggle('open', !!S.pFiltersOpen);
    fp.classList.toggle('has-active', !!nf);
    var rs = document.getElementById('crm-preset'); if (rs) rs.onclick = function () { S.people.filters = f.q ? { q: f.q } : {}; lsSet('scout_crm_pfilters', S.people.filters); renderPeopleToolbar(); fetchPeople(); };
    fp.querySelectorAll('[data-rmpf]').forEach(function (b) { b.onclick = function () { setPFilter(b.getAttribute('data-rmpf'), ''); }; });
    document.getElementById('crm-pfilters-btn').onclick = function () { S.pFiltersOpen = !S.pFiltersOpen; fp.classList.toggle('open', S.pFiltersOpen); this.setAttribute('aria-expanded', S.pFiltersOpen); };
    var t;
    document.getElementById('crm-pq').oninput = function (e) { clearTimeout(t); var v = e.target.value.trim(); t = setTimeout(function () { setPFilter('q', v); }, 300); };
    fp.querySelectorAll('[data-pf]').forEach(function (s) { s.onchange = function () { setPFilter(s.getAttribute('data-pf'), s.value); }; });
  }
  function setPFilter(k, v) {
    if (v) S.people.filters[k] = v; else delete S.people.filters[k];
    lsSet('scout_crm_pfilters', S.people.filters);
    renderPeopleToolbar(); fetchPeople();
    var q = document.getElementById('crm-pq'); if (q && k === 'q') { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  function peopleQuery(offset, limit) {
    var p = new URLSearchParams(); var f = S.people.filters;
    Object.keys(f).forEach(function (k) { if (f[k]) p.set(k, f[k]); });
    p.set('sort', S.people.sort.sort); p.set('dir', S.people.sort.dir); p.set('limit', limit || PAGE); p.set('offset', offset || 0);
    return p.toString();
  }
  var pSeq = 0;
  function fetchPeople(more) {
    var seq = ++pSeq, P = S.people;
    var tb = document.querySelector('#crm-ptable tbody');
    if (!more && tb) tb.innerHTML = '<tr><td colspan="7" class="crm-empty">Chargement…</td></tr>';
    return api('/crm/contacts?' + peopleQuery(more ? P.rows.length : 0)).then(function (d) {
      if (seq !== pSeq) return;
      P.rows = more ? P.rows.concat(d.contacts) : d.contacts; P.total = d.total; renderPeople();
    }).catch(function (e) { if (tb) tb.innerHTML = '<tr><td colspan="7" class="crm-empty">Erreur : ' + esc(e.message) + '</td></tr>'; });
  }
  function renderPeople() {
    var P = S.people, th = document.querySelector('#crm-ptable thead'), tb = document.querySelector('#crm-ptable tbody'); if (!th) return;
    var cols = [['nom', 'Contact', 1], ['account', 'Compte', 1], ['role', 'Rôle', 1], ['email', 'Email', 0], ['owner', 'Propriétaire', 0], ['last_activity', 'Dernière activité', 0]];
    th.innerHTML = '<tr>' + cols.map(function (c) {
      var sortable = c[0] !== 'email' && c[0] !== 'owner', on = P.sort.sort === c[0];
      return '<th class="c-' + (c[0] === 'last_activity' ? 'activity' : c[0]) + (sortable ? ' sortable" data-psort="' + c[0] + '" data-asc="' + c[2] : '') + '">' + c[1] + (on ? '<span class="arr">' + (P.sort.dir === 'asc' ? '▲' : '▼') + '</span>' : '') + '</th>';
    }).join('') + '</tr>';
    th.querySelectorAll('[data-psort]').forEach(function (h) {
      h.onclick = function () { var s = h.getAttribute('data-psort'); P.sort = { sort: s, dir: P.sort.sort === s ? (P.sort.dir === 'asc' ? 'desc' : 'asc') : (h.getAttribute('data-asc') === '1' ? 'asc' : 'desc') }; fetchPeople(); };
    });
    document.getElementById('crm-pcount').textContent = P.total.toLocaleString('fr-FR') + ' contact' + (P.total > 1 ? 's' : '');
    tb.innerHTML = P.rows.length ? P.rows.map(function (c) {
      return '<tr data-pid="' + esc(c.id) + '"><td class="c-nom"><div class="crm-acc-name" title="' + esc(personName(c)) + '">' + esc(personName(c)) + '</div><div class="crm-acc-sub" title="' + esc(c.titre || '') + '">' + esc(c.titre || '') + '</div></td>'
        + '<td class="c-account">' + (c.end_user_id ? tierBadge(c.tier) + ' <button type="button" class="crm-link" data-pacc="' + esc(c.end_user_id) + '" title="' + esc(c.account_nom || c.organisation || '') + '">' + esc(c.account_nom || c.organisation || '') + '</button>' : '<span class="crm-muted">' + esc(c.organisation || 'Sans compte') + '</span>') + '</td>'
        + '<td class="c-role">' + rolePill(c.role, !!c.buying_role) + '</td>'
        + '<td class="c-email">' + (c.email ? esc(c.email) : '<span class="crm-muted">Aucun</span>') + '</td>'
        + '<td class="c-owner">' + (c.owner_name ? esc(c.owner_name) : '<span class="crm-muted">Personne</span>') + '</td>'
        + '<td class="c-activity">' + (c.last_action_at ? esc((ACTION_LABEL[c.last_action_type] || '') + ' ' + relTime(c.last_action_at)) : '<span class="crm-muted">Jamais</span>') + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="crm-empty">Aucun contact ne correspond.</td></tr>';
    tb.querySelectorAll('[data-pid]').forEach(function (tr) { tr.onclick = function () { openContact(tr.getAttribute('data-pid')); }; });
    tb.querySelectorAll('[data-pacc]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openAccount(b.getAttribute('data-pacc')); }; });
    var more = document.getElementById('crm-pmore'); if (more) more.style.display = P.rows.length < P.total ? 'flex' : 'none';
  }
  function exportPeople() {
    var all = [], off = 0;
    var step = function () {
      return api('/crm/contacts?' + peopleQuery(off, 500)).then(function (d) {
        all = all.concat(d.contacts); off += d.contacts.length;
        if (d.contacts.length && off < d.total && off < 5000) return step();
        downloadCsv(['Prénom', 'Nom', 'Titre', 'Rôle', 'Rôle confirmé', 'Email', 'Pays', 'Compte', 'Tier', 'Propriétaire', 'Dernière activité', 'ID Scout'],
          all.map(function (c) { return [c.prenom, c.nom, c.titre, ROLE_LABEL[c.role] || '', c.buying_role ? 'oui' : 'non', c.email, c.pays, c.account_nom || c.organisation, c.tier || '', c.owner_name || '', c.last_action_at ? String(c.last_action_at).slice(0, 10) : '', c.id]; }), 'scout-contacts');
        toast(all.length + ' contacts exportés');
      });
    };
    step().catch(function (e) { toast('Erreur export : ' + e.message); });
  }

  // Les deux fiches partagent des identifiants (composer, historique) : une seule fiche vit dans le DOM à la fois.
  function clearOtherRecord(keep) {
    var other = document.getElementById(keep === 'contact' ? 'crm-detail' : 'crm-pdetail');
    if (other && other.innerHTML) { other.innerHTML = ''; other.style.display = 'none'; var l = document.getElementById(keep === 'contact' ? 'crm-list' : 'crm-plist'); if (l) l.style.display = ''; }
    if (keep === 'contact') S.account = null; else S.contact = null;
  }

  function renderContactDetail(id) {
    clearOtherRecord('contact');
    var l = document.getElementById('crm-plist'), d = document.getElementById('crm-pdetail');
    l.style.display = 'none'; d.style.display = '';
    if (!S.contact || S.contact.contact.id !== id) d.innerHTML = '<button class="crm-back" type="button" id="crm-pback">← Contacts</button><div class="crm-empty">Chargement…</div>';
    var b = document.getElementById('crm-pback'); if (b) b.onclick = function () { history.length > 1 ? history.back() : go('people'); };
    window.scrollTo(0, 0);
    return api('/crm/contacts/' + encodeURIComponent(id)).then(function (r) { S.contact = r; drawContact(); })
      .catch(function (e) { d.innerHTML = '<button class="crm-back" type="button" id="crm-pback">← Contacts</button><div class="crm-empty">' + (e.status === 404 ? 'Ce contact n’existe plus.' : 'Erreur : ' + esc(e.message)) + '</div>'; document.getElementById('crm-pback').onclick = function () { go('people'); }; });
  }
  function reloadContact() {
    if (!S.contact) return Promise.resolve();
    return api('/crm/contacts/' + encodeURIComponent(S.contact.contact.id)).then(function (r) { S.contact = r; drawContact(); });
  }

  function drawContact() {
    var d = document.getElementById('crm-pdetail'), R = S.contact; if (!d || !R) return;
    var c = R.contact;
    S.ctx = 'contact';
    var fields = [
      { k: 'buying_role', label: 'Rôle dans le comité', type: 'select', value: c.buying_role || '', display: c.role ? rolePill(c.role, !!c.buying_role) + (c.buying_role ? '' : ' <span class="crm-muted">déduit du titre</span>') : null, placeholder: 'À préciser', options: [['', 'À préciser']].concat(Object.keys(ROLE_LABEL).map(function (r) { return [r, ROLE_LABEL[r]]; })) },
      { k: 'titre', label: 'Titre', type: 'text', value: c.titre, placeholder: 'Ajouter' },
      { k: 'prenom', label: 'Prénom', type: 'text', value: c.prenom },
      { k: 'nom', label: 'Nom', type: 'text', value: c.nom },
      { k: 'email', label: 'Email', type: 'text', value: c.email, display: c.email ? '<span class="crm-dot ' + esc(R.email_status || '') + '" title="' + esc(R.email_status || 'non vérifié') + '"></span>' + esc(c.email) : null, placeholder: 'Ajouter' },
      { k: 'telephone', label: 'Téléphone', type: 'text', value: c.telephone, placeholder: 'Ajouter' },
      { k: 'linkedin', label: 'LinkedIn', type: 'text', value: c.linkedin, display: c.linkedin ? '<a class="crm-link" href="' + safeUrl(c.linkedin) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">Profil LinkedIn</a>' : null, placeholder: 'Ajouter' },
      { k: 'pays', label: 'Pays', type: 'text', value: c.pays },
      { k: 'notes', label: 'Notes internes', type: 'textarea', value: c.notes, placeholder: 'Ajouter' }
    ];
    var openTasks = R.tasks.filter(function (t) { return !t.done_at; });
    d.innerHTML = '<button class="crm-back" type="button" id="crm-pback">← Contacts</button>'
      + '<div class="crm-rec-head"><div class="crm-rec-id"><span class="crm-avatar lg">' + esc(initials(personName(c))) + '</span><div style="min-width:0"><h2>' + esc(personName(c)) + '</h2>'
      + '<div class="crm-meta">' + esc(c.titre || 'Titre inconnu') + (c.end_user_id ? ' · <button type="button" class="crm-link" data-acc="' + esc(c.end_user_id) + '">' + esc(c.account_nom) + '</button>' : '') + '</div></div></div>'
      + '<div class="crm-rec-kpis"><div><span>Rôle</span>' + rolePill(c.role, !!c.buying_role) + '</div>'
      + '<div><span>Email</span><b>' + (c.email ? '<span class="crm-dot ' + esc(R.email_status || '') + '"></span>' + esc(R.email_status === 'valid' ? 'Vérifié' : (R.email_status === 'invalid' ? 'Invalide' : (R.email_status ? 'Incertain' : 'Non vérifié'))) : 'Aucun') + '</b></div>'
      + '<div><span>Dernière activité</span><b>' + (R.timeline[0] ? esc(relTime(R.timeline[0].at)) : 'Jamais') + '</b></div></div></div>'
      + '<div class="crm-actions">'
      + '<button type="button" class="crm-btn" data-compose="activity">' + ICON.phone + ' Saisir une activité</button>'
      + '<button type="button" class="crm-btn" data-compose="task">' + ICON.check + ' Tâche</button>'
      + (c.end_user_id ? '<button type="button" class="crm-btn" data-compose="note">' + ICON.note + ' Note</button>' : '')
      + (typeof window.openContactDetail === 'function' ? '<button type="button" class="crm-btn" id="crm-email-assist">' + ICON.mail + ' Rédiger un email</button>' : '')
      + (c.email ? '<button type="button" class="crm-btn ghost" id="crm-copy-email">Copier l’email</button>' : '')
      + '</div>'
      + '<div class="crm-rec-grid">'
      + '<aside class="crm-rec-left"><div class="crm-card"><h3>À propos</h3><dl class="crm-fields" id="crm-ct-fields">' + fields.map(fieldRow).join('') + '</dl></div></aside>'
      + '<main class="crm-rec-main"><div class="crm-card crm-composer" id="crm-composer"></div>'
      + '<div class="crm-card"><h3>Historique</h3><div id="crm-tl">' + timelineHtml(R.timeline, false) + '</div></div></main>'
      + '<aside class="crm-rec-right">'
      + (c.end_user_id ? '<div class="crm-card"><h3>Compte</h3><button type="button" class="crm-mini" data-acc="' + esc(c.end_user_id) + '">' + tierBadge(c.tier) + '<span class="m"><b>' + esc(c.account_nom) + '</b><span>' + esc([c.account_pays, c.account_secteur].filter(Boolean).join(' · ')) + '</span></span></button>'
        + '<div class="crm-meta" style="margin-top:6px">Propriétaire : ' + esc(c.owner_name || 'personne') + '</div></div>'
        : '<div class="crm-card"><h3>Compte</h3><div class="crm-meta">Ce contact n’est rattaché à aucun compte' + (c.organisation ? ' (organisation saisie : ' + esc(c.organisation) + ')' : '') + '.</div></div>')
      + '<div class="crm-card"><h3>Tâches <span class="crm-meta">' + openTasks.length + '</span></h3>' + (R.tasks.length ? R.tasks.map(taskHtml).join('') : '<div class="crm-meta">Aucune tâche.</div>') + '</div>'
      + (R.colleagues.length ? '<div class="crm-card"><h3>Comité d’achat du compte</h3>' + R.colleagues.map(function (x) {
        return '<div class="crm-ct" data-ct="' + esc(x.id) + '" role="button" tabindex="0"><span class="crm-avatar">' + esc(initials(personName(x))) + '</span><div style="min-width:0;flex:1"><div class="crm-ct-name">' + esc(personName(x)) + '</div><div class="crm-ct-sub">' + esc(x.titre || '') + '</div></div>' + rolePill(x.role, true) + '</div>';
      }).join('') + '</div>' : '')
      + '</aside></div>';

    document.getElementById('crm-pback').onclick = function () { if (history.length > 1) history.back(); else go('people'); };
    bindFields(document.getElementById('crm-ct-fields'), fields, function (k, v) {
      if (k == null) { drawContact(); return; }
      var body = {}; body[k] = v === '' ? null : v;
      api('/crm/contacts/' + encodeURIComponent(c.id), { method: 'PATCH', body: body })
        .then(function () { toast('Enregistré'); return reloadContact(); })
        .catch(function (e) { toast('Erreur : ' + e.message); drawContact(); });
    });
    d.querySelectorAll('[data-compose]').forEach(function (b) { b.onclick = function () { drawComposer(b.getAttribute('data-compose'), true); }; });
    drawComposer('activity', false);
    bindTimeline(d, reloadContact);
    bindTasks(d, reloadContact);
    d.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
    d.querySelectorAll('.crm-rec-right [data-ct]').forEach(function (el) { el.onclick = function () { openContact(el.getAttribute('data-ct')); }; });
    var ea = document.getElementById('crm-email-assist'); if (ea) ea.onclick = function () { window.openContactDetail(c.id); };
    var ce = document.getElementById('crm-copy-email'); if (ce) ce.onclick = function () { try { navigator.clipboard.writeText(c.email); toast('Email copié'); } catch (e) { toast(c.email); } };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // À FAIRE : file unifiée (tâches, relances, réponses)
  // ═════════════════════════════════════════════════════════════════════════
  function updateBadge(items) {
    var t = todayStr();
    S.badgeCount = (items || []).filter(function (x) { return x.kind === 'reply' || x.kind === 'reaction' || (x.due && x.due <= t); }).length;
    paintBadge();
  }
  // Pastille du menu « Aujourd'hui » : urgences de la file + actions proposées par la veille
  function paintBadge() {
    if (typeof S.badgeCount !== 'number' && typeof S.propCount !== 'number' && typeof S.aoCount !== 'number') return;
    var n = (S.badgeCount || 0) + (S.propCount || 0) + (S.aoCount || 0);
    ['nav-today-badge', 'bn-today-badge'].forEach(function (id) {
      var b = document.getElementById(id); if (!b) return;
      b.textContent = n > 99 ? '99+' : String(n); b.style.display = n ? 'inline-block' : 'none';
      b.setAttribute('aria-label', n + ' à traiter');
    });
  }
  function refreshBadge() {
    if (!(window.getAuthHeaders && window.getAuthHeaders().Authorization)) return;
    loadQueue('me').then(updateBadge).catch(function () {});
  }
  // ── branchement ───────────────────────────────────────────────────────────
  function onPanel(id, opts) {
    try {
      if (id !== 'tasks') S.inTasksPanel = false;
      if (id === 'accounts') onAccountsPanel(opts || {});
      else if (id === 'people') onPeoplePanel(opts || {});
      else if (id === 'tasks') go('home');
      else if (id === 'home') onHomePanel();
      else if (id === 'stats') onStatsPanel();
      else if (id === 'market') onMarketPanel();
      else if (id === 'veille') onVeillePanel();
      else if (id === 'feed') onFeedPanel();
      setTimeout(paintBadge, 30);
    } catch (e) { console.error('[crm] onPanel', e); }
  }

  // L'ancien panneau Comptes reste disponible (fiche marché) ; toute ouverture d'un compte passe par la nouvelle fiche.
  if (typeof window.openEndUser === 'function' && !window._legacyOpenEndUser) {
    window._legacyOpenEndUser = window.openEndUser;
    window.openEndUser = function (id) { openAccount(id); };
    try { openEndUser = window.openEndUser; } catch (e) {}
  }
  // La modale contact (assistant email, actions rapides) reste ; on y ajoute un lien vers la fiche complète.
  if (typeof window.openContactDetail === 'function' && !window._legacyOpenContactDetail) {
    window._legacyOpenContactDetail = window.openContactDetail;
    window.openContactDetail = function (id) {
      var r = window._legacyOpenContactDetail.apply(this, arguments);
      Promise.resolve(r).then(function () {
        var body = document.getElementById('contact-detail-body'); if (!body || body.querySelector('.crm-full-link')) return;
        var a = document.createElement('button'); a.type = 'button'; a.className = 'crm-btn crm-full-link'; a.textContent = 'Ouvrir la fiche complète →';
        a.onclick = function () { var m = document.getElementById('contact-detail-modal'); if (m) m.classList.remove('open'); if (typeof window.closeContactDetail === 'function') window.closeContactDetail(); openContact(id); };
        body.insertBefore(a, body.firstChild);
      }).catch(function () {});
      return r;
    };
    try { openContactDetail = window.openContactDetail; } catch (e) {}
  }

  // Relance envoyée depuis la file : rafraîchir la file / l'accueil
  if (typeof window.trkMarkRelanceSent === 'function' && !window._legacyTrkMarkRelanceSent) {
    window._legacyTrkMarkRelanceSent = window.trkMarkRelanceSent;
    window.trkMarkRelanceSent = function () {
      var r = window._legacyTrkMarkRelanceSent.apply(this, arguments);
      Promise.resolve(r).then(function () { if (S.afterRelance) { var f = S.afterRelance; S.afterRelance = null; f(); } refreshBadge(); });
      return r;
    };
    try { trkMarkRelanceSent = window.trkMarkRelanceSent; } catch (e) {}
  }

  // Pastille Prospection : actions proposées (signaux marché 5+) sur mes comptes, non traitées.
  // L'admin voit aussi celles qui ne sont rattachées à aucun compte. Même logique que les chats et visites.
  function refreshPropBadge() {
    if (typeof window.getAuthHeaders !== 'function' || !window.getAuthHeaders().Authorization) return;
    api('/crm/signals/proposed?scope=me&count=1').then(function (d) {
      var n = (d.mine || 0) + (isAdminNow() ? (d.unlinked || 0) : 0);
      S.propCount = n; paintBadge();
      var last = parseInt(lsGet('scout_prop_seen', '0'), 10) || 0;
      if (n > last) toast(n - last > 1 ? (n - last) + ' nouvelles actions proposées par la veille, dans Aujourd’hui' : 'Nouvelle action proposée par la veille, dans Aujourd’hui');
      lsSet('scout_prop_seen', String(n));
    }).catch(function () {});
  }

  window.scoutCrm = { onPanel: onPanel, openAccount: openAccount, openContact: openContact, openAccounts: openAccountsWith, refreshBadge: refreshBadge, refreshPropBadge: refreshPropBadge,
    loadQueue: loadQueue, api: api, personName: personName, actLabel: ACT_LABEL, loadAo: loadAo, aoItems: function () { return S.ao || []; } };
  setTimeout(refreshBadge, 2500);
  setInterval(refreshBadge, 5 * 60 * 1000);
  setTimeout(refreshPropBadge, 3500);
  setTimeout(loadAo, 4500);
  setInterval(loadAo, 10 * 60 * 1000);
  setInterval(refreshPropBadge, 5 * 60 * 1000);
})();
