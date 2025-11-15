# UI Coding Standards

## Core Principle

**ONLY shadcn/ui components should be used for UI development in this project.**

## Strict Rules

### ✅ ALLOWED
- **shadcn/ui components exclusively** - All UI elements must come from the shadcn/ui library
- Composition of shadcn/ui components together
- Styling shadcn/ui components with Tailwind CSS classes
- Using shadcn/ui component variants and props

### ❌ PROHIBITED
- Creating custom components from scratch
- Building UI elements without shadcn/ui
- Implementing custom dropdowns, modals, forms, buttons, etc.
- Writing component logic that shadcn/ui already provides

## Implementation Guidelines

### 1. Always Check shadcn/ui First
Before implementing any UI element, verify if shadcn/ui provides it:
- Visit: https://ui.shadcn.com/docs/components
- Search the components list
- Use the shadcn/ui CLI to add components

### 2. Installing Components
Use the shadcn/ui CLI to add components to the project:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

### 3. Available shadcn/ui Components
Common components include:
- **Layout**: Card, Separator, Tabs, Accordion
- **Forms**: Input, Button, Checkbox, Radio Group, Select, Textarea, Form, Label
- **Data Display**: Table, Badge, Avatar, Progress
- **Feedback**: Alert, Toast, Dialog, Alert Dialog, Sheet
- **Navigation**: Navigation Menu, Dropdown Menu, Context Menu, Menubar
- **Overlays**: Dialog, Popover, Tooltip, Hover Card, Sheet
- **And many more** - always check the docs

### 4. Composing Components
You may compose shadcn/ui components together to create page layouts and features:

```tsx
// ✅ CORRECT: Composing shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function WorkoutCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Session</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Start Workout</Button>
      </CardContent>
    </Card>
  )
}
```

```tsx
// ❌ WRONG: Creating custom button component
export function CustomButton({ children, ...props }) {
  return (
    <button className="custom-styles" {...props}>
      {children}
    </button>
  )
}
```

### 5. Styling Components
Apply Tailwind CSS classes to customize shadcn/ui components:

```tsx
// ✅ CORRECT: Styling shadcn/ui components with Tailwind
import { Button } from "@/components/ui/button"

<Button className="w-full bg-blue-600 hover:bg-blue-700">
  Submit
</Button>
```

### 6. Complex UI Patterns
For complex patterns, combine multiple shadcn/ui components:

```tsx
// ✅ CORRECT: Complex form using only shadcn/ui
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function WorkoutForm() {
  return (
    <Card>
      <Form>
        <FormField>
          <FormItem>
            <FormLabel>Exercise Name</FormLabel>
            <FormControl>
              <Input placeholder="Bench Press" />
            </FormControl>
          </FormItem>
        </FormField>
        <Button type="submit">Save</Button>
      </Form>
    </Card>
  )
}
```

## Date Formatting Standards

### Required Library
**All date formatting must use `date-fns`**

Install if not present:
```bash
npm install date-fns
```

### Standard Date Format
All dates displayed in the UI must follow this format:
- **1st Sep 2025**
- **2nd Aug 2025**
- **3rd Jan 2026**
- **4th Jun 2024**

Format pattern: `Ordinal Day + Abbreviated Month + Full Year`

### Implementation

```tsx
// ✅ CORRECT: Using date-fns with standard format
import { format } from "date-fns"

const workoutDate = new Date("2025-09-01")
const formattedDate = format(workoutDate, "do MMM yyyy")
// Output: "1st Sep 2025"
```

```tsx
// ❌ WRONG: Using native Date methods
const date = new Date()
const formatted = date.toLocaleDateString()
```

```tsx
// ❌ WRONG: Manual date formatting
const formatted = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
```

### Usage Examples

```tsx
import { format } from "date-fns"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export function WorkoutCard({ date }: { date: Date }) {
  const displayDate = format(date, "do MMM yyyy")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{displayDate}</CardTitle>
      </CardHeader>
    </Card>
  )
}
```

### Date Format Rules
- **Always** use `format()` from date-fns
- **Always** use the format string: `"do MMM yyyy"`
- **Never** create custom date formatting functions
- **Never** use native JavaScript date formatting methods

## Exception Policy

There are **NO EXCEPTIONS** to this rule. If you think you need a custom component:

1. Double-check the shadcn/ui documentation
2. Check if you can compose existing components
3. Verify the component isn't already installed in the project
4. Search for alternative shadcn/ui components that could work

If shadcn/ui truly doesn't provide what you need (rare), consult with the team before proceeding.

## Component Location

All shadcn/ui components are installed to:
```
/components/ui/
```

Always import from this location:
```tsx
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
```

## Resources

- **shadcn/ui Documentation**: https://ui.shadcn.com
- **Component Examples**: https://ui.shadcn.com/examples
- **CLI Documentation**: https://ui.shadcn.com/docs/cli

## Summary

**Remember: When building UI, your first and only choice should be shadcn/ui components. No custom components, no exceptions.**
