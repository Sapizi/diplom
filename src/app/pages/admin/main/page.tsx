'use client'
import Footer from "@/app/components/Footer/Footer";
import Header from "@/app/components/Header/Header";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { Title } from "@/app/MainPageStyles";
import { AdminBlock, AdminContainer } from "./AdminStyles";
import { supabase } from "../../../../../lib/supabase";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { GreyBlockText } from "../../user/account/AccountStyles";
export default function AdminMain(){
    interface UserProfile {
        id: string;
        name: string;
    }
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
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
    return(
        <>
            <Header/>
                <Wrapper>
                    <Title>Главная</Title>
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
                    <AdminContainer>
                        <AdminBlock>
                            <GreyBlockText>Пользователи</GreyBlockText>
                        </AdminBlock>
                        <AdminBlock>

                        </AdminBlock>
                        <AdminBlock>

                        </AdminBlock>
                    </AdminContainer>
                </Wrapper>
            <Footer/>
        </>
    )
}