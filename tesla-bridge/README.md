# Passerelle Tesla — prototype 0.1

Application Android expérimentale pour afficher Android Auto dans le navigateur Tesla. Adaptation de [WheelPlay](https://github.com/fython/wheelplay/tree/7a82bcb15651c29af755cdab949822aa75956f3f), et non application officielle Tesla, Google ou Taada.

## État réel

Ce dépôt contient une surcouche et une recette de compilation reproductible : le moteur WheelPlay est téléchargé au commit figé dans upstream.json. L'accueil et le guide ajoutés sont en français ; les réglages du moteur restent en anglais. Les fonctions de projection, de tactile, de réseau et d'audio proviennent de WheelPlay. La compatibilité physique n'est pas encore validée.

Cible d'essai communiquée : Samsung S24 Ultra, Android 17 / One UI 9.0 ; Model 3 Long Range, logiciel 2026.38.3.2. Aucune donnée d'identification du véhicule n'est nécessaire.

## Télécharger

Le workflow publie aussi une préversion dans [Releases](https://github.com/E-LePrettre/E-LePrettre.github.io/releases) avec APK et sources téléchargeables directement. Sinon, ouvrir Actions → « Passerelle Tesla APK » → dernière exécution réussie de la branche tesla-bridge-prototype → artifact passerelle-tesla-prototype. Extraire le ZIP puis installer Passerelle-Tesla-0.1-debug.apk sur le Samsung. GitHub peut demander une connexion. C'est une version de développement, sans distribution Play Store.

## Premier essai, voiture stationnée

1. Vérifier que Waze et Deezer sont installés et fonctionnent sur le téléphone. Leurs comptes et abonnements restent gérés dans leurs applications.
2. Ouvrir Passerelle Tesla, puis « Réglages Android Auto ». Finir la configuration initiale d'Android Auto. Dans ses réglages, appuyer plusieurs fois sur la version pour activer le mode développeur, puis menu → Start head unit server / Démarrer le serveur de l'unité principale. Les intitulés peuvent varier. Refaire après redémarrage si nécessaire.
3. Activer le partage de connexion Wi-Fi Samsung. Connecter la Tesla à ce réseau ; sélectionner le Samsung comme source audio Bluetooth.
4. Ouvrir le moteur, démarrer le service Web si nécessaire ; Input sources → Android Auto → connexion locale / same-phone. Ne pas choisir CarPlay : aucun certificat CarPlay n'est requis pour ce parcours.
5. Ouvrir l'adresse locale réellement indiquée dans l'application dans le navigateur Tesla. Terminer l'appairage par code ou QR, puis démarrer l'affichage.
6. Si le navigateur refuse l'adresse privée : Settings → Tesla compatibility → No-root VPN (experimental). Autoriser uniquement si tu souhaites tester ce mode, puis reprendre l'adresse complète indiquée. Ne pas activer le mode Root. Ce mode VPN est expérimental et peut entrer en conflit avec un autre VPN ; il n'est pas activé automatiquement par notre surcouche.
7. Tester successivement image Android Auto, tactile, Waze puis Deezer et guidage vocal, toujours à l'arrêt. Le son Android Auto est joué sur le Samsung par le moteur ; son acheminement Bluetooth vers la Tesla doit être vérifié. Le son AA dans le navigateur n'est pas implémenté par cette base.
8. Arrêter la session et le service Web depuis le moteur après l'essai ; désactiver le mode VPN d'essai et le hotspot si utilisés.

## Limites à vérifier

La base documente Android Auto comme expérimental, avec une connexion locale au Head Unit Server, 1280×720 à 30 fps et tactile. Elle ne promet pas la compatibilité Android 17, le fonctionnement sur cette version Tesla, les appels, le micro, une reconnexion automatique ou la disponibilité du navigateur en roulant. Aucun contournement d'un verrouillage en conduite n'est ajouté. Les réglages et essais se font stationné.

Le service doit rester sur un réseau de confiance. Ne pas ouvrir de port Internet. Le mode HTTP local n'est pas chiffré. L'appairage est fourni par le moteur. La surcouche n'ajoute aucune télémétrie ni aucun compte serveur.

## Compilation et sources

Le workflow télécharge le commit exact, applique scripts/prepare.py, lance les tests du moteur, le lint et la compilation. L'artifact inclut l'APK, sa somme SHA-256, le guide et les sources exactes modifiées, licences comprises. Les sources complètes sont fournies sous les licences originales, dont GPL-3.0 ; notre surcouche est également GPL-3.0. Pas de clé de signature privée de production dans ce dépôt. La signature debug peut varier entre machines de compilation : une mise à jour peut nécessiter une désinstallation (perte des réglages).

Le résultat de compilation n'est pas une validation sur véhicule. Pour rapporter un essai : indiquer l'étape, le message d'erreur, la version Android Auto et si l'adresse s'ouvre depuis un autre appareil sur le hotspot. Ne pas partager de mot de passe, de VIN ou de données de compte.
