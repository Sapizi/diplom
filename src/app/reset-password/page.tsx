'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
import {
  CheckBoxLink,
  CheckBoxText,
  LoginButton,
  LoginContainer,
  LoginForm,
  LoginFormInput,
  LoginFormLabel,
  LoginFormTitle,
  LoginInputContainer,
} from '@/app/components/auth/AuthStyles';
import { getSession, onAuthStateChange, updatePassword } from '@/app/api/client/auth';
import styles from './page.module.scss';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const currentUrl = new URL(window.location.href);
    const hasRecoveryParams =
      currentUrl.hash.includes('type=recovery') ||
      currentUrl.hash.includes('access_token=') ||
      currentUrl.searchParams.get('type') === 'recovery' ||
      currentUrl.searchParams.has('code') ||
      currentUrl.searchParams.has('token_hash');

    const syncSessionState = async () => {
      const { data, error: sessionError } = await getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        console.error('Reset password session error:', sessionError);
      }

      setRecoveryReady(Boolean(data.session));

      if (data.session || !hasRecoveryParams) {
        setCheckingAccess(false);
      }
    };

    void syncSessionState();

    const fallbackTimer = window.setTimeout(() => {
      if (!isMounted) {
        return;
      }

      setCheckingAccess(false);
    }, hasRecoveryParams ? 2500 : 0);

    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setRecoveryReady(Boolean(session));
      setCheckingAccess(false);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!recoveryReady) {
      setError('Откройте эту страницу по ссылке из письма для восстановления пароля.');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await updatePassword(password);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess('Пароль успешно изменён. Теперь вы можете войти с новым паролем.');
      setPassword('');
      setConfirmPassword('');
      setRecoveryReady(false);
      window.setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (updateRequestError) {
      console.error('Update password error:', updateRequestError);
      setError('Не удалось изменить пароль. Попробуйте открыть ссылку из письма ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <LoginContainer>
        <LoginForm onSubmit={handleSubmit}>
          <LoginFormTitle>Новый пароль</LoginFormTitle>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.fields}>
            <p className={styles.description}>
              {checkingAccess
                ? 'Проверяем ссылку восстановления...'
                : recoveryReady
                  ? 'Введите новый пароль для вашего аккаунта.'
                  : 'Ссылка недействительна или устарела. Запросите новое письмо для восстановления пароля.'}
            </p>

            <LoginInputContainer>
              <LoginFormLabel>Новый пароль</LoginFormLabel>
              <LoginFormInput
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                placeholder="Минимум 6 символов"
                disabled={checkingAccess || !recoveryReady || loading}
              />
            </LoginInputContainer>

            <LoginInputContainer>
              <LoginFormLabel>Повторите пароль</LoginFormLabel>
              <LoginFormInput
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                placeholder="Повторите новый пароль"
                disabled={checkingAccess || !recoveryReady || loading}
              />
            </LoginInputContainer>
          </div>

          <LoginButton type="submit" disabled={checkingAccess || !recoveryReady || loading}>
            {loading ? 'Сохраняем...' : 'Сменить пароль'}
          </LoginButton>

          <CheckBoxText className={styles.loginHint}>
            <CheckBoxLink href="/recover-password">Запросить новую ссылку</CheckBoxLink>
          </CheckBoxText>

          <CheckBoxText className={styles.loginHint}>
            <CheckBoxLink href="/login">Вернуться ко входу</CheckBoxLink>
          </CheckBoxText>
        </LoginForm>
      </LoginContainer>
      <Footer />
    </>
  );
}
