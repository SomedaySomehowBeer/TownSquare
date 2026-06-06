# Town Square — a tiny presence layer for websites

Short product spec for what this project is trying to be.

## What it is

A tiny presence layer for websites.

Visitors can see that other people are there, move around lightly, and chat in a lightweight shared space at the bottom of the page.

The goal is to make a site feel inhabited.

## What it is not

- Not a social network
- Not a full virtual world
- Not an account system
- Not a persistent identity layer
- Not a long-term chat archive
- Not a moderation-heavy community platform in v1

## Why it exists

The web feels crowded but empty.

There is content everywhere, but little felt human presence. This project is meant to bring back a small sense of shared aliveness: the feeling that other people are here too, right now.

It should create presence first, conversation second.

## Who it is for

First audience:
- indie web people
- personal sites
- small hand-made sites
- technically curious people who are comfortable self-hosting

## Core product principles

- Presence and lightweight chat are both essential
- It should work beautifully with almost no options
- Feeling matters as much as mechanics
- UX matters as much as technical correctness
- Complexity should be optional, not required
- Self-hosted/open source comes first

## MVP

Version 1 should provide:
- a tiny embeddable widget
- lightweight real-time presence
- lightweight real-time chat
- one strong default scene
- very low-friction setup
- self-hosted backend
- ephemeral interaction by default

## Non-goals for v1

- Accounts
- Persistent identity
- Reputation systems
- Long-term chat history
- Heavy moderation systems
- Rich social features
- A huge customization surface

Short-term history may be acceptable if it improves the immediate experience, but long-term history is not part of the product.

Optional lightweight naming is acceptable if it stays low-friction and ephemeral.
A visitor may optionally set a display name for their character, for example by hovering or interacting directly with the character.
That should not turn into a full account or identity system.

## Experience bar

A person should be able to add it to their site and quickly get something that feels alive, playful, and understandable without reading a long manual.

The default experience should already feel good.

Customization is allowed, but the product should not depend on customization to be compelling.

## Product shape

Two modes exist, but only one matters now:

- Model A: self-hosted open-source version first
- Model B: hosted/shared service later

The hosted path should not distort the first version.

## Possible expansion after v1

A compelling later direction is lightweight movement between participating sites.

The presence layer could act a bit like a web ring, but organized through local proximity rather than a flat global directory:
- a site owner chooses a small set of neighbouring sites
- a visitor encounters a character, port, gate, or portal inside the shared scene
- interacting with it takes them to one of those neighbouring websites
- the transition should feel animated and diegetic, not like a cold link click
- over time this could create little clusters, streets, districts, and larger regions across the indie web

The map should be global.
A natural companion to the portal system would be an actual shared map: a cartoonish, hand-drawn graph in the same visual language as the stick figures, showing how participating sites connect and where a portal might lead.
One promising structure is for each server to have its own local map or metropolitan region, while also allowing links between servers that feel more like highways between cities or regions.

This is not necessary for v1, but it fits the product strongly if the core presence layer already works.
The important product quality is that travel should feel like moving through a neighbourhood, then a city, then a wider world — not being dumped into an arbitrary link graph.

## Open questions worth preserving

- How much short-term history is useful before it starts feeling too persistent?
- What is the minimum moderation story needed even for lightweight public chat?
- How much customization is necessary before the product starts getting diluted?
- How should cross-site travel work without breaking the simplicity of the widget?
- Should neighbouring sites be explicitly chosen by each site owner, mutually agreed, or discovered some lighter way?
- How should a global map represent server-level regions versus site-level neighbours without becoming visually cluttered?
- What is the lightest mechanism for connecting different servers while keeping the world coherent?
- How much shared identity between sites is useful before the system starts feeling too persistent?
