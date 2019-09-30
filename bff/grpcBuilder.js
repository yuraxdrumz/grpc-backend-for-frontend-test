class GrpcServiceBuilder {
  constructor(grpc) {
    this.grpc = grpc
    this.credentials = null
    this.proto = null
    this.addr = null
    this.packageName = null
    this.serviceName = null
    this.circuitBreakers = []
    this.interceptors = []
  }
  withPackageName(name) {
    this.packageName = name
    return this
  }
  withServiceName(name) {
    this.serviceName = name
    return this
  }
  withCredentials(credentials) {
    this.credentials = credentials
    return this
  }
  withProtoPath(protoPath) {
    this.protoPath = protoPath
    return this
  }
  withAddress(addr) {
    this.addr = addr
    return this
  }
  withInterceptor(interceptor) {
    this.interceptors.push(interceptor)
    return this
  }
  build() {
    const Service = this.grpc.load(this.protoPath)[this.packageName][this.serviceName]
    const service = new Service(this.addr, this.credentials)
    service.$interceptors.concat(this.interceptors)
    for (let interceptor of this.interceptors) {
      service.$interceptors.push(interceptor)
    }
    return service
  }
}

module.exports = GrpcServiceBuilder