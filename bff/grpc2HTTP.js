class Grpc2HTTPBuilder {
  constructor() {
    this.options = {}
    this.method = null
    this.class = null
  }

  withClass(c) {
    this.class = c
    return this
  }

  withMethod(method) {
    this.method = method
    return this
  }

  build() {
    const serviceMethod = this.class[this.method]
    const isRequestStream = serviceMethod.requestStream
    const isResponseStream = serviceMethod.responseStream
    if (isRequestStream && isResponseStream) {
      return (args) => {
        return this.callServiceStreamReturnStream(this.class, this.method, args)
      }
    } else if (isRequestStream && !isResponseStream) {
      return (args) => {
        return this.callServiceStreamReturnSync(this.class, this.method, args)
      }
    } else if (!isRequestStream && isResponseStream) {
      return (args) => {
        return this.callServiceSyncReturnStream(this.class, this.method, args)
      }
    } else if (!isRequestStream && !isResponseStream) {
      return (args) => {
        return this.callServiceSyncReturnSync(this.class, this.method, args)
      }
    }
  }

  callServiceSyncReturnSync(service, method, args) {
    return new Promise((resolve, reject) => {
      service[method](...args, (err, response) => {
        if (err) reject(err)
        resolve(response)
      })
    })
  }

  // collects buffer until end because of http 1.1
  // TODO check sending as chunked each chunk
  callServiceSyncReturnStream(service, method, args) {
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

  callServiceStreamReturnStream(service, method, args) {
    return new Promise((resolve, reject) => {
      let data = []
      let i = 0
      const call = service[method]()
      call.write(args[i])
      i++
      call.on('data', (r) => {
        console.log(`data ${i}: `, r)
        data.push(r)
        console.log(`args: i ${i}`, args)
        if (!args[i]) {
          console.log('calling end')
          call.end()
        } else {
          call.write(args[i])
        }
        i++
      })
      call.on('end', () => resolve(data))
      call.on('error', reject)
    })
  }

  callServiceStreamReturnSync(service, method, args) {
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
}

module.exports = Grpc2HTTPBuilder