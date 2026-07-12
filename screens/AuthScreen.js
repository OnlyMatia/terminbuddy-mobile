import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingInput } from '../components/FloatingInput';
import { BLogo, EyeIcon, EyeOffIcon, GoogleIcon, MailIcon } from '../components/Icons';
import { Toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { colors, radius } from '../theme/colors';
import { calcPasswordStrength, STRENGTH_COLORS, STRENGTH_LABELS } from '../utils/authUtils';

export default function AuthScreen() {
  const router = useRouter();
  const { login, signUp, signInWithGoogle } = useAuth();

  const contentAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [pendingEmail, setPendingEmail] = useState(null);
  const [forgotSentEmail, setForgotSentEmail] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const showToast = useCallback((message) => {
    setToast({ message, id: Date.now() });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!pendingEmail) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        router.replace('/onboarding');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [pendingEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'password' && mode === 'register') {
      setPasswordStrength(calcPasswordStrength(value));
    }
  };

  const handleEmailFocus = () => {
    if (mode === 'login') setPasswordVisible(true);
  };

  const showPasswordField = mode === 'register' || passwordVisible;

  const switchMode = (newMode) => {
    Animated.timing(contentAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setMode(newMode);
      setToast(null);
      setPasswordVisible(false);
      setPasswordStrength(0);
      setShowPassword(false);
      setShowPasswordConfirm(false);
      setFormData((p) => (newMode === 'forgot' ? { email: p.email, password: '', confirmPassword: '' } : { email: '', password: '', confirmPassword: '' }));
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setToast(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      showToast(err.message || 'Greška pri prijavi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setToast(null);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Lozinke se ne podudaraju.');
        }
        if (formData.password.length < 6) {
          throw new Error('Lozinka mora imati najmanje 6 znakova.');
        }

        const result = await signUp(formData.email, formData.password);
        if (!result.success) throw new Error(result.error);

        setPendingEmail(formData.email);
        setResendCooldown(60);
        setLoading(false);
        return;
      } else {
        const result = await login(formData.email, formData.password);
        if (!result.success) throw new Error(result.error);
      }

      router.replace('/(tabs)');
    } catch (err) {
      showToast(err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      showToast('Unesi email adresu.');
      return;
    }
    setLoading(true);
    setToast(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email.trim());
      if (error) throw new Error(error.message);
      setForgotSentEmail(formData.email.trim());
      setResendCooldown(60);
    } catch (err) {
      showToast(err.message || 'Greška pri slanju.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || resending || !pendingEmail) return;
    setResending(true);
    setToast(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      });
      if (error) throw new Error(error.message);
      showToast('Email je ponovno poslan!');
      setResendCooldown(60);
    } catch (err) {
      showToast(err.message || 'Greška pri slanju.');
    } finally {
      setResending(false);
    }
  };

  const handleResendResetEmail = async () => {
    if (resendCooldown > 0 || resending || !forgotSentEmail) return;
    setResending(true);
    setToast(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotSentEmail);
      if (error) throw new Error(error.message);
      showToast('Email je ponovno poslan!');
      setResendCooldown(60);
    } catch (err) {
      showToast(err.message || 'Greška pri slanju.');
    } finally {
      setResending(false);
    }
  };

  const handleBackToForm = () => {
    setPendingEmail(null);
    setResendCooldown(0);
    setFormData({ email: '', password: '', confirmPassword: '' });
    setMode('register');
  };

  const handleBackFromForgot = () => {
    setForgotSentEmail(null);
    setResendCooldown(0);
    setFormData({ email: '', password: '', confirmPassword: '' });
    setMode('login');
  };

  if (pendingEmail) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <EmailWaitingScreen email={pendingEmail} onBack={handleBackToForm} onResend={handleResendEmail} cooldown={resendCooldown} resending={resending} variant="signup" />
        {toast && <Toast toast={toast} onDismiss={dismissToast} />}
      </SafeAreaView>
    );
  }

  if (forgotSentEmail) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <EmailWaitingScreen email={forgotSentEmail} onBack={handleBackFromForgot} onResend={handleResendResetEmail} cooldown={resendCooldown} resending={resending} variant="reset" />
        {toast && <Toast toast={toast} onDismiss={dismissToast} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: modalAnim,
              transform: [
                {
                  translateY: modalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            }}
          >
            <View style={styles.brandRow}>
              <BLogo size={28} />
              <Text style={styles.brandText}>TerminBuddy</Text>
            </View>

            <Animated.View style={{ opacity: contentAnim }}>
              {mode === 'forgot' ? (
                <ForgotPasswordForm formData={formData} setField={setField} onSubmit={handleForgotPassword} loading={loading} onBackToLogin={() => switchMode('login')} />
              ) : (
                <>
                  <Text style={styles.title}>{mode === 'login' ? 'Dobrodošli natrag' : 'Pridruži se i zaigraj'}</Text>
                  <Text style={styles.subtitle}>{mode === 'login' ? 'Prijavi se i istraži današnje termine.' : '30 sekundi za registraciju. Tvoj prvi termin neka bude danas'}</Text>

                  <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={loading} activeOpacity={0.85}>
                    <GoogleIcon size={18} />
                    <Text style={styles.googleBtnText}>{mode === 'login' ? 'Nastavi s Googleom' : 'Registriraj se s Googleom'}</Text>
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>{mode === 'login' ? 'ili nastavi s emailom' : 'ili s emailom'}</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={{ gap: 14 }}>
                    <FloatingInput label="Email adresa" value={formData.email} onChangeText={(v) => setField('email', v)} onFocus={handleEmailFocus} keyboardType="email-address" icon={<MailIcon />} />

                    {showPasswordField && (
                      <>
                        <FloatingInput
                          label={mode === 'login' ? 'Lozinka' : 'Kreiraj lozinku'}
                          value={formData.password}
                          onChangeText={(v) => setField('password', v)}
                          secureTextEntry={!showPassword}
                          rightIcon={showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                          onRightIconPress={() => setShowPassword(!showPassword)}
                        />

                        {mode === 'register' && formData.password.length > 0 && (
                          <View style={{ paddingHorizontal: 4, marginTop: -6 }}>
                            <View style={{ flexDirection: 'row', gap: 3 }}>
                              {[1, 2, 3, 4].map((n) => (
                                <View
                                  key={n}
                                  style={{
                                    flex: 1,
                                    height: 3,
                                    borderRadius: 2,
                                    backgroundColor: n <= passwordStrength ? STRENGTH_COLORS[passwordStrength] : colors.bg3,
                                  }}
                                />
                              ))}
                            </View>
                            {passwordStrength > 0 && (
                              <Text style={styles.strengthText}>
                                Jačina: <Text style={{ color: STRENGTH_COLORS[passwordStrength], fontWeight: '600' }}>{STRENGTH_LABELS[passwordStrength]}</Text>
                              </Text>
                            )}
                          </View>
                        )}

                        {mode === 'register' && (
                          <FloatingInput
                            label="Potvrdi lozinku"
                            value={formData.confirmPassword}
                            onChangeText={(v) => setField('confirmPassword', v)}
                            secureTextEntry={!showPasswordConfirm}
                            rightIcon={showPasswordConfirm ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                            onRightIconPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          />
                        )}
                      </>
                    )}

                    {mode === 'login' && showPasswordField && (
                      <View style={styles.rememberRow}>
                        <Text style={styles.rememberText}>Zapamti me</Text>
                        <TouchableOpacity onPress={() => switchMode('forgot')}>
                          <Text style={styles.forgotLink}>Zaboravljena lozinka?</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: loading ? colors.bg3 : colors.logoGreen }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.9}>
                      {loading && <ActivityIndicator size="small" color={colors.textSec} />}
                      <Text
                        style={{
                          color: loading ? colors.textSec : '#000',
                          fontWeight: '600',
                          fontSize: 14,
                        }}
                      >
                        {mode === 'login' ? (showPasswordField ? 'Prijavi se' : 'Nastavi') : 'Registriraj se'}
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.legalText}>{mode === 'login' ? 'Nastavljanjem prihvaćate naše Uvjete i Privatnost.' : 'Kreiranjem računa prihvaćate naše Uvjete i Privatnost.'}</Text>
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.switchText}>{mode === 'login' ? 'Novi na TerminBuddy?' : 'Već imaš račun?'}</Text>
                    <TouchableOpacity onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                      <Text style={styles.switchLink}>{mode === 'login' ? 'Kreiraj račun' : 'Prijavi se'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Animated.View>
          </Animated.View>
        </ScrollView>

        {toast && <Toast toast={toast} onDismiss={dismissToast} />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ForgotPasswordForm({ formData, setField, onSubmit, loading, onBackToLogin }) {
  return (
    <>
      <Text style={styles.title}>Resetiraj lozinku</Text>
      <Text style={styles.subtitle}>Unesi email adresu računa i poslat ćemo ti link za postavljanje nove lozinke.</Text>

      <View style={{ gap: 14 }}>
        <FloatingInput label="Email adresa" value={formData.email} onChangeText={(v) => setField('email', v)} keyboardType="email-address" icon={<MailIcon />} />

        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: loading ? colors.bg3 : colors.logoGreen }]} onPress={onSubmit} disabled={loading} activeOpacity={0.9}>
          {loading && <ActivityIndicator size="small" color={colors.textSec} />}
          <Text style={{ color: loading ? colors.textSec : '#000', fontWeight: '600', fontSize: 14 }}>Pošalji link za reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Sjetio si se lozinke?</Text>
        <TouchableOpacity onPress={onBackToLogin}>
          <Text style={styles.switchLink}>Prijavi se</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function EmailWaitingScreen({ email, onBack, onResend, cooldown, resending, variant = 'signup' }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const entryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const isReset = variant === 'reset';
  const descriptionEnd = isReset ? '. Klikni na link u poruci kako bi postavio novu lozinku.' : '. Klikni na link u poruci kako bi aktivirao račun.';
  const waitingText = isReset ? 'Čekamo reset...' : 'Čekamo potvrdu...';
  const backLabel = isReset ? 'Natrag na prijavu' : 'Promijeni email adresu';

  return (
    <View style={styles.waitingContainer}>
      <Animated.View
        style={[
          styles.waitingIcon,
          {
            opacity: entryAnim,
            transform: [
              {
                translateY: floatAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4],
                }),
              },
            ],
          },
        ]}
      >
        <MailIcon size={32} color={colors.text} />
      </Animated.View>

      <Text style={styles.waitingTitle}>Provjeri svoj email</Text>
      <Text style={styles.waitingDesc}>
        Poslali smo link na{'\n'}
        <Text style={{ color: colors.text, fontWeight: '600' }}>{email}</Text>
        {descriptionEnd}
      </Text>

      <View style={styles.waitingSpinnerRow}>
        <ActivityIndicator size="small" color={colors.textFaint} />
        <Text style={styles.waitingSpinnerText}>{waitingText}</Text>
      </View>

      <TouchableOpacity style={styles.resendBtn} onPress={onResend} disabled={cooldown > 0 || resending} activeOpacity={0.8}>
        <Text style={styles.resendBtnText}>{resending ? 'Slanje...' : cooldown > 0 ? `Pošalji ponovno (${cooldown}s)` : 'Pošalji ponovno'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack} style={{ marginTop: 8 }}>
        <Text style={styles.backLink}>{backLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 36,
  },
  brandText: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    color: colors.textSec,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 340,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.text,
    marginBottom: 20,
  },
  googleBtnText: {
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    color: colors.textFaint,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  strengthText: {
    color: colors.textSec,
    fontSize: 11,
    marginTop: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -4,
  },
  rememberText: {
    color: colors.textSec,
    fontSize: 13,
  },
  forgotLink: {
    color: colors.textSec,
    fontSize: 13,
  },
  submitBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.xl,
    marginTop: 4,
  },
  legalText: {
    color: colors.textFaint,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  switchText: {
    color: colors.textSec,
    fontSize: 13.5,
  },
  switchLink: {
    color: colors.logoGreen,
    fontWeight: '600',
    fontSize: 13.5,
  },
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  waitingIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 28,
  },
  waitingTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  waitingDesc: {
    color: colors.textSec,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 300,
  },
  waitingSpinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  waitingSpinnerText: {
    color: colors.textSec,
    fontSize: 13,
  },
  resendBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.xl,
    backgroundColor: colors.bg2,
    alignItems: 'center',
  },
  resendBtnText: {
    color: colors.text,
    fontWeight: '500',
    fontSize: 14,
  },
  backLink: {
    color: colors.textSec,
    fontSize: 13,
  },
});
