Inspect and fix the mobile dashboard sidebar open/close toggle issue.

Current problem:

On mobile view, the dashboard side menu shows two close (X) buttons / duplicate sidebar controls when the sidebar is opened.

Requirements:

1. Find the exact source of the duplicate toggle/close buttons.
   - Check Sheet / Dialog / Drawer / Sidebar components.
   - Check dashboard layout, header, mobile navigation trigger, and SheetContent.
   - Check if ShadCN Sheet injects its own close button while another custom close button is also rendered.

2. Keep only one clean mobile sidebar close control.

3. Proper behavior:
   - Closed state → only hamburger/open button visible.
   - Open state → only one close (X) button visible.
   - No overlapping controls.
   - No duplicate icons.
   - No hidden-but-clickable elements.

4. Fix positioning:
   - Close button should align properly in the sidebar header.
   - Should not collide with logo/title.
   - Proper spacing/padding on small screens.

5. Verify responsiveness across:
   - iPhone / Android widths
   - tablets
   - small laptops

6. Inspect entire mobile sidebar interaction:
   - open animation
   - close animation
   - backdrop click
   - escape key
   - route navigation auto-close
   - focus behavior

7. After fixing, explain:
   - root cause
   - file(s) changed
   - before vs after behavior.