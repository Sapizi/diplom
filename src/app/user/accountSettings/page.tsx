'use client';

import Footer from "@/app/components/Footer/Footer";
import Header from "@/app/components/Header/Header";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { Container } from "../account/AccountStyles";
import { Title } from "@/app/MainPageStyles";
import { ChangeForm } from "./AccountSettingsStyles";
import { LoginButton, LoginFormInput, LoginFormLabel } from "@/app/components/auth/AuthStyles";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/app/api/client/auth";
import {
  fetchProfileSettings,
  getAvatarPublicUrl,
  updateProfileById,
  uploadAvatar,
  upsertProfileById,
} from "@/app/api/client/profiles";
import styles from "./page.module.scss";

export default function AccountSettings() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = await getCurrentUser();
      if (!user) {
        setError("Не удалось получить пользователя");
        setLoading(false);
        return;
      }

      const { data, error } = await fetchProfileSettings(user.id);
      if (error && error.code !== "PGRST116") {
        setError("Ошибка загрузки профиля");
      } else {
        setName(data?.name || "");
        setPhone(data?.phone || "");
        setAvatarUrl(data?.avatar_url || "");
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleUpdate = async (field: string, value: string) => {
    const user = await getCurrentUser();
    if (!user) {
      setError("Пользователь не авторизован");
      return;
    }

    const { error } = await upsertProfileById(user.id, { [field]: value });
    if (error) {
      setError(`Ошибка обновления: ${error.message}`);
    } else {
      setError(null);
      alert("Данные успешно обновлены");
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    setError(null);

    const user = await getCurrentUser();
    if (!user) {
      setError("Пользователь не авторизован");
      setUploading(false);
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      setUploading(false);
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Пожалуйста, загрузите изображение JPEG или PNG");
      setUploading(false);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const fileName = `${user.id}/${cleanFileName}`;

    const { error: uploadError } = await uploadAvatar(fileName, file);
    if (uploadError) {
      setError(`Ошибка загрузки: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = getAvatarPublicUrl(fileName);
    const { error: updateError } = await updateProfileById(user.id, { avatar_url: publicUrl });
    if (updateError) {
      setError(`Ошибка сохранения аватара: ${updateError.message}`);
    } else {
      setAvatarUrl(publicUrl);
      alert("Аватар успешно загружен");
    }

    setUploading(false);
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className={styles.errorState}>{error}</div>;

  return (
    <>
      <Header />
      <Wrapper>
        <Container>
          <Title>Редактирование профиля</Title>
          <ChangeForm>
            <LoginFormLabel>Имя</LoginFormLabel>
            <LoginFormInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите имя"
            />
            <LoginButton
              type="button"
              onClick={() => handleUpdate("name", name)}
              className={styles.saveButton}
            >
              Сохранить имя
            </LoginButton>

            <LoginFormLabel>Телефон</LoginFormLabel>
            <LoginFormInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+79001234567"
            />
            <LoginButton
              type="button"
              onClick={() => handleUpdate("phone", phone)}
              className={styles.saveButton}
            >
              Сохранить телефон
            </LoginButton>

            <LoginFormLabel>Фото профиля</LoginFormLabel>
            <div className={styles.avatarPreviewWrapper}>
              {avatarUrl && <img src={avatarUrl} alt="Аватар" className={styles.avatarPreview} />}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
              className={styles.fileInput}
            />

            {uploading && <div>Загрузка...</div>}

            <div className={styles.helpText}>Поддерживаются: JPG, PNG</div>
          </ChangeForm>
        </Container>
      </Wrapper>
      <Footer />
    </>
  );
}
