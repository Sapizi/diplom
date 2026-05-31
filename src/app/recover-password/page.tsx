'use client';

import { useState } from 'react';
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
import { requestPasswordReset } from '@/app/api/client/auth';
import styles from './page.module.scss';

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await requestPasswordReset(email.trim(), redirectTo);

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess('Мы отправили письмо со ссылкой для смены пароля. Проверьте вашу почту.');
      setEmail('');
    } catch (requestError) {
      console.error('Password reset request error:', requestError);
      setError('Не удалось отправить письмо для сброса пароля. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <LoginContainer>
        <LoginForm onSubmit={handleSubmit}>
          <LoginFormTitle>Восстановление пароля</LoginFormTitle>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.fields}>
            <p className={styles.description}>
              Укажите email, который использовался при регистрации. Мы отправим ссылку для
              установки нового пароля.
            </p>

            <LoginInputContainer>
              <LoginFormLabel>Email</LoginFormLabel>
              <LoginFormInput
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="example@mail.com"
              />
            </LoginInputContainer>
          </div>

          <LoginButton type="submit" disabled={loading}>
            {loading ? 'Отправляем...' : 'Отправить ссылку'}
          </LoginButton>

          <CheckBoxText className={styles.loginHint}>
            Вспомнили пароль? <CheckBoxLink href="/login">Войти</CheckBoxLink>
          </CheckBoxText>
        </LoginForm>
      </LoginContainer>
      <Footer />
    </>
  );
}
