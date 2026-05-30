omplete Design System Extraction
1. Color System
CSS Variables (:root)
Token	Hex	Tailwind equivalent
--background	#f7f9fb	bg-background
--foreground	#191c1e	text-foreground
--card	#ffffff	bg-card
--card-foreground	#191c1e	text-card-foreground
--popover	#ffffff	bg-popover
--popover-foreground	#191c1e	text-popover-foreground
--primary	#334155 — slate-900	bg-primary, text-primary
--primary-foreground	#ffffff	text-primary-foreground
--secondary	#505f76	bg-secondary
--secondary-foreground	#ffffff	text-secondary-foreground
--muted	#f2f4f6	bg-muted
--muted-foreground	#44474c	text-muted-foreground
--accent	#e0e3e5	bg-accent
--accent-foreground	#191c1e	text-accent-foreground
--destructive	#ba1a1a	bg-destructive
--destructive-foreground	#ffffff	text-destructive-foreground
--border	#c5c6cd	border-border
--ring	#334155	ring-ring
--sidebar	#ffffff	bg-sidebar
--sidebar-foreground	#191c1e	text-sidebar-foreground
--sidebar-primary	#334155	bg-sidebar-primary
--sidebar-primary-foreground	#ffffff	text-sidebar-primary-foreground
--sidebar-accent	#f2f4f6	bg-sidebar-accent
--sidebar-accent-foreground	#191c1e	text-sidebar-accent-foreground
--sidebar-border	#c5c6cd	border-sidebar-border
--sidebar-ring	#334155	ring-sidebar-ring
Directly used Tailwind colors (most common)
Usage	Class
Page backgrounds	bg-background (#f7f9fb)
White surfaces	bg-white
Primary buttons	bg-slate-900 → hover:bg-slate-800
Borders	border-slate-200 (#e2e8f0)
Page titles	text-slate-900 (#0f172a)
Body text	text-slate-600 (#475569)
Subtle text	text-slate-400 / text-slate-500
Input border focus	focus:border-[#004446] (teal, coordinator/form system)
Focus ring	focus:ring-[#004446] (teal, coordinator/form) or focus:ring-slate-400 (admin)
Active sidebar bg	bg-slate-50
Status badges	bg-yellow-100 text-yellow-800, bg-green-100 text-green-800, bg-orange-100 text-orange-800, bg-red-100 text-red-800, bg-slate-100 text-slate-800
Red accents	bg-red-500 (unread dots), text-red-600 (destructive text)
Error	bg-red-50 text-red-700, bg-red-600 text-white hover:bg-red-700 (buttons)
Green	bg-green-100 text-green-800, bg-green-600 text-white hover:bg-green-700
Coordinator alternate theme (:root.coordinator-system)
Key change	Value
--primary	#1d4ed8 (blue)
--ring	#3b82f6
--accent	#dbeafe
--primary-container	#3b82f6
--radius	0.75rem
2. Typography
Fonts
Tailwind key	Variable	Stack
font-sans / .font-ui	--font-inter	Inter, sans-serif
font-heading / .font-heading	--font-plex	IBM Plex Sans, sans-serif
font-mono / .font-data	--font-jetbrains	JetBrains Mono, monospace
Type Scale
Element	Classes
Page title	text-2xl font-bold text-slate-900
Dashboard welcome	text-3xl font-bold text-slate-900
Section heading	font-heading text-[24px] font-semibold leading-8 tracking-[-0.01em] text-[#191c1d] sm:text-[30px] sm:leading-10
Card subheading	font-heading text-[20px] font-medium leading-7 text-[#191c1d]
Header title	text-base font-semibold text-slate-950 leading-tight
Header subtitle	text-xs font-medium uppercase tracking-[0.05em] text-slate-500 leading-tight
Form label	block text-base font-medium text-slate-800
Form field	text-base font-medium
Card body	font-ui text-[16px] leading-6 text-[#424845]
Small/meta	text-sm text-slate-500
Data/helper	font-data text-[12px] font-medium leading-4 text-[#424845]
Sidebar section	text-xs font-semibold uppercase tracking-[0.08em] text-slate-400
Sidebar item	text-sm font-medium
Badge	text-xs font-medium
Notification type	text-xs font-medium leading-none
Empty state	text-sm text-slate-500 or text-center py-8 text-slate-500
Font utility classes (from globals.css)
Class	Font
.font-heading	IBM Plex Sans (headings)
.font-ui	Inter (UI/sans)
.font-data	JetBrains Mono (tabular data)
3. Spacing System (Tailwind defaults, no custom extensions)
Most common paddings/margins/gaps:
- Container: px-3 md:px-4 (header), px-4 lg:px-6 (page)
- Sidebar: px-3 py-4 (expanded), px-2 py-4 (collapsed)
- Card: p-6
- Table cell: p-2
- Button: px-4 py-2 (default), px-6 py-2.5 (primary)
- Modal: p-6
- Gap between items: gap-3 (sidebar items), gap-4 (flex groups), gap-6 (card sections)
- Section: mb-6 (toolbar), space-y-1.5 (sidebar items)
4. Border Radius
Token	Value	Used on
rounded-lg	0.75rem (via CSS var)	shadcn cards, shadcn dialogs, alert dialogs
rounded-xl	1rem	Most common — buttons, inputs, sidebar items, badges, popovers, filter pills, stat cards
rounded-2xl	1.25rem	Notification popover, table wrappers, card surfaces, coordinator cards, stat cards, form surfaces
rounded-md	0.5rem	shadcn Badge component
rounded-full	9999px	Unread badge (bell), status badges, sidebar indicator
rounded-xs	0.0625rem (±)	Dialog close button, Sheet close button
Actual most common pattern: rounded-xl for interactive elements (buttons, inputs, sidebar items), rounded-2xl for containers (cards, table wrappers, modals), rounded-full for badges/dots.
5. Shadows
Level	Class	Where used
XS	shadow-xs	Outline button variant, form surfaces
SM	shadow-sm	Stat cards, table cards, toolbar, coordinator cards
MD	shadow-md	Popover base component
LG	shadow-lg	Notification popover, profile dropdown
XL	(none used in codebase)	—
6. Components Inventory
Sidebar
- Bg: bg-white
- Width: w-64 (open), w-16 (collapsed)
- Border: border-r border-slate-200
- Active item: bg-slate-50 text-slate-900 + bg-primary w-0.5 rounded-full indicator
- Inactive item: text-slate-600 + text-slate-500 icon
- Hover: hover:bg-slate-50 hover:text-slate-900, icon group-hover:text-slate-700
- Item layout: gap-3 rounded-xl py-2.5 text-sm font-medium
- Section label: text-xs font-semibold uppercase tracking-[0.08em] text-slate-400 mb-3
Header/Navbar
- Bg: bg-white, border: border-b border-slate-200, height: h-16
- Container: flex h-16 items-center justify-between px-3 md:px-4
- Brand box: h-9 w-9 rounded-xl bg-slate-800 text-white text-sm font-semibold (shows "QR")
- Title: text-base font-semibold text-slate-950 leading-tight
- Subtitle: text-xs font-medium uppercase tracking-[0.05em] text-slate-500
- Actions: flex items-center gap-4
- Bell: p-2 rounded-xl hover:bg-slate-100, icon w-5 h-5 text-slate-500
Buttons
Type	Classes
Primary (admin/Button)	bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 rounded-xl text-sm font-medium
Primary (coordinator, direct)	rounded-xl px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-2
Primary (form, teal)	rounded-xl bg-[#4b6358] text-white px-6 py-2 text-sm font-semibold hover:bg-[#3d4f48]
Secondary	bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl text-sm font-medium h-9 px-4
Outline	border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground rounded-xl text-sm font-medium
Ghost	hover:bg-accent hover:text-accent-foreground rounded-xl text-sm font-medium
Destructive	bg-destructive text-white hover:bg-destructive/90 rounded-xl text-sm font-medium
Cancel/Secondary (standalone)	rounded-xl border border-slate-200 bg-white px-8 py-3 text-[16px] font-semibold text-slate-600 hover:bg-slate-50
Pagination chevron	rounded-lg border border-slate-200 bg-white min-w-[44px] min-h-[44px] p-3 text-slate-500 hover:bg-slate-50
Notification action (icon)	p-1 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-50
Notification small ghost	inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-primary hover:bg-slate-100
FAB	fixed bottom-6 right-6 w-14 h-14 bg-slate-700 hover:bg-slate-800 text-white rounded-full shadow-lg
Inputs
Type	Classes
Base Input	h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-base md:text-sm placeholder:text-muted-foreground focus-visible:border-[#004446] focus-visible:ring-2 focus-visible:ring-[#004446]/20
Search (coordinator)	rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:ring-1 focus:ring-[#004446] focus:border-[#004446]
Search wrapper (toolbar)	flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5
Form field	rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-medium placeholder:text-slate-400 focus:border-[#004446] focus:outline-none focus:ring-0
Date input	rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:ring-2 focus:ring-[rgba(107,114,128,0.18)]
Tables
- Wrapper: border border-slate-200 rounded-2xl overflow-x-auto
- Header row: bg-slate-50
- Header cell: text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap
- Data row: hover:bg-slate-50 border-b transition-colors
- Data cell: p-2 align-middle whitespace-nowrap text-sm text-slate-600
- Empty state: text-center py-8 text-slate-500
- Pagination container: flex items-center justify-between mt-4
- Pagination info: text-sm text-slate-600
Dialogs / Modals
- Overlay: fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in
- Content: fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 duration-200 sm:max-w-lg
- Title: text-lg leading-none font-semibold
- Description: text-muted-foreground text-sm
- Header: flex flex-col gap-2 text-center sm:text-left
- Footer: flex flex-col-reverse gap-2 sm:flex-row sm:justify-end
- Close btn: absolute top-4 right-4 rounded-xs opacity-70 hover:opacity-100
Notification Popover
- Container: sm:w-100 max-sm:w-[calc(100vw-2rem)] max-sm:max-w-[320px] p-0 border-slate-200 rounded-2xl shadow-lg bg-white overflow-hidden
- Header: flex items-center justify-between sm:px-5 px-4 sm:py-4 py-3 border-b border-slate-200
- Item (unread): sm:px-5 px-4 sm:py-4 py-3 bg-slate-50
- Item (read): sm:px-5 px-4 sm:py-4 py-3 bg-white
- Footer: border-t border-slate-200 sm:px-5 px-4 py-3
Cards / Surfaces
- Stat card: bg-white rounded-2xl border border-slate-200 p-6 shadow-sm
- Hover card: rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-[#cee9db] hover:-translate-y-0.5
- si-surface (utility): rounded-2xl bg-white shadow-sm border border-slate-100
- Toolbar: p-4 bg-white rounded-2xl border border-slate-200 shadow-sm mb-6
Profile Dropdown
- Panel: w-56 rounded-2xl border border-slate-200 bg-white shadow-lg
- User info: px-3 py-3 bg-slate-50 rounded-t-2xl
- Username: text-sm font-semibold text-slate-900
- Email: text-xs text-slate-500
- Menu items: px-3 py-2.5 cursor-pointer text-sm text-slate-700 hover:bg-slate-100
Badges / Status
Type	Classes
shadcn Badge (default)	inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground
StatusBadge	inline-flex items-center px-2.5 py-0.5 rounded-2xl text-xs font-medium
Unread (bell)	min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-xs font-semibold
Unread (popover)	min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold
Type label	inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
Focus Rings
- Admin/focus-visible: focus-visible:ring-2 focus-visible:ring-[#004446] focus-visible:ring-offset-2 (Button component)
- Form inputs: focus:border-[#004446] focus:ring-0 or focus:ring-1 focus:ring-[#004446]
- Admin (grey): focus:ring-1 focus:ring-slate-400 focus:ring-offset-2
- Admin inputs: focus:border-slate-400 focus:ring-2 focus:ring-[rgba(107,114,128,0.18)]
7. Responsive Behavior
Breakpoint	Behavior
< 640px (mobile)	Full-width inputs, stacked layouts, sidebar hidden under sheet, tables horizontally scrollable, dialogs max-w-[calc(100%-2rem)], popovers max-w-[calc(100vw-2rem)] capped at 320px
sm: 640px+	Sidebar still hidden, dialogs sm:max-w-lg, buttons become sm:flex-row, filters wrap
md: 768px+	Sidebar visible (w-64), header px-4, tables normal layout, md:flex-row on toolbars, md:text-left on dialog headers
lg: 1024px+	Max container constraints (max-w-7xl mx-auto), regular desktop layout
This is a complete snapshot of the current design language — colors, typography, spacing, components, states, and responsive behavior — extracted directly from the live codebase.