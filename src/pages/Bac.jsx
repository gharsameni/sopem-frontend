import React, { useState, useEffect } from 'react';

const Bac = ({ onClose }) => {
  const [bacs, setBacs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBac, setEditingBac] = useState(null);
  const [formData, setFormData] = useState({ code: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchBacs(); }, []);

  const fetchBacs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/bacs');
      if (res.ok) setBacs(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleOpenAjouter = () => {
    setEditingBac(null);
    setFormData({ code: '' });
    setError('');
    setShowForm(true);
  };

  const handleOpenModifier = (bac) => {
    setEditingBac(bac);
    setFormData({ code: bac.code || '' });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.code.trim()) { setError('❌ Le code est obligatoire'); return; }

    setSaving(true);
    setError('');
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
      };

      const url = editingBac
        ? `http://localhost:8080/api/bacs/${editingBac.id_bac}`
        : 'http://localhost:8080/api/bacs/ajouter';
      const method = editingBac ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Erreur');
      }

      setShowForm(false);
      fetchBacs();
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSupprimer = async (bac) => {
    if (!window.confirm(`⚠️ Supprimer le bac ${bac.code} ?`)) return;
    try {
      const res = await fetch(`http://localhost:8080/api/bacs/${bac.id_bac}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      fetchBacs();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' },
    modal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
    header: { padding: '1.5rem 2rem', borderBottom: '1px solid #e1e4e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 },
    title: { fontSize: '20px', fontWeight: '700', margin: 0, color: '#24292e' },
    closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#586069', padding: '4px' },
    body: { padding: '2rem' },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    count: { fontSize: '14px', color: '#6e7681', fontWeight: '500' },
    btnAjouter: { padding: '10px 20px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' },
    table: { width: '100%', fontSize: '14px', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px 10px', fontWeight: '700', color: '#6e7681', borderBottom: '2px solid #e1e4e8', fontSize: '12px', textTransform: 'uppercase', background: '#f6f8fa' },
    td: { padding: '14px 10px', borderBottom: '1px solid #e1e4e8' },
    tdBold: { padding: '14px 10px', borderBottom: '1px solid #e1e4e8', fontWeight: '700', color: '#24292e' },
    btnEdit: { padding: '6px 12px', fontSize: '12px', fontWeight: '500', border: '1px solid #0969da', background: '#fff', color: '#0969da', borderRadius: '6px', cursor: 'pointer', marginRight: '6px' },
    btnDelete: { padding: '6px 12px', fontSize: '12px', fontWeight: '500', border: '1px solid #dc2626', background: '#fff', color: '#dc2626', borderRadius: '6px', cursor: 'pointer' },
    formOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '2rem' },
    formModal: { background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' },
    formHeader: { padding: '1.5rem 2rem', borderBottom: '1px solid #e1e4e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    formTitle: { fontSize: '18px', fontWeight: '700', margin: 0, color: '#24292e' },
    formBody: { padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    label: { fontSize: '14px', fontWeight: '600', color: '#24292e' },
    required: { color: '#dc2626', marginLeft: '4px' },
    input: { padding: '12px 14px', fontSize: '14px', border: '1px solid #e1e4e8', borderRadius: '8px', outline: 'none' },
    errorBox: { padding: '10px 14px', background: '#ffebe9', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' },
    formFooter: { padding: '1.25rem 2rem', borderTop: '1px solid #e1e4e8', display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    btnCancel: { padding: '10px 20px', fontSize: '14px', fontWeight: '500', border: '1px solid #e1e4e8', background: '#fff', borderRadius: '8px', cursor: 'pointer' },
    btnSave: { padding: '10px 24px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', borderRadius: '8px', cursor: 'pointer' },
    btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
    empty: { textAlign: 'center', padding: '3rem', color: '#6e7681' },
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.header}>
            <h2 style={styles.title}>📦 Gestion des Bacs</h2>
            <button style={styles.closeBtn} onClick={onClose}
              onMouseOver={(e) => e.currentTarget.style.color = '#24292e'}
              onMouseOut={(e) => e.currentTarget.style.color = '#586069'}>×</button>
          </div>

          <div style={styles.body}>
            <div style={styles.topBar}>
              <span style={styles.count}>{bacs.length} bac(s) enregistré(s)</span>
              <button type="button" style={styles.btnAjouter} onClick={handleOpenAjouter}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                + Ajouter un bac
              </button>
            </div>

            {loading ? (
              <div style={styles.empty}>⏳ Chargement...</div>
            ) : bacs.length === 0 ? (
              <div style={styles.empty}>📭 Aucun bac enregistré — cliquez sur "Ajouter un bac"</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bacs.map((bac) => (
                    <tr key={bac.id_bac}>
                      <td style={styles.tdBold}>{bac.code}</td>
                      <td style={styles.td}>
                        <button type="button" style={styles.btnEdit} onClick={() => handleOpenModifier(bac)}
                          onMouseOver={(e) => e.currentTarget.style.background = '#ddf4ff'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#fff'}>
                          ✏️ Modifier
                        </button>
                        <button type="button" style={styles.btnDelete} onClick={() => handleSupprimer(bac)}
                          onMouseOver={(e) => e.currentTarget.style.background = '#ffebe9'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#fff'}>
                          🗑️ Supprimer
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

      {showForm && (
        <div style={styles.formOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>{editingBac ? '✏️ Modifier le bac' : '+ Nouveau bac'}</h3>
              <button style={styles.closeBtn} onClick={() => setShowForm(false)}>×</button>
            </div>

            <div style={styles.formBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Code<span style={styles.required}>*</span></label>
                <input type="text" style={styles.input} placeholder="Ex: A1, B3, C12"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e1e4e8'} />
              </div>

              {error && <div style={styles.errorBox}>{error}</div>}
            </div>

            <div style={styles.formFooter}>
              <button type="button" style={styles.btnCancel} onClick={() => setShowForm(false)}
                onMouseOver={(e) => e.currentTarget.style.background = '#f6f8fa'}
                onMouseOut={(e) => e.currentTarget.style.background = '#fff'}>
                Annuler
              </button>
              <button type="button"
                style={{...styles.btnSave, ...(saving ? styles.btnDisabled : {})}}
                onClick={handleSubmit} disabled={saving}>
                {saving ? '⏳ Enregistrement...' : '✓ Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Bac;