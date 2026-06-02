'use client'
import MenuBlock from "@/app/components/MenuBlocks/MenuBlock/MenuBlock";
import type { MenuBlockItem } from "@/app/components/MenuBlocks/menuBlocksContent";

type MenuBlockReverseProps = Omit<MenuBlockItem, "reverse">;

export default function MenuBlockReverse(props: MenuBlockReverseProps){
    return <MenuBlock {...props} reverse />
}
