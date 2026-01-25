"use client"
import Footer from "@/app/components/Footer/Footer";
import Header from "@/app/components/Header/Header";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { Avatar, ChangeLink, ImageContainer, Name, Container, Bonus, UserActivity, BonusText, UserGreyBlock, GreyBlockText, GreyBlockP } from "./AccountStyles";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut } from "@/app/api/client/auth";
import { fetchProfileSummary } from "@/app/api/client/profiles";
import { fetchOrdersCountByUser } from "@/app/api/client/orders";
import { fetchAddressesCountByUser } from "@/app/api/client/addresses";
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const [profile, setProfile] = useState<{
    name: string;
    avatar_url: string | null;
    bonus_points: number;
  } | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  useEffect(() => {
    const fetchUserData = async () => {
      const user = await getCurrentUser();
      if (!user) {
        console.error("Пользователь не авторизован");
        return;
      }
      const { data: profileData, error: profileError } = await fetchProfileSummary(user.id);

      if (profileError) {
        console.error("Ошибка загрузки профиля:", profileError);
        return;
      }

      setProfile(profileData);
      const { count: ordersCount, error: ordersError } = await fetchOrdersCountByUser(user.id);

      if (!ordersError) {
        setOrderCount(ordersCount || 0);
      }
      const { count: addressesCount, error: addressesError } = await fetchAddressesCountByUser(user.id);

      if (!addressesError) {
        setAddressCount(addressesCount || 0);
      }
    };

    fetchUserData();
  }, []);

  if (!profile) {
    return <div>Загрузка...</div>;
  }
  const router = useRouter();
  const handleLogout = async () => {
      try {
        await signOut();
        router.push('/');
        router.refresh();
      } catch (error) {
        console.error('Logout error:', error);
      }
    };
  return (
    <>
      <Header />
      <Wrapper>
        <Container>
          <ImageContainer>
            <Avatar src={profile.avatar_url || '/default-avatar.svg'} alt="Аватар" />
            <Name>{profile.name}</Name>
            <ChangeLink href="/pages/user/accountSettings">Редактировать профиль</ChangeLink>
            <button
                    onClick={handleLogout}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#007bff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px 8px',
                    }}
                  >
                    Выйти
                  </button>
          </ImageContainer>

          <UserActivity>
            <Bonus>
              <BonusText>Ваши баллы: {profile.bonus_points}</BonusText>
            </Bonus>

            <UserGreyBlock href={'/pages/user/orders'}>
              <GreyBlockText>Заказы</GreyBlockText>
              <GreyBlockP>{orderCount}</GreyBlockP>
            </UserGreyBlock>

            <UserGreyBlock href={'/pages/user/adresses'}>
              <GreyBlockText>Адреса</GreyBlockText>
              <GreyBlockP>{addressCount}</GreyBlockP>
            </UserGreyBlock>
          </UserActivity>
        </Container>
      </Wrapper>
      <Footer />
    </>
  );
}
