import S3 from 'aws-sdk/clients/s3'
import { Endpoint } from 'aws-sdk/lib/core'
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

    const spacesEndpoint = new Endpoint(process.env.PDF_AWS_S3_ENDPOINT_URL);
    const s3 = new S3({
      endpoint: spacesEndpoint,
      accessKeyId: process.env.PDF_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.PDF_AWS_SECRET_ACCESS_KEY
    })
    
    const filename = 'service-print/test-merge-pdf-google'
    const fileContent = mergedPdf

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
