import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "./FinalPositions.css";

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

export default function FinalPositions({ userId }) {
  const [prediction, setPrediction] = useState({ first: "", second: "", third: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    checkLockStatus();
    fetchPrediction();
  }, [userId]);

  function checkLockStatus() {
    // Fecha de corte: 10 de junio 2026 a las 23:59 (hora Colombia)
    const lockDate = new Date("2026-06-10T23:59:59-05:00");
    const now = new Date();
    setIsLocked(now >= lockDate);
  }

  async function fetchPrediction() {
    const { data, error } = await supabase
      .from("final_positions_predictions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data && !error) {
      setPrediction({
        first: data.first_place,
        second: data.second_place,
        third: data.third_place
      });
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLocked) {
      setError("⏰ El tiempo para hacer esta predicción ya expiró (10 de junio 23:59)");
      return;
    }

    if (!prediction.first || !prediction.second || !prediction.third) {
      setError("Por favor selecciona los 3 equipos (1°, 2° y 3° lugar)");
      return;
    }

    if (prediction.first === prediction.second || 
        prediction.first === prediction.third || 
        prediction.second === prediction.third) {
      setError("Los tres equipos deben ser diferentes");
      return;
    }

    setSaving(true);
    setError("");

    const { error } = await supabase
      .from("final_positions_predictions")
      .upsert({
        user_id: userId,
        first_place: prediction.first,
        second_place: prediction.second,
        third_place: prediction.third,
      }, { onConflict: "user_id" });

    if (error) {
      setError("Error al guardar: " + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function handleChange(position, value) {
    setPrediction(prev => ({ ...prev, [position]: value }));
  }

  if (loading) return <div className="loading-inline">Cargando...</div>;

  return (
    <div className="final-positions-card">
      <div className="final-positions-header">
        <span className="final-positions-icon">🏆</span>
        <h3 className="final-positions-title">Pronóstico Final del Mundial</h3>
        <p className="final-positions-desc">
          ¿Quiénes serán los 3 primeros lugares del Mundial 2026?
        </p>
        {isLocked && (
          <div className="final-lock-warning">
            ⚠️ Este pronóstico se cerró el 10 de junio a las 23:59. Ya no se puede modificar.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="final-positions-form">
        <div className="position-select">
          <label className="position-label gold">
            🥇 1er Lugar (20 puntos)
          </label>
          <select
            value={prediction.first}
            onChange={(e) => handleChange("first", e.target.value)}
            disabled={isLocked}
            className="position-select-input"
            required
          >
            <option value="">Selecciona un país</option>
            {COUNTRIES.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        <div className="position-select">
          <label className="position-label silver">
            🥈 2do Lugar (10 puntos)
          </label>
          <select
            value={prediction.second}
            onChange={(e) => handleChange("second", e.target.value)}
            disabled={isLocked}
            className="position-select-input"
            required
          >
            <option value="">Selecciona un país</option>
            {COUNTRIES.filter(c => c !== prediction.first).map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        <div className="position-select">
          <label className="position-label bronze">
            🥉 3er Lugar (5 puntos)
          </label>
          <select
            value={prediction.third}
            onChange={(e) => handleChange("third", e.target.value)}
            disabled={isLocked}
            className="position-select-input"
            required
          >
            <option value="">Selecciona un país</option>
            {COUNTRIES.filter(c => c !== prediction.first && c !== prediction.second).map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {error && <div className="final-error">{error}</div>}
        {saved && <div className="final-success">✅ Pronóstico guardado correctamente</div>}

        {!isLocked && (
          <button type="submit" className="final-save-btn" disabled={saving}>
            {saving ? "Guardando..." : "💾 Guardar pronóstico"}
          </button>
        )}

        {prediction.first && isLocked && (
          <div className="final-saved-prediction">
            <p>Tu pronóstico:</p>
            <div className="final-saved-items">
              <span className="gold">🥇 {prediction.first}</span>
              <span className="silver">🥈 {prediction.second}</span>
              <span className="bronze">🥉 {prediction.third}</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}