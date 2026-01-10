import {DOMParser} from "@b-fuze/deno-dom"
import {importImage} from "./import-image.ts";
import exit = Deno.exit;


async function getAllArtisteSubpageLinks() {

  const bytes = Deno.readFileSync('./index.html');

// Convertir les octets en texte
  const html = new TextDecoder().decode(bytes);

  const doc = new DOMParser().parseFromString(html, "text/html")

  if (!doc) {
    console.error("Failed to parse HTML")
    return
  }

  const links = doc.querySelectorAll("a")

  console.log(`\nFound ${links.length} links:\n`)

  const linkData: Array<{ text: string, href: string }> = []

  links.forEach((link) => {
    const href = link.getAttribute("href") || ""
    const text = link.textContent.trim()

    if (href) {
      linkData.push({ text, href })
    }
  })

  // Trier les liens
  const filteredLinkData = linkData
    .filter(({ href }) => {
      const fullUrl = href.startsWith("http")
        ? href
        : href.startsWith("/")
          ? `https://www.plattformplattform.ch${href}`
          : `https://www.plattformplattform.ch/${href}`

      const isArtisteSubpageLink = fullUrl.startsWith("https://www.plattformplattform.ch/Artists/")

      return isArtisteSubpageLink
    })
    .map(({text, href}, index) => {
      const fullUrl = href.startsWith("http")
        ? href
        : href.startsWith("/")
          ? `https://www.plattformplattform.ch${href}`
          : `https://www.plattformplattform.ch/${href}`

      console.log(`${index + 1}. ${text || "(no text)"}`)
      console.log(`   ${fullUrl}\n`)

      return {
        text,
        href: fullUrl
      }
    })

  console.log(`Total: ${linkData.length} links`)

  return filteredLinkData
}

const artistePageLinks = await getAllArtisteSubpageLinks()

if(!artistePageLinks) {
  console.error("Failed to fetch links")
  exit()
}

// Créer un tableau pour stocker les informations des artistes
const artistsData: Array<{
  index: number,
  folderName: string,
  originalName: string,
  url: string
}> = []

for(let i = 0; i < artistePageLinks.length; i++) {
  const link = artistePageLinks[i]
  const response = await fetch(link.href)
  const html = await response.text()
  const doc = new DOMParser().parseFromString(html, "text/html")

  const images = doc.querySelectorAll('img')

  const folderName = removeAccents(link.text).toLowerCase().replace(/ /g, '-')
  const folderNameWithIndex = `${i}_${folderName}`

  // Ajouter les informations de l'artiste au tableau
  artistsData.push({
    index: i,
    folderName: folderNameWithIndex,
    originalName: link.text,
    url: link.href
  })

  images.forEach(image => {
    const imageSrc = image.getAttribute('src')

    if(!imageSrc) return

    const autorisedImageExtention = imageSrc.endsWith('.jpg') || imageSrc.endsWith('.jpeg') || imageSrc.endsWith('.png')

    if( !autorisedImageExtention ) return

    const imageURL = new URL(imageSrc, link.href)

    importImage({
      url: imageURL.href,
      filename: `${getFileNameWithoutExtension(imageURL.href)}.jpg`,
      targetDir: `./images/${folderNameWithIndex}`,
    }).then(
      () => console.log(`Imported ${imageURL.href}`),
      (error) => console.error(`Failed to import ${imageURL.href}: ${error}`)
    )
  })

}

// Sauvegarder les données dans un fichier JSON
await Deno.writeTextFile(
  './artists-data.json',
  JSON.stringify(artistsData, null, 2)
)

console.log('\n✅ Artists data saved to artists-data.json')


function getFileNameWithoutExtension(url: string): string {
  const lastSlashIndex = url.lastIndexOf('/');
  const lastDotIndex = url.lastIndexOf('.');

  if (lastSlashIndex === -1) return '';

  const start = lastSlashIndex + 1;
  const end = lastDotIndex !== -1 && lastDotIndex > lastSlashIndex
    ? lastDotIndex
    : url.length;

  return url.substring(start, end);
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

