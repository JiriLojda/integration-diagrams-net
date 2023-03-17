import { FC, ReactNode } from "react";

type Props = Readonly<{
  onClick: () => void;
  children: ReactNode;
  isInverted?: boolean;
}>;

export const Button: FC<Props> = props => (
  <div className="btn-wrapper">
    <button onClick={props.onClick} className={`btn btn--primary${props.isInverted ? "-inverted" : ""}`}>
      {props.children}
    </button>
  </div>
)

Button.displayName = "Button";

