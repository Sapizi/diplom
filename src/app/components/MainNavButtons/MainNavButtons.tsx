'use client';

import type { MouseEvent } from "react";
import { MainNavButton, MainNavButtonsContainer } from "@/app/components/MainNavButtons/MainNavButtonsStyles";
import { menuBlocksContent } from "@/app/components/MenuBlocks/menuBlocksContent";

export default function MainNavButtons() {
  const handleCategoryClick = (
    event: MouseEvent<HTMLAnchorElement>,
    categoryId: string,
  ) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    const targetBlock = document.getElementById(categoryId);

    if (!targetBlock) {
      return;
    }

    targetBlock.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    window.history.replaceState(null, "", `/#${categoryId}`);
  };

  return (
    <MainNavButtonsContainer>
      {menuBlocksContent.map((item) => (
        <MainNavButton
          key={item.id}
          href={`/#${item.id}`}
          onClick={(event) => handleCategoryClick(event, item.id)}
        >
          {item.title}
        </MainNavButton>
      ))}
    </MainNavButtonsContainer>
  );
}
