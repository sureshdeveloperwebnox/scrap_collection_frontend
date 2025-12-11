import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface RowsPerPageProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
  className?: string;
}

const RowsPerPage = React.forwardRef<HTMLDivElement, RowsPerPageProps>(
  ({ value, onChange, options = [10, 20, 50, 100], className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center gap-2 ${className || ''}`}
        {...props}
      >
        <Label htmlFor="rows-per-page" className="text-sm text-muted-foreground whitespace-nowrap">
          Rows per page:
        </Label>
        <Select
          value={value.toString()}
          onValueChange={(val) => onChange(parseInt(val, 10))}
        >
          <SelectTrigger id="rows-per-page" className="h-9 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option.toString()}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
);
RowsPerPage.displayName = "RowsPerPage";

export { RowsPerPage };
