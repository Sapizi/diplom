'use client'
import {
    MenuBlockMaket,
    MenuBlockContentLeft,
    MenuBlockTitle, MenuBlockDescription, MenuBlockLink, MenuBlockContentRight, MenuBlockImages, MenuBlockImage
} from "@/app/components/MenuBlocks/MenuBlock/MenuBlockStyles";

export default function MenuBlock(){
    return(
        <>
            <MenuBlockMaket>
                <MenuBlockContentLeft>
                    <MenuBlockTitle>Комбо обеды</MenuBlockTitle>
                    <MenuBlockDescription>Комбо-обеды — это удобное и выгодное решение для тех, кто хочет получить полноценный приём пищи без лишних раздумий. В одном наборе собраны самые удачные позиции меню, которые идеально дополняют друг друга и дарят ощущение сытного и сбалансированного обеда. Горячие блюда, свежие добавки и напитки объединяются в продуманные сочетания, позволяя насладиться разнообразием вкусов за одну цену.</MenuBlockDescription>
                    <MenuBlockLink href={'/menu'}>Смотреть всё</MenuBlockLink>
                </MenuBlockContentLeft>
                <MenuBlockContentRight>
                    <MenuBlockImages>
                        <MenuBlockImage src={'/cesadilia.svg'}/>
                        <MenuBlockImage src={'/burrito.svg'}/>
                    </MenuBlockImages>
                </MenuBlockContentRight>
            </MenuBlockMaket>
        </>
    )
}
