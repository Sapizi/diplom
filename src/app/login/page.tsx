'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
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
} from '@/app/components/auth/AuthStyles';
import { signInWithPassword } from '@/app/api/client/auth';
import { fetchAuthenticatedRoleProfile } from '@/app/api/client/profiles';
import styles from './page.module.scss';

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
      const { data, error: authError } = await signInWithPassword(email, password);

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data.user && data.session) {
        const { data: roleData, error: profileError } = await fetchAuthenticatedRoleProfile(
          data.session.access_token
        );

        if (profileError || !roleData) {
          setError(profileError?.message ?? 'Не удалось определить роль пользователя');
          return;
        }

        if (roleData.profile?.isCourer) {
          router.push('/courer/loading');
        } else if (roleData.profile?.isManager) {
          router.push('/manager/main');
        } else if (roleData.profile?.isAdmin) {
          router.push('/admin/main');
        } else {
          router.push('/');
        }

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
            {loading ? 'Вход...' : 'Войти'}
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
