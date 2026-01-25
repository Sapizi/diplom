'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchMenuItems } from '@/app/api/client/menu'
import { getCurrentUser } from '@/app/api/client/auth'
import Header from '@/app/components/Header/Header'
import Footer from '@/app/components/Footer/Footer'
import { Wrapper } from '@/app/components/Header/HeaderStyles'
import { Title } from '@/app/MainPageStyles'
import {
  Description,
  MenuItem,
  MenuItemButtons,
  MenuItemDesc,
  MenuItemImg,
  MenuList,
  Price,
  Subtitle,
  TitleBlock,
} from '../admin/menu/AdminMenuStyles'
import { SortBlock, SortOption, SortSelect } from './MenuPageStyles'
import { LoginButton } from '../registration/RegistrationStyles'

type MenuItemType = {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
}

type CartItemType = {
  id: string
  name: string
  price: number
  image_url: string | null
  quantity: number
}

export default function MenuPage() {
  const router = useRouter()
  const [menu, setMenu] = useState<MenuItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'asc' | 'desc' | ''>('')

  const fetchMenu = async () => {
    setLoading(true)

    const { data, error } = await fetchMenuItems(sort)
    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    setMenu(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMenu()
  }, [sort])

  const addToCart = async (item: MenuItemType) => {
    const user = await getCurrentUser()
    if (!user) {
      alert('Нужно войти в аккаунт')
      router.push('/pages/login')
      return
    }

    const cartRaw = localStorage.getItem('cart')
    const cart: CartItemType[] = cartRaw ? JSON.parse(cartRaw) : []

    const existing = cart.find(c => c.id === item.id)

    if (existing) {
      existing.quantity += 1
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        quantity: 1,
      })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
  }

  if (loading) return <p>Загрузка...</p>

  return (
    <>
      <Header />
      <Wrapper>
        <TitleBlock>
          <Title>Меню</Title>
        </TitleBlock>

        <SortBlock>
          <SortSelect value={sort} onChange={e => setSort(e.target.value as any)}>
            <SortOption value="" disabled>
              Сортировать по
            </SortOption>
            <SortOption value="asc">По стоимости ↑</SortOption>
            <SortOption value="desc">По стоимости ↓</SortOption>
          </SortSelect>
        </SortBlock>

        <MenuList>
          {menu.map(item => (
            <MenuItem key={item.id}>
              <MenuItemImg
                src={item.image_url || '/TestRecImg.svg'}
                alt={item.name}
              />
              <MenuItemDesc>
                <Subtitle>{item.name}</Subtitle>
                <Description>{item.description}</Description>
                <Price>{item.price} ₽</Price>
              </MenuItemDesc>
              <MenuItemButtons>
                <LoginButton onClick={() => addToCart(item)}>
                  В корзину
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
