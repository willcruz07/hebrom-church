import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, Paintbrush } from 'lucide-react';
import { useState } from 'react';

const COLORS = [
  { name: 'Slate', value: '#64748b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-2 border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-200",
            className
          )}
        >
          {value ? (
            <div
              className="h-4 w-4 rounded-full border border-slate-700"
              style={{ backgroundColor: value }}
            />
          ) : (
            <Paintbrush className="h-4 w-4 text-slate-400" />
          )}
          <span className="truncate flex-1 text-left">
            {value ? COLORS.find(c => c.value === value)?.name || value : "Selecionar cor"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2 bg-slate-950 border-slate-800">
        <div className="grid grid-cols-4 gap-1">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => {
                onChange(color.value);
                setOpen(false);
              }}
              className={cn(
                "group relative flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 transition-all hover:scale-105",
                value === color.value && "ring-2 ring-slate-100 ring-offset-2 ring-offset-slate-950"
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {value === color.value && (
                <Check className="h-4 w-4 text-white drop-shadow-md" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
