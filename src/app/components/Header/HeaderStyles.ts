import styled from "styled-components";
import Link from "next/link";
export const Wrapper = styled.div`
    width: 1480px;
    margin: 0 auto;
    box-sizing: border-box;
`
export const HeaderContainer = styled.header`
    width: 100vw;
    height: 100px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #c9c9c9;
`;
export const HeaderContent = styled.div`
    display: flex;
`
export const SocialLinks = styled.div`
    display: flex;
    align-items: center;
    gap: 42px;
`
export const SocialLink = styled(Link)`
    font-size: 18px;
    font-weight: bold;
    text-decoration: none;
    color: black;
`
export const LogoContainer = styled.div`
    margin-left: 343px; 
`
export const Logo = styled.img`
    
`
export const UserButtons = styled.div`
    display: flex;
    gap: 50px;
    margin-left: 480px;
    align-items: center;
`
export const UserButtonLink = styled(Link)`
    color: black;
    font-weight: 500;
    font-size: 12px;
`