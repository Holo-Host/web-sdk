{ pkgs ? import ./pkgs.nix {} }:

with pkgs;

{
  web-sdk = stdenv.mkDerivation rec {
    name = "web-sdk";
    src = gitignoreSource ./.;

    buildInputs = [
      holochain-rust
      python

      dnaPackages.holofuel
    ];

    nativeBuildInputs = [
      nodejs
    ];

    preConfigure = ''
      cp -r ${npmToNix { inherit src; }} node_modules
      chmod -R +w node_modules
      patchShebangs node_modules
    '';

    buildPhase = ''
      npm run build
    '';

    installPhase = ''
      mkdir $out
      mv dist build node_modules $out
    '';

    fixupPhase = ''
      patchShebangs $out
    '';

    checkPhase = ''
      make test
    '';

    doCheck = true;
  };
}
