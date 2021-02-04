const Kdecole = require('kdecole-api').default
const {CronJob} = require('cron')
const {createConnection} = require('mysql')

const connection = createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})
connection.connect()

const user = new Kdecole(process.env.KDECOLE_TOKEN)

connection.query(`DROP TABLE IF EXISTS moyennes;`)
connection.query(`DROP TABLE IF EXISTS moyenneGenerale;`)
connection.query(`DROP TABLE IF EXISTS devoirs;`)


connection.query(`CREATE TABLE IF NOT EXISTS moyennes
                  (
                      matiereLibelle VARCHAR(20)   NOT NULL,
                      id             VARCHAR(30)   NOT NULL,
                      moyenneEleve   DECIMAL(4, 2) NOT NULL,
                      moyenneClasse  DECIMAL(4, 2) NOT NULL,
                      idPeriode      INT           NOT NULL,
                      idEleve        VARCHAR(255)  NOT NULL,
                      UNIQUE KEY id (id) USING BTREE,
                      PRIMARY KEY (id)
                  );`)
connection.query(`CREATE TABLE IF NOT EXISTS moyenneGenerale
                  (
                      id              INT          NOT NULL,
                      trimestre       VARCHAR(30)  NOT NULL,
                      moyenneGenerale DECIMAL(4, 2),
                      idEleve         VARCHAR(255) NOT NULL,
                      UNIQUE KEY id (id) USING BTREE,
                      PRIMARY KEY (id)
                  );`)
connection.query(`CREATE TABLE IF NOT EXISTS devoirs
                  (
                      id          INT           NOT NULL,
                      note        DECIMAL(4, 2) NOT NULL,
                      matiere     VARCHAR(20)   NOT NULL,
                      timestamp   DATETIME      NOT NULL,
                      noteMin     DECIMAL(4, 2) NOT NULL,
                      noteMax     DECIMAL(4, 2) NOT NULL,
                      trimestre   VARCHAR(30)   NOT NULL,
                      idEleve     VARCHAR(255)  NOT NULL,
                      UNIQUE KEY id (id) USING BTREE,
                      PRIMARY KEY (id)
                  );`)


function to20(note, bareme){
    return (note / bareme) * 20
}

async function fetch() {
    console.log('Fetch')

    const infoUser = await user.getInfoUtilisateur()

    switch (infoUser.type){
        case 1:
            await fetchStudent('current')
            break
        default:
            for (const student of infoUser.eleves){
                await fetchStudent(student.uid)
            }
    }
}

async function fetchStudent(uid){
    const {trimestres} = await user.getReleve()


    for (const trimestre of trimestres) {
        if (trimestre.matieres.length === 0) continue
        for (const matiere of trimestre.matieres) {
            for (const devoir of matiere.devoirs) {
                if (isNaN(devoir.note) || devoir.note === null) continue
                connection.query(`INSERT IGNORE devoirs VALUES (${devoir.id}, ${to20(devoir.note, devoir.bareme)}, '${matiere.matiereLibelle}', '${devoir.date.toISOString().slice(0, 19).replace('T', ' ')}', ${to20(devoir.noteMin, devoir.bareme)}, ${to20(devoir.noteMax, devoir.bareme)}, '${trimestre.periodeLibelle}' ,'${uid}')`)
            }
            connection.query(`INSERT IGNORE moyennes VALUES ('${matiere.matiereLibelle}', '${uid}_${trimestre.idPeriode}_${matiere.matiereLibelle}', ${to20(matiere.moyenneEleve, matiere.bareme)}, ${matiere.moyenneClasse}, '${trimestre.idPeriode}', '${uid}');`)
        }
        connection.query(`INSERT IGNORE moyenneGenerale VALUES (${trimestre.idPeriode}, '${trimestre.periodeLibelle}', ${trimestre.getMoyenneGenerale()}, '${uid}');`);
    }
}

fetch()
const job = new CronJob('0 */10 * * * *', fetch)
job.start()
