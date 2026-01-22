import Link from "next/link";
import styled from "styled-components";

export const SortBlock = styled.div`
    display: flex;
    gap: 10px;
    
`
export const SortSelect = styled.select`
    height: 50px;
    width: 170px;
    padding: 10px;
    border-radius: 10px;
    font-weight: 500;
`
export const SortOption = styled.option`

`
export const PopupSaveLink = styled(Link)`
  height: 45px;
  padding:10px;
  border-radius: 10px;
  border: none;
  background: #f99026;
  color: white;
  font-weight: bold;
  cursor: pointer;
`