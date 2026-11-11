/* Eintragen und Ändern.
   Neu:     eintragen.html
   Ändern:  eintragen.html?token=<persönlicher Token>   (Demo: ?token=demo)
   Solange in config.js keine API eingetragen ist, läuft das Formular im Demo-Modus. */
(function () {
  "use strict";
  var K = window.KTP, C = K.C, esc = K.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = $("#eintrag-form");
  var token = new URLSearchParams(location.search).get("token");
  var bearbeiten = !!token;
  var demo = !C.api.eintragNeu;
  var MAX_FOTOS = 4, MAX_MB = 5, MAX_BYTES = MAX_MB * 1024 * 1024;
  var KANTE_VERKLEINERT = 2400; // längste Kante, wenn ein Foto über 5 MB verkleinert wird (der Server rechnet danach auf 1600 px)
  var ruhig = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MONATSNAMEN = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  var heute = new Date();
  var JETZT = heute.getFullYear() + "-" + ("0" + (heute.getMonth() + 1)).slice(-2); // aktueller Monat als YYYY-MM
  var karteVorher = false; // im Änderungsmodus: Kartenzustimmung bestand schon

  // Beispiel für den Demo-Änderungsmodus (entspricht data/tagespflege.json, Eintrag anna-musterfrau)
  var DEMO_EINTRAG = {
    personen: { vorname: "Anna", nachname: "Musterfrau", weitere: "" },
    tagespflegestelle: "Tagespflege Musterwiese", ortsteil: "Stockum",
    standort_angabe: { strasse: "Musterweg", einwilligung_karte: true },
    betreuungsform: "eigener_haushalt", plaetze_gesamt: 5, zeiten: "Mo–Fr, 7:30–14:30 Uhr", alter: ["u1", "u3"],
    freie_plaetze: { status: "ab", ab: "2027-02", anzahl: 1 },
    beschreibung: "", besonderheiten: ["waldorfpaedagogik", "vegetarisch", "garten", "nichtraucher", "mittagessen_gemeinsam"],
    besonderheiten_eigene: { schwerpunkte: [], essen: [], raeume: [], alltag: ["Eingewöhnung nach Berliner Modell"], sonstiges: [] },
    qualifikation: "Qualifizierung nach QHB",
    vertretung: "Feste Vertretung im Ortsteil", mahlzeiten: "Frühstück und Mittagessen, vegetarisch", sprachen: ["Deutsch", "Englisch"],
    kontaktweg: "beides", kontakt: { telefon: "02389 000000", email: "anna@example.org", email_oeffentlich: true, erreichbar: "Mo–Fr, 15–17 Uhr" },
    links: { website: "", instagram: "", facebook: "", weitere: "" }
  };

  // ---------- Felder aufbauen ----------
  function ortsteilOptionen() {
    var sel = $("#ortsteil");
    C.ortsteile.forEach(function (o) { var op = document.createElement("option"); op.textContent = o; op.value = o; sel.appendChild(op); });
  }
  // Je Gruppe die festen Punkte zum Ankreuzen und ein Feld für eigene Punkte (Vanessa, 09.11.2026)
  function besonderheitenOptionen() {
    var box = $("#besonderheiten-gruppen");
    K.GRUPPEN.forEach(function (g) {
      var p = document.createElement("p"); p.className = "subgroup"; p.textContent = g.name; box.appendChild(p);
      var d = document.createElement("div"); d.className = "options";
      d.innerHTML = K.BESONDERHEITEN.filter(function (b) { return b.gruppeKey === g.key; }).map(function (b) {
        return '<label class="opt"><input type="checkbox" name="besonderheiten" value="' + b.key + '">' + esc(b.label) + "</label>";
      }).join("");
      box.appendChild(d);
      var f = document.createElement("div"); f.className = "eigene-feld";
      f.innerHTML = '<label for="eigene-' + g.key + '">' + esc(g.feld) + ' <span class="label-zusatz">(mehrere mit Komma\u00a0trennen)</span></label>' +
        '<input id="eigene-' + g.key + '" name="eigene_' + g.key + '" type="text" maxlength="400" placeholder="' + esc(g.beispiel) + '">';
      box.appendChild(f);
    });
  }

  // Monat und Jahr als zwei Auswahlfelder. Gesendet wird YYYY-MM.
  // Jahre: aktuelles Jahr plus data-jahre weitere.
  function monatJahrOptionen() {
    $$(".monat-jahr").forEach(function (g) {
      var name = g.getAttribute("data-monat"), weitere = parseInt(g.getAttribute("data-jahre"), 10) || 3;
      var m = form.elements[name + "_monat"], j = form.elements[name + "_jahr"];
      MONATSNAMEN.forEach(function (n, i) { var o = document.createElement("option"); o.value = ("0" + (i + 1)).slice(-2); o.textContent = n; m.appendChild(o); });
      for (var y = heute.getFullYear(); y <= heute.getFullYear() + weitere; y++) { var o = document.createElement("option"); o.value = String(y); o.textContent = String(y); j.appendChild(o); }
    });
  }
  function monatTeile(name) { return { m: txt(name + "_monat"), j: txt(name + "_jahr") }; }
  function monatWert(name) { var t = monatTeile(name); return t.m && t.j ? t.j + "-" + t.m : ""; }
  function setzeMonat(name, ym) {
    var p = /^(\d{4})-(\d{2})$/.exec(String(ym || ""));
    if (!p) return;
    var j = form.elements[name + "_jahr"];
    if (!$$("option", j).some(function (o) { return o.value === p[1]; })) { // Jahr außerhalb der Liste ergänzen
      var o = document.createElement("option"); o.value = p[1]; o.textContent = p[1]; j.appendChild(o);
    }
    form.elements[name + "_monat"].value = p[2]; j.value = p[1];
  }

  // ---------- Sichtbarkeit abhängiger Felder ----------
  function abhaengig() {
    var fs = (form.elements.frei_status && form.elements.frei_status.value) || "";
    $("#feld-frei-ab").hidden = fs !== "ab";
    $("#feld-frei-anzahl").hidden = fs === "keine" || fs === "";
    var bf = form.elements.betreuungsform.value;
    $("#feld-weitere-personen").hidden = bf !== "grosstagespflege";
    var kw = form.elements.kontaktweg.value;
    $("#feld-email-oeffentlich").hidden = kw === "beratung" || kw === "";
    $("#hinweis-beratung").hidden = kw !== "beratung";
    $("#feld-strasse").hidden = !form.elements.einwilligung_karte.checked;
  }

  // ---------- Zähler und Fotos ----------
  function zaehler() {
    var t = form.elements.beschreibung;
    $("#beschreibung-zaehler").textContent = t.value.length + " von 600 Zeichen";
  }

  // Fotos sammeln: Jede Auswahl kommt dazu, statt die vorige zu ersetzen. Jedes Foto lässt sich einzeln entfernen.
  // Ein Foto über 5 MB wird im Browser verkleinert, die übrigen bleiben in jedem Fall stehen (Paula, Vanessa 09.11.2026).
  var fotoListe = []; // [{ datei: File, url: Vorschau }]
  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg>';

  function fotoVorschau() {
    var box = $("#foto-vorschau");
    box.innerHTML = fotoListe.map(function (f, i) {
      return '<li class="thumb"><img src="' + f.url + '" alt=""><button type="button" class="thumb-weg" data-foto="' + i + '" aria-label="Foto ' + (i + 1) + " entfernen: " + esc(f.datei.name) + '">' + X + "</button></li>";
    }).join("");
    $("#feld-foto-rechte").hidden = !fotoListe.length;
    var anzahl = $("#foto-anzahl");
    anzahl.textContent = fotoListe.length + " von " + MAX_FOTOS + (fotoListe.length === 1 ? " Foto" : " Fotos") + " ausgewählt";
    anzahl.hidden = !fotoListe.length;
  }

  function fotoMeldung(texte) {
    var el = $("#foto-meldung");
    el.textContent = texte.join(" ");
    el.hidden = !texte.length;
  }

  // Als data:-Adresse lesen. blob:-Adressen erlaubt die Content-Security-Policy der Seite nicht.
  function alsDataUrl(datei) {
    return new Promise(function (fertig, fehler) {
      var r = new FileReader();
      r.onload = function () { fertig(r.result); };
      r.onerror = function () { fehler(r.error); };
      r.readAsDataURL(datei);
    });
  }

  // Auf höchstens 2400 px und als JPEG; der Server macht daraus ohnehin WebP mit 1600 px
  function verkleinern(f) {
    return alsDataUrl(f).then(function (url) { return new Promise(function (fertig, fehler) {
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, KANTE_VERKLEINERT / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); // durchsichtige PNG nicht schwarz
        ctx.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) {
          if (!b || b.size > MAX_BYTES) return fehler(new Error("zu groß"));
          fertig(new File([b], f.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.85);
      };
      img.onerror = function () { fehler(new Error("nicht lesbar")); };
      img.src = url;
    }); });
  }

  function fotosHinzu(dateien) {
    var liste = Array.prototype.slice.call(dateien || []), meldungen = [];
    form.elements.fotos.value = ""; // dieselbe Datei lässt sich danach erneut wählen
    var kette = Promise.resolve();
    liste.forEach(function (f) {
      kette = kette.then(function () {
        if (fotoListe.length >= MAX_FOTOS) { meldungen.push("„" + f.name + "“ wurde nicht übernommen, es sind höchstens " + MAX_FOTOS + " Fotos möglich."); return; }
        if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { meldungen.push("„" + f.name + "“ ist kein Foto im Format JPEG, PNG oder WebP."); return; }
        var datei = f.size > MAX_BYTES ? verkleinern(f) : Promise.resolve(f);
        return datei.then(function (d) {
          return alsDataUrl(d).then(function (url) { fotoListe.push({ datei: d, url: url }); });
        }).catch(function () {
          meldungen.push(f.size > MAX_BYTES ? "„" + f.name + "“ ist größer als " + MAX_MB + " MB und ließ sich nicht verkleinern. Bitte wählen Sie ein kleineres Foto."
            : "„" + f.name + "“ ließ sich nicht öffnen. Bitte wählen Sie ein anderes Foto.");
        });
      });
    });
    kette.then(function () { fotoVorschau(); fotoMeldung(meldungen); });
  }

  function fotoEntfernen(i) {
    fotoListe.splice(i, 1);
    fotoVorschau(); fotoMeldung([]);
    var naechster = $('.thumb-weg[data-foto="' + Math.min(i, fotoListe.length - 1) + '"]') || form.elements.fotos;
    naechster.focus(); // Fokus nicht ins Leere fallen lassen
  }

  // ---------- Daten lesen und schreiben ----------
  function werte(name) { return $$('[name="' + name + '"]:checked', form).map(function (i) { return i.value; }); }
  function txt(name) { var el = form.elements[name]; return el ? String(el.value || "").trim() : ""; }

  function sammeln() {
    var fs = form.elements.frei_status.value;
    return {
      personen: { vorname: txt("vorname"), nachname: txt("nachname"), weitere: txt("weitere_personen") },
      tagespflegestelle: txt("tagespflegestelle"),
      ortsteil: txt("ortsteil"),
      standort_angabe: { strasse: form.elements.einwilligung_karte.checked ? txt("strasse") : "", einwilligung_karte: form.elements.einwilligung_karte.checked },
      betreuungsform: form.elements.betreuungsform.value,
      plaetze_gesamt: parseInt(txt("plaetze_gesamt"), 10) || null,
      zeiten: txt("zeiten"),
      alter: werte("alter"),
      freie_plaetze: { status: fs, ab: fs === "ab" ? monatWert("frei_ab") : "", anzahl: fs === "keine" ? 0 : (parseInt(txt("frei_anzahl"), 10) || 1) },
      beschreibung: txt("beschreibung"),
      besonderheiten: werte("besonderheiten"),
      besonderheiten_eigene: eigeneSammeln(),
      qualifikation: txt("qualifikation"),
      vertretung: txt("vertretung"),
      mahlzeiten: txt("mahlzeiten"),
      sprachen: txt("sprachen").split(/[,;]/).map(function (s) { return s.trim(); }).filter(Boolean),
      fotos_rechte_bestaetigt: form.elements.foto_rechte.checked,
      kontaktweg: form.elements.kontaktweg.value,
      kontakt: { telefon: txt("telefon"), email: txt("email"), email_oeffentlich: form.elements.email_oeffentlich.checked, erreichbar: txt("erreichbar") },
      links: { website: txt("website"), instagram: txt("instagram"), facebook: txt("facebook"), weitere: txt("weitere_link") },
      einwilligung_veroeffentlichung: form.elements.einwilligung.checked,
      einwilligung_zeitpunkt: new Date().toISOString()
    };
  }

  function eigeneSammeln() {
    var aus = {};
    K.GRUPPEN.forEach(function (g) {
      aus[g.key] = txt("eigene_" + g.key).split(/[,;]/).map(function (t) { return t.trim(); }).filter(Boolean);
    });
    return aus;
  }

  function setze(name, wert) {
    var el = form.elements[name];
    if (!el || wert == null) return;
    if (el instanceof RadioNodeList || (el.length && el[0] && el[0].type === "radio")) {
      $$('[name="' + name + '"]', form).forEach(function (i) { i.checked = i.value === wert; });
    } else if (el.type === "checkbox") { el.checked = !!wert; } else { el.value = wert; }
  }
  function setzeListe(name, liste) {
    $$('[name="' + name + '"]', form).forEach(function (i) { i.checked = (liste || []).indexOf(i.value) > -1; });
  }

  function befuellen(d) {
    setze("vorname", d.personen.vorname); setze("nachname", d.personen.nachname); setze("weitere_personen", d.personen.weitere);
    setze("tagespflegestelle", d.tagespflegestelle); setze("ortsteil", d.ortsteil);
    karteVorher = !!(d.standort_angabe && d.standort_angabe.einwilligung_karte);
    setze("einwilligung_karte", karteVorher);
    setze("strasse", d.standort_angabe && d.standort_angabe.strasse);
    if (karteVorher) $("#hinweis-strasse").textContent = "Nur ausfüllen, wenn sich Ihre Straße geändert hat. Die Straße wird nicht veröffentlicht.";
    setze("betreuungsform", d.betreuungsform); setze("plaetze_gesamt", d.plaetze_gesamt); setze("zeiten", d.zeiten);
    setzeListe("alter", d.alter);
    setze("frei_status", d.freie_plaetze.status); setzeMonat("frei_ab", d.freie_plaetze.ab); setze("frei_anzahl", d.freie_plaetze.anzahl || "");
    setze("beschreibung", d.beschreibung); setzeListe("besonderheiten", d.besonderheiten);
    K.GRUPPEN.forEach(function (g) { setze("eigene_" + g.key, ((d.besonderheiten_eigene || {})[g.key] || []).join(", ")); });
    setze("qualifikation", d.qualifikation); setze("vertretung", d.vertretung); setze("mahlzeiten", d.mahlzeiten);
    setze("sprachen", (d.sprachen || []).join(", "));
    setze("kontaktweg", d.kontaktweg); setze("telefon", d.kontakt.telefon); setze("email", d.kontakt.email);
    setze("email_oeffentlich", d.kontakt.email_oeffentlich === true); setze("erreichbar", d.kontakt.erreichbar);
    setze("website", d.links.website); setze("instagram", d.links.instagram); setze("facebook", d.links.facebook); setze("weitere_link", d.links.weitere);
    setze("einwilligung", true);
    abhaengig(); zaehler();
  }

  // ---------- Prüfung ----------
  function pruefen(d) {
    var f = [];
    function fehler(feld, text) { f.push({ feld: feld, text: text }); }
    $$(".field.invalid", form).forEach(function (el) { el.classList.remove("invalid"); });
    if (!d.personen.vorname) fehler("vorname", "Bitte Ihren Vornamen angeben.");
    if (!d.personen.nachname) fehler("nachname", "Bitte Ihren Nachnamen angeben.");
    if (!d.ortsteil) fehler("ortsteil", "Bitte den Ortsteil wählen.");
    // Im Änderungsmodus bleibt der bisherige Kartenpunkt, wenn das Straßenfeld leer ist
    if (d.standort_angabe.einwilligung_karte && !d.standort_angabe.strasse && !(bearbeiten && karteVorher)) fehler("strasse", "Bitte die Straße angeben oder die Karte abwählen.");
    if (!d.betreuungsform) fehler("betreuungsform", "Bitte den Betreuungsort wählen.");
    if (!d.plaetze_gesamt || d.plaetze_gesamt < 1 || d.plaetze_gesamt > 10) fehler("plaetze_gesamt", "Bitte die Zahl der Betreuungsplätze angeben.");
    if (!d.zeiten) fehler("zeiten", "Bitte die Betreuungszeiten angeben.");
    if (!d.alter.length) fehler("alter", "Bitte mindestens eine Altersgruppe wählen.");
    if (!d.freie_plaetze.status) fehler("frei_status", "Bitte angeben, ob Plätze frei sind.");
    if (d.freie_plaetze.status === "ab") {
      var fa = monatTeile("frei_ab");
      if (!fa.m || !fa.j) fehler(fa.m ? "frei_ab_jahr" : "frei_ab_monat", "Bitte Monat und Jahr wählen, ab dem ein Platz frei ist.");
      else if (d.freie_plaetze.ab <= JETZT) fehler("frei_ab_monat", "Dieser Monat hat schon begonnen. Wählen Sie dann bitte „Jetzt frei“.");
    }
    if (d.beschreibung.length > 600) fehler("beschreibung", "Der Text ist länger als 600 Zeichen.");
    if (d.besonderheiten.indexOf("tiere") > -1 && d.besonderheiten.indexOf("keine_tiere") > -1) fehler("besonderheiten", "Bitte entweder „Tiere im Haushalt“ oder „Keine Tiere im Haushalt“ wählen.");
    if (!d.kontaktweg) fehler("kontaktweg", "Bitte wählen, wie Eltern Sie erreichen.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.kontakt.email)) fehler("email", "Bitte eine gültige E\u2011Mail-Adresse angeben.");
    if (d.kontaktweg !== "beratung" && !d.kontakt.telefon && !d.kontakt.email_oeffentlich) fehler("telefon", "Für den direkten Kontakt bitte eine Telefonnummer angeben oder die E\u2011Mail-Adresse anzeigen lassen.");
    if (fotoListe.length && !d.fotos_rechte_bestaetigt) fehler("foto_rechte", "Bitte bestätigen Sie die Angaben zu den Fotos.");
    if (!d.einwilligung_veroeffentlichung) fehler("einwilligung", "Ohne Einwilligung können wir Ihre Angaben nicht veröffentlichen.");

    if (f.length) { zeigeFehler(f); return false; }
    $("#form-fehler").hidden = true;
    return true;
  }

  // Fehlerliste anzeigen und Felder markieren. f: [{ feld, text }], aus der eigenen Prüfung oder vom Server.
  function zeigeFehler(f) {
    f.forEach(function (x) {
      var el = form.elements[x.feld] || form.elements[x.feld + "_monat"]; // Server nennt Monatsfelder ohne _monat
      var node = el && (el.length && !el.tagName ? el[0] : el);
      var feld = node && node.closest(".field");
      if (feld) feld.classList.add("invalid");
    });
    var box = $("#form-fehler");
    box.innerHTML = "<strong>Bitte prüfen Sie noch " + (f.length === 1 ? "eine Angabe" : f.length + " Angaben") + ":</strong><ul>" +
      f.map(function (x) { return "<li>" + esc(x.text) + "</li>"; }).join("") + "</ul>";
    box.hidden = false;
    box.focus();
  }

  // ---------- Senden ----------
  function erfolg(titel, text, json) {
    form.hidden = true;
    var s = $("#erfolg");
    $("#erfolg-titel").textContent = titel;
    $("#erfolg-text").textContent = text;
    if (json) {
      $("#erfolg-demo").hidden = false;
      $("#erfolg-json").textContent = JSON.stringify(json, null, 2);
    }
    s.hidden = false;
    s.scrollIntoView({ behavior: ruhig ? "auto" : "smooth", block: "start" });
  }

  var TEXT_NEU = "Sobald wir Ihren Eintrag geprüft und freigegeben haben, erscheint Ihr Profil in der Übersicht. Sie bekommen dann eine E‑Mail mit Ihrem persönlichen Link zum Ändern.";
  // Neue Fotos prüfen wir vor der Veröffentlichung (Kinderschutz, Karl 07.11.2026)
  var TEXT_FOTOS_PRUEFUNG = "Ihre Änderungen sind online. Ihre neuen Fotos erscheinen, sobald wir sie geprüft haben. Bis dahin bleiben die bisherigen sichtbar.";

  function senden(d) {
    var btn = $("#absenden");
    if (demo) {
      erfolg(bearbeiten ? "Änderungen gespeichert" : "Danke, Ihr Eintrag ist eingegangen",
        bearbeiten ? (fotoListe.length ? TEXT_FOTOS_PRUEFUNG : "Ihre Änderungen sind sofort online.") : TEXT_NEU, d);
      return;
    }
    var fd = new FormData();
    fd.append("daten", JSON.stringify(d));
    // "fotos[]": so kommen mehrere Fotos auch an, wenn der Server den Rumpf nicht selbst liest
    fotoListe.slice(0, MAX_FOTOS).forEach(function (f) { fd.append("fotos[]", f.datei, f.datei.name); });
    if (form.elements.firma.value) return; // Honigtopf gegen Spam
    btn.disabled = true; btn.textContent = "Wird gesendet …";
    function knopfZurueck() { btn.disabled = false; btn.textContent = bearbeiten ? "Änderungen speichern" : "Eintrag absenden"; }
    var url = bearbeiten ? C.api.eintragAendern + "?token=" + encodeURIComponent(token) : C.api.eintragNeu;
    fetch(url, { method: bearbeiten ? "PUT" : "POST", body: fd })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, ok: r.ok, j: j }; });
      })
      .then(function (a) {
        if (a.ok) {
          erfolg(bearbeiten ? "Änderungen gespeichert" : "Danke, Ihr Eintrag ist eingegangen",
            !bearbeiten ? TEXT_NEU : a.j && a.j.fotos_pruefung ? TEXT_FOTOS_PRUEFUNG : "Ihre Änderungen sind online.");
          return;
        }
        knopfZurueck();
        if (a.status === 401 && bearbeiten) { form.hidden = true; $("#link-ungueltig").hidden = false; return; }
        // 400 und 429: Der Server sagt, was nicht passt
        if ((a.status === 400 || a.status === 429) && a.j && a.j.fehler && a.j.fehler.length) { zeigeFehler(a.j.fehler); return; }
        throw new Error(a.status);
      })
      .catch(function () {
        knopfZurueck();
        var box = $("#form-fehler");
        box.innerHTML = "<strong>Das hat nicht geklappt.</strong> Bitte versuchen Sie es später noch einmal oder schreiben Sie an " + esc(C.betreiber.kontakt) + ".";
        box.hidden = false; box.focus();
      });
  }

  function loeschen() {
    if (!$("#loeschen-bestaetigen").checked) { $("#loeschen-hinweis").textContent = "Bitte bestätigen Sie zuerst das Löschen."; return; }
    if (demo) { erfolg("Eintrag gelöscht", "Ihr Eintrag und Ihre Daten werden gelöscht. Im Demo-Modus wurde nichts gelöscht."); $("#loeschen-box").hidden = true; return; }
    fetch(C.api.eintragLoeschen + "?token=" + encodeURIComponent(token), { method: "DELETE" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); erfolg("Eintrag gelöscht", "Ihr Eintrag ist nicht mehr sichtbar. Ihre Daten werden gelöscht."); $("#loeschen-box").hidden = true; })
      .catch(function () { $("#loeschen-hinweis").textContent = "Das Löschen hat nicht geklappt. Bitte schreiben Sie an " + C.betreiber.kontakt + "."; });
  }

  // ---------- Start ----------
  ortsteilOptionen();
  besonderheitenOptionen();
  monatJahrOptionen();
  form.addEventListener("change", abhaengig);
  form.elements.beschreibung.addEventListener("input", zaehler);
  form.elements.fotos.addEventListener("change", function (ev) { fotosHinzu(ev.target.files); });
  $("#foto-vorschau").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-foto]");
    if (b) fotoEntfernen(parseInt(b.getAttribute("data-foto"), 10));
  });
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var d = sammeln();
    if (pruefen(d)) senden(d);
  });
  if (demo) $("#demo-hinweis").hidden = false;

  if (bearbeiten) {
    document.title = "Angaben ändern · " + C.seitenname;
    $("#kopf-eyebrow").textContent = "Angaben ändern";
    $("#kopf-titel").innerHTML = "Ihre Angaben <em>ändern</em>";
    $("#kopf-lead").textContent = "Ändern Sie, was nicht mehr stimmt, zum Beispiel freie Plätze oder Betreuungszeiten. Ihre Änderungen sind sofort online, neue Fotos nach unserer Prüfung.";
    $("#foto-hinweis-aendern").hidden = false;
    $("#kopf-schritte").hidden = true;
    $("#absenden").textContent = "Änderungen speichern";
    $("#loeschen-box").hidden = false;
    $("#loeschen-btn").addEventListener("click", loeschen);
    $("#edit-banner").hidden = false;
    if (demo || token === "demo") {
      befuellen(DEMO_EINTRAG);
    } else {
      fetch(C.api.eintragLesen + "?token=" + encodeURIComponent(token))
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(befuellen)
        .catch(function () {
          form.hidden = true;
          $("#link-ungueltig").hidden = false;
        });
    }
  }
  abhaengig(); zaehler();
})();
