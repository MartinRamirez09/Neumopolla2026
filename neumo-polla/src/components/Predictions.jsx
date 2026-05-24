import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./Predictions.css";

export default function Predictions({ userId }) {
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [saving, setSaving] = useState({});
  const [myStats, setMyStats] = useState({ points: 0, exact: 0, position: "-" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({});

  useEffect(() => {
    fetchData();
  }, [userId]);

  async function fetchData() {
    setLoading(true);
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true });

    const { data: predData } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", userId);

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
      [matchId]: { 
        ...prev[matchId], 
        match_id: matchId, 
        [side]: value === "" ? "" : parseInt(value) 
      },
    }));
    if (message[matchId]) {
      setMessage(prev => ({ ...prev, [matchId]: null }));
    }
  }

  async function savePrediction(matchId, homeScore, awayScore) {
    if (homeScore === undefined || homeScore === "" || awayScore === undefined || awayScore === "") {
      setMessage(prev => ({ 
        ...prev, 
        [matchId]: { text: "⚠️ Ingresa ambos resultados", type: "error" } 
      }));
      setTimeout(() => setMessage(prev => ({ ...prev, [matchId]: null })), 3000);
      return;
    }

    setSaving(prev => ({ ...prev, [matchId]: true }));

    const { error } = await supabase
      .from("predictions")
      .upsert({
        user_id: userId,
        match_id: matchId,
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore),
      }, { onConflict: "user_id,match_id" });

    if (error) {
      setMessage(prev => ({ 
        ...prev, 
        [matchId]: { text: "❌ Error al guardar", type: "error" } 
      }));
    } else {
      setMessage(prev => ({ 
        ...prev, 
        [matchId]: { text: "✅ Pronóstico guardado", type: "success" } 
      }));
      await fetchData();
      setTimeout(() => setMessage(prev => ({ ...prev, [matchId]: null })), 2000);
    }

    setSaving(prev => ({ ...prev, [matchId]: false }));
  }

  function isMatchLocked(matchDate) {
    const now = new Date();
    const matchTime = new Date(matchDate);
    const oneHourBefore = new Date(matchTime.getTime() - 60 * 60 * 1000);
    return now >= oneHourBefore;
  }

  function getResultLabel(pred, match) {
    if (!match.is_finished) return null;
    if (pred?.points === 3) return { label: "Exacto +3pts", cls: "badge-new badge-exact" };
    if (pred?.points === 2) return { label: "Diferencia exacta +2pts", cls: "badge-new badge-exact" };
    if (pred?.points === 1) return { label: "Ganador +1pt", cls: "badge-new badge-win" };
    if (pred) return { label: "Fallaste 0pts", cls: "badge-new badge-miss" };
    return { label: "Sin predicción", cls: "badge-new badge-miss" };
  }

  const groupedByDate = matches.reduce((acc, match) => {
    if (!match.match_date) return acc;
    const date = new Date(match.match_date);
    const dateKey = date.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {});

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

      {Object.entries(groupedByDate).map(([date, dateMatches]) => (
        <div key={date}>
          <h2 className="date-header">📅 {date.charAt(0).toUpperCase() + date.slice(1)}</h2>
          
          {dateMatches.map((match) => {
            const pred = predictions[match.id];
            const result = getResultLabel(pred, match);
            const isFinished = match.is_finished;
            const isLocked = !isFinished && isMatchLocked(match.match_date);
            const matchHour = new Date(match.match_date).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
            const isSaving = saving[match.id];
            const msg = message[match.id];
            const hasPrediction = pred?.home_score !== undefined && pred?.home_score !== "";
            
            return (
              <div className="match-card-final" key={match.id}>
                <div className="team-home-final">
                  <div className="team-flag-final">{match.home_flag}</div>
                  <div className="team-name-final">{match.home_team}</div>
                </div>

                <div className="vs-container-final">
                  {isFinished ? (
                    <div className="result-final">
                      <span>{match.home_score}</span>
                      <span className="vs-text-final">VS</span>
                      <span>{match.away_score}</span>
                    </div>
                  ) : (
                    <div className="prediction-final">
                      <input
                        type="number" min="0" max="20"
                        value={pred?.home_score ?? ""}
                        placeholder="0"
                        onChange={(e) => handleScore(match.id, "home_score", e.target.value)}
                        disabled={isLocked}
                      />
                      <span className="vs-final">VS</span>
                      <input
                        type="number" min="0" max="20"
                        value={pred?.away_score ?? ""}
                        placeholder="0"
                        onChange={(e) => handleScore(match.id, "away_score", e.target.value)}
                        disabled={isLocked}
                      />
                    </div>
                  )}
                  <div className="hour-final">{matchHour}</div>
                </div>

                <div className="team-away-final">
                  <div className="team-flag-final">{match.away_flag}</div>
                  <div className="team-name-final">{match.away_team}</div>
                </div>

                {!isFinished && !isLocked && (
                  <button 
                    className="predict-save-btn"
                    onClick={() => savePrediction(match.id, pred?.home_score, pred?.away_score)}
                    disabled={isSaving || (!pred?.home_score && !pred?.away_score)}
                  >
                    {isSaving ? "Guardando..." : hasPrediction ? "✏️ Actualizar" : "💾 Guardar"}
                  </button>
                )}

                {isLocked && !pred && (
                  <div className="lock-final">⚠️ Partido bloqueado - ya no se puede pronosticar</div>
                )}

                {msg && (
                  <div className={`predict-message ${msg.type}`}>{msg.text}</div>
                )}

                <div className="match-footer-final">
                  <span className="stage-final">{match.group_name || "Primera fase"}</span>
                  <span className="stadium-final">📍 {match.stadium || "Estadio"}</span>
                </div>

                {result && (
                  <div className="prediction-result-final">
                    <span>Tu predicción: {pred ? `${pred.home_score} - ${pred.away_score}` : "Sin predicción"}</span>
                    <span className={result.cls}>{result.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}