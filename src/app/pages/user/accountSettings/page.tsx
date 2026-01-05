'use client'

import Footer from "@/app/components/Footer/Footer"
import Header from "@/app/components/Header/Header"
import { Wrapper } from "@/app/components/Header/HeaderStyles"
import { Container } from "../account/AccountStyles"
import { Title } from "@/app/MainPageStyles"
import { ChangeForm } from "./AccountSettingsStyles"
import { LoginFormInput, LoginFormLabel } from "../../registration/RegistrationStyles"
import { useEffect, useState } from "react"
import { supabase } from "../../../../../lib/supabase"

export default function AccountSettings() {
  const [name, setName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [uploading, setUploading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError("Не удалось получить пользователя")
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('name, phone, avatar_url')
        .eq('id', user.id)
        .single()
      if (error && error.code !== 'PGRST116') {
        setError("Ошибка загрузки профиля")
      } else {
        setName(data?.name || '')
        setPhone(data?.phone || '')
        setAvatarUrl(data?.avatar_url || '')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])
  const handleUpdate = async (field: string, value: string) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      setError("Пользователь не авторизован")
      return
    }
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        [field]: value,
      })
    if (error) {
      setError(`Ошибка обновления: ${error.message}`)
    } else {
      setError(null)
      alert("Данные успешно обновлены!")
    }
  }
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true)
    setError(null)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      setError("Пользователь не авторизован")
      setUploading(false)
      return
    }
    const file = event.target.files?.[0]
    if (!file) {
      setUploading(false)
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Пожалуйста, загрузите изображение (JPEG, PNG, GIF)')
      setUploading(false)
      return
    }
    const fileExt = file.name.split('.').pop()
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
    const fileName = `${user.id}/${cleanFileName}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })
    if (uploadError) {
      setError(`Ошибка загрузки: ${uploadError.message}`)
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        avatar_url: publicUrl,
      })
    if (updateError) {
      setError(`Ошибка сохранения аватара: ${updateError.message}`)
    } else {
      alert("Аватар успешно загружен!")
    }
    setUploading(false)
  }
  if (loading) return <div>Загрузка...</div>
  if (error) return <div style={{ color: 'red' }}>{error}</div>
  return (
    <>
      <Header />
      <Wrapper>
        <Container>
          <Title>Редактирование профиля</Title>
          <ChangeForm>
            {/* Имя */}
            <LoginFormLabel>Имя</LoginFormLabel>
            <LoginFormInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите имя"
            />
            <button
              type="button"
              onClick={() => handleUpdate('name', name)}
              style={{ marginTop: '8px', padding: '6px 12px' }}
            >
              Сохранить имя
            </button>
            <LoginFormLabel>Телефон</LoginFormLabel>
            <LoginFormInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+79001234567"
            />
            <button
              type="button"
              onClick={() => handleUpdate('phone', phone)}
              style={{ marginTop: '8px', padding: '6px 12px' }}
            >
              Сохранить телефон
            </button>
            <LoginFormLabel>Фото профиля</LoginFormLabel>
            <div style={{ marginTop: '8px', marginBottom: '8px' }}>
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Аватар"
                  style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={uploadAvatar}
              disabled={uploading}
              style={{ marginBottom: '8px' }}
            />
            {uploading && <div>Загрузка...</div>}
            <div style={{ fontSize: '12px', color: '#666' }}>
              Поддерживаются: JPG, PNG, GIF
            </div>
          </ChangeForm>
        </Container>
      </Wrapper>
      <Footer />
    </>
  )
}