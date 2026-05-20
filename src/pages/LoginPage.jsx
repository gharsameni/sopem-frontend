import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const logoSopem = '/logo-sopem.png';

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Email ou mot de passe incorrect');
      }

localStorage.setItem('user', JSON.stringify(data));
localStorage.setItem('token', data.token);
localStorage.setItem('role', data.role);
      
      
      toast.success(`Bienvenue ${data.nom}! 👋`, {
        duration: 2000,
        style: {
          background: '#0ac5ff',
          color: '#fff',
        },
      });
      
      setTimeout(() => {
        onLoginSuccess(data);
      }, 800);
      
    } catch (err) {
      toast.error(err.message, {
        duration: 4000,
        icon: '🔒',
      });
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      height: '100vh',
      width: '100vw',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      margin: '0',
      padding: '0',
      overflow: 'hidden',
      background: '#0a0a0a',
    },
    leftSide: {
      background: 'linear-gradient(135deg, #0f2942 0%, #00bfff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem',
      position: 'relative',
      overflow: 'hidden',
    },
    orb1: {
      position: 'absolute',
      width: '700px',
      height: '700px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%)',
      top: '-250px',
      right: '-250px',
      filter: 'blur(80px)',
      animation: 'float 25s ease-in-out infinite',
    },
    orb2: {
      position: 'absolute',
      width: '600px',
      height: '600px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(15, 41, 66, 0.3) 0%, transparent 70%)',
      bottom: '-200px',
      left: '-200px',
      filter: 'blur(80px)',
      animation: 'float 20s ease-in-out infinite reverse',
    },
    orb3: {
      position: 'absolute',
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(10, 197, 255, 0.15) 0%, transparent 70%)',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      filter: 'blur(60px)',
      animation: 'pulse 15s ease-in-out infinite',
    },
    brandingContent: {
      position: 'relative',
      zIndex: 10,
      textAlign: 'center',
      color: '#fff',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    logoContainer: {
      marginBottom: '3rem',
      animation: 'fadeInDown 1s ease-out',
    },
    logoLarge: {
      width: '220px',
      height: 'auto',
      filter: 'drop-shadow(0 15px 40px rgba(0,191,255,0.6))',
      transition: 'transform 0.3s ease',
    },
    logoFallbackLarge: {
      width: '220px',
      height: '73px',
      background: 'rgba(10, 197, 255, 0.2)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#00d4ff',
      fontSize: '36px',
      fontWeight: '800',
      letterSpacing: '6px',
      border: '2px solid rgba(0, 212, 255, 0.4)',
      boxShadow: '0 8px 32px rgba(0, 191, 255, 0.3)',
    },
    brandTitle: {
      fontSize: '52px',
      fontWeight: '900',
      margin: '0 0 1.25rem 0',
      letterSpacing: '-2px',
      textShadow: '0 4px 30px rgba(0,191,255,0.5)',
      animation: 'fadeInUp 1s ease-out 0.2s both',
    },
    brandSubtitle: {
      fontSize: '22px',
      fontWeight: '300',
      margin: '0',
      opacity: '0.95',
      letterSpacing: '0.5px',
      animation: 'fadeInUp 1s ease-out 0.4s both',
    },
    brandFeatures: {
      marginTop: '4.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.75rem',
      alignItems: 'flex-start',
    },
    feature: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      fontSize: '17px',
      opacity: '0.95',
      transition: 'all 0.3s ease',
      padding: '0.5rem',
      borderRadius: '12px',
      animation: 'fadeInLeft 0.6s ease-out',
    },
    featureIcon: {
      fontSize: '26px',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(10, 197, 255, 0.25)',
      borderRadius: '14px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 212, 255, 0.4)',
      transition: 'all 0.3s ease',
    },
    rightSide: {
      background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem',
      position: 'relative',
    },
    decorCircle1: {
      position: 'absolute',
      width: '500px',
      height: '500px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(0, 191, 255, 0.06) 0%, transparent 70%)',
      top: '-200px',
      right: '-200px',
      animation: 'rotate 30s linear infinite',
    },
    decorCircle2: {
      position: 'absolute',
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(15, 41, 66, 0.06) 0%, transparent 70%)',
      bottom: '-150px',
      left: '-150px',
      animation: 'rotate 25s linear infinite reverse',
    },
    formContainer: {
      width: '100%',
      maxWidth: '480px',
      position: 'relative',
      zIndex: 10,
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
    },
    formCard: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(20px)',
      borderRadius: '28px',
      padding: '3rem 2.5rem',
      boxShadow: '0 20px 60px rgba(0, 191, 255, 0.12), 0 0 1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
    },
    formHeader: {
      marginBottom: '2.5rem',
      textAlign: 'center',
    },
    welcomeText: {
      fontSize: '13px',
      fontWeight: '700',
      color: '#0ac5ff',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      margin: '0 0 1rem 0',
    },
    formTitle: {
      fontSize: '42px',
      fontWeight: '900',
      background: 'linear-gradient(135deg, #0f2942 0%, #0ac5ff 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: '0 0 0.75rem 0',
      letterSpacing: '-1.5px',
    },
    formSubtitle: {
      fontSize: '15px',
      color: '#475569',
      margin: '0',
      fontWeight: '400',
      lineHeight: '1.6',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.75rem',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem',
    },
    label: {
      fontSize: '13px',
      fontWeight: '700',
      color: '#0f2942',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    },
    inputWrapper: {
      position: 'relative',
    },
    inputIcon: {
      position: 'absolute',
      left: '22px',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '20px',
      opacity: '0.6',
      pointerEvents: 'none',
      transition: 'all 0.3s ease',
      zIndex: 2,
    },
    input: {
      width: '100%',
      padding: '20px 24px 20px 60px',
      fontSize: '16px',
      border: '2px solid #e0f2fe',
      borderRadius: '18px',
      outline: 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: '#ffffff',
      color: '#0f2942',
      boxSizing: 'border-box',
      fontWeight: '500',
      boxShadow: '0 1px 3px rgba(0, 191, 255, 0.08)',
    },
    inputFocus: {
      border: '2px solid #0ac5ff',
      background: '#fff',
      boxShadow: '0 0 0 5px rgba(10, 197, 255, 0.15), 0 8px 16px rgba(0, 191, 255, 0.12)',
      transform: 'translateY(-2px)',
    },
    passwordToggle: {
      position: 'absolute',
      right: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'rgba(240, 249, 255, 0.8)',
      border: 'none',
      color: '#475569',
      cursor: 'pointer',
      fontSize: '20px',
      padding: '10px',
      transition: 'all 0.2s ease',
      borderRadius: '12px',
      zIndex: 2,
    },
    button: {
      padding: '20px 36px',
      fontSize: '17px',
      fontWeight: '800',
      color: '#fff',
      background: 'linear-gradient(135deg, #0ac5ff 0%, #0f2942 100%)',
      border: 'none',
      borderRadius: '18px',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      marginTop: '0.5rem',
      boxShadow: '0 16px 32px rgba(10, 197, 255, 0.4)',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      position: 'relative',
      overflow: 'hidden',
    },
    buttonDisabled: {
      opacity: '0.7',
      cursor: 'not-allowed',
    },
    footer: {
      textAlign: 'center',
      marginTop: '2.5rem',
      paddingTop: '2rem',
      borderTop: '2px solid rgba(224, 242, 254, 0.6)',
    },
    footerText: {
      fontSize: '14px',
      color: '#475569',
      margin: '0',
      fontWeight: '500',
    },
    footerLink: {
      color: '#0ac5ff',
      textDecoration: 'none',
      fontWeight: '700',
      transition: 'all 0.2s ease',
      borderBottom: '2px solid transparent',
      position: 'relative',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.container}>
      {/* CÔTÉ GAUCHE - BRANDING */}
      <div style={styles.leftSide}>
        <div style={styles.orb1}></div>
        <div style={styles.orb2}></div>
        <div style={styles.orb3}></div>
        
        <div style={styles.brandingContent}>
          <div style={styles.logoContainer}>
            <img 
              src={logoSopem} 
              alt="SOPEM Logo" 
              style={styles.logoLarge}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05) rotate(2deg)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1) rotate(0deg)'}
            />
            <div style={{...styles.logoFallbackLarge, display: 'none'}}>SOPEM</div>
          </div>
          
          <h1 style={styles.brandTitle}>Gestion du Stock</h1>
          <p style={styles.brandSubtitle}>Solution professionnelle pour optimiser vos stocks</p>
          
          <div style={styles.brandFeatures}>
            {[
              { icon: '📦', text: 'Suivi en temps réel des stocks' },
              { icon: '📊', text: 'Tableaux de bord analytiques' },
              { icon: '🔔', text: 'Alertes automatiques intelligentes' },
              { icon: '🔒', text: 'Sécurité maximale des données' }
            ].map((feature, i) => (
              <div 
                key={i}
                style={{...styles.feature, animationDelay: `${0.6 + i * 0.1}s`}}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateX(8px)';
                  e.currentTarget.style.background = 'rgba(10, 197, 255, 0.15)';
                  e.currentTarget.querySelector('div').style.transform = 'scale(1.1) rotate(5deg)';
                  e.currentTarget.querySelector('div').style.background = 'rgba(10, 197, 255, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.querySelector('div').style.transform = 'scale(1) rotate(0deg)';
                  e.currentTarget.querySelector('div').style.background = 'rgba(10, 197, 255, 0.25)';
                }}
              >
                <div style={styles.featureIcon}>{feature.icon}</div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CÔTÉ DROIT - FORMULAIRE */}
      <div style={styles.rightSide}>
        <div style={styles.decorCircle1}></div>
        <div style={styles.decorCircle2}></div>
        
        <div style={styles.formContainer}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <p style={styles.welcomeText}>Bienvenue</p>
              <h2 style={styles.formTitle}>Connexion</h2>
              <p style={styles.formSubtitle}>Accédez à votre espace de gestion en toute sécurité</p>
            </div>

            <form style={styles.form} onSubmit={handleLogin}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Adresse Email</label>
                <div style={styles.inputWrapper}>
                  <div style={styles.inputIcon}>📧</div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    placeholder="exemple@sopem.com"
                    required
                    onFocus={(e) => {
                      Object.assign(e.target.style, styles.inputFocus);
                      e.target.previousSibling.style.opacity = '0.9';
                      e.target.previousSibling.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid #e0f2fe';
                      e.target.style.background = '#ffffff';
                      e.target.style.boxShadow = '0 1px 3px rgba(0, 191, 255, 0.08)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.previousSibling.style.opacity = '0.6';
                      e.target.previousSibling.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Mot de Passe</label>
                <div style={styles.inputWrapper}>
                  <div style={styles.inputIcon}>🔒</div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    placeholder="••••••••"
                    required
                    onFocus={(e) => {
                      Object.assign(e.target.style, styles.inputFocus);
                      e.target.previousSibling.style.opacity = '0.9';
                      e.target.previousSibling.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '2px solid #e0f2fe';
                      e.target.style.background = '#ffffff';
                      e.target.style.boxShadow = '0 1px 3px rgba(0, 191, 255, 0.08)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.previousSibling.style.opacity = '0.6';
                      e.target.previousSibling.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  />
                  <button
                    type="button"
                    style={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseOver={(e) => {
                      e.target.style.background = '#e0f2fe';
                      e.target.style.color = '#0f2942';
                      e.target.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(240, 249, 255, 0.8)';
                      e.target.style.color = '#475569';
                      e.target.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  ...styles.button,
                  ...(loading ? styles.buttonDisabled : {}),
                }}
                disabled={loading}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 20px 48px rgba(10, 197, 255, 0.5)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 16px 32px rgba(10, 197, 255, 0.4)';
                  }
                }}
              >
                {loading ? '⏳ Connexion en cours...' : '→ Se connecter'}
              </button>
            </form>

            <div style={styles.footer}>
              <p style={styles.footerText}>
                Mot de passe oublié ?{' '}
                <span 
                  style={styles.footerLink}
                  onClick={() => {
                    toast('📧 Veuillez contacter l\'administrateur système pour réinitialiser votre mot de passe.\n\n✉️ Email: mohamedboudabous1998@gmail.com', {
                      duration: 6000,
                      icon: 'ℹ️',
                      style: {
                        minWidth: '350px',
                      },
                    });
                  }}
                  onMouseOver={(e) => {
                    e.target.style.borderBottom = '2px solid #0ac5ff';
                    e.target.style.color = '#0891b2';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.borderBottom = '2px solid transparent';
                    e.target.style.color = '#0ac5ff';
                  }}
                >
                  Contactez l'administrateur
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        ::placeholder {
          color: #bae6fd;
          font-weight: 400;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          33% {
            transform: translateY(-30px) translateX(30px) scale(1.05);
          }
          66% {
            transform: translateY(-10px) translateX(-20px) scale(0.95);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
          -webkit-text-fill-color: #0f2942 !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        
        @media (max-width: 1024px) {
          .container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;