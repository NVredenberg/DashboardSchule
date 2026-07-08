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

Die Container laufen im Host-Netzwerk des Raspberry Pi. Dadurch wird das Wake-on-LAN-Paket direkt ueber das physische Netzwerk-Interface gesendet, statt im Docker-Bridge-Netz zu verschwinden.

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
  "wakePort": 9
}
```

Die MAC-Adresse wird fuer Wake-on-LAN verwendet. Die IP-Adresse beschreibt den Zielserver Gandalf. `broadcastAddress` und `wakePort` steuern, wohin das Startsignal gesendet wird. Wenn keine Broadcast-Adresse gesetzt ist, leitet das Backend sie aus der Gandalf-IP als `/24`-Adresse ab.

## Wake-on-LAN

Das Backend startet Gandalf mit dem vom Projekt mitgelieferten Befehl:

```bash
wake -a 172.16.10.255 -p 9 b4:2e:99:47:f3:7f
```

Der Befehl `wake` kommt aus der Backend-Abhaengigkeit `wake_on_lan` und ist damit auch im Backend-Container verfuegbar. Wenn stattdessen bewusst der lokal installierte Befehl `wakeonlan` verwendet werden soll, kann `wakeCommand` entsprechend angepasst werden.

Falls der Befehl nicht ueber den PATH gefunden wird, kann in `backend/config/server.json` ein voller Pfad gesetzt werden:

```json
{
  "wakeCommand": "\"C:\\\\Pfad\\\\zu\\\\wakeonlan.exe\" {mac}"
}
```

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
