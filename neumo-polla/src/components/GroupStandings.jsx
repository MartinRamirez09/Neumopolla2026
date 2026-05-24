import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./GroupStandings.css";

// Lista de grupos en orden
const GROUPS = [
  "Grupo A", "Grupo B", "Grupo C", "Grupo D",
  "Grupo E", "Grupo F", "Grupo G", "Grupo H",
  "Grupo I", "Grupo J", "Grupo K", "Grupo L"
];

// Mapa completo de banderas para TODOS los equipos
const TEAM_FLAGS = {
  // Grupo A
  "México": "🇲🇽", "Sudáfrica": "🇿🇦", "Corea del Sur": "🇰🇷", "República Checa": "🇨🇿",
  // Grupo B
  "Canadá": "🇨🇦", "Bosnia y Herzegovina": "🇧🇦", "Estados Unidos": "🇺🇸", "Paraguay": "🇵🇾",
  // Grupo C
  "Haití": "🇭🇹", "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Brasil": "🇧🇷", "Marruecos": "🇲🇦",
  // Grupo D
  "Australia": "🇦🇺", "Turquía": "🇹🇷", "Qatar": "🇶🇦", "Suiza": "🇨🇭",
  // Grupo E
  "Costa de Marfil": "🇨🇮", "Ecuador": "🇪🇨", "Alemania": "🇩🇪", "Curazao": "🇨🇼",
  // Grupo F
  "Países Bajos": "🇳🇱", "Japón": "🇯🇵", "Suecia": "🇸🇪", "Túnez": "🇹🇳",
  // Grupo G
  "Arabia Saudita": "🇸🇦", "Uruguay": "🇺🇾", "Irán": "🇮🇷", "Nueva Zelanda": "🇳🇿",
  // Grupo H
  "España": "🇪🇸", "Cabo Verde": "🇨🇻", "Bélgica": "🇧🇪", "Egipto": "🇪🇬",
  // Grupo I
  "Francia": "🇫🇷", "Senegal": "🇸🇳", "Irak": "🇮🇶", "Noruega": "🇳🇴",
  // Grupo J
  "Argentina": "🇦🇷", "Argelia": "🇩🇿", "Austria": "🇦🇹", "Jordania": "🇯🇴",
  // Grupo K
  "Portugal": "🇵🇹", "RD Congo": "🇨🇩", "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croacia": "🇭🇷",
  // Grupo L
  "Ghana": "🇬🇭", "Panamá": "🇵🇦", "Uzbekistán": "🇺🇿", "Colombia": "🇨🇴"
};

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
    GROUPS.forEach(group => { grouped[group] = []; });
    
    (data || []).forEach(team => {
      if (grouped[team.group_name]) {
        grouped[team.group_name].push(team);
      }
    });
    
    setStandings(grouped);
    setLoading(false);
  }

  if (loading) return <div className="standings-loading">📊 Cargando posiciones...</div>;

  return (
    <div className="standings-page">
      {/* Selector de grupos para móvil */}
      <div className="standings-group-selector">
        {GROUPS.map(group => (
          <button
            key={group}
            className={`standings-group-tab ${selectedGroup === group ? "active" : ""}`}
            onClick={() => setSelectedGroup(group)}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Vista desktop: todos los grupos en grid */}
      <div className="standings-desktop">
        {GROUPS.map(group => (
          <GroupTable key={group} groupName={group} teams={standings[group] || []} />
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
  return (
    <div className="standings-card">
      <h3 className="standings-card-title">📊 {groupName}</h3>
      <div className="standings-table-container">
        <table className="standings-table">
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-team">Equipo</th>
              <th className="col-num">PJ</th>
              <th className="col-num">G</th>
              <th className="col-num">E</th>
              <th className="col-num">P</th>
              <th className="col-num">GF</th>
              <th className="col-num">GC</th>
              <th className="col-num">DG</th>
              <th className="col-num">Pts</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan="10" className="standings-empty-row">
                  Sin datos de equipos
                </td>
              </tr>
            ) : (
              teams.map((team, idx) => (
                <tr key={team.team}>
                  <td className="col-rank">{idx + 1}</td>
                  <td className="col-team">
                    <span className="team-flag">{TEAM_FLAGS[team.team] || "⚽"}</span>
                    <span className="team-name">{team.team}</span>
                  </td>
                  <td className="col-num">{team.played}</td>
                  <td className="col-num">{team.wins}</td>
                  <td className="col-num">{team.draws}</td>
                  <td className="col-num">{team.losses}</td>
                  <td className="col-num">{team.goals_for}</td>
                  <td className="col-num">{team.goals_against}</td>
                  <td className={`col-num ${team.goal_difference >= 0 ? "positive" : "negative"}`}>
                    {team.goal_difference >= 0 ? `+${team.goal_difference}` : team.goal_difference}
                  </td>
                  <td className="col-num points">{team.points}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}