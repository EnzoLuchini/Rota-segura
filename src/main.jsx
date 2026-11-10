import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import ExtraScreens from "./ExtraScreens";
import MapContextBar from "./components/MapContextBar";
import MobileNavigation from "./components/MobileNavigation";
import {
  routes,
  occurrences,
  zone,
  places,
  routeFactors,
  canCompareTrip,
} from "./data/scenario";
import {
  createInitialPreferences,
  PROTOTYPE_STORAGE_KEYS,
  shouldShowScenarioAlert,
} from "./state/prototypeStorage";
import { useStoredState } from "./state/useStoredState";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock3,
  CloudRain,
  Droplets,
  History,
  Info,
  LocateFixed,
  MapPin,
  Menu,
  Navigation,
  Route,
  Search,
  ShieldAlert,
  Waves,
  X,
  Plus,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./style.css";

const safer = routes.safe.points;
const faster = routes.fast.points;

const factorIcons = {
  risk: ShieldAlert,
  history: History,
  rain: CloudRain,
  water: Waves,
};
function Logo() {
  return (
    <div className="brand">
      <span className="brandmark">
        <Droplets size={21} />
      </span>
      <span>
        Rota <strong>Segura</strong>
      </span>
    </div>
  );
}
function Recenter({ signal, view }) {
  const map = useMap();
  useEffect(() => {
    if (signal)
      map.setView(
        view === "alert" ? occurrences[0].position : [-23.568, -46.683],
        view === "alert" ? 15 : 14,
      );
  }, [signal, map, view]);
  return null;
}
function App() {
  const [view, setView] = useState("welcome"),
    [selected, setSelected] = useState("safe"),
    [expanded, setExpanded] = useState(-1),
    [menu, setMenu] = useState(false),
    [origin, setOrigin] = useState("Minha localização"),
    [destination, setDestination] = useState("Hospital das Clínicas"),
    [toast, setToast] = useState(""),
    [dataState, setDataState] = useState("available");
  const menuTriggerRef = useRef(null);
  const [savedRoutes, setSavedRoutes, resetSavedRoutes] = useStoredState(
      PROTOTYPE_STORAGE_KEYS.savedRoutes,
      [],
    ),
    [reports, setReports, resetReports] = useStoredState(
      PROTOTYPE_STORAGE_KEYS.reports,
      [],
    ),
    [prefs, setPrefs, resetPrefs] = useStoredState(
      PROTOTYPE_STORAGE_KEYS.preferences,
      createInitialPreferences,
    ),
    [profile, setProfile, resetProfile] = useStoredState(
      PROTOTYPE_STORAGE_KEYS.profile,
      "",
    ),
    [readAlerts, setReadAlerts, resetReadAlerts] = useStoredState(
      PROTOTYPE_STORAGE_KEYS.readAlert,
      false,
    ),
    [selectedSegment, setSelectedSegment] = useState(0),
    [centerSignal, setCenterSignal] = useState(0);
  const go = (next) => {
    setView(next);
    document.querySelector(".panel")?.scrollTo(0, 0);
  };
  const notify = (s) => {
    setToast(s);
    setTimeout(() => setToast(""), 3500);
  };
  useEffect(() => {
    setMenu(false);
    requestAnimationFrame(() => {
      const heading = document.querySelector(".panel h1");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    });
  }, [view]);
  const activeSection =
    view === "alerts" || view === "alert"
      ? "alerts"
      : view === "saved" || view === "save"
        ? "saved"
        : view === "report" || view === "reports"
          ? "report"
          : view === "profile"
            ? "profile"
            : "map";
  const scenarioAlertVisible = shouldShowScenarioAlert(prefs, true);
  const comparisonAvailable = canCompareTrip(origin, destination, dataState);
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <header className="header">
        <Logo />
        <nav aria-label="Navegação principal">
          <button
            className={"navlink " + (activeSection === "map" ? "active" : "")}
            aria-current={activeSection === "map" ? "page" : undefined}
            onClick={() => go("home")}
          >
            Mapa
          </button>
          <button
            className={
              "navlink " + (activeSection === "alerts" ? "active" : "")
            }
            aria-current={activeSection === "alerts" ? "page" : undefined}
            onClick={() => go("alerts")}
          >
            Alertas{" "}
            <span className="count">{scenarioAlertVisible ? 1 : 0}</span>
          </button>
          <button
            className={"navlink " + (activeSection === "saved" ? "active" : "")}
            aria-current={activeSection === "saved" ? "page" : undefined}
            onClick={() => go("saved")}
          >
            Minhas rotas
          </button>
          <button
            className={
              "navlink " + (activeSection === "report" ? "active" : "")
            }
            aria-current={activeSection === "report" ? "page" : undefined}
            onClick={() => go("report")}
          >
            Relatar
          </button>
          <button
            className={
              "navlink " + (activeSection === "profile" ? "active" : "")
            }
            aria-current={activeSection === "profile" ? "page" : undefined}
            onClick={() => go("profile")}
          >
            Perfil
          </button>
        </nav>
        <button
          ref={menuTriggerRef}
          className="iconbutton mobile-menu"
          aria-label={menu ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menu}
          aria-controls="mobile-navigation"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <MobileNavigation
        open={menu}
        onClose={() => setMenu(false)}
        onNavigate={go}
        alertCount={scenarioAlertVisible ? 1 : 0}
        triggerRef={menuTriggerRef}
      />
      <main className="workspace">
        <section className="map-area" aria-label="Mapa demonstrativo de rotas">
          <div className="map-surface">
            <MapContainer
              center={[-23.568, -46.683]}
              zoom={14}
              zoomControl={false}
              scrollWheelZoom={true}
            >
              <Recenter signal={centerSignal} view={view} />
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; Sources: Esri, OpenStreetMap contributors"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              />
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}" />
              <Polygon
                positions={zone}
                pathOptions={{
                  color: "#ef9b1b",
                  weight: 2,
                  fillColor: "#ffb52f",
                  fillOpacity: 0.25,
                }}
              >
                <Popup>Área de risco ilustrativa · R3</Popup>
              </Polygon>
              <Polyline
                positions={faster}
                pathOptions={{ color: "#fff", weight: 10 }}
              />
              <Polyline
                positions={faster}
                pathOptions={{
                  color: "#899ab7",
                  weight: selected === "fast" ? 9 : 6,
                  opacity: 0.95,
                }}
              />
              <Polyline
                positions={safer}
                pathOptions={{ color: "#fff", weight: 11 }}
              />
              <Polyline
                positions={safer}
                pathOptions={{
                  color: "#145ef0",
                  weight: selected === "safe" ? 9 : 6,
                }}
              />
              <CircleMarker
                center={origin === places[0] ? safer[0] : safer.at(-1)}
                radius={9}
                pathOptions={{
                  color: "white",
                  weight: 4,
                  fillColor: "#145ef0",
                  fillOpacity: 1,
                }}
              >
                <Popup>Origem demonstrativa</Popup>
              </CircleMarker>
              <CircleMarker
                center={origin === places[0] ? safer.at(-1) : safer[0]}
                radius={9}
                pathOptions={{
                  color: "white",
                  weight: 4,
                  fillColor: "#0e2b64",
                  fillOpacity: 1,
                }}
              >
                <Popup>Destino demonstrativo</Popup>
              </CircleMarker>
              <CircleMarker
                center={occurrences[0].position}
                radius={13}
                pathOptions={{
                  color: "white",
                  weight: 4,
                  fillColor: "#df4651",
                  fillOpacity: 1,
                }}
              >
                <Popup>Alagamento demonstrativo</Popup>
              </CircleMarker>
              {view === "alert" && (
                <Polyline
                  positions={faster.slice(2, 5)}
                  pathOptions={{
                    color: "#d9364f",
                    weight: 10,
                    dashArray: "8 6",
                  }}
                />
              )}
              {view === "segments" && (
                <Polyline
                  positions={
                    selectedSegment === 0
                      ? safer.slice(0, 3)
                      : selectedSegment === 1
                        ? faster.slice(2, 5)
                        : safer.slice(5)
                  }
                  pathOptions={{
                    color: "#ec9223",
                    weight: 10,
                    dashArray: "8 6",
                  }}
                />
              )}
            </MapContainer>
            <div className="map-top">
              <div className="weather">
                <CloudRain size={19} />
                <span>
                  {dataState === "available"
                    ? "Chuva moderada"
                    : dataState === "stale"
                      ? "Chuva desatualizada"
                      : dataState === "loading"
                        ? "Consultando dados"
                        : "Chuva indisponível"}
                </span>
                <span className="weather-time">simulação</span>
              </div>
            </div>
            <div className="map-tools">
              <button
                aria-label="Centralizar mapa"
                onClick={() => setCenterSignal((n) => n + 1)}
              >
                <LocateFixed size={19} />
              </button>
            </div>
          </div>
          <MapContextBar />
        </section>
        <aside className="panel" id="main-content" tabIndex={-1}>
          <div className="panel-inner">
            <ExtraScreens
              view={view}
              go={go}
              selected={selected}
              setSelected={setSelected}
              origin={origin}
              destination={destination}
              savedRoutes={savedRoutes}
              setSavedRoutes={setSavedRoutes}
              resetSavedRoutes={resetSavedRoutes}
              reports={reports}
              setReports={setReports}
              resetReports={resetReports}
              prefs={prefs}
              setPrefs={setPrefs}
              resetPrefs={resetPrefs}
              profile={profile}
              setProfile={setProfile}
              resetProfile={resetProfile}
              readAlerts={readAlerts}
              setReadAlerts={setReadAlerts}
              resetReadAlerts={resetReadAlerts}
              selectedSegment={selectedSegment}
              setSelectedSegment={setSelectedSegment}
            />
            {view === "home" && (
              <>
                <div className="eyebrow">
                  <span className="status-dot" /> Mobilidade mais informada
                </div>
                <h1>Um caminho melhor começa com informação.</h1>
                <p className="intro">
                  Compare rotas e conheça os riscos relacionados à chuva no seu
                  trajeto.
                </p>
                <div className="search-box">
                  <div className="input-row">
                    <span className="point start" />
                    <label>
                      <small>Origem</small>
                      <input
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        list="origins"
                        aria-label="Origem"
                      />
                    </label>
                  </div>
                  <div className="input-divider" />
                  <div className="input-row">
                    <MapPin size={19} className="dest-icon" />
                    <label>
                      <small>Destino</small>
                      <input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        list="destinations"
                        aria-label="Destino"
                      />
                    </label>
                  </div>
                </div>
                <datalist id="origins">
                  {places.map((place) => (
                    <option key={place} value={place} />
                  ))}
                </datalist>
                <datalist id="destinations">
                  {places.map((place) => (
                    <option key={place} value={place} />
                  ))}
                </datalist>
                <button
                  className="swap-trip"
                  onClick={() => {
                    setOrigin(destination);
                    setDestination(origin);
                  }}
                  aria-label="Trocar origem e destino"
                >
                  ⇅ Trocar origem e destino
                </button>
                <p className="footnote">
                  Cenário disponível: Minha localização ↔ Hospital das
                  Clínicas.
                </p>
                <label className="form-field">
                  Condição dos dados (simulação)
                  <select
                    value={dataState}
                    onChange={(e) => setDataState(e.target.value)}
                  >
                    <option value="available">Dados disponíveis</option>
                    <option value="stale">Dados desatualizados</option>
                    <option value="unavailable">Dados indisponíveis</option>
                    <option value="loading">Carregando</option>
                  </select>
                </label>
                {dataState === "stale" && (
                  <div className="selection-warning" role="status">
                    Dados antigos: a comparação pode não refletir as condições
                    atuais.
                  </div>
                )}
                {dataState === "unavailable" && (
                  <div className="selection-warning" role="alert">
                    Não foi possível obter dados neste cenário. Selecione dados
                    disponíveis para continuar.
                  </div>
                )}
                {dataState === "loading" && (
                  <div className="notice" role="status">
                    Consultando informações simuladas…
                  </div>
                )}
                <button
                  className="primary"
                  disabled={
                    dataState === "unavailable" || dataState === "loading"
                  }
                  onClick={() =>
                    comparisonAvailable
                      ? go("compare")
                      : notify(
                          "Escolha os dois locais disponíveis, com origem e destino diferentes.",
                        )
                  }
                >
                  <Search size={18} /> Comparar rotas
                </button>
                <div className="section-heading">
                  <div>
                    <span className="overline">No seu caminho</span>
                    <h2>Fique por dentro</h2>
                  </div>
                  <button className="text-button" onClick={() => go("alerts")}>
                    {scenarioAlertVisible ? "Ver alerta" : "Ver central"}{" "}
                    <ArrowRight size={16} />
                  </button>
                </div>
                {scenarioAlertVisible ? (
                  <button className="alert-card" onClick={() => go("alerts")}>
                    <span className="alert-icon">
                      <ShieldAlert size={21} />
                    </span>
                    <span>
                      <strong>Alagamento na rota de volta</strong>
                      <small>Pinheiros · há 6 min</small>
                    </span>
                    <ChevronRight size={19} />
                  </button>
                ) : (
                  <div className="empty-state">
                    Alertas simulados estão desativados nas preferências.
                  </div>
                )}
                <div className="quick-actions">
                  <button onClick={() => go("reports")}>Ver relatos</button>
                  <button onClick={() => go("report")}>Criar relato</button>
                  <button onClick={() => go("saved")}>Rotas frequentes</button>
                  <button onClick={() => go("sources")}>
                    Fontes e metodologia
                  </button>
                  <button onClick={() => go("profile")}>Preferências</button>
                </div>
                <div className="notice">
                  <Info size={17} />
                  <span>
                    Este é um protótipo. Rotas, condições e ocorrências são
                    ilustrativas.
                  </span>
                </div>
              </>
            )}
            {view === "compare" && (
              <>
                <button className="back" onClick={() => go("home")}>
                  <ArrowLeft size={18} /> Voltar ao início
                </button>
                <span className="overline">Sua viagem</span>
                <h1>Compare suas rotas</h1>
                <p className="intro route-address">
                  {origin || "Origem"} <ArrowRight size={15} />{" "}
                  {destination || "Destino"}
                </p>
                {dataState === "stale" && (
                  <div className="selection-warning" role="status">
                    Dados desatualizados: considere esta comparação com cautela.
                  </div>
                )}
                <p className="comparison-hint">
                  A rota recomendada leva 6 minutos a mais e evita riscos
                  identificados na alternativa mais rápida.
                </p>
                <div
                  className="route-list"
                  role="group"
                  aria-label="Escolha uma rota"
                >
                  <button
                    className={
                      "route-card route-safe " +
                      (selected === "safe" ? "selected" : "")
                    }
                    aria-pressed={selected === "safe"}
                    onClick={() => setSelected("safe")}
                  >
                    <span className="radio" />
                    <span className="route-content">
                      <span className="route-label">
                        Menor exposição conhecida{" "}
                        <span className="recommended">✓ Recomendada</span>
                      </span>
                      <span className="route-stats">
                        <strong>24 min</strong>
                        <span>6 min a mais</span>
                      </span>
                      <small>Evita 1 área R3 e 1 alagamento recente.</small>
                    </span>
                  </button>
                  <button
                    className={
                      "route-card route-fast " +
                      (selected === "fast" ? "selected" : "")
                    }
                    aria-pressed={selected === "fast"}
                    onClick={() => setSelected("fast")}
                  >
                    <span className="radio" />
                    <span className="route-content">
                      <span className="route-label">
                        Mais rápida{" "}
                        <span className="risk-badge">⚠ Maior exposição</span>
                      </span>
                      <span className="route-stats">
                        <strong>18 min</strong>
                        <span>6 min a menos</span>
                      </span>
                      <small>
                        Atenção: cruza uma área R3 e um alagamento reportado.
                      </small>
                    </span>
                  </button>
                </div>
                {selected === "fast" && (
                  <div className="selection-warning" role="status">
                    <ShieldAlert size={19} />
                    <span>
                      <strong>
                        Você selecionou a rota de maior exposição.
                      </strong>{" "}
                      Ela é mais rápida, mas passa pelos riscos identificados
                      acima.
                    </span>
                  </div>
                )}
                <button className="explain-link" onClick={() => go("explain")}>
                  <span className="explain-icon">
                    <Info size={19} />
                  </span>
                  <span>
                    <strong>Por que recomendamos a rota de 24 min?</strong>
                    <small>Entenda os fatores considerados</small>
                  </span>
                  <ChevronRight size={19} />
                </button>
                <div className="source">
                  <Clock3 size={15} /> GeoSampa e SIBH · dados demonstrativos
                </div>
                <button
                  className="primary"
                  onClick={() =>
                    notify(
                      "Navegação simulada: este é um protótipo demonstrativo",
                    )
                  }
                >
                  <Navigation size={18} /> Usar{" "}
                  {selected === "safe"
                    ? "rota recomendada"
                    : "rota de maior exposição"}
                </button>
                <button className="secondary" onClick={() => go("save")}>
                  <Plus size={18} /> Salvar como rota frequente
                </button>
              </>
            )}
            {view === "explain" && (
              <>
                <button className="back" onClick={() => go("compare")}>
                  <ArrowLeft size={18} /> Voltar para rotas
                </button>
                <span className="overline">Entenda a recomendação</span>
                <h1>Por que esta rota?</h1>
                <p className="intro">
                  Uma visão dos fatores considerados na comparação do seu
                  trajeto.
                </p>
                <div className="summary">
                  <span className="summary-icon">
                    <Route size={23} />
                  </span>
                  <div>
                    <small>Menor exposição conhecida</small>
                    <strong>
                      24 min <span>· 6 min a mais</span>
                    </strong>
                  </div>
                </div>
                <div className="factors">
                  {routeFactors.map((factor, i) => {
                    const Icon = factorIcons[factor.icon];
                    return (
                      <button
                        className="factor"
                        key={factor.id}
                        onClick={() => setExpanded(expanded === i ? -1 : i)}
                        aria-expanded={expanded === i}
                      >
                        <span className={"factor-icon " + factor.tone}>
                          <Icon size={21} />
                        </span>
                        <span className="factor-copy">
                          <strong>{factor.title}</strong>
                          <small>{factor.description}</small>
                          {expanded === i && (
                            <em>
                              {factor.source}. Os valores deste protótipo são
                              ilustrativos.
                            </em>
                          )}
                        </span>
                        <ChevronRight
                          className={expanded === i ? "rotated" : ""}
                          size={18}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="source">
                  <Clock3 size={15} /> GeoSampa e SIBH · dados demonstrativos
                </div>
                <button className="primary" onClick={() => go("segments")}>
                  <MapPin size={18} /> Ver detalhes por trecho
                </button>
                <p className="footnote">
                  A ausência de registros não garante que o caminho esteja
                  seguro.
                </p>
              </>
            )}
            {view === "alert" && (
              <>
                <button className="back" onClick={() => go("alerts")}>
                  <ArrowLeft size={18} /> Voltar aos alertas
                </button>
                <span className="severity">
                  Atenção alta · há 6 min · expira em 30 min
                </span>
                <h1>Alagamento na sua rota de volta</h1>
                <p className="intro">
                  A alternativa mais rápida do cenário passa pelo trecho
                  afetado.
                </p>
                <div className="alert-detail">
                  <div>
                    <MapPin size={20} />
                    <span>
                      <strong>Pinheiros · trecho ilustrativo</strong>
                      <small>Cenário fictício</small>
                    </span>
                  </div>
                  <div>
                    <ShieldAlert size={20} />
                    <span>
                      <strong>Via reportada como intransitável</strong>
                      <small>Segundo 3 relatos demonstrativos</small>
                    </span>
                  </div>
                </div>
                <div className="alternative">
                  <strong>Uma alternativa está disponível</strong>
                  <p>
                    6 minutos a mais, evitando o trecho afetado e uma área R3.
                  </p>
                </div>
                <div className="source">
                  <Clock3 size={15} /> Relatos e chuva SIBH · dados
                  demonstrativos
                </div>
                {!comparisonAvailable && (
                  <div className="selection-warning" role="alert">
                    A comparação está indisponível. Volte ao mapa e escolha os
                    locais do cenário com dados disponíveis.
                  </div>
                )}
                <button
                  className="primary"
                  disabled={!comparisonAvailable}
                  onClick={() => go("compare")}
                >
                  <Route size={18} /> Comparar alternativas
                </button>
                <button
                  className="secondary"
                  onClick={() => setCenterSignal((n) => n + 1)}
                >
                  Centralizar trecho no mapa
                </button>
                <p className="footnote">
                  As condições podem mudar rapidamente. O Rota Segura apoia sua
                  decisão e não garante que um caminho esteja seguro.
                </p>
              </>
            )}
          </div>
          <footer>
            Feito para decisões mais informadas <span>·</span> São Paulo, SP
          </footer>
        </aside>
      </main>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
