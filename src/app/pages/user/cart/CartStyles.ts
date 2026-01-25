import styled from "styled-components";

export const CartList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 1016px;
`
export const CartItem = styled.div`
    width: 100%;
    height: 160px;
    display: flex;
    background-color: #ededed;
    padding: 20px;
    border-radius: 20px;
`
export const CartItemImg = styled.img`
    width: 120px;
    height: 120px;
    border-radius: 20px;
    margin-right: 20px;
`
export const CartDesc = styled.div`
    flex-direction: column;
    display: flex;
    gap: 10px;
`
export const CartQuantity = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
`
export const CartContainer = styled.div`
    display: flex;
    gap: 20px;
`
export const CartSummary = styled.div`
  width: 419px;
  background-color: #ededed;
  border-radius: 20px;
  padding: 20px;
    height: 300px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

export const BonusRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
`

export const BonusToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`