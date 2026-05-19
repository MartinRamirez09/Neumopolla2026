import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const INITIAL_MATCHES = [
  { home_team: "México", away_team: "Canadá", home_flag: "🇲🇽", away_flag: "🇨🇦", group_name: "Grupo A", match_date: "2026-06-11T20:00:00" },
  { home_team: "Estados Unidos", away_team: "Panamá", home_flag: "🇺🇸", away_flag: "🇵🇦", group_name: "Grupo A", match_date: "2026-06-12T17:00:00" },
  { home_team: "Argentina", away_team: "Marruecos", home_flag: "🇦🇷", away_flag: "🇲🇦", group_name: "Grupo B", match_date: "2026-06-13T20:00:00" },
  { home_team: "Brasil", away_team: "Alemania", home_flag: "🇧🇷", away_flag: "🇩🇪", group_name: "Grupo C", match_date: "2026-06-14T20:00:00" },
  { home_team: "Francia", away_team: "España", home_flag: "🇫🇷", away_flag: "🇪🇸", group_name: "Grupo D", match_date: "2026-06-15T17:00:00" },
  { home_team: "Inglaterra", away_team: "Portugal", home_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", away_flag: "🇵🇹", group_name: "Grupo E", match_date: "2026-06-16T20:00:00" },
  { home_team: "Colombia", away_team: "Ecuador", home_flag: "🇨🇴", away_flag: "🇪🇨", group_name: "Grupo F", match_date: "2026-06-17T17:00:00" },
  { home_team: "Uruguay", away_team: "Chile", home_flag: "🇺🇾", away_flag: "🇨🇱", group_name: "Grupo G", match_date: "2026-06-18T20:00:00" },
  { home_team: "Japón", away_team: "Corea del Sur", home_flag: "🇯🇵", away_flag: "🇰🇷", group_name: "Grupo H", match_date: "2026-06-19T17:00:00" },
];

export default function Admin() {
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [predCount, setPredCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: m } = await supabase.from("matches").select("*").order("match_date");
    const { data: p } = await supabase.from("profiles").select("id");
    const { data: pr } = await supabase.from("predictions").select("id");
    setMatches(m || []);
    setParticipantCount(p?.length || 0);
    setPredCount(pr?.length || 0);
    setLoading(false);
  }

  async function seedMatches() {
    setSeeding(true);
    await supabase.from("matches").insert(INITIAL_MATCHES);
    setSeeded(true);
    setSeeding(false);
    fetchData();
  }

  function handleResult(matchId, side, value) {
    setResults((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: value === "" ? "" : parseInt(value) },
    }));
  }

  async function saveResults() {
    setSaving(true);
    for (const [matchId, result] of Object.entries(results)) {
      if (result.home_score === undefined || result.away_score === undefined || result.home_score === "" || result.away_score === "") continue;
      const hs = parseInt(result.home_score);
      const as_ = parseInt(result.away_score);
      await supabase.from("matches").update({ home_score: hs, away_score: as_, is_finished: true }).eq("id", matchId);
      const { data: preds } = await supabase.from("predictions").select("*").eq("match_id", matchId);
      for (const pred of preds || []) {
        let pts = 0;
        if (pred.home_score === hs && pred.away_score === as_) {
          pts = 3;
        } else {
          const predWinner = pred.home_score > pred.away_score ? "home" : pred.home_score < pred.away_score ? "away" : "draw";
          const realWinner = hs > as_ ? "home" : hs < as_ ? "away" : "draw";
          if (predWinner === realWinner) pts = 1;
        }
        await supabase.from("predictions").update({ points: pts }).eq("id", pred.id);
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setResults({});
    fetchData();
  }

  if (loading) return <div className="loading-inline">Cargando...</div>;

  return (
    <div>
      <div className="admin-banner">
        <span>⚙️ Panel de administrador</span>
        <span style={{ fontSize: "12px", opacity: 0.7 }}>Solo visible para admins</span>
      </div>

      <div className="stats-grid" style={{ marginTop: "1rem" }}>
        <div className="stat-card">
          <div className="stat-num">{participantCount}</div>
          <div className="stat-lbl">participantes</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{matches.filter((m) => m.is_finished).length}</div>
          <div className="stat-lbl">jugados</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{predCount}</div>
          <div className="stat-lbl">predicciones</div>
        </div>
      </div>

      {matches.length === 0 && (
        <div className="ranking-card" style={{ marginTop: "1rem", textAlign: "center" }}>
          <p style={{ marginBottom: "12px", color: "var(--color-text-secondary)", fontSize: "14px" }}>No hay partidos cargados. ¿Cargar los partidos iniciales del Mundial 2026?</p>
          <button className="save-btn" onClick={seedMatches} disabled={seeding}>
            {seeding ? "Cargando..." : seeded ? "✓ Partidos cargados" : "Cargar partidos del Mundial 2026"}
          </button>
        </div>
      )}

      {matches.length > 0 && (
        <>
          <p className="group-title" style={{ marginTop: "1rem" }}>Cargar resultados reales</p>
          {matches.filter((m) => !m.is_finished).map((match) => (
            <div className="match-card" key={match.id}>
              <div className="match-row">
                <div className="team-name">{match.home_flag} {match.home_team}</div>
                <div className="score-center">
                  <div className="score-inputs">
                    <input type="number" min="0" max="20" placeholder="0"
                      value={results[match.id]?.home_score ?? ""}
                      onChange={(e) => handleResult(match.id, "home_score", e.target.value)} />
                    <span className="dash">-</span>
                    <input type="number" min="0" max="20" placeholder="0"
                      value={results[match.id]?.away_score ?? ""}
                      onChange={(e) => handleResult(match.id, "away_score", e.target.value)} />
                  </div>
                  <div className="match-date">
                    {match.match_date ? new Date(match.match_date).toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : "Por definir"}
                  </div>
                </div>
                <div className="team-name right">{match.away_flag} {match.away_team}</div>
              </div>
            </div>
          ))}

          {matches.some((m) => !m.is_finished) && (
            <button className="save-btn" onClick={saveResults} disabled={saving}>
              {saving ? "Guardando y calculando puntos..." : saved ? "✓ Resultados publicados" : "Publicar resultados y recalcular puntos"}
            </button>
          )}

          <p className="group-title" style={{ marginTop: "1.5rem" }}>Partidos finalizados</p>
          {matches.filter((m) => m.is_finished).length === 0 && (
            <p style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>Ningún partido finalizado aún.</p>
          )}
          {matches.filter((m) => m.is_finished).map((match) => (
            <div className="match-card" key={match.id} style={{ opacity: 0.7 }}>
              <div className="match-row">
                <div className="team-name">{match.home_flag} {match.home_team}</div>
                <div className="score-center">
                  <div className="final-score">
                    <span className="score-home">{match.home_score}</span>
                    <span className="score-dash">-</span>
                    <span className="score-away">{match.away_score}</span>
                  </div>
                  <div className="match-date">Finalizado</div>
                </div>
                <div className="team-name right">{match.away_flag} {match.away_team}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
