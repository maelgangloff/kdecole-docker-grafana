# Tableau de bord de ses relevés scolaires

Utilise l'API K-D'Ecole pour récupérer ses notes et les représenter graphiquement.

## Installation

1. Installer docker et docker-compose
1. Créer les volumes docker. Vos données y seront stockées.
```shell
docker volume create mariadb-storage
```
```shell
docker volume create grafana-storage
```
1. Cloner le projet
```shell
git clone https://github.com/maelgangloff/kdecole-docker-grafana
```
1. Modifier le fichier docker-compose.yml :
   * `KDECOLE_TOKEN` : Pour obtenir votre jeton d'authentification K-D'Ecole, reportez-vous à la section correspondante.
   * `KDECOLE_URL` : L'URL de l'API.
   * `KDECOLE_ACADEMIE` : Le nom de votre circonscription académique.
1. Démarrez les conteneurs Docker
```shell
docker-compose up --build -d
```
1. Rendez-vous à l'adresse http://localhost:3000
1. Se connecter (par défaut, le nom d'utilisateur et le mot de passe sont `admin`) puis changez votre mot de passe.  
Un tableau de bord est déjà configuré. Pour être fonctionnel, il nécessite quelques ajustements. Si les moyennes des matières ne sont pas trouvées, il faut modifier la requête pour trouver l'identifiant de la période de notation.
1. Créez votre tableau de bord

### Obtenir son jeton d'authentification  K-D'Ecole

* Installer NodeJs
* Installer la librairie kdecole-api en global
```shell
npm -i kdecole-api
```
* Exécuter le binaire pour obtenir le jeton
```shell
npx kdecole-api -u IDENTIFIANT -p CODE_TEMPORAIRE --ent PROD_MON_BUREAU_NUMERIQUE
```
Ne communiquez jamais votre jeton à un tier. Il vous est strictement personnel. Si vous pensez que votre jeton a fuité, révoquez-le immédiatement.

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
Si vous voulez partir d'une
base, [le code JSON de ce dashboard](https://github.com/maelgangloff/kdecole-docker-grafana/raw/master/doc/grafana/provisioning/dashboards/Kdecole.json)
est disponible.  
Cependant, il n'est pas assuré que cet exemple fonctionne du premier coup, il est peut-être nécessaire de modifier les identifiants de période de notation (vous pouvez les retrouver en explorant le contenu des données récoltées via l'outil *Explore* de Grafana).

## Exemples de requêtes SQL

- Nombre de notes au total dans la base
   ```sql
    SELECT NOW() AS "time",
    COUNT(*) 
   FROM devoirs;
   ```
- Nombre de notes dans la base pour un élève précis (Changer l'identifiant par l'identifiant de l'élève)
   ```sql
    SELECT NOW() AS "time",
    COUNT(*)
   FROM devoirs
   WHERE idEleve = 'AAP05567';
   ```
- Toutes les notes d'un élève
   ```sql
    SELECT timestamp AS "time",
     matiere AS metric,
     note 
   FROM devoirs
   WHERE idEleve = 'AAP05567'
   ORDER BY timestamp;
   ```
- Nombre de jours avant les vacances (Adapter `KDECOLE_ACADEMIE` dans docker-compose.yml)
   ```sql
    SELECT NOW() AS "time",
     jMoins
    FROM holidays;
    ```
- Moyennes des matières dans un trimestre (Adapter `idPeriode` par celui du trimestre voulu)
    ```sql
    SELECT NOW() AS "time",
     matiereLibelle AS metric,
     moyenneEleve
    FROM moyennes
    WHERE idPeriode = 25
    ORDER BY idPeriode;
    ```
