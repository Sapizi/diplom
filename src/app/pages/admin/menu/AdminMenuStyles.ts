import styled from 'styled-components'

export const MenuList = styled.div`
  display: flex;
  gap: 20px;
  flex-direction: column;
`

export const MenuItem = styled.div`
  width: 100%;
  height: 230px;
  background-color: #ededed;
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding-left: 20px;
  gap: 20px;
`

export const MenuItemImg = styled.img`
  width: 170px;
  height: 170px;
  object-fit: cover;
  border-radius: 10px;
`

export const MenuItemDesc = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const Subtitle = styled.h2``

export const Description = styled.p`
  max-width: 500px;
`

export const Price = styled.p`
  font-weight: bold;
`

export const MenuItemButtons = styled.div`
  display: flex;
  gap: 20px;
  margin-left: auto;
  padding-right: 20px;
`

export const LoginButton = styled.button`
  padding: 0 10px;
  height: 50px;
  border: none;
  border-radius: 10px;
  background-color: #f99026;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
`

/* ===== POPUP ===== */

export const PopupOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

export const PopupContainer = styled.div`
  width: 520px;
  background: #fff;
  border-radius: 15px;
  padding: 30px;
`

export const PopupTitle = styled.h2`
  text-align: center;
  margin-bottom: 20px;
`

export const PopupForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`

export const PopupInput = styled.input`
  height: 45px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #ccc;
`

export const PopupTextarea = styled.textarea`
  min-height: 90px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #ccc;
  resize: none;
`

export const PopupSelect = styled.select`
  height: 45px;
  border-radius: 10px;
  border: 1px solid #ccc;
  padding: 0 10px;
`

export const PopupFileInput = styled.input``

export const PopupButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`

export const PopupCancelButton = styled.button`
  height: 45px;
  padding: 0 20px;
  border-radius: 10px;
  border: none;
  background: #cfcfcf;
  font-weight: bold;
  cursor: pointer;
`

export const PopupSaveButton = styled.button`
  height: 45px;
  padding: 0 20px;
  border-radius: 10px;
  border: none;
  background: #f99026;
  color: white;
  font-weight: bold;
  cursor: pointer;
`
export const TitleBlock = styled.div`
margin-top: 50px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
`