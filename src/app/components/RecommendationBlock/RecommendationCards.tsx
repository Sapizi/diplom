'use client'
import {Wrapper} from "@/app/components/Header/HeaderStyles";
import {Title} from "@/app/MainPageStyles";
import {RecommendationCardContainer} from "@/app/components/RecommendationBlock/RecommendationCardsStyles";
import RecommendationCard from "@/app/components/RecommendationBlock/RecommendationCard/RecommendationCard";

export default function RecommendationCards(){
    return (
        <>
            <RecommendationCardContainer>
                <RecommendationCard/>
                <RecommendationCard/>
                <RecommendationCard/>
                <RecommendationCard/>
                <RecommendationCard/>
            </RecommendationCardContainer>
        </>
    )
}
