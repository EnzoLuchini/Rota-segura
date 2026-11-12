import React, { useState, useEffect, useRef } from "react";
import ExtraScreens from "./ExtraScreens";
import MapContextBar from "./components/MapContextBar";
import RealMapLegend from "./components/RealMapLegend";
import MapLayerControls from "./components/MapLayerControls";
import RainLayer from "./components/RainLayer";
import RealAlerts from "./components/RealAlerts";
import MapResizeObserver from "./components/MapResizeObserver";
import {Waterways, FitRoutes, HistoricalOccurrences, FloodAreas, RouteFloodHighlights} from "./components/RealLayers";
import {useRealRoutes, RealSearch, RealComparison} from "./components/RealRoutes";
import Logo from "./components/Logo";
import CityMapPanel from "./components/CityMapPanel";
import ScenarioMarkers from "./components/ScenarioMarkers";
import CityModeTabs from "./components/CityModeTabs";
import { getCityEvents, illustrativeFloodArea, illustrativeStreams } from "./data/cityMap";
import { divIcon } from "leaflet";
import MobileNavigation from "./components/MobileNavigation";
import {
  routes,
  occurrences,
  zone,
  places,
  routeFactors,
  canCompareTrip,
  getOrderedSegments,
  scenarioAlert,
} from "./data/scenario";
import {
  createInitialPreferences,
  PROTOTYPE_STORAGE_KEYS,
  shouldShowScenarioAlert,
} from "./state/prototypeStorage";
import { useStoredState } from "./state/useStoredState";
import { useRealSavedRoutes } from "./state/useRealSavedRoutes";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Polyline,
  Polygon,
  CircleMarker,
  Marker,
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
import "./real.css";

const safer = routes.safe.points;
const faster = routes.fast.points;
const cityMarkerIcons = {
  flood: divIcon({className: 'city-marker-shell', html: '<span class="city-marker city-marker-flood"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3C9 7 6.5 9.5 6.5 13a5.5 5.5 0 0 0 11 0C17.5 9.5 15 7 12 3Z"/><path d="M9.5 14.5c.3 1.1 1.2 1.8 2.5 1.9"/></svg></span>', iconSize: [36, 36], iconAnchor: [18, 18]}),
  inundation: divIcon({className: 'city-marker-shell', html: '<span class="city-marker city-marker-inundation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 9c2-2 4 2 6 0s4 2 6 0 4 2 6 0M3 14c2-2 4 2 6 0s4 2 6 0 4 2 6 0M3 19c2-2 4 2 6 0s4 2 6 0 4 2 6 0"/></svg></span>', iconSize: [36, 36], iconAnchor: [18, 18]}),
  closure: divIcon({className: 'city-marker-shell', html: '<span class="city-marker city-marker-closure"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="m6.5 6.5 11 11"/></svg></span>', iconSize: [36, 36], iconAnchor: [18, 18]}),
  tree: divIcon({className: 'city-marker-shell', html: '<span class="city-marker city-marker-tree"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21v-8m-4 8h8M7 15a4 4 0 0 1-1-7 5 5 0 0 1 10-1 4 4 0 0 1 1 8H7Z"/></svg></span>', iconSize: [36, 36], iconAnchor: [18, 18]}),
  report: divIcon({className: 'city-marker-shell', html: '<span class="city-marker city-marker-report"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20L12 3Zm0 6v4m0 3v.1"/></svg></span>', iconSize: [36, 36], iconAnchor: [18, 18]}),
};

