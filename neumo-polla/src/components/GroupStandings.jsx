import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./GroupStandings.css";

const GROUPS = [
  "Grupo A", "Grupo B", "Grupo C", "Grupo D",
  "Grupo E", "Grupo F", "Grupo G", "Grupo H",
  "Grupo I", "Grupo J", "Grupo K", "Grupo L"
];

const TEAM_FLAGS = {
  "México": "🇲🇽", "Sudáfrica": "🇿🇦", "Corea del Sur": "🇰🇷", "República Checa": "🇨🇿",
  "Canadá": "🇨🇦", "Bosnia y Herzegovina": "🇧🇦", "Estados Unidos": "🇺🇸", "Paraguay": "🇵🇾",
  "Haití": "🇭🇹", "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Brasil": "🇧🇷", "Marruecos": "🇲🇦",
  "Australia": "🇦🇺", "Turquía": "🇹🇷", "Qatar": "🇶🇦", "Suiza": "🇨🇭",
  "Costa de Marfil": "🇨🇮", "Ecuador": "🇪🇨", "Alemania": "🇩🇪", "Curazao": "🇨🇼",
  "Países Bajos": "🇳🇱", "Japón": "🇯🇵", "Suecia": "🇸🇪", "Túnez": "🇹🇳",
  "Arabia Saudita": "🇸🇦", "Uruguay": "🇺🇾", "Irán": "🇮🇷", "Nueva Zelanda": "🇳🇿",
  "España": "🇪🇸", "Cabo Verde": "🇨🇻", "Bélgica": "🇧🇪", "Egipto": "🇪🇬",
  "Francia": "🇫🇷", "Senegal": "🇸🇳", "Irak": "🇮🇶", "Noruega": "🇳🇴",
  "Argentina": "🇦🇷", "Argelia": "🇩🇿", "Austria": "🇦🇹", "Jordania": "🇯🇴",
  "Portugal": "🇵🇹", "RD Congo": "🇨🇩", "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croacia": "🇭🇷",
  "Ghana": "🇬🇭", "Panamá": "🇵🇦", "Uzbekistán": "🇺🇿", "Colombia": "🇨🇴"
};

export default function GroupStandings() {
  const [standings, setStandings] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("Grupo A");

  useEffect(() => {
    fetchStandings();
  }, []);

  async function fetchStandings() {
    setLoading(true);
    const { data } = await supabase
      .from("group_standings")
      .select("*")
      .order("points", { ascending: false })
      .order("goal_difference", { ascending: false })
      .order("goals_for", { ascending: false });

    const grouped = {};
    GROUPS.forEach(g => { grouped[g] = []; });
    (data || []).forEach(team => {
      if (grouped[team.group_name]) grouped[team.group_name].push(team);
    });
    setStandings(grouped);
    setLoading(false);
  }

  if (loading) return <div className="loading-inline">⚽ Cargando posiciones...</div>;

  return (
    <div className="groups-container">
      {/* Selector de grupos (solo móvil) */}
      <div className="groups-mobile-nav">
        {GROUPS.map(group => (
          <button key={group} className={`group-nav-btn ${selectedGroup === group ? "active" : ""}`} onClick={() => setSelectedGroup(group)}>
            {group}
          </button>
        ))}
      </div>

      {/* Grid de grupos (desktop) */}
      <div className="groups-grid">
        {GROUPS.map(group => (
          <GroupCard key={group} groupName={group} teams={standings[group] || []} />
        ))}
      </div>

      {/* Vista móvil: solo grupo seleccionado */}
      <div className="groups-mobile-view">
        <GroupCard groupName={selectedGroup} teams={standings[selectedGroup] || []} />
      </div>
    </div>
  );
}

function GroupCard({ groupName, teams }) {
  return (
    <div className="group-card">
      <div className="group-card-header">
        <span className="group-icon">📊</span>
        <h3 className="group-name">{groupName}</h3>
      </div>
      
      {teams.length === 0 ? (
        <div className="group-empty">Sin datos de equipos</div>
      ) : (
        <div className="group-teams-list">
          {teams.map((team, idx) => (
            <div key={team.team} className="group-team-row">
              <div className="team-rank">{idx + 1}</div>
              <div className="team-info">
                <span className="team-flag">{TEAM_FLAGS[team.team] || "⚽"}</span>
                <span className="team-name">{team.team}</span>
              </div>
              <div className="team-stats">
                <div className="stat-item">
                  <span className="stat-value">{team.played}</span>
                  <span className="stat-label">PJ</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{team.wins}</span>
                  <span className="stat-label">G</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{team.draws}</span>
                  <span className="stat-label">E</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{team.losses}</span>
                  <span className="stat-label">P</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{team.goals_for}</span>
                  <span className="stat-label">GF</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{team.goals_against}</span>
                  <span className="stat-label">GC</span>
                </div>
                <div className="stat-item diff">
                  <span className={`stat-value ${team.goal_difference >= 0 ? "positive" : "negative"}`}>
                    {team.goal_difference >= 0 ? `+${team.goal_difference}` : team.goal_difference}
                  </span>
                  <span className="stat-label">DG</span>
                </div>
                <div className="stat-item points">
                  <span className="stat-value points-value">{team.points}</span>
                  <span className="stat-label">Pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}