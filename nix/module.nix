{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.services.watson-backend;
in {
  options.services.watson-backend = {
    enable = mkEnableOption "Watson backend service";

    package = mkOption {
      type = types.package;
      description = "Watson backend package to use";
    };

    rpcUrl = mkOption {
      type = types.str;
      description = "Ethereum RPC URL";
    };

    siweDomain = mkOption {
      type = types.str;
      description = "SIWE domain";
    };

    siweOrigin = mkOption {
      type = types.str;
      description = "SIWE origin URI";
    };

    siweChainId = mkOption {
      type = types.int;
      default = 1;
      description = "SIWE chain ID";
    };

    sqliteDsn = mkOption {
      type = types.str;
      default = "file:/var/lib/watson/app.db?_foreign_keys=on&_busy_timeout=5000";
      description = "SQLite database DSN";
    };

    address = mkOption {
      type = types.str;
      default = ":8080";
      description = "Server listen address";
    };

    cookieName = mkOption {
      type = types.str;
      default = "sid";
      description = "Session cookie name";
    };

    nonceTTL = mkOption {
      type = types.str;
      default = "5m";
      description = "Nonce TTL duration";
    };

    sessionTTL = mkOption {
      type = types.str;
      default = "15m";
      description = "Session TTL duration";
    };
  };

  config = mkIf cfg.enable {
    systemd.services.watson-backend = {
      description = "Watson Backend Service";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];

      serviceConfig = {
        ExecStart = "${cfg.package}/bin/server";
        Restart = "always";
        RestartSec = "10s";
        DynamicUser = true;
        StateDirectory = "watson";
        WorkingDirectory = "/var/lib/watson";
      };

      environment = {
        RPC_URL = cfg.rpcUrl;
        SIWE_DOMAIN = cfg.siweDomain;
        SIWE_ORIGIN = cfg.siweOrigin;
        SIWE_CHAIN_ID = toString cfg.siweChainId;
        SQLITE_DSN = cfg.sqliteDsn;
        ADDR = cfg.address;
        COOKIE_NAME = cfg.cookieName;
        NONCE_TTL = cfg.nonceTTL;
        SESSION_TTL = cfg.sessionTTL;
      };
    };
  };
}
