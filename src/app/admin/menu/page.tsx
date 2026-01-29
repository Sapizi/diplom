'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createMenuItem,
  deleteMenuItem,
  fetchAdminMenuItems,
  getMenuImagePublicUrl,
  updateMenuItem,
  uploadMenuImage,
} from '@/app/api/client/menu'
import { createCategory, fetchCategories as fetchCategoriesApi } from '@/app/api/client/categories'
import { getSession, onAuthStateChange } from '@/app/api/client/auth'
import { getIsAdmin } from '@/app/api/client/profiles'
import Footer from '@/app/components/Footer/Footer'
import Header from '@/app/components/Header/Header'
import { Wrapper } from '@/app/components/Header/HeaderStyles'
import { Title } from '@/app/MainPageStyles'
import {
  MenuList,
  MenuItem,
  MenuItemImg,
  MenuItemDesc,
  Subtitle,
  Description,
  Price,
  MenuItemButtons,
  LoginButton,
  PopupOverlay,
  PopupContainer,
  PopupTitle,
  PopupForm,
  PopupInput,
  PopupTextarea,
  PopupSelect,
  PopupFileInput,
  PopupButtons,
  PopupCancelButton,
  PopupSaveButton,
  TitleBlock
} from './AdminMenuStyles'

type MenuItemType = {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  category_id: string
}

type CategoryType = {
  id: string
  name: string
}

