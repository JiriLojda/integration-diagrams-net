import { FC, ReactNode } from "react"

type Props = Readonly<{
  isUnmounting?: boolean;
  children: ReactNode;
}>;

export const NotificationBar: FC<Props> = props => (
  <div className={`notification-bar notification-bar--warning slide-in-50 ${props.isUnmounting && "slide-out-50"}`}>
    <i className="notification-bar__icon icon-exclamation-triangle" />
    <div className="notification-bar__text">
      {props.children}
    </div>
  </div>
)

NotificationBar.displayName = "NotificationBar";

