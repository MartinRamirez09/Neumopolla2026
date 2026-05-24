import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./Admin.css";

// Lista de países disponibles para seleccionar
const COUNTRIES = [
  "Alemania", "Arabia Saudita", "Argelia", "Argentina", "Australia", "Austria",
  "Bélgica", "Bosnia y Herzegovina", "Brasil", "Cabo Verde", "Canadá", "Chile",
  "Colombia", "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica",
  "Croacia", "Curazao", "Dinamarca", "Ecuador", "Egipto", "Emiratos Árabes Unidos",
  "Escocia", "España", "Estados Unidos", "Francia", "Ghana", "Haití", "Inglaterra",
  "Irak", "Irán", "Italia", "Japón", "Jordania", "Marruecos", "México", "Nigeria",
  "Noruega", "Nueva Zelanda", "Países Bajos", "Panamá", "Paraguay", "Perú",
  "Polonia", "Portugal", "Qatar", "República Checa", "República Democrática del Congo",
  "Senegal", "Serbia", "Sudáfrica", "Suecia", "Suiza", "Túnez", "Turquía",
  "Ucrania", "Uruguay", "Uzbekistán"
].sort();

export default function Admin({ user, onStatsUpdate }) {
  const [matches, setMatches] = useState([]);
  const [saving, setSaving] = useState({});
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [predCount, setPredCount] = useState(0);
  const [message, setMessage] = useState({});
  
  const [realResults, setRealResults] = useState({ first: "", second: "", third: "" });
  const [savingFinal, setSavingFinal] = useState(false);
  const [finalMessage, setFinalMessage] = useState("");
  const [finalLocked, setFinalLocked] = useState(false);

  useEffect(() => {
    fetchData();
    checkFinalResults();
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

  async function checkFinalResults() {
    const { data: anyPoints } = await supabase
      .from("final_positions_predictions")
      .select("points")
      .gt("points", 0)
      .limit(1);
    
    setFinalLocked(anyPoints && anyPoints.length > 0);
  }

  async function saveFinalResults() {
    if (!realResults.first || !realResults.second || !realResults.third) {
      setFinalMessage("⚠️ Selecciona los 3 primeros lugares");
      setTimeout(() => setFinalMessage(""), 3000);
      return;
    }

    if (realResults.first === realResults.second || 
        realResults.first === realResults.third || 
        realResults.second === realResults.third) {
      setFinalMessage("⚠️ Los tres equipos deben ser diferentes");
      setTimeout(() => setFinalMessage(""), 3000);
      return;
    }

    if (!confirm("¿Estás seguro? Esta acción calculará los puntos finales para TODOS los usuarios.")) {
      return;
    }

    setSavingFinal(true);
    setFinalMessage("");

    const { data: predictions } = await supabase
      .from("final_positions_predictions")
      .select("*");

    if (!predictions || predictions.length === 0) {
      setFinalMessage("⚠️ No hay predicciones de usuarios para calcular");
      setSavingFinal(false);
      return;
    }

    let updatedCount = 0;
    for (const pred of predictions) {
      let points = 0;
      if (pred.first_place === realResults.first) points += 20;
      if (pred.second_place === realResults.second) points += 10;
      if (pred.third_place === realResults.third) points += 5;
      
      const { error } = await supabase
        .from("final_positions_predictions")
        .update({ points: points })
        .eq("id", pred.id);
      
      if (!error) updatedCount++;
    }

    setFinalMessage(`✅ Resultados guardados! Se actualizaron ${updatedCount} usuarios.`);
    setFinalLocked(true);
    setSavingFinal(false);
    
    if (onStatsUpdate) onStatsUpdate();
    setTimeout(() => setFinalMessage(""), 5000);
  }

  async function resetFinalResults() {
    if (!confirm("⚠️ ¿Reabrir resultados finales? Esto borrará TODOS los puntos.")) return;

    setSavingFinal(true);
    
    const { error } = await supabase
      .from("final_positions_predictions")
      .update({ points: 0 })
      .neq("points", 0);
    
    if (!error) {
      setFinalMessage("✅ Resultados finales reabiertos.");
      setFinalLocked(false);
      setRealResults({ first: "", second: "", third: "" });
      if (onStatsUpdate) onStatsUpdate();
    } else {
      setFinalMessage("❌ Error al reabrir: " + error.message);
    }
    
    setSavingFinal(false);
    setTimeout(() => setFinalMessage(""), 3000);
  }

  async function saveResult(matchId, homeScore, awayScore) {
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

      {/* SECCIÓN RESULTADOS FINALES */}
      <div className="admin-final-section">
        <div className="admin-final-header">
          <span className="admin-final-icon">🏆</span>
          <h3 className="admin-final-title">Resultados Finales del Mundial</h3>
          <p className="admin-final-desc">
            Carga los resultados reales: 1° = 20 pts | 2° = 10 pts | 3° = 5 pts
          </p>
        </div>

        {finalLocked ? (
          <div className="admin-final-locked">
            <p>✅ Resultados ya cargados</p>
            <button className="admin-reset-btn" onClick={resetFinalResults} disabled={savingFinal}>
              {savingFinal ? "Procesando..." : "🔄 Reabrir"}
            </button>
          </div>
        ) : (
          <div className="admin-final-form">
            <div className="admin-final-select-group">
              <label className="admin-final-label gold">🥇 1er Lugar (20 pts)</label>
              <select
                value={realResults.first}
                onChange={(e) => setRealResults(prev => ({ ...prev, first: e.target.value }))}
                className="admin-final-select"
              >
                <option value="">Selecciona</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className="admin-final-select-group">
              <label className="admin-final-label silver">🥈 2do Lugar (10 pts)</label>
              <select
                value={realResults.second}
                onChange={(e) => setRealResults(prev => ({ ...prev, second: e.target.value }))}
                className="admin-final-select"
              >
                <option value="">Selecciona</option>
                {COUNTRIES.filter(c => c !== realResults.first).map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className="admin-final-select-group">
              <label className="admin-final-label bronze">🥉 3er Lugar (5 pts)</label>
              <select
                value={realResults.third}
                onChange={(e) => setRealResults(prev => ({ ...prev, third: e.target.value }))}
                className="admin-final-select"
              >
                <option value="">Selecciona</option>
                {COUNTRIES.filter(c => c !== realResults.first && c !== realResults.second).map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <button className="admin-final-btn" onClick={saveFinalResults} disabled={savingFinal}>
              {savingFinal ? "Calculando..." : "🏆 Cargar resultados finales"}
            </button>
          </div>
        )}
        {finalMessage && (
          <div className={`admin-final-message ${finalMessage.includes("✅") ? "success" : "error"}`}>
            {finalMessage}
          </div>
        )}
      </div>

      {/* PARTIDOS PENDIENTES */}
      {pendingMatches.length > 0 && (
        <>
          <h3 className="admin-section-title">📝 Cargar resultados de partidos</h3>
          
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
                      type="number" min="0" max="20"
                      className="admin-score-input"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      disabled={isSaving}
                    />
                    <span className="admin-score-dash">-</span>
                    <input
                      type="number" min="0" max="20"
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
                <div className="admin-match-date">
                  📅 {new Date(match.match_date).toLocaleString("es-CO", { 
                    day: "numeric", 
                    month: "short", 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  })}
                </div>
                <button className="admin-save-btn" onClick={() => saveResult(match.id, homeScore, awayScore)} disabled={isSaving}>
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