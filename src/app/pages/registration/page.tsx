'use client'
import Header from "@/app/components/Header/Header";
import {
    CheckboxContainer, CheckBoxLink,
    CheckBoxText, LoginButton,
    LoginCheckbox,
    LoginContainer,
    LoginForm,
    LoginFormInput,
    LoginFormLabel,
    LoginFormTitle,
    LoginInputContainer
} from "@/app/pages/registration/RegistrationStyles";
import Footer from "@/app/components/Footer/Footer";

export default function LoginPage() {
    return (
        <>
            <Header/>
            <LoginContainer>
                <LoginForm>
                    <LoginFormTitle>Регистрация</LoginFormTitle>
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'39px' }}>
                        <LoginInputContainer>
                            <LoginFormLabel>Логин</LoginFormLabel>
                            <LoginFormInput minLength={2} type={'text'} required={true}/>
                        </LoginInputContainer>
                        <LoginInputContainer>
                            <LoginFormLabel>Почта</LoginFormLabel>
                            <LoginFormInput type={'email'} required={true}/>
                        </LoginInputContainer>
                        <LoginInputContainer>
                            <LoginFormLabel>Телефон</LoginFormLabel>
                            <LoginFormInput minLength={11} maxLength={12} type={'phone'} required={true}/>
                        </LoginInputContainer>
                        <LoginInputContainer>
                            <LoginFormLabel>Пароль</LoginFormLabel>
                            <LoginFormInput minLength={6} type={'password'} required={true}/>
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