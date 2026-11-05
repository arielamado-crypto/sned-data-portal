/* SNEd Excel importer — reads the SDO Iloilo "SPED (LSENs) Enrollment Data" workbook
   (sheets: NON-GRADED, GRADED K - G6, JHS GRADED, NON-GRADED JHS, SHS GRADED)
   and turns it into the data the site uses.

   How it reads each sheet:
   - Row 5 holds Male / Female; row 4 the grade or level; rows 6+ one school per row.
   - Only rows with a 6-digit School ID are counted (district subtotal and TOTAL rows are skipped).
   - Each run of Male/Female columns is one category. A run ends at a column with no
     Male/Female heading or when the grade order starts over. Every sheet must have 19 runs:
     11 "with diagnosis" categories, then 8 "with manifestations" categories, in the template order.
   - The sheet's own TOTAL column is NOT used (several are typed by hand); totals are recomputed.
   Needs SheetJS (XLSX) loaded first. */
(function (root) {
  "use strict";

  var DIAG = ["Visual Impairment", "Hearing Impairment", "Learning Disability", "Intellectual Disability",
    "Autism Spectrum Disorder", "Emotional-Behavioral Disorder", "Orthopedic / Physical Handicap",
    "Speech / Language Disorder", "Cerebral Palsy", "Special Health Problem / Chronic Disease", "Multiple Disabilities"];
  var MANI = ["Difficulty in Seeing", "Difficulty in Hearing", "Difficulty in Applying Knowledge",
    "Difficulty in Remembering, Concentrating, Paying Attention and Understanding",
    "Difficulty in Applying Adaptive Skills", "Difficulty in Displaying Interpersonal Behavior",
    "Difficulty in Mobility (Walking, Climbing and Grasping)", "Difficulty in Communicating"];
  var ORDER = ["kinder", "primarylevel i", "primarylevel ii", "primarylevel iii", "transition",
    "grade 1", "grade 2", "grade 3", "grade 4", "grade 5", "grade 6",
    "grade 7", "grade 8", "grade 9", "grade 10", "grade 11", "grade 12"];
  var LEVELS = ["Kindergarten", "Grades 1–3", "Grades 4–6", "Non-graded (Elementary)",
    "Junior High School (Grades 7–10)", "Non-graded (Secondary)", "Senior High School (Grades 11–12)"];

  function clean(v) { return String(v == null ? "" : v).replace(/\s+/g, " ").trim(); }
  function normLevel(v) { return clean(v).toLowerCase().replace("primary level", "primarylevel"); }
  function fixText(s) { return clean(s).replace(/¤/g, "ñ").replace(/Ã‘/g, "Ñ").replace(/Ã±/g, "ñ"); }
  function colName(c) { var s = ""; c++; while (c > 0) { var m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; }

  function sheetKind(title, a1) {
    var t = (title + " " + clean(a1)).toUpperCase(), ti = title.toUpperCase();
    if (/SHS|SENIOR/.test(t)) return "shs";
    if (/JHS|JUNIOR/.test(t)) return /NON/.test(ti) ? "ngjhs" : "jhs";
    if (/NON/.test(ti)) return "ngelem";
    return "elem";
  }
  function bucket(kind, lv) {
    if (kind === "elem") return lv === "kinder" ? LEVELS[0] : (/^grade [123]$/.test(lv) ? LEVELS[1] : LEVELS[2]);
    if (kind === "ngelem") return LEVELS[3];
    if (kind === "jhs") return LEVELS[4];
    if (kind === "ngjhs") return LEVELS[5];
    return LEVELS[6];
  }
  function toNum(v, issues, where) {
    if (v == null || v === "") return 0;
    if (typeof v === "boolean") return 0;
    if (typeof v === "number") {
      if (v < 0 || v !== Math.floor(v)) issues.push(where + ": unusual number " + v + " (counted as " + Math.max(0, Math.floor(v)) + ")");
      return Math.max(0, Math.floor(v));
    }
    var s = clean(v).replace(/^[`']+|[`']+$/g, "").trim();
    if (s === "") return 0;
    if (/^\d+$/.test(s)) { issues.push(where + ": number typed as text '" + clean(v) + "' (counted as " + parseInt(s, 10) + ")"); return parseInt(s, 10); }
    if (/^(O|0=)$/i.test(s)) { issues.push(where + ": '" + clean(v) + "' typed instead of 0 (counted as 0)"); return 0; }
    issues.push(where + ": text '" + clean(v) + "' in a number cell (counted as 0)");
    return 0;
  }

  function parseWorkbook(wb) {
    var out = { diag: {}, mani: {}, levels: {}, schools: {}, issues: [], sheets: [], schoolYear: "" };
    DIAG.forEach(function (c) { out.diag[c] = [0, 0]; });
    MANI.forEach(function (c) { out.mani[c] = [0, 0]; });

    wb.SheetNames.forEach(function (name) {
      var ws = wb.Sheets[name]; if (!ws || !ws["!ref"]) return;
      var range = XLSX.utils.decode_range(ws["!ref"]);
      var merged = {};
      (ws["!merges"] || []).forEach(function (m) {
        var top = ws[XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c })];
        for (var r = m.s.r; r <= m.e.r; r++) for (var c = m.s.c; c <= m.e.c; c++) merged[r + "," + c] = top ? top.v : null;
      });
      function raw(r, c) { var x = ws[XLSX.utils.encode_cell({ r: r, c: c })]; return x ? x.v : null; }
      function g(r, c) { var k = r + "," + c; return k in merged ? merged[k] : raw(r, c); }  // 0-based r,c

      var a1 = raw(0, 0), kind = sheetKind(name, a1);
      var sy = clean(a1).match(/S\.?\s*Y\.?\s*(\d{4})\s*[-–]\s*(\d{4})/i);
      if (sy && !out.schoolYear) out.schoolYear = sy[1] + "–" + sy[2];

      var totalCol = null;
      for (var c = 3; c <= range.e.c && totalCol === null; c++) for (var r = 2; r <= 4; r++) if (clean(g(r, c)).toUpperCase() === "TOTAL") { totalCol = c; break; }
      var last = totalCol === null ? range.e.c + 1 : totalCol;

      var blocks = [], cur = null, prevIdx = null, lvl = null;
      for (c = 3; c < last; c++) {
        var sx = clean(raw(4, c)).toLowerCase(), l4 = g(3, c);
        if (l4 != null && l4 !== "") lvl = normLevel(l4);
        if (sx !== "male" && sx !== "female") { cur = null; prevIdx = null; continue; }
        var idx = ORDER.indexOf(lvl); if (idx < 0) idx = null;
        if (!cur || (sx === "male" && idx !== null && prevIdx !== null && idx <= prevIdx && lvl !== cur.last)) { cur = { cols: [], last: null }; blocks.push(cur); }
        cur.cols.push([c, lvl, sx === "male" ? 0 : 1]); cur.last = lvl;
        if (sx === "male") prevIdx = idx;
      }
      if (blocks.length !== 19) throw new Error("Sheet \"" + name.trim() + "\": expected 19 groups of Male/Female columns (11 diagnosis + 8 manifestations) but found " + blocks.length + ". The sheet layout may have changed.");
      var sexCols = {}; blocks.forEach(function (b) { b.cols.forEach(function (x) { sexCols[x[0]] = 1; }); });

      var info = { sheet: name.trim(), kind: kind, total: 0, schools: 0, withLsen: 0 };
      for (r = 5; r <= range.e.r; r++) {
        var b = raw(r, 1), sid = null;
        if (typeof b === "number" && b >= 100000) sid = String(Math.floor(b));
        else if (typeof b === "string" && /^\s*\d{6,}\s*$/.test(b)) sid = b.trim();
        if (!sid) continue;
        var sname = fixText(raw(r, 2));
        var dist = (kind === "elem" || kind === "ngelem") ? fixText(raw(r, 0)) : "";
        info.schools++;
        var sch = out.schools[sid] || (out.schools[sid] = { id: sid, name: sname, district: "", kinds: {}, total: 0, male: 0, female: 0, diag: 0, mani: 0, elemDiag: 0, elemMani: 0, cats: {} });
        if (dist && !sch.district) sch.district = dist;
        var rowTot = 0;
        blocks.forEach(function (blk, bi) {
          var cat = bi < 11 ? DIAG[bi] : MANI[bi - 11];
          blk.cols.forEach(function (x) {
            var v = toNum(raw(r, x[0]), out.issues, info.sheet + " row " + (r + 1) + " (" + sname + ") cell " + colName(x[0]));
            if (!v) return;
            (bi < 11 ? out.diag : out.mani)[cat][x[2]] += v;
            var lb = bucket(kind, x[1]); out.levels[lb] = (out.levels[lb] || 0) + v;
            sch.cats[cat] = (sch.cats[cat] || 0) + v;
            if (x[2] === 0) sch.male += v; else sch.female += v;
            if (bi < 11) sch.diag += v; else sch.mani += v;
            if (kind === "elem" || kind === "ngelem") { if (bi < 11) sch.elemDiag += v; else sch.elemMani += v; }
            rowTot += v;
          });
        });
        for (c = 3; c < last; c++) {
          if (sexCols[c]) continue;
          var sv = raw(r, c);
          if (typeof sv === "number" && sv) out.issues.push(info.sheet + " row " + (r + 1) + " (" + sname + ") cell " + colName(c) + ": " + sv + " in a column with no grade/sex heading (NOT counted)");
        }
        if (rowTot) { sch.kinds[kind] = 1; sch.total += rowTot; info.withLsen++; }
        info.total += rowTot;
      }
      out.sheets.push(info);
    });
    if (!out.sheets.length) throw new Error("No sheets found in the file.");
    return out;
  }

  /* Turn the parsed counts into the site's data fields. */
  function toSiteData(p) {
    function pair(o) { return Object.keys(o).map(function (k) { return { category: k, male: o[k][0], female: o[k][1] }; }); }
    var diagT = 0, maniT = 0;
    Object.keys(p.diag).forEach(function (k) { diagT += p.diag[k][0] + p.diag[k][1]; });
    Object.keys(p.mani).forEach(function (k) { maniT += p.mani[k][0] + p.mani[k][1]; });
    var total = diagT + maniT;

    var schools = [], districts = {};
    Object.keys(p.schools).forEach(function (id) {
      var s = p.schools[id]; if (!s.total) return;
      var k = Object.keys(s.kinds), elem = k.some(function (x) { return x === "elem" || x === "ngelem"; }), sec = k.some(function (x) { return x === "jhs" || x === "ngjhs" || x === "shs"; });
      var offers = [];
      if (s.kinds.elem) offers.push("Graded K–6"); if (s.kinds.ngelem) offers.push("Non-graded (Elementary)");
      if (s.kinds.jhs) offers.push("JHS"); if (s.kinds.ngjhs) offers.push("Non-graded (Secondary)"); if (s.kinds.shs) offers.push("SHS");
      var cats = Object.keys(s.cats).filter(function (c) { return DIAG.indexOf(c) > -1; }).sort(function (a, b) { return s.cats[b] - s.cats[a]; });
      if (s.mani) cats.push("With manifestations");
      schools.push({ name: s.name, municipality: "", district: s.district, type: elem && sec ? "Integrated" : (sec ? "Secondary" : "Elementary"),
        programs: offers.concat(cats), lwd: s.total, male: s.male, female: s.female, teachers: null, id: s.id });
    });
    schools.sort(function (a, b) { return a.name.localeCompare(b.name); });

    // districts: elementary sheets only (the JHS/SHS sheets have no district column)
    Object.keys(p.schools).forEach(function (id) {
      var s = p.schools[id]; if (!s.district) return;
      var d = districts[s.district] || (districts[s.district] = { district: s.district, diagnosis: 0, manifestations: 0, lwd: 0, schools: 0 });
      d.diagnosis += s.elemDiag; d.manifestations += s.elemMani;
      if (s.elemDiag + s.elemMani > 0) d.schools++;
    });
    var byDistrict = Object.keys(districts).sort(function (a, b) { return a.localeCompare(b); }).map(function (k) {
      var d = districts[k]; d.lwd = d.diagnosis + d.manifestations; return d;
    });

    var schoolsWithLsen = schools.length;
    return {
      summary: { learnersTotal: total, withDiagnosis: diagT, withManifestations: maniT, schoolsWithLsen: schoolsWithLsen },
      byDisability: pair(p.diag),
      byManifestation: pair(p.mani),
      byLevel: LEVELS.map(function (l) { return { level: l, count: p.levels[l] || 0 }; }),
      byDistrict: byDistrict,
      schools: schools,
      schoolYear: p.schoolYear,
      total: total,
      issues: p.issues,
      sheets: p.sheets
    };
  }

  var API = { DIAG: DIAG, MANI: MANI, LEVELS: LEVELS, parseWorkbook: parseWorkbook, toSiteData: toSiteData };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.SNED_IMPORT = API;
})(typeof window !== "undefined" ? window : this);
