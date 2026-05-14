import React, { useState, useEffect } from 'react';

// ✅ AJOUT : Variable d'environnement pour l'URL de l'API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ListeProduits = ({ onClose }) => {
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModifier, setShowModifier] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    description: '',
    operationsIds: []
  });
  const [operations, setOperations] = useState([]);
  const [loadingOps, setLoadingOps] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorModif, setErrorModif] = useState('');

  useEffect(() => {
    loadProduits();
    loadOperations();
  }, []);

  const loadProduits = async () => {
    setLoading(true);
    try {
      // ✅ MODIFIÉ : Utilisation de API_URL
      const response = await fetch(`${API_URL}/api/produits`);
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      const data = await response.json();
      setProduits(data);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOperations = async () => {
    setLoadingOps(true);
    try {
      // ✅ MODIFIÉ : Utilisation de API_URL
      const response = await fetch(`${API_URL}/api/operations/liste`);
      if (response.ok) {
        const data = await response.json();
        setOperations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erreur chargement opérations:', err);
    } finally {
      setLoadingOps(false);
    }
  };

  const handleModifier = (produit) => {
    setSelectedProduit(produit);
    
    setFormData({
      reference: produit.reference || '',
      designation: produit.designation || '',
      description: produit.description || '',
      operationsIds: produit.operations ? produit.operations.map(op => op.id_operation || op.id) : []
    });
    
    setShowModifier(true);
    setErrorModif('');
  };

  /**
   * NOUVEAU : Gérer l'activation/désactivation dynamique
   */
  const handleToggleActif = async (produit) => {
const action = produit.actif ? 'desactiver' : 'activer';
    const messageConfirm = produit.actif 
      ? `⚠️ Voulez-vous vraiment désactiver le produit "${produit.designation}" ?\n\nIl ne sera plus visible dans la liste des produits actifs.`
      : `✅ Voulez-vous vraiment activer le produit "${produit.designation}" ?`;

    if (!window.confirm(messageConfirm)) {
      return;
    }

    try {
      // ✅ MODIFIÉ : Utilisation de API_URL
      const response = await fetch(
        `${API_URL}/api/produits/${produit.id_produit}/${action}`,
        { method: 'PUT' }
      );

      if (!response.ok) {
        throw new Error(`Erreur lors de ${action === 'activer' ? "l'activation" : "la désactivation"}`);
      }

      alert(produit.actif 
        ? '✅ Produit désactivé avec succès!' 
        : '✅ Produit activé avec succès!');
      
      loadProduits();

    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const handleOperationToggle = (operationId) => {
    if (!operationId) return;
    
    setFormData(prev => {
      const newIds = prev.operationsIds.includes(operationId)
        ? prev.operationsIds.filter(id => id !== operationId)
        : [...prev.operationsIds, operationId];
      
      return { ...prev, operationsIds: newIds };
    });
  };

  const handleSubmitModifier = async (e) => {
    e.preventDefault();
    
    if (!formData.reference.trim()) {
      setErrorModif('La référence est obligatoire');
      return;
    }
    
    if (!formData.designation.trim()) {
      setErrorModif('La désignation est obligatoire');
      return;
    }
    
    if (formData.operationsIds.length === 0) {
      setErrorModif('Veuillez sélectionner au moins une opération');
      return;
    }
    
    setErrorModif('');
    setLoadingSubmit(true);

    try {
      // ✅ MODIFIÉ : Utilisation de API_URL
      const response = await fetch(`${API_URL}/api/produits/${selectedProduit.id_produit}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      alert('✅ Produit modifié avec succès!');
      setShowModifier(false);
      setSelectedProduit(null);
      loadProduits();
      
    } catch (err) {
      setErrorModif(err.message || 'Erreur inconnue');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleCloseModifier = () => {
    setShowModifier(false);
    setSelectedProduit(null);
    setErrorModif('');
  };

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
      overflow: 'auto',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    overlayModifier: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '2rem',
    },
    modalModifier: {
      background: '#fff',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '700px',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    },
    header: {
      padding: '1.5rem 2rem',
      borderBottom: '1px solid #e1e4e8',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      background: '#fff',
      zIndex: 10,
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
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
    body: {
      padding: '2rem',
    },
    loadingText: {
      textAlign: 'center',
      color: '#586069',
      padding: '3rem',
      fontSize: '16px',
    },
    errorBox: {
      padding: '1rem',
      background: '#ffebe9',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      color: '#dc2626',
      textAlign: 'center',
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem',
      color: '#586069',
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '1rem',
    },
    btnRefresh: {
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '500',
      border: '1px solid #e1e4e8',
      background: '#fff',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '1rem',
    },
    tableContainer: {
      overflowX: 'auto',
    },
    table: {
      width: '100%',
      fontSize: '14px',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '12px 8px',
      fontWeight: '600',
      color: '#586069',
      borderBottom: '2px solid #e1e4e8',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      background: '#f6f8fa',
    },
    td: {
      padding: '14px 8px',
      borderBottom: '1px solid #e1e4e8',
    },
    tdBold: {
      padding: '14px 8px',
      borderBottom: '1px solid #e1e4e8',
      fontWeight: '600',
      color: '#24292e',
    },
    tdInactif: {
      padding: '14px 8px',
      borderBottom: '1px solid #e1e4e8',
      color: '#9ca3af',
      opacity: 0.6,
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      display: 'inline-block',
      background: '#ddf4ff',
      color: '#0969da',
      marginRight: '4px',
      marginBottom: '4px',
    },
    badgeInactif: {
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      display: 'inline-block',
      background: '#f3f4f6',
      color: '#6b7280',
      marginLeft: '8px',
    },
    btnModifier: {
      padding: '6px 12px',
      fontSize: '13px',
      fontWeight: '500',
      border: '1px solid #e1e4e8',
      background: '#fff',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: '#24292e',
      marginRight: '6px',
    },
    btnDesactiver: {
      padding: '6px 12px',
      fontSize: '13px',
      fontWeight: '500',
      border: '1px solid #dc2626',
      background: '#fff',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: '#dc2626',
    },
    btnActiver: {
      padding: '6px 12px',
      fontSize: '13px',
      fontWeight: '500',
      border: '1px solid #10b981',
      background: '#fff',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: '#10b981',
    },
    footer: {
      padding: '1.5rem 2rem',
      borderTop: '1px solid #e1e4e8',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#f6f8fa',
    },
    statsText: {
      fontSize: '14px',
      color: '#586069',
      fontWeight: '500',
    },
    btnClose: {
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '500',
      border: '1px solid #e1e4e8',
      background: '#fff',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#24292e',
    },
    required: {
      color: '#dc2626',
      marginLeft: '4px',
    },
    input: {
      padding: '12px 14px',
      fontSize: '14px',
      border: '1px solid #e1e4e8',
      borderRadius: '8px',
      outline: 'none',
      transition: 'border-color 0.2s ease',
    },
    textarea: {
      padding: '12px 14px',
      fontSize: '14px',
      border: '1px solid #e1e4e8',
      borderRadius: '8px',
      outline: 'none',
      resize: 'vertical',
      minHeight: '100px',
      fontFamily: 'inherit',
    },
    operationsSection: {
      marginTop: '1rem',
    },
    operationsTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#24292e',
      marginBottom: '1rem',
    },
    operationsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '0.75rem',
    },
    operationItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 12px',
      background: '#f6f8fa',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: '1px solid transparent',
    },
    operationItemSelected: {
      background: '#e3f2fd',
      border: '1px solid #90caf9',
    },
    checkbox: {
      width: '18px',
      height: '18px',
      marginRight: '10px',
      cursor: 'pointer',
    },
    operationLabel: {
      fontSize: '14px',
      color: '#24292e',
      cursor: 'pointer',
      userSelect: 'none',
    },
    footerModifier: {
      padding: '1.5rem 2rem',
      borderTop: '1px solid #e1e4e8',
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
    },
    btnCancel: {
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '500',
      border: '1px solid #e1e4e8',
      background: '#fff',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    btnSubmit: {
      padding: '10px 24px',
      fontSize: '14px',
      fontWeight: '600',
      border: 'none',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    },
    btnDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  };

  const isSubmitDisabled = loadingSubmit || formData.operationsIds.length === 0;

  // Compteurs
  const produitsActifs = produits.filter(p => p.actif).length;
  const produitsInactifs = produits.filter(p => !p.actif).length;

  return (
    <>
      <div style={styles.overlay} onClick={handleClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.header}>
            <h2 style={styles.title}>📋 Liste des produits</h2>
            <button 
              style={styles.closeBtn}
              onClick={handleClose}
              type="button"
              onMouseOver={(e) => e.currentTarget.style.color = '#24292e'}
              onMouseOut={(e) => e.currentTarget.style.color = '#586069'}
            >
              ×
            </button>
          </div>

          <div style={styles.body}>
            {loading ? (
              <div style={styles.loadingText}>⏳ Chargement des produits...</div>
            ) : error ? (
              <div style={styles.errorBox}>⚠️ Erreur: {error}</div>
            ) : produits.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📦</div>
                <p>Aucun produit disponible</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '13px', color: '#586069' }}>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>✓ {produitsActifs} actifs</span>
                    {produitsInactifs > 0 && (
                      <span style={{ marginLeft: '12px', color: '#dc2626', fontWeight: '600' }}>
                        ✗ {produitsInactifs} inactifs
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    style={styles.btnRefresh}
                    onClick={loadProduits}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#f6f8fa';
                      e.currentTarget.style.borderColor = '#667eea';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#e1e4e8';
                    }}
                  >
                    <span>🔄</span>
                    Actualiser
                  </button>
                </div>

                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Référence</th>
                        <th style={styles.th}>Désignation</th>
                        <th style={styles.th}>Description</th>
                        <th style={styles.th}>Opérations</th>
                        <th style={styles.th}>Statut</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produits.map((produit) => {
                        const isInactif = !produit.actif;
                        
                        return (
                          <tr 
                            key={produit.id_produit}
                            style={{ background: isInactif ? '#f9fafb' : 'transparent' }}
                            onMouseOver={(e) => e.currentTarget.style.background = isInactif ? '#f3f4f6' : '#f6f8fa'}
                            onMouseOut={(e) => e.currentTarget.style.background = isInactif ? '#f9fafb' : 'transparent'}
                          >
                            <td style={isInactif ? styles.tdInactif : styles.tdBold}>
                              {produit.reference}
                            </td>
                            <td style={isInactif ? styles.tdInactif : styles.td}>
                              {produit.designation}
                            </td>
                            <td style={isInactif ? styles.tdInactif : styles.td}>
                              {produit.description ? produit.description.substring(0, 50) + (produit.description.length > 50 ? '...' : '') : '-'}
                            </td>
                            <td style={isInactif ? styles.tdInactif : styles.td}>
                              {produit.operations && produit.operations.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {produit.operations.map((op) => (
                                    <span key={op.id_operation || op.id} style={styles.badge}>
                                      {op.nom_operation || op.nom || 'Opération'}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: '#586069', fontSize: '13px' }}>Aucune</span>
                              )}
                            </td>
                            <td style={styles.td}>
                              {isInactif ? (
                                <span style={styles.badgeInactif}>⚫ Inactif</span>
                              ) : (
                                <span style={{ ...styles.badge, background: '#d1fae5', color: '#059669' }}>
                                  ✓ Actif
                                </span>
                              )}
                            </td>
                            <td style={styles.td}>
                              <button
                                type="button"
                                style={styles.btnModifier}
                                onClick={() => handleModifier(produit)}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = '#f6f8fa';
                                  e.currentTarget.style.borderColor = '#d0d7de';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = '#fff';
                                  e.currentTarget.style.borderColor = '#e1e4e8';
                                }}
                              >
                                ✏️ Modifier
                              </button>
                              
                              {isInactif ? (
                                <button
                                  type="button"
                                  style={styles.btnActiver}
                                  onClick={() => handleToggleActif(produit)}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#d1fae5';
                                    e.currentTarget.style.borderColor = '#059669';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#fff';
                                    e.currentTarget.style.borderColor = '#10b981';
                                  }}
                                >
                                  🟢 Activer
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  style={styles.btnDesactiver}
                                  onClick={() => handleToggleActif(produit)}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#ffebe9';
                                    e.currentTarget.style.borderColor = '#cf222e';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#fff';
                                    e.currentTarget.style.borderColor = '#dc2626';
                                  }}
                                >
                                  🔴 Désactiver
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div style={styles.footer}>
            <span style={styles.statsText}>
              📦 {produits.length} produit(s)
            </span>
            <button
              type="button"
              style={styles.btnClose}
              onClick={handleClose}
              onMouseOver={(e) => e.currentTarget.style.background = '#f6f8fa'}
              onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {showModifier && selectedProduit && (
        <div style={styles.overlayModifier} onClick={handleCloseModifier}>
          <div style={styles.modalModifier} onClick={(e) => e.stopPropagation()}>
            <div style={styles.header}>
              <h2 style={styles.title}>✏️ Modifier le produit</h2>
              <button 
                style={styles.closeBtn}
                onClick={handleCloseModifier}
                type="button"
              >
                ×
              </button>
            </div>

            <div style={styles.body}>
              {errorModif && (
                <div style={styles.errorBox}>{errorModif}</div>
              )}

              <form style={styles.form} onSubmit={handleSubmitModifier}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Référence <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Désignation <span style={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    style={styles.input}
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    style={styles.textarea}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description détaillée du produit (optionnel)"
                  />
                </div>

                <div style={styles.operationsSection}>
                  <div style={styles.operationsTitle}>
                    Opérations <span style={styles.required}>*</span>
                  </div>
                  {loadingOps ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#586069' }}>
                      ⏳ Chargement des opérations...
                    </div>
                  ) : operations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#586069' }}>
                      Aucune opération disponible
                    </div>
                  ) : (
                    <div style={styles.operationsGrid}>
                      {operations.map((operation) => {
                        const operationId = operation.id_operation || operation.id;
                        const isSelected = formData.operationsIds.includes(operationId);
                        
                        return (
                          <div
                            key={operationId}
                            style={isSelected ? { ...styles.operationItem, ...styles.operationItemSelected } : styles.operationItem}
                            onClick={() => handleOperationToggle(operationId)}
                          >
                            <input
                              type="checkbox"
                              style={styles.checkbox}
                              checked={isSelected}
                              onChange={() => {}}
                            />
                            <label style={styles.operationLabel}>
                              {operation.nom_operation || operation.nom || `Opération ${operationId}`}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div style={styles.footerModifier}>
              <button
                type="button"
                style={styles.btnCancel}
                onClick={handleCloseModifier}
              >
                Annuler
              </button>
              <button
                type="submit"
                style={isSubmitDisabled ? { ...styles.btnSubmit, ...styles.btnDisabled } : styles.btnSubmit}
                onClick={handleSubmitModifier}
                disabled={isSubmitDisabled}
              >
                {loadingSubmit ? '⏳ Modification...' : '✅ Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ListeProduits;