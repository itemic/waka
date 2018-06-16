import React from 'react'
import PropTypes from 'prop-types'
import { withRouter, Route } from 'react-router-dom'
import { Switch } from './shell/switch.jsx'

import Settings from './settings.jsx'
import TestLines from './test_lines.jsx'
import Timetable from './timetable.jsx'
import VehicleLocationBootstrap from './vehicle_loc_bootstrap.jsx'

class RouterRender extends React.Component {
  static propTypes = {
    location: PropTypes.object,
  }
  render() {
    return (
      <Switch
        location={this.props.location}
        key={this.props.location.key}
        timeout={0}
      >
        <Route path="/" exact />

        <Route
          path="/s/:region/:station/realtime/:trip_id"
          component={VehicleLocationBootstrap}
        />
        <Route
          path="/s/:region/:station/timetable/:route_name"
          component={Timetable}
        />

        <Route
          path="/l/:region/:line_id"
          component={VehicleLocationBootstrap}
        />

        <Route path="/settings" component={Settings} />
        <Route path="/testlines" component={TestLines} />
      </Switch>
    )
  }
}
const RouterRenderWithRouter = withRouter(RouterRender)
export default RouterRenderWithRouter
