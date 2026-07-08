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

Die Container laufen im Host-Netzwerk des Raspberry Pi. Der eigentliche Wake-on-LAN-Versand laeuft zusaetzlich ueber einen kleinen Host-Relay, damit das Magic Packet sicher ueber das physische Netzwerk-Interface gesendet wird.

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
  "broadcastAddress": "172.16.10.255",
  "mac": "b4:2e:99:47:f3:7f",
  "onlineCheckTimeoutMs": 1500,
  "refreshInterval": 10000,
  "wakeCommand": "wake -a {broadcastAddress} -p {port} {mac}",
  "wakePort": 9,
  "wakeRelayUrl": "http://127.0.0.1:3011/wake"
}
```

Die MAC-Adresse wird fuer Wake-on-LAN verwendet. Die IP-Adresse beschreibt den Zielserver Gandalf. `broadcastAddress` und `wakePort` steuern, wohin das Startsignal gesendet wird. Wenn keine Broadcast-Adresse gesetzt ist, leitet das Backend sie aus der Gandalf-IP als `/24`-Adresse ab.

## Wake-on-LAN

Das Dashboard startet Gandalf ueber einen kleinen Wake-on-LAN-Relay auf dem Host. Dadurch sendet nicht der Docker-Container das Magic Packet, sondern der Raspberry Pi selbst.

Relay auf dem Host bauen und starten:

```bash
npm install
npm run build -w backend
npm run wol-relay
```

Der Relay lauscht standardmaessig nur lokal auf dem Pi:

- Host: `127.0.0.1`
- Port: `3011`
- Endpoint: `POST http://127.0.0.1:3011/wake`

Das Backend ruft diesen Relay ueber `wakeRelayUrl` in `backend/config/server.json` auf. Die Gandalf-Verbindungsdaten sind dort passend hinterlegt:

```bash
wake -a 172.16.10.255 -p 9 b4:2e:99:47:f3:7f
```

Der Befehl `wake` kommt aus der Backend-Abhaengigkeit `wake_on_lan`. Wenn der Relay ueber `npm run wol-relay` gestartet wird, ist dieser Befehl auf dem Host ueber die Projekt-Abhaengigkeiten verfuegbar. Wenn stattdessen bewusst der lokal installierte Befehl `wakeonlan` verwendet werden soll, kann `wakeCommand` entsprechend angepasst werden.

Falls der Befehl nicht ueber den PATH gefunden wird, kann in `backend/config/server.json` ein voller Pfad gesetzt werden:

```json
{
  "wakeCommand": "\"C:\\\\Pfad\\\\zu\\\\wakeonlan.exe\" {mac}"
}
```

Wenn der Relay bewusst deaktiviert werden soll, kann `wakeRelayUrl` aus `backend/config/server.json` entfernt werden. Dann fuehrt das Backend wieder direkt `wakeCommand` aus.

Die Relay-Adresse kann alternativ per `WOL_RELAY_URL` ueberschrieben werden. Fuer den Raspberry Pi mit Host-Netzwerk bleibt `http://127.0.0.1:3011/wake` passend.

Das Dashboard ruft diesen Endpunkt auf:

```http
POST /api/server/start
```

Bei Erfolg antwortet das Backend:

```json
{
  "success": true,
  "message": "Startsignal wurde an Gandalf gesendet"
}
```

Der Start-Button ist nur aktiv, wenn Gandalf offline ist. Wenn Gandalf online ist, zeigt der Button `Gandalf läuft bereits`.

## Online-Status

Der Online-Status wird ueber die konfigurierte IP-Adresse geprueft:

```bash
ping 172.16.10.250
```

Wenn Gandalf ICMP/Ping blockiert, bleibt die Anzeige offline, obwohl der Rechner eventuell laeuft. Dann muss Ping auf Gandalf oder in der Firewall erlaubt werden.

## Dienst-Links

Die Dienst-Kacheln werden beim ersten Start aus `frontend/src/services/serviceTestData.ts` geladen. Danach koennen sie direkt im Dashboard hinzugefuegt, bearbeitet und geloescht werden. Die Anpassungen werden lokal im Browser gespeichert.

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

Diese Variable beeinflusst nur die Standard-Kacheln beim ersten Laden. Spaetere Aenderungen im Dashboard bleiben im lokalen Browser-Speicher erhalten.

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
