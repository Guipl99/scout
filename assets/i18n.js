/* Scout · FR / EN
 * Traduction à l'affichage : le code reste en français, ce module traduit les textes de
 * l'interface (nœuds texte, placeholder, title, aria-label, alert/confirm/prompt) quand la
 * langue choisie est l'anglais. Les données saisies (noms, notes, emails) ne sont pas touchées,
 * sauf noms de pays et de secteurs.
 * Règles : correspondance exacte, puis nombres remplacés par {n}, puis motifs (dates, « il y a »),
 * puis découpage en segments « · », « — », « : », « , ».
 */
(function () {
  'use strict';
  var LS = 'scout_lang';
  var lang = 'fr';
  try { lang = localStorage.getItem(LS) || 'fr'; } catch (e) {}
  if (lang !== 'en') lang = 'fr';
  window.scoutLang = lang;
  window.setScoutLang = function (l) {
    try { localStorage.setItem(LS, l === 'en' ? 'en' : 'fr'); } catch (e) {}
    location.reload();
  };
  document.documentElement.lang = lang;

  var D = {
    // ── Navigation, titres
    "Aujourd'hui": 'Today', 'Aujourd’hui': 'Today', 'Fil': 'Feed', 'Mes comptes': 'My accounts', 'Sans compte': 'No account', 'Créer le compte': 'Create account', 'Rattacher': 'Link', 'Écarter': 'Dismiss', 'Visites': 'Visits', 'Chats': 'Chats', 'Marchés': 'Markets', 'Pilotage': 'Management', 'Chat du site': 'Site chat', 'Rechercher ou demander': 'Search or ask',
    'Tout': 'All', 'Urgent': 'Urgent', 'Réponses et réactions': 'Replies and reactions', 'Tâches': 'Tasks', 'Prospection': 'Prospecting', '+ Nouvelle tâche': '+ New task',
    'Tâches terminées (30 j)': 'Completed tasks (30 d)', 'Ma semaine': 'My week', 'Mon portefeuille': 'My portfolio', 'Prochaine action': 'Next action',
    'Compte chaud': 'Hot account', 'À ouvrir': 'To open', 'Ouvrir le compte': 'Open account', 'Ouvrir le contact': 'Open contact', 'Assistant Scout': 'Scout assistant',
    'Accueil': 'Home', 'équipe': 'team', 'Ma journée': 'My day', 'À faire': 'To do', 'Statistiques': 'Statistics', 'Prospects': 'Prospects',
    'Comptes': 'Accounts', 'Compte': 'Account', 'Contacts': 'Contacts', 'Contact': 'Contact', 'Signaux': 'Signals', 'Paramètres': 'Settings', 'Vente': 'Sales', 'Colonnes': 'Columns',
    'Marché': 'Market', 'Relances': 'Follow-ups', 'Relance': 'Follow-up', 'À traiter': 'To review', 'Prospects chauds': 'Hot prospects',
    'Visiteurs web': 'Web visitors', 'Chat': 'Chat', 'Distributeurs': 'Resellers', 'Fabricants': 'Manufacturers', 'Produits': 'Products',
    "Appels d'offres & contrats": 'Tenders & contracts', 'Appels d’offres & contrats': 'Tenders & contracts', 'Ancien tableau de bord': 'Old dashboard',
    'Accueil · Ma journée': 'Home · My day', 'Accueil · À faire': 'Home · To do', 'Prospects · Comptes': 'Prospects · Accounts', 'Prospects · Contacts': 'Prospects · Contacts',
    'Signaux : prospects chauds, visiteurs du site, chat, appels d\'offres et contrats': 'Signals: hot prospects, site visitors, chat, tenders and contracts',
    'Comptes et contacts prospects : fiches, comité d\'achat, historique': 'Prospect accounts and contacts: records, buying committee, history',
    'Mon portefeuille de comptes, mes tâches, mes relances': 'My accounts, my tasks, my follow-ups',
    'Rechercher': 'Search', 'Rechercher…': 'Search…', 'Tape pour chercher dans toute la base…': 'Type to search the whole database…',
    'Retour à l\'accueil': 'Back to home', '← Retour': '← Back', '← Comptes': '← Accounts', '← Contacts': '← Contacts',
    // ── Connexion
    'Accès équipe': 'Team access', 'Ton prénom': 'Your first name', 'Prénom ou e-mail @elistair.com': 'First name or @elistair.com email',
    'Prénom ou prenom.nom@elistair.com': 'First name or firstname.lastname@elistair.com', 'Mot de passe': 'Password', 'Se connecter': 'Sign in',
    'Première connexion / mot de passe oublié ?': 'First sign-in / forgot password?', 'Mot de passe oublié ?': 'Forgot password?', 'Masquer': 'Hide',
    '1re connexion : mot de passe d\'équipe, puis crée ton mot de passe perso': 'First sign-in: team password, then create your own password',
    '1re connexion : clique ci-dessous et reçois un code sur ton adresse @elistair.com': 'First sign-in: click below to get a code at your @elistair.com address',
    'On t\'envoie un code sur ton adresse': 'We will email a code to your', '. Tu t\'en sers pour définir ton mot de passe perso.': ' address. Use it to set your own password.', '. Regarde ta boîte mail (et les spams).': '. Check your inbox (and spam).',
    'Ton email @elistair.com': 'Your @elistair.com email', 'Recevoir un code par email': 'Email me a code', 'Code envoyé à': 'Code sent to',
    'Regarde ta boîte mail (et les spams).': 'Check your inbox (and spam).', 'Code reçu ({n} chiffres)': 'Code received ({n} digits)',
    'Ton mot de passe perso': 'Your password', 'Confirme': 'Confirm', 'Valider et me connecter': 'Confirm and sign in', '← Changer d\'adresse': '← Change address',
    'Réinitialise ton mot de passe toi-même avec le': 'Reset your password yourself with the', 'mot de passe d\'équipe': 'team password',
    '(Les profils admin passent par un autre admin.)': '(Admin profiles go through another admin.)', 'Mot de passe d\'équipe': 'Team password',
    'Nouveau mot de passe perso': 'New password', 'Réinitialiser mon mot de passe': 'Reset my password', 'le mot de passe partagé': 'the shared password',
    'min. {n} caractères': 'min. {n} characters', 'retape-le': 'type it again', 'Mot de passe personnel': 'Personal password',
    'Connexion…': 'Signing in…', 'Envoi…': 'Sending…', 'Vérification…': 'Checking…', 'Réinitialisation…': 'Resetting…',
    'mot de passe incorrect': 'wrong password', 'compte désactivé': 'account disabled', 'profil introuvable': 'profile not found', 'code incorrect': 'wrong code',
    'profil inconnu : utilise « Première connexion » avec ton adresse @elistair.com': 'unknown profile: use "First sign-in" with your @elistair.com address',
    'adresse inconnue : utilise « Première connexion » pour recevoir un code': 'unknown address: use "First sign-in" to get a code',
    'Mot de passe réinitialisé. Connecte-toi avec ton nouveau mot de passe.': 'Password reset. Sign in with your new password.',
    'Indique ton prénom.': 'Enter your first name.', 'Entre le mot de passe d\'équipe.': 'Enter the team password.',
    'Les deux mots de passe ne correspondent pas.': 'The two passwords do not match.', 'Le code fait {n} chiffres.': 'The code has {n} digits.',
    'Utilise ton adresse @elistair.com.': 'Use your @elistair.com address.', 'Entre une adresse email valide.': 'Enter a valid email address.',
    'Le mot de passe doit faire au moins {n} caractères.': 'The password must be at least {n} characters.',
    'Le nouveau mot de passe doit faire au moins {n} caractères.': 'The new password must be at least {n} characters.',
    'Se déconnecter': 'Sign out', '🚪 Se déconnecter': '🚪 Sign out', '🔑 Créer / changer mon mot de passe': '🔑 Create / change my password',
    'Se déconnecter pour laisser un autre commercial se connecter (et créer son mot de passe à la {n}re connexion).': 'Sign out so another salesperson can sign in (and create their password on first sign-in).',
    // ── Ma journée / À faire
    'Bonjour': 'Hello', 'Moi': 'Me', 'Équipe': 'Team', 'Ma prochaine action': 'My next action', 'Prochaine action': 'Next action', 'Prochaine action suggérée': 'Suggested next action',
    '🎯 Prochaine action suggérée': '🎯 Suggested next action', 'Traiter le prochain contact suggéré': 'Work the next suggested contact',
    'à faire aujourd’hui': 'to do today', 'À faire aujourd’hui': 'To do today', 'dont {n} en retard': 'including {n} overdue',
    'réponse positive à transmettre': 'positive reply to hand over', 'réponses positives à transmettre': 'positive replies to hand over',
    'compte engagé ({n} j)': 'engaged account ({n} d)', 'comptes engagés ({n} j)': 'engaged accounts ({n} d)', 'Toute la file →': 'Whole queue →',
    'Rien d’urgent aujourd’hui. Lancez « Prochaine action » ou travaillez vos comptes Tier {n}.': 'Nothing urgent today. Start "Next action" or work your Tier {n} accounts.',
    'Mon portefeuille': 'My portfolio', 'Portefeuille de l’équipe': 'Team portfolio', 'Tous mes comptes →': 'All my accounts →', 'Tous les comptes →': 'All accounts →',
    'Tier {n} · {n} · {n}': 'Tier {n} · {n} · {n}', 'Tier {n}–{n} sans activité {n} j': 'Tier {n}–{n} no activity {n} d', 'Comités incomplets (T{n}–{n})': 'Incomplete committees (T{n}–{n})',
    'Engagés': 'Engaged', 'Tier {n}–{n} à relancer': 'Tier {n}–{n} to re-engage', 'Comités à compléter': 'Committees to complete',
    'Aucun compte engagé ces {n} derniers jours.': 'No engaged account in the last {n} days.', 'Tous les comptes prioritaires ont eu une activité récente.': 'All priority accounts had recent activity.',
    'Les comités des comptes prioritaires sont couverts.': 'Priority account committees are covered.', 'Ma semaine': 'My week', 'Statistiques →': 'Statistics →',
    'emails envoyés': 'emails sent', 'relances': 'follow-ups', 'actions': 'actions', 'intéressés (total)': 'interested (total)', 'Emails {n} j :': 'Emails {n} d:',
    'Visites sur elistair.com': 'Visits to elistair.com', 'Signaux →': 'Signals →', 'Prochains jours': 'Coming days', 'Rien de planifié.': 'Nothing planned.',
    'Aucun compte ne vous est encore attribué.': 'No account assigned to you yet.', 'Ouvrez': 'Open', 'les comptes sans propriétaire': 'unowned accounts',
    'Tâche': 'Task', 'Tâches': 'Tasks', 'Réponse': 'Reply', 'Réponses': 'Replies', 'Tout': 'All', 'Tous': 'All', 'Toutes': 'All',
    'En retard': 'Overdue', 'Aujourd\'hui': 'Today', "Aujourd’hui": 'Today', 'Hier': 'Yesterday', 'Sans échéance': 'No due date', 'Plus tard': 'Later',
    'Préparer la relance': 'Prepare follow-up', 'Terminées ({n} j)': 'Done ({n} d)', 'Nouvelle tâche': 'New task',
    'Les relances dues (cadence J+{n} / J+{n} après le {n}er email) et les réponses positives arrivent ici automatiquement.': 'Due follow-ups (D+{n} / D+{n} after the first email) and positive replies land here automatically.',
    'Rien dans cette file. Les tâches créées depuis une fiche, les relances dues et les réponses positives arrivent ici.': 'Nothing in this queue. Tasks created from a record, due follow-ups and positive replies land here.',
    'Aucune tâche terminée ces {n} derniers jours.': 'No task completed in the last {n} days.', 'À qualifier puis transmettre au CRM': 'To qualify, then hand over to the CRM',
    'Relance {n}': 'Follow-up {n}', 'Réponse positive': 'Positive reply', 'Reçue': 'Received', 'Reçue le': 'Received on',
    'Relancer après rendez-vous': 'Follow up after meeting', 'Appeler le chef drone': 'Call the drone lead', 'Envoyer la doc Safe-T': 'Send the Safe-T brochure',
    // ── Statistiques
    'Activité de l’équipe et conversion': 'Team activity and conversion', '{n} jours': '{n} days', '{n} mois': '{n} months', '12 mois': '12 months',
    'contacts touchés': 'contacts reached', 'premiers emails': 'first emails', 'réponses positives': 'positive replies', 'transmis au CRM': 'handed over to CRM',
    'appels, RDV et notes': 'calls, meetings and notes', 'Emails envoyés par semaine': 'Emails sent per week', '{n} dernières semaines, équipe · en vert : réponses positives': 'last {n} weeks, team · green: positive replies',
    'Par commercial': 'By salesperson', 'Commercial': 'Salesperson', 'Contacts touchés': 'Contacts reached', '1ers emails': 'First emails',
    'Appels / RDV': 'Calls / meetings', 'LinkedIn': 'LinkedIn', 'Réponses +': 'Replies +', 'Transmis': 'Handed over', 'Tâches faites': 'Tasks done', 'Notes': 'Notes',
    'Portefeuille': 'Portfolio', 'avec un propriétaire': 'with an owner', 'avec un tier': 'with a tier', 'engagés ({n} j)': 'engaged ({n} d)',
    'Lecture': 'How to read', 'Aucune action enregistrée sur la période.': 'No action recorded in this period.', 'Aucune activité sur la période.': 'No activity in this period.',
    '« Contacts touchés » compte les personnes contactées par email, LinkedIn, appel ou RDV. Les réponses positives de la période peuvent venir d’emails envoyés plus tôt.': '"Contacts reached" counts people contacted by email, LinkedIn, call or meeting. Positive replies in the period may come from emails sent earlier.',
    'Qualité des données': 'Data quality', 'jamais nettoyée': 'never cleaned', 'automatique chaque semaine': 'automatic every week', 'dernier nettoyage': 'last cleaning',
    'doublons probables': 'likely duplicates', 'Tier {n}–{n} sans propriétaire': 'Tier {n}–{n} without owner', 'comptes sans pays': 'accounts without country',
    'comptes sans secteur': 'accounts without sector', 'contacts sans compte': 'contacts without account', 'tâches en retard de {n} j+': 'tasks {n}+ d overdue',
    'Lancer le nettoyage maintenant': 'Run cleaning now', 'Nettoyage…': 'Cleaning…', 'Garder celui-ci': 'Keep this one', 'Voir les doublons': 'See duplicates', 'Fusion faite': 'Merge done',
    'Corrige seul l’écriture des secteurs (casse, accents) et les espaces dans les noms. Les doublons se fusionnent à la main ci-dessous.': 'Automatically fixes sector spelling (case, accents) and extra spaces in names. Duplicates are merged by hand below.',
    'Réservé aux admins.': 'Admins only.',
    // ── Comptes (liste)
    'Tous les comptes': 'All accounts', 'Mes comptes': 'My accounts', 'Tier {n}': 'Tier {n}', 'Chauds': 'Hot', 'Comités incomplets': 'Incomplete committees',
    'Sans propriétaire': 'No owner', 'Tâches en retard': 'Overdue tasks', '+ Enregistrer la vue': '+ Save view', 'Vue enregistrée': 'View saved', 'Supprimer la vue': 'Delete view',
    'Rechercher un compte, un domaine, un contact…': 'Search an account, a domain, a contact…', 'Propriétaire': 'Owner', 'Tier': 'Tier', 'Engagement': 'Engagement',
    'Statut': 'Status', 'Comité': 'Committee', 'Pays': 'Country', 'Secteur': 'Sector', 'Activité': 'Activity', 'Site web': 'Website', 'Marchés': 'Tenders',
    'Réinitialiser': 'Reset', 'Exporter (CSV)': 'Export (CSV)', 'Liste': 'List', 'Arbre': 'Tree', 'Priorité': 'Priority', 'Dernière activité': 'Last activity',
    'Prochaine tâche': 'Next task', 'Afficher plus': 'Show more', 'Tout sélectionner': 'Select all', 'Aucun compte ne correspond à ces filtres.': 'No account matches these filters.',
    '{n} comptes': '{n} accounts', '{n} compte': '{n} account', '{n} comptes · {n} affichés': '{n} accounts · {n} shown', '{n} comptes · {n} pays': '{n} accounts · {n} countries',
    '{n} compte · {n} pays': '{n} account · {n} countries', 'Filtrer l’arbre (nom de compte)': 'Filter the tree (account name)', 'Filtrer l’arbre': 'Filter the tree', 'Aucun compte.': 'No account.',
    'Sans pays': 'No country', 'Personne': 'Nobody', 'Jamais': 'Never', 'Aucune': 'None', 'Aucun': 'None', 'jamais contacté': 'never contacted', 'Jamais contacté': 'Never contacted',
    'Chaud': 'Hot', 'Tiède': 'Warm', 'Froid': 'Cold', 'Chaud ou tiède': 'Hot or warm', 'Nouveau': 'New', 'Contacté': 'Contacted', 'Engagé': 'Engaged', 'Qualifié': 'Qualified',
    'Transmis CRM': 'Sent to CRM', 'Transmis au CRM': 'Handed over to CRM', 'Client': 'Customer', 'Perdu': 'Lost', 'Automatique': 'Automatic',
    'Tier {n} et {n}': 'Tier {n} and {n}', 'Sans tier': 'No tier', 'Mes pays': 'My countries', 'Tous les statuts': 'All statuses', 'Tous les types': 'All types',
    'Tâche ouverte': 'Open task', 'Tâche en retard': 'Overdue task', 'Aucune tâche': 'No task', 'A visité le site ({n} j)': 'Visited the site ({n} d)',
    'Appel d’offres ou contrat': 'Tender or contract', 'Marché de moins d’un an': 'Tender under one year old', 'Comité complet': 'Complete committee', 'Comité incomplet': 'Incomplete committee',
    'Sans décideur': 'No decision-maker', 'Activité récente ({n} j)': 'Recent activity ({n} d)', 'Sans activité {n} j': 'No activity {n} d', 'Avec contacts': 'With contacts', 'Sans contact': 'No contact',
    'Assigner à…': 'Assign to…', 'Tier…': 'Tier…', 'Statut…': 'Status…', 'Exporter': 'Export', 'Désélectionner': 'Deselect', 'sélectionné': 'selected', 'sélectionnés': 'selected',
    'Tier mis à jour': 'Tier updated', 'Statut mis à jour': 'Status updated', 'Propriétaire mis à jour': 'Owner updated',
    // ── Fiche compte
    'Saisir une activité': 'Log an activity', 'Note': 'Note', 'À propos du compte': 'About the account', 'Rattaché à': 'Parent account', 'Changer': 'Change', 'Détacher': 'Detach',
    'Rattacher à… (ex. ministère, direction)': 'Attach to… (e.g. ministry, directorate)', '+ Rattacher un compte à celui-ci': '+ Attach an account under this one',
    'Comptes rattachés': 'Child accounts', 'Aucun compte rattaché.': 'No child account.', 'Compte rattaché': 'Account attached', 'Compte détaché': 'Account detached',
    'Fiche marché : produits et fournisseurs': 'Market record: products and suppliers', 'sur {n}': 'out of {n}', 'Adéquation': 'Fit', 'Intention': 'Intent', 'Relation': 'Relationship',
    'tier, secteur cible, usage drone': 'tier, target sector, drone use', 'engagement des {n} derniers jours': 'engagement over the last {n} days', 'emails connus et comité couvert': 'known emails and committee coverage',
    'Priorité : adéquation + intention + relation': 'Priority: fit + intent + relationship', '{n} jours': '{n} days', 'Actions et activités sur les contacts': 'Actions and activities on contacts',
    'Pas de visite rattachée (renseignez le domaine)': 'No linked visit (fill in the domain)', 'Pas de visite rattachée': 'No linked visit', 'Score d’engagement sur {n} jours': 'Engagement score over {n} days',
    'Historique': 'History', 'Activités': 'Activities', 'Modifications': 'Changes', 'Comité d’achat': 'Buying committee', '{n} / {n} rôles': '{n} / {n} roles',
    'Décideur': 'Decision-maker', 'Acheteur': 'Buyer', 'Utilisateur': 'User', 'Technique': 'Technical', 'Autres': 'Others', 'rôle à préciser': 'role to confirm', 'Influenceur': 'Influencer',
    'Signe, arbitre le budget': 'Signs, decides the budget', 'Achats, marchés publics, acquisition': 'Procurement, public tenders, acquisition', 'Opère les drones au quotidien': 'Operates the drones daily',
    'Évalue la solution : technique, innovation, SI': 'Evaluates the solution: technical, innovation, IT',
    'Trouver ou ajouter un décideur': 'Find or add a decision-maker', 'Trouver ou ajouter un acheteur': 'Find or add a buyer', 'Trouver ou ajouter un utilisateur': 'Find or add a user', 'Trouver ou ajouter un technique': 'Find or add a technical contact',
    '{n} ouverte': '{n} open', '{n} ouvertes': '{n} open', 'Aucune tâche ouverte.': 'No open task.', 'Aucune tâche.': 'No task.', '{n} terminée': '{n} done', '{n} terminées': '{n} done',
    'Appels d’offres & contrats': 'Tenders & contracts', 'Appel d’offres': 'Tender', 'Contrat': 'Contract', 'Sans titre': 'Untitled',
    'Rattachés par le nom de l’acheteur. Un marché de moins d’un an ajoute {n} points d’engagement ({n} max).': 'Linked by buyer name. A tender under one year old adds {n} engagement points ({n} max).',
    'Pages vues': 'Page views', 'Nom': 'Name', 'Type': 'Type', 'Ville': 'City', 'Domaine': 'Domain', 'Description': 'Description', 'Budget': 'Budget', 'Flotte / quantité': 'Fleet / quantity',
    'ID Dynamics': 'Dynamics ID', 'Pas encore lié': 'Not linked yet', 'Ajouter': 'Add', 'Prochaine étape': 'Next step', 'Date prochaine étape': 'Next step date',
    'Ce que vous avez fait, avec qui, le résultat…': 'What you did, with whom, the outcome…', 'Compte rendu': 'Report', 'Compte rendu : ce qui a été dit, le besoin, la suite…': 'Report: what was said, the need, next steps…',
    'Info budget, organisation, contexte… (visible par toute l’équipe)': 'Budget, organisation, context… (visible to the whole team)', 'Ajouter la note': 'Add note', 'Note ajoutée': 'Note added',
    'Nouvelle tâche, ex. Préparer la démo pour le SDIS {n}': 'New task, e.g. Prepare the demo for SDIS {n}', 'Créer la tâche': 'Create task', 'Tâche créée': 'Task created',
    'Ctrl+Entrée pour enregistrer': 'Ctrl+Enter to save', 'Enregistrer': 'Save', 'Enregistré': 'Saved', 'Annuler': 'Cancel', 'Supprimer': 'Delete', 'Modifier': 'Edit', 'Fermer': 'Close', 'fermer': 'close',
    'Appel': 'Call', 'Email': 'Email', 'Rendez-vous': 'Meeting', 'Démo': 'Demo', 'Salon': 'Trade show', 'Message LinkedIn': 'LinkedIn message', 'Autre action': 'Other action', 'Via un tiers': 'Via a third party',
    'Résultat': 'Outcome', 'Positif': 'Positive', 'Neutre': 'Neutral', 'Négatif': 'Negative', 'Contact (facultatif)': 'Contact (optional)', 'Échéance': 'Due date',
    'Réponse négative': 'Negative reply', 'Marqué déjà client': 'Marked as existing customer', 'Email envoyé': 'Email sent', 'Email non remis': 'Email bounced',
    'Contact ajouté': 'Contact added', 'Ce compte a été fusionné : ouverture du compte conservé': 'This account was merged: opening the kept account', 'Fusion': 'Merge',
    'Chargement de la fiche…': 'Loading record…', 'Ce compte n’existe plus.': 'This account no longer exists.', 'Ex. Rappeler le chef du service drones': 'E.g. Call back the head of the drone unit',
    'Ex. démo Safe-T avec le chef drones': 'E.g. Safe-T demo with the drone lead', 'Supprimer la tâche': 'Delete task', 'Terminer': 'Complete', 'Statut : automatique →': 'Status: automatic →',
    'Propriétaire : personne →': 'Owner: nobody →', 'Propriétaire du compte': 'Account owner', 'Tier du compte': 'Account tier', 'Statut / étape': 'Status / stage',
    'Tier : Tier {n} → Tier {n}': 'Tier: Tier {n} → Tier {n}', 'Note avec': 'Note with', 'Rendez-vous avec': 'Meeting with', 'Contact ajouté :': 'Contact added:',
    // ── Contacts
    'Fiche contact': 'Contact record', 'Rechercher un nom, un email, un titre, un compte…': 'Search a name, email, title, account…', 'Rôle': 'Role', 'Rôle dans le comité': 'Committee role',
    'Rôle déduit du titre, à confirmer': 'Role inferred from title, to confirm', 'Rôle inconnu': 'Unknown role', 'Rôle saisi': 'Role entered', 'Titre': 'Title', 'Titre inconnu': 'Unknown title',
    'Prénom': 'First name', 'Téléphone': 'Phone', 'Avec email': 'With email', 'Sans email': 'No email', 'Sans compte': 'No account', 'Rattaché à un compte': 'Linked to an account',
    'Copier l’email': 'Copy email', 'Email copié': 'Email copied', 'Ouvrir le profil ↗': 'Open profile ↗', 'Rédiger un email': 'Write an email', 'Contacts ({n})': 'Contacts ({n})',
    '{n} contacts': '{n} contacts', '{n} contact': '{n} contact', '{n} contacts · {n} affichés': '{n} contacts · {n} shown', 'Aucun contact ne correspond.': 'No contact matches.',
    'Ce contact n’est rattaché à aucun compte': 'This contact is not linked to any account', 'Rattachez d’abord ce contact à un compte': 'Link this contact to an account first',
    'Ouvrir la fiche complète →': 'Open full record →', 'Voir le contexte': 'See context', 'Voir tout →': 'See all →', 'Voir →': 'See →', 'Voir': 'See',
    // ── Signaux à traiter
    'Signaux à traiter': 'Signals to review', 'Appels d’offres et contrats repérés par la veille. Rattachez-les à un compte, créez une tâche ou ignorez-les.': 'Tenders and contracts found by monitoring. Link them to an account, create a task or ignore them.',
    'Traités': 'Done', 'Ignorés': 'Ignored', 'Rattacher': 'Link', 'Créer une tâche': 'Create task', 'Ignorer': 'Ignore', 'Remettre à traiter': 'Back to review',
    'Aucun compte rattaché': 'No linked account', 'Rattacher à quel compte ?': 'Link to which account?', 'Sur quel compte créer la tâche ?': 'Which account is the task for?',
    'Compte concerné': 'Account', 'Créer sans compte': 'Create without account', 'Signal ignoré': 'Signal ignored', 'Signal remis à traiter': 'Signal back to review',
    'Rattachement retiré': 'Link removed', 'Tâche créée (échéance dans {n} jours)': 'Task created (due in {n} days)', 'Rien à traiter : tous les signaux ont été vus.': 'Nothing to review: all signals have been seen.',
    'Aucun signal dans cette liste.': 'No signal in this list.', 'ignoré par': 'ignored by', 'traité par': 'handled by', 'Rechercher un compte…': 'Search an account…',
    // ── Prochaine action
    'Pas de nouveau contact à proposer': 'No new contact to suggest', 'Tous les contacts prioritaires sont déjà pris, en pause ou traités pour le moment.': 'All priority contacts are already taken, paused or handled for now.',
    'Aucun contact ne correspond aux segments choisis dans Paramètres.': 'No contact matches the segments chosen in Settings.', 'Modifier mes segments': 'Edit my segments',
    'Traiter ma file : {n} à faire ({n} en retard)': 'Work my queue: {n} to do ({n} overdue)', 'Traiter ma file : {n} à faire': 'Work my queue: {n} to do',
    'Travailler mes comptes Tier {n}': 'Work my Tier {n} accounts', 'Recherche du meilleur contact…': 'Finding the best contact…', 'Réduire': 'Minimize',
    'Réduire — garder la progression et naviguer': 'Minimize, keep progress and browse', '✉️ Générer un email de prospection (IA)': '✉️ Generate a prospecting email (AI)',
    '✉️ Envoyer un email': '✉️ Send an email', '🤝 Déjà client': '🤝 Already a customer', '🚫 Pas un bon prospect': '🚫 Not a good prospect', 'Passer': 'Skip', 'Suivant': 'Next',
    '🕓 Signaler « contact pas à jour »': '🕓 Flag "contact out of date"', '📬 Marquer un retour reçu (intéressé / pas intéressé)': '📬 Log a reply (interested / not interested)',
    '📭 Email non remis (bounce)': '📭 Email bounced', '↩️ Marquer comme non contacté': '↩️ Mark as not contacted', 'Intéressé': 'Interested', 'Pas intéressé': 'Not interested', 'Intéressés': 'Interested',
    // ── Anciens écrans (tableau de bord, relances, prospects chauds)
    'Mon activité': 'My activity', '👤 Mon activité': '👤 My activity', 'Prospects chauds ': 'Hot prospects', 'Relances dues': 'Due follow-ups', 'Relancer →': 'Follow up →', 'Rien à relancer pour le moment 👍': 'Nothing to follow up for now 👍',
    'MES EMAILS ({n}J)': 'MY EMAILS ({n}D)', 'MES RELANCES ({n}J)': 'MY FOLLOW-UPS ({n}D)', 'MES INTÉRESSÉS': 'MY INTERESTED', 'Mes intéressés': 'My interested', 'Mes relances ({n}j)': 'My follow-ups ({n}d)',
    'Emails envoyés ({n}j)': 'Emails sent ({n}d)', 'Emails envoyés (total)': 'Emails sent (total)', '📈 Activité & marché': '📈 Activity & market', 'déplier': 'expand', 'replier': 'collapse',
    '📊 Vue générale · équipe': '📊 Overview · team', 'Vue générale': 'Overview', 'Suivi & relances': 'Tracking & follow-ups', 'Vue détaillée des relances': 'Detailed follow-up view',
    'En attente de réponse': 'Waiting for reply', 'Close, sans réponse': 'Closed, no reply', 'Close, sans réponse ({n} j)': 'Closed, no reply ({n} d)', 'Hors séquence': 'Out of sequence',
    'Aucune réponse {n} jours après le dernier email': 'No reply {n} days after the last email', 'Prochaine relance': 'Next follow-up', 'Séquence épuisée': 'Sequence finished', '1er mail': '1st email',
    'Filtrer par contact / compte…': 'Filter by contact / account…', '✅ Ont répondu, à transmettre': '✅ Replied, to hand over', '⭐ VIP à contacter (pas encore approchés)': '⭐ VIPs to contact (not yet approached)',
    'Les leads à traiter en priorité : ceux qui ont répondu, et tes contacts VIP pas encore approchés.': 'Leads to work first: those who replied, and your VIP contacts not yet approached.',
    'Les prospects que tu as déjà contactés : relance-les au bon moment, suis leur statut, transmets au CRM.': 'Prospects you already contacted: follow up at the right time, track their status, hand over to the CRM.',
    'Aucun pour le moment': 'None for now', 'intéressé': 'interested', 'intéressés': 'interested', 'à transmettre': 'to hand over', 'VIP à contacter': 'VIPs to contact', 'à relancer': 'to follow up',
    // ── Signaux (anciens écrans), visiteurs, chat
    'Qui vient sur elistair.com. On reconnaît le réseau des entreprises, administrations et universités. Les box internet, mobiles et VPN restent anonymes.': 'Who visits elistair.com. Company, government and university networks are recognised. Home broadband, mobile and VPN visitors stay anonymous.',
    'Conversations du site': 'Site conversations', 'Une question ?': 'A question?', 'Écrire un message…': 'Write a message…', 'Nouvelle conversation': 'New conversation', 'Fermer le chat': 'Close chat',
    'Ouvrir le chat Scout': 'Open Scout chat', 'Poser une question à Scout': 'Ask Scout a question', 'Aucune conversation pour le moment.': 'No conversation yet.', 'Réglages': 'Settings', 'Réglages du bot': 'Bot settings',
    'Rechercher un tender, pays, acheteur...': 'Search a tender, country, buyer...', 'Rechercher un contrat, client, programme...': 'Search a contract, customer, programme...',
    'Appels d\'offres en cours': 'Open tenders', '📋 Contrats attribués': '📋 Awarded contracts', 'Valeur identifiée': 'Identified value', 'non renseignée': 'not provided', 'Total': 'Total',
    'Aucun contrat — les fiches fabricants sont enrichies chaque semaine.': 'No contract yet: manufacturer records are enriched every week.',
    // ── Paramètres
    'Thème': 'Theme', 'Taille du texte': 'Text size', 'Densité des cartes': 'Card density', 'Onglet par défaut au démarrage': 'Default tab at startup', 'Langue': 'Language',
    'Langue de l\'interface': 'Interface language', '👥 Gestion de l\'équipe (admin)': '👥 Team management (admin)', '+ Ajouter un commercial': '+ Add a salesperson', 'E-mail': 'Email',
    'Passer admin': 'Make admin', 'Retirer admin': 'Remove admin', 'Réinit. mdp': 'Reset pwd', 'Désactiver': 'Disable', 'Activer': 'Enable', 'mdp équipe': 'team pwd', 'pas d\'e-mail': 'no email',
    '🔓 Débloquer connexions': '🔓 Unlock sign-ins', 'Segments proposés dans « Prochaine action »': 'Segments offered in "Next action"', 'Délai avant relance (jours)': 'Delay before follow-up (days)',
    '☀️ Clair (jour)': '☀️ Light (day)', '🌙 Sombre (nuit)': '🌙 Dark (night)', 'Normal': 'Normal', 'Grand': 'Large', 'Très grand': 'Very large', 'Compacte': 'Compact', 'Confortable': 'Comfortable',
    'Filtres mémorisés': 'Saved filters', 'Aucun filtre actif mémorisé.': 'No saved active filter.', 'Réinitialiser tous les filtres': 'Reset all filters', 'Diagnostic système': 'System check', 'Vérifier': 'Check',
    // ── Divers
    'Chargement…': 'Loading…', 'Chargement...': 'Loading...', 'Erreur': 'Error', 'Erreur :': 'Error:', 'Erreur réseau': 'Network error', 'Erreur de chargement': 'Loading error',
    'Oui': 'Yes', 'Non': 'No', 'Nouveau mot de passe pour ce commercial (min {n}) :': 'New password for this salesperson (min {n}):', 'ouvrir': 'open',
    'Adresse @elistair.com de ce profil (vide pour retirer) :': '@elistair.com address for this profile (empty to remove):', 'Donner les droits admin à ce profil ?': 'Give admin rights to this profile?',
    'Retirer les droits admin de ce profil ?': 'Remove admin rights from this profile?', 'Réponse immédiate': 'Immediate reply', 'Nouvelle version disponible': 'New version available', 'Recharger': 'Reload',
    'Rechercher (nom, titre, organisation, email, notes…)': 'Search (name, title, organisation, email, notes…)', 'Téléversez un fichier': 'Upload a file', '📥 Importer des contacts': '📥 Import contacts',
    'Marquer un retour reçu': 'Log a reply', 'Retour de': 'Reply from', 'Plus tard · {n}': 'Later · {n}', 'Nom requis': 'Name required', 'Impossible de charger les comptes': 'Could not load accounts',
    // ── Écrans secondaires
    "Actualiser la liste": "Refresh list",
    "Afficher": "Show",
    "Armée / Forces armées": "Army / Armed forces",
    "Attribuer à": "Assign to",
    "Aucun ajout récent.": "No recent addition.",
    "Aucun compte identifié": "No identified account",
    "Aucun contact en attente de validation. 🎉": "No contact awaiting validation. 🎉",
    "Aucun fabricant pour ce filtre": "No manufacturer for this filter",
    "Aucun prospect trouve.": "No prospect found.",
    "Aucun signal disponible.": "No signal available.",
    "Aucun tender live": "No live tender",
    "Bac à sable (test)": "Sandbox (test)",
    "Bulle en service sur elistair.com": "Chat bubble live on elistair.com",
    "CA estimé": "Estimated revenue",
    "Ce que l'IA a récupéré": "What the AI collected",
    "Clique une ligne pour la relire.": "Click a row to read it.",
    "Cliquez sur Rafraîchir pour charger les entrées à valider.": "Click Refresh to load entries to validate.",
    "Cliquez sur Vérifier pour tester l'API.": "Click Check to test the API.",
    "Comité d’achat du compte": "Account buying committee",
    "Comptes ABM venus sur le site": "ABM accounts that visited the site",
    "Comptes ignorés": "Ignored accounts",
    "Consignes supplémentaires (ajoutées au prompt)": "Extra instructions (added to the prompt)",
    "Contact / compte": "Contact / account",
    "Contacts entreprise": "Company contacts",
    "Couper la bulle": "Turn off the bubble",
    "Créer une relance": "Create a follow-up",
    "Données en cours de collecte": "Data being collected",
    "Drones détectés": "Drones detected",
    "Effacer les tests": "Clear tests",
    "Emails par semaine": "Emails per week",
    "Emails qualifiés en base": "Qualified emails in database",
    "Employés": "Employees",
    "Envoyer": "Send",
    "Exporter la vue filtrée en CSV (Excel)": "Export filtered view to CSV (Excel)",
    "Filtrer sur mes pays cibles": "Filter on my target countries",
    "Fonctionnalités & technologie": "Features & technology",
    "Français": "French",
    "Général": "General",
    "Identifiés par leur site": "Identified by their website",
    "Langue du visiteur": "Visitor language",
    "Les visiteurs peuvent lui parler.": "Visitors can talk to it.",
    "Les filtres actifs sur chaque onglet sont automatiquement sauvegardés et restaurés à chaque session.": "Active filters on each tab are saved and restored automatically every session.",
    "Lève le verrou anti-bruteforce quand un commercial est bloqué après plusieurs mauvais mots de passe": "Lifts the anti-bruteforce lock when a salesperson is locked out after several wrong passwords",
    "Marchés & opérateurs": "Markets & operators",
    "Message d'accueil": "Welcome message",
    "Message d'accueil (anglais)": "Welcome message (English)",
    "Modèle": "Model",
    "Nb modèles": "No. of models",
    "Nom affiché": "Display name",
    "Nom, domaine, pays…": "Name, domain, country…",
    "Opérateurs": "Operators",
    "Organisations identifiées": "Identified organisations",
    "Page d'accueil": "Home page",
    "Page simulée": "Simulated page",
    "Pas encore dans Scout": "Not in Scout yet",
    "Pays :": "Country:",
    "Pompiers / SDIS / Sécurité civile": "Fire services / Civil protection",
    "Période": "Period",
    "Protégé par mot de passe — demandé au premier export par session.": "Password protected, asked at the first export of each session.",
    "Rattachés à un compte": "Linked to an account",
    "Rechercher contact, fabricant, produit, contrat...": "Search contact, manufacturer, product, contract...",
    "Rechercher un contact (nom, titre, fabricant)...": "Search a contact (name, title, manufacturer)...",
    "Rechercher un fabricant...": "Search a manufacturer...",
    "Rechercher un système...": "Search a system...",
    "Renouveler — afficher d'autres insights": "Refresh, show other insights",
    "Reset — repartir des insights initiaux": "Reset to initial insights",
    "Rien à traiter pour l'instant — aucun lead qualifié en attente.": "Nothing to review for now: no qualified lead waiting.",
    "Réglages et installation du snippet": "Settings and snippet install",
    "Réglages et snippet": "Settings and snippet",
    "Segment métier": "Business segment",
    "Société": "Company",
    "Sous-onglet par défaut dans Comptes": "Default sub-tab in Accounts",
    "Stock à contacter": "Stock to contact",
    "Systèmes": "Systems",
    "Tâche terminée": "Task completed",
    "Toutes les pages": "All pages",
    "Visiteurs non identifiables": "Unidentifiable visitors",
    "Votre nom ou équipe": "Your name or team",
    "Vérifié": "Verified",
    "Zone géographique": "Region",
    "aucune alerte en attente": "no pending alert",
    "clé Anthropic absente côté serveur": "Anthropic key missing on the server",
    "conversations réelles": "real conversations",
    "toute la base": "whole database",
    "À propos": "About",
    "À préciser": "To be specified",
    "À relancer aujourd'hui": "To follow up today",
    "à traiter (qualifiées, pas dans Scout)": "to review (qualified, not in Scout)",
    "↻ Rafraîchir": "↻ Refresh",
    "Rafraîchir": "Refresh",
    "⏳ Non contactés": "⏳ Not contacted",
    "Non contactés": "Not contacted",
    "Contactés": "Contacted",
    "⚡ Top opportunités live": "⚡ Top live opportunities",
    "✈ Aérien": "✈ Air",
    "✓ Qualifiées": "✓ Qualified",
    "✓ Vrais comptes (identifiés)": "✓ Real accounts (identified)",
    "⬇️ Exporter CSV": "⬇️ Export CSV",
    "🇺🇸 État US": "🇺🇸 US state",
    "🌍 Tous les pays": "🌍 All countries",
    "🎖️ Comptes clés": "🎖️ Key accounts",
    "🎯 Comptes ABM": "🎯 ABM accounts",
    "Les comptes": "Accounts",
    "Les sociétés": "Companies",
    "Leurs contacts": "Their contacts",
    "📡 FAI / opérateurs": "📡 ISPs / carriers",
    "📤 Tous les contacts avec email": "📤 All contacts with email",
    "📨 Outreach (tous)": "📨 Outreach (all)",
    "🔍 À valider": "🔍 To validate",
    "🗂️ Contacts importés à valider": "🗂️ Imported contacts to validate",
    "dernière visite": "last visit",
    "tout est rattaché": "all linked",
    "à créer en un clic depuis la fiche": "create in one click from the record",
    "{n} derniers jours": "last {n} days",
    "{n} derniers mois": "last {n} months",
    "{n} intéressés à transmettre": "{n} interested to hand over",
    "{n} lead(s) de chat à traiter": "{n} chat lead(s) to review",
    "{n} élément(s) à traiter": "{n} item(s) to review",
    "{n} étoile(s)": "{n} star(s)",
    "{n} pages vues sur elistair.com ({n} j)": "{n} page views on elistair.com ({n} d)",
    "{n} prochains jours": "next {n} days",
    "{n} semaine": "{n} week",
    "{n} semaines": "{n} weeks",
    "moy. {n}/jour ({n}j)": "avg {n}/day ({n}d)",
    "{n} contacts prêts à prospecter": "{n} contacts ready to prospect",
    "sur {n} visiteur au total": "out of {n} visitors in total",
    "sur {n} visiteurs au total": "out of {n} visitors in total",
    "{n}% des {n} contacts": "{n}% of {n} contacts",
    "{n}% des emails de l'équipe ({n}j)": "{n}% of team emails ({n}d)",
    "Total cumulé des emails envoyés depuis le début": "Cumulative emails sent since the start",
    "Exporte un CSV pré-formaté pour LinkedIn Campaign Manager →": "Export a CSV formatted for LinkedIn Campaign Manager →",
    "Assistant automatique. Les informations que vous donnez sont transmises à l'équipe Elistair.": "Automated assistant. The information you share is passed on to the Elistair team.",
    "Uniquement ce que le visiteur a dit explicitement. Le score est calculé côté serveur, pas par l'IA.": "Only what the visitor said explicitly. The score is computed by the server, not by the AI.",
    "Équipement / concurrent connu (best-effort)": "Equipment / known competitor (best effort)",
    "ex : ne parle jamais de la Ligh-T aux visiteurs défense": "e.g. never mention the Ligh-T to defence visitors",
    "Filtre par statut d'outreach (au moins un email/téléphone/in-person envoyé)": "Filter by outreach status (at least one email/phone/in-person sent)",
    "Filtre par statut d'outreach (au moins un email/téléphone/in-person envoyé sur l'un des contacts du compte)": "Filter by outreach status (at least one email/phone/in-person sent to one of the account's contacts)",
    "Filtrer les contacts US par état (déduit du nom d'organisation et des notes)": "Filter US contacts by state (inferred from organisation name and notes)",
    "Bascule sur « Toutes » pour voir l'ensemble des échanges, ou passe en « Bac à sable » pour essayer le bot.": "Switch to \"All\" to see every conversation, or to \"Sandbox\" to try the bot.",
    "— un contact emailé depuis ce délai, sans réponse, apparaît dans « Relances dues » (une seule relance)": "a contact emailed this long ago without reply shows up in \"Due follow-ups\" (one follow-up only)",
    "À poser sur elistair.com, via GTM ou WPCode, comme le snippet de suivi :": "Add to elistair.com, via GTM or WPCode, like the tracking snippet:",
    "Fait": "Done",
    "fait": "done",
    "par": "by",
    "Opérateur": "Operator",
    "Inspection": "Inspection",
    "Inspection intérieure": "Indoor inspection",
    "Inspection aéronefs": "Aircraft inspection",
    "Connectivité": "Connectivity",
    "Cinéma": "Cinema",
    "Corée": "Korea",
    "Chine": "China",
    "Taux de match LinkedIn typique : {n}-{n}% selon la qualité des emails pros. Min {n} contacts pour activer une audience.": "Typical LinkedIn match rate: {n}-{n}% depending on work email quality. Min {n} contacts to activate an audience.",
    "Voir le compte": "See account",
    "Retour": "Back",
    "Saisi dans Dynamics": "Entered in Dynamics",
    "Saisi dans Dynamics ✓": "Entered in Dynamics ✓",
    "✓ Saisi dans Dynamics": "✓ Entered in Dynamics",
    "Dans Dynamics": "In Dynamics",
    "dans Dynamics": "in Dynamics",
    "saisis dans Dynamics": "entered in Dynamics",
    "Copier la fiche": "Copy details",
    "À qualifier puis saisir dans Dynamics": "To qualify, then enter in Dynamics",
    "réponse positive à saisir dans Dynamics": "positive reply to enter in Dynamics",
    "réponses positives à saisir dans Dynamics": "positive replies to enter in Dynamics",
    "Marqué comme saisi dans Dynamics": "Marked as entered in Dynamics",
    "Fiche copiée : colle-la dans Dynamics": "Details copied: paste them into Dynamics",
    "Ont répondu, à saisir dans Dynamics": "Replied, to enter in Dynamics",
    "✅ Ont répondu, à saisir dans Dynamics": "✅ Replied, to enter in Dynamics",
    "{n} intéressés à saisir dans Dynamics": "{n} interested to enter in Dynamics",
    "{n} intéressé à saisir dans Dynamics": "{n} interested to enter in Dynamics",
    "Copie la fiche :": "Copy the details:",
    "Une fois le contact créé dans Dynamics. Scout n’envoie rien à Dynamics.": "Once the contact is created in Dynamics. Scout sends nothing to Dynamics.",
    "Copie nom, titre, organisation, pays, email et LinkedIn pour les coller dans Dynamics": "Copies name, title, organisation, country, email and LinkedIn to paste into Dynamics",
    "Ouvrir le compte": "Open account",
    "Ancienne fiche": "Old record",
    "Prospection": "Prospecting",
    "Qui contacter maintenant, et pourquoi.": "Who to contact now, and why.",
    "Mes comptes": "My accounts",
    "Tous les comptes": "All accounts",
    "Scout choisit le meilleur contact à travailler dans tes segments : décideur vérifié, compte prioritaire, jamais contacté. Tu écris, Scout note et planifie la relance.": "Scout picks the best contact to work in your segments: verified decision-maker, priority account, never contacted. You write, Scout logs it and schedules the follow-up.",
    "Démarrer ›": "Start ›",
    "contacts prêts à prospecter": "contacts ready to prospect",
    "Mes segments": "My segments",
    "emails envoyés (7 j)": "emails sent (7 d)",
    "relances dues": "follow-ups due",
    "réponses positives à saisir dans Dynamics": "positive replies to enter in Dynamics",
    "Comptes chauds": "Hot accounts",
    // ── Signaux marché
    'Marchés': 'Markets', 'Actions proposées': 'Suggested actions', 'Concurrents': 'Competitors', 'Bibliothèque': 'Library',
    'appels d’offres, contrats des concurrents, achats déclencheurs, notés 5 sur 8 et plus': 'tenders, competitor contracts, trigger purchases, scored 5 out of 8 and above',
    'Marchés →': 'Markets →', 'Go': 'Go', 'No-go': 'No-go', 'Accepter': 'Accept', 'Pas pertinent': 'Not relevant', 'Relier à un compte': 'Link to an account',
    'Appel d’offres': 'Tender', 'Avis amont': 'Early notice', 'Achat déclencheur': 'Trigger purchase', 'Concurrent': 'Competitor',
    'Sans compte : à relier (tri admin)': 'No account: to link (admin triage)', 'sans commercial': 'no owner',
    'Pourquoi no-go ?': 'Why no-go?', 'Pourquoi pas pertinent ?': 'Why not relevant?', 'Hors produit': 'Off product', 'Hors zone': 'Off territory', 'Trop petit': 'Too small', 'Déjà connu': 'Already known', 'Autre': 'Other',
    'Go : tâche créée dans À faire': 'Go: task added to To do', 'Action acceptée : tâche créée dans À faire': 'Action accepted: task added to To do', 'No-go enregistré': 'No-go saved', 'Écarté, merci pour le retour': 'Dismissed, thanks for the feedback',
    'Relier à quel compte ?': 'Link to which account?', 'Voir ↓': 'See ↓',
    'Go / no-go sur l’AO': 'Go / no-go on the tender', 'Contacter l’acheteur : retour d’expérience, prochaine tranche, interopérabilité': 'Contact the buyer: feedback, next tranche, interoperability',
    'Proposer une intégration de station sur le porteur': 'Propose a station integration on the platform', 'Proposer SAFE-T pour rendre la flotte persistante': 'Propose SAFE-T to make the fleet persistent', 'Présenter la surveillance persistante Elistair': 'Present Elistair persistent surveillance',
    'Consultation. Les actions à mener arrivent dans Prospection.': 'Read-only. Actions to take show up in Prospecting.',
    'Contrats, commandes et distributeurs des concurrents filaires, avec acheteur nommé. Les levées de fonds et lancements de produit n’y figurent pas.': 'Contracts, orders and resellers of tethered competitors, with a named buyer. Funding rounds and product launches are not listed.',
    'Rien en base pour l’instant.': 'Nothing in the database yet.', 'Toutes les notes': 'All scores', '3 et plus': '3 and above', '5 et plus': '5 and above', 'Tout': 'All', 'Appels d’offres': 'Tenders', 'Contrats': 'Contracts',
    'Rechercher un titre, un acheteur, un pays, un fournisseur…': 'Search a title, buyer, country, supplier…', 'Aucun résultat.': 'No results.',
    'Seuls les marchés notés 3 sur 8 et plus s’affichent ici. Rattachés par le nom de l’acheteur.': 'Only market items scored 3 out of 8 and above show here. Linked by buyer name.',
    'Aucune action proposée pour le moment.': 'No suggested action for now.', 'Aucune action proposée sur tes comptes pour le moment.': 'No suggested action on your accounts for now.',
    'Note sur 8 : produit, moment, compte, taille': 'Score out of 8: product, timing, account, size', 'marché récent': 'recent market item',
    "ils bougent : visites du site, chat, appels d’offres, échanges récents": "they are moving: site visits, chat, tenders, recent exchanges",
    "Tous →": "All →",
    "Aucun compte chaud pour le moment.": "No hot account for now.",
    "Comptes à ouvrir": "Accounts to open",
    "jamais contactés, les plus prioritaires d’abord": "never contacted, highest priority first",
    "Tous les comptes avec contacts ont déjà été travaillés.": "All accounts with contacts have already been worked.",
    "VIP à contacter": "VIPs to contact",
    "contacts 3 étoiles jamais approchés": "3-star contacts never approached",
    "Aucun VIP en attente. Mets 3 étoiles à un contact clé pour le retrouver ici.": "No VIP waiting. Give a key contact 3 stars to find them here.",
    "chat sur le site": "chat on the site",
    "appel d’offres récent": "recent tender",
    "Prochaine action, comptes chauds, comptes à ouvrir, VIP": "Next action, hot accounts, accounts to open, VIPs",
    "Comptes et contacts : fiches, comité d'achat, historique": "Accounts and contacts: records, buying committee, history",
    "activité": "activity",
    "{n} pages vues,": "{n} page views,",
    "{n} page vues,": "{n} page view,",
    "contacts prêts à prospecter ·": "contacts ready to prospect ·",
    // ── Pays et secteurs (données)
    "Pologne": "Poland",
    "Belgique": "Belgium",
    "Suède": "Sweden",
    "Militaire": "Military",
    "Civil": "Civil",
    "Autre": "Other",
    "Autres": "Others",
    "Signe ou arbitre : chef de service, commandant, directeur": "Signs or decides: head of unit, commander, director",
    "ex. sdis69.fr": "e.g. sdis69.fr",
    "Tier ABM": "ABM tier",
    "Créer une relance": "Create a follow-up",
    "Fusion :": "Merge:",
    "Inconnu": "Unknown",
    "Inconnue": "Unknown",
    "Pompier": "Fire service",
    "Douane": "Customs",
    'Allemagne': 'Germany', 'Autriche': 'Austria', 'Belgique': 'Belgium', 'Brésil': 'Brazil', 'Chine': 'China', 'Chypre': 'Cyprus', 'Corée du Sud': 'South Korea', 'Danemark': 'Denmark',
    'Espagne': 'Spain', 'Estonie': 'Estonia', 'États-Unis': 'United States', 'Finlande': 'Finland', 'Grèce': 'Greece', 'Inde': 'India', 'Irlande': 'Ireland', 'Israël': 'Israel', 'Italie': 'Italy',
    'Japon': 'Japan', 'Lettonie': 'Latvia', 'Lituanie': 'Lithuania', 'Norvège': 'Norway', 'Nouvelle-Zélande': 'New Zealand', 'Pays-Bas': 'Netherlands', 'Pologne': 'Poland', 'Roumanie': 'Romania',
    'Royaume-Uni': 'United Kingdom', 'Russie': 'Russia', 'Slovénie': 'Slovenia', 'Suède': 'Sweden', 'Suisse': 'Switzerland', 'Turquie': 'Turkey', 'Tchéquie': 'Czechia', 'Afrique du Sud': 'South Africa',
    'Australie': 'Australia', 'Mexique': 'Mexico', 'Pérou': 'Peru', 'Chili': 'Chile', 'Colombie': 'Colombia', 'Argentine': 'Argentina', 'Égypte': 'Egypt', 'Maroc': 'Morocco', 'Arabie saoudite': 'Saudi Arabia',
    'Émirats arabes unis': 'United Arab Emirates', 'Singapour': 'Singapore', 'Hongrie': 'Hungary', 'Croatie': 'Croatia', 'Serbie': 'Serbia', 'Bulgarie': 'Bulgaria', 'Luxembourg': 'Luxembourg', 'Portugal': 'Portugal',
    'Europe': 'Europe', 'Amérique du Nord': 'North America', 'Amérique latine': 'Latin America', 'Océanie': 'Oceania', 'Asie': 'Asia', 'Afrique': 'Africa', 'Moyen-Orient': 'Middle East',
    'Police': 'Police', 'Pompiers': 'Fire services', 'Gendarmerie': 'Gendarmerie', 'Douanes': 'Customs', 'Garde-côtes': 'Coast guard', 'Sécurité civile': 'Civil protection', 'Armée de terre': 'Army',
    'Défense': 'Defence', 'Sécurité': 'Security', 'Sécurité publique': 'Public safety', 'Médical': 'Medical', 'Agriculture': 'Agriculture', 'Gouvernement': 'Government', 'Opérationnel': 'Operational',
    // ── Mois / jours
    'janv.': 'Jan', 'févr.': 'Feb', 'mars': 'Mar', 'avr.': 'Apr', 'mai': 'May', 'juin': 'Jun', 'juil.': 'Jul', 'août': 'Aug', 'sept.': 'Sep', 'oct.': 'Oct', 'nov.': 'Nov', 'déc.': 'Dec'
  };

  var MONTHS = { 'janvier': 'January', 'février': 'February', 'mars': 'March', 'avril': 'April', 'mai': 'May', 'juin': 'June', 'juillet': 'July', 'août': 'August', 'septembre': 'September', 'octobre': 'October', 'novembre': 'November', 'décembre': 'December',
    'janv.': 'Jan', 'févr.': 'Feb', 'avr.': 'Apr', 'juil.': 'Jul', 'sept.': 'Sep', 'oct.': 'Oct', 'nov.': 'Nov', 'déc.': 'Dec' };
  var DAYS = { 'lundi': 'Monday', 'mardi': 'Tuesday', 'mercredi': 'Wednesday', 'jeudi': 'Thursday', 'vendredi': 'Friday', 'samedi': 'Saturday', 'dimanche': 'Sunday' };
  var monthRe = '(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|janv\\.|févr\\.|avr\\.|juil\\.|sept\\.|oct\\.|nov\\.|déc\\.)';

  // Motifs (après remplacement des nombres par {n})
  var PATTERNS = [
    [/^il y a \{n\} ?min$/i, '{n} min ago'], [/^il y a \{n\} ?h$/i, '{n} h ago'], [/^il y a \{n\} ?j$/i, '{n} d ago'], [/^il y a \{n\} mois$/, '{n} mo ago'], [/^il y a \{n\} ans?$/, '{n} y ago'],
    [/^dans \{n\} ?j$/i, 'in {n} d'], [/^à l’instant$|^à l'instant$/, 'just now'],
    [/^(.+?)( · | )il y a (\{n\} ?(?:min|h|j|mois))$/, function (m) { return tr(m[1]) + m[2] + tr('il y a ' + m[3]); }],
    [/^Appel d’offres rattaché : (.+)$/, function (m) { return 'Tender linked: ' + m[1]; }],
    [/^En retard · (.+)$/, function (m) { return 'Overdue · ' + tr(m[1]); }],
    [/^rien depuis (.+)$/, function (m) { return 'nothing for ' + tr(m[1]).replace(/ ago$/, ''); }],
    [/^Manque : (.+)$/, function (m) { return 'Missing: ' + m[1].split(', ').map(function (x) { return lower(tr(cap(x))); }).join(', '); }],
    [/^Comité d’achat : (.+)$/, function (m) { return 'Buying committee: ' + m[1].replace(/manquant/g, 'missing').split(', ').map(function (x) { var p = x.split(' '); return tr(p[0]) + ' ' + p.slice(1).join(' '); }).join(', '); }],
    [/^Terminer : (.+)$/, function (m) { return 'Complete: ' + tr(m[1]); }], [/^Relance (\{n\}) : (.+)$/, function (m) { return 'Follow-up ' + m[1] + ': ' + m[2]; }],
    [/^Réponse positive : (.+)$/, function (m) { return 'Positive reply: ' + m[1]; }], [/^Rattaché à (.+)$/, function (m) { return 'Linked to ' + m[1]; }],
    [/^Retirer le rattachement à (.+)$/, function (m) { return 'Remove link to ' + m[1]; }], [/^Sélectionner (.+)$/, function (m) { return 'Select ' + m[1]; }],
    [/^Semaine du (.+) : (\{n\}) emails?, (\{n\}) réponses? positives?, (\{n\}) (?:transmis|saisis dans Dynamics)$/, function (m) { return 'Week of ' + tr(m[1]) + ': ' + m[2] + ' emails, ' + m[3] + ' positive replies, ' + m[4] + ' entered in Dynamics'; }],
    [/^Propriétaire : (.+)$/, function (m) { return 'Owner: ' + m[1]; }], [/^Pris en main par (.+)$/, function (m) { return 'Handled by ' + m[1]; }],
[/^Bonjour (.+)$/, function (m) { return 'Hello ' + m[1]; }],
    [/^Erreur : (.+)$/, function (m) { return 'Error: ' + tr(m[1]); }], [/^Nettoyage : \{n\} secteurs et \{n\} noms corrigés$/, 'Cleaning: {n} sectors and {n} names fixed'],
    [/^Fusionner \{n\} doublons? dans « (.+) » \?(.*)$/, function (m) { return 'Merge into "' + m[1] + '"? Contacts, tasks, notes and tenders will be moved. The duplicate is hidden, nothing is deleted.'; }],
    [/^([^()]+) \((\{n\})\)$/, function (m) { var l = core(m[1]); return l != null ? l + ' (' + m[2] + ')' : null; }],
    [/^Contacté par (.+) le (.+) · (.+)$/, function (m) { return 'Contacted by ' + m[1] + ' on ' + m[2] + ' · ' + tr(m[3]); }],
    [/^fait il y a (.+) par (.+)$/, function (m) { return 'done ' + tr('il y a ' + m[1]) + ' by ' + m[2]; }],
    [/^Voir le compte : (.+)$/, function (m) { return 'See account: ' + m[1]; }],
    [/^(.+) \/ (.+)$/, function (m) { var a = tr(m[1]), b = tr(m[2]); return (a !== m[1] || b !== m[2]) ? a + ' / ' + b : null; }],
    [/^est un compte Scout(.*)$/, function (m) { return 'is a Scout account' + m[1]; }],
    [/^(\{n\}) pages? vues(?:, (.+))?$/, function (m) { return m[1] + ' page views' + (m[2] ? ', ' + tr(m[2]) : ''); }],
    [/^activité (.+)$/, function (m) { return 'activity ' + tr(m[1]); }],
    [/^Voir les doublons \(\{n\}\)$/, 'See duplicates ({n})'], [/^\+ \{n\} autres dans la file$/, '+ {n} more in the queue'],
    [/^(\{n\}) à relancer(.*)$/, function (m) { return m[1] + ' to follow up' + m[2].replace(' dont ', ' including ').replace(' en retard', ' overdue').replace(' j de retard', ' d overdue'); }]
  ];

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function lower(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  var NUMSRC = '\\d+(?:[.,\\u202f\\u00a0 ]\\d{3})*(?:[.,]\\d+)?';
  var NUM = /\d+(?:[.,   ]\d{3})*(?:[.,]\d+)?/g;
  function fill(tpl, nums) { var i = 0; return tpl.replace(/\{n\}/g, function () { return nums[i++] != null ? nums[i - 1] : ''; }); }
  function core(t) {
    if (Object.prototype.hasOwnProperty.call(D, t)) return D[t];
    var nums = [];
    var tpl = t.replace(NUM, function (x) { nums.push(x); return '{n}'; });
    if (nums.length && Object.prototype.hasOwnProperty.call(D, tpl)) return fill(D[tpl], nums);
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = tpl.match(PATTERNS[i][0]);
      if (m) {
        var out = PATTERNS[i][1];
        if (typeof out !== 'function') return fill(out, nums);
        var re2 = PATTERNS[i][2] || (PATTERNS[i][2] = new RegExp(PATTERNS[i][0].source.replace(/\\\{n\\\}/g, NUMSRC), PATTERNS[i][0].flags));
        var m2 = t.match(re2); if (m2) { var r2 = out(m2); if (r2 != null) return r2; }
      }
    }
    // Dates : « mardi 27 octobre », « 27 oct. », « 27 octobre 2026 »
    var dm = t.match(new RegExp('^(?:(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) )?(\\d{1,2}) ' + monthRe + '(?: (\\d{4}))?$', 'i'));
    if (dm) return (dm[1] ? DAYS[dm[1].toLowerCase()] + ', ' : '') + MONTHS[dm[3].toLowerCase()] + ' ' + dm[2] + (dm[4] ? ', ' + dm[4] : '');
    return null;
  }
  var SEPS = [' · ', ' — ', ' • ', ' › ', ' | '];
  function tr(t) {
    if (!t) return t;
    var r = core(t); if (r != null) return r;
    // Préfixes / suffixes non textuels (emoji, flèches, ponctuation)
    var pm = t.match(/^([^A-Za-zÀ-ÿ0-9«"(]*)(.+?)([\s→↗…:!?.]*)$/);
    if (pm && (pm[1] || pm[3])) { var c = core(pm[2].trim()); if (c != null) return pm[1] + c + pm[3].replace(/^[\s\u00a0\u202f]+(?=[?!:])/, ''); }
    var sm = t.match(/^(.+?)([\s→↗…]+)$/); if (sm) { var c2 = core(sm[1]); if (c2 != null) return c2 + sm[2]; }
    for (var i = 0; i < SEPS.length; i++) {
      if (t.indexOf(SEPS[i]) > 0) {
        var parts = t.split(SEPS[i]), any = false;
        var out = parts.map(function (p) { var x = tr(p.trim()); if (x !== p.trim()) any = true; return x; });
        if (any) return out.join(SEPS[i]);
      }
    }
    // « Libellé : valeur »
    var cm = t.match(/^([^:]{2,40}) : (.+)$/);
    if (cm) { var l = core(cm[1]); if (l != null) return l + ': ' + tr(cm[2]); }
    return t;
  }
  window.scoutT = function (s) { return lang === 'en' ? tr(String(s)) : s; };
  if (lang !== 'en') return;

  // ── Application au DOM
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1, NOSCRIPT: 1 };
  var done = new WeakMap();
  function doText(n) {
    var p = n.parentElement; if (!p || SKIP[p.tagName] || p.closest('[contenteditable="true"],.no-i18n,[data-no-i18n]')) return;
    var v = n.nodeValue; if (!v || !/[A-Za-zÀ-ÿ]/.test(v)) return;
    if (done.get(n) === v) return;
    var lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0], t = v.trim().replace(/\s+/g, ' ');
    var o = tr(t);
    var nv = o !== t ? lead + o + trail : v;
    done.set(n, nv);
    if (nv !== v) n.nodeValue = nv;
  }
  var ATTRS = ['placeholder', 'title', 'aria-label'];
  function doEl(el) {
    if (el.closest && el.closest('.no-i18n,[data-no-i18n]')) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute && el.getAttribute(a);
      if (v && /[A-Za-zÀ-ÿ]/.test(v)) { var o = tr(v.trim()); if (o !== v.trim()) el.setAttribute(a, o); }
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    doEl(root);
    if (SKIP[root.tagName]) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    var n; while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doEl(n); }
  }
  var queued = [], scheduled = false;
  function flush() { scheduled = false; var q = queued; queued = []; for (var i = 0; i < q.length; i++) walk(q[i]); }
  function queue(n) { queued.push(n); if (!scheduled) { scheduled = true; (window.requestAnimationFrame || setTimeout)(flush); } }
  var mo = new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.type === 'childList') { for (var j = 0; j < m.addedNodes.length; j++) queue(m.addedNodes[j]); }
      else if (m.type === 'characterData') queue(m.target);
      else if (m.type === 'attributes' && ATTRS.indexOf(m.attributeName) >= 0) queue(m.target);
    }
  });
  function start() {
    walk(document.body);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    if (document.title) document.title = tr(document.title);
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  // Boîtes de dialogue natives
  var A = window.alert, C = window.confirm, P = window.prompt;
  window.alert = function (m) { return A.call(window, tr(String(m == null ? '' : m))); };
  window.confirm = function (m) { return C.call(window, tr(String(m == null ? '' : m))); };
  window.prompt = function (m, d) { return P.call(window, tr(String(m == null ? '' : m)), d); };
})();
