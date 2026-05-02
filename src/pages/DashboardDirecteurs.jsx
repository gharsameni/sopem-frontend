import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import Historique from './Historique';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const DashboardDirecteurs = ({ user }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showHistorique, setShowHistorique] = useState(false);
  const [showRechercheSpecifique, setShowRechercheSpecifique] = useState(false);
  const [showStockProduitsFinis, setShowStockProduitsFinis] = useState(false);
  const [showAlertes, setShowAlertes] = useState(false);
  const [activeSection, setActiveSection] = useState('stock');

  const [referenceRecherche, setReferenceRecherche] = useState('');
  const [resultatsRecherche, setResultatsRecherche] = useState(null);
  const [loadingRecherche, setLoadingRecherche] = useState(false);

  const [stockProduits, setStockProduits] = useState([]);
  const [loadingStockProduits, setLoadingStockProduits] = useState(false);

  const [allMouvements, setAllMouvements] = useState([]);

  const [kpis, setKpis] = useState({
    entrees: 0,
    sorties: 0,
    alertes: 0,
    total: 0,
    stockTotal: 0,
    alertesDetails: [],
    derniersMovements: [],
    loading: true
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchKPIs();
    fetchAllMouvements();
  }, []);

  const fetchKPIs = async () => {
    setKpis(prev => ({ ...prev, loading: true }));
    try {
      const [mouvementsRes, totalRes, alertesRes, stockTotalRes, alertesDetailsRes, derniersRes] = await Promise.all([
  fetch(`${API_URL}/api/mouvements/stats/today`),
  fetch(`${API_URL}/api/mouvements/stats/total-produits`),
  fetch(`${API_URL}/api/mouvements/stats/alertes`),
  fetch(`${API_URL}/api/mouvements/stats/stock-total`),
  fetch(`${API_URL}/api/mouvements/alertes-details`),
  fetch(`${API_URL}/api/mouvements/derniers`)
]);
      const mouvements = await mouvementsRes.json();
      const totalData = await totalRes.json();
      const alertes = await alertesRes.json();
      const stockTotal = await stockTotalRes.json();
      const alertesDetails = await alertesDetailsRes.json();
      const derniers = await derniersRes.json();
      setKpis({
        entrees: mouvements.entrees || 0,
        sorties: mouvements.sorties || 0,
        alertes: alertes.alertes || 0,
        total: totalData.total || 0,
        stockTotal: stockTotal.stockTotal || 0,
        alertesDetails: alertesDetails || [],
        derniersMovements: derniers || [],
        loading: false
      });
    } catch (error) {
      console.error('Erreur chargement KPIs:', error);
      setKpis(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchAllMouvements = async () => {
    try {
    const res = await fetch(`${API_URL}/api/mouvements`);
      if (res.ok) {
        const data = await res.json();
        setAllMouvements(data);
      }
    } catch (error) {
      console.error('Erreur chargement mouvements:', error);
    }
  };

  const getMouvementsParMois = () => {
    const now = new Date();
    const moisData = {};
    
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(now.getMonth() - (5 - i));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const moisNom = date.toLocaleDateString('fr-FR', { month: 'short' });
      moisData[key] = {
        mois: moisNom.charAt(0).toUpperCase() + moisNom.slice(1),
        entrees: 0,
        sorties: 0
      };
    }
    
    allMouvements.forEach(mvt => {
      if (!mvt.date) return;
      const date = new Date(mvt.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (moisData[key]) {
        if (mvt.type === 'ENTREE') {
          moisData[key].entrees += mvt.quantite || 0;
        } else if (mvt.type === 'SORTIE') {
          moisData[key].sorties += mvt.quantite || 0;
        }
      }
    });
    
    return Object.values(moisData);
  };

  const handleRechercheSpecifique = async () => {
    if (!referenceRecherche.trim()) {
      alert('Veuillez entrer une référence');
      return;
    }

    setLoadingRecherche(true);
    try {
   const res = await fetch(`${API_URL}/api/mouvements`);
      if (!res.ok) throw new Error('Erreur chargement');
      
      const allMouvements = await res.json();
      const filtered = allMouvements.filter(m => 
        m.reference?.toLowerCase() === referenceRecherche.toLowerCase()
      );

      if (filtered.length === 0) {
        setResultatsRecherche({ found: false });
        setLoadingRecherche(false);
        return;
      }

      const produit = {
        reference: filtered[0].reference,
        designation: filtered[0].designation,
      };

      const operationsMap = {};
      
      filtered.forEach(m => {
        const op = m.nom_operation || 'NON_SPECIFIE';
        if (!operationsMap[op]) {
          operationsMap[op] = { entrees: 0, sorties: 0, stock: 0 };
        }
        
        if (m.type === 'ENTREE') {
          operationsMap[op].entrees += m.quantite;
        } else {
          operationsMap[op].sorties += m.quantite;
        }
        
        operationsMap[op].stock = operationsMap[op].entrees - operationsMap[op].sorties;
      });

      const operations = Object.keys(operationsMap).map(nom => ({
        nom,
        ...operationsMap[nom]
      }));

      setResultatsRecherche({
        found: true,
        produit,
        operations,
        totalMouvements: filtered.length
      });

    } catch (err) {
      alert('❌ Erreur: ' + err.message);
    }
    setLoadingRecherche(false);
  };

  const chargerStockProduitsFinis = async () => {
    setLoadingStockProduits(true);
    try {
const res = await fetch(`${API_URL}/api/mouvements`);
      if (!res.ok) throw new Error('Erreur chargement');
      
      const allMouvements = await res.json();
      
      const produitsMap = {};
      
      allMouvements.forEach(m => {
        const ref = m.reference;
        if (!produitsMap[ref]) {
          produitsMap[ref] = {
            reference: ref,
            designation: m.designation,
            entrees: 0,
            sorties: 0,
            stock: 0
          };
        }
        
        if (m.type === 'ENTREE') {
          produitsMap[ref].entrees += m.quantite;
        } else {
          produitsMap[ref].sorties += m.quantite;
        }
        
        produitsMap[ref].stock = produitsMap[ref].entrees - produitsMap[ref].sorties;
      });

      const produits = Object.values(produitsMap).sort((a, b) => b.stock - a.stock);
      
      setStockProduits(produits);
    } catch (err) {
      alert('❌ Erreur: ' + err.message);
    }
    setLoadingStockProduits(false);
  };

  const formatDateTime = (date) => {
    const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const jourNom = jours[date.getDay()];
    const jour = date.getDate();
    const moisNom = mois[date.getMonth()];
    const annee = date.getFullYear();
    const heures = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${jourNom} ${jour} ${moisNom} ${annee} • ${heures}:${minutes}`;
  };

  const handleLogout = () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      localStorage.removeItem('user');
      window.location.reload();
    }
  };

  const getRoleDisplay = () => {
    if (user.role === 'DIR_GENERAL') return 'Directeur Général';
    if (user.role === 'DIR_COMMERCIAL') return 'Directeur Commercial';
    return user.role;
  };

  const getRoleColor = () => {
    // Couleurs bleues SOPEM uniformes pour tous les rôles
    return { start: '#0ac5ff', end: '#0f2942' };
  };

  const roleColor = getRoleColor();
  const mouvementsData = getMouvementsParMois();

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '0',
      margin: '0',
    },
    header: {
      background: '#fff',
      borderBottom: '1px solid #bae6fd',
      padding: '1.25rem 3rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(10, 197, 255, 0.08)',
    },
    titleSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
    },
    logoSopem: {
      height: '48px',
      width: 'auto',
      marginRight: '0.5rem',
    },
    titleContent: {
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      fontSize: '26px',
      fontWeight: '700',
      margin: '0',
      background: `linear-gradient(135deg, ${roleColor.start} 0%, ${roleColor.end} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.5px',
    },
    subtitle: {
      fontSize: '13px',
      color: '#64748b',
      margin: '4px 0 0 0',
      fontWeight: '500',
    },
    roleBadge: {
      fontSize: '11px',
      padding: '4px 10px',
      background: '#e0f2fe',
      color: '#0369a1',
      borderRadius: '8px',
      fontWeight: '700',
      marginLeft: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    headerActions: {
      display: 'flex',
      gap: '14px',
      alignItems: 'center',
    },
    logoutBtn: {
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '18px',
    },
    userAvatar: {
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      background: `linear-gradient(135deg, ${roleColor.start} 0%, ${roleColor.end} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '15px',
      fontWeight: '700',
      color: '#fff',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: `0 4px 12px ${roleColor.start}40`,
    },
    btnActualiser: {
      padding: '10px 20px',
      fontSize: '13px',
      fontWeight: '600',
      border: '1px solid #bae6fd',
      background: '#fff',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: '#0f2942',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    mainWrapper: {
      padding: '2.5rem 3rem',
    },
    layout: {
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: '2rem',
      maxWidth: '1800px',
      margin: '0 auto',
    },
    sidebar: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    sidebarSection: {
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #bae6fd',
      padding: '12px',
      boxShadow: '0 2px 8px rgba(10, 197, 255, 0.06)',
    },
    sidebarBtn: {
      padding: '16px 18px',
      textAlign: 'left',
      background: 'transparent',
      border: 'none',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      width: '100%',
    },
    sidebarBtnPrimary: {
      padding: '16px 18px',
      textAlign: 'left',
      background: `linear-gradient(135deg, ${roleColor.start} 0%, ${roleColor.end} 100%)`,
      border: 'none',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: `0 6px 20px ${roleColor.start}50`,
      width: '100%',
    },
    btnIcon: {
      width: '38px',
      height: '38px',
      borderRadius: '10px',
      background: 'rgba(255, 255, 255, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '19px',
      flexShrink: '0',
    },
    btnIconSecondary: {
      width: '38px',
      height: '38px',
      borderRadius: '10px',
      background: '#f0f9ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '19px',
      flexShrink: '0',
    },
    btnContent: { flex: '1' },
    btnTitle: { fontSize: '14px', fontWeight: '600', marginBottom: '3px', color: '#0f2942' },
    btnTitlePrimary: { fontSize: '14px', fontWeight: '700', marginBottom: '3px', color: '#fff' },
    btnSubtitle: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
    btnSubtitlePrimary: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500' },
    sectionTitle: {
      fontSize: '11px',
      fontWeight: '700',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      margin: '14px 18px 10px 18px',
    },
    mainContent: { display: 'flex', flexDirection: 'column', gap: '2rem' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem' },
    kpiCard: {
      background: '#fff',
      borderRadius: '16px',
      padding: '1.75rem 1.5rem',
      border: '1px solid #bae6fd',
      boxShadow: '0 2px 8px rgba(10, 197, 255, 0.06)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    },
    kpiCardPrimary: {
      background: `linear-gradient(135deg, ${roleColor.start} 0%, ${roleColor.end} 100%)`,
      border: 'none',
      boxShadow: `0 8px 24px ${roleColor.start}50`,
    },
    kpiLabel: { fontSize: '12px', color: '#64748b', margin: '0 0 14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
    kpiLabelPrimary: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', margin: '0 0 14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
    kpiValue: { fontSize: '36px', fontWeight: '800', margin: '0', color: '#0f2942', letterSpacing: '-1.5px' },
    kpiValuePrimary: { fontSize: '36px', fontWeight: '800', margin: '0', color: '#fff', letterSpacing: '-1.5px' },
    kpiValueDanger: { fontSize: '36px', fontWeight: '800', margin: '0', color: '#f85149', letterSpacing: '-1.5px' },
    card: { background: '#fff', borderRadius: '16px', border: '1px solid #bae6fd', padding: '2rem', boxShadow: '0 2px 8px rgba(10, 197, 255, 0.06)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '2px solid #f0f9ff' },
    cardTitle: { fontSize: '19px', fontWeight: '700', margin: '0', color: '#0f2942' },
    btnLink: { 
      fontSize: '13px', 
      padding: '10px 18px', 
      background: '#f0f9ff', 
      border: '1px solid #bae6fd', 
      borderRadius: '8px', 
      cursor: 'pointer', 
      transition: 'all 0.2s ease', 
      color: '#0f2942', 
      fontWeight: '600' 
    },
    alertsList: { display: 'flex', flexDirection: 'column', gap: '14px' },
    alertItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', transition: 'all 0.2s ease' },
    alertRef: { fontSize: '15px', fontWeight: '700', margin: '0 0 5px 0', color: '#dc2626' },
    alertLocation: { fontSize: '13px', color: '#991b1b', margin: '0', fontWeight: '500' },
    alertQuantity: { textAlign: 'right' },
    alertValue: { fontSize: '26px', fontWeight: '800', margin: '0 0 5px 0', color: '#dc2626' },
    alertUnit: { fontSize: '12px', color: '#991b1b', margin: '0', fontWeight: '600' },
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', fontSize: '14px', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '14px 10px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #bae6fd', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px', background: '#f0f9ff' },
    thRight: { textAlign: 'right', padding: '14px 10px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #bae6fd', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px', background: '#f0f9ff' },
    td: { padding: '16px 10px', borderBottom: '1px solid #e0f2fe' },
    tdMuted: { padding: '16px 10px', borderBottom: '1px solid #e0f2fe', color: '#64748b', fontSize: '13px', fontWeight: '500' },
    tdBold: { padding: '16px 10px', borderBottom: '1px solid #e0f2fe', fontWeight: '700', color: '#0f2942' },
    tdRight: { padding: '16px 10px', borderBottom: '1px solid #e0f2fe', textAlign: 'right', fontWeight: '700' },
    tdRightSuccess: { padding: '16px 10px', borderBottom: '1px solid #e0f2fe', textAlign: 'right', fontWeight: '700', color: '#1a7f37' },
    tdRightDanger: { padding: '16px 10px', borderBottom: '1px solid #e0f2fe', textAlign: 'right', fontWeight: '700', color: '#cf222e' },
    badgeSuccess: { padding: '7px 14px', borderRadius: '14px', fontSize: '12px', display: 'inline-block', background: '#dafbe1', color: '#1a7f37', fontWeight: '700' },
    badgeDanger: { padding: '7px 14px', borderRadius: '14px', fontSize: '12px', display: 'inline-block', background: '#ffebe9', color: '#cf222e', fontWeight: '700' },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 41, 66, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    },
    modal: {
      background: '#fff',
      borderRadius: '16px',
      width: '90%',
      maxWidth: '900px',
      maxHeight: '85vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(10, 197, 255, 0.3)',
    },
    modalLarge: {
      background: '#fff',
      borderRadius: '16px',
      width: '95%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(10, 197, 255, 0.3)',
    },
    modalHeader: {
      padding: '2rem 2.5rem',
      borderBottom: '2px solid #bae6fd',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: '700',
      margin: 0,
      background: `linear-gradient(135deg, ${roleColor.start} 0%, ${roleColor.end} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    closeBtn: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      cursor: 'pointer',
      fontSize: '20px',
      color: '#0f2942',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <img src="/logo-sopem.png" alt="SOPEM" style={styles.logoSopem} />
          <div style={styles.titleContent}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={styles.title}>Tableau de Bord {getRoleDisplay()}</h1>
              <span style={styles.roleBadge}>{getRoleDisplay()}</span>
            </div>
            <p style={styles.subtitle}>{formatDateTime(currentDateTime)}</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button type="button" style={styles.btnActualiser} onClick={() => { fetchKPIs(); fetchAllMouvements(); }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.borderColor = roleColor.start; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#bae6fd'; }}>
            <span>🔄</span> Actualiser
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Déconnexion"
            onMouseOver={(e) => { e.currentTarget.style.background = '#ffebe9'; e.currentTarget.style.borderColor = '#fecaca'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.borderColor = '#bae6fd'; }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}>⏻</span>
          </button>
          <div style={styles.userAvatar}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            {user?.nom ? user.nom.substring(0, 2).toUpperCase() : 'DG'}
          </div>
        </div>
      </div>

      <div style={styles.mainWrapper}>
        <div style={styles.layout}>
          <div style={styles.sidebar}>
            <div style={styles.sidebarSection}>
              <p style={styles.sectionTitle}>Consultation</p>
              
              <button type="button"
                style={activeSection === 'stock' ? styles.sidebarBtnPrimary : styles.sidebarBtn}
                onClick={() => setActiveSection('stock')}
                onMouseOver={(e) => { if (activeSection === 'stock') { e.currentTarget.style.transform = 'translateY(-2px)'; } else { e.currentTarget.style.background = '#f0f9ff'; } }}
                onMouseOut={(e) => { if (activeSection === 'stock') { e.currentTarget.style.transform = 'translateY(0)'; } else { e.currentTarget.style.background = 'transparent'; } }}>
                <div style={activeSection === 'stock' ? styles.btnIcon : styles.btnIconSecondary}>📊</div>
                <div style={styles.btnContent}>
                  <div style={activeSection === 'stock' ? styles.btnTitlePrimary : styles.btnTitle}>Stock temps réel</div>
                  <div style={activeSection === 'stock' ? styles.btnSubtitlePrimary : styles.btnSubtitle}>Vue d'ensemble</div>
                </div>
              </button>

              <button type="button"
                style={activeSection === 'historique' ? styles.sidebarBtnPrimary : styles.sidebarBtn}
                onClick={() => { setActiveSection('historique'); setShowHistorique(true); }}
                onMouseOver={(e) => { if (activeSection === 'historique') { e.currentTarget.style.transform = 'translateY(-2px)'; } else { e.currentTarget.style.background = '#f0f9ff'; } }}
                onMouseOut={(e) => { if (activeSection === 'historique') { e.currentTarget.style.transform = 'translateY(0)'; } else { e.currentTarget.style.background = 'transparent'; } }}>
                <div style={activeSection === 'historique' ? styles.btnIcon : styles.btnIconSecondary}>📋</div>
                <div style={styles.btnContent}>
                  <div style={activeSection === 'historique' ? styles.btnTitlePrimary : styles.btnTitle}>Historique</div>
                  <div style={activeSection === 'historique' ? styles.btnSubtitlePrimary : styles.btnSubtitle}>Tous les mouvements</div>
                </div>
              </button>

              <button type="button"
                style={activeSection === 'recherche' ? styles.sidebarBtnPrimary : styles.sidebarBtn}
                onClick={() => { 
                  setActiveSection('recherche'); 
                  setShowRechercheSpecifique(true);
                  setResultatsRecherche(null);
                  setReferenceRecherche('');
                }}
                onMouseOver={(e) => { if (activeSection === 'recherche') { e.currentTarget.style.transform = 'translateY(-2px)'; } else { e.currentTarget.style.background = '#f0f9ff'; } }}
                onMouseOut={(e) => { if (activeSection === 'recherche') { e.currentTarget.style.transform = 'translateY(0)'; } else { e.currentTarget.style.background = 'transparent'; } }}>
                <div style={activeSection === 'recherche' ? styles.btnIcon : styles.btnIconSecondary}>🔍</div>
                <div style={styles.btnContent}>
                  <div style={activeSection === 'recherche' ? styles.btnTitlePrimary : styles.btnTitle}>Recherche spécifique</div>
                  <div style={activeSection === 'recherche' ? styles.btnSubtitlePrimary : styles.btnSubtitle}>Par référence</div>
                </div>
              </button>

              <button type="button"
                style={activeSection === 'stock-produits' ? styles.sidebarBtnPrimary : styles.sidebarBtn}
                onClick={() => { 
                  setActiveSection('stock-produits'); 
                  setShowStockProduitsFinis(true);
                  chargerStockProduitsFinis();
                }}
                onMouseOver={(e) => { if (activeSection === 'stock-produits') { e.currentTarget.style.transform = 'translateY(-2px)'; } else { e.currentTarget.style.background = '#f0f9ff'; } }}
                onMouseOut={(e) => { if (activeSection === 'stock-produits') { e.currentTarget.style.transform = 'translateY(0)'; } else { e.currentTarget.style.background = 'transparent'; } }}>
                <div style={activeSection === 'stock-produits' ? styles.btnIcon : styles.btnIconSecondary}>📦</div>
                <div style={styles.btnContent}>
                  <div style={activeSection === 'stock-produits' ? styles.btnTitlePrimary : styles.btnTitle}>Stock Produits Semi-Finis</div>
                  <div style={activeSection === 'stock-produits' ? styles.btnSubtitlePrimary : styles.btnSubtitle}>Liste complète</div>
                </div>
              </button>
            </div>
          </div>

          <div style={styles.mainContent}>
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(10, 197, 255, 0.15)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 197, 255, 0.06)'; }}>
                <p style={styles.kpiLabel}>Entrées aujourd'hui</p>
                <p style={styles.kpiValue}>{kpis.loading ? '...' : kpis.entrees}</p>
              </div>
              <div style={styles.kpiCard}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(10, 197, 255, 0.15)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 197, 255, 0.06)'; }}>
                <p style={styles.kpiLabel}>Sorties aujourd'hui</p>
                <p style={styles.kpiValue}>{kpis.loading ? '...' : kpis.sorties}</p>
              </div>
              <div style={styles.kpiCard}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(10, 197, 255, 0.15)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 197, 255, 0.06)'; }}>
                <p style={styles.kpiLabel}>Alertes stock</p>
                <p style={styles.kpiValueDanger}>{kpis.loading ? '...' : kpis.alertes}</p>
              </div>
              <div style={styles.kpiCard}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(10, 197, 255, 0.15)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 197, 255, 0.06)'; }}>
                <p style={styles.kpiLabel}>Produits Semi-Finis</p>
                <p style={styles.kpiValue}>{kpis.loading ? '...' : kpis.total}</p>
              </div>
              <div style={{...styles.kpiCard, ...styles.kpiCardPrimary}}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 36px ${roleColor.start}60`; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 24px ${roleColor.start}50`; }}>
                <p style={styles.kpiLabelPrimary}>Stock Total</p>
                <p style={styles.kpiValuePrimary}>{kpis.loading ? '...' : kpis.stockTotal.toLocaleString()}</p>
              </div>
            </div>

            {/* GRAPHIQUE ENTRÉES VS SORTIES */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>📈 Entrées vs Sorties (6 mois)</h2>
              </div>
              {mouvementsData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Aucune donnée disponible
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={mouvementsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" />
                    <XAxis 
                      dataKey="mois" 
                      style={{ fontSize: '12px', fontWeight: '600' }} 
                      stroke="#64748b" 
                    />
                    <YAxis 
                      style={{ fontSize: '12px', fontWeight: '600' }} 
                      stroke="#64748b"
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#fff', 
                        border: '1px solid #bae6fd', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(10, 197, 255, 0.15)'
                      }}
                      formatter={(value) => value.toLocaleString()}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="entrees" 
                      stroke="#1a7f37" 
                      strokeWidth={3}
                      name="Entrées"
                      dot={{ fill: '#1a7f37', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sorties" 
                      stroke="#cf222e" 
                      strokeWidth={3}
                      name="Sorties"
                      dot={{ fill: '#cf222e', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>⚠️ Alertes Stock Critique</h2>
                <button type="button" style={styles.btnLink} onClick={() => setShowAlertes(true)}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#bae6fd'; e.currentTarget.style.borderColor = '#7dd3fc'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.borderColor = '#bae6fd'; }}>
                  Tout voir →
                </button>
              </div>
              <div style={styles.alertsList}>
                {kpis.loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>⏳ Chargement des alertes...</div>
                ) : kpis.alertesDetails.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#1a7f37' }}>✅ Aucune alerte stock - Tout est normal!</div>
                ) : (
                  kpis.alertesDetails.slice(0, 5).map((alert, i) => (
                    <div key={i} style={styles.alertItem}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                      <div>
                        <p style={styles.alertRef}>Ref: {alert.reference}</p>
                        <p style={styles.alertLocation}>📍 {alert.emplacement}</p>
                      </div>
                      <div style={styles.alertQuantity}>
                        <p style={styles.alertValue}>{alert.stockActuel.toLocaleString()}</p>
                        <p style={styles.alertUnit}>pièces</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>📊 Derniers Mouvements</h2>
              </div>
              <div style={styles.tableContainer}>
                {kpis.loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>⏳ Chargement...</div>
                ) : kpis.derniersMovements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Aucun mouvement récent</div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Heure</th>
                        <th style={styles.th}>Type</th>
                        <th style={styles.th}>Référence</th>
                        <th style={styles.th}>Opération</th>
                        <th style={styles.th}>Bac</th>
                        <th style={styles.thRight}>Quantité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.derniersMovements.map((mvt, i) => (
                        <tr key={i}>
                          <td style={styles.tdMuted}>{mvt.date ? new Date(mvt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                          <td style={styles.td}>
                            <span style={mvt.type === 'ENTREE' ? styles.badgeSuccess : styles.badgeDanger}>
                              {mvt.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                            </span>
                          </td>
                          <td style={styles.tdBold}>{mvt.reference}</td>
                          <td style={styles.td}>{mvt.nom_operation || '-'}</td>
                          <td style={styles.td}>{mvt.bac?.code || '-'}</td>
                          <td style={mvt.type === 'ENTREE' ? styles.tdRightSuccess : styles.tdRightDanger}>
                            {mvt.type === 'ENTREE' ? '+' : '-'}{mvt.quantite.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showHistorique && <Historique onClose={() => setShowHistorique(false)} />}
      
      {showAlertes && (
        <div style={styles.overlay} onClick={() => setShowAlertes(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>⚠️ Toutes les Alertes Stock</h2>
              <button onClick={() => setShowAlertes(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '2rem 2.5rem' }}>
              {kpis.alertesDetails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#1a7f37' }}>
                  ✅ Aucune alerte stock - Tout est normal!
                </div>
              ) : (
                <div style={styles.alertsList}>
                  {kpis.alertesDetails.map((alert, i) => (
                    <div key={i} style={styles.alertItem}>
                      <div>
                        <p style={styles.alertRef}>Ref: {alert.reference}</p>
                        <p style={{...styles.alertLocation, marginTop: '5px'}}>{alert.designation}</p>
                        <p style={styles.alertLocation}>📍 {alert.emplacement}</p>
                      </div>
                      <div style={styles.alertQuantity}>
                        <p style={styles.alertValue}>{alert.stockActuel.toLocaleString()}</p>
                        <p style={styles.alertUnit}>pièces</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRechercheSpecifique && (
        <div style={styles.overlay} onClick={() => setShowRechercheSpecifique(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>🔍 Recherche Spécifique</h2>
              <button onClick={() => setShowRechercheSpecifique(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid #bae6fd', background: '#f0f9ff' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Entrez la référence du produit..."
                  value={referenceRecherche}
                  onChange={(e) => setReferenceRecherche(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRechercheSpecifique()}
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    border: '2px solid #bae6fd',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    outline: 'none',
                  }}
                />
                <button onClick={handleRechercheSpecifique} disabled={loadingRecherche}
                  style={{
                    padding: '14px 28px',
                    background: `linear-gradient(135deg, ${roleColor.start} 0%, ${roleColor.end} 100%)`,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '15px',
                    cursor: loadingRecherche ? 'not-allowed' : 'pointer',
                    opacity: loadingRecherche ? 0.7 : 1,
                  }}>
                  {loadingRecherche ? '⏳' : '🔍 Rechercher'}
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '2rem 2.5rem' }}>
              {!resultatsRecherche ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                  <div style={{ fontSize: '64px', marginBottom: '1rem' }}>🔍</div>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>Entrez une référence pour rechercher</p>
                </div>
              ) : !resultatsRecherche.found ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#dc2626' }}>
                  <div style={{ fontSize: '64px', marginBottom: '1rem' }}>❌</div>
                  <p style={{ fontSize: '18px', fontWeight: '700', marginBottom: '0.5rem' }}>Produit non trouvé</p>
                  <p style={{ color: '#64748b' }}>Aucun mouvement pour la référence "{referenceRecherche}"</p>
                </div>
              ) : (
                <div>
                  <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Référence</p>
                        <p style={{ fontSize: '24px', fontWeight: '800', color: '#0f2942', margin: 0 }}>{resultatsRecherche.produit.reference}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Désignation</p>
                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#0f2942', margin: 0 }}>{resultatsRecherche.produit.designation}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '1.5rem', color: '#0f2942', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      📊 Stock par Opération
                      <span style={{ fontSize: '12px', background: '#ddf4ff', color: '#0969da', padding: '4px 10px', borderRadius: '8px', fontWeight: '700' }}>
                        {resultatsRecherche.operations.length} opération(s)
                      </span>
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f0f9ff' }}>
                          <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #bae6fd', letterSpacing: '0.5px' }}>Opération</th>
                          <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #bae6fd', letterSpacing: '0.5px' }}>Quantité en Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultatsRecherche.operations.map((op, i) => (
                          <tr key={i} style={{ transition: 'background 0.2s ease' }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f0f9ff'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '18px 20px', borderBottom: '1px solid #e0f2fe' }}>
                              <span style={{ background: '#ddf4ff', color: '#0969da', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '15px' }}>
                                {op.nom}
                              </span>
                            </td>
                            <td style={{ padding: '18px 20px', borderBottom: '1px solid #e0f2fe', textAlign: 'right', fontWeight: '800', fontSize: '22px', color: op.stock < 100 ? '#dc2626' : op.stock < 500 ? '#d97706' : '#1a7f37' }}>
                              {op.stock.toLocaleString()}
                              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginLeft: '8px' }}>pièces</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #bae6fd 100%)' }}>
                          <td style={{ padding: '20px', borderTop: '3px solid #0969da', fontSize: '16px', fontWeight: '800', color: '#0f2942' }}>TOTAL STOCK</td>
                          <td style={{ padding: '20px', textAlign: 'right', borderTop: '3px solid #0969da', fontSize: '28px', fontWeight: '900', color: '#0969da', letterSpacing: '-1px' }}>
                            {resultatsRecherche.operations.reduce((sum, op) => sum + op.stock, 0).toLocaleString()}
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginLeft: '10px' }}>pièces</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showStockProduitsFinis && (
        <div style={styles.overlay} onClick={() => setShowStockProduitsFinis(false)}>
          <div style={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>📦 Stock Produits Semi-Finis</h2>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '8px 0 0 0', fontWeight: '500' }}>
                  Liste complète triée par quantité • <span style={{ color: '#dc2626', fontWeight: '700', marginLeft: '8px' }}>⚠️ Rouge si &gt; 10000 pièces</span>
                </p>
              </div>
              <button onClick={() => setShowStockProduitsFinis(false)} style={styles.closeBtn}>✕</button>
            </div>
            <div style={{ padding: '1.5rem 2.5rem', background: '#f0f9ff', borderBottom: '1px solid #bae6fd', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Total Produits</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f2942' }}>{stockProduits.length}</div>
              </div>
              <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Stock Total</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: roleColor.start }}>{stockProduits.reduce((sum, p) => sum + p.stock, 0).toLocaleString()}</div>
              </div>
              <div style={{ background: '#fff5f5', padding: '1.25rem', borderRadius: '12px', border: '2px solid #fecaca', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Alertes (&gt 10000)</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626' }}>{stockProduits.filter(p => p.stock > 10000).length}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {loadingStockProduits ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                  <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⏳</div>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>Chargement en cours...</p>
                </div>
              ) : stockProduits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                  <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📦</div>
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>Aucun produit trouvé</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f0f9ff', zIndex: 10 }}>
                    <tr>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #bae6fd', letterSpacing: '0.6px' }}>#</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #bae6fd', letterSpacing: '0.6px' }}>Référence</th>
                      <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #bae6fd', letterSpacing: '0.6px' }}>Désignation</th>
                      <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #bae6fd', letterSpacing: '0.6px' }}>Quantité en Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockProduits.map((produit, index) => {
                      const isAlerte = produit.stock > 10000;
                      return (
                        <tr key={produit.reference} style={{ background: isAlerte ? '#fff5f5' : 'transparent', transition: 'all 0.2s ease' }}
                          onMouseOver={(e) => e.currentTarget.style.background = isAlerte ? '#fee2e2' : '#f0f9ff'}
                          onMouseOut={(e) => e.currentTarget.style.background = isAlerte ? '#fff5f5' : 'transparent'}>
                          <td style={{ padding: '18px 24px', borderBottom: '1px solid #e0f2fe', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>{index + 1}</td>
                          <td style={{ padding: '18px 24px', borderBottom: '1px solid #e0f2fe', fontWeight: '700', fontSize: '15px', color: isAlerte ? '#dc2626' : '#0f2942' }}>
                            {produit.reference}
                            {isAlerte && <span style={{ marginLeft: '10px', fontSize: '16px' }}>⚠️</span>}
                          </td>
                          <td style={{ padding: '18px 24px', borderBottom: '1px solid #e0f2fe', fontSize: '14px', color: isAlerte ? '#991b1b' : '#0f2942', fontWeight: isAlerte ? '600' : '500' }}>{produit.designation}</td>
                          <td style={{ padding: '18px 24px', borderBottom: '1px solid #e0f2fe', textAlign: 'right', fontWeight: '800', fontSize: isAlerte ? '20px' : '18px', color: isAlerte ? '#dc2626' : '#0f2942' }}>
                            {produit.stock.toLocaleString()}
                            <span style={{ fontSize: '13px', fontWeight: '600', color: isAlerte ? '#991b1b' : '#64748b', marginLeft: '8px' }}>pièces</span>
                            {isAlerte && (
                              <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ALERTE SURSTOCK</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDirecteurs;