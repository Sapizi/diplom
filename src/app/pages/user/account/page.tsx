"use client"
import Footer from "@/app/components/Footer/Footer";
import Header from "@/app/components/Header/Header";
import { Wrapper } from "@/app/components/Header/HeaderStyles";
import { Avatar, ChangeLink, ImageContainer, Name, Container, Bonus } from "./AccountStyles";

export default function AccountPage() {
    return(
        <>
            <Header/>
                <Wrapper>
                    <Container>
                        <ImageContainer>
                            <Avatar src={'/burrito.svg'}/>
                            <Name>Андрей Самокрутов</Name>
                            <ChangeLink href="/pages/user/changeprofile">Редактировать профиль</ChangeLink>
                        </ImageContainer>
                    </Container>
                </Wrapper>
            <Footer/>
        </>
    )
}