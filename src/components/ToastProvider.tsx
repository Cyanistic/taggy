import { createContext, ParentComponent, Show, useContext } from "solid-js";
import { Portal } from "solid-js/web";
import { toaster } from "@kobalte/core/toast";
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastContent,
  ToastProgress,
  ToastRegion,
  ToastList,
} from "./ui/toast"; // adjust path as needed

export interface ToastContextValue {
  showSuccess: (
    title: string,
    description?: string,
    ...consoleMessage: unknown[]
  ) => void;
  showError: (
    title: string,
    description?: string,
    ...consoleMessage: unknown[]
  ) => void;
}

const ToastContext = createContext<ToastContextValue>();

export const ToastProvider: ParentComponent = (props) => {
  const show =
    (variant: "default" | "destructive") =>
    (title: string, description?: string, ...consoleMessage: unknown[]) => {
      toaster.show((props) => {
        if (consoleMessage?.length) {
          console.error(...consoleMessage);
        }
        return (
          <Toast toastId={props.toastId} variant={variant}>
            <ToastContent>
              <div>
                <ToastTitle>{title}</ToastTitle>
                <Show when={description}>
                  <ToastDescription>{description}</ToastDescription>
                </Show>
              </div>
            </ToastContent>
            <ToastProgress />
          </Toast>
        );
      });
    };

  const ctx: ToastContextValue = {
    showSuccess: show("default"),
    showError: show("destructive"),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {props.children}

      <Portal>
        <ToastRegion duration={2000} swipeDirection="right">
          <ToastList />
        </ToastRegion>
      </Portal>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
