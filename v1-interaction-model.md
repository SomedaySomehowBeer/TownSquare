# TownSquare v1 interaction model

A short definition of the first usable TownSquare experience.
This is still product-facing, not a technical design doc.

## First impression

On arrival, a visitor should immediately understand three things:
- this place is live
- other people may be here too
- they can move, notice, and say something

The scene should feel readable in a few seconds, without explanation.

## Core loop

The v1 loop is simple:
- arrive in the scene
- notice who is present
- move a little
- pause near something or someone
- say something if you want

The point is not progression.
The point is lightweight shared presence.

## Movement

Movement should be limited to left and right.
It should feel responsive, calm, and easy to read.

In v1, movement should be mostly free rather than spot-to-spot,
but props can create sticky zones that gently anchor attention and interaction.

A character can:
- enter the scene
- move left or right
- stop
- idle

Movement should make the place feel inhabited, not game-like.

## Props

Props give the scene shared points of attention.
In v1, they should be few, clear, and immediately understandable.

Good v1 props include:
- benches
- trees
- street lamps

Prop interaction should stay small and readable.
In v1, props should support both:
- proximity-based reactions
- intentional click or tap interactions

Good early examples:
- sit near or on a bench
- pause under a tree or lamp
- trigger a tiny visual response

Props should add expression and legibility, not mechanics-heavy gameplay.
They should also carry distinct social meanings rather than acting as generic decoration,
even if those meanings are defined more fully later.

## Chat

Chat should be lightweight and local to the scene.
It should feel like part of the shared place, not a separate product bolted underneath it.

In v1, chat should combine:
- in-scene speech bubbles for live presence
- a per-character unread indicator when something may have been missed
- a per-character recent-message tray with timestamps for quick recovery
- enough short-term continuity to make live conversation easier

Chat should support presence, not dominate it.
The recovery layer should stay small and secondary.

The current preferred recovery model is:
- speech bubbles remain primary
- the tray exists for recovery, not as the main chat surface
- each character exposes their own small tray rather than feeding one global message log
- the tray shows the last few messages from that character, including read and unread ones
- the unread icon only appears when needed
- hover or focus can preview; click opens the tray fully
- the tray appears as a small floating panel near the character
- the tray follows the character while open

For now, unread state can clear on hover or focus.
That should be treated as provisional and revisited if it proves too eager or too easy to miss.

## Multi-person readability

When several people are present, the scene should remain readable.
A visitor should still be able to tell:
- who is here
- who is moving
- where attention seems to be gathering
- when something was said, even if they did not catch it in the moment

Bubble overlap needs explicit rules.
In v1, that should likely mean:
- up to two visible bubbles per character
- older messages collapsing into that character's tray
- collision avoidance or offsetting where possible
- the scene favoring clarity over strict visual realism

If the space gets busy, clarity matters more than realism.

## V1 boundary

V1 does not need:
- complex movement
- deep prop logic
- persistent identity
- large customization surfaces
- world travel
- plugin systems

It needs one small shared place that already feels alive.
