import styles from "./AuthStyles.module.scss";
import { createStyledComponent, createStyledLink } from "@/lib/scssComponents";

export const LoginContainer = createStyledComponent(
  "div",
  styles.loginContainer,
);
export const LoginForm = createStyledComponent("form", styles.loginForm);
export const LoginFormTitle = createStyledComponent(
  "h1",
  styles.loginFormTitle,
);
export const LoginInputContainer = createStyledComponent(
  "div",
  styles.loginInputContainer,
);
export const LoginFormLabel = createStyledComponent(
  "label",
  styles.loginFormLabel,
);
export const LoginFormInput = createStyledComponent(
  "input",
  styles.loginFormInput,
);
export const CheckboxContainer = createStyledComponent(
  "div",
  styles.checkboxContainer,
);
export const LoginCheckbox = createStyledComponent(
  "input",
  styles.loginCheckbox,
);
export const CheckBoxText = createStyledComponent("span", styles.checkBoxText);
export const CheckBoxLink = createStyledLink(styles.checkBoxLink);
export const LoginButton = createStyledComponent("button", styles.loginButton);
