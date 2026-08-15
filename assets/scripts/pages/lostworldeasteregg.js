/*
    I wonder what happens it does... how am I supposed to know what a hex is?
    トリプル・バッカ x 2 if you think about it...
*/

let code = "";

document.addEventListener("keydown", (event) => {
    code += event.key.toLowerCase();

    if (code === "hex") {
        hexingItUp();
        code = "";
    } else if (!"hex".startsWith(code)) {
        code = "";
    }
});

function hexingItUp() {
    document.getElementById("hex").classList.remove("hidden");
}