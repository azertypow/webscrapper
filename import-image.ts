/**
 * Script pour automatiser l'importation d'images dans Kirby CMS
 * Génère automatiquement les UUIDs et crée les fichiers de métadonnées
 */

interface ImageImportOptions {
  url: string;
  targetDir: string;
  filename?: string;
}

interface ImageImportResult {
  uuid: string;
  filename: string;
  path: string;
  uuidReference: string;
}

/**
 * Génère un UUID alphanumérique de 16 caractères (compatible Kirby)
 */
function generateKirbyUuid(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let uuid = '';

  for (let i = 0; i < 16; i++) {
    uuid += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return uuid;
}

/**
 * Télécharge une image depuis une URL
 */
async function downloadImage(url: string): Promise<Uint8Array> {
  console.log(`📥 Téléchargement depuis: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Détermine l'extension du fichier depuis l'URL ou le content-type
 */
function getFileExtension(url: string, contentType?: string): string {
  // Essayer d'abord depuis l'URL
  const urlMatch = url.match(/\.([a-z0-9]+)(\?|$)/i);
  if (urlMatch) {
    return urlMatch[1].toLowerCase();
  }

  // Sinon depuis le content-type
  if (contentType) {
    const typeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };

    return typeMap[contentType] || 'jpg';
  }

  return 'jpg';
}

/**
 * Crée le fichier de métadonnées Kirby (.txt) avec l'UUID
 */
async function createKirbyMetadata(
  metadataPath: string,
  uuid: string
): Promise<void> {
  const content = `Uuid: ${uuid}

----

Template: image
`;

  await Deno.writeTextFile(metadataPath, content);
  console.log(`📝 Fichier de métadonnées créé: ${metadataPath}`);
}

/**
 * Importe une image et crée les fichiers nécessaires pour Kirby
 */
export async function importImage(
  options: ImageImportOptions
): Promise<ImageImportResult> {
  const { url, targetDir, filename } = options;

  // Générer un UUID unique
  const uuid = generateKirbyUuid();

  // Télécharger l'image
  const imageData = await downloadImage(url);

  // Déterminer le nom du fichier
  const response = await fetch(url, { method: 'HEAD' });
  const contentType = response.headers.get('content-type') || undefined;
  const extension = getFileExtension(url, contentType);

  const finalFilename = filename || `image-${Date.now()}.${extension}`;
  const imagePath = `${targetDir}/${finalFilename}`;
  const metadataPath = `${imagePath}.en.txt`;

  // Créer le dossier cible s'il n'existe pas
  try {
    await Deno.mkdir(targetDir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }

  // Sauvegarder l'image
  await Deno.writeFile(imagePath, imageData);
  console.log(`✅ Image sauvegardée: ${imagePath}`);

  // Créer le fichier de métadonnées
  await createKirbyMetadata(metadataPath, uuid);

  return {
    uuid,
    filename: finalFilename,
    path: imagePath,
    uuidReference: `file://${uuid}`,
  };
}
