// Paramètres › Règles commerciales, Intégrations, tâches automatiques (admin). Chargé à l'ouverture de la section.
(function () {
  'use strict';
  var API_ = function () { return window.SCOUT_API_URL || (typeof API !== 'undefined' ? API : ''); };
  function H(json) { var h = (typeof window.getAuthHeaders === 'function') ? window.getAuthHeaders() : {}; if (json) h['Content-Type'] = 'application/json'; return h; }
  function e(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  async function call(path, opts) {
    opts = opts || {};
    var r = await fetch(API_() + path, { method: opts.method || 'GET', headers: H(!!opts.body), body: opts.body ? JSON.stringify(opts.body) : undefined });
    var d = {}; try { d = await r.json(); } catch (x) {}
    if (!r.ok) throw new Error(d.error || ('HTTP ' + r.status));
    return d;
  }
  function msg(id, t, bad) { var m = document.getElementById(id); if (!m) return; m.textContent = t; m.style.color = bad ? '#C46A52' : ''; }
  function ago(x) {
    if (!x) return 'jamais';
    var d = new Date(x), m = Math.round((Date.now() - d) / 60000);
    if (m < 2) return 'à l’instant'; if (m < 60) return 'il y a ' + m + ' min';
    var h = Math.round(m / 60); if (h < 36) return 'il y a ' + h + ' h';
    return 'il y a ' + Math.round(h / 24) + ' j';
  }
  function dot(state) { return '<span class="cfg-dot ' + (state === 'ok' ? 'on' : state === 'warn' ? 'warn' : 'off') + '"></span>'; }

  // ── Attribution des comptes ──
  var R = { data: null, previewed: false };
  async function loadRules() {
    var box = document.getElementById('cfg-owner-rules'); if (!box) return;
    try {
      var d = await call('/crm/admin/owners/rules'); R.data = d;
      var opts = function (sel) { return '<option value="">Personne</option>' + d.users.map(function (u) { return '<option value="' + e(u.id) + '"' + (String(u.id) === String(sel) ? ' selected' : '') + '>' + e(u.name) + '</option>'; }).join(''); };
      box.innerHTML = '<table class="cfg-utable"><thead><tr><th>#</th><th>Règle</th><th>Comptes</th><th>Commercial</th></tr></thead><tbody>'
        + d.rules.map(function (r, i) {
          return '<tr><td class="cfg-muted">' + (i + 1) + '</td><td><b>' + e(r.label) + '</b><div class="cfg-muted">' + e(r.desc) + '</div></td>'
            + '<td>' + r.n + (r.n ? '<div class="cfg-muted">' + (r.aligned === r.n ? 'tous à jour' : r.aligned + ' déjà à lui') + '</div>' : '') + '</td>'
            + '<td><select class="crm-sel" data-rule="' + e(r.r) + '" aria-label="Commercial pour ' + e(r.label) + '">' + opts(r.owner_id) + '</select></td></tr>';
        }).join('')
        + '</tbody></table><div class="cfg-hint" style="margin-top:8px">' + d.no_rule + ' comptes ne relèvent d’aucune règle (mines, distributeurs, administrations diverses…) : ils s’attribuent à la main depuis leur fiche' + (d.no_rule_owned ? ', ' + d.no_rule_owned + ' le sont déjà' : '') + '.</div>';
      box.querySelectorAll('select').forEach(function (s) { s.onchange = function () { R.previewed = false; document.getElementById('cfg-owner-apply').disabled = true; msg('cfg-owner-msg', 'Règles modifiées : enregistre-les, puis fais un aperçu.'); }; });
    } catch (x) { box.innerHTML = '<span class="cfg-hint" style="color:#C46A52">Erreur : ' + e(x.message) + '</span>'; }
  }
  function currentMap() { var m = {}; document.querySelectorAll('#cfg-owner-rules select[data-rule]').forEach(function (s) { m[s.dataset.rule] = s.value || null; }); return m; }
  async function saveRules() {
    try { await call('/crm/admin/owners/rules', { method: 'PUT', body: { map: currentMap() } }); msg('cfg-owner-msg', 'Règles enregistrées. Rien n’est encore appliqué aux comptes : fais un aperçu.'); await loadRules(); }
    catch (x) { msg('cfg-owner-msg', 'Erreur : ' + x.message, true); }
  }
  async function preview() {
    msg('cfg-owner-msg', 'Calcul…');
    try {
      var ow = document.getElementById('cfg-owner-overwrite').checked;
      var d = await call('/crm/admin/owners/apply', { method: 'POST', body: { dry_run: true, overwrite: ow } });
      var per = Object.keys(d.par_commercial || {}).map(function (k) { return k + ' ' + d.par_commercial[k]; }).join(', ');
      R.previewed = d.a_changer > 0;
      document.getElementById('cfg-owner-apply').disabled = !R.previewed;
      msg('cfg-owner-msg', d.a_changer ? (d.a_changer + ' comptes changeraient de commercial (' + per + ').' + (!ow && d.deja_attribue_garde ? ' ' + d.deja_attribue_garde + ' comptes suivis par un autre commercial sont gardés tels quels.' : ''))
        : ('Rien à changer : ' + d.deja_bon + ' comptes déjà au bon commercial' + (!ow && d.deja_attribue_garde ? ', ' + d.deja_attribue_garde + ' gardés par leur commercial actuel' : '') + '.'));
    } catch (x) { msg('cfg-owner-msg', 'Erreur : ' + x.message, true); }
  }
  async function apply() {
    if (!R.previewed) return;
    var ow = document.getElementById('cfg-owner-overwrite').checked;
    if (!confirm('Appliquer l’attribution aux comptes' + (ow ? ', y compris ceux déjà suivis par un autre commercial' : '') + ' ? Chaque changement est journalisé et réversible.')) return;
    msg('cfg-owner-msg', 'Application…'); document.getElementById('cfg-owner-apply').disabled = true;
    try {
      var d = await call('/crm/admin/owners/apply', { method: 'POST', body: { dry_run: false, overwrite: ow } });
      msg('cfg-owner-msg', d.applied + ' comptes attribués' + (d.errors && d.errors.length ? ', ' + d.errors.length + ' erreurs' : '') + '. Lot « ' + d.batch + ' » (annulable).');
      R.previewed = false; loadRules();
    } catch (x) { msg('cfg-owner-msg', 'Erreur : ' + x.message, true); }
  }

  // ── Cadence des relances et seuil des actions proposées ──
  async function loadTeamRules() {
    try {
      var d = await call('/config'); var by = {}; (d.config || []).forEach(function (r) { by[r.key] = r.value; });
      var num = function (k, f, def) { var v = by[k]; var x = v && v[f] != null ? v[f] : v; x = parseInt(x, 10); return isFinite(x) ? x : def; };
      document.getElementById('cfg-r1').value = num('relance_single_days', 'days', 30);
      document.getElementById('cfg-close').value = num('seq_close_days', 'days', 90);
      document.getElementById('cfg-minscore').value = String(num('signal_min_score', 'score', 5));
    } catch (x) { msg('cfg-seq-msg', 'Erreur : ' + x.message, true); }
  }
  async function put(key, value) { return call('/config', { method: 'PUT', body: { key: key, value: value } }); }
  async function saveSeq() {
    var r1 = parseInt(document.getElementById('cfg-r1').value, 10), cl = parseInt(document.getElementById('cfg-close').value, 10);
    if (!(r1 >= 1 && cl > r1)) { msg('cfg-seq-msg', 'La clôture doit venir après la relance.', true); return; }
    try { await put('relance_single_days', { days: r1 }); await put('seq_close_days', { days: cl }); msg('cfg-seq-msg', 'Enregistré pour toute l’équipe.'); }
    catch (x) { msg('cfg-seq-msg', 'Erreur : ' + x.message, true); }
  }
  async function saveMin() {
    try { await put('signal_min_score', { score: parseInt(document.getElementById('cfg-minscore').value, 10) }); msg('cfg-minscore-msg', 'Enregistré. Pris en compte d’ici une minute.'); }
    catch (x) { msg('cfg-minscore-msg', 'Erreur : ' + x.message, true); }
  }

  // ── Intégrations et tâches automatiques ──
  var SRC = { ted: 'TED (Union européenne)', boamp: 'BOAMP (France)', fts: 'Find a Tender (Royaume-Uni)', sam: 'SAM.gov (États-Unis)' };
  async function loadIntegrations() {
    var box = document.getElementById('cfg-integrations'); if (!box) return;
    try {
      var d = await call('/admin/integrations'); window.__cfgInteg = d;
      var row = function (state, name, detail, action) { return '<div class="cfg-int">' + dot(state) + '<div class="m"><b>' + name + '</b><span>' + detail + '</span></div>' + (action || '') + '</div>'; };
      var last = {}; (d.market_sources.last || []).forEach(function (r) { last[r.source] = r; });
      var week = {}; (d.market_sources.week || []).forEach(function (r) { week[r.source] = r; });
      var srcRows = Object.keys(SRC).map(function (k) {
        var l = last[k], w = week[k];
        if (k === 'sam' && !d.sam.configured) return row('off', SRC[k], 'Clé SAM_API_KEY absente : à ajouter dans Railway (variables du service scout-api).');
        if (!l) return row('warn', SRC[k], 'Jamais interrogé.');
        return row(l.ok ? 'ok' : 'off', SRC[k], (l.ok ? 'Dernière collecte ' + ago(l.at) + ' · ' + (l.inserted || 0) + ' nouveaux' : 'Échec ' + ago(l.at) + ' : ' + e(String(l.error || '').slice(0, 140))) + (w ? ' · 7 j : ' + w.inserted + ' nouveaux, ' + w.ko_n + ' échecs' : ''));
      }).join('');
      var mail = d.mail.mode === 'graph' ? row('ok', 'Envoi d’e-mails', 'Microsoft 365 (Graph) : codes de connexion envoyés par e-mail.')
        : d.mail.mode === 'smtp' ? row('ok', 'Envoi d’e-mails', 'SMTP joignable.')
        : row('off', 'Envoi d’e-mails', 'Non configuré : les codes de connexion par e-mail ne partent pas.');
      box.innerHTML = '<div class="cfg-box"><div class="cfg-box-h"><b>Prospection</b></div>'
        + mail
        + row(d.hunter.configured ? (d.hunter.errors_7d ? 'warn' : 'ok') : 'off', 'Hunter', d.hunter.configured ? ('Clé configurée : recherche et vérification des emails' + (d.hunter.last ? '. Dernier appel ' + ago(d.hunter.last.at) : '') + (d.hunter.errors_7d ? ' · ' + d.hunter.errors_7d + ' erreurs en 7 j' : '') + '.') : 'Clé absente.')
        + row(d.ai.configured ? 'ok' : 'off', 'Claude (IA)', d.ai.configured ? 'Rédaction des emails, chat du site, résumés.' : 'Clé absente : rédaction et chat désactivés.')
        + row('warn', 'Microsoft Dynamics', 'Pas de connexion : les réponses positives sont saisies à la main dans Dynamics.')
        + '</div><div class="cfg-box"><div class="cfg-box-h"><b>Sources marchés</b><span class="cfg-hint">Collecte chaque matin, alimente Marchés et les actions proposées.</span></div>' + srcRows + '</div>'
        + '<div class="cfg-box"><div class="cfg-box-h"><b>Site elistair.com</b></div>'
        + row(d.visitors.last_visit ? 'ok' : 'warn', 'Visiteurs web', (d.visitors.last_visit ? 'Dernière visite ' + ago(d.visitors.last_visit) + ' · ' + (d.visitors.visits_24h || 0) + ' pages vues en 24 h' : 'Aucune visite reçue') + ' · ipinfo ' + (d.visitors.ipinfo ? 'configuré' : 'absent') + ' · alertes ' + (d.visitors.webhook ? 'webhook actif' : 'dans Scout seulement'), '<button type="button" class="crm-btn ghost sm" data-go="visitors">Réglages</button>')
        + row(d.chat.last_lead ? 'ok' : 'warn', 'Chat du site', d.chat.last_lead ? 'Dernier lead ' + ago(d.chat.last_lead) : 'Aucun lead reçu', '<button type="button" class="crm-btn ghost sm" data-go="chat">Réglages</button>')
        + '</div>';
      box.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { go(b.dataset.go); }; });
    } catch (x) { box.innerHTML = '<span class="cfg-hint" style="color:#C46A52">Erreur : ' + e(x.message) + '</span>'; }
  }
  async function loadJobs() {
    var box = document.getElementById('cfg-jobs'); if (!box) return;
    try {
      var d = window.__cfgInteg && (Date.now() - new Date(window.__cfgInteg.at)) < 60000 ? window.__cfgInteg : await call('/admin/integrations');
      var runs = d.market_sources.last || [];
      var lastSrc = runs.reduce(function (a, r) { return !a || new Date(r.at) > new Date(a.at) ? r : a; }, null);
      var anyKo = runs.some(function (r) { return !r.ok; });
      var t = d.topup;
      var fresh = function (x, h) { return x && (Date.now() - new Date(x)) < h * 3600000; };
      box.innerHTML = '<div class="cfg-int">' + dot(fresh(lastSrc && lastSrc.at, 30) ? (anyKo ? 'warn' : 'ok') : 'off') + '<div class="m"><b>Collecte des appels d’offres</b><span>Chaque jour à 6 h (heure de Paris en hiver). Dernier passage ' + ago(lastSrc && lastSrc.at) + (anyKo ? ' · une source en échec, voir Intégrations' : '') + '.</span></div></div>'
        + '<div class="cfg-int">' + dot(fresh(t && t.at, 30) ? 'ok' : 'off') + '<div class="m"><b>Remplissage de « Prochaine action »</b><span>Chaque jour à 17 h. Dernier passage ' + ago(t && t.at) + (t ? ' · réserve ' + (t.pool_before != null ? t.pool_before + ' → ' : '') + (t.pool_after != null ? t.pool_after : '?') + ' contacts (objectif ' + (t.target || 300) + ')' : '') + '.</span></div></div>';
    } catch (x) { box.innerHTML = '<span class="cfg-hint" style="color:#C46A52">Erreur : ' + e(x.message) + '</span>'; }
  }

  var bound = false;
  function bind() {
    if (bound) return; bound = true;
    var b = function (id, f) { var el = document.getElementById(id); if (el) el.onclick = f; };
    b('cfg-owner-save', saveRules); b('cfg-owner-preview', preview); b('cfg-owner-apply', apply);
    b('cfg-seq-save', saveSeq); b('cfg-minscore-save', saveMin);
    var ow = document.getElementById('cfg-owner-overwrite'); if (ow) ow.onchange = function () { R.previewed = false; document.getElementById('cfg-owner-apply').disabled = true; };
  }
  window.scoutSettings = {
    onSection: function (key) {
      bind();
      if (key === 'rules') { loadRules(); loadTeamRules(); }
      else if (key === 'integrations') loadIntegrations();
      else if (key === 'health') loadJobs();
    }
  };
})();
