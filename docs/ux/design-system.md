# Design System

## Aesthetic direction

**Professional transit operations desk.**

The UI should feel like a serious operations control room mixed with a refined customer service portal: trustworthy, mobile-first, clear, and efficient.

## Visual principles

- Strong information hierarchy.
- Large touch targets.
- Clear status tags.
- Reduced visual noise.
- Background line/grid motifs inspired by transit maps.
- Customer-facing pages must feel official-grade without claiming official affiliation.

## Palette

```text
Ink navy:       #10192f
Deep ink:       #0b1020
Ivory paper:    #f4efe6
Warm card:      #fbf8ef
Amber accent:   #f4a62a
Blue accent:    #1f9bd1
Success green:  #0d8a61
Danger red:     #b42318
```

## Typography

Default prototype uses:

- Display: Newsreader
- Body: Sora

Do not use generic admin-dashboard defaults as the main design character. The interface should be recognizably designed for ticket/mail operations.

## Components

- `Button`
- `Input`
- `Card`
- `Table`
- `Tag`
- `Modal`

Modules should reuse these components.

## Mobile behavior

At narrow widths:

- Sidebar becomes horizontal top navigation.
- Cards become single-column.
- Search expands to full width.
- Order handover text must remain easy to copy.
- Customer portal should work inside WeChat browser.

## Customer-facing copy tone

Use concise operational language:

- “登录邮箱”
- “复制完整邮箱”
- “查看验证码”
- “打开 TicketPlus+ App”
- “重要规则”

Avoid suspicious or unofficial-sounding terms:

- “刷票”
- “破解”
- “绕过”
- “内部渠道”
- “官方合作” unless actually true.
