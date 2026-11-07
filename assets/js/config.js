/* Konfiguration der Website. Nur diese Datei muss Karl für den Start anpassen.
   Alle Werte in eckigen Klammern sind Platzhalter. */
window.KTP_CONFIG = {
  seitenname: "Kindertagespflege Werne",

  // Öffentliche Daten. Startphase: statische Datei. Später: Backend-Endpunkt mit gleichem Format,
  // zum Beispiel "/api/oeffentlich/tagespflege".
  datenUrl: "data/tagespflege.json",

  // Backend-Endpunkte (siehe docs/01-bauplan.md). Solange null, laufen die Formulare im Demo-Modus:
  // Es wird nichts gesendet, das Formular zeigt den Datensatz an, der gesendet würde.
  // Pfade relativ, damit die Seite auch in einem Unterordner läuft. Backend: site/api/index.php (PHP).
  api: {
    eintragNeu: null,   // POST   multipart/form-data, Feld "daten" (JSON) und "fotos"
    eintragLesen: null,   // GET    ?token=…            → Datensatz zum Bearbeiten
    eintragAendern: null, // PUT    ?token=…            multipart/form-data wie oben
    eintragLoeschen: null,// DELETE ?token=…
    linkAnfordern: null      // POST   JSON { "email": "…" } → verschickt Änderungslink
  },

  // Karte (Leaflet, liegt lokal unter assets/vendor/leaflet).
  // Empfohlen für den Betrieb: Kacheln über einen eigenen Proxy ausliefern (deploy/nginx.conf.example),
  // dann tileUrl: "/tiles/{z}/{x}/{y}.png" und einwilligungNoetig: false.
  // Solange die Kacheln direkt von OpenStreetMap kommen, lädt die Karte erst nach einem Klick.
  karte: {
    tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
    einwilligungNoetig: true,
    mitte: [51.672, 7.645],
    zoom: 12,
    radiusMeter: 300,
    // Vorschaubild vor der Zustimmung (eigener Server, © OpenStreetMap, ODbL). Leer lassen, um nur den Hinweis zu zeigen.
    vorschauBild: "assets/img/karte-vorschau.jpg"
  },

  // Fachberatung Kindertagespflege (Kontaktweg „über die Fachberatung“). Ohne Namen der Mitarbeiterin, bis sie zugestimmt hat.
  // Telefon: Durchwahl, die werne.de für „Beratung, Vermittlung von Kindertagespflege“ nennt. E-Mail: Funktionsadresse des Jugendamts.
  // Stand 04.11.2026, Quelle: url
  beratung: {
    name: "Fachberatung Kindertagespflege",
    titel: "Jugendamt der Stadt Werne",
    telefon: "02389 71-571",
    email: "jugendamt@werne.de",
    url: "https://www.werne.de/de/stadt/familie/familiennnetz/angebote.php#anchor_dfb608f0_Accordion-Beratung--Vermittlung-von-Kindertagespflege"
  },

  // Betreiber
  betreiber: {
    name: "seitenreif.de",
    url: "https://www.seitenreif.de",
    kontakt: "kontakt@kindertagespflege-werne.de",
    // Adresse für Feedback und Verbesserungsvorschläge, steht im Fuß jeder Seite
    feedback: "kontakt@kindertagespflege-werne.de"
  },

  ortsteile: ["Werne-Mitte", "Ehringhausen", "Evenkamp", "Holthausen", "Horst", "Langern", "Lenklar", "Schmintrup", "Stockum", "Varnhövel", "Wessel"]
};
