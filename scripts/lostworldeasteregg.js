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