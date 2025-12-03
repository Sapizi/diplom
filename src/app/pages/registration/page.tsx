'use client'
import Header from "@/app/components/Header/Header";
import {
    CheckboxContainer, CheckBoxLink, CheckBoxText, LoginButton, LoginCheckbox, LoginContainer, LoginForm, LoginFormInput, LoginFormLabel, LoginFormTitle, LoginInputContainer
} from "@/app/pages/registration/RegistrationStyles";
import Footer from "@/app/components/Footer/Footer";
import { useState } from 'react';

export default function LoginPage() {
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message);
                // Очистить форму или перенаправить
                setFormData({ name: '', email: '', phone: '', password: '' });
                // Например, можно перенаправить:
                // window.location.href = '/pages/login';
            } else {
                setError(data.error || 'Ошибка регистрации');
            }
        } catch (err) {
            setError('Произошла ошибка сети');
        }
    };

    return (
        <>
            <Header/>
            <LoginContainer>
                <LoginForm onSubmit={handleSubmit}>
                    <LoginFormTitle>Регистрация</LoginFormTitle>

                    {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                    {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

                    <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'39px' }}>
                        <LoginInputContainer>
                            <LoginFormLabel>Логин</LoginFormLabel>
                            <LoginFormInput
                                minLength={2}
                                type={'text'}
                                required={true}
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </LoginInputContainer>
                        <LoginInputContainer>
                            <LoginFormLabel>Почта</LoginFormLabel>
                            <LoginFormInput
                                type={'email'}
                                required={true}
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </LoginInputContainer>
                        <LoginInputContainer>
                            <LoginFormLabel>Телефон</LoginFormLabel>
                            <LoginFormInput
                                minLength={11}
                                maxLength={12}
                                type={'tel'}
                                required={true}
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </LoginInputContainer>
                        <LoginInputContainer>
                            <LoginFormLabel>Пароль</LoginFormLabel>
                            <LoginFormInput
                                minLength={6}
                                type={'password'}
                                required={true}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </LoginInputContainer>
                        <CheckboxContainer>
                            <LoginCheckbox type={'checkbox'} required={true}/>
                            <CheckBoxText>Я согласен с <CheckBoxLink href={'/'}>пользовательским соглашением</CheckBoxLink></CheckBoxText>
                        </CheckboxContainer>
                        <CheckboxContainer>
                            <LoginCheckbox type={'checkbox'} required={true}/>
                            <CheckBoxText>Я согласен с <CheckBoxLink href={'/'}>политикой обработки личных данных</CheckBoxLink></CheckBoxText>
                        </CheckboxContainer>
                    </div>

                    <LoginButton type={'submit'}>Зарегистрироваться</LoginButton>
                    <CheckBoxText style={{ marginTop: '10px' }}>Уже есть аккаунт? <CheckBoxLink href={'/pages/login'}>Войти</CheckBoxLink></CheckBoxText>
                </LoginForm>
            </LoginContainer>
            <Footer/>
        </>
    )
}