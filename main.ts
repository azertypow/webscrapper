import { DOMParser } from "@b-fuze/deno-dom"
import exit = Deno.exit;

const url = "https://www.plattformplattform.ch/artists"

async function getAllArtisteSubpageLinks() {
  console.log(`Fetching ${url}...`)

  const response = await fetch(url)
  const html = await response.text()

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
  const filteredLinkData = linkData.map(({ text, href }, index) => {
    const fullUrl = href.startsWith("http")
      ? href
      : href.startsWith("/")
        ? `https://www.plattformplattform.ch${href}`
        : `https://www.plattformplattform.ch/${href}`

    const isArtisteSubpageLink = fullUrl.startsWith("https://www.plattformplattform.ch/Artists/")

    if(!isArtisteSubpageLink) return null

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

for(const link of artistePageLinks) {
  console.log(link)
}
