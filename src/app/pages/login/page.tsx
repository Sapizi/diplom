'use client'
import Header from "@/app/components/Header/Header";
import Footer from "@/app/components/Footer/Footer";
import {
    CheckboxContainer, CheckBoxLink, CheckBoxText, LoginButton, LoginCheckbox,
    LoginContainer,
    LoginForm, LoginFormInput, LoginFormLabel,
    LoginFormTitle,
    LoginInputContainer
} from "@/app/pages/registration/RegistrationStyles";

export default function Login() {
    return (
        <>
            <Header/>
            <LoginContainer>
                <LoginForm>
                    <LoginFormTitle>Вход</LoginFormTitle>
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'39px' }}>
                        <LoginInputContainer>
                            <LoginFormLabel>Логин</LoginFormLabel>
                            <LoginFormInput type={'text'} required={true}/>
                        </LoginInputContainer>
                        <LoginInputContainer>
                            <LoginFormLabel>Пароль</LoginFormLabel>
                            <LoginFormInput type={'password'} required={true}/>
                        </LoginInputContainer>
                        <CheckboxContainer>
                            <LoginCheckbox type={'checkbox'} required={true}/>
                            <CheckBoxText>Запомнить меня</CheckBoxText>
                        </CheckboxContainer>
                    </div>

                    <LoginButton type={'submit'}>Войти</LoginButton>
                    <CheckBoxText style={{ marginTop: '10px' }}>Еще нет аккаунта? <CheckBoxLink href={'/pages/registration'}>Зарегистрироваться</CheckBoxLink></CheckBoxText>
                </LoginForm>
            </LoginContainer>
            <Footer/>
        </>
    )
}