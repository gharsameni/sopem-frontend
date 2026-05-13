import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const AjouterProduit = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    description: '',
    seuilAlerte: 10000,
    operationsIds: []
  });

  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingOps, setLoadingOps] = useState(true);
  
  // États pour ajouter opération
  const [showAddOperation, setShowAddOperation] = useState(false);
  const [nouvelleOperation, setNouvelleOperation] = useState('');
  const [addingOperation, setAddingOperation] = useState(false);

  // États pour modifier opération
  const [editingOperation, setEditingOperation] = useState(null);
  const [editOperationName, setEditOperationName] = useState('');
  const [updatingOperation, setUpdatingOperation] = useState(false);

  useEffect(() => {
    loadOperations();
  }, []);

  const loadOperations = async () => {
    try {
     const response = await fetch(`${API_URL}/api/operations/liste`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setOperations(data);
      } else {
        setOperations([]);
      }
    } catch (err) {
      console.error('Erreur chargement opérations:', err);
      toast.error('Erreur lors du chargement des opérations');
      setOperations([]);
    } finally {
      setLoadingOps(false);
    }
  };

  // AJOUTER OPÉRATION
  const handleAjouterOperation = async () => {
    if (!nouvelleOperation.trim()) {
      toast.error('Nom opération obligatoire');
      return;
    }

    setAddingOperation(true);
    
    try {
     const response = await fetch(`${API_URL}/api/operations/ajouter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_operation: nouvelleOperation.toUpperCase().trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur ajout opération');
      }

      toast.success('✅ Opération ajoutée!');
      setNouvelleOperation('');
      setShowAddOperation(false);
      await loadOperations();
      
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setAddingOperation(false);
    }
  };

  // MODIFIER OPÉRATION
  const handleStartEdit = (operation) => {
    setEditingOperation(operation.id_operation);
    setEditOperationName(operation.nom_operation);
  };

  const handleCancelEdit = () => {
    setEditingOperation(null);
    setEditOperationName('');
  };

  const handleSaveEdit = async () => {
    if (!editOperationName.trim()) {
      toast.error('Nom opération obligatoire');
      return;
    }

    setUpdatingOperation(true);

    try {
     const response = await fetch(`${API_URL}/api/operations/${editingOperation}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom_operation: editOperationName.toUpperCase().trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur modification');
      }

      toast.success('✅ Opération modifiée!');
      setEditingOperation(null);
      setEditOperationName('');
      await loadOperations();

    } catch (err) {
      toast.error(err.message || 'Erreur lors de la modification');
    } finally {
      setUpdatingOperation(false);
    }
  };

  // SUPPRIMER OPÉRATION
  const handleDeleteOperation = async (operationId, operationName) => {
    if (!window.confirm(`Supprimer l'opération "${operationName}" ?\n\nAttention: Cette action est irréversible!`)) {
      return;
    }

    try {

const response = await fetch(`${API_URL}/api/operations/${operationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur suppression');
      }

      toast.success('✅ Opération supprimée!');
      
      // Retirer l'opération des sélections si elle était sélectionnée
      setFormData(prev => ({
        ...prev,
        operationsIds: prev.operationsIds.filter(id => id !== operationId)
      }));

      await loadOperations();

    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reference || formData.reference.trim() === '') {
      setError('La référence est obligatoire');
      toast.error('La référence est obligatoire');
      return;
    }
    
    if (!formData.seuilAlerte || formData.seuilAlerte <= 0) {
      setError('Le seuil d\'alerte doit être supérieur à 0');
      toast.error('Le seuil d\'alerte doit être supérieur à 0');
      return;
    }
    
   
    
    if (formData.operationsIds.length === 0) {
      setError('Veuillez sélectionner au moins une opération');
      toast.error('Veuillez sélectionner au moins une opération');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
  const response = await fetch(`${API_URL}/api/produits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      toast.success('✅ Produit ajouté avec succès!');
      
      setFormData({
        reference: '',
        designation: '',
        description: '',
        seuilAlerte: 10000,
        operationsIds: []
      });

      if (typeof onSuccess === 'function') {
        onSuccess();
      }
      
    } catch (err) {
      setError(err.message || 'Erreur inconnue');
      toast.error(err.message || 'Erreur lors de l\'ajout du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
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
      maxWidth: '800px',
      maxHeight: '90vh',
      overflow: 'auto',
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
    operationsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
    },
    operationsTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#24292e',
    },
    btnAddOperation: {
      padding: '6px 12px',
      fontSize: '13px',
      fontWeight: '500',
      border: '1px solid #667eea',
      background: '#fff',
      color: '#667eea',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    addOperationForm: {
      background: '#f6f8fa',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      border: '1px solid #e1e4e8',
    },
    addOperationInput: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #e1e4e8',
      borderRadius: '6px',
      marginBottom: '10px',
      outline: 'none',
    },
    addOperationButtons: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
    },
    btnAddConfirm: {
      padding: '8px 16px',
      fontSize: '13px',
      fontWeight: '500',
      border: 'none',
      background: '#28a745',
      color: '#fff',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    btnAddCancel: {
      padding: '8px 16px',
      fontSize: '13px',
      fontWeight: '500',
      border: '1px solid #e1e4e8',
      background: '#fff',
      color: '#586069',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    operationsGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    operationItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px',
      background: '#f6f8fa',
      borderRadius: '8px',
      border: '1px solid transparent',
      transition: 'all 0.2s ease',
    },
    operationItemSelected: {
      background: '#e3f2fd',
      border: '1px solid #90caf9',
    },
    operationLeft: {
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      cursor: 'pointer',
    },
    operationRight: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
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
    operationEditInput: {
      padding: '8px 10px',
      fontSize: '14px',
      border: '1px solid #667eea',
      borderRadius: '6px',
      outline: 'none',
      flex: 1,
      marginRight: '10px',
    },
    iconBtn: {
      padding: '6px 10px',
      fontSize: '16px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
    },
    iconBtnEdit: {
      color: '#0969da',
    },
    iconBtnDelete: {
      color: '#dc2626',
    },
    iconBtnSave: {
      color: '#28a745',
    },
    iconBtnCancel: {
      color: '#586069',
    },
    error: {
      padding: '12px',
      background: '#ffebe9',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      color: '#dc2626',
      fontSize: '14px',
    },
    footer: {
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
    loadingText: {
      textAlign: 'center',
      color: '#586069',
      padding: '2rem',
    },
  };

  const isSubmitDisabled = loading || formData.operationsIds.length === 0;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>📦 Ajouter un produit</h2>
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
          <form style={styles.form} onSubmit={handleSubmit}>
            
            {/* RÉFÉRENCE */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Référence<span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                style={styles.input}
                placeholder="Ex: P-2847"
                value={formData.reference}
                onChange={(e) => setFormData({...formData, reference: e.target.value})}
                required
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e1e4e8'}
              />
            </div>

            {/* DÉSIGNATION (OPTIONNELLE) */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Désignation</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Ex: Pièce injection type A (optionnel)"
                value={formData.designation}
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e1e4e8'}
              />
            </div>

            {/* DESCRIPTION */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                style={styles.textarea}
                placeholder="Description du produit (optionnel)"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e1e4e8'}
              />
            </div>
<div style={styles.formGroup}>
  <label style={styles.label}>
    ⚠️ Seuil d'alerte 
    <span style={{ fontSize: '12px', color: '#586069', fontWeight: '400', marginLeft: '8px' }}>
      (optionnel — défaut: 10 000)
    </span>
  </label>
  <input
    type="number"
    style={styles.input}
    placeholder="Ex: 5000"
    value={formData.seuilAlerte}
    onChange={(e) => setFormData({...formData, seuilAlerte: parseInt(e.target.value) || 10000})}
    min="1"
    onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
    onBlur={(e) => e.currentTarget.style.borderColor = '#e1e4e8'}
  />
  <small style={{ fontSize: '12px', color: '#586069' }}>
    💡 Une alerte apparaît quand le stock dépasse ce seuil
  </small>
</div>
            {/* COÛT */}
        

            {/* OPÉRATIONS ASSOCIÉES */}
            <div style={styles.operationsSection}>
              <div style={styles.operationsHeader}>
                <div style={styles.operationsTitle}>
                  Opérations associées<span style={styles.required}>*</span>
                </div>
                <button
                  type="button"
                  style={styles.btnAddOperation}
                  onClick={() => setShowAddOperation(!showAddOperation)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#667eea';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#667eea';
                  }}
                >
                  <span>➕</span>
                  <span>Nouvelle Opération</span>
                </button>
              </div>

              {/* FORMULAIRE AJOUT OPÉRATION */}
              {showAddOperation && (
                <div style={styles.addOperationForm}>
                  <input
                    type="text"
                    style={styles.addOperationInput}
                    placeholder="Nom de la nouvelle opération (ex: TRAITEMENT THERMIQUE)"
                    value={nouvelleOperation}
                    onChange={(e) => setNouvelleOperation(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAjouterOperation();
                      }
                    }}
                  />
                  <div style={styles.addOperationButtons}>
                    <button
                      type="button"
                      style={styles.btnAddCancel}
                      onClick={() => {
                        setShowAddOperation(false);
                        setNouvelleOperation('');
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f6f8fa'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      style={styles.btnAddConfirm}
                      onClick={handleAjouterOperation}
                      disabled={addingOperation}
                      onMouseOver={(e) => {
                        if (!addingOperation) e.currentTarget.style.background = '#218838';
                      }}
                      onMouseOut={(e) => {
                        if (!addingOperation) e.currentTarget.style.background = '#28a745';
                      }}
                    >
                      {addingOperation ? '⏳ Ajout...' : '✓ Ajouter'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* LISTE OPÉRATIONS */}
              {loadingOps ? (
                <div style={styles.loadingText}>Chargement des opérations...</div>
              ) : operations.length === 0 ? (
                <div style={styles.loadingText}>Aucune opération disponible</div>
              ) : (
                <div style={styles.operationsGrid}>
                  {operations.map((operation) => {
                    const operationId = operation.id_operation || operation.id;
                    
                    if (typeof operationId === 'undefined') {
                      return null;
                    }
                    
                    const isSelected = formData.operationsIds.includes(operationId);
                    const displayName = operation.nom_operation || operation.nom || operation.designation || `Opération ${operationId}`;
                    const isEditing = editingOperation === operationId;
                    
                    return (
                      <div
                        key={operationId}
                        style={{
                          ...styles.operationItem,
                          ...(isSelected && !isEditing ? styles.operationItemSelected : {})
                        }}
                      >
                        {isEditing ? (
                          // MODE ÉDITION
                          <>
                            <input
                              type="text"
                              style={styles.operationEditInput}
                              value={editOperationName}
                              onChange={(e) => setEditOperationName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEdit();
                                }
                              }}
                              autoFocus
                            />
                            <div style={styles.operationRight}>
                              <button
                                type="button"
                                style={{...styles.iconBtn, ...styles.iconBtnSave}}
                                onClick={handleSaveEdit}
                                disabled={updatingOperation}
                                title="Enregistrer"
                                onMouseOver={(e) => e.currentTarget.style.background = '#e3f2fd'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                {updatingOperation ? '⏳' : '✓'}
                              </button>
                              <button
                                type="button"
                                style={{...styles.iconBtn, ...styles.iconBtnCancel}}
                                onClick={handleCancelEdit}
                                title="Annuler"
                                onMouseOver={(e) => e.currentTarget.style.background = '#f6f8fa'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                ✕
                              </button>
                            </div>
                          </>
                        ) : (
                          // MODE NORMAL
                          <>
                            <div 
                              style={styles.operationLeft}
                              onClick={() => handleOperationToggle(operationId)}
                            >
                              <input
                                type="checkbox"
                                style={styles.checkbox}
                                checked={isSelected}
                                onChange={() => {}}
                                readOnly
                              />
                              <label style={styles.operationLabel}>
                                {displayName}
                              </label>
                            </div>
                            <div style={styles.operationRight}>
                              <button
                                type="button"
                                style={{...styles.iconBtn, ...styles.iconBtnEdit}}
                                onClick={() => handleStartEdit(operation)}
                                title="Modifier"
                                onMouseOver={(e) => e.currentTarget.style.background = '#e3f2fd'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                style={{...styles.iconBtn, ...styles.iconBtnDelete}}
                                onClick={() => handleDeleteOperation(operationId, displayName)}
                                title="Supprimer"
                                onMouseOver={(e) => e.currentTarget.style.background = '#ffebe9'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                🗑️
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {formData.operationsIds.length > 0 && (
                <small style={{ fontSize: '12px', color: '#0969da', marginTop: '8px', display: 'block' }}>
                  ✓ {formData.operationsIds.length} opération(s) sélectionnée(s)
                </small>
              )}
            </div>

            {/* ERREUR */}
            {error && (
              <div style={styles.error}>
                ⚠️ {error}
              </div>
            )}

          </form>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <button
            type="button"
            style={styles.btnCancel}
            onClick={handleClose}
            onMouseOver={(e) => e.currentTarget.style.background = '#f6f8fa'}
            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
          >
            Annuler
          </button>
          <button
            type="button"
            style={{
              ...styles.btnSubmit,
              ...(isSubmitDisabled ? styles.btnDisabled : {})
            }}
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            onMouseOver={(e) => {
              if (!isSubmitDisabled) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!isSubmitDisabled) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {loading ? '⏳ Enregistrement...' : '✓ Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AjouterProduit;