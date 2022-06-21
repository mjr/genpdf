import S3 from 'aws-sdk/clients/s3'
import { Endpoint } from 'aws-sdk/lib/core'
import chromium from 'chrome-aws-lambda'

const chromeExecPaths = {
  win32: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  linux: '/usr/bin/google-chrome',
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}

const isDev = process.env.NODE_ENV !== 'production'

export default async function generatePDF(req, res) {
  const { url } = req.query

  if (!url) {
    res.status(400).send('Missing URL parameter')
    return
  }

  try {
    const exePath = chromeExecPaths[process.platform]

    let options = null
    if (isDev) {
      options = {
        args: [],
        executablePath: exePath,
        headless: true
      }
    } else {
      options = {
        args: chromium.args,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      }
    }

    const browser = await chromium.puppeteer.launch({
      ...options,
      defaultViewport: chromium.defaultViewport,
      ignoreHTTPSErrors: true,
    })
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ printBackground: true, format: 'A4' })
    await browser.close()

    const spacesEndpoint = new Endpoint(process.env.PDF_AWS_S3_ENDPOINT_URL);
    const s3 = new S3({
      endpoint: spacesEndpoint,
      accessKeyId: process.env.PDF_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.PDF_AWS_SECRET_ACCESS_KEY
    })
    
    const filename = 'service-print/test-pdf-google'
    const fileContent = pdf
    
    const params = {
      ACL: 'public-read',
      Bucket: process.env.PDF_AWS_BUCKET_NAME,
      Key: `${filename}.pdf`,
      Body: fileContent
    }

    const data = await s3.upload(params).promise()
    res.send(`PDF generated successfully! URL: ${data.Location}`)
  } catch (err) {
    res.status(500).send(err.message)
  }
}
