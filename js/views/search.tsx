import * as React from 'react'
import { Link, browserHistory } from 'react-router'
import { StationStore } from '../stores/stationStore.ts'
import { UiStore } from '../stores/uiStore.ts'
import SearchSwitch from './searchswitch.tsx'

declare function require(name: string): any;
let request = require('reqwest')
let leaflet = require('react-leaflet')
let Map = leaflet.Map
let Marker = leaflet.Marker
let Popup = leaflet.Popup
let TileLayer = leaflet.TileLayer
let ZoomControl = leaflet.ZoomControl
let Icon = require('leaflet').icon
let Circle = leaflet.Circle
let CircleMarker = leaflet.CircleMarker

interface StopItem {
  stop_id: string,
  stop_name: string,
  stop_lat: number,
  stop_lng: number
}

interface IAppProps extends React.Props<Search> {}

interface IAppState {
  station?: string,
  stops?: Array<StopItem>,
  position?: Array<number>,
  currentPosition?: Array<number>,
  back?: boolean,
  accuracy?: number,
  error?: string
}

const busIcon = Icon({
  iconUrl: '/icons/bus-icon.png',
  iconRetinaUrl: '/icons/bus-icon-2x.png',
  iconSize: [25, 41]
})
const trainIcon = Icon({
  iconUrl: '/icons/train-icon.png',
  iconRetinaUrl: '/icons/train-icon-2x.png',
  iconSize: [30, 49]
})
const ferryIcon = Icon({
  iconUrl: '/icons/ferry-icon.png',
  iconRetinaUrl: '/icons/ferry-icon-2x.png',
  iconSize: [30, 49]
})

// whatever the public can use doesn't really bother me
const token = '?access_token=pk.eyJ1IjoiY29uc2luZG8iLCJhIjoiY2lza3ozcmd5MDZrejJ6b2M0YmR5dHBqdiJ9.Aeru3ssdT8poPZPdN2eBtg'
let dataRequest = undefined
let geoID = undefined

class Search extends React.Component<IAppProps, IAppState> {
  constructor(props) {
    super(props)
    this.state = {
      station: '',
      stops: [],
      position: [-36.844229, 174.767823],
      currentPosition: [0,0],
      back: false,
      accuracy: 0,
      error: ''
    }
  
    this.watchPosition = this.watchPosition.bind(this)
    this.getAndSetCurrentPosition = this.getAndSetCurrentPosition.bind(this)
    this.setCurrentPosition = this.setCurrentPosition.bind(this)
    this.currentLocateButton = this.currentLocateButton.bind(this)
    this.triggerChange = this.triggerChange.bind(this)
    this.triggerKeyUp = this.triggerKeyUp.bind(this)
    this.triggerSearch = this.triggerSearch.bind(this)
    this.moveEnd = this.moveEnd.bind(this)
    this.triggerBack = this.triggerBack.bind(this)

    UiStore.bind('goingBack', this.triggerBack)
  }
  public watchPosition() {
    geoID = navigator.geolocation.watchPosition((position) => {
      if (this.state.currentPosition[0] === 0){
        this.setCurrentPosition(position)
        this.getAndSetCurrentPosition()
      } else {
        this.setCurrentPosition(position)
      }   
    }, (error) => {
      //will remove for release
      this.setState({
        error: error.message
      } as IAppState)
    }, {
      enableHighAccuracy: true,
      timeout: 5000
    })
  }
  public getAndSetCurrentPosition() {
    this.setState({
      position: [this.state.currentPosition[0] + Math.random()/100000, this.state.currentPosition[1] + Math.random()/100000]
    } as IAppState)
  }

