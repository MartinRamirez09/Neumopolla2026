import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Predictions({ userId }) {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [myStats, setMyStats] = useState({ points: 0, exact: 0, position: "-" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  async function fetchData() {
    setLoading(true);
    const { data: matchData } = await supabase.from("matches").select("*").order("match_date");
    const { data: predData } = await supabase.from("predictions").select("*").eq("user_id", userId);

    setMatches(matchData || []);

    const predMap = {};
    let totalPoints = 0;
    let exactCount = 0;
    (predData || []).forEach((p) => {
      predMap[p.match_id] = p;
      totalPoints += p.points || 0;
      if (p.points === 3) exactCount++;
    });
    setPredictions(predMap);

    // Obtener posición desde la vista leaderboard
    const { data: leaderboard } = await supabase
      .from("leaderboard")
      .select("user_id, rank")
      .order("total_points", { ascending: false });
    
    const userRank = leaderboard?.findIndex((l) => l.user_id === userId) ?? -1;
    const position = userRank >= 0 ? userRank + 1 : "-";

    setMyStats({ points: totalPoints, exact: exactCount, position });
    setLoading(false);
  }

  function handleScore(matchId, side, value) {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], match_id: matchId, [side]: value === "" ? "" : parseInt(value) },
    }));
  }

  async function savePredictions() {
    setSaving(true);
    const toUpsert = Object.values(predictions)
      .filter((p) => p.home_score !== undefined && p.away_score !== undefined && p.home_score !== "" && p.away_score !== "")
      .map((p) => ({
        user_id: userId,
        match_id: p.match_id,
        home_score: parseInt(p.home_score),
        away_score: parseInt(p.away_score),
        points: p.points || 0,
      }));
    
    await supabase.from("predictions").upsert(toUpsert, { onConflict: "user_id,match_id" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    fetchData();
  }

  function isMatchLocked(matchDate) {
    // Bloquear 1 hora antes del partido
    const now = new Date();
    const matchTime = new Date(matchDate);
    const oneHourBefore = new Date(matchTime.getTime() - 60 * 60 * 1000);
    return now >= oneHourBefore;
  }

  function getResultLabel(pred, match) {
    if (!match.is_finished) return null;
    if (pred?.points === 3) return { label: "Exacto +3pts", cls: "badge-exact" };
    if (pred?.points === 2) return { label: "Diferencia exacta +2pts", cls: "badge-exact" };
    if (pred?.points === 1) return { label: "Ganador +1pt", cls: "badge-win" };
    if (pred) return { label: "Fallaste 0pts", cls: "badge-miss" };
    return { label: "Sin predicción", cls: "badge-miss" };
  }

  const groups = [...new Set((matches || []).map((m) => m.group_name))];

  if (loading) return <div className="loading-inline">Cargando partidos...</div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{myStats.points}</div>
          <div className="stat-lbl">mis puntos</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{myStats.exact}</div>
          <div className="stat-lbl">exactos</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{myStats.position === "-" ? "-" : `${myStats.position}°`}</div>
          <div className="stat-lbl">posición</div>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group}>
          <p className="group-title">{group}</p>
          {matches.filter((m) => m.group_name === group).map((match) => {
            const pred = predictions[match.id];
            const result = getResultLabel(pred, match);
            const isFinished = match.is_finished;
            const isLocked = !isFinished && isMatchLocked(match.match_date);
            const showLockWarning = isLocked && !pred;
            
            return (
              <div className="match-card" key={match.id}>
                <div className="match-row">
                  <div className="team-name">{match.home_flag} {match.home_team}</div>
                  <div className="score-center">
                    {isFinished ? (
                      <div className="final-score">
                        <span className="score-home">{match.home_score}</span>
                        <span className="score-dash">-</span>
                        <span className="score-away">{match.away_score}</span>
                      </div>
                    ) : (
                      <div className="score-inputs">
                        <input
                          type="number" min="0" max="20"
                          value={pred?.home_score ?? ""}
                          placeholder="0"
                          onChange={(e) => handleScore(match.id, "home_score", e.target.value)}
                          disabled={isLocked}
                          style={isLocked ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                        />
                        <span className="dash">-</span>
                        <input
                          type="number" min="0" max="20"
                          value={pred?.away_score ?? ""}
                          placeholder="0"
                          onChange={(e) => handleScore(match.id, "away_score", e.target.value)}
                          disabled={isLocked}
                          style={isLocked ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                        />
                      </div>
                    )}
                    <div className="match-date">
                      {match.match_date ? new Date(match.match_date).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Por definir"}
                    </div>
                  </div>
                  <div className="team-name right">{match.away_flag} {match.away_team}</div>
                </div>
                {showLockWarning && (
                  <div className="match-result-row" style={{ justifyContent: "center" }}>
                    <span className="badge badge-miss" style={{ background: "#fde8e8", color: "#c0392b" }}>
                      ⚠️ Partido bloqueado - ya no se puede pronosticar
                    </span>
                  </div>
                )}
                {result && (
                  <div className="match-result-row">
                    <span className="pred-label">
                      Tu predicción: {pred ? `${pred.home_score}-${pred.away_score}` : "Sin predicción"}
                    </span>
                    <span className={`badge ${result.cls}`}>{result.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {matches.some((m) => !m.is_finished && !isMatchLocked(m.match_date)) && (
        <button className="save-btn" onClick={savePredictions} disabled={saving}>
          {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar predicciones"}
        </button>
      )}
    </div>
  );
}

// Función auxiliar para verificar si un partido está bloqueado
function isMatchLocked(matchDate) {
  const now = new Date();
  const matchTime = new Date(matchDate);
  const oneHourBefore = new Date(matchTime.getTime() - 60 * 60 * 1000);
  return now >= oneHourBefore;
}