const Kdecole = require('kdecole-api').default
const {CronJob} = require('cron')
const {createConnection} = require('mysql')
const {get} = require('axios')
const dayjs = require('dayjs')

const connection = createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
})
connection.connect()

const user = new Kdecole(
    process.env.KDECOLE_TOKEN,
    process.env.KDECOLE_VERSION,
    process.env.KDECOLE_URL)
connection.query('DROP TABLE IF EXISTS moyennes, moyenneGenerale, devoirs, holidays;')
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
                      id        INT           NOT NULL,
                      note      DECIMAL(4, 2) NOT NULL,
                      matiere   VARCHAR(20)   NOT NULL,
                      timestamp DATETIME      NOT NULL,
                      noteMin   DECIMAL(4, 2) NOT NULL,
                      noteMax   DECIMAL(4, 2) NOT NULL,
                      trimestre VARCHAR(30)   NOT NULL,
                      idEleve   VARCHAR(255)  NOT NULL,
                      UNIQUE KEY id (id) USING BTREE,
                      PRIMARY KEY (id)
                  );`)

connection.query(`CREATE TABLE IF NOT EXISTS holidays
                  (
                      id          INT          DEFAULT 1,
                      description VARCHAR(255) NOT NULL,
                      start_date  DATE         NOT NULL,
                      end_date    DATE         NOT NULL,
                      jMoins      INT          NOT NULL,
                      UNIQUE KEY id (id) USING BTREE,
                      PRIMARY KEY (id)
                  );`)


function to20(note, bareme) {
    return (note / bareme) * 20
}

async function fetch() {
    console.log('Fetch')

    const infoUser = await user.getInfoUtilisateur()
    connection.query('TRUNCATE TABLE moyennes;')
    connection.query('TRUNCATE TABLE moyenneGenerale;')
    connection.query('TRUNCATE TABLE devoirs;')
    connection.query('TRUNCATE TABLE holidays;')

    switch (infoUser.type) {
        case 1:
            await fetchStudent((await user.getNotes()).codeEleve)
            break
        default:
            for (const student of infoUser.eleves) {
                await fetchStudent(student.uid)
            }
    }

    await fetchHolidays()

}

async function fetchStudent(uid) {
    console.log('Fetch student:', uid)
    const {trimestres} = await user.getReleve(uid)

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

async function fetchHolidays() {
    const annee_scolaire = '2020-2021'
    const holiday = (await get(`https://data.education.gouv.fr/api/records/1.0/search/?dataset=fr-en-calendrier-scolaire&q=&lang=fr&rows=15&facet=description&facet=start_date&facet=end_date&facet=annee_scolaire&refine.annee_scolaire=${annee_scolaire}&refine.location=${process.env.KDECOLE_ACADEMIE}&timezone=Europe%2FParis`)).data.records
        .filter(record => dayjs(record.fields.start_date).isAfter() && record.fields.population !== 'Enseignants')[0]

    connection.query(`INSERT holidays VALUES (1, "${holiday.fields.description}", '${holiday.fields.start_date}', '${holiday.fields.end_date}', ${dayjs(holiday.fields.start_date).diff(dayjs(), 'days')+1});`)
}

fetch()
const job = new CronJob('0 */10 * * * *', fetch)
job.start()
