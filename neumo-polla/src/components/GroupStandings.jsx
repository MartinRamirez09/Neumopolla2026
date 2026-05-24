import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./GroupStandings.css";

export default function GroupStandings({ groupName }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandings();
  }, [groupName]);

  async function fetchStandings() {
    setLoading(true);
    const { data } = await supabase
      .from("group_standings")
      .select("*")
      .eq("group_name", groupName)
      .order("points", { ascending: false })
      .order("goal_difference", { ascending: false })
      .order("goals_for", { ascending: false });

    setStandings(data || []);
    setLoading(false);
  }

  if (loading) return <div className="standings-loading">Cargando...</div>;
  if (standings.length === 0) return <div className="standings-empty">Sin partidos jugados</div>;

  return (
    <div className="standings-container">
      <h3 className="standings-title">📊 {groupName}</h3>
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
          {standings.map((team, idx) => (
            <tr key={team.team}>
              <td>{idx + 1}</td>
              <td className="standings-team">{team.team}</td>
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
  );
}