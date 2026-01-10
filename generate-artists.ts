const imagesDir = "./images";
const templateFile = "./artist.en.txt";

// Read the template file
const templateContent = await Deno.readTextFile(templateFile);

// Get all directories in images folder
const entries = [];
for await (const entry of Deno.readDir(imagesDir)) {
  if (entry.isDirectory && !entry.name.startsWith(".")) {
    entries.push(entry.name);
  }
}

console.log(`Found ${entries.length} artist directories\n`);

for (const artistName of entries) {
  const artistDir = `${imagesDir}/${artistName}`;
  console.log(`Processing: ${artistName}`);

  // Get all image files in the directory
  const images: string[] = [];
  try {
    for await (const file of Deno.readDir(artistDir)) {
      // Only process .jpg, .jpeg, .png files (not .txt files)
      if (
        file.isFile &&
        (file.name.endsWith(".jpg") ||
          file.name.endsWith(".jpeg") ||
          file.name.endsWith(".png"))
      ) {
        images.push(file.name);
      }
    }
  } catch (error) {
    console.error(`  Error reading directory: ${error}`);
    continue;
  }

  console.log(`  Found ${images.length} images`);

  // Read UUIDs from .txt files
  const imageUuids: string[] = [];
  for (const imageName of images) {
    const txtFile = `${artistDir}/${imageName}.txt`;
    try {
      const txtContent = await Deno.readTextFile(txtFile);
      // Extract UUID from the file (format: "Uuid: qJmYXNxA6vI2i2tD")
      const uuidMatch = txtContent.match(/Uuid:\s*(\S+)/);
      if (uuidMatch) {
        imageUuids.push(uuidMatch[1]);
      }
    } catch (error) {
      console.error(`  Warning: Could not read UUID for ${imageName}`);
    }
  }

  console.log(`  Extracted ${imageUuids.length} UUIDs`);

  // Build the Gallery section
  let gallerySection = "";
  for (const uuid of imageUuids) {
    gallerySection += `-
  image:
    - file://${uuid}
  caption:
`;
  }

  // Replace the template content
  let newContent = templateContent;

  // Replace Title
  newContent = newContent.replace(/Title: .+/, `Title: ${artistName}`);

  // Replace Fullname
  newContent = newContent.replace(/Fullname: .+/, `Fullname: ${artistName}`);

  // Extract lastname (last word of the name)
  const nameParts = artistName.split(" ");
  const lastname = nameParts[nameParts.length - 1];
  newContent = newContent.replace(/Lastname: .+/, `Lastname: ${lastname}`);

  // Replace Gallery section
  const galleryRegex = /Gallery:\n\n[\s\S]*?----/;
  newContent = newContent.replace(
    galleryRegex,
    `Gallery:\n\n${gallerySection}----`,
  );

  // Generate a new UUID for the artist
  const artistUuid = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  newContent = newContent.replace(/Uuid: .+/, `Uuid: ${artistUuid}`);

  // Write the file
  const outputFile = `${artistDir}/artist.de.txt`;
  await Deno.writeTextFile(outputFile, newContent);
  console.log(`  ✓ Created ${outputFile}\n`);
}

console.log("Done!");