export default function AdminMenuPage() {
  const router = useRouter()
  // --- Стейты ---
  const [menu, setMenu] = useState<MenuItemType[]>([])
  const [isReady, setIsReady] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [loading, setLoading] = useState(true)

  const [isMenuPopupOpen, setIsMenuPopupOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [image, setImage] = useState<File | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // --- Попап создания категории ---
  const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // --- Загрузка меню ---
  const fetchMenu = async () => {
    setLoading(true)
    const { data, error } = await fetchAdminMenuItems()

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }
    setMenu(data || [])
    setLoading(false)
  }

  // --- Загрузка категорий ---
  const loadCategories = async () => {
    const { data, error } = await fetchCategoriesApi()

    if (error) {
      console.error(error)
      return
    }
    setCategories(data || [])
  }

  useEffect(() => {
    let isMounted = true
    let unsubscribe: null | (() => void) = null

    const checkAdmin = async (session: any) => {
      const { data: profile, error: profileError } = await getIsAdmin(session.user.id)

      if (!isMounted) return

      if (profileError || !profile?.isAdmin) {
        setIsChecking(false)
        router.push('/')
        return
      }

      setIsReady(true)
      setIsChecking(false)
    }

    const init = async () => {
      const { data: { session }, error } = await getSession()

      if (session) {
        await checkAdmin(session)
        return
      }

      if (error) {
        setIsChecking(false)
        router.push('/login')
        return
      }

      const { data: authListener } = onAuthStateChange(async (_event, nextSession) => {
        if (!isMounted) return
        if (nextSession) {
          await checkAdmin(nextSession)
        } else {
          setIsChecking(false)
          router.push('/login')
        }
      })

      unsubscribe = () => authListener.subscription.unsubscribe()
    }

    init()

    return () => {
      isMounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [router])

  useEffect(() => {
    if (!isReady) return

    const loadInitial = async () => {
      setLoading(true)
      const [menuResult, categoriesResult] = await Promise.all([
        fetchAdminMenuItems(),
        fetchCategoriesApi()
      ])

      if (menuResult.error) {
        console.error(menuResult.error)
      } else {
        setMenu(menuResult.data || [])
      }

      if (categoriesResult.error) {
        console.error(categoriesResult.error)
      } else {
        setCategories(categoriesResult.data || [])
      }

      setLoading(false)
    }

    loadInitial()
  }, [isReady])

  // --- Удаление позиции ---
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Удалить эту позицию?')
    if (!confirmDelete) return
    const { error } = await deleteMenuItem(id)
    if (error) {
      console.error(error)
      alert(error.message)
      return
    }
    setMenu(prev => prev.filter(item => item.id !== id))
  }

  // --- Попап меню ---
  const openCreateMenuPopup = () => {
    setEditingItem(null)
    setName('')
    setDescription('')
    setPrice('')
    setCategoryId('')
    setImage(null)
    setIsMenuPopupOpen(true)
  }

  const openEditMenuPopup = (item: MenuItemType) => {
    setEditingItem(item)
    setName(item.name)
    setDescription(item.description)
    setPrice(item.price.toString())
    setCategoryId(item.category_id)
    setImage(null)
    setIsMenuPopupOpen(true)
  }

  const handleSaveMenu = async () => {
    const resolvedCategoryId = categoryId || editingItem?.category_id || ''
    if (!name || !price || !resolvedCategoryId) {
      alert('Заполни все поля')
      return
    }

    let imageUrl = editingItem?.image_url || null

    if (image) {
      const fileName = `${Date.now()}-${image.name}`
      const { error: uploadError } = await uploadMenuImage(fileName, image)
      if (uploadError) {
        console.error(uploadError)
        alert('Ошибка загрузки картинки')
        return
      }
      const { data } = getMenuImagePublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    if (editingItem) {
      const { error } = await updateMenuItem(editingItem.id, {
        name,
        description,
        price: Number(price),
        category_id: resolvedCategoryId,
        image_url: imageUrl
      })

      if (error) {
        console.error(error)
        alert(error.message)
        return
      }
    } else {
      const { error } = await createMenuItem({
        name,
        description,
        price: Number(price),
        category_id: resolvedCategoryId,
        image_url: imageUrl
      })
      if (error) {
        console.error(error)
        alert(error.message)
        return
      }
    }

    setIsMenuPopupOpen(false)
    setEditingItem(null)
    setName('')
    setDescription('')
    setPrice('')
    setCategoryId('')
    setImage(null)
    fetchMenu()
  }

  // --- Попап категории ---
  const openCategoryPopup = () => {
    setNewCategoryName('')
    setIsCategoryPopupOpen(true)
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Введите название категории')
      return
    }

    const { error } = await createCategory(newCategoryName.trim())

    if (error) {
      console.error(error)
      alert(error.message)
      return
    }

    loadCategories()
    setIsCategoryPopupOpen(false)
  }

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter ? item.category_id === categoryFilter : true
    return matchesSearch && matchesCategory
  })
  if (isChecking) return <p>Loading...</p>

  if (loading) return <p>Loading...</p>

  return (
    <>
      <Header />
      <Wrapper>
        <TitleBlock>
          <Title>Редактирование меню</Title>
          <div style={{display:'flex', gap:'20px'}}>
            <LoginButton style={{width:'250px'}} onClick={openCreateMenuPopup}>
              Создать новую позицию
            </LoginButton>
            <LoginButton style={{width:'250px'}} onClick={openCategoryPopup}>
              Создать новую категорию
            </LoginButton>
          </div>
        </TitleBlock>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <PopupInput
            placeholder="Поиск по названию"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ flex: '1 1 200px' }}
          />
          <PopupSelect
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ flex: '1 1 200px' }}
          >
            <option value="">Все категории</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </PopupSelect>
        </div>

        <MenuList>
          {filteredMenu.map(item => (
            <MenuItem key={item.id}>
              <MenuItemImg src={item.image_url || '/TestRecImg.svg'} alt={item.name} />
              <MenuItemDesc>
                <Subtitle>{item.name}</Subtitle>
                <Description>{item.description}</Description>
                <Price>{item.price} ₽</Price>
              </MenuItemDesc>
              <MenuItemButtons>
                <LoginButton onClick={() => openEditMenuPopup(item)}>Редактировать</LoginButton>
                <LoginButton style={{ backgroundColor: 'red' }} onClick={() => handleDelete(item.id)}>Удалить</LoginButton>
              </MenuItemButtons>
            </MenuItem>
          ))}
        </MenuList>
      </Wrapper>
      <Footer />

      {/* Попап меню */}
      {isMenuPopupOpen && (
        <PopupOverlay>
          <PopupContainer>
            <PopupTitle>{editingItem ? 'Редактировать позицию' : 'Новая позиция'}</PopupTitle>
            <PopupForm>
              <PopupFileInput type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} />
              <PopupInput placeholder="Название" value={name} onChange={e => setName(e.target.value)} />
              <PopupTextarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} />
              <PopupInput type="number" placeholder="Цена" value={price} onChange={e => setPrice(e.target.value)} />
              <PopupSelect value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">Категория</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </PopupSelect>
              <PopupButtons>
                <PopupCancelButton onClick={() => setIsMenuPopupOpen(false)}>Отмена</PopupCancelButton>
                <PopupSaveButton type="button" onClick={handleSaveMenu}>Сохранить</PopupSaveButton>
              </PopupButtons>
            </PopupForm>
          </PopupContainer>
        </PopupOverlay>
      )}

      {/* Попап категории */}
      {isCategoryPopupOpen && (
        <PopupOverlay>
          <PopupContainer>
            <PopupTitle>Создать новую категорию</PopupTitle>
            <PopupForm>
              <PopupInput
                placeholder="Название категории"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
              />
              <PopupButtons>
                <PopupCancelButton onClick={() => setIsCategoryPopupOpen(false)}>Отмена</PopupCancelButton>
                <PopupSaveButton type="button" onClick={handleCreateCategory}>Создать</PopupSaveButton>
              </PopupButtons>
            </PopupForm>
          </PopupContainer>
        </PopupOverlay>
      )}
    </>
  )
}
