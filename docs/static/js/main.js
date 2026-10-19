/* ABACUS project page: tables, charts, gallery and small interactions. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ data
     All numbers are taken from the paper (Tables 1, 2, 3 and 4). */

  var EDITORS = [
    { name: "Gemini 2.5 Flash Image", type: "prop", add: [0.52, 0.39, 0.26], remove: [0.45, 0.30, 0.18], change: [0.31, 0.22, 0.12], overall: [0.59, 0.77, 0.64, 0.29] },
    { name: "Seedream 4.0", type: "prop", add: [0.55, 0.42, 0.28], remove: [0.46, 0.31, 0.20], change: [0.38, 0.25, 0.14], overall: [0.60, 0.79, 0.66, 0.31] },
    { name: "GPT-Image-1", type: "prop", add: [0.51, 0.36, 0.25], remove: [0.38, 0.24, 0.17], change: [0.31, 0.18, 0.11], overall: [0.56, 0.75, 0.62, 0.26] },
    { name: "Qwen-Image-Edit", type: "open", add: [0.35, 0.23, 0.13], remove: [0.26, 0.18, 0.08], change: [0.18, 0.11, 0.05], overall: [0.42, 0.69, 0.55, 0.16] },
    { name: "FLUX.1 Kontext", type: "open", add: [0.30, 0.20, 0.12], remove: [0.24, 0.14, 0.08], change: [0.14, 0.09, 0.05], overall: [0.39, 0.67, 0.53, 0.14] },
    { name: "Step1X-Edit", type: "open", add: [0.24, 0.16, 0.10], remove: [0.18, 0.12, 0.07], change: [0.11, 0.06, 0.03], overall: [0.34, 0.64, 0.50, 0.11] },
    { name: "BAGEL", type: "open", add: [0.20, 0.13, 0.08], remove: [0.14, 0.08, 0.05], change: [0.10, 0.06, 0.03], overall: [0.30, 0.62, 0.47, 0.09] }
  ];

  var VIEWS = {
    overall: { cols: ["Count fidelity", "Scene consistency", "Conservation", "Score"], short: ["CF", "SC", "OC", "Score"], sortDefault: 3 },
    add: { cols: ["Easy", "Medium", "Hard"], short: ["E", "M", "H"], sortDefault: 0 },
    remove: { cols: ["Easy", "Medium", "Hard"], short: ["E", "M", "H"], sortDefault: 0 },
    change: { cols: ["Easy", "Medium", "Hard"], short: ["E", "M", "H"], sortDefault: 0 }
  };

  var SERIES = [
    { key: "abacus", name: "ABACUS (ours)", full: "ABACUS (ours)", color: "var(--s1)" },
    { key: "vlm", name: "Solo VLM", full: "Solo VLM (Qwen3.6-27B)", color: "var(--s2)" },
    { key: "det", name: "Single detector", full: "Single detector (Grounding-DINO)", color: "var(--s3)" }
  ];

  var TIER = {
    cats: ["Easy", "Medium", "Hard", "Overall"],
    values: { abacus: [0.89, 0.82, 0.76, 0.82], vlm: [0.71, 0.54, 0.45, 0.55], det: [0.37, 0.26, 0.23, 0.28] }
  };

  var STABILITY = {
    cats: ["Seedream 4.0", "Gemini 2.5", "GPT-Image-1", "Qwen-Image-Edit", "FLUX.1 Kontext", "Step1X-Edit", "BAGEL"],
    short: ["Seedream", "Gemini", "GPT-Image", "Qwen-Edit", "FLUX.1", "Step1X", "BAGEL"],
    values: {
      abacus: [0.83, 0.81, 0.81, 0.80, 0.80, 0.80, 0.79],
      vlm: [0.54, 0.53, 0.51, 0.47, 0.43, 0.41, 0.37],
      det: [0.25, 0.24, 0.23, 0.22, 0.20, 0.18, 0.16]
    }
  };

  var GALLERY = [
    { label: "Add 4 backpacks", base: "static/images/walk_add_backpacks", w: 1800, h: 1374,
      cap: "<strong>Every stage on one edit.</strong> Segmentation, one-to-one matching, clean-image construction and dual-detector confirmation, plus the rare ambiguity step (bottom row) where unconfirmed crops are super-resolved and checked by the constrained verifier. The editor adds five backpacks for K = 4, and ABACUS penalizes the miscount." },
    { label: "Add a zebra", base: "static/images/walk_add_zebra", w: 1800, h: 1020,
      cap: "<strong>A correct addition.</strong> The new zebra stands behind the grazing animals, yet it is segmented, isolated by inpainting and confirmed by both detectors. ABACUS counts one new zebra for K = 1 and credits the edit." },
    { label: "Add 2 spoons", base: "static/images/walk_add_spoon", w: 1800, h: 1033,
      cap: "<strong>A caught over-addition.</strong> Asked for two spoons, the editor produces three. ABACUS counts the surplus and count fidelity penalizes it, a miscount that a holistic or VLM-judge score would overlook." },
    { label: "Add 10 bottles", base: "static/images/walk_add_bottle10", w: 1800, h: 1033,
      cap: "<strong>High-count stress case.</strong> The editor packs in fifteen bottles for K = 10. Presence-gated segmentation and dual-detector confirmation resolve the dense, overlapping instances and ABACUS reports 15." },
    { label: "Ground-truth repair", base: "static/images/walk_gt_completion", w: 1800, h: 1033,
      cap: "<strong>Repairing incomplete annotations.</strong> On an <em>add 2 chairs</em> edit, background chairs missing from the panoptic labels are first flagged as new. Segmenting the source image finds their counterparts and rescues them, so only the genuinely added chairs are counted." },
    { label: "Change 2 horses to zebras", base: "static/images/walk_change_horse_zebra", w: 1800, h: 831,
      cap: "<strong>A change, credited in place.</strong> The remove branch tracks the source horses and the add branch the new zebras. Matching their positions credits a transformation only where a horse originally stood, which rejects delete-here, paint-there edits." }
  ];

  /* --------------------------------------------------------------- helpers */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var fmt = function (v) { return v.toFixed(2); };
  var SVGNS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ----------------------------------------------------------- leaderboard */
  var lbState = { view: "overall", sortCol: 3, dir: -1 };

  function lbValues(e, view) { return view === "overall" ? e.overall : e[view]; }

  function renderLeaderboard() {
    var table = $("#leaderboard");
    if (!table) return;
    var view = VIEWS[lbState.view];
    var rows = EDITORS.slice().sort(function (a, b) {
      return (lbValues(a, lbState.view)[lbState.sortCol] - lbValues(b, lbState.view)[lbState.sortCol]) * lbState.dir ||
        a.name.localeCompare(b.name);
    });
    var best = view.cols.map(function (_, i) {
      return Math.max.apply(null, EDITORS.map(function (e) { return lbValues(e, lbState.view)[i]; }));
    });
    var isOverall = lbState.view === "overall";

    var head = '<tr><th class="nosort rank" scope="col">#</th><th class="nosort model" scope="col">Model</th>';
    view.cols.forEach(function (c, i) {
      var sorted = i === lbState.sortCol;
      head += '<th scope="col" data-col="' + i + '" class="' + (sorted ? "sorted" : "") + '"' +
        ' aria-sort="' + (sorted ? (lbState.dir < 0 ? "descending" : "ascending") : "none") + '" tabindex="0" title="Sort by ' + c + '">' +
        '<span class="full">' + c + '</span><span class="short">' + view.short[i] + '</span><span class="arrow">' + (sorted && lbState.dir > 0 ? "&#9650;" : "&#9660;") + "</span></th>";
    });
    head += "</tr>";
    $("thead", table).innerHTML = head;

    $("tbody", table).innerHTML = rows.map(function (e, r) {
      var vals = lbValues(e, lbState.view);
      var cells = vals.map(function (v, i) {
        var cls = [];
        if (v === best[i]) cls.push("best");
        var isScore = isOverall && i === 3;
        if (isScore) cls.push("score-col", "bar-cell");
        var bar = isScore ? '<span class="bar" aria-hidden="true"><i style="width:' + Math.round(v / 0.35 * 100) + '%"></i></span>' : "";
        return '<td class="' + cls.join(" ") + '">' + fmt(v) + bar + "</td>";
      }).join("");
      return '<tr><td class="rank">' + (r + 1) + '</td><th scope="row" class="model">' + e.name.split(" ").map(function (w) { return '<span class="nw">' + esc(w) + "</span>"; }).join(" ") +
        '<span class="tag ' + e.type + '">' + (e.type === "prop" ? "Proprietary" : "Open") + "</span></th>" + cells + "</tr>";
    }).join("");
  }

  function initLeaderboard() {
    var table = $("#leaderboard");
    if (!table) return;
    $$(".tabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".tabs button").forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
        lbState.view = b.dataset.view;
        lbState.sortCol = VIEWS[lbState.view].sortDefault;
        lbState.dir = -1;
        renderLeaderboard();
      });
    });
    function sortBy(th) {
      var c = +th.dataset.col;
      if (c === lbState.sortCol) lbState.dir *= -1; else { lbState.sortCol = c; lbState.dir = -1; }
      renderLeaderboard();
      var again = $('thead th[data-col="' + c + '"]', table);
      if (again) again.focus();
    }
    $("thead", table).addEventListener("click", function (ev) {
      var th = ev.target.closest("th[data-col]");
      if (th) sortBy(th);
    });
    $("thead", table).addEventListener("keydown", function (ev) {
      var th = ev.target.closest("th[data-col]");
      if (th && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); sortBy(th); }
    });
    renderLeaderboard();
  }

  /* --------------------------------------------------------------- charts */
  function legend(id) {
    var box = document.getElementById(id);
    if (!box) return;
    box.innerHTML = SERIES.map(function (s) {
      return '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + "</span>";
    }).join("");
  }

  function tooltip(container) {
    var t = container.querySelector(".tooltip");
    if (!t) { t = document.createElement("div"); t.className = "tooltip"; t.setAttribute("role", "status"); container.appendChild(t); }
    return t;
  }
  function showTip(container, tip, html, x, y) {
    tip.innerHTML = html;
    tip.classList.add("on");
    var cw = container.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
    var left = x + 14;
    if (left + tw > cw) left = x - tw - 14;
    if (left < 0) left = Math.max(0, Math.min(cw - tw, x - tw / 2));
    var top = Math.max(0, y - th - 10);
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function hideTip(tip) { tip.classList.remove("on"); }
  function tipHTML(title, rows) {
    return '<div class="tt-title">' + esc(title) + "</div>" + rows.map(function (r) {
      return '<div class="tt-row"><i style="background:' + r.color + '"></i>' + esc(r.name) + "<b>" + fmt(r.v) + "</b></div>";
    }).join("");
  }

  function yAxis(svg, m, w, h, ih) {
    var g = el("g", { "class": "grid" }, svg);
    [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
      var y = m.t + ih * (1 - t);
      el("line", { x1: m.l, x2: w - m.r, y1: y, y2: y }, g);
      var tx = el("text", { "class": "tick", x: m.l - 8, y: y + 4, "text-anchor": "end" }, svg);
      tx.textContent = t === 0 ? "0" : t.toFixed(2).replace(/0$/, "");
    });
  }

  function roundTopBar(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return "M" + x + "," + (y + h) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y +
      "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + h) + "Z";
  }

  function drawTierChart(width) {
    var box = $("#chart-tier");
    if (!box) return;
    var w = Math.max(280, width), small = w < 440;
    var h = small ? 250 : 290;
    var m = { t: 18, r: 6, b: 30, l: 36 };
    var iw = w - m.l - m.r, ih = h - m.t - m.b;
    $$("svg", box).forEach(function (s) { s.remove(); });
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, role: "img", "aria-label": "Grouped bar chart of exact-count agreement with human counts by tier. ABACUS 0.89, 0.82, 0.76, overall 0.82. Solo VLM 0.71, 0.54, 0.45, overall 0.55. Single detector 0.37, 0.26, 0.23, overall 0.28." });
    box.insertBefore(svg, box.firstChild);
    yAxis(svg, m, w, h, ih);
    var band = iw / TIER.cats.length, gap = 2;
    var groupW = band * (small ? 0.78 : 0.7), bw = (groupW - gap * (SERIES.length - 1)) / SERIES.length;
    var tip = tooltip(box);
    TIER.cats.forEach(function (cat, ci) {
      var gx = m.l + band * ci + (band - groupW) / 2;
      SERIES.forEach(function (s, si) {
        var v = TIER.values[s.key][ci], bh = ih * v, x = gx + si * (bw + gap), y = m.t + ih - bh;
        el("path", { d: roundTopBar(x, y, bw, bh, 4), style: "fill:" + s.color }, svg);
        if (!small || si === 0) {
          var t = el("text", { "class": "val", x: x + bw / 2, y: y - 5, "text-anchor": "middle" }, svg);
          t.textContent = fmt(v).replace(/^0/, "");
        }
      });
      var lx = el("text", { "class": "xlabel", x: m.l + band * ci + band / 2, y: h - 8, "text-anchor": "middle" }, svg);
      lx.textContent = cat;
      if (ci === TIER.cats.length - 1) {
        el("line", { x1: m.l + band * ci, x2: m.l + band * ci, y1: m.t, y2: m.t + ih, style: "stroke:var(--line-strong);stroke-dasharray:3 3" }, svg);
      }
      var hit = el("rect", { "class": "hit", x: m.l + band * ci, y: m.t, width: band, height: ih }, svg);
      var html = tipHTML(cat === "Overall" ? "Overall (600 edits)" : cat + " tier", SERIES.map(function (s) {
        return { name: s.full, color: s.color, v: TIER.values[s.key][ci] };
      }));
      hit.addEventListener("mousemove", function (ev) {
        var r = box.getBoundingClientRect();
        showTip(box, tip, html, ev.clientX - r.left, ev.clientY - r.top);
      });
      hit.addEventListener("mouseleave", function () { hideTip(tip); });
    });
    el("line", { x1: m.l, x2: w - m.r, y1: m.t + ih, y2: m.t + ih, style: "stroke:var(--line-strong)" }, svg);
  }

  function drawStabilityChart(width) {
    var box = $("#chart-editor");
    if (!box) return;
    var w = Math.max(280, width), small = w < 440;
    var rightPad = small ? 12 : 40;
    var tight = (w - 36 - rightPad) / (STABILITY.cats.length - 1) < 82;
    var h = (small ? 250 : 290) + (tight ? 22 : 0);
    var m = { t: 18, r: rightPad, b: tight ? 52 : 30, l: 36 };
    var iw = w - m.l - m.r, ih = h - m.t - m.b;
    $$("svg", box).forEach(function (s) { s.remove(); });
    var svg = el("svg", { viewBox: "0 0 " + w + " " + h, width: w, height: h, role: "img", "aria-label": "Line chart of exact-count agreement across seven editors from strongest to weakest. ABACUS stays between 0.83 and 0.79. The solo VLM falls from 0.54 to 0.37 and the single detector from 0.25 to 0.16." });
    box.insertBefore(svg, box.firstChild);
    yAxis(svg, m, w, h, ih);
    var n = STABILITY.cats.length, step = iw / (n - 1);
    var X = function (i) { return m.l + step * i; };
    var Y = function (v) { return m.t + ih * (1 - v); };
    el("line", { x1: m.l, x2: w - m.r, y1: m.t + ih, y2: m.t + ih, style: "stroke:var(--line-strong)" }, svg);

    STABILITY.short.forEach(function (lab, i) {
      var ly = m.t + ih + 18;
      var t = el("text", { "class": "xlabel", x: X(i), y: tight ? ly - 2 : h - 8, "text-anchor": tight ? "end" : "middle" }, svg);
      if (tight) t.setAttribute("transform", "rotate(-35 " + X(i) + " " + (ly - 2) + ")");
      t.textContent = lab;
    });

    var cross = el("line", { "class": "crosshair", x1: 0, x2: 0, y1: m.t, y2: m.t + ih, opacity: 0 }, svg);
    SERIES.forEach(function (s) {
      var vals = STABILITY.values[s.key];
      el("path", { d: vals.map(function (v, i) { return (i ? "L" : "M") + X(i) + "," + Y(v); }).join(""), style: "fill:none;stroke:" + s.color + ";stroke-width:2;stroke-linejoin:round;stroke-linecap:round" }, svg);
      vals.forEach(function (v, i) {
        el("circle", { cx: X(i), cy: Y(v), r: 4, style: "fill:" + s.color + ";stroke:var(--surface);stroke-width:2" }, svg);
      });
      if (!small) {
        var last = vals[n - 1];
        var t = el("text", { "class": "dlabel", x: X(n - 1) + 10, y: Y(last) + 4 }, svg);
        t.textContent = fmt(last).replace(/^0/, "");
      }
    });
    if (!small) {
      var f = el("text", { "class": "val", x: X(0) - 6, y: Y(STABILITY.values.abacus[0]) - 10, "text-anchor": "start" }, svg);
      f.textContent = fmt(STABILITY.values.abacus[0]).replace(/^0/, "");
      f = el("text", { "class": "val", x: X(0) - 6, y: Y(STABILITY.values.vlm[0]) - 10, "text-anchor": "start" }, svg);
      f.textContent = fmt(STABILITY.values.vlm[0]).replace(/^0/, "");
      f = el("text", { "class": "val", x: X(0) - 6, y: Y(STABILITY.values.det[0]) - 10, "text-anchor": "start" }, svg);
      f.textContent = fmt(STABILITY.values.det[0]).replace(/^0/, "");
    }

    var tip = tooltip(box);
    STABILITY.cats.forEach(function (cat, i) {
      var x0 = i === 0 ? m.l - 6 : X(i) - step / 2, x1 = i === n - 1 ? X(i) + 6 : X(i) + step / 2;
      var hit = el("rect", { "class": "hit", x: x0, y: m.t, width: x1 - x0, height: ih }, svg);
      var html = tipHTML(cat, SERIES.map(function (s) { return { name: s.full, color: s.color, v: STABILITY.values[s.key][i] }; }));
      hit.addEventListener("mousemove", function (ev) {
        cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("opacity", 1);
        var r = box.getBoundingClientRect();
        showTip(box, tip, html, ev.clientX - r.left, ev.clientY - r.top);
      });
      hit.addEventListener("mouseleave", function () { cross.setAttribute("opacity", 0); hideTip(tip); });
    });
  }

  function chartTables() {
    var t1 = $("#tier-table");
    if (t1) {
      t1.innerHTML = '<table class="data"><thead><tr><th scope="col">Evaluator</th>' + TIER.cats.map(function (c) { return '<th scope="col">' + c + "</th>"; }).join("") +
        "</tr></thead><tbody>" + SERIES.map(function (s) {
          return '<tr><th scope="row">' + esc(s.full) + "</th>" + TIER.values[s.key].map(function (v) { return "<td>" + fmt(v) + "</td>"; }).join("") + "</tr>";
        }).join("") + "</tbody></table>";
    }
    var t2 = $("#editor-table");
    if (t2) {
      t2.innerHTML = '<table class="data"><thead><tr><th scope="col">Editor</th>' + SERIES.map(function (s) { return '<th scope="col">' + esc(s.name) + "</th>"; }).join("") +
        "</tr></thead><tbody>" + STABILITY.cats.map(function (c, i) {
          return '<tr><th scope="row">' + esc(c) + "</th>" + SERIES.map(function (s) { return "<td>" + fmt(STABILITY.values[s.key][i]) + "</td>"; }).join("") + "</tr>";
        }).join("") + "</tbody></table>";
    }
    $$("[data-table-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var target = document.getElementById(b.dataset.tableToggle);
        var open = target.hasAttribute("hidden");
        if (open) target.removeAttribute("hidden"); else target.setAttribute("hidden", "");
        b.setAttribute("aria-expanded", open ? "true" : "false");
        b.textContent = open ? "Hide table" : "Show as table";
      });
    });
  }

  function initCharts() {
    legend("legend-tier");
    legend("legend-editor");
    chartTables();
    var tierBox = $("#chart-tier"), editorBox = $("#chart-editor");
    if (!tierBox || !editorBox) return;
    var drawn = false, lastW = [0, 0];
    var draw = function () {
      var w = [tierBox.clientWidth, editorBox.clientWidth];  // read first
      if (drawn && w[0] === lastW[0] && w[1] === lastW[1]) return;
      lastW = w;
      drawn = true;
      $$(".chart .tooltip").forEach(function (t) { t.classList.remove("on"); });
      drawTierChart(w[0]);                                    // then write
      drawStabilityChart(w[1]);
    };
    var pending;
    window.addEventListener("resize", function () { if (!drawn) return; cancelAnimationFrame(pending); pending = requestAnimationFrame(draw); });
    // draw only when the charts come near the viewport
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); requestAnimationFrame(draw); }
      }, { rootMargin: "600px 0px" });
      io.observe(tierBox);
    } else {
      draw();
    }
  }

  /* -------------------------------------------------------------- gallery */
  function initGallery() {
    var chips = $("#gallery-chips"), img = $("#gallery-img"), cap = $("#gallery-cap");
    if (!chips) return;
    chips.innerHTML = GALLERY.map(function (g, i) {
      return '<button role="tab" type="button" aria-selected="' + (i === 0) + '" data-i="' + i + '">' + esc(g.label) + "</button>";
    }).join("");
    function show(i) {
      var g = GALLERY[i];
      $$("button", chips).forEach(function (b) { b.setAttribute("aria-selected", +b.dataset.i === i ? "true" : "false"); });
      img.classList.add("loading");
      var full = g.base + ".webp", srcset = g.base + "-1000.webp 1000w, " + full + " 1800w";
      var pre = new Image();
      pre.sizes = img.sizes;
      pre.onload = function () {
        img.srcset = srcset; img.src = full; img.width = g.w; img.height = g.h;
        img.alt = g.label + ": pipeline walkthrough";
        img.classList.remove("loading");
      };
      pre.srcset = srcset;
      pre.src = full;
      cap.innerHTML = g.cap;
    }
    chips.addEventListener("click", function (ev) {
      var b = ev.target.closest("button[data-i]");
      if (b) show(+b.dataset.i);
    });
    cap.innerHTML = GALLERY[0].cap;
    img.alt = GALLERY[0].label + ": pipeline walkthrough";
  }

  /* ------------------------------------------------------------- lightbox */
  function initLightbox() {
    var dlg = $("#lightbox");
    if (!dlg || typeof dlg.showModal !== "function") return;
    var big = document.createElement("img");
    big.id = "lightbox-img";
    big.alt = "";
    dlg.appendChild(big);
    function open(src, alt) { big.src = src; big.alt = alt || ""; dlg.showModal(); }
    var trigger = $("#gallery-open");
    if (trigger) trigger.addEventListener("click", function () { var i = $("#gallery-img"); open(i.getAttribute("src"), i.alt); });
    var hint = '<span class="zoom-hint" aria-hidden="true"><svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8M10.5 7.5v6M7.5 10.5h6"/></g></svg></span>';
    $$(".figure div.paper > img").forEach(function (im) {
      im.style.cursor = "zoom-in";
      im.parentNode.classList.add("zoom");
      im.insertAdjacentHTML("afterend", hint);
      im.addEventListener("click", function () { open(im.getAttribute("data-full") || im.getAttribute("src"), im.alt); });
    });
    $(".lb-close", dlg).addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (ev) { if (ev.target === dlg) dlg.close(); });
  }

  /* ---------------------------------------------------------------- theme */
  function initTheme() {
    var btn = $("#theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var root = document.documentElement;
      var current = root.getAttribute("data-theme") ||
        (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("abacus-theme", next); } catch (e) {}
    });
  }

  /* ------------------------------------------------------------ nav state */
  function initNav() {
    // Sections skip off-screen layout (content-visibility). Before jumping to an
    // anchor, lay everything out once so the scroll target is exact.
    var renderAll = function () { document.documentElement.classList.add("cv-all"); };
    if (location.hash) renderAll();
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest('a[href^="#"]');
      if (a) renderAll();
    }, true);
    window.addEventListener("hashchange", renderAll);
    var nav = $(".nav");
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (!("IntersectionObserver" in window)) return;
    var links = $$(".nav-links a");
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (a) { a.classList.remove("active"); });
          map[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------------------------------------------------------------- misc */
  function initCopy() {
    var b = $("#copy-bib");
    if (!b) return;
    b.addEventListener("click", function () {
      var text = $("#bib").textContent;
      var done = function () { b.textContent = "Copied"; b.classList.add("done"); setTimeout(function () { b.textContent = "Copy"; b.classList.remove("done"); }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
      else {
        var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        ta.remove();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLeaderboard();
    initCharts();
    initGallery();
    initLightbox();
    initTheme();
    initNav();
    initCopy();
  });
})();
