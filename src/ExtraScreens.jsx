import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ShieldAlert, MapPin, Plus, Trash2 } from "lucide-react";
import { occurrences, routes, saveRoute, getOrderedSegments, places, reportLocation } from "./data/scenario";
import {
  clearPrototypeStorage,
  shouldShowScenarioAlert,
} from "./state/prototypeStorage";
import { retainEditIdForView } from "./state/routeEditing";

export default function ExtraScreens({
  real = false,
  savedRoutesError = '',
  onUseRoute,
  view,
  go,
  selected,
  setSelected,
  origin,
  destination,
  savedRoutes,
  setSavedRoutes,
  resetSavedRoutes,
  reports,
  setReports,
  resetReports,
  prefs,
  setPrefs,
  resetPrefs,
  profile,
  setProfile,
  resetProfile,
  readAlerts,
  setReadAlerts,
  resetReadAlerts,
  selectedSegment,
  setSelectedSegment,
  showAlert,
  setShowAlert,
}) {
  const [name, setName] = useState("Minha rota");
  const [days, setDays] = useState("Segunda a sexta");
  const [outbound, setOutbound] = useState("08:00");
  const [returnTime, setReturnTime] = useState("18:00");
  const [lead, setLead] = useState("30");
  const [mode, setMode] = useState("Carro");
  const [editId, setEditId] = useState(null);
  const [type, setType] = useState("Alagamento");
  const [severity, setSeverity] = useState("Moderada");
  const [passable, setPassable] = useState("Não sei");
  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const clearTriggerRef = useRef(null);
  const clearCancelRef = useRef(null);
  const clearConfirmRef = useRef(null);
  useEffect(() => {
    if (confirmClear) clearCancelRef.current?.focus();
  }, [confirmClear]);
  const closeClearDialog = () => {
    setConfirmClear(false);
    clearTriggerRef.current?.focus();
  };
  const segments = getOrderedSegments(origin !== places[0]);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (view !== "save") {
      setEditId((current) => retainEditIdForView(view, current));
      return;
    }
    if (editId === null) {
      setName("Minha rota");
      setDays("Segunda a sexta");
      setOutbound("08:00");
      setReturnTime("18:00");
      setLead("30");
      setMode("Carro");
      setError("");
    }
  }, [view]);
  const back = (target, label = "Voltar") => (
    <button className="back" onClick={() => go(target)}>
      <ArrowLeft size={18} /> {label}
    </button>
  );
  const title = (eyebrow, heading, desc) => (
    <>
      <span className="overline">{eyebrow}</span>
      <h1>{heading}</h1>
      {desc && <p className="intro">{desc}</p>}
    </>
  );
  const field = (label, value, setter, type = "text") => (
    <label className="form-field">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => setter(e.target.value)}
      />
    </label>
  );
  const toggle = (key, label) => (
    <label className="toggle-row">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={Boolean(prefs[key])}
        onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
      />
    </label>
  );
  const persistRoute = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Informe um nome para a rota.");
      return;
    }
    const previous = savedRoutes.find((item) => item.id === editId);
    const route = {
        id: editId || String(Date.now()),
        name: name.trim(),
        origin: previous?.origin ?? origin,
        destination: previous?.destination ?? destination,
        days,
        outbound,
        returnTime,
        mode,
        ...(real ? {} : {routeId:selected,lead,enabled:previous?.enabled ?? true}),
    };
    if (real && (!route.origin?.coordinates || !route.destination?.coordinates)) {setError('Selecione origem e destino reais antes de salvar.');return;}
    if (setSavedRoutes(saveRoute(savedRoutes, route)) === false) return;
    setEditId(null);
    setError("");
    go("saved");
  };
  const beginEdit = (item) => {
    if (!real) setSelected(item.routeId);
    setEditId(item.id);
    setName(item.name);
    setDays(item.days);
    setOutbound(item.outbound);
    setReturnTime(item.returnTime);
    setLead(item.lead ?? '30');
    setMode(item.mode);
    go("save");
  };
  if (view === "welcome")
    return (
      <div className="welcome">
        <span className="welcome-mark">◉</span>
        <h1>Rota Segura</h1>
        <p>
          Compare caminhos durante a chuva e entenda os riscos conhecidos em
          cada trajeto.
        </p>
        <button className="primary" onClick={() => go("home")}>
          Continuar sem conta
        </button>
        <button className="secondary" onClick={() => go("login")}>
          Entrar ou criar conta
        </button>
        <small>Você pode explorar o mapa sem criar conta.</small>
      </div>
    );
  if (view === "login" || view === "signup")
    return (
      <>
        {back("welcome")}
        {title(
          "Acesso simulado",
          view === "login" ? "Entrar" : "Criar conta",
          "Acesso visual para demonstração. Não informe senha real.",
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!accountName.trim() || !accountEmail.includes("@")) {
              setError("Informe um nome e um e-mail de exemplo válido.");
              return;
            }
            setProfile(accountName.trim());
            setError("");
            go("home");
          }}
        >
          {field("Nome de exemplo", accountName, setAccountName)}
          {field("E-mail de exemplo", accountEmail, setAccountEmail, "email")}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary">Continuar</button>
        </form>
        <button
          className="secondary"
          onClick={() => {
            setError("");
            go(view === "login" ? "signup" : "login");
          }}
        >
          {view === "login"
            ? "Criar conta simulada"
            : "Já tenho conta simulada"}
        </button>
      </>
    );
  if (view === "segments")
    return (
      <>
        {back("explain")}
        {title(
          "Detalhes do percurso",
          "Entenda cada trecho",
          "Selecione um trecho para destacá-lo no mapa.",
        )}
        <div className="segment-list">
          {segments.map((segment, i) => (
            <button
              key={segment.id}
              className={"segment " + (selectedSegment === i ? "selected" : "")}
              aria-pressed={selectedSegment === i}
              onClick={() => setSelectedSegment(i)}
            >
              <strong>{segment.name}</strong>
              <span>{segment.description}</span>
            </button>
          ))}
        </div>
        <div className="alternative">
          <strong>{segments[selectedSegment].name}</strong>
          <p>{segments[selectedSegment].description}</p>
          <p>{segments[selectedSegment].source}</p>
          <p>{segments[selectedSegment].period}</p>
          <p>{segments[selectedSegment].relation}</p>
        </div>
      </>
    );
  if (view === "alerts") {
    const alertVisible = shouldShowScenarioAlert(prefs, showAlert);
    return (
      <>
        {back("home")}
        {title(
          "Central de alertas",
          "Seus alertas",
          "Ocorrências de exemplo relacionadas ao cenário.",
        )}
        <label className="toggle-row">
          <span>Mostrar alerta de exemplo</span>
          <input
            type="checkbox"
            checked={showAlert}
            disabled={!prefs.alerts}
            onChange={(e) => setShowAlert(e.target.checked)}
          />
        </label>
        {!prefs.alerts && (
          <div className="notice" role="status">
            <span>Alertas simulados estão desativados nas preferências.</span>
          </div>
        )}
        {prefs.alerts && (prefs.incidents === false || prefs.severity === 'Crítica') && <p className="footnote">As preferências de categoria ou severidade ocultam este alerta de exemplo.</p>}
        {alertVisible ? (
          <button
            className="alert-card"
            onClick={() => {
              setReadAlerts(true);
              go("alert");
            }}
          >
            <span className="alert-icon">
              <ShieldAlert size={21} />
            </span>
            <span>
              <strong>
                {occurrences[0].type} · Atenção alta ·{" "}
                {readAlerts ? "Lido" : "Novo"}
              </strong>
              <small>
                {occurrences[0].location} · {occurrences[0].time}
              </small>
            </span>
          </button>
        ) : (
          <div className="empty-state">
            Nenhum alerta para exibir neste cenário.
          </div>
        )}
        {savedRoutes.some((r) => r.routeId === "fast" && r.enabled) && (
          <p className="footnote">
            Este evento afeta uma rota frequente com alertas ativados neste
            cenário.
          </p>
        )}
        <p className="footnote">
          Os alertas desta tela são fictícios e não geram notificações reais.
        </p>
      </>
    );
  }
  if (view === "report")
    return (
      <>
        {back("home")}
        {title(
          "Relato comunitário",
          "Relatar ocorrência",
          "Sua observação será guardada somente neste navegador.",
        )}
        {!profile && (
          <div className="notice">
            <span>
              Na versão real, será necessário se identificar para enviar
              relatos.
            </span>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDraft({ type, severity, passable, description });
          }}
        >
          <label className="form-field">
            Tipo
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>Alagamento</option>
              <option>Enxurrada</option>
              <option>Árvore caída</option>
              <option>Deslizamento</option>
            </select>
          </label>
          <label className="form-field">
            Local
            <select>
              <option>{reportLocation.label}</option>
            </select>
          </label>
          <label className="form-field">
            Gravidade percebida
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option>Baixa</option>
              <option>Moderada</option>
              <option>Alta</option>
            </select>
          </label>
          <label className="form-field">
            A via está transitável?
            <select
              value={passable}
              onChange={(e) => setPassable(e.target.value)}
            >
              <option>Não sei</option>
              <option>Sim</option>
              <option>Não</option>
            </select>
          </label>
          <label className="form-field">
            Descrição opcional
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="form-field">
            Foto opcional
            <input type="file" accept="image/*" />
            <small>A foto não será enviada nem salva.</small>
          </label>
          <button className="primary">Revisar relato</button>
        </form>
        {draft && (
          <div className="review-box">
            <strong>Confira seu relato</strong>
            <p>
              {draft.type} em {reportLocation.shortLabel} · {draft.severity} · via transitável:{" "}
              {draft.passable}
            </p>
            <p>{draft.description}</p>
            <button
              className="primary"
              onClick={() => {
                setReports([...reports, { id: String(Date.now()), ...draft }]);
                setDraft(false);
                setDescription("");
                setSuccess(true);
                go("reports");
              }}
            >
              Confirmar relato simulado
            </button>
            <button className="secondary" onClick={() => setDraft(false)}>
              Continuar editando
            </button>
          </div>
        )}
        <button
          className="secondary"
          onClick={() => {
            setDraft(false);
            go("home");
          }}
        >
          Cancelar
        </button>
      </>
    );
  if (view === "reports")
    return (
      <>
        {back("home")}
        {title(
          "Comunidade",
          "Relatos locais",
          "Registros fictícios ou criados neste navegador.",
        )}
        {success && (
          <div className="success-message" role="status">
            Relato simulado registrado neste navegador.
          </div>
        )}
        <div className="alternative">
          <strong>
            {occurrences[0].type} · {occurrences[0].location}
          </strong>
          <p>{occurrences[0].description} · dado fictício</p>
        </div>
        {reports.map((report) => (
          <div className="local-card" key={report.id}>
            <strong>
              {report.type} · {report.severity}
            </strong>
            <p>{reportLocation.shortLabel} · via transitável: {report.passable}</p>
            <small>
              Relato comunitário simulado · não é confirmação oficial
            </small>
            <p>{report.description}</p>
          </div>
        ))}
        <button
          className="primary"
          onClick={() => {
            setSuccess(false);
            go("report");
          }}
        >
          <Plus size={18} /> Criar relato
        </button>
      </>
    );
  if (view === "save" || view === "save-fast")
    return (
      <>
        <button
          className="back"
          onClick={() => {
            setEditId(null);
            setError("");
            go(editId ? "saved" : "compare");
          }}
        >
          <ArrowLeft size={18} /> Cancelar
        </button>
        {title(
          "Rota frequente",
          editId ? "Editar rota" : "Salvar rota",
          real ? "A origem e o destino ficam neste navegador. A próxima consulta calcula novas alternativas." : "As escolhas ficam apenas neste navegador.",
        )}
        <form onSubmit={persistRoute}>
          {field("Nome da rota", name, setName)}
          <label className="form-field">
            Modal
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option>Carro</option>
              {!real && <><option>A pé</option><option>Transporte público</option></>}
            </select>
          </label>
          <label className="form-field">
            Dias
            <select value={days} onChange={(e) => setDays(e.target.value)}>
              <option>Segunda a sexta</option>
              <option>Todos os dias</option>
              <option>Fins de semana</option>
            </select>
          </label>
          {field("Horário de ida", outbound, setOutbound, "time")}
          {field("Horário de volta", returnTime, setReturnTime, "time")}
          {!real && <label className="form-field">
            Antecedência
            <select value={lead} onChange={(e) => setLead(e.target.value)}>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
            </select>
          </label>}
          <p className="footnote">
            {real ? 'As rotas ficam neste navegador. Outras pessoas que o utilizem podem acessá-las. Não há envio de notificações.' : 'Avisos são apenas simulados. Não há envio de notificações.'}
          </p>
          {error && <p className="form-error">{error}</p>}
          {savedRoutesError && <p className="form-error" role="alert">{savedRoutesError}</p>}
          <button className="primary">Salvar neste navegador</button>
        </form>
      </>
    );
  if (view === "saved")
    return (
      <>
        {back("home")}
        {title(
          "Seus trajetos",
          "Rotas frequentes",
          "Rotas guardadas neste navegador.",
        )}{" "}
        {savedRoutes.length === 0 && !savedRoutesError ? (
          <div className="empty-state">
            Você ainda não salvou nenhuma rota.
            <button className="secondary" onClick={() => go("home")}>
              Comparar uma rota
            </button>
          </div>
        ) : (
          savedRoutes.map((item) => (
            <div className="local-card" key={item.id}>
              <strong>{item.name}</strong>
              {!real && <p>
                {routes[item.routeId]?.title} · {routes[item.routeId]?.minutes}{" "}
                min
              </p>}
              <small>
                {real ? item.origin?.label : (item.origin || places[0])} →{" "}
                {real ? item.destination?.label : (item.destination || places[1])}
              </small>
              <br />
              <small>
                {item.days} · volta {item.returnTime}{!real && <> · {item.enabled ? "Alertas ativados" : "Alertas pausados"}</>}
              </small>
              <div className="card-actions">
                <button onClick={() => beginEdit(item)}>Editar</button>
                {real && <button onClick={()=>onUseRoute(item)}>Consultar novamente</button>}
                {!real && <button
                  onClick={() =>
                    setSavedRoutes(
                      savedRoutes.map((r) =>
                        r.id === item.id ? { ...r, enabled: !r.enabled } : r,
                      ),
                    )
                  }
                >
                  {item.enabled ? "Pausar" : "Ativar"} alertas
                </button>}
                <button
                  onClick={() => {
                    if (
                      window.confirm("Excluir esta rota salva neste navegador?")
                    )
                      setSavedRoutes(
                        savedRoutes.filter((r) => r.id !== item.id),
                      );
                  }}
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          ))
        )}
        {savedRoutesError && <p className="form-error" role="alert">{savedRoutesError}</p>}
        <p className="footnote">{real ? 'Dados guardados neste navegador; ao limpar seus dados, as rotas podem ser apagadas. Nenhuma notificação será enviada.' : 'Alertas e horários são simulados; nenhuma notificação será enviada.'}</p>
      </>
    );
  if (view === "profile")
    return (
      <>
        {back("home")}
        {title(
          "Suas escolhas",
          profile || "Visitante",
          "As preferências são salvas neste navegador.",
        )}
        <div className="settings">
          {toggle("alerts", "Alertas simulados")}
          {toggle("rain", "Avisos de chuva")}
          {toggle("incidents", "Ocorrências e relatos")}
          {toggle("location", "Usar localização futuramente")}
          <label className="form-field">
            Severidade mínima
            <select
              value={prefs.severity || "Todas"}
              onChange={(e) => setPrefs({ ...prefs, severity: e.target.value })}
            >
              <option>Todas</option>
              <option>Alta</option>
              <option>Crítica</option>
            </select>
          </label>
          <label className="form-field">
            Horário silencioso
            <input
              type="time"
              value={prefs.quiet || "22:00"}
              onChange={(e) => setPrefs({ ...prefs, quiet: e.target.value })}
            />
          </label>
        </div>
        <p className="footnote">
          Nenhuma permissão de localização ou notificação é solicitada neste
          protótipo.
        </p>
        <button
          className="secondary"
          onClick={() => {
            setProfile("");
            go("welcome");
          }}
        >
          {profile ? "Sair da conta simulada" : "Entrar com conta simulada"}
        </button>
        <button ref={clearTriggerRef} className="text-danger" onClick={() => setConfirmClear(true)}>
          Apagar dados locais
        </button>
        {confirmClear && createPortal(
          <div className="clear-dialog-backdrop">
          <div
            className="review-box clear-dialog"
            role="alertdialog"
            aria-labelledby="clear-data-title"
            aria-modal="true"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                closeClearDialog();
              } else if (event.key === "Tab") {
                if (event.shiftKey && document.activeElement === clearConfirmRef.current) {
                  event.preventDefault();
                  clearCancelRef.current?.focus();
                } else if (!event.shiftKey && document.activeElement === clearCancelRef.current) {
                  event.preventDefault();
                  clearConfirmRef.current?.focus();
                }
              }
            }}
          >
            <strong id="clear-data-title">
              Apagar rotas, relatos, preferências e conta simulada deste
              navegador?
            </strong>
            <p>Outros dados e sites não serão alterados.</p>
            <button
              ref={clearConfirmRef}
              className="secondary"
              onClick={() => {
                clearPrototypeStorage(localStorage);
                resetSavedRoutes();
                resetReports();
                resetPrefs();
                resetProfile();
                resetReadAlerts();
                closeClearDialog();
              }}
            >
              Confirmar exclusão
            </button>
            <button
              ref={clearCancelRef}
              className="secondary"
              onClick={closeClearDialog}
            >
              Cancelar
            </button>
          </div>
          </div>, document.body
        )}
      </>
    );
  if (view === "sources")
    return (
      <>
        {back("home")}
        {title(
          "Transparência",
          "Fontes e metodologia",
          "Conheça os dados previstos para a comparação.",
        )}
        <div className="local-card">
          <strong>Áreas e histórico · GeoSampa</strong>
          <p>
            Áreas mapeadas e registros históricos podem ajudar a identificar
            exposição. A ausência de registros não garante ausência de risco.
          </p>
        </div>
        <div className="local-card">
          <strong>Chuva e rios · SIBH</strong>
          <p>
            Observações de estações representam pontos e podem estar
            indisponíveis ou desatualizadas.
          </p>
        </div>
        <div className="local-card">
          <strong>Mapa · Esri e OpenStreetMap</strong>
          <p>
            O mapa fornece contexto geográfico. A rota, a chuva e as ocorrências
            mostradas são fictícias.
          </p>
        </div>
        <div className="local-card">
          <strong>Relatos comunitários</strong>
          <p>
            São observações de pessoas, diferentes de alertas oficiais. A
            comparação é experimental e não prevê alagamentos.
          </p>
        </div>
        <p className="footnote">
          A proximidade de um rio ou córrego, por si só, não comprova perigo. O
          sistema apoia a decisão e não garante segurança.
        </p>
      </>
    );
  return null;
}
