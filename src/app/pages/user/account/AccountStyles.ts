import styled from "styled-components";
export const ImageContainer = styled.div`
    width: 266px;
    height: 267px;
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
    gap: 26px;
    margin-top: 35px;
`
export const Bonus = styled.div`
    width: 730px;
    height: 268px;
    background: linear-gradient(to right,#FFB56B 0%,#FF7F24 48%,#F99026 100%);
`