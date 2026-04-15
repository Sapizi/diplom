'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Footer from "@/app/components/Footer/Footer";
import Header from "@/app/components/Header/Header";
import PageLoader from "@/app/components/PageLoader/PageLoader";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { Container } from "../account/AccountStyles";
import { Title } from "@/app/MainPageStyles";
import { ChangeForm } from "./AccountSettingsStyles";
import { LoginButton, LoginFormInput, LoginFormLabel } from "@/app/components/auth/AuthStyles";
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
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      const user = await getCurrentUser();
      if (!isMounted) return;

      if (!user) {
        setHasAccess(false);
        setLoading(false);
        router.push("/login");
        return;
      }

      const { data, error: profileError } = await fetchProfileSettings(user.id);
      if (!isMounted) return;

      if (profileError) {
        setError("Ошибка загрузки профиля");
      } else {
        setName(data?.name || "");
        setPhone(data?.phone || "");
        setAvatarUrl(data?.avatar_url || "");
      }

      setLoading(false);
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleUpdate = async (field: string, value: string) => {
    const user = await getCurrentUser();
    if (!user) {
      setError("Пользователь не авторизован");
      return;
    }

    const { error: updateError } = await upsertProfileById(user.id, { [field]: value });
    if (updateError) {
      setError(`Ошибка обновления: ${updateError.message}`);
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

  if (loading) return <PageLoader label="Загружаем настройки профиля..." />;

  if (loading) return <div>Загрузка...</div>;
  if (!hasAccess) return null;
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

            {uploading && <PageLoader inline label="Загружаем фото..." />}

            {uploading && <div>Загрузка...</div>}

            <div className={styles.helpText}>Поддерживаются: JPG, PNG</div>
          </ChangeForm>
        </Container>
      </Wrapper>
      <Footer />
    </>
  );
}
