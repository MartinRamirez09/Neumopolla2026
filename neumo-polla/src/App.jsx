import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./components/Auth";
import Predictions from "./components/Predictions";
import Ranking from "./components/Ranking";
import Admin from "./components/Admin";
import ProfileSetup from "./components/ProfileSetup";
import FinalPositions from "./components/FinalPositions";  // 👈 NUEVO IMPORT
import "./App.css";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("predictions");
  const [loading, setLoading] = useState(true);
  const [profileUpdated, setProfileUpdated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [profileUpdated]);

  async function fetchProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setProfile(data);
    } else {
      const user = (await supabase.auth.getUser()).data.user;
      const newProfile = {
        id: userId,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split("@")[0],
        avatar_url: user.user_metadata?.avatar_url || null,
        is_admin: false,
      };
      await supabase.from("profiles").insert(newProfile);
      setProfile(newProfile);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  const handleProfileUpdated = () => {
    setProfileUpdated(prev => !prev);
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-ball">⚽</div>
      <p>Cargando...</p>
    </div>
  );

  if (!session) return <Auth />;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="header-logo">⚽</span>
          <div>
            <h1 className="header-title">NeumoPolla 2026</h1>
            <p className="header-sub">Hola, {profile?.full_name?.split(" ")[0] || "colaborador"}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Salir</button>
      </header>

      <main className="main">
        <ProfileSetup user={session.user} onProfileUpdated={handleProfileUpdated} />

        <nav className="nav">
          <button className={`nav-tab ${activeTab === "predictions" ? "active" : ""}`} onClick={() => setActiveTab("predictions")}>
            <span className="nav-icon">✏️</span> Mis predicciones
          </button>
          <button className={`nav-tab ${activeTab === "final" ? "active" : ""}`} onClick={() => setActiveTab("final")}>
            <span className="nav-icon">🏆</span> Final
          </button>
          <button className={`nav-tab ${activeTab === "ranking" ? "active" : ""}`} onClick={() => setActiveTab("ranking")}>
            <span className="nav-icon">🏆</span> Ranking
          </button>
          {profile?.is_admin && (
            <button className={`nav-tab ${activeTab === "admin" ? "active" : ""}`} onClick={() => setActiveTab("admin")}>
              <span className="nav-icon">⚙️</span> Admin
            </button>
          )}
        </nav>

        {activeTab === "predictions" && <Predictions userId={session.user.id} />}
        {activeTab === "final" && <FinalPositions userId={session.user.id} />}
        {activeTab === "ranking" && <Ranking userId={session.user.id} />}
        {activeTab === "admin" && profile?.is_admin && <Admin user={session.user} onStatsUpdate={handleProfileUpdated} />}
      </main>
    </div>
  );
}