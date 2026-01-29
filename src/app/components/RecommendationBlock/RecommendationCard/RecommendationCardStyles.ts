import styled from "styled-components";
export const RecommendationCardMaket = styled.div`
    display: flex;
    width: 276px;
    height: 272px;
    background-color: #EDEDED;
    border-radius: 10px;
    transition: 0.2s;
    &:hover {
        border: 3px solid #F99026;
        cursor: pointer;
    }
`
export const RecCardContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-left: 45px;
`
export const RecCardImg = styled.img`

`
export const RecCardTitle = styled.h2`
    font-size: 24px;
    font-weight: bold;
    margin-top: 23px;
`
export const RecCardText = styled.p`
    font-size: 16px;
`
