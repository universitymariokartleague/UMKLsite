const SQLOutput = document.getElementById("SQLOutput")
const initSqlJs = window.initSqlJs;

const config = {
    locateFile: filename => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/${filename}`
};

const sqlPromise = initSqlJs(config);

let db; // Define db in a broader scope

async function initDatabase() {
    const dataPromise = fetch("database/umkl_db.db").then(res => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    db = new SQL.Database(new Uint8Array(buf)); // Assign to the broader scoped db
}

async function executeSQL(sqlcmd) {
    SQLOutput.innerHTML = ""

    if (!db) {
        console.error("Database is not initialized.");
        return;
    }

    // Check if the command is a SELECT statement
    if (!sqlcmd.trim().toUpperCase().startsWith("SELECT")) {
        console.error("Only SELECT commands are allowed.");
        return;
    }

    // Prepare a statement
    const stmt = db.prepare(sqlcmd);
    stmt.getAsObject({ $start: 1, $end: 1 }); // {col1:1, col2:111}

    // Bind new values
    stmt.bind({ $start: 1, $end: 2 });
    while (stmt.step()) {
        const row = stmt.getAsObject();
        SQLOutput.innerHTML += JSON.stringify(row)
        console.log(JSON.stringify(row));
    }
}

async function main() {
    await initDatabase(); // Ensure the database is initialized
    // executeSQL("SELECT * FROM tournament_entry");
}

main(); // Run the main function to initialize the database and execute SQL

document.getElementById("executeSQLButton").addEventListener("click", async function() {
    const sqlcmd = document.getElementById("SQLBox").value;
    await executeSQL(sqlcmd);
});