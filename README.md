# Tableau de bord de ses relevés scolaires
Utilise l'API K-D'Ecole pour récupérer ses notes et les transformer en graphiques.

## Installation
1. Installer docker et docker-compose
1. Lancer `docker volume create mariadb-storage` et `docker volume create grafana-storage`
1. Cloner le projet
1. Modifier le fichier docker-compose.yml en remplaçant VOTRE_TOKEN par votre jeton d'identification K-D'Ecole
1. Lancer la commande `docker-compose up --build -d`
1. Se rendre dans son navigateur à l'adresse http://localhost:3000/
1. Se connecter (par défaut, le nom d'utilisateur et le mot de passe sont `admin`) puis changez votre mot de passe
1. Créez votre tableau de bord

### Obtenir son jeton d'authentification  K-D'Ecole 
* Installer NodeJs
* Exécuter la commande ```npm -i kdecole-api```
* Créer un fichier nommé index.js dans un répertoire quelconque
* Ajouter les lignes suivantes au fichier
```js
const Kdecole = require('kdecole-api').default
Kdecole.login("identifiant_mbn", "code_d'activation_mobile").then(token => console.log(token))
```
* Exécuter ```node .``` dans le même répertoire
* Récupérer le jeton

### Créer son tableau de bord
Avant de créer votre premier tableau de bord, il vous faudra ajouter une source de données.  
Pour se faire, rendez-vous dans les paramètres et cliquez sur **Data Sources**.  
Ajoutez une source de données **MySQL** en précisant:
- Le nom d'host: **database:3306**
- La base de données: **KDECOLE**
- Le nom d'utilisateur: **root**
- Le mot de passe: **root**

Créer son tableau de bord sur Grafana est assez simple. Il vous suffit d'ajouter quelques widgets.  
La seule "difficulté" est de faire la bonne requête à la base de données.

## Exemple de tableau de bord
![gafana dashboard](https://github.com/maelgangloff/kdecole-docker-grafana/blob/master/doc/grafana_dashboard.png?raw=true)
