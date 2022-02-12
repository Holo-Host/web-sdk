let
  config = import ./config.nix;
  holonixPath = builtins.fetchTarball "https://github.com/holochain/holonix/archive/${config.holonixRevision}.tar.gz";
  holonix = import (holonixPath) {
    inherit (config) holochainVersionId;
  };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  packages = with nixpkgs; [
    binaryen
    nodejs-16_x
  ];
}