const factorIcons = {
  risk: ShieldAlert,
  history: History,
  rain: CloudRain,
  water: Waves,
};
function Recenter({ signal, view }) {
  const map = useMap();
  const wasCity = useRef(false);
  useEffect(() => {
    if (view === "city" && !wasCity.current) map.setView([-23.563, -46.651], 12);
    if (view !== "city" && wasCity.current) map.setView([-23.568, -46.683], 14);
    wasCity.current = view === "city";
  }, [map, view]);
  useEffect(() => {
    if (signal)
      map.setView(
        view === "city" ? [-23.563, -46.651] : view === "alert" ? occurrences[0].position : [-23.568, -46.683],
        view === "city" ? 12 : view === "alert" ? 15 : 14,
      );
  }, [signal, map, view]);
  return null;
}
function RecenterReal({signal, routes}) {
  const map=useMap();
  useEffect(()=>{
    if (!signal) return;
    const points=routes.flatMap(route=>route.geometry.coordinates.map(([lon,lat])=>[lat,lon]));
    map.invalidateSize({animate:false,pan:false});
    if(points.length) map.fitBounds(points,{padding:[35,35],animate:false});
    else map.setView([-23.56,-46.65],13,{animate:false});
  },[signal,map]);
  return null;
}
function LocateCityEvent({selection, markers}) {
  const map = useMap();
  useEffect(() => {
    if (!selection) return;
    map.setView(selection.event.position, 15);
    requestAnimationFrame(() => markers.current[selection.event.id]?.openPopup());
  }, [selection, map, markers]);
  return null;
}
export default function App({real = false}) {
  const [view, setView] = useState(real ? "home" : (new URLSearchParams(window.location.search).get("view") || "welcome")),
    [selected, setSelected] = useState("safe"),
    [expanded, setExpanded] = useState(-1),
    [menu, setMenu] = useState(false),
    [origin, setOrigin] = useState("Minha localização"),
    [destination, setDestination] = useState("Hospital das Clínicas"),
    [toast, setToast] = useState(""),
    [dataState, setDataState] = useState("available"),
    [cityMode, setCityMode] = useState("now"),
    [cityDataState, setCityDataState] = useState("available"),
    [showAlert, setShowAlert] = useState(true),
    [citySelection, setCitySelection] = useState(null);
  const realData = useRealRoutes();
  const [realSavedRoutes,setRealSavedRoutes,realSavedError] = useRealSavedRoutes();
  const [sheetOpen, setSheetOpen] = useState(true);
  const sheetTouchStart = useRef(null);
  const sheetDragged = useRef(false);
  const menuTriggerRef = useRef(null);
  const cityMarkers = useRef({});
  const mapSurfaceRef = useRef(null);
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
    if (real && !["home", "compare", "save", "saved", "alerts"].includes(next)) { window.location.href = `/simulacao?view=${encodeURIComponent(next)}`; return; }
    setSheetOpen(true);
    setView(next);
    if (next !== 'city') setCitySelection(null);
    document.querySelector(".panel")?.scrollTo(0, 0);
    if (next === "city") window.scrollTo(0, 0);
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
        heading.focus({ preventScroll: true });
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
  const scenarioAlertVisible = shouldShowScenarioAlert(prefs, showAlert);
  const comparisonAvailable = canCompareTrip(origin, destination, dataState);
  const currentEvents = getCityEvents(view === 'city' ? cityMode : 'now', reports);
  const selectedScenarioSegment = getOrderedSegments(origin !== places[0])[selectedSegment];
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      {!real && <div className="simulation-banner">Simulação com dados fictícios · <a href="/">Ir para consulta real</a></div>}
      <header className="header">
        <Logo />
        {real && <a className="real-simulation-link" href="/simulacao">Abrir simulação</a>}
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
            Alertas {!real && <span className="count">{scenarioAlertVisible ? 1 : 0}</span>}
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
        alertCount={real ? null : (scenarioAlertVisible ? 1 : 0)}
        triggerRef={menuTriggerRef}
      />
      <main className={"workspace " + (sheetOpen ? "sheet-open" : "sheet-closed")}>
        <section className="map-area" aria-label={real ? "Mapa de rotas e informações geográficas" : view === "city" ? "Mapa demonstrativo da cidade" : "Mapa demonstrativo de rotas"}>
          {view === "city" && <div className="city-tabs-mobile"><CityModeTabs mode={cityMode} onModeChange={setCityMode} /></div>}
          <div className="map-surface" ref={mapSurfaceRef}>
            <MapContainer
              center={real ? [-23.56, -46.65] : [-23.568, -46.683]}
              zoom={real ? 13 : 14}
              zoomControl={false}
              scrollWheelZoom={true}
            >
              <MapResizeObserver/>
              {real ? <RecenterReal signal={centerSignal} routes={realData.routes}/> : <Recenter signal={centerSignal} view={view} />}
              <LocateCityEvent selection={view === 'city' ? citySelection : null} markers={cityMarkers} />
              {import.meta.env.DEV ? <>
                <TileLayer
                  attribution="Tiles &copy; Esri &mdash; Sources: Esri, OpenStreetMap contributors"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  maxNativeZoom={16}
                  keepBuffer={2}
                />
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                  maxNativeZoom={16}
                  keepBuffer={2}
                />
              </> : <TileLayer
                attribution='&copy; <a href="https://stadiamaps.com/attribution/" target="_blank">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png"
                maxNativeZoom={20}
                keepBuffer={2}
              />}
              {real && <><Waterways enabled={realData.water}/><HistoricalOccurrences enabled={realData.history} routeEvents={realData.routes[realData.selected]?.floodContext?.history.events || []}/>{realData.risk && realData.areas.length>0 && <GeoJSON key="areas" data={{type:"FeatureCollection",features:realData.areas}} style={{color:"#d88c18",weight:1,fillOpacity:.2}}/>}{realData.routes.map((route,i)=>({route,i})).sort((a,b)=>(a.i===realData.selected)-(b.i===realData.selected)).map(({route,i})=><Polyline key={i} positions={route.geometry.coordinates.map(([lon,lat])=>[lat,lon])} pathOptions={{color:i===realData.selected?"#1763e9":"#7189a2",weight:i===realData.selected?6:4,opacity:.9}}/>)}{realData.routes[realData.selected]?.geometry.coordinates.length>1 && [0,-1].map((index)=>{const point=realData.routes[realData.selected].geometry.coordinates.at(index);return <CircleMarker key={index} center={[point[1],point[0]]} radius={8} pathOptions={{color:"white",weight:3,fillColor:index===0?"#1763e9":"#0e2b64",fillOpacity:1}}><Popup>{index===0?"Origem":"Destino"}</Popup></CircleMarker>})}<FitRoutes routes={realData.routes}/></>}
              {real && <><RainLayer enabled={realData.rain}/><FloodAreas period={realData.floodPeriod}/><RouteFloodHighlights route={realData.routes[realData.selected]} showMarkers={false}/></>}
              {!real && view !== "city" && <>
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
              </>}
              {!real && (view === "city" ? (cityDataState === "available" || cityDataState === "stale") : (dataState === "available" || dataState === "stale")) && <>
                {illustrativeStreams.map((points, i) => <Polyline key={i} positions={points} pathOptions={{color: '#2586ac', weight: 3, opacity: .85, dashArray: '3 5'}}><Popup>Córrego ilustrativo · geometria fictícia. Sua presença não indica risco por si só.</Popup></Polyline>)}
                {currentEvents.filter(event => event.kind === 'inundation').map(event => <Polygon key={'area-' + event.id} positions={illustrativeFloodArea(event.position, view !== 'city' || cityMode === 'now' ? 2.2 : 1)} pathOptions={{color: '#dc8b1b', weight: 2, dashArray: view === 'city' && cityMode === 'history' ? '6 5' : undefined, fillColor: '#ffc15b', fillOpacity: .26}}><Popup>Área de inundação ilustrativa · limites fictícios{view === 'city' && cityMode === 'history' ? ' · registro histórico' : ''}</Popup></Polygon>)}
                <ScenarioMarkers events={currentEvents} icons={cityMarkerIcons} markers={cityMarkers} />
              </>}
              {!real && view === "alert" && (
                <Polyline
                  positions={getOrderedSegments(false).find(segment => segment.id === 'risco-e-ocorrencia').points}
                  pathOptions={{
                    color: "#d9364f",
                    weight: 10,
                    dashArray: "8 6",
                  }}
                />
              )}
              {!real && view === "segments" && (
                <Polyline
                  positions={selectedScenarioSegment.points}
                  pathOptions={{
                    color: "#ec9223",
                    weight: 10,
                    dashArray: "8 6",
                  }}
                />
              )}
            </MapContainer>
            {real ? <div className="map-top"><div className="weather"><CloudRain size={19}/><span>Chuva por estação nas camadas</span></div><div id="flood-status" role="status" className="map-layer-status"/></div> : view !== "city" && <div className="map-top">
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
            </div>}
            {real && <MapLayerControls rain={realData.rain} onRainChange={realData.setRain} water={realData.water} onWaterChange={realData.setWater} risk={realData.risk} onRiskChange={realData.setRisk} riskAvailable={realData.riskAvailable} hasRoutes={realData.routes.length>0} history={realData.history} onHistoryChange={realData.setHistory} floodPeriod={realData.floodPeriod} onFloodPeriodChange={realData.setFloodPeriod}/>}
            <div className="map-tools">
              <button
                aria-label="Centralizar mapa"
                onClick={() => setCenterSignal((n) => n + 1)}
              >
                <LocateFixed size={19} />
              </button>
            </div>
          </div>
        </section>
        <aside className="panel" id="main-content" tabIndex={-1}>
          <button
            type="button"
            className="mobile-sheet-handle"
            aria-label={sheetOpen ? "Recolher painel" : "Abrir painel"}
            aria-expanded={sheetOpen}
            aria-controls="panel-content"
            onClick={() => {
              if (sheetDragged.current) { sheetDragged.current = false; return; }
              setSheetOpen(open => !open);
            }}
            onTouchStart={event => { sheetTouchStart.current = event.touches[0].clientY; sheetDragged.current = false; }}
            onTouchEnd={event => {
              if (sheetTouchStart.current === null) return;
              const delta = event.changedTouches[0].clientY - sheetTouchStart.current;
              sheetTouchStart.current = null;
              if (Math.abs(delta) > 40) {
                sheetDragged.current = true;
                setSheetOpen(delta < 0);
                setTimeout(() => { sheetDragged.current = false; }, 500);
              }
            }}
            onTouchCancel={() => { sheetTouchStart.current = null; sheetDragged.current = false; }}
          ><span aria-hidden="true" /></button>
          <div className="panel-inner" id="panel-content">
            {!(real && view === 'alerts') && <ExtraScreens
              real={real}
              savedRoutesError={real ? realSavedError : ''}
              onUseRoute={item => {realData.clear();realData.setOrigin(item.origin);realData.setDestination(item.destination);go('home');}}
              view={view}
              go={go}
              selected={selected}
              setSelected={setSelected}
              origin={real ? realData.origin : origin}
              destination={real ? realData.destination : destination}
              savedRoutes={real ? realSavedRoutes : savedRoutes}
              setSavedRoutes={real ? setRealSavedRoutes : setSavedRoutes}
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
              showAlert={showAlert}
              setShowAlert={setShowAlert}
            />}
            {real && view === 'alerts' && <RealAlerts onBack={()=>go('home')}/>}
            {view === "city" && <CityMapPanel mode={cityMode} onModeChange={setCityMode} dataState={cityDataState} onDataStateChange={setCityDataState} reports={reports} onLocate={event => { setCitySelection({event}); if (window.matchMedia?.('(max-width: 800px)').matches) setSheetOpen(false); else mapSurfaceRef.current?.scrollIntoView({block: 'center'}); }} onBack={() => go("home")} />}
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
                <button className="secondary city-entry" onClick={() => go("city")}><MapPin size={18} /> Explorar situação da cidade {real && "(simulação)"}</button>
                {real ? <RealSearch data={realData} onCompare={()=>go("compare")}/> : <>
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
                  Cenário disponível: {places[0]} ↔ {places[1]}.
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
                </button></>}
                {real ? <><div className="section-heading"><div><span className="overline">Informações oficiais</span><h2>Avisos meteorológicos</h2></div></div><button className="secondary" onClick={()=>go('alerts')}>Consultar avisos do INMET</button></> : <><div className="section-heading">
                  <div>
                    <span className="overline">No seu caminho</span>
                    <h2>Fique por dentro {real && <small>· simulação</small>}</h2>
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
                      <strong>{scenarioAlert.title} {real && "(simulação)"}</strong>
                      <small>{occurrences[0].shortLocation} · {occurrences[0].time}</small>
                    </span>
                    <ChevronRight size={19} />
                  </button>
                ) : (
                  <div className="empty-state">
                    {showAlert ? 'Nenhum alerta de exemplo corresponde às preferências.' : 'Alerta de exemplo oculto na central de alertas.'}
                  </div>
                )}</>}
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
                    {real ? "Relatos são simulados. As rotas, os avisos meteorológicos e os dados geográficos consultados são reais, com cobertura limitada." : "Este é um protótipo. Rotas, condições e ocorrências são ilustrativas."}
                  </span>
                </div>
              </>
            )}
            {view === "compare" && real && <RealComparison data={realData} onBack={()=>go("home")} onSave={()=>go("save")}/>}
            {view === "compare" && !real && (
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
                  A rota recomendada leva {routes.safe.minutes - routes.fast.minutes} minutos a mais e evita riscos
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
                        <strong>{routes.safe.minutes} min</strong>
                        <span>{routes.safe.minutes - routes.fast.minutes} min a mais</span>
                      </span>
                      <small>{routes.safe.summary}</small>
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
                        <strong>{routes.fast.minutes} min</strong>
                        <span>{routes.safe.minutes - routes.fast.minutes} min a menos</span>
                      </span>
                      <small>
                        {routes.fast.summary}
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
                    <strong>Por que recomendamos a rota de {routes.safe.minutes} min?</strong>
                    <small>Entenda os fatores considerados</small>
                  </span>
                  <ChevronRight size={19} />
                </button>
                <div className="source">
                  <Clock3 size={15} /> GeoSampa e SIBH · dados demonstrativos
                </div>
                <p className="footnote">Os avisos no mapa são ilustrativos. Esta comparação considera apenas o cenário de rota descrito acima; os demais avisos e relatos não recalculam a rota.</p>
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
                      {routes.safe.minutes} min <span>· {routes.safe.minutes - routes.fast.minutes} min a mais</span>
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
                              <span>{factor.source}</span>
                              <span>{factor.period}</span>
                              <span>{factor.relation}</span>
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
            {!real && view === "alert" && (
              <>
                <button className="back" onClick={() => go("alerts")}>
                  <ArrowLeft size={18} /> Voltar aos alertas
                </button>
                <span className="severity">
                  Atenção {occurrences[0].severity.toLowerCase()} · {occurrences[0].time} · {occurrences[0].validity}
                </span>
                <h1>{scenarioAlert.detailTitle}</h1>
                <p className="intro">
                  A alternativa mais rápida do cenário passa pelo trecho
                  afetado.
                </p>
                <div className="alert-detail">
                  <div>
                    <MapPin size={20} />
                    <span>
                      <strong>{occurrences[0].location}</strong>
                      <small>Cenário fictício</small>
                    </span>
                  </div>
                  <div>
                    <ShieldAlert size={20} />
                    <span>
                      <strong>{occurrences[0].description}</strong>
                      <small>Segundo {occurrences[0].reportCount} relatos demonstrativos</small>
                    </span>
                  </div>
                </div>
                <div className="alternative">
                  <strong>Uma alternativa está disponível</strong>
                  <p>
                    {routes.safe.minutes - routes.fast.minutes} minutos a mais, evitando o trecho afetado e uma área R3.
                  </p>
                </div>
                <div className="source">
                  <Clock3 size={15} /> {scenarioAlert.source}
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
          {real ? <RealMapLegend showRain={realData.rain} showRoutes={realData.routes.length>0} showWater={realData.water} showRisk={realData.risk && realData.riskAvailable && realData.areas.length>0} showHistory={realData.history || !!realData.routes[realData.selected]?.floodContext?.history.events.length} showFlood={!!realData.floodPeriod} showRouteContext={Object.values(realData.routes[realData.selected]?.floodContext?.areas || {}).some(area=>area.segmentIndexes.length>0)}/> : <MapContextBar cityMode={view === "city" ? cityMode : null} />}
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
