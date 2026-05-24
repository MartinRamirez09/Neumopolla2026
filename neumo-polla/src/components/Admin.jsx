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
    setLoading(false);
  }

  async function saveResult(matchId, homeScore, awayScore) {
    if (homeScore === undefined || awayScore === undefined || 
        homeScore === "" || awayScore === "") {
      setMessage(prev => ({ 
        ...prev, 
        [matchId]: { text: "⚠️ Ingresa ambos resultados", type: "error" } 
      }));
      setTimeout(() => setMessage(prev => ({ ...prev, [matchId]: null })), 3000);
      return;
    }
    
    setSaving(prev => ({ ...prev, [matchId]: true }));
    
    const hs = parseInt(homeScore);
    const as = parseInt(awayScore);
    
    const { error } = await supabase
      .from("matches")
      .update({ 
        home_score: hs, 
        away_score: as, 
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
    if (!confirm("¿Reabrir partido? Esto borrará el resultado y los puntos.")) return;
    
    setSaving(prev => ({ ...prev, [matchId]: true }));
    
    const { error } = await supabase
      .from("matches")
      .update({ home_score: null, away_score: null, is_finished: false })
      .eq("id", matchId);
    
    if (!error) {
      setMessage(prev => ({ 
        ...prev, 
        [matchId]: { text: "✅ Partido reabierto", type: "success" } 
      }));
      fetchData();
      setTimeout(() => setMessage(prev => ({ ...prev, [matchId]: null })), 3000);
    }
    
    setSaving(prev => ({ ...prev, [matchId]: false }));
  }

  if (loading) return <div className="loading-inline">Cargando...</div>;

  const pendingMatches = matches.filter((m) => !m.is_finished);
  const finishedMatches = matches.filter((m) => m.is_finished);

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
          <div className="stat-num">{finishedMatches.length}</div>
          <div className="stat-lbl">jugados</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{predCount}</div>
          <div className="stat-lbl">predicciones</div>
        </div>
      </div>

      {/* PARTIDOS PENDIENTES */}
      {pendingMatches.length > 0 && (
        <>
          <p className="group-title" style={{ marginTop: "1rem" }}>📝 Cargar resultados</p>
          
          {pendingMatches.map((match) => {
            const [homeScore, setHomeScore] = useState("");
            const [awayScore, setAwayScore] = useState("");
            const isSaving = saving[match.id];
            const msg = message[match.id];
            
            return (
              <div className="admin-match-card" key={match.id}>
                <div className="admin-match-row">
                  <div className="admin-team">
                    <span className="admin-flag">{match.home_flag}</span>
                    <span className="admin-team-name">{match.home_team}</span>
                  </div>
                  <div className="admin-score-area">
                    <input
                      type="number" min="0" max="20" placeholder="0"
                      className="admin-score-input"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      disabled={isSaving}
                    />
                    <span className="admin-dash">-</span>
                    <input
                      type="number" min="0" max="20" placeholder="0"
                      className="admin-score-input"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="admin-team right">
                    <span className="admin-team-name">{match.away_team}</span>
                    <span className="admin-flag">{match.away_flag}</span>
                  </div>
                </div>
                <div className="admin-match-info">
                  📅 {match.match_date ? new Date(match.match_date).toLocaleString("es-CO", { 
                    day: "numeric", 
                    month: "short", 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  }) : "Fecha por definir"}
                </div>
                <button 
                  className="admin-save-btn" 
                  onClick={() => saveResult(match.id, homeScore, awayScore)}
                  disabled={isSaving}
                >
                  {isSaving ? "Guardando..." : "💾 Guardar resultado"}
                </button>
                {msg && (
                  <div className={`admin-match-message ${msg.type}`}>{msg.text}</div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* PARTIDOS FINALIZADOS */}
      {finishedMatches.length > 0 && (
        <>
          <p className="group-title" style={{ marginTop: "1.5rem" }}>✅ Partidos finalizados</p>
          {finishedMatches.map((match) => (
            <div className="admin-match-card finished" key={match.id}>
              <div className="admin-match-row">
                <div className="admin-team">
                  <span className="admin-flag">{match.home_flag}</span>
                  <span className="admin-team-name">{match.home_team}</span>
                </div>
                <div className="admin-result">
                  <span className="admin-home-score">{match.home_score}</span>
                  <span className="admin-dash">-</span>
                  <span className="admin-away-score">{match.away_score}</span>
                </div>
                <div className="admin-team right">
                  <span className="admin-team-name">{match.away_team}</span>
                  <span className="admin-flag">{match.away_flag}</span>
                </div>
              </div>
              <button 
                className="admin-reset-btn" 
                onClick={() => resetMatch(match.id)}
                disabled={saving[match.id]}
              >
                {saving[match.id] ? "Procesando..." : "🔄 Reabrir partido"}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}