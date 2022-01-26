const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('app.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to SQlite database.');
});


// ####### Database Schema / Migrations ###########
const schema = {
    getUserVersion(){
        return new Promise((resolve, reject) => {
            db.get(`PRAGMA user_version`, (error, row) => {
                if(error){
                    reject(error);
                }else if(row && 'user_version' in row){
                    resolve(row.user_version);
                }else{
                    resolve(0);
                }
            })
        })
    },
    setUserVersion(version){
        return new Promise((resolve, reject) => {
            db.get(`PRAGMA user_version = ${version}`, (error, row) => {
                if(error){
                    reject(error);
                }else{
                    resolve(version);
                }
            })
        })
    },
    async migrate(){
        try{
            let dbUserVersion = await this.getUserVersion();
            dbUserVersion++;
            while(dbUserVersion in this.migrations){
                const queries = this.migrations[dbUserVersion];
                // using forEach would put us in a function that is not async (could make it one, though this seems cleaner)
                for(let queryIndex in queries){
                    await queries[queryIndex]();
                }
                await this.setUserVersion(dbUserVersion);
                console.log(`migrated db to version ${dbUserVersion}`);
                dbUserVersion++;
            }
        }catch(error){
            throw error;
        }
    },
    migrations: { 
        // Refactor: An array of functions that return promises that wrap a db function with a callback... 
        // must be a cleaner way to syncronize these, albeit it does make the migrate async await nice
        // there's db.synchronize though it probably wouldn't be all that clean, maybe in each array index
        1: [ // Version 0.1.0
            () => { return new Promise((resolve, reject) => {
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

                db.run(configsTable, (error) => {
                    if(error){
                        reject(error);
                    }else{
                        resolve();
                    }
                });
            })},
            () => { return new Promise((resolve, reject) => {
                const settingsTable = `CREATE TABLE if not exists settings(
                    id integer primary key autoincrement, 
                    name text unique, 
                    value text
                )`;

                db.run(settingsTable, (error) => {
                    if(error){
                        reject(error);
                    }else{
                        resolve();
                    }
                });
            })},
        ],
        2: [ // Version 0.2.0
            () => { return new Promise((resolve, reject) => { 
                db.run(`ALTER TABLE configs ADD COLUMN save_file text`, (error) => {
                    if(error){
                        reject(error);
                    }else{
                        resolve();
                    }
                })
            })},
        ]
    },
}

schema.migrate();

// ####### Database Abstraction Layer ###########
const dbal = {
    getAllConfigs() {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM configs", (errors, rows) => {
                if (errors) {
                    reject(errors);
                }

                resolve(rows.map(config => {
                    if(config.mod_files){
                        config.mod_files = config.mod_files.split(',');
                    }else{
                        config.mod_files = [];
                    }
                    
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
                netmode,
                save_file) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                c.save_file,
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
                    netmode=?,
                    save_file=?
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
                    c.save_file,
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
