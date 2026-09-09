const TABLE = {
  N:  { "0-19": 14, "20-29": 17, "30-39": 20, "40-99": 21 },
  OR: { "0-19": 12, "20-29": 15, "30-39": 18, "40-99": 19 },
  RN: { "0-19": 14, "20-29": 16, "30-39": 18, "40-99": 20 },
  AR: { "0-19": 12, "20-29": 14, "30-39": 16, "40-99": 18 },
  SW: { "0-19":  9, "20-29": 11, "30-39": 13, "40-99": 15 }
};
const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const CAP = { hdg: 3, rng: 2, alt: 2 };
const ORDER = ["hdg", "rng", "alt"];
const boxes = {
  hdg: document.getElementById("inHdg"),
  rng: document.getElementById("inRng"),
  alt: document.getElementById("inAlt")
};
const el = {
  err: document.getElementById("err"),
  results: document.getElementById("results"),
  leftHdg: document.getElementById("leftHdg"),
  leftCard: document.getElementById("leftCard"),
  rightHdg: document.getElementById("rightHdg"),
  rightCard: document.getElementById("rightCard"),
  recipHdg: document.getElementById("recipHdg"),
  recipCard: document.getElementById("recipCard")
};
const state = { hdg: "", rng: "", alt: "", active: "hdg", replace: true };
function rows() { return document.querySelectorAll("#lookup .row"); }
function bandFor(alt) {
  if (alt <= 19) return "0-19";
  if (alt <= 29) return "20-29";
  if (alt <= 39) return "30-39";
  return "40-99";
}
function normHdg(h) { return ((Number(h) % 360) + 360) % 360; }
function padHdg(n) {
  const h = normHdg(n);
  return (h === 0 ? "360" : String(h).padStart(3, "0")) + "\u00b0";
}
function cardinal(h) { return DIRS[Math.round(normHdg(h) / 45) % 8]; }
function renderBoxes() {
  const ph = { hdg: "---", rng: "--", alt: "--" };
  ORDER.forEach(k => {
    const box = boxes[k];
    box.classList.toggle("active", state.active === k);
    box.classList.toggle("replace", state.active === k && state.replace);
    box.innerHTML = state[k] ? state[k] : '<span class="ph">' + ph[k] + "</span>";
  });
}
function setActive(k, replace) {
  state.active = k;
  state.replace = replace !== false;
  renderBoxes();
}
function validate() {
  if (state.hdg.length !== 3) return "Enter 3-digit bearing";
  if (Number(state.hdg) > 360) return "HDG must be 000\u2013360";
  if (state.rng.length !== 2) return "Enter 2-digit range";
  if (state.alt.length < 1) return "Enter altitude";
  return "";
}
function clearResults() {
  el.results.classList.add("empty");
  el.leftHdg.textContent = "---";
  el.rightHdg.textContent = "---";
  el.recipHdg.textContent = "---";
  el.leftCard.textContent = "--";
  el.rightCard.textContent = "--";
  el.recipCard.textContent = "--";
  document.getElementById("grpNOR").classList.remove("on");
  document.getElementById("grpRNAR").classList.remove("on");
  rows().forEach(row => {
    row.classList.remove("bold");
    row.querySelector(".val").textContent = "--";
  });
}
function compute(fromEnter) {
  if (!fromEnter && state.alt.length !== 2) return false;
  const err = validate();
  el.err.textContent = err;
  if (err) { if (fromEnter) clearResults(); return false; }
  const hdgIn = Number(state.hdg) === 360 ? 0 : Number(state.hdg);
  const rng = Number(state.rng);
  const alt = Number(state.alt);
  const left = normHdg(hdgIn - 90);
  const right = normHdg(hdgIn + 90);
  const recip = normHdg(hdgIn + 180);
  const band = bandFor(alt);
  const far = rng >= 25;
  const vals = { N: TABLE.N[band], OR: TABLE.OR[band], RN: TABLE.RN[band], AR: TABLE.AR[band], SW: TABLE.SW[band] };
  vals.AR3 = vals.AR + 3;
  const boldSet = far ? new Set(["AR3", "N", "OR", "SW"]) : new Set(["AR3", "RN", "AR", "SW"]);
  el.results.classList.remove("empty");
  el.leftHdg.textContent = padHdg(left);
  el.rightHdg.textContent = padHdg(right);
  el.recipHdg.textContent = padHdg(recip);
  el.leftCard.textContent = cardinal(left);
  el.rightCard.textContent = cardinal(right);
  el.recipCard.textContent = cardinal(recip);
  document.getElementById("grpNOR").classList.toggle("on", far);
  document.getElementById("grpRNAR").classList.toggle("on", !far);
  rows().forEach(row => {
    const k = row.getAttribute("data-k");
    row.querySelector(".val").textContent = String(vals[k]);
    row.classList.toggle("bold", boldSet.has(k));
  });
  el.results.classList.remove("flash");
  void el.results.offsetWidth;
  el.results.classList.add("flash");
  setTimeout(() => el.results.classList.remove("flash"), 180);
  setActive("hdg", true);
  return true;
}
function insertDigit(d) {
  el.err.textContent = "";
  const k = state.active;
  if (state.replace) { state[k] = d; state.replace = false; }
  else if (state[k].length >= CAP[k]) { state[k] = d; }
  else { state[k] += d; }
  if (k === "hdg" && state.hdg.length === 3) setActive("rng", true);
  else if (k === "rng" && state.rng.length === 2) setActive("alt", true);
  else if (k === "alt" && state.alt.length === 2) compute(false);
  else renderBoxes();
}
function clr() {
  state.hdg = ""; state.rng = ""; state.alt = "";
  el.err.textContent = "";
  clearResults();
  setActive("hdg", true);
}
document.querySelector(".entry").addEventListener("click", (e) => {
  const box = e.target.closest(".box");
  if (!box) return;
  setActive(box.getAttribute("data-field"), true);
});
document.getElementById("pad").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const k = btn.getAttribute("data-k");
  const act = btn.getAttribute("data-act");
  if (k) insertDigit(k);
  else if (act === "clr") clr();
  else if (act === "go") compute(true);
});
document.addEventListener("keydown", (e) => {
  if (e.key >= "0" && e.key <= "9") { e.preventDefault(); insertDigit(e.key); }
  else if (e.key === "Enter") { e.preventDefault(); compute(true); }
  else if (e.key === "Escape") { e.preventDefault(); clr(); }
});
clearResults();
renderBoxes();
