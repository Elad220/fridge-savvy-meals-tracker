import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface AmountInputProps extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  step?: number;
  min?: number;
  max?: number;
}

const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ className, value, onChange, step = 1, min = 0, max, ...props }, ref) => {
    const handleIncrement = () => {
      const currentValue = parseFloat(value) || 0;
      const newValue = Math.max(min, currentValue + step);
      if (max === undefined || newValue <= max) {
        onChange(newValue.toString());
      }
    };

    const handleDecrement = () => {
      const currentValue = parseFloat(value) || 0;
      const newValue = Math.max(min, currentValue - step);
      onChange(newValue.toString());
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="number"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={handleInputChange}
          className={cn("pr-8", className)}
          {...props}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-4 w-6 p-0 hover:bg-muted"
            onClick={handleIncrement}
            tabIndex={-1}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-4 w-6 p-0 hover:bg-muted"
            onClick={handleDecrement}
            tabIndex={-1}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }
)
AmountInput.displayName = "AmountInput"

export { AmountInput }