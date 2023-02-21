// play-with-server-sent-events/server.js
const http = require("http")

const host = "127.0.0.1"
const port = 8091

const requestListener = function (req, res) {
  if (req.url === '/random') {
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("connection", "keep-alive")
    res.setHeader("Content-Type", "text/event-stream")
    // CORS headers needed as 'localhost:8080' <> 'localhost:8082'
    res.setHeader("Access-Control-Allow-Origin", "*")

    setInterval(generateRandom, 2000)

    function generateRandom() {
      const random = Math.floor(Math.random() * 100) // An integer between 0 and 99.
      console.log(`[INFO] Random integer (0..99) generated: ${random}`)

      res.write(`data: ${JSON.stringify({ random: random })}\n\n`)
    }
  }
  else {
    res.statusCode = 404
    res.end("resource does not exist")
  }
}

const server = http.createServer(requestListener)

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`)
})
