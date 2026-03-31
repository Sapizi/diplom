'use client';

import { MainNavButton, MainNavButtonsContainer } from "@/app/components/MainNavButtons/MainNavButtonsStyles";

const NAV_ITEMS = [
  { label: "Комбо обеды", category: "kombo-obedy" },
  { label: "Шаурма", category: "shaurma" },
  { label: "Кесадилья", category: "kesadilya" },
  { label: "Тако", category: "tako" },
  { label: "Буррито", category: "burrito" },
  { label: "Горячие блюда", category: "goryachie-blyuda" },
  { label: "Фритюр", category: "frityur" },
  { label: "Дополнения", category: "dopolneniya" },
];

export default function MainNavButtons() {
  return (
    <MainNavButtonsContainer>
      {NAV_ITEMS.map((item) => (
        <MainNavButton key={item.category} href={`/menu?category=${item.category}`}>
          {item.label}
        </MainNavButton>
      ))}
    </MainNavButtonsContainer>
  );
}
