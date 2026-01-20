'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../../../lib/supabase'
import Footer from '@/app/components/Footer/Footer'
import Header from '@/app/components/Header/Header'
import { Wrapper } from '@/app/components/Header/HeaderStyles'
import {
  Description,
  LoginButton,
  MenuItem,
  MenuItemButtons,
  MenuItemDesc,
  MenuItemImg,
  Subtitle,
  TitleBlock,
  PopupInput,
  PopupOverlay,
  PopupContainer,
  PopupTitle,
  PopupForm,
  PopupButtons,
  PopupCancelButton,
  PopupSaveButton,
  MenuList
} from '../menu/AdminMenuStyles'
import { Title } from '@/app/MainPageStyles'

/* ---------- TYPES ---------- */

type UserType = {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  bonus_points: number
  created_at: string | null
}

type OrderItemType = {
  id: string
  menu_items: {
    id: string
    name: string
    price: number
  } | null
}


type OrderType = {
  id: string
  created_at: string
  items: OrderItemType[]
}


/* ---------- COMPONENT ---------- */

export default function UsersList() {
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // edit popup
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bonusPoints, setBonusPoints] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)

  // orders popup
  const [ordersPopupOpen, setOrdersPopupOpen] = useState(false)
  const [currentOrders, setCurrentOrders] = useState<OrderType[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  /* ---------- USERS ---------- */

  const fetchUsers = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, bonus_points, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    setUsers(
      (data || []).map(u => ({
        ...u,
        bonus_points: u.bonus_points || 0
      }))
    )

    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  /* ---------- EDIT USER ---------- */

  const openEditPopup = (user: UserType) => {
    setEditingUser(user)
    setName(user.name || '')
    setEmail(user.email || '')
    setBonusPoints(user.bonus_points.toString())
    setAvatar(null)
    setIsEditOpen(true)
  }

  const handleSave = async () => {
    if (!editingUser) return

    let avatarUrl = editingUser.avatar_url

    if (avatar) {
      const fileName = `${Date.now()}-${avatar.name}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatar)

      if (uploadError) {
        alert('Ошибка загрузки аватара')
        return
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      avatarUrl = data.publicUrl
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        email,
        bonus_points: Number(bonusPoints),
        avatar_url: avatarUrl
      })
      .eq('id', editingUser.id)

    if (error) {
      console.error(error)
      alert(error.message)
      return
    }

    setIsEditOpen(false)
    setEditingUser(null)
    fetchUsers()
  }

  /* ---------- DELETE USER ---------- */

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить пользователя?')) return

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    setUsers(prev => prev.filter(u => u.id !== id))
  }

  /* ---------- ORDERS ---------- */

  const openOrdersPopup = async (userId: string) => {
    setOrdersLoading(true)

    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      alert('Ошибка загрузки заказов')
      setOrdersLoading(false)
      return
    }

    const ordersWithItems: OrderType[] = await Promise.all(
  (ordersData || []).map(async (order) => {
    const { data: itemsData } = await supabase
      .from('order_items')
      .select(`
        id,
        menu_items (
          id,
          name,
          price
        )
      `)
      .eq('order_id', order.id)

    return {
      ...order,
      items: (itemsData as unknown as OrderItemType[]) ?? []
    }
  })
)


    setCurrentOrders(ordersWithItems)
    setOrdersPopupOpen(true)
    setOrdersLoading(false)
  }

  /* ---------- FILTER ---------- */

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <p>Загрузка...</p>

  return (
    <>
      <Header />
      <Wrapper>
        <TitleBlock>
          <Title>Список пользователей</Title>
          <PopupInput
            placeholder="Поиск по имени"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 300, marginBottom: 20 }}
          />
        </TitleBlock>

        <MenuList>
          {filteredUsers.map(user => (
            <MenuItem key={user.id}>
              <MenuItemImg
                src={user.avatar_url || '/default-avatar.svg'}
                alt={user.name || 'Avatar'}
              />
              <MenuItemDesc>
                <Subtitle>{user.name || '-'}</Subtitle>
                <Description>Баллы: {user.bonus_points}</Description>
                <Description>
                  Дата регистрации: {user.created_at?.split('T')[0]}
                </Description>
                <Description>Почта: {user.email || '-'}</Description>
              </MenuItemDesc>
              <MenuItemButtons>
                <LoginButton onClick={() => openOrdersPopup(user.id)}>
                  Заказы
                </LoginButton>
                <LoginButton onClick={() => openEditPopup(user)}>
                  Редактировать
                </LoginButton>
                <LoginButton
                  style={{ backgroundColor: 'red' }}
                  onClick={() => handleDelete(user.id)}
                >
                  Удалить
                </LoginButton>
              </MenuItemButtons>
            </MenuItem>
          ))}
        </MenuList>
      </Wrapper>

      {/* ---------- EDIT POPUP ---------- */}
      {isEditOpen && (
        <PopupOverlay>
          <PopupContainer>
            <PopupTitle>Редактировать пользователя</PopupTitle>
            <PopupForm>
              <PopupInput type="file" onChange={e => setAvatar(e.target.files?.[0] || null)} />
              <PopupInput value={name} onChange={e => setName(e.target.value)} placeholder="Имя" />
              <PopupInput value={email} onChange={e => setEmail(e.target.value)} placeholder="Почта" />
              <PopupInput
                type="number"
                value={bonusPoints}
                onChange={e => setBonusPoints(e.target.value)}
                placeholder="Баллы"
              />
              <PopupButtons>
                <PopupCancelButton onClick={() => setIsEditOpen(false)}>
                  Отмена
                </PopupCancelButton>
                <PopupSaveButton onClick={handleSave}>
                  Сохранить
                </PopupSaveButton>
              </PopupButtons>
            </PopupForm>
          </PopupContainer>
        </PopupOverlay>
      )}

      {/* ---------- ORDERS POPUP ---------- */}
      {ordersPopupOpen && (
        <PopupOverlay>
          <PopupContainer style={{ width: 700, maxHeight: '80vh', overflowY: 'auto' }}>
            <PopupTitle>Заказы пользователя</PopupTitle>

            {ordersLoading ? (
              <Description>Загрузка...</Description>
            ) : currentOrders.length === 0 ? (
              <Description>Заказов нет</Description>
            ) : (
              currentOrders.map(order => (
                <div key={order.id} style={{ marginBottom: 20 }}>
                  <Description>ID: {order.id}</Description>
                  <Description>Дата: {order.created_at.split('T')[0]}</Description>
                  <Description>Позиции:</Description>

                  {order.items.length === 0 ? (
                    <Description>Нет позиций</Description>
                  ) : (
                    order.items.map(item => (
                      <Description key={item.id} style={{ paddingLeft: 10 }}>
                        • {item.menu_items?.name ?? 'Товар'} —{' '}
                        {item.menu_items?.price ?? 0} ₽
                      </Description>
                    ))
                  )}
                </div>
              ))
            )}

            <PopupButtons>
              <PopupCancelButton onClick={() => setOrdersPopupOpen(false)}>
                Закрыть
              </PopupCancelButton>
            </PopupButtons>
          </PopupContainer>
        </PopupOverlay>
      )}

      <Footer />
    </>
  )
}
