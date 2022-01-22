const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('app.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to SQlite database.');
});

// DB Schema
const configsTable = `CREATE TABLE if not exists configs(
    id integer primary key autoincrement, 
    name text,
    host_join text,
    ip text,
    port text,
    mod_files text,
    additional_commands text,
    private integer,
    players integer,
    map text,
    skill integer,
    mode text,
    netmode integer
)`;

const settingsTable = `CREATE TABLE if not exists settings(
    id integer primary key autoincrement, 
    name text unique, 
    value text
)`;

db.run(configsTable);
db.run(settingsTable);

const dbal = {
    getAllConfigs() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM configs", (errors, rows) => {
                if (errors) {
                    reject(errors);
                }

                resolve(rows.map(config => {
                    config.mod_files = config.mod_files.split(',');
                    return config;
                }));

            });
        })
    },
    addConfig(c) {
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO configs(
                name, 
                host_join, 
                ip, 
                port, 
                mod_files, 
                additional_commands, 
                private, 
                players, 
                map, 
                skill, 
                mode, 
                netmode) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                c.name,
                c.host_join,
                c.ip,
                c.port,
                c.mod_files.join(','),
                c.additional_commands,
                c.private ? 1 : 0,
                c.players,
                c.map,
                c.skill,
                c.mode,
                parseInt(c.netmode)
            ], function (errors){
                if (errors) {
                    reject(errors);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    },
    updateConfig(c) {
        return new Promise((resolve, reject) => {
            db.run(`UPDATE configs SET 
                    name=?, 
                    host_join=?, 
                    ip=?, 
                    port=?, 
                    mod_files=?, 
                    additional_commands=?, 
                    private=?, 
                    players=?, 
                    map=?, 
                    skill=?, 
                    mode=?, 
                    netmode=?
                    WHERE id = ?`,
                [
                    c.name,
                    c.host_join,
                    c.ip,
                    c.port,
                    c.mod_files.join(','),
                    c.additional_commands,
                    c.private ? 1 : 0,
                    c.players,
                    c.map,
                    c.skill,
                    c.mode,
                    parseInt(c.netmode),
                    c.id
                ],
                (errors) => {
                    if (errors) {
                        reject(errors);
                    }else {
                        resolve(true);
                    }
                })
        });
    },
    deleteConfig(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM configs WHERE id = ?', [id], (errors) => {
                if (errors) {
                    reject(errors);
                } else {
                    resolve(true);
                }
            })
        });
    },
    getSetting(name) {
        return new Promise((resolve, reject) => {
            db.get('SELECT value FROM settings WHERE name = ?', [name], (errors, row) => {
                if (errors) {
                    reject(errors);
                }
                resolve(row ? row.value : null);
            });
        })
    },
    setSetting(name, value) {
        return new Promise((resolve, reject) => {
            const stmt = db.prepare("INSERT INTO settings(name, value) VALUES (?1, ?2) ON CONFLICT(name) DO UPDATE SET value = ?2");
            stmt.run(name, value);
            stmt.finalize();
            resolve(value);
        });
    }
}

module.exports = dbal;
