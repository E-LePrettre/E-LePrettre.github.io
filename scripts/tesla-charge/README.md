# Tesla Charge — version 2.8

Application existante publiée sous `/tesla-charge/` par `scripts/replicate.py`.

## Reclassement

Dans « Hors maison », choisir « Reclasser à domicile » sur la recharge Autre existante. Le même identifiant et les mêmes kWh sont conservés ; aucune ligne n'est ajoutée. Le classement Tesla original est conservé dans `teslaLocation`. Vérifier la couleur, sélectionner « Entièrement HC confirmé », puis enregistrer pour conserver l'estimation. Ne pas créer une deuxième recharge pour les mêmes 14 kWh.

Le relevé cumulé Tesla est indépendant du carnet. Les 85 kWh ne sont pas injectés dans l'historique et aucun écart entre relevé et sessions arrondies n'est comblé automatiquement.

## Calcul

En mode entièrement HC, la répartition est kWh HC = énergie ajoutée et kWh HP = 0. Dates et heures sont facultatives. La couleur doit être confirmée. Coût estimé = énergie × tarif HC de cette couleur × coefficient de pertes. Le coefficient vaut 1 par défaut (aucune perte ajoutée) ; 1,10 signifie une majoration de 10 %, pas un rendement de 90 %. Une énergie mesurée à la prise exige le coefficient 1 pour éviter un double comptage.

Aucun tarif n'est codé en dur. La source, la date d'effet et le coefficient accompagnent l'estimation. Sans date de recharge, la grille configurée est utilisée avec une mention explicite de validité historique à confirmer. Avec une date antérieure à la grille, le calcul est refusé. Aucun montant individuel ou cumulé Tesla n'est nécessaire.

Les coûts existants sont conservés lors de l'aperçu automatique. Le bouton « Estimer » permet un remplacement explicite ; la sauvegarde du formulaire reste nécessaire. Les autres lignes ne sont pas recalculées.

## Carnet central privé

Google Sheets conserve le carnet partagé dans l’onglet `TeslaChargeSync`. Les anciennes feuilles restent intactes. Le journal A:D conserve les objets JSON et toutes leurs révisions ; E:I contient le miroir de l’import initial, sans recalcul des valeurs historiques. Ne pas modifier directement le journal technique.

Dans Sauvegarde & réglages, connecter le compte propriétaire puis sélectionner « Suivi des recharges Tesla ». OAuth utilise uniquement `drive.file`, pour le fichier sélectionné. Les jetons restent en mémoire et expirent ; reconnecter Google lorsque demandé. Les identifiants client et la clé Picker du navigateur sont publics, restreints dans Google Cloud ; aucun secret OAuth ne doit être ajouté au site.

Le cache local `tesla-charge-sync-v1` contient les saisies hors connexion et les identifiants de réessai persistants. L’envoi est confirmé par une relecture du journal. Les opérations sont dédupliquées ; les changements concurrents d’une même recharge demandent un choix explicite, sans effacer les anciennes versions. Deux onglets utilisent le même verrou navigateur. Ne pas vider les données du navigateur avant synchronisation et export des archives.

La première connexion fusionne les ajouts distincts et bloque les valeurs divergentes. Le choix du carnet central conserve auparavant une archive intégrale du carnet local, exportable dans les réglages. Aucun effacement ni injection automatique de recharge au démarrage. Le grand tableau somme uniquement les sessions : le relevé Tesla reste indépendant.

## Stockage et compatibilité

La clé `tesla-charge-v1`, l'origine et le périmètre PWA restent identiques. Avant lecture, le stockage existant est copié une fois, à l'identique, dans `tesla-charge-before-v23`. Un échec de sauvegarde préalable bloque les écritures. Aucune réécriture au démarrage d'un stockage existant. Les versions 1 et 2 restent lisibles ; la migration ne fabrique plus d'horaires pour les anciens enregistrements. Les exports CSV précédents restent acceptés. Le JSON complet conserve également les détails des estimations. CSV conserve le montant, le coefficient et la catégorie Tesla originale, mais pas les détails de la grille.

Sur Samsung, rouvrir l'application en ligne et vérifier le pied de page « Version 2.8 · Google Sheets ». Fermer puis rouvrir si l'ancienne version reste affichée. Ne pas effacer les données du navigateur ni désinstaller pour forcer la mise à jour. Connecter le même compte et sélectionner le même classeur sur chaque appareil. Le cache reste disponible sans connexion ; les envois exigent une autorisation Google valide.

## Validation

Depuis ce dossier : `node --test tests/*.test.js` (Node 20+). Les tests couvrent Tempo, pertes, centimes, conflits, caches indépendants, échec de stockage, expiration et réessai après écriture sans confirmation. Les tests réels OAuth utilisent une copie privée séparée du classeur. Un aperçu de 390 px vérifie le format mobile ; il ne remplace pas un essai matériel Samsung Android.
Les tarifs numériques des tests sont uniquement des fixtures synthétiques, jamais la grille de production.
