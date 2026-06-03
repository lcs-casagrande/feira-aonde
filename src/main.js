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
  const [confirmedIds, setConfirmedIds] = useState(() => readConfirmedIds());

  function confirmFair(fairId) {
    const next = { ...confirmedIds, [fairId]: true };
    setConfirmedIds(next);
    window.localStorage.setItem("feira-confirmadas-dev", JSON.stringify(next));
  }

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
        <MapExperience
          fairs={fairs}
          selectedFair={selectedFair}
          onSelectFair={setSelectedFair}
          onChangePage={setPage}
          confirmedIds={confirmedIds}
          onConfirmFair={confirmFair}
        />
      ) : (
        <ContributionPage page={page} onChangePage={setPage} />
      )}
    </main>
  );
}

function MapExperience({ fairs, selectedFair, onSelectFair, onChangePage, confirmedIds, onConfirmFair }) {
  const [city, setCity] = useState("Guarulhos");
  const [day, setDay] = useState(todayName());
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState("today");

  const filteredFairs = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return fairs
      .filter((fair) => fair.municipio === city)
      .filter((fair) => {
        if (quickFilter === "today") return fair.dia_semana === day;
        if (quickFilter === "organic") return normalizeText(fair.categoria).includes("organica");
        if (quickFilter === "night") return normalizeText(fair.categoria).includes("noturna");
        if (quickFilter === "traditional") return normalizeText(fair.categoria).includes("tradicional");
        if (quickFilter === "confirmed") return Boolean(confirmedIds[fair.id]);
        if (quickFilter === "internet-source") return !confirmedIds[fair.id] && fair.status_validacao === "fonte_internet";
        return fair.dia_semana === day;
      })
      .filter((fair) => {
        if (!normalizedQuery) return true;
        return [fair.nome_feira, fair.bairro, fair.endereco, fair.categoria, fair.dia_semana]
          .map(normalizeText)
          .some((value) => value.includes(normalizedQuery));
      })
      .slice(0, 38)
      .map((fair) => makeDisplayFair(fair, confirmedIds));
  }, [city, day, fairs, query, quickFilter, confirmedIds]);

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
        <button className="primary-action" type="button" onClick={() => setQuickFilter("today")}>
          <Icon type="calendar" />
          Ver feiras de hoje
        </button>
        <SegmentedSelect label="Cidade" value={city} onChange={setCity} options={["Guarulhos", "São Paulo"]} />
        <SegmentedSelect label="Dia" value={day} onChange={setDay} options={weekDays} />
        <FilterChip active={quickFilter === "today"} onClick={() => setQuickFilter("today")} label="Hoje" />
        <FilterChip active={quickFilter === "organic"} onClick={() => setQuickFilter("organic")} label="Orgânicas" />
        <FilterChip active={quickFilter === "night"} onClick={() => setQuickFilter("night")} label="Noturnas" />
        <FilterChip active={quickFilter === "traditional"} onClick={() => setQuickFilter("traditional")} label="Tradicionais" />
        <FilterChip active={quickFilter === "internet-source"} onClick={() => setQuickFilter("internet-source")} label="Fonte internet" />
        <FilterChip active={quickFilter === "confirmed"} onClick={() => setQuickFilter("confirmed")} label="Confirmadas" />
      </div>

      <div className="map-grid">
        <NearbyList fairs={filteredFairs} city={city} onSelectFair={onSelectFair} onChangePage={onChangePage} />
        <FairMap fairs={filteredFairs} selectedFair={selectedFair} city={city} onSelectFair={onSelectFair} />
        <FairDetails fair={selectedFair || filteredFairs[0]} onChangePage={onChangePage} onConfirmFair={onConfirmFair} />
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
                <ValidationBadge fair={fair} />
              </div>
              <p>{fair.endereco} · {fair.bairro}</p>
              <div className="rating-line">
                <span>{fair.dia_semana}</span>
                <span>{fair.scheduleLabel}</span>
              </div>
              <div className="tag-row">
                <span>{fair.categoria}</span>
                <span>{fair.fonte_nome}</span>
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
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current || !window.L) return;
    try {
      const view = cityViews[city];
      mapRef.current = window.L.map(mapNodeRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
      }).setView(view.center, view.zoom);

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);

      window.L.control.zoom({ position: "topright" }).addTo(mapRef.current);
      layerRef.current = window.L.layerGroup().addTo(mapRef.current);
    } catch (error) {
      setMapError("O mapa não carregou, mas a lista de feiras está disponível.");
    }
  }, [city]);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    const view = cityViews[city];
    mapRef.current.setView(view.center, view.zoom);
    layerRef.current.clearLayers();

    fairs.slice(0, 28).forEach((fair) => {
      const coords = coordsFromFair(fair);
      if (!coords) return;
      const color = validationColorValue(fair.validationColor);
      const icon = window.L.divIcon({
        className: "fair-marker",
        html: `<span style="background:${color}">📍</span>`,
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
    const coords = coordsFromFair(selectedFair);
    if (!coords) return;
    mapRef.current.panTo(coords);
  }, [selectedFair]);

  return (
    <section className="map-stage">
      <div ref={mapNodeRef} className="main-map" aria-label="Mapa das feiras próximas" />
      {!fairs.some(coordsFromFair) && (
        <div className="map-fallback">A base ainda não tem coordenadas reais. Mostrando a cidade e a lista validável.</div>
      )}
      {mapError && <div className="map-fallback">{mapError}</div>}
      <div className="map-legend">
        <strong>Validação</strong>
        <span><i className="open" />Confirmado pelo desenvolvedor</span>
        <span><i className="later" />Fonte internet ou contribuição</span>
      </div>
    </section>
  );
}

function FairDetails({ fair, onChangePage, onConfirmFair }) {
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
      <ValidationBadge fair={fair} />
      <p className="address-line"><Icon type="pin" />{fair.endereco}, {fair.bairro} · {fair.municipio}/SP</p>

      <div className="detail-grid">
        <span><Icon type="calendar" />Dias</span>
        <strong>{fair.dia_semana}</strong>
        <span><Icon type="clock" />Horário</span>
        <strong>{fair.timeRange}</strong>
        <span>Categoria</span>
        <strong>{fair.categoria}</strong>
        <span>Fonte</span>
        <strong>{fair.fonte_nome}</strong>
      </div>

      <section className="validation-box">
        <h3>Semáforo de validação</h3>
        <div className={`traffic-card ${fair.validationColor}`}>
          <span className="traffic-light" />
          <div>
            <strong>{fair.validationLabel}</strong>
            <p>{fair.validationHelp}</p>
          </div>
        </div>
        {fair.fonte_url !== "-" && (
          <a className="source-link" href={fair.fonte_url} target="_blank" rel="noreferrer">
            Abrir fonte da informação
          </a>
        )}
        {!fair.developerConfirmed && (
          <button className="confirm-dev-button" type="button" onClick={() => onConfirmFair(fair.id)}>
            Confirmar como desenvolvedor
          </button>
        )}
      </section>

      <section className="comments-box">
        <h3>Observações da base</h3>
        <p>{fair.observacoes}</p>
      </section>

      <section className="waze-box">
        <h3>Contribuições do site</h3>
        <p className="pending-copy">Novas contribuições entram como amarelo até revisão.</p>
        <div className="report-grid">
          {["Confirmar que funciona", "Informar horário", "Corrigir endereço", "Enviar foto"].map((label) => (
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
  const [sentContribution, setSentContribution] = useState(null);

  function handleContributionSubmit(event, type) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const filledFields = Array.from(formData.entries()).filter(([, value]) => String(value).trim() !== "").length;
    setSentContribution({ type, filledFields });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (sentContribution) {
    return (
      <section className="contribution-screen">
        <div className="success-panel">
          <div className="success-icon">✓</div>
          <span>Contribuição enviada</span>
          <h1>Obrigado por ajudar o Feira Perto.</h1>
          <p>
            Recebemos {sentContribution.filledFields} informações. Contribuições do site entram em amarelo e ficam pendentes até confirmação do desenvolvedor.
          </p>
          <div className="success-actions">
            <button type="button" onClick={() => onChangePage("map")}><Icon type="map" />Voltar ao mapa</button>
            <button type="button" onClick={() => setSentContribution(null)}><Icon type="plus" />Enviar outra</button>
          </div>
        </div>
      </section>
    );
  }

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

      {isComplete ? (
        <CompleteForm onSubmit={(event) => handleContributionSubmit(event, "completa")} />
      ) : (
        <QuickForm onSubmit={(event) => handleContributionSubmit(event, "rápida")} />
      )}
    </section>
  );
}

function QuickForm({ onSubmit }) {
  return (
    <form className="simple-form" onSubmit={onSubmit}>
      <FormField label="Nome da feira" required />
      <FormField label="Onde fica?" help="Rua, bairro ou ponto de referência." required />
      <FormField label="Cidade e estado" required />
      <ChoiceGroup label="Dias em que acontece" options={[...weekDays, "Não sei"]} />
      <FormField label="Horário de funcionamento" placeholder="Das 7h às 13h" />
      <ChoiceGroup label="Tipo de feira" options={["Feira livre tradicional", "Feira orgânica", "Feira gastronômica", "Feira noturna", "Outra"]} />
      <FormField label="Comentário rápido" textarea />
      <button className="form-submit" type="submit"><Icon type="check" />Enviar contribuição</button>
    </form>
  );
}

function CompleteForm({ onSubmit }) {
  return (
    <form className="simple-form wide" onSubmit={onSubmit}>
      <FormField label="Nome da feira" required />
      <FormField label="Endereço completo" required />
      <div className="form-grid">
        <FormField label="Bairro" />
        <FormField label="Cidade" required />
        <FormField label="Estado" required />
      </div>
      <ChoiceGroup label="Dias em que acontece" options={weekDays} />
      <div className="form-grid">
        <FormField label="Horário de início" />
        <FormField label="Horário de término" />
      </div>
      <ChoiceGroup label="Produtos vendidos" options={["Frutas", "Verduras", "Peixes", "Pastel", "Caldo de cana", "Flores", "Artesanato", "Comida pronta"]} />
      <FormField label="O que uma pessoa precisa saber antes de ir?" textarea />
      <FormField label="Seu contato" />
      <button className="form-submit" type="submit"><Icon type="check" />Enviar contribuição</button>
    </form>
  );
}

function FormField({ label, help, placeholder, textarea, required }) {
  const name = slug(label);
  return (
    <label className="form-field">
      <span>{label}</span>
      {help && <small>{help}</small>}
      {textarea ? (
        <textarea name={name} rows="4" required={required} />
      ) : (
        <input name={name} placeholder={placeholder} required={required} />
      )}
    </label>
  );
}

function ChoiceGroup({ label, options }) {
  const name = slug(label);
  return (
    <fieldset className="choice-field">
      <legend>{label}</legend>
      <div className="choice-grid">
        {options.map((option) => (
          <label key={option} className="choice">
            <input type="checkbox" name={name} value={option} />
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

function ValidationBadge({ fair }) {
  return (
    <span className={`validation-badge ${fair.validationColor}`}>
      <i />
      {fair.validationLabel}
    </span>
  );
}

function makeDisplayFair(fair, confirmedIds = {}) {
  if (!fair) return null;
  const developerConfirmed = Boolean(confirmedIds[fair.id]) || fair.confirmado_desenvolvedor === "sim";
  const validationColor = developerConfirmed ? "green" : "yellow";
  return {
    ...fair,
    shortName: cleanFairName(fair),
    statusKind: developerConfirmed ? "open" : "later",
    scheduleLabel: fair.horario_fim !== "-" ? `até ${fair.horario_fim.replace(":00", "h")}` : "horário a confirmar",
    timeRange: fair.horario_inicio !== "-" ? `${fair.horario_inicio.replace(":00", "h")} às ${fair.horario_fim.replace(":00", "h")}` : "a confirmar",
    developerConfirmed,
    validationColor,
    validationLabel: developerConfirmed ? "Confirmado" : validationSourceLabel(fair.status_validacao),
    validationHelp: developerConfirmed
      ? "Esta informação foi confirmada pelo desenvolvedor nesta instalação."
      : "Existe fonte ou contribuição pendente, mas ainda falta confirmação do desenvolvedor.",
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

function coordsFromFair(fair) {
  const lat = Number(fair.latitude || fair.lat);
  const lon = Number(fair.longitude || fair.lon || fair.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return [lat, lon];
}

function validationColorValue(color) {
  return color === "green" ? "#2fa35d" : "#e3a42b";
}

function validationSourceLabel(status) {
  if (status === "contribuicao_site") return "Contribuição pendente";
  return "Fonte internet";
}

function readConfirmedIds() {
  try {
    return JSON.parse(window.localStorage.getItem("feira-confirmadas-dev") || "{}");
  } catch (error) {
    return {};
  }
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

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
