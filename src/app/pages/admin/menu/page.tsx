'use client'

import { useEffect, useState } from "react"
import { supabase } from "../../../../../lib/supabase"

import Footer from "@/app/components/Footer/Footer"
import Header from "@/app/components/Header/Header"
import { Wrapper } from "@/app/components/Header/HeaderStyles"
import { Title } from "@/app/MainPageStyles"
import { LoginButton } from "../../registration/RegistrationStyles"
import {
  Description,
  MenuItem,
  MenuItemButtons,
  MenuItemDesc,
  MenuItemImg,
  MenuList,
  Price,
  Subtitle
} from "./AdminMenuStyles"

type MenuItemType = {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  is_available: boolean
}

export default function AdminMenuPage() {
  const [menu, setMenu] = useState<MenuItemType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')

      if (error) {
        console.error(error)
      } else {
        setMenu(data || [])
      }

      setLoading(false)
    }

    fetchMenu()
  }, [])

  if (loading) {
    return <p>Загрузка...</p>
  }

  return (
    <>
      <Header />
      <Wrapper>
        <Title>Редактирование меню</Title>
        <LoginButton>Создать новую позицию</LoginButton>

        <MenuList>
          {menu.map(item => (
            <MenuItem key={item.id}>
              <MenuItemImg
                src={item.image_url || '/TestRecImg.svg'}
                alt={item.name}
              />

              <MenuItemDesc>
                <Subtitle>{item.name}</Subtitle>
                <Description>
                  {item.description}
                </Description>
                <Price>{item.price} руб.</Price>
              </MenuItemDesc>

              <MenuItemButtons>
                <LoginButton>Редактировать</LoginButton>
                <LoginButton style={{ backgroundColor: 'red' }}>
                  Удалить
                </LoginButton>
              </MenuItemButtons>
            </MenuItem>
          ))}
        </MenuList>
      </Wrapper>
      <Footer />
    </>
  )
}
