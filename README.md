# mossverse-wa-map

WorkAdventure maps for Mossverse, built on top of the official [map-starter-kit](https://github.com/workadventure/map-starter-kit).

## Related Repositories

| Repository | Purpose |
|---|---|
| [mossverse-wa-infra](https://github.com/MosslandCore/mossverse-wa-infra) | Infrastructure and deployment documentation |
| [map-starter-kit](https://github.com/workadventure/map-starter-kit) | Original WorkAdventure starter project |
| [wa-village](https://github.com/workadventure/wa-village) | Upstream source for the `village.tmj` map |

## Maps

| File | Role |
|---|---|
| `village.tmj` | Base village map and starter map for this repository |
| `office.tmj` | Office map connected from `village.tmj` |
| `conference.tmj` | Conference / meeting map connected from `office.tmj` |

## Published Entry Points

| Environment | URL |
|---|---|
| Office map | `https://dev.wa.moss.land/~/mossverse/office.wam` |
| Conference map | `https://dev.wa.moss.land/~/mossverse/conference.wam` |

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173` for local preview. Map scripts live in `src/`.

## Project Structure

```text
mossverse-wa-map/
├── office.tmj
├── conference.tmj
├── village.tmj
├── tilesets/
├── src/
│   ├── main.ts
│   ├── roofs.ts
│   └── meeting/
├── app/
│   └── app.ts
├── .env
├── .env.secret
└── .github/workflows/
```

Notes:

- Add or edit `.tmj` map files at the repository root.
- Keep browser-side map scripts in `src/` so Vite includes them in the build.
- Preserve per-map metadata such as `mapCopyright`, `mapName`, and `script` when editing maps in Tiled.

## Deployment

### Automatic Deployment

Pushing to `master` triggers GitHub Actions to build the maps and upload them to map-storage.

### Required GitHub Secrets

Repository settings -> Secrets and variables -> Actions:

| Name | Value |
|---|---|
| `MAP_STORAGE_API_KEY` | Server `SECRET_KEY` |
| `MAP_STORAGE_URL` | `https://dev.wa.moss.land/map-storage/` |
| `UPLOAD_DIRECTORY` | `mossverse` |

Notes:

- Keep `MAP_STORAGE_API_KEY` in GitHub Secrets only.
- `MAP_STORAGE_URL` and `UPLOAD_DIRECTORY` can also be set locally through `.env`.

### Manual Deployment

```bash
npm run upload
```

Build and upload in one step.

Upload only:

```bash
npm run upload-only
```

### Local Environment Files

`.env`

```env
UPLOAD_MODE=MAP_STORAGE
MAP_STORAGE_URL=https://dev.wa.moss.land/map-storage/
UPLOAD_DIRECTORY=mossverse
```

`.env.secret`

```env
MAP_STORAGE_API_KEY=your_server_secret_key
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local Vite development server |
| `npm run buildmap` | Build maps into `dist/` |
| `npm run upload` | Build and upload maps |
| `npm run upload-only` | Upload without rebuilding |

## Map Credits

This repository contains maps with different upstream origins.

- `village.tmj` is the base / starter map in this repository and was imported from [`workadventure/wa-village`](https://github.com/workadventure/wa-village).
- `office.tmj` and `conference.tmj` are connected maps maintained in this repository.
- Each map keeps its own `mapCopyright` metadata inside the `.tmj` file.

See [NOTICE.maps.md](NOTICE.maps.md) for map-by-map attribution notes.

## Licensing

- Code: [LICENSE.code](LICENSE.code)
- Base map license text: [LICENSE.map](LICENSE.map)
- Asset license notes: [LICENSE.assets](LICENSE.assets)
- Map-specific attribution notes: [NOTICE.maps.md](NOTICE.maps.md)

Important:

- Do not assume every map in this repository is covered by the same attribution notice.
- Keep upstream copyright and attribution metadata intact when editing or redistributing maps.
- In particular, preserve the `village.tmj` base-map notice inherited from `wa-village`.

## References

- [WorkAdventure map building tutorial](https://docs.workadventu.re/map-building/tiled-editor/)
- [WorkAdventure publishing documentation](https://docs.workadventu.re/map-building/tiled-editor/publish/wa-hosted)
- [WorkAdventure scripting API](https://docs.workadventu.re/developer/map-scripting/)
- [map-starter-kit README](https://github.com/workadventure/map-starter-kit)