  public setCurrentPosition(position) {
    //console.log('getting new position')
    //console.log(position.coords.accuracy)
    this.setState({
      currentPosition: [position.coords.latitude, position.coords.longitude],
      accuracy: position.coords.accuracy
    } as IAppState)
  }
  public currentLocateButton() {
    if (this.state.error === '') {
      this.getAndSetCurrentPosition()
    } else {
      alert(this.state.error)
    }
  }
  // hack to get it to work with typescript
  public refs: {
    [string: string]: any;
    map: any;
  }
  public componentDidMount() {
    this.getData(this.state.position[0], this.state.position[1], 250)
    if (window.location.pathname === '/s') {
      this.watchPosition()
    }
  }
  // stops requesting location when not in use
  public componentWillReceiveProps() {
    if (window.location.pathname === '/s') {
      this.watchPosition()
    } else {
      requestAnimationFrame(function() {
        navigator.geolocation.clearWatch(geoID)
      })
    }

  }
  public componentWillUnmount() {
    if (typeof(dataRequest) !== 'undefined') {
      dataRequest.abort()
    }
    requestAnimationFrame(function() {
      navigator.geolocation.clearWatch(geoID)
    })
    UiStore.unbind('goingBack', this.triggerBack)
  }
  private getData(lat, lng, dist) {
    dataRequest = request(`/a/station/search?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}&distance=${dist}`).then((data) => {
      this.setState({
        stops: data
      } as IAppState)
    })
  }
  private triggerChange(e) {
    this.setState({
      station: e.currentTarget.value
    } as IAppState)
  }
  private triggerKeyUp(e) {
    if (e.keyCode === 13) {
      this.triggerSearch(undefined)
    }
  }
  private triggerSearch(e) {
    if (e) {
      e.preventDefault()
    }
    browserHistory.push(`/s/${this.state.station}`)
  }
  public viewServices(station) {
    return function() {
      browserHistory.push(`/s/${station}`)
    }
  }
  public moveEnd(e) {
    var zoom = e.target.getZoom()
    // we're basing this off screensize
    var screensize = document.body.offsetWidth
    if (document.body.offsetHeight > screensize) {
      screensize = document.body.offsetHeight
    }
    var dist = Math.ceil(0.2 * screensize)
    if (zoom === 17) {
      dist = Math.ceil(0.35 * screensize)
    } else if (zoom === 16) {
      dist = Math.ceil(0.6 * screensize)
    } else if (zoom < 16) {
      this.setState({
        stops: []
      } as IAppState)
      return 
    }
    // max the api will handle is 1250
    if (dist > 1250) {
      dist = 1250
    }

    var newPos = e.target.getCenter()
    this.getData(newPos.lat, newPos.lng, dist)
  }
  public triggerBack() {
    this.setState({
      back: UiStore.getState().goingBack
    } as IAppState)
  }
  public render() {

    // this is the public key for now
    let retina = ''
    if (window.devicePixelRatio > 1) {
      retina = '@2x'
    }
    var classname = 'searchContainer'
    if (window.location.pathname === '/s') {
      classname += ' activepane'
    }
    if (this.state.back) {
      classname += ' goingback'
    }  

    var positionMap = {}

    return (
       <div className={classname}>
        <div className="search">
          <button className="routeButton">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </button>
          <button className="currentLocationButton" onTouchTap={this.currentLocateButton}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
          </button>
          <Map
            ref="map"
            onMoveend={this.moveEnd}
            center={this.state.position} 
            zoom={18}
            zoomControl={false}
            className="map">
            <ZoomControl position="bottomleft" />
            <TileLayer
              url={'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}' + retina + token}
              attribution='© <a href="https://www.mapbox.com/about/maps/"">Mapbox</a> | © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {this.state.stops.map((stop) => {
              var icon = StationStore.getIcon(stop.stop_id)
              var markericon = busIcon
              if (icon === 'train') {
                markericon = trainIcon
              } else if (icon === 'ferry') {
                markericon = ferryIcon
              }              

              // jono's awesome collison detection
              // basically checks if something is already there
              var lng = stop.stop_lng
              if(typeof(positionMap[stop.stop_lat]) === 'undefined') {
                positionMap[stop.stop_lat] = [lng]
              } else {
                if (positionMap[stop.stop_lat].indexOf(lng) !== -1) {
                  lng = lng + 0.0002
                } else {
                  positionMap[stop.stop_lat].push(lng)
                }
              }

              return (
                <Marker icon={markericon} key={stop.stop_id} position={[stop.stop_lat, lng]}>
                  <Popup>
                    <span>
                      <img src={`/icons/${icon}.svg`} />
                      <h2>{stop.stop_name}</h2>
                      <h3>Stop {stop.stop_id}</h3>
                      <button onClick={this.viewServices(stop.stop_id)}>View Services</button>
                    </span>
                  </Popup>
                </Marker>
               )
            })}
            <Circle className="bigCurrentLocationCircle" center={this.state.currentPosition} radius={(this.state.accuracy)}/> 
            <CircleMarker className="smallCurrentLocationCircle" center={this.state.currentPosition} radius={7} /> 
          </Map>
        </div>
        {this.props.children}
        <SearchSwitch />
      </div>
    )
  }
}
export default Search