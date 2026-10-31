/* Scout, mode appli (téléphone).
   Interface simplifiée en 5 onglets : Aujourd'hui, Comptes, Saisir, Signaux, Moi.
   S'active quand Scout est installé sur l'écran d'accueil, ou sur un écran de téléphone
   (l'utilisateur peut repasser à la version complète). Verrou par code, plus Face ID ou
   empreinte quand l'appareil le permet. Aucun email ne part d'ici : on ouvre la messagerie. */
(function () {
  'use strict';
  var LS_PREF = 'scout_app_pref';     // 'app' | 'full'
  var LS_LOCK = 'scout_app_lock';     // { pin: {salt, hash, it}, cred: b64|null, after: minutes }
  var LS_SESSION = 'scout_chat_session';
  var A = { tab: 'today', stack: [], qScope: 'me', accQ: '', fails: 0 };

  // ── utilitaires ────────────────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function session() { try { return JSON.parse(ls(LS_SESSION) || 'null'); } catch (e) { return null; } }
  function crm() { return window.scoutCrm || {}; }
  function api(p, o) { return crm().api(p, o); }
  function pname(c) { return ((c.prenom || '') + ' ' + (c.nom || '')).trim() || 'Sans nom'; }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function today() { return ymd(new Date()); }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
  function daysFrom(d) { return d ? Math.round((new Date(today()) - new Date(String(d).slice(0, 10))) / 864e5) : null; }
  function fmtDate(v) { if (!v) return ''; var d = new Date(String(v).length <= 10 ? v + 'T12:00:00' : v); return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); }
  function rel(iso) {
    if (!iso) return ''; var m = Math.round((Date.now() - new Date(iso)) / 6e4);
    if (m < 60) return 'il y a ' + Math.max(1, m) + ' min'; if (m < 1440) return 'il y a ' + Math.round(m / 60) + ' h';
    var d = Math.round(m / 1440); return d === 1 ? 'hier' : (d < 30 ? 'il y a ' + d + ' j' : fmtDate(iso));
  }
  var masked = function (v) { return !v || /[●•]|masked/i.test(v); };
  function toast(msg) {
    var t = document.getElementById('sa-toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }
  var I = {
    today: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    acc: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    sig: '<svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0"/><circle cx="12" cy="12" r="1.2"/><path d="M12 13v7"/></svg>',
    me: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/></svg>',
    li: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    finger: '<svg viewBox="0 0 24 24"><path d="M12 11v4M8.5 8.5A5 5 0 0 1 17 12v2M7 12a5 5 0 0 0 0 1v2M12 7a5 5 0 0 0-5 5M9.5 19c1-1.5 1.5-3 1.5-5M14.5 20c.5-1.5 1-3.5 1-6"/></svg>'
  };

  // ── activation ─────────────────────────────────────────────────────────────
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  function phone() { return Math.min(window.innerWidth, screen.width || 9999) <= 760; }
  function wanted() { var p = ls(LS_PREF); if (p === 'full') return false; if (p === 'app') return true; return standalone() || phone(); }

  function boot() {
    if (!wanted()) { addReturnChip(); return; }
    if (!session() || !crm().api) { setTimeout(boot, 800); return; } // pas encore connecté : l'écran de connexion reste
    start();
  }

  function start() {
    if (document.getElementById('sa')) return;
    document.body.classList.add('app-mode');
    var root = document.createElement('div');
    root.id = 'sa';
    root.innerHTML = '<header class="sa-top" id="sa-top"></header><main class="sa-view" id="sa-view"></main>'
      + '<div class="sa-sheet" id="sa-sheet" hidden></div>'
      + '<nav class="sa-tabs" aria-label="Navigation">'
      + tabBtn('today', 'Aujourd’hui', I.today) + tabBtn('accounts', 'Comptes', I.acc)
      + '<button type="button" class="sa-tab sa-add" data-tab="burst" aria-label="Traiter ma file"><span>' + I.send + '</span><em class="sa-add-n" id="sa-burst-n" hidden></em></button>'
      + tabBtn('signals', 'Signaux', I.sig) + tabBtn('me', 'Moi', I.me) + '</nav>'
      + '<div class="sa-toast" id="sa-toast" role="status" aria-live="polite"></div>';
    document.body.appendChild(root);
    root.querySelectorAll('[data-tab]').forEach(function (b) {
      b.onclick = function () { var t = b.getAttribute('data-tab'); if (t === 'entry') { openEntry({}); return; } if (t === 'burst') { openBurst(); return; } show(t); };
    });
    window.addEventListener('popstate', function () { if (A.stack.length && !A.locked) closeSheet(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { A.hiddenAt = Date.now(); return; }
      if (lockDue()) lock(); else if (A.tab === 'today' && !A.stack.length) renderToday(true);
    });
    show('today');
    if (lockConf()) lock();
  }
  function tabBtn(id, label, ic) { return '<button type="button" class="sa-tab" data-tab="' + id + '"><span>' + ic + '</span><b>' + label + '</b></button>'; }

  function show(tab) {
    A.tab = tab;
    closeAll();
    document.querySelectorAll('#sa .sa-tab').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === tab); });
    var v = document.getElementById('sa-view'); v.scrollTop = 0;
    ({ today: renderToday, accounts: renderAccounts, signals: renderSignals, me: renderMe })[tab]();
  }
  function top(title, sub, right) {
    document.getElementById('sa-top').innerHTML = '<div class="sa-top-t"><h1>' + esc(title) + '</h1>' + (sub ? '<div class="sa-sub">' + sub + '</div>' : '') + '</div>' + (right || '');
  }

  // ── fiches plein écran (empilées, retour arrière du téléphone géré) ────────
  // A.stack : une entrée par fiche ouverte, avec de quoi la redessiner au retour.
  function openSheet(html, bind, redraw) {
    var sh = document.getElementById('sa-sheet');
    if (A.redrawing) { A.redrawing = false; A.stack[A.stack.length - 1] = { redraw: redraw }; }
    else { A.stack.push({ redraw: redraw }); try { history.pushState({ sa: A.stack.length }, ''); } catch (e) {} }
    sh.innerHTML = html; sh.hidden = false; sh.scrollTop = 0;
    sh.querySelectorAll('[data-back]').forEach(function (b) { b.onclick = function () { history.back(); }; });
    if (bind) bind(sh);
  }
  function closeSheet() {
    var sh = document.getElementById('sa-sheet');
    A.stack.pop();
    var prev = A.stack[A.stack.length - 1];
    if (prev && prev.redraw) { A.redrawing = true; prev.redraw(); return; } // données fraîches au retour
    if (prev) return;
    sh.hidden = true; sh.innerHTML = '';
    if (A.dirty) { A.dirty = false; show(A.tab); }
  }
  function closeAll() { A.stack = []; var sh = document.getElementById('sa-sheet'); if (sh) { sh.hidden = true; sh.innerHTML = ''; } }
  function sheetHead(title, sub) {
    return '<div class="sa-sh-head"><button type="button" class="sa-icon" data-back aria-label="Retour">' + I.back + '</button><div class="sa-sh-t"><h2>' + esc(title) + '</h2>' + (sub ? '<div class="sa-sub">' + sub + '</div>' : '') + '</div></div>';
  }

  // ── Aujourd'hui ────────────────────────────────────────────────────────────
  var KIND = { pitch: 'À écrire', find: 'Contact à trouver', reaction: 'Réaction', reply: 'Réponse', relance: 'Relance', task: 'Tâche' };
  function renderToday(quiet) {
    var s = session() || {};
    var v = document.getElementById('sa-view');
    top('Bonjour ' + (s.first_name || ''), new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      '<div class="sa-top-r"><button type="button" class="sa-icon" id="sa-entry" aria-label="Saisir une activité">' + I.plus + '</button><button type="button" class="sa-chip' + (A.qScope === 'team' ? ' on' : '') + '" id="sa-scope">' + (A.qScope === 'team' ? 'Équipe' : 'Ma file') + '</button></div>');
    document.getElementById('sa-entry').onclick = function () { openEntry({}); };
    document.getElementById('sa-scope').onclick = function () { A.qScope = A.qScope === 'team' ? 'me' : 'team'; renderToday(); };
    // Ouverture rapide : la dernière file connue s'affiche tout de suite, puis se met à jour
    var QK = 'scout_app_q2_' + A.qScope, scope0 = A.qScope; // q2 : l'ancienne file en mémoire (avec des cartes « Contact à trouver ») est ignorée
    try { localStorage.removeItem('scout_app_q_me'); localStorage.removeItem('scout_app_q_team'); } catch (e) {}
    var draw = function (items, fresh) {
      if (A.tab !== 'today' || A.qScope !== scope0) return;
      // jamais de carte « chercher un contact » : c'est le travail de Scout
      var now = items.filter(function (it) { return !it.later && it.kind !== 'find'; });
      var urgent = now.filter(function (it) { return it.kind === 'reaction' || it.kind === 'reply' || (daysFrom(it.due) || 0) > 0; }).length;
      A.items = now;
      burstBadge(now);
      var y = v.scrollTop;
      var hotN = now.filter(function (it) { return (it.pitch && it.pitch.cls === 'hot') || it.kind === 'reaction'; }).length;
      var relN = now.filter(function (it) { return it.kind === 'relance'; }).length;
      var head = '<div class="sa-kpi"><b>' + now.length + '</b><span>à traiter' + [hotN ? '<em>' + hotN + ' hot</em>' : '', relN ? relN + ' relance' + (relN > 1 ? 's' : '') : ''].filter(Boolean).map(function (x, i) { return (i ? ', ' : ', dont ') + x; }).join('') + '</span>' + (fresh ? '' : '<span class="sa-meta sa-upd">mise à jour…</span>') + '</div>';
      head = '<div id="sa-ao-box"></div>' + head;
      v.innerHTML = head + (now.length ? '<div class="sa-list">' + now.slice(0, 60).map(card).join('') + '</div>'
        : '<div class="sa-empty">Rien d’urgent dans ta file.' + (A.qScope === 'me' ? '<br><br><button type="button" class="sa-btn" id="sa-see-team">Voir la file de l’équipe</button>' : '') + '</div>')
        + (now.length > 60 ? '<div class="sa-meta sa-center">Les ' + (now.length - 60) + ' suivants sont dans la version complète.</div>' : '');
      v.scrollTop = y;
      bindCards(v);
      drawAoApp();
      var st = document.getElementById('sa-see-team'); if (st) st.onclick = function () { A.qScope = 'team'; renderToday(); };
    };
    var cached = null; try { cached = JSON.parse(localStorage.getItem(QK) || 'null'); } catch (e) { cached = null; }
    if (cached && cached.items && Date.now() - cached.at < 7 * 864e5) draw(cached.items, false);
    else if (!quiet) v.innerHTML = '<div class="sa-empty">Chargement…</div>';
    crm().loadQueue(A.qScope).then(function (items) {
      draw(items, true);
      try { localStorage.setItem(QK, JSON.stringify({ at: Date.now(), items: items.slice(0, 80) })); } catch (e) { /* stockage plein : sans cache */ }
    }).catch(function (e) { if (!cached) v.innerHTML = '<div class="sa-empty">Erreur : ' + esc(e.message) + '</div>'; else { var u = v.querySelector('.sa-upd'); if (u) u.textContent = 'hors ligne'; } });
  }

  // AO drone filaire ouverts : même bloc que sur ordinateur, en tête de la file
  function drawAoApp() {
    var box = document.getElementById('sa-ao-box'); if (!box || !crm().loadAo) return;
    crm().loadAo().then(function () {
      var items = (crm().aoItems() || []).filter(function (t) { return !t.decision; });
      if (!items.length) { box.innerHTML = ''; return; }
      box.innerHTML = '<section class="sa-ao"><h4>' + (items.length > 1 ? items.length + ' AO drone filaire ouverts' : 'AO drone filaire ouvert') + '</h4>'
        + items.slice(0, 5).map(function (t) {
          var acc = (t.accounts || [])[0], u = t.days_left != null && t.days_left <= 14;
          return '<div class="sa-ao-row"><b>' + esc(t.acheteur || t.titre) + '</b><div class="sa-meta">' + esc((t.titre || '').slice(0, 120)) + '</div>'
            + '<div class="sa-meta"><span class="' + (u ? 'u' : '') + '">' + esc(t.days_left == null ? 'Clôture non précisée' : 'Clôture dans ' + Math.max(0, t.days_left) + ' j') + '</span>'
            + (acc ? ' · <button type="button" class="sa-link" data-acc="' + esc(acc.id) + '">' + esc(acc.nom) + '</button>' : '') + '</div>'
            + (t.url ? '<a class="sa-btn" href="' + esc(t.url) + '" target="_blank" rel="noopener">Voir l’avis</a>' : '') + '</div>';
        }).join('') + '</section>';
      box.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
    });
  }
  function card(it, i) {
    var late = daysFrom(it.due), when = '';
    if (it.kind === 'reaction') when = it.sub || '';
    else if (it.kind === 'reply') when = it.due ? 'Reçue le ' + fmtDate(it.due) : 'Reçue';
    else if (it.due) when = late > 0 ? 'En retard de ' + late + ' j' : (late === 0 ? 'Aujourd’hui' : 'Prévue le ' + fmtDate(it.due));
    var hot = it.kind === 'reaction' || it.kind === 'reply' || late > 0;
    var title = it.kind === 'task' ? it.title : (it.contact_name || it.title);
    var act = '';
    if (it.kind === 'relance') act = '<button type="button" class="sa-btn primary" data-rel="' + esc(it.contact_id) + '">' + I.mail + (it.draft ? 'Relire et envoyer' : 'Préparer la relance') + '</button><button type="button" class="sa-btn" data-replied="' + esc(it.contact_id) + '">Il a répondu</button>';
    else if (it.kind === 'task') act = (it.contact_id ? '<button type="button" class="sa-btn" data-ct="' + esc(it.contact_id) + '">' + I.phone + 'Contact</button>' : it.account_id ? '<button type="button" class="sa-btn" data-acc="' + esc(it.account_id) + '">Compte</button>' : '') + '<button type="button" class="sa-btn primary" data-done="' + esc(it.task.id) + '">' + I.check + 'Fait</button>';
    else if (it.kind === 'reaction') act = '<button type="button" class="sa-btn primary" data-ct="' + esc(it.contact_id) + '">' + I.mail + 'Écrire</button><button type="button" class="sa-btn" data-seen="' + esc(it.key) + '">Vu</button>';
    else if (it.kind === 'pitch') act = '<button type="button" class="sa-btn primary" data-pgo="' + esc(it.account_id) + '">' + (it.li ? 'Écrire sur LinkedIn' : I.mail + 'Relire et envoyer') + '</button><button type="button" class="sa-btn" data-psnz="' + esc(it.account_id) + '">Pas maintenant</button>';
    else if (it.kind === 'find') act = '';
    else if (it.kind === 'reply') act = '<button type="button" class="sa-btn primary" data-ct="' + esc(it.contact_id) + '">Ouvrir</button><button type="button" class="sa-btn" data-tx="' + esc(it.contact_id) + '">Saisi dans Dynamics</button>';
    return '<article class="sa-card k-' + it.kind + (hot ? ' hot' : '') + '">'
      + '<div class="sa-card-h">' + (it.pitch ? '<span class="sa-cls c-' + esc(it.pitch.cls || 'try') + '">' + esc(it.pitch.cls_label || 'À tenter') + '</span>' : it.kind === 'reaction' ? '<span class="sa-cls c-hot">Hot</span>' : '') + '<span class="sa-tag k-' + it.kind + '">' + (it.kind === 'pitch' ? (it.li ? 'LinkedIn' : it.pitch && it.pitch.draft ? 'Mail prêt' : 'À écrire') : KIND[it.kind]) + '</span>' + (it.tier ? '<span class="sa-tier">T' + esc(it.tier) + '</span>' : '') + '<span class="sa-when' + (hot ? ' hot' : '') + '">' + esc(it.kind === 'reaction' ? '' : when) + '</span></div>'
      + '<button type="button" class="sa-card-t" ' + (it.contact_id ? 'data-ct="' + esc(it.contact_id) + '"' : (it.account_id ? 'data-acc="' + esc(it.account_id) + '"' : '')) + '>' + esc(title) + '</button>'
      + (it.kind === 'reaction' ? '<div class="sa-card-s hot">' + esc(when) + '</div>' : '')
      + (it.kind === 'pitch' || it.kind === 'find' ? (it.pitch.why_top ? '<div class="sa-top-why">' + esc(it.pitch.why_top) + '</div>' : '') + '<div class="sa-card-s">' + esc((it.kind === 'pitch' && (it.li ? it.pitch.person : it.pitch.contact).titre ? (it.li ? it.pitch.person : it.pitch.contact).titre + ' · ' : '') + it.pitch.reason) + '</div>' : '')
      + (it.kind === 'find' ? '<div class="sa-meta">' + (it.pitch.state === 'searching' ? 'Pas encore de contact : Scout en cherche un cette nuit.' : 'Aucun contact joignable trouvé.') + '</div>' : '')
      + (it.kind === 'pitch' && it.pitch.draft ? '<div class="sa-draft"><b>' + esc(it.pitch.draft.subject) + '</b><span>' + esc(String(it.pitch.draft.body || '').replace(/\s+/g, ' ').slice(0, 140)) + '…</span></div>' : '')
      + (it.kind === 'pitch' || it.kind === 'find' ? '<details class="sa-ctx"><summary>Contexte</summary>' + (it.pitch.context || []).map(function (l) { return '<div>' + esc(l) + '</div>'; }).join('') + '</details>' : '')
      + (it.account_nom ? '<button type="button" class="sa-card-s sa-link" ' + (it.account_id ? 'data-acc="' + esc(it.account_id) + '"' : '') + '>' + esc(it.account_nom) + '</button>' : '')
      + (A.qScope === 'team' && it.who ? '<div class="sa-meta">' + esc(it.who) + '</div>' : '')
      + '<div class="sa-card-a">' + act + '</div></article>';
  }
  function bindCards(root) {
    root.querySelectorAll('[data-ct]').forEach(function (b) { b.onclick = function () { openContact(b.getAttribute('data-ct')); }; });
    root.querySelectorAll('[data-acc]').forEach(function (b) { b.onclick = function () { openAccount(b.getAttribute('data-acc')); }; });
    root.querySelectorAll('[data-rel]').forEach(function (b) { b.onclick = function () { openRelance(b.getAttribute('data-rel')); }; });
    root.querySelectorAll('[data-replied]').forEach(function (b) {
      b.onclick = function () { b.disabled = true; api('/action/confirm', { method: 'POST', body: { contact_id: b.getAttribute('data-replied'), action_type: 'reply_outlook' } }).then(function () { toast('Noté : plus de relance'); fadeOut(b); }).catch(function (e) { b.disabled = false; toast('Erreur : ' + e.message); }); };
    });
    root.querySelectorAll('[data-pgo]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-pgo'), it = (A.items || []).find(function (x) { return x.pitch && x.account_id === id; });
        var p = (it && it.pitch) || crm().pitchMap()[id]; if (p) crm().pitchGo(p, function (r) { if (r) fadeOut(b); });
      };
    });
    root.querySelectorAll('[data-psnz]').forEach(function (b) {
      b.onclick = function () { b.disabled = true; api('/crm/pitch/' + encodeURIComponent(b.getAttribute('data-psnz')), { method: 'POST', body: { action: 'snooze', days: 30 } }).then(function () { fadeOut(b); }).catch(function (e) { b.disabled = false; toast('Erreur : ' + e.message); }); };
    });
    root.querySelectorAll('[data-done]').forEach(function (b) {
      b.onclick = function () {
        b.disabled = true;
        api('/crm/tasks/' + b.getAttribute('data-done'), { method: 'PATCH', body: { done: true } })
          .then(function () { toast('Tâche terminée'); fadeOut(b); }).catch(function (e) { b.disabled = false; toast('Erreur : ' + e.message); });
      };
    });
    root.querySelectorAll('[data-seen]').forEach(function (b) {
      b.onclick = function () { b.disabled = true; api('/assist/reactions/seen', { method: 'POST', body: { key: b.getAttribute('data-seen') } }).then(function () { fadeOut(b); }).catch(function (e) { b.disabled = false; toast('Erreur : ' + e.message); }); };
    });
    root.querySelectorAll('[data-tx]').forEach(function (b) {
      b.onclick = function () { b.disabled = true; api('/action/transmit-crm', { method: 'POST', body: { contact_id: b.getAttribute('data-tx') } }).then(function () { toast('Marqué comme saisi dans Dynamics'); fadeOut(b); }).catch(function (e) { b.disabled = false; toast('Erreur : ' + e.message); }); };
    });
  }
  // ── Traiter ma file (bouton central) : une carte « À écrire » à la fois, mail déjà rédigé.
  // Glisser à droite : envoyer (messagerie du téléphone, puis « parti ? ») ; à gauche : pas maintenant ; toucher le mail : le modifier.
  function burstItems(items) { return (items || []).filter(function (it) { return it.kind === 'pitch' && it.pitch && (it.pitch.contact || it.pitch.person); }); }
  function burstBadge(items) {
    var n = burstItems(items).length, el = document.getElementById('sa-burst-n'); if (!el) return;
    el.hidden = !n; el.textContent = n > 99 ? '99+' : String(n);
  }
  function openBurst() {
    var go = function (items) {
      var list = burstItems(items);
      var B = { list: list, i: 0, sent: 0, later: 0 };
      var ov = document.createElement('div'); ov.className = 'sa-burst'; ov.id = 'sa-burst';
      document.getElementById('sa').appendChild(ov);
      history.pushState({ burst: 1 }, '');
      var closeB = function () { ov.remove(); window.removeEventListener('popstate', onPop); if (A.tab === 'today') renderToday(true); };
      var onPop = function () { closeB(); };
      window.addEventListener('popstate', onPop);
      var draw = function () {
        var p = B.list[B.i] && B.list[B.i].pitch;
        if (!p) {
          ov.innerHTML = '<div class="sa-burst-h"><b>Traiter ma file</b><button type="button" class="sa-icon" data-x aria-label="Fermer">×</button></div>'
            + '<div class="sa-burst-end"><div class="big">' + (B.list.length ? 'C’est fait' : 'Rien à envoyer') + '</div><div class="sa-meta">'
            + (B.list.length ? B.sent + ' mail' + (B.sent > 1 ? 's' : '') + ' envoyé' + (B.sent > 1 ? 's' : '') + ', ' + B.later + ' passé' + (B.later > 1 ? 's' : '') + ' (ils reviennent dans 3 jours).' : 'Pas de compte à prospecter pour l’instant. Les nouveaux signaux arrivent ici, avec le mail déjà rédigé.')
            + '</div><button type="button" class="sa-btn primary" data-x>Retour</button></div>';
          ov.querySelectorAll('[data-x]').forEach(function (b) { b.onclick = function () { history.back(); }; });
          return;
        }
        var li = !p.contact && !!p.person, W = li ? p.person : p.contact;
        var isReady = function () { return li ? !!p.liText : !!p.draft; };
        ov.innerHTML = '<div class="sa-burst-h"><b>' + (B.i + 1) + ' / ' + B.list.length + '</b><button type="button" class="sa-icon" data-x aria-label="Fermer">×</button></div>'
          + '<div class="sa-burst-stage"><article class="sa-burst-card" id="sa-bc">'
          + '<div class="sa-stamp l" id="sa-stl">Passer</div><div class="sa-stamp r" id="sa-str">' + (li ? 'LinkedIn' : 'Envoyer') + '</div>'
          + '<span class="sa-cls c-' + esc(p.cls || 'try') + '">' + esc(p.cls_label || 'À tenter') + '</span> <span class="sa-tag k-pitch">' + (li ? 'LinkedIn' : p.draft ? 'Mail prêt' : 'À écrire') + '</span>' + (p.why_top ? ' <span class="sa-meta">' + esc(p.why_top) + '</span>' : '')
          + '<h2>' + esc(W.name) + '</h2><div class="sa-meta">' + esc([W.titre, p.account.nom].filter(Boolean).join(' · ')) + '</div>'
          + '<div class="sa-burst-who' + ((li && !p.person.found) || (p.contact && p.contact.from_signal) ? ' sig' : '') + '">' + esc(li ? (p.person.why || '') : (p.contact && p.contact.why) || '') + '</div>'
          + '<div class="sa-burst-why">' + esc(p.reason) + '</div>'
          + '<div class="sa-burst-ctx">' + (p.context || []).map(function (l) { return '<div>' + esc(l) + '</div>'; }).join('') + '</div>'
          + crm().pitchSourcesHtml(p)
          + '<div class="sa-burst-mail" id="sa-bm"><div class="sa-meta">' + (li ? 'Message LinkedIn' : 'À ' + esc(p.contact.email)) + '</div><div class="s" id="sa-bs"></div><div class="b" id="sa-bb"></div><div class="sa-meta sa-burst-hint">' + I.edit + ' Toucher pour modifier</div></div>'
          + '<button type="button" class="sa-link sa-burst-drop" data-drop>Retirer ce compte pour 30 jours</button>'
          + '</article><div class="sa-burst-lbl l">Passer</div><div class="sa-burst-lbl r">Envoyer</div></div>'
          + '<div class="sa-burst-a"><button type="button" class="sa-btn" data-later>Passer</button><button type="button" class="sa-btn primary" data-send>' + I.send + (li ? 'LinkedIn' : 'Envoyer') + '</button></div>';
        ov.querySelector('[data-x]').onclick = function () { history.back(); };
        var bs = ov.querySelector('#sa-bs'), bb = ov.querySelector('#sa-bb'), sendBtn = ov.querySelector('[data-send]');
        var show = function () { if (li) { bs.textContent = ''; bb.textContent = p.liText || ''; } else { bs.textContent = p.draft.subject || ''; bb.textContent = p.draft.body || ''; } sendBtn.disabled = false; };
        if (isReady()) show();
        else { bs.textContent = ''; bb.textContent = li ? 'Rédaction du message…' : 'Rédaction du mail…'; sendBtn.disabled = true; (li ? crm().liDraft(p) : crm().pitchDraft(p)).then(show).catch(function (e) { bb.textContent = 'Erreur : ' + e.message; }); }
        // le suivant se rédige pendant qu'on lit celui-ci
        var nx = B.list[B.i + 1] && B.list[B.i + 1].pitch;
        if (nx && !nx._pre) { var nli = !nx.contact && !!nx.person; if (nli ? !nx.liText : !nx.draft) { nx._pre = 1; (nli ? crm().liDraft(nx) : crm().pitchDraft(nx)).catch(function () { nx._pre = 0; }); } }
        // modifier : le mail devient éditable
        ov.querySelector('#sa-bm').onclick = function () {
          if (!isReady() || this.classList.contains('edit')) return;
          this.classList.add('edit');
          if (li) { this.innerHTML = '<div class="sa-meta">Message LinkedIn</div><textarea class="sa-in" id="sa-eb" rows="8">' + esc(p.liText || '') + '</textarea>'; var lb = this.querySelector('#sa-eb'); lb.oninput = function () { p.liText = lb.value; }; lb.focus(); return; }
          this.innerHTML = '<div class="sa-meta">À ' + esc(p.contact.email) + '</div><input class="sa-in" id="sa-es" value="' + esc(p.draft.subject || '') + '"><textarea class="sa-in" id="sa-eb" rows="12">' + esc(p.draft.body || '') + '</textarea>';
          var es = this.querySelector('#sa-es'), eb = this.querySelector('#sa-eb');
          es.oninput = eb.oninput = function () { crm().pitchSave(p, es.value, eb.value); };
          eb.focus();
        };
        var next = function () { B.i++; draw(); };
        // Passer : un doute, on ne modifie pas, la carte revient dans 3 jours ; Retirer : 30 jours
        var later = function (days) {
          B.later++;
          api('/crm/pitch/' + encodeURIComponent(p.account.id), { method: 'POST', body: { action: 'snooze', days: days || 3 } }).catch(function () {});
          next();
        };
        ov.querySelector('[data-drop]').onclick = function (e) { e.stopPropagation(); fly(-1, function () { later(30); }); };
        var send = function () {
          if (!isReady()) return;
          if (li) { crm().pitchSendLinkedIn(p, p.liText, function (ok) { if (ok) { B.sent++; next(); } else reset(); }); return; }
          crm().pitchSend(p, p.draft.subject, p.draft.body, function (ok) { if (ok) { B.sent++; next(); } else reset(); });
        };
        ov.querySelector('[data-later]').onclick = function () { fly(-1, function () { later(3); }); };
        sendBtn.onclick = function () { fly(1, send); };
        // glisser
        var card = ov.querySelector('#sa-bc'), x0 = null, y0 = null, dx = 0, drag = false;
        var stl = ov.querySelector('#sa-stl'), str = ov.querySelector('#sa-str');
        var reset = function () { card.style.transition = 'transform .2s'; card.style.transform = ''; ov.classList.remove('to-l', 'to-r'); card.classList.remove('go-l', 'go-r'); stl.style.opacity = 0; str.style.opacity = 0; };
        var fly = function (dir, fn) {
          if (dir > 0 && !isReady()) { reset(); return; }
          (dir > 0 ? str : stl).style.opacity = 1;
          card.style.transition = 'transform .22s ease-in'; card.style.transform = 'translateX(' + (dir * 130) + '%) rotate(' + (dir * 12) + 'deg)';
          setTimeout(fn, 200);
        };
        card.addEventListener('touchstart', function (e) { if (card.querySelector('.edit')) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; drag = false; card.style.transition = 'none'; }, { passive: true });
        card.addEventListener('touchmove', function (e) {
          if (x0 == null) return;
          dx = e.touches[0].clientX - x0; var dy = e.touches[0].clientY - y0;
          if (!drag && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) drag = true;
          if (!drag) return;
          card.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 25) + 'deg)';
          var o = Math.min(1, Math.abs(dx) / 90);
          stl.style.opacity = dx < 0 ? o : 0; str.style.opacity = dx > 0 ? o : 0;
          card.classList.toggle('go-r', dx > 90); card.classList.toggle('go-l', dx < -90);
          ov.classList.toggle('to-r', dx > 60); ov.classList.toggle('to-l', dx < -60);
        }, { passive: true });
        card.addEventListener('touchend', function () {
          if (x0 == null) return; x0 = null;
          if (drag && dx > 100) fly(1, send); else if (drag && dx < -100) fly(-1, function () { later(3); }); else reset();
        });
      };
      draw();
    };
    if (A.items) go(A.items); else crm().loadQueue(A.qScope).then(go).catch(function (e) { toast('Erreur : ' + e.message); });
  }

  function fadeOut(b) { var c = b.closest('.sa-card'); if (c) { c.classList.add('gone'); setTimeout(function () { c.remove(); try { if (crm().refreshBadge) crm().refreshBadge(); } catch (e) {} }, 300); } }

  // La relance s'ouvre dans la fenêtre de relecture existante : modifiable, rien ne part sans le commercial.
  function openRelance(id) {
    if (typeof window.trkRelance !== 'function') { openContact(id); return; }
    window.trkRelance(id);
    var t = setInterval(function () { var m = document.getElementById('trk-relance-modal'); if (!m || m.style.display === 'none' || !document.body.contains(m)) { clearInterval(t); if (A.tab === 'today' && !A.stack.length) renderToday(true); } }, 700);
  }

  // ── Comptes ────────────────────────────────────────────────────────────────
  function renderAccounts() {
    top('Comptes', '');
    var v = document.getElementById('sa-view');
    v.innerHTML = '<div class="sa-search">' + I.search + '<input type="search" id="sa-acc-q" placeholder="Nom, ville, pays…" autocomplete="off" enterkeyhint="search" aria-label="Chercher un compte"></div>'
      + '<div class="sa-seg" role="tablist"><button type="button" data-own="me" class="' + (A.accOwn !== 'all' ? 'on' : '') + '">Mes comptes</button><button type="button" data-own="all" class="' + (A.accOwn === 'all' ? 'on' : '') + '">Tous</button></div>'
      + '<div id="sa-acc-list"><div class="sa-empty">Chargement…</div></div>';
    var q = document.getElementById('sa-acc-q'), t = null;
    q.value = A.accQ || '';
    q.oninput = function () { clearTimeout(t); t = setTimeout(function () { A.accQ = q.value.trim(); loadAccounts(); }, 250); };
    v.querySelectorAll('[data-own]').forEach(function (b) { b.onclick = function () { A.accOwn = b.getAttribute('data-own'); v.querySelectorAll('[data-own]').forEach(function (x) { x.classList.toggle('on', x === b); }); loadAccounts(); }; });
    loadAccounts();
  }
  function loadAccounts() {
    var box = document.getElementById('sa-acc-list'); if (!box) return;
    var p = new URLSearchParams(); if (A.accQ) p.set('q', A.accQ); if (A.accOwn !== 'all' && !A.accQ) p.set('owner', 'me');
    p.set('sort', 'priority'); p.set('dir', 'desc'); p.set('limit', '40');
    var seq = (A.accSeq = (A.accSeq || 0) + 1);
    api('/crm/accounts?' + p.toString()).then(function (d) {
      if (seq !== A.accSeq) return;
      var rows = d.accounts || [];
      box.innerHTML = rows.length ? '<div class="sa-rows">' + rows.map(function (a) {
        return '<button type="button" class="sa-row" data-acc="' + esc(a.id) + '"><span class="sa-tier' + (a.tier ? '' : ' none') + '">' + (a.tier ? 'T' + esc(a.tier) : '·') + '</span>'
          + '<span class="m"><b>' + esc(a.nom) + '</b><span>' + esc([a.pays, a.n_contacts ? a.n_contacts + ' contact' + (a.n_contacts > 1 ? 's' : '') : '', a.next_step || (a.last_activity_at ? 'activité ' + rel(a.last_activity_at) : '')].filter(Boolean).join(' · ')) + '</span></span>'
          + '<span class="sa-heat h-' + esc(a.heat || 'froid') + '" title="Engagement"></span></button>';
      }).join('') + '</div>' + (d.total > rows.length ? '<div class="sa-meta sa-center">' + (d.total - rows.length) + ' autres : affine la recherche</div>' : '')
        : '<div class="sa-empty">' + (A.accQ ? 'Aucun compte pour « ' + esc(A.accQ) + ' ».' : 'Aucun compte à ton nom.') + '</div>';
      bindCards(box);
    }).catch(function (e) { box.innerHTML = '<div class="sa-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }

  function contactBtns(c) {
    var out = [];
    if (c.telephone && !masked(c.telephone)) out.push('<a class="sa-round" href="tel:' + esc(String(c.telephone).replace(/[^\d+]/g, '')) + '" aria-label="Appeler ' + esc(pname(c)) + '">' + I.phone + '</a>');
    if (c.email && !masked(c.email)) out.push('<a class="sa-round" href="mailto:' + esc(c.email) + '" aria-label="Écrire à ' + esc(pname(c)) + '">' + I.mail + '</a>');
    if (c.linkedin && !masked(c.linkedin)) out.push('<a class="sa-round" href="' + esc(/^https?:/.test(c.linkedin) ? c.linkedin : 'https://' + c.linkedin) + '" target="_blank" rel="noopener" aria-label="LinkedIn de ' + esc(pname(c)) + '">' + I.li + '</a>');
    return out.join('');
  }
  var ROLE = { decideur: 'Décideur', acheteur: 'Acheteur', utilisateur: 'Utilisateur', technique: 'Technique' };
  function historyHtml(tl) {
    var L = crm().actLabel || {};
    var rows = (tl || []).filter(function (t) { return t.kind !== 'field' && t.kind !== 'owner' && t.kind !== 'status'; }).slice(0, 6);
    if (!rows.length) return '<div class="sa-meta">Aucune activité pour l’instant.</div>';
    return rows.map(function (t) {
      var p = t.payload || {};
      var what = t.kind === 'activity' ? (L[p.type] || 'Activité') : t.kind === 'note' ? 'Note' : t.kind === 'task_done' ? 'Tâche terminée' : (L[t.kind] || (t.kind === 'email' ? 'Email' : t.kind));
      return '<div class="sa-hist"><div class="sa-hist-h"><b>' + esc(what) + '</b>' + (t.contact_name ? ' · ' + esc(t.contact_name) : '') + '<span>' + esc(rel(t.at)) + '</span></div>'
        + (t.body || t.details ? '<div class="sa-hist-b">' + esc(String(t.body || t.details).slice(0, 280)) + '</div>' : '') + '</div>';
    }).join('');
  }

  function openAccount(id) {
    api('/crm/accounts/' + encodeURIComponent(id)).then(function (D) {
      var a = D.account, sm = D.summary || {}, cs = D.contacts || [];
      var anc = (D.ancestors || []).map(function (x) { return '<button type="button" class="sa-link" data-acc="' + esc(x.id) + '">' + esc(x.nom) + '</button>'; }).join(' › ');
      var html = sheetHead(a.nom, esc([a.pays, sm.owner_name || a.owner_name].filter(Boolean).join(' · ')))
        + '<div class="sa-pad">'
        + (anc ? '<div class="sa-meta sa-anc">' + anc + '</div>' : '')
        + '<div class="sa-facts"><span class="sa-tier' + (a.tier ? '' : ' none') + '">' + (a.tier ? 'T' + esc(a.tier) : 'Sans tier') + '</span>'
        + (sm.priority != null ? '<span class="sa-fact"><b>' + esc(sm.priority) + '</b> priorité</span>' : '') + '<span class="sa-fact"><b>' + cs.length + '</b> contact' + (cs.length > 1 ? 's' : '') + '</span>'
        + ((D.children || []).length ? '<span class="sa-fact"><b>' + D.children.length + '</b> rattaché' + (D.children.length > 1 ? 's' : '') + '</span>' : '') + '</div>'
        + (a.next_step ? '<div class="sa-next"><span>Prochaine étape</span><b>' + esc(a.next_step) + '</b>' + (a.next_step_date ? '<em>' + esc(fmtDate(a.next_step_date)) + '</em>' : '') + '</div>' : '')
        + '<div class="sa-actions"><button type="button" class="sa-btn primary" id="sa-a-entry">' + I.plus + 'Saisir une activité</button><button type="button" class="sa-btn" id="sa-a-brief">Brief</button></div>'
        + '<div id="sa-brief"></div>'
        + '<h3 class="sa-h3">Contacts</h3>'
        + (cs.length ? cs.map(function (c, i) {
          return '<div class="sa-person"' + (i >= 8 ? ' hidden' : '') + '><button type="button" class="m" data-ct="' + esc(c.id) + '"><b>' + esc(pname(c)) + '</b><span>' + esc([c.titre, ROLE[c.role]].filter(Boolean).join(' · ')) + '</span></button><div class="sa-person-a">' + contactBtns(c) + '</div></div>';
        }).join('') + (cs.length > 8 ? '<button type="button" class="sa-btn ghost wide" id="sa-a-morect">Voir les ' + (cs.length - 8) + ' autres contacts</button>' : '') : '<div class="sa-meta">Aucun contact. Ajoute-le depuis la version complète.</div>')
        + ((D.children || []).length ? '<h3 class="sa-h3">Comptes rattachés</h3><div class="sa-rows">' + D.children.slice(0, 30).map(function (c) {
          return '<button type="button" class="sa-row" data-acc="' + esc(c.id) + '"><span class="sa-tier' + (c.tier ? '' : ' none') + '">' + (c.tier ? 'T' + esc(c.tier) : '·') + '</span><span class="m"><b>' + esc(c.nom) + '</b></span></button>';
        }).join('') + '</div>' : '')
        + '<h3 class="sa-h3">Historique</h3>' + historyHtml(D.timeline)
        + '<button type="button" class="sa-btn ghost wide" id="sa-a-full">Ouvrir la fiche complète</button></div>';
      openSheet(html, function (sh) {
        bindCards(sh);
        sh.querySelector('#sa-a-entry').onclick = function () { openEntry({ account: { id: a.id, nom: a.nom }, contacts: cs }); };
        sh.querySelector('#sa-a-brief').onclick = function () { loadBrief(a.id); };
        var more = sh.querySelector('#sa-a-morect'); if (more) more.onclick = function () { sh.querySelectorAll('.sa-person[hidden]').forEach(function (x) { x.hidden = false; }); more.remove(); };
        sh.querySelector('#sa-a-full').onclick = function () { toFull(function () { crm().openAccount(a.id); }); };
      }, function () { openAccount(id); });
    }).catch(function (e) { toast('Erreur : ' + e.message); });
  }
  function loadBrief(id) {
    var box = document.getElementById('sa-brief'); if (!box) return;
    box.innerHTML = '<div class="sa-brief"><div class="sa-meta">Préparation du brief…</div></div>';
    api('/assist/brief/' + encodeURIComponent(id)).then(function (r) {
      var b = r.brief || r;
      var list = function (x) { return (x || []).length ? '<ul>' + x.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : '<div class="sa-meta">Rien à signaler.</div>'; };
      box.innerHTML = '<div class="sa-brief">' + (b.situation ? '<p>' + esc(b.situation) + '</p>' : '')
        + (b.angle ? '<h4>Angle</h4><p>' + esc(b.angle) + '</p>' : '')
        + '<h4>Interlocuteurs</h4>' + list(b.interlocuteurs) + '<h4>Signaux</h4>' + list(b.signaux)
        + ((b.questions || []).length ? '<h4>Questions à poser</h4>' + list(b.questions) : '')
        + (b.prochaine_action ? '<div class="sa-next"><span>Prochaine action</span><b>' + esc(b.prochaine_action) + '</b></div>' : '') + '</div>';
    }).catch(function (e) { box.innerHTML = '<div class="sa-brief"><div class="sa-meta">Brief indisponible : ' + esc(e.message) + '</div></div>'; });
  }

  function openContact(id) {
    api('/crm/contacts/' + encodeURIComponent(id)).then(function (D) {
      var c = D.contact || {};
      var html = sheetHead(pname(c), esc([c.titre].filter(Boolean).join(' · ')))
        + '<div class="sa-pad">'
        + (c.account_nom ? '<button type="button" class="sa-link sa-anc" data-acc="' + esc(c.end_user_id) + '">' + esc(c.account_nom) + '</button>' : '')
        + '<div class="sa-bigbtns">'
        + (c.telephone && !masked(c.telephone) ? '<a class="sa-big" href="tel:' + esc(String(c.telephone).replace(/[^\d+]/g, '')) + '">' + I.phone + '<b>Appeler</b><span>' + esc(c.telephone) + '</span></a>' : '')
        + (c.email && !masked(c.email) ? '<button type="button" class="sa-big" data-rel="' + esc(c.id) + '">' + I.mail + '<b>Écrire</b><span>Brouillon à relire</span></button>' : '')
        + (c.linkedin && !masked(c.linkedin) ? '<a class="sa-big" href="' + esc(/^https?:/.test(c.linkedin) ? c.linkedin : 'https://' + c.linkedin) + '" target="_blank" rel="noopener">' + I.li + '<b>LinkedIn</b><span>Profil</span></a>' : '')
        + '</div>'
        + ((!c.telephone || masked(c.telephone)) && (!c.email || masked(c.email)) ? '<div class="sa-meta">Coordonnées non visibles avec ton profil.</div>' : '')
        + '<div class="sa-actions"><button type="button" class="sa-btn primary" id="sa-c-entry">' + I.plus + 'Saisir une activité</button></div>'
        + '<h3 class="sa-h3">Historique</h3>' + historyHtml(D.timeline)
        + '<button type="button" class="sa-btn ghost wide" id="sa-c-full">Ouvrir la fiche complète</button></div>';
      openSheet(html, function (sh) {
        bindCards(sh);
        sh.querySelector('#sa-c-entry').onclick = function () { openEntry({ account: c.end_user_id ? { id: c.end_user_id, nom: c.account_nom } : null, contact: { id: c.id, nom: pname(c) } }); };
        sh.querySelector('#sa-c-full').onclick = function () { toFull(function () { crm().openContact(c.id); }); };
      }, function () { openContact(id); });
    }).catch(function (e) { toast('Erreur : ' + e.message); });
  }

  // ── Saisir une activité (dictée, mise au propre, prochaine étape) ─────────
  var TYPES = [['phone', 'Appel'], ['in_person', 'Rendez-vous'], ['email', 'Email'], ['linkedin_message', 'LinkedIn'], ['other', 'Autre']];
  function openEntry(pre) {
    var E = { type: 'phone', account: pre.account || null, contact: pre.contact || null, contacts: pre.contacts || null, outcome: '', nextDate: '' };
    var html = sheetHead('Saisir une activité', '')
      + '<div class="sa-pad sa-form">'
      + '<label class="sa-lbl">Compte</label><div id="sa-e-acc"></div>'
      + '<label class="sa-lbl" for="sa-e-ct">Contact</label><select id="sa-e-ct" class="sa-input"><option value="">Aucun en particulier</option></select>'
      + '<label class="sa-lbl">Type</label><div class="sa-chips" id="sa-e-type">' + TYPES.map(function (t) { return '<button type="button" class="sa-chip' + (t[0] === E.type ? ' on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>'
      + '<label class="sa-lbl" for="sa-e-notes">Compte rendu</label>'
      + '<div class="sa-notes"><textarea id="sa-e-notes" class="sa-input" rows="6" placeholder="Tape ou dicte en vrac, Scout le remet au propre"></textarea>'
      + (SPEECH ? '<button type="button" class="sa-mic" id="sa-e-mic" aria-label="Dicter">' + I.mic + '</button>' : '') + '</div>'
      + '<div class="sa-row-btns"><button type="button" class="sa-btn" id="sa-e-ai">Mettre au propre</button><span class="sa-meta" id="sa-e-msg"></span></div>'
      + '<label class="sa-lbl">Résultat</label><div class="sa-chips" id="sa-e-out"><button type="button" class="sa-chip" data-o="positive">Positif</button><button type="button" class="sa-chip" data-o="neutral">Neutre</button><button type="button" class="sa-chip" data-o="negative">Négatif</button></div>'
      + '<label class="sa-lbl" for="sa-e-next">Prochaine étape</label><input id="sa-e-next" class="sa-input" placeholder="Ex. envoyer la doc SAFE-T (facultatif)">'
      + '<div class="sa-chips" id="sa-e-when"><button type="button" class="sa-chip" data-d="' + addDays(1) + '">Demain</button><button type="button" class="sa-chip" data-d="' + addDays(7) + '">Dans 1 semaine</button><button type="button" class="sa-chip" data-d="' + addDays(30) + '">Dans 1 mois</button></div>'
      + '<button type="button" class="sa-btn primary wide" id="sa-e-save">Enregistrer</button></div>';
    openSheet(html, function (sh) {
      var accBox = sh.querySelector('#sa-e-acc'), ctSel = sh.querySelector('#sa-e-ct'), ta = sh.querySelector('#sa-e-notes');
      var fillContacts = function (list) {
        ctSel.innerHTML = '<option value="">Aucun en particulier</option>' + (list || []).map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(pname(c)) + (c.titre ? ' · ' + esc(c.titre) : '') + '</option>'; }).join('');
        if (E.contact) { if (![].some.call(ctSel.options, function (o) { return o.value === E.contact.id; })) ctSel.insertAdjacentHTML('beforeend', '<option value="' + esc(E.contact.id) + '">' + esc(E.contact.nom) + '</option>'); ctSel.value = E.contact.id; }
      };
      var drawAcc = function () {
        if (E.account) {
          accBox.innerHTML = '<div class="sa-picked"><b>' + esc(E.account.nom) + '</b><button type="button" class="sa-link" id="sa-e-acc-x">Changer</button></div>';
          accBox.querySelector('#sa-e-acc-x').onclick = function () { E.account = null; E.contacts = []; fillContacts([]); drawAcc(); };
          if (!E.contacts) api('/crm/accounts/' + encodeURIComponent(E.account.id)).then(function (D) { E.contacts = D.contacts || []; fillContacts(E.contacts); }).catch(function () {});
          else fillContacts(E.contacts);
        } else {
          accBox.innerHTML = '<div class="sa-search">' + I.search + '<input type="search" id="sa-e-acc-q" placeholder="Chercher un compte" autocomplete="off" aria-label="Chercher un compte"></div><div id="sa-e-acc-r"></div>';
          var q = accBox.querySelector('#sa-e-acc-q'), r = accBox.querySelector('#sa-e-acc-r'), t = null;
          q.oninput = function () {
            clearTimeout(t); var v = q.value.trim(); if (v.length < 2) { r.innerHTML = ''; return; }
            t = setTimeout(function () {
              api('/crm/accounts?limit=8&sort=priority&dir=desc&q=' + encodeURIComponent(v)).then(function (d) {
                r.innerHTML = (d.accounts || []).map(function (a) { return '<button type="button" class="sa-row sm" data-pick="' + esc(a.id) + '" data-nom="' + esc(a.nom) + '"><span class="m"><b>' + esc(a.nom) + '</b><span>' + esc(a.pays || '') + '</span></span></button>'; }).join('') || '<div class="sa-meta">Aucun compte.</div>';
                r.querySelectorAll('[data-pick]').forEach(function (b) { b.onclick = function () { E.account = { id: b.getAttribute('data-pick'), nom: b.getAttribute('data-nom') }; E.contacts = null; drawAcc(); }; });
              }).catch(function () {});
            }, 250);
          };
        }
      };
      drawAcc(); if (!E.account) fillContacts([]);
      sh.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { E.type = b.getAttribute('data-t'); sh.querySelectorAll('[data-t]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
      sh.querySelectorAll('[data-o]').forEach(function (b) { b.onclick = function () { E.outcome = E.outcome === b.getAttribute('data-o') ? '' : b.getAttribute('data-o'); sh.querySelectorAll('[data-o]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-o') === E.outcome); }); }; });
      sh.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { E.nextDate = E.nextDate === b.getAttribute('data-d') ? '' : b.getAttribute('data-d'); sh.querySelectorAll('[data-d]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-d') === E.nextDate); }); }; });
      var mic = sh.querySelector('#sa-e-mic'); if (mic) mic.onclick = function () { dictate(ta, mic); };
      sh.querySelector('#sa-e-ai').onclick = function () {
        var raw = ta.value.trim(), m = sh.querySelector('#sa-e-msg'), btn = this;
        if (raw.length < 5) { m.textContent = 'Tape ou dicte d’abord quelques mots.'; return; }
        stopDictate(); btn.disabled = true; m.textContent = 'Mise au propre…';
        api('/assist/activity-note', { method: 'POST', body: { text: raw, type: E.type, end_user_id: E.account && E.account.id, contact_id: ctSel.value || null } }).then(function (r) {
          E.raw = raw; ta.value = r.notes || raw;
          if (r.outcome) { E.outcome = r.outcome; sh.querySelectorAll('[data-o]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-o') === E.outcome); }); }
          if (r.next_step) sh.querySelector('#sa-e-next').value = r.next_step;
          if (r.next_date) { E.nextDate = r.next_date; sh.querySelectorAll('[data-d]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-d') === E.nextDate); }); }
          m.innerHTML = 'Relis avant d’enregistrer. <button type="button" class="sa-link" id="sa-e-undo">Revenir à mon texte</button>';
          sh.querySelector('#sa-e-undo').onclick = function () { ta.value = E.raw || ''; m.textContent = ''; };
        }).catch(function (e) { m.textContent = 'Erreur : ' + e.message; }).then(function () { btn.disabled = false; });
      };
      sh.querySelector('#sa-e-save').onclick = function () {
        var btn = this, notes = ta.value.trim(), ct = ctSel.value;
        if (!E.account && !ct) { toast('Choisis d’abord un compte'); return; }
        if (!notes) { toast('Écris ou dicte le compte rendu'); ta.focus(); return; }
        var body = { type: E.type, notes: notes, outcome: E.outcome || null };
        if (ct) body.contact_id = ct; else body.end_user_id = E.account.id;
        var next = sh.querySelector('#sa-e-next').value.trim();
        btn.disabled = true; stopDictate();
        api('/crm/activities', { method: 'POST', body: body }).then(function () {
          if (!next && !E.nextDate) return null;
          return api('/crm/tasks', { method: 'POST', body: { title: next || 'Relancer', due_date: E.nextDate || null, end_user_id: E.account ? E.account.id : null, contact_id: ct || null } });
        }).then(function () { toast(next || E.nextDate ? 'Activité et prochaine étape enregistrées' : 'Activité enregistrée'); A.dirty = true; history.back(); })
          .catch(function (e) { btn.disabled = false; toast('Erreur : ' + e.message); });
      };
    }, null);
  }

  // Dictée (reconnaissance vocale du téléphone, en français)
  var SPEECH = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null;
  function dictate(ta, btn) {
    if (rec) { stopDictate(); return; }
    rec = new SPEECH(); rec.lang = 'fr-FR'; rec.continuous = true; rec.interimResults = true;
    var base = ta.value ? ta.value.replace(/\s*$/, ' ') : '';
    rec.onresult = function (e) { var txt = ''; for (var i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript; ta.value = base + txt; };
    rec.onend = function () { rec = null; btn.classList.remove('on'); };
    rec.onerror = function (e) { toast(e.error === 'not-allowed' ? 'Autorise le micro pour dicter' : 'Dictée interrompue'); };
    btn.classList.add('on'); try { rec.start(); } catch (e) { rec = null; btn.classList.remove('on'); }
  }
  function stopDictate() { if (rec) { try { rec.stop(); } catch (e) {} } }

  // ── Signaux (appels d'offres et contrats) ──────────────────────────────────
  function renderSignals() {
    A.sigScope = A.sigScope || 'me';
    top('Signaux', 'Marchés, visites du site, chats');
    var v = document.getElementById('sa-view');
    v.innerHTML = '<div class="sa-seg" role="tablist"><button type="button" data-ss="me" class="' + (A.sigScope === 'me' ? 'on' : '') + '">Mes comptes</button><button type="button" data-ss="all" class="' + (A.sigScope === 'all' ? 'on' : '') + '">Tout</button></div><div id="sa-sig-list"><div class="sa-empty">Chargement…</div></div>';
    v.querySelectorAll('[data-ss]').forEach(function (b) { b.onclick = function () { A.sigScope = b.getAttribute('data-ss'); renderSignals(); }; });
    var box = document.getElementById('sa-sig-list');
    var TY = { market: 'Marché', visit: 'Visite', chat: 'Chat' };
    // état du contact par compte (file « À écrire », toute l'équipe, mise en cache côté serveur)
    Promise.all([api('/signals/feed?days=30&scope=' + A.sigScope), api('/crm/pitch?scope=all').catch(function () { return { items: [] }; })]).then(function (rr) {
      var d = rr[0], PS = {}; (rr[1].items || []).forEach(function (p) { PS[p.account.id] = p; });
      var list = (d.items || []).slice(0, 60);
      var mention = function (g) {
        if (g.type === 'market') return '';
        if (g.type === 'chat') return g.crm ? '<div class="sa-cstate ok">Transmis au CRM</div>' : '<div class="sa-cstate">Suivi dans le CRM</div>';
        if (!g.account) return '<div class="sa-cstate">Pas encore de compte : « Écrire » le crée et Scout cherche un contact</div>';
        var p = PS[g.account.id]; if (!p) return '';
        if (p.state === 'ready') return '<div class="sa-cstate ok">Contact prêt : ' + esc(p.contact.name) + (p.contact.titre ? ', ' + esc(p.contact.titre) : '') + '</div>';
        if (p.state === 'linkedin') return '<div class="sa-cstate ok">Contact trouvé sur LinkedIn : ' + esc(p.person.name) + '</div>';
        return '<div class="sa-cstate">Scout cherche un contact qualifié (mail vérifié ou LinkedIn)</div>';
      };
      var canWrite = function (g) { var p = g.account && PS[g.account.id]; return !p || p.state === 'ready' || p.state === 'linkedin'; };
      box.innerHTML = list.length ? '<div class="sa-list">' + list.map(function (g, i) {
        var acc = g.account;
        return '<article class="sa-card' + (g.imp >= 4 ? ' hot' : '') + '"><div class="sa-card-h"><span class="sa-tag">' + TY[g.type] + '</span>' + (acc && acc.tier ? '<span class="sa-tier">T' + esc(acc.tier) + '</span>' : '') + '<span class="sa-when">' + esc(rel(g.at)) + '</span></div>'
          + '<div class="sa-card-t static">' + esc(g.title) + '</div>' + (g.why ? '<div class="sa-card-s">' + esc(g.why) + '</div>' : '')
          + (acc ? '<button type="button" class="sa-card-s sa-link" data-acc="' + esc(acc.id) + '">' + esc(acc.nom) + (acc.owner_name ? ' · ' + esc(acc.owner_name) : '') + '</button>' : '<div class="sa-meta">Sans compte</div>')
          + mention(g)
          + '<div class="sa-card-a">' + (g.type === 'market' && g.url ? '<a class="sa-btn" href="' + esc(g.url) + '" target="_blank" rel="noopener">Voir</a>' : '')
          + (g.type === 'market' || (g.type !== 'chat' && canWrite(g)) ? '<button type="button" class="sa-btn primary" data-stask="' + i + '">' + (g.type === 'market' && g.flux === 1 ? I.check + 'Go' : I.mail + 'Écrire') + '</button>' : '') + '<button type="button" class="sa-btn" data-sdis="' + i + '">Écarter</button></div></article>';
      }).join('') + '</div>' : '<div class="sa-empty">' + (A.sigScope === 'me' ? 'Rien de neuf sur tes comptes. Regarde « Tout ».' : 'Rien sur 30 jours.') + '</div>';
      bindCards(box);
      box.querySelectorAll('[data-stask]').forEach(function (b) {
        b.onclick = function () {
          var g = list[+b.getAttribute('data-stask')]; b.disabled = true;
          var p = g.type === 'market'
            ? api('/crm/signals/' + g.kind + '/' + encodeURIComponent(g.ref_id) + '/action', { method: 'POST', body: { action: g.flux === 1 ? 'go' : 'accept' } })
            : (g.account ? Promise.resolve(g.account)
                // visite d'un organisme pas encore dans Scout : le compte est créé (domaine compris, ce qui relie ses visites), puis Scout cherche le contact
                : (g.org && g.org.name ? api('/crm/accounts', { method: 'POST', body: { nom: g.org.name, pays: g.org.country || null, domain: g.org.domain || null, source: 'visite du site' } }).then(function (d) { if (d.account && !d.existed) toast('Compte créé : ' + d.account.nom); return d.account; })
                  : Promise.reject(new Error('organisme inconnu'))))
              .then(function (acc) { return crm().pitchAccount(acc.id, g.type === 'chat' ? 'a écrit sur le chat du site' : 'est venu sur elistair.com'); })
              .then(function () { return api('/signals/feed/dismiss', { method: 'POST', body: { key: g.key, state: 'task' } }); });
          p.then(function () { if (g.type === 'market') toast(g.flux === 1 ? 'Go : tâche « Répondre à l’AO » créée' : 'Ajouté à « À écrire » dans Aujourd’hui'); fadeOut(b); }).catch(function (e) { b.disabled = false; toast('Erreur : ' + e.message); });
        };
      });
      box.querySelectorAll('[data-sdis]').forEach(function (b) {
        b.onclick = function () {
          var g = list[+b.getAttribute('data-sdis')]; b.disabled = true;
          var p = g.type === 'market'
            ? api('/crm/signals/' + g.kind + '/' + encodeURIComponent(g.ref_id) + '/action', { method: 'POST', body: { action: g.flux === 1 ? 'nogo' : 'not_relevant', reason: 'Autre' } })
            : api('/signals/feed/dismiss', { method: 'POST', body: { key: g.key } });
          p.then(function () { fadeOut(b); }).catch(function (e) { b.disabled = false; toast('Erreur : ' + e.message); });
        };
      });
    }).catch(function (e) { box.innerHTML = '<div class="sa-empty">Erreur : ' + esc(e.message) + '</div>'; });
  }

  // ── Moi : verrou, version complète, déconnexion ────────────────────────────
  function renderMe() {
    var s = session() || {}, L = lockConf();
    top(s.first_name || 'Moi', s.role === 'admin' ? 'Administrateur' : 'Commercial');
    var v = document.getElementById('sa-view');
    v.innerHTML = '<div class="sa-me">'
      + '<h3 class="sa-h3">Verrouillage</h3>'
      + '<div class="sa-box">' + (L
        ? '<div class="sa-line">' + I.lock + '<span><b>Activé</b><br><span class="sa-meta">Code' + (L.cred ? ' et ' + bioName() : '') + ' · se verrouille ' + afterLabel(L.after) + '</span></span></div>'
          + '<label class="sa-lbl" for="sa-l-after">Verrouiller</label><select id="sa-l-after" class="sa-input">' + [[0, 'dès que je quitte l’appli'], [1, 'après 1 min'], [5, 'après 5 min'], [15, 'après 15 min']].map(function (o) { return '<option value="' + o[0] + '"' + (L.after === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'
          + (L.cred ? '' : '<button type="button" class="sa-btn" id="sa-l-bio" hidden>' + I.finger + 'Ajouter ' + bioName() + '</button>')
          + '<div class="sa-row-btns"><button type="button" class="sa-btn" id="sa-l-pin">Changer le code</button><button type="button" class="sa-btn ghost" id="sa-l-off">Désactiver</button></div>'
        : '<p class="sa-meta">Protège Scout sur ton téléphone : un code à 4 à 6 chiffres, et ' + bioName() + ' si ton téléphone le permet.</p><button type="button" class="sa-btn primary wide" id="sa-l-on">' + I.lock + 'Activer le verrouillage</button>')
      + '</div>'
      + (s.role === 'admin' ? '<h3 class="sa-h3">Lancer maintenant</h3><div class="sa-box">' + Object.keys(crm().routines()).map(function (k) { return '<button type="button" class="sa-btn wide" data-routine="' + k + '">' + esc(crm().routines()[k].label) + '</button>'; }).join('') + '<p class="sa-meta" id="sa-rt-msg">Sans attendre la nuit : veille web, puis recherche de contacts, puis rédaction des mails.</p></div>' : '')
      + '<h3 class="sa-h3">Affichage</h3><div class="sa-box"><button type="button" class="sa-btn wide" id="sa-full">Passer à la version complète</button>'
      + (standalone() ? '' : '<p class="sa-meta">Astuce : ajoute Scout à l’écran d’accueil (menu Partager puis « Sur l’écran d’accueil » sur iPhone, menu ⋮ puis « Installer l’application » sur Android) pour l’ouvrir comme une appli.</p>') + '</div>'
      + '<button type="button" class="sa-btn ghost wide danger" id="sa-logout">Se déconnecter</button></div>';
    var on = v.querySelector('#sa-l-on'); if (on) on.onclick = function () { setupLock(); };
    var pin = v.querySelector('#sa-l-pin'); if (pin) pin.onclick = function () { setupLock(true); };
    var off = v.querySelector('#sa-l-off'); if (off) off.onclick = function () { askPin('Code actuel pour désactiver', function (ok) { if (ok) { ls(LS_LOCK, null); toast('Verrouillage désactivé'); renderMe(); } }); };
    var aft = v.querySelector('#sa-l-after'); if (aft) aft.onchange = function () { var c = lockConf(); c.after = +aft.value; ls(LS_LOCK, JSON.stringify(c)); toast('Enregistré'); };
    var bio = v.querySelector('#sa-l-bio');
    if (bio) bioAvailable().then(function (ok) { if (ok) { bio.hidden = false; bio.onclick = function () { addBio().then(function () { renderMe(); }); }; } });
    v.querySelectorAll('[data-routine]').forEach(function (b) {
      b.onclick = function () {
        var k = b.getAttribute('data-routine'), t = b.textContent; b.disabled = true; b.textContent = 'En cours…';
        crm().runRoutine(k).then(function (m) { toast(m); var e = document.getElementById('sa-rt-msg'); if (e) e.textContent = m; })
          .catch(function (e) { toast('Erreur : ' + e.message); }).then(function () { b.disabled = false; b.textContent = t; });
      };
    });
    v.querySelector('#sa-full').onclick = function () { ls(LS_PREF, 'full'); toFull(); };
    v.querySelector('#sa-logout').onclick = function () {
      if (!confirm('Se déconnecter de Scout sur ce téléphone ?')) return;
      ls(LS_LOCK, null);
      try { ['scout_app_q_me', 'scout_app_q_team', 'scout_app_q2_me', 'scout_app_q2_team'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
      if (window.scoutAction && window.scoutAction.logout) window.scoutAction.logout(); else { ls(LS_SESSION, null); location.reload(); }
    };
  }
  function afterLabel(m) { return !m ? 'dès que tu quittes l’appli' : 'après ' + m + ' min'; }

  // passage à la version complète (un bouton permet de revenir)
  function toFull(then) {
    document.body.classList.remove('app-mode');
    var r = document.getElementById('sa'); if (r) r.remove();
    A.stack = [];
    addReturnChip();
    if (then) setTimeout(then, 50);
  }
  function addReturnChip() {
    if (!phone() && !standalone()) return;
    if (document.getElementById('sa-return')) return;
    var b = document.createElement('button');
    b.id = 'sa-return'; b.type = 'button'; b.textContent = 'Mode appli';
    b.onclick = function () { ls(LS_PREF, 'app'); b.remove(); start(); };
    document.body.appendChild(b);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // VERROU : code (PBKDF2, jamais stocké en clair) + Face ID / empreinte (WebAuthn
  // de l'appareil). C'est un verrou local du téléphone : 5 codes faux = déconnexion.
  // ═════════════════════════════════════════════════════════════════════════
  function lockConf() { try { var c = JSON.parse(ls(LS_LOCK) || 'null'); return c && c.pin ? c : null; } catch (e) { return null; } }
  function lockDue() { var c = lockConf(); if (!c || !A.hiddenAt || A.locked) return false; return Date.now() - A.hiddenAt >= (c.after || 0) * 60000; }
  function bioName() { return /iPhone|iPad|Mac/.test(navigator.userAgent) ? 'Face ID ou Touch ID' : 'l’empreinte ou le visage'; }
  function bioAvailable() {
    try { return window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ? PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() : Promise.resolve(false); }
    catch (e) { return Promise.resolve(false); }
  }
  function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
  function unb64(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  function rnd(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
  function hashPin(pin, salt, it) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: it, hash: 'SHA-256' }, k, 256); })
      .then(b64);
  }
  function checkPin(pin) { var c = lockConf(); if (!c) return Promise.resolve(true); return hashPin(pin, unb64(c.pin.salt), c.pin.it).then(function (h) { return h === c.pin.hash; }); }

  function addBio() {
    var s = session() || {};
    return navigator.credentials.create({ publicKey: {
      challenge: rnd(32), rp: { name: 'Scout' },
      user: { id: rnd(16), name: s.first_name || 'scout', displayName: s.first_name || 'Scout' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      timeout: 60000, attestation: 'none'
    } }).then(function (cred) {
      var c = lockConf(); c.cred = b64(cred.rawId); ls(LS_LOCK, JSON.stringify(c)); toast(bioName().replace(/^l’/, 'L’') + ' activé');
    }).catch(function () { toast('Biométrie non activée'); });
  }
  function bioUnlock() {
    var c = lockConf(); if (!c || !c.cred) return Promise.resolve(false);
    return navigator.credentials.get({ publicKey: { challenge: rnd(32), allowCredentials: [{ type: 'public-key', id: unb64(c.cred), transports: ['internal'] }], userVerification: 'required', timeout: 60000 } })
      .then(function (r) { return !!r; }).catch(function () { return false; });
  }

  // clavier à code, plein écran (création, confirmation, déverrouillage)
  function keypad(title, sub, onDone, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'sa-lock'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
    var len = opts.len || 0, pin = '';
    el.innerHTML = '<div class="sa-lock-in"><div class="sa-lock-logo">SCOUT<i>.</i></div><h2>' + esc(title) + '</h2><div class="sa-meta" id="sa-k-sub">' + esc(sub || '') + '</div>'
      + '<div class="sa-dots" id="sa-k-dots" aria-live="polite"></div>'
      + '<div class="sa-keys">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return '<button type="button" data-k="' + n + '">' + n + '</button>'; }).join('')
      + (opts.bio ? '<button type="button" class="fn" id="sa-k-bio" aria-label="Déverrouiller avec ' + esc(bioName()) + '">' + I.finger + '</button>' : (opts.cancel ? '<button type="button" class="fn txt" id="sa-k-cancel">Annuler</button>' : '<span></span>'))
      + '<button type="button" data-k="0">0</button><button type="button" class="fn txt" id="sa-k-del" aria-label="Effacer">Effacer</button></div>'
      + (opts.free ? '<button type="button" class="sa-btn primary" id="sa-k-ok" disabled>Valider</button>' : '') + '</div>';
    document.body.appendChild(el);
    var dots = el.querySelector('#sa-k-dots');
    var draw = function () { var n = Math.max(len || 4, pin.length); dots.innerHTML = Array.from({ length: n }, function (_, i) { return '<i class="' + (i < pin.length ? 'on' : '') + '"></i>'; }).join(''); var ok = el.querySelector('#sa-k-ok'); if (ok) ok.disabled = pin.length < 4; };
    var finish = function () { var p = pin; pin = ''; draw(); onDone(p, el, function (msg) { el.querySelector('#sa-k-sub').textContent = msg; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }); };
    var press = function (k) { if (pin.length >= 6) return; pin += k; draw(); if (len && pin.length === len) setTimeout(finish, 120); };
    el.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { press(b.getAttribute('data-k')); }; });
    el.querySelector('#sa-k-del').onclick = function () { pin = pin.slice(0, -1); draw(); };
    var ok = el.querySelector('#sa-k-ok'); if (ok) ok.onclick = finish;
    var cancel = el.querySelector('#sa-k-cancel'); if (cancel) cancel.onclick = function () { el.remove(); if (opts.onCancel) opts.onCancel(); };
    var bio = el.querySelector('#sa-k-bio'); if (bio) bio.onclick = function () { opts.bio(); };
    el._key = function (e) { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') { pin = pin.slice(0, -1); draw(); } else if (e.key === 'Enter' && opts.free && pin.length >= 4) finish(); };
    document.addEventListener('keydown', el._key);
    var rm = el.remove.bind(el); el.remove = function () { document.removeEventListener('keydown', el._key); rm(); };
    draw();
    return el;
  }

  function setupLock(change) {
    var go = function () {
      keypad('Choisis un code', '4 à 6 chiffres', function (p1, el) {
        el.remove();
        keypad('Confirme le code', '', function (p2, el2, err) {
          if (p2 !== p1) { err('Les deux codes sont différents. Recommence.'); setTimeout(function () { el2.remove(); go(); }, 900); return; }
          var salt = rnd(16), it = 150000;
          hashPin(p1, salt, it).then(function (h) {
            var c = lockConf() || { after: 5 };
            c.pin = { salt: b64(salt), hash: h, it: it, len: p1.length }; ls(LS_LOCK, JSON.stringify(c));
            el2.remove(); toast(change ? 'Code changé' : 'Verrouillage activé');
            if (change || c.cred) { renderMe(); return; }
            bioAvailable().then(function (ok) {
              if (ok && confirm('Utiliser aussi ' + bioName() + ' pour ouvrir Scout ?')) addBio().then(renderMe); else renderMe();
            });
          });
        }, { len: p1.length, cancel: true });
      }, { free: true, cancel: true });
    };
    if (change) askPin('Code actuel', function (ok) { if (ok) go(); }); else go();
  }
  function askPin(title, cb) {
    var c = lockConf(); if (!c) { cb(true); return; }
    keypad(title, '', function (p, el, err) { checkPin(p).then(function (ok) { if (ok) { el.remove(); cb(true); } else err('Code incorrect'); }); }, { len: c.pin.len || 0, free: !c.pin.len, cancel: true, onCancel: function () { cb(false); } });
  }

  function lock() {
    var c = lockConf(); if (!c || A.locked) return;
    A.locked = true; document.body.classList.add('sa-locked');
    var s = session() || {};
    var unlock = function (el) { A.locked = false; A.fails = 0; A.hiddenAt = null; document.body.classList.remove('sa-locked'); el.remove(); if (A.tab === 'today' && !A.stack.length) renderToday(true); };
    var el = keypad('Bonjour ' + (s.first_name || ''), 'Saisis ton code', function (p, el, err) {
      checkPin(p).then(function (ok) {
        if (ok) { unlock(el); return; }
        A.fails++;
        if (A.fails >= 5) { err('Trop d’essais : déconnexion.'); setTimeout(function () { ls(LS_LOCK, null); ls(LS_SESSION, null); location.reload(); }, 1200); return; }
        err('Code incorrect, encore ' + (5 - A.fails) + ' essai' + (5 - A.fails > 1 ? 's' : ''));
      });
    }, { len: c.pin.len || 0, free: !c.pin.len, bio: c.cred ? function () { bioUnlock().then(function (ok) { if (ok) unlock(el); }); } : null });
    // Face ID / empreinte proposé tout de suite (certains téléphones demandent un toucher : le bouton reste là)
    if (c.cred) setTimeout(function () { bioUnlock().then(function (ok) { if (ok && document.body.contains(el)) unlock(el); }); }, 250);
  }

  window.scoutApp = { start: start, lock: lock, isOn: function () { return !!document.getElementById('sa'); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
