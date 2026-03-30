"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Footer from "@/app/components/Footer/Footer";
import Header from "@/app/components/Header/Header";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import {
  Avatar,
  Bonus,
  BonusText,
  ChangeLink,
  Container,
  GreyBlockP,
  GreyBlockText,
  ImageContainer,
  Name,
  UserActivity,
  UserGreyBlock,
} from "./AccountStyles";
import { getCurrentUser, signOut } from "@/app/api/client/auth";
import { fetchProfileSummary } from "@/app/api/client/profiles";
import { fetchOrdersCountByUser } from "@/app/api/client/orders";
import { fetchAddressesCountByUser } from "@/app/api/client/addresses";
import styles from "./page.module.scss";

export default function AccountPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{
    name: string;
    avatar_url: string | null;
    bonus_points: number;
  } | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      const user = await getCurrentUser();
      if (!isMounted) return;

      if (!user) {
        setIsLoading(false);
        router.push("/login");
        return;
      }

      const [
        { data: profileData, error: profileError },
        { count: ordersCount, error: ordersError },
        { count: addressesCount, error: addressesError },
      ] = await Promise.all([
        fetchProfileSummary(user.id),
        fetchOrdersCountByUser(user.id),
        fetchAddressesCountByUser(user.id),
      ]);

      if (!isMounted) return;

      if (profileError) {
        console.error("Profile load error:", profileError);
        setIsLoading(false);
        return;
      }

      setProfile(profileData);
      if (!ordersError) setOrderCount(ordersCount || 0);
      if (!addressesError) setAddressCount(addressesCount || 0);
      setIsLoading(false);
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) return <div>Загрузка</div>;
  if (!profile) return null;

  return (
    <>
      <Header />
      <Wrapper>
        <Container>
          <ImageContainer>
            <Avatar src={profile.avatar_url || "/default-avatar.svg"} alt="Аватар" />
            <Name>{profile.name}</Name>
            <ChangeLink href="/user/accountSettings">Редактировать</ChangeLink>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Выйти
            </button>
          </ImageContainer>

          <UserActivity>
            <Bonus>
              <BonusText>Количество баллов: {profile.bonus_points}</BonusText>
            </Bonus>

            <UserGreyBlock href="/user/orders">
              <GreyBlockText>Заказы</GreyBlockText>
              <GreyBlockP>{orderCount}</GreyBlockP>
            </UserGreyBlock>

            <UserGreyBlock href="/user/addresses">
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
