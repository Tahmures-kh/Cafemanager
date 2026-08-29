import sharp from "sharp";
import path from "node:path";

const srcDir = "c:/Projects/staff-management-saas/pics";
const outDir = "c:/Projects/staff-management-saas/public/wallpapers";

const selection = [
    "5228931540115464098.jpg",
    "5228931540115464100.jpg",
    "5228931540115464126.jpg",
    "5228931540115464127.jpg",
    "5228931540115464129.jpg",
    "5228931540115464139.jpg",
    "5228931540115464140.jpg",
    "5228931540115464144.jpg",
    "5228931540115464145.jpg",
    "5228931540115464154.jpg",
    "5228931540115464157.jpg",
];

async function run() {
    for (let i = 0; i < selection.length; i++) {
        const inputPath = path.join(srcDir, selection[i]);
        const outputPath = path.join(outDir, `wallpaper-${String(i + 1).padStart(2, "0")}.webp`);
        await sharp(inputPath)
            .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
            .blur(14)
            .modulate({ saturation: 0.9, brightness: 1.02 })
            .webp({ quality: 62 })
            .toFile(outputPath);
        console.log("wrote", outputPath);
    }
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
