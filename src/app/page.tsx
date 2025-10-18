'use client'
import Header from "@/app/components/Header/Header";
import {RecommendationBlock, Title} from "@/app/MainPageStyles";
import RecommendationCards from "@/app/components/RecommendationBlock/RecommendationCards";
import {Wrapper} from "@/app/components/Header/HeaderStyles";

export default function Home() {

  return (
    <>
        <Header/>
        <Wrapper>
            <RecommendationBlock>
                <Title>Рекомендуем</Title>
                <RecommendationCards/>
            </RecommendationBlock>
        </Wrapper>
{/*  */}
    </>
  );
}
