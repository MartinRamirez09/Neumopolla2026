import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function Ranking({ userId }) {
  const [ranking, setRanking] = useState([]);
  const [stats, setStats] = useState({ total: 0, played: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking();
  }, []);

  async function fetchRanking() {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url");
    const { data: predictions } = await supabase.from("predictions").select("user_id, points");
    const { data: matches } = await supabase.from("matches").select("id, is_finished");

    const totals = {};
    const exactCounts = {};
    (predictions || []).forEach((p) => {
      totals[p.user_id] = (totals[p.user_id] || 0) + (p.points || 0);
      if (p.points === 3) exactCounts[p.user_id] = (exactCounts[p.user_id] || 0) + 1;
    });

    const ranked = (profiles || [])
      .map((p) => ({ ...p, points: totals[p.id] || 0, exact: exactCounts[p.id] || 0 }))
      .sort((a, b) => b.points - a.points || b.exact - a.exact);

    setRanking(ranked);
    setStats({
      total: profiles?.length || 0,
      played: matches?.filter((m) => m.is_finished).length || 0,
      pending: matches?.filter((m) => !m.is_finished).length || 0,
    });
    setLoading(false);
  }

  function getInitials(name) {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  function getMedal(pos) {
    if (pos === 1) return "🥇";
    if (pos === 2) return "🥈";
    if (pos === 3) return "🥉";
    return pos;
  }

  const avatarColors = ["#EAF3DE", "#E6F1FB", "#FAEEDA", "#FBEAF0", "#EEEDFE", "#E1F5EE"];
  const textColors = ["#27500A", "#0C447C", "#412402", "#4B1528", "#26215C", "#085041"];

  if (loading) return <div className="loading-inline">Cargando ranking...</div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{stats.total}</div>
          <div className="stat-lbl">participantes</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.played}</div>
          <div className="stat-lbl">jugados</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{stats.pending}</div>
          <div className="stat-lbl">por jugar</div>
        </div>
      </div>

      <div className="ranking-card">
        <p className="section-label">Tabla de posiciones</p>
        {ranking.length === 0 && <p className="empty-msg">Aún no hay participantes registrados.</p>}
        {ranking.map((person, idx) => {
          const colorIdx = idx % avatarColors.length;
          const isMe = person.id === userId;
          return (
            <div className={`ranking-row ${isMe ? "ranking-row-me" : ""}`} key={person.id}>
              <div className="ranking-pos">{getMedal(idx + 1)}</div>
              <div className="avatar" style={{ background: avatarColors[colorIdx], color: textColors[colorIdx] }}>
                {getInitials(person.full_name)}
              </div>
              <div className="ranking-name">
                {person.full_name || "Colaborador"}
                {isMe && <span className="you-badge">tú</span>}
              </div>
              <div className="ranking-pts-wrap">
                <div className="ranking-pts">{person.points}</div>
                <div className="ranking-pts-lbl">pts</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ranking-card" style={{ marginTop: "12px" }}>
        <p className="section-label">Sistema de puntuación</p>
        <div className="scoring-row"><span>Resultado exacto (ej. 2-1)</span><span className="badge badge-exact">+3 pts</span></div>
        <div className="scoring-row"><span>Ganador/empate correcto</span><span className="badge badge-win">+1 pt</span></div>
        <div className="scoring-row"><span>Predicción incorrecta</span><span className="badge badge-miss">0 pts</span></div>
      </div>
    </div>
  );
}
