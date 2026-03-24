'use client';

import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import {
  CheckboxContainer,
  CheckBoxLink,
  CheckBoxText,
  LoginButton,
  LoginCheckbox,
  LoginContainer,
  LoginForm,
  LoginFormInput,
  LoginFormLabel,
  LoginFormTitle,
  LoginInputContainer,
} from "@/app/components/auth/AuthStyles";
import { useState } from "react";
import { signInWithPassword } from "@/app/api/client/auth";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await signInWithPassword(email, password);

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <LoginContainer>
        <LoginForm onSubmit={handleSubmit}>
          <LoginFormTitle>Вход</LoginFormTitle>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.fields}>
            <LoginInputContainer>
              <LoginFormLabel>Email</LoginFormLabel>
              <LoginFormInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@mail.com"
              />
            </LoginInputContainer>

            <LoginInputContainer>
              <LoginFormLabel>Пароль</LoginFormLabel>
              <LoginFormInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </LoginInputContainer>

            <CheckboxContainer>
              <LoginCheckbox
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <CheckBoxText>Запомнить меня</CheckBoxText>
            </CheckboxContainer>
          </div>

          <LoginButton type="submit" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </LoginButton>

          <CheckBoxText className={styles.registrationHint}>
            Еще нет аккаунта? <CheckBoxLink href="/registration">Зарегистрироваться</CheckBoxLink>
          </CheckBoxText>

          <CheckBoxText className={styles.recoveryHint}>
            <CheckBoxLink href="/recover-password">Забыли пароль?</CheckBoxLink>
          </CheckBoxText>
        </LoginForm>
      </LoginContainer>
      <Footer />
    </>
  );
}
