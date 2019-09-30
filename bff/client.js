const grpc = require('grpc')
const Promise = require('bluebird')
const express = require('express')
const app = express()


const GrpcBuilder = require('./grpcBuilder')
const Grpc2HTTP = require('./grpc2HTTP')
const CircuitBreaker = require('../../circuit_breaker_test/opossum')
const CircuitBreakerPrometheus = require('../../circuit_breaker_test/opossum-prometheus')
const interceptor = require('./interceptor')

const userClient = new GrpcBuilder(grpc)
  .withAddress('localhost:50052')
  .withCredentials(new grpc.credentials.createInsecure())
  .withPackageName('users')
  .withServiceName('UserService')
  .withProtoPath('../users/users.proto')
  .withInterceptor(interceptor)
  .build()

const noteClient = new GrpcBuilder(grpc)
  .withAddress('localhost:50051')
  .withCredentials(new grpc.credentials.createInsecure())
  .withPackageName('notes')
  .withServiceName('NoteService')
  .withProtoPath('../notes/notes.proto')
  .withInterceptor(interceptor)
  .build()

const listStream = new Grpc2HTTP()
  .withClass(noteClient)
  .withMethod('listStream')
  .build()

const list = new Grpc2HTTP()
  .withClass(noteClient)
  .withMethod('list')
  .build()

const usersList = new Grpc2HTTP()
  .withClass(userClient)
  .withMethod('list')
  .build()

const usersListSync = new Grpc2HTTP()
  .withClass(userClient)
  .withMethod('listSync')
  .build()

const usersListStream = new Grpc2HTTP()
  .withClass(userClient)
  .withMethod('listStream')
  .build()


const c1 = new CircuitBreaker(usersListStream, {
  name: 'test'
})
const c2 = new CircuitBreaker(listStream, {
  name: 'test2'
})

c1.fallback(e => 'fallback1')
c2.fallback(e => 'fallback2')
const cp = new CircuitBreakerPrometheus([c1, c2])

app.get('/users/:userId/notes/:noteId', async (req, res, next) => {
  try {
    const data = await c1.fire([1])
    // const data = await Promise.all([c4.fire([+req.params.userId]), c1.fire([+req.params.userId]), c2.fire([+req.params.userId]), c3.fire([+req.params.userId])])
    res.json(data)
  } catch (e) {
    console.error(e)
    res.status(e.status || 500).json(e.message)
  }
})

app.get('/metrics', (req, res, next) => {
  res.end(cp.metrics)
})



app.listen(3000, () => console.log('running on port 3000'))