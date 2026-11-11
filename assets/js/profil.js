/* Profilseite: profil.html?id=<id> */
(function () {
  "use strict";
  var K = window.KTP, C = K.C, esc = K.esc;
  var $ = function (s) { return document.querySelector(s); };
  var id = new URLSearchParams(location.search).get("id");

  function zeile(label, wert) {
    return wert ? "<div><dt>" + esc(label) + "</dt><dd>" + esc(wert) + "</dd></div>" : "";
  }

  function kontaktListe(k) {
    var li = [];
    if (k.telefon) {
      var t = K.telHref(k.telefon);
      li.push("<li>" + K.ICON.tel + (t ? '<a href="' + t + '">' + esc(k.telefon) + "</a>" : '<span class="ph">' + esc(k.telefon) + "</span>") + "</li>");
    }
    if (k.email) {
      var m = K.mailHref(k.email);
      li.push("<li>" + K.ICON.mail + (m ? '<a href="' + m + '">' + esc(k.email) + "</a>" : '<span class="ph">' + esc(k.email) + "</span>") + "</li>");
    }
    if (k.erreichbar) li.push("<li>" + K.ICON.uhr + "<span>Gut erreichbar " + esc(k.erreichbar) + "</span></li>");
    return '<ul class="contact-list">' + li.join("") + "</ul>";
  }

  function render(e) {
    document.title = e.name + " · " + C.seitenname;
    var foto = e.fotos && e.fotos[0];
    var bild = foto ? '<img src="' + esc(foto.datei) + '" alt="' + esc(foto.alt || "") + '">' :
      K.lasur(e.id, 480, 384, "lasur") + '<span class="initials" aria-hidden="true">' + esc(K.initialen(e.name)) + '</span><span class="ph-label">Foto folgt</span>';
    var k = e.kontakt || {};
    var direktTel = (e.kontaktweg !== "beratung") && K.telHref(k.telefon);
    var direktMail = (e.kontaktweg !== "beratung") && K.mailHref(k.email);
    var beratungTel = K.telHref(C.beratung.telefon);
    var wo = (e.tagespflegestelle && e.tagespflegestelle !== e.name ? e.tagespflegestelle + " in " : "") + "Werne\u2011" + e.ortsteil.replace("Werne-", "");

    var aktionen = "";
    if (e.muster) { // Musterprofil: Knöpfe wie bei einem echten Profil, aber ohne Ziel
      aktionen += '<span class="btn btn-primary">' + K.ICON.tel + 'Anrufen</span><span class="btn btn-quiet">' + K.ICON.mail + "E\u2011Mail schreiben</span>";
    } else {
      if (direktTel) aktionen += '<a class="btn btn-primary" href="' + direktTel + '">' + K.ICON.tel + "Anrufen</a>";
      if (direktMail) aktionen += '<a class="btn btn-quiet" href="' + direktMail + '">' + K.ICON.mail + "E\u2011Mail schreiben</a>";
      if (!direktTel && !direktMail) aktionen += '<a class="btn btn-primary" href="#kontakt-h">Kontakt über die Fachberatung</a>';
    }
    aktionen += '<button type="button" class="linkbtn" id="teilen-profil" hidden>Profil teilen</button>'; // z. B. an den Partner schicken

    $("#profil-kopf").innerHTML =
      '<div class="profile-photo">' + bild + "</div>" +
      '<div class="profile-intro">' +
      // Datum direkt am Status: Eltern sehen, wie aktuell „frei“ ist
      '<div class="status-zeile"><span class="status-inline ' + K.freiKlasse(e) + '">' + esc(K.freiText(e)) + "</span>" +
      (e.aktualisiert ? '<span class="stand">Angaben vom ' + esc(K.datum(e.aktualisiert)) + "</span>" : "") + "</div>" +
      '<h1 id="p-name">' + esc(e.name) + "</h1>" +
      (e.betreuungsform === "grosstagespflege" ? '<p class="where">' + esc((e.personen || []).join(" und ")) + "</p>" : "") +
      '<p class="where">' + esc(wo) + "</p>" +
      '<div class="actions">' + aktionen + "</div></div>";
    K.teilen($("#teilen-profil"), function () {
      return { title: e.name + " · " + C.seitenname, text: e.name + ", " + wo + ": " + K.freiText(e), url: location.href };
    });

    // Steckbrief
    var fakten = zeile("Betreuungsort", K.BETREUUNGSFORM[e.betreuungsform]) +
      zeile("Betreuungsplätze", e.plaetze_gesamt ? e.plaetze_gesamt + " Plätze" : "") +
      zeile("Alter der Kinder", K.alterText(e.alter)) +
      zeile("Betreuungszeiten", e.zeiten) +
      zeile("Freie Plätze", K.freiDetail(e)) +
      zeile("Qualifikation", e.qualifikation) +
      zeile("Vertretung", e.vertretung) +
      zeile("Mahlzeiten", e.mahlzeiten) +
      zeile("Sprachen", (e.sprachen || []).join(", "));

    // Besonderheiten nach Gruppen (Schwerpunkte, Essen, Betreuungsräume, Alltag, Sonstiges): erst die festen Punkte
    // in der Reihenfolge von K.BESONDERHEITEN, danach die eigenen, jeder als eigener Chip (Vanessa, 09.11.2026)
    var gewaehlt = e.besonderheiten || [];
    var chips = K.GRUPPEN.map(function (g) {
      var texte = K.BESONDERHEITEN.filter(function (b) { return b.gruppeKey === g.key && gewaehlt.indexOf(b.key) !== -1; })
        .map(function (b) { return b.label; }).concat(K.eigenePunkte(e, g.key));
      if (!texte.length) return "";
      return '<p class="subgroup">' + esc(g.name) + '</p><div class="chips">' +
        texte.map(function (t) { return '<span class="chip" style="background:' + g.farbe + '">' + esc(t) + "</span>"; }).join("") + "</div>";
    }).join("");

    var beschreibung = e.beschreibung ? '<p class="about">' + esc(e.beschreibung) + "</p>" :
      '<p class="about ph">Die Kindertagespflegeperson hat noch keinen eigenen Text hinterlegt.</p>';

    var galerie = "";
    if (e.fotos && e.fotos.length > 1) {
      galerie = '<section class="box" aria-labelledby="gal-h"><h2 id="gal-h">Räume und Alltag</h2><div class="gallery">' +
        e.fotos.slice(1).map(function (f) { return '<div class="g"><img src="' + esc(f.datei) + '" alt="' + esc(f.alt || "") + '" loading="lazy"></div>'; }).join("") +
        "</div></section>";
    }

    // Kontakt
    var kontakt = "";
    var zeigDirekt = e.kontaktweg !== "beratung" && (k.telefon || k.email);
    var zeigBeratung = e.kontaktweg !== "direkt";
    if (zeigDirekt) kontakt += kontaktListe(k) + (direktTel ? '<a class="btn btn-primary" style="width:100%" href="' + direktTel + '">Anrufen</a>' : "");
    if (zeigDirekt && zeigBeratung) kontakt += '<p class="or">oder</p>';
    if (zeigBeratung) {
      var beratungUrl = K.sichereUrl(C.beratung.url);
      kontakt += '<div class="beratung"><p class="label">Über die Fachberatung</p><p class="who">' + esc(C.beratung.titel) + "</p>" +
        kontaktListe({ telefon: C.beratung.telefon, email: C.beratung.email }).replace('class="contact-list"', 'class="contact-list" style="margin:12px 0"') +
        '<p class="small" style="color:var(--ink-2)">Die ' + esc(C.beratung.name) + " stellt den Kontakt zu " + esc(e.name) + " her." +
        (beratungUrl ? ' <a href="' + esc(beratungUrl) + '">Angebot und Sprechzeiten</a>' : "") + "</p></div>";
    }

    var links = [];
    var w = K.sichereUrl(e.links && e.links.website), ig = K.instagramUrl(e.links && e.links.instagram), fb = K.sichereUrl(e.links && e.links.facebook), wl = K.sichereUrl(e.links && e.links.weitere);
    if (w) links.push('<li><a href="' + esc(w) + '" rel="noopener nofollow" target="_blank">' + K.ICON.globus + "Website</a></li>");
    if (ig) links.push('<li><a href="' + esc(ig) + '" rel="noopener nofollow" target="_blank">' + K.ICON.link + "Instagram</a></li>");
    if (fb) links.push('<li><a href="' + esc(fb) + '" rel="noopener nofollow" target="_blank">' + K.ICON.link + "Facebook</a></li>");
    if (wl) links.push('<li><a href="' + esc(wl) + '" rel="noopener nofollow" target="_blank">' + K.ICON.link + "Weiterer Link</a></li>");
    // Platzhalter aus Beispieldaten sichtbar machen
    ["website", "instagram", "facebook", "weitere"].forEach(function (key) {
      var v = e.links && e.links[key];
      if (v && K.istPlatzhalter(v)) links.push('<li><span class="ph" style="display:flex;align-items:center;gap:12px;min-height:44px">' + K.ICON.link + esc(v) + "</span></li>");
    });

    $("#profil-inhalt").innerHTML =
      '<div class="profile-main">' +
      '<section class="box" aria-labelledby="facts-h"><h2 id="facts-h">Steckbrief</h2><dl class="facts">' + fakten + "</dl></section>" +
      '<section class="box" aria-labelledby="about-h"><h2 id="about-h">Über die Kindertagespflege</h2>' + beschreibung +
      (chips ? '<h3>Besonderheiten</h3>' + chips : "") + "</section>" +
      galerie + "</div>" +
      '<aside class="profile-side">' +
      '<section class="box" aria-labelledby="kontakt-h"><h2 id="kontakt-h">Kontakt</h2>' + kontakt + "</section>" +
      (links.length ? '<section class="box" aria-labelledby="netz-h"><h2 id="netz-h" class="s">Website und Social Media</h2><ul class="link-list">' + links.join("") + "</ul></section>" : "") +
      '<section class="box" aria-labelledby="lage-h"><h2 id="lage-h" class="s">Lage</h2><p>' + esc("Werne\u2011" + e.ortsteil.replace("Werne-", "")) + "</p>" +
      (e.standort ? '<div class="map-wrap" style="margin-top:14px"><div id="mini-karte" class="map map-small" role="region" aria-label="Ungefährer Standort auf der Karte"></div></div><p class="small" style="margin-top:10px">Der Kreis zeigt den ungefähren Standort. Die genaue Adresse erhalten Sie im persönlichen Gespräch.</p>'
        : '<p class="small" style="margin-top:6px">Die genaue Adresse erhalten Sie im persönlichen Gespräch.</p>') +
      "</section>" +
      "</aside>" +
      // Herkunft der Angaben über die volle Breite, direkt über dem Fuß
      '<p class="profil-herkunft">Angaben zuletzt aktualisiert am ' + esc(K.datum(e.aktualisiert)) + ". Die Angaben stammen von der Kindertagespflegeperson selbst.</p>";

    if (e.standort) {
      var ll = [e.standort.lat, e.standort.lon];
      K.karte($("#mini-karte"), { mitte: ll, zoom: 14 }, function (map) {
        L.circle(ll, K.kreisStil(e, e.standort.genauigkeit_m || C.karte.radiusMeter)).addTo(map);
      });
    }
  }

  K.ladeDaten().then(function (d) {
    var e = d.eintraege.filter(function (x) { return x.id === id; })[0] || (id === "musterprofil" ? window.KTP_MUSTER : null);
    if (!e) {
      $("#profil-kopf").innerHTML = '<div class="not-found"><h1>Profil nicht gefunden</h1><p class="lead" style="margin-top:12px">Dieses Profil gibt es nicht oder nicht mehr.</p><p style="margin-top:20px"><a class="btn btn-primary" href="index.html#suche">Zur Übersicht</a></p></div>';
      $("#profil-inhalt").innerHTML = "";
      return;
    }
    $("#muster-hinweis").hidden = !e.muster;
    render(e);
  });
})();
