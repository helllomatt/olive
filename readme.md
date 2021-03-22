# Olive

Web server written in Node.js. As fast as Fastify, with the ability to be extended
using Express modules that already exist, without having to modify them at all.

Olive uses async/await to follow routes to their callbacks, including all middleware - even the ones that use Express modules. Also, an event system to have a subscriber-like system.

The only thing I didn't pay attention to when writing this library was the memory usage.

---

> There is no documentation on how to use this library as it was intended to be a test/learning experience on how to write something like this. Mostly focusing on the fastest way to route a path and create a faster version of Express.js

>_there is a lot of not-invented-here stuff in this library_


## Basic Setup

The default port/host is 127.0.0.1:8000

```
npm i https://github.com/helllomatt/olive -s
```

index.js:
```js
'use strict'

const path = require('path')
const olive = require('olive')

olive.server.get('/', (req, res) => {
    res.json({ hello: 'world', session: req.session })
})

olive.http().listen()
```

```
$ node index.js
Server running on localhost:8000
```