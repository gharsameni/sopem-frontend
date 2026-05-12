import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const Historique = ({ onClose }) => {
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreType, setFiltreType] = useState('TOUS');
  const [searchTerm, setSearchTerm] = useState('');
  const [triPar, setTriPar] = useState('date'); // 'date', 'cout', 'quantite'

  useEffect(() => {
    loadMouvements();
  }, []);

  const loadMouvements = async () => {
    setLoading(true);
    try {
  const response = await fetch(`${API_URL}/api/mouvements`);
if (!response.ok) throw new Error('Erreur chargement');
const data = await response.json();
const dataAvecCout = data.map(m => ({
  ...m,
  coutTotal: (m.cout || 0) * (m.quantite || 0)
}));
setMouvements(dataAvecCout);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const mouvementsFiltres = getMouvementsFiltres();
    
    const rows = mouvementsFiltres.map((m, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${m.date ? new Date(m.date).toLocaleString('fr-FR') : '-'}</td>
        <td style="text-align:center">
          <span style="padding:4px 12px;border-radius:12px;font-size:11px;font-weight:700;background:${m.type === 'ENTREE' ? '#dafbe1' : '#ffebe9'};color:${m.type === 'ENTREE' ? '#1a7f37' : '#cf222e'}">
            ${m.type === 'ENTREE' ? '↓ Entrée' : '↑ Sortie'}
          </span>
        </td>
        <td style="font-weight:700">${m.reference}</td>
        <td>${m.designation || '-'}</td>
        <td>${m.nom_operation || '-'}</td>
        <td>${m.bac?.code || '-'}</td>
        <td style="text-align:right;font-weight:700;color:${m.type === 'ENTREE' ? '#1a7f37' : '#cf222e'}">
          ${m.type === 'ENTREE' ? '+' : '-'}${m.quantite.toLocaleString()}
        </td>
        <td style="text-align:right;font-weight:700;color:#667eea">
          ${m.coutTotal ? m.coutTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DT' : '-'}
        </td>
      </tr>
    `).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Historique Mouvements SOPEM</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;padding:30px;color:#24292e;font-size:11px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:25px;padding-bottom:15px;border-bottom:3px solid #667eea}
      .logo{font-size:22px;font-weight:900;letter-spacing:2px;color:#667eea}
      h1{font-size:15px;font-weight:700;margin-bottom:5px}
      table{width:100%;border-collapse:collapse;font-size:10px}
      th{text-align:left;padding:8px 6px;background:#667eea;color:#fff;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700}
      td{padding:7px 6px;border-bottom:1px solid #e1e4e8;vertical-align:top}
      tr:nth-child(even) td{background:#f9f9f9}
      .footer{margin-top:20px;font-size:9px;color:#6e7681;text-align:center;border-top:1px solid #e1e4e8;padding-top:10px}
      @media print{body{padding:15px}}
    </style>
    </head><body>
    <div class="header">
      <div class="logo">SOPEM</div>
      <div style="text-align:right;font-size:11px;color:#6e7681">
        <div><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</div>
        <div><strong>Total:</strong> ${mouvementsFiltres.length} mouvements</div>
      </div>
    </div>
    <h1>Historique Complet des Mouvements - Produits Semi-Finis</h1>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Date & Heure</th>
          <th style="text-align:center">Type</th>
          <th>Référence</th>
          <th>Désignation</th>
          <th>Opération</th>
          <th>Bac</th>
          <th style="text-align:right">Quantité</th>
          <th style="text-align:right">Coût Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">SOPEM — Rapport généré le ${new Date().toLocaleDateString('fr-FR')} — Confidentiel</div>
    <script>window.onload=function(){window.print()}</script>
    </body></html>`);
    win.document.close();
  };

  const getMouvementsFiltres = () => {
    let filtered = mouvements;

    // Filtre par type
    if (filtreType !== 'TOUS') {
      filtered = filtered.filter(m => m.type === filtreType);
    }

    // Filtre par recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.reference?.toLowerCase().includes(term) ||
        m.designation?.toLowerCase().includes(term) ||
        m.nom_operation?.toLowerCase().includes(term) ||
        m.bac?.code?.toLowerCase().includes(term)
      );
    }

    // Tri
    if (triPar === 'cout') {
      filtered = [...filtered].sort((a, b) => {
        const coutA = a.coutTotal || 0;
        const coutB = b.coutTotal || 0;
        const coutCompare = coutB - coutA;
        if (coutCompare !== 0) return coutCompare;
        return (b.quantite || 0) - (a.quantite || 0);
      });
    } else if (triPar === 'quantite') {
      filtered = [...filtered].sort((a, b) => (b.quantite || 0) - (a.quantite || 0));
    }
    // Si triPar === 'date', garder l'ordre par défaut (déjà trié par date décroissante)

    return filtered;
  };

  const mouvementsFiltres = getMouvementsFiltres();

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem',
    },
    modal: {
      background: '#fff',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '1400px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    header: {
      padding: '1.5rem 2rem',
      borderBottom: '1px solid #e1e4e8',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '20px',
      fontWeight: '700',
      margin: 0,
      color: '#24292e',
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#586069',
      padding: '4px',
      transition: 'color 0.2s ease',
    },
    toolbar: {
      padding: '1.25rem 2rem',
      borderBottom: '1px solid #e1e4e8',
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      flexWrap: 'wrap',
      background: '#f6f8fa',
    },
    searchInput: {
      flex: 1,
      minWidth: '250px',
      padding: '10px 14px',
      border: '2px solid #e1e4e8',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
    },
    filterBtn: {
      padding: '10px 18px',
      fontSize: '13px',
      fontWeight: '600',
      border: '1px solid #e1e4e8',
      background: '#fff',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    filterBtnActive: {
      padding: '10px 18px',
      fontSize: '13px',
      fontWeight: '600',
      border: '1px solid #667eea',
      background: '#667eea',
      color: '#fff',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    btnExport: {
      padding: '10px 20px',
      fontSize: '13px',
      fontWeight: '600',
      border: 'none',
      background: 'linear-gradient(135deg, #1a7f37 0%, #138636 100%)',
      color: '#fff',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    body: {
      flex: 1,
      overflow: 'auto',
      padding: '0',
    },
    tableContainer: {
      overflowX: 'auto',
    },
    table: {
      width: '100%',
      fontSize: '13px',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '14px 12px',
      fontWeight: '700',
      color: '#6e7681',
      borderBottom: '2px solid #e1e4e8',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      background: '#f6f8fa',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      cursor: 'pointer',
      userSelect: 'none',
    },
    thRight: {
      textAlign: 'right',
      padding: '14px 12px',
      fontWeight: '700',
      color: '#6e7681',
      borderBottom: '2px solid #e1e4e8',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      background: '#f6f8fa',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      cursor: 'pointer',
      userSelect: 'none',
    },
    td: {
      padding: '14px 12px',
      borderBottom: '1px solid #e1e4e8',
    },
    tdMuted: {
      padding: '14px 12px',
      borderBottom: '1px solid #e1e4e8',
      color: '#6e7681',
      fontSize: '12px',
    },
    tdBold: {
      padding: '14px 12px',
      borderBottom: '1px solid #e1e4e8',
      fontWeight: '700',
      color: '#24292e',
    },
    tdRight: {
      padding: '14px 12px',
      borderBottom: '1px solid #e1e4e8',
      textAlign: 'right',
      fontWeight: '700',
    },
    badgeSuccess: {
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      display: 'inline-block',
      background: '#dafbe1',
      color: '#1a7f37',
      fontWeight: '700',
    },
    badgeDanger: {
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      display: 'inline-block',
      background: '#ffebe9',
      color: '#cf222e',
      fontWeight: '700',
    },
    badgeWarning: {
      padding: '4px 10px',
      borderRadius: '10px',
      fontSize: '10px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: '#fff4e6',
      color: '#c2410c',
      fontWeight: '700',
    },
    loadingText: {
      textAlign: 'center',
      padding: '3rem',
      color: '#6e7681',
      fontSize: '15px',
    },
    emptyText: {
      textAlign: 'center',
      padding: '3rem',
      color: '#6e7681',
      fontSize: '15px',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>📋 Historique Complet des Mouvements</h2>
          <button
            style={styles.closeBtn}
            onClick={onClose}
            onMouseOver={(e) => (e.currentTarget.style.color = '#24292e')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#586069')}
          >
            ×
          </button>
        </div>

        <div style={styles.toolbar}>
          <input
            type="text"
            placeholder="🔍 Rechercher (référence, désignation, opération, bac)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#667eea')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#e1e4e8')}
          />

          <button
            style={filtreType === 'TOUS' ? styles.filterBtnActive : styles.filterBtn}
            onClick={() => setFiltreType('TOUS')}
            onMouseOver={(e) => {
              if (filtreType !== 'TOUS') e.currentTarget.style.background = '#f6f8fa';
            }}
            onMouseOut={(e) => {
              if (filtreType !== 'TOUS') e.currentTarget.style.background = '#fff';
            }}
          >
            Tous
          </button>

          <button
            style={filtreType === 'ENTREE' ? styles.filterBtnActive : styles.filterBtn}
            onClick={() => setFiltreType('ENTREE')}
            onMouseOver={(e) => {
              if (filtreType !== 'ENTREE') e.currentTarget.style.background = '#f6f8fa';
            }}
            onMouseOut={(e) => {
              if (filtreType !== 'ENTREE') e.currentTarget.style.background = '#fff';
            }}
          >
            Entrées
          </button>

          <button
            style={filtreType === 'SORTIE' ? styles.filterBtnActive : styles.filterBtn}
            onClick={() => setFiltreType('SORTIE')}
            onMouseOver={(e) => {
              if (filtreType !== 'SORTIE') e.currentTarget.style.background = '#f6f8fa';
            }}
            onMouseOut={(e) => {
              if (filtreType !== 'SORTIE') e.currentTarget.style.background = '#fff';
            }}
          >
            Sorties
          </button>

          <button
            style={styles.btnExport}
            onClick={handleExportPDF}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span>📄</span>
            <span>Export PDF</span>
          </button>
        </div>

        <div style={styles.body}>
          {loading ? (
            <div style={styles.loadingText}>⏳ Chargement de l'historique...</div>
          ) : mouvementsFiltres.length === 0 ? (
            <div style={styles.emptyText}>
              {searchTerm || filtreType !== 'TOUS'
                ? '🔍 Aucun mouvement ne correspond à vos critères'
                : '📭 Aucun mouvement enregistré'}
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th} onClick={() => setTriPar('date')} title="Trier par date">
                      Date & Heure {triPar === 'date' && '▼'}
                    </th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Référence</th>
                    <th style={styles.th}>Désignation</th>
                    <th style={styles.th}>Opération</th>
                    <th style={styles.th}>Bac</th>
                    <th style={styles.thRight} onClick={() => setTriPar('quantite')} title="Trier par quantité">
                      Quantité {triPar === 'quantite' && '▼'}
                    </th>
                    <th style={styles.thRight} onClick={() => setTriPar('cout')} title="Trier par coût">
                      Coût Total {triPar === 'cout' && '▼'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mouvementsFiltres.map((mvt, i) => {
                    const stockThreshold = 10000;
                    const isAlerte = Math.abs(mvt.quantite || 0) >= stockThreshold;

                    return (
                      <tr
                        key={mvt.id_mouvement || i}
                        style={{ transition: 'background 0.2s ease' }}
                        onMouseOver={(e) => (e.currentTarget.style.background = '#f6f8fa')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={styles.tdMuted}>
                          {mvt.date
                            ? new Date(mvt.date).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={mvt.type === 'ENTREE' ? styles.badgeSuccess : styles.badgeDanger}
                          >
                            {mvt.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                          </span>
                        </td>
                        <td style={styles.tdBold}>{mvt.reference}</td>
                        <td style={styles.td}>{mvt.designation || '-'}</td>
                        <td style={styles.td}>{mvt.nom_operation || '-'}</td>
                        <td style={styles.td}>{mvt.bac?.code || '-'}</td>
                        <td
                          style={{
                            ...styles.tdRight,
                            color: mvt.type === 'ENTREE' ? '#1a7f37' : '#cf222e',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <span>
                              {mvt.type === 'ENTREE' ? '+' : '-'}
                              {mvt.quantite.toLocaleString()}
                            </span>
                            {isAlerte && (
                              <span style={styles.badgeWarning}>⚠️ ALERTE</span>
                            )}
                          </div>
                        </td>
                        <td style={{ ...styles.tdRight, color: '#667eea' }}>
                          {mvt.coutTotal
                            ? mvt.coutTotal.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }) + ' DT'
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Historique;