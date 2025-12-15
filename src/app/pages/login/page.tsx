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
  LoginInputContainer
} from "../registration/RegistrationStyles";
import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Вход через email + пароль
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user) {
        // Успешный вход — перенаправляем
        router.push('/'); // или другую страницу, например, '/dashboard'
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

          {error && (
            <div style={{ color: 'red', marginBottom: '12px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '39px' }}>
            {/* Email */}
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

            {/* Пароль */}
            <LoginInputContainer>
              <LoginFormLabel>Пароль</LoginFormLabel>
              <LoginFormInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </LoginInputContainer>

            {/* Запомнить меня */}
            <CheckboxContainer>
              <LoginCheckbox
                type="checkbox"
                checked={rememberMe}
                // Supabase по умолчанию сохраняет сессию в localStorage (аналог "запомнить")
                // Этот чекбокс можно оставить как UI-элемент без логики
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <CheckBoxText>Запомнить меня</CheckBoxText>
            </CheckboxContainer>
          </div>

          <LoginButton type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </LoginButton>

          <CheckBoxText style={{ marginTop: '10px', textAlign: 'center' }}>
            Еще нет аккаунта?{' '}
            <CheckBoxLink href="/registration">Зарегистрироваться</CheckBoxLink>
          </CheckBoxText>

          {/* Опционально: ссылка на восстановление пароля */}
          <CheckBoxText style={{ marginTop: '8px', textAlign: 'center' }}>
            <CheckBoxLink href="/recover-password">Забыли пароль?</CheckBoxLink>
          </CheckBoxText>
        </LoginForm>
      </LoginContainer>
      <Footer />
    </>
  );
}