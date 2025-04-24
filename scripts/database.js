export { isDBLoaded, runSQL };

const initSqlJs = window.initSqlJs;

const config = {
    locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${filename}`
};

const sqlPromise = initSqlJs(config);
let db;

async function initDatabase() {
    const dataPromise = fetch("database/umkl_db.db").then(res => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    db = new SQL.Database(new Uint8Array(buf)); // Assign to the broader scoped db
}

async function executeSQL(sqlcmd, params = {}) {
    if (!db) {
        console.error(`%cdatabase.js%c > %cDatabase is not initialized`, "color:#27fc6e", "color:#fff", "color:#c4ffd8");
        return [];
    }

    // Check if the command is a SELECT statement
    if (!sqlcmd.trim().toUpperCase().startsWith("SELECT")) {
        console.error(`%cdatabase.js%c > %cOnly SELECT commands are allowed`, "color:#27fc6e", "color:#fff", "color:#c4ffd8");
        return [];
    }

    try {
        const stmt = db.prepare(sqlcmd);
        let data = [];
        
        // Only bind parameters if they exist in the query
        const paramNames = sqlcmd.match(/\$\w+/g) || [];
        if (paramNames.length > 0) {
            const bindParams = {};
            paramNames.forEach(name => {
                if (params[name]) {
                    bindParams[name] = params[name];
                }
            });
            stmt.bind(bindParams);
        }
        
        while (stmt.step()) {
            data.push(stmt.getAsObject());
        }
        
        stmt.free();
        return data;
    } catch (error) {
        console.error(`%cdatabase.js%c > %cSQL execution failed - ${error}`, "color:#27fc6e", "color:#fff", "color:#c4ffd8");
        return [];
    }
}

async function setupDB() {
    console.debug("%cdatabase.js%c > %cInitialising database", "color:#27fc6e", "color:#fff", "color:#c4ffd8");
    await initDatabase(); // Ensure the database is initialized
    // executeSQL("SELECT * FROM tournament_entry");
}

async function isDBLoaded() {
    return !!db;
}

async function runSQL(sqlcmd) {
    console.debug(`%cdatabase.js%c > %cRunning: %c${sqlcmd.replace(/\s+/g, ' ').trim()}`, "color:#27fc6e", "color:#fff", "color:#27fc6e", "color:#c4ffd8");
    let result = await executeSQL(sqlcmd);
    console.debug(`%cdatabase.js%c > %cResult: %c${JSON.stringify(result)}`, "color:#27fc6e", "color:#fff", "color:#27fc6e", "color:#c4ffd8");
    return result;
}

setupDB();