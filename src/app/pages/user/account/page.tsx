"use client"
import Footer from "@/app/components/Footer/Footer";
import Header from "@/app/components/Header/Header";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { Avatar, ChangeLink, ImageContainer, Name, Container, Bonus, UserActivity, BonusText, UserGreyBlock, GreyBlockText, GreyBlockP } from "./AccountStyles";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import { useRouter } from 'next/navigation';
export default function AccountPage() {
  const [profile, setProfile] = useState<{
    name: string;
    avatar_url: string | null;
    bonus_points: number;
  } | null>(null);
interface UserProfile {
  id: string;
  name: string;
}
  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Пользователь не авторизован");
        return;
      }
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url, bonus_points')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Ошибка загрузки профиля:", profileError);
        return;
      }

      setProfile(profileData);
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!ordersError) {
        setOrderCount(ordersCount || 0);
      }
      const { count: addressesCount, error: addressesError } = await supabase
        .from('addresses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

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
        await supabase.auth.signOut();
        setUser(null);
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

            <UserGreyBlock>
              <GreyBlockText>Заказы</GreyBlockText>
              <GreyBlockP>{orderCount}</GreyBlockP>
            </UserGreyBlock>

            <UserGreyBlock>
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