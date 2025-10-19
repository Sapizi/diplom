'use client'
import {MainNavButton, MainNavButtonsContainer} from "@/app/components/MainNavButtons/MainNavButtonsStyles";

export default function MainNavButtons(){
    return(
        <>
            <MainNavButtonsContainer>
                <MainNavButton>Комбо обеды</MainNavButton>
                <MainNavButton>Шаурма</MainNavButton>
                <MainNavButton>Кесадилья</MainNavButton>
                <MainNavButton>Тако</MainNavButton>
                <MainNavButton>Буррито</MainNavButton>
                <MainNavButton>Горячие блюда</MainNavButton>
                <MainNavButton>Фритюр</MainNavButton>
                <MainNavButton>Дополнения</MainNavButton>
            </MainNavButtonsContainer>
        </>
    )
}
