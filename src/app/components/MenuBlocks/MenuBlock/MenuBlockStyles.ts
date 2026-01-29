import styled from "styled-components";
import Link from "next/link";
export const MenuBlockMaket = styled.div`
    display: flex;
    flex-direction: row;
    width: 1263px;
    height: 229px;
    gap: 106px;
`
export const MenuBlockContentLeft = styled.div`
    display: flex;
    flex-direction: column;
    gap: 11px;
    width: 610px;
`
export const MenuBlockTitle = styled.h2`
    font-size: 36px;
    font-weight: bold;
`
export const MenuBlockDescription = styled.p`
    font-size: 16px;
    font-weight: bold;
`
export const MenuBlockLink = styled(Link)`
    font-size: 20px;
    font-weight: bold; 
    text-decoration: none;
    color: black;
    transition: color 0.1s;
    &:hover {
        color: #F99026;
    }
`
export const MenuBlockContentRight = styled.div`
    display: flex;
    gap: 20px;
`
export const MenuBlockImages = styled.div`
    display: flex;
    flex-direction: row;
    gap: 20px;
`
export const MenuBlockImage = styled.img`
    width: 263px;
    height: 229px;
`
