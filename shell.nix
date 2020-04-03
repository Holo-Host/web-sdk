{ pkgs ? import ./pkgs.nix {} }:

with pkgs;

mkShell {
  inputsFrom = lib.attrValues (import ./. {
    inherit pkgs;
  });
}
