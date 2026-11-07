/* Übersicht: Filter, Liste, Karte, tägliche Reihenfolge, Sortierung nach Nähe */
(function () {
  "use strict";
  var K = window.KTP, C = K.C, esc = K.esc;
  var $ = function (s) { return document.querySelector(s); };

  // "Alle" und "alle" bedeuten: kein Filter. Es gibt dafür keinen eigenen Chip,
  // ein zweiter Klick auf den gewählten Chip hebt die Auswahl wieder auf.
  var state = { ort: "Alle", alter: "alle", frei: false, text: "", nah: null, wuensche: [] };

  // Eltern geben das Alter ihres Kindes bei Betreuungsbeginn an (Wunsch von Markus),
  // die Einträge nennen Altersgruppen (u1, u3, ue3). Hier die Zuordnung.
  // Randzeitenbetreuung steht in „Weitere Filter“ (Karl, 06.11.2026).
  var ALTER_KIND = [["0", "Unter 1 Jahr", "u1"], ["1", "1 Jahr", "u3"], ["2", "2 Jahre", "u3"], ["3", "Ab 3 Jahren", "ue3"]];
  var ALTERSGRUPPE = {};
  ALTER_KIND.forEach(function (a) { ALTERSGRUPPE[a[0]] = a[2]; });
  function passtAlter(e) {
    if (state.alter === "alle") return true;
    return (e.alter || []).indexOf(ALTERSGRUPPE[state.alter]) !== -1;
  }
  var alle = [];
  // Kein Eintrag freigegeben: Die Filter stehen trotzdem da (Karl, 06.11.2026). Ohne gewählten Filter zeigt die Liste
  // das Musterprofil, mit Filter „Noch keine Kindertagespflegestellen eingetragen“. Das Musterprofil gehört nicht zu den Daten.
  var muster = false;
  var map = null, ebene = null, ichMarker = null;

  // Optionen für „Weitere Filter“: alle Besonderheiten mit Filter, dazu Großtagespflege aus der Betreuungsform
  var OPTIONEN = [];
  K.BESONDERHEITEN.forEach(function (b) {
    if (b.filter === false) return;
    if (b.key === "mehrsprachig") OPTIONEN.push({ key: "grosstagespflege", label: "Großtagespflege", gruppe: b.gruppe,
      erfuellt: function (e) { return e.betreuungsform === "grosstagespflege"; } });
    OPTIONEN.push({ key: b.key, label: b.label, gruppe: b.gruppe,
      erfuellt: function (e) { return (e.besonderheiten || []).indexOf(b.key) !== -1; } });
  });
  var OPT = {};
  OPTIONEN.forEach(function (o) { OPT[o.key] = o; });
  function trefferZahl(e) {
    return state.wuensche.filter(function (k) { return OPT[k].erfuellt(e); }).length;
  }
  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';

  // ---------- Stand der Daten an der Liste ----------
  function standZeigen(d) {
    var el = $("#stand");
    if (el && d.stand) el.textContent = "Stand " + K.monat(String(d.stand).slice(0, 7));
  }

  // Chips am Rechner
  function pills(el, items, key, ohne) {
    el.innerHTML = "";
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "pill"; b.textContent = it[1];
      b.setAttribute("aria-pressed", String(state[key] === it[0]));
      b.addEventListener("click", function () { state[key] = state[key] === it[0] ? ohne : it[0]; render(); });
      el.appendChild(b);
    });
  }

  // Auswahlliste am Handy: erste Option ohne Filter, sonst gefüllt wie ein gewählter Chip.
  // Mit gruppe stehen die Optionen unter einer Überschrift, die nur in der geöffneten Liste erscheint (kurzer Chip).
  function auswahl(sel, leer, items, key, ohne, gruppe) {
    var optionen = items.map(function (it) { return '<option value="' + esc(it[0]) + '">' + esc(it[1]) + "</option>"; }).join("");
    sel.innerHTML = '<option value="">' + esc(leer) + "</option>" + (gruppe ? '<optgroup label="' + esc(gruppe) + '">' + optionen + "</optgroup>" : optionen);
    sel.value = state[key] === ohne ? "" : state[key];
    sel.classList.toggle("an", state[key] !== ohne);
  }

  function istFrei(e) { return !!e.freie_plaetze && e.freie_plaetze.status !== "keine"; }

  // Grundreihenfolge: freie Plätze zuerst (jetzt frei, bald frei, belegt). Innerhalb jeder Gruppe rückt die Liste
  // jeden Tag um eine Stelle weiter, so steht jeder Eintrag reihum oben. Am selben Tag sehen alle dieselbe Reihenfolge.
  var RANG = { jetzt: 0, ab: 1, keine: 2 };
  function tagesReihenfolge(eintraege) {
    var d = new Date();
    var tag = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
    var gruppen = [[], [], []];
    eintraege.slice().sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; }).forEach(function (e) {
      var rang = RANG[(e.freie_plaetze || {}).status];
      gruppen[rang == null ? 2 : rang].push(e);
    });
    return gruppen.reduce(function (liste, g) {
      var k = g.length ? tag % g.length : 0;
      return liste.concat(g.slice(k), g.slice(0, k));
    }, []);
  }

  function gefiltert() {
    var t = state.text.trim().toLowerCase();
    var liste = alle.filter(function (e) {
      if (state.ort !== "Alle" && e.ortsteil !== state.ort) return false;
      if (!passtAlter(e)) return false;
      if (state.frei && !istFrei(e)) return false;
      if (t) {
        var hay = [e.name, e.tagespflegestelle, e.ortsteil, (e.personen || []).join(" ")].join(" ").toLowerCase();
        if (hay.indexOf(t) === -1) return false;
      }
      return true;
    });
    if (state.nah) {
      liste.forEach(function (e) { e._km = e.standort ? K.entfernungKm(state.nah, [e.standort.lat, e.standort.lon]) : null; });
      liste.sort(function (a, b) {
        if (a._km == null) return 1; if (b._km == null) return -1; return a._km - b._km;
      });
    }
    // Wünsche sortieren nur: mehr erfüllte Wünsche zuerst, sonst bleibt die Reihenfolge (stabile Sortierung)
    if (state.wuensche.length) {
      liste.forEach(function (e) { e._wunsch = trefferZahl(e); });
      liste.sort(function (a, b) { return b._wunsch - a._wunsch; });
    }
    return liste;
  }

  // Liste mit Wünschen: oben, wer alles erfüllt; darunter die übrigen mit Hinweis auf der Karte
  function gridHtml(liste) {
    var n = state.wuensche.length;
    if (!n) return liste.map(karteHtml).join("");
    var ganz = liste.filter(function (e) { return e._wunsch === n; });
    var rest = liste.filter(function (e) { return e._wunsch < n; });
    var html = "";
    if (ganz.length) html += '<p class="grid-trenner" role="heading" aria-level="3">Passen zu ' + (n === 1 ? "Ihrem Wunsch" : "allen Wünschen") + "</p>" + ganz.map(karteHtml).join("");
    if (rest.length) html += '<p class="grid-trenner" role="heading" aria-level="3">' + (ganz.length ? "Weitere Kindertagespflegestellen" :
      "Niemand erfüllt " + (n === 1 ? "diesen Wunsch" : "alle Wünsche") + "<small>Sortiert danach, wie viele Wünsche passen.</small>") + "</p>" + rest.map(karteHtml).join("");
    return html;
  }

  // Inhalt des Fensters: Gruppen mit Chips, je Option die Zahl der passenden Einträge
  function dialogFuellen(liste) {
    var gruppen = [];
    OPTIONEN.forEach(function (o) {
      var g = gruppen.filter(function (x) { return x.name === o.gruppe; })[0];
      if (!g) gruppen.push(g = { name: o.gruppe, optionen: [] });
      g.optionen.push(o);
    });
    var box = $("#wunsch-gruppen"), fokus = document.activeElement && document.activeElement.getAttribute("data-wunsch");
    box.innerHTML = gruppen.map(function (g, i) {
      return '<div class="wunsch-gruppe"><p class="subgroup" id="wg-' + i + '">' + esc(g.name) + '</p><div class="pills" role="group" aria-labelledby="wg-' + i + '">' +
        g.optionen.map(function (o) {
          var zahl = liste.filter(o.erfuellt).length, an = state.wuensche.indexOf(o.key) !== -1;
          return '<button type="button" class="pill" data-wunsch="' + o.key + '" aria-pressed="' + an + '"' + (!zahl && !an ? " disabled" : "") +
            ' aria-label="' + esc(o.label) + ", " + zahl + (zahl === 1 ? " Kindertagespflegestelle" : " Kindertagespflegestellen") + '">' + esc(o.label) + ' <span class="zahl" aria-hidden="true">' + zahl + "</span></button>";
        }).join("") + "</div></div>";
    }).join("");
    if (fokus) { var b = box.querySelector('[data-wunsch="' + fokus + '"]'); if (b) b.focus(); } // Fokus nach dem Neuzeichnen halten
  }

  function wunschUmschalten(key) {
    var i = state.wuensche.indexOf(key);
    if (i === -1) state.wuensche.push(key); else state.wuensche.splice(i, 1);
    render();
  }

  function karteHtml(e) {
    var foto = e.fotos && e.fotos[0];
    var bild = foto ? '<img src="' + esc(foto.datei) + '" alt="' + esc(foto.alt || "") + '" loading="lazy">' :
      K.lasur(e.id) + '<span class="initials" aria-hidden="true">' + esc(K.initialen(e.name)) + '</span>'; // ohne „Foto folgt“: die Initialen zeigen schon, dass noch kein Foto da ist
    var dist = state.nah && e._km != null ? '<span class="distance">' + K.kmText(e._km) + "</span>" : "";
    var n = state.wuensche.length;
    var passt = !n || e._wunsch === n ? "" : '<p class="passt">' + (e._wunsch ? "Passt zu " + e._wunsch + " von " + n + " Wünschen" : "Passt zu keinem Ihrer Wünsche") + "</p>";
    var sub = e.betreuungsform === "grosstagespflege" ? (e.personen || []).join(" und ") : e.tagespflegestelle;
    var link = "profil.html?id=" + encodeURIComponent(e.id);
    return '<article class="card">' +
      '<div class="photo' + (foto ? "" : " ohne-foto") + '">' + bild + '<span class="status ' + K.freiKlasse(e) + '">' + esc(K.freiText(e)) + "</span>" + dist + "</div>" +
      '<div class="card-body"><div><h3><a href="' + link + '">' + esc(e.name) + "</a></h3>" + (sub && sub !== e.name ? '<p class="sub">' + esc(sub) + "</p>" : "") + passt + "</div>" +
      '<ul class="meta">' +
      "<li>" + K.ICON.ort + "<span>" + esc(e.ortsteil) + "</span></li>" +
      "<li>" + K.ICON.alter + "<span>" + esc(K.alterText(e.alter)) + "</span></li>" +
      (e.zeiten ? "<li>" + K.ICON.zeit + "<span>" + esc(e.zeiten) + "</span></li>" : "") +
      "<li>" + K.ICON.haus + "<span>" + esc(e.plaetze_gesamt + " Plätze · " + (K.BETREUUNGSFORM[e.betreuungsform] || "").replace("Im ", "im ").replace("In ", "in ")) + "</span></li>" +
      "</ul>" +
      "</div></article>";
  }

  function karteAktualisieren(liste) {
    if (!map) return;
    ebene.clearLayers();
    var punkte = [];
    liste.forEach(function (e) {
      if (!e.standort) return;
      var ll = [e.standort.lat, e.standort.lon];
      punkte.push(ll);
      L.circle(ll, K.kreisStil(e, e.standort.genauigkeit_m || C.karte.radiusMeter))
        .bindPopup('<strong><a href="profil.html?id=' + encodeURIComponent(e.id) + '">' + esc(e.name) + "</a></strong><br>" + esc(e.ortsteil) + " · " + esc(K.freiText(e)))
        .addTo(ebene);
    });
    if (state.nah) punkte.push(state.nah);
    if (punkte.length) map.fitBounds(L.latLngBounds(punkte).pad(0.25), { maxZoom: 14, animate: !K.ruhig });
  }

  function render() {
    var orte = (muster ? C.ortsteile : C.ortsteile.filter(function (o) { return alle.some(function (e) { return e.ortsteil === o; }); }))
      .map(function (o) { return [o, o]; });
    var alter = ALTER_KIND.map(function (a) { return [a[0], a[1]]; });
    pills($("#f-ort"), orte, "ort", "Alle");
    pills($("#f-alter"), alter, "alter", "alle");
    auswahl($("#s-ort"), "Ortsteil", orte, "ort", "Alle");
    auswahl($("#s-alter"), "Bitte wählen", alter, "alter", "alle", "Alter bei Betreuungsbeginn");
    $("#f-frei").setAttribute("aria-pressed", String(state.frei));
    $("#f-nah").setAttribute("aria-pressed", String(!!state.nah));

    var liste = gefiltert();
    var hart = !(state.ort === "Alle" && state.alter === "alle" && !state.frei && !state.text && !state.nah);
    var nurMuster = muster && !hart && !state.wuensche.length;
    $("#grid").innerHTML = gridHtml(nurMuster ? [window.KTP_MUSTER] : liste);
    $("#anzahl").textContent = nurMuster ? "Musterprofil" : liste.length === 1 ? "1 Kindertagespflegestelle" : liste.length + " Kindertagespflegestellen";
    var frei = liste.filter(istFrei).length;
    $("#frei-zahl").textContent = !state.frei && frei ? frei + " mit freiem Platz" : ""; // bei 0 oder aktivem Filter nichts
    $("#muster-hinweis").hidden = !nurMuster;
    $("#leer").hidden = liste.length > 0 || nurMuster;
    $("#grid").hidden = liste.length === 0 && !nurMuster;

    // Weitere Filter: Zähler am Knopf, gewählte Wünsche als Chips, Inhalt des Fensters
    var n = state.wuensche.length;
    var ganz = n ? liste.filter(function (e) { return e._wunsch === n; }).length : 0;
    $("#mehr-zahl").textContent = n ? String(n) : "";
    $("#f-mehr").setAttribute("aria-label", "Weitere Filter" + (n ? ", " + n + " gewählt" : ""));
    $("#wunsch-zeile").hidden = !n;
    $("#wunsch-chips").innerHTML = state.wuensche.map(function (k) {
      return '<button type="button" class="pill wunsch-weg" data-weg="' + k + '" aria-label="' + esc(OPT[k].label) + ' entfernen">' + esc(OPT[k].label) + X + "</button>";
    }).join("");
    var wunsch = n === 1 ? "Ihren Wunsch" : "alle Wünsche";
    var erfuellt = function (z) { return z === 1 ? " erfüllt " : " erfüllen "; };
    $("#mehr-treffer").textContent = !n ? "Noch kein Wunsch gewählt" :
      ganz ? ganz + " von " + liste.length + erfuellt(ganz) + wunsch : "Niemand erfüllt " + wunsch;
    if ($("#mehr-filter").open) dialogFuellen(liste);

    // Rückmeldung im Filterkasten: Trefferzahl und Zurücksetzen, sobald ein Filter aktiv ist (ohne Einträge nur Zurücksetzen)
    $("#filter-fuss").hidden = !hart && !n;
    var t = muster ? "" : hart ? liste.length + " von " + alle.length + (liste.length === 1 ? " passt" : " passen") + " zu Ihrer Auswahl" : "";
    if (n) t += hart ? (ganz ? ", " + ganz + " davon" + erfuellt(ganz) + wunsch : ", niemand davon erfüllt " + wunsch)
      : (ganz ? ganz + " von " + liste.length + erfuellt(ganz) + wunsch : "Niemand erfüllt " + wunsch);
    $("#treffer").textContent = t;
    karteAktualisieren(liste);
  }

  function nahAus() {
    state.nah = null;
    $("#nah-hinweis").textContent = "";
    if (ichMarker) { ichMarker.remove(); ichMarker = null; }
  }

  function reset() {
    state.ort = "Alle"; state.alter = "alle"; state.frei = false; state.text = ""; state.wuensche = [];
    $("#f-text").value = "";
    nahAus();
    render();
  }

  // Zweiter Klick schaltet die Sortierung nach Entfernung wieder aus
  function inDerNaehe() {
    if (state.nah) { nahAus(); render(); return; }
    var h = $("#nah-hinweis");
    if (!navigator.geolocation) { h.textContent = "Ihr Browser kann den Standort nicht bestimmen. Bitte wählen Sie einen Ortsteil."; return; }
    h.textContent = "Standort wird bestimmt …";
    navigator.geolocation.getCurrentPosition(function (pos) {
      state.nah = [pos.coords.latitude, pos.coords.longitude];
      h.textContent = "Sortiert nach Entfernung. Ihr Standort bleibt in Ihrem Browser und wird nicht gesendet.";
      if (map) {
        if (ichMarker) ichMarker.remove();
        ichMarker = L.circleMarker(state.nah, { radius: 7, color: "#2F3666", fillColor: "#3E4A84", fillOpacity: 1 }).bindTooltip("Ihr Standort").addTo(map);
      }
      render();
    }, function () {
      h.textContent = "Der Standort konnte nicht bestimmt werden. Bitte wählen Sie einen Ortsteil.";
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
  }

  // Namenssuche am Handy hinter der Lupe; beim Zuklappen wird die Suche geleert
  function lupe() {
    var b = $("#lupe"), offen = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(offen));
    $("#namensuche").classList.toggle("offen", offen);
    if (offen) $("#f-text").focus();
    else if (state.text) { state.text = ""; $("#f-text").value = ""; render(); }
  }

  $("#f-frei").addEventListener("click", function () { state.frei = !state.frei; render(); });
  $("#s-ort").addEventListener("change", function (ev) { state.ort = ev.target.value || "Alle"; render(); });
  $("#s-alter").addEventListener("change", function (ev) { state.alter = ev.target.value || "alle"; render(); });
  $("#f-text").addEventListener("input", function (ev) { state.text = ev.target.value; render(); });
  $("#f-nah").addEventListener("click", inDerNaehe);
  // i neben „Alter bei Betreuungsbeginn“: Erklärung auf- und zuklappen
  $("#alter-info-knopf").addEventListener("click", function () {
    var auf = this.getAttribute("aria-expanded") !== "true";
    this.setAttribute("aria-expanded", String(auf));
    $("#alter-info").hidden = !auf;
  });
  $("#lupe").addEventListener("click", lupe);

  // Fenster „Weitere Filter“ (natives dialog: Fokus bleibt im Fenster, Esc schließt)
  var dlg = $("#mehr-filter");
  $("#f-mehr").addEventListener("click", function () { dlg.returnValue = ""; dialogFuellen(gefiltert()); dlg.showModal(); });
  $("#wunsch-gruppen").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-wunsch]");
    if (b && !b.disabled) wunschUmschalten(b.getAttribute("data-wunsch"));
  });
  $("#mehr-reset").addEventListener("click", function () { state.wuensche = []; render(); });
  dlg.addEventListener("close", function () {
    if (dlg.returnValue === "zeigen") $(".results-head").scrollIntoView({ behavior: K.ruhig ? "auto" : "smooth", block: "start" });
    $("#f-mehr").focus({ preventScroll: dlg.returnValue === "zeigen" });
  });
  $("#wunsch-chips").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-weg]");
    if (!b) return;
    wunschUmschalten(b.getAttribute("data-weg"));
    var naechster = $("#wunsch-chips [data-weg]") || $("#f-mehr"); naechster.focus(); // Fokus nicht ins Leere fallen lassen
  });
  $("#reset").addEventListener("click", reset);
  $("#reset2").addEventListener("click", reset);

  // Teilen: Eltern geben die Seite weiter, Kindertagespflegepersonen den Link zum Eintragen
  var hier = location.origin + location.pathname;
  if (K.teilen($("#teilen-seite"), function () {
    return { title: document.title, text: "Freie Plätze in der Kindertagespflege in Werne:", url: hier };
  })) $("#weitersagen").hidden = false;
  K.teilen($("#teilen-kolleg"), function () {
    return { title: "Kostenfrei eintragen · " + C.seitenname, text: "Kindertagespflegepersonen in Werne können sich hier kostenfrei eintragen:", url: new URL("eintragen.html", hier).href };
  });

  K.ladeDaten().then(function (d) {
    muster = !d.eintraege.length && !!window.KTP_MUSTER;
    alle = tagesReihenfolge(d.eintraege);
    if (muster) {
      $("#leer-titel").textContent = "Noch keine Kindertagespflegestellen eingetragen";
      $("#leer-text").textContent = "Die Kindertagespflegepersonen in Werne tragen sich gerade ein. Schauen Sie bald wieder vorbei.";
    }
    standZeigen(d);
    render();
    K.karte($("#karte"), null, function (m) {
      map = m; ebene = L.layerGroup().addTo(map);
      render();
    });
  }).catch(function () {
    $("#grid").innerHTML = '<p class="small">Die Einträge konnten nicht geladen werden. Bitte versuchen Sie es später erneut.</p>';
  });
})();
