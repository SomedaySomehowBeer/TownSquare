# TownSquare customization guide

This is the user-facing guide for changing how a TownSquare looks and what appears in it.

It covers:
- what you can change today
- where each kind of change lives
- what the registration page does
- what the admin page does
- what the embed snippet does
- what the CSS does
- what is and is not live right away

## The short version

There are three parts to customization:

1. **Scene setup** — how many benches, trees, lamps, and branches the square has, and where each one sits on the X axis.
2. **Style setup** — the main colors TownSquare uses.
3. **Placement on your site** — where the TownSquare appears in your page layout.

If you use hosted TownSquare:
- you choose your setup in the **registration page**
- you can change it later in the **admin page**
- TownSquare then gives you a refreshed **embed snippet** and **CSS block** to paste into your site

## Where each setting lives

### In TownSquare's saved site setup
TownSquare keeps a saved version of your site's setup.

That saved setup includes:
- your site name
- your registered website URL
- your scene setup
- your style setup

This saved setup is the source of truth for your hosted site.

### In the embed snippet
The embed snippet is the small block of code you paste into your page.

It mainly controls:
- where TownSquare mounts on the page
- which TownSquare server it connects to
- which hosted site it belongs to
- the scene setup used by that mount

In plain language: the snippet says *put my TownSquare here and load this square*.

### In the CSS block
The generated CSS block is the style layer you paste into your stylesheet.

It mainly controls:
- scene color
- page/background color
- surface color
- text/ink color
- accent color
- a few deeper color tokens

In plain language: the CSS says *make the TownSquare look like this*.

## What you can change today

## 1) Scene setup
These settings change what quiet props exist in the square and where each one sits from left to right.

### Benches
How many benches appear.

What this changes:
- how many bench spots exist in the scene
- how many obvious sitting/social spots visitors see

### Trees
How many trees appear.

What this changes:
- how many tree props exist
- how much the square feels shaded, grounded, or park-like
- how many resting/perching spots exist around trees

### Lamps
How many lamps appear.

What this changes:
- how many lamp props appear in the square
- how much the scene feels structured or street-like

### Branches
How many loose branch props appear.

What this changes:
- how many small perch-like props exist in the scene
- how much the square feels layered rather than empty

### Practical note on scene setup
Scene setup changes the shape of the square, not just its styling.
So it affects both the look and the way the scene reads.

### Manual prop placement
For each bench, tree, lamp, or branch, TownSquare also lets you set an **X position**.

That X value is a simple left-to-right percentage:
- `0` = far left
- `50` = middle
- `100` = far right

So if you have 4 benches, you can set 4 separate bench X positions.

This is intentionally simple:
- no drag-and-drop editor yet
- no free Y positioning yet
- no rotation/orientation controls yet

The goal is just: *pick how many props you want, then place each one along the square from left to right*.

## 2) Style setup
These settings change the color palette.

### Scene
The main scene color.

This affects the core visual field inside the square.

### Page
The page-level background color around the square.

This helps TownSquare sit more naturally inside your site.

### Surface
The surface color used for panels, plates, and softer UI areas.

### Ink
The main dark/text color.

This affects readability and overall contrast.

### Accent
The strongest highlight color.

This is the color most likely to give the square its character.

### Deeper style tokens
TownSquare also supports a couple of deeper style tokens:
- `other`
- `ground`

These are useful for finer styling control, but they are not the main controls most site owners need first.
They may be set directly in code/CSS even if they are not exposed as first-class controls everywhere yet.

## 3) Theme mode
TownSquare can also follow or override light/dark mode behavior.

Current theme options are:
- `auto`
- `light`
- `dark`

### Auto
Follows the visitor's device/browser color-scheme preference.

### Light
Forces the light palette.

### Dark
Forces the dark palette.

This is most useful if your site has its own manual dark mode and you want TownSquare to stay aligned with it.

## What the hosted registration page lets you do

The hosted registration page is the first setup flow.

It lets you:
- enter your website URL
- optionally set a site name
- choose scene prop counts
- choose an X position for each prop
- choose the main style colors
- preview the square before creating it
- get your embed snippet
- get your CSS block
- get your admin token and admin link

This is the easiest way to start if you are using TownSquare as a hosted service.

