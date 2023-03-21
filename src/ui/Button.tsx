import { CSSProperties, FC, ReactNode } from "react";

type Props = Readonly<{
  onClick: () => void;
  children: ReactNode;
  type: ButtonType;
  style?: CSSProperties;
}>;

export const Button: FC<Props> = props => (
  <div className="btn-wrapper" style={props.style}>
    <button
      onClick={props.onClick}
      className={`btn ${createButtonClass(props.type)}`}
    >
      {props.children}
    </button>
  </div>
)

Button.displayName = "Button";

export enum ButtonType {
  Primary = "Primary",
  PrimaryInverted = "PrimaryInverted",
  SecondaryDestructive = "SecondaryDestructive",
}

const createButtonClass = (type: ButtonType) => {
  switch (type) {
    case ButtonType.Primary:
      return "btn--primary";
    case ButtonType.PrimaryInverted:
      return "btn--primary-inverted";
    case ButtonType.SecondaryDestructive:
      return "btn--destructive-secondary";
    default:
      throw new Error(`Unknown button type ${type}`);
  }
};

