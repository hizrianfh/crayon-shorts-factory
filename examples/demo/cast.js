// OUTFITS for engine/crayon.js drawCharacter(). Keys are actor ids (or `outfit` names) used in story.js.
// Fields: coat, pants, boots, skin, hair, hat (null|cap|top|bonnet|helmet), hatColor, scarf, beard, apron, mitten, brow,
//         build (adult|kid|stout), ink (#2a2522 charcoal | #1f293d navy). Vibrant wax pigments, never black outfits.
export const OUTFITS = {
  worker: { coat: "#3f7fc4", pants: "#4b4f6b", boots: "#6b4426", skin: "#f3d2b0", hat: "cap", hatColor: "#e2453c", scarf: "#f2b632" },
  baker: { coat: "#f0e6d2", apron: "#e98a7a", pants: "#7a5a3a", boots: "#5a3b2a", skin: "#e8bf98", hair: "#4a3020", build: "stout", ink: "#1f293d" },
  kid: { coat: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", skin: "#c99067", hair: "#2a1d16", build: "kid" },
};
