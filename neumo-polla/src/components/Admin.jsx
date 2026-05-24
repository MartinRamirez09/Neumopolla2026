import "./Admin.css";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Admin({ user, onStatsUpdate }) {
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [predCount, setPredCount] = useState(0);
  const [message, setMessage] = useState({ text: "", type: "" });

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

  function handleResult(matchId, side, value) {
    setResults((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: value === "" ? "" : parseInt(value) },
    }));
  }

  async function saveResults() {
    setSaving(true);
    setMessage({ text: "", type: "" });
    
    let successCount = 0;
    let errorCount = 0;

    for (const [matchId, result] of Object.entries(results)) {
      if (result.home_score === undefined || result.away_score === undefined || 
          result.home_score === "" || result.away_score === "") continue;
      
      const hs = parseInt(result.home_score);
      const as = parseInt(result.away_score);
      
      const { error } = await supabase
        .from("matches")
        .update({ 
          home_score: hs, 
          away_score: as, 
          is_finished: true 
        })
        .eq("id", matchId);
      
      if (error) {
        console.error("Error:", error);
        errorCount++;
      } else {
        successCount++;
      }
    }

    if (successCount > 0) {
      setMessage({ 
        text: `✅ ${successCount} resultado(s) guardado. Puntos calculados automáticamente.`, 
        type: "success" 
      });
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
    
    if (errorCount > 0) {
      setMessage({ 
        text: `❌ Error en ${errorCount} partido(s). Revisa la consola.`, 
        type: "error" 
      });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setResults({});
    fetchData();
    if (onStatsUpdate) onStatsUpdate();
  }

  async function resetMatch(matchId) {
    if (!confirm("¿Reabrir partido? Esto borrará el resultado y los puntos.")) return;
    
    const { error } = await supabase
      .from("matches")
      .update({ home_score: null, away_score: null, is_finished: false })
      .eq("id", matchId);
    
    if (!error) {
      setMessage({ text: "✅ Partido reabierto.", type: "success" });
      fetchData();
    }
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

      {message.text && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {pendingMatches.length > 0 && (
        <>
          <p className="group-title" style={{ marginTop: "1rem" }}>📝 Cargar resultados reales</p>
          
          {pendingMatches.map((match) => (
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
                    value={results[match.id]?.home_score ?? ""}
                    onChange={(e) => handleResult(match.id, "home_score", e.target.value)}
                  />
                  <span className="admin-dash">-</span>
                  <input
                    type="number" min="0" max="20" placeholder="0"
                    className="admin-score-input"
                    value={results[match.id]?.away_score ?? ""}
                    onChange={(e) => handleResult(match.id, "away_score", e.target.value)}
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
            </div>
          ))}

          <button className="save-btn-final" onClick={saveResults} disabled={saving}>
            {saving ? "Guardando y calculando puntos..." : saved ? "✓ Publicado" : "📢 Publicar resultados"}
          </button>
        </>
      )}

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
              <button className="admin-reset-btn" onClick={() => resetMatch(match.id)}>
                🔄 Reabrir partido
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}