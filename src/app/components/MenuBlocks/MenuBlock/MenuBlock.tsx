'use client'
import {
    MenuBlockMaket,
    MenuBlockContentLeft,
    MenuBlockTitle, MenuBlockDescription, MenuBlockLink, MenuBlockContentRight, MenuBlockImages, MenuBlockImage
} from "@/app/components/MenuBlocks/MenuBlock/MenuBlockStyles";
import type { MenuBlockItem } from "@/app/components/MenuBlocks/menuBlocksContent";

export default function MenuBlock({
    id,
    title,
    description,
    images,
    href = '/menu',
    linkLabel = 'Смотреть всё',
    reverse = false,
}: MenuBlockItem){
    const textContent = (
        <MenuBlockContentLeft>
            <MenuBlockTitle>{title}</MenuBlockTitle>
            <MenuBlockDescription>{description}</MenuBlockDescription>
            <MenuBlockLink href={href}>{linkLabel}</MenuBlockLink>
        </MenuBlockContentLeft>
    );

    const imageContent = (
        <MenuBlockContentRight>
            <MenuBlockImages>
                {images.map((imageSrc, index) => (
                    <MenuBlockImage
                        key={`${title}-${imageSrc}-${index}`}
                        src={imageSrc}
                        alt={`${title} ${index + 1}`}
                    />
                ))}
            </MenuBlockImages>
        </MenuBlockContentRight>
    );

    return(
        <MenuBlockMaket id={id}>
            {reverse ? (
                <>
                    {imageContent}
                    {textContent}
                </>
            ) : (
                <>
                    {textContent}
                    {imageContent}
                </>
            )}
        </MenuBlockMaket>
    )
}
