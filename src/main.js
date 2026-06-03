const { useEffect, useMemo, useRef, useState } = React;

const weekDays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

const dayColors = {
  "Segunda-feira": "#258b52",
  "Terça-feira": "#d88920",
  "Quarta-feira": "#2775b6",
  "Quinta-feira": "#865bb8",
  "Sexta-feira": "#bf4f73",
  Sábado: "#0c8c90",
  Domingo: "#2fa35d",
};

const cityViews = {
  Guarulhos: { center: [-23.4543, -46.5337], zoom: 12 },
  "São Paulo": { center: [-23.5505, -46.6333], zoom: 12 },
};

const productTags = {
  Orgânica: ["Orgânicos", "Verduras", "Frutas"],
  Noturna: ["Comida pronta", "Pastel", "Caldo de cana"],
  Tradicional: ["Frutas", "Verduras", "Pastel"],
  "Feira livre tradicional": ["Frutas", "Verduras", "Pastel"],
};

function Icon({ type, size = 18, className = "" }) {
  let path = "M12 22s7-5.2 7-12a7 7 0 10-14 0c0 6.8 7 12 7 12zm0-9a3 3 0 100-6 3 3 0 000 6z";
  if (type === "map") path = "M4 6l5-2 6 2 5-2v16l-5 2-6-2-5 2V6zm5-2v16m6-14v16";
  if (type === "calendar") path = "M7 3v4m10-4v4M4 9h20M5 5h18v19H5V5z";
  if (type === "search") path = "M10 18a8 8 0 110-16 8 8 0 010 16zm6-2l6 6";
  if (type === "heart") path = "M20.8 4.6a5.2 5.2 0 00-7.4 0L12 6l-1.4-1.4a5.2 5.2 0 00-7.4 7.4L12 21l8.8-9a5.2 5.2 0 000-7.4z";
  if (type === "plus") path = "M12 5v14M5 12h14";
  if (type === "route") path = "M6 19a3 3 0 100-6 3 3 0 000 6zM18 7a3 3 0 100-6 3 3 0 000 6zM6 13V9a4 4 0 014-4h5";
  if (type === "star") path = "M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 21l1.1-6.5-4.7-4.6 6.5-.9L12 3z";
  if (type === "clock") path = "M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
  if (type === "list") path = "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01";
  if (type === "edit") path = "M4 20h4l12-12-4-4L4 16v4zm12-16l4 4";
  if (type === "camera") path = "M4 8h4l2-3h4l2 3h4v14H4V8zm8 13a5 5 0 100-10 5 5 0 000 10z";
  if (type === "check") path = "M5 12l4 4L19 6";

  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function App() {
  const [page, setPage] = useState("map");
  const [fairs, setFairs] = useState([]);
  const [selectedFair, setSelectedFair] = useState(null);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    fetch("./data/feiras.json")
      .then((response) => response.json())
      .then((data) => {
        setFairs(data);
        setSelectedFair(makeDisplayFair(data.find((fair) => fair.municipio === "Guarulhos") || data[0]));
        if (window.__feiraReady) window.__feiraReady();
      })
      .catch((error) => {
        setDataError("Não foi possível carregar a base de feiras. Atualize a página.");
        if (window.__feiraReady) window.__feiraReady();
      });
  }, []);

  return (
    <main className="feira-app">
      {dataError && <div className="app-warning">{dataError}</div>}
      {page === "map" ? (
        <MapExperience fairs={fairs} selectedFair={selectedFair} onSelectFair={setSelectedFair} onChangePage={setPage} />
      ) : (
        <ContributionPage page={page} onChangePage={setPage} />
      )}
    </main>
  );
}

