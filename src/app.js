const {
  useEffect,
  useMemo,
  useRef,
  useState
} = React;
const weekDays = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
const dayColors = {
  "Segunda-feira": "#258b52",
  "Terça-feira": "#d88920",
  "Quarta-feira": "#2775b6",
  "Quinta-feira": "#865bb8",
  "Sexta-feira": "#bf4f73",
  Sábado: "#0c8c90",
  Domingo: "#2fa35d"
};
const cityViews = {
  Guarulhos: {
    center: [-23.4543, -46.5337],
    zoom: 12
  },
  "São Paulo": {
    center: [-23.5505, -46.6333],
    zoom: 12
  }
};
function Icon({
  type,
  size = 18,
  className = ""
}) {
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
  return /*#__PURE__*/React.createElement("svg", {
    className: className,
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: path
  }));
}
function App() {
  const [page, setPage] = useState("map");
  const [fairs, setFairs] = useState([]);
  const [selectedFair, setSelectedFair] = useState(null);
  const [dataError, setDataError] = useState("");
  const [confirmedIds, setConfirmedIds] = useState(() => readConfirmedIds());
  function confirmFair(fairId) {
    const next = {
      ...confirmedIds,
      [fairId]: true
    };
    setConfirmedIds(next);
    window.localStorage.setItem("feira-confirmadas-dev", JSON.stringify(next));
  }
  useEffect(() => {
    fetch("./data/feiras.json").then(response => response.json()).then(data => {
      setFairs(data);
      setSelectedFair(makeDisplayFair(data.find(fair => fair.municipio === "Guarulhos") || data[0]));
      if (window.__feiraReady) window.__feiraReady();
    }).catch(error => {
      setDataError("Não foi possível carregar a base de feiras. Atualize a página.");
      if (window.__feiraReady) window.__feiraReady();
    });
  }, []);
  return /*#__PURE__*/React.createElement("main", {
    className: "feira-app"
  }, dataError && /*#__PURE__*/React.createElement("div", {
    className: "app-warning"
  }, dataError), page === "map" ? /*#__PURE__*/React.createElement(MapExperience, {
    fairs: fairs,
    selectedFair: selectedFair,
    onSelectFair: setSelectedFair,
    onChangePage: setPage,
    confirmedIds: confirmedIds,
    onConfirmFair: confirmFair
  }) : /*#__PURE__*/React.createElement(ContributionPage, {
    page: page,
    onChangePage: setPage
  }));
}
function MapExperience({
  fairs,
  selectedFair,
  onSelectFair,
  onChangePage,
  confirmedIds,
  onConfirmFair
}) {
  const [city, setCity] = useState("Guarulhos");
  const [day, setDay] = useState(todayName());
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState("today");
  const filteredFairs = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return fairs.filter(fair => fair.municipio === city).filter(fair => {
      if (quickFilter === "today") return fair.dia_semana === day;
      if (quickFilter === "organic") return normalizeText(fair.categoria).includes("organica");
      if (quickFilter === "night") return normalizeText(fair.categoria).includes("noturna");
      if (quickFilter === "traditional") return normalizeText(fair.categoria).includes("tradicional");
      if (quickFilter === "confirmed") return Boolean(confirmedIds[fair.id]);
      if (quickFilter === "internet-source") return !confirmedIds[fair.id] && fair.status_validacao === "fonte_internet";
      return fair.dia_semana === day;
    }).filter(fair => {
      if (!normalizedQuery) return true;
      return [fair.nome_feira, fair.bairro, fair.endereco, fair.categoria, fair.dia_semana].map(normalizeText).some(value => value.includes(normalizedQuery));
    }).slice(0, 38).map(fair => makeDisplayFair(fair, confirmedIds));
  }, [city, day, fairs, query, quickFilter, confirmedIds]);
  useEffect(() => {
    if (!filteredFairs.length) return;
    onSelectFair(current => current || filteredFairs[0]);
  }, [filteredFairs, onSelectFair]);
  return /*#__PURE__*/React.createElement("section", {
    className: "map-screen"
  }, /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "brand-button",
    type: "button",
    onClick: () => onChangePage("map")
  }, /*#__PURE__*/React.createElement("span", {
    className: "brand-icon"
  }, "\uD83E\uDD6C"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Feira Perto"), /*#__PURE__*/React.createElement("small", null, "Encontre a feira certa, no dia certo."))), /*#__PURE__*/React.createElement("label", {
    className: "search-box"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "search",
    size: 17
  }), /*#__PURE__*/React.createElement("input", {
    value: query,
    onChange: event => setQuery(event.target.value),
    placeholder: "Buscar feira, bairro ou produto..."
  })), /*#__PURE__*/React.createElement("nav", {
    className: "top-nav",
    "aria-label": "Navega\xE7\xE3o principal"
  }, /*#__PURE__*/React.createElement("button", {
    className: "active",
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "map"
  }), "Mapa"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setQuickFilter("today")
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "calendar"
  }), "Hoje"), /*#__PURE__*/React.createElement("button", {
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "search"
  }), "Buscar"), /*#__PURE__*/React.createElement("button", {
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "heart"
  }), "Salvos"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChangePage("quick")
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "plus"
  }), "Contribuir"))), /*#__PURE__*/React.createElement("div", {
    className: "quickbar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "primary-action",
    type: "button",
    onClick: () => setQuickFilter("today")
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "calendar"
  }), "Ver feiras de hoje"), /*#__PURE__*/React.createElement(SegmentedSelect, {
    label: "Cidade",
    value: city,
    onChange: setCity,
    options: ["Guarulhos", "São Paulo"]
  }), /*#__PURE__*/React.createElement(SegmentedSelect, {
    label: "Dia",
    value: day,
    onChange: setDay,
    options: weekDays
  }), /*#__PURE__*/React.createElement(FilterChip, {
    active: quickFilter === "today",
    onClick: () => setQuickFilter("today"),
    label: "Hoje"
  }), /*#__PURE__*/React.createElement(FilterChip, {
    active: quickFilter === "organic",
    onClick: () => setQuickFilter("organic"),
    label: "Org\xE2nicas"
  }), /*#__PURE__*/React.createElement(FilterChip, {
    active: quickFilter === "night",
    onClick: () => setQuickFilter("night"),
    label: "Noturnas"
  }), /*#__PURE__*/React.createElement(FilterChip, {
    active: quickFilter === "traditional",
    onClick: () => setQuickFilter("traditional"),
    label: "Tradicionais"
  }), /*#__PURE__*/React.createElement(FilterChip, {
    active: quickFilter === "internet-source",
    onClick: () => setQuickFilter("internet-source"),
    label: "Fonte internet"
  }), /*#__PURE__*/React.createElement(FilterChip, {
    active: quickFilter === "confirmed",
    onClick: () => setQuickFilter("confirmed"),
    label: "Confirmadas"
  })), /*#__PURE__*/React.createElement("div", {
    className: "map-grid"
  }, /*#__PURE__*/React.createElement(NearbyList, {
    fairs: filteredFairs,
    city: city,
    onSelectFair: onSelectFair,
    onChangePage: onChangePage
  }), /*#__PURE__*/React.createElement(FairMap, {
    fairs: filteredFairs,
    selectedFair: selectedFair,
    city: city,
    onSelectFair: onSelectFair
  }), /*#__PURE__*/React.createElement(FairDetails, {
    fair: selectedFair || filteredFairs[0],
    onChangePage: onChangePage,
    onConfirmFair: onConfirmFair
  })), /*#__PURE__*/React.createElement("nav", {
    className: "mobile-nav",
    "aria-label": "Navega\xE7\xE3o mobile"
  }, /*#__PURE__*/React.createElement("button", {
    className: "active",
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "map"
  }), "Mapa"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setQuickFilter("today")
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "calendar"
  }), "Hoje"), /*#__PURE__*/React.createElement("button", {
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "search"
  }), "Buscar"), /*#__PURE__*/React.createElement("button", {
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "heart"
  }), "Salvos"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChangePage("quick")
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "plus"
  }), "Contribuir")));
}
function NearbyList({
  fairs,
  city,
  onSelectFair,
  onChangePage
}) {
  return /*#__PURE__*/React.createElement("aside", {
    className: "nearby-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel-heading"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, "Feiras perto de voc\xEA"), /*#__PURE__*/React.createElement("p", null, city, ", SP \xB7 ", fairs.length, " resultados")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChangePage("complete")
  }, "Cadastrar")), /*#__PURE__*/React.createElement("div", {
    className: "fair-cards"
  }, fairs.slice(0, 9).map((fair, index) => /*#__PURE__*/React.createElement("article", {
    key: fair.id,
    className: "mini-card",
    onClick: () => onSelectFair(fair)
  }, /*#__PURE__*/React.createElement("span", {
    className: `status-dot ${fair.statusKind}`
  }), /*#__PURE__*/React.createElement("div", {
    className: "mini-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mini-title-row"
  }, /*#__PURE__*/React.createElement("h3", null, fair.shortName), /*#__PURE__*/React.createElement(ValidationBadge, {
    fair: fair
  })), /*#__PURE__*/React.createElement("p", null, fair.endereco, " \xB7 ", fair.bairro), /*#__PURE__*/React.createElement("div", {
    className: "rating-line"
  }, /*#__PURE__*/React.createElement("span", null, fair.dia_semana), /*#__PURE__*/React.createElement("span", null, fair.scheduleLabel)), /*#__PURE__*/React.createElement("div", {
    className: "tag-row"
  }, /*#__PURE__*/React.createElement("span", null, fair.categoria), /*#__PURE__*/React.createElement("span", null, fair.fonte_nome)), /*#__PURE__*/React.createElement("div", {
    className: "card-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "list"
  }), "Ver detalhes"), /*#__PURE__*/React.createElement("a", {
    href: mapsUrl(fair),
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "route"
  }), "Como chegar")))))), /*#__PURE__*/React.createElement("button", {
    className: "load-more",
    type: "button"
  }, "Ver mais feiras"));
}
function FairMap({
  fairs,
  selectedFair,
  city,
  onSelectFair
}) {
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
        scrollWheelZoom: true
      }).setView(view.center, view.zoom);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapRef.current);
      window.L.control.zoom({
        position: "topright"
      }).addTo(mapRef.current);
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
    fairs.slice(0, 28).forEach(fair => {
      const coords = coordsFromFair(fair);
      if (!coords) return;
      const color = validationColorValue(fair.validationColor);
      const icon = window.L.divIcon({
        className: "fair-marker",
        html: `<span style="background:${color}">📍</span>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      const marker = window.L.marker(coords, {
        icon
      }).addTo(layerRef.current);
      marker.on("click", () => onSelectFair(fair));
      marker.bindTooltip(fair.shortName, {
        direction: "top",
        offset: [0, -14]
      });
      drawStreetTint(coords, color).addTo(layerRef.current);
    });
  }, [city, fairs, onSelectFair]);
  useEffect(() => {
    if (!mapRef.current || !selectedFair) return;
    const coords = coordsFromFair(selectedFair);
    if (!coords) return;
    mapRef.current.panTo(coords);
  }, [selectedFair]);
  return /*#__PURE__*/React.createElement("section", {
    className: "map-stage"
  }, /*#__PURE__*/React.createElement("div", {
    ref: mapNodeRef,
    className: "main-map",
    "aria-label": "Mapa das feiras pr\xF3ximas"
  }), !fairs.some(coordsFromFair) && /*#__PURE__*/React.createElement("div", {
    className: "map-fallback"
  }, "A base ainda n\xE3o tem coordenadas reais. Mostrando a cidade e a lista valid\xE1vel."), mapError && /*#__PURE__*/React.createElement("div", {
    className: "map-fallback"
  }, mapError), /*#__PURE__*/React.createElement("div", {
    className: "map-legend"
  }, /*#__PURE__*/React.createElement("strong", null, "Valida\xE7\xE3o"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "open"
  }), "Confirmado pelo desenvolvedor"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "later"
  }), "Fonte internet ou contribui\xE7\xE3o")));
}
function FairDetails({
  fair,
  onChangePage,
  onConfirmFair
}) {
  if (!fair) {
    return /*#__PURE__*/React.createElement("aside", {
      className: "details-panel empty"
    }, /*#__PURE__*/React.createElement("strong", null, "Carregando feiras..."));
  }
  return /*#__PURE__*/React.createElement("aside", {
    className: "details-panel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-photo"
  }), /*#__PURE__*/React.createElement("button", {
    className: "close-detail",
    type: "button",
    "aria-label": "Fechar detalhes"
  }, "\xD7"), /*#__PURE__*/React.createElement("h2", null, fair.shortName), /*#__PURE__*/React.createElement(ValidationBadge, {
    fair: fair
  }), /*#__PURE__*/React.createElement("p", {
    className: "address-line"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "pin"
  }), fair.endereco, ", ", fair.bairro, " \xB7 ", fair.municipio, "/SP"), /*#__PURE__*/React.createElement("div", {
    className: "detail-grid"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    type: "calendar"
  }), "Dias"), /*#__PURE__*/React.createElement("strong", null, fair.dia_semana), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    type: "clock"
  }), "Hor\xE1rio"), /*#__PURE__*/React.createElement("strong", null, fair.timeRange), /*#__PURE__*/React.createElement("span", null, "Categoria"), /*#__PURE__*/React.createElement("strong", null, fair.categoria), /*#__PURE__*/React.createElement("span", null, "Fonte"), /*#__PURE__*/React.createElement("strong", null, fair.fonte_nome)), /*#__PURE__*/React.createElement("section", {
    className: "validation-box"
  }, /*#__PURE__*/React.createElement("h3", null, "Sem\xE1foro de valida\xE7\xE3o"), /*#__PURE__*/React.createElement("div", {
    className: `traffic-card ${fair.validationColor}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "traffic-light"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, fair.validationLabel), /*#__PURE__*/React.createElement("p", null, fair.validationHelp))), fair.fonte_url !== "-" && /*#__PURE__*/React.createElement("a", {
    className: "source-link",
    href: fair.fonte_url,
    target: "_blank",
    rel: "noreferrer"
  }, "Abrir fonte da informa\xE7\xE3o"), !fair.developerConfirmed && /*#__PURE__*/React.createElement("button", {
    className: "confirm-dev-button",
    type: "button",
    onClick: () => onConfirmFair(fair.id)
  }, "Confirmar como desenvolvedor")), /*#__PURE__*/React.createElement("section", {
    className: "comments-box"
  }, /*#__PURE__*/React.createElement("h3", null, "Observa\xE7\xF5es da base"), /*#__PURE__*/React.createElement("p", null, fair.observacoes)), /*#__PURE__*/React.createElement("section", {
    className: "waze-box"
  }, /*#__PURE__*/React.createElement("h3", null, "Contribui\xE7\xF5es do site"), /*#__PURE__*/React.createElement("p", {
    className: "pending-copy"
  }, "Novas contribui\xE7\xF5es entram como amarelo at\xE9 revis\xE3o."), /*#__PURE__*/React.createElement("div", {
    className: "report-grid"
  }, ["Confirmar que funciona", "Informar horário", "Corrigir endereço", "Enviar foto"].map(label => /*#__PURE__*/React.createElement("button", {
    key: label,
    type: "button"
  }, label)))), /*#__PURE__*/React.createElement("div", {
    className: "detail-actions"
  }, /*#__PURE__*/React.createElement("a", {
    href: mapsUrl(fair),
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "route"
  }), "Como chegar"), /*#__PURE__*/React.createElement("button", {
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "heart"
  }), "Salvar feira"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChangePage("complete")
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "edit"
  }), "Sugerir corre\xE7\xE3o"), /*#__PURE__*/React.createElement("button", {
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "camera"
  }), "Enviar foto")));
}
function ContributionPage({
  page,
  onChangePage
}) {
  const isComplete = page === "complete";
  const [sentContribution, setSentContribution] = useState(null);
  function handleContributionSubmit(event, type) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const filledFields = Array.from(formData.entries()).filter(([, value]) => String(value).trim() !== "").length;
    setSentContribution({
      type,
      filledFields
    });
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
  if (sentContribution) {
    return /*#__PURE__*/React.createElement("section", {
      className: "contribution-screen"
    }, /*#__PURE__*/React.createElement("div", {
      className: "success-panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "success-icon"
    }, "\u2713"), /*#__PURE__*/React.createElement("span", null, "Contribui\xE7\xE3o enviada"), /*#__PURE__*/React.createElement("h1", null, "Obrigado por ajudar o Feira Perto."), /*#__PURE__*/React.createElement("p", null, "Recebemos ", sentContribution.filledFields, " informa\xE7\xF5es. Contribui\xE7\xF5es do site entram em amarelo e ficam pendentes at\xE9 confirma\xE7\xE3o do desenvolvedor."), /*#__PURE__*/React.createElement("div", {
      className: "success-actions"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onChangePage("map")
    }, /*#__PURE__*/React.createElement(Icon, {
      type: "map"
    }), "Voltar ao mapa"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setSentContribution(null)
    }, /*#__PURE__*/React.createElement(Icon, {
      type: "plus"
    }), "Enviar outra"))));
  }
  return /*#__PURE__*/React.createElement("section", {
    className: "contribution-screen"
  }, /*#__PURE__*/React.createElement("header", {
    className: "contribution-header"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onChangePage("map")
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "map"
  }), "Voltar ao mapa"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, "Contribuir"), /*#__PURE__*/React.createElement("h1", null, isComplete ? "Complementar informações da feira" : "Cadastrar feira rapidamente"), /*#__PURE__*/React.createElement("p", null, "Ajude a manter a base viva com dados simples, \xFAteis e f\xE1ceis de validar."))), isComplete ? /*#__PURE__*/React.createElement(CompleteForm, {
    onSubmit: event => handleContributionSubmit(event, "completa")
  }) : /*#__PURE__*/React.createElement(QuickForm, {
    onSubmit: event => handleContributionSubmit(event, "rápida")
  }));
}
function QuickForm({
  onSubmit
}) {
  return /*#__PURE__*/React.createElement("form", {
    className: "simple-form",
    onSubmit: onSubmit
  }, /*#__PURE__*/React.createElement(FormField, {
    label: "Nome da feira",
    required: true
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "Onde fica?",
    help: "Rua, bairro ou ponto de refer\xEAncia.",
    required: true
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "Cidade e estado",
    required: true
  }), /*#__PURE__*/React.createElement(ChoiceGroup, {
    label: "Dias em que acontece",
    options: [...weekDays, "Não sei"]
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "Hor\xE1rio de funcionamento",
    placeholder: "Das 7h \xE0s 13h"
  }), /*#__PURE__*/React.createElement(ChoiceGroup, {
    label: "Tipo de feira",
    options: ["Feira livre tradicional", "Feira orgânica", "Feira gastronômica", "Feira noturna", "Outra"]
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "Coment\xE1rio r\xE1pido",
    textarea: true
  }), /*#__PURE__*/React.createElement("button", {
    className: "form-submit",
    type: "submit"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "check"
  }), "Enviar contribui\xE7\xE3o"));
}
function CompleteForm({
  onSubmit
}) {
  return /*#__PURE__*/React.createElement("form", {
    className: "simple-form wide",
    onSubmit: onSubmit
  }, /*#__PURE__*/React.createElement(FormField, {
    label: "Nome da feira",
    required: true
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "Endere\xE7o completo",
    required: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(FormField, {
    label: "Bairro"
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "Cidade",
    required: true
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "Estado",
    required: true
  })), /*#__PURE__*/React.createElement(ChoiceGroup, {
    label: "Dias em que acontece",
    options: weekDays
  }), /*#__PURE__*/React.createElement("div", {
    className: "form-grid"
  }, /*#__PURE__*/React.createElement(FormField, {
    label: "Hor\xE1rio de in\xEDcio"
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "Hor\xE1rio de t\xE9rmino"
  })), /*#__PURE__*/React.createElement(ChoiceGroup, {
    label: "Produtos vendidos",
    options: ["Frutas", "Verduras", "Peixes", "Pastel", "Caldo de cana", "Flores", "Artesanato", "Comida pronta"]
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "O que uma pessoa precisa saber antes de ir?",
    textarea: true
  }), /*#__PURE__*/React.createElement(FormField, {
    label: "Seu contato"
  }), /*#__PURE__*/React.createElement("button", {
    className: "form-submit",
    type: "submit"
  }, /*#__PURE__*/React.createElement(Icon, {
    type: "check"
  }), "Enviar contribui\xE7\xE3o"));
}
function FormField({
  label,
  help,
  placeholder,
  textarea,
  required
}) {
  const name = slug(label);
  return /*#__PURE__*/React.createElement("label", {
    className: "form-field"
  }, /*#__PURE__*/React.createElement("span", null, label), help && /*#__PURE__*/React.createElement("small", null, help), textarea ? /*#__PURE__*/React.createElement("textarea", {
    name: name,
    rows: "4",
    required: required
  }) : /*#__PURE__*/React.createElement("input", {
    name: name,
    placeholder: placeholder,
    required: required
  }));
}
function ChoiceGroup({
  label,
  options
}) {
  const name = slug(label);
  return /*#__PURE__*/React.createElement("fieldset", {
    className: "choice-field"
  }, /*#__PURE__*/React.createElement("legend", null, label), /*#__PURE__*/React.createElement("div", {
    className: "choice-grid"
  }, options.map(option => /*#__PURE__*/React.createElement("label", {
    key: option,
    className: "choice"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    name: name,
    value: option
  }), /*#__PURE__*/React.createElement("span", null, option)))));
}
function SegmentedSelect({
  label,
  value,
  onChange,
  options
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "segmented-select"
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: event => onChange(event.target.value)
  }, options.map(option => /*#__PURE__*/React.createElement("option", {
    key: option
  }, option))));
}
function FilterChip({
  active,
  label,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: active ? "filter-chip active" : "filter-chip",
    type: "button",
    onClick: onClick
  }, label);
}
function ValidationBadge({
  fair
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: `validation-badge ${fair.validationColor}`
  }, /*#__PURE__*/React.createElement("i", null), fair.validationLabel);
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
    validationHelp: developerConfirmed ? "Esta informação foi confirmada pelo desenvolvedor nesta instalação." : "Existe fonte ou contribuição pendente, mas ainda falta confirmação do desenvolvedor."
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
  return window.L.polyline([[coords[0] - offset * 0.6, coords[1] - offset], coords, [coords[0] + offset * 0.6, coords[1] + offset]], {
    color,
    weight: 7,
    opacity: 0.72,
    lineCap: "round",
    lineJoin: "round"
  });
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
  return String(value || "").toLowerCase().replace(/(^|\s)([a-záàâãéêíóôõúç])/g, (_, space, char) => `${space}${char.toUpperCase()}`);
}
function todayName() {
  return weekDays[(new Date().getDay() + 6) % 7];
}
function timeToMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));