/* Änderungslink anfordern. Die Antwort ist immer gleich, damit niemand prüfen kann,
   ob eine E\u2011Mail-Adresse eingetragen ist. */
(function () {
  "use strict";
  var K = window.KTP, C = K.C;
  var form = document.getElementById("link-form");
  var meldung = document.getElementById("link-meldung");
  var demo = !C.api.linkAnfordern;
  if (demo) document.getElementById("demo-hinweis").hidden = false;

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = String(form.elements.email.value || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      meldung.innerHTML = '<span class="error">Bitte geben Sie eine gültige E\u2011Mail-Adresse ein.</span>';
      return;
    }
    if (form.elements.firma.value) return;
    var text = "Wenn diese Adresse bei uns hinterlegt ist, erhalten Sie in wenigen Minuten eine E\u2011Mail mit Ihrem persönlichen Link. Der Link gilt 7 Tage.";
    if (demo) {
      meldung.innerHTML = '<p class="edit-banner">' + K.esc(text) + '</p><p class="small" style="margin-top:10px">Demo-Modus: Es wurde keine E\u2011Mail verschickt. <a href="eintragen.html?token=demo">So sieht die Änderungsseite aus</a>.</p>';
      return;
    }
    fetch(C.api.linkAnfordern, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email }) })
      .catch(function () {})
      .then(function () { meldung.innerHTML = '<p class="edit-banner">' + K.esc(text) + "</p>"; form.reset(); });
  });
})();
