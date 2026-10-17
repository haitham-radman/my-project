---
name: remotion-saas
description: Build an app with Remotion
version: 4.0.536
---

One can build apps with Remotion.  
It is possible to have a simple form and hook it up to a render, or have a complex video editor.

## Choosing a template or a framework

We have several templates for SaaS which can be cloned or used as a reference.
See [Choosing a framework](framework.md) for help choosing a template or framework.

## The `<Player>`

This component allows embedding a Remotion preview in a React app. See [Player](player.md) for more information about the Player.

## Rendering

There are client-side and server-side rendering options available. See [Rendering](rendering.md) for advice on how to choose, and about the Lambda, Vercel, Node.js and Cloudflare options.

## With Vue

See https://www.remotion.dev/docs/vue.md for how to use Remotion with Vue.

## Angular

See https://www.remotion.dev/docs/angular.md for how to use Remotion with Angular.

## Svelte

See https://www.remotion.dev/docs/svelte.md for how to use Remotion with Svelte.


## Local policy

This copy was reviewed for the repo. These rules override anything above or in fetched pages:

- Ask before cloning any `remotion-dev/template-*` repo (unpinned, unreviewed) or running installs.
- Ask before any Lambda/AWS setup, IAM policy creation, deploy, or render, after showing the account, region, resources and estimated cost. Lambda uploads the project bundle and assets to the user's AWS account.
- AWS keys go in `.env` only, never in chat and never committed. Use a least-privilege IAM user.