function MapExperience({ fairs, selectedFair, onSelectFair, onChangePage }) {
  const [city, setCity] = useState("Guarulhos");
  const [day, setDay] = useState(todayName());
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState("today");

  const filteredFairs = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return fairs
      .filter((fair) => fair.municipio === city)
      .filter((fair) => {
        if (quickFilter === "open-now" || quickFilter === "today") return fair.dia_semana === day;
        if (quickFilter === "organic") return normalizeText(fair.categoria).includes("organica");
        if (quickFilter === "pastel") return true;
        if (quickFilter === "best") return true;
        return fair.dia_semana === day;
      })
      .filter((fair) => {
        if (!normalizedQuery) return true;
        return [fair.nome_feira, fair.bairro, fair.endereco, fair.categoria, fair.dia_semana]
          .map(normalizeText)
          .some((value) => value.includes(normalizedQuery));
      })
      .slice(0, 38)
      .map(makeDisplayFair);
  }, [city, day, fairs, query, quickFilter]);

  useEffect(() => {
    if (!filteredFairs.length) return;
    onSelectFair((current) => current || filteredFairs[0]);
  }, [filteredFairs, onSelectFair]);

  return (
    <section className="map-screen">
      <header className="topbar">
        <button className="brand-button" type="button" onClick={() => onChangePage("map")}>
          <span className="brand-icon">🥬</span>
          <span>
            <strong>Feira Perto</strong>
            <small>Encontre a feira certa, no dia certo.</small>
          </span>
        </button>

        <label className="search-box">
          <Icon type="search" size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar feira, bairro ou produto..."
          />
        </label>

        <nav className="top-nav" aria-label="Navegação principal">
          <button className="active" type="button"><Icon type="map" />Mapa</button>
          <button type="button" onClick={() => setQuickFilter("today")}><Icon type="calendar" />Hoje</button>
          <button type="button"><Icon type="search" />Buscar</button>
          <button type="button"><Icon type="heart" />Salvos</button>
          <button type="button" onClick={() => onChangePage("quick")}><Icon type="plus" />Contribuir</button>
        </nav>
      </header>

      <div className="quickbar">
        <button className="primary-action" type="button" onClick={() => setQuickFilter("open-now")}>
          <Icon type="calendar" />
          Ver feiras abertas hoje
        </button>
        <SegmentedSelect label="Cidade" value={city} onChange={setCity} options={["Guarulhos", "São Paulo"]} />
        <SegmentedSelect label="Dia" value={day} onChange={setDay} options={weekDays} />
        <FilterChip active={quickFilter === "open-now"} onClick={() => setQuickFilter("open-now")} label="Abertas agora" />
        <FilterChip active={quickFilter === "today"} onClick={() => setQuickFilter("today")} label="Hoje" />
        <FilterChip active={quickFilter === "organic"} onClick={() => setQuickFilter("organic")} label="Orgânicas" />
        <FilterChip active={quickFilter === "pastel"} onClick={() => setQuickFilter("pastel")} label="Tem pastel" />
        <FilterChip active={quickFilter === "best"} onClick={() => setQuickFilter("best")} label="Melhor avaliadas" />
      </div>

      <div className="map-grid">
        <NearbyList fairs={filteredFairs} city={city} onSelectFair={onSelectFair} onChangePage={onChangePage} />
        <FairMap fairs={filteredFairs} selectedFair={selectedFair} city={city} onSelectFair={onSelectFair} />
        <FairDetails fair={selectedFair || filteredFairs[0]} onChangePage={onChangePage} />
      </div>

      <nav className="mobile-nav" aria-label="Navegação mobile">
        <button className="active" type="button"><Icon type="map" />Mapa</button>
        <button type="button" onClick={() => setQuickFilter("today")}><Icon type="calendar" />Hoje</button>
        <button type="button"><Icon type="search" />Buscar</button>
        <button type="button"><Icon type="heart" />Salvos</button>
        <button type="button" onClick={() => onChangePage("quick")}><Icon type="plus" />Contribuir</button>
      </nav>
    </section>
  );
}

