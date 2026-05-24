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

  if (loading) return <div className="loading-inline">Cargando posiciones...</div>;

  return (
    <div>
      {/* Selector móvil */}
      <div className="group-selector-mobile">
        {GROUPS.map(group => (
          <button key={group} className={`group-btn ${selectedGroup === group ? "active" : ""}`} onClick={() => setSelectedGroup(group)}>
            {group}
          </button>
        ))}
      </div>

      {/* Vista desktop: grid */}
      <div className="groups-grid">
        {GROUPS.map(group => (
          <GroupTable key={group} groupName={group} teams={standings[group] || []} />
        ))}
      </div>

      {/* Vista móvil: solo uno */}
      <div className="group-mobile-view">
        <GroupTable groupName={selectedGroup} teams={standings[selectedGroup] || []} />
      </div>
    </div>
  );
}

function GroupTable({ groupName, teams }) {
  return (
    <div className="group-card">
      <h3 className="group-title">📊 {groupName}</h3>
      <div className="table-wrapper">
        <table className="group-table">
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
                <td className="team-cell">
                  <span className="team-flag">{TEAM_FLAGS[team.team] || "⚽"}</span>
                  <span className="team-name">{team.team}</span>
                </td>
                <td>{team.played}</td>
                <td>{team.wins}</td>
                <td>{team.draws}</td>
                <td>{team.losses}</td>
                <td>{team.goals_for}</td>
                <td>{team.goals_against}</td>
                <td className={team.goal_difference >= 0 ? "dg-positive" : "dg-negative"}>
                  {team.goal_difference >= 0 ? `+${team.goal_difference}` : team.goal_difference}
                </td>
                <td className="pts">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}