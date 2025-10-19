import styled from "styled-components";
import Link from "next/link";
export const FooterContainer = styled.footer`
    padding-top: 39px;
    display: flex;
    height: 205px;
    width: 100%;
    border-top: 1px solid #CDCDCD;
    margin-top: 83px;

`
export const FooterTop = styled.div`
    display: flex;
    align-items: center;
    gap: 956px;
`
export const FooterLinks = styled.div`
    display: flex;
    gap: 28px;
`
export const FooterPhoneAndTime = styled.a`
    display: flex;
    flex-direction: column;
    align-items: end;
    
`
export const FooterPhone = styled.a`
    font-size: 20px;
    font-weight: bold;
    color: black;
    transition: 0.1s;
    &:hover {
        color: #F99026;
    }
`
export const FooterTime = styled.p`
    font-size: 15px;
    font-weight: 400;
    cursor: pointer;
`
export const FooterSocials = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 27px;
`
export const FooterBottom = styled.div`
    display: flex;
    margin-top: 39px;
`
export const FooterLinksBottom = styled.div`
    display: flex;
    gap: 21px;
`
export const FooterLink = styled(Link)`
    font-size: 15px;
    font-weight: 400;
    color: black;
    transition: 0.1s;
    &:hover {
        color: #F99026;
    }
`
export const SystemsOfPayment = styled.div`
    display: flex;
    gap: 15px;
    margin-left: 318px;
`
export const SystemOfPayment = styled.img`
    
`