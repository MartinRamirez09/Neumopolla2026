import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

// =====================================================
// FIXTURE COMPLETO MUNDIAL 2026 (Hora Colombia)
// =====================================================
const FULL_FIXTURE = [
  // GRUPO A
  { home_team: "México", away_team: "Alemania", home_flag: "🇲🇽", away_flag: "🇩🇪", group_name: "Grupo A", match_date: "2026-06-11 11:00:00-05", round: 1 },
  { home_team: "Corea del Sur", away_team: "Camerún", home_flag: "🇰🇷", away_flag: "🇨🇲", group_name: "Grupo A", match_date: "2026-06-11 14:00:00-05", round: 1 },
  { home_team: "Alemania", away_team: "Corea del Sur", home_flag: "🇩🇪", away_flag: "🇰🇷", group_name: "Grupo A", match_date: "2026-06-17 11:00:00-05", round: 2 },
  { home_team: "Camerún", away_team: "México", home_flag: "🇨🇲", away_flag: "🇲🇽", group_name: "Grupo A", match_date: "2026-06-17 14:00:00-05", round: 2 },
  { home_team: "México", away_team: "Corea del Sur", home_flag: "🇲🇽", away_flag: "🇰🇷", group_name: "Grupo A", match_date: "2026-06-23 11:00:00-05", round: 3 },
  { home_team: "Alemania", away_team: "Camerún", home_flag: "🇩🇪", away_flag: "🇨🇲", group_name: "Grupo A", match_date: "2026-06-23 14:00:00-05", round: 3 },
  // GRUPO B
  { home_team: "Estados Unidos", away_team: "Ghana", home_flag: "🇺🇸", away_flag: "🇬🇭", group_name: "Grupo B", match_date: "2026-06-12 11:00:00-05", round: 1 },
  { home_team: "Senegal", away_team: "Australia", home_flag: "🇸🇳", away_flag: "🇦🇺", group_name: "Grupo B", match_date: "2026-06-12 14:00:00-05", round: 1 },
  { home_team: "Ghana", away_team: "Senegal", home_flag: "🇬🇭", away_flag: "🇸🇳", group_name: "Grupo B", match_date: "2026-06-18 11:00:00-05", round: 2 },
  { home_team: "Australia", away_team: "Estados Unidos", home_flag: "🇦🇺", away_flag: "🇺🇸", group_name: "Grupo B", match_date: "2026-06-18 14:00:00-05", round: 2 },
  { home_team: "Estados Unidos", away_team: "Senegal", home_flag: "🇺🇸", away_flag: "🇸🇳", group_name: "Grupo B", match_date: "2026-06-24 11:00:00-05", round: 3 },
  { home_team: "Ghana", away_team: "Australia", home_flag: "🇬🇭", away_flag: "🇦🇺", group_name: "Grupo B", match_date: "2026-06-24 14:00:00-05", round: 3 },
  // GRUPO C
  { home_team: "Inglaterra", away_team: "Marruecos", home_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", away_flag: "🇲🇦", group_name: "Grupo C", match_date: "2026-06-13 11:00:00-05", round: 1 },
  { home_team: "Japón", away_team: "Costa Rica", home_flag: "🇯🇵", away_flag: "🇨🇷", group_name: "Grupo C", match_date: "2026-06-13 14:00:00-05", round: 1 },
  { home_team: "Marruecos", away_team: "Japón", home_flag: "🇲🇦", away_flag: "🇯🇵", group_name: "Grupo C", match_date: "2026-06-19 11:00:00-05", round: 2 },
  { home_team: "Costa Rica", away_team: "Inglaterra", home_flag: "🇨🇷", away_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group_name: "Grupo C", match_date: "2026-06-19 14:00:00-05", round: 2 },
  { home_team: "Inglaterra", away_team: "Japón", home_flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", away_flag: "🇯🇵", group_name: "Grupo C", match_date: "2026-06-25 11:00:00-05", round: 3 },
  { home_team: "Marruecos", away_team: "Costa Rica", home_flag: "🇲🇦", away_flag: "🇨🇷", group_name: "Grupo C", match_date: "2026-06-25 14:00:00-05", round: 3 },
  // GRUPO D
  { home_team: "Países Bajos", away_team: "Uruguay", home_flag: "🇳🇱", away_flag: "🇺🇾", group_name: "Grupo D", match_date: "2026-06-14 11:00:00-05", round: 1 },
  { home_team: "Irán", away_team: "Canadá", home_flag: "🇮🇷", away_flag: "🇨🇦", group_name: "Grupo D", match_date: "2026-06-14 14:00:00-05", round: 1 },
  { home_team: "Uruguay", away_team: "Irán", home_flag: "🇺🇾", away_flag: "🇮🇷", group_name: "Grupo D", match_date: "2026-06-20 11:00:00-05", round: 2 },
  { home_team: "Canadá", away_team: "Países Bajos", home_flag: "🇨🇦", away_flag: "🇳🇱", group_name: "Grupo D", match_date: "2026-06-20 14:00:00-05", round: 2 },
  { home_team: "Países Bajos", away_team: "Irán", home_flag: "🇳🇱", away_flag: "🇮🇷", group_name: "Grupo D", match_date: "2026-06-26 11:00:00-05", round: 3 },
  { home_team: "Uruguay", away_team: "Canadá", home_flag: "🇺🇾", away_flag: "🇨🇦", group_name: "Grupo D", match_date: "2026-06-26 14:00:00-05", round: 3 },
  // GRUPO E
  { home_team: "Francia", away_team: "Ucrania", home_flag: "🇫🇷", away_flag: "🇺🇦", group_name: "Grupo E", match_date: "2026-06-15 10:00:00-05", round: 1 },
  { home_team: "Arabia Saudita", away_team: "Nueva Zelanda", home_flag: "🇸🇦", away_flag: "🇳🇿", group_name: "Grupo E", match_date: "2026-06-15 13:00:00-05", round: 1 },
  { home_team: "Ucrania", away_team: "Arabia Saudita", home_flag: "🇺🇦", away_flag: "🇸🇦", group_name: "Grupo E", match_date: "2026-06-21 10:00:00-05", round: 2 },
  { home_team: "Nueva Zelanda", away_team: "Francia", home_flag: "🇳🇿", away_flag: "🇫🇷", group_name: "Grupo E", match_date: "2026-06-21 13:00:00-05", round: 2 },
  { home_team: "Francia", away_team: "Arabia Saudita", home_flag: "🇫🇷", away_flag: "🇸🇦", group_name: "Grupo E", match_date: "2026-06-27 10:00:00-05", round: 3 },
  { home_team: "Ucrania", away_team: "Nueva Zelanda", home_flag: "🇺🇦", away_flag: "🇳🇿", group_name: "Grupo E", match_date: "2026-06-27 13:00:00-05", round: 3 },
  // GRUPO F
  { home_team: "Bélgica", away_team: "Chile", home_flag: "🇧🇪", away_flag: "🇨🇱", group_name: "Grupo F", match_date: "2026-06-16 11:00:00-05", round: 1 },
  { home_team: "Egipto", away_team: "Irak", home_flag: "🇪🇬", away_flag: "🇮🇶", group_name: "Grupo F", match_date: "2026-06-16 14:00:00-05", round: 1 },
  { home_team: "Chile", away_team: "Egipto", home_flag: "🇨🇱", away_flag: "🇪🇬", group_name: "Grupo F", match_date: "2026-06-22 11:00:00-05", round: 2 },
  { home_team: "Irak", away_team: "Bélgica", home_flag: "🇮🇶", away_flag: "🇧🇪", group_name: "Grupo F", match_date: "2026-06-22 14:00:00-05", round: 2 },
  { home_team: "Bélgica", away_team: "Egipto", home_flag: "🇧🇪", away_flag: "🇪🇬", group_name: "Grupo F", match_date: "2026-06-28 11:00:00-05", round: 3 },
  { home_team: "Chile", away_team: "Irak", home_flag: "🇨🇱", away_flag: "🇮🇶", group_name: "Grupo F", match_date: "2026-06-28 14:00:00-05", round: 3 },
  // GRUPO G
  { home_team: "Brasil", away_team: "Noruega", home_flag: "🇧🇷", away_flag: "🇳🇴", group_name: "Grupo G", match_date: "2026-06-12 16:00:00-05", round: 1 },
  { home_team: "Nigeria", away_team: "Panamá", home_flag: "🇳🇬", away_flag: "🇵🇦", group_name: "Grupo G", match_date: "2026-06-12 19:00:00-05", round: 1 },
  { home_team: "Noruega", away_team: "Nigeria", home_flag: "🇳🇴", away_flag: "🇳🇬", group_name: "Grupo G", match_date: "2026-06-18 16:00:00-05", round: 2 },
  { home_team: "Panamá", away_team: "Brasil", home_flag: "🇵🇦", away_flag: "🇧🇷", group_name: "Grupo G", match_date: "2026-06-18 19:00:00-05", round: 2 },
  { home_team: "Brasil", away_team: "Nigeria", home_flag: "🇧🇷", away_flag: "🇳🇬", group_name: "Grupo G", match_date: "2026-06-24 16:00:00-05", round: 3 },
  { home_team: "Noruega", away_team: "Panamá", home_flag: "🇳🇴", away_flag: "🇵🇦", group_name: "Grupo G", match_date: "2026-06-24 19:00:00-05", round: 3 },
  // GRUPO H
  { home_team: "Argentina", away_team: "Túnez", home_flag: "🇦🇷", away_flag: "🇹🇳", group_name: "Grupo H", match_date: "2026-06-13 16:00:00-05", round: 1 },
  { home_team: "Polonia", away_team: "EAU", home_flag: "🇵🇱", away_flag: "🇦🇪", group_name: "Grupo H", match_date: "2026-06-13 19:00:00-05", round: 1 },
  { home_team: "Túnez", away_team: "Polonia", home_flag: "🇹🇳", away_flag: "🇵🇱", group_name: "Grupo H", match_date: "2026-06-19 16:00:00-05", round: 2 },
  { home_team: "EAU", away_team: "Argentina", home_flag: "🇦🇪", away_flag: "🇦🇷", group_name: "Grupo H", match_date: "2026-06-19 19:00:00-05", round: 2 },
  { home_team: "Argentina", away_team: "Polonia", home_flag: "🇦🇷", away_flag: "🇵🇱", group_name: "Grupo H", match_date: "2026-06-25 16:00:00-05", round: 3 },
  { home_team: "Túnez", away_team: "EAU", home_flag: "🇹🇳", away_flag: "🇦🇪", group_name: "Grupo H", match_date: "2026-06-25 19:00:00-05", round: 3 },
  // GRUPO I
  { home_team: "España", away_team: "Croacia", home_flag: "🇪🇸", away_flag: "🇭🇷", group_name: "Grupo I", match_date: "2026-06-14 16:00:00-05", round: 1 },
  { home_team: "Ecuador", away_team: "Serbia", home_flag: "🇪🇨", away_flag: "🇷🇸", group_name: "Grupo I", match_date: "2026-06-14 19:00:00-05", round: 1 },
  { home_team: "Croacia", away_team: "Ecuador", home_flag: "🇭🇷", away_flag: "🇪🇨", group_name: "Grupo I", match_date: "2026-06-20 16:00:00-05", round: 2 },
  { home_team: "Serbia", away_team: "España", home_flag: "🇷🇸", away_flag: "🇪🇸", group_name: "Grupo I", match_date: "2026-06-20 19:00:00-05", round: 2 },
  { home_team: "España", away_team: "Ecuador", home_flag: "🇪🇸", away_flag: "🇪🇨", group_name: "Grupo I", match_date: "2026-06-26 16:00:00-05", round: 3 },
  { home_team: "Croacia", away_team: "Serbia", home_flag: "🇭🇷", away_flag: "🇷🇸", group_name: "Grupo I", match_date: "2026-06-26 19:00:00-05", round: 3 },
  // GRUPO J
  { home_team: "Italia", away_team: "Dinamarca", home_flag: "🇮🇹", away_flag: "🇩🇰", group_name: "Grupo J", match_date: "2026-06-15 15:00:00-05", round: 1 },
  { home_team: "Costa de Marfil", away_team: "Uzbekistán", home_flag: "🇨🇮", away_flag: "🇺🇿", group_name: "Grupo J", match_date: "2026-06-15 18:00:00-05", round: 1 },
  { home_team: "Dinamarca", away_team: "Costa de Marfil", home_flag: "🇩🇰", away_flag: "🇨🇮", group_name: "Grupo J", match_date: "2026-06-21 15:00:00-05", round: 2 },
  { home_team: "Uzbekistán", away_team: "Italia", home_flag: "🇺🇿", away_flag: "🇮🇹", group_name: "Grupo J", match_date: "2026-06-21 18:00:00-05", round: 2 },
  { home_team: "Italia", away_team: "Costa de Marfil", home_flag: "🇮🇹", away_flag: "🇨🇮", group_name: "Grupo J", match_date: "2026-06-27 15:00:00-05", round: 3 },
  { home_team: "Dinamarca", away_team: "Uzbekistán", home_flag: "🇩🇰", away_flag: "🇺🇿", group_name: "Grupo J", match_date: "2026-06-27 18:00:00-05", round: 3 },
  // GRUPO K (COLOMBIA)
  { home_team: "Portugal", away_team: "RD Congo", home_flag: "🇵🇹", away_flag: "🇨🇩", group_name: "Grupo K", match_date: "2026-06-16 20:00:00-05", round: 1 },
  { home_team: "Colombia", away_team: "Uzbekistán", home_flag: "🇨🇴", away_flag: "🇺🇿", group_name: "Grupo K", match_date: "2026-06-17 20:00:00-05", round: 1 },
  { home_team: "Uzbekistán", away_team: "Portugal", home_flag: "🇺🇿", away_flag: "🇵🇹", group_name: "Grupo K", match_date: "2026-06-22 20:00:00-05", round: 2 },
  { home_team: "RD Congo", away_team: "Colombia", home_flag: "🇨🇩", away_flag: "🇨🇴", group_name: "Grupo K", match_date: "2026-06-23 20:00:00-05", round: 2 },
  { home_team: "Colombia", away_team: "Portugal", home_flag: "🇨🇴", away_flag: "🇵🇹", group_name: "Grupo K", match_date: "2026-06-28 17:30:00-05", round: 3 },
  { home_team: "Uzbekistán", away_team: "RD Congo", home_flag: "🇺🇿", away_flag: "🇨🇩", group_name: "Grupo K", match_date: "2026-06-28 20:30:00-05", round: 3 },
  // GRUPO L
  { home_team: "Suiza", away_team: "Perú", home_flag: "🇨🇭", away_flag: "🇵🇪", group_name: "Grupo L", match_date: "2026-06-17 10:00:00-05", round: 1 },
  { home_team: "Corea del Norte", away_team: "Sudáfrica", home_flag: "🇰🇵", away_flag: "🇿🇦", group_name: "Grupo L", match_date: "2026-06-17 13:00:00-05", round: 1 },
  { home_team: "Perú", away_team: "Corea del Norte", home_flag: "🇵🇪", away_flag: "🇰🇵", group_name: "Grupo L", match_date: "2026-06-23 10:00:00-05", round: 2 },
  { home_team: "Sudáfrica", away_team: "Suiza", home_flag: "🇿🇦", away_flag: "🇨🇭", group_name: "Grupo L", match_date: "2026-06-23 13:00:00-05", round: 2 },
  { home_team: "Suiza", away_team: "Corea del Norte", home_flag: "🇨🇭", away_flag: "🇰🇵", group_name: "Grupo L", match_date: "2026-06-29 10:00:00-05", round: 3 },
  { home_team: "Perú", away_team: "Sudáfrica", home_flag: "🇵🇪", away_flag: "🇿🇦", group_name: "Grupo L", match_date: "2026-06-29 13:00:00-05", round: 3 },
  // ELIMINATORIAS (32vos de Final)
  { home_team: "1A", away_team: "2B", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-06-30 10:00:00-05", round: 4 },
  { home_team: "1C", away_team: "2D", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-06-30 14:00:00-05", round: 4 },
  { home_team: "1E", away_team: "2F", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-07-01 10:00:00-05", round: 4 },
  { home_team: "1G", away_team: "2H", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-07-01 14:00:00-05", round: 4 },
  { home_team: "1I", away_team: "2J", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-07-02 10:00:00-05", round: 4 },
  { home_team: "1K", away_team: "2L", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-07-02 14:00:00-05", round: 4 },
  { home_team: "1B", away_team: "2A", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-07-03 10:00:00-05", round: 4 },
  { home_team: "1D", away_team: "2C", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-07-03 14:00:00-05", round: 4 },
  { home_team: "1F", away_team: "2E", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-07-04 10:00:00-05", round: 4 },
  { home_team: "1H", away_team: "2G", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-07-04 14:00:00-05", round: 4 },
  { home_team: "1J", away_team: "2I", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-07-05 10:00:00-05", round: 4 },
  { home_team: "1L", away_team: "2K", home_flag: "🏆", away_flag: "🏆", group_name: "Eliminatorias", match_date: "2026-07-05 14:00:00-05", round: 4 },
];

export default function Admin() {
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);
  const [predCount, setPredCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: m } = await supabase.from("matches").select("*").order("match_date");
    const { data: p } = await supabase.from("profiles").select("id");
    const { data: pr } = await supabase.from("predictions").select("id");
    setMatches(m || []);
    setParticipantCount(p?.length || 0);
    setPredCount(pr?.length || 0);
    setLoading(false);
    setSeeded((m?.length || 0) > 0);
  }

  async function seedFullFixture() {
    setSeeding(true);
    // Limpiar partidos existentes primero
    await supabase.from("matches").delete().neq("id", 0);
    // Insertar fixture completo
    const { error } = await supabase.from("matches").insert(FULL_FIXTURE);
    if (error) {
      console.error("Error al cargar fixture:", error);
      alert("Error al cargar los partidos: " + error.message);
    } else {
      setSeeded(true);
      alert(`✅ ${FULL_FIXTURE.length} partidos cargados correctamente`);
    }
    setSeeding(false);
    fetchData();
  }

  function handleResult(matchId, side, value) {
    setResults((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: value === "" ? "" : parseInt(value) },
    }));
  }

  async function saveResults() {
    setSaving(true);
    for (const [matchId, result] of Object.entries(results)) {
      if (result.home_score === undefined || result.away_score === undefined || result.home_score === "" || result.away_score === "") continue;
      
      const hs = parseInt(result.home_score);
      const as = parseInt(result.away_score);
      
      // Actualizar el partido con el resultado y marcarlo como finalizado
      // El trigger de SQL se encargará de calcular los puntos automáticamente
      const { error } = await supabase
        .from("matches")
        .update({ home_score: hs, away_score: as, is_finished: true })
        .eq("id", matchId);
      
      if (error) {
        console.error("Error al actualizar partido:", error);
        alert(`Error al guardar resultado: ${error.message}`);
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setResults({});
    fetchData();
  }

  if (loading) return <div className="loading-inline">Cargando...</div>;

  // Obtener partidos pendientes (no finalizados)
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

      {matches.length === 0 && (
        <div className="ranking-card" style={{ marginTop: "1rem", textAlign: "center" }}>
          <p style={{ marginBottom: "12px", color: "var(--color-text-secondary)", fontSize: "14px" }}>
            No hay partidos cargados. ¿Cargar el fixture completo del Mundial 2026?
          </p>
          <p style={{ marginBottom: "12px", fontSize: "12px", color: "var(--color-text-tertiary)" }}>
            {FULL_FIXTURE.length} partidos (fase de grupos + eliminatorias)
          </p>
          <button className="save-btn" onClick={seedFullFixture} disabled={seeding}>
            {seeding ? "Cargando..." : seeded ? "✓ Partidos ya cargados" : "Cargar fixture completo del Mundial 2026"}
          </button>
        </div>
      )}

      {matches.length > 0 && (
        <>
          {pendingMatches.length > 0 && (
            <>
              <p className="group-title" style={{ marginTop: "1rem" }}>📝 Cargar resultados reales</p>
              {pendingMatches.map((match) => (
                <div className="match-card" key={match.id}>
                  <div className="match-row">
                    <div className="team-name">{match.home_flag} {match.home_team}</div>
                    <div className="score-center">
                      <div className="score-inputs">
                        <input
                          type="number" min="0" max="20" placeholder="0"
                          value={results[match.id]?.home_score ?? ""}
                          onChange={(e) => handleResult(match.id, "home_score", e.target.value)}
                        />
                        <span className="dash">-</span>
                        <input
                          type="number" min="0" max="20" placeholder="0"
                          value={results[match.id]?.away_score ?? ""}
                          onChange={(e) => handleResult(match.id, "away_score", e.target.value)}
                        />
                      </div>
                      <div className="match-date">
                        {match.match_date ? new Date(match.match_date).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Por definir"}
                      </div>
                    </div>
                    <div className="team-name right">{match.away_flag} {match.away_team}</div>
                  </div>
                </div>
              ))}

              <button className="save-btn" onClick={saveResults} disabled={saving}>
                {saving ? "Guardando y calculando puntos..." : saved ? "✓ Resultados publicados" : "Publicar resultados (calcula puntos automáticamente)"}
              </button>
            </>
          )}

          {finishedMatches.length > 0 && (
            <>
              <p className="group-title" style={{ marginTop: "1.5rem" }}>✅ Partidos finalizados</p>
              {finishedMatches.map((match) => (
                <div className="match-card" key={match.id} style={{ opacity: 0.8 }}>
                  <div className="match-row">
                    <div className="team-name">{match.home_flag} {match.home_team}</div>
                    <div className="score-center">
                      <div className="final-score">
                        <span className="score-home">{match.home_score}</span>
                        <span className="score-dash">-</span>
                        <span className="score-away">{match.away_score}</span>
                      </div>
                      <div className="match-date">Finalizado</div>
                    </div>
                    <div className="team-name right">{match.away_flag} {match.away_team}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}