import PDFMerger from 'pdf-merger-js'

async function getBuffer(url) {
  const response = await fetch(url)
  const buffer = await response.buffer()

  return buffer
}

export default async function mergePDFs(req, res) {
  const { urls } = req.query

  if (!urls) {
    res.status(400).send('Missing URLs parameter')
    return
  }

  try {
    const merger = new PDFMerger()

    for (const url of urls.split(',')) {
      merger.add(await getBuffer(url))
    }
    const mergedPdf = await merger.saveAsBuffer()

    res.setHeader('Content-Type', 'application/pdf')
    res.send(mergedPdf)
  } catch (err) {
    res.status(500).send(err.message)
  }
}
