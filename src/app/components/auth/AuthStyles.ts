import styled from "styled-components";
import Link from "next/link";
export const LoginContainer = styled.div`
    width: 100vw;
    height: 75vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`
export const LoginForm = styled.form`
    display: flex;
    flex-direction: column;
    align-items: center;

    width: 533px;
    padding: 45px 0 45px;
    background-color: #F8F9FA;
    border-radius: 10px;
    box-shadow: 0px 3px 10px black;
`
export const LoginFormTitle = styled.h1`
    font-size: 32px;
    font-weight: bold;
`
export const LoginInputContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: start;
`
export const LoginFormLabel = styled.label`
    font-weight: 500;
    font-size: 20px;
`
export const LoginFormInput = styled.input`
    width: 496px;
    height: 36px;
    border: none;
    border-radius: 10px;
    background-color: #EFEFEF;
    padding-left: 10px;
    font-size: 16px;
`
export const CheckboxContainer = styled.div`
    display: flex;
    gap: 11px;
    align-items: center;
`
export const LoginCheckbox = styled.input`
    background-color: #EFEFEF;
    width: 25px;
    height: 25px;
    border: none;
`
export const CheckBoxText = styled.span`
    font-weight: bold;
    font-size: 14px;
`
export const CheckBoxLink = styled(Link)`
    font-weight: bold;
    font-size: 14px;
    text-decoration: none;
    color: #f99026;
`
export const LoginButton = styled.button`
    padding: 0 10px;
    height: 50px;
    border: none;
    border-radius: 10px;
    background-color: #F99026;
    color: white;
    font-size: 16px;
    font-weight: bold;
    margin-top: 33px;
    cursor: pointer;
`
