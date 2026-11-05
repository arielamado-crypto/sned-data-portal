/* SNEd Data Portal — renders everything from window.SNED_DATA (data.js) */
(function () {
  "use strict";
  var D = window.SNED_DATA;
  var PREVIEW = /[?&]preview=1/.test(location.search);
  if (PREVIEW) {
    try { var dr = localStorage.getItem("sned:draft"); if (dr) D = JSON.parse(dr); } catch (e) {}
    document.body.insertAdjacentHTML("afterbegin", '<div style="position:sticky;top:0;z-index:60;background:#f5a51c;color:#2a1600;text-align:center;padding:8px 12px;font-weight:600;font-size:.9rem">PREVIEW of your unsaved draft — not yet published. Close this tab and click “Publish to GitHub” in the editor to publish.</div>');
  }
  if (!D) { document.body.insertAdjacentHTML("afterbegin", "<p style='padding:20px;background:#fee;color:#900'>data.js could not be loaded. Check the file for a missing comma or bracket.</p>"); return; }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return Number(n || 0).toLocaleString("en-PH"); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var sum = function (arr, f) { return arr.reduce(function (a, x) { return a + (Number(f(x)) || 0); }, 0); };
  var root = document.documentElement;

  /* ---------- preferences (saved per browser) ---------- */
  var store = {
    get: function (k) { try { return localStorage.getItem("sned:" + k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem("sned:" + k, v); } catch (e) {} }
  };

  /* ---------- text bindings ---------- */
  $$("[data-bind]").forEach(function (el) {
    var path = el.getAttribute("data-bind").split(".");
    var v = path.reduce(function (o, k) { return o ? o[k] : ""; }, D);
    el.textContent = v || "";
  });
  var mail = $("#mailLink"); if (mail && D.meta.email) mail.href = "mailto:" + D.meta.email;
  var fb = $("#fbLink"); if (fb && D.meta.facebook) fb.href = D.meta.facebook;
  $("#year").textContent = new Date().getFullYear();
  if (D.isSampleData) $("#sampleNotice").hidden = false;

  /* ---------- supervisor ---------- */
  var lead = $(".leader");
  if (lead) {
    if (!D.meta.supervisorName) lead.remove();
    else {
      $("#supMessage").textContent = D.meta.supervisorMessage || "";
      if (!D.meta.supervisorMessage) $("#supMessage").remove();
      $("#supPhoto").alt = "Photo of " + D.meta.supervisorName;
    }
  }

  /* ---------- icons ---------- */
  var ICON = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    school: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    teacher: '<circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/><path d="M12 11v4"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    ear: '<path d="M6 8.5a6 6 0 1 1 12 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a3 3 0 1 0-6 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'
  };
  var svg = function (n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[n] || ICON.star) + "</svg>"; };

  /* ---------- stat cards ---------- */
  var S = D.summary || {};
  function has(v) { return v !== null && v !== undefined && v !== "" && isFinite(Number(v)); }
  var allStats = [
    { n: S.learnersTotal, l: "Learners with Special Education Needs", s: "With a diagnosis or with manifestations" },
    { n: S.withDiagnosis, l: "With Medical Diagnosis", s: "Diagnosed by a licensed medical specialist" },
    { n: S.withManifestations, l: "With Manifestations", s: "Observed difficulties, no diagnosis yet" },
    { n: S.schoolsWithLsen, l: "Schools Serving LSENs", s: "With at least one LSEN enrolled" },
    { n: S.learnersWithDisabilities, l: "Learners with Disabilities", s: "Enrolled and tagged in LIS" },
    { n: S.inclusiveSchools, l: "Inclusive Schools", s: "Schools serving LWDs" },
    { n: S.snedCenters, l: "SNEd Centers", s: "Division-recognized centers" },
    { n: S.snedTeachers, l: "SNEd Teachers", s: "SPED-trained personnel" },
    { n: S.giftedTalented, l: "Gifted & Talented Learners", s: "Identified and served" },
    { n: S.learningResourceCenters, l: "Learning Resource Centers", s: "ILRCs and support hubs" }
  ];
  if (has(S.learnersTotal)) allStats = allStats.filter(function (x) { return x.l !== "Learners with Disabilities"; });
  if (has(S.schoolsWithLsen)) allStats = allStats.filter(function (x) { return x.l !== "Inclusive Schools"; });
  $("#stats").innerHTML = allStats.filter(function (x) { return has(x.n); }).map(function (x) {
    return '<div class="stat reveal"><div class="num" data-count="' + Number(x.n) + '">0</div><div class="lbl">' + esc(x.l) + '</div><div class="sub">' + esc(x.s) + "</div></div>";
  }).join("");

  function countUp(el) {
    var target = +el.getAttribute("data-count"), t0 = null, dur = 1100;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = fmt(target); return; }
    function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1); el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  /* ---------- tables ---------- */
  function prep(arr) { return (arr || []).map(function (x) { return { category: x.category, male: +x.male || 0, female: +x.female || 0, total: (+x.male || 0) + (+x.female || 0) }; }).sort(function (a, b) { return b.total - a.total; }); }
  function fillTable(sel, rows) {
    var tot = sum(rows, function (x) { return x.total; }), mx = Math.max.apply(null, rows.map(function (x) { return x.total; }).concat([1]));
    $(sel + " tbody").innerHTML = rows.map(function (x) {
      var pct = tot ? x.total / tot * 100 : 0;
      return "<tr><td>" + esc(x.category) + '</td><td class="num">' + fmt(x.male) + '</td><td class="num">' + fmt(x.female) + '</td><td class="num"><b>' + fmt(x.total) + '</b></td><td class="num"><span class="share"><i style="width:' + (x.total / mx * 60).toFixed(0) + 'px"></i>' + pct.toFixed(1) + "%</span></td></tr>";
    }).join("");
    $(sel + " tfoot").innerHTML = '<tr><td>Total</td><td class="num">' + fmt(sum(rows, function (x) { return x.male; })) + '</td><td class="num">' + fmt(sum(rows, function (x) { return x.female; })) + '</td><td class="num">' + fmt(tot) + '</td><td class="num">100%</td></tr>';
  }
  var dis = prep(D.byDisability), man = prep(D.byManifestation);
  fillTable("#tblDisability", dis);
  if (man.length) fillTable("#tblManifest", man);
  else $$(".mani-only").forEach(function (el) { el.remove(); });

  var DIST = (D.byDistrict || []).map(function (x) {
    var dg = x.diagnosis, mf = x.manifestations, split = has(dg) || has(mf);
    return { district: x.district, diagnosis: split ? (+dg || 0) : null, manifestations: split ? (+mf || 0) : null, lwd: split ? (+dg || 0) + (+mf || 0) : (+x.lwd || 0), schools: +x.schools || 0 };
  });
  var distSplit = DIST.some(function (x) { return x.diagnosis !== null; });
  var NOREP = DIST.filter(function (x) { return !x.lwd; }).map(function (x) { return x.district; });
  $("#tblDistrict tbody").innerHTML = DIST.map(function (x) {
    if (!x.lwd) return "<tr><td>" + esc(x.district) + '</td><td class="num muted" colspan="' + (distSplit ? 4 : 2) + '"><i>No learners reported yet</i></td></tr>';
    return "<tr><td>" + esc(x.district) + "</td>" + (distSplit ? '<td class="num">' + fmt(x.diagnosis) + '</td><td class="num">' + fmt(x.manifestations) + "</td>" : "") + '<td class="num"><b>' + fmt(x.lwd) + '</b></td><td class="num">' + fmt(x.schools) + "</td></tr>";
  }).join("");
  $("#tblDistrict thead").innerHTML = "<tr><th scope=\"col\">School district</th>" + (distSplit ? '<th scope="col" class="num">With diagnosis</th><th scope="col" class="num">With manifestations</th>' : "") + '<th scope="col" class="num">Total learners</th><th scope="col" class="num">Schools serving LSENs</th></tr>';
  $("#tblDistrict tfoot").innerHTML = "<tr><td>Total</td>" + (distSplit ? '<td class="num">' + fmt(sum(DIST, function (x) { return x.diagnosis; })) + '</td><td class="num">' + fmt(sum(DIST, function (x) { return x.manifestations; })) + "</td>" : "") + '<td class="num">' + fmt(sum(DIST, function (x) { return x.lwd; })) + '</td><td class="num">' + fmt(sum(DIST, function (x) { return x.schools; })) + "</td></tr>";

  /* ---------- colors ---------- */
  function darkNow() { var t = root.getAttribute("data-theme"); return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; }
  var COL = { a: "#3b1690", b: "#d9a441" };
  function setCols() { COL = darkNow() ? { a: "#a58ff0", b: "#d9a441", soft: "#5c4a9c" } : { a: "#3b1690", b: "#d9a441", soft: "#b5a6dd" }; }
  setCols();

  /* ---------- sex split ---------- */
  var lwdM = sum(dis.concat(man), function (x) { return x.male; });
  var lwdF = sum(dis.concat(man), function (x) { return x.female; });
  var all = lwdM + lwdF || 1;
  $("#sexSplit").innerHTML =
    '<div class="sex-row"><div class="top"><span>Male</span><b>' + fmt(lwdM) + '</b></div><div class="bar"><i data-w="' + (lwdM / all * 100).toFixed(1) + '" style="width:0;background:' + COL.a + '"></i></div></div>' +
    '<div class="sex-row"><div class="top"><span>Female</span><b>' + fmt(lwdF) + '</b></div><div class="bar"><i data-w="' + (lwdF / all * 100).toFixed(1) + '" style="width:0;background:' + COL.b + '"></i></div></div>' +
    '<p class="sex-note">Male learners make up <b>' + (lwdM / all * 100).toFixed(1) + "%</b> of " + (man.length ? "all learners with special education needs" : "learners with disabilities") + ". Ratio: " + (lwdM / (lwdF || 1)).toFixed(2) + " males for every female.</p>";

  /* ---------- charts ---------- */
  var charts = {};
  var PAL = ["#2a1263", "#4a24a6", "#7a5fc9", "#ab9be0", "#d9a441", "#e8cf9a", "#77737f"];
  function css(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
  function baseOpts() {
    var text = css("--chart-text"), grid = css("--chart-grid");
    Chart.defaults.font.family = "Inter, system-ui, sans-serif"; Chart.defaults.font.size = 12;
    Chart.defaults.color = text;
    return { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { align: "end", labels: { usePointStyle: true, pointStyle: "rectRounded", boxWidth: 8, boxHeight: 8, padding: 18 } }, tooltip: { backgroundColor: "#1f1d26", padding: 10, cornerRadius: 4, titleFont: { weight: "600" }, callbacks: { label: function (c) { return " " + c.dataset.label + ": " + fmt(c.parsed.x != null && c.chart.options.indexAxis === "y" ? c.parsed.x : c.parsed.y); } } } },
      scales: { x: { border: { display: false }, grid: { color: grid }, ticks: { color: text } }, y: { border: { display: false }, grid: { color: grid }, ticks: { color: text } } } };
  }
  var sexMode = "both";

  function buildCharts() {
    if (typeof Chart === "undefined") { $$(".chart-box").forEach(function (b) { b.innerHTML = '<p class="muted" style="padding:20px">Charts need an internet connection (Chart.js). The tables below show the same data.</p>'; }); return; }
    Object.keys(charts).forEach(function (k) { charts[k].destroy(); });
    setCols();
    var narrow = window.innerWidth < 680;

    function catChart(key, canvas, rows) {
      var o = baseOpts(); o.indexAxis = "y";
      o.scales.x.stacked = true; o.scales.y.stacked = true; o.scales.y.grid = { display: false };
      o.scales.y.ticks.callback = function (v) { var l = this.getLabelForValue(v); var max = narrow ? 22 : 44; return l.length > max ? l.slice(0, max - 2) + "…" : l; };
      charts[key] = new Chart(canvas, { type: "bar", options: o, data: {
        labels: rows.map(function (x) { return x.category; }),
        datasets: sexMode === "both"
          ? [{ label: "Male", data: rows.map(function (x) { return x.male; }), backgroundColor: COL.a, borderRadius: 2, barPercentage: .6 },
             { label: "Female", data: rows.map(function (x) { return x.female; }), backgroundColor: COL.b, borderRadius: 2, barPercentage: .6 }]
          : [{ label: "Total", data: rows.map(function (x) { return x.total; }), backgroundColor: COL.a, borderRadius: 2, barPercentage: .6 }]
      } });
    }
    catChart("dis", $("#chDisability"), dis);
    if (man.length && $("#chManifest")) catChart("man", $("#chManifest"), man);

    var o2 = baseOpts(); delete o2.scales; o2.cutout = "72%"; o2.plugins.legend = { display: false };
    o2.plugins.tooltip.callbacks.label = function (c) { return " " + c.label + ": " + fmt(c.parsed); };
    charts.lvl = new Chart($("#chLevel"), { type: "doughnut", options: o2, data: {
      labels: D.byLevel.map(function (x) { return x.level; }),
      datasets: [{ data: D.byLevel.map(function (x) { return x.count; }), backgroundColor: PAL, borderWidth: 3, borderColor: css("--surface") }]
    } });
    $("#levelLegend").innerHTML = D.byLevel.map(function (x, i) { return '<li><i style="background:' + PAL[i] + '"></i>' + esc(x.level) + "<b>" + fmt(x.count) + "</b></li>"; }).join("");

    var trendCard = $("#trendCard");
    if ((D.trend || []).length >= 2) {
      if (trendCard) trendCard.hidden = false;
      var o3 = baseOpts(); o3.interaction = { mode: "index", intersect: false };
      o3.scales.x.grid = { display: false };
      var tsets = [{ label: man.length ? "Learners with special education needs" : "Learners with Disabilities", data: D.trend.map(function (x) { return x.lwd; }), borderColor: COL.a, backgroundColor: "transparent", fill: false, tension: .3, pointRadius: 4, pointBackgroundColor: COL.a, borderWidth: 2 }];
      if (D.trend.some(function (x) { return has(x.gifted); })) tsets.push({ label: "Gifted & Talented", data: D.trend.map(function (x) { return has(x.gifted) ? +x.gifted : null; }), borderColor: COL.b, backgroundColor: "transparent", fill: false, tension: .3, pointRadius: 4, pointBackgroundColor: COL.b, borderWidth: 2 });
      charts.trend = new Chart($("#chTrend"), { type: "line", options: o3, data: { labels: D.trend.map(function (x) { return x.sy; }), datasets: tsets } });
    } else if (trendCard) trendCard.hidden = true;

    var dsorted = DIST.filter(function (x) { return x.lwd > 0; }).sort(function (a, b) { return b.lwd - a.lwd; });
    var dnote = $("#distNoData");
    if (dnote) { dnote.textContent = NOREP.length ? "No learners reported yet: " + NOREP.join(", ") + "." : ""; dnote.style.display = NOREP.length ? "" : "none"; }
    var o4 = baseOpts(); o4.indexAxis = "y";
    o4.scales.x.stacked = true; o4.scales.y.stacked = true; o4.scales.y.grid = { display: false };
    o4.scales.y.ticks.autoSkip = false; o4.scales.y.ticks.font = { size: 11 };
    var dbox = $("#chDistrict").parentNode; dbox.style.height = Math.max(300, dsorted.length * 20 + 70) + "px";
    charts.dist = new Chart($("#chDistrict"), { type: "bar", options: o4, data: {
      labels: dsorted.map(function (x) { return x.district; }),
      datasets: distSplit
        ? [{ label: "With diagnosis", data: dsorted.map(function (x) { return x.diagnosis; }), backgroundColor: COL.a, borderRadius: 2, barPercentage: .7 },
           { label: "With manifestations", data: dsorted.map(function (x) { return x.manifestations; }), backgroundColor: COL.b, borderRadius: 2, barPercentage: .7 }]
        : [{ label: "Learners", data: dsorted.map(function (x) { return x.lwd; }), backgroundColor: COL.a, borderRadius: 2, barPercentage: .7 }]
    } });
  }
  $$(".seg button").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".seg button").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on");
      sexMode = b.getAttribute("data-sex"); buildCharts();
    });
  });

  /* ---------- directory ---------- */
  var NODIST = "__none";
  var districts = Array.from(new Set(D.schools.map(function (s) { return s.district || NODIST; }).concat(NOREP))).sort();
  var types = Array.from(new Set(D.schools.map(function (s) { return s.type; }).filter(Boolean))).sort();
  districts.forEach(function (d) { $("#fDistrict").insertAdjacentHTML("beforeend", '<option value="' + esc(d) + '">' + (d === NODIST ? "No district listed" : esc(d)) + "</option>"); });
  types.forEach(function (t) { $("#fType").insertAdjacentHTML("beforeend", "<option>" + esc(t) + "</option>"); });
  function badgeClass(t) { return /center$/i.test(t) && !/resource/i.test(t) ? "center" : /resource/i.test(t) ? "lrc" : "inclusive"; }
  var PAGE = 24, shown = PAGE;
  function schoolCard(s) {
    var loc = [s.municipality ? s.municipality + ", Iloilo" : "", s.district ? s.district + (s.municipality ? "" : " District") : ""].filter(Boolean).join(" · ");
    var tags = s.programs || [], extra = tags.length > 6 ? ' · +' + (tags.length - 6) + " more" : "";
    var meta = '<div><b>' + fmt(s.lwd) + "</b>learners</div>";
    if (has(s.male) && has(s.female)) meta += "<div><b>" + fmt(s.male) + "</b>male</div><div><b>" + fmt(s.female) + "</b>female</div>";
    if (has(s.teachers)) meta += "<div><b>" + fmt(s.teachers) + "</b>SNEd teachers</div>";
    return '<article class="school"><span class="badge ' + badgeClass(s.type) + '">' + esc(s.type) + "</span><h3>" + esc(s.name) + "</h3>" +
      (loc ? '<div class="loc">' + svg("pin").replace("<svg", '<svg width="14" height="14"') + esc(loc) + "</div>" : "") +
      '<div class="tags">' + tags.slice(0, 6).map(esc).join(" · ") + extra + '</div><div class="meta">' + meta + "</div></article>";
  }
  function renderSchools(reset) {
    if (reset) shown = PAGE;
    var q = $("#q").value.trim().toLowerCase(), fd = $("#fDistrict").value, ft = $("#fType").value;
    var list = D.schools.filter(function (s) {
      var hay = (s.name + " " + (s.municipality || "") + " " + (s.district || "") + " " + s.type + " " + (s.programs || []).join(" ")).toLowerCase();
      return (!q || hay.indexOf(q) > -1) && (!fd || (s.district || NODIST) === fd) && (!ft || s.type === ft);
    });
    $("#resultCount").textContent = "Showing " + Math.min(shown, list.length) + " of " + list.length + (list.length === D.schools.length ? " schools" : " matching schools (" + D.schools.length + " in all)");
    var emptyMsg = fd && NOREP.indexOf(fd) > -1 ? "No learners reported yet for " + esc(fd) + " district in the current data." : "No schools match your search.";
    $("#schoolGrid").innerHTML = list.length ? list.slice(0, shown).map(schoolCard).join("") : '<div class="empty">' + emptyMsg + "</div>";
    var more = $("#moreSchools"); if (more) more.style.display = shown >= list.length ? "none" : "";
  }
  ["#q", "#fDistrict", "#fType"].forEach(function (s) { $(s).addEventListener("input", function () { renderSchools(true); }); });
  var moreBtn = $("#moreSchools"); if (moreBtn) moreBtn.addEventListener("click", function () { shown += PAGE * 2; renderSchools(false); });
  renderSchools(true);

  /* ---------- programs, announcements, resources ---------- */
  $("#programList").innerHTML = D.programs.map(function (p, i) { return '<div class="program reveal"><span class="no">' + (i < 9 ? "0" : "") + (i + 1) + "</span><h3>" + esc(p.title) + "</h3><p>" + esc(p.text) + "</p></div>"; }).join("");
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function pday(v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || "").trim()); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; }
  function dateRange(a, b) {
    var s = pday(a), e = pday(b);
    if (!s) return esc(a || "");
    var one = function (x, yr) { return MONTHS[x.m] + " " + x.d + (yr ? ", " + x.y : ""); };
    if (!e || (e.y === s.y && e.m === s.m && e.d === s.d) || (e.y * 400 + e.m * 32 + e.d) < (s.y * 400 + s.m * 32 + s.d)) return one(s, true);
    if (e.y === s.y && e.m === s.m) return MONTHS[s.m] + " " + s.d + "–" + e.d + ", " + s.y;
    if (e.y === s.y) return one(s, false) + " – " + one(e, true);
    return one(s, true) + " – " + one(e, true);
  }
  $("#announceList").innerHTML = D.announcements.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (a) {
    return '<li><time datetime="' + esc(a.date) + '">' + dateRange(a.date, a.endDate) + "</time><div><h3>" + esc(a.title) + "</h3><p>" + esc(a.text) + "</p></div></li>";
  }).join("");
  $("#resourceList").innerHTML = D.resources.map(function (r) { return '<li><a href="' + esc(r.url) + '"' + (/^https?:/.test(r.url) ? ' target="_blank" rel="noopener"' : "") + '><span class="ft">' + esc(r.type) + '</span><span class="t">' + esc(r.title) + '</span><span class="arr">→</span></a></li>'; }).join("");

  /* ---------- Google Drive folder button ---------- */
  var drive = String((D.meta && D.meta.driveLink) || "").trim();
  if (/^https?:\/\//i.test(drive)) {
    var dbox = $("#driveBox"), dbtn = $("#driveBtn"), dli = $("#driveLi");
    if (dbtn) { dbtn.href = drive; if (D.meta.driveLabel) dbtn.textContent = D.meta.driveLabel + " ↗"; }
    if (dbox) dbox.hidden = false;
    if (dli) { dli.hidden = false; $("#driveFoot").href = drive; }
  } else { var hb = $("#driveBox"); if (hb) hb.style.display = "none"; }

  /* ---------- CSV export ---------- */
  function toCSV(rows) { return rows.map(function (r) { return r.map(function (c) { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\r\n"); }
  function download(name, text) { var b = new Blob(["﻿" + text], { type: "text/csv" }); var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 200); }
  var exporters = {
    disability: function () { download("sned-learners-with-diagnosis.csv", toCSV([["Disability category", "Male", "Female", "Total"]].concat(dis.map(function (x) { return [x.category, x.male, x.female, x.total]; })))); },
    manifest: function () { download("sned-learners-with-manifestations.csv", toCSV([["Manifestation", "Male", "Female", "Total"]].concat(man.map(function (x) { return [x.category, x.male, x.female, x.total]; })))); },
    district: function () { download("sned-by-school-district.csv", toCSV([["School district", "With diagnosis", "With manifestations", "Total learners", "Schools serving LSENs"]].concat(DIST.map(function (x) { return [x.district, x.diagnosis == null ? "" : x.diagnosis, x.manifestations == null ? "" : x.manifestations, x.lwd, x.schools]; })))); },
    schools: function () { download("sned-schools-directory.csv", toCSV([["School", "School ID", "District", "Type", "Programs / categories", "Learners", "Male", "Female", "SNEd Teachers"]].concat(D.schools.map(function (s) { return [s.name, s.id || "", s.district || "", s.type, (s.programs || []).join("; "), s.lwd, has(s.male) ? s.male : "", has(s.female) ? s.female : "", has(s.teachers) ? s.teachers : ""]; })))); }
  };
  $$("[data-csv]").forEach(function (b) { b.addEventListener("click", function () { exporters[b.getAttribute("data-csv")](); }); });

  /* ---------- print ---------- */
  $("#summary .wrap").insertAdjacentHTML("afterbegin", '<div class="print-head"><img src="assets/img/division-seal.png" width="56" height="56" alt=""><div><strong>' + esc(D.meta.division) + " — SNEd Data Report</strong><br><small>SY " + esc(D.meta.schoolYear) + " · as of " + esc(D.meta.asOf) + "</small></div></div>");
  $("#printBtn").addEventListener("click", function () { window.print(); });

  /* ---------- accessibility controls ---------- */
  var fs = +store.get("fs") || 16;
  function applyFs() { root.style.setProperty("--fs", fs + "px"); }
  applyFs();
  $$("[data-font]").forEach(function (b) { b.addEventListener("click", function () { var d = +b.getAttribute("data-font"); fs = d === 0 ? 16 : Math.max(14, Math.min(22, fs + d * 2)); store.set("fs", fs); applyFs(); setTimeout(buildCharts, 50); }); });

  var cBtn = $("#contrastBtn");
  function applyContrast(on) { if (on) root.setAttribute("data-contrast", "high"); else root.removeAttribute("data-contrast"); cBtn.setAttribute("aria-pressed", on ? "true" : "false"); }
  applyContrast(store.get("contrast") === "1");
  cBtn.addEventListener("click", function () { var on = cBtn.getAttribute("aria-pressed") !== "true"; store.set("contrast", on ? "1" : "0"); applyContrast(on); buildCharts(); });

  var tBtn = $("#themeBtn");
  function isDark() { var t = root.getAttribute("data-theme"); return t ? t === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; }
  function labelTheme() { tBtn.textContent = isDark() ? "Light mode" : "Dark mode"; }
  var savedTheme = store.get("theme"); if (savedTheme) root.setAttribute("data-theme", savedTheme);
  labelTheme();
  tBtn.addEventListener("click", function () { var next = isDark() ? "light" : "dark"; root.setAttribute("data-theme", next); store.set("theme", next); labelTheme(); buildCharts(); });

  /* ---------- nav ---------- */
  var toggle = $(".nav-toggle"), nav = $("#nav");
  toggle.addEventListener("click", function () { var o = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); });
  var navLock = null, lockTimer;
  function setActive(id) { $$("#nav a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + id); }); }
  $$("#nav a").forEach(function (a) { a.addEventListener("click", function () {
    nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false");
    navLock = a.getAttribute("href").slice(1); setActive(navLock);
    clearTimeout(lockTimer); lockTimer = setTimeout(function () { navLock = null; }, 1200);
  }); });
  var sections = ["overview", "data", "directory", "programs", "updates", "resources", "contact"].map(function (id) { return document.getElementById(id); });
  var toTop = $(".to-top");
  window.addEventListener("scroll", function () {
    toTop.classList.toggle("show", window.scrollY > 600);
    if (navLock) { clearTimeout(lockTimer); lockTimer = setTimeout(function () { navLock = null; }, 400); return; }
    var y = window.scrollY + 120, cur = null;
    sections.forEach(function (s) { if (s && s.offsetTop <= y) cur = s.id; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = "contact";
    setActive(cur);
  }, { passive: true });

  /* ---------- reveal + counters + bars ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (ents) {
    ents.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      var n = e.target.querySelector("[data-count]"); if (n) countUp(n);
      io.unobserve(e.target);
    });
  }, { threshold: .15 }) : null;
  $$(".reveal").forEach(function (el) { if (io) io.observe(el); else { el.classList.add("in"); var n = el.querySelector("[data-count]"); if (n) n.textContent = fmt(n.getAttribute("data-count")); } });
  setTimeout(function () { $$(".bar > i").forEach(function (i) { i.style.width = i.getAttribute("data-w") + "%"; }); }, 300);

  var rt, lastW = window.innerWidth; window.addEventListener("resize", function () { if (window.innerWidth === lastW) return; lastW = window.innerWidth; clearTimeout(rt); rt = setTimeout(buildCharts, 250); });
  buildCharts();
})();
