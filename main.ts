import { DOMParser } from "@b-fuze/deno-dom"

const url = "https://www.plattformplattform.ch/artists"

async function getAllLinks() {
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

  // Display links
  linkData.forEach(({ text, href }, index) => {
    const fullUrl = href.startsWith("http")
      ? href
      : href.startsWith("/")
        ? `https://www.plattformplattform.ch${href}`
        : `https://www.plattformplattform.ch/${href}`

    console.log(`${index + 1}. ${text || "(no text)"}`)
    console.log(`   ${fullUrl}\n`)
  })

  console.log(`Total: ${linkData.length} links`)

  return linkData
}

getAllLinks()
