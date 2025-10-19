import styled from "styled-components";

export const MainNavButton = styled.button`
    display: inline-flex;
    align-items: center;
    padding: 0 13px;
    height: 51px;
    border: 3px solid #F99026;
    border-radius: 10px;
    font-size: 24px;
    background-color: #F8F9FA;
    transition: 0.1s;
    cursor: pointer;
    &:hover {
        background-color: #F99026;
        color: white;
    }
`
export const MainNavButtonsContainer = styled.div`
    margin-left: 1px;
    margin-top: 43px;
    display: flex;
    flex-direction: row;
    gap: 26px;
`