## What the hosted admin page lets you do

The hosted admin page is where you come back later.

It lets you:
- sign in with your admin token
- see whether your site has connected yet
- see active visitors
- edit scene setup
- edit each prop's X position
- edit style setup
- preview changes before saving
- save changes
- copy the refreshed embed snippet
- copy the refreshed CSS block
- moderate visitors
- disable chat
- disable the whole site
- clear recent in-memory messages

In plain language: registration is for first setup, admin is for ongoing control.

## What changes you can safely make yourself after setup

You can safely:
- change scene counts in admin
- change prop X positions in admin
- change colors in admin
- copy the refreshed snippet again
- copy the refreshed CSS again
- keep tweaking the CSS on your own site if you want small styling adjustments

## What the embed snippet is for

The embed snippet is not mainly for visual styling.
It is mainly for:
- loading TownSquare
- pointing it at the correct server
- connecting it to the correct hosted site
- carrying the square's scene setup

If the square's structure changes, the snippet may need to be recopied.

## What the CSS block is for

The CSS block is the visual customization layer.
It is the right place for:
- palette changes
- style token overrides
- small visual adjustments

If the look changes, the CSS is usually the part you will care about most.

## Is all configuration just in the snippet and CSS?

Not exactly.

A better way to think about it is:
- TownSquare saves your site's setup internally
- then TownSquare generates the snippet and CSS from that setup
- then you paste those generated outputs into your site

So:
- **the saved setup** is the official version
- **the snippet and CSS** are the portable outputs you use on your site

## What updates immediately and what does not

### Style changes
Style changes are straightforward:
- save the new setup
- copy the refreshed CSS
- update the CSS on your site

### Scene changes
Scene changes are a little more structural.
When you save a new scene setup, TownSquare stores it and regenerates the snippet.

That new saved setup is used safely for future loads.

Current safe behavior:
- the new saved scene is definitely used for future visits / fresh loads
- TownSquare does not yet aggressively rebuild a busy live scene in front of connected visitors just because an admin changed the layout

That is deliberate. It avoids breaking an active square mid-session.

## Self-hosted / code-based customization

If you are mounting TownSquare directly in code rather than using the hosted registration flow, you can pass configuration into `mountTownSquare(...)` yourself.

That includes:
- `serverOrigin`
- `socketPath`
- `siteKey` when relevant
- `scene`
- `style`
- `theme`

Example:

```js
mountTownSquare(document.getElementById("townsquare-root"), {
  serverOrigin: "https://your-townsquare-host",
  scene: {
    benches: 1,
    trees: 2,
    lamps: 1,
    branches: 4,
  },
  style: {
    scene: "#e6dfd3",
    page: "#f5efe7",
    surface: "#fffaf6",
    ink: "#2d2926",
    accent: "#9d5c2f",
  },
  theme: "auto",
});
```

This is the more direct, code-first route.

## What kind of changes are best made where

### Best changed in admin
- benches
- trees
- lamps
- branches
- main colors

### Best changed in CSS
- small visual refinements
- palette tweaks after generation
- site-specific polish around the mount

### Best changed in your page layout
- width
- spacing above/below the square
- where the square appears in the page

## Current limits

Current customization is intentionally narrow.
That is a good thing for now.

Today it is focused on:
- a small set of scene props
- a stable set of style tokens
- safe hosted editing
- predictable generated outputs

It is **not** yet a full open-ended theming or plugin system.

That means:
- no arbitrary prop authoring in the user-facing flow
- no freeform scene editor
- no full design-system-level configuration surface

## Recommended owner workflow

For most site owners, the best workflow is:

1. Open registration.
2. Choose your first scene and colors.
3. Preview it.
4. Copy the snippet into your page.
5. Copy the CSS into your stylesheet.
6. Open admin later when you want to revise it.
7. Save changes.
8. Recopy the refreshed snippet/CSS if needed.

## Summary

TownSquare customization currently works like this:
- **scene setup** changes the props in the square
- **style setup** changes the color system
- **registration** is the first setup flow
- **admin** is the editable ongoing setup flow
- **snippet** carries the mount/runtime/site information and scene setup
- **CSS** carries the visual customization layer
- TownSquare also keeps a saved internal version of your setup so it can be edited and regenerated later
