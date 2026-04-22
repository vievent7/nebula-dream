# Tracks

Chaque track doit etre ajoutee sous forme de dossier:

```
tracks/
  ma-track/
    metadata.json
    preview.mp3
    full.mp3
    cover.jpg
```

`metadata.json` (optionnel mais recommande):

```json
{
  "title": "Cosmic Drift",
  "description": "Pads spatiaux et respiration lente.",
  "mood": "Deep Sleep",
  "duration": "05:32",
  "preview": "preview.mp3",
  "full": "full.mp3",
  "cover": "cover.jpg"
}
```

Sans metadata, le systeme utilise le nom du dossier et detecte automatiquement les fichiers audio.

Format alternatif supporte:

- Tu peux aussi deposer directement des `.mp3` dans `tracks/`.
- Le systeme groupe automatiquement les variantes `Nom.mp3` + `Nom (1).mp3` pour creer une track.
- Dans ce mode, la version `(1)` est utilisee en preview quand presente.

Miniatures track:

- Dossier track: ajoute `cover.jpg` (ou autre image) dans le dossier, ou declare `cover`/`thumbnail` dans `metadata.json` (ou `track.json`).
- Mode fichiers directs: ajoute une image avec le meme nom logique que l'audio (ex: `Wind Prayer.mp3` + `Wind Prayer.png`).
- Si aucune miniature n'est trouvee, fallback local: `public/assets/default-track-cover.png`.
