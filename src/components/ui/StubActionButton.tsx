import { Button, type ButtonProps } from "./Button";
import { useToast } from "@/components/feedback/ToastProvider";

export interface StubActionButtonProps extends ButtonProps {
  /** Toast shown when clicked, until the real action is wired up. */
  notice?: string;
}

/**
 * A design-system button for actions whose behaviour arrives in a later prompt
 * (Add Lead, Create Invoice, …). Keeps the shell interactive without faking data.
 */
export function StubActionButton({
  notice = "This action connects in a later update.",
  children,
  onClick,
  ...rest
}: StubActionButtonProps) {
  const toast = useToast();
  return (
    <Button
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        toast.info(typeof children === "string" ? children : "Coming soon", notice);
      }}
    >
      {children}
    </Button>
  );
}
