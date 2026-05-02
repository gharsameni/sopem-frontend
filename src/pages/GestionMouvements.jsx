import React, { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const GestionMouvements = ({ onClose }) => {
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [bacs, setBacs] = useState([]);

  useEffect(() => {
    loadMouvements();
    loadBacs();
  }, []);

  const loadBacs = async () => {
    try {
    const res = await fetch(`${API_URL}/api/bacs`);
      if (res.ok) setBacs(await res.json());
    } catch (err) {
      console.error('Erreur bacs:', err);
    }
  };

  const loadMouvements = async () => {
    setLoading(true);
    try {
     const response = await fetch(`${API_URL}/api/mouvements/recents`);
      if (response.ok) setMouvements(await response.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mvt) => {
    setEditingId(mvt.id_mouvement);
    setEditData({ 
      quantite: mvt.quantite, 
      id_bac: mvt.bac?.id_bac || null, 
      type: mvt.type 
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async (id) => {
    try {
   const response = await fetch(`${API_URL}/api/mouvements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!response.ok) throw new Error('Erreur lors de la modification');
      alert('✅ Mouvement modifié avec succès!');
      setEditingId(null);
      setEditData({});
      loadMouvements();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('⚠️ Voulez-vous vraiment supprimer ce mouvement ?')) return;
    try {
   const response = await fetch(`${API_URL}/api/mouvements/${id}`, {
        method: 'DELETE' 
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      alert('✅ Mouvement supprimé avec succès!');
      loadMouvements();
    } catch (err) {
      alert('❌ ' + err.message);
    }
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
    const win = window.open('', '_blank', 'width=420,height=320');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Étiquette - ${data.reference}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .etiquette { border: 3px solid #000; border-radius: 8px; padding: 20px 24px; width: 340px; text-align: center; }
            .logo { font-size: 12px; font-weight: bold; color: #555; letter-spacing: 2px; margin-bottom: 8px; }
            .divider { border: none; border-top: 1px solid #ccc; margin: 8px 0; }
            .reference { font-size: 28px; font-weight: 900; letter-spacing: 2px; margin: 6px 0; }
            .designation { font-size: 13px; color: #333; margin-bottom: 10px; }
            .infos { display: flex; justify-content: space-around; margin-top: 12px; }
            .info-block { text-align: center; }
            .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
            .info-value { font-size: 22px; font-weight: 800; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="etiquette">
            <div class="logo">SOPEM</div>
            <hr class="divider"/>
            <div class="reference">${data.reference}</div>
            <div class="designation">${data.designation}</div>
            <hr class="divider"/>
            <div class="infos">
              <div class="info-block">
                <div class="info-label">Bac</div>
                <div class="info-value">${data.bac}</div>
              </div>
              <div class="info-block">
                <div class="info-label">Stock actuel</div>
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

  const styles = {
    overlay: { 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0, 0, 0, 0.5)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 2000, 
      padding: '2rem' 
    },
    modal: { 
      background: '#fff', borderRadius: '16px', width: '100%', 
      maxWidth: '1200px', maxHeight: '90vh', overflow: 'auto', 
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' 
    },
    header: { 
      padding: '1.5rem 2rem', borderBottom: '1px solid #e1e4e8', 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
    },
    title: { fontSize: '20px', fontWeight: '600', margin: 0, color: '#24292e' },
    closeBtn: { 
      background: 'none', border: 'none', fontSize: '24px', 
      cursor: 'pointer', color: '#586069', padding: '4px', 
      transition: 'color 0.2s ease' 
    },
    body: { padding: '2rem' },
    loadingText: { textAlign: 'center', color: '#586069', padding: '2rem' },
    table: { width: '100%', fontSize: '14px', borderCollapse: 'collapse' },
    th: { 
      textAlign: 'left', padding: '12px 8px', fontWeight: '600', 
      color: '#586069', borderBottom: '2px solid #e1e4e8', 
      fontSize: '12px', textTransform: 'uppercase', background: '#f6f8fa' 
    },
    td: { padding: '14px 8px', borderBottom: '1px solid #e1e4e8' },
    tdBold: { 
      padding: '14px 8px', borderBottom: '1px solid #e1e4e8', 
      fontWeight: '600', color: '#24292e' 
    },
    inputSmall: { 
      padding: '6px 8px', fontSize: '13px', border: '1px solid #e1e4e8', 
      borderRadius: '6px', outline: 'none', width: '100%' 
    },
    selectSmall: { 
      padding: '6px 8px', fontSize: '13px', border: '1px solid #e1e4e8', 
      borderRadius: '6px', outline: 'none', width: '100%', background: '#fff' 
    },
    badge: { 
      padding: '4px 8px', borderRadius: '12px', fontSize: '11px', 
      fontWeight: '600', display: 'inline-block' 
    },
    badgeEntree: { background: '#dafbe1', color: '#1a7f37' },
    badgeSortie: { background: '#ffebe9', color: '#cf222e' },
    btnEdit: { 
      padding: '6px 12px', fontSize: '12px', fontWeight: '500', 
      border: '1px solid #0969da', background: '#fff', color: '#0969da', 
      borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease', 
      marginRight: '6px' 
    },
    btnSave: { 
      padding: '6px 12px', fontSize: '12px', fontWeight: '500', 
      border: 'none', background: '#1a7f37', color: '#fff', 
      borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease', 
      marginRight: '6px' 
    },
    btnCancelEdit: { 
      padding: '6px 12px', fontSize: '12px', fontWeight: '500', 
      border: '1px solid #e1e4e8', background: '#fff', color: '#586069', 
      borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' 
    },
    btnDelete: { 
      padding: '6px 12px', fontSize: '12px', fontWeight: '500', 
      border: '1px solid #dc2626', background: '#fff', color: '#dc2626', 
      borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease', 
      marginLeft: '6px' 
    },
    btnPrintSmall: { 
      padding: '6px 12px', fontSize: '12px', fontWeight: '500', 
      border: '1px solid #1a7f37', background: '#fff', color: '#1a7f37', 
      borderRadius: '6px', cursor: 'pointer', marginLeft: '6px' 
    },
    footer: { 
      padding: '1.5rem 2rem', borderTop: '1px solid #e1e4e8', 
      display: 'flex', gap: '12px', justifyContent: 'flex-end' 
    },
    btnCancel: { 
      padding: '10px 20px', fontSize: '14px', fontWeight: '500', 
      border: '1px solid #e1e4e8', background: '#fff', borderRadius: '8px', 
      cursor: 'pointer', transition: 'all 0.2s ease' 
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>📋 Gestion des Mouvements</h2>
          <button style={styles.closeBtn} onClick={onClose} type="button"
            onMouseOver={(e) => e.currentTarget.style.color = '#24292e'}
            onMouseOut={(e) => e.currentTarget.style.color = '#586069'}>×</button>
        </div>

        <div style={styles.body}>
          {loading ? (
            <div style={styles.loadingText}>⏳ Chargement...</div>
          ) : mouvements.length === 0 ? (
            <div style={styles.loadingText}>📭 Aucun mouvement enregistré</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Référence</th>
                  <th style={styles.th}>Désignation</th>
                  <th style={styles.th}>Opération</th>
                  <th style={styles.th}>Quantité</th>
                  <th style={styles.th}>Bac</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mouvements.map((mvt) => {
                  const isEditing = editingId === mvt.id_mouvement;
                  return (
                    <tr key={mvt.id_mouvement}>
                      <td style={styles.td}>
                        {mvt.date ? new Date(mvt.date).toLocaleString('fr-FR', { 
                          day: '2-digit', month: '2-digit', year: 'numeric', 
                          hour: '2-digit', minute: '2-digit' 
                        }) : '-'}
                      </td>
                      <td style={styles.tdBold}>{mvt.reference}</td>
                      <td style={styles.td}>{mvt.designation}</td>
                      <td style={styles.td}>{mvt.nom_operation}</td>
                      <td style={styles.td}>
                        {isEditing ? (
                          <input 
                            type="number" 
                            style={styles.inputSmall} 
                            value={editData.quantite} 
                            onChange={(e) => setEditData({...editData, quantite: parseInt(e.target.value)})} 
                            min="1" 
                          />
                        ) : (
                          <strong>{mvt.quantite}</strong>
                        )}
                      </td>
                      <td style={styles.td}>
                        {isEditing ? (
                          <select 
                            style={styles.selectSmall} 
                            value={editData.id_bac || ''} 
                            onChange={(e) => setEditData({...editData, id_bac: parseInt(e.target.value) || null})}>
                            <option value="">-- Bac --</option>
                            {bacs.map(b => (
                              <option key={b.id_bac} value={b.id_bac}>{b.code}</option>
                            ))}
                          </select>
                        ) : (
                          mvt.bac?.code || '-'
                        )}
                      </td>
                      <td style={styles.td}>
                        {isEditing ? (
                          <select 
                            style={styles.selectSmall} 
                            value={editData.type} 
                            onChange={(e) => setEditData({...editData, type: e.target.value})}>
                            <option value="ENTREE">Entrée</option>
                            <option value="SORTIE">Sortie</option>
                          </select>
                        ) : (
                          <span style={{
                            ...styles.badge, 
                            ...(mvt.type === 'ENTREE' ? styles.badgeEntree : styles.badgeSortie)
                          }}>
                            {mvt.type === 'ENTREE' ? '↓ Entrée' : '↑ Sortie'}
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {isEditing ? (
                          <>
                            <button 
                              type="button" 
                              style={styles.btnSave} 
                              onClick={() => handleSaveEdit(mvt.id_mouvement)}>
                              ✓ Sauver
                            </button>
                            <button 
                              type="button" 
                              style={styles.btnCancelEdit} 
                              onClick={handleCancelEdit}>
                              ✕ Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              type="button" 
                              style={styles.btnEdit} 
                              onClick={() => handleEdit(mvt)}>
                              ✏️ Modifier
                            </button>
                            <button 
                              type="button" 
                              style={styles.btnDelete} 
                              onClick={() => handleDelete(mvt.id_mouvement)}>
                              🗑️ Supprimer
                            </button>
                            {mvt.type === 'ENTREE' && (
                              <button 
                                type="button" 
                                style={styles.btnPrintSmall}
                                onClick={() => handleImprimerAvecStock(
                                  mvt.reference, 
                                  mvt.designation, 
                                  mvt.bac?.code || '-'
                                )}
                                onMouseOver={(e) => e.currentTarget.style.background = '#f0fdf4'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#fff'}>
                                🏷️
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={styles.footer}>
          <button 
            type="button" 
            style={styles.btnCancel} 
            onClick={onClose}
            onMouseOver={(e) => e.currentTarget.style.background = '#f6f8fa'}
            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestionMouvements;