import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./GroupStandings.css";

// Lista de grupos en orden
const GROUPS = [
  "Grupo A", "Grupo B", "Grupo C", "Grupo D",
  "Grupo E", "Grupo F", "Grupo G", "Grupo H",
  "Grupo I", "Grupo J", "Grupo K", "Grupo L"
];

export default function GroupStandings() {
  const [standings, setStandings] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("Grupo A");

  useEffect(() => {
    fetchAllStandings();
  }, []);

  async function fetchAllStandings() {
    setLoading(true);
    const { data } = await supabase
      .from("group_standings")
      .select("*")
      .order("points", { ascending: false })
      .order("goal_difference", { ascending: false })
      .order("goals_for", { ascending: false });

    // Agrupar por grupo
    const grouped = {};
    (data || []).forEach(team => {
      if (!grouped[team.group_name]) grouped[team.group_name] = [];
      grouped[team.group_name].push(team);
    });
    
    setStandings(grouped);
    setLoading(false);
  }

  if (loading) return <div className="standings-loading">Cargando posiciones...</div>;

  return (
    <div className="standings-page">
      {/* Selector de grupo para móvil */}
      <div className="standings-group-selector">
        {GROUPS.map(group => (
          <button
            key={group}
            className={`group-tab ${selectedGroup === group ? "active" : ""}`}
            onClick={() => setSelectedGroup(group)}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Vista desktop: todos los grupos */}
      <div className="standings-desktop">
        {GROUPS.map(group => (
          <div key={group} className="standings-group">
            <GroupTable groupName={group} teams={standings[group] || []} />
          </div>
        ))}
      </div>

      {/* Vista móvil: solo grupo seleccionado */}
      <div className="standings-mobile">
        <GroupTable groupName={selectedGroup} teams={standings[selectedGroup] || []} />
      </div>
    </div>
  );
}

function GroupTable({ groupName, teams }) {
  if (teams.length === 0) {
    return (
      <div className="standings-container">
        <h3 className="standings-title">📊 {groupName}</h3>
        <div className="standings-empty">Sin partidos jugados aún</div>
      </div>
    );
  }

  return (
    <div className="standings-container">
      <h3 className="standings-title">📊 {groupName}</h3>
      <div className="standings-table-wrapper">
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Equipo</th>
              <th>PJ</th>
              <th>G</th>
              <th>E</th>
              <th>P</th>
              <th>GF</th>
              <th>GC</th>
              <th>DG</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => (
              <tr key={team.team}>
                <td>{idx + 1}</td>
                <td className="standings-team-cell">
                  <span className="standings-team-flag">{getFlagForTeam(team.team)}</span>
                  <span>{team.team}</span>
                </td>
                <td>{team.played}</td>
                <td>{team.wins}</td>
                <td>{team.draws}</td>
                <td>{team.losses}</td>
                <td>{team.goals_for}</td>
                <td>{team.goals_against}</td>
                <td className={team.goal_difference >= 0 ? "positive" : "negative"}>
                  {team.goal_difference >= 0 ? `+${team.goal_difference}` : team.goal_difference}
                </td>
                <td className="standings-points">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Función auxiliar para obtener banderas (puedes expandirla)
function getFlagForTeam(team) {
  const flags = {
    "Argentina": "🇦🇷", "Brasil": "🇧🇷", "Uruguay": "🇺🇾", "Colombia": "🇨🇴",
    "México": "🇲🇽", "Estados Unidos": "🇺🇸", "Canadá": "🇨🇦", "Costa Rica": "🇨🇷",
    "España": "🇪🇸", "Francia": "🇫🇷", "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Alemania": "🇩🇪",
    "Italia": "🇮🇹", "Países Bajos": "🇳🇱", "Portugal": "🇵🇹", "Bélgica": "🇧🇪",
    "Croacia": "🇭🇷", "Suecia": "🇸🇪", "Dinamarca": "🇩🇰", "Suiza": "🇨🇭",
    "Corea del Sur": "🇰🇷", "Japón": "🇯🇵", "Australia": "🇦🇺", "Arabia Saudita": "🇸🇦",
    "Senegal": "🇸🇳", "Marruecos": "🇲🇦", "Túnez": "🇹🇳", "Egipto": "🇪🇬",
    "Sudáfrica": "🇿🇦", "Ghana": "🇬🇭", "Nigeria": "🇳🇬", "Camerún": "🇨🇲"
  };
  return flags[team] || "🏆";
}