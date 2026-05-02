import React, { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const AjouterSortie = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    id_operation: null, // Sera récupéré automatiquement
    nom_operation: '',  // Sera récupéré automatiquement
    quantite: '',
    id_bac: null,
    type: 'SORTIE' // ✅ FIXE - Toujours SORTIE
  });

  const [stockInfo, setStockInfo] = useState(null); // {stockDisponible, bacs: [{id_bac, code, quantite}]}
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockError, setStockError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ AUTO-CHARGEMENT quand référence change
  const handleReferenceChange = async (e) => {
    const refSaisie = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, reference: refSaisie }));

    if (!refSaisie.trim()) {
      setStockInfo(null);
      setStockError('');
      setFormData(prev => ({ ...prev, designation: '', id_bac: null, id_operation: null, nom_operation: '' }));
      return;
    }

    // Validation format (accepte 7777 ou 7777-DEC)
    const regexAvecSuffix = /^(\d+)-([A-Z]{3})$/i;
    const regexSansS = /^(\d+)$/;
    const matchAvec = refSaisie.match(regexAvecSuffix);
    const matchSans = refSaisie.match(regexSansS);

    if (!matchAvec && !matchSans) {
      setStockError('');
      return; // Pas encore complet, on attend
    }

    const refBase = matchAvec ? matchAvec[1] : matchSans[1];
    const refComplete = matchAvec ? refSaisie : null; // null si juste numéro

    setLoadingStock(true);
    setStockError('');

    try {
      // 1. Chercher le produit pour avoir la désignation et l'opération
     const produitRes = await fetch(`${API_URL}/api/produits/byReference/${refBase}`);
      if (!produitRes.ok) throw new Error('Produit non trouvé');
      
      const produitData = await produitRes.json();

      // 2. Calculer stock par bac
    const mouvementsRes = await fetch(`${API_URL}/api/mouvements`);
      if (!mouvementsRes.ok) throw new Error('Erreur chargement mouvements');
      
      const allMouvements = await mouvementsRes.json();

      // Filtrer mouvements pour cette référence
      const refARechercher = refComplete || refBase;
      const mouvementsProduit = allMouvements.filter(m => 
        m.reference === refARechercher || m.reference?.startsWith(refBase)
      );

      if (mouvementsProduit.length === 0) {
        throw new Error('Aucun stock disponible pour ce produit');
      }

      // Calculer stock par bac
      const stockParBac = {};
      mouvementsProduit.forEach(m => {
        const bacCode = m.bac?.code;
        const bacId = m.bac?.id_bac;
        if (!bacCode || !bacId) return;

        if (!stockParBac[bacCode]) {
          stockParBac[bacCode] = { 
            id_bac: bacId, 
            code: bacCode, 
            quantite: 0,
            operation: m.nom_operation || 'N/A' // ✅ Stocke l'opération
          };
        }

        if (m.type === 'ENTREE') {
          stockParBac[bacCode].quantite += m.quantite || 0;
        } else if (m.type === 'SORTIE') {
          stockParBac[bacCode].quantite -= m.quantite || 0;
        }
      });

      // Filtrer bacs avec stock > 0
      const bacsDisponibles = Object.values(stockParBac).filter(b => b.quantite > 0);

      if (bacsDisponibles.length === 0) {
        throw new Error('Stock épuisé pour ce produit');
      }

      // Total stock
      const stockTotal = bacsDisponibles.reduce((sum, b) => sum + b.quantite, 0);

      // Récupérer opération du premier mouvement d'entrée
      const premierMouvement = mouvementsProduit.find(m => m.type === 'ENTREE');
      const operation = premierMouvement ? {
        id_operation: premierMouvement.id_operation,
        nom_operation: premierMouvement.nom_operation
      } : { id_operation: null, nom_operation: '' };

      // ✅ Mise à jour auto
      setStockInfo({
        stockDisponible: stockTotal,
        bacs: bacsDisponibles
      });

      setFormData(prev => ({
        ...prev,
        designation: produitData.designation || '',
        id_bac: bacsDisponibles[0].id_bac, // Auto-sélectionne premier bac
        id_operation: operation.id_operation,
        nom_operation: operation.nom_operation
      }));

      setStockError('');
    } catch (err) {
      setStockError('❌ ' + err.message);
      setStockInfo(null);
      setFormData(prev => ({ ...prev, designation: '', id_bac: null, id_operation: null, nom_operation: '' }));
    } finally {
      setLoadingStock(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.reference.trim()) { setError('❌ La référence est obligatoire'); return; }
    if (!formData.designation.trim()) { setError('❌ Aucun produit chargé'); return; }
    if (!formData.quantite || formData.quantite <= 0) { setError('❌ La quantité doit être supérieure à 0'); return; }
    if (!formData.id_bac) { setError('❌ Le bac est obligatoire'); return; }

    // ✅ Validation stock disponible
    if (stockInfo && formData.quantite > stockInfo.stockDisponible) {
      setError(`❌ Stock insuffisant! Disponible: ${stockInfo.stockDisponible} pièces`);
      return;
    }

    setError('');
    setLoading(true);

    try {
   const response = await fetch(`${API_URL}/api/mouvements/ajouter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Erreur ${response.status}`);
      }

      alert('✅ Sortie enregistrée avec succès!');

      // Reset formulaire
      setFormData({
        reference: '', designation: '', id_operation: null,
        nom_operation: '', quantite: '', id_bac: null, type: 'SORTIE'
      });
      setStockInfo(null);

      if (typeof onSuccess === 'function') onSuccess();
    } catch (err) {
      setError('❌ ' + (err.message || 'Erreur lors de l\'enregistrement'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { if (typeof onClose === 'function') onClose(); };

  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' },
    modal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' },
    header: { padding: '1.5rem 2rem', borderBottom: '1px solid #e1e4e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '20px', fontWeight: '600', margin: 0, color: '#24292e' },
    closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#586069', padding: '4px', transition: 'color 0.2s ease' },
    body: { padding: '2rem' },
    form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    label: { fontSize: '14px', fontWeight: '600', color: '#24292e' },
    required: { color: '#dc2626', marginLeft: '4px' },
    input: { padding: '12px 14px', fontSize: '14px', border: '1px solid #e1e4e8', borderRadius: '8px', outline: 'none', transition: 'border-color 0.2s ease' },
    inputDisabled: { background: '#f6f8fa', color: '#586069', cursor: 'not-allowed' },
    select: { padding: '12px 14px', fontSize: '14px', border: '1px solid #e1e4e8', borderRadius: '8px', outline: 'none', transition: 'border-color 0.2s ease', background: '#fff', cursor: 'pointer' },
    selectDisabled: { background: '#f6f8fa', color: '#586069', cursor: 'not-allowed' },
    errorBox: { padding: '12px', background: '#ffebe9', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px' },
    successBox: { padding: '12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', fontSize: '14px' },
    infoBox: { padding: '14px 18px', background: '#ddf4ff', border: '1px solid #90caf9', borderRadius: '10px', marginTop: '0.5rem' },
    infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    infoLabel: { fontSize: '13px', color: '#0969da', fontWeight: '600' },
    infoValue: { fontSize: '18px', color: '#0969da', fontWeight: '800' },
    footer: { padding: '1.5rem 2rem', borderTop: '1px solid #e1e4e8', display: 'flex', gap: '12px', justifyContent: 'flex-end' },
    btnCancel: { padding: '10px 20px', fontSize: '14px', fontWeight: '500', border: '1px solid #e1e4e8', background: '#fff', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
    btnSubmit: { padding: '10px 24px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'linear-gradient(135deg, #cf222e 0%, #a40e26 100%)', color: '#fff', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(207, 34, 46, 0.3)' },
    btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>➖ Ajouter Sortie</h2>
          <button style={styles.closeBtn} onClick={handleClose} type="button"
            onMouseOver={(e) => e.currentTarget.style.color = '#24292e'}
            onMouseOut={(e) => e.currentTarget.style.color = '#586069'}>×</button>
        </div>

        <div style={styles.body}>
          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Référence Produit<span style={styles.required}>*</span></label>
              <input type="text" style={styles.input} placeholder="Ex: 8794 ou 8794-DEC"
                value={formData.reference}
                onChange={handleReferenceChange}
                onFocus={(e) => e.currentTarget.style.borderColor = '#cf222e'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e1e4e8'} />
              {loadingStock && <small style={{ fontSize: '12px', color: '#0969da' }}>🔍 Chargement du stock...</small>}
              {stockError && <small style={{ fontSize: '12px', color: '#dc2626' }}>{stockError}</small>}
              {stockInfo && !stockError && (
                <small style={{ fontSize: '12px', color: '#16a34a' }}>
                  ✅ Produit trouvé - Stock disponible: <strong>{stockInfo.stockDisponible} pièces</strong>
                </small>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Désignation</label>
              <input type="text" style={{...styles.input, ...styles.inputDisabled}} 
                value={formData.designation} disabled 
                placeholder="Chargement automatique..." />
            </div>

            {stockInfo && (
              <div style={styles.infoBox}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>📦 Stock disponible:</span>
                  <span style={styles.infoValue}>{stockInfo.stockDisponible.toLocaleString()} pièces</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>📍 Bacs disponibles:</span>
                  <span style={styles.infoValue}>
                    {stockInfo.bacs.map(b => `${b.code} (${b.operation})`).join(', ')}
                  </span>
                </div>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Quantité à sortir<span style={styles.required}>*</span></label>
              <input type="number" style={styles.input} 
                placeholder={stockInfo ? `Max: ${stockInfo.stockDisponible}` : "Ex: 100"}
                value={formData.quantite}
                onChange={(e) => setFormData({...formData, quantite: parseInt(e.target.value) || ''})}
                min="1"
                max={stockInfo?.stockDisponible || undefined}
                onFocus={(e) => e.currentTarget.style.borderColor = '#cf222e'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e1e4e8'} />
              {stockInfo && formData.quantite > 0 && (
                <small style={{ fontSize: '12px', color: formData.quantite <= stockInfo.stockDisponible ? '#16a34a' : '#dc2626' }}>
                  {formData.quantite <= stockInfo.stockDisponible 
                    ? `✓ Reste: ${stockInfo.stockDisponible - formData.quantite} pièces`
                    : `❌ Quantité trop élevée (max: ${stockInfo.stockDisponible})`}
                </small>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Bac source<span style={styles.required}>*</span></label>
              <select style={stockInfo ? styles.select : {...styles.select, ...styles.selectDisabled}}
                value={formData.id_bac || ''}
                onChange={(e) => setFormData({...formData, id_bac: parseInt(e.target.value) || null})}
                disabled={!stockInfo}
                onFocus={(e) => e.currentTarget.style.borderColor = '#cf222e'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e1e4e8'}>
                <option value="">-- Bac auto-sélectionné --</option>
                {stockInfo?.bacs.map((bac) => (
                  <option key={bac.id_bac} value={bac.id_bac}>
                    {bac.code} ({bac.quantite.toLocaleString()} pièces) - {bac.operation}
                  </option>
                ))}
              </select>
              {!stockInfo && <small style={{ fontSize: '12px', color: '#6e7681' }}>Saisissez une référence pour charger les bacs</small>}
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}
          </form>
        </div>

        <div style={styles.footer}>
          <button type="button" style={styles.btnCancel} onClick={handleClose}
            onMouseOver={(e) => e.currentTarget.style.background = '#f6f8fa'}
            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}>
            Annuler
          </button>
          <button type="button"
            style={{...styles.btnSubmit, ...(loading || !stockInfo ? styles.btnDisabled : {})}}
            onClick={handleSubmit} disabled={loading || !stockInfo}
            onMouseOver={(e) => { if (!loading && stockInfo) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { if (!loading && stockInfo) e.currentTarget.style.transform = 'translateY(0)'; }}>
            {loading ? '⏳ Enregistrement...' : '✓ Enregistrer Sortie'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AjouterSortie;