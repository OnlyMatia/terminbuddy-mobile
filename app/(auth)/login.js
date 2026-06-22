import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { supabase } from "../../lib/supabase";
import { InputField } from "../../components/InputField";
import { theme } from "../../constants/theme";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri();

async function createSessionFromUrl(url) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { code } = params;
  if (!code) return null;
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data.session;
}

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState(null);

  const strength = (() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabels = ["", "Slaba", "Srednja", "Jaka", "Odlična"];
  const strengthColors = [
    "",
    theme.danger,
    theme.warn,
    theme.logoGreen,
    theme.logoGreen,
  ];

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      const res = await WebBrowser.openAuthSessionAsync(
        data?.url ?? "",
        redirectTo,
      );
      if (res.type === "success") await createSessionFromUrl(res.url);
    } catch (e) {
      setError(e.message || "Greška pri prijavi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        if (password !== confirm) throw new Error("Lozinke se ne podudaraju.");
        if (password.length < 6)
          throw new Error("Lozinka mora imati najmanje 6 znakova.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        setPendingEmail(email);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (e) {
      setError(e.message || "Nešto je pošlo po zlu.");
    } finally {
      setLoading(false);
    }
  };

  if (pendingEmail) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.waitWrap}>
          <Text style={styles.waitIcon}>✉️</Text>
          <Text style={styles.h1}>Provjeri svoj email</Text>
          <Text style={styles.sub}>
            Poslali smo link na {pendingEmail}. Klikni na link kako bi aktivirao
            račun.
          </Text>
          <Pressable
            onPress={() => {
              setPendingEmail(null);
              setMode("login");
            }}
          >
            <Text style={styles.linkText}>Natrag na prijavu</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.brand}>TerminBuddy</Text>
            <Text style={styles.h1}>
              {mode === "login" ? "Dobrodošli natrag" : "Pridruži se i zaigraj"}
            </Text>
            <Text style={styles.sub}>
              {mode === "login"
                ? "Prijavi se i istraži današnje termine."
                : "30 sekundi za registraciju. Tvoj prvi termin neka bude danas."}
            </Text>
          </View>

          <Pressable
            style={styles.googleBtn}
            onPress={handleGoogle}
            disabled={loading}
          >
            <Text style={styles.googleText}>
              {mode === "login"
                ? "Nastavi s Googleom"
                : "Registriraj se s Googleom"}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>ili s emailom</Text>
            <View style={styles.line} />
          </View>

          <View style={{ gap: 14 }}>
            <InputField
              label="Email adresa"
              value={email}
              onChangeText={setEmail}
              placeholder="example@gmail.com"
              keyboardType="email-address"
            />

            <InputField
              label={mode === "login" ? "Lozinka" : "Kreiraj lozinku"}
              value={password}
              onChangeText={setPassword}
              placeholder="Unesite lozinku"
              secureTextEntry={!show}
              rightSlot={
                <Pressable onPress={() => setShow((s) => !s)}>
                  <Text style={styles.eye}>{show ? "🙈" : "👁"}</Text>
                </Pressable>
              }
            />

            {mode === "register" && password.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((n) => (
                    <View
                      key={n}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            n <= strength
                              ? strengthColors[strength]
                              : theme.bg3,
                        },
                      ]}
                    />
                  ))}
                </View>
                {strength > 0 && (
                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: strengthColors[strength] },
                    ]}
                  >
                    Jačina: {strengthLabels[strength]}
                  </Text>
                )}
              </View>
            )}

            {mode === "register" && (
              <InputField
                label="Potvrdi lozinku"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Ponovite lozinku"
                secureTextEntry={!show}
              />
            )}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitText}>
                {mode === "login" ? "Prijavi se" : "Registriraj se"}
              </Text>
            )}
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === "login" ? "Novi na TerminBuddy?" : "Već imaš račun?"}
            </Text>
            <Pressable
              onPress={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              <Text style={styles.switchAction}>
                {mode === "login" ? "Kreiraj račun" : "Prijavi se"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.background },
  scroll: { paddingHorizontal: 22, paddingVertical: 30, gap: 18 },
  header: { gap: 8, marginBottom: 4 },
  brand: {
    color: theme.text,
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 14,
  },
  h1: { color: theme.text, fontSize: 30, fontWeight: "600", letterSpacing: -1 },
  sub: { color: theme.textSec, fontSize: 14, lineHeight: 20 },
  googleBtn: {
    backgroundColor: theme.text,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  googleText: { color: "#000", fontWeight: "600", fontSize: 14 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: theme.line },
  dividerText: {
    color: theme.textFaint,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  eye: { fontSize: 16 },
  strengthWrap: { gap: 6, paddingHorizontal: 2, marginTop: -4 },
  strengthBars: { flexDirection: "row", gap: 3 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11 },
  error: { color: theme.danger, fontSize: 13 },
  submitBtn: {
    backgroundColor: theme.logoGreen,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: { color: "#000", fontWeight: "600", fontSize: 15 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  switchText: { color: theme.textSec, fontSize: 13 },
  switchAction: { color: theme.logoGreen, fontSize: 13, fontWeight: "600" },
  waitWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 14,
  },
  waitIcon: { fontSize: 48 },
  linkText: { color: theme.logoGreen, fontSize: 14, marginTop: 10 },
});
