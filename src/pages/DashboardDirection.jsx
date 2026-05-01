function DashboardDirection({ onLogout }) {
  const nom = localStorage.getItem("nom");
  const role = localStorage.getItem("role");
  return (
    <div style={{padding:"40px"}}>
      <h2>Dashboard Direction</h2>
      <p>Bienvenue <b>{nom}</b> — {role}</p>
      <button onClick={onLogout}>Se déconnecter</button>
    </div>
  );
}
export default DashboardDirection;