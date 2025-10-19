'use client'
import {
    FooterBottom,
    FooterContainer, FooterLink,
    FooterLinks, FooterLinksBottom,
    FooterPhone,
    FooterPhoneAndTime, FooterSocials, FooterTime,
    FooterTop, SystemOfPayment, SystemsOfPayment
} from "@/app/components/Footer/FooterStyles";
import {Logo, SocialLink, Wrapper} from "@/app/components/Header/HeaderStyles";

export default function Footer() {
    return (
        <>
            <FooterContainer>
                <Wrapper>
                    <FooterTop>
                        <Logo src="/logo.svg" alt="Logotype"/>
                        <FooterLinks>
                            <FooterPhoneAndTime>
                                <FooterPhone href={'tel:+79999999999'}>+7-999-999-99-99</FooterPhone>
                                <FooterTime>График работы</FooterTime>
                            </FooterPhoneAndTime>
                            <FooterSocials>
                                <SocialLink href={'https://web.telegram.org/'}>
                                    <img src="/telegram_icon.svg" alt="Telegram contact" />
                                </SocialLink>
                                <SocialLink href={'https://vk.com/'}>
                                    <img src="/vk_icon.svg" alt="VK contact"/>
                                </SocialLink>
                            </FooterSocials>
                        </FooterLinks>
                    </FooterTop>
                    <FooterBottom>
                        <FooterLinksBottom>
                            <FooterLink href={'#'}>© 2025 ИП Карелин Юрий Сергеевич</FooterLink>
                            <FooterLink href={'#'}>Оплата заказа</FooterLink>
                            <FooterLink href={'#'}>Оферта</FooterLink>
                            <FooterLink href={'#'}>Политика конфиденциальности</FooterLink>
                            <FooterLink href={'#'}>Карта сайта</FooterLink>
                        </FooterLinksBottom>
                        <SystemsOfPayment>
                            <SystemOfPayment src={'/mastercard.svg'}/>
                            <SystemOfPayment src={'/visa.svg'}/>
                            <SystemOfPayment src={'/mir.svg'}/>
                            <SystemOfPayment src={'/sberpay.svg'}/>
                        </SystemsOfPayment>
                    </FooterBottom>
                </Wrapper>
            </FooterContainer>
        </>
    )
}