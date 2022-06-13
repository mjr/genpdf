const express = require('express')
const puppeteer = require('puppeteer')

const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Tiny PDF Generator')
})

app.get('/pdf', async (req, res) => {
  const { url } = req.query

  if (!url) {
    return res.status(400).send('Missing URL parameter')
  }

  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({ printBackground: true, format: 'A4' })
    await browser.close()
    return res.contentType('application/pdf').send(pdf)
  } catch (err) {
    return res.status(500).send(err.message)
  }
})

app.listen(process.env.PORT || port, () => {
  console.log(`Listening on port ${port}`)
})

module.exports = app
