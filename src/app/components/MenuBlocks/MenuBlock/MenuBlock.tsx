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
                    <MenuBlockDescription>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit</MenuBlockDescription>
                    <MenuBlockLink href={'#'}>Смотреть всё</MenuBlockLink>
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
