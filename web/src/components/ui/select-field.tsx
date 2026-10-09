'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Option } from '@/lib/member-options'

type SelectFieldProps<T extends string> = {
  label: string
  options: readonly Option<T>[]
  onValueChange: (value: T) => void
  value?: T
  defaultValue?: T
  placeholder?: string
  className?: string
  labelClassName?: string
  triggerClassName?: string
}

/** Label + Select no mesmo padrão visual de `<Label>` + `<Input>` nos formulários. */
export function SelectField<T extends string>({
  label,
  options,
  onValueChange,
  value,
  defaultValue,
  placeholder = 'Selecione',
  className,
  labelClassName,
  triggerClassName,
}: SelectFieldProps<T>) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className={labelClassName}>{label}</Label>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={(v) => onValueChange(v as T)}
      >
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
