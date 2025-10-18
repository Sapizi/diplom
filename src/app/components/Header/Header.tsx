'use client'
import {
    HeaderContainer,
    HeaderContent, Logo,
    LogoContainer,
    SocialLink,
    SocialLinks, UserButtonLink, UserButtons,
    Wrapper
} from "@/app/components/Header/HeaderStyles";

export default function Header(){
    return (
        <>
            <HeaderContainer>
                <Wrapper>
                    <HeaderContent>
                        <SocialLinks>
                            <SocialLink href={'https://web.telegram.org/'}>
                                <img src="/telegram_icon.svg" alt="Telegram contact" />
                            </SocialLink>
                            <SocialLink href={'https://vk.com/'}>
                                <img src="/vk_icon.svg" alt="VK contact"/>
                            </SocialLink>
                            <SocialLink href={'#'}>+7-999-99-99</SocialLink>
                        </SocialLinks>
                        <LogoContainer>
                            <Logo src="/logo.svg" alt="Logotype"/>
                        </LogoContainer>
                        <UserButtons>
                            <UserButtonLink href={'#'}>Войти</UserButtonLink>
                            <UserButtonLink href={'#'}>
                                <img src="/cart.svg" alt="Cart"/>
                            </UserButtonLink>
                        </UserButtons>
                    </HeaderContent>
                </Wrapper>
            </HeaderContainer>
        </>
    )
}