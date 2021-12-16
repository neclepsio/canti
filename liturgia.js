function parseLiturgia() {
    let res = [];
    let next = "";
    let dal = false;
    let rif = false;
    let salmo = false;
    let alleluia = false;
    let risposta = "";

    for (let line of liturgia.split("\n")) {
        line = next + line.trim();
        next = "";

        if (line == "Prima Lettura" || 
            line == "Seconda Lettura" ||
            line == "Vangelo") {
            if (line != "Prima Lettura") {
                res.push("---");
            }
            line = "#" + line;
            next = "/";
            dal = true;
            salmo = false;
            alleluia = false;
        } else if (line == "Salmo Responsoriale") {
            res.push("---");
            line = "#" + line;
            next = "## ";
            dal = false;
            rit = true;
            salmo = true;
            alleluia = false;
        } else if (line == "Acclamazione al Vangelo") {
            res.push("---");
            line = "." + line;
            alleluia = true;
        } else if (alleluia && (line == "Alleluia, alleluia." || line == "Alleluia.")) {
            line = "## " + line;
        } else if (dal && line.startsWith("Dal")) {
            dal = false;
            rif = true;
            if (line.includes("Vangelo")){
                line = "## {croce}" + line;
            } else {
                line = "## " + line;
            }
        } else if (rif) {
            rif = false;
            res[res.length - 1] += " (" + line.replace(" ", "~") + ")";
            line = "";
        } else if (salmo && line.startsWith("R. ")) {
            line = "/ {risposta} " + line.substr(3);
            risposta = line;
        } else if (salmo) {
            if (line.endsWith("R.")) {
                line = line.substr(0, line.length-2);
                line += "\n" + risposta;
            }
        }

        res.push(line);
    }

    return res.join("\n");
}