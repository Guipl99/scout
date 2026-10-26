/* Scout : prospection account-based (portefeuille, comptes, contacts, tâches). Dynamics reste le CRM.
   Chargé après le script principal (index.html). Expose window.scoutCrm.
   Données : API /crm/* (scout-api/crm.js). */
(function () {
  'use strict';

  var API = (window.SCOUT_API_URL) || 'https://scout-api-production-fa8d.up.railway.app';
  var PAGE = 100;

  var STATUS_LABEL = { nouveau: 'Nouveau', contacte: 'Contacté', engage: 'Engagé', qualifie: 'Qualifié', transmis: 'Transmis CRM', client: 'Client', perdu: 'Perdu' };
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
    already_prospected_external: 'Déjà prospecté hors Scout', not_relevant: 'Marqué non pertinent', transmitted_crm: 'Transmis au CRM',
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
    sort: lsGet('scout_crm_sort', { sort: 'score', dir: 'desc' }),
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
  // ACCUEIL : PORTEFEUILLE
  // ═════════════════════════════════════════════════════════════════════════
  function onHomePanel() {
    var p = document.getElementById('panel-home'); if (!p) return;
    p.innerHTML = '<div class="crm-wrap crm-home"><div class="crm-row" style="justify-content:space-between;margin-bottom:14px;">'
      + '<div><h2 class="crm-h2" id="crm-home-title">Mon portefeuille</h2><div class="crm-meta">Les comptes à travailler en priorité, mis à jour en continu.</div></div>'
      + '<div class="crm-views" style="margin:0"><button type="button" class="crm-chip" data-hs="me">Mes comptes</button><button type="button" class="crm-chip" data-hs="team">Toute l’équipe</button></div></div>'
      + '<div id="crm-home-body"><div class="crm-empty">Chargement…</div></div></div>';
    p.querySelectorAll('[data-hs]').forEach(function (b) { b.onclick = function () { S.homeScope = b.getAttribute('data-hs'); loadHome(); }; });
    loadFacets().then(loadHome).catch(function (e) { document.getElementById('crm-home-body').innerHTML = '<div class="crm-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }

  function loadHome() {
    var p = document.getElementById('panel-home'); if (!p) return;
    p.querySelectorAll('[data-hs]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-hs') === S.homeScope); });
    var body = document.getElementById('crm-home-body');
    var team = S.homeScope === 'team';
    Promise.all([api('/crm/home?owner=' + (team ? 'team' : 'me')), api('/crm/tasks?scope=' + (team ? 'team' : 'me') + '&state=open')]).then(function (r) {
      var d = r[0], tasks = (r[1].tasks || []).filter(function (t) { return !t.due_date || t.due_date <= addDays(1); }).slice(0, 8);
      var k = d.kpi || {};
      var ownerF = team ? {} : { owner: 'me' };
      var tile = function (val, label, filters, cls) {
        return '<button type="button" class="crm-kpi ' + (cls || '') + '" data-kf=\'' + esc(JSON.stringify(Object.assign({}, ownerF, filters))) + '\'><b>' + esc(val) + '</b><span>' + esc(label) + '</span></button>';
      };
      var html = '';
      if (!team && !k.n) {
        html += '<div class="crm-card crm-callout"><b>Aucun compte ne vous est encore attribué.</b> Ouvrez <button type="button" class="crm-link" data-goto-acc=\'{"owner":"none","contacts":"with"}\'>les comptes sans propriétaire</button>, filtrez par pays, sélectionnez et assignez-vous les vôtres en une fois.</div>';
      }
      html += '<div class="crm-kpis">'
        + tile(k.n || 0, team ? 'Comptes suivis' : 'Mes comptes', {})
        + tile((k.t1 || 0) + ' · ' + (k.t2 || 0) + ' · ' + (k.t3 || 0), 'Tier 1 · 2 · 3', { tier: '1,2,3' })
        + tile(k.hot || 0, 'Comptes chauds', { heat: 'chaud' }, k.hot ? 'good' : '')
        + tile(k.stale || 0, 'Tier 1–2 sans activité 30 j', { tier: '1,2', activity: 'stale30' }, k.stale ? 'warn' : '')
        + tile(k.gaps || 0, 'Comités incomplets (T1–2)', { tier: '1,2', coverage: 'incomplete' }, k.gaps ? 'warn' : '')
        + tile(k.overdue || 0, 'Comptes avec tâche en retard', { tasks: 'overdue' }, k.overdue ? 'bad' : '')
        + '</div>';
      var accList = function (rows, empty, extra) {
        if (!rows.length) return '<div class="crm-meta" style="padding:6px 0">' + empty + '</div>';
        return rows.map(function (a) {
          return '<button type="button" class="crm-mini" data-acc="' + esc(a.id) + '">' + tierBadge(a.tier)
            + '<span class="m"><b>' + esc(a.nom) + '</b><span>' + esc([a.pays, extra(a)].filter(Boolean).join(' · ')) + '</span></span>'
            + heatBadge(a.score, a.heat) + '</button>';
        }).join('');
      };
      html += '<div class="crm-home-grid">'
        + '<div class="crm-card"><h3>Comptes chauds <span class="crm-meta">engagement 90 j</span></h3>' + accList(d.hot, 'Aucun compte engagé ces 90 derniers jours.', function (a) { return a.last_activity_at ? 'activité ' + relTime(a.last_activity_at) : ''; }) + '</div>'
        + '<div class="crm-card"><h3>Tier 1–2 à relancer <span class="crm-meta">rien depuis 30 j</span></h3>' + accList(d.stale, 'Tous les comptes prioritaires ont eu une activité récente.', function (a) { return a.last_activity_at ? 'dernière activité ' + relTime(a.last_activity_at) : 'jamais contacté'; }) + '</div>'
        + '<div class="crm-card"><h3>Comités à compléter <span class="crm-meta">Tier 1–2</span></h3>' + (d.gaps.length ? d.gaps.map(function (a) {
          var miss = KEY_ROLES.filter(function (r) { return (a.roles || []).indexOf(r) < 0; }).map(function (r) { return ROLE_LABEL[r].toLowerCase(); });
          return '<button type="button" class="crm-mini" data-acc="' + esc(a.id) + '">' + tierBadge(a.tier) + '<span class="m"><b>' + esc(a.nom) + '</b><span>Manque : ' + esc(miss.join(', ')) + '</span></span>' + coverageDots(a.roles) + '</button>';
        }).join('') : '<div class="crm-meta" style="padding:6px 0">Les comités des comptes prioritaires sont couverts.</div>') + '</div>'
        + '<div class="crm-card"><h3>Tâches du jour <button type="button" class="crm-link" data-goto="tasks">Tout voir</button></h3>' + (tasks.length ? tasks.map(taskHtml).join('') : '<div class="crm-meta" style="padding:6px 0">Rien d’urgent.</div>') + '</div>'
        + '<div class="crm-card"><h3>Visites sur elistair.com <span class="crm-meta">90 j</span></h3>' + accList(d.web, 'Aucune visite rattachée à vos comptes. Le rattachement se fait par le domaine du compte.', function (a) { return a.web_pages_90d + ' page' + (a.web_pages_90d > 1 ? 's' : '') + (a.last_visit ? ', ' + relTime(a.last_visit) : ''); }) + '</div>'
        + '</div>';
      body.innerHTML = html;
      body.querySelectorAll('[data-kf]').forEach(function (b) { b.onclick = function () { openAccountsWith(JSON.parse(b.getAttribute('data-kf'))); }; });
      body.querySelectorAll('[data-goto-acc]').forEach(function (b) { b.onclick = function () { openAccountsWith(JSON.parse(b.getAttribute('data-goto-acc'))); }; });
      body.querySelectorAll('[data-goto]').forEach(function (b) { b.onclick = function () { go(b.getAttribute('data-goto')); }; });
      bindTasks(body, loadHome);
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
    p.innerHTML = '<div class="crm-wrap" id="crm-list">'
      + '<div class="crm-views" id="crm-views" role="tablist" aria-label="Vues"></div>'
      + '<div class="crm-toolbar" id="crm-toolbar"></div>'
      + '<div class="crm-row" style="justify-content:space-between;margin-bottom:8px;"><span class="crm-meta" id="crm-count" aria-live="polite"></span>'
      + '<span class="crm-row"><button class="crm-btn ghost" id="crm-reset" type="button">Réinitialiser</button>'
      + '<button class="crm-btn ghost" id="crm-export" type="button">Exporter (CSV)</button></span></div>'
      + '<div class="crm-table-wrap"><table class="crm-table" id="crm-table"><thead></thead><tbody></tbody></table>'
      + '<div class="crm-more" id="crm-more" style="display:none"><button class="crm-btn" type="button" id="crm-more-btn">Afficher plus</button></div></div>'
      + '<div id="crm-bulk"></div>'
      + '</div><div class="crm-wrap crm-record" id="crm-detail" style="display:none"></div>';
    document.getElementById('crm-reset').onclick = function () { applyView('all'); };
    document.getElementById('crm-export').onclick = function () { exportCsv(); };
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
      + '<button type="button" class="crm-btn crm-filters-btn" id="crm-filters-btn" aria-expanded="' + !!S.filtersOpen + '">Filtres' + (nf ? ' (' + nf + ')' : '') + '</button>'
      + sel('owner', 'Propriétaire', opt('me', 'Moi', f.owner) + opt('none', 'Sans propriétaire', f.owner) + F.users.map(function (u) { return opt(u.id, u.name, f.owner); }).join(''))
      + sel('tier', 'Tier', opt('1', 'Tier 1', f.tier) + opt('2', 'Tier 2', f.tier) + opt('3', 'Tier 3', f.tier) + opt('1,2', 'Tier 1 et 2', f.tier) + opt('none', 'Sans tier', f.tier))
      + sel('heat', 'Engagement', opt('chaud', 'Chaud', f.heat) + opt('tiede', 'Tiède', f.heat) + opt('chaud,tiede', 'Chaud ou tiède', f.heat) + opt('froid', 'Froid', f.heat))
      + sel('status', 'Statut', STATUS_ORDER.map(function (s) { return opt(s, STATUS_LABEL[s], f.status); }).join(''))
      + sel('coverage', 'Comité', opt('incomplete', 'Incomplet', f.coverage) + opt('no_decideur', 'Sans décideur', f.coverage) + opt('complete', 'Complet', f.coverage))
      + sel('pays', 'Pays', F.pays.map(function (x) { return opt(x.v, x.v + ' (' + x.n + ')', f.pays); }).join(''))
      + sel('secteur', 'Secteur', F.secteurs.map(function (x) { return opt(x.v, x.v + ' (' + x.n + ')', f.secteur); }).join(''))
      + sel('activity', 'Activité', opt('30', 'Moins de 30 j', f.activity) + opt('90', 'Moins de 90 j', f.activity) + opt('stale30', 'Rien depuis 30 j', f.activity) + opt('stale90', 'Rien depuis 90 j', f.activity) + opt('never', 'Jamais contacté', f.activity))
      + sel('tasks', 'Tâches', opt('open', 'Tâche ouverte', f.tasks) + opt('overdue', 'Tâche en retard', f.tasks) + opt('none', 'Aucune tâche', f.tasks))
      + sel('web', 'Site web', opt('yes', 'A visité le site (90 j)', f.web));
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
  function fetchAccounts(more) {
    var seq = ++fetchSeq;
    if (!more) { S.rows = []; S.selected = {}; renderBulk(); }
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

  var COLS = [
    { k: 'tier', label: 'Tier', sort: 'tier', asc: true },
    { k: 'nom', label: 'Compte', sort: 'nom', asc: true },
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
    if (cnt) cnt.textContent = S.total.toLocaleString('fr-FR') + ' compte' + (S.total > 1 ? 's' : '') + (S.rows.length < S.total ? ' · ' + S.rows.length + ' affichés' : '');
    if (!S.rows.length) {
      tb.innerHTML = '<tr><td colspan="10" class="crm-empty">Aucun compte ne correspond à ces filtres.</td></tr>';
    } else {
      tb.innerHTML = S.rows.map(function (r) {
        var sel = !!S.selected[r.id];
        return '<tr data-id="' + esc(r.id) + '" class="' + (sel ? 'sel' : '') + '">'
          + '<td class="cb"><input type="checkbox" data-cb="' + esc(r.id) + '" aria-label="Sélectionner ' + esc(r.nom) + '"' + (sel ? ' checked' : '') + '></td>'
          + '<td class="c-tier">' + tierBadge(r.tier) + '</td>'
          + '<td class="c-nom"><div class="crm-acc-name">' + esc(r.nom) + '</div><div class="crm-acc-sub">' + esc([r.pays, r.secteur].filter(Boolean).join(' · ')) + (r.n_contacts ? ' · ' + r.n_contacts + ' contact' + (r.n_contacts > 1 ? 's' : '') : '') + '</div></td>'
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
      + '<button class="crm-btn" type="button" id="crm-bulk-export">Exporter</button>'
      + '<button class="crm-btn ghost" type="button" id="crm-bulk-clear" style="margin-left:auto">Désélectionner</button></div>';
    var run = function (body, label) {
      api('/crm/accounts/bulk', { method: 'POST', body: Object.assign({ ids: ids }, body) }).then(function (d) {
        toast(label + ' : ' + d.updated + ' compte' + (d.updated > 1 ? 's' : '')); fetchAccounts();
      }).catch(function (e) { toast('Erreur : ' + e.message); });
    };
    document.getElementById('crm-bulk-owner').onchange = function (e) { var v = e.target.value; if (v) run({ owner_user_id: v === '__none' ? null : v }, 'Propriétaire mis à jour'); };
    document.getElementById('crm-bulk-tier').onchange = function (e) { var v = e.target.value; if (v) run({ tier: v === '__none' ? null : v }, 'Tier mis à jour'); };
    document.getElementById('crm-bulk-status').onchange = function (e) { var v = e.target.value; if (v) run({ crm_status: v === '__auto' ? null : v }, 'Statut mis à jour'); };
    document.getElementById('crm-bulk-export').onclick = function () { exportCsv(S.rows.filter(function (r) { return S.selected[r.id]; })); };
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
      { k: 'linkedin_url', label: 'LinkedIn', type: 'text', value: a.linkedin_url, display: a.linkedin_url ? '<a class="crm-link" href="' + esc(a.linkedin_url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">Page LinkedIn</a>' : null, placeholder: 'Ajouter' },
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
      + '<div class="crm-rec-head"><div class="crm-rec-id">' + tierBadge(a.tier) + '<div style="min-width:0"><h2>' + esc(a.nom) + '</h2>'
      + '<div class="crm-meta">' + esc([a.pays, a.ville, a.secteur].filter(Boolean).join(' · ')) + (sm.domain ? ' · <a class="crm-link" href="https://' + esc(sm.domain) + '" target="_blank" rel="noopener">' + esc(sm.domain) + '</a>' : '') + '</div></div></div>'
      + '<div class="crm-rec-kpis">'
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
      + (typeof window._legacyOpenEndUser === 'function' ? '<button type="button" class="crm-link" id="crm-legacy" style="margin-top:10px;font-size:12.5px">Fiche marché : produits et fournisseurs</button>' : '') + '</div>'
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
      + '<div class="crm-card"><h3>Tâches <span class="crm-meta">' + openTasks.length + ' ouverte' + (openTasks.length > 1 ? 's' : '') + '</span></h3>'
      + (openTasks.length ? openTasks.map(taskHtml).join('') : '<div class="crm-meta">Aucune tâche ouverte.</div>')
      + (doneTasks.length ? '<details style="margin-top:8px"><summary class="crm-meta" style="cursor:pointer">' + doneTasks.length + ' terminée' + (doneTasks.length > 1 ? 's' : '') + '</summary>' + doneTasks.map(taskHtml).join('') + '</details>' : '')
      + '</div>'
      + (A.web && A.web.length ? '<div class="crm-card"><h3>Pages vues <span class="crm-meta">elistair.com</span></h3>' + A.web.map(function (w) {
        return '<div class="crm-webrow"><span>' + esc(w.title && w.title !== 'Elistair' ? w.title : w.path) + '</span><span class="crm-meta">' + esc(relTime(w.ts)) + '</span></div>';
      }).join('') + '</div>' : '')
      + '</aside></div>';

    // liaisons
    document.getElementById('crm-back').onclick = backToList;
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
      p.innerHTML = '<div class="crm-wrap" id="crm-plist"><div class="crm-toolbar" id="crm-ptoolbar"></div>'
        + '<div class="crm-row" style="justify-content:space-between;margin-bottom:8px;"><span class="crm-meta" id="crm-pcount" aria-live="polite"></span><button class="crm-btn ghost" id="crm-pexport" type="button">Exporter (CSV)</button></div>'
        + '<div class="crm-table-wrap"><table class="crm-table" id="crm-ptable"><thead></thead><tbody></tbody></table>'
        + '<div class="crm-more" id="crm-pmore" style="display:none"><button class="crm-btn" type="button" id="crm-pmore-btn">Afficher plus</button></div></div></div>'
        + '<div class="crm-wrap crm-record" id="crm-pdetail" style="display:none"></div>';
      document.getElementById('crm-pmore-btn').onclick = function () { fetchPeople(true); };
      document.getElementById('crm-pexport').onclick = exportPeople;
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
      + '<button type="button" class="crm-btn crm-filters-btn" id="crm-pfilters-btn">Filtres' + (nf ? ' (' + nf + ')' : '') + '</button>'
      + sel('role', 'Rôle', Object.keys(ROLE_LABEL).map(function (r) { return opt(r, ROLE_LABEL[r], f.role); }).join('') + opt('none', 'Rôle inconnu', f.role))
      + sel('owner', 'Propriétaire du compte', opt('me', 'Mes comptes', f.owner) + opt('none', 'Sans propriétaire', f.owner) + F.users.map(function (u) { return opt(u.id, u.name, f.owner); }).join(''))
      + sel('tier', 'Tier du compte', opt('1', 'Tier 1', f.tier) + opt('2', 'Tier 2', f.tier) + opt('3', 'Tier 3', f.tier))
      + sel('activity', 'Activité', opt('30', 'Moins de 30 j', f.activity) + opt('never', 'Jamais contacté', f.activity))
      + sel('account', 'Compte', opt('with', 'Rattaché à un compte', f.account) + opt('without', 'Sans compte', f.account))
      + sel('email', 'Email', opt('none', 'Sans email', f.email));
    el.classList.toggle('open', !!S.pFiltersOpen);
    document.getElementById('crm-pfilters-btn').onclick = function () { S.pFiltersOpen = !S.pFiltersOpen; el.classList.toggle('open', S.pFiltersOpen); };
    var t;
    document.getElementById('crm-pq').oninput = function (e) { clearTimeout(t); var v = e.target.value.trim(); t = setTimeout(function () { setPFilter('q', v); }, 300); };
    el.querySelectorAll('[data-pf]').forEach(function (s) { s.onchange = function () { setPFilter(s.getAttribute('data-pf'), s.value); }; });
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
      return '<th class="c-' + c[0] + (sortable ? ' sortable" data-psort="' + c[0] + '" data-asc="' + c[2] : '') + '">' + c[1] + (on ? '<span class="arr">' + (P.sort.dir === 'asc' ? '▲' : '▼') + '</span>' : '') + '</th>';
    }).join('') + '</tr>';
    th.querySelectorAll('[data-psort]').forEach(function (h) {
      h.onclick = function () { var s = h.getAttribute('data-psort'); P.sort = { sort: s, dir: P.sort.sort === s ? (P.sort.dir === 'asc' ? 'desc' : 'asc') : (h.getAttribute('data-asc') === '1' ? 'asc' : 'desc') }; fetchPeople(); };
    });
    document.getElementById('crm-pcount').textContent = P.total.toLocaleString('fr-FR') + ' contact' + (P.total > 1 ? 's' : '') + (P.rows.length < P.total ? ' · ' + P.rows.length + ' affichés' : '');
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
      { k: 'linkedin', label: 'LinkedIn', type: 'text', value: c.linkedin, display: c.linkedin ? '<a class="crm-link" href="' + esc(c.linkedin) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">Profil LinkedIn</a>' : null, placeholder: 'Ajouter' },
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
  // MES TÂCHES
  // ═════════════════════════════════════════════════════════════════════════
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
        + '<div class="crm-meta" style="margin:-8px 0 16px">Pour rattacher une tâche à un compte ou un contact, créez-la depuis sa fiche.</div>'
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
      if (sel && !sel.options.length) sel.innerHTML = F.users.map(function (u) { return opt(u.id, u.name, F.me.user_id); }).join('');
    }).catch(function () {});
    loadTasks();
  }

  function loadTasks() {
    var p = document.getElementById('crm-tasks'); if (!p) return;
    S.inTasksPanel = true;
    p.querySelectorAll('[data-scope]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-scope') === S.taskScope); });
    p.querySelectorAll('[data-state]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-state') === S.taskState); });
    var list = document.getElementById('crm-tasks-list');
    list.innerHTML = '<div class="crm-empty">Chargement…</div>';
    api('/crm/tasks?scope=' + S.taskScope + '&state=' + S.taskState).then(function (d) {
      var tasks = d.tasks || [];
      if (S.taskState === 'open' && S.taskScope === 'me') updateBadge(tasks);
      if (!tasks.length) { list.innerHTML = '<div class="crm-empty">' + (S.taskState === 'open' ? 'Rien à faire. Les tâches créées depuis une fiche arrivent ici.' : 'Aucune tâche terminée ces 30 derniers jours.') + '</div>'; return; }
      var html = '';
      if (S.taskState === 'done') html = '<div class="crm-card">' + tasks.map(taskHtml).join('') + '</div>';
      else {
        var t = todayStr(), w = addDays(7);
        [
          { k: 'late', label: 'En retard', test: function (x) { return x.due_date && x.due_date < t; } },
          { k: 'today', label: "Aujourd'hui", test: function (x) { return x.due_date === t; } },
          { k: 'week', label: '7 prochains jours', test: function (x) { return x.due_date > t && x.due_date <= w; } },
          { k: 'later', label: 'Plus tard', test: function (x) { return x.due_date > w; } },
          { k: 'none', label: 'Sans échéance', test: function (x) { return !x.due_date; } }
        ].forEach(function (g) {
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
    S.badgeCount = (tasks || []).filter(function (x) { return x.due_date && x.due_date <= t; }).length;
    paintBadge();
  }
  function paintBadge() {
    var b = document.getElementById('subnav-tasks-badge');
    if (b && typeof S.badgeCount === 'number') { b.textContent = S.badgeCount; b.style.display = S.badgeCount ? '' : 'none'; }
  }
  function refreshBadge() {
    if (!(window.getAuthHeaders && window.getAuthHeaders().Authorization)) return;
    api('/crm/tasks?scope=me&state=open').then(function (d) { updateBadge(d.tasks); }).catch(function () {});
  }

  // ── branchement ───────────────────────────────────────────────────────────
  function onPanel(id, opts) {
    try {
      if (id !== 'tasks') S.inTasksPanel = false;
      if (id === 'accounts') onAccountsPanel(opts || {});
      else if (id === 'people') onPeoplePanel(opts || {});
      else if (id === 'tasks') onTasksPanel();
      else if (id === 'home') onHomePanel();
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

  window.scoutCrm = { onPanel: onPanel, openAccount: openAccount, openContact: openContact, refreshBadge: refreshBadge };
  setTimeout(refreshBadge, 2500);
  setInterval(refreshBadge, 5 * 60 * 1000);
})();