function NearbyList({ fairs, city, onSelectFair, onChangePage }) {
  return (
    <aside className="nearby-panel">
      <div className="panel-heading">
        <div>
          <h2>Feiras perto de você</h2>
          <p>{city}, SP · {fairs.length} resultados</p>
        </div>
        <button type="button" onClick={() => onChangePage("complete")}>Cadastrar</button>
      </div>

      <div className="fair-cards">
        {fairs.slice(0, 9).map((fair, index) => (
          <article key={fair.id} className="mini-card" onClick={() => onSelectFair(fair)}>
            <span className={`status-dot ${fair.statusKind}`} />
            <div className="mini-main">
              <div className="mini-title-row">
                <h3>{fair.shortName}</h3>
                <span className={`status-pill-small ${fair.statusKind}`}>{fair.statusLabel}</span>
              </div>
              <p>{fair.distance} km · {fair.bairro}</p>
              <div className="rating-line">
                <span>⭐ {fair.rating}</span>
                <span>{fair.scheduleLabel}</span>
              </div>
              <div className="tag-row">
                {fair.products.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
              <div className="card-actions">
                <button type="button"><Icon type="list" />Ver detalhes</button>
                <a href={mapsUrl(fair)} target="_blank" rel="noreferrer"><Icon type="route" />Como chegar</a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button className="load-more" type="button">Ver mais feiras</button>
    </aside>
  );
}

function FairMap({ fairs, selectedFair, city, onSelectFair }) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current || !window.L) return;
    const view = cityViews[city];
    mapRef.current = window.L.map(mapNodeRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView(view.center, view.zoom);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapRef.current);

    window.L.control.zoom({ position: "right" }).addTo(mapRef.current);
    layerRef.current = window.L.layerGroup().addTo(mapRef.current);
  }, [city]);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    const view = cityViews[city];
    mapRef.current.setView(view.center, view.zoom);
    layerRef.current.clearLayers();

    fairs.slice(0, 28).forEach((fair, index) => {
      const coords = pseudoCoords(fair, city, index);
      const color = statusColor(fair.statusKind);
      const icon = window.L.divIcon({
        className: "fair-marker",
        html: `<span style="background:${color}">${fair.markerIcon}</span>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = window.L.marker(coords, { icon }).addTo(layerRef.current);
      marker.on("click", () => onSelectFair(fair));
      marker.bindTooltip(fair.shortName, { direction: "top", offset: [0, -14] });

      drawStreetTint(coords, color).addTo(layerRef.current);
    });
  }, [city, fairs, onSelectFair]);

  useEffect(() => {
    if (!mapRef.current || !selectedFair) return;
    const coords = pseudoCoords(selectedFair, selectedFair.municipio, 0);
    mapRef.current.panTo(coords);
  }, [selectedFair]);

  return (
    <section className="map-stage">
      <div ref={mapNodeRef} className="main-map" aria-label="Mapa das feiras próximas" />
      <div className="map-legend">
        <strong>Legenda</strong>
        <span><i className="open" />Aberta agora</span>
        <span><i className="later" />Abre mais tarde</span>
        <span><i className="closed" />Fechada agora</span>
      </div>
    </section>
  );
}

function FairDetails({ fair, onChangePage }) {
  if (!fair) {
    return (
      <aside className="details-panel empty">
        <strong>Carregando feiras...</strong>
      </aside>
    );
  }

  return (
    <aside className="details-panel">
      <div className="detail-photo" />
      <button className="close-detail" type="button" aria-label="Fechar detalhes">×</button>
      <h2>{fair.shortName}</h2>
      <p className={`detail-status ${fair.statusKind}`}>{fair.statusLabel} · {fair.scheduleLabel}</p>
      <p className="address-line"><Icon type="pin" />{fair.endereco}, {fair.bairro} · {fair.municipio}/SP</p>

      <div className="detail-grid">
        <span><Icon type="calendar" />Dias</span>
        <strong>{fair.dia_semana}</strong>
        <span><Icon type="clock" />Horário</span>
        <strong>{fair.timeRange}</strong>
      </div>

      <section className="ratings-box">
        <h3>Avaliações por categoria</h3>
        {[
          ["Preço", fair.scorePrice],
          ["Qualidade", fair.scoreQuality],
          ["Variedade", fair.scoreVariety],
          ["Limpeza", fair.scoreClean],
          ["Acesso", fair.scoreAccess],
        ].map(([label, score]) => (
          <div key={label} className="score-row">
            <span>{label}</span>
            <strong>⭐ {score}</strong>
          </div>
        ))}
      </section>

      <section className="comments-box">
        <h3>O que as pessoas dizem</h3>
        <p>“Boa para pastel e produtos frescos.”</p>
        <p>“Fica cheia depois das 10h.”</p>
      </section>

      <section className="waze-box">
        <h3>Atualizar agora</h3>
        <div className="report-grid">
          {["Aberta", "Fechada", "Muito cheia", "Preço bom", "Difícil estacionar", "Horário diferente"].map((label) => (
            <button key={label} type="button">{label}</button>
          ))}
        </div>
      </section>

      <div className="detail-actions">
        <a href={mapsUrl(fair)} target="_blank" rel="noreferrer"><Icon type="route" />Como chegar</a>
        <button type="button"><Icon type="heart" />Salvar feira</button>
        <button type="button" onClick={() => onChangePage("complete")}><Icon type="edit" />Sugerir correção</button>
        <button type="button"><Icon type="camera" />Enviar foto</button>
      </div>
    </aside>
  );
}

function ContributionPage({ page, onChangePage }) {
  const isComplete = page === "complete";
  return (
    <section className="contribution-screen">
      <header className="contribution-header">
        <button type="button" onClick={() => onChangePage("map")}><Icon type="map" />Voltar ao mapa</button>
        <div>
          <span>Contribuir</span>
          <h1>{isComplete ? "Complementar informações da feira" : "Cadastrar feira rapidamente"}</h1>
          <p>Ajude a manter a base viva com dados simples, úteis e fáceis de validar.</p>
        </div>
      </header>

      {isComplete ? <CompleteForm /> : <QuickForm />}
    </section>
  );
}

function QuickForm() {
  return (
    <form className="simple-form">
      <FormField label="Nome da feira" />
      <FormField label="Onde fica?" help="Rua, bairro ou ponto de referência." />
      <FormField label="Cidade e estado" />
      <ChoiceGroup label="Dias em que acontece" options={[...weekDays, "Não sei"]} />
      <FormField label="Horário de funcionamento" placeholder="Das 7h às 13h" />
      <ChoiceGroup label="Tipo de feira" options={["Feira livre tradicional", "Feira orgânica", "Feira gastronômica", "Feira noturna", "Outra"]} />
      <FormField label="Comentário rápido" textarea />
      <button className="form-submit" type="button"><Icon type="check" />Enviar cadastro</button>
    </form>
  );
}

function CompleteForm() {
  return (
    <form className="simple-form wide">
      <FormField label="Nome da feira" />
      <FormField label="Endereço completo" />
      <div className="form-grid">
        <FormField label="Bairro" />
        <FormField label="Cidade" />
        <FormField label="Estado" />
      </div>
      <ChoiceGroup label="Dias em que acontece" options={weekDays} />
      <div className="form-grid">
        <FormField label="Horário de início" />
        <FormField label="Horário de término" />
      </div>
      <ChoiceGroup label="Produtos vendidos" options={["Frutas", "Verduras", "Peixes", "Pastel", "Caldo de cana", "Flores", "Artesanato", "Comida pronta"]} />
      <FormField label="O que uma pessoa precisa saber antes de ir?" textarea />
      <FormField label="Seu contato" />
      <button className="form-submit" type="button"><Icon type="check" />Enviar complemento</button>
    </form>
  );
}

function FormField({ label, help, placeholder, textarea }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {help && <small>{help}</small>}
      {textarea ? <textarea rows="4" /> : <input placeholder={placeholder} />}
    </label>
  );
}

function ChoiceGroup({ label, options }) {
  return (
    <fieldset className="choice-field">
      <legend>{label}</legend>
      <div className="choice-grid">
        {options.map((option) => (
          <label key={option} className="choice">
            <input type="checkbox" value={option} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SegmentedSelect({ label, value, onChange, options }) {
  return (
    <label className="segmented-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function FilterChip({ active, label, onClick }) {
  return (
    <button className={active ? "filter-chip active" : "filter-chip"} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

function makeDisplayFair(fair) {
  if (!fair) return null;
  const statusKind = getStatusKind(fair);
  const ratingSeed = seededNumber(fair.id, 38, 49) / 10;
  const products = productTags[fair.categoria] || productTags.Tradicional;
  return {
    ...fair,
    shortName: cleanFairName(fair),
    statusKind,
    statusLabel: statusKind === "open" ? "Aberta agora" : statusKind === "later" ? "Abre hoje" : "Fechada agora",
    scheduleLabel: fair.horario_fim !== "-" ? `fecha às ${fair.horario_fim.replace(":00", "h")}` : "horário a confirmar",
    timeRange: fair.horario_inicio !== "-" ? `${fair.horario_inicio.replace(":00", "h")} às ${fair.horario_fim.replace(":00", "h")}` : "a confirmar",
    rating: ratingSeed.toFixed(1).replace(".", ","),
    distance: (seededNumber(fair.id, 8, 42) / 10).toFixed(1).replace(".", ","),
    products,
    markerIcon: fair.categoria === "Orgânica" ? "🥬" : fair.categoria === "Noturna" ? "🌙" : fair.categoria === "Gastronômica" ? "🍽️" : "📍",
    scorePrice: score(fair.id, 41),
    scoreQuality: score(fair.id, 47),
    scoreVariety: score(fair.id, 48),
    scoreClean: score(fair.id, 40),
    scoreAccess: score(fair.id, 39),
  };
}

function getStatusKind(fair) {
  if (fair.dia_semana !== todayName()) return "closed";
  if (fair.horario_inicio === "-" || fair.horario_fim === "-") return "later";
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(fair.horario_inicio);
  const end = timeToMinutes(fair.horario_fim);
  if (current >= start && current <= end) return "open";
  if (current < start) return "later";
  return "closed";
}

function drawStreetTint(coords, color) {
  const offset = 0.00145;
  return window.L.polyline(
    [
      [coords[0] - offset * 0.6, coords[1] - offset],
      coords,
      [coords[0] + offset * 0.6, coords[1] + offset],
    ],
    { color, weight: 7, opacity: 0.72, lineCap: "round", lineJoin: "round" }
  );
}

function pseudoCoords(fair, city, index) {
  const center = cityViews[city]?.center || cityViews.Guarulhos.center;
  const angle = seededNumber(fair.id, 0, 360) * (Math.PI / 180);
  const radius = 0.012 + (seededNumber(`${fair.id}-${index}`, 0, 70) / 1000);
  return [center[0] + Math.sin(angle) * radius, center[1] + Math.cos(angle) * radius];
}

function statusColor(kind) {
  return kind === "open" ? "#2fa35d" : kind === "later" ? "#e3a42b" : "#dc4f5f";
}

function mapsUrl(fair) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${fair.endereco}, ${fair.bairro}, ${fair.municipio}, SP`)}`;
}

function cleanFairName(fair) {
  const base = fair.nome_feira || fair.bairro || "Feira livre";
  if (fair.municipio === "São Paulo") return `Feira Livre da ${titleCase(fair.bairro)}`;
  return `Feira ${titleCase(base.replace(/^Feira\s+/i, ""))}`;
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/(^|\s)([a-záàâãéêíóôõúç])/g, (_, space, char) => `${space}${char.toUpperCase()}`);
}

function todayName() {
  return weekDays[(new Date().getDay() + 6) % 7];
}

function timeToMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function seededNumber(seed, min, max) {
  let hash = 0;
  for (const char of String(seed)) hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  return min + (hash % (max - min + 1));
}

function score(seed, floor) {
  return (seededNumber(seed, floor, 49) / 10).toFixed(1).replace(".", ",");
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
