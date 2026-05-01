function DashboardChef({ onLogout }) {
  const nom = localStorage.getItem("nom");
  return (
    <div style={{padding:"40px"}}>
      <h2>Dashboard Chef d'Atelier</h2>
      <p>Bienvenue <b>{nom}</b></p>
      <button onClick={onLogout}>Se déconnecter</button>
    </div>
  );
}
export default DashboardChef;