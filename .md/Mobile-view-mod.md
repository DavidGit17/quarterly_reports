Fix the mobile notifications popover/modal layout.

Current issues:

1. The notifications modal/popover is appearing too far toward the left side on mobile.
2. The modal is too large/wide for mobile screens.
3. The layout feels oversized and cramped.

Required fixes:

### Positioning

Align the notifications popover to the right side of the screen, anchored properly to the notification bell icon.

Behavior:

- Desktop → right-aligned dropdown/popover from notification icon.
- Mobile → right aligned, visually attached to notification icon.
- Do NOT allow left overflow or awkward centering.

Inspect:

- PopoverContent
- Dropdown positioning
- align / side / sideOffset props
- transform origin
- responsive positioning logic.

Example desired behavior:

txt id="1" notification icon         ↓         ┌───────────────┐         │ notifications │         └───────────────┘ 

not a giant left-floating panel.

---

### Mobile Size Optimization

Reduce modal/popover size on mobile.

Requirements:

- smaller width
- proper max-width
- responsive sizing
- comfortable padding
- reduced visual heaviness

Suggested behavior:

txt id="2" mobile: w-[calc(100vw-1rem)] max-w-[380px] right aligned 

or equivalent responsive implementation.

---

### Internal Layout Cleanup

Improve spacing inside modal:

- header spacing
- notifications title
- unread badge
- Mark all read button
- Clear all button
- notification item spacing
- footer ("View all notifications")

Prevent cramped layout on mobile.

---

### Scrolling Behavior

Ensure:

- proper max-height
- smooth vertical scrolling
- no oversized container growth.

Use responsive max height.

Example:

txt id="3" max-h-[70vh] overflow-y-auto 

---

### Polish

Make mobile notification UI feel:

- compact
- premium
- clean
- balanced
- visually aligned

Provide:

- files changed
- positioning fix applied
- sizing changes
- before vs after behavior.