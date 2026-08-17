(function () {
  const filtersEl = document.getElementById("filters");
  const gridEl = document.getElementById("tipGrid");
  const dailyTipEl = document.getElementById("dailyTip");
  const dailyTipBtn = document.getElementById("dailyTipBtn");
  const quoteTextEl = document.getElementById("quoteText");
  const quoteAuthorEl = document.getElementById("quoteAuthor");

  let activeCategory = "all";

  function categoryLabel(id) {
    const found = CATEGORIES.find((c) => c.id === id);
    return found ? found.label : id;
  }

  function renderFilters() {
    const all = [{ id: "all", label: "Todas" }, ...CATEGORIES];
    filtersEl.innerHTML = "";
    all.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "filter-btn" + (cat.id === activeCategory ? " active" : "");
      btn.type = "button";
      btn.textContent = cat.label;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", cat.id === activeCategory ? "true" : "false");
      btn.addEventListener("click", () => {
        activeCategory = cat.id;
        renderFilters();
        renderGrid();
      });
      filtersEl.appendChild(btn);
    });
  }

  function tipCardHTML(tip) {
    return `
      <article class="tip-card">
        <span class="tip-category">${categoryLabel(tip.categoria)}</span>
        <h3>${tip.titulo}</h3>
        <p class="tip-source">${tip.fuente}</p>
        <p class="tip-summary">${tip.resumen}</p>
        <div class="tip-action"><strong>Paso de acción:</strong> ${tip.accion}</div>
      </article>
    `;
  }

  function renderGrid() {
    const filtered =
      activeCategory === "all"
        ? TIPS
        : TIPS.filter((t) => t.categoria === activeCategory);
    gridEl.innerHTML = filtered.map(tipCardHTML).join("");
  }

  function dayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  function renderDailyTip() {
    const tip = TIPS[dayOfYear() % TIPS.length];
    dailyTipEl.innerHTML = `
      <span class="tip-category">Tip del día · ${categoryLabel(tip.categoria)}</span>
      <h3>${tip.titulo}</h3>
      <p class="tip-source">${tip.fuente}</p>
      <p class="tip-summary">${tip.resumen}</p>
      <div class="tip-action"><strong>Paso de acción:</strong> ${tip.accion}</div>
    `;
    dailyTipEl.hidden = false;
    dailyTipEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderQuote() {
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    quoteTextEl.textContent = `“${quote.texto}”`;
    quoteAuthorEl.textContent = `— ${quote.autor}`;
  }

  dailyTipBtn.addEventListener("click", renderDailyTip);

  renderFilters();
  renderGrid();
  renderQuote();
})();
