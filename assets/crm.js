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
  function heatBadge(score, heat) { return '<span class="crm-heat h-' + esc(heat || 'froid') + '" title="Score d’engagement sur 90 jours">' + esc(score || 0) + '<small>' + esc(HEAT_LABEL[heat] || '') + '</small></span>'; }
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
  function loadQueue(scope) {
    var team = scope === 'team';
    return Promise.all([
      api('/crm/tasks?scope=' + (team ? 'team' : 'me') + '&state=open').catch(function () { return { tasks: [] }; }),
      api('/me/tracking?scope=' + (team ? 'team' : 'me')).catch(function () { return { tracking: [] }; })
    ]).then(function (r) {
      var items = [];
      (r[0].tasks || []).forEach(function (t) {
        items.push({ kind: 'task', id: 'task-' + t.id, due: t.due_date || null, title: t.title, task: t,
          who: t.owner_name, contact_id: t.contact_id, contact_name: t.contact_name, account_id: t.end_user_id, account_nom: t.account_nom });
      });
      (r[1].tracking || []).forEach(function (x) {
        var name = personName(x);
        if (x.status === 'waiting' && (x.urgency === 'overdue' || x.urgency === 'due' || x.urgency === 'future') && x.next_relance) {
          items.push({ kind: 'relance', id: 'rel-' + x.id, due: String(x.next_relance).slice(0, 10), title: (x.stage === '1er mail' ? 'Relance 1' : 'Relance 2') + ' : ' + name,
            sub: x.titre, who: x.owner, contact_id: x.id, contact_name: name, account_id: x.end_user_id, account_nom: x.account_nom || x.organisation, x: x });
        } else if (x.status === 'interested') {
          items.push({ kind: 'reply', id: 'rep-' + x.id, due: x.last_action_at ? String(x.last_action_at).slice(0, 10) : null, title: 'Réponse positive : ' + name,
            sub: 'À qualifier puis saisir dans Dynamics', who: x.owner, contact_id: x.id, contact_name: name, account_id: x.end_user_id, account_nom: x.account_nom || x.organisation, x: x });
        }
      });
      items.sort(function (a, b) { return (a.due || '9999') < (b.due || '9999') ? -1 : ((a.due || '9999') > (b.due || '9999') ? 1 : 0); });
      return items;
    });
  }
  var KIND_LABEL = { task: 'Tâche', relance: 'Relance', reply: 'Réponse' };

  function queueItemHtml(it, opts) {
    opts = opts || {};
    var t = todayStr();
    var dueCls = it.due ? (it.due < t ? 'crm-late' : (it.due === t ? 'crm-today' : '')) : '';
    var dueTxt = it.due ? (it.due < t ? 'En retard · ' + fmtDate(it.due) : (it.due === t ? "Aujourd'hui" : fmtDate(it.due))) : 'Sans échéance';
    if (it.kind === 'reply') dueTxt = it.due ? 'Reçue le ' + fmtDate(it.due) : 'Reçue';
    var sub = [];
    if (it.kind === 'reply') dueCls = 'crm-today';
    sub.push('<span class="' + dueCls + '">' + esc(dueTxt) + '</span>');
    if (it.account_nom) sub.push(it.account_id ? '<button type="button" class="crm-link" data-qacc="' + esc(it.account_id) + '">' + esc(it.account_nom) + '</button>' : esc(it.account_nom));
    if (it.kind === 'task' && it.contact_name) sub.push('<button type="button" class="crm-link" data-qct="' + esc(it.contact_id) + '">' + esc(it.contact_name) + '</button>');
    if (opts.showWho && it.who) sub.push(esc(it.who));
    var lead = it.kind === 'task'
      ? '<input type="checkbox" data-task="' + esc(it.task.id) + '" aria-label="Terminer : ' + esc(it.title) + '">'
      : '<span class="crm-q-ic k-' + it.kind + '" aria-hidden="true">' + (it.kind === 'relance' ? ICON.mail : ICON.check) + '</span>';
    var actions = '';
    if (it.kind === 'relance') actions = '<button type="button" class="crm-btn sm primary" data-qrel="' + esc(it.contact_id) + '">Préparer la relance</button>';
    if (it.kind === 'reply') actions = '<button type="button" class="crm-btn sm" data-qct="' + esc(it.contact_id) + '">Qualifier</button><button type="button" class="crm-btn sm" data-qcopy="' + esc(it.contact_id) + '" title="Copie nom, titre, organisation, pays, email et LinkedIn pour les coller dans Dynamics">Copier la fiche</button><button type="button" class="crm-btn sm primary" data-qtx="' + esc(it.contact_id) + '" title="Une fois le contact créé dans Dynamics. Scout n’envoie rien à Dynamics.">Saisi dans Dynamics ✓</button>';
    if (it.kind === 'reply' && it.x) { S.qx = S.qx || {}; S.qx[it.contact_id] = it.x; }
    if (it.kind === 'task') actions = '<button type="button" class="del" data-deltask="' + esc(it.task.id) + '" title="Supprimer" aria-label="Supprimer la tâche">×</button>';
    return '<div class="crm-q k-' + it.kind + '">' + lead + '<div class="crm-q-b"><div class="t"><span class="crm-q-kind k-' + it.kind + '">' + KIND_LABEL[it.kind] + '</span>'
      + (it.kind === 'task' ? esc(it.title) : '<button type="button" class="crm-link strong" data-qct="' + esc(it.contact_id) + '">' + esc(it.title) + '</button>')
      + '</div><div class="s">' + sub.join(' · ') + '</div></div><div class="crm-q-a">' + actions + '</div></div>';
  }

  function bindQueue(root, after) {
    bindTasks(root, after);
    root.querySelectorAll('[data-qacc]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openAccount(b.getAttribute('data-qacc')); }; });
    root.querySelectorAll('[data-qct]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openContact(b.getAttribute('data-qct')); }; });
    root.querySelectorAll('[data-qrel]').forEach(function (b) {
      b.onclick = function () { if (typeof window.trkRelance === 'function') { S.afterRelance = after; window.trkRelance(b.getAttribute('data-qrel')); } else openContact(b.getAttribute('data-qrel')); };
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

  function onHomePanel() {
    var p = document.getElementById('panel-home'); if (!p) return;
    var me = (window.scoutSession && window.scoutSession.first_name) || '';
    var dateTxt = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    dateTxt = dateTxt.charAt(0).toUpperCase() + dateTxt.slice(1);
    p.innerHTML = '<div class="crm-wrap crm-home"><div class="crm-row crm-home-head">'
      + '<div><h2 class="crm-h2" id="crm-home-title">Bonjour' + (me ? ' ' + esc(me) : '') + '</h2><div class="crm-meta">' + esc(dateTxt) + '</div></div>'
      + '<div class="crm-views" style="margin:0"><button type="button" class="crm-chip" data-hs="me">Moi</button><button type="button" class="crm-chip" data-hs="team">Équipe</button></div></div>'
      + '<div id="crm-home-body"><div class="crm-empty">Chargement…</div></div></div>';
    p.querySelectorAll('[data-hs]').forEach(function (b) { b.onclick = function () { S.homeScope = b.getAttribute('data-hs'); loadHome(); }; });
    loadFacets().then(loadHome).catch(function (e) { document.getElementById('crm-home-body').innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SIGNAUX À TRAITER : appels d'offres et contrats, en un clic
  // ═════════════════════════════════════════════════════════════════════════
  function onSignalsPanel() {
    var p = document.getElementById('panel-signals'); if (!p) return;
    S.sigState = S.sigState || 'new';
    p.innerHTML = '<div class="crm-wrap"><div class="crm-row crm-home-head"><div><h2 class="crm-h2">Signaux à traiter</h2><div class="crm-meta">Appels d’offres et contrats repérés par la veille. Rattachez-les à un compte, créez une tâche ou ignorez-les.</div></div>'
      + '<div class="crm-views" style="margin:0" id="crm-sig-states"></div></div><div id="crm-sig-body"><div class="crm-empty">Chargement…</div></div></div>';
    loadSignals();
  }
  function loadSignals() {
    api('/crm/signals?state=' + S.sigState).then(function (d) {
      var c = d.counts || {};
      var st = document.getElementById('crm-sig-states');
      if (st) {
        st.innerHTML = [['new', 'À traiter'], ['done', 'Traités'], ['ignored', 'Ignorés']].map(function (x) {
          return '<button type="button" class="crm-chip' + (S.sigState === x[0] ? ' on' : '') + '" data-ss="' + x[0] + '">' + x[1] + ' <span class="crm-meta">' + (c[x[0]] || 0) + '</span></button>';
        }).join('');
        st.querySelectorAll('[data-ss]').forEach(function (b) { b.onclick = function () { S.sigState = b.getAttribute('data-ss'); loadSignals(); }; });
      }
      drawSignals(d.signals || []);
      var badge = document.getElementById('subnav-signals-badge'); if (badge) { badge.textContent = c.new || ''; badge.style.display = c.new ? '' : 'none'; }
    }).catch(function (e) { var b = document.getElementById('crm-sig-body'); if (b) b.innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }
  function drawSignals(list) {
    var body = document.getElementById('crm-sig-body'); if (!body) return;
    if (!list.length) { body.innerHTML = '<div class="crm-empty">' + (S.sigState === 'new' ? 'Rien à traiter : tous les signaux ont été vus.' : 'Aucun signal dans cette liste.') + '</div>'; return; }
    body.innerHTML = list.map(function (g, i) {
      var val = g.value_max ? (g.value_max >= 1e9 ? (g.value_max / 1e9).toFixed(1).replace('.', ',') + ' Md' : Math.round(g.value_max / 1e6) + ' M') : '';
      var accs = (g.accounts || []).map(function (a) {
        return '<span class="crm-sig-acc"><button type="button" class="crm-link" data-open="' + esc(a.id) + '">' + esc(a.nom) + '</button>'
          + '<button type="button" class="crm-x" data-unlink="' + i + '" data-eu="' + esc(a.id) + '" aria-label="Retirer le rattachement à ' + esc(a.nom) + '">×</button></span>';
      }).join('');
      return '<div class="crm-card crm-sig" data-i="' + i + '">'
        + '<div class="crm-sig-main"><span class="crm-q-kind k-' + (g.kind === 'tender' ? 'relance' : 'task') + '">' + (g.kind === 'tender' ? 'Appel d’offres' : 'Contrat') + '</span> '
        + (g.url ? '<a class="crm-link" href="' + esc(g.url) + '" target="_blank" rel="noopener"><b>' + esc(g.title || 'Sans titre') + '</b></a>' : '<b>' + esc(g.title || 'Sans titre') + '</b>')
        + '<div class="crm-meta">' + esc([g.buyer, g.pays, val, g.date ? fmtDate(g.date) : ''].filter(Boolean).join(' · ')) + (g.state !== 'new' && g.by_name ? ' · ' + (g.state === 'ignored' ? 'ignoré' : 'traité') + ' par ' + esc(g.by_name) : '') + '</div>'
        + '<div class="crm-sig-accs">' + (accs || '<span class="crm-meta">Aucun compte rattaché</span>') + '</div></div>'
        + '<div class="crm-sig-actions">'
        + (g.state === 'ignored' ? '<button type="button" class="crm-btn sm" data-act="restore" data-i="' + i + '">Remettre à traiter</button>'
          : '<button type="button" class="crm-btn sm" data-act="pick" data-i="' + i + '">Rattacher</button>'
          + '<button type="button" class="crm-btn sm" data-act="task" data-i="' + i + '">' + ICON.check + ' Créer une tâche</button>'
          + (g.state === 'new' ? '<button type="button" class="crm-btn ghost sm" data-act="ignore" data-i="' + i + '">Ignorer</button>' : ''))
        + '</div><div class="crm-sig-pick" id="crm-sig-pick-' + i + '" hidden></div></div>';
    }).join('');
    var act = function (g, body) {
      return api('/crm/signals/' + g.kind + '/' + encodeURIComponent(g.ref_id) + '/action', { method: 'POST', body: body })
        .then(function (r) { S.treeData = null; return r; });
    };
    body.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-open')); }; });
    body.querySelectorAll('[data-unlink]').forEach(function (b) { b.onclick = function () {
      var g = list[+b.getAttribute('data-unlink')];
      act(g, { action: 'unlink', end_user_id: b.getAttribute('data-eu') }).then(function () { toast('Rattachement retiré'); loadSignals(); }).catch(function (e) { toast('Erreur : ' + e.message); });
    }; });
    body.querySelectorAll('[data-act]').forEach(function (b) { b.onclick = function () {
      var i = +b.getAttribute('data-i'), g = list[i], a = b.getAttribute('data-act');
      if (a === 'ignore' || a === 'restore') { act(g, { action: a }).then(function () { toast(a === 'ignore' ? 'Signal ignoré' : 'Signal remis à traiter'); loadSignals(); }).catch(function (e) { toast('Erreur : ' + e.message); }); return; }
      var box = document.getElementById('crm-sig-pick-' + i); box.hidden = false;
      if (a === 'pick') {
        acctPicker(box, { placeholder: 'Rattacher à quel compte ?', focus: true, exclude: (g.accounts || []).map(function (x) { return x.id; }), onPick: function (x) {
          act(g, { action: 'link', end_user_id: x.id }).then(function () { toast('Rattaché à ' + x.nom); loadSignals(); }).catch(function (e) { toast('Erreur : ' + e.message); });
        } });
      } else if (a === 'task') {
        var first = (g.accounts || [])[0];
        var doTask = function (eu) {
          act(g, { action: 'task', end_user_id: eu || null, title: 'Suivre : ' + (g.title || 'signal') }).then(function () { toast('Tâche créée (échéance dans 7 jours)'); loadSignals(); refreshBadge(); }).catch(function (e) { toast('Erreur : ' + e.message); });
        };
        if (first) { doTask(first.id); return; }
        box.innerHTML = '<div class="crm-meta" style="margin-bottom:4px">Sur quel compte créer la tâche ?</div><div class="crm-pick-host"></div><button type="button" class="crm-link" style="margin-top:6px">Créer sans compte</button>';
        acctPicker(box.querySelector('.crm-pick-host'), { placeholder: 'Compte concerné', focus: true, onPick: function (x) { doTask(x.id); } });
        box.querySelector('button.crm-link').onclick = function () { doTask(null); };
      }
    }; });
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
  // PROSPECTION : prochaine action, comptes chauds, comptes à ouvrir, VIP
  // ═════════════════════════════════════════════════════════════════════════
  function onProspectionPanel() {
    var p = document.getElementById('panel-prospection'); if (!p) return;
    S.prospScope = S.prospScope || lsGet('scout_prosp_scope', 'all');
    p.innerHTML = '<div class="crm-wrap crm-home crm-prosp">'
      + '<div class="crm-row crm-home-head"><div class="crm-meta crm-lead-in">Qui contacter maintenant, et pourquoi. <button type="button" class="crm-link" data-goto="config">Mes segments</button></div>'
      + '<div class="crm-seg"><button type="button" class="crm-chip sm" data-ps="me">Mes comptes</button><button type="button" class="crm-chip sm" data-ps="all">Tous les comptes</button></div></div>'
      + '<div id="crm-prosp-body"><div class="crm-empty">Chargement…</div></div></div>';
    p.querySelectorAll('.crm-home-head [data-goto]').forEach(function (b) { b.onclick = function () { go(b.getAttribute('data-goto')); }; });
    p.querySelectorAll('[data-ps]').forEach(function (b) {
      b.onclick = function () { S.prospScope = b.getAttribute('data-ps'); lsSet('scout_prosp_scope', S.prospScope); loadProspection(); };
    });
    loadProspection();
  }

  function loadProspection() {
    var p = document.getElementById('panel-prospection'); if (!p) return;
    p.querySelectorAll('[data-ps]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-ps') === S.prospScope); });
    var body = document.getElementById('crm-prosp-body');
    var own = S.prospScope === 'me' ? '&owner=me' : '';
    Promise.all([
      api('/crm/accounts?heat=chaud,tiede&sort=score&dir=desc&limit=10' + own).catch(function () { return { accounts: [] }; }),
      api('/crm/accounts?activity=never&contacts=with&sort=priority&dir=desc&limit=10' + own).catch(function () { return { accounts: [] }; }),
      api('/crm/contacts?vip=1&limit=12').catch(function () { return { contacts: [] }; }),
      api('/me/stats').catch(function () { return {}; }),
      api('/contacts/stats-engagement').catch(function () { return {}; }),
      loadQueue('me').catch(function () { return []; }),
      api('/crm/signals/proposed?scope=' + (S.prospScope === 'me' ? 'me' : 'all')).catch(function () { return { rows: [] }; })
    ]).then(function (r) {
      var hot = r[0].accounts || [], fresh = r[1].accounts || [], vip = r[2].contacts || [], st = r[3] || {}, eng = r[4] || {}, queue = r[5] || [];
      var props = (r[6] && r[6].rows) || []; S.props = props;
      // Comptes touchés par une action proposée : raison affichée, et remontés dans « Comptes chauds ».
      var sigByAcc = {};
      props.forEach(function (sg) { (sg.accounts || []).forEach(function (a) { if (!sigByAcc[a.id]) sigByAcc[a.id] = sg; }); });
      Object.keys(sigByAcc).forEach(function (id) {
        if (hot.some(function (a) { return a.id === id; })) return;
        var sg = sigByAcc[id], a = (sg.accounts || []).filter(function (x) { return x.id === id; })[0];
        if (a && hot.length < 14) hot.unshift({ id: a.id, nom: a.nom, owner_name: a.owner_name, pays: sg.pays, n_contacts: null, _sigOnly: true });
      });
      var t = todayStr();
      var nDue = queue.filter(function (x) { return x.kind === 'relance' && x.due && x.due <= t; }).length;
      var nReply = queue.filter(function (x) { return x.kind === 'reply'; }).length;
      var html = '';

      // 1. Bandeau compact (même format que l'Accueil)
      html += '<div class="crm-hero">'
        + '<button type="button" class="crm-hero-card main" id="crm-prosp-go" title="Scout choisit le meilleur contact à travailler dans tes segments : décideur vérifié, compte prioritaire, jamais contacté. Tu écris, Scout note et planifie la relance."><span class="ic">' + ICON.send + '</span><span><b>Prochaine action</b><small>' + (eng.stock_relevant != null ? eng.stock_relevant + ' contacts prêts dans tes segments' : 'Traiter le prochain contact suggéré') + '</small></span><span class="go">→</span></button>'
        + '<button type="button" class="crm-hero-card" id="crm-prosp-sig"><b' + (props.length ? ' class="crm-today"' : '') + '>' + props.length + '</b><span>action' + (props.length > 1 ? 's' : '') + ' proposée' + (props.length > 1 ? 's' : '') + '<small>signaux marché</small></span></button>'
        + '<button type="button" class="crm-hero-card" data-goq="all"><b class="' + (nDue ? 'crm-late' : '') + '">' + nDue + '</b><span>relance' + (nDue > 1 ? 's' : '') + ' due' + (nDue > 1 ? 's' : '') + '<small>' + (st.emails_7d || 0) + ' email' + ((st.emails_7d || 0) > 1 ? 's' : '') + ' envoyé' + ((st.emails_7d || 0) > 1 ? 's' : '') + ' en 7 j</small></span></button>'
        + '<button type="button" class="crm-hero-card" data-goq="reply"><b' + (nReply ? ' class="crm-today"' : '') + '>' + nReply + '</b><span>réponse' + (nReply > 1 ? 's' : '') + ' positive' + (nReply > 1 ? 's' : '') + ' à saisir dans Dynamics</span></button>'
        + '</div>';

      var why = function (a) {
        var w = [];
        if (a.web_pages_90d) w.push('<span class="crm-why web">' + a.web_pages_90d + ' page' + (a.web_pages_90d > 1 ? 's' : '') + ' vues' + (a.last_visit ? ', ' + relTime(a.last_visit) : '') + '</span>');
        if (a.chats_90d) w.push('<span class="crm-why">chat sur le site</span>');
        var sg = sigByAcc[a.id];
        if (sg) w.push('<span class="crm-why sig">' + esc(sigType(sg)) + '</span>');
        else if (a.n_market_recent) w.push('<span class="crm-why">marché récent</span>');
        if (a.last_activity_at) w.push('<span class="crm-why soft">activité ' + relTime(a.last_activity_at) + '</span>');
        return w.join('');
      };
      var row = function (a, right) {
        return '<button type="button" class="crm-prow" data-acc="' + esc(a.id) + '">' + tierBadge(a.tier)
          + '<span class="m"><b>' + esc(a.nom) + '</b><span>' + esc([a.pays, a.secteur, a._sigOnly ? '' : (a.n_contacts || 0) + ' contact' + (a.n_contacts > 1 ? 's' : '')].filter(Boolean).join(' · ')) + '</span></span>'
          + '<span class="w">' + right(a) + '</span>'
          + '<span class="o">' + (a.owner_name ? '<span class="crm-avatar">' + esc(initials(a.owner_name)) + '</span>' + esc(a.owner_name) : '<span class="crm-meta">Personne</span>') + '</span></button>';
      };

      // 2. Actions proposées (signaux marché notés 5 sur 8 et plus, sans échéance)
      // Section affichée seulement s'il y a quelque chose : le bandeau donne déjà le compteur.
      if (props.length) html += '<div class="crm-card" id="crm-props"><h3>Actions proposées <span class="crm-meta">appels d’offres, contrats des concurrents, achats déclencheurs, notés 5 sur 8 et plus</span> <button type="button" class="crm-link" data-goto="market">Marchés →</button></h3>'
        + props.map(sigCard).join('') + '</div>';

      // 3. Comptes chauds
      html += '<div class="crm-card"><h3>Comptes chauds <span class="crm-meta">ils bougent : visites du site, chat, appels d’offres, échanges récents</span> <button type="button" class="crm-link" data-kf=\'' + esc(JSON.stringify(Object.assign(S.prospScope === 'me' ? { owner: 'me' } : {}, { heat: 'chaud,tiede' }))) + '\'>Tous →</button></h3>'
        + (hot.length ? hot.map(function (a) { return row(a, function (x) { return why(x) + heatBadge(x.score, x.heat); }); }).join('')
          : '<div class="crm-empty" style="padding:16px">Aucun compte chaud pour le moment.</div>')
        + '</div>';

      // 3. Comptes à ouvrir
      html += '<div class="crm-prosp-cols"><div class="crm-card"><h3>Comptes à ouvrir <span class="crm-meta">jamais contactés, les plus prioritaires d’abord</span> <button type="button" class="crm-link" data-kf=\'' + esc(JSON.stringify(Object.assign(S.prospScope === 'me' ? { owner: 'me' } : {}, { activity: 'never', contacts: 'with' }))) + '\'>Tous →</button></h3>'
        + (fresh.length ? fresh.map(function (a) { return row(a, function (x) { return prioBadge(x.priority); }); }).join('')
          : '<div class="crm-empty" style="padding:16px">Tous les comptes avec contacts ont déjà été travaillés.</div>')
        + '</div>';

      // 4. VIP
      html += '<div class="crm-card"><h3>VIP à contacter <span class="crm-meta">contacts 3 étoiles jamais approchés</span></h3>'
        + (vip.length ? vip.map(function (c) {
          return '<button type="button" class="crm-prow person" data-ct="' + esc(c.id) + '"><span class="crm-avatar lg">' + esc(initials(personName(c))) + '</span>'
            + '<span class="m"><b>' + esc(personName(c)) + '</b><span>' + esc([c.titre, c.account_nom || c.organisation, c.pays].filter(Boolean).join(' · ')) + '</span></span>'
            + (c.role ? rolePill(c.role) : '') + '</button>';
        }).join('') : '<div class="crm-empty" style="padding:16px">Aucun VIP en attente. Mets 3 étoiles à un contact clé pour le retrouver ici.</div>')
        + '</div></div>';

      body.innerHTML = html;
      document.getElementById('crm-prosp-go').onclick = function () { if (window.scoutAction && window.scoutAction.open) window.scoutAction.open(); };
      var sigBtn = document.getElementById('crm-prosp-sig'); if (sigBtn) sigBtn.onclick = function () { var el = document.getElementById('crm-props'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); else go('market'); };
      bindSigCards(body, loadProspection);
      body.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
      body.querySelectorAll('[data-ct]').forEach(function (b) { b.onclick = function () { openContact(b.getAttribute('data-ct')); }; });
      body.querySelectorAll('[data-kf]').forEach(function (b) { b.onclick = function () { openAccountsWith(JSON.parse(b.getAttribute('data-kf'))); }; });
      body.querySelectorAll('[data-goto]').forEach(function (b) { b.onclick = function () { go(b.getAttribute('data-goto')); }; });
      body.querySelectorAll('[data-goq]').forEach(function (b) { b.onclick = function () { S.qFilter = b.getAttribute('data-goq') === 'reply' ? 'reply' : 'all'; S.taskScope = 'me'; go('tasks'); }; });
    }).catch(function (e) { body.innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }

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
    if (isAdmin) html += '<div class="crm-card" id="crm-hygiene"><h3>Qualité des données</h3><div class="crm-meta">Chargement…</div></div>';
    body.innerHTML = html;
    body.querySelectorAll('[data-kf]').forEach(function (b) { b.onclick = function () { openAccountsWith(JSON.parse(b.getAttribute('data-kf'))); }; });
    if (isAdmin) loadHygiene();
  }

  function loadHome() {
    var p = document.getElementById('panel-home'); if (!p) return;
    p.querySelectorAll('[data-hs]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-hs') === S.homeScope); });
    var body = document.getElementById('crm-home-body');
    var team = S.homeScope === 'team';
    var ht = document.getElementById('crm-home-title'); if (ht && S.facets && S.facets.me && S.facets.me.name) ht.textContent = 'Bonjour ' + S.facets.me.name;
    Promise.all([
      api('/crm/home?owner=' + (team ? 'team' : 'me')),
      loadQueue(S.homeScope),
      api('/me/stats').catch(function () { return {}; })
    ]).then(function (r) {
      var d = r[0], queue = r[1], st = r[2] || {};
      var t = todayStr();
      if (!team) updateBadge(queue);
      var dueNow = queue.filter(function (x) { return x.kind === 'reply' || (x.due && x.due <= t); });
      var nLate = queue.filter(function (x) { return x.kind !== 'reply' && x.due && x.due < t; }).length;
      var nReply = queue.filter(function (x) { return x.kind === 'reply'; }).length;
      var k = d.kpi || {};
      var ownerF = team ? {} : { owner: 'me' };
      var html = '';

      // 1. Bandeau d'actions
      html += '<div class="crm-hero">'
        + '<button type="button" class="crm-hero-card main" id="crm-hero-next"><span class="ic">' + ICON.send + '</span><span><b>Prochaine action</b><small>Traiter le prochain contact suggéré</small></span><span class="go">→</span></button>'
        + '<button type="button" class="crm-hero-card" data-goq="due"><b class="' + (nLate ? 'crm-late' : '') + '">' + dueNow.length + '</b><span>à faire aujourd’hui' + (nLate ? '<small class="crm-late">dont ' + nLate + ' en retard</small>' : '') + '</span></button>'
        + '<button type="button" class="crm-hero-card" data-goq="reply"><b' + (nReply ? ' class="crm-today"' : '') + '>' + nReply + '</b><span>réponse' + (nReply > 1 ? 's' : '') + ' positive' + (nReply > 1 ? 's' : '') + ' à saisir dans Dynamics</span></button>'
        + '<button type="button" class="crm-hero-card" data-kf=\'' + esc(JSON.stringify(Object.assign({}, ownerF, { heat: 'chaud,tiede' }))) + '\'><b>' + (k.engaged || 0) + '</b><span>compte' + (k.engaged > 1 ? 's' : '') + ' engagé' + (k.engaged > 1 ? 's' : '') + ' (90 j)</span></button>'
        + '</div>';

      html += '<div class="crm-home-cols"><div class="crm-home-main">';
      // 2. À faire aujourd'hui
      html += '<div class="crm-card"><h3>À faire aujourd’hui <button type="button" class="crm-link" data-goto="tasks">Toute la file →</button></h3>'
        + (dueNow.length ? dueNow.slice(0, 10).map(function (x) { return queueItemHtml(x, { showWho: team }); }).join('')
          + (dueNow.length > 10 ? '<div class="crm-meta" style="padding-top:8px">+ ' + (dueNow.length - 10) + ' autres dans la file</div>' : '')
          : '<div class="crm-empty" style="padding:18px">Rien d’urgent aujourd’hui. Lancez « Prochaine action » ou travaillez vos comptes Tier 1.</div>')
        + '</div>';
      // 3. Portefeuille
      if (!team && !k.n) {
        html += '<div class="crm-card crm-callout"><b>Aucun compte ne vous est encore attribué.</b> Ouvrez <button type="button" class="crm-link" data-goto-acc=\'{"owner":"none","contacts":"with"}\'>les comptes sans propriétaire</button>, filtrez par pays, sélectionnez et assignez-vous les vôtres en une fois.</div>';
      }
      var tile = function (val, label, filters, cls) {
        return '<button type="button" class="crm-kpi ' + (cls || '') + '" data-kf=\'' + esc(JSON.stringify(Object.assign({}, ownerF, filters))) + '\'><b>' + esc(val) + '</b><span>' + esc(label) + '</span></button>';
      };
      var accList = function (rows, empty, extra) {
        if (!rows.length) return '<div class="crm-meta" style="padding:6px 0">' + empty + '</div>';
        return rows.slice(0, 5).map(function (a) {
          return '<button type="button" class="crm-mini" data-acc="' + esc(a.id) + '">' + tierBadge(a.tier)
            + '<span class="m"><b>' + esc(a.nom) + '</b><span>' + esc([a.pays, extra(a)].filter(Boolean).join(' · ')) + '</span></span>' + heatBadge(a.score, a.heat) + '</button>';
        }).join('');
      };
      html += '<div class="crm-card"><h3>' + (team ? 'Portefeuille de l’équipe' : 'Mon portefeuille') + ' <button type="button" class="crm-link" data-kf=\'' + esc(JSON.stringify(ownerF)) + '\'>Tous ' + (team ? 'les' : 'mes') + ' comptes →</button></h3>'
        + '<div class="crm-kpis">'
        + tile(k.n || 0, 'Comptes', {})
        + tile((k.t1 || 0) + ' · ' + (k.t2 || 0) + ' · ' + (k.t3 || 0), 'Tier 1 · 2 · 3', { tier: '1,2,3' })
        + tile(k.stale || 0, 'Tier 1–2 sans activité 30 j', { tier: '1,2', activity: 'stale30' }, k.stale ? 'warn' : '')
        + tile(k.gaps || 0, 'Comités incomplets (T1–2)', { tier: '1,2', coverage: 'incomplete' }, k.gaps ? 'warn' : '')
        + '</div><div class="crm-home-lists">'
        + '<div><h4>Engagés</h4>' + accList(d.hot, 'Aucun compte engagé ces 90 derniers jours.', function (a) { return a.last_activity_at ? relTime(a.last_activity_at) : ''; }) + '</div>'
        + '<div><h4>Tier 1–2 à relancer</h4>' + accList(d.stale, 'Tous les comptes prioritaires ont eu une activité récente.', function (a) { return a.last_activity_at ? 'rien depuis ' + relTime(a.last_activity_at).replace('il y a ', '') : 'jamais contacté'; }) + '</div>'
        + '<div><h4>Comités à compléter</h4>' + (d.gaps.length ? d.gaps.slice(0, 5).map(function (a) {
          var miss = KEY_ROLES.filter(function (rr) { return (a.roles || []).indexOf(rr) < 0; }).map(function (rr) { return ROLE_LABEL[rr].toLowerCase(); });
          return '<button type="button" class="crm-mini" data-acc="' + esc(a.id) + '">' + tierBadge(a.tier) + '<span class="m"><b>' + esc(a.nom) + '</b><span>Manque : ' + esc(miss.join(', ')) + '</span></span>' + coverageDots(a.roles) + '</button>';
        }).join('') : '<div class="crm-meta" style="padding:6px 0">Les comités des comptes prioritaires sont couverts.</div>') + '</div>'
        + '</div></div>';
      html += '</div><aside class="crm-home-side">';
      // 4. Ma semaine
      if (st && st.ok) {
        html += '<div class="crm-card"><h3>Ma semaine <button type="button" class="crm-link" data-goto="stats">Statistiques →</button></h3>'
          + '<div class="crm-week">'
          + '<div><b>' + (st.emails_7d || 0) + '</b><span>emails envoyés</span></div>'
          + '<div><b>' + (st.relances_7d || 0) + '</b><span>relances</span></div>'
          + '<div><b>' + (st.actions_7d || 0) + '</b><span>actions</span></div>'
          + '<div><b>' + (st.interested || 0) + '</b><span>intéressés (total)</span></div></div>'
          + (st.leaderboard && st.leaderboard.length > 1 ? '<div class="crm-lead"><span class="crm-meta">Emails 7 j :</span> ' + st.leaderboard.map(function (l) { return '<span' + (l.name === st.me ? ' class="me"' : '') + '>' + esc(l.name) + ' <b>' + l.emails + '</b></span>'; }).join('') + '</div>' : '')
          + '</div>';
      }
      // 5. Visites web
      html += '<div class="crm-card"><h3>Visites sur elistair.com <button type="button" class="crm-link" data-goto="visitors">Signaux →</button></h3>'
        + accList(d.web, 'Aucune visite rattachée à ' + (team ? 'des' : 'vos') + ' comptes ces 90 jours. Le rattachement se fait par le domaine du compte.', function (a) { return a.web_pages_90d + ' page' + (a.web_pages_90d > 1 ? 's' : '') + (a.last_visit ? ', ' + relTime(a.last_visit) : ''); })
        + '</div>';
      // 6. Prochaines échéances (au-delà d'aujourd'hui)
      var next = queue.filter(function (x) { return x.kind !== 'reply' && x.due && x.due > t; }).slice(0, 5);
      html += '<div class="crm-card"><h3>Prochains jours</h3>' + (next.length ? next.map(function (x) {
        return '<div class="crm-next"><span class="d">' + esc(fmtDate(x.due)) + '</span><span class="crm-q-kind k-' + x.kind + '">' + KIND_LABEL[x.kind] + '</span><span class="t">' + esc(x.kind === 'task' ? x.title : (x.contact_name + (x.account_nom ? ' · ' + x.account_nom : ''))) + '</span></div>';
      }).join('') : '<div class="crm-meta">Rien de planifié.</div>') + '</div>';
      html += '</aside></div>';

      body.innerHTML = html;
      var nx = document.getElementById('crm-hero-next');
      nx.onclick = function () { if (window.scoutAction && window.scoutAction.open) window.scoutAction.open(); else go('dashboard'); };
      body.querySelectorAll('[data-goq]').forEach(function (b) { b.onclick = function () { S.qFilter = b.getAttribute('data-goq') === 'reply' ? 'reply' : 'all'; S.taskScope = S.homeScope; go('tasks'); }; });
      body.querySelectorAll('[data-kf]').forEach(function (b) { b.onclick = function () { openAccountsWith(JSON.parse(b.getAttribute('data-kf'))); }; });
      body.querySelectorAll('[data-goto-acc]').forEach(function (b) { b.onclick = function () { openAccountsWith(JSON.parse(b.getAttribute('data-goto-acc'))); }; });
      body.querySelectorAll('[data-goto]').forEach(function (b) { b.onclick = function () { go(b.getAttribute('data-goto')); }; });
      bindQueue(body, loadHome);
      body.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); openAccount(b.getAttribute('data-acc')); }; });
    }).catch(function (e) { body.innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
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
          + '<td class="c-nom"><div class="crm-acc-name">' + esc(r.nom) + '</div><div class="crm-acc-sub">' + esc([r.pays, r.secteur].filter(Boolean).join(' · ')) + (r.n_contacts ? ' · ' + r.n_contacts + ' contact' + (r.n_contacts > 1 ? 's' : '') : '') + '</div></td>'
          + '<td class="c-prio">' + prioBadge(r.priority) + '</td>'
          + '<td class="c-score">' + heatBadge(r.score, r.heat) + (r.web_pages_90d ? ' <span class="crm-web" title="' + r.web_pages_90d + ' pages vues sur elistair.com (90 j)">web</span>' : '') + '</td>'
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
      + '</div>'
      + '<div class="crm-rec-grid">'
      // ── colonne gauche : à propos
      + '<aside class="crm-rec-left"><div class="crm-card"><h3>À propos du compte</h3><dl class="crm-fields" id="crm-acc-fields">' + fields.map(fieldRow).join('') + '</dl>'
      + '<div class="crm-parent"><div class="crm-meta" style="margin:10px 0 4px">Rattaché à</div>'
      + (sm.parent_id ? '<div class="crm-row" style="gap:6px;flex-wrap:wrap"><button type="button" class="crm-link" data-acc="' + esc(sm.parent_id) + '">' + esc(sm.parent_nom || 'compte parent') + '</button><button type="button" class="crm-btn ghost sm" id="crm-parent-edit">Changer</button><button type="button" class="crm-btn ghost sm" id="crm-parent-clear">Détacher</button></div><div id="crm-parent-pick" hidden></div>'
        : '<div id="crm-parent-pick"></div>')
      + '</div>'
      + (typeof window._legacyOpenEndUser === 'function' ? '<button type="button" class="crm-link" id="crm-legacy" style="margin-top:10px;font-size:12.5px">Fiche marché : produits et fournisseurs</button>' : '') + '</div>'
      + '<div class="crm-card"><h3>Priorité <span class="crm-meta">sur 100</span></h3><div class="crm-score-big">' + prioBadge(sm.priority) + '</div>'
      + '<div class="crm-prio-parts">'
      + [['Adéquation', sm.fit, 40, 'tier, secteur cible, usage drone'], ['Intention', sm.intent, 40, 'engagement des 90 derniers jours'], ['Relation', sm.relation, 20, 'emails connus et comité couvert']].map(function (x) {
        return '<div title="' + esc(x[3]) + '"><span>' + x[0] + '</span><span class="crm-prio-bar"><i style="width:' + Math.round(100 * (x[1] || 0) / x[2]) + '%"></i></span><b>' + (x[1] || 0) + '/' + x[2] + '</b></div>';
      }).join('') + '</div></div>'
      + '<div class="crm-card"><h3>Engagement <span class="crm-meta">90 jours</span></h3><div class="crm-score-big">' + heatBadge(sm.score, sm.heat) + '</div>'
      + '<ul class="crm-score-list"><li>Actions et activités sur les contacts</li>'
      + '<li>' + (sm.web_pages_90d ? '<b>' + sm.web_pages_90d + '</b> page' + (sm.web_pages_90d > 1 ? 's' : '') + ' vue' + (sm.web_pages_90d > 1 ? 's' : '') + ' sur elistair.com' : 'Pas de visite rattachée' + (sm.domain ? '' : ' (renseignez le domaine)')) + '</li>'
      + (sm.chats_90d ? '<li><b>' + sm.chats_90d + '</b> conversation' + (sm.chats_90d > 1 ? 's' : '') + ' sur le chat du site</li>' : '')
      + '</ul></div></aside>'
      // ── colonne centrale : composer + timeline
      + '<main class="crm-rec-main"><div class="crm-card crm-composer" id="crm-composer"></div>'
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
    var pp = document.getElementById('crm-parent-pick');
    var mountParent = function () { pp.hidden = false; acctPicker(pp, { placeholder: 'Rattacher à… (ex. ministère, direction)', exclude: [a.id], onPick: function (x) { setParent(x.id); }, focus: !!sm.parent_id }); };
    if (!sm.parent_id) mountParent();
    var pe = document.getElementById('crm-parent-edit'); if (pe) pe.onclick = mountParent;
    var pc = document.getElementById('crm-parent-clear'); if (pc) pc.onclick = function () { setParent(null); };
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
        + '<textarea class="crm-ta" id="crm-act-notes" placeholder="Compte rendu : ce qui a été dit, le besoin, la suite…" aria-label="Compte rendu"></textarea>'
        + '<div class="foot"><span class="crm-row">' + ctSelect('crm-act-ct')
        + '<input class="crm-sel" type="date" id="crm-act-date" value="' + todayStr() + '" max="' + todayStr() + '" aria-label="Date">'
        + '<select class="crm-sel" id="crm-act-out" aria-label="Résultat"><option value="">Résultat</option><option value="positive">Positif</option><option value="neutral">Neutre</option><option value="negative">Négatif</option></select></span>'
        + '<label class="crm-meta crm-row" style="gap:6px"><input type="checkbox" id="crm-act-follow"> Créer une relance</label>'
        + '<button class="crm-btn primary" type="button" id="crm-act-save">Enregistrer</button></div>';
    } else if (mode === 'note') {
      html += '<textarea class="crm-ta" id="crm-note" placeholder="Info budget, organisation, contexte… (visible par toute l’équipe)" aria-label="Note"></textarea>'
        + '<div class="foot"><span class="crm-meta" style="margin-right:auto">Ctrl+Entrée pour enregistrer</span><button class="crm-btn primary" type="button" id="crm-note-save">Ajouter la note</button></div>';
    } else {
      html += '<input class="crm-input" id="crm-task-title" maxlength="300" placeholder="Ex. Rappeler le chef du service drones" aria-label="Tâche">'
        + '<div class="foot"><span class="crm-row">'
        + '<button type="button" class="crm-chip sm" data-due="' + addDays(1) + '">Demain</button><button type="button" class="crm-chip sm" data-due="' + addDays(7) + '">1 semaine</button><button type="button" class="crm-chip sm" data-due="' + addDays(30) + '">1 mois</button>'
        + '<input class="crm-sel" type="date" id="crm-task-due" aria-label="Échéance" value="' + addDays(7) + '">' + ctSelect('crm-task-ct') + '</span>'
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
        save.disabled = true;
        api('/crm/activities', { method: 'POST', body: body }).then(function () {
          if (!follow) return null;
          return api('/crm/tasks', { method: 'POST', body: { title: 'Relancer après ' + ACT_LABEL[type].toLowerCase(), due_date: addDays(7), end_user_id: accId || null, contact_id: ct || null } });
        }).then(function () { toast(follow ? 'Activité et relance enregistrées' : 'Activité enregistrée'); return reload(); })
          .catch(function (e) { toast('Erreur : ' + e.message); save.disabled = false; });
      };
      if (focus) document.getElementById('crm-act-notes').focus();
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
      return '<tr data-pid="' + esc(c.id) + '"><td class="c-nom"><div class="crm-acc-name">' + esc(personName(c)) + '</div><div class="crm-acc-sub">' + esc(c.titre || '') + '</div></td>'
        + '<td class="c-account">' + (c.end_user_id ? tierBadge(c.tier) + ' <button type="button" class="crm-link" data-pacc="' + esc(c.end_user_id) + '">' + esc(c.account_nom || c.organisation || '') + '</button>' : '<span class="crm-muted">' + esc(c.organisation || 'Sans compte') + '</span>') + '</td>'
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
  function onTasksPanel() {
    var p = document.getElementById('panel-tasks'); if (!p) return;
    if (!document.getElementById('crm-tasks')) {
      p.innerHTML = '<div class="crm-wrap" id="crm-tasks"><div class="crm-row" style="justify-content:space-between;margin-bottom:12px;gap:10px">'
        + '<div class="crm-views" style="margin:0" role="tablist">' + [['all', 'Tout'], ['task', 'Tâches'], ['relance', 'Relances'], ['reply', 'Réponses']].map(function (x) { return '<button type="button" class="crm-chip" data-qf="' + x[0] + '">' + x[1] + '<span class="n" data-qn="' + x[0] + '"></span></button>'; }).join('') + '</div>'
        + '<div class="crm-views" style="margin:0"><button type="button" class="crm-chip" data-scope="me">Moi</button><button type="button" class="crm-chip" data-scope="team">Équipe</button>'
        + '<button type="button" class="crm-chip" data-state="done">Terminées (30 j)</button></div></div>'
        + '<div class="crm-newtask"><input class="crm-input" id="crm-nt-title" maxlength="300" placeholder="Nouvelle tâche, ex. Préparer la démo pour le SDIS 69" aria-label="Nouvelle tâche">'
        + '<input class="crm-input" type="date" id="crm-nt-due" aria-label="Échéance" value="' + addDays(1) + '">'
        + '<select class="crm-input" id="crm-nt-owner" aria-label="Attribuer à"></select>'
        + '<button class="crm-btn primary" type="button" id="crm-nt-save">Ajouter</button></div>'
        + '<div class="crm-meta" style="margin:-8px 0 16px">Les relances dues (cadence J+14 / J+28 après le 1er email) et les réponses positives arrivent ici automatiquement. <button type="button" class="crm-link" id="crm-trk-link">Vue détaillée des relances</button></div>'
        + '<div id="crm-tasks-list"></div></div>';
      p.querySelectorAll('[data-scope]').forEach(function (b) { b.onclick = function () { S.taskScope = b.getAttribute('data-scope'); S.taskState = 'open'; loadTasks(); }; });
      p.querySelectorAll('[data-qf]').forEach(function (b) { b.onclick = function () { S.qFilter = b.getAttribute('data-qf'); S.taskState = 'open'; loadTasks(); }; });
      p.querySelector('[data-state="done"]').onclick = function () { S.taskState = S.taskState === 'done' ? 'open' : 'done'; loadTasks(); };
      document.getElementById('crm-trk-link').onclick = function () { go('tracking', { legacy: true }); };
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
      if (sel && !sel.options.length) sel.innerHTML = F.users.map(function (u) { return opt(u.id, u.name, F.me.user_id); }).join('');
    }).catch(function () {});
    loadTasks();
  }

  function loadTasks() {
    var p = document.getElementById('crm-tasks'); if (!p) return;
    S.inTasksPanel = true;
    S.qFilter = S.qFilter || 'all';
    p.querySelectorAll('[data-scope]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-scope') === S.taskScope); });
    p.querySelectorAll('[data-qf]').forEach(function (b) { b.classList.toggle('on', S.taskState === 'open' && b.getAttribute('data-qf') === S.qFilter); });
    p.querySelector('[data-state="done"]').classList.toggle('on', S.taskState === 'done');
    var list = document.getElementById('crm-tasks-list');
    list.innerHTML = '<div class="crm-empty">Chargement…</div>';
    if (S.taskState === 'done') {
      api('/crm/tasks?scope=' + S.taskScope + '&state=done').then(function (d) {
        var tasks = d.tasks || [];
        list.innerHTML = tasks.length ? '<div class="crm-card">' + tasks.map(taskHtml).join('') + '</div>' : '<div class="crm-empty">Aucune tâche terminée ces 30 derniers jours.</div>';
        bindTasks(list, loadTasks);
      }).catch(function (e) { list.innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
      return;
    }
    loadQueue(S.taskScope).then(function (items) {
      if (S.taskScope === 'me') updateBadge(items);
      var counts = { all: items.length, task: 0, relance: 0, reply: 0 }; items.forEach(function (x) { counts[x.kind]++; });
      p.querySelectorAll('[data-qn]').forEach(function (n) { var c = counts[n.getAttribute('data-qn')]; n.textContent = c ? ' ' + c : ''; });
      var shown = S.qFilter === 'all' ? items : items.filter(function (x) { return x.kind === S.qFilter; });
      if (!shown.length) { list.innerHTML = '<div class="crm-empty">Rien dans cette file. Les tâches créées depuis une fiche, les relances dues et les réponses positives arrivent ici.</div>'; return; }
      var t = todayStr(), w = addDays(7), html = '';
      [
        { k: 'reply', label: 'Réponses à traiter', test: function (x) { return x.kind === 'reply'; } },
        { k: 'late', label: 'En retard', test: function (x) { return x.kind !== 'reply' && x.due && x.due < t; } },
        { k: 'today', label: "Aujourd'hui", test: function (x) { return x.kind !== 'reply' && x.due === t; } },
        { k: 'week', label: '7 prochains jours', test: function (x) { return x.kind !== 'reply' && x.due > t && x.due <= w; } },
        { k: 'later', label: 'Plus tard', test: function (x) { return x.kind !== 'reply' && x.due > w; } },
        { k: 'none', label: 'Sans échéance', test: function (x) { return x.kind !== 'reply' && !x.due; } }
      ].forEach(function (g) {
        var its = shown.filter(g.test); if (!its.length) return;
        html += '<div class="crm-tasks-sec"><h4 class="' + (g.k === 'late' ? 'late' : '') + '">' + g.label + ' · ' + its.length + '</h4><div class="crm-card" style="padding-top:4px;padding-bottom:4px">'
          + its.map(function (x) { return queueItemHtml(x, { showWho: S.taskScope === 'team' }); }).join('') + '</div></div>';
      });
      list.innerHTML = html;
      bindQueue(list, loadTasks);
    }).catch(function (e) { list.innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }

  function updateBadge(items) {
    var t = todayStr();
    S.badgeCount = (items || []).filter(function (x) { return x.kind === 'reply' || (x.due && x.due <= t); }).length;
    paintBadge();
  }
  function paintBadge() {
    var b = document.getElementById('subnav-tasks-badge');
    if (b && typeof S.badgeCount === 'number') { b.textContent = S.badgeCount > 99 ? '99+' : S.badgeCount; b.style.display = S.badgeCount ? '' : 'none'; }
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
      else if (id === 'tasks') onTasksPanel();
      else if (id === 'home') onHomePanel();
      else if (id === 'stats') onStatsPanel();
      else if (id === 'signals') onSignalsPanel();
      else if (id === 'prospection') onProspectionPanel();
      else if (id === 'market') onMarketPanel();
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
      ['nav-prospection-badge', 'bn-prospection-badge'].forEach(function (id) {
        var b = document.getElementById(id); if (!b) return;
        b.textContent = n > 9 ? '9+' : String(n);
        b.style.display = n ? 'inline-block' : 'none';
        b.setAttribute('aria-label', n + ' action(s) proposée(s)');
      });
      var last = parseInt(lsGet('scout_prop_seen', '0'), 10) || 0;
      if (n > last) toast(n - last > 1 ? (n - last) + ' nouvelles actions proposées dans Prospection' : 'Nouvelle action proposée dans Prospection');
      lsSet('scout_prop_seen', String(n));
    }).catch(function () {});
  }

  window.scoutCrm = { onPanel: onPanel, openAccount: openAccount, openContact: openContact, openAccounts: openAccountsWith, refreshBadge: refreshBadge, refreshPropBadge: refreshPropBadge };
  setTimeout(refreshBadge, 2500);
  setInterval(refreshBadge, 5 * 60 * 1000);
  setTimeout(refreshPropBadge, 3500);
  setInterval(refreshPropBadge, 5 * 60 * 1000);
})();
