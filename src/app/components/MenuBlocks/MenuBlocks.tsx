import {MenuBlocksContainer} from "@/app/components/MenuBlocks/MenuBlocksStyles";
import MenuBlock from "@/app/components/MenuBlocks/MenuBlock/MenuBlock";
import MenuBlockReverse from "@/app/components/MenuBlocks/MenuBlock/MenuBlockReversStyles";
import { LoginButton } from "@/app/components/auth/AuthStyles";
import { redirect } from "next/dist/server/api-utils";
import { useRouter } from 'next/navigation';

export default function MenuBlocks(){
    const router = useRouter();
    return(
        <>
            <MenuBlocksContainer>
                <MenuBlock/>
                <MenuBlockReverse/>
                <LoginButton onClick={() => router.push('/menu')}>Смотреть все</LoginButton>
            </MenuBlocksContainer>
        </>
    )
}
