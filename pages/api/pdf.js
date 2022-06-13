import chromium from 'chrome-aws-lambda'

export default async function generatePDF(req, res) {
  const { url } = req.query

  if (!url) {
    return res.status(400).send('Missing URL parameter')
  }

  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ printBackground: true, format: 'A4' })
    await browser.close()
    return res.contentType('application/pdf').send(pdf)
  } catch (err) {
    return res.status(500).send(err.message)
  }
}