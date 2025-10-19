import {
    RecCardContent,
    RecCardImg,
    RecCardText,
    RecCardTitle,
    RecommendationCardMaket
} from "@/app/components/RecommendationBlock/RecommendationCard/RecommendationCardStyles";

export default function RecommendationCard(){
    return (
        <>
            <RecommendationCardMaket>
                <RecCardContent>
                    <RecCardImg src={'/TestRecImg.svg'}/>
                    <RecCardTitle>Фахитос</RecCardTitle>
                    <RecCardText>от 330 руб.</RecCardText>
                </RecCardContent>
            </RecommendationCardMaket>
        </>
    )
}