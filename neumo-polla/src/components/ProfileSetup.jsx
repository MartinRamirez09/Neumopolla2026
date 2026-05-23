import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function ProfileSetup({ user, onProfileUpdated }) {
  const [fullName, setFullName] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [initialName, setInitialName] = useState("");

  useEffect(() => {
    checkProfile();
  }, [user]);

  async function checkProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, area")
      .eq("id", user.id)
      .single();

    // Extraer nombre base del email (ej: "martinramirez" de "martinramirez@gmail.com")
    const emailName = user.email?.split("@")[0] || "";
    setInitialName(emailName);

    if (data) {
      // Si el nombre guardado es el mismo que el del email (o está vacío), mostrar formulario
      if (!data.full_name || data.full_name === emailName) {
        setFullName("");
        setArea(data.area || "");
        setShowForm(true);
      } else {
        // Ya tiene un nombre personalizado
        setShowForm(false);
        if (onProfileUpdated) onProfileUpdated();
      }
    } else {
      // No hay perfil, mostrar formulario
      setShowForm(true);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!fullName.trim()) {
      setError("Por favor ingresa tu nombre completo");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        area: area.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      setError("Error al guardar: " + error.message);
    } else {
      setSuccess(true);
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => {
        setShowForm(false);
      }, 1500);
    }
    setLoading(false);
  }

  if (!showForm) return null;

  return (
    <div className="profile-card">
      <div className="profile-icon">✏️</div>
      <h3 className="profile-title">Completa tu perfil</h3>
      <p className="profile-desc">
        ¿Cómo quieres que te llamen en la polla? Tu nombre aparecerá en la tabla de posiciones.
      </p>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Nombre completo *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: Martín Ramírez"
            className="profile-input"
            autoFocus
          />
          <small style={{ fontSize: "10px", color: "var(--text-faint)" }}>
            Actualmente usas: {initialName || "sin nombre"}
          </small>
        </div>

        <div className="form-group">
          <label>Área / Departamento (opcional)</label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Ej: Neumología, Administración, Enfermería"
            className="profile-input"
          />
        </div>

        {error && <div className="profile-error">{error}</div>}
        {success && <div className="profile-success">✅ Perfil guardado correctamente</div>}

        <button type="submit" className="profile-btn" disabled={loading}>
          {loading ? "Guardando..." : "Guardar perfil"}
        </button>
      </form>
    </div>
  );
}