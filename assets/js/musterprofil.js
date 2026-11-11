/* Musterprofil: zeigt, wie ein Profil aussieht.
   - Startseite: erscheint nur, solange kein Eintrag freigegeben ist (Karl, 06.11.2026).
   - Formular: „Beispielprofil ansehen“ führt immer hierher (profil.html?id=musterprofil).
   Liegt bewusst nicht in data/, weil das Backend data/tagespflege.json bei jeder Freigabe neu schreibt.
   Keine erfundenen Namen oder Orte: Wo eine Angabe der Person stünde, steht die Bezeichnung des Feldes
   in eckigen Klammern, wie bei „[Telefonnummer]“.
   Kein Standort, damit auf der Karte kein Punkt in einem echten Ortsteil erscheint. */
window.KTP_MUSTER = {
  id: "musterprofil",
  status: "freigegeben",
  muster: true,
  name: "Musterprofil",
  personen: ["Musterprofil"],
  tagespflegestelle: "[Name der Kindertagespflege]",
  ortsteil: "[Ortsteil]",
  betreuungsform: "eigener_haushalt",
  plaetze_gesamt: 5,
  alter: ["u1", "u3"],
  zeiten: "Mo–Fr, 7:30–14:30 Uhr",
  freie_plaetze: { status: "jetzt", anzahl: 1 },
  beschreibung: "",
  besonderheiten: ["vegetarisch", "garten", "nichtraucher", "mittagessen_gemeinsam"],
  besonderheiten_eigene: { schwerpunkte: [], essen: [], raeume: [], alltag: ["Eingewöhnung nach Berliner Modell"], sonstiges: [] },
  qualifikation: "Qualifizierung nach QHB",
  vertretung: "Feste Vertretung im Ortsteil",
  mahlzeiten: "Frühstück und Mittagessen, vegetarisch",
  sprachen: ["Deutsch", "Englisch"],
  fotos: [],
  kontaktweg: "beides",
  kontakt: { telefon: "[Telefonnummer]", email: "[E-Mail-Adresse]", erreichbar: "Mo–Fr, 15–17 Uhr" },
  links: { website: "", instagram: "", facebook: "", weitere: "" }
};
