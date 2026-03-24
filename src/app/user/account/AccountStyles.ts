import styles from "./AccountStyles.module.scss";
import { createStyledComponent, createStyledLink } from "@/lib/scssComponents";

export const ImageContainer = createStyledComponent(
  "div",
  styles.imageContainer,
);
export const Avatar = createStyledComponent("img", styles.avatar);
export const Name = createStyledComponent("span", styles.name);
export const ChangeLink = createStyledComponent("a", styles.changeLink);
export const Container = createStyledComponent("div", styles.container);
export const UserActivity = createStyledComponent("div", styles.userActivity);
export const Bonus = createStyledComponent("div", styles.bonus);
export const BonusText = createStyledComponent("p", styles.bonusText);
export const BonusBalance = createStyledComponent("p", styles.bonusBalance);
export const UserGreyBlock = createStyledLink(styles.userGreyBlock);
export const GreyBlockText = createStyledComponent("p", styles.greyBlockText);
export const GreyBlockP = createStyledComponent("p", styles.greyBlockP);
