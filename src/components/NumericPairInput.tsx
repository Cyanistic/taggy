import { TextField, TextFieldLabel, TextFieldRoot } from "./ui/textfield";
import { JSX } from "solid-js";

interface NumberPairInputProps {
  firstLabel: string;
  secondLabel: string;
  firstValue: number | undefined;
  secondValue: number | undefined;
  onFirstChange: (value: number | undefined) => void;
  onSecondChange: (value: number | undefined) => void;
  class?: string;
}

export function NumericPairInput(props: NumberPairInputProps) {
  const handleFirstChange: JSX.EventHandler<HTMLInputElement, Event> = (e) => {
    const value = e.currentTarget?.value;
    // Allow empty input (undefined) or valid positive integers
    if (value === "") {
      props.onFirstChange?.(undefined);
    } else {
      const num = Number.parseInt(value, 10);
      if (!isNaN(num) && num >= 0 && num <= 65535) {
        props.onFirstChange?.(num);
      }
    }
  };

  const handleSecondChange: JSX.EventHandler<HTMLInputElement, Event> = (e) => {
    const value = e.currentTarget?.value;
    // Allow empty input (undefined) or valid positive integers
    if (value === "") {
      props.onSecondChange?.(undefined);
    } else {
      const num = Number.parseInt(value, 10);
      if (!isNaN(num) && num >= 0 && num <= 65535) {
        props.onSecondChange?.(num);
      }
    }
  };

  return (
    <div class={props.class}>
      <div class="flex items-center gap-2">
        <div class="flex-1">
          <TextFieldRoot>
            <TextFieldLabel class="sr-only">{props.firstLabel}</TextFieldLabel>
            <TextField
              id={props.firstLabel.toLowerCase().replace(/\s+/g, "-")}
              type="number"
              min="0"
              max="65535"
              value={props.firstValue}
              onInput={handleFirstChange}
              placeholder={props.firstLabel}
              class="text-center"
            />
          </TextFieldRoot>
        </div>
        <span class="text-muted-foreground font-bold">/</span>
        <div class="flex-1">
          <TextFieldRoot>
            <TextFieldLabel class="sr-only">{props.secondLabel}</TextFieldLabel>
            <TextField
              id={props.secondLabel.toLowerCase().replace(/\s+/g, "-")}
              type="number"
              min="0"
              max="65535"
              value={props.secondValue}
              onInput={handleSecondChange}
              placeholder={props.secondLabel}
              class="text-center"
            />
          </TextFieldRoot>
        </div>
      </div>
    </div>
  );
}
