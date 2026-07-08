#!/usr/bin/env python3
import json
import os
import re
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict


DEFAULT_RELAY_HOST = "127.0.0.1"
DEFAULT_RELAY_PORT = 3011
DEFAULT_WAKE_PORT = 9
MAC_ADDRESS_PATTERN = re.compile(r"^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$", re.IGNORECASE)
PROJECT_ROOT = Path(__file__).resolve().parents[1]
SERVER_CONFIG_PATH = PROJECT_ROOT / "backend" / "config" / "server.json"


def load_server_config() -> Dict[str, Any]:
    with SERVER_CONFIG_PATH.open("r", encoding="utf-8") as config_file:
        config = json.load(config_file)

    required_fields = ("serverName", "ip", "mac", "refreshInterval")
    missing_fields = [field for field in required_fields if not str(config.get(field, "")).strip()]

    if missing_fields:
        raise ValueError(f"Missing server config field(s): {', '.join(missing_fields)}")

    if not MAC_ADDRESS_PATTERN.match(config["mac"]):
        raise ValueError("Invalid MAC address in server config")

    return config


def get_relay_host() -> str:
    return os.environ.get("WOL_RELAY_HOST", DEFAULT_RELAY_HOST).strip() or DEFAULT_RELAY_HOST


def get_relay_port() -> int:
    relay_port = int(os.environ.get("WOL_RELAY_PORT", DEFAULT_RELAY_PORT))

    if relay_port <= 0 or relay_port > 65535:
        raise ValueError("Invalid WOL_RELAY_PORT")

    return relay_port


def get_default_broadcast_address(ip_address: str) -> str:
    octets = ip_address.split(".")

    if len(octets) != 4 or not all(octet.isdigit() for octet in octets):
        return "255.255.255.255"

    return f"{octets[0]}.{octets[1]}.{octets[2]}.255"


def get_broadcast_address(config: Dict[str, Any]) -> str:
    return str(config.get("broadcastAddress") or get_default_broadcast_address(str(config["ip"])))


def get_wake_port(config: Dict[str, Any]) -> int:
    wake_port = int(config.get("wakePort", DEFAULT_WAKE_PORT))

    if wake_port <= 0 or wake_port > 65535:
        raise ValueError("Invalid wakePort in server config")

    return wake_port


def normalize_mac_address(mac_address: str) -> str:
    return mac_address.strip().lower().replace("-", ":")


def create_magic_packet(mac_address: str) -> bytes:
    normalized_mac_address = normalize_mac_address(mac_address).replace(":", "")
    mac_bytes = bytes.fromhex(normalized_mac_address)

    return b"\xff" * 6 + mac_bytes * 16


def send_magic_packet(config: Dict[str, Any]) -> None:
    broadcast_address = get_broadcast_address(config)
    wake_port = get_wake_port(config)
    magic_packet = create_magic_packet(str(config["mac"]))

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as udp_socket:
        udp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        udp_socket.sendto(magic_packet, (broadcast_address, wake_port))


def read_json_body(handler: BaseHTTPRequestHandler) -> Dict[str, Any]:
    content_length = int(handler.headers.get("content-length", "0"))

    if content_length == 0:
        return {}

    raw_body = handler.rfile.read(content_length)

    try:
        request_body = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError("Relay request does not contain valid JSON") from error

    if not isinstance(request_body, dict):
        raise ValueError("Relay request JSON body must be an object")

    return request_body


def assert_optional_string_matches(
    request_body: Dict[str, Any], field_name: str, expected_value: str
) -> None:
    value = request_body.get(field_name)

    if value is None:
        return

    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Invalid relay request field: {field_name}")

    if value != expected_value:
        raise ValueError(f"Relay request field does not match config: {field_name}")


def assert_request_matches_config(
    request_body: Dict[str, Any], config: Dict[str, Any]
) -> None:
    mac_address = request_body.get("mac")

    if mac_address is not None:
        if not isinstance(mac_address, str) or not mac_address.strip():
            raise ValueError("Invalid relay request field: mac")

        if normalize_mac_address(mac_address) != normalize_mac_address(str(config["mac"])):
            raise ValueError("Relay request field does not match config: mac")

    assert_optional_string_matches(request_body, "serverIp", str(config["ip"]))
    assert_optional_string_matches(request_body, "serverName", str(config["serverName"]))
    assert_optional_string_matches(request_body, "broadcastAddress", get_broadcast_address(config))

    wake_port = request_body.get("wakePort")

    if wake_port is not None:
        if not isinstance(wake_port, int):
            raise ValueError("Invalid relay request field: wakePort")

        if wake_port != get_wake_port(config):
            raise ValueError("Relay request field does not match config: wakePort")


def write_json(handler: BaseHTTPRequestHandler, status_code: int, body: Dict[str, Any]) -> None:
    response_body = json.dumps(body).encode("utf-8")

    handler.send_response(status_code)
    handler.send_header("content-type", "application/json")
    handler.send_header("content-length", str(len(response_body)))
    handler.end_headers()
    handler.wfile.write(response_body)


class WakeOnLanRelayHandler(BaseHTTPRequestHandler):
    server_version = "WakeOnLanRelay/1.0"

    def do_GET(self) -> None:
        if self.path != "/health":
            write_json(self, 404, {"success": False, "message": "Route not found"})
            return

        write_json(
            self,
            200,
            {
                "serverName": self.server.server_config["serverName"],
                "status": "ok",
            },
        )

    def do_POST(self) -> None:
        if self.path != "/wake":
            write_json(self, 404, {"success": False, "message": "Route not found"})
            return

        try:
            request_body = read_json_body(self)
            assert_request_matches_config(request_body, self.server.server_config)
            send_magic_packet(self.server.server_config)
        except ValueError as error:
            write_json(self, 400, {"success": False, "message": str(error)})
            return
        except OSError as error:
            write_json(
                self,
                500,
                {"success": False, "message": f"Wake-on-LAN packet could not be sent: {error}"},
            )
            return

        write_json(
            self,
            200,
            {"success": True, "message": "Startsignal wurde an Gandalf gesendet"},
        )

    def log_message(self, format: str, *args: Any) -> None:
        print(f"{self.address_string()} - {format % args}")


class WakeOnLanRelayServer(ThreadingHTTPServer):
    server_config: Dict[str, Any]


def main() -> None:
    server_config = load_server_config()
    relay_host = get_relay_host()
    relay_port = get_relay_port()
    relay_server = WakeOnLanRelayServer((relay_host, relay_port), WakeOnLanRelayHandler)
    relay_server.server_config = server_config

    print(
        f"Wake-on-LAN relay listening on http://{relay_host}:{relay_port} "
        f"for {server_config['serverName']} ({server_config['ip']})"
    )
    relay_server.serve_forever()


if __name__ == "__main__":
    main()
