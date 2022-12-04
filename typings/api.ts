export type Route = '/index.html' | '/monitor.html'

export interface APIParams {
	eventName: string
	route: Route
	data: any
	requestTime: number
}
