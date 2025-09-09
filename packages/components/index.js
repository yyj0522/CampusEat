import ButtonWeb from "./web/Button";
import InputWeb from "./web/Input";
import ButtonApp from "./app/Button";
import InputApp from "./app/Input";

const isWeb = typeof window !== "undefined";

export const Button = isWeb ? ButtonWeb : ButtonApp;
export const Input = isWeb ? InputWeb : InputApp;
