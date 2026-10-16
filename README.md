# Personal Blog (FE)

SvelteKit frontend for a Markdown-driven personal blog. Design decisions in
[DESIGN.md](DESIGN.md), step-by-step milestones in [PLAN.md](PLAN.md).

## Live preview

Start the dev server with hot reload (edits appear instantly, no manual refresh):

```sh
npm install        # first time only
npm run dev        # http://localhost:5173
```

**On your phone / another machine (responsive QA):** bind to the network and open the printed LAN URL from the terminal:

```sh
npm run dev -- --host
# → Network: http://192.168.x.x:5173  (same Wi-Fi required)
```

**Behind a remote box (SSH / VS Code):** forward the port instead of binding it —
VS Code's _Ports_ tab auto-detects `5173`; over plain SSH use `ssh -L 5173:localhost:5173 <host>`.

**Production preview** (what the deployed container will actually serve):

```sh
npm run build
npm run preview    # http://localhost:4173  (--host works here too)
```

Theme check: flip the sun/moon toggle in the navbar, reload — the choice persists via cookie and is applied before first paint (no light/dark flash).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@1.1.1 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:typography" --install npm pb-scaffold
```

## Adding features

Add features to your project with `sv add`:

```sh
npx sv add
```

For example, to add Tailwind CSS:

```sh
npx sv add tailwindcss
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
