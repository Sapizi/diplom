'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../../../lib/supabase'
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
  const [menu, setMenu] = useState<MenuItemType[]>([])
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [image, setImage] = useState<File | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('') // фильтр по категориям
  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return
    }
    setMenu(data || [])
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name')

    if (error) {
      console.error(error)
      return
    }
    setCategories(data || [])
  }

  useEffect(() => {
    fetchMenu()
    fetchCategories()
  }, [])
  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Удалить эту позицию?')
    if (!confirmDelete) return
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
    if (error) {
      console.error(error)
      alert(error.message)
      return
    }
    setMenu(prev => prev.filter(item => item.id !== id))
  }
  const openCreatePopup = () => {
    setEditingItem(null)
    setName('')
    setDescription('')
    setPrice('')
    setCategoryId('')
    setImage(null)
    setIsOpen(true)
  }

  const openEditPopup = (item: MenuItemType) => {
    setEditingItem(item)
    setName(item.name)
    setDescription(item.description)
    setPrice(item.price.toString())
    setCategoryId(item.category_id)
    setImage(null)
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (!name || !price || !categoryId) {
      alert('Заполни все поля')
      return
    }

    let imageUrl = editingItem?.image_url || null

    if (image) {
      const fileName = `${Date.now()}-${image.name}`
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, image)
      if (uploadError) {
        console.error(uploadError)
        alert('Ошибка загрузки картинки')
        return
      }
      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    if (editingItem) {
      const { error } = await supabase
        .from('menu_items')
        .update({
          name,
          description,
          price: Number(price),
          category_id: categoryId,
          image_url: imageUrl
        })
        .eq('id', editingItem.id)

      if (error) {
        console.error(error)
        alert(error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from('menu_items')
        .insert({
          name,
          description,
          price: Number(price),
          category_id: categoryId,
          image_url: imageUrl
        })
      if (error) {
        console.error(error)
        alert(error.message)
        return
      }
    }
    setIsOpen(false)
    setEditingItem(null)
    setName('')
    setDescription('')
    setPrice('')
    setCategoryId('')
    setImage(null)
    fetchMenu()
  }
  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter ? item.category_id === categoryFilter : true
    return matchesSearch && matchesCategory
  })

  if (loading) return <p>Загрузка...</p>

  return (
    <>
      <Header />
      <Wrapper>
        <TitleBlock>
          <Title>Редактирование меню</Title>
          <LoginButton style={{width:'250px'}} onClick={openCreatePopup}>
            Создать новую позицию
          </LoginButton>
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
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </PopupSelect>
        </div>

        <MenuList>
          {filteredMenu.map(item => (
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
                <LoginButton onClick={() => openEditPopup(item)}>
                  Редактировать
                </LoginButton>
                <LoginButton
                  style={{ backgroundColor: 'red' }}
                  onClick={() => handleDelete(item.id)}
                >
                  Удалить
                </LoginButton>
              </MenuItemButtons>
            </MenuItem>
          ))}
        </MenuList>
      </Wrapper>
      <Footer />
      {isOpen && (
        <PopupOverlay>
          <PopupContainer>
            <PopupTitle>
              {editingItem ? 'Редактировать позицию' : 'Новая позиция'}
            </PopupTitle>
            <PopupForm>
              <PopupFileInput
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files?.[0] || null)}
              />
              <PopupInput
                placeholder="Название"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <PopupTextarea
                placeholder="Описание"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <PopupInput
                type="number"
                placeholder="Цена"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
              <PopupSelect
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">Категория</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </PopupSelect>
              <PopupButtons>
                <PopupCancelButton
                  onClick={() => {
                    setIsOpen(false)
                    setEditingItem(null)
                  }}
                >
                  Отмена
                </PopupCancelButton>
                <PopupSaveButton type="button" onClick={handleSave}>
                  Сохранить
                </PopupSaveButton>
              </PopupButtons>
            </PopupForm>
          </PopupContainer>
        </PopupOverlay>
      )}
    </>
  )
}
