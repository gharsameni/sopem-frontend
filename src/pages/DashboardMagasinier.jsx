import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import AjouterProduit from './AjouterProduit';
import ListeProduits from './ListeProduits';
import AjouterEntree from './AjouterEntree';
import AjouterSortie from './AjouterSortie';
import GestionMouvements from './GestionMouvements';
import Historique from './Historique';
import Bac from './Bac';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const DashboardMagasinier = ({ user }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [showAjouterProduit, setShowAjouterProduit] = useState(false);
  const [showListeProduits, setShowListeProduits] = useState(false);
  const [showEntree, setShowEntree] = useState(false);
  const [showSortie, setShowSortie] = useState(false);
  const [showGestionMouvements, setShowGestionMouvements] = useState(false);
  const [showHistorique, setShowHistorique] = useState(false);
  const [showAlertes, setShowAlertes] = useState(false);
  const [showBacs, setShowBacs] = useState(false);
  const [activeSection, setActiveSection] = useState('ajouter');

  const [showImprimerModal, setShowImprimerModal] = useState(false);
  const [mouvementsImprimer, setMouvementsImprimer] = useState([]);
  const [loadingImprimer, setLoadingImprimer] = useState(false);
  
  const [allMouvements, setAllMouvements] = useState([]);
  const [topBacsData, setTopBacsData] = useState([]);

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
    fetchTopBacs();
  }, []);

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

  const fetchTopBacs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/mouvements/top-bacs`);
      if (res.ok) {
        const data = await res.json();
        setTopBacsData(data);
      }
    } catch (error) {
      console.error('Erreur chargement top bacs:', error);
    }
  };

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
      toast.error('Erreur chargement des statistiques');
      setKpis(prev => ({ ...prev, loading: false }));
    }
  };

  const handleOpenImprimer = async () => {
    setShowImprimerModal(true);
    setLoadingImprimer(true);
    try {
      const res = await fetch(`${API_URL}/api/mouvements/recents`);
      if (res.ok) {
        const data = await res.json();
        setMouvementsImprimer(data.filter(m => m.type === 'ENTREE'));
      }
    } catch (err) { 
      console.error(err);
      toast.error('Erreur chargement des mouvements');
    }
    finally { setLoadingImprimer(false); }
  };

  const getStockActuel = async (reference, bacCode) => {
    try {
const res = await fetch(`${API_URL}/api/mouvements`);
      if (!res.ok) return null;
      const all = await res.json();
      const filtered = all.filter(m => m.reference === reference && m.bac?.code === bacCode);
      const entrees = filtered.filter(m => m.type === 'ENTREE').reduce((s, m) => s + m.quantite, 0);
      const sorties = filtered.filter(m => m.type === 'SORTIE').reduce((s, m) => s + m.quantite, 0);
      return entrees - sorties;
    } catch { return null; }
  };

  const imprimerEtiquette = (data) => {
    const win = window.open('', '_blank', 'width:420,height=320');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Étiquette - ${data.reference}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .etiquette { border: 3px solid #0ac5ff; border-radius: 8px; padding: 20px 24px; width: 340px; text-align: center; }
            .logo { font-size: 12px; font-weight: bold; color: #0ac5ff; letter-spacing: 2px; margin-bottom: 8px; }
            .divider { border: none; border-top: 1px solid #bae6fd; margin: 8px 0; }
            .reference { font-size: 28px; font-weight: 900; letter-spacing: 2px; margin: 6px 0; color: #0f2942; }
            .designation { font-size: 13px; color: #475569; margin-bottom: 10px; }
            .infos { display: flex; justify-content: space-around; margin-top: 12px; }
            .info-block { text-align: center; }
            .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 4px; }
            .info-value { font-size: 22px; font-weight: 800; color: #0ac5ff; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="etiquette">
            <div class="logo">SOPEM</div>
            <hr class="divider"/>
            <div class="reference">${data.reference}</div>
            <div class="designation">${data.designation || '-'}</div>
            <hr class="divider"/>
            <div class="infos">
              <div class="info-block">
                <div class="info-label">Bac</div>
                <div class="info-value">${data.bac}</div>
              </div>
              <div class="info-block">
                <div class="info-label">Quantité</div>
                <div class="info-value">${data.stockActuel}</div>
              </div>
            </div>
          </div>
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleImprimerAvecStock = async (reference, designation, bacCode) => {
    const stockActuel = await getStockActuel(reference, bacCode);
    imprimerEtiquette({
      reference,
      designation,
      bac: bacCode,
      stockActuel: stockActuel !== null ? stockActuel.toLocaleString() : '—',
    });
  };

  const handleExportPDF = async () => {
    try {
  const res = await fetch(`${API_URL}/api/mouvements`);
      if (!res.ok) throw new Error('Erreur chargement données');
      const mouvements = await res.json();

      const data = mouvements.map(m => ({
        reference: m.reference,
        designation: m.designation,
        nom_operation: m.nom_operation || '—',
        type: m.type,
        quantite: m.quantite,
        bac: m.bac?.code || '—',
        date: m.date ? new Date(m.date).toLocaleDateString('fr-FR') : '—',
      })).sort((a, b) => a.reference.localeCompare(b.reference));

      const date = new Date().toLocaleDateString('fr-FR');

      const rows = data.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="font-weight:700">${p.reference}</td>
          <td>${p.designation}</td>
          <td>${p.nom_operation}</td>
          <td style="text-align:center">
            <span style="padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;background:${p.type === 'ENTREE' ? '#dafbe1' : '#ffebe9'};color:${p.type === 'ENTREE' ? '#1a7f37' : '#cf222e'}">
              ${p.type === 'ENTREE' ? '↓ Entrée' : '↑ Sortie'}
            </span>
          </td>
          <td style="text-align:right;font-weight:700">${p.quantite.toLocaleString()}</td>
          <td>${p.bac}</td>
          <td>${p.date}</td>
        </tr>`).join('');

      const win = window.open('', '_blank');
      win.document.write(`<!DOCTYPE html><html><head><title>Stock SOPEM</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;padding:40px;color:#0f2942;font-size:12px}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #0ac5ff}
        .logo{font-size:24px;font-weight:900;letter-spacing:2px;color:#0ac5ff}
        .logo span{display:block;font-size:11px;color:#64748b;font-weight:400;margin-top:4px}
        .meta{text-align:right;font-size:12px;color:#64748b;line-height:1.6}
        h1{font-size:16px;font-weight:700;margin-bottom:6px}
        .subtitle{font-size:12px;color:#64748b;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{text-align:left;padding:9px 8px;background:#0ac5ff;color:#fff;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700}
        td{padding:8px 8px;border-bottom:1px solid #e0f2fe;vertical-align:top}
        tr:nth-child(even) td{background:#f8fafc}
        .footer{margin-top:24px;font-size:10px;color:#64748b;text-align:center;border-top:1px solid #e0f2fe;padding-top:12px}
        @media print{body{padding:20px}}
      </style>
      </head><body>
      <div class="header">
        <div class="logo">SOPEM<span>Gestion du stock semi-fini</span></div>
        <div class="meta">
          <div><strong>Date :</strong> ${date}</div>
          <div><strong>Total mouvements :</strong> ${data.length}</div>
        </div>
      </div>
      <h1>Rapport des mouvements — Produits semi-finis</h1>
      <p class="subtitle">Détail complet de tous les mouvements</p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Référence</th>
            <th>Désignation</th>
            <th>Opération</th>
            <th style="text-align:center">Type</th>
            <th style="text-align:right">Quantité</th>
            <th>Bac</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">SOPEM — Rapport généré le ${date} — Confidentiel</div>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`);
      win.document.close();
    } catch (err) { 
      toast.error('Erreur export PDF: ' + err.message);
    }
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
      background: 'linear-gradient(135deg, #0f2942 0%, #0ac5ff 100%)',
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
      background: 'linear-gradient(135deg, #0ac5ff 0%, #0f2942 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '15px',
      fontWeight: '700',
      color: '#fff',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 12px rgba(10, 197, 255, 0.3)',
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
      background: 'linear-gradient(135deg, #0ac5ff 0%, #0f2942 100%)',
      border: 'none',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 6px 20px rgba(10, 197, 255, 0.35)',
      width: '100%',
    },
    sidebarBtnSuccess: {
      padding: '16px 18px',
      textAlign: 'left',
      background: 'linear-gradient(135deg, #1a7f37 0%, #138636 100%)',
      border: 'none',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 6px 20px rgba(26, 127, 55, 0.35)',
      width: '100%',
    },
    sidebarBtnDanger: {
      padding: '16px 18px',
      textAlign: 'left',
      background: 'linear-gradient(135deg, #cf222e 0%, #a40e26 100%)',
      border: 'none',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 6px 20px rgba(207, 34, 46, 0.35)',
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
    quickActionsTitle: {
      fontSize: '11px',
      fontWeight: '700',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      margin: '14px 18px 10px 18px',
    },
    quickActionBtn: {
      padding: '13px 18px',
      textAlign: 'left',
      fontSize: '13px',
      background: 'transparent',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: '#0f2942',
      width: '100%',
      fontWeight: '600',
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
      background: 'linear-gradient(135deg, #0ac5ff 0%, #0f2942 100%)',
      border: 'none',
      boxShadow: '0 8px 24px rgba(10, 197, 255, 0.3)',
    },
    kpiLabel: { fontSize: '12px', color: '#64748b', margin: '0 0 14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
    kpiLabelPrimary: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', margin: '0 0 14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
    kpiValue: { fontSize: '36px', fontWeight: '800', margin: '0', color: '#0f2942', letterSpacing: '-1.5px' },
    kpiValuePrimary: { fontSize: '36px', fontWeight: '800', margin: '0', color: '#fff', letterSpacing: '-1.5px' },
    kpiValueDanger: { fontSize: '36px', fontWeight: '800', margin: '0', color: '#f85149', letterSpacing: '-1.5px' },
    card: { background: '#fff', borderRadius: '16px', border: '1px solid #bae6fd', padding: '2rem', boxShadow: '0 2px 8px rgba(10, 197, 255, 0.06)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '2px solid #f0f9ff' },
    cardTitle: { fontSize: '19px', fontWeight: '700', margin: '0', color: '#0f2942' },
    btnLink: { fontSize: '13px', padding: '10px 18px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease', color: '#0f2942', fontWeight: '600' },
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
    badgeInfo: { padding: '7px 14px', borderRadius: '14px', fontSize: '12px', display: 'inline-block', background: '#ddf4ff', color: '#0969da', fontWeight: '700' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 41, 66, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' },
    modalContent: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(10, 197, 255, 0.3)' },
    modalHeader: { padding: '1.5rem 2rem', borderBottom: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 },
    modalTitle: { fontSize: '20px', fontWeight: '700', margin: 0, color: '#0f2942' },
    closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', padding: '4px', transition: 'color 0.2s ease' },
    modalBody: { padding: '2rem' },
  };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const coutTotal = data.coutTotal || 0;
    
    return (
      <div style={{
        background: '#fff',
        border: '1px solid #bae6fd',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 24px rgba(10, 197, 255, 0.2)'
      }}>
        <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '12px', color: '#0f2942' }}>
          📦 {data.codeBac}
        </p>
        <p style={{ fontSize: '13px', marginBottom: '6px', color: '#64748b' }}>
          <strong>Produit:</strong> {data.referenceProduit}
        </p>
        <p style={{ fontSize: '13px', marginBottom: '6px', color: '#64748b' }}>
          <strong>Stock:</strong> {data.quantite.toLocaleString()} pcs
        </p>
        <p style={{ fontSize: '14px', fontWeight: '700', color: '#0ac5ff', marginTop: '8px' }}>
          💰 Coût total: {coutTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT
        </p>
      </div>
    );
  }
  return null;
};

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <img src="/logo-sopem.png" alt="SOPEM" style={styles.logoSopem} />
          <div style={styles.titleContent}>
            <h1 style={styles.title}>Gestion du Stock</h1>
            <p style={styles.subtitle}>{formatDateTime(currentDateTime)}</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button type="button" style={styles.btnActualiser} onClick={() => { fetchKPIs(); fetchAllMouvements(); fetchTopBacs(); }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.borderColor = '#0ac5ff'; }}
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
            {user?.nom ? user.nom.substring(0, 2).toUpperCase() : 'AM'}
          </div>
        </div>
      </div>

      <div style={styles.mainWrapper}>
        <div style={styles.layout}>
          <div style={styles.sidebar}>
            <div style={styles.sidebarSection}>
              <button type="button"
                style={activeSection === 'ajouter' ? styles.sidebarBtnPrimary : styles.sidebarBtn}
                onClick={() => { setActiveSection('ajouter'); setShowAjouterProduit(true); }}
                onMouseOver={(e) => { if (activeSection === 'ajouter') { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(10, 197, 255, 0.45)'; } else { e.currentTarget.style.background = '#f0f9ff'; } }}
                onMouseOut={(e) => { if (activeSection === 'ajouter') { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(10, 197, 255, 0.35)'; } else { e.currentTarget.style.background = 'transparent'; } }}>
                <div style={activeSection === 'ajouter' ? styles.btnIcon : styles.btnIconSecondary}>📦</div>
                <div style={styles.btnContent}>
                  <div style={activeSection === 'ajouter' ? styles.btnTitlePrimary : styles.btnTitle}>Ajouter produit</div>
                  <div style={activeSection === 'ajouter' ? styles.btnSubtitlePrimary : styles.btnSubtitle}>Ajout d'un produit</div>
                </div>
              </button>

              <button type="button"
                style={activeSection === 'entree' ? styles.sidebarBtnSuccess : styles.sidebarBtn}
                onClick={() => { setActiveSection('entree'); setShowEntree(true); }}
                onMouseOver={(e) => { if (activeSection === 'entree') { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(26, 127, 55, 0.45)'; } else { e.currentTarget.style.background = '#f0f9ff'; } }}
                onMouseOut={(e) => { if (activeSection === 'entree') { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26, 127, 55, 0.35)'; } else { e.currentTarget.style.background = 'transparent'; } }}>
                <div style={activeSection === 'entree' ? styles.btnIcon : styles.btnIconSecondary}>➕</div>
                <div style={styles.btnContent}>
                  <div style={activeSection === 'entree' ? styles.btnTitlePrimary : styles.btnTitle}>Ajouter Entrée</div>
                  <div style={activeSection === 'entree' ? styles.btnSubtitlePrimary : styles.btnSubtitle}>Stock entrant</div>
                </div>
              </button>

              <button type="button"
                style={activeSection === 'sortie' ? styles.sidebarBtnDanger : styles.sidebarBtn}
                onClick={() => { setActiveSection('sortie'); setShowSortie(true); }}
                onMouseOver={(e) => { if (activeSection === 'sortie') { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(207, 34, 46, 0.45)'; } else { e.currentTarget.style.background = '#f0f9ff'; } }}
                onMouseOut={(e) => { if (activeSection === 'sortie') { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(207, 34, 46, 0.35)'; } else { e.currentTarget.style.background = 'transparent'; } }}>
                <div style={activeSection === 'sortie' ? styles.btnIcon : styles.btnIconSecondary}>➖</div>
                <div style={styles.btnContent}>
                  <div style={activeSection === 'sortie' ? styles.btnTitlePrimary : styles.btnTitle}>Ajouter Sortie</div>
                  <div style={activeSection === 'sortie' ? styles.btnSubtitlePrimary : styles.btnSubtitle}>Stock sortant</div>
                </div>
              </button>

              <button type="button"
                style={activeSection === 'gestion' ? styles.sidebarBtnPrimary : styles.sidebarBtn}
                onClick={() => { setActiveSection('gestion'); setShowGestionMouvements(true); }}
                onMouseOver={(e) => { if (activeSection === 'gestion') { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(10, 197, 255, 0.45)'; } else { e.currentTarget.style.background = '#f0f9ff'; } }}
                onMouseOut={(e) => { if (activeSection === 'gestion') { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(10, 197, 255, 0.35)'; } else { e.currentTarget.style.background = 'transparent'; } }}>
                <div style={activeSection === 'gestion' ? styles.btnIcon : styles.btnIconSecondary}>⚙️</div>
                <div style={styles.btnContent}>
                  <div style={activeSection === 'gestion' ? styles.btnTitlePrimary : styles.btnTitle}>Gestion Mouvements</div>
                  <div style={activeSection === 'gestion' ? styles.btnSubtitlePrimary : styles.btnSubtitle}>Modifier / Supprimer</div>
                </div>
              </button>

              <button type="button"
                style={activeSection === 'liste' ? styles.sidebarBtnPrimary : styles.sidebarBtn}
                onClick={() => { setActiveSection('liste'); setShowListeProduits(true); }}
                onMouseOver={(e) => { if (activeSection === 'liste') { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(10, 197, 255, 0.45)'; } else { e.currentTarget.style.background = '#f0f9ff'; } }}
                onMouseOut={(e) => { if (activeSection === 'liste') { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(10, 197, 255, 0.35)'; } else { e.currentTarget.style.background = 'transparent'; } }}>
                <div style={activeSection === 'liste' ? styles.btnIcon : styles.btnIconSecondary}>📋</div>
                <div style={styles.btnContent}>
                  <div style={activeSection === 'liste' ? styles.btnTitlePrimary : styles.btnTitle}>Liste produits</div>
                  <div style={activeSection === 'liste' ? styles.btnSubtitlePrimary : styles.btnSubtitle}>Tous les produits</div>
                </div>
              </button>

              <button type="button"
                style={activeSection === 'historique' ? styles.sidebarBtnPrimary : styles.sidebarBtn}
                onClick={() => { setActiveSection('historique'); setShowHistorique(true); }}
                onMouseOver={(e) => { if (activeSection === 'historique') { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(10, 197, 255, 0.45)'; } else { e.currentTarget.style.background = '#f0f9ff'; } }}
                onMouseOut={(e) => { if (activeSection === 'historique') { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(10, 197, 255, 0.35)'; } else { e.currentTarget.style.background = 'transparent'; } }}>
                <div style={activeSection === 'historique' ? styles.btnIcon : styles.btnIconSecondary}>📋</div>
                <div style={styles.btnContent}>
                  <div style={activeSection === 'historique' ? styles.btnTitlePrimary : styles.btnTitle}>Historique</div>
                  <div style={activeSection === 'historique' ? styles.btnSubtitlePrimary : styles.btnSubtitle}>Tous les mouvements</div>
                </div>
              </button>
            </div>

            <div style={styles.sidebarSection}>
              <p style={styles.quickActionsTitle}>Actions rapides</p>
              <button type="button" style={styles.quickActionBtn} onClick={handleOpenImprimer}
                onMouseOver={(e) => e.currentTarget.style.background = '#f0f9ff'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                🏷️ Imprimer étiquette
              </button>
              <button type="button" style={styles.quickActionBtn} onClick={handleExportPDF}
                onMouseOver={(e) => e.currentTarget.style.background = '#f0f9ff'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                📄 Export stock PDF
              </button>
              <button type="button" style={styles.quickActionBtn} onClick={() => setShowBacs(true)}
                onMouseOver={(e) => e.currentTarget.style.background = '#f0f9ff'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                📦 Gérer les bacs
              </button>
            </div>
          </div>

          <div style={styles.mainContent}>
            {/* KPIs */}
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
                <p style={styles.kpiLabel}>Alertes stock ≥10000</p>
                <p style={styles.kpiValueDanger}>{kpis.loading ? '...' : kpis.alertes}</p>
              </div>
              <div style={styles.kpiCard}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(10, 197, 255, 0.15)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 197, 255, 0.06)'; }}>
                <p style={styles.kpiLabel}>Produits Semi-Finis</p>
                <p style={styles.kpiValue}>{kpis.loading ? '...' : kpis.total}</p>
              </div>
              <div style={{...styles.kpiCard, ...styles.kpiCardPrimary}}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 36px rgba(10, 197, 255, 0.45)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(10, 197, 255, 0.3)'; }}>
                <p style={styles.kpiLabelPrimary}>Stock Total</p>
                <p style={styles.kpiValuePrimary}>{kpis.loading ? '...' : kpis.stockTotal.toLocaleString()}</p>
              </div>
            </div>

            {/* Top 10 Bacs */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>📦 Top 10 Bacs par Stock</h2>
              </div>
              {topBacsData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Aucune donnée disponible
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={topBacsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" />
                    <XAxis 
                      dataKey="codeBac" 
                      style={{ fontSize: '13px', fontWeight: '600' }} 
                      stroke="#64748b" 
                    />
                    <YAxis 
                      style={{ fontSize: '12px', fontWeight: '600' }} 
                      stroke="#64748b"
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="quantite" 
                      fill="url(#colorGradient)" 
                      radius={[8, 8, 0, 0]}
                      label={{
                        position: 'top',
                        style: { fontSize: '13px', fontWeight: '700', fill: '#0ac5ff' },
                        formatter: (value) => value.toLocaleString()
                      }}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ac5ff" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0f2942" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Alertes */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>⚠️ Alertes Stock ≥ 10,000 pcs</h2>
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
                  kpis.alertesDetails.slice(0, 3).map((alert, i) => (
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

            {/* Derniers Mouvements */}
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

      {/* Modals */}
      {showAlertes && (
        <div style={styles.modalOverlay} onClick={() => setShowAlertes(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>⚠️ Toutes les Alertes Stock ≥ 10,000</h2>
              <button style={styles.closeBtn} onClick={() => setShowAlertes(false)}
                onMouseOver={(e) => e.currentTarget.style.color = '#0f2942'}
                onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}>×</button>
            </div>
            <div style={styles.modalBody}>
              {kpis.alertesDetails.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#1a7f37' }}>✅ Aucune alerte stock - Tout est normal!</div>
              ) : (
                <div style={styles.alertsList}>
                  {kpis.alertesDetails.map((alert, i) => (
                    <div key={i} style={styles.alertItem}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.transform = 'translateX(0)'; }}>
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

      {showImprimerModal && (
        <div style={styles.modalOverlay} onClick={() => setShowImprimerModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>🏷️ Imprimer une étiquette</h2>
              <button style={styles.closeBtn} onClick={() => setShowImprimerModal(false)}
                onMouseOver={(e) => e.currentTarget.style.color = '#0f2942'}
                onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}>×</button>
            </div>
            <div style={styles.modalBody}>
              {loadingImprimer ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>⏳ Chargement...</div>
              ) : mouvementsImprimer.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Aucune entrée disponible</div>
              ) : (
                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Référence', 'Désignation', 'Bac', 'Action'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '12px 10px', fontWeight: '700', color: '#64748b', borderBottom: '2px solid #bae6fd', fontSize: '12px', textTransform: 'uppercase', background: '#f0f9ff' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mouvementsImprimer.map((mvt) => (
                      <tr key={mvt.id_mouvement}>
                        <td style={{ padding: '14px 10px', borderBottom: '1px solid #e0f2fe', fontWeight: '700' }}>{mvt.reference}</td>
                        <td style={{ padding: '14px 10px', borderBottom: '1px solid #e0f2fe' }}>{mvt.designation}</td>
                        <td style={{ padding: '14px 10px', borderBottom: '1px solid #e0f2fe' }}>{mvt.bac?.code || '-'}</td>
                        <td style={{ padding: '14px 10px', borderBottom: '1px solid #e0f2fe' }}>
                          <button type="button"
                            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600', border: 'none', background: '#1a7f37', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                            onClick={() => handleImprimerAvecStock(mvt.reference, mvt.designation, mvt.bac?.code || '-')}
                            onMouseOver={(e) => e.currentTarget.style.background = '#138636'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#1a7f37'}>
                            🏷️ Imprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showAjouterProduit && (
        <AjouterProduit
          onSuccess={() => { 
            setShowAjouterProduit(false); 
            fetchKPIs(); 
            fetchAllMouvements();
            fetchTopBacs();
            toast.success('✅ Produit ajouté avec succès!'); 
          }}
          onClose={() => setShowAjouterProduit(false)} />
      )}
      {showListeProduits && <ListeProduits onClose={() => setShowListeProduits(false)} />}
      {showEntree && (
        <AjouterEntree 
          onClose={() => setShowEntree(false)}
          onSuccess={() => { 
            setShowEntree(false); 
            fetchKPIs(); 
            fetchAllMouvements();
            fetchTopBacs();
            toast.success('✅ Entrée enregistrée avec succès!'); 
          }} />
      )}
      {showSortie && (
        <AjouterSortie 
          onClose={() => setShowSortie(false)}
          onSuccess={() => { 
            setShowSortie(false); 
            fetchKPIs(); 
            fetchAllMouvements();
            fetchTopBacs();
            toast.success('✅ Sortie enregistrée avec succès!'); 
          }} />
      )}
      {showHistorique && <Historique onClose={() => setShowHistorique(false)} />}
      {showGestionMouvements && (
        <GestionMouvements 
          onClose={() => {
            setShowGestionMouvements(false);
            fetchKPIs();
            fetchAllMouvements();
            fetchTopBacs();
          }} 
        />
      )}
      {showBacs && <Bac onClose={() => setShowBacs(false)} />}
    </div>
  );
};

export default DashboardMagasinier;