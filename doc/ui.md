# UI Coding Standards

## Component Library

### shadcn/ui - REQUIRED

**All UI components in this project MUST use shadcn/ui components exclusively.**

### Critical Rules

1. **ONLY shadcn/ui Components**
   - All user interface elements MUST be built using shadcn/ui components
   - Visit [ui.shadcn.com](https://ui.shadcn.com) for the complete component library

2. **NO Custom Components**
   - **ABSOLUTELY NO custom UI components should be created**
   - Do not build buttons, inputs, cards, dialogs, or any other UI primitives from scratch
   - Do not create custom wrappers or alternatives to shadcn components

3. **Component Installation**
   - Install shadcn components using: `npx shadcn@latest add [component-name]`
   - Components are added to `src/components/ui/` directory
   - Each component comes pre-configured with proper TypeScript types and Tailwind styling

## Available shadcn/ui Components

When you need UI elements, use these shadcn components:

### Layout & Structure
- `card` - Cards with header, content, footer
- `separator` - Divider lines
- `aspect-ratio` - Maintain aspect ratios
- `scroll-area` - Scrollable containers

### Navigation
- `navigation-menu` - Navigation bars
- `menubar` - Menu bars
- `breadcrumb` - Breadcrumb navigation
- `pagination` - Page navigation
- `tabs` - Tabbed interfaces

### Forms & Inputs
- `form` - Form wrapper with validation
- `input` - Text inputs
- `textarea` - Multi-line text
- `select` - Dropdown selections
- `checkbox` - Checkboxes
- `radio-group` - Radio buttons
- `switch` - Toggle switches
- `slider` - Range sliders
- `calendar` - Date picker calendar
- `date-picker` - Date selection
- `label` - Form labels

### Buttons & Actions
- `button` - All button variations
- `toggle` - Toggle buttons
- `toggle-group` - Toggle button groups

### Display & Feedback
- `alert` - Alert messages
- `alert-dialog` - Alert modals
- `dialog` - Modal dialogs
- `sheet` - Slide-out panels
- `toast` - Toast notifications
- `popover` - Popover content
- `tooltip` - Hover tooltips
- `hover-card` - Hover cards
- `badge` - Badges and tags
- `avatar` - User avatars
- `progress` - Progress bars
- `skeleton` - Loading skeletons

### Data Display
- `table` - Data tables
- `accordion` - Collapsible sections
- `collapsible` - Expandable content
- `command` - Command palette
- `context-menu` - Right-click menus
- `dropdown-menu` - Dropdown menus

## Implementation Guidelines

### When Building Features

1. **Identify UI Needs** - Determine what UI elements are required
2. **Find shadcn Component** - Check [ui.shadcn.com](https://ui.shadcn.com) for the appropriate component
3. **Install Component** - Run `npx shadcn@latest add [component-name]`
4. **Use Component** - Import from `@/components/ui/[component-name]`

### Example Usage

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function MyPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter text..." />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  )
}
```

## Date Formatting Standards

### date-fns - REQUIRED

**All date formatting in this project MUST use date-fns.**

### Date Format

All dates displayed in the UI must follow this exact format:

```
1st Sep 2025
2nd Aug 2025
3rd Jan 2026
4th Jun 2024
```

**Format Pattern**: `do MMM yyyy`

- `do` - Day of month with ordinal (1st, 2nd, 3rd, 4th, etc.)
- `MMM` - Abbreviated month name (Jan, Feb, Mar, etc.)
- `yyyy` - Full year (2024, 2025, 2026, etc.)

### Implementation

Install date-fns:
```bash
npm install date-fns
```

Format dates using the `format` function:

```tsx
import { format } from 'date-fns'

// Format a date
const formattedDate = format(new Date('2025-09-01'), 'do MMM yyyy')
// Output: "1st Sep 2025"

// In a component
export default function WorkoutCard({ date }: { date: Date }) {
  return (
    <Card>
      <CardContent>
        <p>{format(date, 'do MMM yyyy')}</p>
      </CardContent>
    </Card>
  )
}
```

### Rules

1. **Always use date-fns** - Do not use native JavaScript date methods for formatting
2. **Consistent format** - Use `'do MMM yyyy'` pattern for all date displays
3. **No custom formatting** - Do not create custom date formatting functions
4. **TypeScript dates** - Always work with `Date` objects, not strings

### Examples

```tsx
import { format } from 'date-fns'

// Correct
format(new Date('2025-01-15'), 'do MMM yyyy') // "15th Jan 2025"
format(new Date('2024-12-03'), 'do MMM yyyy') // "3rd Dec 2024"

// Incorrect - Don't do this
new Date().toLocaleDateString() // ❌
myDate.toString() // ❌
`${day}/${month}/${year}` // ❌
```

## Why Only shadcn/ui?

- **Consistency** - Uniform look and feel across the entire application
- **Accessibility** - Built-in ARIA attributes and keyboard navigation
- **Type Safety** - Full TypeScript support out of the box
- **Maintainability** - Updates and fixes come from a single source
- **Best Practices** - Components follow React and Next.js best practices
- **Customization** - Uses Tailwind CSS for easy theming without custom code

## Enforcement

This standard is **non-negotiable**:
- Code reviews MUST reject any custom UI components
- All UI MUST use shadcn/ui components
- If a required component doesn't exist in shadcn, discuss alternatives before implementation

## Resources

- **Documentation**: [ui.shadcn.com](https://ui.shadcn.com)
- **Component Library**: [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)
- **Installation**: [ui.shadcn.com/docs/installation/next](https://ui.shadcn.com/docs/installation/next)
