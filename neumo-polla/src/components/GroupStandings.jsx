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

  if (loading) return <div className="loading-inline">📊 Cargando posiciones...</div>;

  return (
    <div className="groups-wrapper">
      {/* Selector móvil */}
      <div className="groups-mobile-tabs">
        {GROUPS.map(group => (
          <button key={group} className={`group-tab ${selectedGroup === group ? "active" : ""}`} onClick={() => setSelectedGroup(group)}>
            {group}
          </button>
        ))}
      </div>

      {/* Desktop: todos los grupos */}
      <div className="groups-desktop">
        {GROUPS.map(group => (
          <GroupStandingsTable key={group} groupName={group} teams={standings[group] || []} />
        ))}
      </div>

      {/* Mobile: solo grupo seleccionado */}
      <div className="groups-mobile">
        <GroupStandingsTable groupName={selectedGroup} teams={standings[selectedGroup] || []} />
      </div>
    </div>
  );
}

function GroupStandingsTable({ groupName, teams }) {
  return (
    <div className="group-standings-card">
      <div className="group-standings-header">
        <span className="group-standings-icon">📊</span>
        <h3 className="group-standings-title">{groupName}</h3>
      </div>
      
      {teams.length === 0 ? (
        <div className="group-standings-empty">Sin equipos registrados</div>
      ) : (
        <table className="group-standings-table">
          <thead>
            <tr>
              <th className="col-pos">#</th>
              <th className="col-team">Equipo</th>
              <th className="col-stat">PJ</th>
              <th className="col-stat">G</th>
              <th className="col-stat">E</th>
              <th className="col-stat">P</th>
              <th className="col-stat">GF</th>
              <th className="col-stat">GC</th>
              <th className="col-stat">DG</th>
              <th className="col-stat">Pts</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => (
              <tr key={team.team}>
                <td className="col-pos">{idx + 1}</td>
                <td className="col-team">
                  <span className="team-flag-cell">{TEAM_FLAGS[team.team] || "⚽"}</span>
                  <span className="team-name-cell">{team.team}</span>
                </td>
                <td className="col-stat">{team.played}</td>
                <td className="col-stat">{team.wins}</td>
                <td className="col-stat">{team.draws}</td>
                <td className="col-stat">{team.losses}</td>
                <td className="col-stat">{team.goals_for}</td>
                <td className="col-stat">{team.goals_against}</td>
                <td className={`col-stat ${team.goal_difference >= 0 ? "dg-positive" : "dg-negative"}`}>
                  {team.goal_difference >= 0 ? `+${team.goal_difference}` : team.goal_difference}
                </td>
                <td className="col-stat pts">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}