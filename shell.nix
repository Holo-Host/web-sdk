{ pkgs ? import ./pkgs.nix {} }:

with pkgs;

mkShell {
  inputsFrom = lib.attrValues (import ./. {
    inherit pkgs;
  });

  shellHook = ''
    mkdir -p dnas
    ln -fs ${dnaPackages.holofuel}/holofuel.dna.json ./dnas/
  '';
}
