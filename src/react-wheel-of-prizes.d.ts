declare module "react-wheel-of-prizes" {
  import type { FC } from "react";
  export interface WheelComponentProps {
    segments: string[];
    segColors: string[];
    winningSegment?: string;
    onFinished: (segment: string) => void;
    primaryColor?: string;
    contrastColor?: string;
    buttonText?: string;
    isOnlyOnce?: boolean;
    size?: number;
    upDuration?: number;
    downDuration?: number;
    fontFamily?: string;
  }
  const WheelComponent: FC<WheelComponentProps>;
  export default WheelComponent;
}
