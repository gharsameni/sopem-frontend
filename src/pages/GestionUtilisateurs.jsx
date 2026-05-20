import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const GestionUtilisateurs = ({ onClose }) => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAjouterModal, setShowAjouterModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
 
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    role: 'MAGASINIER',
    actif: true,
  });
 
  useEffect(() => {
    loadUtilisateurs();
  }, []);
 
  const loadUtilisateurs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/utilisateurs`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setUtilisateurs(data);
    } catch (err) {
      toast.error('Erreur de chargement: ' + err.message);
    }
    setLoading(false);
  };
 
  const handleAjouter = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/utilisateurs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur ajout');
      }
      toast.success('✅ Utilisateur ajouté avec succès!');
      setShowAjouterModal(false);
      resetForm();
      loadUtilisateurs();
    } catch (err) {
      toast.error(err.message);
    }
  };
 
  const handleModifier = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/utilisateurs/${userToEdit.id_user}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur modification');
      }
      toast.success('✅ Utilisateur modifié avec succès!');
      setShowModifierModal(false);
      setUserToEdit(null);
      resetForm();
      loadUtilisateurs();
    } catch (err) {
      toast.error(err.message);
    }
  };
 
  const handleSupprimer = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      const res = await fetch(`${API_URL}/api/utilisateurs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur suppression');
      toast.success('✅ Utilisateur supprimé avec succès!');
      loadUtilisateurs();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const handleToggleActif = async (user) => {
  const action = user.actif ? 'désactiver' : 'activer';
  if (!window.confirm(`Voulez-vous ${action} l'utilisateur "${user.nom}" ?`)) return;

  try {
    const endpoint = user.actif
      ? `${API_URL}/api/utilisateurs/${user.id_user}/desactiver`
      : `${API_URL}/api/utilisateurs/${user.id_user}/activer`;

    const res = await fetch(endpoint, { method: 'PUT' });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Erreur modification');
    }
    toast.success(
      user.actif
        ? `🔒 Compte "${user.nom}" désactivé`
        : `✅ Compte "${user.nom}" activé`
    );
    loadUtilisateurs();
  } catch (err) {
    toast.error(err.message);
  }
};
 
  // ── NOUVEAU: Toggle actif/inactif ────────────────────────────────────────
 
  // ─────────────────────────────────────────────────────────────────────────
 
  const openModifier = (user) => {
    setUserToEdit(user);
    setFormData({
      nom: user.nom,
      email: user.email,
      mot_de_passe: '',
      role: user.role,
      actif: user.actif,
    });
    setShowModifierModal(true);
  };
 
  const resetForm = () => {
    setFormData({
      nom: '',
      email: '',
      mot_de_passe: '',
      role: 'MAGASINIER',
      actif: true,
    });
  };
 
  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: { bg: '#dbeafe', color: '#1e40af' },
      DIR_TECHNIQUE: { bg: '#dbeafe', color: '#1e40af' },
      DIR_GENERAL: { bg: '#fce7f3', color: '#9f1239' },
      DIR_TECHNIQUE_GENERAL: { bg: '#e0e7ff', color: '#4338ca' },
      MAGASINIER: { bg: '#dcfce7', color: '#166534' },
      CHEF_ATELIER: { bg: '#fff4e6', color: '#c2410c' },
      DIR_COMMERCIAL: { bg: '#f3e8ff', color: '#6b21a8' },
    };
    return colors[role] || { bg: '#f3f4f6', color: '#374151' };
  };
 
  const getRoleLabel = (role) => {
    const labels = {
      ADMIN: 'ADMIN',
      DIR_TECHNIQUE: 'DIR. TECHNIQUE',
      DIR_GENERAL: 'DIR. GÉNÉRAL',
      DIR_TECHNIQUE_GENERAL: 'DIR. TECH. & GÉNÉRAL',
      MAGASINIER: 'MAGASINIER',
      CHEF_ATELIER: 'CHEF ATELIER',
      DIR_COMMERCIAL: 'DIR. COMMERCIAL',
    };
    return labels[role] || role;
  };
 
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    },
    modal: {
      background: '#fff',
      borderRadius: '16px',
      width: '95%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    header: {
      padding: '2rem 2.5rem',
      borderBottom: '2px solid #e1e4e8',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f6f8fa 0%, #fff 100%)',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      margin: 0,
      background: 'linear-gradient(135deg, #0969da 0%, #0550ae 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    closeBtn: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: '#f6f8fa',
      border: '1px solid #e1e4e8',
      cursor: 'pointer',
      fontSize: '20px',
      color: '#24292e',
      transition: 'all 0.2s ease',
    },
    toolbar: {
      padding: '1.5rem 2.5rem',
      borderBottom: '1px solid #e1e4e8',
      background: '#f6f8fa',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    btnAjouter: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #0969da 0%, #0550ae 100%)',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      fontWeight: '700',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
    },
    content: {
      flex: 1,
      overflow: 'auto',
      padding: '0',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      padding: '16px 24px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '700',
      color: '#6e7681',
      textTransform: 'uppercase',
      borderBottom: '2px solid #e1e4e8',
      background: '#f6f8fa',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      letterSpacing: '0.6px',
    },
    td: {
      padding: '18px 24px',
      borderBottom: '1px solid #e1e4e8',
    },
    badge: {
      padding: '6px 12px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '700',
      display: 'inline-block',
    },
    btnEdit: {
      padding: '8px 14px',
      background: '#fff',
      border: '1px solid #e1e4e8',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      marginRight: '8px',
      transition: 'all 0.2s ease',
    },
    btnDelete: {
      padding: '8px 14px',
      background: '#fff5f5',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      color: '#dc2626',
      transition: 'all 0.2s ease',
    },
    formModal: {
      background: '#fff',
      borderRadius: '16px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '85vh',
      overflow: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '700',
      color: '#24292e',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e1e4e8',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '500',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease',
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e1e4e8',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
    },
    btnSubmit: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #0969da 0%, #0550ae 100%)',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      fontWeight: '700',
      fontSize: '15px',
      cursor: 'pointer',
      marginTop: '1rem',
      transition: 'all 0.2s ease',
    },
  };
 
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
 
        <div style={styles.header}>
          <h2 style={styles.title}>👥 Gestion des Utilisateurs</h2>
          <button onClick={onClose} style={styles.closeBtn}
            onMouseOver={(e) => { e.currentTarget.style.background = '#ffebe9'; e.currentTarget.style.borderColor = '#fecaca'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#f6f8fa'; e.currentTarget.style.borderColor = '#e1e4e8'; }}
          >✕</button>
        </div>
 
        <div style={styles.toolbar}>
          <div style={{ fontSize: '14px', color: '#6e7681', fontWeight: '600' }}>
            {utilisateurs.length} utilisateur(s) •{' '}
            <span style={{ color: '#1a7f37' }}>
              {utilisateurs.filter(u => u.actif).length} actif(s)
            </span>
            {' '}•{' '}
            <span style={{ color: '#dc2626' }}>
              {utilisateurs.filter(u => !u.actif).length} inactif(s)
            </span>
          </div>
          <button style={styles.btnAjouter} onClick={() => { resetForm(); setShowAjouterModal(true); }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            ➕ Ajouter utilisateur
          </button>
        </div>
 
        <div style={styles.content}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6e7681' }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>⏳</div>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>Chargement...</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nom</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Rôle</th>
                  <th style={styles.th}>Statut</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((user) => {
                  const roleColors = getRoleBadgeColor(user.role);
                  return (
                    <tr
                      key={user.id_user}
                      style={{
                        transition: 'background 0.2s ease',
                        opacity: user.actif ? 1 : 0.65,
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f6f8fa'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...styles.td, fontWeight: '700', fontSize: '15px' }}>
                        {user.nom}
                        {!user.actif && (
                          <span style={{
                            marginLeft: '10px',
                            fontSize: '11px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: '700',
                          }}>
                            INACTIF
                          </span>
                        )}
                      </td>
                      <td style={{ ...styles.td, color: '#6e7681' }}>{user.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: roleColors.bg,
                          color: roleColors.color,
                        }}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {/* ── Toggle switch visuel ── */}
                        <div
                          onClick={() => handleToggleActif(user)}
                          title={user.actif ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          {/* Switch track */}
                          <div style={{
                            width: '46px',
                            height: '26px',
                            borderRadius: '13px',
                            background: user.actif ? '#1a7f37' : '#d1d5db',
                            position: 'relative',
                            transition: 'background 0.3s ease',
                            flexShrink: 0,
                          }}>
                            {/* Switch thumb */}
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: '#fff',
                              position: 'absolute',
                              top: '3px',
                              left: user.actif ? '23px' : '3px',
                              transition: 'left 0.3s ease',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                            }} />
                          </div>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: user.actif ? '#1a7f37' : '#991b1b',
                          }}>
                            {user.actif ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.btnEdit} onClick={() => openModifier(user)}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#f6f8fa'; e.currentTarget.style.borderColor = '#d0d7de'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e1e4e8'; }}
                        >
                          ✏️ Modifier
                        </button>
                        <button style={styles.btnDelete} onClick={() => handleSupprimer(user.id_user)}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.borderColor = '#fecaca'; }}
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
 
      {(showAjouterModal || showModifierModal) && (
        <div style={{ ...styles.overlay, zIndex: 1100 }} onClick={() => {
          setShowAjouterModal(false);
          setShowModifierModal(false);
          resetForm();
        }}>
          <div style={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.header}>
              <h2 style={styles.title}>
                {showAjouterModal ? '➕ Ajouter Utilisateur' : '✏️ Modifier Utilisateur'}
              </h2>
              <button onClick={() => {
                setShowAjouterModal(false);
                setShowModifierModal(false);
                resetForm();
              }} style={styles.closeBtn}>✕</button>
            </div>
 
            <form onSubmit={showAjouterModal ? handleAjouter : handleModifier} style={{ padding: '2rem 2.5rem' }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  style={styles.input}
                  required
                  onFocus={(e) => e.target.style.borderColor = '#0969da'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e4e8'}
                />
              </div>
 
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={styles.input}
                  required
                  onFocus={(e) => e.target.style.borderColor = '#0969da'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e4e8'}
                />
              </div>
 
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Mot de passe {showModifierModal && '(laisser vide pour ne pas changer)'}
                </label>
                <input
                  type="password"
                  value={formData.mot_de_passe}
                  onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                  style={styles.input}
                  required={showAjouterModal}
                  onFocus={(e) => e.target.style.borderColor = '#0969da'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e4e8'}
                />
              </div>
 
              <div style={styles.formGroup}>
                <label style={styles.label}>Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={styles.select}
                  required
                  onFocus={(e) => e.target.style.borderColor = '#0969da'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e4e8'}
                >
                  <option value="MAGASINIER">Magasinier</option>
                  <option value="CHEF_ATELIER">Chef d'Atelier</option>
                  <option value="DIR_TECHNIQUE">Directeur Technique</option>
                  <option value="DIR_GENERAL">Directeur Général</option>
                  <option value="DIR_COMMERCIAL">Directeur Commercial</option>
                </select>
              </div>
 
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.actif}
                    onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Compte actif
                </label>
              </div>
 
              <button type="submit" style={styles.btnSubmit}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {showAjouterModal ? '➕ Ajouter' : '✏️ Modifier'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default GestionUtilisateurs;