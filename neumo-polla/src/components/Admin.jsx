import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./Admin.css";

export default function Admin({ user, onStatsUpdate }) {
  const [matches, setMatches] = useState([]);
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [predCount, setPredCount] = useState(0);
  const [message, setMessage] = useState({});
  
  // Estado para los scores de cada partido
  const [scores, setScores] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: m } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true });
    const { data: p } = await supabase.from("profiles").select("id");
    const { data: pr } = await supabase.from("predictions").select("id");
    
    setMatches(m || []);
    setParticipantCount(p?.length || 0);
    setPredCount(pr?.length || 0);
    
    // Inicializar scores con "0" para cada partido pendiente
    const initialScores = {};
    (m || []).forEach(match => {
      if (!match.is_finished) {
        initialScores[match.id] = { home: "0", away: "0" };
      }
    });
    setScores(initialScores);
    
    setLoading(false);
  }

  function handleScoreChange(matchId, side, value) {
    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: value === "" ? "0" : value
      }
    }));
  }

  async function saveResult(matchId) {
    const homeScore = scores[matchId]?.home;
    const awayScore = scores[matchId]?.away;
    
    if (!homeScore || homeScore === "" || !awayScore || awayScore === "") {
      setMessage(prev => ({ 
        ...prev, 
        [matchId]: { text: "⚠️ Ingresa ambos resultados", type: "error" } 
      }));
      setTimeout(() => setMessage(prev => ({ ...prev, [matchId]: null })), 3000);
      return;
    }
    
    setSaving(prev => ({ ...prev, [matchId]: true }));
    
    const { error } = await supabase
      .from("matches")
      .update({ 
        home_score: parseInt(homeScore), 
        away_score: parseInt(awayScore), 
        is_finished: true 
      })
      .eq("id", matchId);
    
    if (error) {
      setMessage(prev => ({ 
        ...prev, 
        [matchId]: { text: "❌ Error al guardar", type: "error" } 
      }));
    } else {
      setMessage(prev => ({ 
        ...prev, 
        [matchId]: { text: "✅ Resultado guardado. Puntos calculados!", type: "success" } 
      }));
      fetchData();
      if (onStatsUpdate) onStatsUpdate();
      setTimeout(() => setMessage(prev => ({ ...prev, [matchId]: null })), 3000);
    }
    
    setSaving(prev => ({ ...prev, [matchId]: false }));
  }

  async function resetMatch(matchId) {
  if (!confirm("⚠️ ¿REABRIR PARTIDO? Esto borrará el resultado y los PUNTOS de TODOS los usuarios para este partido. Esta acción no se puede deshacer.")) return;
  
  setSaving(prev => ({ ...prev, [matchId]: true }));
  
  // 1. Actualizar el partido (borrar resultado)
  const { error: matchError } = await supabase
    .from("matches")
    .update({ home_score: null, away_score: null, is_finished: false })
    .eq("id", matchId);
  
  if (matchError) {
    setMessage(prev => ({ 
      ...prev, 
      [matchId]: { text: "❌ Error al reabrir partido", type: "error" } 
    }));
    setSaving(prev => ({ ...prev, [matchId]: false }));
    return;
  }
  
  // 2. Borrar los puntos de TODOS los usuarios para este partido
  const { error: pointsError } = await supabase
    .from("predictions")
    .update({ points: 0 })
    .eq("match_id", matchId);
  
  if (pointsError) {
    console.error("Error al borrar puntos:", pointsError);
  }
  
  setMessage(prev => ({ 
    ...prev, 
    [matchId]: { text: "✅ Partido reabierto. Resultado y puntos eliminados.", type: "success" } 
  }));
  
  fetchData();
  if (onStatsUpdate) onStatsUpdate();
  
  setTimeout(() => setMessage(prev => ({ ...prev, [matchId]: null })), 3000);
  setSaving(prev => ({ ...prev, [matchId]: false }));
}

  if (loading) return <div className="admin-loading">Cargando...</div>;

  const pendingMatches = matches.filter((m) => !m.is_finished);
  const finishedMatches = matches.filter((m) => m.is_finished);

  return (
    <div className="admin-container">
      <div className="admin-banner">
        <span>⚙️ Panel de administrador</span>
        <span className="admin-banner-small">Solo visible para admins</span>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-num">{participantCount}</div>
          <div className="admin-stat-lbl">participantes</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{finishedMatches.length}</div>
          <div className="admin-stat-lbl">jugados</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{predCount}</div>
          <div className="admin-stat-lbl">predicciones</div>
        </div>
      </div>
      {/* PARTIDOS PENDIENTES */}
      {pendingMatches.length > 0 && (
        <>
          <h3 className="admin-section-title">📝 Cargar resultados de partidos</h3>
          
          {pendingMatches.map((match) => {
            const isSaving = saving[match.id];
            const msg = message[match.id];
            const currentScore = scores[match.id] || { home: "0", away: "0" };
            
            return (
              <div className="admin-match-card" key={match.id}>
                <div className="admin-match-row">
                  <div className="admin-team">
                    <span className="admin-flag">{match.home_flag}</span>
                    <span className="admin-team-name">{match.home_team}</span>
                  </div>
                  <div className="admin-score-area">
                    <input
                      type="number" min="0" max="20"
                      className="admin-score-input"
                      value={currentScore.home}
                      onChange={(e) => handleScoreChange(match.id, "home", e.target.value)}
                      disabled={isSaving}
                    />
                    <span className="admin-score-dash">-</span>
                    <input
                      type="number" min="0" max="20"
                      className="admin-score-input"
                      value={currentScore.away}
                      onChange={(e) => handleScoreChange(match.id, "away", e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="admin-team right">
                    <span className="admin-team-name">{match.away_team}</span>
                    <span className="admin-flag">{match.away_flag}</span>
                  </div>
                </div>
                
                {/* Información adicional: Fase, Grupo y Estadio */}
                <div className="admin-match-info-additional">
                  <div className="admin-match-phase">
                    <span className="admin-phase-badge">
                      {match.group_name || "Primera fase"}
                    </span>
                    {match.round && (
                      <span className="admin-round-badge">
                        Jornada {match.round}
                      </span>
                    )}
                  </div>
                  <div className="admin-match-stadium">
                    <span>📍 {match.stadium || "Estadio por definir"}</span>
                  </div>
                </div>
                
                <div className="admin-match-date">
                  📅 {new Date(match.match_date).toLocaleString("es-CO", { 
                    day: "numeric", 
                    month: "long", 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  })}
                </div>
                
                <button className="admin-save-btn" onClick={() => saveResult(match.id)} disabled={isSaving}>
                  {isSaving ? "Guardando..." : "💾 Guardar resultado"}
                </button>
                {msg && <div className={`admin-match-message ${msg.type}`}>{msg.text}</div>}
              </div>
            );
          })}
        </>
      )}

      {/* PARTIDOS FINALIZADOS */}
      {finishedMatches.length > 0 && (
        <>
          <h3 className="admin-section-title">✅ Partidos finalizados</h3>
          {finishedMatches.map((match) => (
            <div className="admin-match-card finished" key={match.id}>
              <div className="admin-match-row">
                <div className="admin-team">
                  <span className="admin-flag">{match.home_flag}</span>
                  <span className="admin-team-name">{match.home_team}</span>
                </div>
                <div className="admin-result">
                  <span className="admin-result-home">{match.home_score}</span>
                  <span className="admin-score-dash">-</span>
                  <span className="admin-result-away">{match.away_score}</span>
                </div>
                <div className="admin-team right">
                  <span className="admin-team-name">{match.away_team}</span>
                  <span className="admin-flag">{match.away_flag}</span>
                </div>
              </div>
              <button className="admin-reset-btn" onClick={() => resetMatch(match.id)} disabled={saving[match.id]}>
                {saving[match.id] ? "Procesando..." : "🔄 Reabrir partido"}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}