"use client";

import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@radix-ui/react-toast";
import { Button } from "./ui/button";

export function ToastSimple({
  name,
  message,
}: {
  name: string;
  message: string;
}) {
  const { toast } = useToast();

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          description: `${message}`,
        });
      }}
    >
      {name}
    </Button>
  );
}

export function ToastDestructive({ name, title, description }) {
  const { toast } = useToast();

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          variant: "destructive",
          title: title || "",
          description: description || "Try again",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      }}
    >
      {name}
    </Button>
  );
}
