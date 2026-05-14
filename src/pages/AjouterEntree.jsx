import React, { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const AjouterEntree = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    id_operation: null,
    nom_operation: '',
    quantite: '',
    id_bac: null,
    coutUnitaire: 0,
    type: 'ENTREE'
  });

  const [produit, setProduit] = useState(null);
  const [operations, setOperations] = useState([]);
  const [loadingProduit, setLoadingProduit] = useState(false);
  const [produitError, setProduitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bacs, setBacs] = useState([]);
  const [lastMouvement, setLastMouvement] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/bacs`)
      .then(res => res.json())
      .then(data => setBacs(data))
      .catch(err => console.error('Erreur bacs:', err));
  }, []);

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
            <div class="designation">${data.designation || '-'}</div>
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

  const handleReferenceBlur = async () => {
    const refSaisie = formData.reference.trim();

    if (!refSaisie) {
      setProduit(null);
      setOperations([]);
      setFormData(prev => ({ ...prev, designation: '', coutUnitaire: 0 }));
      return;
    }

    const regexAvecSuffix = /^(\d+)-([A-Z]{3})$/i;
    const regexSansS = /^(\d+)$/;
    const matchAvec = refSaisie.match(regexAvecSuffix);
    const matchSans = refSaisie.match(regexSansS);

    if (!matchAvec && !matchSans) {
      setProduitError('❌ Format invalide — utilisez: 7777 ou 7777-DEC');
      setProduit(null);
      setOperations([]);
      setFormData(prev => ({ ...prev, designation: '', coutUnitaire: 0 }));
      return;
    }

    const refBase = matchAvec ? matchAvec[1] : matchSans[1];

    setLoadingProduit(true);
    setProduitError('');

    try {
      const response = await fetch(`${API_URL}/api/produits/byReference/${refBase}`);

      // ✅ Produit désactivé
      if (response.status === 403) {
        setProduitError('❌ Ce produit est désactivé — impossible d\'enregistrer une entrée');
        setProduit(null);
        setOperations([]);
        setFormData(prev => ({ ...prev, designation: '', coutUnitaire: 0 }));
        return;
      }

      if (!response.ok)  setProduitError('Produit non trouvé');

      const data = await response.json();

      // ✅ Vérification côté frontend aussi
      if (!data.actif) {
        setProduitError('❌ Ce produit est désactivé — impossible d\'enregistrer une entrée');
        setProduit(null);
        setOperations([]);
        setFormData(prev => ({ ...prev, designation: '', coutUnitaire: 0 }));
        return;
      }

      setProduit(data);
      setFormData(prev => ({
        ...prev,
        designation: data.designation || '',
        coutUnitaire: 0
      }));

      if (data.operations && Array.isArray(data.operations) && data.operations.length > 0) {
        setOperations(data.operations);
        setProduitError('');
      } else {
        setOperations([]);
        setProduitError('⚠️ Ce produit n\'a aucune opération associée');
      }
    } catch (err) {
      setProduitError('❌ ' + err.message);
      setProduit(null);
      setOperations([]);
      setFormData(prev => ({ ...prev, designation: '', coutUnitaire: 0 }));
    } finally {
      setLoadingProduit(false);
    }
  };

  const handleOperationSelect = (operation) => {
    const opId = operation.id_operation || operation.id;
    const opNom = operation.nom_operation || operation.nom;
    setFormData(prev => ({ ...prev, id_operation: opId, nom_operation: opNom }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.reference.trim()) {
      setError('❌ La référence est obligatoire');
      return;
    }

    const refRegex = /^(\d+)-[A-Z]{3}$/i;
    if (!refRegex.test(formData.reference.trim())) {
      setError('❌ Pour enregistrer, la référence doit inclure le code opération — ex: 7777-DEC');
      return;
    }

    if (!formData.id_operation) {
      setError('❌ Veuillez sélectionner une opération');
      return;
    }

    if (!formData.quantite || formData.quantite <= 0) {
      setError('❌ La quantité doit être supérieure à 0');
      return;
    }

    if (!formData.id_bac) {
      setError('❌ Le bac est obligatoire');
      return;
    }

    if (formData.coutUnitaire < 0) {
      setError('❌ Le coût unitaire ne peut pas être négatif');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        reference: formData.reference,
        designation: formData.designation,
        id_operation: formData.id_operation,
        nom_operation: formData.nom_operation,
        quantite: formData.quantite,
        id_bac: formData.id_bac,
        cout: formData.coutUnitaire,
        type: 'ENTREE'
      };

      const response = await fetch(`${API_URL}/api/mouvements/ajouter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Erreur ${response.status}`);
      }

      const bacChoisi = bacs.find(b => b.id_bac === formData.id_bac);
      const stockActuel = await getStockActuel(formData.reference, bacChoisi?.code);

      setLastMouvement({
        reference: formData.reference,
        designation: formData.designation || '-',
        bac: bacChoisi?.code || '-',
        stockActuel: stockActuel !== null ? stockActuel : '—',
      });

      alert('✅ Entrée enregistrée avec succès!');

      setFormData({
        reference: '', designation: '', id_operation: null,
        nom_operation: '', quantite: '', id_bac: null, coutUnitaire: 0, type: 'ENTREE'
      });
      setProduit(null);
      setOperations([]);

      if (typeof onSuccess === 'function') onSuccess();
    } catch (err) {
      setError('❌ ' + (err.message || 'Erreur lors de l\'enregistrement'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { if (typeof onClose === 'function') onClose(); };

  const coutTotal = formData.quantite > 0 && formData.coutUnitaire > 0
    ? (formData.coutUnitaire * formData.quantite).toFixed(2)
    : '0.00';

  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(23, 22, 22, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' },
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
    operationsTitle: { fontSize: '14px', fontWeight: '600', color: '#24292e', marginBottom: '1rem' },
    operationsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' },
    operationItem: { display: 'flex', alignItems: 'center', padding: '10px 12px', background: '#f6f8fa', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease', border: '1px solid transparent' },
    operationItemSelected: { background: '#e3f2fd', border: '1px solid #90caf9' },
    radio: { width: '18px', height: '18px', marginRight: '10px', cursor: 'pointer' },
    operationLabel: { fontSize: '14px', color: '#24292e', cursor: 'pointer', userSelect: 'none' },
    errorBox: { padding: '12px', background: '#ffebe9', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px' },
    successBox: { padding: '12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', fontSize: '14px', marginTop: '0.5rem' },
    infoBox: { padding: '14px 16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', marginTop: '0.5rem' },
    infoLabel: { fontSize: '13px', fontWeight: '600', color: '#0369a1', marginBottom: '6px' },
    infoValue: { fontSize: '16px', fontWeight: '700', color: '#0369a1' },
    printBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', marginBottom: '1.5rem' },
    printBannerText: { fontSize: '14px', color: '#16a34a', fontWeight: '600' },
    btnPrint: { padding: '8px 18px', fontSize: '13px', fontWeight: '600', border: 'none', background: '#1a7f37', color: '#fff', borderRadius: '8px', cursor: 'pointer' },
    footer: { padding: '1.5rem 2rem', borderTop: '1px solid #e1e4e8', display: 'flex', gap: '12px', justifyContent: 'flex-end' },
    btnCancel: { padding: '10px 20px', fontSize: '14px', fontWeight: '500', border: '1px solid #e1e4e8', background: '#fff', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' },
    btnSubmit: { padding: '10px 24px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'linear-gradient(135deg, #1a7f37 0%, #138636 100%)', color: '#fff', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(26, 127, 55, 0.3)' },
    btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>➕ Ajouter Entrée</h2>
          <button style={styles.closeBtn} onClick={handleClose} type="button"
            onMouseOver={(e) => e.currentTarget.style.color = '#24292e'}
            onMouseOut={(e) => e.currentTarget.style.color = '#586069'}>×</button>
        </div>

        <div style={styles.body}>
          {lastMouvement && (
            <div style={styles.printBanner}>
              <span style={styles.printBannerText}>
                ✅ Entrée enregistrée — {lastMouvement.reference} | Stock: {lastMouvement.stockActuel}
              </span>
              <button type="button" style={styles.btnPrint}
                onClick={() => imprimerEtiquette(lastMouvement)}
                onMouseOver={(e) => e.currentTarget.style.background = '#138636'}
                onMouseOut={(e) => e.currentTarget.style.background = '#1a7f37'}>
                🏷️ Imprimer étiquette
              </button>
            </div>
          )}

          <form style={styles.form} onSubmit={handleSubmit}>
            {/* RÉFÉRENCE */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Référence Produit<span style={styles.required}>*</span></label>
              <input type="text" style={styles.input} placeholder="Ex: 8794 ou 8794-DEC"
                value={formData.reference}
                onChange={(e) => setFormData({...formData, reference: e.target.value.toUpperCase()})}
                onBlur={handleReferenceBlur}
                onFocus={(e) => e.currentTarget.style.borderColor = '#1a7f37'} />
              {loadingProduit && <small style={{ fontSize: '12px', color: '#0969da' }}>🔍 Recherche du produit...</small>}
              {produitError && <small style={{ fontSize: '12px', color: '#dc2626' }}>{produitError}</small>}
              {produit && !produitError && <small style={{ fontSize: '12px', color: '#16a34a' }}>✅ Produit trouvé - {operations.length} opération(s) disponible(s)</small>}
            </div>

            {/* DÉSIGNATION */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Désignation (optionnel)</label>
              <input type="text" style={{...styles.input, ...styles.inputDisabled}} value={formData.designation} disabled placeholder="Chargée automatiquement si disponible" />
            </div>

            {/* OPÉRATIONS */}
            {operations.length > 0 && (
              <div style={styles.formGroup}>
                <div style={styles.operationsTitle}>Opération d'origine<span style={styles.required}>*</span></div>
                <div style={styles.operationsGrid}>
                  {operations.map((operation) => {
                    const opId = operation.id_operation || operation.id;
                    const opNom = operation.nom_operation || operation.nom;
                    const isSelected = formData.id_operation === opId;
                    return (
                      <div key={opId}
                        style={{...styles.operationItem, ...(isSelected ? styles.operationItemSelected : {})}}
                        onClick={() => handleOperationSelect(operation)}
                        onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = '#e0f2e9'; }}
                        onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = '#f6f8fa'; }}>
                        <input type="radio" style={styles.radio} checked={isSelected} readOnly />
                        <label style={styles.operationLabel}>{opNom}</label>
                      </div>
                    );
                  })}
                </div>
                {formData.id_operation && (
                  <div style={styles.successBox}>✓ Opération sélectionnée: <strong>{formData.nom_operation}</strong></div>
                )}
              </div>
            )}

            {/* QUANTITÉ */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Quantité<span style={styles.required}>*</span></label>
              <input type="number" style={styles.input} placeholder="Ex: 100"
                value={formData.quantite}
                onChange={(e) => setFormData({...formData, quantite: parseInt(e.target.value) || ''})}
                min="1"
                onFocus={(e) => e.currentTarget.style.borderColor = '#1a7f37'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e1e4e8'} />
            </div>

            {/* COÛT UNITAIRE */}
            <div style={styles.formGroup}>
              <label style={styles.label}>💰 Coût unitaire (DT / pièce)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                style={styles.input}
                value={formData.coutUnitaire}
                onChange={(e) => setFormData({...formData, coutUnitaire: parseFloat(e.target.value) || 0})}
                placeholder="Ex: 5.50"
                onFocus={(e) => e.currentTarget.style.borderColor = '#1a7f37'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e1e4e8'}
              />
              <small style={{ fontSize: '12px', color: '#586069' }}>
                💡 Saisissez le coût par pièce
              </small>
              {formData.quantite > 0 && formData.coutUnitaire > 0 && (
                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>📊 Coût total calculé:</div>
                  <div style={styles.infoValue}>{coutTotal} DT</div>
                </div>
              )}
            </div>

            {/* BAC */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Bac<span style={styles.required}>*</span></label>
              <select style={styles.select}
                value={formData.id_bac || ''}
                onChange={(e) => setFormData({...formData, id_bac: parseInt(e.target.value) || null})}
                onFocus={(e) => e.currentTarget.style.borderColor = '#1a7f37'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e1e4e8'}>
                <option value="">-- Sélectionner un bac --</option>
                {bacs.map((bac) => (
                  <option key={bac.id_bac} value={bac.id_bac}>{bac.code}</option>
                ))}
              </select>
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
            style={{...styles.btnSubmit, ...(loading ? styles.btnDisabled : {})}}
            onClick={handleSubmit} disabled={loading}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(0)'; }}>
            {loading ? '⏳ Enregistrement...' : '✓ Enregistrer Entrée'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AjouterEntree;