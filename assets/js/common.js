/* Gemeinsame Hilfsfunktionen. Klassische Skripte ohne Build-Schritt, damit die Seite
   auf jedem einfachen Webserver läuft. */
(function () {
  "use strict";
  var C = window.KTP_CONFIG;

  var BETREUUNGSFORM = {
    eigener_haushalt: "Im eigenen Haushalt",
    angemietete_raeume: "In angemieteten Räumen",
    grosstagespflege: "Großtagespflege"
  };

  var ALTER = [
    { key: "u1", label: "Unter 1 Jahr" },
    { key: "u3", label: "1–3 Jahre" },
    { key: "ue3", label: "Über 3 Jahre" }
  ];

  // Besonderheiten in fünf Gruppen (Vanessa, 09.11.2026). Je Gruppe: Schlüssel, Name, Farbfläche der Chips im Profil,
  // Beschriftung und Beispiel für das Feld mit eigenen Punkten. Eigene Punkte stehen im Profil, gefiltert wird nur
  // nach den festen (Karl, 09.11.2026). Was oft genannt wird, kommt in die feste Liste.
  var GRUPPEN = [
    { key: "schwerpunkte", name: "Schwerpunkte", farbe: "#F8E2D8", feld: "Weitere Schwerpunkte", beispiel: "z. B. Montessori, Tanz" },
    { key: "essen", name: "Essen", farbe: "#F8EBC6", feld: "Weiteres zum Essen", beispiel: "z. B. laktosefrei" },
    { key: "raeume", name: "Betreuungsräume", farbe: "#E4E7F4", feld: "Weiteres zu den Räumen", beispiel: "z. B. Kuschelecke" },
    { key: "alltag", name: "Alltag", farbe: "#E4EDDA", feld: "Weiteres zum Alltag", beispiel: "z. B. Individuelle Eingewöhnung" },
    { key: "sonstiges", name: "Sonstiges", farbe: "#ECE6EE", feld: "Weiteres", beispiel: "z. B. Gebärdensprache" }
  ];

  // Feste Besonderheiten. Reihenfolge = Reihenfolge in Formular, Profil und „Weitere Filter“.
  // Gleiche Liste im Backend: backend/lib/pruefung.php (BESONDERHEITEN), backend/lib/admin.php, tools/pruefen.mjs, Schema.
  // Entfallen am 09.11.2026: Mittagessen, Früh, Spät, Feste Vertretung (Gruppe „Zeiten und Vertretung“).
  var BESONDERHEITEN = [
    ["schwerpunkte", "bewegung", "Bewegung"],
    ["schwerpunkte", "freispiel", "Freispiel"],
    ["schwerpunkte", "sprachfoerderung", "Sprachförderung"],
    ["schwerpunkte", "kreativitaet", "Kreativität"],
    ["schwerpunkte", "musik", "Musik"],
    ["schwerpunkte", "waldorfpaedagogik", "Waldorfpädagogik"],
    ["schwerpunkte", "natur", "Natur"],
    ["schwerpunkte", "selbststaendigkeit", "Selbstständigkeit"],
    ["essen", "frisch_gekocht", "Frisch gekocht"],
    ["essen", "vegetarisch", "Vegetarisch"],
    // „auf Wunsch“: Die DGE (2024) spricht für Kleinkinder keine Empfehlung für eine rein vegane Ernährung aus
    ["essen", "vegan", "Vegan auf Wunsch"],
    ["essen", "bio", "Überwiegend Bio"],
    ["essen", "zuckerarm", "Wenig Zucker"],
    // neutral statt „Halal“: kein Rückschluss auf die Religion der Kindertagespflegeperson (Art. 9 DSGVO)
    ["essen", "ohne_schweinefleisch", "Ohne Schweinefleisch"],
    ["raeume", "betreuungsraum", "Eigener Betreuungsraum"],
    ["raeume", "schlafraum", "Eigener Schlafraum"],
    ["raeume", "bewegungsflaeche", "Bewegungsfläche"],
    ["raeume", "garten", "Eigener Garten"],
    ["raeume", "nichtraucher", "Nichtraucherhaushalt"],
    ["raeume", "tiere", "Tiere im Haushalt"],
    ["raeume", "keine_tiere", "Keine Tiere im Haushalt"],
    ["raeume", "barrierearm", "Barrierearm"],
    ["alltag", "fruehstueck_gemeinsam", "Gemeinsames Frühstück"],
    ["alltag", "mittagessen_gemeinsam", "Gemeinsames Mittagessen"],
    ["alltag", "schlafen_bedarf", "Schlafen nach Bedarf"],
    ["alltag", "morgenkreis", "Morgenkreis"],
    ["alltag", "draussen_taeglich", "Täglich draußen"],
    ["alltag", "waldtage", "Regelmäßig im Wald"],
    ["alltag", "spielplatz", "Regelmäßig auf dem Spielplatz"],
    ["sonstiges", "inklusion", "Inklusion möglich"],
    ["sonstiges", "mehrsprachig", "Mehrsprachig"],
    // Randzeitenbetreuung: Kindertagespflege vor oder nach den Öffnungszeiten von Kita oder Offener Ganztagsschule
    // (ergänzende Kindertagespflege, § 23 Abs. 1 KiBiz)
    ["sonstiges", "randzeiten", "Randzeitenbetreuung"],
    // nicht in Vanessas Liste, auf Karls Wunsch behalten (09.11.2026)
    ["sonstiges", "fachkraft", "Pädagogische Fachkraft"]
  ].map(function (b) {
    var g = GRUPPEN.filter(function (x) { return x.key === b[0]; })[0];
    return { key: b[1], label: b[2], gruppe: g.name, gruppeKey: g.key, farbe: g.farbe };
  });

  // Farbpaare für Platzhalterbilder (Lasur)
  var PALETTEN = [
    { bg: "#F8E2D8", c1: "#F2C6B4", c2: "#F0CF7E" },
    { bg: "#E4E7F4", c1: "#AEB8DE", c2: "#F2C6B4" },
    { bg: "#F8EBC6", c1: "#F0CF7E", c2: "#B9CDA5" },
    { bg: "#E4EDDA", c1: "#B9CDA5", c2: "#F0CF7E" },
    { bg: "#F8E2D8", c1: "#F2C6B4", c2: "#AEB8DE" },
    { bg: "#E4E7F4", c1: "#AEB8DE", c2: "#B9CDA5" }
  ];

  var MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function istPlatzhalter(s) { return typeof s === "string" && /^\[.*\]$/.test(s.trim()); }

  function sichereUrl(u) {
    if (!u || istPlatzhalter(u)) return null;
    var s = String(u).trim();
    if (/^www\./i.test(s)) s = "https://" + s;
    if (!/^https?:\/\//i.test(s)) return null;
    try { return new URL(s).href; } catch (e) { return null; }
  }

  function instagramUrl(u) {
    if (!u || istPlatzhalter(u)) return null;
    var s = String(u).trim();
    if (/^@[\w.]+$/.test(s)) return "https://www.instagram.com/" + s.slice(1) + "/";
    return sichereUrl(s);
  }

  function telHref(t) {
    if (!t || istPlatzhalter(t)) return null;
    var n = String(t).replace(/[^\d+]/g, "");
    return n.length >= 5 ? "tel:" + n : null;
  }

  function mailHref(m) {
    if (!m || istPlatzhalter(m)) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m) ? "mailto:" + m : null;
  }

  function monat(ym) {
    if (!ym) return "";
    var p = String(ym).split("-");
    var m = parseInt(p[1], 10);
    return (MONATE[m - 1] || "") + " " + p[0];
  }

  function datum(iso) {
    if (!iso) return "";
    var p = String(iso).split("-");
    return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : iso;
  }

  function freiText(e) {
    var f = e.freie_plaetze || {};
    if (f.status === "jetzt") {
      var n = f.anzahl || 0;
      return n > 1 ? n + " Plätze frei" : (n === 1 ? "1 Platz frei" : "Plätze frei");
    }
    if (f.status === "ab") return "Frei ab " + monat(f.ab);
    return "Derzeit belegt";
  }

  function freiKlasse(e) { return "st-" + ((e.freie_plaetze && e.freie_plaetze.status) || "keine"); }

  function freiDetail(e) {
    var f = e.freie_plaetze || {};
    if (f.status === "jetzt") return freiText(e);
    if (f.status === "ab") return (f.anzahl > 1 ? f.anzahl + " Plätze" : "1 Platz") + " ab " + monat(f.ab);
    return "Derzeit keine freien Plätze";
  }

  function alterText(a) {
    a = a || [];
    var u1 = a.indexOf("u1") > -1, u3 = a.indexOf("u3") > -1, ue3 = a.indexOf("ue3") > -1;
    if (u1 && u3 && ue3) return "ab 0 Jahren";
    if (u1 && u3) return "0–3 Jahre";
    if (u3 && ue3) return "ab 1 Jahr";
    if (u1 && ue3) return "unter 1 und über 3 Jahre";
    if (u1) return "unter 1 Jahr";
    if (u3) return "1–3 Jahre";
    if (ue3) return "über 3 Jahre";
    return "";
  }

  function initialen(name) {
    var w = String(name || "").replace(/[^\p{L}\s-]/gu, "").split(/\s+/).filter(Boolean);
    if (!w.length) return "";
    return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
  }

  function palette(id) {
    var h = 0, s = String(id || "");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return PALETTEN[h % PALETTEN.length];
  }

  // Lasur-Fläche als Platzhalterbild
  function lasur(id, w, h, filter) {
    var p = palette(id);
    w = w || 400; h = h || 275;
    return '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect width="' + w + '" height="' + h + '" fill="' + p.bg + '"/>' +
      '<g filter="url(#' + (filter || "lasur-s") + ')">' +
      '<ellipse cx="' + (w * 0.35) + '" cy="' + (h * 0.4) + '" rx="' + (w * 0.42) + '" ry="' + (h * 0.44) + '" fill="' + p.c1 + '" style="mix-blend-mode:multiply"/>' +
      '<ellipse cx="' + (w * 0.75) + '" cy="' + (h * 0.73) + '" rx="' + (w * 0.35) + '" ry="' + (h * 0.36) + '" fill="' + p.c2 + '" opacity=".75" style="mix-blend-mode:multiply"/>' +
      "</g></svg>";
  }

  var I = function (d, s) {
    return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  };
  var ICON = {
    ort: I('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    alter: I('<circle cx="12" cy="8" r="4"/><path d="M5 21c.8-4 3.5-6 7-6s6.2 2 7 6"/>'),
    zeit: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    haus: I('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.8V20h13V9.8"/>'),
    pfeil: I('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
    tel: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>', 20),
    mail: I('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/>', 20),
    uhr: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 20),
    globus: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>', 20),
    link: I('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', 20)
  };

  function entfernungKm(a, b) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (b[0] - a[0]) * toRad, dLon = (b[1] - a[1]) * toRad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * toRad) * Math.cos(b[0] * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  function kmText(km) {
    var v = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
    return "ca. " + String(v).replace(".", ",") + " km";
  }

  // Daten laden. Über einen Webserver per fetch, bei Doppelklick (file://) aus data/tagespflege.js.
  function ladeDaten() {
    function ausSkript() {
      return new Promise(function (resolve, reject) {
        if (window.KTP_DATEN) return resolve(window.KTP_DATEN);
        var s = document.createElement("script");
        s.src = "data/tagespflege.js";
        s.onload = function () { window.KTP_DATEN ? resolve(window.KTP_DATEN) : reject(new Error("Keine Daten")); };
        s.onerror = function () { reject(new Error("Daten konnten nicht geladen werden")); };
        document.head.appendChild(s);
      });
    }
    var quelle = location.protocol === "file:" ? ausSkript() :
      fetch(C.datenUrl, { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .catch(ausSkript);
    return quelle.then(function (d) {
        var liste = (d.eintraege || []).filter(function (e) { return e.status === "freigegeben"; });
        return { stand: d.stand, eintraege: liste };
      });
  }

  // Wer in den Systemeinstellungen „Bewegung reduzieren“ gewählt hat, bekommt keine Kartenanimationen
  var ruhig = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Karte mit optionaler Einwilligung. callback(map) wird aufgerufen, sobald die Karte steht.
  function karte(el, optionen, callback) {
    var wrap = el.parentElement;
    function bauen() {
      if (!window.L) return;
      var map = L.map(el, { scrollWheelZoom: false, zoomControl: true, attributionControl: true, zoomAnimation: !ruhig, fadeAnimation: !ruhig, markerZoomAnimation: !ruhig, inertia: !ruhig })
        .setView(optionen && optionen.mitte || C.karte.mitte, optionen && optionen.zoom || C.karte.zoom);
      map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
      L.tileLayer(C.karte.tileUrl, { maxZoom: 17, attribution: C.karte.attribution }).addTo(map);
      callback(map);
    }
    if (!C.karte.einwilligungNoetig) return bauen();
    var o = document.createElement("div");
    o.className = "map-consent";
    o.innerHTML = '<div class="inner"><p>Beim Laden der Karte wird Ihre IP\u2011Adresse an OpenStreetMap übertragen, möglicherweise auch in Länder außerhalb der EU. Mehr in der <a href="datenschutz.html#karte">Datenschutzerklärung</a>.</p>' +
      '<button type="button" class="btn btn-primary">Karte laden</button></div>' +
      (C.karte.vorschauBild ? '<p class="karte-quelle">Kartenbild © <a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">OpenStreetMap</a></p>' : "");
    // Vorschaubild liegt auf dem eigenen Server: zeigt, was nach dem Klick kommt, ohne Daten an Dritte
    if (C.karte.vorschauBild) wrap.style.backgroundImage = 'url("' + C.karte.vorschauBild + '")';
    wrap.appendChild(o);
    o.querySelector("button").addEventListener("click", function () { o.remove(); wrap.style.backgroundImage = ""; bauen(); });
  }

  // Status auf der Karte: Farbe plus Linienart (durchgezogen, gestrichelt, gepunktet),
  // damit er nicht nur an der Farbe hängt. Farben mit mindestens 3:1 auf allen Kartengründen.
  var KREIS = {
    jetzt: { farbe: "#3F6B33", linie: null },
    ab: { farbe: "#8A6418", linie: "8 6" },
    keine: { farbe: "#5F5577", linie: "2 6" }
  };
  function farbeFrei(e) {
    var s = e.freie_plaetze && e.freie_plaetze.status;
    return (KREIS[s] || KREIS.keine).farbe;
  }
  function kreisStil(e, radius) {
    var k = KREIS[e.freie_plaetze && e.freie_plaetze.status] || KREIS.keine;
    return { radius: radius, color: k.farbe, weight: 3, dashArray: k.linie, fillColor: k.farbe, fillOpacity: .22 };
  }

  // Teilen: am Handy öffnet sich das Teilen-Menü des Geräts (WhatsApp, Nachrichten …), dabei geht nichts
  // an Dritte, solange niemand eine App wählt. Ohne Teilen-Menü wird der Link kopiert.
  // Kann der Browser beides nicht, bleibt der Knopf verborgen. Gibt zurück, ob der Knopf sichtbar ist.
  function teilen(btn, daten) {
    if (!btn) return false;
    var kannTeilen = typeof navigator.share === "function";
    var kannKopieren = !!(navigator.clipboard && window.isSecureContext);
    if (!kannTeilen && !kannKopieren) return false;
    var status = document.createElement("span");
    status.className = "teilen-status"; status.setAttribute("role", "status");
    btn.insertAdjacentElement("afterend", status);
    btn.hidden = false;
    btn.addEventListener("click", function () {
      var d = daten();
      if (kannTeilen) { navigator.share(d).catch(function () {}); return; } // Abbrechen ist kein Fehler
      navigator.clipboard.writeText(d.url).then(function () {
        status.textContent = "Link kopiert";
        setTimeout(function () { status.textContent = ""; }, 4000);
      }, function () { status.textContent = "Kopieren nicht möglich"; });
    });
    return true;
  }

  // Werte aus der Konfiguration in Elemente mit data-cfg="pfad.zum.wert" schreiben
  function cfgEinsetzen() {
    document.querySelectorAll("[data-cfg]").forEach(function (el) {
      var v = el.getAttribute("data-cfg").split(".").reduce(function (o, k) { return o && o[k]; }, C);
      if (v == null) return;
      el.textContent = v;
      if (istPlatzhalter(v)) el.classList.add("ph");
    });
    document.querySelectorAll("[data-cfg-href]").forEach(function (el) {
      var v = el.getAttribute("data-cfg-href").split(".").reduce(function (o, k) { return o && o[k]; }, C);
      var h = telHref(v) || mailHref(v) || sichereUrl(v);
      if (h) el.setAttribute("href", h); else el.removeAttribute("href");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cfgEinsetzen); else cfgEinsetzen();

  // Eigene Punkte einer Gruppe. Ältere öffentliche Dateien kennen nur ein Textfeld „besonderheiten_weitere“,
  // das steht dann einzeln unter Sonstiges, bis der Server die Datei neu geschrieben hat.
  function eigenePunkte(e, gruppe) {
    var eigene = (e.besonderheiten_eigene || {})[gruppe];
    if (Array.isArray(eigene)) return eigene;
    if (gruppe === "sonstiges" && typeof e.besonderheiten_weitere === "string") {
      return e.besonderheiten_weitere.split(/[,;]/).map(function (t) { return t.trim(); }).filter(Boolean);
    }
    return [];
  }

  window.KTP = {
    C: C, esc: esc, sichereUrl: sichereUrl, instagramUrl: instagramUrl, telHref: telHref, mailHref: mailHref,
    istPlatzhalter: istPlatzhalter, monat: monat, datum: datum, freiText: freiText, freiKlasse: freiKlasse, freiDetail: freiDetail,
    alterText: alterText, initialen: initialen, lasur: lasur, palette: palette, ICON: ICON,
    BETREUUNGSFORM: BETREUUNGSFORM, ALTER: ALTER, BESONDERHEITEN: BESONDERHEITEN, GRUPPEN: GRUPPEN, eigenePunkte: eigenePunkte,
    entfernungKm: entfernungKm, kmText: kmText, ladeDaten: ladeDaten, karte: karte, farbeFrei: farbeFrei, kreisStil: kreisStil,
    ruhig: ruhig, teilen: teilen
  };
})();
