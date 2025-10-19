'use client'
import Header from "@/app/components/Header/Header";
import {RecommendationBlock, Title} from "@/app/MainPageStyles";
import RecommendationCards from "@/app/components/RecommendationBlock/RecommendationCards";
import {Wrapper} from "@/app/components/Header/HeaderStyles";
import MainNavButtons from "@/app/components/MainNavButtons/MainNavButtons";
import MenuBlocks from "@/app/components/MenuBlocks/MenuBlocks";
import Footer from "@/app/components/Footer/Footer";

export default function Home() {

  return (
    <>
        <Header/>
        <Wrapper>
            <RecommendationBlock>
                <Title>Рекомендуем</Title>
                <RecommendationCards/>
            </RecommendationBlock>
            <MainNavButtons/>
            <MenuBlocks/>
        </Wrapper>
        <Footer/>
    </>
  );
}
