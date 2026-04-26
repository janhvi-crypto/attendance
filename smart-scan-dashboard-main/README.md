# Smart Scan Dashboard

## Deploy (Vercel)
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Environment variables** (Project → Settings → Environment Variables):
  - `VITE_MQTT_URL` (format: `wss://<cluster-host>:8884/mqtt`)
  - `VITE_MQTT_USERNAME`
  - `VITE_MQTT_PASSWORD`
  - `VITE_MQTT_TOPIC_ALERTS` (example: `smartscan/alerts`)

Note: this is a single-page app. `vercel.json` includes a rewrite so refreshes on routes don't 404.
