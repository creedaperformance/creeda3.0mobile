const fs = require('node:fs')
const path = require('node:path')
const { withDangerousMod } = require('@expo/config-plugins')

/**
 * Copies the MediaPipe Pose Landmarker .task model from the project's
 * `assets/models/` folder into `android/app/src/main/assets/` during
 * `expo prebuild`. The library expects to find the file via
 * AssetManager.open(), so plain file copy is enough.
 *
 * Run `bash scripts/setup-mediapipe-models.sh` once before
 * `npx expo prebuild --clean` so the file exists locally.
 */
module.exports = function withMediaPipeModels(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const sourceDir = path.join(config.modRequest.projectRoot, 'assets', 'models')
      const targetDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'assets'
      )

      if (!fs.existsSync(sourceDir)) {
        console.warn(
          '[with-mediapipe-models] No assets/models/ folder. Run scripts/setup-mediapipe-models.sh first.'
        )
        return config
      }

      fs.mkdirSync(targetDir, { recursive: true })
      const files = fs.readdirSync(sourceDir).filter((name) => name.endsWith('.task'))
      if (files.length === 0) {
        console.warn(
          '[with-mediapipe-models] No .task files in assets/models/. Run scripts/setup-mediapipe-models.sh.'
        )
        return config
      }

      for (const file of files) {
        const src = path.join(sourceDir, file)
        const dest = path.join(targetDir, file)
        fs.copyFileSync(src, dest)
        const sizeMb = (fs.statSync(dest).size / 1_000_000).toFixed(2)
        console.log(`[with-mediapipe-models] Copied ${file} (${sizeMb} MB) → android assets`)
      }

      return config
    },
  ])
}
