const grpc = require('grpc')
const USERS_PATH = '../users/users.proto'
const UserService = grpc.load(USERS_PATH).users.UserService
const NOTES_PATH = '../notes/notes.proto'
const NoteService = grpc.load(NOTES_PATH).notes.NoteService
const userClient = new UserService('localhost:50052', grpc.credentials.createInsecure())
const noteClient = new NoteService('localhost:50051', grpc.credentials.createInsecure())

const Promise = require('bluebird')
const express = require('express')

const app = express()


const C = require('../../circuit_breaker_test/opossum')
const c1 = new C((args) => callServiceStreamReturnSync(noteClient, 'listStream', args))
c1.fallback((e) => [e.details, 'this is a fallback 1'])

const c3 = new C((args) => callServiceSyncReturnStream(noteClient, 'list', args))
c3.fallback((e) => [e.details, 'this is a fallback 2'])


const c2 = new C((args) => callServiceSyncReturnStream(userClient, 'list', args))
c2.fallback((e) => [e.details, 'this is a fallback 3'])

app.get('/users/:userId/notes/:noteId', async (req, res, next) => {
  try {

    const data = await Promise.all([c1.fire([+req.params.userId]), c2.fire([+req.params.userId]), c3.fire([+req.params.userId])])
    res.json(data.reduce((prev, curr) => prev.concat(curr), []))
  } catch (e) {
    console.error(e)
    res.status(e.status || 500).json(e.message)
  }
})




// var call = client.list();
// const num = Math.floor(Math.random() * 100)
// call.write(num)

// if stream duplex, do both sides events
// if stream only readable read all and dump data
// if stream writable write all and dump

function callServiceSyncReturnSync(service, method, args) {
  return new Promise((resolve, reject) => {
    service[method](...args, (err, response) => {
      if (err) reject(err)
      resolve(response)
    })
  })
}


function callServiceSyncReturnStream(service, method, args) {
  return new Promise((resolve, reject) => {
    let data = []
    const call = service[method](...args)
    call.on('data', (r) => {
      console.log(`data: `, r)
      data.push(r)
    })
    call.on('end', () => resolve(data))
    call.on('error', reject)
  })
}

// TODO: decide type of req/res interface by service[method].requestStream: bool and service[method].responseStream: bool
function callServiceStreamReturnSync(service, method, args) {
  return new Promise((resolve, reject) => {
    const call = service[method]((err, response) => {
      console.log(err, response)
      if (err) reject(err)
      resolve([response])
    })
    for (let i of args) {
      console.log(i)
      call.write(i)
    }
    call.end()
  })
}



app.listen(3000, () => console.log('running on port 3000'))