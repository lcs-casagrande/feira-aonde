(() => {
  const scriptUrl = document.currentScript ? document.currentScript.src : new URL("static/api-client.js", document.baseURI).href;
  const staticBase = new URL("api/", scriptUrl);
  const nativeFetch = window.fetch.bind(window);
  const cache = new Map();

  async function loadDataset(name) {
    if (!cache.has(name)) {
      cache.set(name, nativeFetch(new URL(name + ".json", staticBase), {cache: "no-store"}).then(response => response.json()));
    }
    return cache.get(name);
  }

  function first(params, key) {
    return (params.get(key) || "").trim();
  }

  function monthKey(row) {
    return `${String(row.ano).padStart(4, "0")}-${String(row.mes).padStart(2, "0")}`;
  }

  function jsonResponse(payload) {
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {"Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"}
    });
  }

  function numberFilter(params, key) {
    const value = first(params, key);
    return value ? Number(value) : null;
  }

  function sortByTickerYearMonth(left, right) {
    return left.ticker.localeCompare(right.ticker) || left.ano - right.ano || left.mes - right.mes;
  }

  async function handleApi(url) {
    const endpoint = url.pathname.replace(/\/+$/, "");
    const params = url.searchParams;

    if (endpoint.endsWith("/api/status")) {
      return jsonResponse(await loadDataset("status"));
    }

    if (endpoint.endsWith("/api/acoes")) {
      let rows = [...(await loadDataset("acoes"))];
      const q = first(params, "q").toUpperCase();
      const filters = [
        ["min_dy", "dividend_yield_pct"],
        ["min_yield_cost", "yield_cost_pct"],
        ["min_variacao", "variacao_pct"],
        ["min_dividendos", "dividendos_12m"]
      ];
      filters.forEach(([param, field]) => {
        const value = numberFilter(params, param);
        if (value != null && Number.isFinite(value)) rows = rows.filter(row => Number(row[field]) >= value);
      });
      if (q) rows = rows.filter(row => `${row.ticker} ${row.empresa}`.toUpperCase().includes(q));
      const sortMap = {
        dy: "dividend_yield_pct",
        yield_cost: "yield_cost_pct",
        variacao: "variacao_pct",
        dividendos: "dividendos_12m",
        preco: "preco_atual"
      };
      const field = sortMap[first(params, "sort") || "dy"] || "dividend_yield_pct";
      rows.sort((left, right) => (Number(right[field]) || 0) - (Number(left[field]) || 0) || left.ticker.localeCompare(right.ticker));
      return jsonResponse({total: rows.length, dados: rows});
    }

    if (endpoint.endsWith("/api/cotahist")) {
      let rows = [...(await loadDataset("cotahist"))];
      const ticker = first(params, "ticker").toUpperCase();
      const anoInicio = numberFilter(params, "ano_inicio");
      const anoFim = numberFilter(params, "ano_fim");
      if (ticker) rows = rows.filter(row => row.ticker === ticker);
      if (anoInicio != null) rows = rows.filter(row => row.ano >= anoInicio);
      if (anoFim != null) rows = rows.filter(row => row.ano <= anoFim);
      rows.sort(sortByTickerYearMonth);
      return jsonResponse({total: rows.length, dados: rows});
    }

    if (endpoint.endsWith("/api/indicadores")) {
      let rows = [...(await loadDataset("indicadores"))];
      const ticker = first(params, "ticker").toUpperCase();
      const anoInicio = numberFilter(params, "ano_inicio");
      const anoFim = numberFilter(params, "ano_fim");
      const inicio = first(params, "inicio");
      const fim = first(params, "fim");
      if (ticker) rows = rows.filter(row => row.ticker === ticker);
      if (anoInicio != null) rows = rows.filter(row => row.ano >= anoInicio);
      if (anoFim != null) rows = rows.filter(row => row.ano <= anoFim);
      if (inicio) rows = rows.filter(row => monthKey(row) >= inicio);
      if (fim) rows = rows.filter(row => monthKey(row) <= fim);
      rows.sort(sortByTickerYearMonth);
      return jsonResponse({total: rows.length, dados: rows});
    }

    return null;
  }

  window.fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input.url, window.location.href);
    if (url.pathname.includes("/api/")) {
      const response = await handleApi(url);
      if (response) return response;
    }
    return nativeFetch(input, init);
  };
})();