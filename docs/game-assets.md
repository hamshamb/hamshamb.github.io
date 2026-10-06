# Game title card assets

The game shelf on the home page (Stuff, games) uses each game's own logo where one is published,
so a visitor can recognise the game at a glance. These logos are trademarks of their owners. They
are used only to name games I have played, with my own self-reported hours beside them. No
ownership is claimed, and nothing here suggests endorsement.

All logos are the games' Steam library logos, the transparent artwork each developer or publisher
supplies to the Steam store. They were downloaded once, trimmed, resized to at most 440x200 and
converted to WebP. They are stored in `public/games/` and never hotlinked.

Retrieved: 2026-10-06.

| game | asset | source | notes |
| --- | --- | --- | --- |
| Undertale | `public/games/undertale.webp` | https://cdn.cloudflare.steamstatic.com/steam/apps/391540/logo.png | Steam app 391540 |
| BeamNG.drive | `public/games/beamng.webp` | https://cdn.cloudflare.steamstatic.com/steam/apps/284160/logo.png | Steam app 284160 |
| Geometry Dash | `public/games/geometry-dash.webp` | https://cdn.cloudflare.steamstatic.com/steam/apps/322170/logo.png | Steam app 322170 |
| Buckshot Roulette | `public/games/buckshot-roulette.webp` | https://cdn.cloudflare.steamstatic.com/steam/apps/2835570/logo.png | Steam app 2835570 |
| Sky: Children of the Light | `public/games/sky.webp` | https://cdn.cloudflare.steamstatic.com/steam/apps/2325290/logo.png | Steam app 2325290 |
| Hydroneer | `public/games/hydroneer.webp` | https://cdn.cloudflare.steamstatic.com/steam/apps/1106840/logo.png | Steam app 1106840 |
| Counter-Strike 2 | `public/games/cs2.webp` | https://cdn.cloudflare.steamstatic.com/steam/apps/730/logo.png | Steam app 730; navy wordmark, so its tile is light |
| Call of Duty: Black Ops Cold War | `public/games/cod-cold-war.webp` | https://cdn.cloudflare.steamstatic.com/steam/apps/1985810/logo.png | Steam app 1985810 |
| Garry's Mod | `public/games/garrys-mod.webp` | https://cdn.cloudflare.steamstatic.com/steam/apps/4000/logo.png | Steam app 4000 |
| My Summer Car | `public/games/my-summer-car.webp` | https://cdn.cloudflare.steamstatic.com/steam/apps/516750/logo.png | Steam app 516750 |
| Kerbal Space Program | `public/games/ksp.webp` | https://cdn.cloudflare.steamstatic.com/steam/apps/220200/logo.png | Steam app 220200 |

## Typographic cards (no asset)

These games have no logo at the public Steam library path, so their cards use a typographic title
set in the site's own fonts. It is a type treatment, not a recreation of their logo.

| game | why |
| --- | --- |
| Call of Duty: Modern Warfare III | Steam app 3595270 has no public library logo at the stable path |
| My Winter Car | Steam app 4164420, same |
| Sandboxels | Steam app 3664820, same |
| Meccha Chameleon | Steam app 4704690, same (Steam lists it as "MECCHA CHAMELEON") |

## Motifs

The faint line drawings behind each card (`components/home/GameMotif.tsx`) are original: a
crosshair, an orbit, a road, falling pixels. They are not taken from any game.
