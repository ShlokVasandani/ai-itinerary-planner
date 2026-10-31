"use client";

import type { ButtonHTMLAttributes } from "react";
import { usePress } from "@/components/usePress";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & { onPress: () => void };

/** A button that commits on mouse pointer-down (see usePress) and on click for everything else. */
export default function PressButton({ onPress, type = "button", ...rest }: Props) {
  return <button type={type} {...rest} {...usePress(onPress)} />;
}
