# Let's Play with Server-Sent Events (SSE)

> **_Note:_** This repository has an WebSocket (WS) companion, available at <https://github.com/patricekrakow/play-with-websocket>, showing the exact same example implemented with WS instead of SSE :-)

## Abstract

This repository contains the **simplest** running example illustrating how Server-Sent Events (SSE) works :-) If you have an idea for an even simpler example, please let me know!

A server (written in Node.js) **pushes** a random integer between 0 and 99 generated every 2 seconds to all connected clients.

## Server Implementation

The random integer between 0 and 99 is generated using

```javascript
const random = Math.floor(Math.random() * 100)
```

The server generates a new random integer every 2 seconds using _timing events_ as follow

```javascript
setInterval(generateRandom, 2000)

function generateRandom() {

}
```

The server is a classic HTTP server on port `8091` that do **not** close the connection

```javascript
const http = require("http")

const host = "127.0.0.1"
const port = 8091

const requestListener = function (req, res) {
  if (req.url === '/random') {
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("connection", "keep-alive")
    // do not close the connection with a `res.end()`
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
```

The content type of the response header MUST be `text/event-stream`

```javascript
res.setHeader("Content-Type", "text/event-stream")
```

We need CORS headers as the `index.html` will be served (see below) on `127.0.0.1:8081` while the SSE server is running `127.0.0.1:8091`

```javascript
res.setHeader("Access-Control-Allow-Origin", "*")
```

Finally, within the `generateRandom` function, the generated random integer is sent to all connected clients using

```javascript
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
```

The response should contain a `data` field followed by the message you’d like to send and should always be terminated by a double carriage return such as follows:

```text
data: example message\n\n
```

The response can contain multiple messages, each message being the value of a specific `data` field terminated by a single carriage return, except for the last message that should be terminated by a double carriage return

```text
data: message 1\n
data: message 2\n
data: message 3\n\n
```

You can see that we are sending the random integer within a simple JSON structure

```json
{
  "random": 95
}
```

that will need to parsed client-side.

You can run the server using

```text
node server/server.js
```

## Client Implementation

We will use a super simple `index.html` HTML page with the following skeleton:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Random</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <style>

    </style>
  </head>
  <body>
    <table>
      <tr>
        <td id="text">Hello!</td>
      </tr>
    </table>
    <p id="info">...</p>
    <script>

    </script>
  </body>
</html>
```

The random integer will shown within the `<td>` element with the `id="text"` overwriting the `Hello!` text. There is also a `<p>` element with the `id="info"` in which we will show the address of the WebSocker server.

There is a simple embedded CSS in order to make things nicer, according to my limited knowledge of CSS :-) And, I will not dare to explain this CSS; if you can simplify it and/or make it more clear, do not hesitate!

We will serve the `index.html` file with `http-server` that can be installed using

```text
npm install -g http-server
```

and we will use the port `8081`

```text
http-server www --port 8081
```

The address of the WebSocket will constructed within the `index.html` using

```javascript
const ssePort = 8091
const url = `http://${location.hostname}:${ssePort}/random`
```

Then, the connection with the Server-Sent Events (SSE) server is established using

```javascript
const sseSource = new EventSource(url)
```

When connected the `<td>` element with the `id="text"` is overwritten with

```javascript
sseSource.onmessage = function (event) {
  const value = JSON.parse(event.data).random
  text.innerHTML = value
  console.log(event.data)
}
```

where our simple JSON structure is parsed

```json
{
  "random": 95
}
```
