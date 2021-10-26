
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

function setLetture() {
    for (let song of document.querySelectorAll("#contenuto .song")) {
        if (song.clientWidth > document.body.clientWidth / 2) {
            song.classList.add("lettura");
        } else {
            song.classList.remove("lettura");
        }
    }
}