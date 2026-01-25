'use client';

import Header from '@/app/components/Header/Header';
import Footer from '@/app/components/Footer/Footer';
import {CheckboxContainer,CheckBoxLink,CheckBoxText,LoginButton,LoginContainer,LoginForm,LoginFormInput,LoginFormLabel,LoginFormTitle,LoginInputContainer,} from '@/app/pages/registration/RegistrationStyles';
import { useState } from 'react';
import { signUpWithEmail } from '@/app/api/client/auth';
export default function RegistrationPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { name, email, phone, password } = formData;
    if (name.trim().length < 2) {
      setError('Имя должно содержать минимум 2 символа');
      return;
    }
    if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''))) {
      setError('Некорректный номер телефона (пример: +79991234567)');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      const { data, error: authError } = await signUpWithEmail(email, password, {
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!data.user) {
        setError('Не удалось создать пользователя. Попробуйте позже.');
        return;
      }

      setSuccess(
        'Регистрация успешна! Мы отправили письмо для подтверждения на вашу почту.'
      );
      setFormData({ name: '', email: '', phone: '', password: '' });
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Произошла неизвестная ошибка. Попробуйте позже.');
    }
  };

  return (
    <>
      <Header />
      <LoginContainer>
        <LoginForm onSubmit={handleSubmit}>
          <LoginFormTitle>Регистрация</LoginFormTitle>

          {error && (
            <div style={{ color: 'red', marginBottom: '12px', textAlign: 'center' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ color: 'green', marginBottom: '12px', textAlign: 'center' }}>
              {success}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
            <LoginInputContainer>
              <LoginFormLabel>Имя</LoginFormLabel>
              <LoginFormInput
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={2}
                placeholder="Введите ваше имя"
              />
            </LoginInputContainer>


            <LoginInputContainer>
              <LoginFormLabel>Электронная почта</LoginFormLabel>
              <LoginFormInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="example@mail.com"
              />
            </LoginInputContainer>


            <LoginInputContainer>
              <LoginFormLabel>Телефон</LoginFormLabel>
              <LoginFormInput
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+7 (999) 123-45-67"
              />
            </LoginInputContainer>

            <LoginInputContainer>
              <LoginFormLabel>Пароль</LoginFormLabel>
              <LoginFormInput
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Минимум 6 символов"
              />
            </LoginInputContainer>

            <CheckboxContainer>
              <input type="checkbox" required />
              <CheckBoxText>
                Я согласен с{' '}
                <CheckBoxLink href="/user-agreement">пользовательским соглашением</CheckBoxLink>
              </CheckBoxText>
            </CheckboxContainer>

            <CheckboxContainer>
              <input type="checkbox" required />
              <CheckBoxText>
                Я согласен с{' '}
                <CheckBoxLink href="/privacy-policy">политикой обработки персональных данных</CheckBoxLink>
              </CheckBoxText>
            </CheckboxContainer>
          </div>

          <LoginButton type="submit">Зарегистрироваться</LoginButton>

          <CheckBoxText style={{ marginTop: '20px', textAlign: 'center' }}>
            Уже есть аккаунт?{' '}
            <CheckBoxLink href="/pages/login">Войти</CheckBoxLink>
          </CheckBoxText>
        </LoginForm>
      </LoginContainer>
      <Footer />
    </>
  );
}
