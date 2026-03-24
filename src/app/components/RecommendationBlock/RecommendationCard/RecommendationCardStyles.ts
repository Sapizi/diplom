import styles from "./RecommendationCardStyles.module.scss";
import { createStyledComponent } from "@/lib/scssComponents";

export const RecommendationCardMaket = createStyledComponent(
  "div",
  styles.recommendationCardMaket,
);
export const RecCardContent = createStyledComponent("div", styles.recCardContent);
export const RecCardImg = createStyledComponent("img");
export const RecCardTitle = createStyledComponent("h2", styles.recCardTitle);
export const RecCardText = createStyledComponent("p", styles.recCardText);
