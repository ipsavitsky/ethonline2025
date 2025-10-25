{
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
  let
    system = "x86_64-linux";
    pkgs = import nixpkgs {
      inherit system;
      config.allowUnfreePredicate = pkg: builtins.elem (pkgs.lib.getName pkg) [
        "claude-code"
      ];
    };
    buildGoModule = pkgs.buildGo125Module or pkgs.buildGoModule;
  in {
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        bun
        nil
        eslint
        vtsls
        tailwindcss-language-server
        claude-code
        go
        gopls
      ];
    };

    packages.${system}.watson-backend = buildGoModule {
      pname = "watson-backend";
      version = "0.1.0";
      src = ./backend;
      vendorHash = "sha256-kTNa+Nk2HppQvmV8BPZ6AP6/a7GwWDxu5peT7cVAhVA=";
      subPackages = [ "cmd/server" ];
      nativeBuildInputs = with pkgs; [ pkg-config ];
      buildInputs = with pkgs; [ sqlite ];
      proxyVendor = true;
      postInstall = ''
        mkdir -p $out/share/watson
        cp -r $src/internal/db/migrations $out/share/watson/
      '';
    };

    nixosModules.watson-backend = import ./nix/module.nix;
    nixosModules.default = self.nixosModules.watson-backend;
  };
}
