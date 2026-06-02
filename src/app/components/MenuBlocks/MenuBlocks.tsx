'use client'
import {MenuBlocksContainer} from "@/app/components/MenuBlocks/MenuBlocksStyles";
import MenuBlock from "@/app/components/MenuBlocks/MenuBlock/MenuBlock";
import { menuBlocksContent } from "@/app/components/MenuBlocks/menuBlocksContent";
import { LoginButton } from "@/app/components/auth/AuthStyles";
import { useRouter } from 'next/navigation';

export default function MenuBlocks(){
    const router = useRouter();
    return(
        <>
            <MenuBlocksContainer>
                {menuBlocksContent.map((block) => (
                    <MenuBlock key={block.id} {...block}/>
                ))}
                <LoginButton type="button" onClick={() => router.push('/menu')}>Смотреть все</LoginButton>
            </MenuBlocksContainer>
        </>
    )
}
