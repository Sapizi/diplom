import {MenuBlocksContainer} from "@/app/components/MenuBlocks/MenuBlocksStyles";
import MenuBlock from "@/app/components/MenuBlocks/MenuBlock/MenuBlock";
import MenuBlockReverse from "@/app/components/MenuBlocks/MenuBlock/MenuBlockReversStyles";


export default function MenuBlocks(){
    return(
        <>
            <MenuBlocksContainer>
                <MenuBlock/>
                <MenuBlockReverse/>
            </MenuBlocksContainer>
        </>
    )
}