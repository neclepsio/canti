let debug = false;
let libreriaCanti = null;

const contentHeader = ``;

// Per rispettare la licenza, se modifichi il footer predefinito è necessario
// trovare un altro modo di rispettare il criterio di attribuzione.
const contentFooter = `

--------------------------------------------------------------------------------

Vuoi realizzare una pagina simile a questa? {github}.
`;

function alertAndLog(err) {
    console.log(err);
    alert(err);
}

function parseSource(text) {
    let links = [];
    text = text.replace(/\{[ \t]*(.*?)[ \t]*\}/gm, function(match, p1) {
        let p1l = p1.toLowerCase();
        if (p1l in libreriaCanti) {
            return libreriaCanti[p1l];
        }
        if (" indice croce risposta musica github ".indexOf(" "+p1l+" ") >= 0) {
            return match;
        }
        if (p1.startsWith("media ")) {
            // in questo modo evito i problemi con underscore e smart punctuation
            links.push(p1.split(/ +/, 2)[1]); 
            return "{media " + (links.length-1).toString() + "}";
        }
        if (debug) {
            alertAndLog("Impossibile trovare \"" + p1 + "\" nella libreria.");
            return "% " + match;
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
        line = line.replace(/\\\[/g, "\uE000");
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
        } else if (line.startsWith("%")) {
            if (debug) {
                klass = "debug";
                sezione = "debug";
                line = line.substr(1);
            } else {
                continue;
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
        line = line.replace(/\uE000/g, "[");

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
    
    // media
    res = res.replace(/\{media (.*?)\}/, function(match, p1) {
        var link = links[parseInt(p1)];
        return '<img class="media" src="youtube.svg" data-link="' + link + '">';
    })

    // github
    res = res.replace(/\{github\}/g, `<a href="https://github.com/neclepsio/canti">Tocca&nbsp;qui</a>`);

    return res;
}

function setZoomGestureHandler (handler) {
    const minDoubleTapTimeOut = 50;
    const maxDoubleTapTimeOut = 300;

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
        // dovrebbe controllare a[href] e click handler piuttosto,
        // idealmente anche se c'è una spiegazione aperta
        let ignoreElement = ev.target.tagName == "BUTTON" || ev.target.tagName == "A";
        if (ignoreElement) {
            return;
        }

        doubleTapTimeDown = timeStamp();
        let delta = doubleTapTimeDown - doubleTapTimeUp;
        doubleTapZoom = (doubleTapFirstTap && delta > minDoubleTapTimeOut && delta < maxDoubleTapTimeOut && touchNearStart(ev));
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

        let delta = doubleTapTimeUp - doubleTapTimeDown;
        if (doubleTapTimeDown > 0 && delta > minDoubleTapTimeOut && delta < maxDoubleTapTimeOut) {
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
        if (navigator.onLine && !debug) {
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
            let cl = spiegazione.classList;
            if (!cl.contains("visible")) {
                let r = button.getBoundingClientRect();
                spiegazione.style.top = (r.top + r.height + window.scrollY).toString() + "px";
                cl.add("animate");
                cl.add("visible");
                document.body.classList.add("spiegazione-visibile");
            }
        });
    }
    
    document.body.addEventListener("click", function(ev) {
        if (!document.body.classList.contains("spiegazione-visibile")) {
            return;
        }
        document.body.classList.remove("spiegazione-visibile");
        document.getElementById("alert").classList.remove("visibile");
        for (let spiegazione of document.getElementsByClassName("spiegazione")) {
            spiegazione.classList.remove("visible");
        }
        if (ev.target.id.startsWith("alert-button-")) {
            return;
        }
        ev.stopPropagation();
    }, true);
}

function handleMedia() {
    let media = document.getElementsByClassName("media");
    for (let button of media) {
        button.addEventListener("click", function(ev) {
            let text = document.getElementById("alert-text");
            let button1 = document.getElementById("alert-button-1");
            let button2 = document.getElementById("alert-button-2");
            if (!navigator.onLine) {
                text.textContent = "Il dispositivo non è collegato ad internet; non è possibile aprire il collegamento.";
                button1.style.display = "none";
                button2.style.display = "inline";
                button2.textContent = "Chiudi";
                button2.onclick = null;
            } else {
                text.innerHTML = "<p>Toccando questo pulsante si avvia la riproduzione del canto.</p>" + 
                    "<p>È utile per imparare i canti prima della Messa, ma è inopportuno " +
                    "che la musica parta durante la celebrazione.</p>"+
                    "<p>Sei sicuro di voler procedere?</p>";
                button1.style.display = "inline";
                button2.style.display = "inline";
                button1.textContent = "Annulla";
                button2.textContent = "Prosegui";
                button1.onclick = null;
                let link = ev.target.dataset.link;
                button2.onclick = function() {
                    window.open(link, "_blank").focus();
                }
            }
            document.body.classList.add("spiegazione-visibile");
            document.getElementById("alert").classList.add("visibile");
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

function leggiLibreria() {
    let res = {};

    let key = "";
    for (let line of libreria.split("\n")) {
        line = line.trim();

        if (line.startsWith("#")) {
            key = line.replace(/\{.*?\}/g, "").replace(/~/g, " ").substr(1).trim().toLowerCase();
        }
        if (!(key in res)) {
            res[key] = [];
        }
        res[key].push(line);
    }
    for (let key in res) {
        res[key] = res[key].join("\n").trim()
    }

    return res;
}

function setLetture() {
    for (let song of document.querySelectorAll("#contenuto .song")) {
        if (song.clientWidth > document.body.clientWidth / 2) {
            song.classList.add("lettura");
        } else {
            song.classList.remove("lettura");
        }
    }
}

function main() {
    debug = ((new URL(window.location)).searchParams.get("debug") != null);
    if (debug) {
        onerror = function(errorMsg, url, lineNumber) {
            alertAndLog(errorMsg + "\n" +
                "Url: " + url + "\n" +
                "Line: " + lineNumber);
        
            return false;
        };
    }

    libreriaCanti = leggiLibreria(libreria);
    let contenuto = parseSource(canti);
    document.querySelector("#contenuto").innerHTML = contenuto;

    setEvents();
    handlePopups();
    handleMedia();
    document.body.style.display = null;
    setLetture();

    window.addEventListener("resize", setLetture);
}
document.addEventListener("DOMContentLoaded", main);
