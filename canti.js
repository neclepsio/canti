let contentHeader = ``;

// Per rispettare la licenza, se modifichi il footer predefinito è necessario
// trovare un altro modo di rispettare il criterio di attribuzione.
let contentFooter = `

--------------------------------------------------------------------------------

Vuoi realizzare una pagina simile a questa? {github}.
`;

function parseSource() {
    let text = document.querySelector("#contenuto").textContent;
    
    text = text.replace(/^[ \t]*\{[ \t]*(.*)[ \t]*\}/gm, function(match, p1) {
        p1 = p1.toLowerCase();
        if (p1 in libreria) {
            return libreria[p1];
        }
        return match;
    })
    
    let lines = (contentHeader + text + contentFooter).split("\n");
    let lastKlass = "";
    let lastSezione = "";
    let emptyLine = false;
    let prevLine = "";
    let lastRitornello = "";

    let res = "";

    let indiceReset = false;
    let n = 0;
    let indice = "";
    let ultimoMomento = "";

    for (let i in lines) {
        let line = lines[i].trim();
        
        // gestione le righe continuate
        if (prevLine != "") {
            line = prevLine + " " + line;
            prevLine = "";
        }
        if (line.endsWith("\\")) {
            prevLine = line.substr(0, line.length-1);
            continue;
        }

        // eliminazione accordi
        if (line[0] == "@") {
            continue;
        }
        line = line.replace(/\\\[/g, "{\\pq}");
        line = line.replace(/\[.*?\]/g, "");
        line = line.replace(/_/g, "");
        
        // la riga vuota inserisce lo spazio tra paragrafi, verrà
        // fatto dopo per evitare spazi multiplo in caso di più linee
        // vuote o cambi di stile
        if (line.length == 0) {
            emptyLine = true;
            continue
        }

        // reset indice 
        if (!indiceReset && line.indexOf("{indice}") != -1) {
            indice = "";
            indiceReset = true;
        }

        // separatore
        if (line.match(/^-+$/)) {
            if (lastKlass != "") {
                res += "</p>\n";
            }
            if (lastSezione != "") {
                res += "</div>\n";
            }
            res += "<hr/>\n";
            lastKlass = "";
            lastSezione = "";
            continue;
        }
        
        // gestione stili
        let klass = "";
        let sezione = "";
        if (line.startsWith("?")) {
            klass = "spiegazione";
            sezione = "header";
            line = line.substr(1);
        } else if (line.startsWith(".")) {
            klass = "momento";
            sezione = "header";
            line = line.substr(1);
            ultimoMomento = line;
        } else if (line.startsWith("##")) {
            klass = "grassetto";
            sezione = "song";
            line = line.substr(2);
        } else if (line.startsWith("#")) {
            klass = "titolo";
            sezione = "header";
            line = line.substr(1);
            let titolo = line;
            if (ultimoMomento != "") {
                titolo = ultimoMomento + ": " + line;
            }
            titolo = titolo.replace(/\{.*?\}/g, "");
            titolo = titolo.replace(/~/g, " ");
            indice += "<a href='#titolo" + n.toString() + "'>" + titolo + "</a><br>\n";
            ultimoMomento = "";
            if (n == 0) {
                document.title = titolo;
            }
            lastRitornello = "";
            n += 1;
        } else if (line.startsWith("/")) {
            klass = "bridge";
            sezione = "song";
            line = line.substr(1);
        } else if (line.startsWith(">")) {
            klass = "ritornello";
            sezione = "song";
            if (line.startsWith(">*") && lastRitornello != "") {
                line = lastRitornello + line.substr(2);
            } else {
                line = line.substr(1);
            }
            if (lastRitornello == "") {
                lastRitornello = line.replace(/[\.,;:]*$/, "...");
            }
        } else {
            klass = "strofa";
            sezione = "song";
        }
        
        // inserimento eventuale spazio tra paragrafi
        if (klass != lastKlass || emptyLine) {
            if (lastKlass != "") {
                res += "</p>\n";
            }

            if (sezione != lastSezione) {
                if (lastSezione != "") {
                    res += "</div>\n"
                } 
                res += "<div class='" + sezione + "'>\n";
                lastSezione = sezione;
            }
            
            if (klass == "titolo") {
                res += "<a id='titolo" + (n-1).toString() + "'></a>"
            }
            res += "<p class='" + klass + "'>\n";
            lastKlass = klass;
        }

        // "smart" punctuation
        line = line.replace(/(^|\s)'\b/g, "$1‘");
        line = line.replace(/'/g, "’");
        line = line.replace(/(^|\s)"\b/g, "$1“");
        line = line.replace(/"/g, "”");
        line = line.replace(/<</g, "«");
        line = line.replace(/>>/g, "»");
        line = line.replace(/&/g, "&amp;");
        line = line.replace(/</g, "&lt;");
        line = line.replace(/>/g, "&gt;");
        line = line.replace(/\.\.\./g, "…");
        line = line.replace(/---/g, "&#8212;");
        line = line.replace(/--/g, "&#8211;");
        line = line.replace(/~/g, "&nbsp;");
        line = line.replace(/-/g, "&#8209;");

        // gestione escape
        line = line.replace(/\{\\pq\}/g, "[");

        // scrittura linea
        emptyLine = false;
        res += line + "<br/>\n";
    }
    res += "</p>\n";

    // indice
    indice = indice.substring(0, indice.length - "<br/>".length);
    res = res.replace(/\{indice\}/g, indice);

    // immagini
    for (let k of ["croce", "risposta", "musica"]) {
        let r = new RegExp("\\{" + k + "\\}", "g");
        res = res.replace(r, '<img class="' + k + '" src="' + k + '.svg">');
    }

    // github
    res = res.replace(/\{github\}/g, `<a href="https://github.com/neclepsio/canti">Tocca&nbsp;qui</a>`);

    return res;
}

function setZoomGestureHandler (handler) {
    let el = document.body;

    let doubleTapTimeDown = 0;
    let doubleTapTimeUp = 0;
    let doubleTapStartX = 0;
    let doubleTapStartY = 0;
    let doubleTapFirstTap = false;
    let doubleTapZoom = false;
    let pinchPrevDiff = -1;
    
    function timeStamp() {
        return new Date().getTime();
    }

    function touchNearStart(ev) {
        let dx = doubleTapStartX - ev.touches[0].clientX;
        let dy = doubleTapStartY - ev.touches[0].clientY;
        let diff = Math.sqrt(dx*dx + dy*dy);
        return diff < window.innerHeight / 10;
    }

    el.addEventListener("touchstart", function(ev) {
        // dovrebbe controllare a[href] e click handler piuttosto
        // idealmente anche se c'è una spiegazione aperta
        let ignoreElement = ev.target.tagName == "BUTTON" || ev.target.tagName == "A";
        if (ignoreElement) {
            return;
        }

        doubleTapTimeDown = timeStamp();
        doubleTapZoom = (doubleTapFirstTap && doubleTapTimeDown - doubleTapTimeUp < 300 && touchNearStart(ev));
        if (doubleTapZoom) {
            handler(-1);
            ev.preventDefault();
        }

        doubleTapStartX = ev.touches[0].clientX;
        doubleTapStartY = ev.touches[0].clientY;
    }, {passive: false});
    
    el.addEventListener("touchmove", function(ev) {
        let step = window.innerHeight / 10;
        let value = (doubleTapStartY - ev.touches[0].clientY) / step;
        if (doubleTapZoom) {
            handler(1 + value);
        } else if (!touchNearStart(ev)) {
            doubleTapTimeDown = 0;
        }
        
        if (ev.touches.length == 2) {
            let currDiffX = ev.touches[0].clientX - ev.touches[1].clientX;
            let currDiffY = ev.touches[0].clientY - ev.touches[1].clientY;
            let currDiff = Math.sqrt(currDiffX*currDiffX + currDiffY*currDiffY);
            
            if (pinchPrevDiff < 0) {
                pinchPrevDiff = currDiff;
                handler(-1);
            } else {
                handler(currDiff / pinchPrevDiff);
            }
        }
    }, {passive: true});

    el.addEventListener("touchend", function (ev) {
        doubleTapTimeUp = timeStamp();
        doubleTapZoom = false;

        if (doubleTapTimeDown > 0 && doubleTapTimeUp - doubleTapTimeDown < 300) {
            doubleTapFirstTap = true;
        } else {
            doubleTapFirstTap = false;
        }

        pinchPrevDiff = -1;
    }, {passive: true});
}

function setEvents() {
    document.body.style.fontSize = "100%";

    function getZoom() {
        return parseInt(document.body.style.fontSize);
    }

    function setZoom(s) {
        s = Math.max(s, 50);
        s = Math.min(s, 200);
        document.body.style.fontSize = s + "%";
    }

    document.getElementById("zoomMinus").addEventListener("click", function(e) {
        setZoom(getZoom() - 10);
    });

    document.getElementById("zoomPlus").addEventListener("click", function(e) {
        setZoom(getZoom() + 10);
    });

    let startZoom;
    setZoomGestureHandler(function(value) {
        if (value < 0) {
            startZoom = getZoom();
        } else {
            setZoom(Math.round(startZoom * value / 10) * 10);
        }
    });

    setInterval(function() {
        let online = document.getElementById("online");
        if (navigator.onLine) {
            online.classList.add("online");
        } else {
            online.classList.remove("online");
        }
    }, 1000);
}

function handlePopups() {
    let spiegazioni = document.getElementsByClassName("spiegazione");
    for (let spiegazione of spiegazioni) {
        let titolo = spiegazione;
        while (titolo != null && !titolo.classList.contains("titolo")) {
            titolo = titolo.nextElementSibling;
        }
        if (titolo == null) {
            titolo = spiegazione;
            while (titolo != null && !titolo.classList.contains("titolo")) {
                titolo = titolo.previousElementSibling;
            }
        }
        if (titolo == null) {
            titolo = spiegazione;
        }

        let button = document.createElement("button");
        button.classList.add("pulsante-spiegazione");
        button.textContent = "?";
        titolo.parentElement.insertBefore(button, titolo);

        button.addEventListener("click", function(ev) {
            let r = button.getBoundingClientRect();
            spiegazione.style.top = (r.top + r.height + window.scrollY).toString() + "px";
            let cl = spiegazione.classList;
            cl.add("animate");
            cl.toggle("visible");
            document.body.classList.toggle("spiegazione-visibile");
        });
    }
    
    document.body.addEventListener("click", function(ev) {
        if (ev.target.classList.contains("pulsante-spiegazione")) {
            return;
        }
        for (let spiegazione of document.getElementsByClassName("spiegazione")) {
            spiegazione.classList.remove("visible");
            document.body.classList.remove("spiegazione-visibile");
        }
    }, true);
}


let libreria = null;
function leggiLibreria() {
    libreria = {};
    let src = document.querySelector("#libreria").contentDocument.body.textContent;

    let key = "";
    for (let line of src.split("\n")) {
        line = line.trim();

        if (line.startsWith("#")) {
            key = line.replace(/\{.*?\}/g, "").replace(/~/g, " ").substr(1).trim().toLowerCase();
        }
        if (!(key in libreria)) {
            libreria[key] = [];
        }
        libreria[key].push(line);
    }
    for (let key in libreria) {
        libreria[key] = libreria[key].join("\n").trim()
    }
}

let header = `<!DOCTYPE html>
<html>
<head>
	<meta name="viewport" content="width=device-width, user-scalable=no" />
    <meta charset="utf8"> 

    <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
    <link href="canti.css" rel="stylesheet">

    <title></title>
</head>
<body style="display: none;">
`;

let footer = `
    <div id="online">
        <div>
            <span><img src="aereo.svg"></span>
            <span>Attiva la modalità aereo usando il menu del 
            tuo telefono. In questo modo eviterai distrazioni 
            durante la Messa e nasconderai questo messaggio.</span>
        </div>
    </div>
    <div id="spacer"></div>
    <div id="buttons">
        <button id="zoomMinus">&#x2212;</button>
        <button id="zoomPlus">&#x002b;</button>
    </div>
</body>
</html>`;

function main() {
    leggiLibreria();
    let content = parseSource();
    header = header.replace("<title></title>", "<title>" + document.title + "</title>")
    document.querySelector("html").innerHTML = header + content + footer;
    setEvents();
    handlePopups();
    document.addEventListener("readystatechange", function() {
        if (document.readyState != "complete") {
            return;
        }
        
        // non so perché, viene aggiunto un secondo body un po' dopo
        // aver sostituito (html).innerHTML
        while (document.getElementsByTagName("body").length > 1) {
            document.getElementsByTagName("body")[1].remove();
        }

        document.body.style.display = "block";
    });
}

document.querySelector("#libreria").addEventListener("load", function() {
    main();
});