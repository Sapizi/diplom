'use client'
import {
    MenuBlockMaket,
    MenuBlockContentLeft,
    MenuBlockTitle, MenuBlockDescription, MenuBlockLink, MenuBlockContentRight, MenuBlockImages, MenuBlockImage
} from "@/app/components/MenuBlocks/MenuBlock/MenuBlockStyles";

export default function MenuBlockReverse(){
    return(
        <>
            <MenuBlockMaket>

                <MenuBlockContentRight>
                    <MenuBlockImages>
                        <MenuBlockImage src={'/cesadilia.svg'}/>
                        <MenuBlockImage src={'/burrito.svg'}/>
                    </MenuBlockImages>
                </MenuBlockContentRight>
                <MenuBlockContentLeft>
                    <MenuBlockTitle>Шаурма</MenuBlockTitle>
                    <MenuBlockDescription>Шаурма — это идеальное сочетание насыщенного вкуса, сытности и свежести, которое давно стало выбором для тех, кто ценит быструю, но качественную еду. Сочное мясо, приготовленное на гриле до румяной корочки, гармонично сочетается с хрустящими овощами, ароматными специями и фирменными соусами, создавая сбалансированный и запоминающийся вкус.</MenuBlockDescription>
                    <MenuBlockLink href={'/menu'}>Смотреть всё</MenuBlockLink>
                </MenuBlockContentLeft>
            </MenuBlockMaket>
        </>
    )
}
