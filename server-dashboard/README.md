# Server Dashboard

Schulversion des Server Dashboards fuer Gandalf.

Enthaltene Funktionen:

- Serverstatus anzeigen
- Gandalf per Wake-on-LAN starten
- Links zu Diensten anzeigen

## Docker-Start

```bash
docker compose up --build
```

Danach sind die Oberflaeche und API erreichbar:

- Frontend: `http://localhost:3333`
- Health: `http://localhost:3001/api/health`
- Serverstatus: `http://localhost:3001/api/server`

## IP- und MAC-Konfiguration

Die Serverdaten liegen in `backend/config/server.json`.

```json
{
  "serverName": "Gandalf",
  "ip": "172.16.10.250",
  "mac": "b4:2e:99:47:f3:7f",
  "refreshInterval": 10000
}
```

Die MAC-Adresse wird fuer Wake-on-LAN verwendet. Die IP-Adresse beschreibt den Zielserver Gandalf.

## Wake-on-LAN

Das Dashboard ruft diesen Endpunkt auf:

```http
POST /api/server/start
```

Bei Erfolg antwortet das Backend:

```json
{
  "success": true,
  "message": "Wake-on-LAN packet sent"
}
```

Der Start-Button ist nur aktiv, wenn Gandalf offline ist. Wenn Gandalf online ist, zeigt der Button `Gandalf läuft bereits`.

## Dienst-Links

Die Dienst-Kacheln werden im Frontend aus `frontend/src/services/serviceTestData.ts` geladen.

Standardmaessig werden die Links mit dem aktuellen Host und diesen Ports gebildet:

- OpenWebUI: `8080`
- ComfyUI: `8188`
- n8n: `5678`
- Portainer: `9000`
- Pi-hole: `8081`

Falls ein fester Host genutzt werden soll, kann `VITE_SERVICE_BASE_URL` gesetzt werden:

```bash
VITE_SERVICE_BASE_URL=http://172.16.10.250
```

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Das Frontend nutzt `/api` als Standard-Basis. In der lokalen Entwicklung leitet Vite diese Requests an `http://localhost:3001` weiter.

## Checks

```bash
npm run lint
npm run typecheck
npm run format
```
