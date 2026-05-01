import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import Historique from './Historique';

const DashboardChefAtelier = ({ user }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [kpis, setKpis] = useState({
    entrees: 0,
    sorties: 0,
    total: 0,
    stockTotal: 0,
    loading: true
  });
  const [stockParOperation, setStockParOperation] = useState([]);
  const [topProduits, setTopProduits] = useState([]);
  const [derniersMovements, setDerniersMovements] = useState([]);
  const [referenceRecherche, setReferenceRecherche] = useState('');
  const [produitRecherche, setProduitRecherche] = useState(null);
  const [allMouvements, setAllMouvements] = useState([]);
  const [showHistorique, setShowHistorique] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setKpis(prev => ({ ...prev, loading: true }));
    
    try {
      // Charger KPIs
      const [mouvementsRes, totalRes, stockTotalRes, derniersRes] = await Promise.all([
        fetch('http://localhost:8080/api/mouvements/stats/today'),
        fetch('http://localhost:8080/api/mouvements/stats/total-produits'),
        fetch('http://localhost:8080/api/mouvements/stats/stock-total'),
        fetch('http://localhost:8080/api/mouvements/derniers')
      ]);

      const mouvements = await mouvementsRes.json();
      const totalData = await totalRes.json();
      const stockTotal = await stockTotalRes.json();
      const derniers = await derniersRes.json();

      setKpis({
        entrees: mouvements.entrees || 0,
        sorties: mouvements.sorties || 0,
        total: totalData.total || 0,
        stockTotal: stockTotal.stockTotal || 0,
        loading: false
      });

      setDerniersMovements(derniers.slice(0, 10) || []);

      // Charger tous les mouvements pour calculer stock par opération
      const allMouvementsRes = await fetch('http://localhost:8080/api/mouvements');
      const allMouvements = await allMouvementsRes.json();
      setAllMouvements(allMouvements);

      // Calculer stock par opération (global)
      const operationsMap = {};
      allMouvements.forEach(m => {
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
        stock: operationsMap[nom].stock
      })).sort((a, b) => b.stock - a.stock);

      setStockParOperation(operations);

      // Calculer top produits
      const produitsMap = {};
      allMouvements.forEach(m => {
        const ref = m.reference;
        if (!produitsMap[ref]) {
          produitsMap[ref] = {
            reference: ref,
            designation: m.designation,
            operation: m.nom_operation || '-',
            bac: m.bac?.code || '-',
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

      const produits = Object.values(produitsMap)
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 10);

      setTopProduits(produits);

    } catch (error) {
      console.error('Erreur chargement données:', error);
      setKpis(prev => ({ ...prev, loading: false }));
    }
  };

  const getMouvementsParMois = () => {
    const now = new Date();
    const moisData = {};
    
    // Initialiser les 6 derniers mois
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
    
    // Calculer entrées/sorties
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

    try {
      const res = await fetch('http://localhost:8080/api/mouvements');
      if (!res.ok) throw new Error('Erreur chargement');
      
      const allMouvements = await res.json();
      const filtered = allMouvements.filter(m => 
        m.reference?.toLowerCase() === referenceRecherche.toLowerCase()
      );

      if (filtered.length === 0) {
        alert('❌ Produit non trouvé: ' + referenceRecherche);
        setProduitRecherche(null);
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
        stock: operationsMap[nom].stock
      })).sort((a, b) => b.stock - a.stock);

      setProduitRecherche({
        ...produit,
        operations
      });

    } catch (err) {
      alert('❌ Erreur: ' + err.message);
      setProduitRecherche(null);
    }
  };

  const resetRecherche = () => {
    setReferenceRecherche('');
    setProduitRecherche(null);
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
      maxWidth: '1800px',
      margin: '0 auto',
    },
    kpiGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    kpiCard: {
      background: '#fff',
      borderRadius: '16px',
      padding: '1.75rem 1.5rem',
      border: '1px solid #bae6fd',
      boxShadow: '0 2px 8px rgba(10, 197, 255, 0.06)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    },
    kpiCardPrimary: {
      background: 'linear-gradient(135deg, #0ac5ff 0%, #0f2942 100%)',
      border: 'none',
      boxShadow: '0 8px 24px rgba(10, 197, 255, 0.3)',
    },
    kpiLabel: {
      fontSize: '12px',
      color: '#64748b',
      margin: '0 0 14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    kpiLabelPrimary: {
      fontSize: '12px',
      color: 'rgba(255, 255, 255, 0.9)',
      margin: '0 0 14px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    kpiValue: {
      fontSize: '36px',
      fontWeight: '800',
      margin: '0',
      color: '#0f2942',
      letterSpacing: '-1.5px',
    },
    kpiValuePrimary: {
      fontSize: '36px',
      fontWeight: '800',
      margin: '0',
      color: '#fff',
      letterSpacing: '-1.5px',
    },
    card: {
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #bae6fd',
      padding: '2rem',
      boxShadow: '0 2px 8px rgba(10, 197, 255, 0.06)',
      marginBottom: '2rem',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.75rem',
      paddingBottom: '1.25rem',
      borderBottom: '2px solid #f0f9ff',
    },
    cardTitle: {
      fontSize: '19px',
      fontWeight: '700',
      margin: '0',
      color: '#0f2942',
    },
    searchContainer: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      marginBottom: '1.5rem',
      padding: '1rem',
      background: '#f0f9ff',
      borderRadius: '12px',
    },
    searchInput: {
      flex: 1,
      padding: '12px 16px',
      border: '2px solid #bae6fd',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      outline: 'none',
    },
    btnSearch: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #0ac5ff 0%, #0f2942 100%)',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '700',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
    },
    btnReset: {
      padding: '12px 20px',
      background: '#fff',
      color: '#64748b',
      border: '1px solid #bae6fd',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    produitInfo: {
      background: '#e0f2fe',
      padding: '1.5rem',
      borderRadius: '12px',
      marginBottom: '1.5rem',
      border: '2px solid #0ac5ff',
    },
    produitRef: {
      fontSize: '20px',
      fontWeight: '800',
      color: '#0369a1',
      margin: '0 0 8px 0',
    },
    produitDesignation: {
      fontSize: '15px',
      color: '#64748b',
      margin: 0,
      fontWeight: '600',
    },
    chartContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    barItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    barLabel: {
      minWidth: '120px',
      fontSize: '14px',
      fontWeight: '700',
      color: '#0f2942',
    },
    barWrapper: {
      flex: 1,
      height: '36px',
      background: '#f0f9ff',
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
    },
    barFill: {
      height: '100%',
      background: 'linear-gradient(135deg, #0ac5ff 0%, #0f2942 100%)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: '12px',
      color: '#fff',
      fontWeight: '700',
      fontSize: '13px',
      transition: 'width 0.5s ease',
    },
    contentGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2rem',
    },
    table: {
      width: '100%',
      fontSize: '14px',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '14px 10px',
      fontWeight: '700',
      color: '#64748b',
      borderBottom: '2px solid #bae6fd',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      background: '#f0f9ff',
    },
    thRight: {
      textAlign: 'right',
      padding: '14px 10px',
      fontWeight: '700',
      color: '#64748b',
      borderBottom: '2px solid #bae6fd',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      background: '#f0f9ff',
    },
    td: {
      padding: '16px 10px',
      borderBottom: '1px solid #e0f2fe',
    },
    tdMuted: {
      padding: '16px 10px',
      borderBottom: '1px solid #e0f2fe',
      color: '#64748b',
      fontSize: '13px',
      fontWeight: '500',
    },
    tdBold: {
      padding: '16px 10px',
      borderBottom: '1px solid #e0f2fe',
      fontWeight: '700',
      color: '#0f2942',
    },
    tdRight: {
      padding: '16px 10px',
      borderBottom: '1px solid #e0f2fe',
      textAlign: 'right',
      fontWeight: '700',
    },
    badgeSuccess: {
      padding: '7px 14px',
      borderRadius: '14px',
      fontSize: '12px',
      display: 'inline-block',
      background: '#dafbe1',
      color: '#1a7f37',
      fontWeight: '700',
    },
    badgeDanger: {
      padding: '7px 14px',
      borderRadius: '14px',
      fontSize: '12px',
      display: 'inline-block',
      background: '#ffebe9',
      color: '#cf222e',
      fontWeight: '700',
    },
  };

  const dataToDisplay = produitRecherche ? produitRecherche.operations : stockParOperation.slice(0, 6);
  const maxStock = dataToDisplay.length > 0 ? Math.max(...dataToDisplay.map(o => o.stock)) : 1;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <img src="/logo-sopem.png" alt="SOPEM" style={styles.logoSopem} />
          <div style={styles.titleContent}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={styles.title}>Tableau de Bord - Chef d'Atelier</h1>
              <span style={styles.roleBadge}>Chef Atelier</span>
            </div>
            <p style={styles.subtitle}>{formatDateTime(currentDateTime)}</p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button type="button" style={styles.btnActualiser} onClick={loadData}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f0f9ff';
              e.currentTarget.style.borderColor = '#0ac5ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.borderColor = '#bae6fd';
            }}>
            <span>🔄</span> Actualiser
          </button>
          
          <button 
            type="button" 
            style={styles.btnActualiser} 
            onClick={() => setShowHistorique(true)}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f0f9ff';
              e.currentTarget.style.borderColor = '#0ac5ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.borderColor = '#bae6fd';
            }}>
            <span>📋</span> Historique
          </button>
          
          <button onClick={handleLogout} style={styles.logoutBtn} title="Déconnexion"
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#ffebe9';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#f0f9ff';
              e.currentTarget.style.borderColor = '#bae6fd';
            }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}>⏻</span>
          </button>
          <div style={styles.userAvatar}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            {user?.nom ? user.nom.substring(0, 2).toUpperCase() : 'CA'}
          </div>
        </div>
      </div>

      <div style={styles.mainWrapper}>
        {/* KPIs */}
        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(10, 197, 255, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 197, 255, 0.06)';
            }}>
            <p style={styles.kpiLabel}>Entrées aujourd'hui</p>
            <p style={styles.kpiValue}>{kpis.loading ? '...' : kpis.entrees}</p>
          </div>

          <div style={styles.kpiCard}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(10, 197, 255, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 197, 255, 0.06)';
            }}>
            <p style={styles.kpiLabel}>Sorties aujourd'hui</p>
            <p style={styles.kpiValue}>{kpis.loading ? '...' : kpis.sorties}</p>
          </div>

          <div style={styles.kpiCard}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(10, 197, 255, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(10, 197, 255, 0.06)';
            }}>
            <p style={styles.kpiLabel}>Produits Semi-Finis</p>
            <p style={styles.kpiValue}>{kpis.loading ? '...' : kpis.total}</p>
          </div>

          <div style={{...styles.kpiCard, ...styles.kpiCardPrimary}}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 16px 36px rgba(10, 197, 255, 0.45)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(10, 197, 255, 0.3)';
            }}>
            <p style={styles.kpiLabelPrimary}>Stock Total</p>
            <p style={styles.kpiValuePrimary}>
              {kpis.loading ? '...' : kpis.stockTotal.toLocaleString()}
            </p>
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

        {/* Stock par Opération avec Recherche */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              {produitRecherche ? '🔍 Stock par Opération - Produit Spécifique' : '📊 Stock par Opération - Vue Globale'}
            </h2>
          </div>

          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Rechercher par référence produit..."
              value={referenceRecherche}
              onChange={(e) => setReferenceRecherche(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRechercheSpecifique()}
              style={styles.searchInput}
              onFocus={(e) => e.target.style.borderColor = '#0ac5ff'}
              onBlur={(e) => e.target.style.borderColor = '#bae6fd'}
            />
            <button
              onClick={handleRechercheSpecifique}
              style={styles.btnSearch}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🔍 Rechercher
            </button>
            {produitRecherche && (
              <button
                onClick={resetRecherche}
                style={styles.btnReset}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f0f9ff';
                  e.currentTarget.style.borderColor = '#7dd3fc';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#bae6fd';
                }}
              >
                ✕ Réinitialiser
              </button>
            )}
          </div>

          {produitRecherche && (
            <div style={styles.produitInfo}>
              <p style={styles.produitRef}>📦 {produitRecherche.reference}</p>
              <p style={styles.produitDesignation}>{produitRecherche.designation}</p>
            </div>
          )}

          <div style={styles.chartContainer}>
            {dataToDisplay.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                Aucune donnée disponible
              </div>
            ) : (
              dataToDisplay.map((op, index) => {
                const percentage = maxStock > 0 ? (op.stock / maxStock) * 100 : 0;
                
                return (
                  <div key={index} style={styles.barItem}>
                    <div style={styles.barLabel}>{op.nom}</div>
                    <div style={styles.barWrapper}>
                      <div style={{...styles.barFill, width: `${percentage}%`}}>
                        {op.stock.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Grille: Top 10 + Derniers Mouvements */}
        <div style={styles.contentGrid}>
          {/* Top 10 Produits */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>🏆 Top 10 Produits en Stock</h2>
            </div>
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Référence</th>
                    <th style={styles.th}>Désignation</th>
                    <th style={styles.th}>Opération</th>
                    <th style={styles.th}>Bac</th>
                    <th style={styles.thRight}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {topProduits.map((p, i) => (
                    <tr key={i} style={{ transition: 'background 0.2s ease' }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={styles.tdMuted}>{i + 1}</td>
                      <td style={styles.tdBold}>{p.reference}</td>
                      <td style={styles.td}>{p.designation}</td>
                      <td style={styles.td}>{p.operation || '-'}</td>
                      <td style={styles.td}>{p.bac || '-'}</td>
                      <td style={styles.tdRight}>{p.stock.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Derniers Mouvements */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>📋 Derniers Mouvements</h2>
            </div>
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Référence</th>
                    <th style={styles.th}>Désignation</th>
                    <th style={styles.th}>Opération</th>
                    <th style={styles.th}>Bac</th>
                    <th style={styles.thRight}>Qté</th>
                  </tr>
                </thead>
                <tbody>
                  {derniersMovements.map((mvt, i) => (
                    <tr key={i} style={{ transition: 'background 0.2s ease' }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={styles.td}>
                        <span style={mvt.type === 'ENTREE' ? styles.badgeSuccess : styles.badgeDanger}>
                          {mvt.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                        </span>
                      </td>
                      <td style={styles.tdBold}>{mvt.reference}</td>
                      <td style={styles.td}>{mvt.designation}</td>
                      <td style={styles.td}>{mvt.nom_operation || '-'}</td>
                      <td style={styles.td}>{mvt.bac?.code || '-'}</td>
                      <td style={{
                        ...styles.tdRight,
                        color: mvt.type === 'ENTREE' ? '#1a7f37' : '#cf222e'
                      }}>
                        {mvt.type === 'ENTREE' ? '+' : '-'}{mvt.quantite.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* MODAL HISTORIQUE */}
      {showHistorique && (
        <Historique 
          onClose={() => setShowHistorique(false)} 
        />
      )}
    </div>
  );
};

export default DashboardChefAtelier;