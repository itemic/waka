import * as React from 'react'
import { Link, browserHistory } from 'react-router'
import SearchSwitch from './searchswitch.jsx'

class Lines extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      service: '',
      allLines: undefined
    }
    this.triggerChange = this.triggerChange.bind(this)
  }
  
  viewLine(line){
    return function() {
      browserHistory.push(`/l/${line}`)
    }
  }

  triggerChange(e) {
    this.setState({
      service: e.currentTarget.value
    })
  }

  componentDidMount() {
    fetch('/a/lines').then((response)=>{
      response.json().then((data) => {
        this.setState({
          allLines: data
        })       
      })
    })
  }

  render() {
    let ret
    // there needs to be a sorting function in here probably
    if (this.props.children === null) {
      ret = []
      for (var key in this.state.allLines) {
        var el = this.state.allLines[key]
        if (el[0].length === 1) {
          ret.push(<div key={key}><Link to={'/l/'+key}><strong>{key}</strong> {el[0][0]}</Link></div>)
        } else {
          ret.push(<div key={key}><Link to={'/l/'+key}><strong>{key}</strong> {el[0][0]} to {el[0][1]}</Link></div>)
        }
        
      }
    } else {
      ret = this.props.children
    }
    return(
      <div>
        <input value={this.state.service} type="text" placeholder="Enter Service Name" onChange={this.triggerChange} /><br/>
        <button onClick={this.viewLine(this.state.service)}>View Line</button>
        Your line: 
        {ret}
        <SearchSwitch />
      </div>
    )
  }
}

export default Lines