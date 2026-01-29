import Link from "next/link";
import styled from "styled-components";
export const ImageContainer = styled.div`
    width: 280px;
    height: 304px;
    display: flex;
    flex-direction: column;
    gap: 9px;
    align-items: center;
`;
export const Avatar = styled.img`
    width: 207px;
    height: 207px;
    border-radius: 50%;
`
export const Name = styled.span`
    font-size: 24px;
    font-weight: 700;
`
export const ChangeLink = styled.a`
    font-size: 15px;
    font-weight: 400;
    color: #000000;
    transition: 0.1s;
    &:hover{
        color: #F99026;
    }
`
export const Container = styled.div`
    margin-top: 33px;
    display: flex;
    flex-direction: column;
    align-items: center;
`
export const UserActivity = styled.div`
    display: flex;
    flex-direction: row;
    gap: 26px;
    margin-top: 35px;
    
`
export const Bonus = styled.div`
    width: 730px;
    height: 268px;
    background: linear-gradient(to right,#FFB56B 0%,#FF7F24 48%,#F99026 100%);
    padding: 23px;
    border-radius: 10px;
`
export const BonusText = styled.p`
    color: white;
    font-size: 36px;
    font-weight: 700;
`
export const BonusBalance = styled.p`
    color: white;
    font-size: 128px;
    font-weight: 750;
`
export const UserGreyBlock = styled(Link)`
    padding: 23px;
    width: 339px;
    height: 268px;
    border-radius: 10px;
    background-color: #ededed;
    cursor: pointer;
    
`
export const GreyBlockText = styled.p`
    color: black;
    font-size: 36px;
    font-weight: 700;
`
export const GreyBlockP = styled.p`
    color: black;
    font-size: 128px;
    font-weight: 750;
`
